// Guards the visual-diff maths in png.mjs. The suite once reported a changed
// fraction where a percentage was expected, which made the 0.15% gate 100x too
// loose: a real 14% drift would have passed. These assertions pin the unit.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'
import { diffPng } from './png.mjs'

const tmp = mkdtempSync(join(os.tmpdir(), 'sone-png-test-'))

const crcTable = (() => {
  const t = new Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc = (buf) => {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type, 'ascii')
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, c])
}
/** Write a plain RGB PNG; `paint(x,y)` returns [r,g,b]. */
function writePng(file, w, h, paint) {
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y)
      const o = y * (1 + w * 3) + 1 + x * 3
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ])
  )
}

const W = 100, H = 100
const flat = join(tmp, 'flat.png')
const same = join(tmp, 'same.png')
const block = join(tmp, 'block.png')
writePng(flat, W, H, () => [237, 237, 237])
writePng(same, W, H, () => [237, 237, 237])
// 10x10 red square on grey: 100 of 10000 px = exactly 1%
writePng(block, W, H, (x, y) => (x < 10 && y < 10 ? [255, 0, 0] : [237, 237, 237]))

test('identical images report zero drift', () => {
  assert.deepEqual(diffPng(flat, same), { pct: 0, max: 0 })
})

test('pct is a percentage, not a fraction', () => {
  const r = diffPng(block, flat)
  assert.equal(r.pct, 1, '100 of 10000 pixels changed must read as 1%, got ' + r.pct)
  assert.ok(r.max > 100, 'peak luminance delta should be large, got ' + r.max)
})

test('a 15% drift trips the suite gate (pct <= 0.15 means unchanged)', () => {
  const drift = join(tmp, 'drift.png')
  // 38 x 40 = 1520 of 10000 px = 15.2%
  writePng(drift, W, H, (x, y) => (x < 38 && y < 40 ? [255, 0, 0] : [237, 237, 237]))
  const r = diffPng(drift, flat)
  assert.ok(r.pct > 0.15, '15.2% must exceed the gate, got ' + r.pct)
})

test('size mismatch and missing files are reported, not crashed', () => {
  const small = join(tmp, 'small.png')
  writePng(small, 10, 10, () => [0, 0, 0])
  assert.ok(Array.isArray(diffPng(small, flat).size))
  assert.equal(diffPng(join(tmp, 'nope.png'), flat).missing, true)
})