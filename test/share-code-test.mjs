import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import nodevm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const start = src.indexOf('const SHARE_CODE_PREFIX');
const end = src.indexOf('function WechatSkinRow');
assert.ok(start > 0 && end > start, 'share-code region must exist before WechatSkinRow');
const region = src.slice(start, end);

// The region references the storage-key constants; pull their real declarations
// out of client.js instead of hardcoding the names here.
const keyNames = ['FONT_LEVEL_KEY', 'TEXT_FONT_LEVEL_KEY', 'DENSITY_KEY', 'CHAT_WIDTH_KEY', 'SIDEBAR_BG_KEY', 'PRESET_KEY', 'LINE_HEIGHT_KEY', 'MOTION_KEY', 'FONT_FAMILY_KEY', 'CONTRAST_KEY', 'AVATAR_SHAPE_KEY', 'AVATAR_STYLE_KEY', 'COMPOSER_FX_KEY', 'RIGHTBAR_AUTO_KEY', 'ISLANDS_KEY', 'USER_AVATAR_ENABLED_KEY', 'AI_AVATAR_ENABLED_KEY', 'CUSTOM_PRESETS_KEY'];
let consts = '';
for (const name of keyNames) {
  const m = src.match(new RegExp('const ' + name + ' = "[^"]+";'));
  assert.ok(m, 'storage key constant must exist: ' + name);
  consts += m[0] + '\n';
}

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
const sandbox = {
  window: { localStorage },
  TextEncoder, TextDecoder, btoa, atob
};
const api = nodevm.runInNewContext(consts + '\n' + region + '\n({ SHARE_CODE_PREFIX, SHARE_CODE_KEYS, encodeSkinShare, decodeSkinShare });', sandbox);
const { encodeSkinShare, decodeSkinShare, SHARE_CODE_PREFIX } = api;

const K = {
  font: 'dsh-wechat-skin:font-level',
  density: 'dsh-wechat-skin:density',
  userAvatar: 'dsh-wechat-skin:user-avatar',
  aiAvatar: 'dsh-wechat-skin:ai-avatar',
  order: 'dsh-wechat-skin:sidebar-order',
  presets: 'dsh-wechat-skin:presets'
};

let n = 0;
const check = (name, fn) => { n++; fn(); console.log('  ok ' + name); };

check('prefix is SWX1.', () => assert.equal(SHARE_CODE_PREFIX, 'SWX1.'));

check('encode returns a prefixed url-safe code', () => {
  store.clear();
  localStorage.setItem(K.font, JSON.stringify(4));
  const code = encodeSkinShare();
  assert.ok(code.startsWith('SWX1.'));
  assert.ok(!/[+/=]/.test(code.slice(5)), 'must be url-safe base64');
});

check('roundtrip keeps values', () => {
  store.clear();
  localStorage.setItem(K.font, JSON.stringify(4));
  localStorage.setItem(K.density, JSON.stringify('compact'));
  const skin = decodeSkinShare(encodeSkinShare());
  assert.equal(skin[K.font], JSON.stringify(4));
  assert.equal(skin[K.density], JSON.stringify('compact'));
});

check('excludes avatar images and sidebar order', () => {
  store.clear();
  localStorage.setItem(K.font, JSON.stringify(3));
  localStorage.setItem(K.userAvatar, JSON.stringify('data:image/png;base64,' + 'A'.repeat(100)));
  localStorage.setItem(K.aiAvatar, JSON.stringify('data:image/png;base64,' + 'B'.repeat(100)));
  localStorage.setItem(K.order, JSON.stringify(['session:1']));
  const skin = decodeSkinShare(encodeSkinShare());
  assert.ok(!(K.userAvatar in skin));
  assert.ok(!(K.aiAvatar in skin));
  assert.ok(!(K.order in skin));
  assert.ok(K.font in skin);
});

check('empty storage yields an empty skin', () => {
  store.clear();
  const skin = decodeSkinShare(encodeSkinShare());
  // vm objects live in another realm; compare structurally via JSON
  assert.equal(JSON.stringify(skin), '{}');
});

check('unicode survives the roundtrip', () => {
  store.clear();
  const custom = JSON.stringify([{ id: 'custom-1', name: '夜间', fontLevel: 2, density: 'compact', chatWidth: 'medium' }]);
  localStorage.setItem(K.presets, custom);
  const skin = decodeSkinShare(encodeSkinShare());
  assert.equal(skin[K.presets], custom);
});

check('rejects a bad prefix', () => {
  assert.throws(() => decodeSkinShare('NOPE.abc'), /invalid share code/);
});

check('rejects bad base64', () => {
  assert.throws(() => decodeSkinShare('SWX1.@@@'), /invalid share code/);
});

check('rejects bad json', () => {
  const bad = SHARE_CODE_PREFIX + Buffer.from('not json').toString('base64url');
  assert.throws(() => decodeSkinShare(bad), /invalid share code/);
});

check('rejects a wrong version', () => {
  const bad = SHARE_CODE_PREFIX + Buffer.from(JSON.stringify({ v: 2, s: {} })).toString('base64url');
  assert.throws(() => decodeSkinShare(bad), /invalid share code/);
});

check('rejects a non-object skin', () => {
  const bad = SHARE_CODE_PREFIX + Buffer.from(JSON.stringify({ v: 1, s: [1] })).toString('base64url');
  assert.throws(() => decodeSkinShare(bad), /invalid share code/);
});

check('drops unknown keys from forged codes', () => {
  const bad = SHARE_CODE_PREFIX + Buffer.from(JSON.stringify({ v: 1, s: { [K.userAvatar]: JSON.stringify('data:x'), [K.font]: JSON.stringify(2) } })).toString('base64url');
  const skin = decodeSkinShare(bad);
  assert.ok(!(K.userAvatar in skin));
  assert.equal(skin[K.font], JSON.stringify(2));
});

check('wiring: import bridges through importConfig', () => {
  assert.ok(src.includes('decodeSkinShare(shareImportText)'), 'runShareImport must decode the pasted code');
  assert.ok(src.includes('importConfig({ app: "sone-wx", version: 1, skin: skin })'), 'import must reuse importConfig');
  assert.ok(src.includes('if (!skin || !Object.keys(skin).length)'), 'empty codes must be rejected before import');
});

check('wiring: modal markup, copy fallback and Esc close exist', () => {
  assert.ok(src.includes('dsh-wc-modal-mask'));
  assert.ok(src.includes('dsh-wc-modal-code'));
  assert.ok(src.includes('execCommand("copy")'));
  assert.ok(src.includes('event.key === "Escape"'));
});

check('wiring: zh/en share keys present', () => {
  for (const key of ['"shareTitle"', '"shareDesc"', '"shareCopy"', '"shareCopied"', '"shareClose"', '"shareImportTitle"', '"shareImportBtn"', '"shareInvalid"']) {
    const count = src.split(key).length - 1;
    assert.ok(count >= 2, key + ' must exist in both zh and en');
  }
});

check('version matches package.json', () => {
  assert.ok(src.includes('const SKIN_VERSION = "' + pkg.version + '";'));
});

console.log('share-code: all checks passed (' + n + ' groups)');
