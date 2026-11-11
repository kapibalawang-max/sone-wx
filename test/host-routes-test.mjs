// Exercises the real host routes in index.js against a temp DSH_HOME: the fence,
// the image magic-number checks, atomic writes, the state lock and the diag cap.
// Nothing here mocks the handler — only the socket and the web server around it.
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apply } from '../index.js';

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sone-wx-routes-'));
const routes = new Map();
const ctx = {
  get(name) {
    if (name === 'dshHomePath') return (...parts) => path.join(home, ...parts);
    return undefined; // no connection service: exercise the fallback fence
  },
  effect(fn) { fn(); return () => {}; },
  webServer: { register(route) { routes.set(route.path, route); return () => {}; } },
};
process.env.DSH_HOME = home;
apply(ctx);

function call(routePath, { method = 'GET', headers = {}, body = null, remote = '127.0.0.1' } = {}) {
  const route = routes.get(routePath);
  if (!route) throw new Error('route not registered: ' + routePath);
  const req = new EventEmitter();
  req.method = method;
  req.socket = { remoteAddress: remote };
  req.headers = { host: '127.0.0.1:58220', ...headers };
  req.destroy = () => {};
  const res = {
    status: 0, headers: {}, chunks: [], headersSent: false, finished: null,
    writeHead(status, h) { this.status = status; this.headers = h || {}; this.headersSent = true; },
    end(chunk) { if (chunk) this.chunks.push(Buffer.from(chunk)); this.finished(); },
    once(ev, fn) { if (ev === 'finish') this.onFinish = fn; },
  };
  const done = new Promise((resolve) => { res.finished = () => resolve(res); });
  route.handler(req, res);
  queueMicrotask(() => {
    if (body !== null) req.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body));
    req.emit('end');
  });
  return done;
}
const json = (res) => JSON.parse(Buffer.concat(res.chunks).toString('utf8'));
const write = (payload, extra = {}) => call('/sone-wx/brand', {
  method: 'POST', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'application/json', ...extra },
  body: JSON.stringify(payload),
});

const PNG = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(64, 7)]);
const fails = [];
const check = (name, ok, detail) => { if (!ok) fails.push(name + (detail ? ' — ' + detail : '')); };

// --- fence ---
let r = await call('/sone-wx/brand');
check('GET 默认状态', r.status === 200 && json(r).heroMark === true, JSON.stringify(json(r)).slice(0, 120));
r = await call('/sone-wx/brand', { remote: '10.0.0.9' });
check('非 loopback 403', r.status === 403, String(r.status));
r = await call('/sone-wx/brand', { headers: { host: 'evil.example.com' } });
check('DNS rebinding（Host 非本机）403', r.status === 403, String(r.status));
r = await write({ title: 'x' }, { origin: undefined });
check('写请求缺 Origin 403', r.status === 403, String(r.status));
r = await write({ title: 'x' }, { origin: 'http://evil.example.com' });
check('写请求跨源 403', r.status === 403, String(r.status));
r = await call('/sone-wx/brand/mark', { headers: { host: 'localhost:58220' } });
check('图片 GET 无 Origin 也放行（localhost）', r.status === 404, String(r.status));
r = await call('/sone-wx/brand', { method: 'PATCH' });
check('未支持方法 405', r.status === 405, String(r.status));

// --- state ---
r = await write({ title: '  你好  ', heroMark: false });
check('POST 保存并 trim', r.status === 200 && json(r).title === '你好' && json(r).heroMark === false);
r = await write({ title: 'x'.repeat(80) });
check('标题截断 40 字', json(r).title.length === 40, String(json(r).title.length));
r = await write({ title: 123 });
check('非法字段保留原值', json(r).title.length === 40);
r = await call('/sone-wx/brand', { method: 'POST', headers: { origin: 'http://127.0.0.1:58220' }, body: '{oops' });
check('坏 JSON 400', r.status === 400 && json(r).error === 'bad_json', String(r.status));
r = await call('/sone-wx/brand', { method: 'POST', headers: { origin: 'http://127.0.0.1:58220' }, body: JSON.stringify({ title: 'y', pad: 'z'.repeat(17 * 1024) }) });
check('超限 413（不是 400）', r.status === 413 && json(r).error === 'too_large', String(r.status));

// two concurrent writes must both land
await Promise.all([write({ wordmarkImage: true }), write({ heroMark: false })]);
r = await call('/sone-wx/brand');
const st = json(r);
check('并发写不丢更新', st.wordmarkImage === true && st.heroMark === false, JSON.stringify(st));

// --- images ---
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/gif' }, body: PNG });
check('未知类型 415', r.status === 415, String(r.status));
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/png' }, body: Buffer.from('not a png') });
check('魔数不符 400', r.status === 400 && json(r).error === 'bad_image', String(r.status));
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/svg+xml' }, body: '<html><body>hi</body></html>' });
check('伪装 SVG 400', r.status === 400, String(r.status));
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/png' }, body: PNG });
check('合法 PNG 200', r.status === 200 && json(r).mark !== null, String(r.status));
r = await call('/sone-wx/brand/mark');
check('图片回读带 CSP sandbox', r.status === 200 && /sandbox/.test(r.headers['content-security-policy'] || '') && !/allow-scripts/.test(r.headers['content-security-policy'] || ''));
check('图片字节一致', Buffer.concat(r.chunks).equals(PNG));
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/svg+xml' }, body: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' });
check('换类型清掉旧扩展名', r.status === 200 && !fs.existsSync(path.join(home, 'sone-wx/brand/mark.png')));
r = await call('/sone-wx/brand/mark', { method: 'DELETE', headers: { origin: 'http://127.0.0.1:58220' } });
check('DELETE 200', r.status === 200, String(r.status));
r = await call('/sone-wx/brand/mark');
check('删后 404', r.status === 404, String(r.status));
await call('/sone-wx/brand/wordmark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/png' }, body: PNG });
await write({ wordmarkImage: true });
r = await call('/sone-wx/brand/wordmark', { method: 'DELETE', headers: { origin: 'http://127.0.0.1:58220' } });
check('删文字标志同时关掉开关', json(r).wordmarkImage === false);

// --- diag ---
for (let i = 0; i < 35; i += 1) {
  await call('/sone-wx/diag', { method: 'POST', headers: { origin: 'http://127.0.0.1:58220' }, body: JSON.stringify({ msg: 'e' + i }) });
}
r = await call('/sone-wx/diag');
const entries = json(r).entries;
check('diag 上限 30 条', entries.length === 30, String(entries.length));
check('diag 保留最新', entries[entries.length - 1].msg === 'e34', entries[entries.length - 1].msg);
r = await call('/sone-wx/diag', { method: 'POST', headers: { origin: 'http://127.0.0.1:58220' }, body: JSON.stringify({ msg: 'ok' }) });
check('diag 写成功回 ok:true', json(r).ok === true);

// --- no absolute paths on the wire ---
const brand = path.join(home, 'sone-wx/brand');
fs.rmSync(brand, { recursive: true, force: true });
fs.writeFileSync(brand, 'blocked');
r = await call('/sone-wx/brand/mark', { method: 'PUT', headers: { origin: 'http://127.0.0.1:58220', 'content-type': 'image/png' }, body: PNG });
check('IO 失败回结构化 500', r.status === 500 && json(r).error === 'io', JSON.stringify(json(r)));
check('错误不回显绝对路径', !Buffer.concat(r.chunks).toString('utf8').includes(home));

fs.rmSync(home, { recursive: true, force: true });
if (fails.length) { console.error('host-routes-test FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('host-routes-test OK（27 项）');