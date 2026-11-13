// test/star-test.mjs — 会话星标：纯函数行为 + 跨边界接线守卫
//
// 星标只做行内标记，不重排。v1.44.0 曾用 CSS order 把星标行提到分组顶部，
// 但宿主拖拽按视觉矩形判落点、按数据序写回，任何视觉重排都会让拖拽静默错位；
// 同时 order:-1 会把星标行排到分组标题之上。这里把「不得重排」钉成守卫。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'client.js'), 'utf8')

function makeEl(cls) {
  const el = {
    className: cls || '',
    children: [],
    attrs: {},
    __parent: null,
    style: { setProperty() {}, removeProperty() {} },
    getAttribute(k) { return k in el.attrs ? el.attrs[k] : null },
    setAttribute(k, v) { el.attrs[k] = String(v) },
    removeAttribute(k) { delete el.attrs[k] },
    get parentNode() { return el.__parent },
    removeChild(node) {
      const at = el.children.indexOf(node)
      if (at >= 0) el.children.splice(at, 1)
      node.__parent = null
      return node
    },
    querySelector(sel) {
      if (sel === '.dsh-wc-star-btn') return el.children.find(c => c.className === 'dsh-wc-star-btn') || null
      if (sel === '.JoiKIa_title') return el.children.find(c => c.className === 'JoiKIa_title') || null
      return null
    },
    // DOM semantics: insert as a sibling right after el
    insertAdjacentElement(_pos, node) {
      const parent = el.__parent
      if (!parent) { node.__parent = el; el.children.push(node); return }
      const at = parent.children.indexOf(el)
      parent.children.splice(at + 1, 0, node)
      node.__parent = parent
    },
    add(child) { child.__parent = el; el.children.push(child) },
    addEventListener() {},
    removeEventListener() {},
    closest(sel) {
      let cur = el
      while (cur) {
        if (sel === '.dsh-wc-star-btn' && cur.className === 'dsh-wc-star-btn') return cur
        cur = cur.__parent
      }
      return null
    }
  }
  return el
}

function loadStarsRegion(opts = {}) {
  const a = src.indexOf('//#region dsh-wechat-skin: session stars')
  assert.ok(a >= 0, 'session stars region missing')
  const b = src.indexOf('//#endregion', a)
  const region = src.slice(a, b)
  const store = {}
  const rows = []
  const buttons = []
  const doc = {
    listeners: {},
    documentElement: { lang: opts.lang || 'zh-CN' },
    addEventListener(type, fn, cap) { doc.listeners[type + ':' + (cap ? 'cap' : 'bub')] = fn },
    removeEventListener(type, fn, cap) { delete doc.listeners[type + ':' + (cap ? 'cap' : 'bub')] },
    createElement() { const el = makeEl(''); buttons.push(el); return el },
    querySelectorAll(sel) {
      if (sel === '.dsh-wc-star-btn') return rows.flatMap(r => r.children.filter(c => c.className === 'dsh-wc-star-btn'))
      if (sel === '[data-dsh-wc-star]') return rows.filter(r => 'data-dsh-wc-star' in r.attrs)
      return rows
    },
    body: makeEl('body')
  }
  const sandbox = {
    document: doc,
    navigator: { language: opts.lang || 'zh-CN' },
    console,
    readJson: (k, d) => (k in store ? store[k] : d),
    writeJson: (k, v) => { store[k] = v }
  }
  vm.createContext(sandbox)
  vm.runInContext(region + '; globalThis.__api = { STAR_KEY, STAR_LIMIT, readStars, writeStars, toggleStars, stampStars, unstampStars, onStarClick, initSessionStars };', sandbox, { filename: 'stars-region.js' })
  return { api: sandbox.__api, store, rows, doc, buttons }
}

const starred = (store) => JSON.stringify(store['dsh-wechat-skin:starred'] || [])
const has = (api, key) => api.readStars().indexOf(key) >= 0

test('toggleStars round-trips through readStars', () => {
  const { api, store } = loadStarsRegion()
  assert.equal(has(api, 'session:a'), false)
  assert.equal(api.toggleStars('session:a'), true)
  assert.equal(has(api, 'session:a'), true)
  assert.equal(starred(store), '["session:a"]')
  assert.equal(api.toggleStars('session:a'), false)
  assert.equal(has(api, 'session:a'), false)
  assert.equal(starred(store), '[]')
})

test('readStars drops junk, de-duplicates and caps the list', () => {
  const { api, store } = loadStarsRegion()
  store['dsh-wechat-skin:starred'] = ['a', 'a', '', null, 42, {}, 'b']
  assert.equal(JSON.stringify(api.readStars()), '["a","b"]')
  store['dsh-wechat-skin:starred'] = 'not-an-array'
  assert.equal(JSON.stringify(api.readStars()), '[]')
  const many = []
  for (let i = 0; i < api.STAR_LIMIT + 50; i++) many.push('s' + i)
  store['dsh-wechat-skin:starred'] = many
  assert.equal(api.readStars().length, api.STAR_LIMIT)
  api.writeStars(many)
  assert.equal(store['dsh-wechat-skin:starred'].length, api.STAR_LIMIT)
})

test('stampStars marks starred rows and skips keyless rows', () => {
  const { api, store, rows } = loadStarsRegion()
  store['dsh-wechat-skin:starred'] = ['session:keep']
  const keep = makeEl('JoiKIa_sessionRow'); keep.attrs['data-row-key'] = 'session:keep'
  keep.add(makeEl('JoiKIa_title'))
  const plain = makeEl('JoiKIa_sessionRow'); plain.attrs['data-row-key'] = 'session:plain'
  plain.add(makeEl('JoiKIa_title'))
  const keyless = makeEl('JoiKIa_sessionRow')
  rows.push(keep, plain, keyless)
  api.stampStars()
  assert.equal(keep.attrs['data-dsh-wc-star'], '1')
  assert.ok(!('data-dsh-wc-star' in plain.attrs))
  assert.ok(!('data-dsh-wc-star' in keyless.attrs))
  assert.equal(keep.children.filter(c => c.className === 'dsh-wc-star-btn').length, 1)
  // idempotent: re-stamp must not duplicate the button
  api.stampStars()
  assert.equal(keep.children.filter(c => c.className === 'dsh-wc-star-btn').length, 1)
  // un-star removes the marker
  store['dsh-wechat-skin:starred'] = []
  api.stampStars()
  assert.ok(!('data-dsh-wc-star' in keep.attrs))
})

test('star button keeps its stored key fresh', () => {
  const { api, store, rows } = loadStarsRegion()
  store['dsh-wechat-skin:starred'] = []
  const row = makeEl('JoiKIa_sessionRow'); row.attrs['data-row-key'] = 'session:old'
  row.add(makeEl('JoiKIa_title'))
  rows.push(row)
  api.stampStars()
  const btn = row.children.find(c => c.className === 'dsh-wc-star-btn')
  assert.ok(btn, 'button inserted after title')
  assert.equal(btn.attrs['data-star-key'], 'session:old')
  row.attrs['data-row-key'] = 'session:new'
  api.stampStars()
  assert.equal(btn.attrs['data-star-key'], 'session:new')
})

test('button carries a localized label and a live aria-pressed', () => {
  const zh = loadStarsRegion({ lang: 'zh-CN' })
  zh.rows.push(Object.assign(makeEl('JoiKIa_sessionRow'), {}))
  const row = zh.rows[0]
  row.attrs['data-row-key'] = 'session:z'
  row.add(makeEl('JoiKIa_title'))
  zh.api.stampStars()
  const btn = row.children.find(c => c.className === 'dsh-wc-star-btn')
  assert.equal(btn.attrs['aria-label'], '切换星标')
  assert.equal(btn.attrs['aria-pressed'], 'false')
  zh.api.toggleStars('session:z')
  zh.api.stampStars()
  assert.equal(btn.attrs['aria-pressed'], 'true')

  const en = loadStarsRegion({ lang: 'en-US' })
  const erow = makeEl('JoiKIa_sessionRow'); erow.attrs['data-row-key'] = 'session:e'
  erow.add(makeEl('JoiKIa_title'))
  en.rows.push(erow)
  en.api.stampStars()
  assert.equal(erow.children.find(c => c.className === 'dsh-wc-star-btn').attrs['aria-label'], 'Toggle star')
})

test('onStarClick toggles only via the star button and re-stamps', () => {
  const { api, store, rows, doc } = loadStarsRegion()
  store['dsh-wechat-skin:starred'] = []
  const row = makeEl('JoiKIa_sessionRow'); row.attrs['data-row-key'] = 'session:x'
  const title = makeEl('JoiKIa_title')
  row.add(title)
  rows.push(row)
  api.initSessionStars()
  const handler = doc.listeners['click:cap']
  assert.equal(typeof handler, 'function', 'capture click handler registered')
  api.stampStars()
  const btn = row.children.find(c => c.className === 'dsh-wc-star-btn')
  const ev = { target: btn, prevented: false, stopped: false, preventDefault() { ev.prevented = true }, stopPropagation() { ev.stopped = true } }
  handler(ev)
  assert.ok(ev.prevented && ev.stopped, 'row click must be swallowed')
  assert.equal(starred(store), '["session:x"]')
  assert.equal(row.attrs['data-dsh-wc-star'], '1')
  // clicking elsewhere on the row must not toggle
  const ev2 = { target: title, preventDefault() {}, stopPropagation() {} }
  handler(ev2)
  assert.equal(starred(store), '["session:x"]')
  // toggle back off
  handler(ev)
  assert.equal(starred(store), '[]')
  assert.ok(!('data-dsh-wc-star' in row.attrs))
})

test('dispose removes the injected buttons and markers, not just the listener', () => {
  const { api, store, rows, doc } = loadStarsRegion()
  store['dsh-wechat-skin:starred'] = ['session:d']
  const row = makeEl('JoiKIa_sessionRow'); row.attrs['data-row-key'] = 'session:d'
  row.add(makeEl('JoiKIa_title'))
  rows.push(row)
  const ctl = api.initSessionStars()
  assert.equal(row.children.filter(c => c.className === 'dsh-wc-star-btn').length, 1)
  assert.equal(row.attrs['data-dsh-wc-star'], '1')
  ctl.dispose()
  assert.equal(doc.listeners['click:cap'], undefined, 'capture listener removed')
  assert.equal(row.children.filter(c => c.className === 'dsh-wc-star-btn').length, 0, 'injected button removed')
  assert.ok(!('data-dsh-wc-star' in row.attrs), 'marker removed')
})

test('wiring: apply/cleanup/reset are all connected', () => {
  assert.ok(src.includes('let starsCtl = null;'), 'applySkin declares starsCtl')
  assert.ok(src.includes('try { starsCtl = initSessionStars(); } catch (e) { starsCtl = null; }'))
  assert.ok(src.includes('if (starsCtl) scanHooks.push(starsCtl.stamp);'))
  assert.ok(src.includes('if (starsCtl) removableHooks.push(starsCtl.stamp);'), 'cleanup must also unregister the scan hook')
  assert.ok(src.includes('if (starsCtl) starsCtl.dispose();'), 'cleanup disposes starsCtl')
  assert.ok(src.includes('window.localStorage.removeItem(STAR_KEY);'), 'resetSkin clears stars')
  assert.ok(/removeItem\(STAR_KEY\);[\s\S]{0,2000}stampStars\(\);/.test(src), 'resetSkin re-stamps after clearing, or the highlight lingers')
  assert.ok(src.includes('const STAR_KEY = "dsh-wechat-skin:starred";'))
})

test('css: star marks the row without reordering it or covering host controls', () => {
  const cssStart = src.indexOf('const WECHAT_CSS = `')
  const cssEnd = src.indexOf('const ISLANDS_CSS = `')
  const css = src.slice(cssStart, cssEnd > cssStart ? cssEnd : undefined)
  // The reorder is deliberately gone: it broke host drag-and-drop and lifted
  // starred rows above their own group heading.
  assert.ok(!css.includes('.Kjh-qa_groupSection { display: flex'), 'must not change the host group layout')
  assert.ok(!/\.Kjh-qa_groupSection[^{]*\{[^}]*order:\s*-1/.test(css), 'must not reorder rows with CSS order')
  assert.ok(!css.includes('order: -1'), 'no CSS reordering anywhere in the skin')
  // The host action cluster must be pushed clear of the star, or the star
  // swallows the pin button's clicks.
  assert.ok(css.includes('.JoiKIa_sessionRow .JoiKIa_rowActions { margin-right: 26px; }'), 'host actions make room for the star')
  assert.ok(css.includes('[data-dsh-wc-star="1"] .JoiKIa_timestamp { margin-right: 26px; }'), 'timestamp makes room too')
  assert.ok(css.includes('.dsh-wc-star-btn { position: absolute; right: 6px;'), 'star button styles present')
  assert.ok(css.includes('.dsh-wc-star-btn:focus-visible'), 'keyboard focus reveals the star')
  assert.ok(css.includes('color: var(--wc-star-ink);'), 'active star uses the per-theme token, not a fixed amber')
  assert.ok(!/\.dsh-wc-star-btn \{[^}]*color: #ffc53d/.test(css), 'no hard-coded amber on the star')
})

test('star ink is declared in all four themes', () => {
  const css = src.slice(src.indexOf('const WECHAT_CSS = `'), src.indexOf('const WECHAT_UI_CSS = `'))
  const blocks = [
    [':root', css.slice(css.indexOf(':root {'), css.indexOf('body.dsh-wechat-skin-on {'))],
    ['dark', css.slice(css.indexOf('body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] {'))],
    ['paper', css.slice(css.indexOf('body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"]:not([data-dsh-wechat-dark="1"]) {'))],
    ['paper-dark', css.slice(css.indexOf('body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"][data-dsh-wechat-dark="1"] {'))]
  ]
  for (const [name, block] of blocks) {
    assert.ok(/--wc-star-ink:\s*#[0-9a-f]{6}/i.test(block), `${name} declares --wc-star-ink`)
  }
})