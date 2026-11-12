// test/rightbar-width-test.mjs — 右栏默认宽度 35%：行为 + 接线守卫
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'client.js'), 'utf8')

function loadWidthRegion(opts = {}) {
  const a = src.indexOf('//#region dsh-wechat-skin: right panel default width')
  assert.ok(a >= 0, 'right panel default width region missing')
  const b = src.indexOf('//#endregion', a)
  const region = src.slice(a, b)
  const store = {}
  const calls = []
  const listeners = { doc: {}, win: {} }
  const services = { layout: opts.layout === undefined ? { panels: { setRightbar: (px) => calls.push(px) } } : opts.layout }
  const doc = {
    addEventListener(type, fn, cap) { listeners.doc[type + ':' + (cap ? 'cap' : 'bub')] = fn },
    removeEventListener(type, fn, cap) { delete listeners.doc[type + ':' + (cap ? 'cap' : 'bub')] },
    body: {}
  }
  const win = {
    innerWidth: opts.innerWidth || 1280,
    addEventListener(type, fn) { listeners.win[type] = fn },
    removeEventListener(type) { delete listeners.win[type] }
  }
  const sandbox = {
    document: doc,
    window: win,
    console,
    setTimeout: (fn) => { fn(); return 1 },
    clearTimeout: () => {},
    readJson: (k, d) => (k in store ? store[k] : d),
    writeJson: (k, v) => { store[k] = v }
  }
  vm.createContext(sandbox)
  vm.runInContext(region + '; globalThis.__api = { RIGHTBAR_TOUCHED_KEY, RIGHTBAR_WIDTH_RATIO, rightbarTouched, applyRightbarDefault, initRightbarWidth };', sandbox, { filename: 'rightbar-width-region.js' })
  const ctx = { get: (name) => (name === 'layout' ? services.layout : null) }
  return { api: sandbox.__api, store, calls, listeners, services, ctx }
}

test('applies 35% of the viewport when untouched', () => {
  const { api, calls } = loadWidthRegion()
  assert.equal(api.RIGHTBAR_WIDTH_RATIO, 0.35)
  api.applyRightbarDefault({ panels: { setRightbar: (px) => calls.push(px) } })
  assert.equal(JSON.stringify(calls), '[448]') // round(1280 * 0.35)
})

test('never overrides after the user touched the handle', () => {
  const { api, store, calls } = loadWidthRegion()
  store['dsh-wechat-skin:rightbar-touched'] = true
  assert.equal(api.rightbarTouched(), true)
  assert.equal(api.applyRightbarDefault({ panels: { setRightbar: (px) => calls.push(px) } }), false)
  assert.equal(JSON.stringify(calls), '[]')
})

test('skips tiny viewports where 35% is under the 300px floor', () => {
  const { api, calls } = loadWidthRegion({ innerWidth: 800 })
  assert.equal(api.applyRightbarDefault({ panels: { setRightbar: (px) => calls.push(px) } }), false)
  assert.equal(JSON.stringify(calls), '[]')
})

test('retries until the layout service shows up, then applies', () => {
  const { api, calls } = loadWidthRegion({ layout: null })
  let gets = 0
  const lateCtx = { get: () => { gets += 1; return gets >= 3 ? { panels: { setRightbar: (px) => calls.push(px) } } : null } }
  api.initRightbarWidth(lateCtx)
  assert.equal(JSON.stringify(calls), '[448]')
  assert.ok(gets >= 3, 'service was polled more than once')
})

test('pointerdown on the rightbar handle marks touched; resize then keeps hands off', () => {
  const { api, store, calls, listeners } = loadWidthRegion()
  const ctl = api.initRightbarWidth({ get: () => ({ panels: { setRightbar: (px) => calls.push(px) } }) })
  assert.equal(JSON.stringify(calls), '[448]') // initial apply
  const touch = listeners.doc['pointerdown:cap']
  assert.equal(typeof touch, 'function', 'capture pointerdown listener registered')
  touch({ target: { closest: (sel) => (sel === '.PIRFFq_handle[data-side="rightbar"]' ? {} : null) } })
  assert.equal(store['dsh-wechat-skin:rightbar-touched'], true)
  calls.length = 0
  listeners.win.resize()
  assert.equal(JSON.stringify(calls), '[]', 'no re-apply after touch')
  ctl.dispose()
})

test('resize re-applies the ratio while untouched', () => {
  const { api, calls, listeners, ctx } = loadWidthRegion()
  api.initRightbarWidth(ctx)
  assert.equal(typeof listeners.win.resize, 'function')
  calls.length = 0
  listeners.win.resize()
  assert.equal(JSON.stringify(calls), '[448]')
})

test('dispose removes listeners', () => {
  const fresh = loadWidthRegion()
  const ctl = fresh.api.initRightbarWidth(fresh.ctx)
  ctl.dispose()
  assert.equal(Object.keys(fresh.listeners.doc).length, 0, 'document listeners cleaned')
  assert.equal(Object.keys(fresh.listeners.win).length, 0, 'window listeners cleaned')
})

test('wiring: region, applySkin init, cleanup dispose, key and ratio', () => {
  assert.ok(src.includes("const RIGHTBAR_TOUCHED_KEY = \"dsh-wechat-skin:rightbar-touched\";"))
  assert.ok(src.includes('const RIGHTBAR_WIDTH_RATIO = 0.35;'))
  assert.ok(src.includes('let rightbarWidthCtl = null;'))
  assert.ok(src.includes('try { rightbarWidthCtl = initRightbarWidth(ctx); } catch (e) { rightbarWidthCtl = null; }'))
  assert.ok(src.includes('if (rightbarWidthCtl) rightbarWidthCtl.dispose();'))
  assert.ok(src.includes(".PIRFFq_handle[data-side=\"rightbar\"]"))
})
