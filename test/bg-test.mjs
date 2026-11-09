import fs from 'node:fs';
const src = fs.readFileSync('/tmp/bg-region.js', 'utf8');
const classes = new Set();
const vars = new Map();
const bodyDs = { dshWechatDark: '0' };
globalThis.document = {
  body: { classList: { add:(c)=>classes.add(c), remove:(c)=>classes.delete(c), toggle:(c,on)=>{ on?classes.add(c):classes.delete(c); }, contains:(c)=>classes.has(c) }, dataset: bodyDs },
  documentElement: { style: { setProperty:(k,v)=>vars.set(k,v), removeProperty:(k)=>vars.delete(k) } }
};
const api = new Function(src + '\nreturn { normalizeBgColor, clampBgAlpha, tintColor, applyBackground, get bgColor(){return bgColor}, set bgColor(v){bgColor=v}, get bgAlpha(){return bgAlpha}, set bgAlpha(v){bgAlpha=v} };')();
const ok=[],bad=[];
const eq=(n,a,b)=>(JSON.stringify(a)===JSON.stringify(b)?ok:bad).push(n+': got '+JSON.stringify(a)+' want '+JSON.stringify(b));

eq('hex 6', api.normalizeBgColor('#AABBCC'), '#aabbcc');
eq('hex 3', api.normalizeBgColor('#abc'), '#aabbcc');
eq('bad hex', api.normalizeBgColor('red'), null);
eq('null', api.normalizeBgColor(null), null);
eq('clamp -5', api.clampBgAlpha(-5), 0);
eq('clamp 300', api.clampBgAlpha(300), 85);
eq('clamp abc', api.clampBgAlpha('abc'), 0);
eq('clamp 40', api.clampBgAlpha('40'), 40);

api.bgColor=null; api.bgAlpha=0; api.applyBackground();
eq('auto: class off', classes.has('dsh-wc-bg-custom'), false);
eq('auto: no var', vars.size, 0);
eq('auto: tint is skin default', api.tintColor(0), 'rgba(242, 242, 242, 1)');

api.bgColor='#000000'; api.bgAlpha=40; api.applyBackground();
eq('custom: class on', classes.has('dsh-wc-bg-custom'), true);
eq('custom: frame tint', vars.get('--dsh-wc-bg'), 'rgba(0, 0, 0, 0.6)');
eq('custom: sidebar darker', vars.get('--dsh-wc-sidebar-bg'), 'rgba(0, 0, 0, 0.6)');
eq('custom: alpha 0 opaque', (api.bgAlpha=0, api.tintColor(0)), 'rgba(0, 0, 0, 1)');

bodyDs.dshWechatDark='1'; api.bgColor=null; api.bgAlpha=20;
eq('dark default tint', api.tintColor(0), 'rgba(35, 35, 38, 0.8)');
eq('dark sidebar shifted', api.tintColor(-8), 'rgba(27, 27, 30, 0.8)');
api.applyBackground();
eq('dark: applied', vars.get('--dsh-wc-bg'), 'rgba(35, 35, 38, 0.8)');

api.bgColor=null; api.bgAlpha=0; api.applyBackground();
eq('cleared: vars removed', vars.size, 0);
eq('cleared: class off', classes.has('dsh-wc-bg-custom'), false);

console.log(ok.map(l=>'PASS '+l).join('\n'));
if(bad.length){console.log(bad.map(l=>'FAIL '+l).join('\n'));process.exit(1);}
console.log('ALL PASS',ok.length);
