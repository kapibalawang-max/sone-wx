// Hover must not change the table wrapper's height: the host reserves scrollbar
// space via padding-bottom and swaps it for a real scrollbar on hover; the skin
// keeps overflow at auto, so the reserve has to stay off in both states.
import fs from 'node:fs';
import { chromium } from './browser.mjs'
// fixtures.mjs already closes the host stylesheet's unterminated last rule.
const host = fs.readFileSync('/tmp/app.css', 'utf8');
const skin = fs.readFileSync('/tmp/sone-css.css', 'utf8');
const cells = Array.from({ length: 6 }, (_, i) => `<th>列 ${i + 1}</th>`).join('');
const row = Array.from({ length: 6 }, (_, i) => `<td>很长的单元格内容 ${i}</td>`).join('');
const html = `<!doctype html><html><head><style>${host}\n${skin}</style></head>
<body class="dsh-wechat-skin-on" style="margin:0;padding:20px;width:520px">
<div data-chat-flow-kind="assistant-step"><div class="_markdown_rve47_5">
<div id="w" class="_tableScroll_rve47_199 md-table-wide"><table id="t"><thead><tr>${cells}</tr></thead>
<tbody>${`<tr>${row}</tr>`.repeat(4)}</tbody></table></div></div></div></body></html>`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 620, height: 600 } });
await p.setContent(html);
await p.waitForTimeout(120);
const before = await p.evaluate(() => {
  const w = document.getElementById('w');
  const cs = getComputedStyle(w);
  return { h: w.offsetHeight, pad: cs.paddingBottom, ox: cs.overflowX };
});
await p.hover('#w');
await p.waitForTimeout(250);
const after = await p.evaluate(() => {
  const w = document.getElementById('w');
  const cs = getComputedStyle(w);
  return { h: w.offsetHeight, pad: cs.paddingBottom, ox: cs.overflowX };
});
await b.close();
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n, JSON.stringify({ before, after })); } };
ok(before.pad === '0px', 'no reserved scrollbar padding at rest');
ok(after.pad === '0px', 'still no padding on hover');
ok(after.h === before.h, 'wrapper height is identical on hover');
ok(before.ox === after.ox, 'overflow axis does not switch on hover');
console.log(`table-stability-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
