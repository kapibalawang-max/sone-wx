// test/share-modal-test.mjs — 分享弹层：Esc 隔离、焦点管理、错误可见性
//
// 这些是 v1.45.2 真实页面实测出来的缺陷：
//   · Esc 用冒泡监听，宿主设置页也监听 Esc，按一次把整个设置页一起关掉；
//   · 焦点留在遮罩背后的设置页按钮上，键盘用户操作不到弹层；
//   · 导入失败的提示写进遮罩背后的全局状态条，弹层里看不到任何反馈。
// 这里把修复后的行为钉成可执行断言，而不是只 grep 源码字符串。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(path.join(root, 'client.js'), 'utf8')

/** Slice the modal effect body out of the component and run it against a stub DOM. */
function loadEffect() {
  const start = src.indexOf('const previousFocus = document.activeElement;')
  assert.ok(start >= 0, 'modal effect body not found')
  const end = src.indexOf('}, [shareOpen]);', start)
  assert.ok(end > start, 'modal effect end not found')
  const body = src.slice(start, end)

  const focusLog = []
  const makeNode = (id, focusable = true) => {
    const node = {
      id,
      disabled: false,
      focused: false,
      focus() { node.focused = true; doc.activeElement = node; focusLog.push(id) },
      contains(other) { return other === node || (other && other.__inModal === true) }
    }
    if (focusable) node.__focusable = true
    return node
  }
  const outside = makeNode('outside-button')
  const copyBtn = makeNode('copy')
  const closeBtn = makeNode('close')
  const codeArea = makeNode('code')
  const importArea = makeNode('import')
  const importBtn = makeNode('import-btn')
  const inModal = [codeArea, copyBtn, closeBtn, importArea, importBtn]
  for (const n of inModal) n.__inModal = true
  const modal = makeNode('modal', false)
  modal.querySelectorAll = () => inModal

  const listeners = {}
  const win = {
    addEventListener(type, fn, capture) { listeners[type] = { fn, capture } },
    removeEventListener(type) { delete listeners[type] }
  }
  const doc = {
    activeElement: outside,
    body: { style: { overflow: 'auto' } },
    contains: () => true
  }
  let closed = 0
  const sandbox = {
    document: doc,
    window: win,
    Array,
    shareModalRef: { current: modal },
    setShareOpen: (v) => { if (v === false) closed += 1 }
  }
  vm.createContext(sandbox)
  const cleanup = vm.runInContext('(function () { ' + body + ' })()', sandbox, { filename: 'modal-effect.js' })
  return { sandbox, listeners, doc, win, modal, inModal, outside, focusLog, cleanup, closed: () => closed }
}

const keyEvent = (key, extra = {}) => {
  const ev = { key, prevented: false, stopped: false, shiftKey: false, preventDefault() { ev.prevented = true }, stopPropagation() { ev.stopped = true }, ...extra }
  return ev
}

test('Escape closes only the modal and never reaches the host settings dialog', () => {
  const h = loadEffect()
  const entry = h.listeners.keydown
  assert.ok(entry, 'keydown listener registered')
  assert.equal(entry.capture, true, 'must listen in the capture phase to outrank the host')
  const ev = keyEvent('Escape')
  entry.fn(ev)
  assert.equal(h.closed(), 1, 'modal closed')
  assert.ok(ev.stopped, 'stopPropagation keeps the host settings page open')
  assert.ok(ev.prevented, 'preventDefault stops the host default too')
})

test('focus moves into the modal on open and back out on close', () => {
  const h = loadEffect()
  assert.equal(h.doc.activeElement.id, 'code', 'first focusable inside the modal gets focus')
  assert.equal(h.doc.body.style.overflow, 'hidden', 'background scroll locked while open')
  h.cleanup()
  assert.equal(h.doc.body.style.overflow, 'auto', 'previous overflow restored')
  assert.equal(h.doc.activeElement.id, 'outside-button', 'focus returned to the opener')
  assert.equal(h.listeners.keydown, undefined, 'listener removed on cleanup')
})

test('Tab wraps inside the modal in both directions', () => {
  const h = loadEffect()
  const entry = h.listeners.keydown
  const last = h.inModal[h.inModal.length - 1]
  const first = h.inModal[0]

  h.doc.activeElement = last
  const forward = keyEvent('Tab')
  entry.fn(forward)
  assert.ok(forward.prevented, 'forward Tab at the tail is trapped')
  assert.equal(h.doc.activeElement, first, 'wraps to the first control')

  h.doc.activeElement = first
  const backward = keyEvent('Tab', { shiftKey: true })
  entry.fn(backward)
  assert.ok(backward.prevented, 'backward Tab at the head is trapped')
  assert.equal(h.doc.activeElement, last, 'wraps to the last control')

  // focus that escaped the modal is pulled back in
  h.doc.activeElement = h.outside
  const stray = keyEvent('Tab')
  entry.fn(stray)
  assert.ok(stray.prevented, 'stray focus is recaptured')
  assert.equal(h.doc.activeElement, first)
})

test('a mid-list Tab is left to the browser', () => {
  const h = loadEffect()
  h.doc.activeElement = h.inModal[1]
  const ev = keyEvent('Tab')
  h.listeners.keydown.fn(ev)
  assert.ok(!ev.prevented, 'normal tabbing inside the modal is not hijacked')
})

test('other keys are ignored', () => {
  const h = loadEffect()
  const ev = keyEvent('Enter')
  h.listeners.keydown.fn(ev)
  assert.equal(h.closed(), 0)
  assert.ok(!ev.stopped && !ev.prevented)
})

test('wiring: dialog semantics, in-modal error slot and honest clipboard', () => {
  assert.ok(src.includes('role: "dialog"'), 'modal exposes role=dialog')
  assert.ok(src.includes('"aria-modal": true'), 'modal is marked aria-modal')
  assert.ok(src.includes('"aria-label": t("shareTitle")'), 'modal is labelled')
  assert.ok(src.includes('ref: shareModalRef'), 'focus trap has a root to query')
  assert.ok(src.includes('className: "dsh-wc-modal-error", role: "alert"'), 'errors render inside the modal as an alert')
  assert.ok(!/setShareError[\s\S]{0,40}setStatus/.test(src), 'share errors do not go to the hidden status bar')
  // every import failure path must surface in the modal
  const importFn = src.slice(src.indexOf('const runShareImport ='), src.indexOf('(0, _react.useEffect)(() => {\n\tif (!shareOpen) return;\n\tconst previousFocus'))
  assert.ok(importFn.includes('setShareError(t("shareInvalid"))'), 'invalid code reports inside the modal')
  assert.ok(!importFn.includes('setStatus({ kind: "err"'), 'import failures no longer go to the obscured status bar')
  assert.ok(importFn.includes('setStatus({ kind: "ok"'), 'success still reports after the modal closes')
  assert.equal((importFn.match(/setShareError\(t\("shareInvalid"\)\)/g) || []).length, 3, 'all three failure paths report')
  // clipboard: the legacy path must report failure instead of claiming success
  const copyFn = src.slice(src.indexOf('const copyShareCode ='), src.indexOf('const runShareImport ='))
  assert.ok(copyFn.includes('ok = document.execCommand("copy")'), 'execCommand result is actually read')
  assert.ok(copyFn.includes('if (!ok) setShareError(t("shareCopyFailed"))'), 'failure is reported')
  assert.ok(copyFn.includes('position:fixed;left:-9999px'), 'the fallback textarea is off-screen')
  assert.ok(src.includes('function portalModal(node)'), 'modal can portal out of a transformed ancestor')
  assert.ok(src.includes('shareOpen ? portalModal('), 'the modal actually uses the portal helper')
})

test('locale: the new copy-failure key exists in both languages', () => {
  assert.ok(src.includes('"shareCopyFailed": "复制失败，请手动选中分享码复制"'), 'zh copy')
  assert.ok(/"shareCopyFailed": "Copy failed/.test(src), 'en copy')
})

test('decode rejects oversized and non-UTF8 payloads before touching storage', () => {
  assert.ok(src.includes('const SHARE_CODE_MAX = 65536;'), 'size bound declared')
  const fn = src.slice(src.indexOf('function decodeSkinShare(raw)'), src.indexOf('function WechatSkinRow('))
  assert.ok(fn.includes('if (text.length > SHARE_CODE_MAX) throw'), 'bound enforced before parsing')
  assert.ok(src.includes('new TextDecoder("utf-8", { fatal: true })'), 'invalid UTF-8 is rejected, not silently replaced')
})