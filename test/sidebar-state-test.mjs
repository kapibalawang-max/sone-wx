// Sidebar avatar shape + status badge regression (v1.15.0).
// Avatar is a 6px rounded square (WeChat list look); status rides as a corner badge.
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, [new URL('./extract-css.mjs', import.meta.url).pathname], { stdio: 'ignore' });
const css = readFileSync('/tmp/sone-css.css', 'utf8');
const require = createRequire('/Users/user/.dsh/profiles/desktop/node_modules/');
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.error('playwright missing'); process.exit(1); }

const av = (ch, hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='30' fill='hsl(${hue},55%,58%)'/><text x='64' y='89' font-size='60' text-anchor='middle' fill='#fff'>${ch}</text></svg>`)}`;
const rows = [
  { t: '运行中会话', time: '14:16', state: 'ongoing', ch: '运' },
  { t: '等待批准', time: '昨天', state: 'warning', ch: '等', sched: true },
  { t: '选中的运行会话', time: '昨天', state: 'ongoing', ch: '选', sel: true },
  { t: '已完成会话', time: '07:50', state: 'done', ch: '完' },
  { t: '出错会话', time: '13:58', state: 'error', ch: '错' },
  { t: '新会话', time: '', state: null, ch: '新' },
];
const row = (r) => `<div class="JoiKIa_sessionRow${r.sel ? ' JoiKIa_selected' : ''}" style="--dsh-avatar:url(&quot;${av(r.ch, 200)}&quot;)"><span class="JoiKIa_slot">${r.state ? `<span data-state="${r.state}"></span><span>状态</span>` : ''}${r.sched ? '<span data-session-schedule-mark><svg viewBox="0 0 16 16"></svg><span>x</span></span>' : ''}</span><span class="JoiKIa_title">${r.t}</span><span class="JoiKIa_rowResting"><span class="JoiKIa_time">${r.time}</span></span></div>`;
const host = `<style>:root{--dsh-sidebar-label-gap:8px;--dsw-radius-md:8px;--dsw-alias-label-primary:#1a1a1a;--dsw-alias-label-tertiary:#8c8c8c;--dsw-specific-sidebar-fill:#eeeef0}.JoiKIa_sessionRow{align-items:center;padding:0 8px;display:flex}.JoiKIa_slot{flex:none;display:inline-flex}.JoiKIa_title{flex:1;min-width:0;overflow:hidden;margin:0 6px 0 8px}.JoiKIa_rowResting{flex:none;display:inline-flex}body{margin:0;background:#eeeef0;font:13px/1.5 -apple-system}</style>`;
const html = `<!doctype html><html><head><meta charset="utf-8">${host}<style>${css}</style></head><body class="dsh-wechat-skin-on dsh-wechat-match"><div style="padding:14px;width:330px">${rows.map(row).join('')}</div></body></html>`;
writeFileSync('/tmp/sidebar-state-test.html', html);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 400, height: 340 }, deviceScaleFactor: 2 });
await page.goto('file:///tmp/sidebar-state-test.html');
await page.waitForTimeout(250);
const m = await page.evaluate(() => {
  const cs = (sel, pseudo) => { const el = document.querySelector(sel); if (!el) return null; const c = getComputedStyle(el, pseudo || null); return { w: c.width, h: c.height, radius: c.borderRadius, bg: c.backgroundColor, display: c.display, shadow: c.boxShadow, anim: c.animationName, dur: c.animationDuration, top: c.borderTopColor }; };
  const rowEls = [...document.querySelectorAll('.JoiKIa_sessionRow')];
  const badge = (i) => rowEls[i].querySelector('.JoiKIa_slot > [data-state] + span');
  return {
    slot: cs('.JoiKIa_slot'),
    running: cs('.JoiKIa_sessionRow:nth-child(1) .JoiKIa_slot > [data-state] + span'),
    runningArc: cs('.JoiKIa_sessionRow:nth-child(1) .JoiKIa_slot > [data-state] + span', '::after'),
    warning: cs('.JoiKIa_sessionRow:nth-child(2) .JoiKIa_slot > [data-state] + span'),
    done: cs('.JoiKIa_sessionRow:nth-child(4) .JoiKIa_slot > [data-state] + span'),
    error: cs('.JoiKIa_sessionRow:nth-child(5) .JoiKIa_slot > [data-state] + span'),
    selectedBadgeBg: badge(2) && getComputedStyle(badge(2)).backgroundColor,
    selectedRowBg: getComputedStyle(rowEls[2]).backgroundColor,
    selectedTitleColor: getComputedStyle(rowEls[2].querySelector('.JoiKIa_title')).color,
    noBadgeForIdle: badge(5) === null,
    scheduleLeft: (() => { const e = document.querySelector('[data-session-schedule-mark]'); const c = e && getComputedStyle(e); return c ? { left: c.left, bottom: c.bottom } : null; })(),
  };
});
await page.screenshot({ path: '/tmp/sidebar-state-test.png', fullPage: true });
await browser.close();

const fails = [];
const eq = (name, got, want) => { if (String(got) !== String(want)) fails.push(`${name}: got ${got}, want ${want}`); };
eq('avatar width', m.slot.w, '26px');
eq('avatar radius', m.slot.radius, '6px');
eq('running badge size', `${m.running.w}/${m.running.h}`, '12px/12px');
eq('running badge spins', m.runningArc.anim, 'dsh-wc-badge-spin');
eq('running arc colour', m.runningArc.top, 'rgb(7, 193, 96)');
eq('warning dot', `${m.warning.w}/${m.warning.bg}`, '9px/rgb(255, 197, 61)');
eq('error dot', m.error.bg, 'rgb(255, 107, 107)');
eq('done has no badge', m.done.display, 'none');
eq('idle has no badge', m.noBadgeForIdle, 'true');
eq('selected row is WeChat green', m.selectedRowBg, 'rgb(76, 159, 111)');
eq('selected badge sits on white disc', m.selectedBadgeBg, 'rgb(255, 255, 255)');
eq('selected title is white', m.selectedTitleColor, 'rgb(255, 255, 255)');
eq('schedule badge bottom-left', `${m.scheduleLeft.left}/${m.scheduleLeft.bottom}`, '-2px/-2px');
if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log('sidebar-state: ' + 13 + '/13 OK');
