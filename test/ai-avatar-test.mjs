import { writeFileSync } from 'node:fs';
import { chromium } from './browser.mjs';
const row=`<div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step"><div data-slot="conversation.chat.node"><p>回复内容</p></div></div>`;
const html=(attr)=>`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:13px/1.6 -apple-system}</style></head><body class="dsh-wechat-skin-on" data-dsh-wechat-ai-avatar="${attr}">${row}<script>const el=document.querySelector('.tnXGgG_flowItem');const cs=getComputedStyle(el);const pb=getComputedStyle(el,'::before');document.title=JSON.stringify({marginLeft:cs.marginLeft,content:pb.content,width:pb.width,display:pb.display});</script></body></html>`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:800,height:600}});
const fails=[];const seen={};
for(const attr of ['1','0']){
  const f=`/tmp/ai-avatar-${attr}.html`;writeFileSync(f,html(attr));
  await page.goto(`file://${f}`);
  seen[attr]=JSON.parse(await page.evaluate(()=>document.title));
}
await browser.close();
const on=seen['1'],off=seen['0'];
if(on.marginLeft!=='42px')fails.push('显示时助手行未留头像位: '+on.marginLeft);
if(on.content==='none')fails.push('显示时没有头像伪元素');
if(on.width!=='34px')fails.push('头像宽度不是 34px: '+on.width);
if(off.marginLeft!=='0px')fails.push('隐藏时仍留边距: '+off.marginLeft);
if(off.content!=='none')fails.push('隐藏时头像仍在: '+off.content);
if(fails.length){console.error('ai-avatar-test FAILED\n  '+fails.join('\n  '));process.exit(1);}
console.log('ai-avatar-test OK（5 项）');
