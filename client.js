// sone-wx — merged client bundle: dsh-wechat-skin (WeChat-style skin) +
// dsh-brand-studio (brand editor) under one settings section.
//
// Skin half: tokens/structure CSS/avatars/density/tail/chat width — unchanged
// behavior, localStorage keys stay `dsh-wechat-skin:*` for data continuity.
// Brand half: brand mark/title/wordmark via /sone-wx/brand (host side), seats
// sidebar.brand.* + conversation.hero.brand.mark, OWNED_CSS countermeasures.
// Both halves register NO settings slots themselves; the merged apply mounts a
// single settings.section `sone-wx` stacking WechatSkinRow + BrandStudioSection.

window.__ModuleLoader__.load({
	id: "sone-wx",
	factory: (require) => {

		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-store");

		//#region dsh-wechat-skin: constants
		/** Settings row locale namespace. */
		const SETTINGS_NS = "sone-wx.skin";
		/** localStorage keys. */
		const AVATAR_MAP_KEY = "dsh-wechat-skin:avatar-map";
		const COMPOSER_H_KEY = "dsh-wechat-skin:composer-height";
		/** Source identity for the token override layer. */
		const OVERRIDE_SOURCE = "dsh-wechat-skin:tokens";
		/** <style> tag id for the structural stylesheet. */
		const STYLE_TAG_ID = "dsh-wechat-skin:css";
		const UI_STYLE_TAG_ID = "dsh-wechat-skin:ui-css";
		/** Body class that gates every structural rule (light mode only). */
		const BODY_CLASS = "dsh-wechat-skin-on";
		/** Added only when the skin's hashed selectors still match this DSH build. */
		const MATCH_CLASS = "dsh-wechat-match";
		/** A few hashed classes that move when DSH changes; if none exist the skin must not hide/alter anything. */
		const SELECTOR_PROBES = [".JoiKIa_sessionRow", ".tnXGgG_column", ".JZLxKW_card", ".PIRFFq_frame"];
		/** The streaming chat column; mutations inside it do not affect the skin's DOM work. */
		const CHAT_AREA = ".tnXGgG_scroll, .tnXGgG_column, .kiGsTW_scrollBody, .kiGsTW_viewArea";
		/** Fixed avatar indices for message bubbles (user / assistant). */
		const USER_AVATAR_INDEX = 25;
		const ASSISTANT_AVATAR_INDEX = 5;
		/** localStorage keys for custom (user-uploaded) avatars. */
		const USER_AVATAR_KEY = "dsh-wechat-skin:user-avatar";
		/** localStorage key for the font-size level (1..5, default 3 = middle). */
		const FONT_LEVEL_KEY = "dsh-wechat-skin:font-level";
		const AI_AVATAR_KEY = "dsh-wechat-skin:ai-avatar";
		const DENSITY_KEY = "dsh-wechat-skin:density";
		const CHAT_WIDTH_KEY = "dsh-wechat-skin:chat-width";
		const TAIL_KEY = "dsh-wechat-skin:tail";
		/** Font-size scale per level; level 3 = 1.0 (the original size). */
		const FONT_SCALES = { 1: 0.8, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.25 };
		/** WeChat palette accents. */
		const WECHAT_GREEN = "#07c160";
		const WECHAT_GREEN_HOVER = "#06ad56";

		/** Embedded avatar pool (filled at build time). */
		const AVATARS = [];

		/**
		 * Token override layer. `light` carries the WeChat palette; `dark`
		 * carries the DSH built-in dark values (design-platform.css dark block)
		 * so the override layer is a no-op in dark mode.
		 */
		const TOKEN_OVERRIDES = {
			"--dsw-alias-state-business-primary": { light: WECHAT_GREEN, dark: "rgb(86, 134, 254)" },
			"--dsw-alias-state-business-tertiary": { light: "#e8f7ee", dark: "rgb(52, 65, 91)" },
			"--dsw-alias-state-success-primary": { light: WECHAT_GREEN, dark: "rgb(34, 197, 94)" },
			"--dsw-alias-button-info-fill": { light: WECHAT_GREEN, dark: "rgb(86, 134, 254)" },
			"--dsw-alias-button-info-hover": { light: WECHAT_GREEN_HOVER, dark: "rgb(65, 118, 230)" },
			"--dsw-alias-brand-primary": { light: WECHAT_GREEN, dark: "rgb(235, 238, 242)" },
			"--dsw-alias-brand-text": { light: "#ffffff", dark: "rgb(235, 238, 242)" },
			"--dsw-alias-interactive-bg-hover": { light: "rgba(0, 0, 0, 0.05)", dark: "rgba(255, 255, 255, 0.08)" },
			"--dsw-alias-interactive-bg-active": { light: "rgba(0, 0, 0, 0.08)", dark: "rgba(255, 255, 255, 0.14)" },
			"--dsw-alias-interactive-bg-hover-accent": { light: "rgba(7, 193, 96, 0.10)", dark: "rgba(255, 255, 255, 0.24)" },
			"--dsw-specific-bubble": { light: "#95ec69", dark: "rgb(33, 33, 35)" },
			"--dsw-alias-bg-module-platform": { light: "#f2f2f2", dark: "rgb(53, 54, 56)" },
			"--dsw-alias-bg-overlay": { light: "#ffffff", dark: "rgb(67, 69, 74)" },
			"--dsw-alias-scrollbar-bg-l1": { light: "#e1e1e1", dark: "rgb(60, 60, 61)" },
			"--dsw-alias-scrollbar-bg-l2": { light: "#e1e1e1", dark: "rgb(84, 85, 87)" },
			"--dsw-alias-scrollbar-hover-l1": { light: "#cccccc", dark: "rgb(84, 85, 87)" },
			"--dsw-alias-scrollbar-hover-l2": { light: "#cccccc", dark: "rgb(101, 103, 107)" }
		};

		/**
		 * Structural stylesheet (kept in sync with wechat-skin.css at build).
		 */
		const WECHAT_CSS = `
/* dsh-wechat-skin structural stylesheet — local port for dsh 0.2.2-rc.1.
   Light + dark palettes. Everything gated by body.dsh-wechat-skin-on;
   dark scheme is flagged by body[data-dsh-wechat-dark="1"] (set by the plugin
   from the live theme snapshot, so it works with any theme provider). */

:root {
  --wc-green: #07c160;
  --wc-green-hover: #06ad56;
  --wc-green-deep: #15ac70;          /* selected row */
  --wc-bubble: #95ec69;              /* sent bubble */
  --wc-bubble-ink: #101010;
  --wc-bubble-link: #0a5c33;
  --wc-bubble-code-ink: #0a2e1a;
  --wc-sidebar: #e6e6e8;
  --wc-sidebar-dark: #1c1c1e;
  --wc-surface: #f2f2f2;
  --wc-surface-dark: #232326;
  --wc-overlay-dark: #2a2a2d;
  --wc-border-light: #e0e0e0;
  --wc-border-dark: #303033;
  --wc-avatar-user-a: #ffb37b;
  --wc-avatar-user-b: #f97316;
  --wc-avatar-sel-a: #58c98e;
  --wc-avatar-sel-b: #2fae6d;
  --wc-dot-warning: #ffc53d;
  --wc-dot-error: #ff6b6b;
  --wc-stop: #e5484d;
  --wc-stop-hover: #d13438;
  --wc-btn-idle-bg: #f0f0f0;
  --wc-btn-idle-ink: #9b9b9b;
  --wc-sched-badge: #3b82f6;
}

/* ================= palette ================= */
body.dsh-wechat-skin-on:not([data-dsh-wechat-dark="1"]) {
  --dsw-alias-state-business-primary: var(--wc-green) ;
  --dsw-alias-state-business-tertiary: #e8f7ee ;
  --dsw-alias-state-success-primary: var(--wc-green) ;
  --dsw-alias-button-info-fill: var(--wc-green) ;
  --dsw-alias-button-info-hover: var(--wc-green-hover) ;
  --dsw-alias-brand-primary: var(--wc-green) ;
  --dsw-alias-brand-text: #ffffff ;
  --dsw-alias-interactive-bg-hover: rgba(0, 0, 0, 0.05) ;
  --dsw-alias-interactive-bg-active: rgba(0, 0, 0, 0.08) ;
  --dsw-alias-interactive-bg-hover-accent: rgba(7, 193, 96, 0.10) ;
  --dsw-specific-bubble: var(--wc-bubble) ;
  --dsw-alias-bg-module-platform: var(--wc-surface) ;
  --dsw-alias-bg-overlay: #ffffff ;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] {
  --dsw-alias-state-business-primary: var(--wc-green) ;
  --dsw-alias-state-business-tertiary: #16281f ;
  --dsw-alias-state-success-primary: var(--wc-green) ;
  --dsw-alias-button-info-fill: var(--wc-green) ;
  --dsw-alias-button-info-hover: var(--wc-green-hover) ;
  --dsw-alias-brand-primary: var(--wc-green) ;
  --dsw-alias-brand-text: #ffffff ;
  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08) ;
  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.14) ;
  --dsw-alias-interactive-bg-hover-accent: rgba(7, 193, 96, 0.18) ;
  --dsw-specific-bubble: var(--wc-bubble) ;
  --dsw-alias-bg-module-platform: var(--wc-surface-dark) ;
  --dsw-alias-bg-overlay: var(--wc-overlay-dark) ;
}

/* ================= frame ================= */
body.dsh-wechat-skin-on .PIRFFq_frame { margin-left: 0; }
/* ================= sidebar ================= */
body.dsh-wechat-skin-on .PIRFFq_sidebarCol { background: var(--wc-sidebar); border-right: none; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .PIRFFq_sidebarCol { background: var(--wc-sidebar-dark); }
body.dsh-wechat-skin-on .kB3qhq_newSession { border-radius: 8px; border-color: transparent; background: #ffffff; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .kB3qhq_newSession { background: var(--wc-overlay-dark); }

body.dsh-wechat-skin-on .JoiKIa_sessionRow {
  position: relative; height: 40px; border-radius: 8px; margin: 1px 0; gap: 1px;
}
/* avatar lives on the native leading cell so the row's state indicator can ride on it */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot {
  position: relative; width: 26px; height: 26px; border-radius: 50%; flex: none; color: #ffffff;
  background-image: var(--dsh-avatar, linear-gradient(145deg, var(--wc-avatar-sel-a), var(--wc-avatar-sel-b)));
  background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}
/* status ring around the avatar, driven by the native status spinner's data-state */
body.dsh-wechat-skin-on.dsh-wechat-match .JoiKIa_sessionRow .JoiKIa_slot > [data-state] { display: none !important; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot { overflow: visible; }
/* sessions with an active scheduled task: clock badge on the avatar's bottom-right */
body.dsh-wechat-skin-on .JoiKIa_sessionRow [data-session-schedule-mark] {
  position: absolute; left: -2px; bottom: -2px; right: auto; top: auto;
  width: 12px; height: 12px; margin: 0; padding: 0;
  display: flex; align-items: center; justify-content: center; pointer-events: none;
  border-radius: 50%; clip-path: circle(50%); background: var(--dsw-specific-sidebar-fill, var(--wc-sidebar)); color: var(--wc-sched-badge);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow [data-session-schedule-mark] > svg {
  width: 9px; height: 9px; display: block;
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow [data-session-schedule-mark] > span {
  display: none;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow [data-session-schedule-mark] {
  background: var(--wc-sidebar-dark); color: #7db8ff; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_slot [data-session-schedule-mark] {
  background: #ffffff; color: #1d6fe0; box-shadow: 0 0 0 1px #ffffff;
}

/* running/waiting: ring of small dots orbiting inside the avatar */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state] + span {
  --dot: #ffffff;
  position: absolute; left: 50%; top: 50%; width: 3px; height: 3px;
  margin: -1.5px 0 0 -1.5px; padding: 0; border: none;
  clip: auto; clip-path: none; overflow: visible;
  font-size: 0; line-height: 0; color: transparent; white-space: nowrap;
  border-radius: 50%; background: transparent; z-index: 5; pointer-events: none;
  /* 8 dots orbiting the avatar; the alpha ramp makes the rotation readable */
  box-shadow:
    0 -9.5px 0 0 var(--dot),
    6.7px -6.7px 0 0 color-mix(in srgb, var(--dot) 95%, transparent),
    9.5px 0 0 0 color-mix(in srgb, var(--dot) 88%, transparent),
    6.7px 6.7px 0 0 color-mix(in srgb, var(--dot) 80%, transparent),
    0 9.5px 0 0 color-mix(in srgb, var(--dot) 72%, transparent),
    -6.7px 6.7px 0 0 color-mix(in srgb, var(--dot) 60%, transparent),
    -9.5px 0 0 0 color-mix(in srgb, var(--dot) 45%, transparent),
    -6.7px -6.7px 0 0 color-mix(in srgb, var(--dot) 30%, transparent);
  animation: dsh-wechat-orbit 1.8s linear infinite;
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="warning"] + span { --dot: var(--wc-dot-warning); animation-duration: 2.6s; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="error"] + span { --dot: var(--wc-dot-error); animation-duration: 1s; }
@keyframes dsh-wechat-orbit { to { transform: rotate(360deg); } }


body.dsh-wechat-skin-on .JoiKIa_sessionRow:hover { background: rgba(0, 0, 0, 0.045); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow:hover { background: rgba(255, 255, 255, 0.06); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_title {
  font-size: calc(14px * var(--dsh-wechat-font-scale, 1)); font-weight: 400; color: var(--dsw-alias-label-primary);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected,
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected:hover { background: var(--wc-green-deep); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_title,
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_time,
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_rowResting { color: #ffffff; }


/* ================= chat surface ================= */
/* use the DSH default surface colour; it already adapts to light/dark via the token */
body.dsh-wechat-skin-on .PIRFFq_centerCol,
body.dsh-wechat-skin-on .kiGsTW_root,
body.dsh-wechat-skin-on .kiGsTW_viewArea,
body.dsh-wechat-skin-on .kiGsTW_scrollBody,
body.dsh-wechat-skin-on .tnXGgG_root,
body.dsh-wechat-skin-on .tnXGgG_scroll,
body.dsh-wechat-skin-on .kiGsTW_header { background: var(--dsw-alias-bg-base); }
/* native caps the chat column at 920px and centres it, so wide windows get huge
   side gutters. The token is DEFINED on .kiGsTW_body/.kiGsTW_embeddedBody (closer
   to the column than <body>), so the override must sit on the same elements with
   higher specificity — a body-level value never reaches the column. Downstream
   consumers (composer card = width+32, to-bottom button) follow automatically. */
body.dsh-wechat-skin-on[data-dsh-wechat-width="wide"] .kiGsTW_body,
body.dsh-wechat-skin-on[data-dsh-wechat-width="wide"] .kiGsTW_embeddedBody { --dsh-chat-content-width: calc(100% - 32px); }
body.dsh-wechat-skin-on[data-dsh-wechat-width="medium"] .kiGsTW_body,
body.dsh-wechat-skin-on[data-dsh-wechat-width="medium"] .kiGsTW_embeddedBody { --dsh-chat-content-width: min(calc(100% - 32px), 1200px); }
/* "native" width: no override - official 920px cap */

/* ================= fonts ================= */
body.dsh-wechat-skin-on .tnXGgG_column,
body.dsh-wechat-skin-on .AkCqbG_userStack,
body.dsh-wechat-skin-on .JoiKIa_sessionRow {
  font-family: "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif;
}

/* ================= user bubble + avatar ================= */
body.dsh-wechat-skin-on [data-chat-flow-kind="user"],
body.dsh-wechat-skin-on [data-chat-flow-kind="steering"] { position: relative; }
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] .AkCqbG_userRow,
body.dsh-wechat-skin-on [data-chat-flow-kind="steering"] .AkCqbG_userRow { margin-right: 42px; }
/* user avatar: a real <img>-less circle — clip-path guarantees round no matter what
   the underlying image is (the uploaded avatar bitmap may be square). */
body.dsh-wechat-skin-on [data-chat-flow-kind="user"]::after,
body.dsh-wechat-skin-on [data-chat-flow-kind="steering"]::after {
  content: ""; position: absolute; right: 0; top: 0; width: 34px; height: 34px;
  border-radius: 6px; overflow: hidden;
  background-image: var(--dsh-user-avatar, linear-gradient(135deg, var(--wc-avatar-user-a), var(--wc-avatar-user-b)));
  background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
/* ================= assistant avatar (uniform custom AI avatar) ================= */
/* The native app renders no avatar for assistant rows, and --dsh-assistant-avatar
   had no consumer — paint it ourselves, mirroring the user avatar (34px circle).
   The avatar rides ONLY on the answer row: the router splits one assistant-step
   node into groupPart="reasoning" (thinking chip) and groupPart="response"
   (answer) rows, and the answer keeps the avatar + 42px band. Rows without an
   avatar (thinking, tool/process rows, tails) sit flush left — no reserved
   avatar column (user decision). Empty flow items (height:0 spacers in the
   native sheet) must not paint an avatar, so mirror the native :empty guards. */
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"]):not(:empty):not(:has(>[data-slot="conversation.chat.node"]:empty)) {
  position: relative; margin-left: 42px;
}
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"]):not(:empty):not(:has(>[data-slot="conversation.chat.node"]:empty))::before {
  content: ""; position: absolute; left: -42px; top: 0; width: 34px; height: 34px;
  border-radius: 6px; overflow: hidden;
  background-image: var(--dsh-assistant-avatar, linear-gradient(135deg, var(--wc-avatar-sel-a), var(--wc-avatar-sel-b)));
  background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
/* Process-group seat ("已完成分析" chip, bare .r52wTW_root) has no avatar either —
   flush left like the other avatar-less rows. */
/* The settled-turn line ("已完成，用时 X 秒", button.gTO55a_root) is a system
   notice, not a chat row: WeChat renders those as small centred grey text with
   no divider. Drop the native full-width underline bar, centre the label. */
body.dsh-wechat-skin-on .tnXGgG_column .gTO55a_root {
  justify-content: center; text-align: center;
  border-bottom: none; height: auto; min-height: 0;
  padding: 6px 0 2px; font-size: 12px;
}
/* style the sent bubble itself (independent of the flow-kind wrapper, so the
   optimistic message looks identical the instant it appears — no size/color flash) */
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) {
  background: var(--wc-bubble) !important; color: var(--wc-bubble-ink) !important; border-radius: 8px !important; position: relative;
  font-size: calc(15px * var(--dsh-wechat-font-scale, 1)) !important;
  line-height: calc(23px * var(--dsh-wechat-font-scale, 1)) !important;
}
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) * { color: var(--wc-bubble-ink) !important; }
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) a { color: var(--wc-bubble-link) !important; text-decoration: underline; }
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) code,
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) pre { background: rgba(0, 0, 0, 0.08) !important; color: var(--wc-bubble-code-ink) !important; }
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal])::before {
  content: ""; position: absolute; top: 15px; right: -7px; width: 0; height: 0;
  border-style: solid; border-width: 6px 0 6px 7px; border-color: transparent transparent transparent var(--wc-bubble);
}

/* ================= assistant replies: white WeChat bubble ================= */
/* .XNZzAa_body = the assistant message body. White bubble on light, a raised dark
   card on dark (WeChat-dark style), so replies read as a bubble in both schemes. */
body.dsh-wechat-skin-on.dsh-wechat-match .XNZzAa_body {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  min-width: 40px;
}
/* DARK scheme: raised dark bubble (#2a2a2d on the #111214 wallpaper) */
body.dsh-wechat-skin-on.dsh-wechat-match[data-dsh-wechat-dark="1"] .XNZzAa_body {
  background: #2a2a2d;
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

/* reasoning rows: quiet pill */
body.dsh-wechat-skin-on .ijfCxa_root { background: rgba(0, 0, 0, 0.035); border-radius: 6px; padding: 2px 8px; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .ijfCxa_root { background: rgba(255, 255, 255, 0.06); }
body.dsh-wechat-skin-on .ijfCxa_summary,
body.dsh-wechat-skin-on .ijfCxa_thinkBody { font-size: 12px; }

/* ================= composer ================= */
body.dsh-wechat-skin-on .JZLxKW_card {
  background: #ffffff; border: 1px solid var(--wc-border-light); border-radius: 8px; box-shadow: none;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_card { background: var(--wc-sidebar-dark); border-color: var(--wc-border-dark); }
body.dsh-wechat-skin-on .JZLxKW_primary {
  width: 64px; min-width: 64px; max-width: 64px; height: 30px; padding: 0; border-radius: 5px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--wc-btn-idle-bg); color: var(--wc-btn-idle-ink); font-size: 14px; transition: background-color .1s;
}
body.dsh-wechat-skin-on .JZLxKW_primary::after { content: "发送"; }
body.dsh-wechat-skin-on:lang(zh) .JZLxKW_primary::after { content: "发送"; }
body.dsh-wechat-skin-on:lang(en) .JZLxKW_primary::after { content: "Send"; }
body.dsh-wechat-skin-on:lang(ja) .JZLxKW_primary::after { content: "送信"; }
body.dsh-wechat-skin-on .JZLxKW_primary > svg { display: none; }
/* state comes from the native disabled/sending attributes */
body.dsh-wechat-skin-on .JZLxKW_primary:not(:disabled) { background: var(--wc-green); color: #ffffff; }
body.dsh-wechat-skin-on .JZLxKW_primary:not(:disabled):not([aria-label*="停止"]):not([aria-label*="stop" i]):hover { background: var(--wc-green-hover); }
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"]:hover,
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i]:hover { background: var(--wc-stop-hover); }
body.dsh-wechat-skin-on .JZLxKW_primary[data-sending] { background: var(--wc-green); color: #ffffff; }
body.dsh-wechat-skin-on .JZLxKW_primary[data-sending] > svg { display: block; }
body.dsh-wechat-skin-on .JZLxKW_primary[data-sending]::after { content: none; }
/* while the model is generating the button is a "stop" action (native stop icon, red) */
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"],
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i] {
  background: var(--wc-stop); color: #ffffff;
}
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"] > svg,
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i] > svg { display: block; }
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"]::after,
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i]::after { content: none; }

/* ================= motion ================= */
/* Interactive surfaces ease with the host's own motion tokens, and only on
   compositor-friendly properties (background-color / transform / opacity). */
body.dsh-wechat-skin-on .JoiKIa_sessionRow,
body.dsh-wechat-skin-on .kB3qhq_newSession,
body.dsh-wechat-skin-on .JZLxKW_primary {
  transition: background-color var(--ds-transition-duration-fast, 120ms) var(--ds-ease-in-out, ease-in-out),
    color var(--ds-transition-duration-fast, 120ms) var(--ds-ease-in-out, ease-in-out);
}
/* The running ring must not force a repaint of the whole row: promote it. */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state] + span {
  will-change: transform;
}
/* Respect the OS "reduce motion" setting, like the host UI does. */
@media (prefers-reduced-motion: reduce) {
  body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state] + span,
  body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="user"],
  body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"],
  body.dsh-wechat-skin-on [data-chat-flow-kind="user"] [class*="_bubble_"],
  body.dsh-wechat-skin-on .JoiKIa_sessionRow[data-dsh-enter="1"] {
    animation: none !important;
  }
  body.dsh-wechat-skin-on .JoiKIa_sessionRow,
  body.dsh-wechat-skin-on .kB3qhq_newSession,
  body.dsh-wechat-skin-on .JZLxKW_primary {
    transition: none !important;
  }
}

/* ================= entrance motion ================= */
/* Messages fade+rise once when their DOM node appears (the node is created
   once per message, so this plays exactly once). transform/opacity only, so
   nothing reflows. */
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="user"],
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"] {
  animation: dsh-wechat-in 320ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
/* The sent bubble pops in a touch more than the reply. */
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] [class*="_bubble_"] {
  animation: dsh-wechat-pop 300ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
/* A session row that appears for the first time slides in from the left. */
body.dsh-wechat-skin-on .JoiKIa_sessionRow[data-dsh-enter="1"] {
  animation: dsh-wechat-row-in 340ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes dsh-wechat-in {
  from { opacity: 0.25; transform: translateY(3px); }
  to { opacity: 1; transform: none; }
}
@keyframes dsh-wechat-pop {
  from { opacity: 0.4; transform: scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes dsh-wechat-row-in {
  from { opacity: 0.3; transform: translateX(-4px); }
  to { opacity: 1; transform: none; }
}

/* ================= density + bubble tail toggles ================= */
/* compact density: shorter session rows, tighter message gaps */
body.dsh-wechat-skin-on[data-dsh-wechat-density="compact"] .JoiKIa_sessionRow {
  height: 32px; margin: 0;
}
/* Tighten the base rhythm via the native gap token: items without a local
   --dsh-chat-flow-gap inherit this value, while the native structural gaps
   (12/16px around tool rows, 44px steering-batch start, 0px pending-steering)
   keep their own local values. The old `+` margin rule never won against the
   native sibling selector's specificity. */
body.dsh-wechat-skin-on[data-dsh-wechat-density="compact"] .tnXGgG_column {
  --dsh-chat-flow-gap: 2px;
}
/* bubble tail off: hide the right-pointing triangle on sent bubbles */
body.dsh-wechat-skin-on[data-dsh-wechat-tail="0"] .tnXGgG_column [class*="_bubble_"]:not([data-portal])::before {
  content: none;
}
`;

				/** Settings-row button styles: injected even when the skin is off, so the row keeps hover/active/disabled feedback. */
		const WECHAT_UI_CSS = `
/* dsh-wechat-skin settings-row buttons (always present, not gated by dsh-wechat-skin-on) */
body .dsh-wc-btn {
	cursor: pointer;
	border-radius: 8px;
	font-weight: 500;
	font-family: inherit;
	transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
body .dsh-wc-btn-primary {
	border: none;
	padding: 6px 14px;
	font-size: 13px;
	line-height: 20px;
	color: #ffffff;
	background: #07c160;
}
body .dsh-wc-btn-primary:hover { background: #06ad56; }
body .dsh-wc-btn-primary:active { background: #15ac70; }
body .dsh-wc-btn-secondary {
	border: 1px solid var(--dsw-alias-border-l2);
	padding: 6px 14px;
	font-size: 13px;
	line-height: 20px;
	color: var(--dsw-alias-label-secondary);
	background: var(--dsw-alias-bg-module-platform);
}
body .dsh-wc-btn-secondary:hover { background: var(--dsw-alias-interactive-bg-hover); }
body .dsh-wc-btn-secondary:active { background: var(--dsw-alias-interactive-bg-active); }
body .dsh-wc-btn-sm { padding: 5px 12px; font-size: 12px; line-height: 18px; }
body .dsh-wc-fontbtn { min-width: 34px; height: 30px; padding: 0 8px; }
body .dsh-wc-fontbtn:hover { border-color: #07c160; }
body .dsh-wc-fontbtn-on,
body .dsh-wc-fontbtn-on:hover {
	border-color: #07c160;
	color: #07c160;
	background: rgba(7, 193, 96, 0.08);
}
body .dsh-wc-btn[disabled] {
	opacity: 0.45;
	cursor: not-allowed;
}
body .dsh-wc-btn[disabled]:hover,
body .dsh-wc-btn[disabled]:active {
	background: var(--dsw-alias-bg-module-platform);
	border-color: var(--dsw-alias-border-l2);
	color: var(--dsw-alias-label-secondary);
}
		`;

//#endregion

		//#region dsh-wechat-skin: persistence + DOM helpers
		/** Read a JSON value from localStorage (fallback on absence/error). */
		function readJson(key, fallback) {
			try {
				const value = window.localStorage.getItem(key);
				return value === null ? fallback : JSON.parse(value);
			} catch (e) { return fallback; }
		}
		/** Write a JSON value to localStorage. */
		function writeJson(key, value) {
			try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
		}
		/** Inject the structural stylesheet once. */
		function ensureStyleTag() {
			let tag = document.getElementById(STYLE_TAG_ID);
			if (!tag) {
				tag = document.createElement("style");
				tag.id = STYLE_TAG_ID;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== WECHAT_CSS) tag.textContent = WECHAT_CSS;
		}
		/** Remove the structural stylesheet. */
		function removeStyleTag() {
			const tag = document.getElementById(STYLE_TAG_ID);
			if (tag) tag.remove();
		}
		//#endregion

		/** Inject the settings-row stylesheet (idempotent; kept even while the skin is off). */
		function ensureUiStyleTag() {
			let tag = document.getElementById(UI_STYLE_TAG_ID);
			if (!tag) {
				tag = document.createElement("style");
				tag.id = UI_STYLE_TAG_ID;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== WECHAT_UI_CSS) tag.textContent = WECHAT_UI_CSS;
		}
		function removeUiStyleTag() {
			const tag = document.getElementById(UI_STYLE_TAG_ID);
			if (tag) tag.remove();
		}

		//#region dsh-wechat-skin: avatars + composer (DOM enhancement)
		let avatarMap = readJson(AVATAR_MAP_KEY, {});

		/** Deterministic avatar index from a title — stable across reloads. */
		function avatarIndexForTitle(title) {
			let hash = 0;
			for (let i = 0; i < title.length; i++) {
				hash = (hash * 31 + title.codePointAt(i)) >>> 0;
			}
			return AVATARS.length > 0 ? hash % AVATARS.length : hash;
		}

		/** XML-escape a character for embedding in a generated SVG avatar. */
		function escapeXml(ch) {
			return ch.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
		}

		/** Generate a deterministic colored-initial SVG avatar (no third-party photos). */
		function generatedAvatar(title, seed) {
			const hue = (seed * 47 + 15) % 360;
			const initial = escapeXml(Array.from(title.trim())[0] || "?");
			const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
				+ '<rect width="128" height="128" rx="64" fill="hsl(' + hue + ',55%,58%)"/>'
				+ '<text x="64" y="86" font-size="60" text-anchor="middle" fill="#ffffff" font-family="Microsoft YaHei, Segoe UI, sans-serif">' + initial + '</text></svg>';
			return "data:image/svg+xml," + encodeURIComponent(svg);
		}

		/** Resolve an avatar for an index: photo from the pool, or a generated one. */
		function avatarForIndex(title, index) {
			if (AVATARS.length > 0 && index < AVATARS.length) return AVATARS[index];
			return generatedAvatar(title, index);
		}

		/** Session title of a sidebar row. */
		function titleOf(row) {
			const el = row.querySelector(".JoiKIa_title");
			return el ? el.textContent.trim() : "";
		}

		/** Assign (and persist) a stable avatar to one session row. */
		function assignRowAvatar(row, title) {
			if (avatarMap[title] === undefined) {
				avatarMap[title] = avatarIndexForTitle(title);
				writeJson(AVATAR_MAP_KEY, avatarMap);
			}
			const value = "url(\"" + avatarForIndex(title, avatarMap[title]) + "\")";
if (row.dataset.dshAvatar !== value) {
row.style.setProperty("--dsh-avatar", value);
row.dataset.dshAvatar = value;
}
		}

		/** Last written values for the document-level avatar vars. Rewriting them forces a
		    document-wide style invalidation, so only write when the value actually changed. */
		/** Cached custom avatar (undefined = not read from localStorage yet). */
		let userAvatarDataUrl;
		let aiAvatarDataUrl;
		let lastUserAvatarValue = null;
		let lastAssistantAvatarValue = null;

		/** Set the message-bubble avatars. User = uploaded/default; assistant = active session's avatar. */
		function ensureMessageAvatars() {
			const root = document.documentElement;
			if (userAvatarDataUrl === undefined) userAvatarDataUrl = window.localStorage.getItem(USER_AVATAR_KEY);
			const userAvatar = userAvatarDataUrl || avatarForIndex("me", USER_AVATAR_INDEX);
			const userValue = "url(\"" + userAvatar + "\")";
			if (userValue !== lastUserAvatarValue) {
				root.style.setProperty("--dsh-user-avatar", userValue);
				lastUserAvatarValue = userValue;
			}
			syncAssistantAvatar();
		}

		/** Make the assistant (left) avatar match the active session's sidebar avatar. */
		function syncAssistantAvatar() {
			if (aiAvatarDataUrl === undefined) aiAvatarDataUrl = window.localStorage.getItem(AI_AVATAR_KEY);
			let avatar = aiAvatarDataUrl;
			if (!avatar) {
				const activeRow = document.querySelector('.JoiKIa_sessionRow[aria-selected="true"]');
				const title = activeRow ? titleOf(activeRow) : "";
				const index = (title && avatarMap[title] !== undefined)
					? avatarMap[title]
					: (title ? avatarIndexForTitle(title) : ASSISTANT_AVATAR_INDEX);
				avatar = avatarForIndex(title, index);
			}
			const value = "url(\"" + avatar + "\")";
			if (value !== lastAssistantAvatarValue) {
				document.documentElement.style.setProperty("--dsh-assistant-avatar", value);
				lastAssistantAvatarValue = value;
			}
		}

		/** Downscale an uploaded image to a small JPEG data URL (≤128px). */
		function downscaleImage(file, max = 128) {
			return new Promise((resolve, reject) => {
				const url = URL.createObjectURL(file);
				const img = new Image();
				img.onload = () => {
					const scale = Math.min(1, max / Math.max(img.width, img.height));
					const canvas = document.createElement("canvas");
					canvas.width = Math.max(1, Math.round(img.width * scale));
					canvas.height = Math.max(1, Math.round(img.height * scale));
					const ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					URL.revokeObjectURL(url);
					resolve(canvas.toDataURL("image/jpeg", 0.82));
				};
				img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
				img.src = url;
			});
		}

		/** Set a custom user avatar (persisted + applied). */
		function setUserAvatar(dataUrl) {
			try { window.localStorage.setItem(USER_AVATAR_KEY, dataUrl); } catch (e) {}
			userAvatarDataUrl = dataUrl;
			const value = "url(\"" + dataUrl + "\")";
			document.documentElement.style.setProperty("--dsh-user-avatar", value);
			lastUserAvatarValue = value;
		}

		/** Set the global AI avatar (persisted + applied; overrides per-session avatars). */
		function setAiAvatar(dataUrl) {
			try { window.localStorage.setItem(AI_AVATAR_KEY, dataUrl); } catch (e) {}
			aiAvatarDataUrl = dataUrl;
			const value = "url(\"" + dataUrl + "\")";
			document.documentElement.style.setProperty("--dsh-assistant-avatar", value);
			lastAssistantAvatarValue = value;
		}

		//#region sidebar avatar
		/** Sidebar avatar removed by request: never inject it, and clear any existing one. */
		function ensureSidebarAvatar() { removeSidebarAvatar(); }
		/** Remove the injected sidebar avatar. */
		function removeSidebarAvatar() {
			document.getElementById("dsh-wechat-avatar")?.remove();
		}		//#endregion

		/** Composer drag-to-resize via document-level delegation (survives re-renders).
		    Drag the input box's TOP border up, or its BOTTOM border down, to resize. */
		function initComposerResize() {
			const root = document.documentElement;
			if (root.dataset.dshResizeDelegated) return;
			root.dataset.dshResizeDelegated = "1";

			let dragging = false;
			let fromTop = false;
			let startY = 0;
			let startH = 0;

			const skinOn = () => document.body.classList.contains(BODY_CLASS);
			const applyHeight = (card, height) => {
				card.style.height = height + "px";
				card.style.setProperty("--dsh-composer-text-max-height", Math.max(40, height - 64) + "px");
				writeJson(COMPOSER_H_KEY, height);
			};

			// restore the persisted height whenever a card appears
			const restoreHeight = () => {
				if (!skinOn()) return;
				const card = document.querySelector(".JZLxKW_card");
				if (!card || card.dataset.dshHeightRestored) return;
				const savedHeight = readJson(COMPOSER_H_KEY, null);
				if (typeof savedHeight === "number" && savedHeight >= 64) applyHeight(card, savedHeight);
				card.dataset.dshHeightRestored = "1";
			};

			document.addEventListener("pointerdown", (event) => {
				if (!skinOn()) return;
				const card = document.querySelector(".JZLxKW_card");
				if (!card) return;
				if (event.target.closest && event.target.closest("button, select, input, a, textarea")) return;
				const rect = card.getBoundingClientRect();
				const atTop = event.clientY >= rect.top - 8 && event.clientY <= rect.top + 10;
				const atBottom = event.clientY >= rect.bottom - 10 && event.clientY <= rect.bottom + 8;
				if (!atTop && !atBottom) return;
				dragging = true;
				fromTop = atTop;
				startY = event.clientY;
				startH = rect.height;
				event.preventDefault();
				document.body.style.cursor = "ns-resize";
			});

			document.addEventListener("pointermove", (event) => {
				if (!dragging) return;
				const card = document.querySelector(".JZLxKW_card");
				if (!card) return;
				const delta = fromTop ? (startY - event.clientY) : (event.clientY - startY);
				const height = Math.min(Math.max(startH + delta, 64), Math.round(window.innerHeight * 0.6));
				applyHeight(card, height);
			});

			document.addEventListener("pointerup", () => {
				dragging = false;
				document.body.style.cursor = "";
			});

			restoreHeight();
		}

		/** Debounced full DOM enhancement pass. */
		let scheduled = null;
		function scheduleScan() {
			if (scheduled) return;
			scheduled = requestAnimationFrame(() => {
				scheduled = null;
				scanRows();
				ensureMessageAvatars();
				initComposerResize();
				ensureSidebarAvatar();
			});
		}

		/** Titles already present in the session list (used to animate rows only once). */
		const seenSessionTitles = new Set();
		/** True once the initial list has been captured; the first pass must not animate. */
		let sessionListPrimed = false;

		/** Assign avatars to all visible session rows. */
		function scanRows() {
			const rows = document.querySelectorAll(".JoiKIa_sessionRow");
			for (const row of rows) {
				const title = titleOf(row);
				if (!title) continue;
				assignRowAvatar(row, title);
				// A title seen for the first time slides its row in; known titles never replay.
				if (!seenSessionTitles.has(title)) {
					seenSessionTitles.add(title);
					if (sessionListPrimed) row.dataset.dshEnter = "1";
				}
			}
			// Prime only once a scan has actually seen rows: if the first pass ran
// before the sidebar mounted, the real first render must still not animate.
if (rows.length > 0) sessionListPrimed = true;
		}
		//#endregion

		//#region dsh-wechat-skin: settings row store
		/** Apply the selected font-size level as a CSS scale variable. */
		function applyFontLevel(level) {
			const scale = FONT_SCALES[level] !== undefined ? FONT_SCALES[level] : FONT_SCALES[3];
			document.documentElement.style.setProperty("--dsh-wechat-font-scale", String(scale));
		}

		/** Apply the message-density mode: compact shortens session rows and message gaps. */
		function applyDensity(density) {
			if (!document.body) return;
			if (density === "compact") document.body.dataset.dshWechatDensity = "compact";
			else delete document.body.dataset.dshWechatDensity;
		}

		/** Apply the user-bubble tail visibility. */
		function applyTail(on) {
		  if (document.body) document.body.dataset.dshWechatTail = on ? "1" : "0";
		}

		/** Apply the chat content width mode: wide (full) / medium / native sizing. */
		function applyChatWidth(width) {
		  if (!document.body) return;
		  if (width === "wide" || width === "medium") document.body.dataset.dshWechatWidth = width;
		  else delete document.body.dataset.dshWechatWidth;
		}

		/** Toggle row slot store: enabled flag + font level. */
		function createStore(initialEnabled, initialFontLevel, initialDensity, initialTail, initialChatWidth) {
		  return (0, _runtime_client.defineStore)({
		    init: () => ({ enabled: initialEnabled, fontLevel: initialFontLevel, density: initialDensity, tail: initialTail, chatWidth: initialChatWidth, revision: -1 }),
		    actions: {
		      sync: (d, enabled, fontLevel, density, tail, chatWidth, revision) => {
		        if (revision <= d.revision) return;
		        d.enabled = enabled;
		        d.fontLevel = fontLevel;
		        d.density = density;
		        d.tail = tail;
		        d.chatWidth = chatWidth;
		        d.revision = revision;
					}
				}
			});
		}

		/** Inline styles for static (non-interactive) parts of the settings row. */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 500,
				lineHeight: "22px"
			},
			desc: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "8px"
			}
		};

		/**
		 * The settings row: font size + avatars + density + bubble tail + reset.
		 * Buttons are class-styled (hover/active/disabled live in WECHAT_UI_CSS);
		 * controls without visible effect while the skin is off are disabled.
		 * @param props - composed Settings slot props (t, setFontLevel, setDensity, setTail, setChatWidth, uploadUserAvatar, uploadAiAvatar, resetSkin, useStore).
		 */
		function WechatSkinRow({ t, setFontLevel, setDensity, setTail, setChatWidth, uploadUserAvatar, uploadAiAvatar, resetSkin, useStore }) {
			const fontLevel = useStore((s) => s.fontLevel);
			const density = useStore((s) => s.density);
			const tail = useStore((s) => s.tail);
			const chatWidth = useStore((s) => s.chatWidth);
			const userRef = (0, _react.useRef)(null);
			const aiRef = (0, _react.useRef)(null);
			const onFile = (action) => (event) => {
				const file = event.target.files && event.target.files[0];
				if (file) downscaleImage(file).then(action).catch(() => {});
				event.target.value = "";
			};
			const seg = (pressed) => "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-fontbtn" + (pressed ? " dsh-wc-fontbtn-on" : "");
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("title")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.desc,
						children: t("description")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("fontTitle")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.desc,
						children: t("fontHint")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [0, 1, 2, 3, 4].map((index) => (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: seg(fontLevel === index + 1),
							"aria-pressed": fontLevel === index + 1,
							onClick: () => setFontLevel(index + 1),
							children: t("fontL" + (index + 1))
						}, "font-" + (index + 1)))
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("avatarTitle")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [
							(0, react_jsx_runtime.jsx)("input", {
								ref: userRef,
								type: "file",
								accept: "image/*",
								style: { display: "none" },
								onChange: onFile(uploadUserAvatar)
							}),
							(0, react_jsx_runtime.jsx)("input", {
								ref: aiRef,
								type: "file",
								accept: "image/*",
								style: { display: "none" },
								onChange: onFile(uploadAiAvatar)
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
								onClick: () => userRef.current && userRef.current.click(),
								children: t("uploadUser")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
								onClick: () => aiRef.current && aiRef.current.click(),
								children: t("uploadAi")
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.title,
						children: t("densityTitle")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: seg(density === "cozy"),
								"aria-pressed": density === "cozy",
								onClick: () => setDensity("cozy"),
								children: t("densityCozy")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: seg(density === "compact"),
								"aria-pressed": density === "compact",
								onClick: () => setDensity("compact"),
								children: t("densityCompact")
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
					  style: styles.title,
					  children: t("widthTitle")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
					  style: styles.row,
					  children: [
					    (0, react_jsx_runtime.jsx)("button", {
					      type: "button",
					      className: seg(chatWidth === "wide"),
					      "aria-pressed": chatWidth === "wide",
					      onClick: () => setChatWidth("wide"),
					      children: t("widthWide")
					    }),
					    (0, react_jsx_runtime.jsx)("button", {
					      type: "button",
					      className: seg(chatWidth === "medium"),
					      "aria-pressed": chatWidth === "medium",
					      onClick: () => setChatWidth("medium"),
					      children: t("widthMedium")
					    }),
					    (0, react_jsx_runtime.jsx)("button", {
					      type: "button",
					      className: seg(chatWidth === "native"),
					      "aria-pressed": chatWidth === "native",
					      onClick: () => setChatWidth("native"),
					      children: t("widthNative")
					    })
					  ]
					}),
					(0, react_jsx_runtime.jsx)("div", {
					  style: styles.title,
					  children: t("tailTitle")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: seg(tail === true),
								"aria-pressed": tail === true,
								onClick: () => setTail(true),
								children: t("tailOn")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: seg(tail === false),
								"aria-pressed": tail === false,
								onClick: () => setTail(false),
								children: t("tailOff")
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.row,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
							onClick: () => resetSkin && resetSkin(),
							children: t("reset")
						})
					})
				]
			});
		}
		//#endregion

		//#region dsh-wechat-skin: client plugin body
		/** Required services: theme runtime (token override), slots/locale. */
		const inject = [
			"slots",
			"locale",
			"theme"
		];

		/**
		 * Client plugin body.
		 * @param ctx - client cordis context.
		 */
		function applySkin(ctx) {
			const enabled = true;
			let disposeTokens = null;
			let observer = null;

			/** Whether the skin's structural selectors still exist in this DSH build. */
			const selectorsMatch = () => {
				try { return SELECTOR_PROBES.some((sel) => document.querySelector(sel) !== null); } catch (e) { return false; }
			};
			/** Add/remove the gating body class per (enabled, resolved scheme). */
			let matchLatched = false;
			const syncBodyClass = () => {
if (!document.body) return;
const themeSvc = (typeof ctx.get === "function" ? ctx.get("theme") : undefined) || ctx.theme;
const scheme = themeSvc && typeof themeSvc.getTheme === "function"
? (themeSvc.getTheme().active || {}).colorScheme
: (document.body.hasAttribute("data-ds-dark-theme") ? "dark" : "light");
// Structural CSS needs body.dsh-wechat-match; latch it once the hashed selectors
// are seen so a slow first render cannot leave the skin half-off, while a DSH
// upgrade that renames every class still disables the gated rules.
if (!matchLatched && selectorsMatch()) matchLatched = true;
document.body.classList.add(BODY_CLASS);
if (matchLatched) document.body.classList.add(MATCH_CLASS);
document.body.dataset.dshWechatDark = scheme === "dark" ? "1" : "0";
			};

			/** Apply the current state: token layer + stylesheet + body class. */
			const applyState = () => {
				if (!disposeTokens) {
					const themeSvc = (typeof ctx.get === "function" ? ctx.get("theme") : undefined) || ctx.theme; if (themeSvc) disposeTokens = themeSvc.overrideTokens(OVERRIDE_SOURCE, TOKEN_OVERRIDES);
				}
				ensureStyleTag();
				ensureSidebarAvatar();
				syncBodyClass();
			};

			// Keep the body class in sync when the resolved theme switches
			// light <-> dark, and enhance the DOM (avatars/composer/session rows).
			ctx.on("theme/change", syncBodyClass);
			if (typeof MutationObserver !== "undefined" && document.body) {
				// Only react to mutations that can change what the skin paints. The chat
				// area mutates on every streamed token; scanning on that would burn a
				// frame per token, so those records are filtered out.
				observer = new MutationObserver((records) => {
					for (const record of records) {
						const node = record.target;
						if (node && node.nodeType === 1 && node.closest && node.closest(CHAT_AREA)) continue;
						scheduleScan();
						syncBodyClass();
						return;
					}
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["aria-selected", "data-ds-dark-theme"]
				});
			}

			ensureUiStyleTag();
			applyState();
			scheduleScan();



			// Settings row bookkeeping.
			let fontLevel = Number(readJson(FONT_LEVEL_KEY, 3));
			if (!(fontLevel >= 1 && fontLevel <= 5)) fontLevel = 3;
			applyFontLevel(fontLevel);
			let density = readJson(DENSITY_KEY, "cozy") === "compact" ? "compact" : "cozy";
			applyDensity(density);
			let tail = readJson(TAIL_KEY, true) !== false;
			applyTail(tail);
			let chatWidth = readJson(CHAT_WIDTH_KEY, "wide");
			if (chatWidth !== "wide" && chatWidth !== "medium" && chatWidth !== "native") chatWidth = "wide";
			applyChatWidth(chatWidth);

			const store = createStore(enabled, fontLevel, density, tail, chatWidth);
			let bound = null;
			let revision = 0;
			const sync = () => {
				bound?.sync(enabled, fontLevel, density, tail, chatWidth, ++revision);
			};
			const injected = (actions) => {
				bound = actions;
				sync();
				return {
					setFontLevel: (level) => {
						fontLevel = (level >= 1 && level <= 5) ? level : 3;
						writeJson(FONT_LEVEL_KEY, fontLevel);
						applyFontLevel(fontLevel);
						sync();
					},
					setDensity: (value) => {
						density = value === "compact" ? "compact" : "cozy";
						writeJson(DENSITY_KEY, density);
						applyDensity(density);
						sync();
					},
					setTail: (on) => {
					  tail = !!on;
					  writeJson(TAIL_KEY, tail);
					  applyTail(tail);
					  sync();
					},
					setChatWidth: (value) => {
					  chatWidth = (value === "wide" || value === "medium" || value === "native") ? value : "wide";
					  writeJson(CHAT_WIDTH_KEY, chatWidth);
					  applyChatWidth(chatWidth);
					  sync();
					},
					uploadUserAvatar: (dataUrl) => {
						setUserAvatar(dataUrl);
					},
					uploadAiAvatar: (dataUrl) => {
						setAiAvatar(dataUrl);
					},
					resetSkin: () => {
						try {
							window.localStorage.removeItem(USER_AVATAR_KEY);
							window.localStorage.removeItem(AI_AVATAR_KEY);
							window.localStorage.removeItem(FONT_LEVEL_KEY);
							window.localStorage.removeItem(DENSITY_KEY);
							window.localStorage.removeItem(TAIL_KEY);
							window.localStorage.removeItem(CHAT_WIDTH_KEY);
						} catch (e) {}
						document.documentElement.style.removeProperty("--dsh-user-avatar");
						userAvatarDataUrl = null;
						lastUserAvatarValue = null;
						aiAvatarDataUrl = null;
						lastAssistantAvatarValue = null;
						syncAssistantAvatar();
						document.documentElement.style.removeProperty("--dsh-wechat-font-scale");
						fontLevel = 3; writeJson(FONT_LEVEL_KEY, fontLevel); applyFontLevel(fontLevel);
						density = "cozy"; applyDensity(density);
						tail = true; applyTail(tail);
						chatWidth = "wide"; applyChatWidth(chatWidth);
						sync();
					}
				};
			};

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh: {
					"title": "微信皮肤",
					"description": "仿微信主题：绿色气泡、微信绿强调色。",
					"avatarTitle": "头像",
					"uploadUser": "上传我的头像",
					"uploadAi": "上传 AI 头像",
					"densityTitle": "消息密度",
					"densityCozy": "标准",
					"densityCompact": "紧凑",
					"widthTitle": "对话宽度",
					"widthWide": "全宽",
					"widthMedium": "适中",
					"widthNative": "官方",
					"tailTitle": "气泡尾巴",
					"tailOn": "开",
					"tailOff": "关",
					"fontTitle": "字体大小（5 档）",
					"fontHint": "作用于会话标题与发送气泡",
					"fontL1": "小",
					"fontL2": "较小",
					"fontL3": "标准",
					"fontL4": "较大",
					"fontL5": "大",
					"reset": "恢复默认皮肤设置"
				},
				en: {
					"title": "WeChat Skin",
					"description": "WeChat-style theme: green sent bubbles and WeChat-green accents.",
					"avatarTitle": "Avatars",
					"uploadUser": "Upload my avatar",
					"uploadAi": "Upload AI avatar",
					"densityTitle": "Message density",
					"densityCozy": "Cozy",
					"densityCompact": "Compact",
					"widthTitle": "Chat width",
					"widthWide": "Full",
					"widthMedium": "Medium",
					"widthNative": "Native",
					"tailTitle": "Bubble tail",
					"tailOn": "On",
					"tailOff": "Off",
					"fontTitle": "Font size (5 levels)",
					"fontHint": "Applies to session titles and sent bubbles",
					"fontL1": "XS",
					"fontL2": "S",
					"fontL3": "M",
					"fontL4": "L",
					"fontL5": "XL",
					"reset": "Reset skin settings"
				}
			}), "sone-wx: skin dictionaries");


			ctx.effect(() => () => {
				if (disposeTokens) disposeTokens();
				removeStyleTag();
				removeUiStyleTag();
				document.body?.classList.remove(BODY_CLASS); document.body?.classList.remove("dsh-wechat-match"); if (document.body) { delete document.body.dataset.dshWechatDark; delete document.body.dataset.dshWechatDensity; delete document.body.dataset.dshWechatTail; delete document.body.dataset.dshWechatWidth; }
				observer?.disconnect();
			}, "sone-wx: skin cleanup");
			return { store, injected };
		}
		//#endregion


	const BRAND = (function () {
    var React = require('react')
    var h = React.createElement
    var useState = React.useState
    var useEffect = React.useEffect

    var NAME = 'sone-wx'
    var ROUTE = '/sone-wx/brand'
    var IMAGE_URLS = { mark: ROUTE + '/mark', wordmark: ROUTE + '/wordmark' }
        var IMAGE_TYPES = { png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp' }
    var MAX_BYTES = 2 * 1024 * 1024
    var MAX_TITLE = 40
    /** Host 只回错误码，文案在这里按当前语言取。 */
    var ERROR_KEYS = { unsupported_type: 'typeError', too_large: 'sizeError', bad_image: 'badImage', unauthorized: 'authError', forbidden: 'authError' }

    var TEXT = {
      zh: {
        entry: 'SONE主题',
        pageTitle: '品牌修改',
        intro: '替换左侧栏与新会话页的品牌标志，并修改品牌标题。图片支持 PNG、SVG、WebP，不超过 2 MB。',
        mark: '品牌标志',
        markDesc: '显示在左侧栏顶部、收起状态的侧栏条，以及新会话页的大标志。',
        title: '品牌标题',
        titleDesc: '显示在标志右侧。留空则回到宿主默认标题。',
        titlePlaceholder: '留空使用默认',
        wordmark: '用图片代替标题',
        wordmarkDesc: '标题改用一张文字标志图片（PNG / SVG / WebP）。',
        hero: '新会话页同步',
        heroDesc: '空白会话页的大标志一起替换；关闭后仅改左侧栏。',
        upload: '上传图片',
        replace: '更换图片',
        remove: '移除',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        loading: '正在读取品牌配置…',
        notSet: '未设置',
        typeError: '只接受 PNG、SVG 或 WebP 图片。',
        sizeError: '图片超过 2 MB。',
        badImage: '图片内容与声明的类型不一致。',
        authError: '登录状态已失效，请刷新页面。',
        failError: '保存失败：{detail}',
        preview: '当前标志'
      },
      en: {
        entry: 'SONE Theme',
        pageTitle: 'Brand editor',
        intro: 'Replace the brand mark in the sidebar and on the new-session page, and edit the brand title. PNG, SVG or WebP, up to 2 MB.',
        mark: 'Brand mark',
        markDesc: 'Shown at the top of the sidebar, in the collapsed rail, and as the large mark on the new-session page.',
        title: 'Brand title',
        titleDesc: 'Shown beside the mark. Leave it empty to fall back to the host title.',
        titlePlaceholder: 'Empty uses the default',
        wordmark: 'Use an image as the title',
        wordmarkDesc: 'Replace the title with a wordmark image (PNG / SVG / WebP).',
        hero: 'Sync the new-session page',
        heroDesc: 'Also replace the large mark on the blank session page; off keeps the host one.',
        upload: 'Upload image',
        replace: 'Replace image',
        remove: 'Remove',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        loading: 'Loading brand settings…',
        notSet: 'Not set',
        typeError: 'Only PNG, SVG or WebP images are accepted.',
        sizeError: 'The image is larger than 2 MB.',
        badImage: 'The image content does not match its declared type.',
        authError: 'The session is no longer valid. Reload the page.',
        failError: 'Saving failed: {detail}',
        preview: 'Current mark'
      }
    }

    //#region 状态与读写

    var state = {
      loaded: false,
      title: '',
      wordmarkImage: false,
      heroMark: true,
      mark: null,
      wordmark: null
    }
    var listeners = []
    var ctxRef = null
    var translateRef = null

    function notify() {
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i]()
        } catch (error) { /* 单个订阅者出错不影响其它 */ }
      }
    }

    function setState(patch) {
      for (var key in patch) state[key] = patch[key]
      syncSeats()
      notify()
    }

    function applyAnswer(payload) {
      if (!payload || payload.ok !== true) return
      setState({
        loaded: true,
        title: typeof payload.title === 'string' ? payload.title : '',
        wordmarkImage: payload.wordmarkImage === true,
        heroMark: payload.heroMark !== false,
        mark: payload.mark || null,
        wordmark: payload.wordmark || null
      })
    }

    /** 解析 Host 的失败响应：错误码翻成本地文案，认不出来的保留原文。 */
    function failFrom(res, text) {
      var code = ''
      try {
        code = String(JSON.parse(text).error || '')
      } catch (error) { /* 非 JSON 响应 */ }
      if (ERROR_KEYS[code] !== undefined) return new Error(t(ERROR_KEYS[code]))
      if (code !== '') return new Error(code)
      if (res.status === 401 || res.status === 403) return new Error(t('authError'))
      return new Error(text || 'HTTP ' + res.status)
    }

    function requestJson(url, init) {
      return fetch(url, init).then(function (res) {
        return res.text().then(function (text) {
          if (!res.ok) throw failFrom(res, text)
          try {
            return JSON.parse(text)
          } catch (error) {
            throw failFrom(res, text)
          }
        })
      })
    }

    function load() {
      return fetch(ROUTE, { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status)
          return res.json()
        })
        .then(applyAnswer)
        .catch(function () {
          state.loaded = true
          syncSeats()
          notify()
        })
    }

    function post(patch) {
      return requestJson(ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch)
      }).then(applyAnswer)
    }

    function putImage(kind, file) {
      var type = IMAGE_TYPES[extensionOf(file.name)] || (file.type || '').split(';')[0].trim().toLowerCase()
      if (type !== 'image/png' && type !== 'image/svg+xml' && type !== 'image/webp') {
        return Promise.reject(new Error(t('typeError')))
      }
      if (file.size > MAX_BYTES) return Promise.reject(new Error(t('sizeError')))
      return file.arrayBuffer().then(function (buffer) {
        return requestJson(IMAGE_URLS[kind], { method: 'PUT', headers: { 'content-type': type }, body: buffer })
      }).then(function (payload) {
        applyAnswer(payload)
        // 上传文字标志后直接启用它，省掉一次手动开关
        if (kind === 'wordmark' && payload && payload.ok === true && payload.wordmarkImage !== true) {
          return post({ wordmarkImage: true })
        }
        return payload
      })
    }

    function removeImage(kind) {
      return requestJson(IMAGE_URLS[kind], { method: 'DELETE' }).then(applyAnswer)
    }

    function extensionOf(name) {
      var cut = String(name || '').lastIndexOf('.')
      return cut < 0 ? '' : String(name).slice(cut + 1).toLowerCase()
    }

    function imageUrl(kind) {
      var info = state[kind]
      if (!info) return null
      return IMAGE_URLS[kind] + '?v=' + encodeURIComponent(info.version || '0')
    }

    //#endregion

    //#region 文案

    function lang() {
      var locale = ctxRef && typeof ctxRef.get === 'function' ? ctxRef.get('locale') : null
      var active = ''
      try {
        var snap = locale && typeof locale.getSnapshot === 'function' ? locale.getSnapshot() : null
        active = String((snap && snap.active) || '')
      } catch (error) {
        active = ''
      }
      if (!active) active = String((navigator.language || 'zh'))
      return active.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en'
    }

    /** 优先用宿主 locale 服务；服务不可用时退回内置字典。 */
    function t(key, vars) {
      var text
      if (typeof translateRef === 'function') {
        var translated = translateRef(key)
        if (typeof translated === 'string' && translated !== '' && translated !== key) text = translated
      }
      if (text === undefined) {
        var dict = TEXT[lang()] || TEXT.zh
        text = dict[key] !== undefined ? dict[key] : TEXT.zh[key]
      }
      if (text === undefined) return key
      if (!vars) return text
      for (var name in vars) text = text.split('{' + name + '}').join(String(vars[name]))
      return text
    }

    /** 把本插件的字典登记进宿主 locale 服务，让语言切换跟随宿主。 */
    function bindLocale(ctx) {
      var locale = ctx && typeof ctx.get === 'function' ? ctx.get('locale') : null
      if (!locale || typeof locale.register !== 'function') return []
      var disposers = []
      try {
        if (typeof locale.register === 'function') {
          var offZh = locale.register('sone-wx.brand', 'zh', TEXT.zh)
          if (typeof offZh === 'function') disposers.push(offZh)
          var offEn = locale.register('sone-wx.brand', 'en', TEXT.en)
          if (typeof offEn === 'function') disposers.push(offEn)
        }
        if (typeof locale.bind === 'function') {
          var bound = locale.bind('sone-wx.brand')
          if (typeof bound === 'function') translateRef = bound
        }
      } catch (error) {
        translateRef = null
      }
      return disposers
    }

    //#endregion

    //#region 品牌位接管

    var SEATS = {
      'sidebar.brand.mark': function () {
        return state.mark !== null
      },
      'sidebar.brand.name': function () {
        return state.title !== '' || (state.wordmarkImage === true && state.wordmark !== null)
      },
      'conversation.hero.brand.mark': function () {
        return state.mark !== null && state.heroMark === true
      }
    }

    /**
     * 主题插件（如 dsh-claude-style）会给宿主品牌容器打上 data-dsh-claude-part 标记，
     * 用 `display:none!important` 藏掉容器里的子节点，再在容器上自绘标志。
     * 这里只针对我们自己的元素反制：命中 `[data-dsh-sone-wx]`，
     * 且仅在主题插件的标记存在时才有意义——主题关闭时这些规则天然不生效。
     * 间距不在这里做：容器属性因主题而异，间距放在我们自己的名称元素 margin 上。
     */
    var OWNED_CSS = [
      'body[data-dsh-claude-style][data-dsh-claude-style][data-dsh-claude-style][data-dsh-claude-style]',
      ' [data-dsh-sone-wx]{display:block!important;opacity:1!important;visibility:visible!important}',
      'body[data-dsh-claude-style][data-dsh-claude-style][data-dsh-claude-style][data-dsh-claude-style]',
      ' :is([data-dsh-claude-part~="brand-mark"],[data-dsh-claude-part~="rail-mark"],',
      '[data-dsh-claude-part~="brand-name"],[data-dsh-claude-part~="hero-mark"])',
      ':has([data-dsh-sone-wx]):before{content:none!important;display:none!important}'
    ].join('')
    /** 标志与名称的间距：加在自己的名称元素左侧，不依赖任何主题。 */
    var NAME_GAP = 6

    var seats = {}

    /** 低数值的 priority 抢占该座位；比已存在的注册更低，保证覆盖宿主与其它插件。 */
    function winPriority(name) {
      var entries = []
      try {
        entries = (ctxRef && ctxRef.slots && ctxRef.slots.entries && ctxRef.slots.entries(name)) || []
      } catch (error) {
        entries = []
      }
      var taken = []
      for (var i = 0; i < entries.length; i++) {
        taken.push(((entries[i].options && entries[i].options.priority) || 0) - 1)
      }
      return Math.min.apply(Math, [-200].concat(taken))
    }

    /**
     * 按当前配置挂/摘品牌位。slots.inject 返回的 disposer 由我们保存，
     * 配置清空时立刻调用，宿主默认随即回来。
     */
    function syncSeats() {
      if (ctxRef === null || !ctxRef.slots || typeof ctxRef.slots.inject !== 'function') return
      for (var name in SEATS) {
        var wanted = SEATS[name]()
        var current = seats[name]
        if (wanted && !current) seats[name] = mountSeat(name)
        else if (!wanted && current) {
          try {
            current()
          } catch (error) { /* 宿主已回收 */ }
          seats[name] = null
        }
      }
    }

    /** 独立函数：每个座位各自捕获 name，避免 inject 回调重放时读到被覆盖的循环变量。 */
    function mountSeat(name) {
      return ctxRef.slots.inject(name, function () {
        return ctxRef.slots.register({ name: name, priority: winPriority(name) }, BRAND_VIEWS[name])
      })
    }

    function MarkView(props) {
      var size = props && typeof props.size === 'number' ? props.size : 24
      var src = imageUrl('mark')
      if (src === null) return null
      return h('img', {
        src: src,
        alt: '',
        draggable: false,
        'data-dsh-sone-wx': 'mark',
        style: { display: 'block', width: size, height: size, objectFit: 'contain', flex: 'none' }
      })
    }

    function HeroMarkView() {
      var src = imageUrl('mark')
      if (src === null) return null
      return h('img', {
        src: src,
        alt: '',
        draggable: false,
        'data-dsh-sone-wx': 'hero-mark',
        style: { display: 'block', width: 44, height: 44, objectFit: 'contain', flex: 'none' }
      })
    }

    function NameView() {
      var wordSrc = state.wordmarkImage === true ? imageUrl('wordmark') : null
      if (wordSrc !== null) {
        return h('img', {
          src: wordSrc,
          alt: state.title || 'brand',
          draggable: false,
          'data-dsh-sone-wx': 'name',
          style: { display: 'block', height: 18, maxWidth: '100%', width: 'auto', objectFit: 'contain', marginLeft: NAME_GAP }
        })
      }
      if (state.title === '') return null
      return h('span', {
        'data-dsh-sone-wx': 'name',
        style: {
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: 500, fontSize: '18px', lineHeight: '24px',
          color: 'var(--dsw-alias-label-primary, inherit)',
          marginLeft: NAME_GAP
        }
      }, state.title)
    }

    var BRAND_VIEWS = {
      'sidebar.brand.mark': MarkView,
      'sidebar.brand.name': NameView,
      'conversation.hero.brand.mark': HeroMarkView
    }

    //#endregion

    //#region 页面样式

    var S = {
      root: { display: 'flex', flexDirection: 'column', minWidth: 0 },
      head: { padding: '16px 0 6px' },
      block: {
        borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
        padding: '14px 0', boxSizing: 'border-box'
      },
      blockHead: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' },
      blockTitle: { fontSize: '14px', fontWeight: 500, lineHeight: '22px', color: 'var(--dsw-alias-label-primary)' },
      blockDesc: {
        margin: '0 0 10px', fontSize: '12px', lineHeight: '18px',
        color: 'var(--dsw-alias-label-tertiary)'
      },
      row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
      preview: {
        width: '44px', height: '44px', flex: 'none', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: '10px',
        background: 'var(--dsw-alias-bg-layer-2, rgba(128,128,128,.08))', overflow: 'hidden'
      },
      previewImg: { display: 'block', maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' },
      previewEmpty: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' },
      input: {
        flex: '1 1 200px', minWidth: '0', height: '32px', padding: '0 10px', boxSizing: 'border-box',
        border: '0.5px solid var(--dsw-alias-border-l2)', borderRadius: '8px',
        background: 'var(--dsw-alias-bg-base, transparent)',
        color: 'var(--dsw-alias-label-primary)', fontFamily: 'inherit', fontSize: '13px', outline: 'none'
      },
      ghost: {
        height: '32px', flex: 'none', padding: '0 10px', boxSizing: 'border-box',
        border: '0', borderRadius: '8px', background: 'transparent',
        color: 'var(--dsw-alias-label-tertiary)', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer'
      },
      disabled: { opacity: 0.45, cursor: 'not-allowed' },
      switch: {
        position: 'relative', display: 'inline-block', width: '34px', height: '20px', flex: 'none',
        borderRadius: '999px', border: '0', cursor: 'pointer', padding: '0',
        background: 'var(--dsw-alias-state-idle-primary, rgba(128,128,128,.3))',
        transition: 'background 250ms ease-out'
      },
      switchOn: { background: '#07c160' },
      switchKnob: {
        position: 'absolute', top: '2px', left: '2px', width: '16px', height: '16px',
        borderRadius: '999px', background: 'var(--dsw-alias-bg-overlay, #fff)',
        boxShadow: '0 1px 2px rgba(0,0,0,.25)',
        transition: 'transform 250ms ease-out'
      },
      switchKnobOn: { transform: 'translateX(14px)' },
      switchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
      status: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', minWidth: '0', wordBreak: 'break-all' },
      ok: { color: 'var(--dsw-alias-state-success-primary)' },
      err: { color: 'var(--dsw-alias-state-error-primary)' },
      hint: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' }
    }

    //#endregion

    //#region 品牌页

    /** 订阅品牌状态的 hook。 */
    function useBrandState() {
      var pair = useState(0)
      var bump = pair[1]
      useEffect(function () {
        var listener = function () {
          bump(function (n) { return n + 1 })
        }
        listeners.push(listener)
        return function () {
          var index = listeners.indexOf(listener)
          if (index >= 0) listeners.splice(index, 1)
        }
      }, [])
      return state
    }

    /** 上传按钮：隐藏 file input + 触发。 */
    function UploadButton(props) {
      var kind = props.kind
      var label = props.label
      var disabled = props.disabled
      var onError = props.onError
      var busy = useState(false)
      // 每个实例一个可变容器：ref 回调直接写入，不触发重渲染
      var holder = useState(function () { return { node: null } })[0]

      function pick() {
        if (disabled || busy[0]) return
        var input = holder.node
        if (!input) return
        input.value = ''
        input.click()
      }

      function onChange(event) {
        var file = event.target.files && event.target.files[0]
        if (!file) return
        busy[1](true)
        putImage(kind, file).then(function () {
          busy[1](false)
        }).catch(function (error) {
          busy[1](false)
          onError(String(error && error.message ? error.message : error))
        })
      }

      return h('span', { style: { display: 'inline-flex' } },
        h('button', {
          type: 'button',
          className: 'dsh-wc-btn dsh-wc-btn-secondary',
          disabled: disabled || busy[0],
          onClick: pick
        }, busy[0] ? t('saving') : label),
        h('input', {
          ref: function (node) {
            holder.node = node
          },
          type: 'file',
          accept: 'image/png,image/svg+xml,image/webp',
          style: { display: 'none' },
          onChange: onChange,
          'aria-hidden': 'true',
          tabIndex: -1
        })
      )
    }

    function Switch(props) {
      var on = !!props.checked
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': props.label,
        style: on ? Object.assign({}, S.switch, S.switchOn) : S.switch,
        onClick: function () {
          props.onChange(!on)
        }
      }, h('span', { style: on ? Object.assign({}, S.switchKnob, S.switchKnobOn) : S.switchKnob }))
    }

    function BrandStudioSection() {
      var snap = useBrandState()
      var title = useState(snap.title)
      var status = useState({ kind: '', detail: '' })
      var dirty = title[0] !== snap.title

      useEffect(function () {
        title[1](snap.title)
      }, [snap.title])

      function setStatus(kind, detail) {
        status[1]({ kind: kind, detail: detail || '' })
      }

      function reportError(error) {
        setStatus('err', t('failError', { detail: String(error && error.message ? error.message : error) }))
      }

      function saveTitle() {
        if (!dirty) return
        post({ title: title[0].trim() }).then(function () {
          setStatus('ok', t('saved'))
        }).catch(reportError)
      }

      function toggleWordmark(next) {
        post({ wordmarkImage: next }).then(function () {
          setStatus('ok', t('saved'))
        }).catch(reportError)
      }

      function toggleHero(next) {
        post({ heroMark: next }).then(function () {
          setStatus('ok', t('saved'))
        }).catch(reportError)
      }

      function removeMark(kind) {
        removeImage(kind).then(function () {
          setStatus('ok', t('saved'))
        }).catch(reportError)
      }

      var markSrc = imageUrl('mark')
      var wordSrc = imageUrl('wordmark')

      var children = [h('div', { style: S.head, key: 'head' },
        h('div', { style: S.blockHead }, h('span', { style: S.blockTitle }, t('pageTitle'))),
        h('p', { style: Object.assign({}, S.blockDesc, { margin: 0 }) }, t('intro')))]

      if (!snap.loaded) {
        children.push(h('div', { style: S.hint, key: 'loading' }, t('loading')))
      }

      children.push(h('div', { style: S.block, key: 'mark' },
        h('div', { style: S.blockHead }, h('span', { style: S.blockTitle }, t('mark'))),
        h('p', { style: S.blockDesc }, t('markDesc')),
        h('div', { style: S.row },
          h('div', { style: S.preview, title: t('preview') },
            markSrc === null
              ? h('span', { style: S.previewEmpty }, t('notSet'))
              : h('img', { src: markSrc, alt: '', style: S.previewImg, draggable: false })),
          h(UploadButton, {
            kind: 'mark',
            label: markSrc === null ? t('upload') : t('replace'),
            disabled: !snap.loaded,
            onError: function (detail) {
              setStatus('err', detail)
            }
          }),
          markSrc === null ? null : h('button', {
            type: 'button', style: S.ghost, onClick: function () {
              removeMark('mark')
            }
          }, t('remove'))
        )))

      children.push(h('div', { style: S.block, key: 'title' },
        h('div', { style: S.blockHead }, h('span', { style: S.blockTitle }, t('title'))),
        h('p', { style: S.blockDesc }, t('titleDesc')),
        h('div', { style: S.row },
          h('input', {
            style: S.input,
            value: title[0],
            maxLength: MAX_TITLE,
            placeholder: t('titlePlaceholder'),
            onChange: function (event) {
              title[1](event.target.value)
              setStatus('', '')
            },
            onKeyDown: function (event) {
              if (event.key === 'Enter') saveTitle()
            }
          }),
          h('button', {
            type: 'button',
            className: 'dsh-wc-btn dsh-wc-btn-primary',
            disabled: !dirty,
            onClick: saveTitle
          }, t('save'))
        )))

      children.push(h('div', { style: S.block, key: 'wordmark' },
        h('div', { style: S.blockHead }, h('span', { style: S.blockTitle }, t('wordmark'))),
        h('p', { style: S.blockDesc }, t('wordmarkDesc')),
        h('div', { style: S.switchRow },
          h(Switch, {
            checked: snap.wordmarkImage,
            label: t('wordmark'),
            onChange: toggleWordmark
          }),
          wordSrc === null
            ? h(UploadButton, {
              kind: 'wordmark',
              label: t('upload'),
              disabled: !snap.loaded,
              onError: function (detail) {
                setStatus('err', detail)
              }
            })
            : h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: 0 } },
              h('img', {
                src: wordSrc, alt: '', draggable: false,
                style: { display: 'block', height: '18px', maxWidth: '160px', objectFit: 'contain' }
              }),
              h(UploadButton, {
                kind: 'wordmark',
                label: t('replace'),
                disabled: !snap.loaded,
                onError: function (detail) {
                  setStatus('err', detail)
                }
              }),
              h('button', {
                type: 'button', style: S.ghost, onClick: function () {
                  removeMark('wordmark')
                }
              }, t('remove')))
        )
      ))

      children.push(h('div', { style: S.block, key: 'hero' },
        h('div', { style: S.blockHead }, h('span', { style: S.blockTitle }, t('hero'))),
        h('p', { style: S.blockDesc }, t('heroDesc')),
        h(Switch, {
          checked: snap.heroMark,
          label: t('hero'),
          onChange: toggleHero
        })
      ))

      children.push(h('div', { style: S.row, key: 'status' },
        status[0].kind === 'err'
          ? h('span', { style: Object.assign({}, S.status, S.err) }, status[0].detail)
          : status[0].kind === 'ok'
            ? h('span', { style: Object.assign({}, S.status, S.ok) }, status[0].detail)
            : null))

      return h('div', { style: S.root, 'aria-label': t('pageTitle') }, children)
    }

    //#endregion

    function applyBrand(ctx) {
      ctxRef = ctx
      if (!ctx.slots || typeof ctx.slots.inject !== 'function') return

      if (typeof ctx.effect === 'function') {
        ctx.effect(function () {
          var offDicts = bindLocale(ctx)

          // 反制主题插件品牌覆盖的规则：随插件装载、随插件卸载移除
          var style = document.createElement('style')
          style.setAttribute('data-dsh-sone-wx', 'style')
          style.textContent = OWNED_CSS
          document.head.appendChild(style)


          load()

          var offLocale = null
          var locale = typeof ctx.get === 'function' ? ctx.get('locale') : null
          if (locale && typeof locale.subscribe === 'function') {
            offLocale = locale.subscribe(notify)
          }

          return function () {
            if (typeof offLocale === 'function') offLocale()
            for (var i = 0; i < offDicts.length; i++) offDicts[i]()
            translateRef = null
            style.remove()
            for (var name in seats) {
              if (seats[name]) {
                try {
                  seats[name]()
                } catch (error) { /* 宿主已回收 */ }
                seats[name] = null
              }
            }
            ctxRef = null
          }
        }, 'sone-wx: brand')
      } else {
        bindLocale(ctx)
        load()
      }
    }


		return { applyBrand: applyBrand, BrandStudioSection: BrandStudioSection, t: t };
	})();

//#region sone-wx: merged settings section

/**
 * Error boundary around the merged page: a render failure in either half
 * must not silently blank the section — surface the reason on the page and
 * in the console so it is diagnosable.
 */
class SoneWxBoundary extends _react.Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		try { console.error("[sone-wx] section render error:", error, info && info.componentStack); } catch (e) { /* noop */ }
		try { window.__soneWxLastError = String((error && error.stack) || error); } catch (e) { /* noop */ }
	}
	render() {
		const error = this.state.error;
		if (!error) return this.props.children;
		return (0, react_jsx_runtime.jsxs)("div", {
			style: { padding: "12px 14px", border: "1px solid rgba(229,72,77,0.4)", borderRadius: 8, fontSize: 12, lineHeight: 1.6 },
			children: [
				(0, react_jsx_runtime.jsx)("div", { style: { fontWeight: 600 }, children: "SONE主题 渲染出错" }),
				(0, react_jsx_runtime.jsx)("pre", {
					style: { margin: "6px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "inherit", fontSize: 11 },
					children: String((error && error.stack) || error)
				})
			]
		});
	}
}

/**
 * Merged settings page: the WeChat skin controls on top, the brand
 * editor below. Props (t/useStore/actions) come from the slot
 * composition of the section registration (store + locale + inject).
 * If the composition ever withholds them, say so visibly instead of
 * crashing into a blank page.
 */
function SoneWxSection(props) {
const missing = [];
if (typeof props !== "object" || props === null) missing.push("props");
else {
if (typeof props.t !== "function") missing.push("t");
if (typeof props.useStore !== "function") missing.push("useStore");
if (!props.actions || typeof props.actions !== "object") missing.push("actions");
}
return (0, react_jsx_runtime.jsx)(SoneWxBoundary, {
children: (0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", flexDirection: "column", gap: 20 },
children: [
missing.length === 0 ? null : (0, react_jsx_runtime.jsxs)("div", {
style: { padding: "10px 12px", border: "1px solid rgba(230,167,0,0.5)", borderRadius: 8, fontSize: 12 },
children: [
(0, react_jsx_runtime.jsx)("div", { style: { fontWeight: 600 }, children: "SONE主题：组合参数缺失" }),
(0, react_jsx_runtime.jsx)("div", { children: "缺少 " + missing.join(", ") + "（slot 组合层未传入）" }),
(0, react_jsx_runtime.jsx)("div", { children: "收到参数：" + Object.keys(props || {}).join(", ") })
]
}),
(0, react_jsx_runtime.jsx)(WechatSkinRow, props),
(0, react_jsx_runtime.jsx)(BRAND.BrandStudioSection, {})
]
})
});
}

/** 设置分区图标：微信绿对话气泡。 */
function SoneWxIcon(props) {
var size = props && typeof props.size === "number" ? props.size : 18;
return (0, react_jsx_runtime.jsxs)("svg", {
width: size, height: size, viewBox: "0 0 18 18", fill: "none",
stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round",
"aria-hidden": "true",
children: [
(0, react_jsx_runtime.jsx)("path", {
d: "M9 2.6c3.8 0 6.9 2.6 6.9 5.8 0 3.3-3.1 5.8-6.9 5.8-.74 0-1.46-.1-2.14-.28l-2.56 1.28.5-2.3C3.2 11.9 2.1 10.3 2.1 8.4c0-3.2 3.1-5.8 6.9-5.8z"
}),
(0, react_jsx_runtime.jsx)("circle", { cx: 6.6, cy: 7.7, r: 0.85, fill: "currentColor", stroke: "none" }),
(0, react_jsx_runtime.jsx)("circle", { cx: 11.4, cy: 7.7, r: 0.85, fill: "currentColor", stroke: "none" })
]
});
}

/**
 * Client plugin body: skin half (tokens/style/observers/store) + brand
 * half (brand state/seats/OWNED_CSS) + table stabilizer half (wide
 * Markdown table scrollbar reserve), then one settings.section.
 */

//#region sone-wx: table stabilizer (merged from dsh-table-stabilizer)

/**
 * Wide Markdown tables (>= 4 columns) reserve room for their hover-revealed
 * horizontal scrollbar with `padding-bottom: var(--dsh-scrollbar-width, 5px)`
 * and flip `overflow-x: hidden -> scroll` on hover. The host never binds
 * --dsh-scrollbar-width on the table container, so the reserve falls back to
 * 5px while the Claude-style theme paints an 8px scrollbar: on hover the real
 * scrollbar eats 3px more than the reserve and the table jumps up.
 *
 * Fix: bind --dsh-scrollbar-width on the table containers to the actual
 * horizontal scrollbar height, so reserve == real consumption and the hover
 * transition moves nothing.
 */
const TABLE_SELECTORS = [
	'[data-dsh-claude-part~="table-scroll"]',
	'[class*="tableScroll"]'
];

function tableRuleFor(px) {
	return TABLE_SELECTORS.map((s) => `${s}{--dsh-scrollbar-width:${px}px}`).join(",");
}

function tableScrollbarMeasure() {
	const probe = document.createElement("div");
	probe.style.cssText =
		"position:absolute;top:-9999px;left:-9999px;width:100px;height:40px;" +
		"overflow-x:scroll;overflow-y:hidden;visibility:hidden;pointer-events:none;";
	document.body.appendChild(probe);
	const h = probe.offsetHeight - probe.clientHeight;
	probe.remove();
	// 0 is a valid reading (overlay scrollbars consume nothing).
	return Number.isFinite(h) && h >= 0 && h < 40 ? Math.round(h) : 8;
}

function applyTableStabilizer(ctx) {
	if (typeof document === "undefined") return;

	const style = document.createElement("style");
	style.dataset.plugin = "sone-wx:table";
	style.textContent = tableRuleFor(8);

	ctx.effect(
		() => {
			document.head.append(style);
			return () => style.remove();
		},
		"sone-wx: table stabilizer stylesheet"
	);

	// Re-measure: the theme's 8px is the default, but a system switch to
	// overlay scrollbars (height 0 -> keep the reserve small) or a future
	// theme change would make the static rule wrong. Cheap, no observers.
	function sync() {
		const px = tableScrollbarMeasure();
		const next = tableRuleFor(px);
		if (style.textContent !== next) style.textContent = next;
	}

	ctx.effect(
		() => {
			sync();
			const timers = [
				window.setTimeout(sync, 1500),
				window.setTimeout(sync, 8000)
			];
			window.addEventListener("resize", sync);
			window.addEventListener("focus", sync);
			return () => {
				timers.forEach((t) => window.clearTimeout(t));
				window.removeEventListener("resize", sync);
				window.removeEventListener("focus", sync);
			};
		},
		"sone-wx: table stabilizer measurement"
	);
}

//#endregion

/** 渲染端 slot 崩溃自诊断：SlotErrorBoundary 会 console.error 崩溃详情后把条目
 * abdicate 成空白（页面只剩 <div data-slot-error>），Electron 渲染进程的
 * console 我方不可见，故拦截 console.error/unhandledrejection，把匹配
 * "slot entry crashed"/"slot factory occurrence crashed" 的错误 POST 到
 * 宿主 /sone-wx/diag 落盘（~/.dsh/sone-wx/diag.json），供外部读取。 */
function installDiagHook() {
if (globalThis.__soneWxDiagHooked) return;
globalThis.__soneWxDiagHooked = true;
const post = (msg) => {
try {
fetch("/sone-wx/diag", {
method: "POST",
headers: { "content-type": "application/json" },
body: JSON.stringify({ t: Date.now(), msg: String(msg).slice(0, 4000) })
}).catch(() => {});
} catch {}
};
const origError = console.error.bind(console);
console.error = (...args) => {
try {
const head = typeof args[0] === "string" ? args[0] : "";
if (head.includes("slot entry crashed") || head.includes("slot factory occurrence crashed")) {
const text = args.map((a) => {
if (a instanceof Error) return a.stack || String(a);
if (typeof a === "string") return a;
try { return JSON.stringify(a); } catch { return String(a); }
}).join(" | ");
post(text);
}
} catch {}
origError(...args);
};
try {
window.addEventListener("unhandledrejection", (event) => {
try {
const reason = event && event.reason;
const text = reason instanceof Error ? (reason.stack || String(reason)) : String(reason);
if (text.includes("slot") || text.includes("settings.section")) post("unhandledrejection: " + text);
} catch {}
});
} catch {}
}

function apply(ctx) {
try { installDiagHook(); } catch {}
const skin = applySkin(ctx);
BRAND.applyBrand(ctx);
applyTableStabilizer(ctx);
ctx.effect(() => {
const offSection = ctx.slots.inject("settings.section", () => ctx.slots.register({
name: "settings.section",
id: "sone-wx",
order: 50,
label: () => BRAND.t("entry"),
locale: SETTINGS_NS,
store: skin.store,
inject: skin.injected
}, SoneWxSection));
const offIcon = ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
name: "settings.section.icon",
id: "sone-wx"
}, SoneWxIcon));
return () => {
offSection();
offIcon();
};
}, "sone-wx: settings section");
}
//#endregion

exports.apply = apply;
exports.inject = inject;
return module.exports;
}
});
