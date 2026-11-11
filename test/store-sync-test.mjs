// Guard: the store's sync() takes positional args, so a missing trailing value
// silently lands as undefined and the row snaps back the moment it is clicked.
// (Shipped bug: composerFx was never passed, so 「输入框效果」could not be turned on.)
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let fail = 0
const sig = src.match(/sync: \(d([^)]*)\) => \{/)
if (!sig) { console.log('FAIL sync signature not found'); process.exit(1) }
const expected = sig[1].split(',').map((x) => x.trim()).filter(Boolean).length
const calls = [...src.matchAll(/bound\?\.sync\(([^)]*)\)/g)]
if (calls.length === 0) { console.log('FAIL no sync call'); process.exit(1) }
for (const call of calls) {
  const args = call[1].split(',').map((x) => x.trim()).filter(Boolean).length
  if (args !== expected) { fail++; console.log(`FAIL sync call passes ${args} args, signature wants ${expected}`) }
}
// every store field must come from an argument, not a stray literal
const fields = ['composerFx', 'avatarStyle', 'contrast', 'fontFamily']
for (const f of fields) {
  if (!new RegExp(`d\\.${f} = ${f};`).test(src)) { fail++; console.log('FAIL field not assigned from its argument:', f) }
}
console.log(fail ? `store-sync FAIL ${fail}` : `store-sync OK（${calls.length} 处调用，${expected} 个参数）`)
process.exit(fail ? 1 : 0)
