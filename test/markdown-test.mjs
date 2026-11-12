// Assistant markdown: type hierarchy, link/code chrome, quote rule, table rhythm.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const body = `<h1 id="h1">标题一</h1><h2 id="h2">标题二</h2><p id="p">正文 <a id="a" href="#">链接</a> <code id="code">x=1</code></p>
<ul><li id="li">条目 <strong>加粗</strong></li></ul>
<blockquote id="bq"><p>引用</p></blockquote>
<pre id="pre"><code>const a = 1;</code></pre>
<div class="_tableScroll_abc_1"><table><thead><tr><th id="th">列</th></tr></thead><tbody><tr><td>值</td></tr></tbody></table></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:15px/1.6 -apple-system}</style></head>
<body class="dsh-wechat-skin-on"><div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step"><div class="_markdown_rve47_5">${body}</div></div><script>
const g=id=>getComputedStyle(document.getElementById(id));
const h1=g('h1'),h2=g('h2'),p=g('p'),a=g('a'),code=g('code'),bq=g('bq'),pre=g('pre'),th=g('th');
document.title=JSON.stringify({
  h1:parseFloat(h1.fontSize), h2:parseFloat(h2.fontSize), p:parseFloat(p.fontSize),
  h1Weight:h1.fontWeight, h2Border:h2.borderBottomWidth,
  aDecoration:a.textDecorationLine, aColor:a.color,
  codeBg:code.backgroundColor, codeBorder:code.borderTopWidth,
  preBg:pre.backgroundColor, preRadius:pre.borderTopLeftRadius,
  bqBorder:bq.borderLeftWidth, bqBg:bq.backgroundColor,
  thSticky:th.position, thColor:th.color, thBg:th.backgroundColor
});
</script></body></html>`;
const f='/tmp/markdown-test.html'; writeFileSync(f,html);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom',`file://${f}`],{encoding:'utf8'});
const r=JSON.parse(out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"'));
let pass=0,fail=0; const ok=(c,n)=>{ if(c) pass++; else { fail++; console.log('FAIL',n,JSON.stringify(r)); } };
ok(r.h1>r.h2 && r.h2>r.p,'h1 > h2 > body');
ok(r.h2>=17,'h2 noticeably larger than body');
ok(r.h1Weight==='600','headings use one weight step');
ok(r.h2Border==='1px'||r.h2Border==='0.5px','h2 carries a hairline');
ok(r.aDecoration==='none','links are not underlined at rest');
ok(r.aColor==='rgb(10, 125, 67)','links use the brand ink');
ok(r.codeBg!=='rgba(0, 0, 0, 0)','inline code has a wash');
ok(r.codeBorder==='1px'||r.codeBorder==='0.5px','inline code is framed');
ok(r.preBg==='rgb(232, 232, 236)','code block uses the code surface (slate4, below the bubble)');
ok(r.preRadius==='10px','code block rounded');
ok(r.bqBorder==='1px'||r.bqBorder==='0.5px','quote uses a hairline rule');
ok(r.bqBg!=='rgba(0, 0, 0, 0)','quote has a quiet wash');
ok(r.thSticky==='sticky','table head sticks');
ok(r.thColor==='rgb(28, 32, 36)','header text uses primary ink');
ok(r.thBg==='rgb(232, 232, 236)','header band is neutral structure, not the accent');
ok(r.thBg!==r.aColor,'header never borrows the accent colour');
console.log(`markdown-test ${pass}/${pass+fail}`);
process.exit(fail?1:0);
