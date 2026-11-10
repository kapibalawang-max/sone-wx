// 字体设置的作用域：列/侧栏行不能再钉死字体栈，否则「宋体」只改到输入框
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
function grab(name) {
  const i = src.indexOf(`const ${name} = \``)
  let j = src.indexOf('\n\t\t\t`;', i)
  if (j < 0) j = src.indexOf('`;', i)
  return src.slice(i + `const ${name} = \``.length, j)
}
writeFileSync('/tmp/sone-css-font.css', grab('WECHAT_CSS') + '\n' + grab('WECHAT_UI_CSS'))

function probe(mode) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///tmp/sone-css-font.css"></head>
<body class="dsh-wechat-skin-on" data-dsh-wc-font-family="${mode}">
<div class="JoiKIa_sessionRow" id="row"><span class="JoiKIa_title" id="title">会话标题</span></div>
<div class="tnXGgG_column" data-chat-flow-kind="user" id="col"><div class="XNZzAa_body" id="bubble"><div class="_markdown_rve47_5"><p id="p">我发的信息</p><pre><code id="code">x</code></pre></div></div></div>
<script>
const f = id => getComputedStyle(document.getElementById(id)).fontFamily;
document.title = JSON.stringify({ title: f('title'), p: f('p'), code: f('code'), bubble: f('bubble') });
</script></body></html>`
  writeFileSync('/tmp/font-scope.html', html)
  const dom = execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless=new', '--disable-gpu', '--dump-dom', 'file:///tmp/font-scope.html'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(dom.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g, '"'))
}

let pass = 0, fail = 0
const ok = (cond, name, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra)) } }

for (const mode of ['wenkai', 'wechat', 'system', 'kai', 'round']) {
  const r = probe(mode)
  const want = mode === 'wenkai' ? /LXGW WenKai|LXGWWenKai|霞鶩|Kaiti SC/
    : mode === 'wechat' ? /PingFang SC|Hiragino Sans GB|Microsoft YaHei/
    : mode === 'kai' ? /Kaiti|STKaiti|KaiTi/
    : mode === 'round' ? /Yuanti|YouYuan|Maru Gothic/
    : /-apple-system|system-ui|BlinkMacSystemFont/
  ok(want.test(r.title), `${mode}: 会话列表标题`, r.title)
  ok(want.test(r.p), `${mode}: 用户消息正文`, r.p)
  ok(want.test(r.bubble), `${mode}: 用户气泡容器`, r.bubble)
  ok(/monospace|Menlo|Courier/.test(r.code), `${mode}: 代码块保持等宽`, r.code)
}

if (fail) { console.log(`\nFAIL font-scope ${pass}/${pass + fail}`); process.exit(1) }
console.log(`PASS font-scope ${pass}/${pass}`)
