// Regenerates every fixture the browser suites read, from the sources of truth:
// the plugin's own CSS and the installed host. Run first in run-all — suites that
// read a stale /tmp dump were silently testing last week's skin.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hostCss, hostBundles } from './host.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath, [path.join(here, 'extract-css.mjs')], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
const css = hostCss();
fs.writeFileSync('/tmp/app.css', css);
// The composer suites need the host's own input-bar rules next to the skin's.
const bundles = hostBundles().map((b) => b.text).join('\n');
const composer = (bundles.match(/\.JZLxKW_[^{}]*\{[^{}]*\}/g) || []).join('\n');
if (!composer) { console.error('no composer rules found in the installed host'); process.exit(1); }
fs.writeFileSync('/tmp/composer.css', composer);
console.log('fixtures OK（sone-css ' + fs.statSync('/tmp/sone-css.css').size + 'B, app.css ' + css.length + 'B, composer.css ' + composer.length + 'B）');