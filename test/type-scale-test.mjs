import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
// 断言五档字号下层级单调、正文不低于 13px、标题不超过 21px。
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
function grab(name) {
  const i = src.indexOf(`const ${name} = \``)
  let j = src.indexOf('\n\t\t\t`;', i)
  if (j < 0) j = src.indexOf('`;', i)
  return src.slice(i + `const ${name} = \``.length, j)
}
writeFileSync('/tmp/sone-css-type.css', grab('WECHAT_CSS') + '\n' + grab('WECHAT_UI_CSS'))

function probe(scale) {
  const html = `<!doctype html><html style="--dsh-wechat-font-scale:${scale}"><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///tmp/sone-css-type.css"></head>
<body class="dsh-wechat-skin-on" style="--wc-line-height:1.6">
<div class="JoiKIa_sessionRow"><span class="JoiKIa_title" id="a">会话标题</span></div>
<div class="tnXGgG_column" data-chat-flow-kind="assistant-step"><div class="q_bubble_1" id="b">正文段落</div><p><code id="c">code</code></p></div>
<span class="JoiKIa_timestamp" id="d">12:00</span>
<span class="JoiKIa_searchResultHeading" id="e">搜索标题</span>
<button class="dsh-wc-btn dsh-wc-btn-secondary" id="f">按钮</button>
<span class="dsh-wc-seg-item" id="g">分段</span>
<script>
const ids=['a','b','c','d','e','f','g']; const out={};
for (const id of ids) out[id]=parseFloat(getComputedStyle(document.getElementById(id)).fontSize);
document.title=JSON.stringify(out);
</script></body></html>`
  writeFileSync('/tmp/type-scale.html', html)
  const dom = execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless=new', '--disable-gpu', '--dump-dom', 'file:///tmp/type-scale.html'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(dom.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g, '"'))
}

let fail = 0
for (const scale of [0.85, 0.92, 1.0, 1.08, 1.18]) {
  const r = probe(scale)
  const ok = r.b > r.a && r.a >= r.c && r.c >= r.d && r.d >= r.e && r.d >= 12 && r.e >= 12 && r.b >= 13 && r.b <= 21 && r.f >= 12
  if (!ok) fail += 1
  console.log(String(scale).padEnd(5), JSON.stringify(r), ok ? 'OK' : 'FAIL')
}
console.log(fail ? `${fail}/5 FAIL` : '5/5 OK')
process.exit(fail ? 1 : 0)
