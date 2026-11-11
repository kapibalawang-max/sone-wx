// sone-wx — merged client bundle: dsh-wechat-skin (WeChat-style skin) +
// dsh-brand-studio (brand editor) under one settings section.
//
// Skin half: tokens/structure CSS/avatars/density/chat width/fonts.
// localStorage keys stay `dsh-wechat-skin:*` for data continuity.
// Brand half: brand mark/title/wordmark via /sone-wx/brand (host side), seats
// sidebar.brand.* + conversation.hero.brand.mark, OWNED_CSS countermeasures.
// Both halves register NO settings slots themselves; the merged apply mounts a
// single settings.section `sone-wx` stacking WechatSkinRow + BrandStudioSection.

// ---------------------------------------------------------------------------
// File layout. DSH loads a client plugin as ONE browser artifact (a lazy
// factory registered by id), so this cannot be split into ES modules; the
// //#region markers below are the module boundaries. Grep the region name.
//   1 constants, tokens, WECHAT_CSS / WECHAT_UI_CSS      "dsh-wechat-skin: constants"
//   2 persistence + DOM helpers                          "dsh-wechat-skin: persistence"
//   3 avatars, composer, sidebar DOM enhancement         "dsh-wechat-skin: avatars"
//   4 store + sidebar background + panel order           "dsh-wechat-skin: settings row store"
//   5 settings UI (SkinPreview, WechatSkinRow)           "dsh-wechat-skin: client plugin body"
//   6 BRAND (state, text, seats, styles, page)           "BRAND"
//   7 merged settings section + icon                     "sone-wx: merged settings section"
//   8 table stabilizer                                   "sone-wx: table stabilizer"
//   9 diagnostics + apply()                              "sone-wx: apply"
// Rule: UI text goes through t(); colours through --wc-* / --dsw-alias-*.
// ---------------------------------------------------------------------------
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
		/** Surfaces that only exist in some contexts (right rail open, tool call, subagent). */
		const CONTEXT_PROBES = [".Dv5QdW_panel", ".UHhYua_root", "._3j1mRa_node"];
		/** The streaming chat column; mutations inside it do not affect the skin's DOM work. */
		const CHAT_AREA = ".tnXGgG_scroll, .tnXGgG_column, .kiGsTW_scrollBody, .kiGsTW_viewArea";
		/** Fixed avatar indices for message bubbles (user / assistant). */
		const USER_AVATAR_INDEX = 25;
		const ASSISTANT_AVATAR_INDEX = 5;
		/** localStorage keys for custom (user-uploaded) avatars. */
		const USER_AVATAR_KEY = "dsh-wechat-skin:user-avatar";
		/** localStorage key for the font-size level (1..5, default 3 = middle). */
		const FONT_LEVEL_KEY = "dsh-wechat-skin:font-level";
		const TEXT_FONT_LEVEL_KEY = "dsh-wechat-skin:text-font-level";
		const AI_AVATAR_KEY = "dsh-wechat-skin:ai-avatar";
		const DENSITY_KEY = "dsh-wechat-skin:density";
		const CHAT_WIDTH_KEY = "dsh-wechat-skin:chat-width";
		const USER_AVATAR_ENABLED_KEY = "dsh-wechat-skin:user-avatar:enabled";
		const AI_AVATAR_ENABLED_KEY = "dsh-wechat-skin:ai-avatar:enabled";
		// Legacy key for configs exported before the enabled rename
		const AI_AVATAR_SHOW_KEY_LEGACY = "dsh-wechat-skin:ai-avatar-visible";
		/** Custom sidebar fill (null = the skin's own light/dark sidebar colour). */
		const SIDEBAR_BG_KEY = "dsh-wechat-skin:sidebar-bg";
		const PRESET_KEY = "dsh-wechat-skin:preset";
		const LINE_HEIGHT_KEY = "dsh-wechat-skin:line-height";
		const MOTION_KEY = "dsh-wechat-skin:reduced-motion";
		const FONT_FAMILY_KEY = "dsh-wechat-skin:font-family";
		/** Typeface presets: key consumed by --dsw-font-family. */
		const FONT_FAMILY_VALUES = ["system", "wechat", "wenkai", "kai", "round"];
		const CONTRAST_KEY = "dsh-wechat-skin:contrast";
		const AVATAR_SHAPE_KEY = "dsh-wechat-skin:avatar-shape";
		const AVATAR_STYLE_KEY = "dsh-wechat-skin:avatar-style";
/** Composer extras: glass card, sliding caret, send-flight morph. */
const COMPOSER_FX_KEY = "dsh-wechat-skin:composer-fx";
// Bumped together with package.json (test/version-test.mjs keeps the two in sync).
const SKIN_VERSION = "1.37.1";
		const CUSTOM_PRESETS_KEY = "dsh-wechat-skin:presets";
		const SIDEBAR_BG_CLASS = "dsh-wc-sidebar-bg";
		/** Sidebar entry order: panel labels, first = topmost. */
		const SIDEBAR_ORDER_KEY = "dsh-wechat-skin:sidebar-order";
		/** DSH panel list (each row is one plugin entry) and the drag state. */
		const PANEL_LIST_SELECTOR = ".kB3qhq_panelList";
		const PANEL_ROW_SELECTOR = ".kB3qhq_panelRow";
		const PANEL_DRAGGING_CLASS = "dsh-wc-panel-dragging";
		const PANEL_DRAG_SOURCE_CLASS = "dsh-wc-panel-drag-source";
		/** Font-size scale per level; level 3 = 1.0 (the original size). */
		const FONT_SCALES = { 1: 0.85, 2: 0.92, 3: 1.0, 4: 1.08, 5: 1.18 };
		/** Theme presets: one click sets a coherent set of skin values. */
		const THEME_PRESETS = [
			{ id: "wechat", fontLevel: 3, textFontLevel: 3, density: "cozy", chatWidth: "wide", sidebarBg: null },
			{ id: "compact", fontLevel: 2, textFontLevel: 2, density: "compact", chatWidth: "medium", sidebarBg: null },
			{ id: "paper", fontLevel: 3, textFontLevel: 3, density: "cozy", chatWidth: "medium", sidebarBg: null }
		];
		/** Sidebar colour swatches: WeChat grey, warm paper, mist green, cool grey, graphite. */
		const SIDEBAR_SWATCHES = ["#eeeef0", "#f7f3ec", "#e8f2e9", "#dfe3e8", "#1c1c1e"];
		/** Skin-side localStorage keys included in an exported config. */
		const CONFIG_SKIN_KEYS = [FONT_LEVEL_KEY, TEXT_FONT_LEVEL_KEY, DENSITY_KEY, CHAT_WIDTH_KEY, SIDEBAR_BG_KEY, SIDEBAR_ORDER_KEY, USER_AVATAR_KEY, USER_AVATAR_ENABLED_KEY, AI_AVATAR_KEY, AI_AVATAR_ENABLED_KEY, AI_AVATAR_SHOW_KEY_LEGACY, PRESET_KEY, LINE_HEIGHT_KEY, MOTION_KEY, FONT_FAMILY_KEY, CONTRAST_KEY, AVATAR_SHAPE_KEY, AVATAR_STYLE_KEY, COMPOSER_FX_KEY, CUSTOM_PRESETS_KEY];
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
  /* ================= accent ramp =================
     One hue (152 deg), five steps. Every UI green resolves to one of these:
       soft   tinted fill / hover wash
       line   accent border
       bright brand mark, status dots, pulse. NEVER carries text: #07c160 on
              white is 2.38:1, so it is decoration only.
       solid  fill that carries white content (5.21:1)
       press  pressed state
     The three bubble colours below are sampled WeChat brand assets, not UI
     accents, so they keep their own hue on purpose. */
  --wc-accent-soft: #eaf6ef;
  --wc-accent-line: #bcdcc8;
  --wc-accent-bright: #07c160;
  --wc-accent-solid: #0a7d43;
  --wc-accent-press: #06673a;
  --wc-bubble: #95ec69;              /* sent bubble, sampled from WeChat */
  --wc-bubble-ink: #101010;
  --wc-bubble-link: #0a5c33;
  --wc-bubble-code-ink: #0a2e1a;

  /* ================= neutral surfaces =================
     Radix Slate 1/2/3/4/6. Adjacent steps differ by 1.0 / 3.1 / 2.8 / 5.2 L*,
     so depth reads as a surface change instead of relying on a border line.
     The old palette packed six surfaces into 6 L* (0.6-1.8 apart), which the
     eye cannot separate. */
  --wc-bg: #fcfcfd;                  /* slate1  conversation canvas */
  --wc-surface: #f9f9fb;             /* slate2  cards, module fill */
  --wc-sidebar: #e8e8ec;             /* slate4  session list */
  --wc-border-light: #d9d9e0;        /* slate6  5.2 L* below the sidebar */
  --wc-sidebar-dark: #18191b;        /* slate dark2 */
  --wc-surface-dark: #212225;        /* slate dark3 */
  --wc-overlay-dark: #2e3135;        /* slate dark5 */
  --wc-border-dark: #363a3f;         /* slate dark6: 4.0 L* above the overlay;
                                        the old #303033 was 0.5 apart = invisible */
  --wc-scroll-thumb: rgba(0, 0, 0, 0.18);
  --wc-scroll-thumb-hover: rgba(0, 0, 0, 0.30);

  /* ================= ink ladder =================
     Three levels that stay >=4.5:1 on EVERY surface the skin paints, including
     the sidebar. Level 2 was pushed darker rather than level 3 lighter, because
     lightening level 3 breaks 4.5:1 on the sidebar. Result: 15.98 / 8.14 / 5.79
     on the canvas and 13.41 / 6.83 / 4.86 on the sidebar, ~21 and ~9 L* apart.
     The host aliases are overridden too, otherwise host-rendered text keeps the
     old two-level look next to the skin's three. */
  --wc-ink-1: #1c2024;               /* slate12 */
  --wc-ink-2: #4a4e56;
  --wc-ink-3: #60646c;               /* slate11 */

  /* ================= selection & structure =================
     Selection is the accent's solid step, so "green" means exactly one thing:
     action or selected. Table headers are STRUCTURE, not brand, so they use a
     neutral surface -- that removes the fourth competing green. */
  --wc-sel-ink: #ffffff;
  --wc-sel-ink-dim: rgba(255, 255, 255, 0.92);
  --wc-th-bg: #f0f0f3;               /* slate3 */
  --wc-code-bg: #f0f0f3;             /* slate3 */

  /* ================= semantic hues =================
     One hue per meaning. Amber belongs to warnings only, which is why the chat
     avatar no longer uses a saturated orange next to it. */
  --wc-dot-warning: #d97706;
  --wc-dot-error: #dc2626;
  --wc-danger: #b42318;
  --wc-danger-hover: #991b1b;
  --wc-stop: #e5484d;
  --wc-stop-hover: #d13438;
  --wc-sched-badge: #3b82f6;
  --wc-avatar-user-a: #f7f0e8;
  --wc-avatar-user-b: #a08256;

  /* fills vs ink: -press/-ink are FILLS carrying white content; -text is the
     same accent used AS TEXT and must flip in dark mode. */
  --wc-control-h: 28px;
  --wc-btn-idle-bg: #e8e8ec;         /* slate4 */
  /* 字阶：四档（12/13/15/18），全部随字号档位等比缩放；clamp 保底，任何档位都不低于 12px */
  --wc-text-xl: 18px;
  --wc-text-lg: 15px;
  --wc-text-md: 13px;
  --wc-text-sm: 12px;
  --wc-fs-md: clamp(12px, calc(var(--wc-text-md) * var(--dsh-wechat-font-scale, 1)), 16px);
  --wc-fs-sm: clamp(12px, calc(var(--wc-text-sm) * var(--dsh-wechat-font-scale, 1)), 15px);
  /* 正文字号独立档位：只作用于会话区正文（气泡、代码、表格、引用、标题） */
  --wc-body-xl: clamp(16px, calc(var(--wc-text-xl) * var(--dsh-wechat-text-scale, 1)), 22px);
  --wc-body-lg: clamp(13px, calc(var(--wc-text-lg) * var(--dsh-wechat-text-scale, 1)), 20px);
  --wc-body-md: clamp(12px, calc(var(--wc-text-md) * var(--dsh-wechat-text-scale, 1)), 17px);
  --wc-body-sm: clamp(12px, calc(var(--wc-text-sm) * var(--dsh-wechat-text-scale, 1)), 16px);
  /* 旧变量名保留为别名，避免外部或旧缓存引用失效 */
  --wc-radius-card: 12px;
  --wc-radius-md: 10px;
  --wc-radius-bubble: 8px;
  --wc-radius-btn: 8px;
  --wc-radius-sm: 6px;
  --wc-radius-xs: 4px;
}

/* ================= token aliases =================
   These resolve var() and MUST sit on the same element the dark/paper blocks
   override. Declared on :root they would be computed there once, and a later
   --wc-ink-1 override on body would never reach them. */
body.dsh-wechat-skin-on {
  --wc-green: var(--wc-accent-bright);
  --wc-green-hover: var(--wc-accent-press);
  --dsw-alias-label-primary: var(--wc-ink-1);
  --dsw-alias-label-secondary: var(--wc-ink-2);
  --dsw-alias-label-tertiary: --wc-ink-3;
  --wc-sel-bg: var(--wc-accent-solid);
  --wc-th-ink: var(--wc-ink-1);
  /* Identity marks need presence at 26px: soft→line was a pale smudge, so the
     fallback avatar spans line→solid instead (still inside the ramp). */
  --wc-avatar-sel-a: var(--wc-accent-line);
  --wc-avatar-sel-b: var(--wc-accent-solid);
  --wc-brand-press: var(--wc-accent-press);
  --wc-brand-ink: var(--wc-accent-solid);
  --wc-brand-text: var(--wc-accent-solid);
  --wc-link: var(--wc-accent-solid);
  --wc-link-hover: var(--wc-accent-press);
  --wc-btn-idle-ink: --wc-ink-3;   /* 4.86:1 on the idle fill; #9b9b9b was 2.27 */
}

/* ================= palette ================= */
body.dsh-wechat-skin-on:not([data-dsh-wechat-dark="1"]) {
  --dsw-alias-state-business-primary: var(--wc-accent-solid) ;
  --dsw-alias-state-business-tertiary: var(--wc-accent-soft) ;
  --dsw-alias-state-success-primary: var(--wc-accent-solid) ;
  --dsw-alias-button-info-fill: var(--wc-accent-solid) ;
  --dsw-alias-button-info-hover: var(--wc-accent-press) ;
  --dsw-alias-brand-primary: var(--wc-accent-solid) ;
  --dsw-alias-brand-text: #ffffff ;
  --dsw-specific-bubble: var(--wc-bubble) ;
  --dsw-alias-bg-base: var(--wc-bg) ;
  --dsw-alias-bg-module-platform: var(--wc-surface) ;
  --dsw-alias-bg-overlay: #ffffff ;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] {
  /* dark accent: the bright step is legible here (6.67:1 on the card), so brand
     marks keep it; anything used AS TEXT moves to the light tint. */
  --wc-accent-soft: #16281f;
  --wc-accent-line: #2c4a38;
  --wc-ink-1: #edeef0;               /* slate dark12 */
  --wc-ink-2: #b0b4ba;               /* slate dark11 */
  --wc-ink-3: #9a9ea6;               /* 5.92:1 on the card, 4.86:1 on the overlay */
  --wc-th-bg: #272a2d;               /* slate dark4, structure stays neutral */
  --wc-code-bg: #16181a;             /* recessed 5.1 L* below the card, so a code
                                        panel reads as inset instead of vanishing
                                        into the host's layer2 (old delta 0.5) */
  --wc-btn-idle-bg: #272a2d;
  /* Despite the legacy name this token means "the hairline for the current
     scheme". Left at its light value it drew #d9d9e0 lines on dark cards
     (images, file cards, quoted text had no dark override of their own). */
  --wc-border-light: var(--wc-border-dark);
  --wc-link: #7ee2a8 ;
  --wc-link-hover: #a6f0c2 ;
  --wc-brand-text: #7ee2a8 ;
  --dsw-alias-state-business-primary: var(--wc-green) ;
  --dsw-alias-state-business-tertiary: var(--wc-accent-soft) ;
  --dsw-alias-state-success-primary: var(--wc-green) ;
  --dsw-alias-button-info-fill: var(--wc-accent-solid) ;
  --dsw-alias-button-info-hover: var(--wc-accent-press) ;
  --dsw-alias-brand-primary: var(--wc-green) ;
  --dsw-alias-brand-text: #ffffff ;
  --dsw-specific-bubble: var(--wc-bubble) ;
  --dsw-alias-bg-base: #111113 ;
  --dsw-alias-bg-module-platform: var(--wc-surface-dark) ;
  --dsw-alias-bg-overlay: var(--wc-overlay-dark) ;
  --wc-scroll-thumb: rgba(255, 255, 255, 0.22);
  --wc-scroll-thumb-hover: rgba(255, 255, 255, 0.34);
}

/* ================= paper preset ================= */
/* 纸张：暖白画布 + 牛皮纸气泡，无尾巴。仅浅色主题生效。 */
body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"]:not([data-dsh-wechat-dark="1"]) {
  /* paper: Radix Sand neutrals (warm, h90) with a MOSS accent from the same warm
     family. The old preset paired warm paper with the cool h154 UI green, two
     unrelated families on one screen. */
  --wc-accent-soft: #eef1e4;
  --wc-accent-line: #cdd8b4;
  --wc-accent-solid: #55703f;
  --wc-accent-press: #4a6337;
  --wc-bg: #fdfdfc;                  /* sand1 */
  --wc-surface: #f9f9f8;             /* sand2 */
  --wc-sidebar: #e9e8e6;             /* sand4 */
  --wc-border-light: #dad9d6;        /* sand6 */
  --wc-ink-1: #21201c;               /* sand12 */
  --wc-ink-2: #4c4c47;
  --wc-ink-3: #63635e;               /* sand11, 4.93:1 on the sidebar */
  --wc-th-bg: #f1f0ef;               /* sand3 */
  --wc-code-bg: #f1f0ef;
  --wc-btn-idle-bg: #e9e8e6;
  --wc-bubble: #ded3ba;
  --wc-bubble-ink: #3a3325;
  --wc-bubble-link: #6b4f1d;
  --wc-bubble-code-ink: #3a3325;
  --dsw-alias-bg-base: #fdfdfc;
  --dsw-alias-bg-module-platform: #f9f9f8;
  --dsw-specific-bubble: #ded3ba;
}
body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"]:not([data-dsh-wechat-dark="1"]) .kiGsTW_header { background: var(--wc-bg); }

/* ================= input surface: selection, scrollbars, typeface ================= */
body.dsh-wechat-skin-on ::selection { background: color-mix(in srgb, var(--wc-green, #07c160) 24%, transparent); color: inherit; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] ::selection { background: color-mix(in srgb, var(--wc-green, #07c160) 34%, transparent); }
body.dsh-wechat-skin-on, body.dsh-wechat-skin-on * { scrollbar-width: thin; scrollbar-color: var(--wc-scroll-thumb) transparent; }
body.dsh-wechat-skin-on ::-webkit-scrollbar { width: 10px; height: 10px; }
body.dsh-wechat-skin-on ::-webkit-scrollbar-track { background: transparent; }
body.dsh-wechat-skin-on ::-webkit-scrollbar-thumb {
  background: var(--wc-scroll-thumb); border-radius: 999px;
  border: 2px solid transparent; background-clip: padding-box;
}
body.dsh-wechat-skin-on ::-webkit-scrollbar-thumb:hover { background: var(--wc-scroll-thumb-hover); background-clip: padding-box; }

/* typeface: the host exposes --dsw-font-family but never defines it, so the skin owns the fallback */
body.dsh-wechat-skin-on {
  --dsw-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-family: var(--dsw-font-family);
}
/* typeface presets: system keeps the host stack untouched */
body.dsh-wechat-skin-on[data-dsh-wc-font-family="wechat"] {
  --dsw-font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}
body.dsh-wechat-skin-on[data-dsh-wc-font-family="wenkai"] {
  --dsw-font-family: "LXGW WenKai", "LXGWWenKai", "霞鶩文楷", "霞鹜文楷", "Kaiti SC", serif;
}
body.dsh-wechat-skin-on[data-dsh-wc-font-family="kai"] {
  --dsw-font-family: "Kaiti SC", "STKaiti", "KaiTi", "Kaiti TC", serif;
}
body.dsh-wechat-skin-on[data-dsh-wc-font-family="round"] {
  --dsw-font-family: "Yuanti SC", "YouYuan", "Hiragino Maru Gothic ProN", "PingFang SC", sans-serif;
}

/* avatar shape: rounded square is the WeChat original. Declare on the painted cell as
   well as on the row variable — some rows paint their own avatar layer, and a missed
   variable there used to leave the shape unchanged. */
body.dsh-wechat-skin-on { --wc-av-radius: var(--wc-radius-sm, 6px); }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="circle"] { --wc-av-radius: 50%; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="square"] { --wc-av-radius: 2px; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="circle"] .JoiKIa_sessionRow { --wc-av-radius: 50%; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="square"] .JoiKIa_sessionRow { --wc-av-radius: 2px; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="circle"] .JoiKIa_sessionRow .JoiKIa_slot { border-radius: 50% !important; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="square"] .JoiKIa_sessionRow .JoiKIa_slot { border-radius: 2px !important; }
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="circle"] .JoiKIa_sessionRow .JoiKIa_slot > img,
body.dsh-wechat-skin-on[data-dsh-wc-avatar-shape="square"] .JoiKIa_sessionRow .JoiKIa_slot > img { border-radius: inherit; }

/* high contrast: darker secondary text and borders */
body.dsh-wechat-skin-on[data-dsh-wc-contrast="high"] {
  --wc-border-light: rgba(0, 0, 0, 0.28);
  --dsw-alias-border-l2: rgba(0, 0, 0, 0.16);
  --dsw-alias-label-secondary: #3b3b3d;
  --dsw-alias-label-tertiary: #4a4a4c;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"][data-dsh-wc-contrast="high"] {
  --wc-border-light: rgba(255, 255, 255, 0.34);
  --dsw-alias-border-l2: rgba(255, 255, 255, 0.20);
  --dsw-alias-label-secondary: #e8e8ea;
  --dsw-alias-label-tertiary: #d2d2d6;
}

/* ================= frame ================= */
body.dsh-wechat-skin-on .PIRFFq_frame { margin-left: 0; }
/* ================= sidebar ================= */
/* !important + html: on macOS DSH paints the sidebar with a bluish color-mix gradient
   (specificity 0,4,1); the skin's flat WeChat fill has to outrank it. */
html body.dsh-wechat-skin-on .PIRFFq_sidebarCol { background: var(--wc-sidebar) !important; border-right: none; }
html body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .PIRFFq_sidebarCol { background: var(--wc-sidebar-dark) !important; }

/* Project header rows: the host pins them at 34px while the title + path stack
   needs 42px, so the text spills and the row reads loose next to the 32px plugin
   rows. Tighten to two 13/18 and 11/14 lines that add up to exactly 32px. */
body.dsh-wechat-skin-on .JoiKIa_projectRow {
  height: 32px;
  margin: 2px 0 0;
}
body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_projectText { gap: 0; }
body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_title { font-size: var(--wc-fs-md); line-height: 18px; font-weight: 500; }
body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_meta { font-size: var(--wc-fs-sm); line-height: 14px; }

body.dsh-wechat-skin-on .JoiKIa_sessionRow {
  position: relative; height: 40px; border-radius: var(--wc-radius-bubble); margin: 1px 0; gap: 1px;
}
/* avatar: WeChat-style rounded square on the native leading cell */
body.dsh-wechat-skin-on .JoiKIa_sessionRow { --wc-av-radius: 6px; --wc-row-bg: var(--wc-sidebar); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow { --wc-row-bg: var(--wc-sidebar-dark); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot {
  position: relative; width: 26px; height: 26px; border-radius: var(--wc-av-radius); flex: none; color: #ffffff;
  background-image: var(--dsh-avatar, linear-gradient(145deg, var(--wc-avatar-sel-a), var(--wc-avatar-sel-b)));
  background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.10);
  overflow: visible;
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow:hover { --wc-row-bg: color-mix(in srgb, var(--wc-sidebar) 92%, #000); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow:hover { --wc-row-bg: color-mix(in srgb, var(--wc-sidebar-dark) 90%, #fff); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected {
  --wc-row-bg: var(--wc-sel-bg);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_slot {
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.10), 0 0 0 1px color-mix(in srgb, var(--wc-sel-ink) 28%, transparent);
}
/* sessions with an active scheduled task: clock badge on the avatar's bottom-left */
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

/* session status rides as a corner badge on the avatar, never as a mark over the initial */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state] { display: none !important; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state] + span {
  position: absolute; right: -2px; bottom: -2px; left: auto; top: auto;
  width: 9px; height: 9px; margin: 0; padding: 0; border: none;
  clip: auto; clip-path: none; overflow: visible;
  font-size: 0; line-height: 0; color: transparent; white-space: nowrap;
  border-radius: 50%; background: transparent; z-index: 5; pointer-events: none;
  box-shadow: 0 0 0 2px var(--wc-row-bg);
}
/* finished or idle sessions carry no status mark at all */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="done"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="completed"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="idle"] + span { display: none; }
/* waiting for you: solid amber dot; failed: solid red dot */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="warning"] + span {
  background: transparent; box-shadow: 0 0 0 2px var(--wc-row-bg), inset 0 0 0 2px var(--wc-dot-warning);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="error"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="failed"] + span { background: var(--wc-dot-error); }
/* running: a small disc with a spinning arc, sized to stay legible at 26px */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="ongoing"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="running"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="waiting"] + span,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="thinking"] + span {
  width: 12px; height: 12px; right: -3px; bottom: -3px;
  background: var(--wc-row-bg); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="ongoing"] + span::after,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="running"] + span::after,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="waiting"] + span::after,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="thinking"] + span::after {
  content: ""; position: absolute; inset: 2.5px; box-sizing: border-box; border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--wc-green, #07c160) 28%, transparent);
  border-top-color: var(--wc-brand-text);
  animation: dsh-wc-badge-spin 0.9s linear infinite;
}
@keyframes dsh-wc-badge-spin { to { transform: rotate(1turn); } }


body.dsh-wechat-skin-on .JoiKIa_sessionRow:hover { background: rgba(0, 0, 0, 0.045); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow:hover { background: rgba(255, 255, 255, 0.06); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_title {
  font-size: var(--wc-fs-md); font-weight: 500; color: var(--dsw-alias-label-primary);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected,
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected:hover { background: var(--wc-sel-bg); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_title { font-weight: 600; color: var(--wc-sel-ink); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_time,
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_rowResting { color: var(--wc-sel-ink-dim); }
/* green selected row: the status badge needs a light disc so the arc stays visible */
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_slot > [data-state] + span {
  background: #ffffff; box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
}

/* ================= session row states: pinned / unread / archived ================= */
/* pinned rows sit at the top of the list: a faint green wash plus a green pin */
/* :has() outranks .JoiKIa_selected, so the wash must skip the current row —
   otherwise a pinned + selected row paints white text on a pale green fill. */
body.dsh-wechat-skin-on .JoiKIa_sessionRow:not(.JoiKIa_selected):has(.JoiKIa_pinIndicator) {
  background: color-mix(in srgb, var(--wc-green, #07c160) 7%, var(--wc-sidebar));
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JoiKIa_sessionRow:not(.JoiKIa_selected):has(.JoiKIa_pinIndicator) {
  background: color-mix(in srgb, var(--wc-green, #07c160) 13%, var(--wc-sidebar-dark));
}
/* the pin has to follow the row's own ink, or it vanishes on the green selected fill */
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_pinIndicator { color: var(--wc-sel-ink); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_pinIndicator {
  color: var(--wc-brand-text); width: 14px; height: 16px; margin-left: 4px; opacity: .9;
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_pinIndicator > svg { width: 10px; height: 10px; }
/* unread completion: the host marks it as data-state="done" — a green disc plus a heavier title */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="done"] + span {
  display: block; background: var(--wc-green, #07c160);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow:has(.JoiKIa_slot > [data-state="done"]) .JoiKIa_title {
  font-weight: 600; color: var(--dsw-alias-label-primary);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow:has(.JoiKIa_slot > [data-state="done"]) .JoiKIa_rowResting .JoiKIa_time {
  color: var(--wc-brand-text);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected:has(.JoiKIa_slot > [data-state="done"]) .JoiKIa_title { color: var(--wc-sel-ink); }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_slot > [data-state="done"] + span {
  background: #ffffff; box-shadow: 0 0 0 0 transparent;
}
/* timestamps: one step up from the host's 10px so they stay readable at a glance */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_time {
  font-size: var(--wc-fs-sm); font-variant-numeric: tabular-nums; color: --wc-ink-3;
}
/* archived sessions recede until hovered */
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_archived { opacity: .55; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_archived:hover { opacity: .85; }


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
/* The typeface setting owns --dsw-font-family; pin a hard stack here and every column
   would ignore it. Keep the WeChat stack only as the fallback for an unset variable. */
body.dsh-wechat-skin-on .tnXGgG_column,
body.dsh-wechat-skin-on .AkCqbG_userStack,
body.dsh-wechat-skin-on .JoiKIa_sessionRow {
  font-family: var(--dsw-font-family, "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif);
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
  border-radius: var(--wc-av-radius, var(--wc-radius-sm)); overflow: hidden;
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
   avatar (thinking, tool/process rows) sit flush left — no reserved
   avatar column (user decision). Empty flow items (height:0 spacers in the
   native sheet) must not paint an avatar, so mirror the native :empty guards. */
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"]):not(:empty):not(:has(>[data-slot="conversation.chat.node"]:empty)) {
  position: relative; margin-left: 42px;
}
body.dsh-wechat-skin-on .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"]:not([data-chat-group-part="reasoning"]):not(:empty):not(:has(>[data-slot="conversation.chat.node"]:empty))::before {
  content: ""; position: absolute; left: -42px; top: 0; width: 34px; height: 34px;
  border-radius: var(--wc-av-radius, var(--wc-radius-sm)); overflow: hidden;
  background-image: var(--dsh-assistant-avatar, linear-gradient(135deg, var(--wc-avatar-sel-a), var(--wc-avatar-sel-b)));
  background-size: cover; background-position: center;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
/* AI avatar off: no avatar, and the answer rows sit flush left with the rest. */
body.dsh-wechat-skin-on[data-dsh-wechat-ai-avatar="0"] .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"] { margin-left: 0 !important; }
body.dsh-wechat-skin-on[data-dsh-wechat-ai-avatar="0"] .tnXGgG_flowItem[data-chat-flow-kind="assistant-step"]::before { content: none !important; }
/* My avatar off: hide the sent-row avatar and let the bubble sit flush right. */
body.dsh-wechat-skin-on[data-dsh-wechat-user-avatar="0"] [data-chat-flow-kind="user"]::after,
body.dsh-wechat-skin-on[data-dsh-wechat-user-avatar="0"] [data-chat-flow-kind="steering"]::after { content: none !important; }
body.dsh-wechat-skin-on[data-dsh-wechat-user-avatar="0"] .AkCqbG_userRow { margin-right: 0 !important; }
/* Process-group seat ("已完成分析" chip, bare .r52wTW_root) has no avatar either —
   flush left like the other avatar-less rows. */
/* The settled-turn line ("已完成，用时 X 秒", button.gTO55a_root) is a system
   notice, not a chat row: WeChat renders those as small centred grey text with
   no divider. Drop the native full-width underline bar, centre the label. */
body.dsh-wechat-skin-on .tnXGgG_column .gTO55a_root {
  justify-content: center; text-align: center;
  border-bottom: none; height: auto; min-height: 0;
  padding: 6px 0 2px; font-size: var(--wc-fs-sm);
}
/* style the sent bubble itself (independent of the flow-kind wrapper, so the
   optimistic message looks identical the instant it appears — no size/color flash) */
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) {
  background: var(--wc-bubble) !important; color: var(--wc-bubble-ink) !important; border-radius: var(--wc-radius-bubble) !important; position: relative;
  font-size: var(--wc-body-lg) !important;
  line-height: calc(var(--wc-body-lg) * var(--wc-line-height, 1.6)) !important;
}
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) * { color: var(--wc-bubble-ink) !important; }
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) a { color: var(--wc-bubble-link) !important; text-decoration: underline; }
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) code,
body.dsh-wechat-skin-on .tnXGgG_column [class*="_bubble_"]:not([data-portal]) pre { background: rgba(0, 0, 0, 0.08) !important; color: var(--wc-bubble-code-ink) !important; }

/* ================= assistant replies: white WeChat bubble ================= */
/* .XNZzAa_body = the assistant message body. White bubble on light, a raised dark
   card on dark (WeChat-dark style), so replies read as a bubble in both schemes. */
body.dsh-wechat-skin-on.dsh-wechat-match .XNZzAa_body {
  background: #ffffff;
  border: 0.5px solid var(--wc-border-light);
  border-radius: var(--wc-radius-bubble);
  padding: 10px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  min-width: 40px;
  font-size: var(--wc-body-lg);
  line-height: calc(var(--wc-body-lg) * var(--wc-line-height, 1.6));
}
/* markdown 正文：宿主用 font: var(--dsw-font-markdown-base) 简写，字号走 --dsh-content-font-size；
   这里再显式钉一次正文档，避免宿主派生 token 被别的皮肤/主题覆盖时正文不跟随 */
body.dsh-wechat-skin-on ._markdown_rve47_5 {
  font-size: var(--wc-body-lg);
  line-height: calc(var(--wc-body-lg) * var(--wc-line-height, 1.6));
}
/* DARK scheme: raised dark bubble (#2a2a2d on the #111214 wallpaper) */
body.dsh-wechat-skin-on.dsh-wechat-match[data-dsh-wechat-dark="1"] .XNZzAa_body {
  background: var(--wc-overlay-dark);
  border-color: var(--wc-border-dark);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

/* reasoning rows: quiet pill */
body.dsh-wechat-skin-on .ijfCxa_root { background: rgba(0, 0, 0, 0.035); border-radius: var(--wc-radius-sm); padding: 2px 8px; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .ijfCxa_root { background: rgba(255, 255, 255, 0.06); }
body.dsh-wechat-skin-on .ijfCxa_summary,
body.dsh-wechat-skin-on .ijfCxa_thinkBody { font-size: var(--wc-body-sm); }

/* ================= composer ================= */
body.dsh-wechat-skin-on .JZLxKW_card {
  background: #ffffff;
  border: 0.5px solid var(--wc-border-light);
  border-radius: var(--wc-radius-card);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 18px rgba(0, 0, 0, 0.05);
  transition: border-color 250ms ease-out, box-shadow 250ms ease-out;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_card {
  background: var(--wc-sidebar-dark);
  border-color: var(--wc-border-dark);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 22px rgba(0, 0, 0, 0.35);
}
/* focus ring while composing */
body.dsh-wechat-skin-on .JZLxKW_card:focus-within {
  border-color: rgba(7, 193, 96, 0.55);
  box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.12), 0 6px 18px rgba(0, 0, 0, 0.06);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_card:focus-within {
  border-color: rgba(7, 193, 96, 0.6);
  box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.16), 0 8px 22px rgba(0, 0, 0, 0.4);
}
/* drag grip hint on the top edge: hover to see it, drag or double-click to reset */
/* align input, placeholder and the toolbar to one 12px gutter */
body.dsh-wechat-skin-on .JZLxKW_input { padding: 4px 10px 0 12px; }
body.dsh-wechat-skin-on .JZLxKW_placeholder { inset: 4px 10px auto 12px; }
body.dsh-wechat-skin-on .JZLxKW_row { padding: 2px 10px 8px; }
body.dsh-wechat-skin-on .JZLxKW_modes > * { border-radius: var(--wc-radius-bubble); }
/* "+" becomes a quiet outlined square, not a grey blob */
body.dsh-wechat-skin-on .JZLxKW_add {
  background: transparent; border: 0.5px solid var(--wc-border-light);
  border-radius: var(--wc-radius-bubble); color: var(--dsw-alias-label-secondary, #666);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_add { border-color: var(--wc-border-dark); }
body.dsh-wechat-skin-on .JZLxKW_add:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
/* model selector: a WeChat-style tinted chip (green ink, own chevron) */
body.dsh-wechat-skin-on .JZLxKW_select {
  height: var(--wc-control-h); max-width: 220px;
  padding: 0 24px 0 12px;
  border: 0;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--wc-green) 12%, transparent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10' fill='none'%3E%3Cpath d='M2.2 3.9L5 6.7L7.8 3.9' stroke='%230a7d43' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-position: right 9px center;
  background-repeat: no-repeat;
  background-size: 10px 10px;
  color: var(--wc-brand-text);
  font-size: var(--wc-fs-sm); font-weight: 500; line-height: 20px;
  transition: background-color 250ms ease-out, color 250ms ease-out;
}
body.dsh-wechat-skin-on .JZLxKW_select:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--wc-green) 20%, transparent);
  color: var(--wc-brand-text);
}
body.dsh-wechat-skin-on .JZLxKW_select:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--wc-green) 45%, transparent);
  outline-offset: 1px;
}
body.dsh-wechat-skin-on .JZLxKW_select:disabled { opacity: .5; cursor: default; }
body.dsh-wechat-skin-on .JZLxKW_select option {
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_select {
  background-color: rgba(7, 193, 96, 0.18);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10' fill='none'%3E%3Cpath d='M2.2 3.9L5 6.7L7.8 3.9' stroke='%237EE2A8' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  color: #7ee2a8;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_select:hover:not(:disabled) {
  background-color: rgba(7, 193, 96, 0.28);
  color: #a7f0c6;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_select option {
  background: var(--wc-sidebar-dark);
  color: #f2f2f3;
}
/* send: small green circle with the native arrow icon, no text label */
body.dsh-wechat-skin-on .JZLxKW_primary {
  width: 32px; min-width: 32px; max-width: 32px; height: 32px; padding: 0; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center; transform: none;
  background: var(--wc-btn-idle-bg); color: var(--wc-btn-idle-ink);
  transition: background-color 250ms ease-out, color 250ms ease-out, transform 250ms ease-out;
}
body.dsh-wechat-skin-on .JZLxKW_primary > svg { display: block; width: 16px; height: 16px; }
body.dsh-wechat-skin-on .JZLxKW_primary::after,
body.dsh-wechat-skin-on:lang(zh) .JZLxKW_primary::after,
body.dsh-wechat-skin-on:lang(en) .JZLxKW_primary::after,
body.dsh-wechat-skin-on:lang(ja) .JZLxKW_primary::after { content: none; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_primary {
  background: rgba(255, 255, 255, 0.12); color: rgba(242, 242, 243, 0.5);
}
body.dsh-wechat-skin-on .JZLxKW_primary:not(:disabled) { background: var(--wc-brand-ink); color: #ffffff; }
body.dsh-wechat-skin-on .JZLxKW_primary:not(:disabled):hover { background: var(--wc-brand-press); }
body.dsh-wechat-skin-on .JZLxKW_primary:not(:disabled):active { transform: scale(0.94); }
/* while the model is generating the button is a "stop" action (native stop icon, red) */
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"],
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i] { background: var(--wc-stop); color: #ffffff; }
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="停止"]:hover,
body.dsh-wechat-skin-on .JZLxKW_primary[aria-label*="stop" i]:hover { background: var(--wc-stop-hover); }
body.dsh-wechat-skin-on .JZLxKW_primary[data-sending] { background: var(--wc-brand-ink); color: #ffffff; }
/* thin scrollbar + soft fade for long drafts */
body.dsh-wechat-skin-on .JZLxKW_scroll::-webkit-scrollbar { width: 6px; }
body.dsh-wechat-skin-on .JZLxKW_scroll::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-scrollbar-bg-l2); border-radius: 3px;
}
body.dsh-wechat-skin-on .JZLxKW_scroll[data-dsh-fade="both"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 10px, #000 calc(100% - 12px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 10px, #000 calc(100% - 12px), transparent 100%);
}
body.dsh-wechat-skin-on .JZLxKW_scroll[data-dsh-fade="top"] {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 10px);
  mask-image: linear-gradient(to bottom, transparent 0, #000 10px);
}
body.dsh-wechat-skin-on .JZLxKW_scroll[data-dsh-fade="bottom"] {
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 12px), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 12px), transparent 100%);
}

/* ================= motion ================= */
/* Interactive surfaces ease with the skin's own 250ms ease-out baseline, and only
   on compositor-friendly properties (background-color / transform / opacity). */
body.dsh-wechat-skin-on .JoiKIa_sessionRow,
body.dsh-wechat-skin-on .kB3qhq_newSession,
body.dsh-wechat-skin-on .JZLxKW_primary {
  transition: background-color 250ms ease-out, color 250ms ease-out;
}
/* The running badge spins on its own layer so the row never repaints. */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="ongoing"] + span::after,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="running"] + span::after,
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="thinking"] + span::after {
  will-change: transform;
}
/* Respect the OS "reduce motion" setting, like the host UI does. */
@media (prefers-reduced-motion: reduce) {
  body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="ongoing"] + span::after,
  body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="running"] + span::after,
  body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_slot > [data-state="thinking"] + span::after,
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
/* Plugin glyph: one clockwise turn when the row is pointed at. The turn ends at
   exactly 360deg, so the resting pose is identical to the start and leaving
   mid-turn cannot spin the icon backwards. The "more" row (aria-haspopup) keeps
   its static icon — it opens a menu rather than switching panels. */
body.dsh-wechat-skin-on .kB3qhq_panelGlyph {
  display: inline-flex;
  transform-origin: 50% 50%;
}
@media (hover: hover) {
  body.dsh-wechat-skin-on .kB3qhq_panelRow:not([aria-haspopup]):hover .kB3qhq_panelGlyph {
    animation: dsh-wc-glyph-turn 820ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
}
@keyframes dsh-wc-glyph-turn {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Plugin list density: 36px rows with 2px gaps read as a loose stack once the
   skin drops the button chrome. 32px rows with a 1px gap keep the same rhythm as
   the session list; the collapsed rail keeps its 36px squares untouched. */
body.dsh-wechat-skin-on .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow {
  min-height: 32px;
  padding-top: 5px;
  padding-bottom: 5px;
}
body.dsh-wechat-skin-on .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList {
  gap: 1px;
  margin-bottom: 6px;
}

/* New session entry: it should read like a plugin title row, not like a button —
   flat surface, icon + 13px label on the left, tint only on hover. The rail
   (icon-only) keeps its 36px square, so the left alignment is scoped with :has
   to the version that actually renders a label. */
/* macOS paints this entry with #ffffff8c / #ffffff26 through
   [data-platform=darwin] [data-ds-dark-theme] :where(...) (0,3,0), which outranks
   the plain skin selector — hence !important on the surface properties. */
body.dsh-wechat-skin-on .kB3qhq_newSession {
  height: 32px;
  margin: 0 0 8px;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--dsw-alias-label-primary);
}
body.dsh-wechat-skin-on .kB3qhq_newSession:hover {
  background: var(--dsw-alias-interactive-bg-hover) !important;
}
body.dsh-wechat-skin-on .kB3qhq_newSession:has(.kB3qhq_newSessionLabel) {
  justify-content: flex-start;
  gap: 0;
  padding: 0 calc(var(--dsh-sidebar-row-padding, 10px) - var(--dsh-sidebar-paint-inset, 0px));
  margin: 0 calc(var(--dsh-sidebar-paint-inset, 0px) + 1px) 8px;
}
body.dsh-wechat-skin-on .kB3qhq_newSession:has(.kB3qhq_newSessionLabel) .kB3qhq_newSessionContent {
  justify-content: flex-start;
  gap: var(--dsh-sidebar-label-gap, 8px);
  font-size: var(--wc-fs-md);
  font-weight: 500;
}
body.dsh-wechat-skin-on .kB3qhq_newSessionLabel {
  font: inherit;
  color: inherit;
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

/* ================= density + chat width ================= */
/* compact density: shorter session list rows (list density only; message rhythm untouched) */
body.dsh-wechat-skin-on[data-dsh-wechat-density="compact"] .JoiKIa_sessionRow {
  height: 32px; margin: 0;
}
/* ================= process rows, tool cards, subagents, markdown ================= */
/* Turn process: quiet system-level rows that sit between assistant steps. */
body.dsh-wechat-skin-on [data-chat-flow-kind="turn-process"] { margin: 2px 0 6px; }
body.dsh-wechat-skin-on .UHhYua_root { border-radius: var(--wc-radius-bubble); }
body.dsh-wechat-skin-on .UHhYua_row {
  padding: 3px 6px; border-radius: var(--wc-radius-bubble); font-size: var(--wc-fs-sm);
  color: var(--dsw-alias-label-secondary, #666); transition: background-color .15s ease-out;
}
body.dsh-wechat-skin-on .UHhYua_row:hover { background: var(--dsw-alias-interactive-bg-hover); }
body.dsh-wechat-skin-on .UHhYua_title { font-weight: 500; color: var(--dsw-alias-label-primary, #1b1b1c); }
body.dsh-wechat-skin-on .UHhYua_leading { color: var(--wc-ink-3); }
body.dsh-wechat-skin-on .UHhYua_summary { color: var(--dsw-alias-label-secondary, #666); }
body.dsh-wechat-skin-on .UHhYua_summarySuffix { color: var(--wc-ink-3); font-variant-numeric: tabular-nums; }
body.dsh-wechat-skin-on .UHhYua_sep { background: var(--dsw-alias-border-l2, #e6e6e6); }
body.dsh-wechat-skin-on ._3mBzwG_root {
  border-radius: var(--wc-radius-bubble); background: var(--dsw-alias-bg-module-platform, #f2f2f2); border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
}
body.dsh-wechat-skin-on ._3mBzwG_code { border-radius: var(--wc-radius-sm); }
body.dsh-wechat-skin-on .KJhiDa_badge { border-radius: 999px; }

/* Sub-agent cards: one grey card per child agent, status text on the right. */
body.dsh-wechat-skin-on ._3j1mRa_node {
  border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); border-radius: var(--wc-radius-md);
  background: var(--dsw-alias-bg-module-platform, #f2f2f2); padding: 2px 6px;
}
body.dsh-wechat-skin-on ._3j1mRa_label { font-size: var(--wc-fs-md); font-weight: 500; }
body.dsh-wechat-skin-on ._3j1mRa_metrics { font-size: var(--wc-fs-sm); color: var(--wc-ink-2); font-variant-numeric: tabular-nums; }
body.dsh-wechat-skin-on ._3j1mRa_error { font-size: var(--wc-fs-sm); }

/* GenUI renders a table inside its card, which already has its own 1px frame and
   padding; the inner table wrapper draws a second frame inside that padding, so the
   two borders read as a misaligned box. Drop the inner frame, keep the card's. */
body.dsh-wechat-skin-on .V1MMBW_card .V1MMBW_tableWrap { border: 0; border-radius: 0; background: transparent; }

/* ================= assistant content: type, rhythm, data tables ================= */
/* Everything here is scoped to assistant-step markdown so GenUI cards, tool output
   and the composer keep their own chrome. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_rve47_5 { --wc-md-gap: 12px; }

/* Blocks: one vertical rhythm, no double margins at the edges. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_rve47_5 > :is(p, ul, ol, pre, blockquote, table, .tableScroll) { margin-top: var(--wc-md-gap); margin-bottom: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_rve47_5 > :first-child { margin-top: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_rve47_5 > :is(h1, h2, h3, h4) + * { margin-top: 6px; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(p, li) { line-height: var(--wc-line-height, 1.6); }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] strong { font-weight: 600; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] em { font-style: italic; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] del { color: var(--wc-ink-2); }

/* Headings: weight and space carry the level, not another colour. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] h1 {
  font-size: calc(var(--wc-body-xl) * 1.08); font-weight: 600; line-height: 1.35;
  letter-spacing: -0.01em; margin: 22px 0 0;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] h2 {
  font-size: calc(var(--wc-body-lg) * 1.22); font-weight: 600; line-height: 1.4;
  margin: 20px 0 0; padding-bottom: 4px; border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(h3, h4) {
  font-size: var(--wc-body-lg); font-weight: 600; line-height: 1.45; margin: 16px 0 0;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] h1:first-child,
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] h2:first-child { margin-top: 0; padding-bottom: 0; border-bottom: 0; }

/* Lists: hanging indent, quieter markers, tighter nesting. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(ul, ol) { padding-left: 1.35em; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] li { margin: 3px 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] li::marker { color: var(--wc-ink-3); }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(ul, ol) :is(ul, ol) { margin: 3px 0 3px 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] li > :is(p, ul, ol) { margin: 3px 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] li:has(> input[type="checkbox"]) { list-style: none; margin-left: -1.35em; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] input[type="checkbox"] {
  accent-color: var(--wc-green); width: 13px; height: 13px; margin: 0 6px 0 0; vertical-align: -1px;
}

/* Links: colour alone at rest, underline on hover (WeChat does not underline links). */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] a {
  color: var(--wc-link); text-decoration: none; text-underline-offset: 2px; text-decoration-thickness: 0.5px;
  border-radius: 3px; transition: color 250ms ease-out;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] a:hover { color: var(--wc-link-hover); text-decoration: underline; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] a:focus-visible { outline: 2px solid color-mix(in srgb, var(--wc-green) 45%, transparent); outline-offset: 2px; }

/* Media and rules. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(img, video) {
  max-width: 100%; height: auto; border-radius: var(--wc-radius-md);
  border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); vertical-align: middle;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] hr { border: 0; border-top: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); margin: 18px 0; }

/* Quotes: quiet wash, hairline rule, no italic. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] blockquote {
  border-left: 0.5px solid var(--dsw-alias-border-l3, #c9c9cc); border-radius: 0 !important;
  background: color-mix(in srgb, var(--dsw-alias-bg-module-platform, #f2f2f2) 72%, transparent);
  color: inherit; font-style: normal;
  margin: var(--wc-md-gap) 0 0; padding: 8px 12px;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] blockquote > :first-child { margin-top: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] blockquote > :last-child { margin-bottom: 0; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] [data-chat-flow-kind="assistant-step"] blockquote {
  background: rgba(255, 255, 255, 0.05); border-left-color: rgba(255, 255, 255, 0.16);
}

/* Code: a panel, not a box of text — fixed padding, own scroll, tab size. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] pre {
  border-radius: var(--wc-radius-md); border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
  background: var(--wc-code-bg); padding: 12px 14px; margin: var(--wc-md-gap) 0 0;
  line-height: 1.65; tab-size: 2; overflow-x: auto;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] pre code { font-size: var(--wc-body-md); }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :not(pre) > code {
  font-size: var(--wc-body-md); padding: 1px 5px; border-radius: var(--wc-radius-xs);
  background: color-mix(in srgb, var(--wc-green) 7%, var(--dsw-alias-bg-module-platform, #f2f2f2));
  border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(kbd, mark) {
  font-size: var(--wc-fs-sm); border-radius: var(--wc-radius-xs); padding: 1px 5px;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] mark { background: color-mix(in srgb, var(--wc-green) 22%, transparent); color: inherit; }

/* Tables: tinted header, zebra, row hover, sticky head, hairline grid. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] {
  margin: var(--wc-md-gap) 0 0; overflow-x: auto;
  scrollbar-width: thin; scrollbar-color: var(--wc-scroll-thumb) transparent;
  /* Host reserves --dsh-scrollbar-width as bottom padding and only shows the
     bar on hover; because we keep overflow at auto the bar is already there,
     so that reserve must never apply — otherwise hover drops 10px of height
     and the table jumps up. */
  padding-bottom: 0 !important;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"]:hover {
  overflow-x: auto; padding-bottom: 0 !important;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] table {
  border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
  border-collapse: separate; border-spacing: 0;
  border-radius: var(--wc-radius-md); overflow: hidden;
  margin: 0; font-size: var(--wc-body-md); font-variant-numeric: tabular-nums;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] thead th {
  position: sticky; top: 0; z-index: 1;
  background: var(--wc-th-bg); color: var(--wc-th-ink);
  font-weight: 600; font-size: var(--wc-fs-sm); letter-spacing: 0.01em;
  padding: 9px 12px !important; border-bottom: 0 !important;
  white-space: nowrap;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] td {
  padding: 9px 12px !important; vertical-align: top; line-height: 1.55;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6) !important;
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] tbody tr:last-child > td { border-bottom: 0 !important; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] tbody tr:nth-child(even) { background: color-mix(in srgb, var(--dsw-alias-label-primary, #1b1b1c) 3.2%, var(--dsw-alias-bg-base, #ffffff)); }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] tbody tr:hover { background: var(--wc-hover-accent); }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] td:first-child { font-weight: 500; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] :is(th, td) > :first-child { margin-top: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] :is(th, td) > :last-child { margin-bottom: 0; }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] thead th {
  background: var(--wc-th-bg); color: var(--wc-th-ink); border-bottom: 0 !important;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] [data-chat-flow-kind="assistant-step"] [class*="tableScroll"] tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.035); }

/* Details / summary blocks render as small disclosure cards. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] details {
  border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); border-radius: var(--wc-radius-md);
  padding: 8px 12px; margin: var(--wc-md-gap) 0 0; background: var(--dsw-alias-bg-module-platform, #f7f7f7);
}
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] summary { cursor: pointer; font-weight: 500; }

/* ================= right panel, popups, session list, actions ================= */
/* Right panel: same surface language as the sidebar. */
body.dsh-wechat-skin-on {
  --wc-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  --wc-hover-accent: var(--dsw-alias-interactive-bg-hover-accent, rgba(7, 193, 96, 0.10));
}
/* Paint only when open: the panel is a full-height overlay that stays translated
   off-canvas when closed, so an always-on background shows as a slab over chat. */
body.dsh-wechat-skin-on .Dv5QdW_panel[data-sidebar-right-open] { background: var(--dsw-alias-bg-base, #ffffff); border-left: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); }
body.dsh-wechat-skin-on .Dv5QdW_panelBody { padding: 10px 12px; }
body.dsh-wechat-skin-on .Dv5QdW_tabTitle { font-size: var(--wc-fs-md); font-weight: 600; }
body.dsh-wechat-skin-on .Dv5QdW_tabBody { font-size: var(--wc-fs-sm); }
body.dsh-wechat-skin-on .Dv5QdW_iconButton { border-radius: var(--wc-radius-sm); }
body.dsh-wechat-skin-on .Dv5QdW_iconButton:hover { background: var(--wc-hover); }
body.dsh-wechat-skin-on .Dv5QdW_unavailable { font-size: var(--wc-fs-sm); color: var(--wc-ink-3); }
body.dsh-wechat-skin-on .F6Huca_entry { border-radius: var(--wc-radius-bubble); padding: 8px; }
body.dsh-wechat-skin-on .F6Huca_entry:hover { background: var(--wc-hover); }
body.dsh-wechat-skin-on .F6Huca_entryTitle { font-size: var(--wc-fs-md); font-weight: 500; }
body.dsh-wechat-skin-on .F6Huca_entryDescription { font-size: var(--wc-fs-sm); color: var(--dsw-alias-label-secondary, #666); }

/* Slash / popup selects: one rounded sheet, green-tinted active row. */
body.dsh-wechat-skin-on .m00Doa_card {
  border-radius: var(--wc-radius-card); border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.10); background: var(--dsw-alias-bg-overlay, #ffffff);
}
body.dsh-wechat-skin-on .m00Doa_row { border-radius: var(--wc-radius-sm); }
body.dsh-wechat-skin-on .m00Doa_rowActive { background: var(--wc-hover-accent); }
body.dsh-wechat-skin-on .m00Doa_label { font-size: var(--wc-fs-md); }
body.dsh-wechat-skin-on .m00Doa_badge { border-radius: 999px; font-size: var(--wc-fs-sm); }
body.dsh-wechat-skin-on .m00Doa_search { border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); border-radius: var(--wc-radius-sm); }

/* Session list details: quieter meta, readable search hits. */
body.dsh-wechat-skin-on .JoiKIa_time,
body.dsh-wechat-skin-on .JoiKIa_timestamp { font-size: var(--wc-fs-sm); color: var(--wc-ink-3); font-variant-numeric: tabular-nums; }
body.dsh-wechat-skin-on .JoiKIa_searchResultHeading { font-size: var(--wc-fs-sm); color: var(--wc-ink-3); letter-spacing: 0.02em; }
body.dsh-wechat-skin-on .JoiKIa_searchResultRow { border-radius: var(--wc-radius-bubble); }
body.dsh-wechat-skin-on .JoiKIa_searchResultRow:hover { background: var(--wc-hover); }
body.dsh-wechat-skin-on .JoiKIa_searchResultTitle { font-size: var(--wc-fs-md); font-weight: 500; }
body.dsh-wechat-skin-on .JoiKIa_searchResultSnippet { font-size: var(--wc-fs-sm); color: var(--dsw-alias-label-secondary, #666); }
body.dsh-wechat-skin-on .JoiKIa_dot { background: var(--wc-green); }
body.dsh-wechat-skin-on .JoiKIa_pinIndicator { color: var(--wc-brand-text); }
/* Project folder glyph: the host ships a square-cornered solid folder that sits
   heavy next to 13px titles. Swap it for a rounded outline drawn as a mask on the
   wrapper, so the hover swap to the chevron and the active-project tint still work
   through currentColor. */
body.dsh-wechat-skin-on .JoiKIa_folder {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; flex: none;
  color: var(--dsw-alias-label-tertiary, #81858c);
}
body.dsh-wechat-skin-on .JoiKIa_folder.JoiKIa_folderActive { color: var(--dsw-alias-state-business-primary, #07c160); }
body.dsh-wechat-skin-on .JoiKIa_folder > svg { display: none; }
body.dsh-wechat-skin-on .JoiKIa_folder::before {
  content: ""; width: 16px; height: 16px; background-color: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.2' stroke-linejoin='round' stroke-linecap='round'%3E%3Cpath d='M2.4 5.1a1.2 1.2 0 0 1 1.2-1.2h2.3c.4 0 .8.2 1 .5l.7.9h4.8a1.2 1.2 0 0 1 1.2 1.2v5a1.2 1.2 0 0 1-1.2 1.2H3.6a1.2 1.2 0 0 1-1.2-1.2z'/%3E%3C/svg%3E") center / contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.2' stroke-linejoin='round' stroke-linecap='round'%3E%3Cpath d='M2.4 5.1a1.2 1.2 0 0 1 1.2-1.2h2.3c.4 0 .8.2 1 .5l.7.9h4.8a1.2 1.2 0 0 1 1.2 1.2v5a1.2 1.2 0 0 1-1.2 1.2H3.6a1.2 1.2 0 0 1-1.2-1.2z'/%3E%3C/svg%3E") center / contain no-repeat;
}

body.dsh-wechat-skin-on .JoiKIa_arrow,
body.dsh-wechat-skin-on .JoiKIa_chevron { color: var(--wc-ink-3); }

/* Assistant message actions: small quiet pills that only speak on hover. */
body.dsh-wechat-skin-on .ZITbJG_actions { gap: 2px; }
body.dsh-wechat-skin-on .ZITbJG_action {
  width: 24px; height: 24px; border-radius: var(--wc-radius-sm);
  color: var(--wc-ink-3); transition: background-color .15s ease-out, color .15s ease-out;
}
body.dsh-wechat-skin-on .ZITbJG_action:hover { background: var(--wc-hover); color: var(--dsw-alias-label-primary, #1b1b1c); }
body.dsh-wechat-skin-on .ZITbJG_endInfo { font-size: var(--wc-fs-sm); color: var(--wc-ink-3); }

/* Toast: same top-center pill, tuned to the skin's radius and weight. */
body.dsh-wechat-skin-on ._toast_hr9yd_6 {
  top: 24px; padding: 10px 16px; border-radius: var(--wc-radius-md);
  font-size: var(--wc-fs-md); line-height: 1.5; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* Running / streaming group label. */
body.dsh-wechat-skin-on .r52wTW_label { font-size: var(--wc-fs-sm); color: var(--dsw-alias-label-secondary, #666); display: inline-flex; align-items: center; gap: 6px; }
body.dsh-wechat-skin-on .r52wTW_label::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--wc-dot-warning); box-shadow: 0 0 0 2px rgba(255,197,61,0.25); animation: dsh-wc-pulse 1.2s ease-in-out infinite; }
@keyframes dsh-wc-pulse { 0%,100%{ transform:scale(1); opacity:1 } 50%{ transform:scale(0.7); opacity:0.6 } }

/* Paper preset, dark flavour: a full warm-charcoal ladder plus the moss accent.
   Overriding only the surfaces used to leave the cool slate hairline, ink and
   accent in place, so the scheme mixed two colour families on one screen. */
body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"][data-dsh-wechat-dark="1"] {
  --wc-bg: #141210;
  --wc-sidebar: #191713;
  --wc-sidebar-dark: #191713;
  --wc-surface: #1e1b17;
  --wc-surface-dark: #1e1b17;
  --wc-overlay-dark: #2a2620;
  --wc-border-dark: #3a352d;        /* 7.0 L* above the overlay, so edges read */
  --wc-code-bg: #100e0c;            /* recessed 5.9 L* below the card */
  --wc-th-bg: #242019;
  --wc-btn-idle-bg: #242019;
  --wc-ink-1: #efece6;              /* 14.55 / 8.23 / 6.22 on the card */
  --wc-ink-2: #b9b3a8;
  --wc-ink-3: #a29b8f;
  --wc-accent-soft: #1f2a17;
  --wc-accent-line: #3a4a2a;
  --wc-accent-solid: #55703f;       /* white on it: 5.56:1 */
  --wc-accent-press: #4a6337;
  --wc-link: #b9d69a;
  --wc-link-hover: #cde5b4;
  --wc-brand-text: #b9d69a;
  --wc-bubble: #3d3829;
  --wc-bubble-ink: #efe8d8;
  --wc-bubble-link: #d9c48f;
  --wc-bubble-code-ink: #efe8d8;
  --dsw-alias-bg-base: #141210;
  --dsw-alias-bg-module-platform: #1e1b17;
  --dsw-specific-bubble: #3d3829;
}


/* 5. 文件/图片消息气泡 */
body.dsh-wechat-skin-on [data-chat-flow-kind] img:not([class*="avatar"]):not([data-slot]) {
  border-radius: var(--wc-radius-card); border: 0.5px solid var(--wc-border-light); max-width: 100%;
}
body.dsh-wechat-skin-on [data-chat-flow-kind] [class*="fileCard"],
body.dsh-wechat-skin-on [data-chat-flow-kind] [class*="attachment"],
body.dsh-wechat-skin-on [data-chat-flow-kind] [class*="_file_"] {
  border-radius: var(--wc-radius-bubble); border: 0.5px solid var(--wc-border-light); background: var(--wc-code-bg);
}
/* 4. 用户引用回复块 */
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] blockquote,
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] [class*="reply"],
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] [class*="quote"] {
  border-left: 0.5px solid var(--wc-border-light); background: rgba(0,0,0,0.04); border-radius: 0; padding: 4px 8px; margin: 4px 0; font-size: var(--wc-body-sm);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] [data-chat-flow-kind="user"] blockquote { background: rgba(255,255,255,0.06); }

/* ================= line height + reduced motion ================= */
body.dsh-wechat-skin-on {
  --wc-line-height: 1.6;
  /* 接管宿主字号 token，宿主自带的「字号偏移」归零，避免两套缩放叠加 */
  --dsh-content-font-size: var(--wc-body-lg);
  --dsh-content-font-size-secondary: var(--wc-body-md);
  --dsh-content-font-delta: 0px;
  --dsh-content-font-delta-secondary: 0px;
}
body.dsh-wechat-skin-on[data-dsh-wechat-line-height="compact"] { --wc-line-height: 1.5; }
body.dsh-wechat-skin-on[data-dsh-wechat-line-height="relaxed"] { --wc-line-height: 1.85; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] :is(p, ul, ol),
body.dsh-wechat-skin-on [data-chat-flow-kind="user"] [class*="_bubble_"] { line-height: var(--wc-line-height, 1.6); }

body.dsh-wechat-skin-on[data-dsh-wc-reduce-motion="1"] *,
body.dsh-wechat-skin-on[data-dsh-wc-reduce-motion="1"] *::before,
body.dsh-wechat-skin-on[data-dsh-wc-reduce-motion="1"] *::after {
  transition: none !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
}
@media (prefers-reduced-motion: reduce) {
  body.dsh-wechat-skin-on *, body.dsh-wechat-skin-on *::before, body.dsh-wechat-skin-on *::after {
    transition: none !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
  }
}

/* ---- composer effects: glass card, sliding caret, send flight ----
   The glass is painted by the card itself (semi-transparent background +
   backdrop-filter). A ::before with z-index:-1 looked right in isolation but
   disappears inside the real dock, which stacks its own layers. */
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"] [data-composer-card] {
  background:
    linear-gradient(180deg,
      color-mix(in srgb, #ffffff 26%, transparent),
      color-mix(in srgb, #ffffff 44%, transparent) 46%,
      color-mix(in srgb, #ffffff 58%, transparent)),
    linear-gradient(180deg, color-mix(in srgb, var(--wc-green) 14%, transparent), color-mix(in srgb, var(--wc-green) 4%, transparent)) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  backdrop-filter: blur(20px) saturate(1.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 0 0 0 0.5px var(--wc-border-light),
    0 1px 3px rgba(0, 0, 0, 0.05) !important;
}
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"][data-dsh-wechat-dark="1"] [data-composer-card] {
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--wc-overlay-dark) 62%, transparent),
      color-mix(in srgb, var(--wc-overlay-dark) 78%, transparent)),
    linear-gradient(180deg, color-mix(in srgb, var(--wc-green) 16%, transparent), transparent) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.10),
    0 1px 3px rgba(0, 0, 0, 0.35) !important;
}
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"] [data-dsh-wc-caret-host] { position: relative; }
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"] [data-dsh-wc-caret],
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"] [data-dsh-wc-caret] * { caret-color: transparent !important; }
body.dsh-wechat-skin-on .dsh-wc-caret {
  position: absolute; z-index: 6; width: 1.8px; border-radius: 1px; opacity: 0;
  background: var(--wc-caret-ink, #111214); pointer-events: none;
  transition: left 80ms ease-out, top 80ms ease-out, height 60ms linear;
  animation: dsh-wc-caret-blink 1.06s steps(1, end) infinite;
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-caret { background: #f2f2f3; }
@keyframes dsh-wc-caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  body.dsh-wechat-skin-on .dsh-wc-caret { animation: none; transition: none; }
}
`;

				/** Settings-row button styles: injected even when the skin is off, so the row keeps hover/active/disabled feedback. */
		
const WECHAT_UI_CSS = `
/* dsh-wechat-skin settings-row buttons (always present, not gated by dsh-wechat-skin-on) */
body .dsh-wc-btn {
	cursor: pointer;
	flex: none;
	white-space: nowrap;
	border-radius: var(--wc-radius-btn);
	font-weight: 500;
	font-family: inherit;
	transition: background-color 250ms ease-out, border-color 250ms ease-out, color 250ms ease-out;
}
body .dsh-wc-btn-primary {
	border: none;
	padding: 4px 14px;
	font-size: var(--wc-fs-md);
	line-height: 20px;
	color: #ffffff;
	background: var(--wc-brand-ink);
}
body .dsh-wc-btn-danger { border: none; padding: 4px 14px; font-size: var(--wc-fs-md); line-height: 20px; color: #ffffff; background: var(--wc-danger); }
body .dsh-wc-btn-danger:hover { background: var(--wc-danger-hover); }
body .dsh-wc-btn-primary:hover { background: var(--wc-brand-press); }
body .dsh-wc-btn-primary:active { background: var(--wc-accent-press); filter: brightness(0.92); }
body .dsh-wc-btn-secondary {
	border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
	padding: 4px 14px;
	font-size: var(--wc-fs-md);
	line-height: 20px;
	color: var(--dsw-alias-label-secondary);
	background: var(--dsw-alias-bg-module-platform);
}
body .dsh-wc-btn-secondary:hover { background: var(--dsw-alias-interactive-bg-hover); }
body .dsh-wc-btn-secondary:active { background: var(--dsw-alias-interactive-bg-active); }
body .dsh-wc-btn-sm { padding: 4px 12px; font-size: var(--wc-fs-sm); line-height: 20px; }
/* settings search + per-row reset */
body .dsh-wc-search { display: flex; align-items: center; gap: 8px; }
body .dsh-wc-search-input {
box-sizing: border-box;
flex: 1 1 auto; min-width: 0; height: var(--wc-control-h); padding: 0 10px;
border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6); border-radius: var(--wc-radius-btn);
background: var(--dsw-alias-bg-module-platform); color: var(--dsw-alias-label-primary);
font-family: inherit; font-size: var(--wc-fs-sm); line-height: 1.5;
}
body .dsh-wc-search-input::placeholder { color: var(--dsw-alias-label-tertiary); }
body .dsh-wc-search-input:focus-visible {
outline: none; border-color: var(--wc-green, #07c160);
box-shadow: 0 0 0 2px color-mix(in srgb, var(--wc-green, #07c160) 22%, transparent);
}
body .dsh-wc-reset {
flex: none; width: 20px; height: 20px; padding: 0; margin-left: 2px;
border: none; border-radius: 999px; background: transparent; cursor: pointer;
color: var(--wc-ink-3); font-size: 12px; line-height: 20px;
opacity: .55; transition: opacity 250ms ease-out, background-color 250ms ease-out;
}
body .dsh-wc-row:hover .dsh-wc-reset, body .dsh-wc-reset:focus-visible { opacity: 1; }
body .dsh-wc-reset:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
body .dsh-wc-empty { padding: 18px 16px; text-align: center; color: var(--wc-ink-3); font-size: var(--wc-fs-sm); }
/* one settings section = one card */
body .dsh-wc-group {
border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
border-radius: 12px;
background: var(--dsw-alias-bg-module-platform, #ffffff);
overflow: hidden;
}
body .dsh-wc-group-title {
padding: 14px 16px 2px;
color: var(--wc-ink-3);
font-size: var(--wc-fs-sm);
font-weight: 600;
line-height: 18px;
}
body .dsh-wc-group > .dsh-wc-row:first-child,
body .dsh-wc-group-body > .dsh-wc-row:first-child { border-top: none !important; }
body .dsh-wc-row { transition: background-color 250ms ease-out; }
@media (hover: hover) { body .dsh-wc-row:hover { background: var(--dsw-alias-interactive-bg-hover); } }
@media (prefers-reduced-motion: reduce) { body .dsh-wc-row { transition: none; } }
body .dsh-wc-seg {
	display: inline-flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	max-width: 100%;
	align-items: center;
	gap: 2px;
	padding: 2px;
	border-radius: var(--wc-radius-md);
	background: var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.1));
}
body .dsh-wc-seg-item {
	height: calc(var(--wc-control-h) - 4px);
	padding: 0 10px;
	border: 0;
	border-radius: var(--wc-radius-btn);
	background: transparent;
	color: var(--dsw-alias-label-secondary);
	font-family: inherit;
	font-size: var(--wc-fs-sm);
	line-height: 1.4;
	cursor: pointer;
	transition: background-color 250ms ease-out, color 250ms ease-out, box-shadow 250ms ease-out;
}
body .dsh-wc-seg-item:hover { color: var(--dsw-alias-label-primary); }
body .dsh-wc-seg-item[aria-pressed="true"] {
	background: var(--dsw-alias-bg-module-platform, #ffffff);
	color: var(--dsw-alias-label-primary);
	font-weight: 500;
	box-shadow: inset 0 0 0 0.5px var(--dsw-alias-border-l2), 0 1px 2px rgba(0, 0, 0, 0.12);
}
body .dsh-wc-swatch {
	width: 22px;
	height: 22px;
	flex: none;
	padding: 0;
	border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
	border-radius: 999px;
	cursor: pointer;
}
body .dsh-wc-swatch[aria-pressed="true"] {
	box-shadow: 0 0 0 1.5px var(--wc-green, #07c160);
}
body .dsh-wc-switch { position: relative; }
/* 20px 高的轨道保持轻量外观，四周补 4px 透明命中区，不至于难点中 */
body .dsh-wc-switch::before {
content: "";
position: absolute;
inset: -4px -2px;
border-radius: 999px;
}
body .dsh-wc-switch:disabled { cursor: not-allowed; }
body .dsh-wc-seg-item:focus-visible,
body .dsh-wc-btn:focus-visible,
body .dsh-wc-switch:focus-visible,
body .dsh-wc-swatch:focus-visible,
body .dsh-wc-color:focus-visible {
	outline: 2px solid rgba(7, 193, 96, 0.5);
	outline-offset: 2px;
}
body .dsh-wc-btn[disabled] {
	opacity: 0.45;
	cursor: not-allowed;
}
body .dsh-wc-btn[disabled]:hover,
body .dsh-wc-btn[disabled]:active {
	background: var(--dsw-alias-bg-module-platform);
	border-color: var(--dsw-alias-border-l2);
	color: var(--dsw-alias-label-secondary, #666);
}
/* Custom sidebar fill: beats both skin palettes (light and dark). */
html body.dsh-wc-sidebar-bg.dsh-wechat-skin-on .PIRFFq_sidebarCol {
	background: var(--dsh-wc-sidebar-color) !important;
}
/* Ink follows the chosen fill so the session list stays legible. */
html body.dsh-wc-sidebar-bg[data-dsh-wc-sidebar-ink="light"] .PIRFFq_sidebarCol {
	--dsw-alias-label-primary: #f2f2f3;
	--dsw-alias-label-secondary: rgba(242, 242, 243, 0.72);
	--dsw-alias-label-tertiary: rgba(242, 242, 243, 0.5);
}
html body.dsh-wc-sidebar-bg[data-dsh-wc-sidebar-ink="dark"] .PIRFFq_sidebarCol {
	--dsw-alias-label-primary: #1b1b1c;
	--dsw-alias-label-secondary: rgba(27, 27, 28, 0.66);
	--dsw-alias-label-tertiary: rgba(27, 27, 28, 0.45);
}
html body.dsh-wc-sidebar-bg[data-dsh-wc-sidebar-ink="light"] .JoiKIa_sessionRow:hover {
	background: rgba(255, 255, 255, 0.09);
}
/* Sidebar entry drag: rows reorder by flex order, never by moving DOM. */
body.dsh-wc-panel-dragging,
body.dsh-wc-panel-dragging * {
	cursor: grabbing !important;
	user-select: none !important;
}
body.dsh-wc-panel-dragging .kB3qhq_panelRow * {
	pointer-events: none;
}
body .dsh-wc-panel-ghost {
	border-radius: var(--wc-radius-md);
	opacity: 0.97;
	box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.12);
	background: var(--dsw-alias-bg-module-platform, #ffffff);
	outline: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
}
body .dsh-wc-panel-ghost * {
	pointer-events: none;
}
body .dsh-wc-panel-placeholder {
	border-radius: var(--wc-radius-md);
	background: rgba(7, 193, 96, 0.1);
	box-shadow: inset 0 0 0 1px rgba(7, 193, 96, 0.35);
}
body .dsh-wc-color {
	width: 44px;
	height: 28px;
	padding: 2px;
	border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
	border-radius: var(--wc-radius-bubble);
	background: var(--dsw-alias-bg-module-platform);
	cursor: pointer;
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
		/** Sidebar avatar artwork: head-and-shoulders figure (default) or coloured initial. */
		let avatarStyle = "silhouette";

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
			if (avatarStyle === "initial") return initialAvatar(title, seed);
			return silhouetteAvatar(title, seed);
		}

		/** Neutral chip, coloured initial: the hue identifies without painting the tile. */
		function initialAvatar(title, seed) {
			const AVATAR_HUES = [352, 12, 28, 200, 214, 228, 242, 258, 274, 292, 312, 332];
			const hue = AVATAR_HUES[Math.abs(seed) % AVATAR_HUES.length];
			const initial = escapeXml(Array.from(title.trim())[0] || "?");
			const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
				+ '<rect width="128" height="128" rx="30" fill="#f2f2f3"/>'
				+ '<text x="64" y="86" font-size="60" text-anchor="middle" fill="hsl(' + hue + ',54%,36%)" font-family="Microsoft YaHei, Segoe UI, sans-serif">' + initial + '</text></svg>';
			return "data:image/svg+xml," + encodeURIComponent(svg);
		}

		/** Head-and-shoulders bust: neck joins shoulders, tint and pose come from the title. */
		/**
		 * Twelve muted backgrounds with a same-family figure. Each row is [bg, fg, topic]:
		 * the topic word is what a session has to be about for this pair to win.
		 */
		const AVATAR_PALETTE = [
			["#eef1f4", "#8a93a3", "default"],   // slate
			["#eaf5ee", "#5f8f74", "life"],      // green
			["#e9f2f8", "#5b7fa0", "data"],      // steel
			["#f3eff8", "#83709f", "design"],    // iris
			["#f7f0e8", "#a08256", "writing"],   // sand
			["#f8eeee", "#a47070", "repair"],    // clay
			["#eaf5f4", "#5c8f8b", "team"],      // teal
			["#f6eef2", "#a3758c", "creative"],  // plum
			["#eef0f7", "#6b76a3", "code"],      // indigo
			["#f7f2e8", "#8d8558", "ops"],       // olive
			["#fbf2e2", "#b4863f", "money"],     // amber
			["#f2f0ec", "#8a857c", "archive"],   // linen
		];
		/**
		 * Topic words, most specific first. A session titled "修复登录态过期" is a repair,
		 * not a login task, so the repair row is checked before anything generic.
		 */
		const AVATAR_TOPICS = [
			["money", ["支付", "财务", "账单", "预算", "发票", "费用", "收入", "结算", "对账", "billing", "payment", "invoice", "budget", "finance"]],
			["design", ["设计", "视觉", "样式", "配色", "排版", "交互", "图标", "原型", "界面", "页面", "改版", "design", "ui", "ux", "style", "layout", "figma"]],
			["code", ["开发", "代码", "工程", "接口", "部署", "脚本", "构建", "重构", "迁移", "联调", "api", "code", "deploy", "build", "refactor", "migrate"]],
			["data", ["数据", "统计", "报表", "指标", "图表", "分析", "评测", "对比", "data", "report", "metric", "chart", "analysis", "benchmark"]],
			["ops", ["运维", "监控", "日志", "性能", "容量", "巡检", "缓存", "ops", "monitor", "log", "perf", "capacity"]],
			["repair", ["修复", "故障", "报错", "异常", "崩溃", "回滚", "缺陷", "bug", "fix", "crash", "error", "incident", "regression"]],
			["archive", ["归档", "历史", "回顾", "整理", "清理", "备份", "archive", "history", "review", "cleanup", "backup"]],
			["writing", ["文档", "笔记", "写作", "文案", "报告", "草稿", "知识", "说明", "doc", "note", "write", "draft", "readme"]],
			["team", ["会议", "沟通", "协作", "同步", "讨论", "评审", "团队", "例会", "meeting", "sync", "team", "standup"]],
			["creative", ["创意", "灵感", "音乐", "视频", "内容", "策划", "故事", "插画", "idea", "creative", "music", "video", "content"]],
			["life", ["生活", "旅行", "出行", "健身", "健康", "饮食", "家庭", "清单", "周末", "life", "travel", "health", "plan", "weekend"]],
		];

		function titleHash(text) {
			let h = 2166136261;
			for (const ch of String(text)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
			return h >>> 0;
		}
		/** Palettes the title's topic points at, or null when no word matches. */
		function paletteForTopic(title) {
			const text = String(title).toLowerCase();
			for (const [topic, words] of AVATAR_TOPICS) {
				for (const word of words) {
					if (text.includes(word)) {
						const row = AVATAR_PALETTE.findIndex((item) => item[2] === topic);
						if (row >= 0) return AVATAR_PALETTE[row];
					}
				}
			}
			return null;
		}
		function silhouetteAvatar(title, seed) {
			const base = titleHash(title);
			const h = (base ^ Math.imul(Math.abs(seed) + 1, 2654435761)) >>> 0;
			const [bg, fg] = paletteForTopic(title) || AVATAR_PALETTE[base % AVATAR_PALETTE.length];
			const headX = 58 + ((h >>> 3) % 13);
			const headR = 20 + ((h >>> 7) % 5);
			const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
				+ '<defs><clipPath id="c"><rect width="128" height="128" rx="30"/></clipPath></defs>'
				+ '<rect width="128" height="128" rx="30" fill="' + bg + '"/>'
				+ '<g clip-path="url(#c)" fill="' + fg + '">'
				+ '<circle cx="' + headX + '" cy="46" r="' + headR + '"/>'
				+ '<path d="M 18 128 C 18 92 40 76 64 76 C 88 76 110 92 110 128 Z"/></g></svg>';
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

		/**
		 * Titles a brand-new session carries before it gets a name. Two of them read the same,
		 * so keying the avatar by title would paint every new session the same colour.
		 */
		const PLACEHOLDER_TITLES = ["新建会话", "新会话", "新对话", "未命名会话", "未命名", "new chat", "new session", "untitled", "untitled session"];
		function isPlaceholderTitle(title) {
			if (!title) return true;
			return PLACEHOLDER_TITLES.includes(String(title).trim().toLowerCase());
		}
		/** Avatar key: the title, or the session id while the session is still unnamed. */
		function avatarKeyFor(row, title) {
			if (!isPlaceholderTitle(title)) return title;
			const raw = (row && row.dataset && row.dataset.rowKey) || "";
			return raw.startsWith("session:") ? "session:" + raw.slice(8) : title;
		}

		/** Assign (and persist) a stable avatar to one session row. */
		function assignRowAvatar(row, title) {
			const key = avatarKeyFor(row, title);
			if (avatarMap[key] === undefined) {
				avatarMap[key] = avatarIndexForTitle(key);
				// Long-lived installs collect one entry per session title; drop keys whose
				// sessions are gone once the map grows past a few hundred.
				const keys = Object.keys(avatarMap);
				if (keys.length > 400) {
					const live = new Set(Array.prototype.map.call(
						document.querySelectorAll(".JoiKIa_sessionRow"), (el) => avatarKeyFor(el, titleOf(el))
					));
					live.add(key);
					const pruned = {};
					keys.forEach((k) => { if (live.has(k)) pruned[k] = avatarMap[k]; });
					avatarMap = pruned;
				}
				writeJson(AVATAR_MAP_KEY, avatarMap);
			}
			const value = "url(\"" + avatarForIndex(key, avatarMap[key]) + "\")";
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
					URL.revokeObjectURL(url);
					// A null 2d context would throw inside onload and leave the promise pending
					// forever, so the upload button would never answer.
					if (!ctx) { reject(new Error("canvas unavailable")); return; }
					try {
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
						resolve(canvas.toDataURL("image/jpeg", 0.82));
					} catch (error) { reject(error); }
				};
				img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
				img.src = url;
			});
		}

		/** Set a custom user avatar (persisted + applied). */
		function setUserAvatar(dataUrl) {
			// false = the browser refused to store it (quota); the caller tells the user
			// instead of showing an avatar that vanishes on the next restart.
			let stored = true;
			try { window.localStorage.setItem(USER_AVATAR_KEY, dataUrl); } catch (e) { stored = false; }
			userAvatarDataUrl = dataUrl;
			const value = "url(\"" + dataUrl + "\")";
			document.documentElement.style.setProperty("--dsh-user-avatar", value);
			lastUserAvatarValue = value;
			return stored;
		}

		/** Set the global AI avatar (persisted + applied; overrides per-session avatars). */
		function setAiAvatar(dataUrl) {
			let stored = true;
			try { window.localStorage.setItem(AI_AVATAR_KEY, dataUrl); } catch (e) { stored = false; }
			aiAvatarDataUrl = dataUrl;
			const value = "url(\"" + dataUrl + "\")";
			document.documentElement.style.setProperty("--dsh-assistant-avatar", value);
			lastAssistantAvatarValue = value;
			return stored;
		}

		//#region sidebar avatar
		/** Sidebar avatar removed by request: never inject it, and clear any existing one. */
		function ensureSidebarAvatar() { removeSidebarAvatar(); }
		/** Remove the injected sidebar avatar. */
		function removeSidebarAvatar() {
			document.getElementById("dsh-wechat-avatar")?.remove();
		}		//#endregion

		/** Long drafts: fade the scroll area's clipped edge(s) instead of hard-cutting. */
		function updateComposerFade(view) {
			const canScroll = view.scrollHeight - view.clientHeight > 2;
			if (!canScroll) { delete view.dataset.dshFade; return; }
			const atTop = view.scrollTop <= 1;
			const atBottom = view.scrollTop + view.clientHeight >= view.scrollHeight - 1;
			if (atTop && atBottom) delete view.dataset.dshFade;
			else view.dataset.dshFade = atTop ? "bottom" : atBottom ? "top" : "both";
		}
		// Bound scroll views are tracked so cleanup can unbind them: the host swaps
		// the composer node on re-render, and a listener left behind keeps writing
		// data-dsh-fade after the skin is gone.
		const composerFadeBound = new Map();
		function composerScrollScan() {
			const view = document.querySelector(".JZLxKW_scroll");
			if (!view) return;
			if (!composerFadeBound.has(view)) {
				const onScroll = () => updateComposerFade(view);
				view.addEventListener("scroll", onScroll, { passive: true });
				composerFadeBound.set(view, onScroll);
				view.dataset.dshFadeBound = "1";
			}
			updateComposerFade(view);
		}
		function unbindComposerFade() {
			for (const [view, onScroll] of composerFadeBound) {
				try {
					view.removeEventListener("scroll", onScroll);
					delete view.dataset.dshFadeBound;
					delete view.dataset.dshFade;
				} catch (e) {}
			}
			composerFadeBound.clear();
		}

		/** Debounced full DOM enhancement pass. */
		let scheduled = null;
		/** Extra passes registered by the client body (frame-level layout work). */
		const scanHooks = [];
		function scheduleScan() {
			if (scheduled) return;
			scheduled = requestAnimationFrame(() => {
				scheduled = null;
				scanRows();
				ensureMessageAvatars();
				ensureSidebarAvatar();
				for (const hook of scanHooks) hook();
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
		function applyTextFontLevel(level) {
			const scale = FONT_SCALES[level] !== undefined ? FONT_SCALES[level] : FONT_SCALES[3];
			document.documentElement.style.setProperty("--dsh-wechat-text-scale", String(scale));
		}
		function applyFontLevel(level) {
			const scale = FONT_SCALES[level] !== undefined ? FONT_SCALES[level] : FONT_SCALES[3];
			document.documentElement.style.setProperty("--dsh-wechat-font-scale", String(scale));
		}

		/** Apply the list-density mode: compact shortens session list rows. */
		function applyDensity(density) {
			if (!document.body) return;
			if (density === "compact") document.body.dataset.dshWechatDensity = "compact";
			else delete document.body.dataset.dshWechatDensity;
		}

		/** Show/hide the sent-row (my) avatar; hiding it also drops the reserved 42px column. */
		function applyUserAvatar(on) {
		  if (document.body) document.body.dataset.dshWechatUserAvatar = on ? "1" : "0";
		}

		/** Show/hide the assistant avatar; hiding it also drops the reserved 42px column. */
		function applyAiAvatar(on) {
		  if (document.body) document.body.dataset.dshWechatAiAvatar = on ? "1" : "0";
		}

		/** Apply the chat content width mode: wide (full) / medium / native sizing. */
		function applyChatWidth(width) {
		  if (!document.body) return;
		  if (width === "wide" || width === "medium") document.body.dataset.dshWechatWidth = width;
		  else delete document.body.dataset.dshWechatWidth;
		}

		//#region dsh-wechat-skin: sidebar background
		/** Sidebar fill override in #rrggbb; null keeps the skin's own colour. */
		let sidebarBg = null;

		/** Accept #rgb / #rrggbb only; anything else means "follow the skin". */
		function normalizeHexColor(value) {
			if (typeof value !== "string") return null;
			const hex = value.trim();
			const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
			if (short) return ("#" + short[1] + short[1] + short[2] + short[2] + short[3] + short[3]).toLowerCase();
			return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : null;
		}

/** Reading rhythm: compact / normal / relaxed. */
function applyLineHeight(value) {
if (typeof document === "undefined" || !document.body) return;
const mode = value === "compact" || value === "relaxed" ? value : "normal";
document.body.dataset.dshWechatLineHeight = mode;
}

/** Turn off skin transitions/animations (also honors the OS setting via CSS). */
function applyReducedMotion(on) {
if (typeof document === "undefined" || !document.body) return;
document.body.dataset.dshWcReduceMotion = on ? "1" : "0";
}

/** Font family: system keeps the host stack, wechat mimics PingFang, serif for long reads. */
function applyFontFamily(value) {
if (typeof document === "undefined" || !document.body) return;
const legacy = value === "serif" ? "wenkai" : value;
const mode = FONT_FAMILY_VALUES.indexOf(legacy) >= 0 ? legacy : "system";
document.body.dataset.dshWcFontFamily = mode;
}

/** High-contrast text and borders. */
function applyContrast(on) {
if (typeof document === "undefined" || !document.body) return;
document.body.dataset.dshWcContrast = on ? "high" : "normal";
}

/** Sidebar avatar shape: rounded square (WeChat), circle, or square. */
function applyAvatarShape(value) {
if (typeof document === "undefined" || !document.body) return;
const mode = value === "circle" || value === "square" ? value : "rounded";
document.body.dataset.dshWcAvatarShape = mode;
}

/** Sidebar avatar artwork: head-and-shoulders figure (default) or coloured initial. */
function applyAvatarStyle(value) {
const mode = value === "initial" ? "initial" : "silhouette";
avatarStyle = mode;
if (typeof document === "undefined" || !document.body) return;
document.body.dataset.dshWcAvatarStyle = mode;
if (typeof document.querySelectorAll !== "function") return;
for (const row of document.querySelectorAll(".JoiKIa_sessionRow")) {
const title = titleOf(row);
if (title) assignRowAvatar(row, title);
}
}

/** User-saved presets, newest first. */
function readCustomPresets() {
const list = readJson(CUSTOM_PRESETS_KEY, []);
return Array.isArray(list) ? list.filter((item) => item && typeof item.id === "string" && typeof item.name === "string") : [];
}

/** Theme-level preset marker (drives palette overrides in CSS). */
function applyPresetTheme(id) {
if (typeof document === "undefined" || !document.body) return;
// Keep the paper palette marker isolated: every other preset uses the
// ordinary WeChat palette simply by clearing the marker.
if (id === "paper") document.body.dataset.dshWechatPreset = id;
else delete document.body.dataset.dshWechatPreset;
}

		/** Point --dsh-wc-sidebar-color at the chosen fill (or drop it). */
		function applySidebarBg() {
			if (typeof document === "undefined" || !document.body) return;
			const custom = sidebarBg !== null;
			document.body.classList.toggle(SIDEBAR_BG_CLASS, custom);
			const root = document.documentElement;
			if (custom) {
				root.style.setProperty("--dsh-wc-sidebar-color", sidebarBg);
				// Keep the session list readable when the fill is far from the theme's own.
				const n = parseInt(sidebarBg.slice(1), 16);
				const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
				document.body.dataset.dshWcSidebarInk = lum < 0.55 ? "light" : "dark";
			} else {
				root.style.removeProperty("--dsh-wc-sidebar-color");
				delete document.body.dataset.dshWcSidebarInk;
			}
		}
		//#endregion


//#region dsh-wechat-skin: sidebar entry order
/** Preferred panel order (labels, first = topmost); empty = DSH's own order. */
let sidebarOrder = [];
/** Installed drag listener teardown. */
let panelDragCleanup = null;

/** Top-level entries of the panel list: the wrapper element, its row and accessible label. */
function panelEntries(list) {
const host = list || (typeof document !== "undefined" ? document.querySelector(PANEL_LIST_SELECTOR) : null);
if (!host) return [];
return Array.prototype.slice.call(host.children).map((el) => {
const row = el.matches && el.matches(PANEL_ROW_SELECTOR) ? el : (el.querySelector ? el.querySelector(PANEL_ROW_SELECTOR) : null);
if (!row) return null;
const label = row.getAttribute("aria-label") || "";
return label ? { el, row, label } : null;
}).filter(Boolean);
}

/** Labels in the order the user currently sees. */
function currentPanelLabels() {
const entries = panelEntries();
if (sidebarOrder.length === 0) return entries.map((entry) => entry.label);
const known = entries.filter((entry) => sidebarOrder.indexOf(entry.label) >= 0)
.sort((a, b) => sidebarOrder.indexOf(a.label) - sidebarOrder.indexOf(b.label));
const rest = entries.filter((entry) => sidebarOrder.indexOf(entry.label) < 0);
return known.concat(rest).map((entry) => entry.label);
}

/** Unique, non-empty label list. */
function normalizePanelOrder(list) {
if (!Array.isArray(list)) return [];
const seen = Object.create(null);
const out = [];
for (const item of list) {
if (typeof item !== "string" || !item || seen[item]) continue;
seen[item] = true;
out.push(item);
}
return out;
}

/** Paint the stored order with flex `order`, leaving DSH's DOM untouched. */
function applyPanelOrder() {
const entries = panelEntries();
if (entries.length === 0) return;
if (sidebarOrder.length === 0) {
for (const entry of entries) entry.el.style.removeProperty("order");
return;
}
let tail = sidebarOrder.length;
for (const entry of entries) {
const index = sidebarOrder.indexOf(entry.label);
entry.el.style.setProperty("order", String(index >= 0 ? index : tail++));
}
}

/** Persist + repaint. */
function setPanelOrder(list) {
sidebarOrder = normalizePanelOrder(list);
try {
if (sidebarOrder.length === 0) window.localStorage.removeItem(SIDEBAR_ORDER_KEY);
else window.localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(sidebarOrder));
} catch (e) {}
applyPanelOrder();
}

/** Panel children sorted by their on-screen position, optionally skipping one entry. */
function visualPanelItems(list, skipEl) {
return Array.prototype.slice.call(list.children)
.filter((el) => el !== skipEl)
.map((el) => {
const row = el.matches && el.matches(PANEL_ROW_SELECTOR) ? el : (el.querySelector ? el.querySelector(PANEL_ROW_SELECTOR) : null);
return { el, label: row ? (row.getAttribute("aria-label") || "") : "" };
})
.filter((item) => item.label)
.sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top);
}

/**
 * Drag a sidebar entry to reorder it. The row lifts into a fixed ghost that
 * follows the pointer, a translucent placeholder holds the drop slot, and
 * nothing is committed until pointerup.
 */
function initPanelDrag() {
if (panelDragCleanup || typeof document === "undefined") return;
let drag = null;

function finish(event) {
if (!drag) return;
const state = drag;
drag = null;
document.removeEventListener("pointermove", onMove, true);
document.removeEventListener("pointerup", finish, true);
document.removeEventListener("pointercancel", finish, true);
document.body.classList.remove(PANEL_DRAGGING_CLASS);
if (!state.moved) return;
if (!event || event.type !== "pointercancel") {
const labels = visualPanelItems(state.list, state.entry.el).map((item) => item.label);
labels.splice(Math.min(state.index, labels.length), 0, state.entry.label);
setPanelOrder(labels);
} else {
applyPanelOrder();
}
state.entry.el.classList.remove(PANEL_DRAG_SOURCE_CLASS);
state.entry.el.style.removeProperty("display");
if (state.ghost && state.ghost.parentNode) state.ghost.parentNode.removeChild(state.ghost);
if (state.placeholder && state.placeholder.parentNode) state.placeholder.parentNode.removeChild(state.placeholder);
const swallow = (clickEvent) => { clickEvent.stopPropagation(); clickEvent.preventDefault(); };
document.addEventListener("click", swallow, true);
setTimeout(() => document.removeEventListener("click", swallow, true), 0);
}

function onMove(event) {
if (!drag) return;
if (!drag.moved) {
if (Math.abs(event.clientY - drag.startY) < 4 && Math.abs(event.clientX - drag.startX) < 4) return;
drag.moved = true;
const rect = drag.rect;
const ghost = drag.entry.el.cloneNode(true);
ghost.className = (ghost.className ? ghost.className + " " : "") + "dsh-wc-panel-ghost";
ghost.style.position = "fixed";
ghost.style.left = rect.left + "px";
ghost.style.width = rect.width + "px";
ghost.style.height = rect.height + "px";
ghost.style.top = rect.top + "px";
ghost.style.margin = "0";
ghost.style.pointerEvents = "none";
const placeholder = document.createElement("div");
placeholder.className = "dsh-wc-panel-placeholder";
placeholder.style.height = rect.height + "px";
placeholder.style.width = "100%";
placeholder.style.flex = "0 0 auto";
drag.ghost = ghost;
drag.placeholder = placeholder;
drag.entry.el.style.display = "none";
drag.entry.el.classList.add(PANEL_DRAG_SOURCE_CLASS);
drag.list.appendChild(placeholder);
document.body.appendChild(ghost);
document.body.classList.add(PANEL_DRAGGING_CLASS);
}
event.preventDefault();
if (drag.ghost) drag.ghost.style.top = (event.clientY - drag.grabDy) + "px";
const others = visualPanelItems(drag.list, drag.entry.el);
let index = others.length;
for (let i = 0; i < others.length; i++) {
const rect = others[i].el.getBoundingClientRect();
if (event.clientY < rect.top + rect.height / 2) { index = i; break; }
}
drag.index = index;
for (let i = 0; i < others.length; i++) others[i].el.style.setProperty("order", String(i < index ? i : i + 1));
drag.placeholder.style.setProperty("order", String(index));
}

function onPointerDown(event) {
if (event.button !== 0) return;
const row = event.target && event.target.closest ? event.target.closest(PANEL_ROW_SELECTOR) : null;
if (!row) return;
const list = row.closest(PANEL_LIST_SELECTOR);
if (!list) return;
const entry = panelEntries(list).find((item) => item.row === row || item.el.contains(row));
if (!entry) return;
const rect = row.getBoundingClientRect();
drag = { entry, list, startX: event.clientX, startY: event.clientY, grabDy: event.clientY - rect.top, rect, moved: false, index: 0, ghost: null, placeholder: null };
document.addEventListener("pointermove", onMove, true);
document.addEventListener("pointerup", finish, true);
document.addEventListener("pointercancel", finish, true);
}

document.addEventListener("pointerdown", onPointerDown, true);
panelDragCleanup = () => {
document.removeEventListener("pointerdown", onPointerDown, true);
document.removeEventListener("pointermove", onMove, true);
document.removeEventListener("pointerup", finish, true);
document.removeEventListener("pointercancel", finish, true);
if (drag) {
if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
if (drag.placeholder && drag.placeholder.parentNode) drag.placeholder.parentNode.removeChild(drag.placeholder);
drag.entry.el.classList.remove(PANEL_DRAG_SOURCE_CLASS);
drag.entry.el.style.removeProperty("display");
drag = null;
}
document.body.classList.remove(PANEL_DRAGGING_CLASS);
};
}
//#endregion

		/** Toggle row slot store: enabled flag + font level. */
		function createStore(initialEnabled, initialFontLevel, initialTextFontLevel, initialDensity, initialUserAvatar, initialChatWidth, initialSidebarBg, initialAiAvatar, initialLineHeight, initialReduceMotion, initialFontFamily, initialContrast, initialAvatarShape, initialAvatarStyle, initialComposerFx) {
		  return (0, _runtime_client.defineStore)({
		    init: () => ({ enabled: initialEnabled, fontLevel: initialFontLevel, textFontLevel: initialTextFontLevel, density: initialDensity, userAvatar: initialUserAvatar, chatWidth: initialChatWidth, sidebarBg: initialSidebarBg, aiAvatar: initialAiAvatar, lineHeight: initialLineHeight, reduceMotion: initialReduceMotion, fontFamily: initialFontFamily, contrast: initialContrast, avatarShape: initialAvatarShape, avatarStyle: initialAvatarStyle, composerFx: initialComposerFx, revision: -1 }),
		    actions: {
		      sync: (d, enabled, fontLevel, textFontLevel, density, userAvatar, chatWidth, sidebarBg, aiAvatar, revision, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarStyle, composerFx) => {
		        if (revision <= d.revision) return;
		        d.enabled = enabled;
		        d.fontLevel = fontLevel;
		        d.textFontLevel = textFontLevel;
		        d.density = density;
		        d.userAvatar = userAvatar;
		        d.chatWidth = chatWidth;
		        d.sidebarBg = sidebarBg;
		        d.aiAvatar = aiAvatar;
		        d.lineHeight = lineHeight;
		        d.reduceMotion = reduceMotion;
		        d.fontFamily = fontFamily;
		        d.contrast = contrast;
		        d.avatarShape = avatarShape;
		        d.avatarStyle = avatarStyle;

		        d.composerFx = composerFx;
		        d.revision = revision;
					}
				}
			});
		}

		/** Inline styles for static (non-interactive) parts of the settings row. */
		const styles = {
versionTag: { color: "var(--dsw-alias-label-tertiary)", fontVariantNumeric: "tabular-nums" },
			root: {
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				minWidth: 0
			},
			card: {
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				minWidth: 0
			},
			cardHead: {
				padding: "14px 16px 8px"
			},
			cardTitle: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "13px",
				fontWeight: 600,
				lineHeight: "20px"
			},
			cardDesc: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px",
				marginTop: "2px"
			},
			item: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "16px",
				minHeight: "44px",
				padding: "10px 16px",
				flexWrap: "wrap",
				borderTop: "0.5px solid var(--dsw-alias-border-l2)"
			},
			itemMain: {
				display: "flex",
				flexDirection: "column",
				gap: "2px",
				flex: "1 1 160px",
				minWidth: 0
			},
			itemTitle: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "13px",
				lineHeight: "20px"
			},
			itemHint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "16px"
			},
			itemControl: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-end",
				gap: "8px",
				flex: "none",
				marginLeft: "auto"
			},
			itemFirst: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "16px",
				minHeight: "44px",
				padding: "10px 16px",
				flexWrap: "wrap"
			},
			cardFoot: {
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				gap: "10px",
				padding: "12px 16px",
				border: "0.5px solid var(--dsw-alias-border-l2)",
				borderRadius: "12px",
				background: "var(--dsw-alias-bg-layer-2, rgba(128, 128, 128, 0.04))",
				flexWrap: "wrap"
			},
			footLeft: {
				display: "flex",
				alignItems: "center",
				gap: "6px",
				display: "flex",
				alignItems: "center",
				gap: "6px",
				minWidth: 0,
				fontSize: "12px",
				lineHeight: "16px",
				color: "var(--dsw-alias-label-tertiary)"
			},
			footRight: {
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				gap: "8px",
				flex: "1 1 auto"
			},
			footActions: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-end",
				gap: "8px",
				flexWrap: "wrap"
			},
			footHint: {
				fontSize: "12px",
				lineHeight: "18px",
				color: "var(--dsw-alias-label-tertiary)"
			},
			dangerRow: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "12px",
				marginTop: "10px",
				paddingTop: "10px",
				borderTop: "0.5px solid var(--dsw-alias-border-l2)"
			},
			dot: {
				width: "6px",
				height: "6px",
				borderRadius: "999px",
				flex: "none",
				background: "#07c160"
			},
			dotWarn: { background: "#ffc53d" },
			previewBlock: {
				padding: "2px 16px 14px"
			},
			groupTitle: {
				padding: "14px 16px 6px",
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				fontWeight: 600,
				lineHeight: "16px"
			}
		};

		/** One label/control line inside the skin card. */
		function SkinRow({ title, hint, first, onReset, resetLabel, children }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-wc-row",
				style: first ? styles.itemFirst : styles.item,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.itemMain,
						children: [
							(0, react_jsx_runtime.jsx)("div", { style: styles.itemTitle, children: title }),
							hint ? (0, react_jsx_runtime.jsx)("div", { style: styles.itemHint, children: hint }) : null
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
style: styles.itemControl,
children: [
children,
typeof onReset === "function" ? (0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-reset",
title: resetLabel || "",
"aria-label": resetLabel || "",
onClick: onReset,
children: "\u21ba"
}) : null
]
})
				]
			});
		}

		/** A titled card that groups related rows (one section = one card). */
		function Group({ title, children }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-wc-group",
				children: [
					title ? (0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-group-title", children: title }) : null,
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-group-body", children })
				]
			});
		}

		/** Segmented control: one row of mutually exclusive choices. */
		function Segmented({ value, options, onChange }) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-wc-seg",
				children: options.map((option) => (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dsh-wc-seg-item",
					"aria-pressed": value === option.value,
					onClick: () => onChange(option.value),
					children: option.label
				}, String(option.value)))
			});
		}

/** A miniature of the chat + sidebar, so changes are visible before leaving settings. */
function SkinPreview({ t, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, darkSkin, lineHeight, aiAvatarVisible, fontFamily, contrast, avatarShape }) {
const scale = FONT_SCALES[fontLevel] !== undefined ? FONT_SCALES[fontLevel] : 1;
const textScale = FONT_SCALES[textFontLevel] !== undefined ? FONT_SCALES[textFontLevel] : FONT_SCALES[3];
const previewFont = fontFamily === "wechat" ? '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  : fontFamily === "wenkai" ? '"LXGW WenKai", "LXGWWenKai", "霞鶩文楷", "Kaiti SC", serif'
  : fontFamily === "kai" ? '"Kaiti SC", "STKaiti", KaiTi, serif'
  : fontFamily === "round" ? '"Yuanti SC", YouYuan, "Hiragino Maru Gothic ProN", "PingFang SC", sans-serif'
  : undefined;
const previewAvatarRadius = avatarShape === "circle" ? "50%" : avatarShape === "square" ? "2px" : "5px";
const highContrast = contrast === "high";
const gap = 10;
const widthPct = chatWidth === "wide" ? "92%" : chatWidth === "medium" ? "76%" : "60%";
const sidebarColor = sidebarBg || (darkSkin ? "#1a1a1b" : "#eeeef0");
const canvasColor = darkSkin ? "#111113" : "#fafafa";
const inBubble = darkSkin ? "rgba(255,255,255,0.09)" : "#ffffff";
const outBubble = "#95ec69";
const lh = lineHeight === "compact" ? 1.5 : lineHeight === "relaxed" ? 1.85 : 1.6;
const bubbleBase = { position: "relative", maxWidth: widthPct, padding: "6px 10px", borderRadius: "8px", fontFamily: previewFont, fontSize: Math.round(12 * textScale) + "px", lineHeight: lh };
return (0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", borderRadius: "10px", overflow: "hidden", border: "0.5px solid var(--dsw-alias-border-l2)" },
children: [
(0, react_jsx_runtime.jsx)("div", {
style: { width: "76px", flex: "none", background: sidebarColor, padding: "8px 6px", display: "flex", flexDirection: "column", gap: "6px" },
children: [0, 1, 2, 3].map((index) => (0, react_jsx_runtime.jsx)("div", {
style: { height: "14px", borderRadius: "4px", background: index === 0 ? "rgba(7,193,96,0.22)" : darkSkin ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }
}, "s" + index))
}),
(0, react_jsx_runtime.jsxs)("div", {
style: { flex: "1 1 auto", minWidth: 0, background: canvasColor, padding: "10px 12px", display: "flex", flexDirection: "column", gap: gap },
children: [
(0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", alignItems: "flex-start", gap: "8px", alignSelf: "flex-start" },
children: [
aiAvatarVisible === false ? null : (0, react_jsx_runtime.jsx)("span", {
style: { width: "22px", height: "22px", borderRadius: previewAvatarRadius, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: darkSkin ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)", color: darkSkin ? "rgba(255,255,255,0.55)" : "#999", fontSize: "12px" },
children: "AI"
}),
(0, react_jsx_runtime.jsxs)("div", {
style: Object.assign({}, bubbleBase, { background: inBubble, color: highContrast ? (darkSkin ? "#f2f2f3" : "#111111") : (darkSkin ? "rgba(255,255,255,0.86)" : "#1a1a1a"), border: highContrast ? (darkSkin ? "0.5px solid rgba(255,255,255,0.34)" : "0.5px solid rgba(0,0,0,0.28)") : (darkSkin ? "0.5px solid rgba(255,255,255,0.06)" : "0.5px solid rgba(0,0,0,0.05)") }),
children: t("previewIn")
})
]
}),
(0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", alignItems: "flex-start", gap: "8px", alignSelf: "flex-end" },
children: [
userAvatarVisible === false ? null : (0, react_jsx_runtime.jsx)("span", {
style: { width: "22px", height: "22px", borderRadius: previewAvatarRadius, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: darkSkin ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)", color: darkSkin ? "rgba(255,255,255,0.55)" : "#999", fontSize: "12px" },
children: t("me")
}),
(0, react_jsx_runtime.jsxs)("div", {
style: Object.assign({}, bubbleBase, { background: outBubble, color: "#101010" }),
children: t("previewOut")
})
]
})
]
})
]
});
}

/**
 * The skin card: presets and a live preview on top, then one row per setting,
 * with a fit check and config tools in the footer.
 * @param props - composed Settings slot props.
 */

/**
 * Composer extras: the glass card is pure CSS (see the composer effects block);
 * this adds the two behaviours — a caret that slides instead of jumping, and a
 * send-flight that shrinks the composer card into the bubble that just landed.
 * Everything degrades to the native behaviour when it cannot measure.
 */
function installComposerEffects() {
if (typeof document === "undefined") return { setEnabled: () => {}, dispose: () => {} };
let enabled = false;
let disposed = false;
let layer = null;
let host = null;
let frame = 0;
let observer = null;
let lastCardRect = null;
let lastSignal = 0;
const reduced = () => {
// Either signal counts: the OS setting OR our own in-app toggle. Without the
// dataset check the animated caret layer keeps being painted and the native
// caret stays suppressed, while the CSS reduce block freezes the blink keyframe
// at opacity 0 - typing shows no caret at all.
try {
if (document.body && document.body.dataset.dshWcReduceMotion === "1") return true;
return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
} catch (e) { return false; }
};
const editor = () => document.querySelector("[data-composer-input]");

const hideCaret = () => {
// The blink keyframes outrank an inline opacity, so hiding means display:none.
for (const stale of document.querySelectorAll(".dsh-wc-caret")) stale.style.display = "none";
if (layer) layer.style.display = "none";
const ed = editor();
if (ed) ed.removeAttribute("data-dsh-wc-caret");
};

function ensureLayer(ed) {
const parent = ed.parentElement;
if (!parent) return null;
if (host === parent && layer && layer.parentNode === parent) return layer;
// A composer re-render can move the editor under a fresh parent and leave the old
// layer blinking wherever it stood — exactly one caret layer may exist.
for (const stale of document.querySelectorAll(".dsh-wc-caret")) stale.remove();
// The old parent keeps position:relative from the host attribute and would go on
// capturing absolutely positioned children after the editor moved away.
if (host && host !== parent) { try { host.removeAttribute("data-dsh-wc-caret-host"); } catch (e) {} }
host = parent;
parent.setAttribute("data-dsh-wc-caret-host", "");
layer = document.createElement("div");
layer.className = "dsh-wc-caret";
parent.appendChild(layer);
return layer;
}

function paintCaret() {
if (disposed || !enabled || reduced()) { hideCaret(); return; }
const ed = editor();
const active = document.activeElement;
if (!ed || !active || !ed.contains(active)) { hideCaret(); return; }
const box = ensureLayer(ed);
if (!box) return;
// A collapsed range still reports a rect in Chromium; anything else is a
// selection (no caret to draw) or an editor we do not understand.
const sel = window.getSelection();
if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) { hideCaret(); return; }
const range = sel.getRangeAt(0);
if (!ed.contains(range.startContainer)) { hideCaret(); return; }
let rect = null;
try { rect = range.getBoundingClientRect(); } catch (e) { rect = null; }
// An empty editor collapses to a zero box in some builds; fall back to the text
// origin so the caret still shows (instead of leaving the native one on screen).
if ((!rect || !rect.height || (rect.width === 0 && rect.height === 0)) && !ed.textContent.trim()) {
const cs = window.getComputedStyle(ed);
const edBox = ed.getBoundingClientRect();
rect = {
left: edBox.left + (parseFloat(cs.paddingLeft) || 0),
top: edBox.top + (parseFloat(cs.paddingTop) || 0),
height: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6 || 22
};
}
if (!rect || !rect.height) { hideCaret(); return; }
ed.setAttribute("data-dsh-wc-caret", "");
const hostBox = host.getBoundingClientRect();
box.style.display = "block";
box.style.left = Math.round(rect.left - hostBox.left) + "px";
box.style.top = Math.round(rect.top - hostBox.top) + "px";
box.style.height = Math.round(rect.height) + "px";
}

function queueCaret() {
if (disposed || frame) return;
frame = window.requestAnimationFrame(() => {
frame = 0;
paintCaret();
});
}

function noteSignal() {
const card = document.querySelector("[data-composer-card]");
if (!card) return;
lastCardRect = card.getBoundingClientRect();
lastSignal = Date.now();
}

function flyBubble(node) {
if (!enabled || reduced() || !lastCardRect || !lastSignal) return;
if (Date.now() - lastSignal > 1800) return;
const to = node.getBoundingClientRect();
if (!to.width || !to.height) return;
const from = lastCardRect;
lastSignal = 0;
const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
const sx = Math.min(1.6, Math.max(0.4, from.width / to.width));
const sy = Math.min(1.6, Math.max(0.4, from.height / to.height));
try {
node.animate([
{ transformOrigin: "50% 50%", transform: "translate(" + dx + "px," + dy + "px) scale(" + sx + "," + sy + ")", opacity: 0.3 },
{ transformOrigin: "50% 50%", transform: "none", opacity: 1 }
], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
} catch (e) {}
}

function startObserver() {
if (observer || typeof MutationObserver === "undefined") return;
observer = new MutationObserver((records) => {
if (!enabled || reduced() || !lastSignal) return;
for (const record of records) {
for (const node of record.addedNodes) {
if (!node || node.nodeType !== 1) continue;
const rows = node.matches && node.matches('[data-chat-flow-kind="user"]')
? [node]
: Array.from(node.querySelectorAll ? node.querySelectorAll('[data-chat-flow-kind="user"]') : []);
if (rows.length) {
flyBubble(rows[rows.length - 1]);
return;
}
}
}
});
observer.observe(document.body, { childList: true, subtree: true });
}

const onKeyDown = (event) => {
if (!enabled) return;
const target = event.target;
if (!(target instanceof HTMLElement)) return;
if (!target.closest("[data-composer-input]")) return;
if (event.key === "Enter" && !event.shiftKey && !event.isComposing) noteSignal();
};
const onSelectionChange = () => queueCaret();
const onFocusIn = () => { window.setTimeout(queueCaret, 60); };
const onInput = () => queueCaret();

function bind() {
document.addEventListener("keydown", onKeyDown, true);
document.addEventListener("selectionchange", onSelectionChange);
document.addEventListener("focusin", onFocusIn, true);
document.addEventListener("input", onInput, true);
document.addEventListener("pointerup", onInput, true);
startObserver();
}

function unbind() {
document.removeEventListener("keydown", onKeyDown, true);
document.removeEventListener("selectionchange", onSelectionChange);
document.removeEventListener("focusin", onFocusIn, true);
document.removeEventListener("input", onInput, true);
document.removeEventListener("pointerup", onInput, true);
}

function setEnabled(on) {
enabled = !!on;
document.body.dataset.dshWcComposerFx = enabled ? "1" : "0";
if (!enabled) {
hideCaret();
const ed = editor();
if (ed) ed.removeAttribute("data-dsh-wc-caret");
if (layer) layer.style.opacity = "0";
return;
}
queueCaret();
}

function dispose() {
disposed = true;
unbind();
if (observer) { observer.disconnect(); observer = null; }
if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
layer = null;
if (host) host.removeAttribute("data-dsh-wc-caret-host");
host = null;
const ed = editor();
if (ed) ed.removeAttribute("data-dsh-wc-caret");
if (document.body) delete document.body.dataset.dshWcComposerFx;
}

bind();
return { setEnabled, dispose };
}

function WechatSkinRow({ t, setFontLevel, setTextFontLevel, setDensity, setUserAvatarVisible, setChatWidth, setSidebarBg, setAiAvatarVisible, setLineHeight, setReduceMotion, setFontFamily, setContrast, setAvatarShape, setAvatarStyle, setComposerFx, applyPreset, savePreset, deletePreset, listPresets, exportConfig, importConfig, uploadUserAvatar, uploadAiAvatar, resetSkin, useStore }) {
const fontLevel = useStore((s) => s.fontLevel);
const textFontLevel = useStore((s) => s.textFontLevel);
const density = useStore((s) => s.density);
const userAvatarVisible = useStore((s) => s.userAvatar);
const aiAvatarStore = useStore((s) => s.aiAvatar);
const chatWidth = useStore((s) => s.chatWidth);
const sidebarBg = useStore((s) => s.sidebarBg);
const darkSkin = typeof document !== "undefined" && document.body && document.body.dataset.dshWechatDark === "1";
const userRef = (0, _react.useRef)(null);
const aiRef = (0, _react.useRef)(null);
const importRef = (0, _react.useRef)(null);
const presetPair = (0, _react.useState)(() => { const id = readJson(PRESET_KEY, null); return typeof id === "string" && id ? id : null; });
const statusPair = (0, _react.useState)({ kind: "", detail: "" });
const presetId = presetPair[0];
const [armed, setArmed] = (0, _react.useState)(null);
const armConfirm = (key) => { setArmed(key); window.setTimeout(() => setArmed((current) => (current === key ? null : current)), 4000); };
const setPresetId = presetPair[1];
const status = statusPair[0];
const setStatus = statusPair[1];
const lineHeight = useStore((s) => s.lineHeight);
const reduceMotion = useStore((s) => s.reduceMotion);
const fontFamily = useStore((s) => s.fontFamily) || "system";
const contrast = useStore((s) => s.contrast) || "normal";
const avatarShape = useStore((s) => s.avatarShape) || "rounded";
const avatarStyle = useStore((s) => s.avatarStyle) || "silhouette";
const composerFx = useStore((s) => s.composerFx) === true;
const presetTickPair = (0, _react.useState)(0);
const bumpPresets = presetTickPair[1];
const customPresets = typeof listPresets === "function" ? listPresets() : [];
const searchPair = (0, _react.useState)("");
const searchQuery = searchPair[0];
const setSearchQuery = searchPair[1];
const emptyPair = (0, _react.useState)(false);
const noHit = emptyPair[0];
const setNoHit = emptyPair[1];
const listRef = (0, _react.useRef)(null);
(0, _react.useEffect)(() => {
const root = listRef.current;
if (!root) return;
const q = String(searchQuery || "").trim().toLowerCase();
let visibleCount = 0;
const rows = Array.prototype.slice.call(root.querySelectorAll(".dsh-wc-row"));
rows.forEach((rowEl) => {
const hit = !q || String(rowEl.textContent || "").toLowerCase().indexOf(q) !== -1;
rowEl.style.display = hit ? "" : "none";
if (hit) visibleCount += 1;
});
// 一张分组卡里没有可见行时，整张卡一起隐藏
Array.prototype.slice.call(root.querySelectorAll(".dsh-wc-group")).forEach((card) => {
const hitRow = Array.prototype.slice.call(card.querySelectorAll(".dsh-wc-row")).some((rowEl) => rowEl.style.display !== "none");
card.style.display = hitRow ? "" : "none";
});
setNoHit(Boolean(q) && visibleCount === 0);
}, [searchQuery, customPresets.length]);
const missing = SELECTOR_PROBES.filter((selector) => {
try { return document.querySelector(selector) === null; } catch (error) { return true; }
});
const contextMissing = CONTEXT_PROBES.filter((selector) => {
try { return document.querySelector(selector) === null; } catch (error) { return true; }
});
const onFile = (action) => (event) => {
const file = event.target.files && event.target.files[0];
// Both failure paths used to be swallowed: a broken file or a full localStorage
// looked exactly like a successful upload until the next restart.
if (file) downscaleImage(file).then((dataUrl) => {
const stored = action(dataUrl);
setStatus(stored === false ? { kind: "err", detail: t("avatarStoreFailed") } : { kind: "ok", detail: t("avatarSaved") });
}).catch(() => setStatus({ kind: "err", detail: t("avatarBadImage") }));
event.target.value = "";
};
const runExport = () => {
if (!exportConfig) return;
exportConfig().then((payload) => {
const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const anchor = document.createElement("a");
anchor.href = url;
anchor.download = "sone-wx-config.json";
document.body.appendChild(anchor);
anchor.click();
anchor.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
setStatus({ kind: "ok", detail: t("exported") });
}).catch((error) => setStatus({ kind: "err", detail: String((error && error.message) || error) }));
};
const runImport = (event) => {
const file = event.target.files && event.target.files[0];
event.target.value = "";
if (!file || !importConfig) return;
const reader = new FileReader();
reader.onload = () => {
let payload = null;
try { payload = JSON.parse(String(reader.result || "{}")); } catch (error) {
setStatus({ kind: "err", detail: t("importBad") });
return;
}
importConfig(payload).then(() => {
const importedPreset = readJson(PRESET_KEY, null);
setPresetId(typeof importedPreset === "string" && importedPreset ? importedPreset : null);
bumpPresets((n) => n + 1);
setStatus({ kind: "ok", detail: t("imported") });
}).catch(() => setStatus({ kind: "err", detail: t("importBad") }));
};
reader.readAsText(file);
};
const fontOptions = [1, 2, 3, 4, 5].map((level) => ({ value: level, label: t("fontL" + level) }));
const densityOptions = [
{ value: "cozy", label: t("densityCozy") },
{ value: "compact", label: t("densityCompact") }
];
const widthOptions = [
{ value: "wide", label: t("widthWide") },
{ value: "medium", label: t("widthMedium") },
{ value: "native", label: t("widthNative") }
];
const aiAvatarOptions = [
{ value: true, label: t("aiAvatarOn") },
{ value: false, label: t("aiAvatarOff") }
];
const userAvatarOptions = [
{ value: true, label: t("userAvatarOn") },
{ value: false, label: t("userAvatarOff") }
];
const lineHeightOptions = [
{ value: "compact", label: t("lineHeightCompact") },
{ value: "normal", label: t("lineHeightNormal") },
{ value: "relaxed", label: t("lineHeightRelaxed") }
];
const composerFxOptions = [
{ value: false, label: t("fxOff") },
{ value: true, label: t("fxOn") }
];
const motionOptions = [
{ value: false, label: t("motionFull") },
{ value: true, label: t("motionReduced") }
];
const fontFamilyOptions = [
{ value: "system", label: t("fontFamilySystem") },
{ value: "wechat", label: t("fontFamilyWechat") },
{ value: "wenkai", label: t("fontFamilyWenkai") },
{ value: "kai", label: t("fontFamilyKai") },
{ value: "round", label: t("fontFamilyRound") }
];
const contrastOptions = [
{ value: "normal", label: t("contrastNormal") },
{ value: "high", label: t("contrastHigh") }
];
const avatarShapeOptions = [
{ value: "rounded", label: t("avatarShapeRounded") },
{ value: "circle", label: t("avatarShapeCircle") },
{ value: "square", label: t("avatarShapeSquare") }
];
const avatarStyleOptions = [
{ value: "silhouette", label: t("avatarStyleSilhouette") },
{ value: "initial", label: t("avatarStyleInitial") }
];
const presetOptions = THEME_PRESETS.map((preset) => ({ value: preset.id, label: t("preset_" + preset.id) })).concat(customPresets.map((preset) => ({ value: preset.id, label: preset.name })));
return (0, react_jsx_runtime.jsxs)("div", {
ref: listRef,
style: styles.card,
children: [
(0, react_jsx_runtime.jsxs)("div", {
className: "dsh-wc-search",
children: [
(0, react_jsx_runtime.jsx)("input", {
type: "search",
className: "dsh-wc-search-input",
placeholder: t("searchSettings"),
"aria-label": t("searchSettings"),
value: searchQuery,
onChange: (event) => setSearchQuery(event.target.value)
}),
searchQuery ? (0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: () => setSearchQuery(""),
children: t("searchClear")
}) : null
]
}),
noHit ? (0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-empty", children: t("noMatch") }) : null,
(0, react_jsx_runtime.jsxs)("div", { className: "dsh-wc-group", children: [
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("presetTitle"),
first: true,
hint: t("presetHint"),
children: (0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
children: [
(0, react_jsx_runtime.jsx)(Segmented, {
value: presetId,
options: presetOptions,
onChange: (id) => {
setPresetId(id);
if (applyPreset) applyPreset(id);
}
}),
(0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: () => {
if (!savePreset) return;
const saved = savePreset(t("presetMine") + " " + (customPresets.length + 1));
if (saved) { setPresetId(saved.id); bumpPresets((n) => n + 1); }
},
children: t("presetSave")
}),
typeof presetId === "string" && presetId.indexOf("custom-") === 0 && deletePreset
? (0, react_jsx_runtime.jsx)("button", {
type: "button",
className: armed === "preset:" + presetId ? "dsh-wc-btn dsh-wc-btn-danger dsh-wc-btn-sm" : "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: () => {
if (armed === "preset:" + presetId) { setArmed(null); deletePreset(presetId); setPresetId(null); bumpPresets((n) => n + 1); }
else armConfirm("preset:" + presetId);
},
children: armed === "preset:" + presetId ? t("confirmAgain") : t("presetDelete")
})
: null
]
})
}),
(0, react_jsx_runtime.jsx)("div", {
style: styles.previewBlock,
children: (0, react_jsx_runtime.jsx)(SkinPreview, { t, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, darkSkin, lineHeight, aiAvatarVisible: aiAvatarStore, fontFamily, contrast, avatarShape })
}),
] }),
(0, react_jsx_runtime.jsxs)(Group, { title: t("groupAppearance"), children: [
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("fontTitle"),
hint: t("fontHint"),
onReset: () => setFontLevel(3), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: fontLevel, options: fontOptions, onChange: setFontLevel })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("textFontTitle"),
hint: t("textFontHint"),
onReset: () => setTextFontLevel(3), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: textFontLevel, options: fontOptions, onChange: setTextFontLevel })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("fontFamilyTitle"),
onReset: () => { if (setFontFamily) setFontFamily("system"); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: fontFamily, options: fontFamilyOptions, onChange: (value) => { if (setFontFamily) setFontFamily(value); } })
}),
] }),
(0, react_jsx_runtime.jsxs)(Group, { title: t("groupMessage"), children: [
(0, react_jsx_runtime.jsxs)(SkinRow, {
title: t("avatarTitle"),
children: [
(0, react_jsx_runtime.jsx)("input", { ref: userRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onFile(uploadUserAvatar) }),
(0, react_jsx_runtime.jsx)("input", { ref: aiRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: onFile(uploadAiAvatar) }),
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
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("aiAvatarTitle"),
hint: t("aiAvatarHint"),
onReset: () => setAiAvatarVisible(true), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: aiAvatarStore, options: aiAvatarOptions, onChange: setAiAvatarVisible })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("userAvatarTitle"),
hint: t("userAvatarHint"),
onReset: () => setUserAvatarVisible(true), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: userAvatarVisible, options: userAvatarOptions, onChange: setUserAvatarVisible })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("avatarShapeTitle"),
onReset: () => { if (setAvatarShape) setAvatarShape("rounded"); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: avatarShape, options: avatarShapeOptions, onChange: (value) => { if (setAvatarShape) setAvatarShape(value); } })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("avatarStyleTitle"),
hint: t("avatarStyleHint"),
onReset: () => { if (setAvatarStyle) setAvatarStyle("silhouette"); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: avatarStyle, options: avatarStyleOptions, onChange: (value) => { if (setAvatarStyle) setAvatarStyle(value); } })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("densityTitle"),
onReset: () => setDensity("cozy"), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: density, options: densityOptions, onChange: setDensity })
}),
] }),
(0, react_jsx_runtime.jsxs)(Group, { title: t("groupLayout"), children: [
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("widthTitle"),
onReset: () => setChatWidth("wide"), resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: chatWidth, options: widthOptions, onChange: setChatWidth })
}),
(0, react_jsx_runtime.jsxs)(SkinRow, {
title: t("sidebarBgTitle"),
onReset: () => setSidebarBg(null), resetLabel: t("rowReset"),
children: [
SIDEBAR_SWATCHES.map((swatch) => (0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-swatch",
"aria-label": swatch,
"aria-pressed": (sidebarBg || null) === swatch,
style: { background: swatch },
onClick: () => setSidebarBg(swatch)
}, swatch)),
(0, react_jsx_runtime.jsx)("input", {
type: "color",
className: "dsh-wc-color",
value: sidebarBg || (darkSkin ? "#1a1a1b" : "#eeeef0"),
"aria-label": t("sidebarBgTitle"),
onChange: (event) => setSidebarBg(event.target.value)
})
]
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("lineHeightTitle"),
hint: t("lineHeightHint"),
onReset: () => { if (setLineHeight) setLineHeight("normal"); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: lineHeight, options: lineHeightOptions, onChange: (value) => { if (setLineHeight) setLineHeight(value); } })
}),
] }),
(0, react_jsx_runtime.jsxs)(Group, { title: t("groupAssist"), children: [
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("motionTitle"),
hint: t("motionHint"),
onReset: () => { if (setReduceMotion) setReduceMotion(false); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: reduceMotion, options: motionOptions, onChange: (value) => { if (setReduceMotion) setReduceMotion(value); } })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("contrastTitle"),
hint: t("contrastHint"),
onReset: () => { if (setContrast) setContrast("normal"); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: contrast, options: contrastOptions, onChange: (value) => { if (setContrast) setContrast(value); } })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("composerFxTitle"),
hint: t("composerFxHint"),
onReset: () => { if (setComposerFx) setComposerFx(false); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: composerFx, options: composerFxOptions, onChange: (value) => { if (setComposerFx) setComposerFx(value); } })
}),
] }),
(0, react_jsx_runtime.jsxs)("div", {
style: styles.cardFoot,
children: [
(0, react_jsx_runtime.jsxs)("div", {
style: styles.footLeft,
children: status.kind
? (0, react_jsx_runtime.jsx)("span", { style: { color: status.kind === "err" ? "var(--dsw-alias-state-error-primary)" : "var(--dsw-alias-state-success-primary)" }, children: status.detail })
: [
(0, react_jsx_runtime.jsx)("span", { style: missing.length ? styles.dotWarn : Object.assign({}, styles.dot, contextMissing.length ? { opacity: 0.5 } : null), title: contextMissing.length ? t("fitContextPending") + "：" + contextMissing.join(", ") : "" }),
(0, react_jsx_runtime.jsx)("span", { children: missing.length ? t("fitMissing") + " (" + missing.length + ")" : (contextMissing.length ? t("fitContextPending") : t("fitOk")) }),
(0, react_jsx_runtime.jsx)("span", { style: styles.versionTag, title: "SONE theme", children: "v" + SKIN_VERSION })
]
}),
(0, react_jsx_runtime.jsxs)("div", {
style: styles.footRight,
children: [
(0, react_jsx_runtime.jsxs)("div", {
style: styles.footActions,
children: [
(0, react_jsx_runtime.jsx)("input", { ref: importRef, type: "file", accept: "application/json,.json", style: { display: "none" }, onChange: runImport }),
(0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: runExport,
children: t("exportConfig")
}),
(0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: () => importRef.current && importRef.current.click(),
children: t("importConfig")
})
]
}),
(0, react_jsx_runtime.jsxs)("div", {
style: styles.dangerRow,
children: [
(0, react_jsx_runtime.jsx)("span", { style: styles.footHint, children: t("resetHint") }),
(0, react_jsx_runtime.jsx)("button", {
type: "button",
className: armed === "reset" ? "dsh-wc-btn dsh-wc-btn-danger dsh-wc-btn-sm" : "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: () => { if (armed === "reset") { setArmed(null); if (resetSkin) resetSkin(); } else armConfirm("reset"); },
children: armed === "reset" ? t("confirmAgain") : t("reset")
})
]
})
]
})
]
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
/** 上一次打印的探针状态，避免每个 DOM 变更都写一行控制台。 */
let lastSelectorLog = null;
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
// 只在缺失集合变化或首次匹配时打印：这个方法挂在每次 DOM 变更上，逐次 log 会刷屏。
const _swMissing = SELECTOR_PROBES.filter((sel) => { try { return !document.querySelector(sel); } catch (e) { return true; } });
const _swLog = _swMissing.length ? "missing: " + _swMissing.join(", ") : "OK";
if (_swLog !== lastSelectorLog) { lastSelectorLog = _swLog; console.info("[sone-wx] selectors", _swLog); }
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

			// older builds stored a manual composer height; drop it so the box follows content again
try { window.localStorage.removeItem("dsh-wechat-skin:composer-height"); } catch (e) {}
sidebarBg = normalizeHexColor(readJson(SIDEBAR_BG_KEY, null));
			applySidebarBg();
			sidebarOrder = normalizePanelOrder(readJson(SIDEBAR_ORDER_KEY, []));
			applyPanelOrder();
			ensureUiStyleTag();
			applyState();
			scheduleScan();



			// Settings row bookkeeping.
			let fontLevel = Number(readJson(FONT_LEVEL_KEY, 3));
			if (!(fontLevel >= 1 && fontLevel <= 5)) fontLevel = 3;
			applyFontLevel(fontLevel);
let textFontLevel = Number(readJson(TEXT_FONT_LEVEL_KEY, 3));
if (!(textFontLevel >= 1 && textFontLevel <= 5)) textFontLevel = 3;
applyTextFontLevel(textFontLevel);
			let density = readJson(DENSITY_KEY, "cozy") === "compact" ? "compact" : "cozy";
			applyDensity(density);
			let userAvatarVisible = readJson(USER_AVATAR_ENABLED_KEY, true) !== false;
			applyUserAvatar(userAvatarVisible);
			let aiAvatarVisible = readJson(AI_AVATAR_ENABLED_KEY, true) !== false;
			applyAiAvatar(aiAvatarVisible);
			let composerFxOn = readJson(COMPOSER_FX_KEY, true) !== false;
			const composerEffects = installComposerEffects();
			composerEffects.setEnabled(composerFxOn);
			let chatWidth = readJson(CHAT_WIDTH_KEY, "wide");
			if (chatWidth !== "wide" && chatWidth !== "medium" && chatWidth !== "native") chatWidth = "wide";
			applyChatWidth(chatWidth);
			applyPresetTheme(readJson(PRESET_KEY, null));
			let lineHeight = readJson(LINE_HEIGHT_KEY, "normal");
			if (lineHeight !== "compact" && lineHeight !== "relaxed") lineHeight = "normal";
			applyLineHeight(lineHeight);
			let reduceMotion = readJson(MOTION_KEY, false) === true;
			applyReducedMotion(reduceMotion);
			let fontFamily = readJson(FONT_FAMILY_KEY, "system");
			if (fontFamily === "serif") fontFamily = "wenkai";
			if (FONT_FAMILY_VALUES.indexOf(fontFamily) < 0) fontFamily = "system";
			applyFontFamily(fontFamily);
			let contrast = readJson(CONTRAST_KEY, "normal") === "high" ? "high" : "normal";
			applyContrast(contrast === "high");
			let avatarShape = readJson(AVATAR_SHAPE_KEY, "rounded");
			if (avatarShape !== "circle" && avatarShape !== "square") avatarShape = "rounded";
			applyAvatarShape(avatarShape);
			let avatarArt = readJson(AVATAR_STYLE_KEY, "silhouette") === "initial" ? "initial" : "silhouette";
			applyAvatarStyle(avatarArt);
			const store = createStore(enabled, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, aiAvatarVisible, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarArt, composerFxOn);
			let bound = null;
			let revision = 0;
			const sync = () => {
				bound?.sync(enabled, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, aiAvatarVisible, ++revision, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarArt, composerFxOn);
			};
			initPanelDrag();
			scanHooks.push(applyPanelOrder);
scanHooks.push(composerScrollScan);
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
					setTextFontLevel: (level) => {
						textFontLevel = (level >= 1 && level <= 5) ? level : 3;
						writeJson(TEXT_FONT_LEVEL_KEY, textFontLevel);
						applyTextFontLevel(textFontLevel);
						sync();
					},
					setDensity: (value) => {
						density = value === "compact" ? "compact" : "cozy";
						writeJson(DENSITY_KEY, density);
						applyDensity(density);
						sync();
					},
					setUserAvatarVisible: (on) => {
					  userAvatarVisible = !!on;
					  writeJson(USER_AVATAR_ENABLED_KEY, userAvatarVisible);
					  applyUserAvatar(userAvatarVisible);
					  sync();
					},
					setAiAvatarVisible: (on) => {
					  aiAvatarVisible = !!on;
					  writeJson(AI_AVATAR_ENABLED_KEY, aiAvatarVisible);
					  applyAiAvatar(aiAvatarVisible);
					  sync();
					},
					setChatWidth: (value) => {
					  chatWidth = (value === "wide" || value === "medium" || value === "native") ? value : "wide";
					  writeJson(CHAT_WIDTH_KEY, chatWidth);
					  applyChatWidth(chatWidth);
					  sync();
					},
					setSidebarBg: (value) => {
					  sidebarBg = normalizeHexColor(value);
					  try {
					    if (sidebarBg === null) window.localStorage.removeItem(SIDEBAR_BG_KEY);
					    else window.localStorage.setItem(SIDEBAR_BG_KEY, JSON.stringify(sidebarBg));
					  } catch (e) {}
					  applySidebarBg();
					  sync();
					},
					applyPreset: (id) => {
						const preset = THEME_PRESETS.find((item) => item.id === id) || readCustomPresets().find((item) => item.id === id);
						if (!preset) return;
						fontLevel = preset.fontLevel;
						writeJson(FONT_LEVEL_KEY, fontLevel);
						applyFontLevel(fontLevel);
						textFontLevel = preset.textFontLevel !== undefined ? preset.textFontLevel : (preset.fontLevel || 3);
						writeJson(TEXT_FONT_LEVEL_KEY, textFontLevel);
						applyTextFontLevel(textFontLevel);
						density = preset.density;
						writeJson(DENSITY_KEY, density);
						applyDensity(density);
						chatWidth = preset.chatWidth;
						writeJson(CHAT_WIDTH_KEY, chatWidth);
						applyChatWidth(chatWidth);
						sidebarBg = normalizeHexColor(preset.sidebarBg);
						try {
							if (sidebarBg === null) window.localStorage.removeItem(SIDEBAR_BG_KEY);
							else window.localStorage.setItem(SIDEBAR_BG_KEY, JSON.stringify(sidebarBg));
						} catch (e) {}

						const presetId = preset.id;
						try {
							if (presetId === null) window.localStorage.removeItem(PRESET_KEY);
							else window.localStorage.setItem(PRESET_KEY, JSON.stringify(presetId));
						} catch (e) {}
						applyPresetTheme(presetId);
						applySidebarBg();
						sync();
					},
					exportConfig: () => {
						const skin = {};
						try {
							for (const key of CONFIG_SKIN_KEYS) {
								const value = window.localStorage.getItem(key);
								if (value !== null) skin[key] = value;
							}
						} catch (e) {}
						const payload = { app: "sone-wx", version: 1, exportedAt: new Date().toISOString(), skin, brand: null, images: {} };
						const toDataUrl = (blob) => new Promise((resolve) => {
							const reader = new FileReader();
							reader.onload = () => resolve(String(reader.result || ""));
							reader.onerror = () => resolve("");
							reader.readAsDataURL(blob);
						});
						return fetch("/sone-wx/brand").then((response) => response.json()).then((brand) => {
							payload.brand = {
								title: brand && typeof brand.title === "string" ? brand.title : "",
								wordmarkImage: !!(brand && brand.wordmarkImage),
								heroMark: !brand || brand.heroMark !== false
							};
							const present = { mark: !!(brand && brand.mark), wordmark: !!(brand && brand.wordmark) };
							return Promise.all(["mark", "wordmark"].filter((kind) => present[kind]).map((kind) =>
								fetch("/sone-wx/brand/" + kind).then((response) => response.blob()).then(toDataUrl).then((dataUrl) => { payload.images[kind] = dataUrl; }).catch(() => {})
							));
						}).catch(() => {}).then(() => payload);
					},
					importConfig: (payload) => {
						if (!payload || typeof payload !== "object" || payload.app !== "sone-wx" || payload.version !== 1) return Promise.reject(new Error("invalid config"));
						const skin = payload.skin && typeof payload.skin === "object" && !Array.isArray(payload.skin) ? payload.skin : {};
						const importedValue = (key) => {
							try { return Object.prototype.hasOwnProperty.call(skin, key) ? JSON.parse(skin[key]) : undefined; } catch (e) { return undefined; }
						};
						const importedLineHeight = importedValue(LINE_HEIGHT_KEY);
						if (importedLineHeight !== undefined && importedLineHeight !== "compact" && importedLineHeight !== "relaxed" && importedLineHeight !== "normal") return Promise.reject(new Error("invalid config"));
						const importedMotion = importedValue(MOTION_KEY);
						const importedComposerFx = importedValue(COMPOSER_FX_KEY);
						if (importedComposerFx !== undefined && typeof importedComposerFx !== "boolean") return Promise.reject(new Error("invalid config"));
						if (importedMotion !== undefined && typeof importedMotion !== "boolean") return Promise.reject(new Error("invalid config"));
						const importedFontLevel = importedValue(FONT_LEVEL_KEY);
						if (importedFontLevel !== undefined && !(Number(importedFontLevel) >= 1 && Number(importedFontLevel) <= 5)) return Promise.reject(new Error("invalid config"));
						const importedDensity = importedValue(DENSITY_KEY);
						if (importedDensity !== undefined && importedDensity !== "cozy" && importedDensity !== "compact") return Promise.reject(new Error("invalid config"));
						const importedChatWidth = importedValue(CHAT_WIDTH_KEY);
						if (importedChatWidth !== undefined && importedChatWidth !== "wide" && importedChatWidth !== "medium" && importedChatWidth !== "native") return Promise.reject(new Error("invalid config"));
						const importedUserVisible = importedValue(USER_AVATAR_ENABLED_KEY);
						if (importedUserVisible !== undefined && typeof importedUserVisible !== "boolean") return Promise.reject(new Error("invalid config"));
						const importedAiVisible = importedValue(AI_AVATAR_ENABLED_KEY);
						const importedAiVisibleLegacy = importedValue(AI_AVATAR_SHOW_KEY_LEGACY);
						if (importedAiVisible !== undefined && typeof importedAiVisible !== "boolean") return Promise.reject(new Error("invalid config"));
						if (importedAiVisibleLegacy !== undefined && typeof importedAiVisibleLegacy !== "boolean") return Promise.reject(new Error("invalid config"));
						const importedSidebarBg = importedValue(SIDEBAR_BG_KEY);
						if (importedSidebarBg !== undefined && importedSidebarBg !== null && !/^#[0-9a-fA-F]{6}$/.test(String(importedSidebarBg))) return Promise.reject(new Error("invalid config"));
						const importedPreset = importedValue(PRESET_KEY);
						if (importedPreset !== undefined && importedPreset !== null && typeof importedPreset !== "string") return Promise.reject(new Error("invalid config"));
						const importedUserAvatar = importedValue(USER_AVATAR_KEY);
						if (importedUserAvatar !== undefined && importedUserAvatar !== null && (typeof importedUserAvatar !== "string" || importedUserAvatar.length > 200000)) return Promise.reject(new Error("invalid config"));
						const importedAiAvatar = importedValue(AI_AVATAR_KEY);
						if (importedAiAvatar !== undefined && importedAiAvatar !== null && (typeof importedAiAvatar !== "string" || importedAiAvatar.length > 200000)) return Promise.reject(new Error("invalid config"));
						const importedPresets = importedValue(CUSTOM_PRESETS_KEY);
						if (importedPresets !== undefined) {
							if (!Array.isArray(importedPresets) || importedPresets.length > 6) return Promise.reject(new Error("invalid config"));
							for (const p of importedPresets) {
								if (!p || typeof p.id !== "string" || typeof p.name !== "string") return Promise.reject(new Error("invalid config"));
								if (!(Number(p.fontLevel) >= 1 && Number(p.fontLevel) <= 5)) return Promise.reject(new Error("invalid config"));
								if (p.density !== "cozy" && p.density !== "compact") return Promise.reject(new Error("invalid config"));
								if (p.chatWidth !== "wide" && p.chatWidth !== "medium" && p.chatWidth !== "native") return Promise.reject(new Error("invalid config"));
								if (p.tail !== undefined && typeof p.tail !== "boolean") return Promise.reject(new Error("invalid config"));
								if (p.sidebarBg !== null && p.sidebarBg !== undefined && !/^#[0-9a-fA-F]{6}$/.test(String(p.sidebarBg))) return Promise.reject(new Error("invalid config"));
							}
						}
						const importedOrder = importedValue(SIDEBAR_ORDER_KEY);
						if (importedOrder !== undefined && (!Array.isArray(importedOrder) || importedOrder.some((x) => typeof x !== "string"))) return Promise.reject(new Error("invalid config"));
						// legacy enabled key migration
						if (importedAiVisible === undefined && importedAiVisibleLegacy !== undefined) {
							skin[AI_AVATAR_ENABLED_KEY] = JSON.stringify(importedAiVisibleLegacy);
						}
						try {
							let sawSkinKey = false;
							for (const key of CONFIG_SKIN_KEYS) {
								if (!Object.prototype.hasOwnProperty.call(skin, key)) continue;
								sawSkinKey = true;
								if (typeof skin[key] === "string") window.localStorage.setItem(key, skin[key]);
							}
							if (!sawSkinKey) return Promise.reject(new Error("invalid config"));
						} catch (e) { return Promise.reject(new Error("invalid config")); }
						fontLevel = Number(readJson(FONT_LEVEL_KEY, 3));
						if (!(fontLevel >= 1 && fontLevel <= 5)) fontLevel = 3;
						applyFontLevel(fontLevel);
						textFontLevel = Number(readJson(TEXT_FONT_LEVEL_KEY, 3));
						if (!(textFontLevel >= 1 && textFontLevel <= 5)) textFontLevel = 3;
						applyTextFontLevel(textFontLevel);
						density = readJson(DENSITY_KEY, "cozy") === "compact" ? "compact" : "cozy";
						applyDensity(density);
						userAvatarVisible = readJson(USER_AVATAR_ENABLED_KEY, true) !== false;
						applyUserAvatar(userAvatarVisible);
						chatWidth = readJson(CHAT_WIDTH_KEY, "wide");
						if (chatWidth !== "wide" && chatWidth !== "medium" && chatWidth !== "native") chatWidth = "wide";
						applyChatWidth(chatWidth);
						sidebarBg = normalizeHexColor(readJson(SIDEBAR_BG_KEY, null));
						applySidebarBg();
						aiAvatarVisible = readJson(AI_AVATAR_ENABLED_KEY, true) !== false;
						applyAiAvatar(aiAvatarVisible);
						let importedPresetId = readJson(PRESET_KEY, null);
						if (typeof importedPresetId === "string" && importedPresetId.indexOf("custom-") === 0
							&& !readCustomPresets().some((item) => item.id === importedPresetId)) {
							importedPresetId = null;
							try { window.localStorage.removeItem(PRESET_KEY); } catch (e) {}
						}
						applyPresetTheme(importedPresetId);
						lineHeight = readJson(LINE_HEIGHT_KEY, "normal");
						if (lineHeight !== "compact" && lineHeight !== "relaxed") lineHeight = "normal";
						applyLineHeight(lineHeight);
						reduceMotion = readJson(MOTION_KEY, false) === true;
						applyReducedMotion(reduceMotion);
						fontFamily = readJson(FONT_FAMILY_KEY, "system");
						if (fontFamily === "serif") fontFamily = "wenkai";
						if (FONT_FAMILY_VALUES.indexOf(fontFamily) < 0) fontFamily = "system";
						applyFontFamily(fontFamily);
						contrast = readJson(CONTRAST_KEY, "normal") === "high" ? "high" : "normal";
						applyContrast(contrast === "high");
						avatarShape = readJson(AVATAR_SHAPE_KEY, "rounded");
						if (avatarShape !== "circle" && avatarShape !== "square") avatarShape = "rounded";
						applyAvatarShape(avatarShape);
						avatarArt = readJson(AVATAR_STYLE_KEY, "silhouette") === "initial" ? "initial" : "silhouette";
						applyAvatarStyle(avatarArt);
						composerFxOn = readJson(COMPOSER_FX_KEY, true) !== false;
						composerEffects.setEnabled(composerFxOn);
						const userAvatar = readJson(USER_AVATAR_KEY, null);
						if (typeof userAvatar === "string" && userAvatar) setUserAvatar(userAvatar);
						const aiAvatar = readJson(AI_AVATAR_KEY, null);
						if (typeof aiAvatar === "string" && aiAvatar) setAiAvatar(aiAvatar);
						sidebarOrder = normalizePanelOrder(readJson(SIDEBAR_ORDER_KEY, []));
						applyPanelOrder();
						// Rewrite the keys that were present in the payload with the values that
						// were actually applied, so a hand-edited import cannot leave out-of-range
						// values behind. Absent keys stay absent (they keep the current setting).
						const canonical = [
							[FONT_LEVEL_KEY, fontLevel], [TEXT_FONT_LEVEL_KEY, textFontLevel],
							[DENSITY_KEY, density], [CHAT_WIDTH_KEY, chatWidth],
							[USER_AVATAR_ENABLED_KEY, userAvatarVisible], [AI_AVATAR_ENABLED_KEY, aiAvatarVisible],
							[LINE_HEIGHT_KEY, lineHeight], [MOTION_KEY, reduceMotion],
							[FONT_FAMILY_KEY, fontFamily], [CONTRAST_KEY, contrast],
							[AVATAR_SHAPE_KEY, avatarShape], [AVATAR_STYLE_KEY, avatarArt],
							[COMPOSER_FX_KEY, composerFxOn]
						];
						canonical.forEach(([key, value]) => {
							if (Object.prototype.hasOwnProperty.call(skin, key)) writeJson(key, value);
						});
						try {
							if (Object.prototype.hasOwnProperty.call(skin, SIDEBAR_BG_KEY)) {
								if (sidebarBg === null) window.localStorage.removeItem(SIDEBAR_BG_KEY);
								else writeJson(SIDEBAR_BG_KEY, sidebarBg);
							}
							if (Object.prototype.hasOwnProperty.call(skin, PRESET_KEY)) {
								if (importedPresetId === null) window.localStorage.removeItem(PRESET_KEY);
								else writeJson(PRESET_KEY, importedPresetId);
							}
						} catch (e) {}
						sync();
						const brand = payload.brand && typeof payload.brand === "object" ? payload.brand : null;
						const images = payload.images && typeof payload.images === "object" ? payload.images : {};
						const jobs = [];
						["mark", "wordmark"].forEach((kind) => {
							const dataUrl = images[kind];
							if (typeof dataUrl !== "string" || dataUrl.indexOf("data:") !== 0) return;
							const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
							const comma = dataUrl.indexOf(",");

							let binary = "";
							try { binary = atob(dataUrl.slice(comma + 1)); } catch (e) { return; }
							const bytes = new Uint8Array(binary.length);
							for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
							jobs.push(fetch("/sone-wx/brand/" + kind, { method: "PUT", headers: { "content-type": mime }, body: new Blob([bytes], { type: mime }) }).catch(() => {}));
						});
						if (brand) {
							jobs.push(fetch("/sone-wx/brand", {
								method: "POST",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({
									title: typeof brand.title === "string" ? brand.title : "",
									wordmarkImage: brand.wordmarkImage === true,
									heroMark: brand.heroMark !== false
								})
							}).catch(() => {}));
						}
						return Promise.all(jobs).then(() => {
							try { window.dispatchEvent(new CustomEvent("sone-wx:brand-reload")); } catch (e) {}
						});
					},
					uploadUserAvatar: (dataUrl) => setUserAvatar(dataUrl),
					uploadAiAvatar: (dataUrl) => setAiAvatar(dataUrl),
					setLineHeight: (value) => {
					lineHeight = value === "compact" || value === "relaxed" ? value : "normal";
					writeJson(LINE_HEIGHT_KEY, lineHeight);
					applyLineHeight(lineHeight);
					sync();
					},
					setReduceMotion: (on) => {
					reduceMotion = on === true;
					writeJson(MOTION_KEY, reduceMotion);
					applyReducedMotion(reduceMotion);
					sync();
					},
					setFontFamily: (value) => {
					const asked = value === "serif" ? "wenkai" : value;
					fontFamily = FONT_FAMILY_VALUES.indexOf(asked) >= 0 ? asked : "system";
					writeJson(FONT_FAMILY_KEY, fontFamily);
					applyFontFamily(fontFamily);
					sync();
					},
					setContrast: (value) => {
					contrast = value === "high" ? "high" : "normal";
					writeJson(CONTRAST_KEY, contrast);
					applyContrast(contrast === "high");
					sync();
					},
					setAvatarShape: (value) => {
					avatarShape = value === "circle" || value === "square" ? value : "rounded";
					writeJson(AVATAR_SHAPE_KEY, avatarShape);
					applyAvatarShape(avatarShape);
					sync();
					},
					setComposerFx: (on) => {
					  composerFxOn = !!on;
					  writeJson(COMPOSER_FX_KEY, composerFxOn);
					  composerEffects.setEnabled(composerFxOn);
					  sync();
					},
					setAvatarStyle: (value) => {
					avatarArt = value === "initial" ? "initial" : "silhouette";
					writeJson(AVATAR_STYLE_KEY, avatarArt);
					applyAvatarStyle(avatarArt);
					sync();
					},
					savePreset: (name) => {
					const preset = { id: "custom-" + Date.now(), name: String(name || "Preset").slice(0, 18), fontLevel, textFontLevel, density, chatWidth, sidebarBg };
					const list = readCustomPresets();
					list.unshift(preset);
					writeJson(CUSTOM_PRESETS_KEY, list.slice(0, 6));
					return preset;
					},
					deletePreset: (id) => {
					writeJson(CUSTOM_PRESETS_KEY, readCustomPresets().filter((item) => item.id !== id));
					// 删掉的正好是当前预设：一并清掉选中记录，避免重启后指向已删除的 id
					if (readJson(PRESET_KEY, null) === id) {
						try { window.localStorage.removeItem(PRESET_KEY); } catch (e) {}
						applyPresetTheme(null);
					}
					},
					listPresets: () => readCustomPresets(),
					resetSkin: () => {
						try {
							window.localStorage.removeItem(USER_AVATAR_KEY);
							window.localStorage.removeItem(AI_AVATAR_KEY);
							window.localStorage.removeItem(FONT_LEVEL_KEY);
							window.localStorage.removeItem(TEXT_FONT_LEVEL_KEY);
							window.localStorage.removeItem(DENSITY_KEY);
							window.localStorage.removeItem(USER_AVATAR_ENABLED_KEY);
							window.localStorage.removeItem(CHAT_WIDTH_KEY);
							window.localStorage.removeItem(SIDEBAR_BG_KEY);
							window.localStorage.removeItem(SIDEBAR_ORDER_KEY);
							window.localStorage.removeItem(AI_AVATAR_ENABLED_KEY);
							window.localStorage.removeItem(PRESET_KEY);
window.localStorage.removeItem(LINE_HEIGHT_KEY);
window.localStorage.removeItem(MOTION_KEY);
window.localStorage.removeItem(FONT_FAMILY_KEY);
window.localStorage.removeItem(CONTRAST_KEY);
window.localStorage.removeItem(AVATAR_SHAPE_KEY);
window.localStorage.removeItem(COMPOSER_FX_KEY);
						} catch (e) {}
						document.documentElement.style.removeProperty("--dsh-user-avatar");
						userAvatarDataUrl = null;
						lastUserAvatarValue = null;
						aiAvatarDataUrl = null;
						lastAssistantAvatarValue = null;
						syncAssistantAvatar();
						document.documentElement.style.removeProperty("--dsh-wechat-font-scale");
				document.documentElement.style.removeProperty("--dsh-wechat-text-scale");
						fontLevel = 3; writeJson(FONT_LEVEL_KEY, fontLevel); applyFontLevel(fontLevel); textFontLevel = 3; writeJson(TEXT_FONT_LEVEL_KEY, textFontLevel); applyTextFontLevel(textFontLevel);
						density = "cozy"; applyDensity(density);
						userAvatarVisible = true; applyUserAvatar(userAvatarVisible);
						chatWidth = "wide"; applyChatWidth(chatWidth);
						aiAvatarVisible = true; applyAiAvatar(aiAvatarVisible);
						sidebarBg = null; applySidebarBg();
						applyPresetTheme(null);
						lineHeight = "normal"; applyLineHeight(lineHeight);
						reduceMotion = false; applyReducedMotion(reduceMotion);
						fontFamily = "system"; applyFontFamily(fontFamily);
						contrast = "normal"; applyContrast(false);
						avatarShape = "rounded"; applyAvatarShape(avatarShape);
						window.localStorage.removeItem(AVATAR_STYLE_KEY);
						avatarArt = "silhouette"; applyAvatarStyle(avatarArt);
						composerFxOn = true; composerEffects.setEnabled(true);
						// Deleting the key is not enough: the in-memory order keeps driving the DOM
						// until the next reload, and saved presets would survive a "restore defaults".
						sidebarOrder = []; applyPanelOrder();
						writeJson(CUSTOM_PRESETS_KEY, []);
						sync();
					}
				};
			};

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh: {
					"title": "微信皮肤",
					"description": "仿微信主题：绿色气泡、微信绿强调色。",
					"avatarTitle": "头像",
"aiAvatarTitle": "AI 头像",
"aiAvatarHint": "关闭后 AI 回复不再留头像位，整段会话区靠左",
"aiAvatarOn": "显示",
"aiAvatarOff": "隐藏",
					"uploadUser": "上传我的头像",
"avatarSaved": "头像已保存",
"avatarBadImage": "这张图片读不出来，换一张试试",
"avatarStoreFailed": "浏览器存储已满，头像本次生效但不会保留",
					"uploadAi": "上传 AI 头像",
					"densityTitle": "列表密度",
					"densityCozy": "标准",
					"densityCompact": "紧凑",
					"widthTitle": "对话宽度",
					"widthWide": "全宽",
					"widthMedium": "适中",
					"widthNative": "官方",
					"sidebarBgTitle": "侧边栏背景色",
					"sidebarBgReset": "微信色",
"lineHeightTitle": "行高",
"lineHeightHint": "正文段落的行间距",
"lineHeightCompact": "紧凑",
"lineHeightNormal": "标准",
"lineHeightRelaxed": "舒展",
"motionTitle": "减少动效",
"groupAppearance": "外观",
"groupMessage": "消息",
"groupLayout": "布局",
"groupAssist": "辅助",
"motionHint": "关闭皮肤的过渡与动画，跟随系统辅助功能设置",
"motionFull": "完整",
"fxOn": "开启",
"fxOff": "关闭",
"composerFxTitle": "输入框效果",
"composerFxHint": "毛玻璃卡片、光标滑动、发送时气泡从输入框落下",
"motionReduced": "减少",
"fontFamilyTitle": "字体",
"fontFamilySystem": "系统默认",
"fontFamilyWechat": "微信体",
"fontFamilyWenkai": "霞鹜文楷",
"fontFamilyKai": "楷体",
"fontFamilyRound": "圆体",
"contrastTitle": "高对比度",
"contrastHint": "加深正文、次要文字与边框，适合强光或外接显示器",
"contrastNormal": "标准",
"contrastHigh": "高对比",
"avatarShapeTitle": "头像形状",
"avatarShapeRounded": "圆角方形",
"avatarShapeCircle": "正圆",
"avatarShapeSquare": "方形",
"avatarStyleTitle": "头像图案",
"avatarStyleHint": "人形剪影按标题哈希取色相与姿态",
"avatarStyleSilhouette": "剪影",
"avatarStyleInitial": "首字",
"presetSave": "存为预设",
"presetDelete": "删除预设",
"presetMine": "我的预设",
					"userAvatarTitle": "我的头像",
					"userAvatarHint": "关闭后不显示你发送的会话头像，气泡贴右",
					"userAvatarOn": "显示",
					"userAvatarOff": "隐藏",
					"searchSettings": "搜索设置",
"searchClear": "清除",
"noMatch": "没有匹配的设置",
"rowReset": "重置这一项",
					"fontTitle": "界面字号",
					"fontHint": "侧栏、设置页与过程行的字号",
					"textFontTitle": "正文字号",
					"textFontHint": "会话区正文、代码块与表格的字号",
					"fontL1": "小",
					"fontL2": "较小",
					"fontL3": "标准",
					"fontL4": "较大",
					"fontL5": "大",
					"reset": "恢复默认",
					"resetHint": "清除全部外观设置，不可撤销",
					"confirmAgain": "再点一次确认",
					"presetTitle": "主题预设",
					"presetHint": "一次套用一组搭配",
					"preset_wechat": "微信",
					"preset_compact": "紧凑",
					"preset_paper": "纸张",
					"me": "我",
					"previewIn": "今天有空吗？帮我看看这份方案",
					"previewOut": "可以，发过来吧",
					"fitOk": "适配正常",
					"fitMissing": "选择器缺失",
					"fitContextPending": "上下文探针未渲染",
					"exportConfig": "导出配置",
					"importConfig": "导入配置",
					"exported": "已导出 sone-wx-config.json",
					"imported": "已导入并应用",
					"importBad": "文件格式不对"
				},
				en: {
					"title": "WeChat Skin",
					"description": "WeChat-style theme: green sent bubbles and WeChat-green accents.",
					"avatarTitle": "Avatars",
"aiAvatarTitle": "AI avatar",
"aiAvatarHint": "When hidden, replies drop the avatar column and align left",
"aiAvatarOn": "Shown",
"aiAvatarOff": "Hidden",
					"uploadUser": "Upload my avatar",
"avatarSaved": "Avatar saved",
"avatarBadImage": "That image could not be read, try another one",
"avatarStoreFailed": "Browser storage is full: the avatar applies now but will not persist",
					"uploadAi": "Upload AI avatar",
					"densityTitle": "List density",
					"densityCozy": "Cozy",
					"densityCompact": "Compact",
					"widthTitle": "Chat width",
					"widthWide": "Full",
					"widthMedium": "Medium",
					"widthNative": "Native",
					"sidebarBgTitle": "Sidebar background",
					"sidebarBgReset": "WeChat colour",
"lineHeightTitle": "Line height",
"lineHeightHint": "Spacing between lines in body text",
"lineHeightCompact": "Tight",
"lineHeightNormal": "Normal",
"lineHeightRelaxed": "Airy",
"motionTitle": "Reduce motion",
"groupAppearance": "Appearance",
"groupMessage": "Messages",
"groupLayout": "Layout",
"groupAssist": "Assist",
"motionHint": "Turn off skin transitions and animations; follows the system setting",
"motionFull": "Full",
"fxOn": "On",
"fxOff": "Off",
"composerFxTitle": "Composer effects",
"composerFxHint": "Glass card, sliding caret, send-flight into the bubble",
"motionReduced": "Reduced",
"fontFamilyTitle": "Typeface",
"fontFamilySystem": "System",
"fontFamilyWechat": "WeChat",
"fontFamilyWenkai": "LXGW WenKai",
"fontFamilyKai": "Kaiti",
"fontFamilyRound": "Rounded",
"contrastTitle": "High contrast",
"contrastHint": "Darker text and borders for bright rooms and external displays",
"contrastNormal": "Normal",
"contrastHigh": "High",
"avatarShapeTitle": "Avatar shape",
"avatarShapeRounded": "Rounded",
"avatarShapeCircle": "Circle",
"avatarShapeSquare": "Square",
"avatarStyleTitle": "Avatar artwork",
"avatarStyleHint": "Silhouette takes its hue and pose from the title hash",
"avatarStyleSilhouette": "Silhouette",
"avatarStyleInitial": "Initial",
"presetSave": "Save preset",
"presetDelete": "Delete preset",
"presetMine": "My preset",
					"userAvatarTitle": "My avatar",
					"userAvatarHint": "When hidden, your sent messages drop the avatar and sit flush right",
					"userAvatarOn": "Shown",
					"userAvatarOff": "Hidden",
					"searchSettings": "Search settings",
"searchClear": "Clear",
"noMatch": "No matching setting",
"rowReset": "Reset this row",
					"fontTitle": "Font size (5 levels)",
					"fontHint": "Sidebar, settings and process rows",
					"textFontTitle": "Text size",
					"textFontHint": "Message text, code blocks and tables in the chat",
					"fontL1": "XS",
					"fontL2": "S",
					"fontL3": "M",
					"fontL4": "L",
					"fontL5": "XL",
					"reset": "Reset",
					"resetHint": "Clears every appearance setting, no undo",
					"confirmAgain": "Click again to confirm",
					"presetTitle": "Presets",
					"presetHint": "Applies a matching set at once",
					"preset_wechat": "WeChat",
					"preset_compact": "Compact",
					"preset_paper": "Paper",
					"me": "Me",
					"previewIn": "Busy today? Can you look at this plan?",
					"previewOut": "Sure, send it over",
					"fitOk": "Selectors OK",
					"fitMissing": "Selectors missing",
"fitContextPending": "Context probes not rendered",
					"exportConfig": "Export",
					"importConfig": "Import",
					"exported": "Exported sone-wx-config.json",
					"imported": "Imported and applied",
					"importBad": "Unreadable file"
				}
			}), "sone-wx: skin dictionaries");


			ctx.effect(() => () => {
				if (disposeTokens) disposeTokens();
				removeStyleTag();
				removeUiStyleTag();
				document.body?.classList.remove(BODY_CLASS); document.body?.classList.remove(MATCH_CLASS);
				if (document.body) { for (const flag of ["dshWechatDark", "dshWechatDensity", "dshWechatWidth", "dshWechatPreset", "dshWechatLineHeight", "dshWechatAiAvatar", "dshWechatUserAvatar", "dshWcReduceMotion", "dshWcFontFamily", "dshWcContrast", "dshWcAvatarShape", "dshWcAvatarStyle", "dshWcComposerFx"]) delete document.body.dataset[flag]; }
				observer?.disconnect();
				document.body?.classList.remove(SIDEBAR_BG_CLASS);
				if (typeof composerEffects !== "undefined") composerEffects.dispose();
				if (panelDragCleanup) { panelDragCleanup(); panelDragCleanup = null; }
				document.body?.classList.remove(PANEL_DRAGGING_CLASS);
				// Both hooks are pushed per apply(); leaving either behind runs it twice
				// after a disable/enable cycle.
				for (const hook of [applyPanelOrder, composerScrollScan]) {
					const at = scanHooks.indexOf(hook);
					if (at >= 0) scanHooks.splice(at, 1);
				}
				unbindComposerFade();
				if (scheduled) { cancelAnimationFrame(scheduled); scheduled = null; }
				for (const entry of panelEntries()) entry.el.style.removeProperty("order");
				if (document.body) delete document.body.dataset.dshWcSidebarInk;
				document.documentElement.style.removeProperty("--dsh-wc-sidebar-color");
				document.documentElement.style.removeProperty("--dsh-wechat-font-scale");
				document.documentElement.style.removeProperty("--dsh-wechat-text-scale");
				document.documentElement.style.removeProperty("--dsh-user-avatar");
				document.documentElement.style.removeProperty("--dsh-assistant-avatar");
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
        loadFailed: '读取失败：{detail}',
        retry: '重新读取',
        notSet: '未设置',
        resetBrand: '恢复默认品牌',
        resetHint: '清空标题与图片，回到内置 SONE 标志',
        resetDone: '已恢复默认品牌',
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
        loadFailed: 'Could not load: {detail}',
        retry: 'Retry',
        notSet: 'Not set',
        resetBrand: 'Reset brand',
        resetHint: 'Clears the title and images back to the built-in SONE mark',
        resetDone: 'Brand reset to default',
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
      loadError: '',
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
        loadError: '',
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
        .catch(function (error) {
          state.loaded = true
          state.loadError = String(error && error.message ? error.message : error)
          syncSeats()
          notify()
          throw error
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
      root: { display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
      head: { padding: '0 2px' },
      card: {
        border: '0.5px solid var(--dsw-alias-border-l2)',
        borderRadius: '12px',
        background: 'var(--dsw-alias-bg-layer-2, rgba(128,128,128,.04))',
        overflow: 'hidden'
      },
      itemFirst: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', minHeight: '44px', padding: '10px 16px', boxSizing: 'border-box',
        flexWrap: 'wrap'
      },
      item: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', minHeight: '44px', padding: '10px 16px', boxSizing: 'border-box',
        borderTop: '0.5px solid var(--dsw-alias-border-l2)', flexWrap: 'wrap'
      },
      itemMain: { display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 160px', minWidth: '0' },
      itemTitle: { fontSize: '13px', lineHeight: '20px', color: 'var(--dsw-alias-label-primary)' },
      itemHint: { fontSize: '12px', lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' },
      itemControl: { display: 'flex', alignItems: 'center', gap: '8px', flex: 'none', minWidth: '0' },
      blockTitle: { fontSize: '13px', fontWeight: 500, lineHeight: '20px', color: 'var(--dsw-alias-label-primary)' },
      blockDesc: {
        margin: '2px 0 12px', fontSize: '12px', lineHeight: '18px',
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
        flex: '0 1 240px', minWidth: '0', height: '32px', padding: '0 10px', boxSizing: 'border-box', maxWidth: '100%',
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
        margin: '0', borderRadius: '999px', border: '0', cursor: 'pointer', padding: '0',
        background: 'var(--dsw-alias-state-idle-primary, rgba(128,128,128,.3))',
        transition: 'background 250ms ease-out'
      },
      switchDisabled: { opacity: 0.45, cursor: 'not-allowed' },
      switchOn: { background: 'var(--dsw-alias-state-business-primary, #07c160)' },
      switchKnob: {
        position: 'absolute', top: '2px', left: '2px', width: '16px', height: '16px',
        borderRadius: '999px', background: 'var(--dsw-alias-bg-overlay, #fff)',
        boxShadow: '0 1px 2px rgba(0,0,0,.25)',
        transition: 'transform 250ms ease-out'
      },
      reduceMotionSwitch: { transition: 'none' },
      reduceMotionKnob: { transition: 'none' },
      switchKnobOn: { transform: 'translateX(14px)' },
      switchRow: { display: 'flex', alignItems: 'center', gap: '10px' },
      status: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', minWidth: '0', wordBreak: 'break-all' },
      foot: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        padding: '10px 16px 14px', borderTop: '0.5px solid var(--dsw-alias-border-l2)', flexWrap: 'wrap'
      },
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
      var disabled = props.disabled === true
      var reduceMotion = false
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduceMotion = false; }
      }
      var switchStyle = on ? Object.assign({}, S.switch, S.switchOn) : Object.assign({}, S.switch)
      var knobStyle = on ? Object.assign({}, S.switchKnob, S.switchKnobOn) : Object.assign({}, S.switchKnob)
      if (reduceMotion) {
        switchStyle.transition = 'none'
        knobStyle.transition = 'none'
      }
      if (disabled) Object.assign(switchStyle, S.switchDisabled)
      return h('button', {
        type: 'button',
        role: 'switch',
        className: 'dsh-wc-switch',
        'aria-checked': on ? 'true' : 'false',
        'aria-label': props.label,
        disabled: disabled,
        style: switchStyle,
        onClick: function () {
          if (disabled) return
          props.onChange(!on)
        }
      }, h('span', { style: knobStyle }))
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
        var detail = String(error && error.message ? error.message : error)
        if (detail.length > 120) detail = detail.slice(0, 117) + '…'
        setStatus('err', t('failError', { detail: detail }))
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

      function resetBrand() {
        Promise.all([
          removeImage('mark').catch(function () {}),
          removeImage('wordmark').catch(function () {})
        ]).then(function () {
          return post({ title: '', wordmarkImage: false, heroMark: true })
        }).then(function () {
          setStatus('ok', t('resetDone'))
          load()
        }).catch(reportError)
      }

      var markSrc = imageUrl('mark')
      var wordSrc = imageUrl('wordmark')

      var children = []

      if (!snap.loaded) {
        children.push(h('div', { style: S.hint, key: 'loading' }, t('loading')))
      }
      if (snap.loadError) {
        children.push(h('div', { style: S.status, key: 'loadError' },
          h('span', { style: S.err }, t('loadFailed', { detail: String(snap.loadError).slice(0, 120) })),
          h('button', {
            type: 'button', className: 'dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm',
            style: { marginLeft: '8px' },
            onClick: function () { state.loaded = false; state.loadError = ''; notify(); load().catch(function () {}) }
          }, t('retry'))))
      }

      children.push(h('div', { style: S.card, key: 'rows' },
        h('div', { style: S.itemFirst },
          h('div', { style: S.itemMain },
            h('div', { style: S.itemTitle }, t('mark')),
            h('div', { style: S.itemHint }, t('markDesc'))),
          h('div', { style: S.itemControl },
            h('div', { style: S.preview, title: t('preview') },
              markSrc === null
                ? h('span', { style: S.previewEmpty }, t('notSet'))
                : h('img', { src: markSrc, alt: t('preview'), style: S.previewImg, draggable: false })),
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
            }, t('remove')))),
        h('div', { style: S.item },
          h('div', { style: S.itemMain },
            h('div', { style: S.itemTitle }, t('title')),
            h('div', { style: S.itemHint }, t('titleDesc'))),
          h('div', { style: S.itemControl },
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
                if (event.key === 'Enter') { event.preventDefault(); saveTitle() }
                if (event.key === 'Escape') { title[1](snap.title); setStatus('', '') }
              },
              onBlur: function () { if (dirty) saveTitle() }
            }),
            h('button', {
              type: 'button',
              className: 'dsh-wc-btn dsh-wc-btn-primary',
              disabled: !dirty,
              onClick: saveTitle
            }, t('save')))),
        h('div', { style: S.item },
          h('div', { style: S.itemMain },
            h('div', { style: S.itemTitle }, t('wordmark')),
            h('div', { style: S.itemHint }, t('wordmarkDesc'))),
          h('div', { style: S.itemControl },
            h(Switch, {
              checked: snap.wordmarkImage,
              label: t('wordmark'),
              onChange: toggleWordmark,
              disabled: !snap.loaded
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
              : h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 } },
                h('img', {
                  src: wordSrc, alt: t('wordmark'), draggable: false,
                  style: { display: 'block', height: '18px', maxWidth: '140px', objectFit: 'contain' }
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
                }, t('remove'))))),
        h('div', { style: S.item },
          h('div', { style: S.itemMain },
            h('div', { style: S.itemTitle }, t('hero')),
            h('div', { style: S.itemHint }, t('heroDesc'))),
          h('div', { style: S.itemControl },
            h(Switch, {
              checked: snap.heroMark,
              label: t('hero'),
              onChange: toggleHero,
              disabled: !snap.loaded
            }))),
        h('div', { style: S.foot },
          h('span', { style: S.hint }, t('resetHint')),
          h('button', {
            type: 'button',
            className: 'dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm',
            disabled: !snap.loaded,
            onClick: resetBrand
          }, t('resetBrand')))))

      children.push(h('div', { style: S.status, key: 'status' },
        status[0].kind === 'err'
          ? h('span', { style: S.err }, status[0].detail)
          : status[0].kind === 'ok'
            ? h('span', { style: S.ok }, status[0].detail)
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

          var onBrandReload = function () { load() }
          window.addEventListener('sone-wx:brand-reload', onBrandReload)

          var offLocale = null
          var locale = typeof ctx.get === 'function' ? ctx.get('locale') : null
          if (locale && typeof locale.subscribe === 'function') {
            offLocale = locale.subscribe(notify)
          }

          return function () {
            if (typeof offLocale === 'function') offLocale()
            for (var i = 0; i < offDicts.length; i++) offDicts[i]()
            translateRef = null
            window.removeEventListener('sone-wx:brand-reload', onBrandReload)
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
/** 崩溃详情 POST 到宿主 /sone-wx/diag（~/.dsh/sone-wx/diag.json）：渲染进程 console 不可见时的兜底。 */
function reportDiag(msg) {
	try {
		fetch("/sone-wx/diag", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ t: Date.now(), msg: String(msg).slice(0, 4000) })
		}).catch(() => {});
	} catch (e) { /* noop */ }
}

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
		reportDiag("settings.section render error: " + String((error && error.stack) || error));
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
style: { display: "flex", flexDirection: "column", gap: 16 },
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
if (globalThis.__soneWxDiagHooked) return () => {};
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
const rawError = console.error;
const origError = rawError.bind(console);
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
const onRejection = (event) => {
try {
const reason = event && event.reason;
const text = reason instanceof Error ? (reason.stack || String(reason)) : String(reason);
if (text.includes("slot") || text.includes("settings.section")) post("unhandledrejection: " + text);
} catch {}
};
try { window.addEventListener("unhandledrejection", onRejection); } catch {}
// Disabling the plugin has to hand console.error back and stop posting to a route
// that no longer exists.
return () => {
try { if (console.error !== rawError) console.error = rawError; } catch {}
try { window.removeEventListener("unhandledrejection", onRejection); } catch {}
globalThis.__soneWxDiagHooked = false;
};
}

function apply(ctx) {
let uninstallDiag = () => {};
try { uninstallDiag = installDiagHook() || (() => {}); } catch {}
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
try { uninstallDiag(); } catch {}
};
}, "sone-wx: settings section");
}
//#endregion

exports.apply = apply;
exports.inject = inject;
return module.exports;
}
});