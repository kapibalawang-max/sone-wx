// Settings search + per-row reset wiring (v1.17.0).
// The filter itself runs in the browser; this guard keeps the wiring from silently
// disappearing when the settings card is refactored.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(path.join(root, 'client.js'), 'utf8');
const fails = [];
let checks = 0;
const ok = (name, cond) => { checks++; if (!cond) fails.push(name); };

ok('search input rendered', src.includes('className: "dsh-wc-search-input"'));
ok('search block styled', /body \.dsh-wc-search \{/.test(src));
ok('settings card holds the list ref', src.includes('ref: listRef,'));
ok('rows are tagged for filtering', src.includes('className: "dsh-wc-row"'));
ok('sections are carded groups', (src.match(/\(0, react_jsx_runtime\.jsxs\)\(Group, \{/g) || []).length === 4);
ok('group titles are tagged', (src.match(/dsh-wc-group-title/g) || []).length >= 1);
ok('empty groups collapse', src.includes('card.style.display = hitRow ? "" : "none";'));
ok('filter hides non-matching rows', src.includes('rowEl.style.display = hit ? "" : "none";'));
ok('empty state wired', src.includes('className: "dsh-wc-empty"'));
ok('per-row reset on every settable row', (src.match(/resetLabel: t\("rowReset"\)/g) || []).length === 13);
ok('reset button hover-revealed', /body \.dsh-wc-row:hover \.dsh-wc-reset/.test(src));
ok('zh has search copy', src.includes('"searchSettings": "搜索设置"'));
ok('en has search copy', src.includes('"searchSettings": "Search settings"'));
ok('no-match copy in both locales', src.includes('"noMatch": "没有匹配的设置"') && src.includes('"noMatch": "No matching setting"'));

if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log(`settings-search: ${checks}/${checks} OK`);
