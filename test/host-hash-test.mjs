// The maintenance risk this skin lives with: every host release can rename a hashed
// *.module.css class, and a renamed class fails silently — the rule just stops matching.
// This reads the installed host out of app.asar and checks every host class the skin
// names, so a DSH upgrade shows up as a failing test instead of a quietly broken theme.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostBundles, hostCss, asarPath } from './host.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8');

// Only the two CSS template literals carry selectors; the JS half queries a few too.
const cssStart = src.indexOf('const WECHAT_CSS = `');
const cssEnd = src.indexOf('const WECHAT_UI_CSS = `');
const uiEnd = src.indexOf('`;', cssEnd);
const css = src.slice(cssStart, uiEnd);

const own = /^(dsh-|wc-)/;
const generic = new Set(['tableScroll', 'tableFill', 'md-table-wide', 'markdown']);
const tokens = new Set();
for (const m of css.matchAll(/\.(-?[_A-Za-z][\w-]*)/g)) {
  const name = m[1];
  if (own.test(name) || generic.has(name)) continue;
  if (!/_/.test(name)) continue; // hashed module classes always carry an underscore
  tokens.add(name);
}
// probes are written as string literals, not selectors
for (const m of src.matchAll(/["']\.([_A-Za-z][\w-]*)["']/g)) {
  if (!own.test(m[1]) && /_/.test(m[1])) tokens.add(m[1]);
}

const bundles = hostBundles();
const hostText = bundles.map((b) => b.text).join('\n') + '\n' + hostCss();

// Third-party blocks the skin restyles on purpose; read them from the live profile.
const thirdParty = [];
const genui = path.join(process.env.HOME || '', '.dsh/profiles/desktop/node_modules/@changfenhuang/dsh-genui/lib/client.js');
try { thirdParty.push(fs.readFileSync(genui, 'utf8')); } catch {}
const otherText = thirdParty.join('\n');

const missing = [];
const third = [];
for (const name of [...tokens].sort()) {
  if (hostText.includes(name)) continue;
  if (otherText.includes(name)) { third.push(name); continue; }
  missing.push(name);
}

console.log('host classes ' + (tokens.size - missing.length) + '/' + tokens.size +
  (third.length ? '（第三方 ' + third.length + '）' : '') + '  asar: ' + (asarPath() ? 'ok' : 'MISSING'));
if (missing.length) {
  console.error('renamed or removed in the installed host:\n  ' + missing.join('\n  '));
  process.exit(1);
}
console.log('host-hash-test OK');