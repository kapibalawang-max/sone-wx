// Contrast sweep: render the real skin CSS over a fixture that covers every surface
// the skin paints, then measure every visible text node against its composited
// background in all four theme combinations. Catches the "one unreadable line in
// dark mode" class of bug (v1.34.6) automatically instead of by eye.
//
// Host token values are the resolved ones from @deepseek-ai/dsh-client-ui-theme
// (static-neutral-bluish scale), so the measurement matches the app.
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from './browser.mjs'

execFileSync(process.execPath, [new URL('./extract-css.mjs', import.meta.url).pathname], { stdio: 'ignore' });
const css = readFileSync('/tmp/sone-css.css', 'utf8');

const HOST_LIGHT = {
  '--dsw-alias-label-primary': '#0f1115',
  '--dsw-alias-label-secondary': '#61666b',
  '--dsw-alias-label-tertiary': '#81858c',
  '--dsw-alias-bg-base': '#ffffff',
  '--dsw-alias-bg-module-platform': '#f9fafb',
  '--dsw-alias-bg-layer-2': '#ffffff',
  '--dsw-alias-border-l2': '#0000001a',
  '--dsw-alias-border-l3': '#0000001f',
  '--dsw-alias-interactive-bg-hover': '#2631480f',
  '--dsw-specific-sidebar-fill': '#f1f3f5',
};
const HOST_DARK = {
  '--dsw-alias-label-primary': '#f9fafb',
  '--dsw-alias-label-secondary': '#cfd3d6',
  '--dsw-alias-label-tertiary': '#adb2b8',
  '--dsw-alias-bg-base': '#151517',
  '--dsw-alias-bg-module-platform': '#353638',
  '--dsw-alias-bg-layer-2': '#2c2c2e',
  '--dsw-alias-border-l2': '#ffffff1f',
  '--dsw-alias-border-l3': '#ffffff29',
  '--dsw-alias-interactive-bg-hover': '#ffffff14',
  '--dsw-specific-sidebar-fill': '#2c2c2e',
};

// Minimal host structure CSS: only layout, never colours — colours must come from
// the host tokens above or from the skin, exactly like the app.
const HOST_STRUCT = `
*{box-sizing:border-box}
button,select,input,textarea{font:inherit;color:inherit;background:transparent;border:0}
body{margin:0;font:14px/1.6 -apple-system,"PingFang SC",sans-serif;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.wrap{display:flex;gap:16px;padding:16px;align-items:flex-start}
.side{width:280px;flex:none}
.main{flex:1;min-width:0;max-width:640px}
.JoiKIa_sessionRow{display:flex;align-items:center;padding:0 8px}
.JoiKIa_slot{flex:none;display:inline-flex;position:relative}
.JoiKIa_title{flex:1;min-width:0;overflow:hidden;margin:0 6px 0 8px}
.JoiKIa_rowResting{flex:none;display:inline-flex;gap:4px;align-items:center}
.JoiKIa_pinIndicator,.JoiKIa_chevron{display:inline-flex;width:12px;height:12px}
.tnXGgG_flowItem{position:relative;margin:8px 0}
.AkCqbG_userRow{display:flex;justify-content:flex-end}
._bubble_x{display:inline-block;padding:8px 12px;max-width:80%}
._markdown_rve47_5 > *{margin:0}
._tableScroll_rve47_199{max-width:100%}
table{border-collapse:collapse;width:100%}
th,td{text-align:left}
.UHhYua_root{display:block}
.UHhYua_row{display:flex;align-items:center;gap:6px}
.UHhYua_summary{display:flex;gap:6px}
._3j1mRa_node{display:block;padding:8px}
._3j1mRa_row{display:flex;gap:8px;align-items:center}
.Dv5QdW_panel{padding:10px}
.F6Huca_entry{padding:8px}
.m00Doa_card{padding:6px;width:320px}
.m00Doa_row{display:flex;gap:8px;padding:6px 8px;align-items:center}
.kB3qhq_root{width:260px}
.kB3qhq_panelList{display:flex;flex-direction:column}
.kB3qhq_panelRow{display:flex;align-items:center;gap:8px}
.kB3qhq_newSession{display:flex;align-items:center}
.kB3qhq_newSessionContent{display:flex;align-items:center;width:100%}
[data-composer-card]{padding:12px;border-radius:12px}
[data-composer-input]{min-height:44px;outline:none}
.JZLxKW_toolbar{display:flex;gap:8px;align-items:center;margin-top:8px}
`;

const av = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='30' fill='#eef1f4'/><text x='64' y='89' font-size='60' text-anchor='middle' fill='#8a93a3'>会</text></svg>")}`;
const srow = (t, time, state, extra = '') => `<div class="JoiKIa_sessionRow ${extra}" style="--dsh-avatar:url(&quot;${av}&quot;)"><span class="JoiKIa_slot">${state ? `<span data-state="${state}"></span><span>状态</span>` : ''}</span><span class="JoiKIa_title">${t}</span><span class="JoiKIa_rowResting">${extra.includes('pinned') ? '<span class="JoiKIa_pinIndicator">•</span>' : ''}<span class="JoiKIa_time">${time}</span></span></div>`;

const FIXTURE = `
<div class="wrap">
  <div class="side">
    <div class="kB3qhq_root">
      <button class="kB3qhq_newSession"><span class="kB3qhq_newSessionLabelMask"><span class="kB3qhq_newSessionContent">＋<span class="kB3qhq_newSessionLabel">新会话</span></span></span></button>
      <div class="kB3qhq_panelList">
        <button class="kB3qhq_panelRow"><span class="kB3qhq_panelGlyph">◈</span><span class="kB3qhq_panelTitle">Sone-wx 主题</span></button>
        <button class="kB3qhq_panelRow kB3qhq_panelActive"><span class="kB3qhq_panelGlyph">◈</span><span class="kB3qhq_panelTitle">示例看板</span></button>
      </div>
    </div>
    <div class="JoiKIa_searchResultHeading">搜索结果</div>
    ${srow('运行中的会话', '14:16', 'ongoing')}
    ${srow('选中的会话', '13:02', 'ongoing', 'JoiKIa_selected')}
    ${srow('置顶的会话', '12:00', null, 'pinned')}
    ${srow('置顶且选中', '11:00', null, 'pinned JoiKIa_selected')}
    ${srow('等待批准', '昨天', 'warning')}
    ${srow('出错的会话', '昨天', 'error')}
    ${srow('已完成会话', '07:50', 'done')}
    ${srow('归档的会话', '前天', null, 'JoiKIa_archived')}
    <div class="JoiKIa_searchResultRow"><span class="JoiKIa_searchResultTitle">命中的标题</span><span class="JoiKIa_searchResultSnippet">这里是一段命中的正文片段</span></div>
  </div>
  <div class="main">
    <div class="tnXGgG_column">
      <div class="tnXGgG_flowItem" data-chat-flow-kind="user"><div class="AkCqbG_userRow"><div class="AkCqbG_userStack"><span class="_bubble_x">帮我看一下这个方案，顺便解释 code 的用法</span></div></div></div>
      <div class="tnXGgG_flowItem" data-chat-flow-kind="assistant-step">
        <div class="r52wTW_label">思考过程</div>
        <div class="_markdown_rve47_5">
          <h2>结论先说</h2>
          <p>正文一行，含<a href="#">一个链接</a>、<code>inline()</code> 代码、<strong>加粗</strong>、<em>斜体</em>、<del>删除线</del>与<mark>高亮</mark>。</p>
          <blockquote><p>引用块里的一行说明文字</p></blockquote>
          <ul><li>列表第一项</li><li>列表第二项<ul><li>嵌套项</li></ul></li></ul>
          <pre><code>const a = 1;
console.log(a);</code></pre>
          <div class="_tableScroll_rve47_199"><table><thead><tr><th>方案</th><th>耗时</th><th>结论</th></tr></thead><tbody><tr><td>甲</td><td>12s</td><td>可用</td></tr><tr><td>乙</td><td>48s</td><td>偏慢</td></tr></tbody></table></div>
          <hr>
          <p><kbd>⌘</kbd> + <kbd>K</kbd> 打开命令面板</p>
        </div>
        <div class="ZITbJG_actions"><button class="ZITbJG_action">复制</button><span class="ZITbJG_endInfo">12:04</span></div>
      </div>
      <div class="tnXGgG_flowItem" data-chat-flow-kind="turn-process">
        <div class="UHhYua_root"><div class="UHhYua_row"><span class="UHhYua_leading">▸</span><span class="UHhYua_summary"><span class="UHhYua_title">bash</span><span class="UHhYua_sep">|</span><span>读取文件</span></span><span class="UHhYua_summarySuffix">1.2s</span></div></div>
        <div class="_3j1mRa_node"><div class="_3j1mRa_row"><span class="_3j1mRa_label">子智能体：审计</span><span class="_3j1mRa_metrics">3.4s</span></div></div>
      </div>
      <div data-composer-seat><div data-composer-card>
        <div class="JZLxKW_scroll"><div data-composer-input contenteditable="true">输入框里的一行草稿</div></div>
        <div class="JZLxKW_toolbar"><select class="JZLxKW_select"><option>deepseek-auto</option></select><button class="JZLxKW_primary">发送</button></div>
      </div></div>
    </div>
  </div>
  <div class="side">
    <div class="Dv5QdW_panel"><div class="Dv5QdW_tabTitle">右侧栏</div><div class="Dv5QdW_panelBody"><div class="F6Huca_entry"><div class="F6Huca_entryTitle">引导条目</div><div class="F6Huca_entryDescription">条目的说明文字</div></div><div class="Dv5QdW_unavailable">暂不可用</div></div></div>
    <div class="m00Doa_card"><div class="m00Doa_search">搜索命令</div><div class="m00Doa_row m00Doa_rowActive"><span class="m00Doa_label">/improve-ui</span><span class="m00Doa_badge">技能</span></div><div class="m00Doa_row"><span class="m00Doa_label">/oil-frontend</span><span class="m00Doa_badge">技能</span></div></div>
    <div class="dsh-wc-group"><div class="dsh-wc-group-title">外观</div><div class="dsh-wc-group-body">
      <div class="dsh-wc-row"><span>字体</span><span class="dsh-wc-seg"><button class="dsh-wc-seg-item dsh-wc-seg-item-on">系统</button><button class="dsh-wc-seg-item">微信体</button></span></div>
    </div></div>
    <div style="display:flex;gap:8px;margin-top:8px"><button class="dsh-wc-btn dsh-wc-btn-primary">导出</button><button class="dsh-wc-btn dsh-wc-btn-secondary">导入</button><button class="dsh-wc-btn dsh-wc-btn-danger">恢复默认</button></div>
  </div>
</div>`;

const modes = [
  { name: 'light', dark: false, paper: false },
  { name: 'dark', dark: true, paper: false },
  { name: 'paper-light', dark: false, paper: true },
  { name: 'paper-dark', dark: true, paper: true },
];

const browser = await chromium.launch({ channel: 'chrome' });
const findings = [];
const counts = {};
for (const mode of modes) {
  const tokens = mode.dark ? HOST_DARK : HOST_LIGHT;
  const rootCss = ':root{' + Object.entries(tokens).map(([k, v]) => `${k}:${v}`).join(';') + '}';
  const html = `<!doctype html><html data-platform="darwin"><head><meta charset="utf-8"><style>${rootCss}${HOST_STRUCT}</style><style>${css}</style></head>
<body class="dsh-wechat-skin-on dsh-wechat-match" data-dsh-wechat-dark="${mode.dark ? 1 : 0}"${mode.paper ? ' data-dsh-wechat-preset="paper"' : ''}${mode.dark ? ' data-ds-dark-theme' : ''} data-dsh-wc-composer-fx="1">${FIXTURE}</body></html>`;
  writeFileSync(`/tmp/contrast-sweep-${mode.name}.html`, html);
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.goto(`file:///tmp/contrast-sweep-${mode.name}.html`);
  await page.waitForTimeout(120);
  const res = await page.evaluate(() => {
    const parse = (c) => {
      const m = String(c).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const lum = (c) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const path = (el) => {
      const bits = [];
      for (let n = el; n && n !== document.body && bits.length < 4; n = n.parentElement) {
        let s = n.tagName.toLowerCase();
        const cls = (n.className || '').toString().trim().split(/\s+/).filter(Boolean);
        if (cls.length) s += '.' + cls.slice(0, 2).join('.');
        const kind = n.getAttribute && n.getAttribute('data-chat-flow-kind');
        if (kind) s += `[${kind}]`;
        bits.unshift(s);
      }
      return bits.join(' > ');
    };
    const bgOf = (el) => {
      const stack = [];
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
      }
      let base = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
      return base;
    };
    const out = [];
    let checked = 0;
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.15) continue;
      // visually-hidden labels (the status badge repurposes one) render no glyphs
      if (Number.parseFloat(cs.fontSize) < 6) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (cs.backgroundImage !== 'none' && /url\(/.test(cs.backgroundImage)) continue; // avatar chips: text lives in the SVG
      const fg = parse(cs.color);
      if (!fg || fg.a === 0) continue;
      const bg = bgOf(el);
      const eff = fg.a < 1 ? over(fg, bg) : fg;
      const size = Number.parseFloat(cs.fontSize);
      const bold = Number(cs.fontWeight) >= 600;
      const floor = (size >= 24 || (bold && size >= 18.66)) ? 3 : 4.5;
      const cr = ratio(eff, bg);
      checked++;
      if (cr < floor) out.push({ sel: path(el), text: el.textContent.trim().slice(0, 24), color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, size, ratio: Number(cr.toFixed(2)), floor });
    }
    return { checked, out };
  });
  counts[mode.name] = res.checked;
  for (const f of res.out) findings.push({ mode: mode.name, ...f });
  await page.close();
}
await browser.close();

// Known-acceptable exceptions: intentionally quiet decoration, never body copy.
const ALLOW = [
  /JoiKIa_archived/,   // archived rows are deliberately faded to 55%
  /UHhYua_sep/,        // the "|" between tool name and summary is decoration, not copy
];
const real = findings.filter((f) => !ALLOW.some((re) => re.test(f.sel)));
if (real.length) {
  console.error('contrast-sweep FAIL');
  for (const f of real) console.error(`  [${f.mode}] ${f.ratio}:1 (need ${f.floor}) ${f.color} on ${f.bg} @ ${f.size}px  ${f.sel}  「${f.text}」`);
  process.exit(1);
}
console.log(`contrast-sweep OK（${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' / ')} 处文本）`);