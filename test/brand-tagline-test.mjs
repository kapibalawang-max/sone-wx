// New-session tagline: the custom slogan lives in the body CSS variable
// --dsh-wc-hero-tagline (JSON string) and is rendered by WECHAT_CSS as an
// ::after under the hero headline. body is outside React's jurisdiction, so
// nothing gets inserted/rewritten inside React-managed DOM (that used to make
// title and slogan stack on top of each other). Clearing removes the variable.
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

// --- minimal DOM stub ---------------------------------------------------------
function makeStyleStore() {
  const props = {};
  return {
    props,
    getPropertyValue: (k) => (k in props ? props[k] : ''),
    setProperty: (k, v) => { props[k] = String(v) },
    removeProperty: (k) => { delete props[k] },
  };
}
const bodyStyle = makeStyleStore();
const bodyAttrs = {};
const sandbox = {
  String,
  document: {
    body: {
      style: bodyStyle,
      getAttribute: (k) => (k in bodyAttrs ? bodyAttrs[k] : null),
      setAttribute: (k, v) => { bodyAttrs[k] = String(v) },
      removeAttribute: (k) => { delete bodyAttrs[k] },
    },
  },
};
nodevm.createContext(sandbox);
nodevm.runInContext(src.slice(at, end), sandbox);
const applyHeroTagline = sandbox.applyHeroTagline;
const KEY = '--dsh-wc-hero-tagline';

// set: writes the JSON-quoted slogan into the body variable
{
  const changed = applyHeroTagline(null, '今天想造点什么');
  check(changed === 1, `set: changed=${changed}`);
  check(bodyStyle.props[KEY] === JSON.stringify('今天想造点什么'), 'set: variable missing/wrong');
  check(bodyAttrs['data-dsh-wc-tagline-set'] === '1', 'set: body switch flag missing');
}
// idempotent: same tagline again changes nothing
{
  applyHeroTagline(null, '今天想造点什么');
  const changed = applyHeroTagline(null, '今天想造点什么');
  check(changed === 0, `idempotent: changed=${changed}`);
}
// switching taglines updates the variable
{
  applyHeroTagline(null, '第一条');
  const changed = applyHeroTagline(null, '第二条');
  check(changed === 1, `switch: changed=${changed}`);
  check(bodyStyle.props[KEY] === JSON.stringify('第二条'), 'switch: variable not updated');
}
// clear: removes the variable
{
  applyHeroTagline(null, '自定义');
  const changed = applyHeroTagline(null, '');
  check(changed === 1, `clear: changed=${changed}`);
  check(bodyStyle.props[KEY] === undefined, 'clear: variable still present');
  check(bodyAttrs['data-dsh-wc-tagline-set'] === undefined, 'clear: switch flag still present');
}
// empty with no variable: no-op
{
  const changed = applyHeroTagline(null, '');
  check(changed === 0, `noop: changed=${changed}`);
  check(Object.keys(bodyStyle.props).length === 0, 'noop: variables written');
}
// whitespace-only tagline counts as empty
{
  applyHeroTagline(null, '自定义');
  applyHeroTagline(null, '   ');
  check(bodyStyle.props[KEY] === undefined, 'whitespace: variable still present');
  check(bodyAttrs['data-dsh-wc-tagline-set'] === undefined, 'whitespace: switch flag still present');
}
// tagline is trimmed and JSON-quoted (quotes/newlines stay safe inside var())
{
  applyHeroTagline(null, '  两边空白  ');
  check(bodyStyle.props[KEY] === JSON.stringify('两边空白'), 'trim: not trimmed');
  applyHeroTagline(null, '带"引号"的标语');
  check(bodyStyle.props[KEY] === JSON.stringify('带"引号"的标语'), 'quote: not JSON-escaped');
}

// --- wiring guards -------------------------------------------------------------
check(src.includes("heroTagline: ''"), 'client state.heroTagline missing');
check(src.includes("heroTagline: typeof payload.heroTagline === 'string' ? payload.heroTagline : ''"), 'applyAnswer heroTagline missing');
check(src.includes('stampHeroTagline()'), 'applyAnswer stamp call missing');
check(!src.includes('watchHeroTagline') && !src.includes('unwatchHeroTagline'), 'observer wiring should be gone');
check(src.includes("post({ heroTagline: tagline[0].trim() })"), 'saveTagline post missing');
check(src.includes("post({ title: '', wordmarkImage: false, heroMark: true, heroTagline: '' })"), 'resetBrand heroTagline missing');
check(src.includes("tagline: '新会话标语'") && src.includes("tagline: 'New-session tagline'"), 'TEXT tagline keys missing');
check(src.includes('maxLength: MAX_TAGLINE'), 'tagline input maxLength missing');
check(src.includes('[data-dsh-wc-tagline-set="1"] [class*="_titleGroup"] > span:not([class])::after'), 'tagline CSS ::after rule missing');
check(src.includes('[data-dsh-wc-tagline-set="1"] [class*="_titleGroup"] > span:not([class]) {'), 'tagline CSS hide rule missing');
check(src.includes("body.setAttribute('data-dsh-wc-tagline-set', '1')"), 'applyHeroTagline does not set the body switch');
check(src.includes("document.body.removeAttribute('data-dsh-wc-tagline-set')"), 'applyHeroTagline does not clear the body switch');
check(src.includes('var(--dsh-wc-hero-tagline, none)'), 'tagline CSS var fallback missing');
check(src.includes('[class*="_headline"] [class*="_previewBadge"]'), 'preview badge hide rule missing');
check(src.includes('[class*="_headline"] [class*="_previewBadge"] {\n  display: none !important;'), 'preview badge must be display:none');
check(!src.includes('dshWcHeroDefault'), 'old headline-rewrite mechanism still present');
check(!src.includes("el.className = 'dsh-wc-hero-tagline'"), 'old element-insertion mechanism still present');

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
