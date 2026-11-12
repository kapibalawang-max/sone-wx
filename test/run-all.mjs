// One entry point for the whole suite: `node test/run-all.mjs`
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const here = dirname(fileURLToPath(import.meta.url))
// Fixtures first: every browser suite reads /tmp/sone-css.css and the host dumps, and
// running them against a stale copy means testing last week's skin.
const prep = spawnSync(process.execPath, [join(here, 'fixtures.mjs')], { encoding: 'utf8' })
if (prep.status !== 0) {
  console.error('fixtures failed:\n' + (prep.stderr || prep.stdout))
  process.exit(1)
}
console.log('PREP  fixtures             ' + (prep.stdout || '').trim().split('\n').pop())
const files = ['duplicate-fn-test', 'host-hash-test', 'host-routes-test', 'cleanup-test', 'palette-test',
  'sbg-test', 'panel-order-test', 'config-test', 'type-scale-test',
  'style-prop-test', 'font-scope-test', 'injected-setters-test', 'glyph-turn-test', 'sidebar-state-test', 'group-count-test', 'brand-tagline-test', 'rightbar-auto-test', 'i18n-keys-test', 'settings-search-test', 'user-avatar-test', 'avatar-topic-test', 'skin-extras-test', 'table-test', 'table-stability-test', 'markdown-test', 'composer-fx-test', 'ai-avatar-test', 'autogrow-test', 'version-test', 'store-sync-test', 'new-session-test', 'panel-density-test', 'folder-icon-test', 'genui-table-test', 'contrast-test', 'contrast-sweep-test', 'affordance-test', 'share-code-test', 'css-snapshot', 'visual']
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
