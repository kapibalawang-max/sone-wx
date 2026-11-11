// Composer extras: the glass card (CSS) plus the two behaviours installed by
// installComposerEffects() — sliding caret and send-flight. The installer is
// extracted straight from client.js so the test cannot drift from the shipped code.
import fs from 'node:fs';
import { chromium } from './browser.mjs'

const src = fs.readFileSync('/Users/user/.dsh/local-plugins/sone-wx/client.js', 'utf8');
const start = src.indexOf('function installComposerEffects()');
if (start < 0) throw new Error('installer not found');
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const installer = src.slice(start, end);
function grabCss() {
  const css = [];
  for (const name of ['WECHAT_CSS', 'WECHAT_UI_CSS']) {
    const i = src.indexOf('const ' + name + ' = `');
    const j = src.indexOf('`;', i);
    css.push(src.slice(i + ('const ' + name + ' = `').length, j).replace(/\\`/g, '`').replace(/\\\$/g, '$'));
  }
  return css.join('\n');
}
const css = grabCss();
// fixtures.mjs already closes the host stylesheet's unterminated last rule.
const host = fs.readFileSync('/tmp/app.css', 'utf8');
const html = `<!doctype html><html><head><style>
${host}
${css}
body { margin: 0; padding: 40px; }
[data-composer-card] { width: 520px; min-height: 96px; border-radius: 12px; background: #fff; padding: 12px; }
[data-composer-input] { min-height: 64px; outline: none; font: 15px/1.6 -apple-system, "PingFang SC"; }
</style></head>
<body class="dsh-wechat-skin-on">
<div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true">第一行文字</div></div></div>
<div id="chat"></div>
</body></html>`;

const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 900, height: 620 }, reducedMotion: 'no-preference' });
await p.setContent(html);
await p.waitForTimeout(80);

const caret = await p.evaluate(async (code) => {
  const install = new Function(code + '\nreturn installComposerEffects();')();
  install.setEnabled(true);
  window.__cfxA = install;
  const ed = document.querySelector('[data-composer-input]');
  ed.focus();
  const text = ed.firstChild;
  const range = document.createRange();
  range.setStart(text, 3);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const layer = document.querySelector('.dsh-wc-caret');
  const box = layer ? getComputedStyle(layer) : null;
  return {
    flag: document.body.dataset.dshWcComposerFx,
    hasLayer: !!layer,
    opacity: box && box.opacity,
    width: box && box.width,
    height: layer ? layer.style.height : '',
    transition: box && box.transitionProperty,
    animation: box && box.animationName,
    nativeOff: ed.hasAttribute('data-dsh-wc-caret'),
    hostFlag: ed.parentElement.hasAttribute('data-dsh-wc-caret-host'),
    _install: null
  };
}, installer);

const flight = await p.evaluate(async (code) => {
  window.__cfxA?.dispose();
  document.querySelectorAll('.dsh-wc-caret').forEach((n) => n.remove());
  document.querySelector('[data-composer-input]').parentElement.removeAttribute('data-dsh-wc-caret-host');
  const install = new Function(code + '\nreturn installComposerEffects();')();
  install.setEnabled(true);
  const ed = document.querySelector('[data-composer-input]');
  ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((r) => setTimeout(r, 30));
  const row = document.createElement('div');
  row.setAttribute('data-chat-flow-kind', 'user');
  row.style.cssText = 'width:300px;height:40px;margin:200px 0 0 180px;background:#95ec69';
  document.getElementById('chat').appendChild(row);
  await new Promise((r) => setTimeout(r, 120));
  const anims = row.getAnimations ? row.getAnimations() : [];
  const out = { count: anims.length, hasTransform: row.style.transform !== undefined };
  install.dispose();
  out.flagAfterDispose = document.body.dataset.dshWcComposerFx;
  out.layerAfterDispose = !!document.querySelector('.dsh-wc-caret');
  return out;
}, installer);

// empty composer: exactly one caret layer survives a stray one, and it is shown
const empty = await p.evaluate(async (code) => {
  document.querySelectorAll('.dsh-wc-caret').forEach((n) => n.remove());
  const ed = document.querySelector('[data-composer-input]');
  ed.textContent = '';
  ed.removeAttribute('data-dsh-wc-caret');
  const stray = document.createElement('div');
  stray.className = 'dsh-wc-caret';
  ed.parentElement.appendChild(stray);
  const install = new Function(code + '\nreturn installComposerEffects();')();
  install.setEnabled(true);
  ed.focus();
  const range = document.createRange();
  range.setStart(ed, 0); range.collapse(true);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const layers = [...document.querySelectorAll('.dsh-wc-caret')];
  const out = {
    count: layers.length,
    visible: layers.map((n) => getComputedStyle(n).display),
    height: layers[0] ? Number.parseFloat(layers[0].style.height) : 0,
    nativeOff: ed.hasAttribute('data-dsh-wc-caret'),
    caretColor: getComputedStyle(ed).caretColor,
    childCaretColor: getComputedStyle(ed).caretColor
  };
  install.dispose();
  out.afterDispose = document.querySelectorAll('.dsh-wc-caret').length;
  return out;
}, installer);

// glass: attribute on -> the card itself is translucent and blurs its backdrop
const glass = await p.evaluate(() => {
  const card = document.querySelector('[data-composer-card]');
  document.body.dataset.dshWcComposerFx = '0';
  const off = getComputedStyle(card);
  const out = { offFilter: off.backdropFilter || off.webkitBackdropFilter || '', offImage: off.backgroundImage };
  document.body.dataset.dshWcComposerFx = '1';
  const on = getComputedStyle(card);
  out.onFilter = on.backdropFilter || on.webkitBackdropFilter || '';
  out.onImage = on.backgroundImage;
  out.onColor = on.backgroundColor; out.css = on.getPropertyValue('backdrop-filter') || on.getPropertyValue('-webkit-backdrop-filter');
  return out;
});
await b.close();

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
ok(caret.flag === '1', 'setEnabled writes the body flag');
ok(caret.hasLayer, 'caret layer is created');
ok(caret.opacity === '1', 'caret layer is visible at a collapsed caret');
ok(Math.abs(Number.parseFloat(caret.width) - 1.8) < 0.35, 'caret is ~1.8px wide (' + caret.width + ')');
ok(Number.parseFloat(caret.height) > 10, 'caret height follows the line');
ok(/left|top/.test(caret.transition || ''), 'caret position is transitioned');
ok(caret.animation === 'dsh-wc-caret-blink', 'caret blinks');
ok(empty.count === 1, 'empty composer keeps exactly one caret layer (' + empty.count + ')');
ok(empty.visible[0] === 'block', 'the surviving layer is shown');
ok(empty.height > 10, 'empty caret gets its height from the line box');
ok(empty.nativeOff && empty.caretColor === 'rgba(0, 0, 0, 0)', 'native caret is suppressed while the layer paints');
ok(empty.afterDispose === 0, 'dispose leaves no layer behind');
ok(caret.nativeOff, 'native caret is suppressed only after we drew one');
ok(caret.hostFlag, 'caret host is marked relative');
ok(flight.count >= 1, 'send flight animates the new user bubble');
ok(flight.flagAfterDispose === undefined, 'dispose clears the body flag');
ok(!flight.layerAfterDispose, 'dispose removes its own caret layer');
ok(/blur\(20px\)/.test(glass.onFilter), 'glass card blurs its backdrop');
ok(/gradient/.test(glass.onImage), 'glass card paints a gradient (not a flat fill)');
ok(glass.onColor !== 'rgb(255, 255, 255)', 'glass card gives up the opaque background');
ok(glass.offFilter === 'none', 'no backdrop blur while the effect is off');
ok(glass.offImage === 'none', 'no glass gradient while the effect is off');
console.log(`composer-fx-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
