// Guard against translation drift: every key passed to t() must exist in both
// zh and en, and the two dictionaries must stay key-for-key identical.
import fs from 'node:fs'
const src = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')

function block(startIdx) {
  let i = src.indexOf('{', startIdx)
  let depth = 0
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(i + 1, j) }
  }
  throw new Error('unbalanced block at ' + startIdx)
}
function keysOf(text) {
  const set = new Set()
  // quoted keys ("title": ...) and bare keys (title: '...'), ignoring nested zh/en blocks
  for (const m of text.matchAll(/^\s*(?:"([A-Za-z0-9_]+)"|([A-Za-z0-9_]+))\s*:\s*(?!\{)/gm)) {
    const k = m[1] || m[2]
    if (k === 'zh' || k === 'en') continue
    set.add(k)
  }
  return set
}
function sliceBlock(text, from) {
  const start = text.indexOf('{', from)
  let depth = 0
  for (let j = start; j < text.length; j++) {
    if (text[j] === '{') depth++
    else if (text[j] === '}') { depth--; if (depth === 0) return text.slice(start + 1, j) }
  }
  throw new Error('unbalanced at ' + from)
}
function splitLang(text) {
  const out = {}
  for (const lang of ['zh', 'en']) {
    const at = text.search(new RegExp('(^|\\n)\\s*' + lang + '\\s*:\\s*\\{'))
    if (at < 0) throw new Error('missing ' + lang)
    out[lang] = keysOf(sliceBlock(text, at))
  }
  return out
}

const skin = splitLang(block(src.indexOf('ctx.locale.register(SETTINGS_NS')))
const brandStart = src.indexOf('var TEXT = {')
const brand = splitLang(block(brandStart))

const used = new Set()
for (const m of src.matchAll(/\bt\(\s*["']([A-Za-z0-9_.]+)["']/g)) {
  const after = src.slice(m.index + m[0].length, m.index + m[0].length + 8)
  if (/^\s*\+/.test(after)) continue // dynamic key like t('fontL' + level)
  used.add(m[1])
}

const errs = []
for (const lang of ['zh', 'en']) {
  for (const k of skin[lang]) if (!skin[lang === 'zh' ? 'en' : 'zh'].has(k)) errs.push(`skin ${lang} has extra key "${k}"`)
  for (const k of brand[lang]) if (!brand[lang === 'zh' ? 'en' : 'zh'].has(k)) errs.push(`brand ${lang} has extra key "${k}"`)
}
const missing = []
for (const k of used) {
  const ok = ['zh', 'en'].every((l) => skin[l].has(k) || brand[l].has(k))
  if (!ok) missing.push(k)
}

const count = (o) => o.zh.size + o.en.size
console.log(`skin keys ${skin.zh.size}/${skin.en.size}  brand keys ${brand.zh.size}/${brand.en.size}  used t() keys ${used.size}`)
if (missing.length) errs.push('missing in a dictionary: ' + missing.join(', '))
if (errs.length) { for (const e of errs) console.error('FAIL ' + e); process.exit(1) }
console.log('i18n-keys-test OK（' + count(skin) + '+' + count(brand) + ' 条）')
