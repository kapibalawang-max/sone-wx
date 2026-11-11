// Palette structure, not just contrast: a colour system fails when its levels stop
// being distinguishable or when one hue starts meaning two things. Both are silent
// (every individual pair can still pass 4.5:1), so they need their own guard.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// optional path argument lets the guard be replayed against an older snapshot
const src = readFileSync(process.argv[2] || join(here, '..', 'client.js'), 'utf8');
const cssStart = src.indexOf('const WECHAT_CSS = `');
const css = src.slice(cssStart, src.indexOf('`;', cssStart));

// A missing token must surface as a readable failure, not a crash: every helper
// returns NaN for null so the assertions below report which level disappeared.
const rgb = (h) => { if (!h) return [NaN, NaN, NaN]; h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const Y = (h) => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const L = (h) => { const y = Y(h); return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16; };
const ratio = (a, b) => { const [hi, lo] = [Y(a), Y(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const lab = (h) => {
  if (!h) return { C: NaN, h: NaN };
  const [r, g, b] = rgb(h).map(lin);
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const fy = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const fz = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  const a = 500 * (fx - fy), bb = 200 * (fy - fz);
  return { C: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360 };
};
// first declaration wins: dark/paper redeclare the same names further down
const tok = (name, depth = 0) => {
  if (depth > 8) return null;
  const m = css.match(new RegExp('--' + name + ':\\s*([^;]+);'));
  if (!m) return null;
  const raw = m[1].trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  const ref = raw.match(/^var\(\s*--([\w-]+)\s*(?:,\s*(#[0-9a-fA-F]{6})\s*)?\)$/);
  return ref ? (tok(ref[1], depth + 1) || ref[2] || null) : null;
};
const block = (selector) => {
  const i = css.indexOf(selector + ' {');
  return i < 0 ? '' : css.slice(i, css.indexOf('\n}', i));
};
const inBlock = (sel, name) => {
  const m = block(sel).match(new RegExp('--' + name + ':\\s*(#[0-9a-f]{6})', 'i'));
  return m ? m[1] : null;
};

let pass = 0; const fails = [];
const ok = (cond, msg, extra = '') => { if (cond) pass++; else fails.push(msg + (extra ? ' — ' + extra : '')); };

// ---- 1. light surface ladder: every step must be perceptible ----
const ladder = ['wc-bg', 'wc-surface', 'wc-code-bg', 'wc-sidebar', 'wc-border-light'].map(tok);
ok(ladder.every(Boolean), 'light surface ladder resolves to hex', JSON.stringify(ladder));
for (let i = 1; i < ladder.length; i++) {
  const d = L(ladder[i - 1]) - L(ladder[i]);
  // canvas -> card is intentionally subtle (1 L*); every structural step must be >=2.5
  const floor = i === 1 ? 0.8 : 2.5;
  ok(d >= floor, `surface step ${i} separates by >=${floor} L*`, `${ladder[i - 1]}→${ladder[i]} Δ${d.toFixed(1)}`);
}
ok(L(ladder[0]) - L(ladder[3]) >= 6, 'canvas and sidebar differ by >=6 L* overall',
  `Δ${(L(ladder[0]) - L(ladder[3])).toFixed(1)}`);

// ---- 2. ink ladder: three levels, all readable on every light surface ----
const inks = ['wc-ink-1', 'wc-ink-2', 'wc-ink-3'].map(tok);
ok(inks.every(Boolean), 'ink ladder resolves to hex', JSON.stringify(inks));
for (let i = 1; i < inks.length; i++) {
  const d = L(inks[i]) - L(inks[i - 1]);
  ok(d >= 6, `ink level ${i + 1} is >=6 L* quieter than level ${i}`, `Δ${d.toFixed(1)}`);
}
// the border is a line, not a background text sits on — exclude it here
const fills = ladder.slice(0, 4);
for (const [n, ink] of inks.entries()) {
  for (const [sn, surf] of fills.entries()) {
    ok(ratio(ink, surf) >= 4.5, `ink${n + 1} keeps 4.5:1 on surface${sn + 1}`, `${ink} on ${surf} = ${ratio(ink, surf).toFixed(2)}`);
  }
}

// ---- 3. accent ramp: five steps, one hue ----
const ramp = ['wc-accent-soft', 'wc-accent-line', 'wc-accent-bright', 'wc-accent-solid', 'wc-accent-press'].map(tok);
ok(ramp.every(Boolean), 'accent ramp has five hex steps', JSON.stringify(ramp));
const hues = ramp.slice(1).map((h) => lab(h).h);
ok(Math.max(...hues) - Math.min(...hues) <= 14, 'accent steps stay within one hue band (<=14 deg)',
  hues.map((h) => h.toFixed(0)).join('/'));
const Ls = ramp.map(L);
ok(Ls.every((v, i) => i === 0 || v < Ls[i - 1]), 'accent ramp is monotonic in lightness', Ls.map((v) => v.toFixed(1)).join('/'));
ok(ratio('#ffffff', tok('wc-accent-solid')) >= 4.5, 'solid step carries white content',
  ratio('#ffffff', tok('wc-accent-solid')).toFixed(2));
ok(ratio('#ffffff', tok('wc-accent-bright')) < 3, 'bright step is decoration only (cannot carry white text)',
  ratio('#ffffff', tok('wc-accent-bright')).toFixed(2));

// ---- 4. one meaning per hue: selection IS the accent, structure is NOT ----
ok(tok('wc-sel-bg') === tok('wc-accent-solid'), 'selection uses the accent solid step');
ok(tok('wc-th-bg') === tok('wc-code-bg'), 'table header is structure: same neutral as the code surface');
ok(lab(tok('wc-th-bg')).C < 6, 'table header carries no brand chroma', lab(tok('wc-th-bg')).C.toFixed(1));
ok(tok('wc-brand-press') !== tok('wc-brand-ink'), 'press and normal fill are different steps');
ok(tok('wc-link') === tok('wc-brand-text'), 'links and brand text share the ink step');

// ---- 5. dark: borders visible, code recessed ----
const darkSel = 'body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"]';
const dBorder = tok('wc-border-dark'), dOverlay = tok('wc-overlay-dark');
const dCode = inBlock(darkSel, 'wc-code-bg'), dCard = tok('wc-surface-dark');
ok(L(dBorder) - L(dOverlay) >= 3, 'dark border stands off the overlay by >=3 L*',
  `Δ${(L(dBorder) - L(dOverlay)).toFixed(1)}`);
ok(L(dCard) - L(dCode) >= 4, 'dark code panel is recessed >=4 L* below the card',
  `Δ${(L(dCard) - L(dCode)).toFixed(1)}`);
const dInks = ['wc-ink-1', 'wc-ink-2', 'wc-ink-3'].map((n) => inBlock(darkSel, n));
ok(dInks.every(Boolean), 'dark ink ladder is declared', JSON.stringify(dInks));
for (const [n, ink] of dInks.entries()) {
  for (const [sn, surf] of [dCard, dOverlay, tok('wc-sidebar-dark')].entries()) {
    ok(ratio(ink, surf) >= 4.5, `dark ink${n + 1} keeps 4.5:1 on dark surface${sn + 1}`,
      `${ink} on ${surf} = ${ratio(ink, surf).toFixed(2)}`);
  }
}
for (let i = 1; i < dInks.length; i++) {
  ok(L(dInks[i - 1]) - L(dInks[i]) >= 6, `dark ink level ${i + 1} is >=6 L* quieter`,
    `Δ${(L(dInks[i - 1]) - L(dInks[i])).toFixed(1)}`);
}

// ---- 5b. the hairline token follows the scheme ----
// --wc-border-light is the legacy name for "hairline of the current scheme"; left
// at its light value it drew near-white edges on dark images and file cards.
const dHairline = inBlock(darkSel, 'wc-border-light') || tok('wc-border-light');
const dHairlineRef = block(darkSel).match(/--wc-border-light:\s*var\(--([\w-]+)\)/);
const dHairlineHex = dHairlineRef ? tok(dHairlineRef[1]) : dHairline;
ok(dHairlineHex && L(dHairlineHex) < 30, 'dark scheme overrides the hairline token to a dark value',
  `${dHairlineHex} L*${dHairlineHex ? L(dHairlineHex).toFixed(1) : '?'}`);
ok(!/background:\s*#2a2a2d/.test(css), 'dark assistant bubble uses the surface ramp, not a one-off hex');
ok(!/#2a2a2c/.test(css), 'dark composer glass uses the overlay token, not a one-off hex');

// ---- 6. paper: accent belongs to the warm family ----
const paperSel = 'body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"]:not([data-dsh-wechat-dark="1"])';
const pAccent = inBlock(paperSel, 'wc-accent-solid');
const pSidebar = inBlock(paperSel, 'wc-sidebar');
ok(lab(pAccent).h < 140, 'paper accent shifts toward the warm (moss) family', lab(pAccent).h.toFixed(0));
ok(lab(pSidebar).h < 110 && lab(pSidebar).h > 60, 'paper neutrals stay warm', lab(pSidebar).h.toFixed(0));
ok(Math.abs(lab(pAccent).h - lab(pSidebar).h) <= 45, 'paper accent and neutrals are within 45 deg of each other',
  `${lab(pAccent).h.toFixed(0)} vs ${lab(pSidebar).h.toFixed(0)}`);
const pInks = ['wc-ink-1', 'wc-ink-2', 'wc-ink-3'].map((n) => inBlock(paperSel, n));
for (const [n, ink] of pInks.entries()) {
  ok(ratio(ink, pSidebar) >= 4.5, `paper ink${n + 1} keeps 4.5:1 on the paper sidebar`,
    `${ink} on ${pSidebar} = ${ratio(ink, pSidebar).toFixed(2)}`);
}

// ---- 6b. paper dark is a whole warm scheme, not warm surfaces + cool ink ----
const pdSel = 'body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"][data-dsh-wechat-dark="1"]';
const pdNames = ['wc-bg', 'wc-surface', 'wc-sidebar', 'wc-overlay-dark', 'wc-border-dark',
  'wc-code-bg', 'wc-th-bg', 'wc-ink-1', 'wc-ink-2', 'wc-ink-3', 'wc-accent-solid'];
const pd = pdNames.map((n) => inBlock(pdSel, n));
ok(pd.every(Boolean), 'paper dark declares its own full ladder', JSON.stringify(pd));
for (const [i, hex] of pd.entries()) {
  if (!hex) continue;
  const h = lab(hex).h;
  ok(h > 55 && h < 140, `paper dark ${pdNames[i]} stays in the warm/moss band`, `${hex} h${h.toFixed(0)}`);
}
const pdInk = ['wc-ink-1', 'wc-ink-2', 'wc-ink-3'].map((n) => inBlock(pdSel, n));
const pdSurf = ['wc-surface', 'wc-sidebar', 'wc-overlay-dark', 'wc-th-bg'].map((n) => inBlock(pdSel, n));
for (const [n, ink] of pdInk.entries()) {
  for (const [sn, surf] of pdSurf.entries()) {
    ok(ratio(ink, surf) >= 4.5, `paper dark ink${n + 1} keeps 4.5:1 on surface${sn + 1}`,
      `${ink} on ${surf} = ${ratio(ink, surf).toFixed(2)}`);
  }
}
const pdBorder = inBlock(pdSel, 'wc-border-dark'), pdOverlay = inBlock(pdSel, 'wc-overlay-dark');
ok(L(pdBorder) - L(pdOverlay) >= 3, 'paper dark hairline stands off the overlay',
  `Δ${(L(pdBorder) - L(pdOverlay)).toFixed(1)}`);
ok(L(inBlock(pdSel, 'wc-surface')) - L(inBlock(pdSel, 'wc-code-bg')) >= 4,
  'paper dark code panel is recessed',
  `Δ${(L(inBlock(pdSel, 'wc-surface')) - L(inBlock(pdSel, 'wc-code-bg'))).toFixed(1)}`);
ok(ratio('#ffffff', inBlock(pdSel, 'wc-accent-solid')) >= 4.5, 'paper dark selection carries white text',
  ratio('#ffffff', inBlock(pdSel, 'wc-accent-solid')).toFixed(2));

// ---- 7. amber belongs to warnings only ----
ok(lab(tok('wc-avatar-user-b')).C < 45, 'chat avatar is low-chroma so it never reads as a warning',
  lab(tok('wc-avatar-user-b')).C.toFixed(1));
ok(lab(tok('wc-dot-warning')).C > 60, 'warning keeps full chroma', lab(tok('wc-dot-warning')).C.toFixed(1));

// ---- 8. no orphan greens outside the ramp and the sampled bubble assets ----
const allowed = new Set([...ramp, tok('wc-bubble'), tok('wc-bubble-link'), tok('wc-bubble-code-ink'),
  inBlock(darkSel, 'wc-accent-soft'), inBlock(darkSel, 'wc-accent-line'),
  inBlock(paperSel, 'wc-accent-soft'), inBlock(paperSel, 'wc-accent-line'),
  inBlock(paperSel, 'wc-accent-solid'), inBlock(paperSel, 'wc-accent-press'),
  '#7ee2a8', '#a6f0c2', '#e8f7ee', '#16281f'].filter(Boolean).map((h) => h.toLowerCase()));
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')));
const orphans = [];
for (const m of rootBlock.matchAll(/--(wc-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  const [, name, hex] = m;
  const c = lab(hex);
  if (c.h > 110 && c.h < 175 && c.C > 12 && !allowed.has(hex.toLowerCase())) orphans.push(`${name}=${hex}`);
}
ok(orphans.length === 0, 'no one-off greens in :root outside the ramp', orphans.join(', '));

if (fails.length) { console.error('palette-test FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
console.log(`palette-test OK（${pass} 项）`);