// Plugin rows in the sidebar read as one loose stack after the button chrome is
// gone. Guard the tightened density (32px rows, 1px gaps) and that the rail
// variant is not touched.
import fs from 'node:fs';
const src = fs.readFileSync('/Users/user/.dsh/local-plugins/sone-wx/client.js', 'utf8');
const css = (() => {
  const i = src.indexOf('const WECHAT_CSS = `');
  const j = src.indexOf('`;', i);
  return src.slice(i + 'const WECHAT_CSS = `'.length, j);
})();
const rule = (selector) => {
  const at = css.lastIndexOf(selector + ' {');
  if (at < 0) return '';
  return css.slice(at, css.indexOf('}', at));
};
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
const row = rule('body.dsh-wechat-skin-on .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow');
ok(/min-height:\s*32px/.test(row), 'plugin row is 32px tall');
ok(/padding-top:\s*5px/.test(row) && /padding-bottom:\s*5px/.test(row), 'row padding trimmed to 5px');
const list = rule('body.dsh-wechat-skin-on .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList');
ok(/gap:\s*1px/.test(list), 'list gap is 1px');
ok(/margin-bottom:\s*6px/.test(list), 'list leaves 6px under it');
ok(!/\.kB3qhq_collapsed \.kB3qhq_panelRow\s*\{/.test(css), 'collapsed rail rows are not overridden');
const proj = rule('body.dsh-wechat-skin-on .JoiKIa_projectRow');
ok(/height:\s*32px/.test(proj), 'project header row is 32px');
const projTitle = rule('body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_title');
ok(/font-size:\s*13px/.test(projTitle) && /line-height:\s*18px/.test(projTitle), 'project title is 13/18');
const projMeta = rule('body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_meta');
ok(/font-size:\s*12px/.test(projMeta) && /line-height:\s*14px/.test(projMeta), 'project path is 12/14');
const ns = rule('body.dsh-wechat-skin-on .kB3qhq_newSession');
ok(/height:\s*32px/.test(ns), 'new-session row matches at 32px');
console.log(`panel-density-test ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
