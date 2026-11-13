// My-avatar toggle: browser-level computed-style assertions on the real CSS.
import { writeFileSync } from 'node:fs';
import { chromium } from './browser.mjs';
const row = `<div class="tnXGgG_flowItem" data-chat-flow-kind="user"><div class="AkCqbG_userRow"><p>我发的消息</p></div></div>
<div class="tnXGgG_column"><div class="_bubble_x"><p>气泡内容</p></div></div>`;
const bubbleClone = (a) => a;
const html = (attr) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:13px/1.6 -apple-system}</style></head><body class="dsh-wechat-skin-on" data-dsh-wechat-user-avatar="${attr}">${row}<script>
const item=document.querySelector('.tnXGgG_flowItem');
const after=getComputedStyle(item,'::after');
const rowEl=getComputedStyle(document.querySelector('.AkCqbG_userRow'));
const bubble=getComputedStyle(document.querySelector('._bubble_x'),'::before');document.title=JSON.stringify({afterContent:after.content,afterWidth:after.width,marginRight:rowEl.marginRight,radius:after.borderRadius,bubbleBefore:bubble.content,bubbleBorder:bubble.borderWidth});
</script></body></html>`;
let pass=0,fail=0;
const ok=(c,n)=>{ if(c){pass++;} else {fail++; console.log('FAIL',n);} };
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:800,height:600}});
const read=async(attr)=>{
  const f=`/tmp/user-avatar-${attr}.html`; writeFileSync(f,html(attr));
  await page.goto(`file://${f}`);
  return JSON.parse(await page.evaluate(()=>document.title));
};
const on=await read('1'), off=await read('0');
await browser.close();
ok(on.afterContent!=='none','avatar shown when enabled (::after present)');
ok(on.afterWidth==='34px','avatar is 34px wide');
ok(on.radius==='6px','avatar uses 6px radius');
ok(on.marginRight==='42px','bubble keeps the 42px avatar band');
ok(off.afterContent==='none','avatar hidden when disabled');
ok(off.marginRight==='0px','bubble sits flush right when avatar hidden');
ok(off.bubbleBefore==='none','no bubble tail triangle (::before removed)');
ok(on.bubbleBefore==='none','no bubble tail triangle when avatar shown');
console.log(`user-avatar-test ${pass}/${pass+fail}`);
process.exit(fail?1:0);
