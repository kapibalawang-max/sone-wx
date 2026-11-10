// Markdown table frame: computed-style assertions on the real CSS.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const table = `<div class="_tableScroll_abc_1"><table><thead><tr><th>名称</th><th>数值</th></tr></thead><tbody><tr><td>甲</td><td>1</td></tr><tr><td>乙</td><td>2</td></tr></tbody></table></div>`;
const fill = `<div class="_tableFill_abc_9"><div class="_tableScroll_abc_1"><table><thead><tr><th>名称</th><th>数值</th></tr></thead><tbody><tr><td>甲</td><td>1</td></tr></tbody></table></div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:13px/1.6 -apple-system}th,td{padding-left:0;padding-right:0}</style></head><body class="dsh-wechat-skin-on"><div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step">${table}${fill}</div><script>
const w=document.querySelector('._tableScroll_abc_1'), t=w.querySelector('table');
const th=w.querySelector('th'), lastTd=w.querySelectorAll('td')[1];
const cs=getComputedStyle(w), ts=getComputedStyle(t), hs=getComputedStyle(th), ls=getComputedStyle(lastTd);
const lastRow=getComputedStyle(w.querySelectorAll('tbody tr')[1].querySelector('td'));
const fillWrap=getComputedStyle(document.querySelector('._tableFill_abc_9'));
document.title=JSON.stringify({
  wrapBorder:cs.borderTopWidth, wrapStyle:cs.borderTopStyle, wrapRadius:cs.borderTopLeftRadius,
  tableBorder:ts.borderTopWidth, collapse:ts.borderCollapse, tableRadius:ts.borderTopLeftRadius,
  thPadLeft:hs.paddingLeft, lastPadRight:ls.paddingRight, thBg:hs.backgroundColor,
  lastRowBottom:lastRow.borderBottomWidth, fillRadius:fillWrap.borderTopLeftRadius, fillOverflow:fillWrap.overflow
});
</script></body></html>`;
const f='/tmp/table-test.html'; writeFileSync(f,html);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom',`file://${f}`],{encoding:'utf8'});
const r=JSON.parse(out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"'));
let pass=0,fail=0; const ok=(c,n)=>{ if(c){pass++;} else {fail++; console.log('FAIL',n, JSON.stringify(r));} };
ok(r.wrapBorder==='0px','wrapper stays frameless');
ok(r.wrapStyle==='none','no wrapper frame style');
ok(r.wrapRadius==='0px','wrapper not rounded');
ok(r.tableBorder==='0.5px' || r.tableBorder==='1px','table carries the hairline frame');
ok(r.collapse==='separate','frame uses separated borders');
ok(r.thPadLeft==='12px','first cell padding is even');
ok(r.lastPadRight==='12px','last cell padding is even');
ok(r.thBg!=='rgba(0, 0, 0, 0)','header has a fill');
ok(r.lastRowBottom==='0px','last row drops its bottom border');
ok(r.tableRadius==='6px','table rounded to the frame');
console.log(`table-test ${pass}/${pass+fail}`);
process.exit(fail?1:0);
