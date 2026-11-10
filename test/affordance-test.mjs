// Static guards for the interaction fixes: destructive actions need a second click,
// and controls must not hide behind hover.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'client.js'), 'utf8');
const fails = [];
let checks = 0;
const ok = (name, cond) => { checks++; if (!cond) fails.push(name); };

ok('reset needs a second click', /armed === "reset"/.test(css) && /armConfirm\("reset"\)/.test(css));
ok('preset delete needs a second click', /armed === "preset:" \+ presetId/.test(css));
ok('confirm label exists', /confirmAgain/.test(css));
ok('reset hint explains the cost', /resetHint/.test(css));
ok('danger button style exists', /\.dsh-wc-btn-danger \{/.test(css));
ok('row reset is visible without hover', /\.dsh-wc-reset \{[\s\S]{0,400}?opacity: \.55/.test(css));
ok('preview receives text scale', /SkinPreview, \{ t, fontLevel, textFontLevel/.test(css));
ok('preview receives font family', /SkinPreview, \{ t, fontLevel, textFontLevel,[\s\S]{0,200}?fontFamily/.test(css));
ok('preview applies avatar shape', /previewAvatarRadius/.test(css));
ok('preview honours high contrast', /highContrast/.test(css));

// heights of controls on one row must not drift more than 3px
const control = /--wc-control-h: (\d+)px/.exec(css);
const btn = /\.dsh-wc-btn-sm \{ padding: 4px 12px; font-size: var\(--wc-fs-sm\); line-height: 20px; \}/.test(css);
ok('one control height token', !!control && control[1] === '28');
ok('segmented item derives from it', /height: calc\(var\(--wc-control-h\) - 4px\)/.test(css));
ok('search input uses it', /height: var\(--wc-control-h\)/.test(css));
ok('small button geometry declared', btn);

if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log(`affordance-test OK（${checks} 项）`);
