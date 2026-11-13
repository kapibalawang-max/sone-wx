// Right-panel auto-open: while the preference is ON, every session the user
// enters must start with the right panel open. toggleExpanded() throws until
// the host mounts the session surface, so the watcher retries before giving
// up. A manual collapse keeps holding while the user stays in the session.
import fs from 'node:fs';
import path from 'node:path';
import nodevm from 'node:vm';
import { fileURLToPath } from 'node:url';
const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function makeSandbox({ storage, selectedKey, isExpanded, toggle }) {
  const store = new Map(Object.entries(storage || {}));
  const sb = {
    window: { localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    } },
    document: { querySelector: () => (selectedKey === undefined ? null : { getAttribute: () => selectedKey }) },
    // Compress the 300ms retry gap so the suite stays fast.
    setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms || 0, 5)),
    clearTimeout: (id) => clearTimeout(id),
    JSON, Object, String, Array,
  };
  // readJson reads window.localStorage; provide it in-scope.
  const readJsonSrc = 'const readJson = (key, fallback) => { try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } };\n';
  nodevm.createContext(sb);
  nodevm.runInContext(readJsonSrc + constLine + '\n' + fnSrc('initRightbarAuto'), sb);
  const state = { expanded: !!isExpanded, toggles: 0, throws: 0 };
  const service = {
    isExpanded: () => state.expanded,
    toggleExpanded: () => {
      if (state.throws > 0) { state.throws -= 1; throw new Error('sidebarRight: no session surface is mounted'); }
      state.toggles += 1;
      state.expanded = !state.expanded;
      if (toggle) toggle(state);
    },
  };
  return { sb, state, ctl: sb.initRightbarAuto({ get: () => service }) };
}

const KEY = 'dsh-wechat-skin:rightbar-auto';
const flush = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

async function scenario() {
  // A: preference off -> never expands.
  {
    const { ctl, state } = makeSandbox({ storage: {}, selectedKey: 'session:a' });
    ctl.tick();
    await flush();
    check(state.toggles === 0, 'A: expands while the preference is off');
  }
  // B: preference on + collapsed -> expands.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:b' });
    ctl.tick();
    await flush();
    check(state.toggles === 1, 'B: does not expand exactly once (got ' + state.toggles + ')');
    check(state.expanded === true, 'B: session ends up collapsed');
  }
  // C: preference on + already expanded -> no toggle.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:c', isExpanded: true });
    ctl.tick();
    await flush();
    check(state.toggles === 0, 'C: toggles an already-expanded panel');
  }
  // D: repeated ticks on the same session -> one expansion only.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:d' });
    ctl.tick(); ctl.tick(); ctl.tick();
    await flush();
    check(state.toggles === 1, 'D: repeated ticks expand more than once (got ' + state.toggles + ')');
  }
  // E: toggleExpanded throws until the surface mounts -> retries and succeeds.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:e' });
    state.throws = 2;
    ctl.tick();
    await flush();
    check(state.expanded === true, 'E: retry does not open the panel after mount');
    check(state.toggles === 1, 'E: successful toggle count wrong (got ' + state.toggles + ')');
  }
  // F: service unavailable -> no throw.
  {
    const sb = { window: { localStorage: { getItem: () => 'true' } }, document: { querySelector: () => ({ getAttribute: () => 'session:f' }) }, setTimeout, clearTimeout, JSON, Object };
    const readJsonSrc = 'const readJson = (key, fallback) => { try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } };\n';
    nodevm.createContext(sb);
    nodevm.runInContext(readJsonSrc + constLine + '\n' + fnSrc('initRightbarAuto'), sb);
    const ctl = sb.initRightbarAuto({ get: () => undefined });
    let threw = false;
    try { ctl.tick(); await flush(); } catch (e) { threw = true; }
    check(!threw, 'F: throws when the sidebarRight service is unavailable');
  }
  // G: no selected row / non-session key -> no expansion.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: undefined });
    ctl.tick();
    await flush();
    check(state.toggles === 0, 'G: expands without a selected row');
  }
  // H: non-session row key (workspace:) -> no expansion.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'workspace:ws1' });
    ctl.tick();
    await flush();
    check(state.toggles === 0, 'H: expands for a non-session row key');
  }
  // I: switching sessions expands the new one too (even after a manual collapse).
  {
    const { sb, ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:i1' });
    ctl.tick();
    await flush();
    check(state.toggles === 1, 'I: first session does not expand');
    state.expanded = false; // the user collapsed the panel manually
    sb.document.querySelector = () => ({ getAttribute: () => 'session:i2' });
    ctl.tick();
    await flush();
    check(state.toggles === 2, 'I: a second session does not expand (got ' + state.toggles + ')');
  }
  // J: dispose cancels a pending retry without throwing.
  {
    const { ctl, state } = makeSandbox({ storage: { [KEY]: 'true' }, selectedKey: 'session:j' });
    state.throws = 5;
    ctl.tick();
    ctl.dispose();
    await flush();
    check(state.expanded === false, 'J: dispose does not cancel the pending retry');
  }
}
await scenario();

// --- wiring guards -----------------------------------------------------------
check(src.includes('scanHooks.push(rightbarAutoCtl.tick)'), 'wiring: scanHooks.push(rightbarAutoCtl.tick) missing');
check(src.includes('initRightbarAuto(ctx)'), 'wiring: initRightbarAuto(ctx) call missing');
check(src.includes('rightbarAutoCtl.dispose()'), 'wiring: rightbarAutoCtl.dispose() missing');
check(/const CONFIG_SKIN_KEYS = \[.*RIGHTBAR_AUTO_KEY.*\]/.test(src), 'wiring: RIGHTBAR_AUTO_KEY not in CONFIG_SKIN_KEYS');
check(/function createStore\((.*)initialRightbarAuto, initialIslands\)/.test(src), 'wiring: createStore lacks initialRightbarAuto');
check(/sync: \(d,.*rightbarAuto, islands\) =>/.test(src), 'wiring: store sync lacks rightbarAuto param');
check(src.includes('d.rightbarAuto = rightbarAuto;'), 'wiring: store sync does not write d.rightbarAuto');
check(src.includes('setRightbarAuto: (on) =>'), 'wiring: injected.setRightbarAuto missing');
check(src.includes('window.localStorage.removeItem(RIGHTBAR_AUTO_KEY)'), 'wiring: resetSkin does not clear RIGHTBAR_AUTO_KEY');
check(src.includes('applyRightbarAuto(rightbarAuto);'), 'wiring: applyRightbarAuto not applied on init/import');
check(src.includes('title: t("rightbarAutoTitle")'), 'wiring: settings row rightbarAutoTitle missing');
for (const key of ['rightbarAutoTitle', 'rightbarAutoHint', 'rightbarAutoOn', 'rightbarAutoOff']) {
  const hits = (src.match(new RegExp('"' + key + '":', 'g')) || []).length;
  check(hits >= 2, 'locale: ' + key + ' must exist in zh and en (found ' + hits + ')');
}
check(src.includes('delete document.body.dataset.dshWcRightbarAuto'), 'wiring: cleanup must clear the body flag');
check(!region.includes('SIDEBAR_RIGHT_PERSISTENCE'), 'wiring: must not gate on the per-session saved layout (it is written on entry)');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
check(src.includes('const SKIN_VERSION = "' + pkg.version + '";'), 'version: SKIN_VERSION should match package.json (' + pkg.version + ')');

if (fails.length) {
  console.error('FAIL (' + fails.length + '):\n' + fails.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('rightbar-auto: all checks passed');
