// One entry point for the whole suite: `node test/run-all.mjs`
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
const files = ['sbg-test', 'panel-order-test', 'config-test', 'bg-test', 'type-scale-test',
  'style-prop-test', 'glyph-turn-test', 'sidebar-state-test', 'i18n-keys-test', 'settings-search-test', 'css-snapshot', 'visual']
let failed = 0
for (const f of files) {
  const r = spawnSync(process.execPath, [join(here, f + '.mjs')], { encoding: 'utf8' })
  const out = (r.stdout || '').trim().split('\n').pop() || (r.stderr || '').trim().split('\n').pop()
  const ok = r.status === 0
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${f.padEnd(20)} ${out}`)
}
console.log(failed ? `\n${failed} suite(s) failed` : '\nall suites passed')
process.exit(failed ? 1 : 0)
