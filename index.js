/**
 * sone-wx — Host 半（品牌自定义，承接 dsh-brand-studio）
 *
 * 职责：品牌自定义数据的真源与读写接口。
 *   · ~/.dsh/sone-wx/brand/state.json   文字与开关
 *   · ~/.dsh/sone-wx/brand/mark.*       标志图片（png / svg / webp）
 *   · ~/.dsh/sone-wx/brand/wordmark.*   文字标志图片（可选）
 * Client 半通过 /sone-wx/brand 读写，图片再以 URL 引用。
 * 首次启动时若旧插件目录 ~/.dsh/dsh-brand-studio/brand 仍有数据且新目录为空，则整体迁移。
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ROUTE = '/sone-wx/brand'
const IMAGE_PATHS = { mark: `${ROUTE}/mark`, wordmark: `${ROUTE}/wordmark` }
const IMAGE_TYPES = { 'image/png': 'png', 'image/svg+xml': 'svg', 'image/webp': 'webp' }
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MAX_TITLE_CHARS = 40

const SIGNATURES = {
  'image/png': [{ offset: 0, bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) }],
  'image/webp': [{ offset: 0, bytes: Buffer.from('RIFF', 'latin1') }, { offset: 8, bytes: Buffer.from('WEBP', 'latin1') }],
}

const IMAGE_HEADERS = {
  'cache-control': 'no-cache',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  'x-content-type-options': 'nosniff',
}

const DEFAULT_STATE = {
  title: '',
  wordmarkImage: false,
  heroMark: true,
}

export const inject = ['webServer']

function brandDir(ctx) {
  const resolve = ctx.get('dshHomePath')
  if (typeof resolve === 'function') return resolve('sone-wx', 'brand')
  return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'sone-wx', 'brand')
}

function findImage(dir, kind) {
  for (const [type, extension] of Object.entries(IMAGE_TYPES)) {
    const path = join(dir, `${kind}.${extension}`)
    const info = statSync(path, { throwIfNoEntry: false })
    if (info?.isFile() !== true) continue
    return { path, type, state: { type, version: `${Math.round(info.mtimeMs)}-${info.size}` } }
  }
  return null
}

function readState(dir) {
  let raw = null
  try {
    raw = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))
  } catch {
    return { ...DEFAULT_STATE }
  }
  if (raw === null || typeof raw !== 'object') return { ...DEFAULT_STATE }
  return {
    ...DEFAULT_STATE,
    title: typeof raw.title === 'string' ? raw.title.slice(0, MAX_TITLE_CHARS) : '',
    wordmarkImage: raw.wordmarkImage === true,
    heroMark: raw.heroMark !== false,
  }
}

function writeState(dir, state) {
  mkdirSync(dir, { recursive: true })
  const target = join(dir, 'state.json')
  const temporary = tempPath(target)
  writeFileSync(temporary, JSON.stringify(state, null, 2))
  renameSync(temporary, target)
}

function answer(ctx) {
  const dir = brandDir(ctx)
  const state = readState(dir)
  return {
    ok: true,
    title: state.title,
    wordmarkImage: state.wordmarkImage,
    heroMark: state.heroMark,
    mark: findImage(dir, 'mark')?.state ?? null,
    wordmark: findImage(dir, 'wordmark')?.state ?? null,
  }
}

async function saveImage(ctx, kind, req, res) {
  const type = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (IMAGE_TYPES[type] === undefined) {
    sendJson(res, 415, { ok: false, error: 'unsupported_type' })
    return
  }
  const body = await readBody(req, MAX_IMAGE_BYTES)
  if (body === null) {
    res.once('finish', () => req.destroy())
    sendJson(res, 413, { ok: false, error: 'too_large' })
    return
  }
  if (body.length === 0 || !matchesSignature(type, body)) {
    sendJson(res, 400, { ok: false, error: 'bad_image' })
    return
  }
  const dir = brandDir(ctx)
  mkdirSync(dir, { recursive: true })
  const extension = IMAGE_TYPES[type]
  const target = join(dir, `${kind}.${extension}`)
  const temporary = tempPath(target)
  writeFileSync(temporary, body)
  renameSync(temporary, target)
  for (const other of Object.values(IMAGE_TYPES)) {
    if (other !== extension) rmSync(join(dir, `${kind}.${other}`), { force: true })
  }
  sendJson(res, 200, answer(ctx))
}

/** 同一进程内并发写入也要各有各的临时文件。 */
function tempPath(target) {
  return `${target}.${process.pid}.${randomUUID()}.tmp`
}

function matchesSignature(type, bytes) {
  if (type === 'image/svg+xml') return looksLikeSvg(bytes)
  const marks = SIGNATURES[type]
  if (marks === undefined) return true
  return marks.every(({ offset, bytes: expected }) => bytes.subarray(offset, offset + expected.length).equals(expected))
}

/** SVG 没有魔数：只认「可选 XML 声明 / 注释 / DOCTYPE + 根元素是 `<svg`」，拒收被改名成 .svg 的 HTML 或其它文本。 */
function looksLikeSvg(bytes) {
  const head = bytes.subarray(0, Math.min(bytes.length, 4096)).toString('utf8').replace(/^\uFEFF/, '')
  const match = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->[\s]*)*(?:<!DOCTYPE[^>]*>[\s]*)*<svg[\s/>]/i.exec(head)
  return match !== null
}

function readBody(req, limit) {
  return new Promise((settle) => {
    const chunks = []
    let size = 0
    let over = false
    req.on('data', (chunk) => {
      if (over) return
      size += chunk.length
      if (size > limit) {
        over = true
        settle(null)
        return
      }
      chunks.push(Buffer.from(chunk))
    })
    req.on('end', () => {
      if (!over) settle(Buffer.concat(chunks))
    })
    req.on('error', () => {
      if (!over) settle(null)
    })
  })
}

async function readJsonBody(req, limit) {
  const body = await readBody(req, limit)
  if (body === null) return null
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    return null
  }
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload))
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.byteLength),
    'cache-control': 'no-store',
  })
  res.end(body)
}

function methodRefused(req, res, methods) {
  if (req.method === undefined || methods.includes(req.method)) return false
  res.writeHead(405, { allow: methods.join(', ') })
  res.end()
  return true
}

/** 只允许本机同源请求：与宿主 Web GUI 的边界一致。 */
function refusedOf(ctx, req) {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection === 'function') return connection.requestRejection(req)
  if (!isLoopback(req.socket.remoteAddress)) return 403
  const host = req.headers.host
  if (host !== undefined) {
    if (!URL.canParse(`http://${host}`)) return 403
    const origin = req.headers.origin
    if (origin !== undefined) return URL.canParse(origin) && new URL(origin).host === host ? undefined : 403
  }
  return undefined
}

function isLoopback(address) {
  if (address === undefined) return false
  const plain = address.startsWith('::ffff:') ? address.slice(7) : address
  return plain === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(plain)
}

function fenceRefused(ctx, req, res) {
  const refused = refusedOf(ctx, req)
  if (refused === undefined) return false
  sendJson(res, refused, { ok: false, error: refused === 401 ? 'unauthorized' : 'forbidden' })
  return true
}


/** 一次性迁移：旧 dsh-brand-studio 的品牌数据搬到 sone-wx 下（仅在新目录还没有 state.json 时）。 */
function migrateLegacyBrand(ctx) {
  try {
    const target = brandDir(ctx)
    if (existsSync(join(target, 'state.json'))) return
    const legacyRoot = process.env.DSH_HOME ?? join(homedir(), '.dsh')
    const legacy = join(legacyRoot, 'dsh-brand-studio', 'brand')
    if (!existsSync(join(legacy, 'state.json'))) return
    mkdirSync(target, { recursive: true })
    copyFileSync(join(legacy, 'state.json'), join(target, 'state.json'))
    for (const kind of ['mark', 'wordmark']) {
      for (const extension of Object.values(IMAGE_TYPES)) {
        const source = join(legacy, `${kind}.${extension}`)
        if (existsSync(source)) copyFileSync(source, join(target, `${kind}.${extension}`))
      }
    }
  } catch {
    // 迁移失败不阻塞启动：品牌数据缺失时按默认值工作
  }
}

export function apply(ctx) {
  migrateLegacyBrand(ctx)

  const imageRoutes = Object.keys(IMAGE_PATHS).map((kind) => ({
    kind: 'exact',
    path: IMAGE_PATHS[kind],
    handler: (req, res) => {
      if (methodRefused(req, res, ['GET', 'HEAD', 'PUT', 'DELETE'])) return
      if (fenceRefused(ctx, req, res)) return
      if (req.method === 'PUT') {
        void saveImage(ctx, kind, req, res).catch((error) => {
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: String(error?.message ?? error) })
        })
        return
      }
      if (req.method === 'DELETE') {
        const dir = brandDir(ctx)
        for (const extension of Object.values(IMAGE_TYPES)) rmSync(join(dir, `${kind}.${extension}`), { force: true })
        if (kind === 'wordmark') {
          const state = readState(dir)
          if (state.wordmarkImage) writeState(dir, { ...state, wordmarkImage: false })
        }
        return sendJson(res, 200, answer(ctx))
      }
      const found = findImage(brandDir(ctx), kind)
      if (found === null) {
        res.writeHead(404, { 'cache-control': 'no-store' })
        res.end()
        return
      }
      const body = readFileSync(found.path)
      res.writeHead(200, { ...IMAGE_HEADERS, 'content-type': found.type, 'content-length': String(body.byteLength) })
      res.end(req.method === 'HEAD' ? undefined : body)
    },
  }))

  const statusRoute = {
    kind: 'exact',
    path: ROUTE,
    handler: (req, res) => {
      if (methodRefused(req, res, ['GET', 'HEAD', 'POST'])) return
      if (fenceRefused(ctx, req, res)) return
      if (req.method === 'POST') {
        return void readJsonBody(req, 16 * 1024).then((payload) => {
          if (payload === null) return sendJson(res, 400, { ok: false, error: 'bad_json' })
          const dir = brandDir(ctx)
          const current = readState(dir)
          const next = {
            ...current,
            title: typeof payload.title === 'string' ? payload.title.trim().slice(0, MAX_TITLE_CHARS) : current.title,
            wordmarkImage: typeof payload.wordmarkImage === 'boolean' ? payload.wordmarkImage : current.wordmarkImage,
            heroMark: typeof payload.heroMark === 'boolean' ? payload.heroMark : current.heroMark,
          }
          writeState(dir, next)
          sendJson(res, 200, answer(ctx))
        }).catch((error) => {
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: String(error?.message ?? error) })
        })
      }
      // GET：返回当前品牌配置
      sendJson(res, 200, answer(ctx))
    },
  }

  const diagPath = () => join(brandDir(ctx), '..', 'diag.json')
  const diagRoute = {
    kind: 'exact',
    path: '/sone-wx/diag',
    handler: (req, res) => {
      if (methodRefused(req, res, ['GET', 'HEAD', 'POST'])) return
      if (fenceRefused(ctx, req, res)) return
      if (req.method === 'POST') {
        return void readJsonBody(req, 64 * 1024).then((payload) => {
          if (payload === null) return sendJson(res, 400, { ok: false, error: 'bad_json' })
          try {
            mkdirSync(brandDir(ctx), { recursive: true })
            const entries = Array.isArray(payload.entries) ? payload.entries.slice(-20) : [{ t: Date.now(), msg: String(payload.msg ?? '') }]
            writeFileSync(diagPath(), JSON.stringify({ entries }, null, 2))
          } catch {}
          return sendJson(res, 200, { ok: true })
        }).catch((error) => {
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: String(error?.message ?? error) })
        })
      }
      // GET：回读最近一次写入的诊断内容（便于排查）
      try {
        const body = readFileSync(diagPath())
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': String(body.byteLength) })
        res.end(req.method === 'HEAD' ? undefined : body)
      } catch {
        sendJson(res, 200, { entries: [] })
      }
    },
  }

  for (const route of [statusRoute, ...imageRoutes, diagRoute]) {
    ctx.effect(() => ctx.webServer.register(route), `sone-wx: ${route.path}`)
  }
}
