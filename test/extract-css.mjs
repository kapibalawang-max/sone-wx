import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync('/Users/user/.dsh/local-plugins/sone-wx/client.js','utf8');
function grab(name){ const i=s.indexOf(`const ${name} = \``); if(i<0) throw new Error(name); let j=s.indexOf('\n\t\t\t`;', i); if(j<0) j=s.indexOf('`;', i); let body=s.slice(i+`const ${name} = \``.length, j); return body.replace(/\\`/g,'`').replace(/\\\$/g,'$'); }
writeFileSync('/tmp/sone-css.css', grab('WECHAT_CSS')+'\n'+grab('WECHAT_UI_CSS'));
console.log('css bytes', readFileSync('/tmp/sone-css.css').length);
