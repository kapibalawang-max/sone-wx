// New-session tagline: the custom headline text must land on the host's
// titleGroup first span (classless), never on the preview badge, and an empty
// tagline must restore the official wording recorded in dataset.
import fs from 'node:fs';
import path from 'node:path';
import nodevm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'client.js'), 'utf8');
const hostSrc = fs.readFileSync(path.join(here, '..', 'index.js'), 'utf8');
let fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

// --- extract applyHeroTagline verbatim ---------------------------------------
const at = src.indexOf('function applyHeroTagline');
check(at > 0, 'applyHeroTagline missing');
let depth = 0, i = src.indexOf('{', at), end = -1;
for (let j = i; j < src.length; j++) {
  if (src[j] === '{') depth++;
  else if (src[j] === '}') { depth--; if (depth === 0) { end = j + 1; break; } }
}
check(end > at, 'applyHeroTagline braces unbalanced');
const sandbox = { String };
nodevm.createContext(sandbox);
nodevm.runInContext(src.slice(at, end), sandbox);
const applyHeroTagline = sandbox.applyHeroTagline;

// --- minimal DOM stub ---------------------------------------------------------
function makeNode(tagName, className, text) {
  return { tagName, className, textContent: text, dataset: {} };
}
function makeHero() {
  const headline = makeNode('SPAN', '', '探索未至之境');
  const badge = makeNode('SPAN', 'AbCdEf_previewBadge', '预览版');
  const group = { firstElementChild: headline };
  const doc = { querySelectorAll: (sel) => (sel.includes('_titleGroup') ? [group] : []) };
  return { doc, headline, badge };
}

// set: replaces text, records the official wording, marks the node
{
  const { doc, headline } = makeHero();
  const changed = applyHeroTagline(doc, '今天想造点什么');
  check(changed === 1, `set: changed=${changed}`);
  check(headline.textContent === '今天想造点什么', 'set: text not replaced');
  check(headline.dataset.dshWcHeroDefault === '探索未至之境', 'set: official wording not recorded');
  check(headline.dataset.dshWcTagline === '1', 'set: mark missing');
}
// idempotent: same tagline again changes nothing and keeps the original backup
{
  const { doc, headline } = makeHero();
  applyHeroTagline(doc, '同一条标语');
  const changed = applyHeroTagline(doc, '同一条标语');
  check(changed === 0, `idempotent: changed=${changed}`);
  check(headline.dataset.dshWcHeroDefault === '探索未至之境', 'idempotent: backup overwritten');
}
// switching taglines keeps the ORIGINAL host wording as the restore source
{
  const { doc, headline } = makeHero();
  applyHeroTagline(doc, '第一条');
  applyHeroTagline(doc, '第二条');
  check(headline.dataset.dshWcHeroDefault === '探索未至之境', 'switch: backup drifted');
  check(headline.textContent === '第二条', 'switch: text not updated');
}
// clear: restores the official wording and removes the markers
{
  const { doc, headline } = makeHero();
  applyHeroTagline(doc, '自定义');
  const changed = applyHeroTagline(doc, '');
  check(changed === 1, `clear: changed=${changed}`);
  check(headline.textContent === '探索未至之境', 'clear: official wording not restored');
  check(headline.dataset.dshWcTagline === undefined && headline.dataset.dshWcHeroDefault === undefined, 'clear: markers remain');
}
// empty with no mark: no-op
{
  const { doc, headline } = makeHero();
  const changed = applyHeroTagline(doc, '');
  check(changed === 0, `noop: changed=${changed}`);
  check(headline.textContent === '探索未至之境', 'noop: text touched');
}
// badge (classless check) is never touched
{
  const { doc, badge } = makeHero();
  applyHeroTagline(doc, '自定义');
  check(badge.textContent === '预览版', 'badge: text touched');
  check(badge.dataset.dshWcTagline === undefined, 'badge: marked');
}
// non-span first child is skipped
{
  const div = makeNode('DIV', '', '不是 span');
  const group = { firstElementChild: div };
  const doc = { querySelectorAll: () => [group] };
  const changed = applyHeroTagline(doc, '自定义');
  check(changed === 0 && div.textContent === '不是 span', 'non-span: touched');
}

// --- wiring guards -------------------------------------------------------------
check(src.includes('heroTagline: \'\',') || src.includes("heroTagline: ''"), 'client state.heroTagline missing');
check(src.includes("heroTagline: typeof payload.heroTagline === 'string' ? payload.heroTagline : ''"), 'applyAnswer heroTagline missing');
check(src.includes('stampHeroTagline()'), 'applyAnswer stamp call missing');
check(src.includes('watchHeroTagline()') && src.includes('unwatchHeroTagline()'), 'watch/unwatch wiring missing');
check(src.includes("post({ heroTagline: tagline[0].trim() })"), 'saveTagline post missing');
check(src.includes("post({ title: '', wordmarkImage: false, heroMark: true, heroTagline: '' })"), 'resetBrand heroTagline missing');
check(src.includes("tagline: '新会话标语'") && src.includes("tagline: 'New-session tagline'"), 'TEXT tagline keys missing');
check(src.includes('maxLength: MAX_TAGLINE'), 'tagline input maxLength missing');

check(hostSrc.includes("heroTagline: ''"), 'index DEFAULT_STATE heroTagline missing');
check(hostSrc.includes("raw.heroTagline"), 'index readState heroTagline missing');
check(hostSrc.includes('heroTagline: state.heroTagline'), 'index answer heroTagline missing');
check(hostSrc.includes("payload.heroTagline"), 'index POST heroTagline missing');
check(hostSrc.includes('MAX_TAGLINE_CHARS = 40'), 'index MAX_TAGLINE_CHARS missing');

if (fails.length) {
  console.error('brand-tagline FAIL\n' + fails.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('brand-tagline OK');
