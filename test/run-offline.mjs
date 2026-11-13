// CI entry point: suites that need neither Chrome nor a local DSH install.
// The full suite (`node test/run-all.mjs`) additionally renders in real Chrome and
// reads the host bundle out of app.asar, so it stays a local-only gate.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const files = [
  'build-check',
  'duplicate-fn-test',
  'cleanup-test',
  'palette-test',
  'config-test',
  'style-prop-test',
  'injected-setters-test',
  'brand-tagline-test',
  'rightbar-auto-test',
  'rightbar-width-test',
  'star-test',
  'group-count-test',
  'i18n-keys-test',
  'settings-search-test',
  'avatar-topic-test',
  'affordance-test',
  'share-code-test',
  'share-modal-test',
  'store-sync-test',
  'panel-density-test',
  'folder-icon-test',
  'sbg-test',
  'host-routes-test',
  'png-test',
  'islands-layer-test',
  'version-test',
  'css-snapshot'
]

let failed = 0
for (const f of files) {
  const r = spawnSync(process.execPath, [join(here, f + '.mjs')], { encoding: 'utf8' })
  const lines = (r.stdout || '').trim().split('\n').filter(Boolean)
  const pass = lines.filter((l) => /^ℹ pass \d+/.test(l)).pop()
  const fail = lines.filter((l) => /^ℹ fail \d+/.test(l)).pop()
  const out = pass
    ? `${pass.replace(/^ℹ pass /, '')}/${Number(pass.replace(/^ℹ pass /, '')) + Number((fail || 'ℹ fail 0').replace(/^ℹ fail /, ''))} OK`
    : (lines.pop() || (r.stderr || '').trim().split('\n').pop())
  const ok = r.status === 0
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${f.padEnd(20)} ${out}`)
}
console.log(failed ? `\n${failed} suite(s) failed` : `\nall ${files.length} offline suites passed`)
process.exit(failed ? 1 : 0)
