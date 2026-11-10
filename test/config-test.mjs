import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync('/Users/user/.dsh/local-plugins/sone-wx/client.js', 'utf8');
const a = src.indexOf('\t\t\t\t\tapplyPreset: (id) => {');
const b = src.indexOf('uploadUserAvatar: (dataUrl) => {');
if (a < 0 || b < 0) throw new Error('api block not found');
const apiText = src.slice(a, b);
const KEY = {
  FONT_LEVEL_KEY: 'dsh-wechat-skin:font-level', TEXT_FONT_LEVEL_KEY: 'dsh-wechat-skin:text-font-level', DENSITY_KEY: 'dsh-wechat-skin:density',
  USER_AVATAR_ENABLED_KEY: 'dsh-wechat-skin:user-avatar:enabled', CHAT_WIDTH_KEY: 'dsh-wechat-skin:chat-width',
  SIDEBAR_BG_KEY: 'dsh-wechat-skin:sidebar-bg', SIDEBAR_ORDER_KEY: 'dsh-wechat-skin:sidebar-order',
  USER_AVATAR_KEY: 'dsh-wechat-skin:user-avatar', AI_AVATAR_KEY: 'dsh-wechat-skin:ai-avatar',
  AI_AVATAR_ENABLED_KEY: 'dsh-wechat-skin:ai-avatar:enabled', AI_AVATAR_SHOW_KEY_LEGACY: 'dsh-wechat-skin:ai-avatar-visible',
  PRESET_KEY: 'dsh-wechat-skin:preset',
  LINE_HEIGHT_KEY: 'dsh-wechat-skin:line-height', MOTION_KEY: 'dsh-wechat-skin:reduced-motion',
  FONT_FAMILY_KEY: 'dsh-wechat-skin:font-family', CONTRAST_KEY: 'dsh-wechat-skin:contrast',
  AVATAR_SHAPE_KEY: 'dsh-wechat-skin:avatar-shape',
  AVATAR_STYLE_KEY: 'dsh-wechat-skin:avatar-style',
  CUSTOM_PRESETS_KEY: 'dsh-wechat-skin:presets',
  COMPOSER_H_KEY: 'dsh-wechat-skin:composer-height'
};
const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
let sidebarBg = null, fontLevel = 3, density = 'cozy', userAvatarVisible = true, chatWidth = 'wide', sidebarOrder = [];
let fontFamily = 'system', contrast = 'normal', avatarShape = 'rounded';
let textFontLevel = 3;
const calls = [];
const sandbox = {
  window: { localStorage, dispatchEvent: (e) => calls.push(['event', e.type]), localStorageSet: null },
  localStorage,
  console,
  Promise, Blob, Uint8Array, Date, JSON, Object, Error, Number, String, Array, Boolean, Math,
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  FileReader: class { readAsDataURL(blob) { this.result = 'data:image/png;base64,' + Buffer.from(blob.__bytes || 'x').toString('base64'); setTimeout(() => this.onload && this.onload(), 0); } },
  CustomEvent: class { constructor(type) { this.type = type; } },
  THEME_PRESETS: [
    { id: 'wechat', fontLevel: 3, density: 'cozy', chatWidth: 'wide', sidebarBg: null },
    { id: 'compact', fontLevel: 2, density: 'compact', chatWidth: 'medium', sidebarBg: null },
    { id: 'paper', fontLevel: 3, density: 'cozy', chatWidth: 'medium', sidebarBg: '#f7f3ec' }
  ],
  CONFIG_SKIN_KEYS: Object.values(KEY),
  ...KEY,
  normalizeHexColor: (v) => {
    if (typeof v !== 'string') return null;
    const t = v.trim();
    if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(t)) return ('#' + t[1] + t[1] + t[2] + t[2] + t[3] + t[3]).toLowerCase();
    return null;
  },
  writeJson: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  readJson: (k, d) => { const raw = localStorage.getItem(k); if (raw === null) return d; try { return JSON.parse(raw); } catch (e) { return d; } },
  applyFontLevel: (v) => { calls.push(['font', v]); },
  applyTextFontLevel: (v) => { calls.push(['textFont', v]); },
  applyDensity: (v) => { calls.push(['density', v]); },
  applyUserAvatar: (v) => { calls.push(['userAvatarVisible', v]); },
  applyChatWidth: (v) => { calls.push(['width', v]); },
  applySidebarBg: () => { calls.push(['sidebarBg', sidebarBg]); },
  applyAiAvatar: (v) => { calls.push(['aiAvatarVisible', v]); },
  applyPresetTheme: (v) => { calls.push(['preset', v]); },
  applyLineHeight: (v) => { calls.push(['lineHeight', v]); },
  applyReducedMotion: (v) => { calls.push(['motion', v]); },
  applyFontFamily: (v) => { calls.push(['fontFamily', v]); },
  applyContrast: (v) => { calls.push(['contrast', v]); },
  applyAvatarShape: (v) => { calls.push(['avatarShape', v]); },
  applyAvatarStyle: (v) => { calls.push(['avatarStyle', v]); },
  readCustomPresets: () => { const raw = localStorage.getItem('dsh-wechat-skin:presets'); try { const v = raw === null ? [] : JSON.parse(raw); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
  aiAvatar: true,
  applyPanelOrder: () => { calls.push(['order', sidebarOrder.join(',')]); },
  normalizePanelOrder: (v) => (Array.isArray(v) ? v : []),
  setUserAvatar: (v) => calls.push(['userAvatar', !!v]),
  setAiAvatar: (v) => calls.push(['aiAvatar', !!v]),
  sync: () => calls.push(['sync']),
  get fontLevel() { return fontLevel; }, set fontLevel(v) { fontLevel = v; },
  get density() { return density; }, set density(v) { density = v; },
  get userAvatarVisible() { return userAvatarVisible; }, set userAvatarVisible(v) { userAvatarVisible = v; },
  get chatWidth() { return chatWidth; }, set chatWidth(v) { chatWidth = v; },
  get sidebarBg() { return sidebarBg; }, set sidebarBg(v) { sidebarBg = v; },
  get sidebarOrder() { return sidebarOrder; }, set sidebarOrder(v) { sidebarOrder = v; },
  get textFontLevel() { return textFontLevel; }, set textFontLevel(v) { textFontLevel = v; },
  get fontFamily() { return fontFamily; }, set fontFamily(v) { fontFamily = v; },
  get contrast() { return contrast; }, set contrast(v) { contrast = v; },
  get avatarShape() { return avatarShape; }, set avatarShape(v) { avatarShape = v; }
};
// fetch mock
const brandState = { title: 'SONE', wordmarkImage: true, heroMark: false, mark: { set: true }, wordmark: null };
sandbox.FONT_FAMILY_VALUES = ['system', 'wechat', 'wenkai', 'kai', 'round'];
sandbox.fetch = (url, init) => {
  calls.push(['fetch', init && init.method ? init.method : 'GET', url]);
  if (url === '/sone-wx/brand' && (!init || !init.method)) {
    return Promise.resolve({ json: () => Promise.resolve(brandState) });
  }
  if (url.startsWith('/sone-wx/brand/')) {
    return Promise.resolve({ blob: () => Promise.resolve({ __bytes: 'img:' + url }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
};
const code = `($${'{'}${apiText}$${'}'})`; // object literal
const api = vm.runInNewContext('({' + apiText + '})', sandbox);
const c = src.indexOf('setLineHeight: (value) => {');
const e = src.indexOf('listPresets: () => readCustomPresets(),') + 'listPresets: () => readCustomPresets(),'.length;
if (c < 0 || e < c) throw new Error('preset api block not found');
const api2 = vm.runInNewContext('({' + src.slice(c, e) + '})', sandbox);

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; } else { fail++; console.log('FAIL', name); } };

// applyPreset paper
api.applyPreset('paper');
ok(fontLevel === 3 && density === 'cozy' && chatWidth === 'medium', 'preset values');
ok(localStorage.getItem(KEY.USER_AVATAR_ENABLED_KEY) === null, 'preset does not touch avatar visibility');
ok(sidebarBg === '#f7f3ec' && localStorage.getItem(KEY.SIDEBAR_BG_KEY) === '"#f7f3ec"', 'preset sidebar bg');
// applyPreset compact resets sidebar to null
api.applyPreset('compact');
ok(fontLevel === 2 && chatWidth === 'medium', 'compact values');
ok(sidebarBg === null && localStorage.getItem(KEY.SIDEBAR_BG_KEY) === null, 'compact clears sidebar');
api.applyPreset('nope');
ok(fontLevel === 2, 'unknown preset ignored');

// seed storage for export
localStorage.setItem(KEY.USER_AVATAR_KEY, JSON.stringify('data:image/png;base64,AAA'));
localStorage.setItem('dsh-wechat-skin:unrelated', 'x');
const before = calls.length;
const payloadP = api.exportConfig();
ok(payloadP && typeof payloadP.then === 'function', 'export returns promise');
const payload = await payloadP;
ok(payload.app === 'sone-wx' && payload.version === 1, 'export envelope');
ok(payload.skin[KEY.DENSITY_KEY] === '"compact"', 'export includes density json');
ok(payload.skin[KEY.USER_AVATAR_KEY] === JSON.stringify('data:image/png;base64,AAA'), 'export includes avatar');
ok(!('dsh-wechat-skin:unrelated' in payload.skin), 'export excludes unknown keys');
ok(payload.brand && payload.brand.title === 'SONE' && payload.brand.wordmarkImage === true && payload.brand.heroMark === false, 'export brand');
ok(Object.keys(payload.images).length === 1 && String(payload.images.mark).startsWith('data:image/png'), 'export mark image');

// import: change values + unknown removal + brand post
localStorage.setItem(KEY.FONT_LEVEL_KEY, JSON.stringify(5));
localStorage.setItem(KEY.SIDEBAR_BG_KEY, JSON.stringify('#123456'));
calls.length = 0;
const imp = JSON.parse(JSON.stringify(payload));
imp.skin[KEY.FONT_LEVEL_KEY] = JSON.stringify(1);
imp.skin[KEY.SIDEBAR_BG_KEY] = JSON.stringify('#abcdef');
imp.skin[KEY.FONT_FAMILY_KEY] = JSON.stringify('serif');
imp.skin[KEY.TEXT_FONT_LEVEL_KEY] = JSON.stringify(5);
imp.skin[KEY.CONTRAST_KEY] = JSON.stringify('high');
imp.skin[KEY.AVATAR_SHAPE_KEY] = JSON.stringify('circle');
imp.skin[KEY.AVATAR_STYLE_KEY] = JSON.stringify('initial');
delete imp.skin[KEY.USER_AVATAR_ENABLED_KEY];
imp.brand = { title: 'NEW', wordmarkImage: false, heroMark: true };
await api.importConfig(imp);
ok(fontLevel === 1, 'import applies font');
ok(sidebarBg === '#abcdef', 'import applies sidebar');
ok(localStorage.getItem(KEY.USER_AVATAR_ENABLED_KEY) === null, 'import keeps absent keys (no clobber)');
ok(calls.some((c) => c[0] === 'fetch' && c[1] === 'POST' && c[2] === '/sone-wx/brand'), 'import posts brand');
ok(calls.some((c) => c[0] === 'event' && c[1] === 'sone-wx:brand-reload'), 'import dispatches reload');
ok(calls.some((c) => c[0] === 'userAvatar' && c[1] === true), 'import restores user avatar');
ok(fontFamily === 'wenkai' && contrast === 'high' && avatarShape === 'circle', 'import applies new settings (legacy serif migrates to wenkai)');
ok(textFontLevel === 5, 'import applies text font level');
ok(localStorage.getItem(KEY.FONT_FAMILY_KEY) === JSON.stringify('wenkai'), 'import persists the canonical font family (serif -> wenkai)');
await api.importConfig(null).then(() => ok(false, 'null should reject')).catch(() => ok(true, 'null rejects'));

// custom presets
const saved = api2.savePreset('我的预设 1');
ok(saved && saved.id.indexOf('custom-') === 0 && saved.name === '我的预设 1', 'savePreset returns record');
ok(api2.listPresets().length === 1 && api2.listPresets()[0].id === saved.id, 'listPresets reads back');
const beforeFont = fontLevel;
api.applyPreset(saved.id);
ok(localStorage.getItem(KEY.PRESET_KEY) === JSON.stringify(saved.id), 'custom preset id persisted');
ok(fontLevel === beforeFont, 'custom preset reapplies current look');
api2.deletePreset(saved.id);
ok(api2.listPresets().length === 0, 'deletePreset removes');
api2.setLineHeight('relaxed');
ok(localStorage.getItem(KEY.LINE_HEIGHT_KEY) === '"relaxed"', 'line height persisted');
api2.setReduceMotion(true);
ok(localStorage.getItem(KEY.MOTION_KEY) === 'true', 'reduce motion persisted');

console.log(`config-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
