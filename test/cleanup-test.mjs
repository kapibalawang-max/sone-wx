/**
 * Cleanup guard: every body dataset flag the plugin sets must be cleared on
 * unload, and the two font-scale CSS variables must be removed as well.
 * Static check (no DOM) so it stays cheap and runs in run-all.
 */
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(path.join(import.meta.dirname, '..', 'client.js'), 'utf8');
const start = src.lastIndexOf('ctx.effect(() => () => {');
const end = src.indexOf('}, "sone-wx: skin cleanup");', start);
const cleanup = src.slice(start, end);

const flags = new Set([...src.matchAll(/document\.body\.dataset\.([A-Za-z]+)\s*=/g)].map((m) => m[1]));
const cleared = new Set([...cleanup.matchAll(/"([A-Za-z]+)"/g)].map((m) => m[1]));
const loose = new Set([...cleanup.matchAll(/dataset\.([A-Za-z]+)/g)].map((m) => m[1]));

const missing = [...flags].filter((f) => !cleared.has(f) && !loose.has(f));
const vars = ['--dsh-wechat-font-scale', '--dsh-wechat-text-scale', '--dsh-user-avatar', '--dsh-assistant-avatar', '--dsh-wc-sidebar-color'];
const unremoved = vars.filter((v) => !cleanup.includes(`removeProperty("${v}")`));

let failed = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failed += 1; };
ok(flags.size >= 10, `found ${flags.size} dataset flags`);
ok(missing.length === 0, `every dataset flag is cleared on unload${missing.length ? ': missing ' + missing.join(', ') : ''}`);
ok(unremoved.length === 0, `font/avatar CSS variables are removed${unremoved.length ? ': missing ' + unremoved.join(', ') : ''}`);
ok(!cleanup.includes('dshWechatTail'), 'no stale flag from the removed tail feature');

// resetSkin must remove every key listed in CONFIG_SKIN_KEYS
const consoleKeys = src.slice(src.indexOf('const CONFIG_SKIN_KEYS = ['), src.indexOf('];', src.indexOf('const CONFIG_SKIN_KEYS = [')));
const configKeys = [...consoleKeys.matchAll(/\b([A-Z][A-Z0-9_]+_(?:KEY|KEYS))\b/g)].map((m) => m[1]);
const resetStart = src.indexOf('resetSkin: () => {');
const resetEnd = src.indexOf('sync();', resetStart);
const resetBlock = src.slice(resetStart, resetEnd);
const removed = new Set([...resetBlock.matchAll(/removeItem\(([A-Z0-9_]+)\)/g)].map((m) => m[1]));
const notReset = [...new Set(configKeys)].filter((k) => k !== 'CONFIG_SKIN_KEYS' && k !== 'CUSTOM_PRESETS_KEY' && !removed.has(k));
ok(notReset.length === 0, `resetSkin clears every CONFIG_SKIN_KEYS entry${notReset.length ? ': missing ' + notReset.join(', ') : ''}`);
console.log(`${5 - failed}/5 OK`);
process.exit(failed ? 1 : 0);
