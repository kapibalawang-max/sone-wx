// The sidebar's New Session entry should read like a plugin title row: flat,
// left aligned, 13px/500 label, tint only on hover. The icon-only rail keeps
// its centred 36px square, so the left alignment must not leak into it.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/user/.dsh/profiles/desktop/node_modules/');
const { chromium } = require('playwright');
const src = fs.readFileSync('/Users/user/.dsh/local-plugins/sone-wx/client.js', 'utf8');
const i = src.indexOf('const WECHAT_CSS = `'); const j = src.indexOf('`;', i);
const css = src.slice(i + 'const WECHAT_CSS = `'.length, j).replace(/\\`/g, '`').replace(/\\\$/g, '$');

// Baseline rules copied from the sidebar bundle (kB3qhq_newSession family).
const host = `
.kB3qhq_newSession{height:38px;margin:0 10px 10px;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);cursor:pointer;flex:none;display:flex;justify-content:center;align-items:center;gap:0;padding:8px;font:inherit;width:100%}
.kB3qhq_newSession:hover{background:var(--dsw-alias-button-floating-hover)}
.kB3qhq_newSessionContent{justify-content:center;align-items:center;gap:6px;width:100%;display:flex}
.kB3qhq_newSessionLabel{white-space:nowrap;max-width:200px;overflow:hidden}
.kB3qhq_newSessionLabelMask{flex:1;min-width:0}
`;
const page = (wide) => `<!doctype html><style>
:root{--dsw-alias-border-l3:#d0d0d4;--dsw-alias-button-elevated-fill:#fff;--dsw-alias-button-floating-hover:#f2f2f3;--dsw-alias-label-primary:#1b1b1c;--dsw-alias-interactive-bg-hover:rgba(0,0,0,.06);--dsw-radius-md:8px}
body{margin:0;width:280px;font:13px/1.5 -apple-system,'PingFang SC'}
${host}
${css}
</style><body class="dsh-wechat-skin-on">
<button class="kB3qhq_newSession"><span class="kB3qhq_newSessionLabelMask"><span class="kB3qhq_newSessionContent">
<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#ddd"/></svg>
${wide ? '<span class="kB3qhq_newSessionLabel">新会话</span>' : ''}
</span></span></button></body>`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
await p.setContent(page(true));
const wide = await p.evaluate(() => {
  const el = document.querySelector('.kB3qhq_newSession');
  const c = getComputedStyle(el);
  const content = getComputedStyle(document.querySelector('.kB3qhq_newSessionContent'));
  const label = getComputedStyle(document.querySelector('.kB3qhq_newSessionLabel'));
  return { h: c.height, border: c.borderTopWidth, bg: c.backgroundColor, radius: c.borderRadius,
    justify: c.justifyContent, contentJustify: content.justifyContent, gap: content.gap,
    fontSize: content.fontSize, weight: content.fontWeight, labelSize: label.fontSize };
});
await p.setContent(page(false));
const rail = await p.evaluate(() => {
  const c = getComputedStyle(document.querySelector('.kB3qhq_newSession'));
  const content = getComputedStyle(document.querySelector('.kB3qhq_newSessionContent'));
  return { justify: c.justifyContent, contentJustify: content.justifyContent, bg: c.backgroundColor };
});
await b.close();
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
ok(wide.h === '32px', 'same height as a plugin row');
ok(wide.border === '0px', 'no button border');
ok(wide.bg === 'rgba(0, 0, 0, 0)', 'flat surface at rest');
ok(wide.justify === 'flex-start', 'icon and label sit left');
ok(wide.contentJustify === 'flex-start', 'content block is left aligned');
ok(wide.fontSize === '13px', 'label uses 13px');
ok(wide.weight === '500', 'label uses weight 500');
ok(wide.labelSize === '13px', 'label inherits the row size');
ok(wide.gap === '8px', 'icon and label keep an 8px gap');
ok(rail.justify === 'center' && rail.contentJustify === 'center', 'rail stays centred');
ok(rail.bg === 'rgba(0, 0, 0, 0)', 'rail stays flat');
console.log(`new-session-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
