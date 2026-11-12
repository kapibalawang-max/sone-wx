// Right-panel auto-open: the watcher must expand the host right panel only for
// sessions that have never carried a saved layout, only while the preference is
// on, and exactly once per session visit.
import fs from 'node:fs';
import path from 'node:path';
import nodevm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8');
let fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

// --- extract initRightbarAuto verbatim --------------------------------------
const start = src.indexOf('//#region dsh-wechat-skin: right panel auto-open');
const end = src.indexOf('//#endregion', start);
check(start > 0, 'right panel auto-open region missing');
check(end > start, 'right panel auto-open region unterminated');
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

// The region references constants declared in the outer scope; re-declare them
// from the real source so the sandbox sees the shipped values.
const constAt = src.indexOf('const RIGHTBAR_AUTO_KEY');
check(constAt > 0, 'RIGHTBAR_AUTO_KEY not defined in client.js');
const constLine = src.slice(constAt, src.indexOf(';', constAt) + 1);
const persistAt = src.indexOf('const SIDEBAR_RIGHT_PERSISTENCE');
const persistLine = src.slice(persistAt, src.indexOf(';', persistAt) + 1);

function makeSandbox({ storage, selectedKey, service }) {
  const store = new Map(Object.entries(storage || {}));
  const sb = {
    window: { localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    } },
    localStorage: null,
    document: { querySelector: () => (selectedKey === undefined ? null : { getAttribute: () => selectedKey }) },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    JSON, Object, String, Array,
  };
  sb.window.localStorage.getItem = sb.window.localStorage.getItem.bind({ store });
  // readJson reads window.localStorage; provide it in-scope.
  const readJsonSrc = 'const readJson = (key, fallback) => { try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } };\n';
  nodevm.createContext(sb);
  nodevm.runInContext(readJsonSrc + constLine + '\n' + persistLine + '\n' + fnSrc('initRightbarAuto'), sb);
  return { sb, store };
}

const KEY = 'dsh-wechat-skin:rightbar-auto';
const PERSIST = 'dsh.sidebar-right.v1';
const flush = () => new Promise((resolve) => setTimeout(resolve, 15));

async function scenario() {
  // A: preference off -> never expands.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: {}, selectedKey: 'session:a', service: { isExpanded: () => false, toggleExpanded: () => calls.push('a') } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push('a') }) });
    ctl.tick();
    await flush();
    check(calls.length === 0, 'A: expands while the preference is off');
  }
  // B: preference on, no saved layout, collapsed -> expands once.
  {
    const calls = [];
    const make = () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) });
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:b', service: make() });
    const ctl = sb.initRightbarAuto({ get: () => make() });
    ctl.tick();
    await flush();
    check(calls.length === 1, 'B: does not expand exactly once (got ' + calls.length + ')');

  }
  // C: session already has a saved layout -> respects it.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true', [PERSIST + '.c']: '{"bySession":{}}' }, selectedKey: 'session:c', service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) }) });
    ctl.tick();
    await flush();
    check(calls.length === 0, 'C: expands a session that already has a saved layout');
  }
  // D: repeated ticks on the same session -> one expansion only.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:d', service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) }) });
    ctl.tick(); ctl.tick(); ctl.tick();
    await flush();
    check(calls.length === 1, 'D: repeated ticks expand more than once (got ' + calls.length + ')');
  }
  // E: service already expanded -> no toggle.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:e', service: { isExpanded: () => true, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => true, toggleExpanded: () => calls.push(1) }) });
    ctl.tick();
    await flush();
    check(calls.length === 0, 'E: toggles an already-expanded panel');
  }
  // F: service unavailable -> no throw.
  {
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:f', service: undefined });
    const ctl = sb.initRightbarAuto({ get: () => undefined });
    let threw = false;
    try { ctl.tick(); await flush(); } catch (e) { threw = true; }
    check(!threw, 'F: throws when the sidebarRight service is unavailable');
  }
  // G: no selected row / non-session key -> no expansion.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: undefined, service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) }) });
    ctl.tick();
    await flush();
    check(calls.length === 0, 'G: expands without a selected row');
  }
  // H: non-session row key (workspace:) -> no expansion.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'workspace:ws1', service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) }) });
    ctl.tick();
    await flush();
    check(calls.length === 0, 'H: expands for a non-session row key');
  }
  // I: switching sessions expands the new one too.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:i1', service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const svc = { isExpanded: () => false, toggleExpanded: () => calls.push(1) };
    const ctl = sb.initRightbarAuto({ get: () => svc });
    ctl.tick();
    await flush();
    sb.document.querySelector = () => ({ getAttribute: () => 'session:i2' });
    ctl.tick();
    await flush();
    check(calls.length === 2, 'I: a second session does not expand (got ' + calls.length + ')');
  }
  // J: dispose clears a pending timer without throwing.
  {
    const calls = [];
    const { sb } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:j', service: { isExpanded: () => false, toggleExpanded: () => calls.push(1) } });
    const ctl = sb.initRightbarAuto({ get: () => ({ isExpanded: () => false, toggleExpanded: () => calls.push(1) }) });
    ctl.tick();
    ctl.dispose();
    await flush();
    check(calls.length === 0, 'J: dispose does not cancel the pending expansion');
  }
}
await scenario();

// --- wiring guards -----------------------------------------------------------
check(src.includes('scanHooks.push(rightbarAutoCtl.tick)'), 'wiring: scanHooks.push(rightbarAutoCtl.tick) missing');
check(src.includes('initRightbarAuto(ctx)'), 'wiring: initRightbarAuto(ctx) call missing');
check(src.includes('rightbarAutoCtl.dispose()'), 'wiring: rightbarAutoCtl.dispose() missing');
check(/const CONFIG_SKIN_KEYS = \[.*RIGHTBAR_AUTO_KEY.*\]/.test(src), 'wiring: RIGHTBAR_AUTO_KEY not in CONFIG_SKIN_KEYS');
check(/function createStore\((.*)initialRightbarAuto\)/.test(src), 'wiring: createStore lacks initialRightbarAuto');
check(/sync: \(d,.*rightbarAuto\) =>/.test(src), 'wiring: store sync lacks rightbarAuto param');
check(src.includes('d.rightbarAuto = rightbarAuto;'), 'wiring: store sync does not write d.rightbarAuto');
check(src.includes('setRightbarAuto: (on) =>'), 'wiring: injected.setRightbarAuto missing');
check(src.includes('window.localStorage.removeItem(RIGHTBAR_AUTO_KEY)'), 'wiring: resetSkin does not clear RIGHTBAR_AUTO_KEY');
check(src.includes('applyRightbarAuto(rightbarAuto);'), 'wiring: applyRightbarAuto not applied on init/import');
check(src.includes('title: t("rightbarAutoTitle")'), 'wiring: settings row rightbarAutoTitle missing');
check(src.includes('SIDEBAR_RIGHT_PERSISTENCE + "." + sessionId'), 'wiring: saved-layout key must use the host namespace + session id');
for (const key of ['rightbarAutoTitle', 'rightbarAutoHint', 'rightbarAutoOn', 'rightbarAutoOff']) {
  const hits = (src.match(new RegExp('"' + key + '":', 'g')) || []).length;
  check(hits >= 2, 'locale: ' + key + ' must exist in zh and en (found ' + hits + ')');
}
check(src.includes('delete document.body.dataset.dshWcRightbarAuto'), 'wiring: cleanup must clear the body flag');
check(src.includes('const SKIN_VERSION = "1.41.0";'), 'version: SKIN_VERSION should be 1.41.0');

if (fails.length) {
  console.error('FAIL (' + fails.length + '):\n' + fails.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('rightbar-auto: all checks passed');
