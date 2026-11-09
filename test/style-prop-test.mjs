// 静态守卫：style 属性必须是对象映射，不能是字符串。
// 曾经 styles.dot + " opacity:.5" 把对象拼成 "[object Object] opacity:.5"，
// 触发 React minified error #62（设置页整段渲染崩溃）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');

const problems = [];
const re = /style:\s*([^,\n]+)/g;
let m;
while ((m = re.exec(src))) {
  const expr = m[1].trim();
  const line = src.slice(0, m.index).split('\n').length;
  const literal = /^(["'])/.test(expr);
  const concat = /\+/.test(expr) && /["']/.test(expr);
  if (concat && !literal) problems.push({ line, expr: expr.slice(0, 120) });
}

if (problems.length) {
  console.error('style prop 非对象：');
  for (const p of problems) console.error(`  client.js:${p.line}  ${p.expr}`);
  process.exit(1);
}
console.log('style-prop-test OK');