// The build is the source of truth: client.js must match `node build.mjs`.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const r = spawnSync(process.execPath, [join(root, 'build.mjs'), '--check'], { encoding: 'utf8', cwd: root })
if (r.status !== 0) {
  console.error('client.js is stale — run `node build.mjs` and commit the result')
  console.error(r.stderr || r.stdout)
  process.exit(1)
}
console.log('build: client.js matches src/')
