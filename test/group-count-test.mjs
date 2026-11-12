// Group session counts: the counter must mirror the official sidebar derivation
// exactly (subagent/blank/archived hidden, strays in the ungrouped bucket) and
// stamp counts only through React-safe data attributes.
import fs from 'node:fs';
import path from 'node:path';
import nodevm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8');
let fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

// --- extract the three group-count functions verbatim -----------------------
const start = src.indexOf('//#region dsh-wechat-skin: group session counts');
const end = src.indexOf('//#endregion', start);
check(start > 0, 'group session counts region missing');
check(end > start, 'group session counts region unterminated');
const region = src.slice(start, end);
const fnSrc = (name) => {
  const at = region.indexOf(`function ${name}`);
  if (at < 0) throw new Error(`function ${name} not found in region`);
  let depth = 0, i = region.indexOf('{', at);
  for (let j = i; j < region.length; j++) {
    if (region[j] === '{') depth++;
    else if (region[j] === '}') { depth--; if (depth === 0) return region.slice(at, j + 1); }
  }
  throw new Error(`function ${name} braces unbalanced`);
};
const sandbox = {
  localStorage: {
    _m: new Map(),
    getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
    setItem(k, v) { this._m.set(k, String(v)); },
    removeItem(k) { this._m.delete(k); },
  },
  document: { querySelectorAll: () => [] },
  Map,
  Set,
  JSON,
  Object,
  String,
  Array,
};
nodevm.createContext(sandbox);
const constAt = region.indexOf('const GROUP_COUNT_VIEW_KEY');
const constLine = region.slice(constAt, region.indexOf(';', constAt) + 1);
nodevm.runInContext(constLine + '\n' + fnSrc('computeGroupCounts') + '\n' + fnSrc('groupCountArchivedFilter') + '\n' + fnSrc('stampGroupCounts'), sandbox);
const { computeGroupCounts, groupCountArchivedFilter, stampGroupCounts } = sandbox;

// --- computeGroupCounts semantics -------------------------------------------
const sess = (id, over = {}) => ({ id, ...over });
const wsState = {
  items: [
    { workspaceId: 'ws1', sessionIds: ['a', 'b', 'sub', 'blank2', 'arch'] },
    { workspaceId: 'ws2', sessionIds: [] },
  ],
  archivedSessionIds: ['arch'],
};
const sessState = {
  ids: ['a', 'b', 'sub', 'blank2', 'arch', 'stray1', 'strayBlank'],
  byId: {
    a: sess('a'),
    b: sess('b'),
    sub: sess('sub', { origin: 'subagent' }),
    blank2: sess('blank2', { blank: true }),
    arch: sess('arch'),
    stray1: sess('stray1'),
    strayBlank: sess('strayBlank', { blank: true }),
    cur: sess('cur', { blank: true, retainedBy: { mainView: 1 } }),
  },
};
let counts = computeGroupCounts(wsState, sessState, 'default');
check(counts.get('ws1') === 2, `ws1 default count: want 2 (a,b; subagent/blank/archived hidden), got ${counts.get('ws1')}`);
check(counts.get('ws2') === 0, `ws2 empty: want 0, got ${counts.get('ws2')}`);
check(counts.get('') === 1, `ungrouped strays: want 1, got ${counts.get('')}`);

// The current blank session stays visible and counts.
counts = computeGroupCounts(
  { items: [{ workspaceId: 'ws1', sessionIds: ['cur'] }], archivedSessionIds: [] },
  sessState, 'default');
check(counts.get('ws1') === 1, `current blank counted: want 1, got ${counts.get('ws1')}`);

// Archived filters mirror the official browser.
counts = computeGroupCounts(wsState, sessState, 'show');
check(counts.get('ws1') === 3, `show filter counts archives: want 3, got ${counts.get('ws1')}`);
counts = computeGroupCounts(wsState, sessState, 'only');
check(counts.get('ws1') === 1, `only filter: want 1 (the archived one), got ${counts.get('ws1')}`);

// workspaceId keys are stringified (host may use numbers).
counts = computeGroupCounts({ items: [{ workspaceId: 42, sessionIds: ['a'] }], archivedSessionIds: [] }, sessState, 'default');
check(counts.get('42') === 1, `numeric workspaceId stringified: got ${counts.get('42')}`);

// Missing stores degrade to zero counts, never throw.
counts = computeGroupCounts(null, null, 'default');
check(counts.get('') === 0 && counts.size === 1, 'null stores yield empty ungrouped bucket');

// --- archivedFilter mirror ---------------------------------------------------
check(groupCountArchivedFilter() === 'default', 'missing view store falls back to default');
sandbox.localStorage.setItem('dsh.workspace.view.v5', JSON.stringify({ archivedFilter: 'show' }));
check(groupCountArchivedFilter() === 'show', 'archivedFilter read from the official view store');
sandbox.localStorage.setItem('dsh.workspace.view.v5', 'not-json');
check(groupCountArchivedFilter() === 'default', 'corrupt view store falls back to default');
sandbox.localStorage.removeItem('dsh.workspace.view.v5');

// --- stamping ----------------------------------------------------------------
function makeRow(key) {
  const title = { dataset: {} };
  return { key, title, getAttribute: (n) => (n === 'data-row-key' ? key : null), querySelector: (sel) => (sel === '.JoiKIa_projectText .JoiKIa_title' ? title : null) };
}
const rows = [makeRow('workspace:ws1'), makeRow('workspace:ws2'), makeRow('workspace:')];
const fakeDocument = {
  querySelectorAll: (sel) => (sel.startsWith('.JoiKIa_projectRow') ? rows : []),
};
const stampSandbox = { document: fakeDocument, Map, Set, Object, String };
nodevm.createContext(stampSandbox);
nodevm.runInContext(fnSrc('stampGroupCounts'), stampSandbox);
stampSandbox.stampGroupCounts(new Map([['ws1', 7], ['ws2', 0], ['', 3]]));
check(rows[0].title.dataset.dshWcCount === '7', `ws1 stamped 7 on the title span, got ${rows[0].title.dataset.dshWcCount}`);
check(rows[1].title.dataset.dshWcCount === undefined, 'empty group loses its badge');
check(rows[2].title.dataset.dshWcCount === '3', `ungrouped stamped 3, got ${rows[2].title.dataset.dshWcCount}`);
stampSandbox.stampGroupCounts(new Map([['ws1', 0]]));
check(rows[0].title.dataset.dshWcCount === undefined, 'count dropping to 0 removes the badge');

// --- wiring and CSS guards ---------------------------------------------------
check(src.includes('initGroupCounts(ctx)'), 'applySkin wires initGroupCounts(ctx)');
check(/scanHooks\.push\(groupCounts\.stamp\)/.test(src), 'group count stamp joins the scan loop');
check(/groupCounts\.dispose\(\)/.test(src), 'cleanup disposes the group count subscriptions');
check(/ctx\.get\("workspaces"\)/.test(src) && /ctx\.get\("sessions"\)/.test(src), 'reads the host workspaces/sessions services');
check(src.includes("content: attr(data-dsh-wc-count)"), 'CSS renders the badge from the data attribute');
check(/border-radius:\s*999px/.test(src) && /min-width:\s*18px/.test(src) && /height:\s*18px/.test(src), 'badge is an 18px pill that fits the title line box');
check(/background:\s*var\(--wc-count-bg\)/.test(src) && /color:\s*var\(--wc-count-ink\)/.test(src), 'chip colours come from theme tokens (per light/dark/paper/paper-dark)');
check(src.includes('--wc-count-bg') && src.includes('--wc-count-ink'), 'chip tokens are declared for all four theme blocks');
check(/\.JoiKIa_projectRow \.JoiKIa_title\[data-dsh-wc-count\]::after/.test(src), 'badge attaches to the title span, not the column-flex container (.JoiKIa_projectText is display:flex/column, a badge there drops to its own line)');
check(!/\.JoiKIa_projectText\[data-dsh-wc-count\]/.test(src), 'no leftover badge rule on the group container');
check(/row\.querySelector\("\.JoiKIa_projectText \.JoiKIa_title"\)/.test(src), 'stamping reaches the title span through the container');
check(src.includes("JoiKIa_projectRow[data-row-key^=\"workspace:\"]"), 'stamping targets group header rows only');

if (fails.length) { console.error('group-count-test FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('group-count-test OK（' + 18 + ' 项）');
