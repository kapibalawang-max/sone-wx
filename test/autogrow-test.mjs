import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mk=(n)=>`<div class="JZLxKW_root"><div class="JZLxKW_dock"></div><div class="JZLxKW_card" data-composer-card><div class="JZLxKW_grow"><div class="JZLxKW_scroll"><div class="JZLxKW_input">${Array.from({length:n},(_,i)=>'草稿第 '+(i+1)+' 行内容').join('<br>')}</div></div></div><div class="JZLxKW_row"><div class="JZLxKW_tools"><button class="JZLxKW_add">+</button></div><div class="JZLxKW_trailing"><button class="JZLxKW_primary">x</button></div></div></div></div>`;
const html=`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/composer.css"><link rel="stylesheet" href="file:///tmp/sone-css.css">
<style>html,body{margin:0;background:#fff;--dsw-specific-input-major:#fff;--dsw-radius-panel:12px;--dsh-composer-card-max-width:560px;--dsh-composer-side-clearance:0px;--dsh-composer-text-max-height:336px}</style>
</head><body class="dsh-wechat-skin-on"><div id="a">${mk(1)}</div><div id="b">${mk(4)}</div><div id="c">${mk(20)}</div>
<script>const m=(s)=>{const c=document.querySelector(s+' .JZLxKW_card'),v=c.querySelector('.JZLxKW_scroll');return{card:Math.round(c.getBoundingClientRect().height),scroll:Math.round(v.getBoundingClientRect().height),overflow:v.scrollHeight>v.clientHeight};};document.title=JSON.stringify({one:m('#a'),four:m('#b'),twenty:m('#c')});</script></body></html>`;
writeFileSync('/tmp/autogrow.html',html);
const out=execFileSync(chrome,['--headless=new','--disable-gpu','--dump-dom','file:///tmp/autogrow.html'],{encoding:'utf8'});
console.log(out.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g,'"').replace(/&lt;/g,'<'));
