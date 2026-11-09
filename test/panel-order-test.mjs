import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const code = `const SIDEBAR_ORDER_KEY='dsh-wechat-skin:sidebar-order';
const PANEL_LIST_SELECTOR='.kB3qhq_panelList';
const PANEL_ROW_SELECTOR='.kB3qhq_panelRow';
const PANEL_DRAGGING_CLASS='dsh-wc-panel-dragging';
const PANEL_DRAG_SOURCE_CLASS='dsh-wc-panel-drag-source';
` + readFileSync('/tmp/panel-order-code.js','utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:13px/18px -apple-system} .kB3qhq_panelList{display:flex;flex-direction:column;gap:2px;width:200px}
.kB3qhq_panelRow{min-height:36px;display:block;width:100%} .kB3qhq_moreAnchor{display:flex;flex-direction:column}
</style></head><body>
<div class="kB3qhq_panelList" id="list">
  <button class="kB3qhq_panelRow" aria-label="会话" id="a">会话</button>
  <div class="kB3qhq_moreAnchor"><button class="kB3qhq_panelRow" aria-label="任务" id="b">任务</button></div>
  <button class="kB3qhq_panelRow" aria-label="插件" id="c">插件</button>
</div>
<script>
try { localStorage.clear();
${code}
const results = {};
const list = document.getElementById('list');
const top = (id) => Math.round(document.getElementById(id).getBoundingClientRect().top);
const ord = (id) => document.getElementById(id).parentElement === list ? document.getElementById(id).style.order : document.getElementById(id).parentElement.style.order;
results.defaultOrder = currentPanelLabels();
setPanelOrder(['插件','会话','任务']);
results.afterSet = currentPanelLabels();
results.topAfterSet = [top('c'), top('a'), top('b')];
results.stored = JSON.parse(localStorage.getItem('dsh-wechat-skin:sidebar-order') || 'null');
results.orders = [ord('c'), ord('a'), ord('b')];
setPanelOrder(['会话']);
results.tailKeepsRest = currentPanelLabels();
setPanelOrder([]);
results.clearedOrders = [ord('a'), ord('b'), ord('c')];
results.storedAfterClear = localStorage.getItem('dsh-wechat-skin:sidebar-order');
// drag 会话 to the very bottom
initPanelDrag();
const a = document.getElementById('a');
const rectA = a.getBoundingClientRect();
const rectC = document.getElementById('c').getBoundingClientRect();
a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: rectA.top + 10 }));
document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: rectC.bottom + 20, clientX: 10 }));
const ph = list.querySelector('.dsh-wc-panel-placeholder');
const gh = document.body.querySelector('.dsh-wc-panel-ghost');
results.mid = {
  placeholder: !!ph,
  placeholderLast: !!ph && ph === list.lastElementChild,
  placeholderHeight: ph ? Math.round(ph.getBoundingClientRect().height) : 0,
  ghost: !!gh,
  ghostFixed: gh ? getComputedStyle(gh).position : null,
  ghostTop: gh ? Math.round(gh.getBoundingClientRect().top) : null,
  sourceHidden: a.style.display === 'none',
  draggingClass: document.body.classList.contains('dsh-wc-panel-dragging')
};
document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: rectC.bottom + 20, clientX: 10 }));
results.afterDrag = currentPanelLabels();
results.dragStored = JSON.parse(localStorage.getItem('dsh-wechat-skin:sidebar-order') || 'null');
results.cleanup = { ghost: !!document.body.querySelector('.dsh-wc-panel-ghost'), placeholder: !!list.querySelector('.dsh-wc-panel-placeholder'), display: a.style.display, cls: document.body.classList.contains('dsh-wc-panel-dragging') };
// drag 插件 to the top (mid-drag check of insertion before first row)
const c = document.getElementById('c');
const rectC2 = c.getBoundingClientRect();
c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: rectC2.top + 10 }));
document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: rectC2.top - 200, clientX: 10 }));
const ph2 = list.querySelector('.dsh-wc-panel-placeholder');
const others2 = Array.prototype.slice.call(list.children).filter((el) => el !== ph2 && el !== c);
results.midTop = { placeholderOrder: ph2 ? ph2.style.order : null, placeholderTop: ph2 ? Math.round(ph2.getBoundingClientRect().top) : null, minTop: Math.min.apply(null, others2.map((el) => Math.round(el.getBoundingClientRect().top))) };
document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: rectC2.top - 200, clientX: 10 }));
results.afterDragTop = currentPanelLabels();
document.title = encodeURIComponent(JSON.stringify(results));
} catch(e) { document.title = encodeURIComponent(JSON.stringify({error:String((e&&e.stack)||e)})); }
</script></body></html>`;
writeFileSync('/tmp/panel-order.html', html);
const dom = execFileSync(chrome, ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=600,400','--virtual-time-budget=800','--dump-dom','file:///tmp/panel-order.html'], {encoding:'utf8'});
const m = /<title>([^<]*)<\/title>/.exec(dom);
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.error) { console.log('PAGE ERROR', out.error); process.exit(1); }
const eq = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const checks = [
  ['default order', eq(out.defaultOrder, ['会话','任务','插件'])],
  ['set order applied', eq(out.afterSet, ['插件','会话','任务'])],
  ['visual tops reordered', out.topAfterSet[0] < out.topAfterSet[1] && out.topAfterSet[1] < out.topAfterSet[2]],
  ['stored array', eq(out.stored, ['插件','会话','任务'])],
  ['inline orders 0/1/2', out.orders.join(',') === '0,1,2'],
  ['partial order keeps rest after', eq(out.tailKeepsRest, ['会话','任务','插件'])],
  ['clear removes inline order', out.clearedOrders.join(',') === ',,'],
  ['clear removes storage', out.storedAfterClear === null],
  ['placeholder rendered', out.mid.placeholder === true],
  ['placeholder at drop slot', out.mid.placeholderLast === true],
  ['placeholder keeps row height', out.mid.placeholderHeight === 36],
  ['ghost rendered fixed', out.mid.ghost === true && out.mid.ghostFixed === 'fixed'],
  ['ghost follows pointer', out.mid.ghostTop > 100],
  ['source hidden while dragging', out.mid.sourceHidden === true],
  ['dragging class on', out.mid.draggingClass === true],
  ['drag to bottom reorders', eq(out.afterDrag, ['任务','插件','会话'])],
  ['drag persists', eq(out.dragStored, ['任务','插件','会话'])],
  ['visuals cleaned up', out.cleanup.ghost === false && out.cleanup.placeholder === false && out.cleanup.display === '' && out.cleanup.cls === false],
  ['placeholder at top slot', out.midTop.placeholderOrder === '0' && out.midTop.placeholderTop <= out.midTop.minTop],
  ['drag to top reorders', eq(out.afterDragTop, ['插件','任务','会话'])],
];
let pass = 0;
for (const [name, ok] of checks) { console.log(ok ? 'PASS' : 'FAIL', name); if (ok) pass++; }
console.log(pass + '/' + checks.length);
if (pass !== checks.length) console.log(JSON.stringify(out, null, 2));
