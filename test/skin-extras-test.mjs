// 字体族 / 高对比 / 头像形状 / 选中与滚动条：CSS 生效 + 接线守卫
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const src = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
function grab(name) {
  const i = src.indexOf(`const ${name} = \``)
  let j = src.indexOf('\n\t\t\t`;', i)
  if (j < 0) j = src.indexOf('`;', i)
  return src.slice(i + `const ${name} = \``.length, j)
}
writeFileSync('/tmp/sone-css-extras.css', grab('WECHAT_CSS') + '\n' + grab('WECHAT_UI_CSS'))

function probe(attrs) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///tmp/sone-css-extras.css"></head>
<body class="dsh-wechat-skin-on" ${attrs}>
<div class="JoiKIa_sessionRow" id="row"><span class="JoiKIa_slot" id="slot"></span></div>
<span id="txt" style="color:var(--dsw-alias-label-tertiary)">x</span>
<div data-chat-flow-kind="user" id="ucol"></div>
<div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step" id="acol"><span>x</span></div>
<script>
const b=getComputedStyle(document.body), row=getComputedStyle(document.getElementById('row')), slot=getComputedStyle(document.getElementById('slot'));
document.title=JSON.stringify({
  ff: b.fontFamily,
  sb: b.scrollbarColor,
  avRadius: row.getPropertyValue('--wc-av-radius').trim(),
  slotRadius: slot.borderRadius,
  tertiary: getComputedStyle(document.getElementById('txt')).color,
  userAvatar: getComputedStyle(document.getElementById('ucol'), '::after').borderRadius,
  aiAvatar: getComputedStyle(document.getElementById('acol'), '::before').borderRadius,
  border: b.getPropertyValue('--wc-border-light').trim()
});
</script></body></html>`
  writeFileSync('/tmp/extras.html', html)
  const dom = execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ['--headless=new', '--disable-gpu', '--dump-dom', 'file:///tmp/extras.html'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return JSON.parse(dom.match(/<title>(.*?)<\/title>/s)[1].replace(/&quot;/g, '"'))
}

let pass = 0, fail = 0
const ok = (cond, name, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra)) } }

const base = probe('')
// Exact stack: a loose /PingFang|sans-serif/ test would pass even if the font
// switch stopped working entirely.
// Chrome reports BlinkMacSystemFont as "system-ui".
const SYSTEM_STACK = '-apple-system, "system-ui", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif'
ok(base.ff === SYSTEM_STACK, 'default font stack is the system stack', base.ff)
ok(base.avRadius === '6px' && base.slotRadius === '6px', 'default avatar radius 6px', base)
ok(/rgba?\(0, 0, 0/.test(base.sb), 'scrollbar thumb colour applied', base.sb)
ok(base.border === '#d9d9e0', 'default border token is slate6', base.border)

const wenkai = probe('data-dsh-wc-font-family="wenkai"')
ok(/LXGW WenKai|LXGWWenKai|Kaiti SC/.test(wenkai.ff), 'wenkai typeface', wenkai.ff)
ok(/fontFamily === "serif"\) fontFamily = "wenkai"/.test(src), 'legacy serif value migrates to wenkai')
const wechat = probe('data-dsh-wc-font-family="wechat"')
ok(/PingFang SC/.test(wechat.ff), 'wechat typeface', wechat.ff)
const kai = probe('data-dsh-wc-font-family="kai"')
ok(/Kaiti|STKaiti|KaiTi/.test(kai.ff), 'kaiti typeface', kai.ff)
const round = probe('data-dsh-wc-font-family="round"')
ok(/Yuanti|YouYuan|Maru Gothic/.test(round.ff), 'rounded typeface', round.ff)

const circle = probe('data-dsh-wc-avatar-shape="circle"')
ok(circle.avRadius === '50%' && circle.slotRadius === '50%', 'circle avatar', circle)
const square = probe('data-dsh-wc-avatar-shape="square"')
ok(square.avRadius === '2px', 'square avatar', square)
ok(circle.userAvatar === '50%' && circle.aiAvatar === '50%', 'circle reaches chat avatars', circle)
ok(square.userAvatar === '2px', 'square reaches chat avatars', square)

const hc = probe('data-dsh-wc-contrast="high"')
ok(hc.tertiary === 'rgb(74, 74, 76)', 'high contrast tertiary text', hc.tertiary)
ok(hc.border === 'rgba(0, 0, 0, 0.28)', 'high contrast border', hc.border)
const hcDark = probe('data-dsh-wc-contrast="high" data-dsh-wechat-dark="1"')
ok(hcDark.tertiary === 'rgb(210, 210, 214)', 'high contrast dark tertiary text', hcDark.tertiary)

// wiring guards
ok(/const FONT_FAMILY_KEY = "dsh-wechat-skin:font-family"/.test(src), 'font family key')
ok(/const CONTRAST_KEY = "dsh-wechat-skin:contrast"/.test(src), 'contrast key')
ok(/const AVATAR_SHAPE_KEY = "dsh-wechat-skin:avatar-shape"/.test(src), 'avatar shape key')
ok(/FONT_FAMILY_KEY, CONTRAST_KEY, AVATAR_SHAPE_KEY, AVATAR_STYLE_KEY, COMPOSER_FX_KEY, CUSTOM_PRESETS_KEY\]/.test(src), 'keys exported in config')
ok(/const AVATAR_STYLE_KEY = "dsh-wechat-skin:avatar-style"/.test(src), 'avatar style key')
ok(/function applyAvatarStyle\(value\)/.test(src), 'applyAvatarStyle defined')
ok(/function silhouetteAvatar\(title, seed\)/.test(src), 'silhouette generator')
ok(/setFontFamily: \(value\) => \{/.test(src) && /setContrast: \(value\) => \{/.test(src) && /setAvatarShape: \(value\) => \{/.test(src), 'injected setters')
ok(/title: t\("fontFamilyTitle"\)/.test(src) && /title: t\("contrastTitle"\)/.test(src) && /title: t\("avatarShapeTitle"\)/.test(src), 'settings rows wired')
ok(/window\.localStorage\.removeItem\(FONT_FAMILY_KEY\)/.test(src) && /removeItem\(CONTRAST_KEY\)/.test(src) && /removeItem\(AVATAR_SHAPE_KEY\)/.test(src), 'reset clears keys')

console.log(fail ? `${pass}/${pass + fail} FAIL` : `skin-extras-test ${pass}/${pass + fail} OK`)
process.exit(fail ? 1 : 0)
