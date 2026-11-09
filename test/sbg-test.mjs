import fs from 'node:fs';
const src = fs.readFileSync('client.js','utf8');
// pull the sidebar-background region
const a = src.indexOf('//#region dsh-wechat-skin: sidebar background');
const b = src.indexOf('//#endregion', a);
const code = 'const SIDEBAR_BG_CLASS = "dsh-wc-sidebar-bg";' + src.slice(a, b);
const fn = new Function(`${code}; function __set(v){ sidebarBg = normalizeHexColor(v); applySidebarBg(); } return { normalizeHexColor, applySidebarBg, __set };`);
const api = fn();
let n=0, bad=0;
const ok=(cond,msg)=>{ n++; if(!cond){ bad++; console.log('FAIL', msg); } };
ok(api.normalizeHexColor('#abc')==='#aabbcc','short hex expands');
ok(api.normalizeHexColor('#ABCDEF')==='#abcdef','lowercases');
ok(api.normalizeHexColor('  #123456 ')==='#123456','trims');
ok(api.normalizeHexColor('red')===null,'rejects names');
ok(api.normalizeHexColor('')===null,'rejects empty');
ok(api.normalizeHexColor(null)===null,'rejects null');
ok(api.normalizeHexColor('#12345')===null,'rejects 5 digit');

// apply: needs a document stub
const props={}; const classes=new Set(); const data={};
globalThis.document={ body:{ classList:{ toggle:(c,on)=>{on?classes.add(c):classes.delete(c);} }, dataset:data },
  documentElement:{ style:{ setProperty:(k,v)=>{props[k]=v;}, removeProperty:(k)=>{delete props[k];} } } };
api.__set('#1e1e22');
ok(classes.has('dsh-wc-sidebar-bg'),'class on');
ok(props['--dsh-wc-sidebar-color']==='#1e1e22','var set');
ok(data.dshWcSidebarInk==='light','dark fill -> light ink');
api.__set('#f5efe4');
ok(data.dshWcSidebarInk==='dark','light fill -> dark ink');
api.__set(null);
ok(!classes.has('dsh-wc-sidebar-bg'),'class off');
ok(!('--dsh-wc-sidebar-color' in props),'var removed');
ok(!('dshWcSidebarInk' in data),'ink removed');
console.log(`sbg-test ${n-bad}/${n}`);
process.exit(bad?1:0);
