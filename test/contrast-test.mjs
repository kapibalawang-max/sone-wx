// Guards the contrast floor for the colours this skin paints itself (WCAG 2.1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'client.js'), 'utf8');

const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const token = (name) => {
  const m = css.match(new RegExp('--' + name + ':\\s*(#[0-9a-fA-F]{6})'));
  return m ? m[1] : null;
};

// Every skin colour comes from the stylesheet itself: hardcoded literals here would
// keep passing after someone changed the token in client.js.
const need = (name) => {
  const v = token(name);
  if (!v) { fails.push(`token --${name} not declared as a hex value`); return '#000000'; }
  return v;
};
const fails = [];
const cases = [
  ['link ink on assistant bubble', need('wc-link'), '#ffffff', 4.5],
  ['link ink on module fill', need('wc-link'), '#f2f2f2', 4.5],
  ['primary button label', '#ffffff', need('wc-brand-press'), 4.5],
  ['selected row title', need('wc-sel-ink'), need('wc-sel-bg'), 4.5],
  ['table header label', need('wc-th-ink'), need('wc-th-bg'), 4.5],
  ['danger button label', '#ffffff', need('wc-danger'), 4.5],
  ['brand text on white', need('wc-brand-text'), '#ffffff', 4.5],
  ['dark link on chat surface', '#7ee2a8', '#1d1d1f', 4.5],
  ['dark link on module fill', '#7ee2a8', '#2a2a2c', 4.5],
];

let checks = 0;
for (const [name, fg, bg, floor] of cases) {
  const r = ratio(fg, bg);
  checks++;
  if (r < floor) fails.push(`${name}: ${r.toFixed(2)} < ${floor}`);
}

// tokens must actually be the ones declared, not stale literals elsewhere
for (const [name, want] of [['wc-brand-ink', '#0a7d43'], ['wc-link', '#0a7d43'], ['wc-danger', '#b42318']]) {
  checks++;
  const got = token(name);
  if (got !== want) fails.push(`token --${name}: got ${got}, want ${want}`);
}
// a reply's quote text inherits the chat ink; the sent-bubble ink is dark and
// disappears on a dark surface.
checks++;
if (!/\[data-chat-flow-kind="assistant-step"\] blockquote \{[^}]*color: inherit/.test(css)) fails.push('blockquote does not inherit the chat ink');
checks++;
if (!/--wc-link: #7ee2a8/.test(css)) fails.push('dark mode has no light link ink');

// the old low-contrast literals must be gone from text roles
checks++;
if (/\[data-chat-flow-kind="assistant-step"\] a \{ color: var\(--wc-green\)/.test(css)) fails.push('link rule still uses --wc-green');
checks++;
if (/> \[data-state="warning"\] \+ span \{ background: var\(--wc-dot-warning\); \}/.test(css)) fails.push('warning dot still a solid low-contrast fill');

if (fails.length) {
  console.error('FAIL\n' + fails.join('\n'));
  process.exit(1);
}
console.log(`contrast-test OK（${checks} 项）`);
