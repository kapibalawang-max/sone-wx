// GenUI's own table component must not inherit the markdown-table styling.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css">
<style>
.V1MMBW_tableWrap{border-radius:8px;border:1px solid #e0e0e0;overflow-x:auto;max-width:100%}
.V1MMBW_table{border-collapse:collapse;width:max-content;min-width:100%;font-size:13px}
.V1MMBW_table th{text-align:left;padding:9px 12px;font-weight:700;border-bottom:1px solid #d8d8d8;background:#f7f7f7}
.V1MMBW_table td{padding:10px 12px;border-bottom:1px solid #e8e8e8}
</style></head><body class="dsh-wechat-skin-on dsh-wechat-match">
<div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step"><div class="V1MMBW_tableWrap"><table class="V1MMBW_table"><thead><tr><th>城市</th><th>门店</th></tr></thead><tbody><tr><td>示例县</td><td>692</td></tr></tbody></table></div></div>
<script>
const w=document.querySelector('.V1MMBW_tableWrap'), t=w.querySelector('table');
const th=w.querySelector('th'), td=w.querySelector('td');
const cs=getComputedStyle(t), hs=getComputedStyle(th), ds=getComputedStyle(td), ws=getComputedStyle(w);
document.title=JSON.stringify({tableBorder:cs.borderTopWidth,tableMargin:cs.marginTop,tableRadius:cs.borderTopLeftRadius,
 thPadTop:hs.paddingTop,thPadLeft:hs.paddingLeft,tdPadLeft:ds.paddingLeft,wrapBorder:ws.borderTopWidth});
</script></body></html>`;
const f='/tmp/genui-table-test.html'; writeFileSync(f,html);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom',`file://${f}`],{encoding:'utf8'});
const r=JSON.parse(out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"'));
let pass=0,fail=0; const ok=(c,n)=>{ c?pass++:(fail++,console.log('FAIL',n,JSON.stringify(r))); };
ok(r.tableBorder==='0px','genui table gets no extra border');
ok(r.tableMargin==='0px','genui table keeps zero margin');
ok(r.tableRadius==='0px','genui table keeps square corners');
ok(r.thPadTop==='9px','genui header keeps its own padding');
ok(r.thPadLeft==='12px','genui header keeps its own side padding');
ok(r.tdPadLeft==='12px','genui cell keeps its own side padding');
ok(r.wrapBorder==='1px','genui wrapper frame untouched');
console.log(`genui-table-test ${pass}/${pass+fail}`);
process.exit(fail?1:0);
