// My-avatar toggle: browser-level computed-style assertions on the real CSS.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const row = `<div class="tnXGgG_flowItem" data-chat-flow-kind="user"><div class="AkCqbG_userRow"><p>我发的消息</p></div></div>`;
const html = (attr) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:13px/1.6 -apple-system}</style></head><body class="dsh-wechat-skin-on" data-dsh-wechat-user-avatar="${attr}">${row}<script>
const item=document.querySelector('.tnXGgG_flowItem');
const after=getComputedStyle(item,'::after');
const rowEl=getComputedStyle(document.querySelector('.AkCqbG_userRow'));
document.title=JSON.stringify({afterContent:after.content,afterWidth:after.width,marginRight:rowEl.marginRight,radius:after.borderRadius});
</script></body></html>`;
let pass=0,fail=0;
const ok=(c,n)=>{ if(c){pass++;} else {fail++; console.log('FAIL',n);} };
const read=(attr)=>{
  const f=`/tmp/user-avatar-${attr}.html`; writeFileSync(f,html(attr));
  const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom',`file://${f}`],{encoding:'utf8'});
  return JSON.parse(out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"'));
};
const on=read('1'), off=read('0');
ok(on.afterContent!=='none','avatar shown when enabled (::after present)');
ok(on.afterWidth==='34px','avatar is 34px wide');
ok(on.radius==='6px','avatar uses 6px radius');
ok(on.marginRight==='42px','bubble keeps the 42px avatar band');
ok(off.afterContent==='none','avatar hidden when disabled');
ok(off.marginRight==='0px','bubble sits flush right when avatar hidden');
console.log(`user-avatar-test ${pass}/${pass+fail}`);
process.exit(fail?1:0);
