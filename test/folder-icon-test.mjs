// The project folder glyph is redrawn as a mask on the wrapper. Guard the mask,
// the hidden host svg, the 16px box and the active-project tint.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
const i = src.indexOf('const WECHAT_CSS = `'); const j = src.indexOf('`;', i);
const css = src.slice(i + 'const WECHAT_CSS = `'.length, j);
const rule = (sel) => { const at = css.lastIndexOf(sel + ' {'); return at < 0 ? '' : css.slice(at, css.indexOf('}', at)); };
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };
const box = rule('body.dsh-wechat-skin-on .JoiKIa_folder');
ok(/width:\s*16px/.test(box) && /height:\s*16px/.test(box), 'folder box is 16px');
ok(/color:\s*var\(--dsw-alias-label-tertiary/.test(box), 'resting folder uses tertiary ink');
const active = rule('body.dsh-wechat-skin-on .JoiKIa_folder.JoiKIa_folderActive');
ok(/state-business-primary/.test(active), 'active project keeps the green tint');
ok(/\.JoiKIa_folder > svg \{ display: none; \}/.test(css), 'host glyph is hidden');
const before = rule('body.dsh-wechat-skin-on .JoiKIa_folder::before');
ok(/-webkit-mask:\s*url\("data:image\/svg\+xml/.test(before), 'wrapper paints the mask');
ok(/mask:\s*url\("data:image\/svg\+xml/.test(before), 'standard mask property is present');
ok(/background-color:\s*currentColor/.test(before), 'glyph follows currentColor');
ok(/stroke-width='1\.2'/.test(before), 'outline is 1.2px');
console.log(`folder-icon-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
