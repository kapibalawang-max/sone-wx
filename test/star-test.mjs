// test/star-test.mjs — 会话星标：纯函数行为 + 接线守卫
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

function loadStarsRegion() {
  const a = src.indexOf('//#region dsh-wechat-skin: session stars')
  assert.ok(a >= 0, 'session stars region missing')
  const b = src.indexOf('//#endregion', a)
  const region = src.slice(a, b)
  const store = {}
  const rows = []
  const doc = {
    listeners: {},
    addEventListener(type, fn, cap) { doc.listeners[type + ':' + (cap ? 'cap' : 'bub')] = fn },
    removeEventListener(type, fn, cap) { delete doc.listeners[type + ':' + (cap ? 'cap' : 'bub')] },
    createElement() { return makeEl('') },
    querySelectorAll() { return rows },
    body: makeEl('body')
  }
  const sandbox = {
    document: doc,
    console,
    readJson: (k, d) => (k in store ? store[k] : d),
    writeJson: (k, v) => { store[k] = v }
  }
  vm.createContext(sandbox)
  vm.runInContext(region + '; globalThis.__api = { STAR_KEY, readStars, writeStars, isStarred, toggleStars, stampStars, onStarClick, initSessionStars };', sandbox, { filename: 'stars-region.js' })
  return { api: sandbox.__api, store, rows, doc }
}

const starred = (store) => JSON.stringify(store['dsh-wechat-skin:starred'] || [])

test('toggleStars round-trips and isStarred reads back', () => {
  const { api, store } = loadStarsRegion()
  assert.equal(api.isStarred('session:a'), false)
  assert.equal(api.toggleStars('session:a'), true)
  assert.equal(api.isStarred('session:a'), true)
  assert.equal(starred(store), '["session:a"]')
  assert.equal(api.toggleStars('session:a'), false)
  assert.equal(api.isStarred('session:a'), false)
  assert.equal(starred(store), '[]')
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

test('wiring: apply/cleanup/reset/css are all connected', () => {
  assert.ok(src.includes('let starsCtl = null;'), 'applySkin declares starsCtl')
  assert.ok(src.includes('try { starsCtl = initSessionStars(); } catch (e) { starsCtl = null; }'))
  assert.ok(src.includes('if (starsCtl) scanHooks.push(starsCtl.stamp);'))
  assert.ok(src.includes('if (starsCtl) starsCtl.dispose();'), 'cleanup disposes starsCtl')
  assert.ok(src.includes('window.localStorage.removeItem(STAR_KEY);'), 'resetSkin clears stars')
  assert.ok(src.includes('const STAR_KEY = "dsh-wechat-skin:starred";'))
  const css = src.slice(src.indexOf('const WECHAT_CSS = `'))
  assert.ok(css.includes('.Kjh-qa_groupSection { display: flex; flex-direction: column; }'), 'group section becomes flex column')
  assert.ok(css.includes('.Kjh-qa_groupSection > span:has(> .JoiKIa_sessionRow[data-dsh-wc-star="1"]) { order: -1; }'), 'starred row pins to top')
  assert.ok(css.includes('.dsh-wc-star-btn { position: absolute; right: 6px;'), 'star button styles present')
  assert.ok(css.includes('color: #ffc53d;'), 'active star uses amber')
})
