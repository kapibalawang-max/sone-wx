// 侧栏插件图标悬停旋转一圈：结构断言 + 真实浏览器量取。
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire('/Users/user/.dsh/profiles/desktop/node_modules/')
const { chromium } = require('playwright')

const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
function grab(name) {
  const i = src.indexOf(`const ${name} = \``)
  let j = src.indexOf('\n\t\t\t`;', i)
  if (j < 0) j = src.indexOf('`;', i)
  return src.slice(i + `const ${name} = \``.length, j)
}
const css = grab('WECHAT_CSS') + '\n' + grab('WECHAT_UI_CSS')
writeFileSync('/tmp/glyph.css', css)

const fails = []
const ok = (cond, label) => { if (!cond) fails.push(label) }
ok(/\.kB3qhq_panelRow:not\(\[aria-haspopup\]\):hover \.kB3qhq_panelGlyph/.test(css), 'hover 规则要排除「更多」行')
ok(/@keyframes dsh-wc-glyph-turn\s*\{\s*from\s*\{\s*transform: rotate\(0deg\)/.test(css), 'keyframes 起点 0deg')
ok(/to\s*\{\s*transform: rotate\(360deg\)/.test(css), 'keyframes 终点 360deg（结束时姿态与起点一致）')

const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file:///tmp/glyph.css"></head>
<body class="dsh-wechat-skin-on"><div class="kB3qhq_panelList">
<button class="kB3qhq_panelRow" id="plugin"><span class="kB3qhq_panelGlyph" id="g1"><svg width="16" height="16"><rect width="16" height="16"/></svg></span></button>
<button class="kB3qhq_panelRow" id="more" aria-haspopup="menu"><span class="kB3qhq_panelGlyph" id="g2"><svg width="16" height="16"><rect width="16" height="16"/></svg></span></button>
</div></body></html>`
writeFileSync('/tmp/glyph.html', html)

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
await page.goto('file:///tmp/glyph.html')
const read = () => page.evaluate(() => ({
  a: getComputedStyle(document.getElementById('g1')).animationName,
  origin: getComputedStyle(document.getElementById('g1')).transformOrigin,
  box: (() => { const r = document.getElementById('g1').getBoundingClientRect(); return [r.width, r.height] })(),
}))
const rest = await read()
ok(rest.a === 'none', '静止时不播放')
ok(rest.origin === '8px 8px', `旋转中心应落在图标几何中心，实际 ${rest.origin}`)
ok(rest.box[0] === rest.box[1], `图标容器应为正方形，实际 ${rest.box.join('×')}`)
await page.hover('#plugin')
await page.waitForTimeout(60)
ok((await read()).a === 'dsh-wc-glyph-turn', '悬停插件行时播放')
await page.hover('#more')
await page.waitForTimeout(60)
ok((await read()).a === 'none', '「更多」行不播放')
await page.evaluate(() => document.body.setAttribute('data-dsh-wc-reduce-motion', '1'))
await page.hover('#plugin')
await page.waitForTimeout(60)
const dur = await page.evaluate(() => getComputedStyle(document.getElementById('g1')).animationDuration)
ok(parseFloat(dur) < 0.01, `减少动效时应关掉，实际 ${dur}`)
await browser.close()

if (fails.length) { console.error('FAIL\n - ' + fails.join('\n - ')); process.exit(1) }
console.log('glyph-turn OK（6 项）')
