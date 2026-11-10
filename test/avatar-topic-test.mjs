#!/usr/bin/env node
/**
 * Avatar palette guard: twelve presets, topic words beat the hash, unknown titles stay stable.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8');
const grab = (name) => {
  const i = src.indexOf('function ' + name + '(');
  let depth = 0;
  const j = src.indexOf('{', i);
  for (let k = j; k < src.length; k += 1) {
    if (src[k] === '{') depth += 1;
    else if (src[k] === '}') { depth -= 1; if (!depth) return src.slice(i, k + 1); }
  }
  throw new Error('missing ' + name);
};
const paletteStart = src.indexOf('const AVATAR_PALETTE');
const paletteEnd = src.indexOf('];', paletteStart) + 2;
const topicsStart = src.indexOf('const AVATAR_TOPICS');
const topicsEnd = src.indexOf('];', topicsStart) + 2;
const code = src.slice(paletteStart, paletteEnd) + '\n' + src.slice(topicsStart, topicsEnd) + '\n'
  + grab('titleHash') + '\n' + grab('paletteForTopic') + '\n' + grab('silhouetteAvatar')
  + '\n' + src.slice(src.indexOf('const PLACEHOLDER_TITLES'), src.indexOf('];', src.indexOf('const PLACEHOLDER_TITLES')) + 2)
  + '\n' + grab('isPlaceholderTitle') + '\n' + grab('avatarKeyFor');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code + '\n;this.palette=AVATAR_PALETTE;this.topic=(t)=>paletteForTopic(t);this.avatar=(t,i)=>silhouetteAvatar(t,i);this.keyFor=(row,t)=>avatarKeyFor(row,t);this.blank=(t)=>isPlaceholderTitle(t);', ctx);

const fails = [];
const check = (name, ok, detail) => { if (!ok) fails.push(name + (detail ? ' — ' + detail : '')); };

check('12 palette rows', ctx.palette.length === 12, String(ctx.palette.length));
check('每行是 [bg, fg, topic]', ctx.palette.every((row) => row.length === 3 && /^#[0-9a-f]{6}$/i.test(row[0]) && /^#[0-9a-f]{6}$/i.test(row[1])));

const bgs = ctx.palette.map((row) => row[0]);
check('底色不重复', new Set(bgs).size === 12);
const topics = ctx.palette.map((row) => row[2]);
check('topic 覆盖 11 类 + default', topics.filter((t) => t !== 'default').length === 11 && topics.includes('default'));

const cases = [
  ['修复登录态过期', 'repair'],
  ['周报数据核对', 'data'],
  ['重构设置页分组', 'code'],
  ['月度账单核对', 'money'],
  ['周末出行清单', 'life'],
  ['服务监控告警', 'ops'],
  ['登录页改版', 'design'],
  ['需求评审会', 'team'],
  ['旧文档归档', 'archive'],
  ['需求文档草稿', 'writing'],
  ['灵感收集', 'creative'],
];
for (const [title, topic] of cases) {
  const hit = ctx.topic(title);
  check('主题匹配 ' + title + ' → ' + topic, !!hit && hit[2] === topic, hit ? hit[2] : 'none');
}

check('无关键词回落 hash', ctx.topic('a7f3k9 随便') === null);
const a = ctx.avatar('随便聊聊', 0);
const b = ctx.avatar('随便聊聊', 0);
check('同标题稳定', a === b);
check('data URI', a.startsWith('data:image/svg+xml,'));

const used = new Set();
for (const title of ['修复登录态过期', '周报数据核对', '重构设置页分组', '月度账单核对', '周末出行清单', '服务监控告警', '登录页改版', '需求评审会', '旧文档归档', '随手写点东西', '灵感收集']) {
  const svg = decodeURIComponent(ctx.avatar(title, 0).split(',').slice(1).join(','));
  used.add((svg.match(/fill="(#[0-9a-f]{6})"/i) || [])[1]);
}
check('11 个主题落到不同色板', used.size === 11, [...used].join(' '));

const rowOf = (id) => ({ dataset: { rowKey: 'session:' + id } });
check('占位标题按会话 id 取键', ctx.keyFor(rowOf('abc'), '新建会话') === 'session:abc');
check('占位标题英文也认', ctx.blank('New chat') === true && ctx.blank('Untitled') === true);
check('有名字的会话按标题取键', ctx.keyFor(rowOf('abc'), '修复登录态过期') === '修复登录态过期');
check('没有 row 时回落到标题', ctx.keyFor(null, '新建会话') === '新建会话');

const newA = ctx.avatar('session:aaa111', 0);
const newB = ctx.avatar('session:bbb222', 0);
check('两个新会话颜色不同', newA !== newB);
check('新会话同 id 稳定', newA === ctx.avatar('session:aaa111', 0));
check('占位标题退回哈希取色', ctx.avatar('新建会话', 0).startsWith('data:image/svg+xml,'));

if (fails.length) { console.log('FAIL avatar-topic\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log('PASS avatar-topic');
