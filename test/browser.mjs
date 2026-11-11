// One place to find a browser driver. Prefer this package's own devDependency, fall
// back to the copy the desktop profile already has, and say what to install if neither
// is there — a borrowed dependency can disappear on any plugin change.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const roots = [
  path.join(here, '..', 'node_modules') + path.sep,
  path.join(process.env.HOME || '', '.dsh/profiles/desktop/node_modules') + path.sep,
];

export const chromium = (() => {
  for (const root of roots) {
    try { return createRequire(root)('playwright').chromium; } catch {}
  }
  throw new Error('playwright not found — run `npm i` in the plugin directory (devDependency)');
})();