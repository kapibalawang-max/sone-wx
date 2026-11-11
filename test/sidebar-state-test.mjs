// Sidebar avatar shape + status badge regression (v1.15.0).
// Avatar is a 6px rounded square (WeChat list look); status rides as a corner badge.
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from './browser.mjs'

execFileSync(process.execPath, [new URL('./extract-css.mjs', import.meta.url).pathname], { stdio: 'ignore' });
const css = readFileSync('/tmp/sone-css.css', 'utf8');
const av = (ch, hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='30' fill='hsl(${hue},55%,58%)'/><text x='64' y='89' font-size='60' text-anchor='middle' fill='#fff'>${ch}</text></svg>`)}`;
const rows = [
  { t: '运行中会话', time: '14:16', state: 'ongoing', ch: '运' },
  { t: '等待批准', time: '昨天', state: 'warning', ch: '等', sched: true },
  { t: '选中的运行会话', time: '昨天', state: 'ongoing', ch: '选', sel: true },
  { t: '已完成会话', time: '07:50', state: 'done', ch: '完' },
  { t: '出错会话', time: '13:58', state: 'error', ch: '错' },
  { t: '新会话', time: '', state: null, ch: '新' },
  { t: '兼容 completed 词汇', time: '昨天', state: 'completed', ch: '完2' },
  { t: '兼容 failed 词汇', time: '昨天', state: 'failed', ch: '错2' },
  { t: '置顶会话', time: '12:00', state: null, ch: '顶', pin: true },
  { t: '归档会话', time: '前天', state: null, ch: '归', arch: true },
  { t: '置顶且选中', time: '11:00', state: null, ch: '顶2', pin: true, sel: true },
];
const row = (r) => `<div class="JoiKIa_sessionRow${r.sel ? ' JoiKIa_selected' : ''}${r.arch ? ' JoiKIa_archived' : ''}" style="--dsh-avatar:url(&quot;${av(r.ch, 200)}&quot;)"><span class="JoiKIa_slot">${r.state ? `<span data-state="${r.state}"></span><span>状态</span>` : ''}${r.sched ? '<span data-session-schedule-mark><svg viewBox="0 0 16 16"></svg><span>x</span></span>' : ''}</span><span class="JoiKIa_title">${r.t}</span><span class="JoiKIa_rowResting">${r.pin ? '<span class="JoiKIa_pinIndicator"><svg viewBox="0 0 16 16"></svg></span>' : ''}<span class="JoiKIa_time">${r.time}</span></span></div>`;
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
    warningShadow: getComputedStyle(document.querySelector('.JoiKIa_sessionRow:nth-child(2) .JoiKIa_slot > [data-state] + span')).boxShadow,
    done: cs('.JoiKIa_sessionRow:nth-child(4) .JoiKIa_slot > [data-state] + span'),
    error: cs('.JoiKIa_sessionRow:nth-child(5) .JoiKIa_slot > [data-state] + span'),
    completed: cs('.JoiKIa_sessionRow:nth-child(7) .JoiKIa_slot > [data-state] + span'),
    failed: cs('.JoiKIa_sessionRow:nth-child(8) .JoiKIa_slot > [data-state] + span'),
    selectedBadgeBg: badge(2) && getComputedStyle(badge(2)).backgroundColor,
    selectedRowBg: getComputedStyle(rowEls[2]).backgroundColor,
    selectedTitleColor: getComputedStyle(rowEls[2].querySelector('.JoiKIa_title')).color,
    noBadgeForIdle: badge(5) === null,
    doneTitleWeight: getComputedStyle(rowEls[3].querySelector('.JoiKIa_title')).fontWeight,
    pinnedBg: getComputedStyle(rowEls[8]).backgroundColor,
    plainBg: getComputedStyle(rowEls[5]).backgroundColor,
    pinColor: getComputedStyle(rowEls[8].querySelector('.JoiKIa_pinIndicator')).color,
    archivedOpacity: getComputedStyle(rowEls[9]).opacity,
    timeSize: getComputedStyle(rowEls[0].querySelector('.JoiKIa_time')).fontSize,
    timeColor: getComputedStyle(rowEls[0].querySelector('.JoiKIa_time')).color,
    selPinBg: getComputedStyle(rowEls[10]).backgroundColor,
    selPinTitle: getComputedStyle(rowEls[10].querySelector('.JoiKIa_title')).color,
    selPinIcon: getComputedStyle(rowEls[10].querySelector('.JoiKIa_pinIndicator')).color,
    scheduleLeft: (() => { const e = document.querySelector('[data-session-schedule-mark]'); const c = e && getComputedStyle(e); return c ? { left: c.left, bottom: c.bottom } : null; })(),
  };
});
await page.screenshot({ path: '/tmp/sidebar-state-test.png', fullPage: true });
await browser.close();

const fails = [];
let checks = 0;
const eq = (name, got, want) => { checks++; if (String(got) !== String(want)) fails.push(`${name}: got ${got}, want ${want}`); };
eq('avatar width', m.slot.w, '26px');
eq('avatar radius', m.slot.radius, '6px');
eq('running badge size', `${m.running.w}/${m.running.h}`, '12px/12px');
eq('running badge spins', m.runningArc.anim, 'dsh-wc-badge-spin');
eq('running arc colour', m.runningArc.top, 'rgb(10, 125, 67)');
eq('warning dot is a ring', `${m.warning.w}/${m.warning.bg}`, '9px/rgba(0, 0, 0, 0)');
eq('warning ring colour', /rgb\(217, 119, 6\)/.test(m.warningShadow) ? 'ok' : m.warningShadow, 'ok');
eq('error dot', m.error.bg, 'rgb(220, 38, 38)');
eq('done (unread) shows a green disc', `${m.done.display}/${m.done.bg}`, 'block/rgb(7, 193, 96)');
eq('done title is heavier', m.doneTitleWeight, '600');
eq('completed has no badge', m.completed.display, 'none');
eq('failed dot', m.failed.bg, 'rgb(220, 38, 38)');
eq('idle has no badge', m.noBadgeForIdle, 'true');
eq('selected row is deep green', m.selectedRowBg, 'rgb(76, 159, 111)');
eq('selected badge sits on white disc', m.selectedBadgeBg, 'rgb(255, 255, 255)');
eq('selected title is deep green ink', m.selectedTitleColor, 'rgb(10, 46, 26)');
eq('pinned row tinted', m.pinnedBg !== m.plainBg, 'true');
eq('pin icon uses brand ink', m.pinColor, 'rgb(10, 125, 67)');
eq('pinned + selected keeps the green fill', m.selPinBg, 'rgb(76, 159, 111)');
eq('pinned + selected keeps green ink title', m.selPinTitle, 'rgb(10, 46, 26)');
eq('pin icon inverts on selected', m.selPinIcon, 'rgb(10, 46, 26)');
eq('archived row recedes', m.archivedOpacity, '0.55');
eq('timestamp is 12px', m.timeSize, '12px');
eq('timestamp uses secondary ink', m.timeColor, 'rgb(97, 102, 107)');
eq('schedule badge bottom-left', `${m.scheduleLeft.left}/${m.scheduleLeft.bottom}`, '-2px/-2px');
if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log(`sidebar-state: ${checks - fails.length}/${checks} OK`);
