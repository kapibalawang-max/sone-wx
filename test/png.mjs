// Minimal PNG reader + image diff, so the visual suite needs nothing beyond Node.
// Playwright writes 8-bit non-interlaced RGB/RGBA PNGs; that is all we support.
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Decode a PNG file into { width, height, rgb } (rgb = 3 bytes per pixel). */
export function readPng(file) {
  const buf = readFileSync(file)
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG: ' + file)
  let off = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth)
  if (interlace !== 0) throw new Error('interlaced PNG not supported')
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : -1
  if (channels < 0) throw new Error('unsupported colour type ' + colorType)

  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    const line = raw.subarray(pos, pos + stride)
    pos += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= channels ? prev[x - channels] : 0
      let v = line[x]
      switch (filter) {
        case 0: break
        case 1: v = (v + a) & 0xff; break
        case 2: v = (v + b) & 0xff; break
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff
          break
        }
        default: throw new Error('bad filter ' + filter)
      }
      cur[x] = v
    }
  }

  const rgb = Buffer.alloc(width * height * 3)
  for (let i = 0, n = width * height; i < n; i++) {
    if (channels === 1) {
      rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = out[i]
    } else {
      rgb[i * 3] = out[i * channels]
      rgb[i * 3 + 1] = out[i * channels + 1]
      rgb[i * 3 + 2] = out[i * channels + 2]
    }
  }
  return { width, height, rgb }
}

/**
 * Compare two PNGs the way the suite always has: per-pixel channel difference
 * reduced to luminance, then report the share of pixels above 6 and the peak.
 * Returns { missing } | { size } | { pct, max }.
 */
export function diffPng(fileA, fileB) {
  let A, B
  try {
    A = readPng(fileA)
    B = readPng(fileB)
  } catch (err) {
    if (err && err.code === 'ENOENT') return { missing: true }
    throw err
  }
  if (A.width !== B.width || A.height !== B.height) {
    return { size: [[A.width, A.height], [B.width, B.height]] }
  }
  const total = A.width * A.height
  let changed = 0, max = 0
  for (let i = 0; i < total; i++) {
    const j = i * 3
    const dr = Math.abs(A.rgb[j] - B.rgb[j])
    const dg = Math.abs(A.rgb[j + 1] - B.rgb[j + 1])
    const db = Math.abs(A.rgb[j + 2] - B.rgb[j + 2])
    const l = Math.floor((dr * 299 + dg * 587 + db * 114) / 1000)
    if (l >= 7) changed++
    if (l > max) max = l
  }
  // percentage of pixels that changed, rounded to 3 decimals (0.281 means 0.281%)
  return { pct: Math.round((100 * 1000 * changed) / total) / 1000, max }
}