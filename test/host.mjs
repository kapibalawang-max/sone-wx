// Reads the installed host out of app.asar so tests can check themselves against the
// real thing instead of a hand-copied dump. No dependencies: the asar header is just
// a length-prefixed JSON tree followed by the file payloads.
import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = [
  process.env.DSH_APP_ASAR,
  '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar',
  path.join(process.env.HOME || '', 'Applications/DeepSeek Harness.app/Contents/Resources/app.asar'),
  '/opt/DeepSeek Harness/resources/app.asar',
  '/usr/lib/deepseek-harness/resources/app.asar',
].filter(Boolean);

export function asarPath() {
  for (const p of CANDIDATES) { try { if (fs.statSync(p).isFile()) return p; } catch {} }
  return null;
}

let cache = null;
function index() {
  if (cache) return cache;
  const file = asarPath();
  if (!file) throw new Error('app.asar not found (set DSH_APP_ASAR)');
  const fd = fs.openSync(file, 'r');
  const probe = Buffer.alloc(64 * 1024 * 1024);
  const n = fs.readSync(fd, probe, 0, probe.length, 0);
  const start = probe.indexOf('{"files"', 0, 'utf8');
  if (start < 0) throw new Error('no asar header');
  let depth = 0, i = start, inStr = false, esc = false;
  for (; i < n; i += 1) {
    const c = probe[i];
    if (inStr) { if (esc) esc = false; else if (c === 92) esc = true; else if (c === 34) inStr = false; continue; }
    if (c === 34) { inStr = true; continue; }
    if (c === 123) depth += 1;
    else if (c === 125) { depth -= 1; if (!depth) { i += 1; break; } }
  }
  const header = JSON.parse(probe.subarray(start, i).toString('utf8'));
  const base = i;
  const files = [];
  (function walk(node, prefix) {
    for (const k of Object.keys(node.files)) {
      const f = node.files[k];
      const p = prefix ? prefix + '/' + k : k;
      if (f.files) walk(f, p);
      else files.push({ p, size: f.size, offset: Number(f.offset) });
    }
  })(header, '');
  cache = { fd, base, files };
  return cache;
}

export function list(pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return index().files.filter((f) => re.test(f.p));
}

export function read(rel) {
  const { fd, base, files } = index();
  const f = files.find((x) => x.p === rel);
  if (!f) throw new Error('not in asar: ' + rel);
  const buf = Buffer.alloc(f.size);
  fs.readSync(fd, buf, 0, f.size, base + f.offset);
  return buf;
}

/** The web shell stylesheet. Its last rule is shipped unterminated, which would
 *  swallow anything appended after it in a test page, so close it here. */
export function hostCss() {
  const hit = list(/dsh-web-frontend\/dist\/assets\/index-[^/]+\.css$/)[0];
  if (!hit) throw new Error('web frontend css not found');
  let css = read(hit.p).toString('utf8');
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  if (open > close) css += '}'.repeat(open - close);
  return css;
}

/** Every client bundle that carries hashed *.module.css class names. */
export function hostBundles() {
  return list(/@deepseek-ai\/dsh-client-[^/]+\/lib\/client\.js$/)
    .map((f) => ({ name: f.p.split('/').slice(-3)[0], text: read(f.p).toString('utf8') }));
}