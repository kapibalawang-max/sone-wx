import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8');
const skin = src.match(/const WECHAT_CSS = `([\s\S]*?)`\s*;?\s*\n/);
const ui = src.match(/const WECHAT_UI_CSS = `([\s\S]*?)`\s*;?\s*\n/);
if (!skin || !ui) { console.error('WECHAT_CSS / WECHAT_UI_CSS not found'); process.exit(1); }
// 两份样式表都是皮肤产物，一起入库，UI 控件样式漂移也能被 diff 抓到。
const css = skin[1] + '\n/* ===== settings UI ===== */\n' + ui[1];
const snapPath = path.join(__dirname, 'wechat-css.snapshot.json');
const prev = fs.existsSync(snapPath) ? JSON.parse(fs.readFileSync(snapPath, 'utf8')) : null;
const data = { length: css.length, hash: Buffer.from(css).toString('base64').slice(0, 32), lines: css.split('\n').length };
if (process.argv.includes('--write') || !prev) {
  fs.writeFileSync(snapPath, JSON.stringify({ ...data, css }, null, 2) + '\n');
  console.log('snapshot written', data);
} else {
  const changed = prev.length !== data.length || prev.css !== css;
  if (changed) {
    console.error(`css-snapshot DIFF: ${prev.length} -> ${data.length} chars, ${prev.lines} -> ${data.lines} lines`);
    process.exit(2);
  }
  console.log(`css-snapshot OK（${data.length} chars / ${data.lines} lines）`);
}
