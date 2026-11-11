// Visual regression: renders the plugin's real CSS over representative markup
// and compares against committed baselines. "Changed" is not "worse", but a
// silent drift in spacing/colour is caught here that a hash snapshot cannot see.
//   node test/visual.mjs            -> compare
//   node test/visual.mjs --update   -> rewrite baselines
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'
import { chromium } from './browser.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const src = readFileSync(join(root, 'client.js'), 'utf8')
function grab(name) {
  const i = src.indexOf(`const ${name} = \``)
  if (i < 0) throw new Error(name)
  let j = src.indexOf('`;', i)
  const body = src.slice(i + `const ${name} = \``.length, j)
  return body.replace(/\\`/g, '`').replace(/\\\$/g, '$')
}
const css = grab('WECHAT_CSS') + '\n' + grab('WECHAT_UI_CSS')

const HOST_TOKENS = `
:root{
  --dsw-alias-label-primary:#1a1a1a; --dsw-alias-label-secondary:#6b6b6b; --dsw-alias-label-tertiary:#9a9a9a;
  --dsw-alias-bg-base:#ffffff; --dsw-alias-bg-module-platform:#f7f7f8; --dsw-alias-border-l1:#e5e5e5;
  --dsw-alias-interactive-bg-hover:rgba(0,0,0,.05); --dsw-alias-state-business-primary:#07c160;
  --dsw-specific-bubble:#95ec69; --dsw-specific-sidebar-fill:#e6e6e8;
}
html,body{margin:0;background:#fff}
*{animation:none!important;transition:none!important}
`

const row = (title, time, opts = {}) =>
  `<div class="JoiKIa_sessionRow${opts.sel ? ' JoiKIa_selected' : ''}">
     <span class="JoiKIa_slot" style="display:inline-flex;align-items:center;justify-content:center;font-size:13px">${title.slice(0, 1)}</span>
     ${opts.state ? `<span data-state="${opts.state}"></span><span class="JoiKIa_visuallyHidden"></span>` : ''}
     <span class="JoiKIa_title">${title}</span><span class="JoiKIa_time">${time}</span>
   </div>`

const screens = {
  'sidebar-light': `<div style="width:250px;padding:8px;background:var(--wc-sidebar)">
    ${row('子智能体编排工作流', '昨天', { state: 'ongoing' })}
    ${row('修复侧边栏宽度拖拽', '14:02', { sel: true })}
    ${row('等待确认的方案', '12:30', { state: 'warning' })}
    ${row('已完成的会话', '周一', { state: 'done' })}
    ${row('普通会话没有状态', '上周')}
  </div>`,
  'chat-light': `<div style="width:520px;padding:16px;background:#ededed">
    <div data-chat-flow-kind="user" style="display:flex;justify-content:flex-end;margin-bottom:10px">
      <div class="_bubble_user" style="max-width:70%;padding:8px 10px;background:#95ec69;border-radius:8px;font-size:15px">这个气泡的颜色对吗</div>
    </div>
    <div data-chat-flow-kind="assistant-step" style="margin-bottom:10px">
      <div style="max-width:80%;padding:10px 12px;background:#fff;border-radius:8px;font-size:15px;line-height:1.6">
        对的，助手气泡是白底。<code>inline code</code> 与链接 <a href="#">示例</a>。
        <blockquote style="margin:8px 0">引用一段说明文字。</blockquote>
        <pre style="margin:8px 0;padding:10px;border-radius:10px;overflow:auto"><code>const a = 1
console.log(a)</code></pre>
        <table><thead><tr><th>项</th><th>值</th></tr></thead><tbody><tr><td>行高</td><td>1.6</td></tr><tr><td>字号</td><td>15</td></tr></tbody></table>
      </div>
    </div>
  </div>`,
  'settings-light': `<div style="width:560px;padding:16px;background:#fff">
    <div class="dsh-wc-search"><input class="dsh-wc-search-input" placeholder="搜索设置"><button class="dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm">清除</button></div>
    <div class="dsh-wc-group" style="margin-top:12px">
      <div class="dsh-wc-group-title">预设</div>
      <div class="dsh-wc-group-body">
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px">
          <span style="font-size:13px;color:#1a1a1a">主题预设</span>
          <span class="dsh-wc-seg"><button class="dsh-wc-seg-item">微信</button><button class="dsh-wc-seg-item" aria-pressed="true">纸张</button></span>
        </div>
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px;border-top:0.5px solid #e6e6e6">
          <span style="font-size:13px;color:#1a1a1a">字体大小</span>
          <span class="dsh-wc-seg"><button class="dsh-wc-seg-item">小</button><button class="dsh-wc-seg-item" aria-pressed="true">标准</button><button class="dsh-wc-seg-item">大</button></span>
        </div>
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px;border-top:0.5px solid #e6e6e6">
          <span style="font-size:13px;color:#1a1a1a">字体</span>
          <span class="dsh-wc-seg"><button class="dsh-wc-seg-item" aria-pressed="true">系统默认</button><button class="dsh-wc-seg-item">微信体</button><button class="dsh-wc-seg-item">宋体</button></span>
        </div>
      </div>
    </div>
    <div class="dsh-wc-group" style="margin-top:12px">
      <div class="dsh-wc-group-title">消息</div>
      <div class="dsh-wc-group-body">
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px">
          <span style="font-size:13px;color:#1a1a1a">AI 头像</span>
          <span style="display:flex;align-items:center;gap:8px"><button class="dsh-wc-switch" role="switch" aria-checked="true"></button><button class="dsh-wc-reset" style="opacity:1">↺</button></span>
        </div>
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px;border-top:0.5px solid #e6e6e6">
          <span style="font-size:13px;color:#1a1a1a">头像形状</span>
          <span class="dsh-wc-seg"><button class="dsh-wc-seg-item" aria-pressed="true">圆角方形</button><button class="dsh-wc-seg-item">正圆</button><button class="dsh-wc-seg-item">方形</button></span>
        </div>
      </div>
    </div>
    <div class="dsh-wc-group" style="margin-top:12px">
      <div class="dsh-wc-group-title">辅助</div>
      <div class="dsh-wc-group-body">
        <div class="dsh-wc-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;padding:10px 16px">
          <span style="font-size:13px;color:#1a1a1a">高对比度</span>
          <span class="dsh-wc-seg"><button class="dsh-wc-seg-item" aria-pressed="true">标准</button><button class="dsh-wc-seg-item">高对比</button></span>
        </div>
      </div>
    </div>
    <div class="dsh-wc-group" style="margin-top:12px;background:rgba(128,128,128,0.04);padding:12px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <span style="font-size:12px;color:#8c8c8c">适配正常</span>
        <span style="display:flex;gap:8px"><button class="dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm">导出</button><button class="dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm">导入</button></span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:10px;border-top:0.5px solid rgba(0,0,0,0.12)">
        <span style="font-size:12px;color:#8c8c8c">清除全部外观设置，不可撤销</span>
        <button class="dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm">恢复默认</button>
      </div>
    </div>
  </div>`,
}

const dark = (html, attr) => `<body class="dsh-wechat-skin-on" ${attr}>${html}</body>`

const tmp = mkdtempSync(join(os.tmpdir(), 'sone-visual-'))
const browser = await chromium.launch({ channel: 'chrome' })
const update = process.argv.includes('--update')
const baseDir = join(here, 'baseline')
mkdirSync(baseDir, { recursive: true })
const shots = {}

for (const [name, html] of Object.entries(screens)) {
  const page = await browser.newPage({ viewport: { width: 620, height: 460 }, deviceScaleFactor: 2 })
  const attrs = name.includes('dark') ? 'data-dsh-wechat-dark="1"' : ''
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${HOST_TOKENS}\n${css}</style></head>${dark(html, attrs)}</html>`)
  await page.waitForTimeout(120)
  const file = join(tmp, name + '.png')
  await page.locator('body').screenshot({ path: file })
  shots[name] = file
  await page.close()
}
await browser.close()

const py = `
import json,sys
from PIL import Image, ImageChops
out=[]
for name,a,b in json.loads(sys.argv[1]):
    try:
        A=Image.open(a).convert('RGB'); B=Image.open(b).convert('RGB')
    except FileNotFoundError:
        out.append({'name':name,'missing':True}); continue
    if A.size!=B.size: out.append({'name':name,'size':[A.size,B.size]}); continue
    d=ImageChops.difference(A,B).convert('L')
    hist=d.histogram(); total=A.size[0]*A.size[1]
    changed=sum(hist[7:])
    out.append({'name':name,'pct':round(100.0*changed/total,3),'max':max(i for i,v in enumerate(hist) if v)})
print(json.dumps(out))
`

const pairs = Object.entries(shots).map(([n, f]) => [n, f, join(baseDir, n + '.png')])
if (update) {
  for (const [, from, to] of pairs) writeFileSync(to, readFileSync(from))
  console.log('baseline updated: ' + pairs.map((p) => p[0]).join(', '))
  process.exit(0)
}
if (!existsSync(join(baseDir, Object.keys(shots)[0] + '.png'))) {
  console.error('no baseline yet: run `node test/visual.mjs --update` first')
  process.exit(1)
}
const res = JSON.parse(execFileSync('python3', ['-c', py, JSON.stringify(pairs)], { encoding: 'utf8' }))
let bad = 0
for (const r of res) {
  if (r.missing) { console.log(`${r.name}: MISSING baseline`); bad++ ; continue }
  if (r.size) { console.log(`${r.name}: SIZE ${r.size}`); bad++; continue }
  const ok = r.pct <= 0.15 && r.max <= 12
  console.log(`${r.name}: ${r.pct}% pixels differ, max delta ${r.max} ${ok ? 'OK' : 'CHANGED'}`)
  if (!ok) bad++
}
if (bad) { console.error('visual: ' + bad + ' screen(s) changed (inspect, then --update to accept)'); process.exit(2) }
console.log('visual-test OK（' + res.length + ' 屏）')
