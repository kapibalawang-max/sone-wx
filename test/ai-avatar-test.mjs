import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const row=`<div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step"><div data-slot="conversation.chat.node"><p>回复内容</p></div></div>`;
const html=(attr)=>`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/sone-css.css"><style>body{margin:0;padding:20px;font:13px/1.6 -apple-system}</style></head><body class="dsh-wechat-skin-on" data-dsh-wechat-ai-avatar="${attr}">${row}<script>const el=document.querySelector('.tnXGgG_flowItem');const cs=getComputedStyle(el);const pb=getComputedStyle(el,'::before');document.title=JSON.stringify({marginLeft:cs.marginLeft,content:pb.content,width:pb.width,display:pb.display});</script></body></html>`;
for(const attr of ['1','0']){
  const f=`/tmp/ai-avatar-${attr}.html`;writeFileSync(f,html(attr));
  const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom',`file://${f}`],{encoding:'utf8'});
  console.log(attr, out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"'));
}
