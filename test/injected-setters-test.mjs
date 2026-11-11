// 守卫：settings section 的 injected 必须真的把每个 setter 挂在返回对象上。
// 事故：setTextFontLevel 被误插进 setDensity 的函数体，成了标签语句（label），
// 属性根本不存在 → 设置页点击无反应，而 node --check 与 CSS 测试都发现不了。
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const from = src.indexOf('const injected = (actions) => {')
if (from < 0) { console.log('FAIL injected block missing'); process.exit(1) }
const retAt = src.indexOf('return {', from)
let depth = 0, end = -1
for (let i = src.indexOf('{', retAt); i < src.length; i++) {
  if (src[i] === '{') depth++
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break } }
}
const literal = src.slice(retAt + 'return '.length, end + 1)
let obj
try {
  obj = vm.runInNewContext('(' + literal + ')', { console })
} catch (e) {
  console.log('FAIL injected literal does not evaluate:', e.message)
  process.exit(1)
}
const expected = ['setFontLevel', 'setTextFontLevel', 'setDensity', 'setUserAvatarVisible', 'setAiAvatarVisible', 'setChatWidth', 'setSidebarBg', 'setLineHeight', 'setReduceMotion', 'setFontFamily', 'setContrast', 'setAvatarShape', 'setAvatarStyle', 'setComposerFx', 'applyPreset', 'savePreset', 'deletePreset', 'listPresets', 'exportConfig', 'importConfig', 'uploadUserAvatar', 'uploadAiAvatar', 'resetSkin']
let fail = 0
for (const name of expected) {
  if (typeof obj[name] !== 'function') { fail++; console.log('FAIL prop missing or not callable:', name, typeof obj[name]) }
}
for (const name of Object.keys(obj)) {
  if (!expected.includes(name)) { fail++; console.log('FAIL unexpected prop:', name) }
}
console.log(fail ? `injected-setters FAIL ${fail}` : `injected-setters OK（${Object.keys(obj).length} 个属性全部可调用）`)
process.exit(fail ? 1 : 0)
