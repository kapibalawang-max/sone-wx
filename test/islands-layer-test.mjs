// 结构层（浮岛布局）接线守卫：样式来源、开关真源、store 同步、设置行与重置路径。
// 结构层的实现是 vendored 第三方代码（dsh-islands-ui, MIT），这里只钉住
// 「它真的被接进来」以及「开关只有一条真源」，不重复测它的内部行为。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(path.join(root, 'client.js'), 'utf8');
const cssStart = src.indexOf('const ISLANDS_CSS = `');
const cssEnd = src.indexOf('`;', cssStart);
const islandsCss = src.slice(cssStart, cssEnd);

test('构建产物：结构与样式都内联进 client.js', () => {
  assert.ok(src.includes('function createSoneIslandsLayer(require, host)'), 'layer source inlined');
  assert.ok(src.includes('islands.apply(ctx)'), 'layer mounted from apply()');
  assert.ok(islandsCss.length > 60000, `islands css inlined (${islandsCss.length}b)`);
  assert.ok(/const ISLANDS_CSS_VARIANTS = \{/.test(src), 'dialect map inlined');
});

test('构建产物与 src 一致（build --check）', () => {
  const out = execFileSync(process.execPath, [path.join(root, 'build.mjs'), '--check'], { encoding: 'utf8' });
  assert.match(out, /up to date/);
});

test('样式只挂在结构层属性上，不再引用上游属性名', () => {
  assert.ok(islandsCss.includes('body[data-dsh-wc-islands]'), 'scoped to our attribute');
  assert.ok(!islandsCss.includes('data-islands-ui'), 'upstream attribute renamed away');
});

test('令牌桥接：结构层不再自带一套颜色', () => {
  assert.match(islandsCss, /--isl-canvas:\s*var\(--wc-bg/, 'canvas follows skin bg');
  assert.match(islandsCss, /--isl-accent:\s*var\(--wc-accent-solid/, 'accent follows skin accent');
  assert.match(islandsCss, /--isl-radius-xl:\s*var\(--wc-radius-card/, 'radius follows skin radius');
  assert.ok(!/--isl-canvas:\s*#/.test(islandsCss), 'no hard-coded canvas color');
});

test('开关真源在宿主：结构层读写都回到 sone-wx 的键', () => {
  assert.ok(src.includes('const ISLANDS_KEY = "dsh-wechat-skin:islands"'), 'key declared');
  assert.ok(src.includes('readEnabled: () => readJson(ISLANDS_KEY, true) !== false'), 'layer reads host value');
  assert.ok(src.includes('writeEnabled: (value) => writeJson(ISLANDS_KEY, value === true)'), 'layer writes host value');
  assert.match(src, /host\.readEnabled/, 'layer consults host');
  assert.match(src, /host\.writeEnabled/, 'layer reports back to host');
});

test('store 与设置行', () => {
  assert.match(src, /function createStore\(.*initialIslands\)/, 'createStore takes the flag');
  assert.match(src, /sync: \(d,.*islands\) =>/, 'sync takes the flag');
  assert.ok(src.includes('d.islands = islands;'), 'sync writes it');
  assert.ok(src.includes('const islands = useStore((s) => s.islands) !== false;'), 'row reads it');
  assert.ok(src.includes('title: t("islandsTitle")'), 'settings row wired');
  assert.ok(src.includes('setIslands: (on) => {'), 'injected setter');
  assert.ok(src.includes('"islandsTitle": "浮岛布局"') && src.includes('"islandsTitle": "Island layout"'), 'bilingual copy');
});

test('导出、导入与重置路径', () => {
  assert.match(src, /COMPOSER_FX_KEY, RIGHTBAR_AUTO_KEY, ISLANDS_KEY, CUSTOM_PRESETS_KEY\]/, 'exported in config');
  assert.ok(src.includes('const importedIslands = importedValue(ISLANDS_KEY);'), 'import validates');
  assert.match(src, /\[ISLANDS_KEY, islandsOn\]/, 'import writes canonical value');
  assert.ok(src.includes('window.localStorage.removeItem(ISLANDS_KEY);'), 'reset clears the key');
  assert.ok(src.includes('islandsOn = true; writeJson(ISLANDS_KEY, true);'), 'reset restores default');
});

test('结构层设置分区排在本分区之后', () => {
  assert.ok(src.includes("id: 'sone-wx-islands', order: 51, label: '浮岛布局'"), 'own section, own order');
});
