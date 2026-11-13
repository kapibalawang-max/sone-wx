// A second `function foo()` in the same scope silently replaces the first, and every
// test that grabs a function by name reads the FIRST one — so the suite stays green
// while the runtime runs different code. That is exactly how the topic-based avatar
// palette died once. Guard the shape, not just the behaviour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fails = [];
for (const file of ['client.js', 'index.js']) {
  const src = fs.readFileSync(path.join(here, '..', file), 'utf8');
  const counts = new Map();
  for (const m of src.matchAll(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) {
    const name = m[1];
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  for (const [name, n] of counts) if (n > 1) fails.push(`${file}: function ${name} declared ${n} times`);
}
if (fails.length) { console.error('duplicate-fn-test FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('duplicate-fn-test OK（无重复函数声明）');