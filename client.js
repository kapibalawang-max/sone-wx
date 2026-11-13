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
		let _reactDom = null;
		try { _reactDom = require("react-dom"); } catch (e) { _reactDom = null; }
		let _runtime_client = require("@deepseek-ai/dsh-client-store");

		//#region dsh-wechat-skin: constants
		/** Settings row locale namespace. */
		const SETTINGS_NS = "sone-wx.skin";
		/** localStorage keys. */
		// Derived state (title hash -> generated avatar index), intentionally NOT in
		// CONFIG_SKIN_KEYS: it is rebuilt from the session list and pruned on demand,
		// so export/reset must not treat it as a user preference.
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
/** Islands 结构层开关（浮岛布局 / 顶栏 / 左侧图标栏 / 置顶聚合 / 模型弹层 / 更新入口）。 */
const ISLANDS_KEY = "dsh-wechat-skin:islands";
/** Open the host right panel automatically on a session's first visit. */
const RIGHTBAR_AUTO_KEY = "dsh-wechat-skin:rightbar-auto";
// Bumped together with package.json (test/version-test.mjs keeps the two in sync).
const SKIN_VERSION = "1.47.6";
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
		const CONFIG_SKIN_KEYS = [FONT_LEVEL_KEY, TEXT_FONT_LEVEL_KEY, DENSITY_KEY, CHAT_WIDTH_KEY, SIDEBAR_BG_KEY, SIDEBAR_ORDER_KEY, USER_AVATAR_KEY, USER_AVATAR_ENABLED_KEY, AI_AVATAR_KEY, AI_AVATAR_ENABLED_KEY, AI_AVATAR_SHOW_KEY_LEGACY, PRESET_KEY, LINE_HEIGHT_KEY, MOTION_KEY, FONT_FAMILY_KEY, CONTRAST_KEY, AVATAR_SHAPE_KEY, AVATAR_STYLE_KEY, COMPOSER_FX_KEY, RIGHTBAR_AUTO_KEY, ISLANDS_KEY, CUSTOM_PRESETS_KEY];
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
  --wc-bubble-bg: #f0f0f3;           /* slate3  WeChat reply surface: the bubble separates by BACKGROUND, not a hairline */
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
  --wc-count-bg: #f9f9fb;            /* slate2 chip on the slate4 sidebar */
  --wc-count-ink: #4a4e56;
  --wc-ink-3: #60646c;               /* slate11 */

  /* ================= selection & structure =================
     Selection is the accent's solid step, so "green" means exactly one thing:
     action or selected. Table headers are STRUCTURE, not brand, so they use a
     neutral surface -- that removes the fourth competing green. */
  --wc-sel-ink: #ffffff;
  --wc-sel-ink-dim: rgba(255, 255, 255, 0.92);
  --wc-th-bg: #e8e8ec;               /* slate4 - stays readable inside the slate3 bubble */
  --wc-code-bg: #e8e8ec;             /* slate4 */
  --wc-caret-ink: #111214;           /* composer caret layer */

  /* ================= semantic hues =================
     One hue per meaning. Amber belongs to warnings only, which is why the chat
     avatar no longer uses a saturated orange next to it. */
  --wc-dot-warning: #d97706;
  --wc-star-ink: #ab6400;            /* amber11: 3.77:1 on the slate4 sidebar */
  --wc-hero-size: clamp(22px, calc(26px * var(--dsh-wechat-font-scale, 1)), 31px);
  --wc-dot-error: #dc2626;
  --wc-danger: #b42318;
  --wc-danger-hover: #991b1b;
  --wc-stop: #e5484d;
  --wc-stop-hover: #d13438;
  --wc-sched-badge: #3b82f6;
  --wc-sched-badge-dark: #7db8ff;   /* same hue lifted for the dark sidebar */
  --wc-sched-ink-on-sel: #1d6fe0;  /* badge ink when the row carries the green selected fill */
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
  /* --dsw-alias-bg-base is the only token here the host does NOT inline via
     ThemePresenter; everything else in this block was always overridden and
     is now supplied solely by TOKEN_OVERRIDES (JS side). */
  --dsw-alias-bg-base: var(--wc-bg) ;
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
  --wc-caret-ink: #f5f5f6;           /* caret stays visible on dark canvas */
  --wc-star-ink: #ffc53d;            /* amber9 reads at 11.15:1 on the dark sidebar */
  --wc-count-bg: #2a2d31;            /* one step above the dark sidebar */
  --wc-count-ink: #c3c8ce;
  /* Despite the legacy name this token means "the hairline for the current
     scheme". Left at its light value it drew #d9d9e0 lines on dark cards
     (images, file cards, quoted text had no dark override of their own). */
  --wc-border-light: var(--wc-border-dark);
  --wc-link: #7ee2a8 ;
  --wc-link-hover: #a6f0c2 ;
  --wc-brand-text: #7ee2a8 ;
  --dsw-alias-bg-base: #111113 ;
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
  --wc-accent-bright: #6b8f45;      /* moss, not the cold wechat green: 3.66:1 on sand1 */
  --wc-star-ink: #8a6100;            /* warm amber, 4.52:1 on the sand4 sidebar */
  --wc-bg: #fdfdfc;                  /* sand1 */
  --wc-bubble-bg: #f1ede2;           /* warm sand bubble on the near-white paper canvas */
  --wc-surface: #f9f9f8;             /* sand2 */
  --wc-count-bg: #fbfaf8;            /* chip: a hair lighter than the sand4 sidebar */
  --wc-count-ink: #4c4c47;
  --wc-sidebar: #e9e8e6;             /* sand4 */
  --wc-border-light: #dad9d6;        /* sand6 */
  --wc-ink-1: #21201c;               /* sand12 */
  --wc-ink-2: #4c4c47;
  --wc-ink-3: #63635e;               /* sand11, 4.93:1 on the sidebar */
  --wc-th-bg: #e5e1d5;               /* sand4 - reads inside the #f1ede2 bubble */
  --wc-code-bg: #e5e1d5;
  --wc-btn-idle-bg: #e9e8e6;
  --wc-bubble: #ded3ba;
  --wc-bubble-ink: #3a3325;
  --wc-bubble-link: #6b4f1d;
  --wc-bubble-code-ink: #3a3325;
  --dsw-alias-bg-base: #fdfdfc;
}


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
/* Right-panel drag handle: the shell overlay layer sits at z-index 20 and covers
   the whole frame, which can swallow hits on the z-11 handle; raise the handle
   above it and widen its hit band centred on the visible divider. */
body.dsh-wechat-skin-on .PIRFFq_handle[data-side="rightbar"] { z-index: 21; width: 12px; margin-left: -6px; }
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
/* Group session count: the stamping code sets data-dsh-wc-count on the title
   span. It must live on the title itself — .JoiKIa_projectText is a column
   flex, so a badge on the container drops onto a second line under the name.
   Chip height equals the title's 18px line box, so vertical-align:top fills
   the line box and centres optically without nudging the baseline. */
body.dsh-wechat-skin-on .JoiKIa_projectRow .JoiKIa_title[data-dsh-wc-count]::after {
  content: attr(data-dsh-wc-count);
  display: inline-block;
  box-sizing: border-box;
  min-width: 18px;
  height: 18px;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--wc-count-bg);
  color: var(--wc-count-ink);
  font-size: var(--wc-fs-sm);
  line-height: 18px;
  font-weight: 500;
  text-align: center;
  font-variant-numeric: tabular-nums;
  vertical-align: top;
}

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
  background: var(--wc-sidebar-dark); color: var(--wc-sched-badge-dark); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
}
body.dsh-wechat-skin-on .JoiKIa_sessionRow.JoiKIa_selected .JoiKIa_slot [data-session-schedule-mark] {
  background: #ffffff; color: var(--wc-sched-ink-on-sel); box-shadow: 0 0 0 1px #ffffff;
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
/* paper keeps its own moss tint instead of a cold green wash on warm sand */
body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"] .JoiKIa_sessionRow:not(.JoiKIa_selected):has(.JoiKIa_pinIndicator) {
  background: color-mix(in srgb, var(--wc-accent-soft) 62%, var(--wc-sidebar));
}
body.dsh-wechat-skin-on[data-dsh-wechat-preset="paper"][data-dsh-wechat-dark="1"] .JoiKIa_sessionRow:not(.JoiKIa_selected):has(.JoiKIa_pinIndicator) {
  background: color-mix(in srgb, var(--wc-accent-soft) 70%, var(--wc-sidebar-dark));
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
/* .XNZzAa_body = the assistant message body. The WeChat model: the reply bubble
   carries its own surface colour (delta L* ~5 below the canvas), so it reads as a
   bubble without any hairline - a border would make it a card. Canvas untouched. */
body.dsh-wechat-skin-on.dsh-wechat-match .XNZzAa_body {
  background: var(--wc-bubble-bg);
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
body.dsh-wechat-skin-on ._markdown_13jw0_5 {
  font-size: var(--wc-body-lg);
  line-height: calc(var(--wc-body-lg) * var(--wc-line-height, 1.6));
}
/* DARK scheme: raised dark bubble (#2a2a2d on the #111214 wallpaper) */
body.dsh-wechat-skin-on.dsh-wechat-match[data-dsh-wechat-dark="1"] .XNZzAa_body {
  background: var(--wc-overlay-dark);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

/* reasoning rows: no background pill — plain text on canvas, keep type scale only */
body.dsh-wechat-skin-on .ijfCxa_summary,
body.dsh-wechat-skin-on .ijfCxa_thinkBody { font-size: var(--wc-body-sm); }

/* ================= composer ================= */
body.dsh-wechat-skin-on .JZLxKW_card {
  /* intentionally pure white in light mode (WeChat composer card), not --wc-surface */
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
  border-color: color-mix(in srgb, var(--wc-green) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wc-green) 12%, transparent), 0 6px 18px rgba(0, 0, 0, 0.06);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_card:focus-within {
  border-color: color-mix(in srgb, var(--wc-green) 60%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--wc-green) 16%, transparent), 0 8px 22px rgba(0, 0, 0, 0.4);
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
  background-color: color-mix(in srgb, var(--wc-green) 18%, transparent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10' fill='none'%3E%3Cpath d='M2.2 3.9L5 6.7L7.8 3.9' stroke='%237EE2A8' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  color: var(--wc-brand-text);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_select:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--wc-green) 28%, transparent);
  color: var(--wc-link-hover);
}
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .JZLxKW_select option {
  background: var(--wc-sidebar-dark);
  color: var(--wc-ink-1);
}
/* send: small green circle with the native arrow icon, no text label */
body.dsh-wechat-skin-on .JZLxKW_primary {
  width: 32px; min-width: 32px; max-width: 32px; height: 32px; padding: 0; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center; transform: none;
  background: var(--wc-btn-idle-bg); color: var(--wc-btn-idle-ink);
  transition: background-color 250ms ease-out, color 250ms ease-out, transform 250ms ease-out;
}
body.dsh-wechat-skin-on .JZLxKW_primary > svg { display: block; width: 16px; height: 16px; }
body.dsh-wechat-skin-on .JZLxKW_primary::after { content: none; }
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
  background: var(--dsw-alias-scrollbar-bg-l2); border-radius: var(--wc-radius-xs);
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
  color: var(--dsw-alias-label-secondary, #666); transition: background-color 250ms ease-out;
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
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] { --wc-md-gap: 12px; }

/* Blocks: one vertical rhythm, no double margins at the edges. */
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_13jw0_5 > :is(p, ul, ol, pre, blockquote, table, .tableScroll) { margin-top: var(--wc-md-gap); margin-bottom: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_13jw0_5 > :first-child { margin-top: 0; }
body.dsh-wechat-skin-on [data-chat-flow-kind="assistant-step"] ._markdown_13jw0_5 > :is(h1, h2, h3, h4) + * { margin-top: 6px; }
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
  border-radius: var(--wc-radius-xs); transition: color 250ms ease-out;
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
body.dsh-wechat-skin-on .Dv5QdW_panel[data-sidebar-right-open] { background: var(--dsw-alias-bg-base, #ffffff); }
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
  color: var(--wc-ink-3); transition: background-color 250ms ease-out, color 250ms ease-out;
}
body.dsh-wechat-skin-on .ZITbJG_action:hover { background: var(--wc-hover); color: var(--dsw-alias-label-primary, #1b1b1c); }
body.dsh-wechat-skin-on .ZITbJG_endInfo { font-size: var(--wc-fs-sm); color: var(--wc-ink-3); }

/* Toast: same top-center pill, tuned to the skin's radius and weight. */
body.dsh-wechat-skin-on ._toast_af3m1_6 {
  top: 24px; padding: 10px 16px; border-radius: var(--wc-radius-md);
  font-size: var(--wc-fs-md); line-height: 1.5; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* Running / streaming group label. */
body.dsh-wechat-skin-on .r52wTW_label { font-size: var(--wc-fs-sm); color: var(--dsw-alias-label-secondary, #666); display: inline-flex; align-items: center; gap: 6px; }
body.dsh-wechat-skin-on .r52wTW_label::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--wc-dot-warning); box-shadow: 0 0 0 2px color-mix(in srgb, var(--wc-dot-warning) 25%, transparent); animation: dsh-wc-pulse 1.2s ease-in-out infinite; }
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
  --wc-count-bg: #2a2620;
  --wc-count-ink: #b9b3a8;
  --wc-border-dark: #3a352d;        /* 7.0 L* above the overlay, so edges read */
  --wc-code-bg: #100e0c;            /* recessed 5.9 L* below the card */
  --wc-th-bg: #242019;
  --wc-btn-idle-bg: #242019;
  --wc-caret-ink: #efece6;           /* warm dark canvas caret */
  --wc-accent-bright: #9dbf6e;      /* moss bright for the warm dark canvas */
  --wc-star-ink: #ffc53d;
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
}


/* 5. 文件/图片消息气泡 */
body.dsh-wechat-skin-on [data-chat-flow-kind] img:not([class*="avatar"]):not([data-slot]) {
  border-radius: var(--wc-radius-card); border: 0.5px solid var(--wc-border-light); max-width: 100%;
}
body.dsh-wechat-skin-on [data-chat-flow-kind] [class*="fileCard"],
body.dsh-wechat-skin-on [data-chat-flow-kind] [class*="attachment"] {
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
   disappears inside the real dock, which stacks its own layers.
   Another plugin may already own the composer glass (dsh-chat-ux marks the body
   with data-chat-ux-composer-glass and blurs the card's own ::before). Painting
   ours on top double-blurs and lays a green wash over its neutral fade band,
   which reads as a green seam above the input. Yield the surface to whoever
   claimed it first; the caret and send flight below are behaviour, not paint,
   so they stay on either way. */
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"]:not([data-chat-ux-composer-glass]) [data-composer-card] {
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
body.dsh-wechat-skin-on[data-dsh-wc-composer-fx="1"]:not([data-chat-ux-composer-glass])[data-dsh-wechat-dark="1"] [data-composer-card] {
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
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-caret { background: var(--wc-caret-ink, #f2f2f3); }
@keyframes dsh-wc-caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  body.dsh-wechat-skin-on .dsh-wc-caret { animation: none; transition: none; }
}
/* 新会话页自定义标语：直接替换 hero 标题文字。值在 body 变量
   --dsh-wc-hero-tagline（JSON 字符串），开关是 body 的 data-dsh-wc-tagline-set。
   官方标题 span 用 display:none 整段移出渲染树与无障碍树——font-size:0 会让读屏
   把官方标题和自定义标语念两遍，且选中复制拿到的仍是官方原文。
   标语改由父级 ::before 承载；未设置时开关不存在，官方标题原样显示。 */
body.dsh-wechat-skin-on[data-dsh-wc-tagline-set="1"] [class*="_titleGroup"] > span:not([class]) {
  display: none !important;
}
body.dsh-wechat-skin-on[data-dsh-wc-tagline-set="1"] [class*="_titleGroup"]::before {
  content: var(--dsh-wc-hero-tagline, none);
  display: flex;
  align-items: center;
  font-size: var(--wc-hero-size);
  line-height: 1.25;
  font-weight: 500;
  color: var(--wc-ink-1, #1c2024);
  white-space: normal;
  overflow-wrap: anywhere;
}
/* 新会话页 hero 区不显示「预览版」徽章 */
body.dsh-wechat-skin-on [class*="_headline"] [class*="_previewBadge"] {
  display: none !important;
}
/* 会话星标：只做行内标记，不重排。
   宿主的拖拽落点按视觉矩形判定、却按数据序写回，任何 CSS 重排都会让拖拽静默错位，
   所以这里不改 .Kjh-qa_groupSection 的 display，也不用 order。 */
body.dsh-wechat-skin-on .JoiKIa_sessionRow { position: relative; }
/* 给星标让出右侧 26px：宿主动作簇（…/归档/置顶）整体左移，避免星标压住「置顶」并吞掉点击。
   静止态 rowActions 是 display:none，这条不占位。 */
body.dsh-wechat-skin-on .JoiKIa_sessionRow .JoiKIa_rowActions { margin-right: 26px; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow[data-dsh-wc-star="1"] .JoiKIa_timestamp { margin-right: 26px; }
body.dsh-wechat-skin-on .dsh-wc-star-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; padding: 0; border: 0; background: transparent; color: var(--wc-ink-3, #60646c); opacity: 0; transition: opacity 250ms ease-out; cursor: pointer; z-index: 3; }
body.dsh-wechat-skin-on .JoiKIa_sessionRow:hover .dsh-wc-star-btn, body.dsh-wechat-skin-on .JoiKIa_sessionRow[data-dsh-wc-star="1"] .dsh-wc-star-btn, body.dsh-wechat-skin-on .dsh-wc-star-btn:focus-visible { opacity: 1; }
body.dsh-wechat-skin-on .dsh-wc-star-btn:focus-visible { outline: 2px solid var(--wc-green, #07c160); outline-offset: -2px; border-radius: var(--wc-radius-xs, 4px); }
/* 浅色侧栏上 amber9 只有 1.29:1，改用 amber12 深琥珀；深色底仍用亮琥珀。 */
body.dsh-wechat-skin-on .JoiKIa_sessionRow[data-dsh-wc-star="1"] .dsh-wc-star-btn { color: var(--wc-star-ink); }
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
color: var(--wc-ink-3); font-size: var(--wc-fs-sm, 12px); line-height: 20px;
opacity: .55; transition: opacity 250ms ease-out, background-color 250ms ease-out;
}
body .dsh-wc-row:hover .dsh-wc-reset, body .dsh-wc-reset:focus-visible { opacity: 1; }
body .dsh-wc-reset:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
body .dsh-wc-empty { padding: 18px 16px; text-align: center; color: var(--wc-ink-3); font-size: var(--wc-fs-sm); }
/* one settings section = one card */
body .dsh-wc-group {
border: 0.5px solid var(--dsw-alias-border-l2, #e6e6e6);
border-radius: var(--wc-radius-card, 12px);
background: var(--dsw-alias-bg-module-platform, #ffffff);
overflow: hidden;
}
body .dsh-wc-group-title {
padding: 14px 16px 2px;
color: var(--wc-ink-2, var(--wc-ink-3));
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
	outline: 2px solid color-mix(in srgb, var(--wc-green, #07c160) 50%, transparent);
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
	background: color-mix(in srgb, var(--wc-green, #07c160) 10%, transparent);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wc-green, #07c160) 35%, transparent);
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
/* share-code modal */
body .dsh-wc-modal-mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; }
body .dsh-wc-modal { width: min(520px, calc(100vw - 48px)); max-height: 80vh; overflow: auto; background: var(--wc-surface, #f9f9fb); border-radius: var(--wc-radius-card, 12px); padding: 20px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18); display: flex; flex-direction: column; gap: 10px; }
body .dsh-wc-modal-title { font-size: var(--wc-fs-md, 13px); font-weight: 600; color: var(--dsw-alias-label-primary, #1c2024); }
body .dsh-wc-modal-desc { font-size: var(--wc-fs-sm, 12px); line-height: 1.55; color: var(--dsw-alias-label-secondary, #61666b); }
body .dsh-wc-modal textarea { width: 100%; box-sizing: border-box; min-height: 88px; resize: vertical; border: 0.5px solid var(--wc-border-light, #d9d9e0); border-radius: var(--wc-radius-btn, 8px); padding: 8px 10px; font: var(--wc-fs-sm, 12px)/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--wc-ink-1, #1c2024); background: var(--wc-code-bg, #e8e8ec); }
/* the dialog is an overlay, so it sits one rung above the canvas in both dark themes */
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-modal { background: var(--wc-surface-dark, #212225); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-modal textarea { border-color: var(--wc-border-dark); color: var(--wc-ink-1); background: var(--wc-code-bg); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-modal-title { color: var(--wc-ink-1); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-modal-desc { color: var(--wc-ink-2); }
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"] .dsh-wc-modal-divider { background: var(--wc-border-dark); }
body .dsh-wc-modal-error { font-size: var(--wc-fs-sm, 12px); line-height: 1.5; color: var(--wc-danger, #b42318); }
body .dsh-wc-modal-divider { height: 0.5px; background: var(--dsw-alias-border-l2, #d9d9e0); }
		`;

/** Sidebar-structure dialect stylesheets: only the one matching the running shell is appended. */
const SKIN_DIALECT_CSS = {};

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

		/** 浮岛结构层复用同一套头像：置顶聚合里的行必须和侧栏行长得一样。 */
		function avatarUrlForKey(key) {
			let index = avatarMap[key];
			if (index === undefined) index = avatarIndexForTitle(key);
			return avatarForIndex(key, index);
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

		/** Apply the right-panel auto-open preference (body flag read by the auto-open watcher). */
		function applyRightbarAuto(on) {
			if (!document.body) return;
			if (on) document.body.dataset.dshWcRightbarAuto = "1";
			else delete document.body.dataset.dshWcRightbarAuto;
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

/** Labels in the order the user currently sees. No internal caller; kept as the
 *  probe surface for test/panel-order-test.mjs. */
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

//#region dsh-wechat-skin: group session counts
/**
 * Exact per-group session counts, derived from the host's own stores the same
 * way the official sidebar derives its rows (subagent/blank/archived hidden,
 * stray sessions in the ungrouped bucket). Stamped as a React-safe
 * data attribute on the group label; CSS renders the number via ::after.
 */
/** Persisted view store of the official workspace browser (archivedFilter). */
const GROUP_COUNT_VIEW_KEY = "dsh.workspace.view.v5";

function computeGroupCounts(wsState, sessState, archivedFilter) {
	const byId = (sessState && sessState.byId) || {};
	const archived = new Set((wsState && wsState.archivedSessionIds) || []);
	let current = null;
	for (const session of Object.values(byId)) {
		if (((session.retainedBy && session.retainedBy.mainView) || 0) > 0) { current = session.id; break; }
	}
	const visible = (session) => {
		if (!session || session.origin === "subagent") return false;
		if (session.blank && session.id !== current) return false;
		if (archivedFilter === "show") return true;
		if (archivedFilter === "only") return archived.has(session.id);
		return !archived.has(session.id);
	};
	const counts = new Map();
	const accounted = new Set();
	for (const workspace of (wsState && wsState.items) || []) {
		let count = 0;
		for (const id of workspace.sessionIds || []) {
			accounted.add(id);
			if (visible(byId[id])) count += 1;
		}
		counts.set(String(workspace.workspaceId), count);
	}
	let stray = 0;
	for (const id of (sessState && sessState.ids) || []) {
		if (accounted.has(id)) continue;
		if (visible(byId[id])) stray += 1;
	}
	counts.set("", stray);
	return counts;
}

/** The archived slice the official browser currently shows (view store mirror). */
function groupCountArchivedFilter() {
	try {
		const view = JSON.parse(localStorage.getItem(GROUP_COUNT_VIEW_KEY) || "{}");
		return view && typeof view.archivedFilter === "string" ? view.archivedFilter : "default";
	} catch (e) { return "default"; }
}

/** Stamp counts onto visible group header rows; groups without members lose the badge. */
function stampGroupCounts(counts) {
	const rows = document.querySelectorAll('.JoiKIa_projectRow[data-row-key^="workspace:"]');
	for (const row of rows) {
		const key = (row.getAttribute("data-row-key") || "").slice("workspace:".length);
		const title = row.querySelector(".JoiKIa_projectText .JoiKIa_title");
		if (!title) continue;
		const count = counts.get(key) || 0;
		// A single session needs no counter; triple digits collapse to "99+".
		const label = count > 99 ? "99+" : count >= 2 ? String(count) : "";
		if (label) title.dataset.dshWcCount = label;
		else if (title.dataset.dshWcCount !== undefined) delete title.dataset.dshWcCount;
	}
}

/** Subscribe to the host's workspaces/sessions snapshot stores and keep badges fresh. */
function initGroupCounts(ctx) {
	let workspaces = null;
	let sessions = null;
	try { workspaces = ctx.get("workspaces"); } catch (e) { workspaces = null; }
	try { sessions = ctx.get("sessions"); } catch (e) { sessions = null; }
	const list = (service) => (service && service.list && typeof service.list.getSnapshot === "function" && typeof service.list.subscribe === "function" ? service.list : null);
	const wsList = list(workspaces);
	const sessList = list(sessions);
	if (!wsList || !sessList) return { stamp: () => {}, dispose: () => {} };
	const refresh = () => {
		try { stampGroupCounts(computeGroupCounts(wsList.getSnapshot(), sessList.getSnapshot(), groupCountArchivedFilter())); } catch (e) {}
	};
	refresh();
	let disposed = false;
	const unsubscribe = (store) => {
		try { const off = store.subscribe(refresh); return typeof off === "function" ? off : null; } catch (e) { return null; }
	};
	const off1 = unsubscribe(wsList);
	const off2 = unsubscribe(sessList);
	return {
		stamp: refresh,
		dispose: () => {
			if (disposed) return;
			disposed = true;
			try { if (off1) off1(); } catch (e) {}
			try { if (off2) off2(); } catch (e) {}
			for (const title of document.querySelectorAll(".JoiKIa_title[data-dsh-wc-count]")) delete title.dataset.dshWcCount;
		}
	};
}
//#endregion

		//#region dsh-wechat-skin: right panel auto-open
		/**
		 * Open the host right panel when entering a session. The host writes a
		 * persisted layout for every visited session right away, so "no saved
		 * layout" cannot identify untouched sessions; instead the preference
		 * simply means "while ON, a session you enter starts with the right
		 * panel open". A manual collapse keeps holding while you stay in the
		 * session (ticks only fire when the selected session changes).
		 * toggleExpanded() throws until the session surface is mounted, so the
		 * attempt retries a few times before giving up.
		 */
		function initRightbarAuto(ctx) {
			let lastSessionId = null;
			let pending = null;
			let attempts = 0;
			// The sidebarRight service may be provided after this skin boots;
			// resolve it lazily on every attempt instead of capturing it once.
			const getService = () => {
				try { return ctx.get("sidebarRight") || null; } catch (e) { return null; }
			};
			const isExpanded = (service) => !!(service && typeof service.isExpanded === "function" && service.isExpanded());
			const stop = () => { if (pending) { clearTimeout(pending); pending = null; } attempts = 0; };
			const attempt = () => {
				if (attempts >= 6) { stop(); return; }
				attempts += 1;
				const service = getService();
				if (isExpanded(service)) { stop(); return; }
				if (service && typeof service.toggleExpanded === "function") {
					try { service.toggleExpanded(); } catch (e) {}
				}
				pending = setTimeout(() => {
					pending = null;
					if (isExpanded(getService())) { stop(); return; }
					attempt();
				}, 300);
			};
			const tick = () => {
				let row = null;
				try { row = document.querySelector(".JoiKIa_sessionRow.JoiKIa_selected"); } catch (e) { row = null; }
				const key = row ? (row.getAttribute("data-row-key") || "") : "";
				const sessionId = key.indexOf("session:") === 0 ? key.slice("session:".length) : "";
				if (!sessionId || sessionId === lastSessionId) return;
				// Check the preference BEFORE remembering the session: otherwise turning
				// the switch on while already inside a session never fires for it.
				if (readJson(RIGHTBAR_AUTO_KEY, false) !== true) return;
				lastSessionId = sessionId;
				stop();
				attempt();
			};
			return { tick, dispose: stop };
		}
		//#endregion

		//#region dsh-wechat-skin: session stars
		const STAR_KEY = "dsh-wechat-skin:starred";
		/** Bounded so a long-lived profile cannot grow this without limit. */
		const STAR_LIMIT = 500;
		/**
		 * Local bilingual label: this region runs outside the settings closure that
		 * owns t(), and the host locale service may not be up yet at first stamp.
		 */
		function starText(zh, en) {
			let lang = "";
			try { lang = String(document.documentElement.lang || navigator.language || "zh"); } catch (e) { lang = "zh"; }
			return lang.toLowerCase().indexOf("zh") === 0 ? zh : en;
		}
		function readStars() {
			const raw = readJson(STAR_KEY, []);
			if (!Array.isArray(raw)) return [];
			const seen = [];
			for (const item of raw) {
				if (typeof item !== "string" || !item) continue;
				if (seen.indexOf(item) < 0) seen.push(item);
			}
			return seen.slice(0, STAR_LIMIT);
		}
		function writeStars(list) { writeJson(STAR_KEY, list.slice(0, STAR_LIMIT)); }
		function toggleStars(key) {
			const list = readStars();
			const at = list.indexOf(key);
			if (at >= 0) list.splice(at, 1);
			else list.push(key);
			writeStars(list);
			return at < 0;
		}
		function ensureStarButton(row, key) {
			let btn = row.querySelector(".dsh-wc-star-btn");
			if (!btn) {
				const title = row.querySelector(".JoiKIa_title");
				if (!title) return;
				btn = document.createElement("button");
				btn.type = "button";
				btn.className = "dsh-wc-star-btn";
				btn.setAttribute("aria-label", starText("切换星标", "Toggle star"));
				btn.setAttribute("aria-pressed", "false");
				btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6.1 6.5.8-4.8 4.6 1.2 6.5-5.8-3.2-5.8 3.2 1.2-6.5-4.8-4.6 6.5-.8z"/></svg>';
				title.insertAdjacentElement("afterend", btn);
			}
			if (btn.getAttribute("data-star-key") !== key) btn.setAttribute("data-star-key", key);
			return btn;
		}
		function stampStars() {
			let rows = [];
			try { rows = Array.prototype.slice.call(document.querySelectorAll(".JoiKIa_sessionRow")); } catch (e) { return; }
			const stars = readStars();
			for (const row of rows) {
				const key = row.getAttribute("data-row-key") || "";
				if (!key) continue;
				const on = stars.indexOf(key) >= 0;
				if (on) row.setAttribute("data-dsh-wc-star", "1");
				else row.removeAttribute("data-dsh-wc-star");
				const btn = ensureStarButton(row, key);
				if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
			}
		}
		/** Drop every injected node and marker; the skin's CSS is gone by then. */
		function unstampStars() {
			let nodes = [];
			try { nodes = Array.prototype.slice.call(document.querySelectorAll(".dsh-wc-star-btn")); } catch (e) { return; }
			for (const node of nodes) { if (node.parentNode) node.parentNode.removeChild(node); }
			let rows = [];
			try { rows = Array.prototype.slice.call(document.querySelectorAll("[data-dsh-wc-star]")); } catch (e) { return; }
			for (const row of rows) row.removeAttribute("data-dsh-wc-star");
		}
		function onStarClick(event) {
			const btn = event.target && event.target.closest ? event.target.closest(".dsh-wc-star-btn") : null;
			if (!btn) return;
			const key = btn.getAttribute("data-star-key") || "";
			if (!key) return;
			event.preventDefault();
			event.stopPropagation();
			toggleStars(key);
			stampStars();
		}
		function initSessionStars() {
			document.addEventListener("click", onStarClick, true);
			stampStars();
			return {
				stamp: stampStars,
				dispose() {
					document.removeEventListener("click", onStarClick, true);
					unstampStars();
				}
			};
		}
		//#endregion

		//#region dsh-wechat-skin: right panel default width
		/**
		 * Default right-panel width: 35% of the viewport instead of the host's
		 * 45%. Only applies until the user grabs the right-panel drag handle
		 * once (tracked locally), after which the host's own value always wins.
		 * Re-applies on window resize so the ratio keeps holding while untouched.
		 */
		const RIGHTBAR_TOUCHED_KEY = "dsh-wechat-skin:rightbar-touched";
		const RIGHTBAR_WIDTH_RATIO = 0.35;
		/**
		 * sessionStorage, not localStorage: the host does not persist the right-panel
		 * width at all (layoutInfo.rightbar starts null every launch), so a permanent
		 * "touched" flag would disable the 35% default forever with no way back.
		 * Per-window means a fresh launch gets the default again, and resetSkin clears it.
		 */
		function rightbarTouched() {
			try { return window.sessionStorage.getItem(RIGHTBAR_TOUCHED_KEY) === "1"; } catch (e) { return false; }
		}
		function markRightbarTouched() {
			try { window.sessionStorage.setItem(RIGHTBAR_TOUCHED_KEY, "1"); } catch (e) {}
		}
		function clearRightbarTouched() {
			try { window.sessionStorage.removeItem(RIGHTBAR_TOUCHED_KEY); } catch (e) {}
			// Drop the pre-1.46 localStorage flag too, so upgrading users are not stuck.
			try { window.localStorage.removeItem(RIGHTBAR_TOUCHED_KEY); } catch (e) {}
		}
		function applyRightbarDefault(layout) {
			if (rightbarTouched()) return false;
			if (!layout || !layout.panels || typeof layout.panels.setRightbar !== "function") return false;
			const width = Math.round(window.innerWidth * RIGHTBAR_WIDTH_RATIO);
			if (!(width >= 300)) return false;
			try { layout.panels.setRightbar(width); } catch (e) { return false; }
			return true;
		}
		function initRightbarWidth(ctx) {
			let layout = null;
			let attempts = 0;
			let pending = null;
			const stop = () => { if (pending) { clearTimeout(pending); pending = null; } };
			const attempt = () => {
				stop();
				if (layout) { applyRightbarDefault(layout); return; }
				try { layout = ctx.get("layout") || null; } catch (e) { layout = null; }
				if (layout && layout.panels && typeof layout.panels.setRightbar === "function") {
					applyRightbarDefault(layout);
					return;
				}
				layout = null;
				if (attempts < 6) { attempts += 1; pending = setTimeout(attempt, 300); }
			};
			const onResize = () => { if (layout) applyRightbarDefault(layout); };
			const onTouch = (event) => {
				const el = event.target && event.target.closest ? event.target.closest('.PIRFFq_handle[data-side="rightbar"]') : null;
				if (!el) return;
				markRightbarTouched();
				document.removeEventListener("pointerdown", onTouch, true);
			};
			document.addEventListener("pointerdown", onTouch, true);
			window.addEventListener("resize", onResize);
			attempt();
			return {
				reapply() { if (layout) applyRightbarDefault(layout); else attempt(); },
				dispose() {
					stop();
					document.removeEventListener("pointerdown", onTouch, true);
					window.removeEventListener("resize", onResize);
				}
			};
		}
		//#endregion

		/** Toggle row slot store: enabled flag + font level. */
		function createStore(initialEnabled, initialFontLevel, initialTextFontLevel, initialDensity, initialUserAvatar, initialChatWidth, initialSidebarBg, initialAiAvatar, initialLineHeight, initialReduceMotion, initialFontFamily, initialContrast, initialAvatarShape, initialAvatarStyle, initialComposerFx, initialRightbarAuto, initialIslands) {
		  return (0, _runtime_client.defineStore)({
		    init: () => ({ enabled: initialEnabled, fontLevel: initialFontLevel, textFontLevel: initialTextFontLevel, density: initialDensity, userAvatar: initialUserAvatar, chatWidth: initialChatWidth, sidebarBg: initialSidebarBg, aiAvatar: initialAiAvatar, lineHeight: initialLineHeight, reduceMotion: initialReduceMotion, fontFamily: initialFontFamily, contrast: initialContrast, avatarShape: initialAvatarShape, avatarStyle: initialAvatarStyle, composerFx: initialComposerFx, rightbarAuto: initialRightbarAuto, islands: initialIslands, revision: -1 }),
		    actions: {
		      sync: (d, enabled, fontLevel, textFontLevel, density, userAvatar, chatWidth, sidebarBg, aiAvatar, revision, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarStyle, composerFx, rightbarAuto, islands) => {
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
		        d.rightbarAuto = rightbarAuto;
		        d.islands = islands;
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
/** Tiny avatar glyph mirroring the session-list avatar art styles. */
function PreviewAvatarGlyph({ variant, label, radius, size }) {
  const px = size || 22;
  if (variant === "identicon") {
    let hash = 0; const text = String(label || "");
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    const cells = [];
    for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) {
      if ((hash >> (col * 3 + row)) & 1) cells.push([col, row]);
    }
    return (0, react_jsx_runtime.jsx)("span", { style: { width: px, height: px, borderRadius: radius, flex: "none", background: "#f2f2f3", display: "block", overflow: "hidden" },
      children: (0, react_jsx_runtime.jsx)("svg", { width: px, height: px, viewBox: "0 0 3 3", children: cells.map((cell) => (0, react_jsx_runtime.jsx)("rect", { x: cell[0], y: cell[1], width: 1, height: 1, fill: "hsl(152,28%,42%)" }, cell[0] + "-" + cell[1])) }) });
  }
  if (variant === "silhouette") {
    return (0, react_jsx_runtime.jsx)("span", { style: { width: px, height: px, borderRadius: radius, flex: "none", background: "#eef1f4", display: "block", overflow: "hidden" },
      children: (0, react_jsx_runtime.jsx)("svg", { width: px, height: px, viewBox: "0 0 24 24", children: (0, react_jsx_runtime.jsxs)("g", { fill: "#8a93a3", children: [
        (0, react_jsx_runtime.jsx)("circle", { cx: 12, cy: 9, r: 4.2 }),
        (0, react_jsx_runtime.jsx)("path", { d: "M 4 21 C 4 15.5 7.6 13 12 13 C 16.4 13 20 15.5 20 21 Z" })
      ] }) }) });
  }
  return null; /* "initial": the caller renders the letter chip */
}

/** A miniature of the chat + sidebar, so changes are visible before leaving settings. */
function SkinPreview({ t, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, darkSkin, lineHeight, aiAvatarVisible, fontFamily, contrast, avatarShape, avatarStyle, preset }) {
const scale = FONT_SCALES[fontLevel] !== undefined ? FONT_SCALES[fontLevel] : 1;
const textScale = FONT_SCALES[textFontLevel] !== undefined ? FONT_SCALES[textFontLevel] : FONT_SCALES[3];
const previewFont = fontFamily === "wechat" ? '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  : fontFamily === "wenkai" ? '"LXGW WenKai", "LXGWWenKai", "霞鶩文楷", "Kaiti SC", serif'
  : fontFamily === "kai" ? '"Kaiti SC", "STKaiti", KaiTi, serif'
  : fontFamily === "round" ? '"Yuanti SC", YouYuan, "Hiragino Maru Gothic ProN", "PingFang SC", sans-serif'
  : undefined;
const previewAvatarRadius = avatarShape === "circle" ? "50%" : avatarShape === "square" ? "2px" : "5px";
const avatarVariant = avatarStyle === "identicon" ? "identicon" : avatarStyle === "silhouette" ? "silhouette" : "initial";
const highContrast = contrast === "high";
const isPaper = preset === "paper";
const gap = density === "compact" ? 6 : 10;
const widthPct = chatWidth === "wide" ? "92%" : chatWidth === "medium" ? "76%" : "60%";
/* keep these in step with the WECHAT_CSS palette (v1.37 colour ladder) */
const sidebarColor = sidebarBg || (isPaper ? (darkSkin ? "#1e1b17" : "#e9e8e6") : (darkSkin ? "#18191b" : "#e8e8ec"));
const canvasColor = isPaper ? (darkSkin ? "#141210" : "#fdfdfc") : (darkSkin ? "#111113" : "#fcfcfd");
const inBubble = isPaper ? (darkSkin ? "#2a2620" : "#f1ede2") : (darkSkin ? "#2e3135" : "#f0f0f3");
const outBubble = isPaper ? "#ded3ba" : "#95ec69";
const outInk = isPaper ? "#3a3325" : "#101010";
const lh = lineHeight === "compact" ? 1.5 : lineHeight === "relaxed" ? 1.85 : 1.6;
const bubbleBase = { position: "relative", maxWidth: widthPct, padding: "6px 10px", borderRadius: "8px", fontFamily: previewFont, fontSize: Math.round(12 * textScale) + "px", lineHeight: lh };
const avatarChip = { width: "22px", height: "22px", borderRadius: previewAvatarRadius, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: darkSkin ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)", color: darkSkin ? "rgba(255,255,255,0.55)" : "#999", fontSize: "12px" };
const renderAvatar = (label) => avatarVariant === "initial"
  ? (0, react_jsx_runtime.jsx)("span", { style: avatarChip, children: label })
  : (0, react_jsx_runtime.jsx)(PreviewAvatarGlyph, { variant: avatarVariant, label: label, radius: previewAvatarRadius });
return (0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", borderRadius: "10px", overflow: "hidden", border: "0.5px solid var(--dsw-alias-border-l2)" },
children: [
(0, react_jsx_runtime.jsx)("div", {
style: { width: "76px", flex: "none", background: sidebarColor, padding: "8px 6px", display: "flex", flexDirection: "column", gap: "6px" },
children: [0, 1, 2, 3].map((index) => (0, react_jsx_runtime.jsx)("div", {
style: { height: `${Math.round(14 * scale)}px`, borderRadius: "4px", background: index === 0 ? "rgba(7,193,96,0.22)" : darkSkin ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }
}, "s" + index))
}),
(0, react_jsx_runtime.jsxs)("div", {
style: { flex: "1 1 auto", minWidth: 0, background: canvasColor, padding: "10px 12px", display: "flex", flexDirection: "column", gap: gap },
children: [
(0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", alignItems: "flex-start", gap: "8px", alignSelf: "flex-start" },
children: [
aiAvatarVisible === false ? null : renderAvatar("AI"),
(0, react_jsx_runtime.jsxs)("div", {
style: Object.assign({}, bubbleBase, { background: inBubble, color: highContrast ? (darkSkin ? "#f2f2f3" : "#111111") : (darkSkin ? "rgba(255,255,255,0.86)" : "#1a1a1a"), border: highContrast ? (darkSkin ? "0.5px solid rgba(255,255,255,0.34)" : "0.5px solid rgba(0,0,0,0.28)") : "none" }),
children: t("previewIn")
})
]
}),
(0, react_jsx_runtime.jsxs)("div", {
style: { display: "flex", alignItems: "flex-start", gap: "8px", alignSelf: "flex-end" },
children: [
userAvatarVisible === false ? null : renderAvatar(t("me")),
(0, react_jsx_runtime.jsxs)("div", {
style: Object.assign({}, bubbleBase, { background: outBubble, color: outInk }),
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

/** Share code: a compact, copyable encoding of the skin-only appearance
 * settings. Excludes avatar images (large data URLs), the sidebar order
 * (personal session ids) and legacy keys, so codes stay short and private. */
/**
 * Render the share dialog on body when react-dom is reachable, so no future
 * ancestor transform can trap its position:fixed. Falls back to inline.
 */
function portalModal(node) {
	try {
		if (_reactDom && typeof _reactDom.createPortal === "function" && document.body) return _reactDom.createPortal(node, document.body);
	} catch (e) {}
	return node;
}
const SHARE_CODE_PREFIX = "SWX1.";
const SHARE_CODE_KEYS = [FONT_LEVEL_KEY, TEXT_FONT_LEVEL_KEY, DENSITY_KEY, CHAT_WIDTH_KEY, SIDEBAR_BG_KEY, PRESET_KEY, LINE_HEIGHT_KEY, MOTION_KEY, FONT_FAMILY_KEY, CONTRAST_KEY, AVATAR_SHAPE_KEY, AVATAR_STYLE_KEY, COMPOSER_FX_KEY, RIGHTBAR_AUTO_KEY, ISLANDS_KEY, USER_AVATAR_ENABLED_KEY, AI_AVATAR_ENABLED_KEY, CUSTOM_PRESETS_KEY];
function base64UrlEncode(text) {
	const bytes = new TextEncoder().encode(text);
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlDecode(text) {
	let t = String(text).replace(/-/g, "+").replace(/_/g, "/");
	while (t.length % 4) t += "=";
	const bin = atob(t);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
function encodeSkinShare() {
	const skin = {};
	try {
		for (const key of SHARE_CODE_KEYS) {
			const value = window.localStorage.getItem(key);
			if (value !== null) skin[key] = value;
		}
	} catch (e) {}
	return SHARE_CODE_PREFIX + base64UrlEncode(JSON.stringify({ v: 1, s: skin }));
}
/** Upper bound on an accepted code: a megabyte-long paste must not reach storage. */
const SHARE_CODE_MAX = 65536;
function decodeSkinShare(raw) {
	const text = String(raw == null ? "" : raw).trim();
	if (text.length > SHARE_CODE_MAX) throw new Error("invalid share code");
	if (!text.startsWith(SHARE_CODE_PREFIX)) throw new Error("invalid share code");
	let parsed = null;
	try { parsed = JSON.parse(base64UrlDecode(text.slice(SHARE_CODE_PREFIX.length))); } catch (e) { throw new Error("invalid share code"); }
	if (!parsed || parsed.v !== 1 || !parsed.s || typeof parsed.s !== "object" || Array.isArray(parsed.s)) throw new Error("invalid share code");
	const skin = {};
	for (const key of SHARE_CODE_KEYS) {
		if (Object.prototype.hasOwnProperty.call(parsed.s, key) && typeof parsed.s[key] === "string") skin[key] = parsed.s[key];
	}
	return skin;
}

function WechatSkinRow({ ctx, t, setFontLevel, setTextFontLevel, setDensity, setUserAvatarVisible, setChatWidth, setSidebarBg, setAiAvatarVisible, setLineHeight, setReduceMotion, setFontFamily, setContrast, setAvatarShape, setAvatarStyle, setComposerFx, setRightbarAuto, setIslands, applyPreset, savePreset, deletePreset, listPresets, exportConfig, importConfig, uploadUserAvatar, uploadAiAvatar, resetSkin, useStore }) {
const fontLevel = useStore((s) => s.fontLevel);
const textFontLevel = useStore((s) => s.textFontLevel);
const density = useStore((s) => s.density);
const userAvatarVisible = useStore((s) => s.userAvatar);
const aiAvatarStore = useStore((s) => s.aiAvatar);
const chatWidth = useStore((s) => s.chatWidth);
const sidebarBg = useStore((s) => s.sidebarBg);
const darkPair = (0, _react.useState)(typeof document !== "undefined" && document.body && document.body.dataset.dshWechatDark === "1");
const darkSkin = darkPair[0];
(0, _react.useEffect)(() => {
  if (!ctx || typeof ctx.on !== "function") return;
  const syncDark = () => setTimeout(() => darkPair[1](typeof document !== "undefined" && document.body && document.body.dataset.dshWechatDark === "1"), 0);
  const offDark = ctx.on("theme/change", syncDark);
  return typeof offDark === "function" ? offDark : undefined;
}, [ctx]);
const userRef = (0, _react.useRef)(null);
const aiRef = (0, _react.useRef)(null);
const importRef = (0, _react.useRef)(null);
const presetPair = (0, _react.useState)(() => { const id = readJson(PRESET_KEY, null); return typeof id === "string" && id ? id : null; });
const statusPair = (0, _react.useState)({ kind: "", detail: "" });
const presetId = presetPair[0];
const [armed, setArmed] = (0, _react.useState)(null);
const armTimerRef = (0, _react.useRef)(null);
(0, _react.useEffect)(() => () => { if (armTimerRef.current) window.clearTimeout(armTimerRef.current); }, []);
const armConfirm = (key) => { setArmed(key); if (armTimerRef.current) window.clearTimeout(armTimerRef.current); armTimerRef.current = window.setTimeout(() => setArmed((current) => (current === key ? null : current)), 4000); };
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
const rightbarAuto = useStore((s) => s.rightbarAuto) === true;
const islands = useStore((s) => s.islands) !== false;
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
// 品牌卡整体参与搜索（命中与否按整卡文本判断）
const brandCard = document.querySelector(".dsh-wc-brand-card");
if (brandCard) {
const brandHit = !q || String(brandCard.textContent || "").toLowerCase().indexOf(q) !== -1;
brandCard.style.display = brandHit ? "" : "none";
if (brandHit) visibleCount += 1;
}
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
const [shareOpen, setShareOpen] = (0, _react.useState)(false);
const [shareCode, setShareCode] = (0, _react.useState)("");
const [shareCopied, setShareCopied] = (0, _react.useState)(false);
const [shareImportText, setShareImportText] = (0, _react.useState)("");
const [shareError, setShareError] = (0, _react.useState)("");
const shareModalRef = (0, _react.useRef)(null);
const openShare = () => {
	setShareCode(encodeSkinShare());
	setShareCopied(false);
	setShareImportText("");
	setShareError("");
	setShareOpen(true);
};
const copyShareCode = () => {
	const legacyCopy = () => {
		let ok = false;
		let ta = null;
		try {
			ta = document.createElement("textarea");
			ta.value = shareCode;
			// Off-screen: an unpositioned textarea at the end of body reflows the page.
			ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
			document.body.appendChild(ta);
			ta.select();
			ok = document.execCommand("copy");
		} catch (e) { ok = false; }
		if (ta && ta.parentNode) ta.parentNode.removeChild(ta);
		setShareCopied(ok);
		if (!ok) setShareError(t("shareCopyFailed"));
	};
	if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareCode).then(() => { setShareCopied(true); setShareError(""); }).catch(legacyCopy);
	else legacyCopy();
};
const runShareImport = () => {
	if (!importConfig) return;
	let skin = null;
	try { skin = decodeSkinShare(shareImportText); } catch (e) {
		setShareError(t("shareInvalid"));
		return;
	}
	if (!skin || !Object.keys(skin).length) {
		setShareError(t("shareInvalid"));
		return;
	}
	setShareError("");
	importConfig({ app: "sone-wx", version: 1, skin: skin }).then(() => {
		const importedPreset = readJson(PRESET_KEY, null);
		setPresetId(typeof importedPreset === "string" && importedPreset ? importedPreset : null);
		bumpPresets((n) => n + 1);
		setShareOpen(false);
		setStatus({ kind: "ok", detail: t("imported") });
	}).catch(() => setShareError(t("shareInvalid")));
};
(0, _react.useEffect)(() => {
	if (!shareOpen) return;
	const previousFocus = document.activeElement;
	const previousOverflow = document.body.style.overflow;
	document.body.style.overflow = "hidden";
	const focusables = () => {
		const root = shareModalRef.current;
		if (!root) return [];
		return Array.prototype.slice.call(root.querySelectorAll("button, textarea, [href], input, select, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.disabled);
	};
	const first = focusables()[0];
	if (first && typeof first.focus === "function") first.focus();
	// Capture + stopPropagation: the host settings dialog also listens for Escape
	// and would otherwise close the whole settings page along with this modal.
	const onKey = (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			setShareOpen(false);
			return;
		}
		if (event.key !== "Tab") return;
		const items = focusables();
		if (!items.length) return;
		const head = items[0];
		const tail = items[items.length - 1];
		const active = document.activeElement;
		const inside = shareModalRef.current && shareModalRef.current.contains(active);
		if (event.shiftKey && (active === head || !inside)) {
			event.preventDefault();
			tail.focus();
		} else if (!event.shiftKey && (active === tail || !inside)) {
			event.preventDefault();
			head.focus();
		}
	};
	window.addEventListener("keydown", onKey, true);
	return () => {
		window.removeEventListener("keydown", onKey, true);
		document.body.style.overflow = previousOverflow;
		if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) previousFocus.focus();
	};
}, [shareOpen]);
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
const islandsOptions = [
{ value: true, label: t("islandsOn") },
{ value: false, label: t("islandsOff") }
];
const rightbarAutoOptions = [
{ value: false, label: t("rightbarAutoOff") },
{ value: true, label: t("rightbarAutoOn") }
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
children: (0, react_jsx_runtime.jsx)(SkinPreview, { t, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, darkSkin, lineHeight, aiAvatarVisible: aiAvatarStore, fontFamily, contrast, avatarShape, avatarStyle, preset: presetId })
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
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("rightbarAutoTitle"),
hint: t("rightbarAutoHint"),
onReset: () => { if (setRightbarAuto) setRightbarAuto(false); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: rightbarAuto, options: rightbarAutoOptions, onChange: (value) => { if (setRightbarAuto) setRightbarAuto(value); } })
}),
(0, react_jsx_runtime.jsx)(SkinRow, {
title: t("islandsTitle"),
hint: t("islandsHint"),
onReset: () => { if (setIslands) setIslands(true); }, resetLabel: t("rowReset"),
children: (0, react_jsx_runtime.jsx)(Segmented, { value: islands, options: islandsOptions, onChange: (value) => { if (setIslands) setIslands(value); } })
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
onReset: () => { if (setComposerFx) setComposerFx(true); }, resetLabel: t("rowReset"),
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
(0, react_jsx_runtime.jsx)("span", { key: "dot", style: missing.length ? styles.dotWarn : Object.assign({}, styles.dot, contextMissing.length ? { opacity: 0.5 } : null), title: contextMissing.length ? t("fitContextPending") + "：" + contextMissing.join(", ") : "" }),
(0, react_jsx_runtime.jsx)("span", { key: "fit", children: missing.length ? t("fitMissing") + " (" + missing.length + ")" : (contextMissing.length ? t("fitContextPending") : t("fitOk")) }),
(0, react_jsx_runtime.jsx)("span", { key: "ver", style: styles.versionTag, title: "SONE theme", children: "v" + SKIN_VERSION })
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
}),
(0, react_jsx_runtime.jsx)("button", {
type: "button",
className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm",
onClick: openShare,
children: t("shareTitle")
}),
shareOpen ? portalModal((0, react_jsx_runtime.jsx)("div", {
className: "dsh-wc-modal-mask",
onClick: () => setShareOpen(false),
children: (0, react_jsx_runtime.jsxs)("div", {
className: "dsh-wc-modal",
ref: shareModalRef,
role: "dialog",
"aria-modal": true,
"aria-label": t("shareTitle"),
onClick: (event) => event.stopPropagation(),
children: [
(0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-modal-title", children: t("shareTitle") }),
(0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-modal-desc", children: t("shareDesc") }),
(0, react_jsx_runtime.jsx)("textarea", { className: "dsh-wc-modal-code", readOnly: true, value: shareCode, onFocus: (event) => event.target.select() }),
(0, react_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px", justifyContent: "flex-end" }, children: [
(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wc-btn dsh-wc-btn-secondary dsh-wc-btn-sm", onClick: copyShareCode, children: shareCopied ? t("shareCopied") : t("shareCopy") }),
(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wc-btn dsh-wc-btn-sm", onClick: () => setShareOpen(false), children: t("shareClose") })
] }),
(0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-modal-divider" }),
(0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-modal-desc", children: t("shareImportTitle") }),
(0, react_jsx_runtime.jsx)("textarea", { className: "dsh-wc-modal-code", placeholder: SHARE_CODE_PREFIX, value: shareImportText, onChange: (event) => { setShareImportText(event.target.value); if (shareError) setShareError(""); } }),
shareError ? (0, react_jsx_runtime.jsx)("div", { className: "dsh-wc-modal-error", role: "alert", children: shareError }) : null,
(0, react_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px", justifyContent: "flex-end" }, children: [
(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-wc-btn dsh-wc-btn-primary dsh-wc-btn-sm", onClick: runShareImport, children: t("shareImportBtn") })
] })
]
})
})) : null
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
if (!matchLatched) {
// Structural CSS needs body.dsh-wechat-match; latch it once the hashed selectors
// are seen so a slow first render cannot leave the skin half-off, while a DSH
// upgrade that renames every class still disables the gated rules.
if (selectorsMatch()) matchLatched = true;
// 只在缺失集合变化或首次匹配时打印：这个方法挂在每次 DOM 变更上，逐次 log 会刷屏。
// 锁存后选择器必然全部命中，日志恒为 OK，跳过探测省下每批 4 次 querySelector。
const _swMissing = SELECTOR_PROBES.filter((sel) => { try { return !document.querySelector(sel); } catch (e) { return true; } });
const _swLog = _swMissing.length ? "missing: " + _swMissing.join(", ") : "OK";
if (_swLog !== lastSelectorLog) { lastSelectorLog = _swLog; console.info("[sone-wx] selectors", _swLog); }
}
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
			const offThemeChange = ctx.on("theme/change", syncBodyClass);
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
			let rightbarAuto = readJson(RIGHTBAR_AUTO_KEY, false) === true;
			applyRightbarAuto(rightbarAuto);
			let islandsOn = readJson(ISLANDS_KEY, true) !== false;
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
			const store = createStore(enabled, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, aiAvatarVisible, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarArt, composerFxOn, rightbarAuto, islandsOn);
			let bound = null;
			let revision = 0;
			const sync = () => {
				bound?.sync(enabled, fontLevel, textFontLevel, density, userAvatarVisible, chatWidth, sidebarBg, aiAvatarVisible, ++revision, lineHeight, reduceMotion, fontFamily, contrast, avatarShape, avatarArt, composerFxOn, rightbarAuto, islandsOn);
			};
			initPanelDrag();
			scanHooks.push(applyPanelOrder);
scanHooks.push(composerScrollScan);
			// Group session counts live in the host's own stores; subscribe once per apply.
			let groupCounts = null;
			try { groupCounts = initGroupCounts(ctx); } catch (e) { groupCounts = null; }
			if (groupCounts) scanHooks.push(groupCounts.stamp);
			// Right-panel auto-open watches the selected session row per scan.
			let rightbarAutoCtl = null;
			try { rightbarAutoCtl = initRightbarAuto(ctx); } catch (e) { rightbarAutoCtl = null; }
			if (rightbarAutoCtl) scanHooks.push(rightbarAutoCtl.tick);
			// Session stars: visual-only starring + in-group pinning.
			let starsCtl = null;
			try { starsCtl = initSessionStars(); } catch (e) { starsCtl = null; }
			if (starsCtl) scanHooks.push(starsCtl.stamp);
			// Right-panel default width (35% until the user drags the handle).
			let rightbarWidthCtl = null;
			try { rightbarWidthCtl = initRightbarWidth(ctx); } catch (e) { rightbarWidthCtl = null; }
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
								heroMark: !brand || brand.heroMark !== false,
								heroTagline: brand && typeof brand.heroTagline === "string" ? brand.heroTagline : ""
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
						const importedRightbarAuto = importedValue(RIGHTBAR_AUTO_KEY);
						if (importedRightbarAuto !== undefined && typeof importedRightbarAuto !== "boolean") return Promise.reject(new Error("invalid config"));
						const importedIslands = importedValue(ISLANDS_KEY);
						if (importedIslands !== undefined && typeof importedIslands !== "boolean") return Promise.reject(new Error("invalid config"));
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
						islandsOn = readJson(ISLANDS_KEY, true) !== false;
						composerEffects.setEnabled(composerFxOn);
						rightbarAuto = readJson(RIGHTBAR_AUTO_KEY, false) === true;
						applyRightbarAuto(rightbarAuto);
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
							[COMPOSER_FX_KEY, composerFxOn], [RIGHTBAR_AUTO_KEY, rightbarAuto], [ISLANDS_KEY, islandsOn]
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
							const brandBody = {
								title: typeof brand.title === "string" ? brand.title : "",
								wordmarkImage: brand.wordmarkImage === true,
								heroMark: brand.heroMark !== false
							};
							// Only send heroTagline when the export carried one, so importing
							// older exports keeps the current tagline instead of clearing it.
							if (typeof brand.heroTagline === "string") brandBody.heroTagline = brand.heroTagline.trim().slice(0, 40);
							jobs.push(fetch("/sone-wx/brand", {
								method: "POST",
								headers: { "content-type": "application/json" },
								body: JSON.stringify(brandBody)
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
					setRightbarAuto: (on) => {
					  rightbarAuto = !!on;
					  writeJson(RIGHTBAR_AUTO_KEY, rightbarAuto);
					  applyRightbarAuto(rightbarAuto);
					  sync();
					},
					setIslands: (on) => {
					  islandsOn = !!on;
					  writeJson(ISLANDS_KEY, islandsOn);
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
							window.localStorage.removeItem(AI_AVATAR_SHOW_KEY_LEGACY);
							window.localStorage.removeItem(PRESET_KEY);
window.localStorage.removeItem(LINE_HEIGHT_KEY);
window.localStorage.removeItem(MOTION_KEY);
window.localStorage.removeItem(FONT_FAMILY_KEY);
window.localStorage.removeItem(CONTRAST_KEY);
window.localStorage.removeItem(AVATAR_SHAPE_KEY);
window.localStorage.removeItem(COMPOSER_FX_KEY);
window.localStorage.removeItem(RIGHTBAR_AUTO_KEY);
window.localStorage.removeItem(ISLANDS_KEY);
window.localStorage.removeItem(STAR_KEY);
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
						rightbarAuto = false; applyRightbarAuto(rightbarAuto);
						islandsOn = true; writeJson(ISLANDS_KEY, true);
						// Deleting the key is not enough: the in-memory order keeps driving the DOM
						// until the next reload, and saved presets would survive a "restore defaults".
						sidebarOrder = []; applyPanelOrder();
						writeJson(CUSTOM_PRESETS_KEY, []);
						clearRightbarTouched();
						if (rightbarWidthCtl) rightbarWidthCtl.reapply();
						// Removing STAR_KEY does not repaint the rows; without this the
						// highlight survives until some unrelated DOM mutation happens.
						stampStars();
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
"islandsTitle": "浮岛布局",
"islandsHint": "圆角面板浮在统一画布上：自绘顶栏、常驻左侧图标栏、置顶聚合与两级模型弹层。关闭即回到平铺布局。",
"islandsOn": "开启",
"islandsOff": "关闭",
"rightbarAutoTitle": "右侧面板默认展开",
"rightbarAutoHint": "切换会话时若右侧面板处于收起状态则自动打开；同一会话内手动收起后不会被强行弹回",
"rightbarAutoOn": "开启",
"rightbarAutoOff": "关闭",
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
					"resetHint": "清除全部皮肤设置（含上传的头像与自定义预设），不可撤销",
					"confirmAgain": "再点一次确认",
					"presetTitle": "主题预设",
					"presetHint": "一次套用一组搭配",
					"preset_wechat": "微信",
					"preset_compact": "紧凑",
					"preset_paper": "纸张",
					"me": "我",
					"previewIn": "可以，发过来吧",
					"previewOut": "今天有空吗？帮我看看这份方案",
					"fitOk": "适配正常",
					"fitMissing": "选择器缺失",
					"fitContextPending": "上下文探针未渲染",
					"exportConfig": "导出配置",
					"importConfig": "导入配置",
					"exported": "已导出 sone-wx-config.json",
					"imported": "已导入并应用",
"shareTitle": "分享当前设置",
"shareDesc": "复制分享码发给同事；对方在设置页粘贴即可应用同一套外观。",
"shareCopy": "复制分享码",
"shareCopied": "已复制",
"shareClose": "关闭",
"shareImportTitle": "粘贴分享码",
"shareImportBtn": "导入",
"shareInvalid": "分享码无效",
"shareCopyFailed": "复制失败，请手动选中分享码复制",
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
"islandsTitle": "Island layout",
"islandsHint": "Rounded panels float on one canvas: custom top bar, persistent icon rail, pinned section and a two-level model picker. Turn it off to return to the flat shell.",
"islandsOn": "On",
"islandsOff": "Off",
"rightbarAutoTitle": "Open right panel by default",
"rightbarAutoHint": "Opens the right panel when switching sessions if it is collapsed; collapsing it manually in a session keeps it closed there",
"rightbarAutoOn": "On",
"rightbarAutoOff": "Off",
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
					"fontTitle": "Interface font size",
					"fontHint": "Sidebar, settings and process rows",
					"textFontTitle": "Text size",
					"textFontHint": "Message text, code blocks and tables in the chat",
					"fontL1": "XS",
					"fontL2": "S",
					"fontL3": "M",
					"fontL4": "L",
					"fontL5": "XL",
					"reset": "Reset",
					"resetHint": "Clears all skin settings (including uploaded avatars and custom presets), no undo",
					"confirmAgain": "Click again to confirm",
					"presetTitle": "Presets",
					"presetHint": "Applies a matching set at once",
					"preset_wechat": "WeChat",
					"preset_compact": "Compact",
					"preset_paper": "Paper",
					"me": "Me",
					"previewIn": "Sure, send it over",
					"previewOut": "Busy today? Can you look at this plan?",
					"fitOk": "Selectors OK",
					"fitMissing": "Selectors missing",
"fitContextPending": "Context probes not rendered",
					"exportConfig": "Export",
					"importConfig": "Import",
					"exported": "Exported sone-wx-config.json",
					"imported": "Imported and applied",
"shareTitle": "Share current settings",
"shareDesc": "Copy the share code and send it to a colleague; they paste it on the settings page to apply the same look.",
"shareCopy": "Copy share code",
"shareCopied": "Copied",
"shareClose": "Close",
"shareImportTitle": "Paste a share code",
"shareImportBtn": "Import",
"shareInvalid": "Invalid share code",
"shareCopyFailed": "Copy failed — select the code and copy it manually",
					"importBad": "Unreadable file"
				}
			}), "sone-wx: skin dictionaries");


			ctx.effect(() => () => {
				if (typeof offThemeChange === "function") offThemeChange();
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
				// All hooks are pushed per apply(); leaving any behind runs it twice
				// after a disable/enable cycle.
				const removableHooks = [applyPanelOrder, composerScrollScan];
				if (groupCounts) removableHooks.push(groupCounts.stamp);
				if (rightbarAutoCtl) removableHooks.push(rightbarAutoCtl.tick);
				if (starsCtl) removableHooks.push(starsCtl.stamp);
				for (const hook of removableHooks) {
					const at = scanHooks.indexOf(hook);
					if (at >= 0) scanHooks.splice(at, 1);
				}
				if (groupCounts) groupCounts.dispose();
				if (rightbarAutoCtl) rightbarAutoCtl.dispose();
				if (starsCtl) starsCtl.dispose();
				if (rightbarWidthCtl) rightbarWidthCtl.dispose();
				unbindComposerFade();
				if (scheduled) { cancelAnimationFrame(scheduled); scheduled = null; }
				for (const entry of panelEntries()) entry.el.style.removeProperty("order");
				if (document.body) delete document.body.dataset.dshWcSidebarInk;
				if (document.body) delete document.body.dataset.dshWcRightbarAuto;
				document.documentElement.style.removeProperty("--dsh-wc-sidebar-color");
				document.documentElement.style.removeProperty("--dsh-wechat-font-scale");
				document.documentElement.style.removeProperty("--dsh-wechat-text-scale");
				document.documentElement.style.removeProperty("--dsh-user-avatar");
				document.documentElement.style.removeProperty("--dsh-assistant-avatar");
			}, "sone-wx: skin cleanup");
			return { store, injected };
		}
		//#endregion

	//#region sone-wx: islands structural layer
	/**
	 * 结构层（浮岛布局 / 顶栏 / 左侧图标栏 / 置顶聚合 / 模型弹层 / 更新入口 / 强调色）。
	 * 结构与交互移植自 dsh-islands-ui（MIT, DawnCHL）；配色与纹理走 sone-wx 皮肤令牌。
	 */
	const ISLANDS_CSS = `/* ==========================================================================
   Islands 结构层 · 令牌桥接
   结构（几何 / 层级 / 组件）移植自 dsh-islands-ui（MIT, DawnCHL），
   颜色不另起一套：全部取自 sone-wx 皮肤令牌，于是深浅主题与强调色共用一条链路。
   作用域挂在 body[data-dsh-wc-islands] 上，与 body.dsh-wechat-skin-on 叠加生效。
   ========================================================================== */

body[data-dsh-wc-islands] {
	/* 画布 = 皮肤的侧栏底色：既让岛屿浮起来，又让「侧边栏背景色」这项设置
	   在浮岛模式下直接决定海面颜色（5 个色板 + 自定义取色都生效）。 */
	--isl-canvas: var(--wc-sidebar, #e8e8ec);
	--isl-canvas-veil: color-mix(in srgb, var(--wc-sidebar, #e8e8ec) 72%, transparent);
	/* 岛屿表面 = 会话底色，恒比画布亮一档；静止靠色阶分层，不靠阴影。 */
	--isl-surface: var(--wc-bg, #fcfcfd);
	--isl-surface-muted: var(--wc-surface, #f9f9fb);
	--isl-surface-sunken: var(--wc-code-bg, #e8e8ec);
	/* 发丝描边：比皮肤再安静一档，避免岛屿边框抢画面。 */
	--isl-border-soft: color-mix(in srgb, var(--wc-border-light, #d9d9e0) 62%, transparent);
	--isl-border: var(--wc-border-light, #d9d9e0);
	--isl-border-strong: color-mix(in srgb, var(--wc-ink-2, #4a4e56) 26%, transparent);
	--isl-hover: var(--dsw-alias-interactive-bg-hover, rgba(17, 24, 39, 0.055));
	--isl-active: var(--dsw-alias-interactive-bg-active, rgba(17, 24, 39, 0.09));
	/* 强调色跟随皮肤主色，选中反馈与气泡保持同一家族。 */
	--isl-accent: var(--wc-accent-solid, #0a7d43);
	/* 几何：与微信皮肤 12/8/6 的圆角阶梯错开一档，岛屿用更圆的容器。 */
	/* 岛屿比皮肤内的卡片更圆一档：12px 的卡片阶梯之上，另给浮岛 14/18。 */
	--isl-radius-xl: 18px;
	--isl-radius-lg: 14px;
	--isl-radius-md: var(--wc-radius-md, 10px);
	--isl-radius-sm: var(--wc-radius-sm, 6px);
	--isl-gap: 5px;
	--isl-topbar-height: 40px;
	--isl-chrome-top: 0px;
	--isl-rail-collapsed-width: 56px;
	--isl-rail-width: 48px;
	/* 无投影：微信皮肤靠色阶分层，不靠阴影。 */
	--isl-shadow-island: none;
	--isl-shadow-float:
		0 0 0 0.5px var(--wc-border-light, #d9d9e0),
		0 8px 24px -12px rgba(17, 24, 39, 0.18);
}

/* 深色：--wc-bg 在深色块里沿用宿主底色，结构层需要自己的海面与岛屿。 */
body.dsh-wechat-skin-on[data-dsh-wechat-dark="1"][data-dsh-wc-islands] {
	--isl-canvas: var(--wc-sidebar-dark, #18191b);
	--isl-surface: var(--wc-surface-dark, #212225);
	--isl-surface-muted: color-mix(in srgb, var(--wc-surface-dark, #212225) 72%, #ffffff);
	--isl-surface-sunken: var(--wc-code-bg, #16181a);
	--isl-border-soft: color-mix(in srgb, var(--wc-border-dark, #363a3f) 72%, transparent);
	--isl-border: var(--wc-border-dark, #363a3f);
	--isl-border-strong: color-mix(in srgb, #ffffff 22%, transparent);
}

/* ==========================================================================
   Islands UI · 10 shell
   The frame becomes a canvas; the three columns become detachable islands.
   ========================================================================== */

body[data-dsh-wc-islands] .PIRFFq_frame {
  /* The ocean is a solid surface, never the desktop showing through vibrancy. */
  background: var(--isl-canvas);
  padding: calc(var(--isl-chrome-top) + var(--isl-topbar-height) + var(--isl-gap)) var(--isl-gap) var(--isl-gap);
  /* Column gap only: the empty bottom track must not steal an extra row gap,
     so the islands stay symmetric top and bottom. */
  gap: 0 var(--isl-gap);
}

/* A real bottom panel (terminal, banner) still gets breathing room. */
body[data-dsh-wc-islands] .PIRFFq_bottomRow:has([data-slot='shell.bottom'] > *) {
  margin-top: var(--isl-gap);
}

/* The closed right column is a zero-width track, but the grid still reserves a
   gap beside it; pull the centre island over that gap so the canvas margin on
   the right equals the margin on the left. */
body[data-dsh-wc-islands] .PIRFFq_frame[data-rightbar-collapsed] .PIRFFq_centerCol {
  margin-right: calc(-1 * var(--isl-gap));
}

/* Center column: the conversation island. */
body[data-dsh-wc-islands] .PIRFFq_centerCol {
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  box-shadow: var(--isl-shadow-island);
  overflow: hidden;
}

/* Shipped desktop rules paint the sidebar with a gradient and give the center
   column a left hairline; both are removed so the canvas reads as one plane. */
[data-platform='darwin'] body[data-dsh-wc-islands] .PIRFFq_frame {
  background: var(--isl-canvas);
}

[data-platform='darwin'] body[data-dsh-wc-islands] .PIRFFq_frame:not([data-sidebar-drawer]) .PIRFFq_sidebarCol {
  background: transparent;
  border-right: 0;
  backdrop-filter: none;
}

body[data-dsh-wc-islands] .PIRFFq_sidebarCol {
  background: transparent;
  border-right: 0;
}

[data-platform='darwin'] body[data-dsh-wc-islands] .PIRFFq_centerCol,
body[data-dsh-wc-islands] .PIRFFq_centerCol {
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-left: 1px solid var(--isl-border-soft);
}

body[data-dsh-wc-islands] .PIRFFq_mainPanel {
  background: transparent;
}

/* Right workbench: only while a pane is open does the column render an island. */
body[data-dsh-wc-islands] .PIRFFq_rightbarCol {
  background: transparent;
}

body[data-dsh-wc-islands] .Dv5QdW_panel[data-sidebar-right-open]:not([data-sidebar-right-panel='fullscreen']) {
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  box-shadow: var(--isl-shadow-island);
  overflow: clip;
}

/* Drawer mask on narrow windows: Islands keeps the veil light and blurred. */
body[data-dsh-wc-islands] .PIRFFq_drawerMask {
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur);
}

/* The shell overlay layer is where the rail and window top bar live. In
   drawer mode it must paint above the drawer mask (70) and the drawer (71),
   otherwise the persistent rail disappears under the open workspace drawer. */
@media (width <= 767px) {
  body[data-dsh-wc-islands] .PIRFFq_overlayLayer {
    z-index: 72;
  }
}

/* The resize handle is invisible chrome; keep it grabbable but quiet. */
body[data-dsh-wc-islands] .PIRFFq_handle {
  width: 10px;
  margin-left: -5px;
}

/* The shell computes the right handle's inline \`left\` from the frame's
   border-box width, but its absolute containing block is the padded grid area
   and the panel itself sits inside the right padding. That shifts the handle
   two gaps to the right — wholly inside the right island. Cancel the frame's
   horizontal padding so the strip straddles the right island's left edge
   (covering the whole canvas gap plus 5px of the panel) like the left one. */
body[data-dsh-wc-islands] .PIRFFq_handle[data-side='rightbar'] {
  margin-left: calc(-5px - 2 * var(--isl-gap));
}

/* Windows title bar keeps its native height; the frame padding already gives
   the rounded content corner room, so only the radius is unified. */
[data-windows-titlebar] body[data-dsh-wc-islands] .PIRFFq_centerCol {
  border-radius: var(--isl-radius-lg);
}

[data-windows-titlebar] body[data-dsh-wc-islands] .PIRFFq_frame {
  background: var(--isl-canvas);
}

/* Collapsed sidebar on macOS drops the center column's left hairline; the
   island keeps its outline regardless. */
[data-platform='darwin'] body[data-dsh-wc-islands] [data-sidebar-collapsed] .PIRFFq_centerCol {
  border-left: 1px solid var(--isl-border-soft);
}

/* ==========================================================================
   Workbench panels (better-sidebar bottom dock + native right sidebar)
   Both must read as independent islands, not as sheets pasted onto the
   conversation island.
   ========================================================================== */

/* The bottom workbench reserves its height on the conversation column, not on
   the inner panel, so the island itself shrinks and a canvas gap opens between
   the two islands. */
body[data-dsh-wc-islands] #root [data-dsh-center-col] {
  margin-bottom: 0;
}

body[data-dsh-wc-islands] .PIRFFq_centerCol {
  margin-bottom: var(--dsh-sidebar-height, 0px);
  transition: margin-bottom var(--ds-transition-duration-slow) var(--ds-ease-in-out);
}

body[data-dsh-wc-islands]:has([data-dsh-bottom-panel]:not([class*='Hidden'])) .PIRFFq_centerCol {
  /* one gap above the panel and one below it */
  margin-bottom: calc(var(--dsh-sidebar-height, 0px) + var(--isl-gap));
}

body[data-dsh-wc-islands] [data-dsh-bottom-panel] {
  box-sizing: border-box;
  /* Align the panel with the conversation island edges and let the frame
     padding provide the bottom gap, so every island shares one gap width. */
  margin: 0;
  bottom: var(--isl-gap);
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  box-shadow: none;
  /* The rounded island clips its content, but NOT the height-drag strip: the
     strip must reach into the canvas gap above the panel to be reachable
     there. Clip the body instead (below), so the strip can overhang. */
  overflow: visible;
}

/* Keep the island's rounded content edge with the panel's own clipping gone:
   the body carries the radius, while the absolute resize strip and the close
   control stay outside this clip. */
body[data-dsh-wc-islands] [data-dsh-bottom-panel] > [class*='panelBody'] {
  overflow: clip;
  border-radius: calc(var(--isl-radius-lg) - 1px);
}

/* The host centers its strip on the panel's top border (\`top: -4px;
   height: 8px\`), which was right before the skin opened a canvas gap between
   the conversation island and the panel. Anchor the 10px strip to that gap
   instead: 5px above the border box top (the whole gap) and 5px inside the
   panel, matching the side handles' straddle. \`top\` is relative to the panel's
   padding box, hence the extra 1px border compensation. */
body[data-dsh-wc-islands] [data-dsh-bottom-panel] > [class*='bottomResize'] {
  top: calc(-1px - var(--isl-gap));
  height: 10px;
}

/* The native right sidebar keeps its own width preference, which can exceed
   the track the frame grants; clamp it to the track so it never hangs over
   the conversation island. */
body[data-dsh-wc-islands] .Dv5QdW_panel[data-sidebar-right-open]:not([data-sidebar-right-panel='fullscreen']) {
  box-sizing: border-box;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  body[data-dsh-wc-islands] .PIRFFq_centerCol {
    transition: none;
  }
}

/* ==========================================================================
   Independent workspace collapse
   The DSH collapse swaps the whole sidebar render tree for its rail-only
   variant. Instead the expanded rail stays mounted and only the workspace
   column hides, so the left column never re-renders or re-flows.
   ========================================================================== */

/* The right column must keep its own track while the workspace is collapsed.
   Pin it to 0 only while the right pane is closed; when it opens, use the
   pane's PREFERRED width (published by the client). Reading the current
   column width here deadlocks: it is 0 while closed, so opening the pane
   could never grow the track, and the panel's \`width: 100%\` clamp would keep
   it at two border pixels. The fallback keeps the pane visible even before
   the width source has been located. */
body[data-dsh-wc-islands][data-dsh-wc-islands-workspace]
  .PIRFFq_frame:not(
    :has(.Dv5QdW_panel[data-sidebar-right-open]:not([data-sidebar-right-panel='fullscreen']))
  ) {
  grid-template-columns:
    var(--isl-rail-collapsed-width) minmax(0, 1fr) 0 !important;
}

body[data-dsh-wc-islands][data-dsh-wc-islands-workspace]
  .PIRFFq_frame:has(
    .Dv5QdW_panel[data-sidebar-right-open]:not([data-sidebar-right-panel='fullscreen'])
  ) {
  grid-template-columns:
    var(--isl-rail-collapsed-width) minmax(0, 1fr)
    var(--isl-rightbar-w, max(300px, 45vw)) !important;
}

body[data-dsh-wc-islands] .PIRFFq_frame[data-islands-animating] {
  transition: grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out);
}

/* ==========================================================================
   Islands UI · 15 top bar
   A window-chrome strip above the three islands. It clears the macOS traffic
   lights, hosts the workspace collapse control, and leaves the content area
   completely free for the islands.
   ========================================================================== */

/* Registered even when the skin is off; the base rule keeps it out of the way. */
.isl-topbar {
  display: none;
}

body[data-dsh-wc-islands] .isl-topbar {
  position: fixed;
  inset: var(--isl-chrome-top) 0 auto;
  z-index: 30;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  height: var(--isl-topbar-height);
  /* macOS centers the traffic lights in its 48px window-chrome band; the
     controls follow that center (10 + 14 = 24), not the 40px bar's own. */
  padding: 10px 10px 0 8px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
  /* The bar itself must never swallow clicks meant for controls that are
     docked over it; only the toggle and the drag handle opt back in. */
  pointer-events: none;
  -webkit-app-region: no-drag;
  user-select: none;
}

/* Left lead (traffic-light strip) and the centre of the bar are draggable;
   both stop short of the docked controls so clicks keep working. */
/* The 88px lead exists only for the macOS traffic lights. */
body[data-dsh-wc-islands] .isl-topbarLead {
  display: none;
}

html[data-platform='darwin'] body[data-dsh-wc-islands] .isl-topbar {
  padding-left: 88px;
}

html[data-platform='darwin'] body[data-dsh-wc-islands] .isl-topbarLead {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  width: 88px;
  pointer-events: auto;
  -webkit-app-region: drag;
}

body[data-dsh-wc-islands] .isl-topbarDrag {
  flex: 1;
  align-self: stretch;
  min-width: 0;
  margin-right: 250px;
  pointer-events: auto;
  -webkit-app-region: drag;
}

body[data-dsh-wc-islands] .isl-topbarToggle {
  box-sizing: border-box;
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  pointer-events: auto;
  -webkit-app-region: no-drag;
}

body[data-dsh-wc-islands] .isl-topbarToggle:hover {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-topbarToggle:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}

/* Narrow desktop: the top bar remains the window chrome (drag strip + right
   panel toggle), but the rail's home button owns the workspace drawer. The
   chrome must paint above the drawer mask (70) and the drawer (71). */
@media (width <= 767px) {
  body[data-dsh-wc-islands] .isl-topbar {
    z-index: 72;
  }

  body[data-dsh-wc-islands] .isl-topbarToggle {
    display: none;
  }

  body[data-dsh-wc-islands] .isl-topbarDrag {
    margin-right: 40px;
  }
}

/* ==========================================================================
   Islands UI · 16 left rail
   Every registered panel launcher lives directly in the rail. Drag an icon to
   reorder it; right-click the rail to show or hide launchers.
   ========================================================================== */

body[data-dsh-wc-islands] .isl-rail {
  display: none;
}

body[data-dsh-wc-islands] .isl-rail {
  position: fixed;
  top: calc(var(--isl-chrome-top) + var(--isl-topbar-height) + 10px);
  left: var(--isl-gap);
  z-index: 25;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: var(--isl-rail-width);
  max-height: calc(100vh - var(--isl-chrome-top) - var(--isl-topbar-height) - 112px);
  padding: 2px 6px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  pointer-events: auto;
  user-select: none;
}

body[data-dsh-wc-islands] .isl-rail::-webkit-scrollbar {
  width: 0;
  height: 0;
}

body[data-dsh-wc-islands] .isl-railBtn {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--isl-radius-md);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  touch-action: none;
  transition:
    background-color 0.12s var(--ds-ease-in-out),
    color 0.12s var(--ds-ease-in-out),
    opacity 0.12s var(--ds-ease-in-out);
}

body[data-dsh-wc-islands] .isl-railBtn:hover {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

/* The house is a pure navigation trigger (conversation / workspace drawer),
   not a destination in the panel model. It has no persistent selected state;
   hover keeps the standard rail feedback and a click paints a translucent
   ripple clipped to the rounded tile. */
body[data-dsh-wc-islands] .isl-railBtn[data-rail-id='workspace'] {
  position: relative;
  overflow: hidden;
}

body[data-dsh-wc-islands] .isl-railRipple {
  position: absolute;
  display: block;
  border-radius: 50%;
  background: currentColor;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0.2);
  animation: isl-rail-ripple 560ms cubic-bezier(0.2, 0.6, 0.3, 1) forwards;
  will-change: transform, opacity;
}

@keyframes isl-rail-ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.2;
  }

  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  body[data-dsh-wc-islands] .isl-railRipple {
    animation-duration: 1ms;
  }
}

body[data-dsh-wc-islands] .isl-railBtn.is-active {
  background: var(--isl-active);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-railBtn:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}

body[data-dsh-wc-islands] .isl-rail.is-dragging,
body[data-dsh-wc-islands] .isl-rail.is-dragging .isl-railBtn {
  cursor: grabbing;
}

body[data-dsh-wc-islands] .isl-railBtn.is-dragging {
  background: var(--isl-active);
  opacity: 0.45;
}

/* Floating copy of the dragged icon; follows the pointer at 90% opacity. */
body[data-dsh-wc-islands] .isl-railGhost {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1200;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-md);
  background: var(--isl-surface);
  box-shadow: var(--isl-shadow-float);
  color: var(--dsw-alias-label-primary);
  opacity: 0.9;
  pointer-events: none;
  will-change: transform;
}

body[data-dsh-wc-islands] .isl-railAdd {
  color: var(--dsw-alias-label-tertiary);
}

body[data-dsh-wc-islands] .isl-railDivider {
  flex: none;
  width: 24px;
  height: 1px;
  margin: 2px 0;
  background: var(--isl-border-soft);
}

/* ---- Rail management menu --------------------------------------------- */
body[data-dsh-wc-islands] .isl-railMenu {
  position: fixed;
  z-index: 35;
  box-sizing: border-box;
  width: 248px;
  max-height: min(60vh, 440px);
  padding: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-md);
  background: var(--isl-surface);
  box-shadow: var(--isl-shadow-float);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  user-select: none;
}

body[data-dsh-wc-islands] .isl-railMenuTitle {
  padding: 4px 8px 6px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}

body[data-dsh-wc-islands] .isl-railMenuRow {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 5px 8px;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-railMenuRow:hover,
body[data-dsh-wc-islands] .isl-railMenuRow.is-current {
  background: var(--isl-hover);
}

body[data-dsh-wc-islands] .isl-railMenuRow.is-hidden .isl-railMenuIcon,
body[data-dsh-wc-islands] .isl-railMenuRow.is-hidden .isl-railMenuText {
  opacity: 0.5;
}

body[data-dsh-wc-islands] .isl-railMenuIcon {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-secondary);
}

body[data-dsh-wc-islands] .isl-railMenuText {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1px;
  min-width: 0;
}

body[data-dsh-wc-islands] .isl-railMenuLabel {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-railMenuSub {
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-railMenuCheck {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  border: 1px solid var(--isl-border-soft);
  border-radius: 6px;
  color: transparent;
}

body[data-dsh-wc-islands] .isl-railMenuCheck.is-on {
  border-color: transparent;
  background: color-mix(in srgb, var(--isl-accent) 14%, transparent);
  color: var(--isl-accent);
}

body[data-dsh-wc-islands] .isl-railMenuHint {
  margin-top: 4px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--isl-border-soft);
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  line-height: 14px;
}

body[data-dsh-wc-islands] .isl-railMenuEmpty {
  padding: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* Settings gear pinned above the account avatar. */
body[data-dsh-wc-islands] .isl-railSettings {
  display: none;
}

body[data-dsh-wc-islands] .isl-railSettings {
  position: fixed;
  left: calc(var(--isl-gap) + (var(--isl-rail-width) - 36px) / 2);
  bottom: 56px;
  z-index: 26;
  display: grid;
  place-items: center;
}

/* Narrow desktop: the rail is the persistent navigation; the workspace is a
   drawer opened from its home button. Both the rail and its menus must sit
   above the drawer (71) and the drawer mask (70). */
@media (width <= 767px) {
  body[data-dsh-wc-islands] .isl-rail {
    z-index: 72;
  }

  body[data-dsh-wc-islands] .isl-railSettings {
    z-index: 72;
  }

  body[data-dsh-wc-islands] .isl-railMenu {
    z-index: 1100;
  }
}

/* ==========================================================================
   Islands UI · 17 desktop update
   One circular update entry above the settings gear. The skin owns the whole
   surface: the shipped indicator lives in the 36px settings row and overflows
   beside the account avatar, and it does not expose a phase attribute.

   The three busy patterns follow the open-source Dot Matrix loaders
   (dotmatrix.zzzzshawn.cloud): dotm-3x3-7, dotm-3x3-16 and dotm-3x3-6.
   ========================================================================== */

/* The native indicator (and its tiny toggle badge) would duplicate the rail
   button. Keep them out of the skin; a plain browser has neither anyway.
   0.2.2-rc.1 and rc.2 both use the G-tjAW hash. The update entry itself is a
   shell.overlay control, so it is independent of the flat/scroll sidebar
   variant and lives in the base sheet for every supported release. */
body[data-dsh-wc-islands] .G-tjAW_indicator,
body[data-dsh-wc-islands] .G-tjAW_badge {
  display: none !important;
}

body[data-dsh-wc-islands] {
  --isl-update-bg: #4176e6;
  --isl-update-bg-hover: #3264d4;
  --isl-update-danger: #d93a40;
}

body[data-dsh-wc-islands][data-ds-dark-theme] {
  --isl-update-danger: #ff6369;
}

body[data-dsh-wc-islands] .isl-updateButton {
  position: fixed;
  left: calc(var(--isl-gap) + (var(--isl-rail-width) - 36px) / 2);
  bottom: calc(56px + 36px + 8px);
  z-index: 26;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: var(--isl-update-bg);
  color: #fff;
  cursor: default;
  box-shadow:
    0 2px 6px -1px color-mix(in srgb, var(--isl-update-bg) 38%, transparent),
    0 8px 18px -10px color-mix(in srgb, var(--isl-update-bg) 62%, transparent);
  transition:
    background-color 0.15s var(--ds-ease-in-out),
    box-shadow 0.15s var(--ds-ease-in-out),
    transform 0.15s var(--ds-ease-in-out),
    border-color 0.15s var(--ds-ease-in-out);
}

body[data-dsh-wc-islands] .isl-updateButton.is-clickable {
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-updateButton.is-clickable:hover {
  background: var(--isl-update-bg-hover);
  transform: translateY(-1px);
  box-shadow:
    0 3px 8px -1px color-mix(in srgb, var(--isl-update-bg) 44%, transparent),
    0 10px 22px -10px color-mix(in srgb, var(--isl-update-bg) 72%, transparent);
}

body[data-dsh-wc-islands] .isl-updateButton.is-clickable:active {
  transform: translateY(0) scale(0.96);
}

body[data-dsh-wc-islands] .isl-updateButton:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--isl-update-bg) 40%, transparent);
  outline-offset: 2px;
}

body[data-dsh-wc-islands] .isl-updateButton.is-pending {
  opacity: 0.82;
}

/* Busy phases keep the circle but let the matrix carry the state. */
body[data-dsh-wc-islands] .isl-updateButton[aria-busy='true'] {
  cursor: default;
}

/* Error: a translucent danger surface, danger stroke, status dot and a retry
   glyph. The dot keeps the state readable without relying on color alone. */
body[data-dsh-wc-islands] .isl-updateButton.is-error {
  border-color: color-mix(in srgb, var(--isl-update-danger) 55%, transparent);
  background: color-mix(in srgb, var(--isl-update-danger) 14%, transparent);
  color: var(--isl-update-danger);
  box-shadow: none;
}

body[data-dsh-wc-islands] .isl-updateButton.is-error.is-clickable:hover {
  border-color: color-mix(in srgb, var(--isl-update-danger) 72%, transparent);
  background: color-mix(in srgb, var(--isl-update-danger) 22%, transparent);
  box-shadow: 0 2px 8px -4px color-mix(in srgb, var(--isl-update-danger) 55%, transparent);
}

body[data-dsh-wc-islands] .isl-updateButton.is-error:focus-visible {
  outline-color: color-mix(in srgb, var(--isl-update-danger) 55%, transparent);
}

/* Busy phases drop the circle entirely: the mosaic itself is the control,
   tinted with the user's accent so it belongs to the skin rather than to the
   shipped brand pill. */
body[data-dsh-wc-islands] .isl-updateButton.is-downloading,
body[data-dsh-wc-islands] .isl-updateButton.is-verifying,
body[data-dsh-wc-islands] .isl-updateButton.is-installing {
  border-color: transparent;
  background: transparent;
  color: var(--isl-accent);
  box-shadow: none;
}

body[data-dsh-wc-islands] .isl-updateErrorDot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--isl-update-danger);
  box-shadow: 0 0 0 2px var(--isl-surface);
}

/* ---- 3x3 dot matrix ------------------------------------------------------ */

body[data-dsh-wc-islands] .isl-dmx {
  display: grid;
  grid-template-columns: repeat(3, 5px);
  grid-template-rows: repeat(3, 5px);
  gap: 2.5px;
  width: 20px;
  height: 20px;
}

body[data-dsh-wc-islands] .isl-dmx-dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.14;
  will-change: opacity;
}

/* Column Flux (dotm-3x3-7): columns pulse left to right, all rows together.
   The three 400ms phases overlap, so at least one column stays lit while the
   busy button has no filled background behind it. */
body[data-dsh-wc-islands] .isl-dmx-column .isl-dmx-dot {
  animation: isl-dmx-column 1200ms cubic-bezier(0.42, 0, 0.58, 1) infinite;
  animation-delay: calc(var(--dmx-col) * 400ms);
}

/* Core Echo (dotm-3x3-6): Manhattan rings ripple out from the centre. */
body[data-dsh-wc-islands] .isl-dmx-ripple .isl-dmx-dot {
  animation: isl-dmx-ripple 1230ms ease-in-out infinite;
  animation-delay: calc(var(--dmx-ring) * 165ms);
}

/* Smiley Spin (dotm-3x3-16): the pixel glyph rotates in four 180ms phases.
   Each cell is lit for one or two phases; the first wraps across the cycle. */
body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot {
  animation-duration: 720ms;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.12;
}

body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot[data-span='1'] {
  animation-name: isl-dmx-spin-1;
}

body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot[data-span='2'] {
  animation-name: isl-dmx-spin-2;
}

body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot[data-span='wrap'] {
  animation-name: isl-dmx-spin-wrap;
}

@keyframes isl-dmx-column {
  0% {
    opacity: 0.14;
  }

  10% {
    opacity: 1;
  }

  40% {
    opacity: 0.14;
  }

  100% {
    opacity: 0.14;
  }
}

@keyframes isl-dmx-ripple {
  0%,
  100% {
    opacity: 0.08;
  }

  34% {
    opacity: 1;
  }

  60% {
    opacity: 0.22;
  }
}

@keyframes isl-dmx-spin-1 {
  0%,
  20% {
    opacity: 0.88;
  }

  25%,
  100% {
    opacity: 0.12;
  }
}

@keyframes isl-dmx-spin-2 {
  0%,
  45% {
    opacity: 0.88;
  }

  50%,
  100% {
    opacity: 0.12;
  }
}

@keyframes isl-dmx-spin-wrap {
  0%,
  20% {
    opacity: 0.88;
  }

  25%,
  70% {
    opacity: 0.12;
  }

  75%,
  100% {
    opacity: 0.88;
  }
}

/* Narrow desktop: the rail floats above the workspace drawer. */
@media (width <= 767px) {
  body[data-dsh-wc-islands] .isl-updateButton {
    z-index: 72;
  }
}

@media (prefers-reduced-motion: reduce) {
  body[data-dsh-wc-islands] .isl-updateButton {
    transition: none;
  }

  body[data-dsh-wc-islands] .isl-dmx-dot {
    animation: none !important;
  }

  body[data-dsh-wc-islands] .isl-dmx-column .isl-dmx-dot {
    opacity: 0.3;
  }

  body[data-dsh-wc-islands] .isl-dmx-column .isl-dmx-dot[data-col='1'] {
    opacity: 0.55;
  }

  body[data-dsh-wc-islands] .isl-dmx-column .isl-dmx-dot[data-col='2'] {
    opacity: 0.88;
  }

  body[data-dsh-wc-islands] .isl-dmx-ripple .isl-dmx-dot {
    opacity: 0.3;
  }

  body[data-dsh-wc-islands] .isl-dmx-ripple .isl-dmx-dot[data-ring='1'] {
    opacity: 0.55;
  }

  body[data-dsh-wc-islands] .isl-dmx-ripple .isl-dmx-dot[data-ring='0'] {
    opacity: 1;
  }

  body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot {
    opacity: 0.12;
  }

  body[data-dsh-wc-islands] .isl-dmx-smiley .isl-dmx-dot[data-on='1'] {
    opacity: 0.88;
  }
}

/* ---- Settings showcase --------------------------------------------------- */

body[data-dsh-wc-islands] .isl-updateShowcase {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  background: var(--dsw-alias-settings-card-fill);
}

body[data-dsh-wc-islands] .isl-updateShowcaseHead {
  margin-bottom: 14px;
}

body[data-dsh-wc-islands] .isl-updateShowcaseTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

body[data-dsh-wc-islands] .isl-updateShowcaseDesc {
  margin-top: 3px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

body[data-dsh-wc-islands] .isl-updateShowcaseGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
  gap: 14px 8px;
}

body[data-dsh-wc-islands] .isl-updateShowcaseItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
  text-align: center;
}

body[data-dsh-wc-islands] .isl-updateShowcaseStage {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  background: var(--isl-surface);
}

body[data-dsh-wc-islands] .isl-updateShowcase .isl-updateButton.is-preview {
  position: relative;
  left: auto;
  bottom: auto;
  z-index: auto;
  transform: none;
  cursor: default;
}

body[data-dsh-wc-islands] .isl-updateShowcaseLabel {
  color: var(--dsw-alias-label-primary);
  font-size: 12px;
  line-height: 16px;
}

body[data-dsh-wc-islands] .isl-updateShowcasePhase {
  color: var(--dsw-alias-label-tertiary);
  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 10px;
  line-height: 14px;
}

/* ==========================================================================
   Islands UI · 20 sidebar
   The expanded sidebar is one full-height island: a persistent icon rail on
   the left and the workspace browser on the same surface. The island spans the
   exact same top and bottom edges as the conversation island. Collapsed mode
   keeps the shipped rail untouched.
   ========================================================================== */

body[data-dsh-wc-islands] .kB3qhq_root {
  background: transparent;
}

/* ---- Expanded: chrome rail + workspace island --------------------------- */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) {
  display: grid;
  grid-template-columns: var(--isl-rail-width) minmax(0, 1fr);
  grid-template-rows: var(--isl-gap) auto minmax(0, 1fr) auto;
  column-gap: var(--isl-gap);
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  position: relative;
  isolation: isolate;
}

/* The workspace browser is the sidebar's only island. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed)::after {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 0 0 calc(var(--isl-rail-width) + var(--isl-gap));
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  box-shadow: var(--isl-shadow-island);
  pointer-events: none;
}

/* The top band is a small breathing gap inside the sidebar column. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_topStrip {
  grid-area: 1 / 1 / 2 / -1;
  height: 100%;
  margin: 0;
  padding: 0 4px 0 0;
  justify-content: flex-end;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_logoRow {
  grid-area: 2 / 1;
  height: 36px;
  margin: 0 0 6px;
  padding: 0;
  justify-content: center;
  overflow: visible;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_brand {
  justify-content: center;
  overflow: visible;
}

/* The brand wordmark and build stamp belong to window chrome, not the rail. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_brandName,
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_localBuildBrand {
  display: none;
}

body[data-dsh-wc-islands] .kB3qhq_brandMark {
  width: 28px;
  height: 28px;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession {
  grid-area: 2 / 2;
  height: 36px;
  margin: 0 6px 6px;
  padding: 0 8px;
  justify-content: flex-start;
  border: 0;
  border-radius: var(--isl-radius-md);
  background: transparent;
  box-shadow: none;
  color: var(--dsw-alias-label-primary);
  font-weight: 400;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSessionContent {
  justify-content: flex-start;
  width: 100%;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession:hover {
  background: var(--isl-hover);
}

/* The global panel list becomes the rail's primary navigation. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList {
  grid-area: 3 / 1;
  align-self: start;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow {
  width: 36px;
  height: 36px;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--isl-radius-md);
  background-clip: border-box;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelRow.kB3qhq_panelActive {
  background: var(--dsw-specific-sidebar-nav-item-active-accent);
  color: var(--dsw-alias-state-business-primary);
}

/* The label leaves the visual rail but stays in the accessibility tree. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelTitle {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  overflow: hidden;
}

/* ---- Workspace browser: same surface, full height ----------------------- */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_regionArea {
  grid-area: 3 / 2 / 5 / 3;
  margin: 0;
  padding: 0 4px 6px;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
}

body[data-dsh-wc-islands] .kB3qhq_regionArea {
  --dsh-session-list-edge-inset: 4px;
}

body[data-dsh-wc-islands] .Kjh-qa_sectionHeader {
  padding-inline: 8px;
  margin-right: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  letter-spacing: 0.01em;
}

body[data-dsh-wc-islands] .Kjh-qa_sectionLabel {
  font-weight: 500;
}

body[data-dsh-wc-islands] .Kjh-qa_list {
  padding-bottom: 8px;
}

body[data-dsh-wc-islands] .Kjh-qa_fade {
  background: linear-gradient(to bottom, transparent, var(--isl-surface));
}

body[data-dsh-wc-islands] .JoiKIa_sessionRow,
body[data-dsh-wc-islands] .JoiKIa_projectRow {
  border-radius: var(--isl-radius-sm);
  padding-inline: 8px;
}

/* ---- Rail foot: settings gear ------------------------------------------ */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea {
  grid-area: 4 / 1;
  align-items: center;
  margin-top: 6px;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_settingsArea,
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footerActions {
  width: auto;
  align-items: center;
  justify-content: center;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) ._77Pn0W_triggerRow {
  width: 36px;
  margin: 4px 0 2px;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) ._77Pn0W_trigger {
  flex: none;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  justify-content: center;
  border-inline: 0;
  border-radius: var(--isl-radius-md);
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) ._77Pn0W_triggerLabel {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  overflow: hidden;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) ._77Pn0W_trigger:hover,
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) ._77Pn0W_trigger[aria-expanded='true'] {
  background: var(--isl-hover);
}

/* Footer actions contributed next to Settings (account launcher, etc.). */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footerActions button {
  width: 36px;
  height: 36px;
  border-radius: var(--isl-radius-md);
}

/* ---- Collapsed rail ------------------------------------------------------ */
/* Collapsing hides the workspace browser only; the rail keeps its own island. */
body[data-dsh-wc-islands] .kB3qhq_root.kB3qhq_collapsed {
  /* The rail is chrome, not an island: it sits directly on the ocean. */
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 8px 10px 6px;
  overflow: hidden;
}

body[data-dsh-wc-islands] .kB3qhq_root.kB3qhq_collapsed .kB3qhq_topStrip {
  height: 36px;
  margin: 0;
  padding: 0;
  justify-content: center;
}

body[data-dsh-wc-islands] .kB3qhq_collapsed .kB3qhq_newSession {
  border-radius: var(--isl-radius-md);
}

/* The window top bar / rail own the collapse controls; the in-island toggle
   would duplicate them at every width. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_toggle {
  display: none;
}

@media (min-width: 768px) {
  /* On macOS the shipped frame gives a collapsed sidebar zero width, hiding
     the rail too. Restore one rail-wide track (right panel still closed). */
  [data-platform='darwin'] body[data-dsh-wc-islands] .PIRFFq_frame[data-sidebar-collapsed][data-rightbar-collapsed] {
    grid-template-columns: var(--isl-rail-collapsed-width) minmax(0, 1fr) 0 !important;
  }

  /* The rail itself is the expand control; do not reserve header space for the
     floating seat and do not show a second expand button over the island. */
  [data-platform='darwin'] body[data-dsh-wc-islands] .PIRFFq_frame[data-sidebar-collapsed] {
    --dsh-frame-leading-clearance: 0px;
  }
}

/* The window chrome and the rail own the sidebar controls; the floating seat
   is redundant (and at narrow widths would sit under the traffic lights). */
body[data-dsh-wc-islands] .PIRFFq_leadingSeat {
  display: none;
}

/* ---- Search / section chrome inside the island --------------------------- */
body[data-dsh-wc-islands] .Kjh-qa_searchExpanded {
  border-color: var(--isl-border-soft);
  background: var(--isl-surface-muted);
  border-radius: var(--isl-radius-sm);
}

body[data-dsh-wc-islands] .Kjh-qa_searchExpanded .Kjh-qa_searchButton:hover {
  background: transparent;
}

/* ---- Narrow drawer ------------------------------------------------------- */
/* Below the top bar's breakpoint the workspace becomes an overlay drawer. It
   starts at the frame's content top (below the top bar and its 5px gap) and
   leaves the window's 5px canvas margin on the left; the workspace card inside
   keeps the right/bottom 5px so the drawer still reads as an island. */
body[data-dsh-wc-islands] .PIRFFq_frame[data-sidebar-drawer] .PIRFFq_sidebarCol {
  top: calc(var(--isl-chrome-top) + var(--isl-topbar-height) + var(--isl-gap));
  bottom: 0;
  left: var(--isl-gap);
  background: var(--isl-canvas);
  border-right: 0;
  box-shadow: var(--isl-shadow-float);
}

body[data-dsh-wc-islands] .PIRFFq_frame[data-sidebar-drawer] .kB3qhq_root::after {
  inset: 0 var(--isl-gap) var(--isl-gap) calc(var(--isl-rail-width) + var(--isl-gap));
}

/* The sidebar's grid track is zero in drawer mode, but its column gap remains;
   shift the conversation island right by the persistent rail so the closed
   drawer leaves the rail visible and the island keeps its 5px gap. */
body[data-dsh-wc-islands] .PIRFFq_frame[data-sidebar-drawer] .PIRFFq_centerCol {
  margin-left: var(--isl-rail-width);
}

/* ---- Account launcher (settings.launcher) --------------------------------
   In this build the sidebar foot is the account menu rather than the bare
   settings gear, so the same rail geometry applies to its trigger. */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_root {
  flex: none;
  width: 36px;
  margin-inline: 0;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_anchor {
  width: 36px;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_trigger,
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_trigger[data-signed-out='false']:not([data-collapsed='true']),
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_trigger[data-signed-out='true']:not([data-collapsed='true']) {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
  border-inline: 0;
  border-radius: var(--isl-radius-md);
  background-clip: border-box;
}

body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_footArea .hjANda_label {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  overflow: hidden;
}

/* ---- Independent workspace collapse ------------------------------------- */
/* Hide the workspace island only; the rail keeps its expanded-layout DOM and
   position, so nothing in the left column is re-rendered by the toggle. */
body[data-dsh-wc-islands][data-dsh-wc-islands-workspace] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_newSession,
body[data-dsh-wc-islands][data-dsh-wc-islands-workspace] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_regionArea,
body[data-dsh-wc-islands][data-dsh-wc-islands-workspace] .kB3qhq_root:not(.kB3qhq_collapsed)::after {
  display: none !important;
}

/* ---- Custom rail replaces the shipped brand + panel icon column ---------- */
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_logoRow,
body[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) .kB3qhq_panelList {
  display: none !important;
}

/* ---- Aggregate pinned sessions ------------------------------------------ */
.isl-pinnedHost {
  display: block;
  flex: none;
}

.isl-pinned {
  display: none;
  padding: 2px 4px 0;
}

body[data-dsh-wc-islands] .isl-pinned {
  display: block;
}

/* Pinned rows stay in place in their workspace groups and are also collected
   in the aggregate block above. The original row keeps a subtle tint. */
body[data-dsh-wc-islands] .JoiKIa_pinIndicator {
  color: var(--dsw-alias-state-business-primary);
}

body[data-dsh-wc-islands] .JoiKIa_sessionRow:has(.JoiKIa_pinIndicator) {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 6%, transparent);
}

body[data-dsh-wc-islands] .JoiKIa_sessionRow:has(.JoiKIa_pinIndicator):hover {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);
}

.isl-pinnedHead {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 32px;
  padding: 0 6px;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}

/* Collapsible header mirrors the quiet workspace section header: colour only. */
.isl-pinnedHead:hover {
  background: transparent;
  color: var(--dsw-alias-label-primary);
}

.isl-pinnedChevron {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  transform: rotate(-90deg);
  transition: transform 0.12s var(--ds-ease-in-out);
}

.isl-pinned[data-open] .isl-pinnedChevron {
  transform: rotate(0deg);
}

.isl-pinnedTitle {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.isl-pinnedCount {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 400;
}

.isl-pinnedList {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 1px 0 3px;
}

.isl-pinnedRow {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 32px;
  padding: 0 8px 0 34px;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
}

.isl-pinnedRow:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.isl-pinnedName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Hover marquee: clip the ellipsis, fade both edges as the title crawls. */
.isl-pinnedRow:hover .isl-pinnedName {
  text-overflow: clip;
}

.isl-pinnedRow .isl-pinnedName[data-scrolled] {
  mask-image: linear-gradient(90deg, #0000, #000 12px);
}

.isl-pinnedRow .isl-pinnedName[data-clipped] {
  mask-image: linear-gradient(270deg, #0000, #000 12px);
}

.isl-pinnedRow .isl-pinnedName[data-scrolled][data-clipped] {
  mask-image: linear-gradient(90deg, #0000, #000 12px calc(100% - 12px), #0000);
}

.isl-pinnedRow:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}

.isl-pinnedPinBtn,
.isl-pinnedLocate {
  display: none;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin-left: 4px;
  padding: 0;
  border: 0;
  border-radius: var(--isl-radius-xs, 6px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition:
    background-color 0.12s var(--ds-ease-in-out),
    color 0.12s var(--ds-ease-in-out);
}

.isl-pinnedRow:hover .isl-pinnedPinBtn,
.isl-pinnedRow:focus-within .isl-pinnedPinBtn,
.isl-pinnedPinBtn:focus-visible,
.isl-pinnedRow:hover .isl-pinnedLocate,
.isl-pinnedRow:focus-within .isl-pinnedLocate,
.isl-pinnedLocate:focus-visible {
  display: grid;
}

.isl-pinnedPinBtn:hover,
.isl-pinnedLocate:hover {
  background: transparent;
  color: var(--dsw-alias-label-primary);
}

.isl-pinnedPinBtn:focus-visible,
.isl-pinnedLocate:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}

/* Brief highlight on the session the locate action focuses. */
body[data-dsh-wc-islands] .JoiKIa_sessionRow.isl-located {
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent) !important;
}

/* ==========================================================================
   Islands UI · 30 conversation & composer
   ========================================================================== */

body[data-dsh-wc-islands] .kiGsTW_root {
  background: transparent;
}

body[data-dsh-wc-islands] .kiGsTW_header {
  border-bottom-color: var(--isl-border-soft);
}

body[data-dsh-wc-islands] .kiGsTW_headerBlank {
  border-bottom-color: transparent;
}

body[data-dsh-wc-islands] .kiGsTW_scrollBody {
  margin-right: 0;
}

/* Composer: the one element that should visibly float above the island. */
body[data-dsh-wc-islands] .JZLxKW_card {
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  box-shadow: none;
}

body[data-dsh-wc-islands] .JZLxKW_cardWorkspaceTrigger:after {
  border-radius: var(--dsw-radius-panel);
  color: var(--isl-border-strong);
}

body[data-dsh-wc-islands] .JZLxKW_notice {
  border-radius: var(--isl-radius-md);
  background: var(--isl-surface-muted);
}

/* Sticky composer seat fades into the island surface, not into a raw token. */
body[data-dsh-wc-islands] .kiGsTW_root[data-phase='active'] .kiGsTW_composerSeat,
body[data-dsh-wc-islands] .kiGsTW_embeddedBody[data-content-phase='active'] .kiGsTW_composerSeat {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--isl-surface) 0%, transparent) 0px,
    var(--isl-surface) 36px
  );
}

/* Hero: a calmer, slightly tighter headline on the open island. */
body[data-dsh-wc-islands] ._8tPydW_headline {
  letter-spacing: -0.01em;
}

body[data-dsh-wc-islands] ._8tPydW_workspace {
  border-radius: 999px;
  background: var(--isl-surface-muted);
}

body[data-dsh-wc-islands] ._8tPydW_workspace:hover {
  background: var(--isl-hover);
}

/* Tool / turn cards keep their own hierarchy but gain island hairlines. */
body[data-dsh-wc-islands] .CuF05a_root {
  border-color: var(--isl-border-soft);
  background: var(--isl-surface-muted);
}

body[data-dsh-wc-islands] .CuF05a_root:hover {
  background: var(--isl-surface-sunken);
}

/* Header chips and breadcrumbs. */
body[data-dsh-wc-islands] .kiGsTW_crumb {
  border-radius: var(--isl-radius-sm);
}

/* View tabs sit on the island as a quiet segmented row. */
body[data-dsh-wc-islands] .kiGsTW_viewTabs {
  gap: 22px;
}

body[data-dsh-wc-islands] .kiGsTW_tabActive:after {
  border-radius: 999px;
  height: 2px;
}

/* ==========================================================================
   Header utilities live in the window bar
   The three trailing controls (session tools, side panel, right panel) leave
   the conversation island and dock at the bar's right edge, vertically aligned
   with the workspace toggle on the left.
   ========================================================================== */
@media (min-width: 768px) {
  body[data-dsh-wc-islands] .kiGsTW_headerUtilities {
    position: fixed;
    top: calc(var(--isl-chrome-top) + 10px);
    right: 41px; /* frame gap 5 + corner 28 + gap 8 */
    z-index: 31;
    height: 28px;
    margin: 0;
    align-items: center;
  }

  body[data-dsh-wc-islands] .kiGsTW_headerCorner {
    position: fixed;
    top: calc(var(--isl-chrome-top) + 10px);
    right: var(--isl-gap);
    z-index: 31;
    height: 28px;
    margin: 0;
    align-items: center;
  }
}

/* ==========================================================================
   Always-visible right sidebar toggle
   The native header button unmounts while the panel is open and the panel
   carries its own collapse control. The top bar owns one persistent toggle
   instead, and closes through the native collapse action. It applies at every
   width: the narrow top bar keeps the same control.
   ========================================================================== */
/* Body-portaled (see RightPanelToggle): keep it out of the DOM flow while the
   skin is off, so the base rule cannot leak a raw button into the page. */
.isl-rightToggle {
  display: none;
}

/* z-index 900: above the workbench panel host (dsh-better-sidebar: host 25,
   dock 40, float 60, floating window 90) and the app's transient tooltip/
   hovercard layer (100), below menus and dialogs (1000+). The button is
   portaled to <body>, so this value competes with the body-level layers
   directly instead of being trapped in the frame's z-index-20 overlay layer. */
body[data-dsh-wc-islands] .isl-rightToggle {
  position: fixed;
  top: calc(var(--isl-chrome-top) + 10px);
  right: var(--isl-gap);
  z-index: 900;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  pointer-events: auto;
  -webkit-app-region: no-drag;
}

body[data-dsh-wc-islands] .isl-rightToggle:hover,
body[data-dsh-wc-islands] .isl-rightToggle[aria-pressed='true'] {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-rightToggle:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: -2px;
}

/* The top bar owns open and close; the island's own expand/collapse
   controls would duplicate it. */
body[data-dsh-wc-islands] [data-sidebar-right-expand] {
  /* Keep the native expand button's box in the layout even though the top
     bar's toggle paints over it. Other header plugins anchor to this
     button's rect (dsh-better-sidebar's blank-session dock fallback does),
     and \`display: none\` collapses that rect to 0x0, sending them to the
     top-left corner where they collide with the workspace toggle. */
  visibility: hidden !important;
  pointer-events: none !important;
}

body[data-dsh-wc-islands] [data-sidebar-right-toggle],
/* dsh-sidenote's own "侧边" header entry is covered by the toggle above. */
body[data-dsh-wc-islands] ._5KEEsG_headerSide {
  display: none !important;
}

/* ==========================================================================
   Islands UI · 40 settings (and shared dialog surfaces)
   The settings window is an island; its navigation is a recessed island.
   ========================================================================== */

body[data-dsh-wc-islands] ._77Pn0W_overlay {
  background: transparent;
}

body[data-dsh-wc-islands] ._77Pn0W_mask {
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur);
}

body[data-dsh-wc-islands] ._77Pn0W_panel {
  width: 860px;
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
  border-radius: 24px;
  box-shadow: var(--isl-shadow-float);
  padding: 10px;
  gap: 8px;
  grid-template-columns: 188px minmax(0, 1fr);
}

body[data-dsh-wc-islands] ._77Pn0W_navTitle {
  padding: 8px 8px 6px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* The navigation mirrors the workspace list: no recessed panel, quiet rows. */
body[data-dsh-wc-islands] ._77Pn0W_nav {
  padding: 4px;
  background: transparent;
  border: 0;
  border-radius: 0;
}

body[data-dsh-wc-islands] ._77Pn0W_navList {
  gap: 2px;
}

body[data-dsh-wc-islands] ._77Pn0W_navCell {
  height: 32px;
  padding: 6px 8px;
  border-radius: var(--isl-radius-sm);
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 18px;
  gap: 8px;
}

body[data-dsh-wc-islands] ._77Pn0W_navCell:hover {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] ._77Pn0W_navCell._77Pn0W_active {
  background: var(--isl-active);
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
  box-shadow: none;
}

body[data-dsh-wc-islands] ._77Pn0W_navIcon {
  width: 16px;
  height: 16px;
}

body[data-dsh-wc-islands] ._77Pn0W_navIcon svg {
  width: 100%;
  height: 100%;
}

body[data-dsh-wc-islands] ._77Pn0W_header {
  height: 48px;
  padding: 6px 6px 0 8px;
}

body[data-dsh-wc-islands] ._77Pn0W_options {
  padding: 0 8px 16px;
  background: transparent;
}

body[data-dsh-wc-islands] ._77Pn0W_close {
  border-radius: var(--isl-radius-sm);
}

/* Cards stay white; separation comes from hairlines, not fills. */
body[data-dsh-wc-islands] ._77Pn0W_options [class*='_card'] {
  border-radius: var(--isl-radius-lg);
  background: var(--isl-surface);
  border-color: var(--isl-border-soft);
}

body[data-dsh-wc-islands] ._77Pn0W_options [class*='_section'] {
  border-radius: var(--isl-radius-md);
  background: transparent;
}

/* The general-page rows keep their separators but at island quietness. */
body[data-dsh-wc-islands] [data-slot='settings.general.item'] > * {
  border-bottom-color: var(--isl-border-soft);
}

body[data-dsh-wc-islands] [data-slot='settings.general.item']:last-child > * {
  border-bottom: 0;
}

/* Dialogs opened from settings (confirmations, pickers). */
body[data-dsh-wc-islands] [role='dialog'] {
  border-radius: var(--isl-radius-xl);
}

/* Account page hero cards. */
body[data-dsh-wc-islands] .XGmX4q_card {
  border-radius: var(--isl-radius-lg);
  background: var(--isl-surface);
  border: 1px solid var(--isl-border-soft);
}

body[data-dsh-wc-islands] ._7lc4_a_balanceCard {
  border-radius: var(--isl-radius-lg);
  border: 1px solid var(--isl-border-soft);
  background: var(--isl-surface);
}

/* ==========================================================================
   Islands UI · 45 composer model picker
   Trigger chip + model list + reasoning slider, in the Islands language.
   ========================================================================== */

body[data-dsh-wc-islands] .isl-model {
  position: relative;
  min-width: 0;
}

body[data-dsh-wc-islands] .isl-modelTrigger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 260px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--isl-surface-muted);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  transition: background-color 0.12s var(--ds-ease-in-out);
}

body[data-dsh-wc-islands] .isl-modelTrigger:hover:not(:disabled) {
  background: var(--isl-surface-sunken);
}

body[data-dsh-wc-islands] .isl-modelTrigger:disabled {
  opacity: 0.55;
  cursor: default;
}

body[data-dsh-wc-islands] .isl-modelTrigger:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}

body[data-dsh-wc-islands] .isl-modelIcon {
  display: var(--dsh-composer-model-icon-display, none);
  flex: none;
  color: var(--dsw-alias-label-secondary);
}

body[data-dsh-wc-islands] .isl-modelName {
  display: var(--dsh-composer-model-text-display, inline);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-modelEffort {
  display: var(--dsh-composer-model-text-display, inline);
  flex-shrink: 1000;
  min-width: 0;
  color: var(--dsw-alias-label-caption);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-modelChevron {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-caption);
  transition: transform 0.12s var(--ds-ease-in-out);
}

body[data-dsh-wc-islands] .isl-modelChevron.is-open {
  transform: rotate(180deg);
}

/* ---- Menu ---------------------------------------------------------------- */
body[data-dsh-wc-islands] .isl-modelMenu {
  position: fixed;
  z-index: 1100;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: min(460px, calc(100vh - 24px));
  padding: 6px;
  border: 1px solid var(--isl-border-soft);
  border-radius: var(--isl-radius-lg);
  background: var(--isl-surface);
  box-shadow: var(--isl-shadow-float);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
  overflow-y: auto;
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}

body[data-dsh-wc-islands] .isl-modelPaneHead {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px 6px;
}

body[data-dsh-wc-islands] .isl-modelMenuTitle {
  padding: 2px 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}

body[data-dsh-wc-islands] .isl-modelBack {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-modelBack:hover {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-modelBackIcon {
  display: inline-flex;
  transform: rotate(90deg);
}

body[data-dsh-wc-islands] .isl-modelGroups {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

body[data-dsh-wc-islands] .isl-modelGroup + .isl-modelGroup {
  margin-top: 6px;
}

body[data-dsh-wc-islands] .isl-modelGroupName {
  padding: 6px 8px 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}

body[data-dsh-wc-islands] .isl-modelOption {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--isl-radius-md);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-modelOption:hover {
  background: var(--isl-hover);
}

body[data-dsh-wc-islands] .isl-modelOption.is-selected {
  background: var(--isl-surface-muted);
}

body[data-dsh-wc-islands] .isl-modelOptionName {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-modelCheck {
  display: inline-flex;
  flex: none;
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-modelEmpty {
  padding: 10px 8px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}

/* ---- Reasoning effort ---------------------------------------------------- */
body[data-dsh-wc-islands] .isl-effortPopup {
  position: relative;
  padding: 9px 10px 8px;
  text-align: center;
}

body[data-dsh-wc-islands] .isl-effortReset {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-effortReset:hover:not(:disabled) {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-primary);
}

body[data-dsh-wc-islands] .isl-effortReset:disabled {
  opacity: 0.4;
  cursor: default;
}

body[data-dsh-wc-islands] .isl-effortName {
  color: var(--dsw-alias-state-business-primary);
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

body[data-dsh-wc-islands] .isl-effortModel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  margin-top: 1px;
  padding: 1px 6px;
  border: 0;
  border-radius: var(--isl-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-effortModel:hover {
  background: var(--isl-hover);
  color: var(--dsw-alias-label-secondary);
}

body[data-dsh-wc-islands] .isl-effortModelName {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body[data-dsh-wc-islands] .isl-effortModelChevron {
  display: inline-flex;
  flex: none;
  color: inherit;
  transform: rotate(-90deg);
}

body[data-dsh-wc-islands] .isl-effortSliderWrap {
  position: relative;
  margin: 7px 2px 0;
}

body[data-dsh-wc-islands] .isl-effortSlider {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: 24px;
  margin: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

body[data-dsh-wc-islands] .isl-effortSlider::-webkit-slider-runnable-track {
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--dsw-alias-state-business-primary) 0
      calc(12px + (100% - 24px) * var(--isl-ratio, 0)),
    var(--isl-surface-sunken) calc(12px + (100% - 24px) * var(--isl-ratio, 0)) 100%
  );
}

body[data-dsh-wc-islands] .isl-effortSlider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  margin-top: -2px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 1px 4px rgba(17, 24, 39, 0.22),
    0 0 0 0.5px rgba(17, 24, 39, 0.06);
}

body[data-dsh-wc-islands] .isl-effortSlider:focus-visible {
  outline: none;
}

body[data-dsh-wc-islands] .isl-effortSlider:focus-visible::-webkit-slider-thumb {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 26%, transparent),
    0 1px 4px rgba(17, 24, 39, 0.22);
}

body[data-dsh-wc-islands] .isl-effortDots {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  pointer-events: none;
}

body[data-dsh-wc-islands] .isl-effortDot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--isl-border-strong);
}

body[data-dsh-wc-islands] .isl-effortDot.is-filled {
  background: rgba(255, 255, 255, 0.55);
}

body[data-dsh-wc-islands] .isl-modelError {
  margin: 8px 8px 2px;
  padding: 6px 8px;
  border-radius: var(--isl-radius-sm);
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px;
  line-height: 16px;
}

/* ==========================================================================
   Islands UI · 50 shared components
   Small, reusable pieces used by the skin's own surfaces. All values come from
   the token layer, so nothing here is page-specific.
   ========================================================================== */

/* ---- Preference row (rendered into settings.general.item) ---------------- */
body[data-dsh-wc-islands] .isl-prefRow,
.isl-prefRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 20px;
}

body[data-dsh-wc-islands] .isl-prefRow:last-child,
.isl-prefRow:last-child {
  border-bottom: 0;
}

.isl-prefText {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.isl-prefTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 20px;
}

.isl-prefDesc {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

/* ---- Switch -------------------------------------------------------------- */
.isl-switch {
  position: relative;
  flex: none;
  width: 38px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background: var(--dsw-alias-bg-layer-3);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l2);
  transition: background-color 0.15s var(--ds-ease-in-out);
}

.isl-switch[aria-checked='true'] {
  background: var(--dsw-alias-state-business-primary);
  box-shadow: none;
}

.isl-switch:focus-visible {
  outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}

.isl-switchThumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.25);
  transition: transform 0.15s var(--ds-ease-in-out);
}

.isl-switch[aria-checked='true'] .isl-switchThumb {
  transform: translateX(16px);
}

@media (prefers-reduced-motion: reduce) {
  .isl-switch,
  .isl-switchThumb {
    transition: none;
  }
}

/* ---- Popover / menu materials ------------------------------------------- */
body[data-dsh-wc-islands] [data-menu-material] {
  border-radius: var(--isl-radius-lg);
  border: 1px solid var(--isl-border-soft);
  box-shadow: var(--isl-shadow-float);
}

body[data-dsh-wc-islands] [role='dialog'],
body[data-dsh-wc-islands] [role='menu'],
body[data-dsh-wc-islands] [role='listbox'] {
  border-radius: var(--isl-radius-lg);
}

/* ---- Scrollbars ---------------------------------------------------------- */
body[data-dsh-wc-islands] ::-webkit-scrollbar-thumb {
  border-radius: 999px;
}

/* ---- Focus --------------------------------------------------------------- */
body[data-dsh-wc-islands] :focus-visible {
  outline-offset: 1px;
}

/* ---- Dedicated settings page ------------------------------------------- */
.isl-settingsPage {
  box-sizing: border-box;
  max-width: 760px;
  padding: 4px 8px 24px;
}

.isl-settingsPageHead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.isl-settingsPageLogo {
  display: inline-flex;
  flex: none;
}

.isl-settingsPageHeadText {
  min-width: 0;
}

.isl-settingsPageTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
}

.isl-settingsPageDesc {
  margin-top: 4px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 18px;
}

.isl-settingsPage .isl-prefRow:first-of-type {
  margin-top: 12px;
}

/* Detected DSH release + sidebar dialect: diagnosis for support reports. */
.isl-settingsMeta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 16px;
}

.isl-settingsMetaValue {
  padding: 0 5px;
  border-radius: 4px;
  background: var(--isl-surface-muted);
  color: var(--dsw-alias-label-secondary);
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 11px;
}

.isl-settingsMetaSeparator {
  opacity: 0.6;
}

.isl-accentPicker {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.isl-accentSwatch {
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 50%;
  background-clip: padding-box;
  cursor: pointer;
  transition:
    transform 0.12s var(--ds-ease-in-out),
    box-shadow 0.12s var(--ds-ease-in-out);
}

.isl-accentSwatch:hover {
  transform: scale(1.08);
}

.isl-accentSwatch.is-selected {
  box-shadow:
    0 0 0 2px var(--dsw-alias-bg-base),
    0 0 0 3.5px var(--dsw-alias-label-primary);
}

.isl-accentSwatch.is-default {
  background: linear-gradient(135deg, #ffffff 0 47%, #c4c8ce 47% 53%, #1b1c1f 53% 100%);
}

.isl-accentCustom {
  position: relative;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px dashed var(--dsw-alias-border-l3);
  border-radius: 50%;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}

.isl-accentCustom::before {
  content: '+';
  font-size: 14px;
  line-height: 1;
}

.isl-accentCustom input {
  position: absolute;
  inset: -4px;
  width: 32px;
  height: 32px;
  opacity: 0;
  cursor: pointer;
}


/* ---- Compatibility notice ------------------------------------------------
   Rendered while the skin is OFF, so nothing here may rely on the \`--isl-*\`
   scale or on \`body[data-dsh-wc-islands]\`. Every custom property carries a
   fallback and every color comes from the public DSH theme tokens. */

.isl-compatToast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2000;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: min(380px, calc(100vw - 32px));
  padding: 12px 10px 12px 14px;
  border: 1px solid rgba(224, 160, 24, 0.5);
  border-left: 3px solid #e0a018;
  border-radius: var(--isl-radius-lg, 16px);
  background: var(--dsw-alias-bg-overlay, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2328);
  box-shadow: 0 14px 36px -14px rgba(0, 0, 0, 0.35);
  font-size: 13px;
  line-height: 19px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.isl-compatToast.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .isl-compatToast {
    transition: none;
  }
}

.isl-compatToastBody {
  flex: 1;
  min-width: 0;
}

.isl-compatToastTitle {
  font-weight: 600;
}

.isl-compatToastText {
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary, #555b63);
  font-size: 12px;
  line-height: 18px;
}

.isl-compatToastAction {
  margin-top: 6px;
  color: #a86b00;
  font-size: 12px;
  font-weight: 600;
}

.isl-compatToastClose {
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #737a82);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.isl-compatToastClose:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(17, 24, 39, 0.06));
  color: var(--dsw-alias-label-primary, #1f2328);
}

/* The settings-page warning bar. */
.isl-compatBanner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 12px 0 4px;
  padding: 12px 14px;
  border: 1px solid rgba(224, 160, 24, 0.45);
  border-radius: var(--isl-radius-lg, 16px);
  background: rgba(240, 180, 41, 0.14);
  background: color-mix(in srgb, #f0b429 14%, transparent);
  color: var(--dsw-alias-label-primary, #1f2328);
  font-size: 13px;
  line-height: 20px;
}

.isl-compatBannerIcon {
  flex: none;
  display: inline-flex;
  margin-top: 1px;
  color: #b47400;
}

.isl-compatBannerText {
  flex: 1;
  min-width: 0;
}

.isl-compatBannerTitle {
  font-weight: 600;
}

.isl-compatBannerBody,
.isl-compatBannerHint {
  margin-top: 2px;
  color: var(--dsw-alias-label-secondary, #555b63);
  font-size: 12px;
  line-height: 18px;
}

.isl-compatBannerHint {
  margin-top: 6px;
}

.isl-compatBannerList {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  color: var(--dsw-alias-label-secondary, #555b63);
  font-size: 12px;
}

.isl-compatAnchor {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(17, 24, 39, 0.06);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}

.isl-compatBannerAction {
  flex: none;
  align-self: flex-start;
  padding: 5px 10px;
  border: 1px solid rgba(224, 160, 24, 0.5);
  border-radius: 8px;
  background: transparent;
  color: #8a5a00;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.isl-compatBannerAction:hover {
  background: rgba(240, 180, 41, 0.18);
}

.isl-compatForced {
  margin: 8px 0 0;
  color: var(--dsw-alias-label-tertiary, #737a82);
  font-size: 12px;
  line-height: 18px;
}

.isl-switch:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* The notice renders while the skin is off, so darkness is read straight from
   the host theme attribute its own stylesheet uses. */
body[data-ds-dark-theme] .isl-compatBannerIcon {
  color: #e8b451;
}

body[data-ds-dark-theme] .isl-compatBannerAction {
  border-color: rgba(240, 180, 41, 0.45);
  color: #f2c879;
}

body[data-ds-dark-theme] .isl-compatBannerAction:hover {
  background: rgba(240, 180, 41, 0.16);
}

body[data-ds-dark-theme] .isl-compatAnchor {
  background: rgba(255, 255, 255, 0.08);
}

body[data-ds-dark-theme] .isl-compatToastAction {
  color: #f0c274;
}

/* ==========================================================================
   sone-wx × 浮岛结构层：本插件自己的接线
   结构层来自 dsh-islands-ui，这里只写「把它接回微信皮肤」的少量覆盖，
   与移植文件分开放，便于日后跟上游对比。
   ========================================================================== */

/* 侧栏岛：结构层用伪元素画左侧工作区岛，底色跟随会话底色，与其它岛一致。 */
body.dsh-wechat-skin-on[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed)::after {
	background: var(--isl-surface);
}

/* 结构层的设置分区与我们并排：标题沿用皮肤的分组标题尺度。 */
body.dsh-wechat-skin-on[data-dsh-wc-islands] .isl-settingsNote {
	font-size: var(--wc-fs-sm);
	color: var(--wc-ink-3);
}

/* 置顶聚合的行与侧栏会话行同一套头像与缩进：
   头像 22px（侧栏 26px 的紧凑版），标题从 8 + 22 + 6 = 36px 起，与侧栏标题基本对齐。 */
body.dsh-wechat-skin-on[data-dsh-wc-islands] .isl-pinnedRow {
	padding-left: 2px;
	gap: 6px;
}

body.dsh-wechat-skin-on[data-dsh-wc-islands] .isl-pinnedAvatar {
	flex: none;
	width: 22px;
	height: 22px;
	border-radius: var(--wc-av-radius, 6px);
	background-color: var(--wc-code-bg, #e8e8ec);
	background-size: cover;
	background-position: center;
}

/* 会话区与标题栏都不再自己铺底色：浮岛本体就是那一层的表面。
   皮肤原先把 .kiGsTW_scrollBody 刷成 --dsw-alias-bg-base，浅色下与岛屿几乎同色看不出来，
   深色下 (#111113) 会在 #212225 的岛上压出一块更暗的矩形。 */
body.dsh-wechat-skin-on[data-dsh-wc-islands] .kiGsTW_scrollBody,
body.dsh-wechat-skin-on[data-dsh-wc-islands] .kiGsTW_root,
body.dsh-wechat-skin-on[data-dsh-wc-islands] .tnXGgG_root,
body.dsh-wechat-skin-on[data-dsh-wc-islands] .tnXGgG_scroll,
body.dsh-wechat-skin-on[data-dsh-wc-islands] .kiGsTW_header {
	background: transparent;
}`;
	const ISLANDS_CSS_VARIANTS = {
	"scroll": "/* ==========================================================================\n   Islands UI · sidebar variant: scroll containers\n   Chosen at runtime for DSH releases from 0.2.2-rc.2, which wrapped the\n   sidebar's panel list and workspace browser in\n   `.kB3qhq_scrollRegion > .kB3qhq_scrollArea`. The base stylesheet keeps the\n   pre-rc.2 flat layout; this file only corrects the wrapper placement.\n\n   Every selector below names a class that does not exist in the older shell,\n   so inlining it there is inert; the client still injects it only for the\n   dialect it detected from `window.__DSH_BOOT__.release.version`.\n   ========================================================================== */\n\n/* The browser column replaces the old direct `.kB3qhq_regionArea` grid item. */\nbody[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) > .kB3qhq_scrollRegion {\n  grid-area: 3 / 2 / 5 / 3;\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n  margin: 0;\n}\n\n/* The shipped grid only made sense inside the full-height shell; the island\n   grid wants a plain column so the workspace browser can fill the island. */\nbody[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) > .kB3qhq_scrollRegion > .kB3qhq_scrollArea {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  min-height: 0;\n  margin: 0;\n  overflow: hidden;\n}\n\nbody[data-dsh-wc-islands]\n  .kB3qhq_root:not(.kB3qhq_collapsed)\n  > .kB3qhq_scrollRegion\n  > .kB3qhq_scrollArea\n  > .kB3qhq_regionArea {\n  flex: 1;\n  min-height: 0;\n}\n\n/* The shipped bottom fade reads as a panel edge; the island supplies its own. */\nbody[data-dsh-wc-islands] .kB3qhq_root:not(.kB3qhq_collapsed) > .kB3qhq_scrollRegion > .kB3qhq_scrollFade {\n  display: none;\n}\n\n/* 0.2.2-rc.2 moved the selected-panel state from `.panelRow` onto the wrapping\n   `.panelEntry`, so mirror the base active rule for the shipped rail. */\nbody[data-dsh-wc-islands] .kB3qhq_root .kB3qhq_panelEntryActive .kB3qhq_panelRow {\n  background: var(--dsw-specific-sidebar-nav-item-active-accent);\n  color: var(--dsw-alias-state-business-primary);\n}"
};

	/**
 * Islands 结构层：浮岛布局、顶栏、左侧图标栏、置顶聚合、模型弹层、更新入口、强调色。
 * 移植自 dsh-islands-ui（MIT, DawnCHL），改名与配色后并入 sone-wx。
 */
function createSoneIslandsLayer(require, host) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;
    const CSS = host.css;
    /**
     * Structure-specific stylesheets keyed by dialect. The base sheet covers
     * the flat sidebar; releases that change the shell get a variant that is
     * inlined only for the build the client detected.
     */
    const CSS_VARIANTS = host.cssVariants;

    const ATTRIBUTE = 'data-dsh-wc-islands';
    const STORAGE_KEY = 'dsh-wechat-skin:islands:enabled';
    const WORKSPACE_ATTR = 'data-dsh-wc-islands-workspace';
    /** Escape hatch, session scoped so the next launch re-runs the check. */
    const FORCE_KEY = 'dsh-wechat-skin:islands:force';
    /**
     * Layout anchors every Islands rule is written against. They do not exist
     * when `apply()` runs (the shell mounts afterwards), so the gate waits for
     * the frame and only then decides whether this build still matches.
     */
    const REQUIRED_ANCHORS = ['.PIRFFq_frame', '.PIRFFq_centerCol'];
    const SIDEBAR_COLUMN = '.PIRFFq_sidebarCol';
    const SIDEBAR_ROOT = '.kB3qhq_root';
    /**
     * Sidebar-shell dialects in release order. `since` is the first DSH release
     * that ships the dialect; a build older than every row keeps the base
     * stylesheet. Add a row (and a matching `src/variants/<dialect>.css`) when
     * DSH restructures the shell again.
     */
    const SHELL_DIALECTS = [{ since: '0.2.2-rc.2', dialect: 'scroll' }];
    const SHELL_FLAT = 'flat';
    /** No shell content at all after this long: the build is unusable. */
    const COMPAT_TIMEOUT_MS = 6000;
    /** Content mounted but the frame anchor never showed up: rename, not slowness. */
    const COMPAT_CONTENT_GRACE_MS = 1200;
    let animateTimer;
    let skinRegistrar = null;
    let publishRightbarWidth = null;
    let activated = false;
    /** Release reported by the client boot, and the stylesheet it selects. */
    let shellVersion = null;
    let shellDialect = SHELL_FLAT;
    let styleTag = null;
    let compatState = { status: 'checking', missing: [], forced: false, version: null, dialect: SHELL_FLAT };
    const compatListeners = new Set();

    /** Copy for the preference row; the row is the only user-facing string. */
    const COPY = {
      zh: {
        title: '浮岛布局',
        description: '圆角面板浮在统一画布上：自绘顶栏、常驻左侧图标栏、置顶聚合与两级模型弹层。关闭后立即恢复平铺外观。',
        topbarToggle: '折叠或展开工作区',
        openRight: '打开侧边栏',
        closeRight: '关闭侧边栏',
        workspace: '工作区',
        pinned: '置顶',
        untitled: '未命名会话',
        locate: '定位到会话',
        unpin: '取消置顶',
        schedules: '自动化任务',
        plugins: '插件',
        settings: '设置',
        railTitle: '左侧栏图标',
        railHint: '点击切换显示；按住图标拖动可排序',
        railShow: '显示在左侧栏',
        railHide: '从左侧栏移除',
        builtIn: 'DSH 内置',
        noExtras: '左侧栏还没有图标',
        enable: '启用 Islands 界面',
        enableDesc: '关闭后立即恢复 DSH 默认外观，设置会保留。',
        accent: '强调色',
        accentDesc: '用于选中状态、滑块、发送按钮等。',
        accentDefault: '跟随主题',
        accentCustom: '自定义颜色',
        models: '选择模型',
        effort: '推理等级',
        back: '返回',
        noEffort: '该模型没有可调推理等级',
        reset: '恢复默认',
        loading: '加载中…',
        pick: '选择模型',
        empty: '没有可用模型',
        failed: '切换失败',
        updateAvailable: '发现新版本 {version}',
        updateAvailablePlain: '发现新版本',
        updateDownloading: '正在下载更新 {percent}%',
        updateDownloadingDetail: '正在下载更新：{percent}%\n目标版本：{version}',
        updateVerifying: '正在校验更新文件…',
        updateInstalling: '正在准备重启…',
        updateReady: '安装并重启',
        updateReadyDetail: '新版本 {version} 已准备就绪，点击安装并重启',
        updateRetry: '重试更新',
        updateFailedCheck: '检查更新失败，请稍后重试。',
        updateFailedCheckNetwork: '检查更新失败，请检查网络连接后重试。',
        updateFailedDownload: '下载更新失败，请重试。',
        updateFailedDownloadNetwork: '下载更新失败，请检查网络连接后重试。',
        updateFailedInstall: '安装更新失败，请稍后重试。',
        updateFailedInstallNetwork: '安装更新失败，请检查网络连接后重试。',
        updateFailedStop: '未能安全停止任务，更新尚未安装，请稍后重试。',
        updateFailedTasksChanged: '有新任务开始运行，请重新确认是否停止任务并更新。',
        updateFailedTasksUnavailable: '无法确认任务状态，请在工作区就绪后重试更新。',
        updateFailedFullscreen: '无法退出全屏，请退出全屏后重试更新。',
        updateFailedGeneric: '更新失败，请稍后重试。',
        updateConfigUnavailable: '配置不可用',
        updateConfigRead: '更新已暂停：无法读取配置文件',
        updateConfigFormat: '更新已暂停：配置文件格式有误',
        updateConfigChannel: '更新已暂停：channel 只能是 nightly 或 stable',
        updateConfigCleanup: '更新已暂停：无法清理旧更新，请重启应用',
        updateConfigGeneric: '更新已暂停：配置不可用',
        updateShowcaseTitle: '更新按钮状态',
        updateShowcaseDesc: '桌面端设置齿轮上方的更新入口在各阶段的外观；没有可用更新时按钮隐藏。',
        updateStateAvailable: '发现新版本',
        updateStateDownloading: '下载中',
        updateStateVerifying: '校验中',
        updateStateInstalling: '准备重启',
        updateStateReady: '安装并重启',
        updateStateError: '更新失败',
        compatTitle: 'Islands UI 已自动关闭',
        compatBody: '当前 DSH 构建的界面结构与插件不匹配，皮肤已回退到默认外观，以免出现双栏重叠或控件遮挡。',
        compatView: '查看插件设置',
        compatMissing: '缺失的界面锚点',
        compatBannerTitle: '皮肤已自动停用：界面结构不匹配',
        compatBannerBody:
          'Islands UI 的样式写在当前 DSH 构建的类名和结构上。升级后的 DSH 改掉了这些锚点，浮岛布局、原生导航隐藏和工作区折叠都会失效，因此插件没有启用皮肤，DSH 保持默认外观。',
        compatFix: '处理方式：把 Islands UI 更新到适配当前 DSH 的版本，或回退 DSH。若确认界面正常，可临时强制启用（下次启动会重新检测）。',
        compatForce: '仍然启用',
        compatForced: '已强制启用，本次会话跳过自动检测。',
        compatDismiss: '关闭提示',
        compatDetected: '检测到 DSH',
        compatStructure: '侧栏结构',
        compatStructureFlat: '平铺',
        compatStructureScroll: '滚动容器',
      },
      en: {
        title: 'Islands interface',
        description:
          'Floating-island layout with rounded panels, a persistent rail and an islanded workspace list. Turn off to return to the default look immediately.',
        topbarToggle: 'Collapse or expand the workspace',
        openRight: 'Open side panel',
        closeRight: 'Close side panel',
        workspace: 'Workspace',
        pinned: 'Pinned',
        untitled: 'Untitled session',
        locate: 'Reveal in workspace',
        unpin: 'Unpin session',
        schedules: 'Automation',
        plugins: 'Plugins',
        settings: 'Settings',
        railTitle: 'Left rail icons',
        railHint: 'Click to show or hide; drag an icon to reorder',
        railShow: 'Show in the left rail',
        railHide: 'Remove from the left rail',
        builtIn: 'Built into DSH',
        noExtras: 'No icons on the left rail',
        enable: 'Enable Islands UI',
        enableDesc: 'Turn off to restore the default appearance immediately; your settings are kept.',
        accent: 'Accent color',
        accentDesc: 'Used for selected states, sliders, the send button and more.',
        accentDefault: 'Follow theme',
        accentCustom: 'Custom color',
        models: 'Select model',
        effort: 'Reasoning',
        back: 'Back',
        noEffort: 'This model has no adjustable reasoning level',
        reset: 'Reset to default',
        loading: 'Loading…',
        pick: 'Select model',
        empty: 'No models available',
        failed: 'Selection failed',
        updateAvailable: 'Update {version} available',
        updateAvailablePlain: 'Update available',
        updateDownloading: 'Downloading update {percent}%',
        updateDownloadingDetail: 'Downloading update: {percent}%\nTarget version: {version}',
        updateVerifying: 'Verifying update files…',
        updateInstalling: 'Preparing to restart…',
        updateReady: 'Install and restart',
        updateReadyDetail: 'Version {version} is ready. Click to install and restart.',
        updateRetry: 'Retry update',
        updateFailedCheck: 'Could not check for updates. Please try again later.',
        updateFailedCheckNetwork: 'Could not check for updates. Check your connection and try again.',
        updateFailedDownload: 'Could not download the update. Please try again.',
        updateFailedDownloadNetwork: 'Could not download the update. Check your connection and try again.',
        updateFailedInstall: 'Could not install the update. Please try again later.',
        updateFailedInstallNetwork: 'Could not install the update. Check your connection and try again.',
        updateFailedStop: 'Could not safely stop the tasks. The update has not been installed. Please try again later.',
        updateFailedTasksChanged: 'New tasks have started. Confirm again to stop the tasks and update.',
        updateFailedTasksUnavailable: 'Task status is unavailable. Try updating again when the workspace is ready.',
        updateFailedFullscreen: 'Could not exit fullscreen. Exit fullscreen, then retry the update.',
        updateFailedGeneric: 'The update failed. Please try again later.',
        updateConfigUnavailable: 'Configuration unavailable',
        updateConfigRead: 'Updates paused: cannot read settings file',
        updateConfigFormat: 'Updates paused: invalid settings file',
        updateConfigChannel: 'Updates paused: channel must be nightly or stable',
        updateConfigCleanup: 'Updates paused: cannot discard previous update; restart the app',
        updateConfigGeneric: 'Updates paused: configuration unavailable',
        updateShowcaseTitle: 'Update button states',
        updateShowcaseDesc:
          'How the desktop update entry above the settings gear looks in each phase. It is hidden when no update is available.',
        updateStateAvailable: 'Update available',
        updateStateDownloading: 'Downloading',
        updateStateVerifying: 'Verifying',
        updateStateInstalling: 'Preparing restart',
        updateStateReady: 'Install and restart',
        updateStateError: 'Update failed',
        compatTitle: 'Islands UI turned itself off',
        compatBody:
          'This DSH build no longer matches the plugin, so the skin fell back to the default look instead of overlapping panels.',
        compatView: 'Open plugin settings',
        compatMissing: 'Missing interface anchors',
        compatBannerTitle: 'Skin disabled: interface structure changed',
        compatBannerBody:
          'Islands UI styles itself against the class names and structure of the DSH build it ships for. This build changed those anchors, so the island layout, the hidden native navigation and the workspace collapse would all break. The skin therefore stayed off and DSH keeps its default look.',
        compatFix:
          'Update Islands UI to a release that matches this DSH build, or roll DSH back. If the interface looks fine, you can enable it anyway for this session.',
        compatForce: 'Enable anyway',
        compatForced: 'Enabled manually; automatic detection is skipped for this session.',
        compatDismiss: 'Dismiss',
        compatDetected: 'Detected DSH',
        compatStructure: 'Sidebar structure',
        compatStructureFlat: 'flat',
        compatStructureScroll: 'scroll containers',
      },
    };

    let localeService;
    let layoutService;
    let slotsService;
    let shortcutsService;
    let uiWorkspaceService;
    let workspacesService;
    let modelDirectories;
    const RAIL_PIN_KEY = 'dsh-wechat-skin:islands:rail-pins';
    /** Order + visibility of every left-rail panel entry. */
    const RAIL_CONFIG_KEY = 'dsh-wechat-skin:islands:rail';
    const ACCENT_KEY = 'dsh-wechat-skin:islands:accent';
    const DEFAULT_ACCENT = '#4176e6';
    // 起点是皮肤自己的强调色（微信绿），其余按色相拉开；换色只走一条令牌链路。
    const ACCENT_PRESETS = ['#0a7d43', '#1f9d63', '#4176e6', '#7c5cff', '#e07a2e', '#d94f8a'];
    const listeners = new Set();

    function readStored() {
      // 宿主（sone-wx）持有唯一真源：设置页开关、分享码导出与重置都走它。
      if (typeof host.readEnabled === 'function') {
        try {
          return host.readEnabled() !== false;
        } catch {
          /* 宿主读失败时退回本地键 */
        }
      }
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored === null ? true : stored === '1';
      } catch {
        return true;
      }
    }

    let enabled = readStored();

    function syncAttribute() {
      const body = document.body;
      if (body === null) return;
      if (enabled) body.setAttribute(ATTRIBUTE, '');
      else body.removeAttribute(ATTRIBUTE);
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    function getSnapshot() {
      return enabled;
    }

    function setEnabled(next) {
      enabled = next === true;
      if (typeof host.writeEnabled === 'function') {
        try {
          host.writeEnabled(enabled);
        } catch {
          /* 宿主写入失败不影响本次会话 */
        }
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
      } catch {
        /* private mode: the choice still applies for this page. */
      }
      syncAttribute();
      for (const listener of listeners) listener();
    }

    function shortcutKeys(id, fallback = '') {
      try {
        const row = shortcutsService?.catalog?.getSnapshot?.().find((value) => value.id === id);
        const keys = row?.keys;
        if (Array.isArray(keys) && keys.length > 0) {
          const mac =
            document.documentElement.getAttribute('data-platform') === 'darwin' ||
            /Mac/i.test(navigator.platform ?? '');
          return keys.join(mac ? '' : '+');
        }
      } catch {
        /* ignore */
      }
      return fallback;
    }

    function withShortcut(label, id, fallback = '') {
      const keys = shortcutKeys(id, fallback);
      return keys === '' ? label : `${label} (${keys})`;
    }

    function useEnabled() {
      return React.useSyncExternalStore(subscribe, getSnapshot);
    }

    function setCompat(next) {
      compatState = next;
      for (const listener of compatListeners) listener();
    }

    function subscribeCompat(listener) {
      compatListeners.add(listener);
      return () => compatListeners.delete(listener);
    }

    function getCompatSnapshot() {
      return compatState;
    }

    function useCompat() {
      return React.useSyncExternalStore(subscribeCompat, getCompatSnapshot);
    }

    function currentCopy() {
      try {
        return String(localeService?.getSnapshot?.().active ?? 'en').toLowerCase().startsWith('zh')
          ? COPY.zh
          : COPY.en;
      } catch {
        return COPY.en;
      }
    }

    function isForced() {
      try {
        return window.sessionStorage.getItem(FORCE_KEY) === '1';
      } catch {
        return false;
      }
    }

    /**
     * The DSH release this page booted with. The client module system publishes
     * it in `window.__DSH_BOOT__.release` (shared with the CLI version), so a
     * plugin can pick the stylesheet written for the running shell without a
     * Host round trip.
     */
    function readDshVersion() {
      try {
        const release = window.__DSH_BOOT__?.release;
        return typeof release?.version === 'string' && release.version !== '' ? release.version : null;
      } catch {
        return null;
      }
    }

    function parseVersion(value) {
      const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(String(value).trim());
      if (match === null) return null;
      return {
        core: [Number(match[1]), Number(match[2]), Number(match[3])],
        pre: match[4] === undefined ? [] : match[4].split('.'),
      };
    }

    /** Semver precedence, including numeric pre-release identifiers. */
    function compareVersions(left, right) {
      const a = parseVersion(left);
      const b = parseVersion(right);
      if (a === null || b === null) return null;
      for (let index = 0; index < 3; index += 1) {
        if (a.core[index] === b.core[index]) continue;
        return a.core[index] < b.core[index] ? -1 : 1;
      }
      if (a.pre.length === 0 || b.pre.length === 0) {
        return a.pre.length === b.pre.length ? 0 : a.pre.length === 0 ? 1 : -1;
      }
      const length = Math.max(a.pre.length, b.pre.length);
      for (let index = 0; index < length; index += 1) {
        const x = a.pre[index];
        const y = b.pre[index];
        if (x === undefined) return -1;
        if (y === undefined) return 1;
        const xNumeric = /^\d+$/u.test(x);
        const yNumeric = /^\d+$/u.test(y);
        if (xNumeric && yNumeric) {
          const diff = Number(x) - Number(y);
          if (diff !== 0) return diff < 0 ? -1 : 1;
        } else if (xNumeric !== yNumeric) {
          // Numeric identifiers always sort before alphanumeric ones.
          return xNumeric ? -1 : 1;
        } else if (x !== y) {
          return x < y ? -1 : 1;
        }
      }
      return 0;
    }

    /** Dialect the reported release ships; null when the version is unreadable. */
    function dialectForVersion(version) {
      if (version === null || parseVersion(version) === null) return null;
      let dialect = SHELL_FLAT;
      for (const row of SHELL_DIALECTS) {
        const order = compareVersions(version, row.since);
        if (order !== null && order >= 0) dialect = row.dialect;
      }
      return dialect;
    }

    /**
     * Structure the mounted shell actually uses, read from the housekeeping
     * classes rather than the version: `flat` is the pre-0.2.2-rc.2 sidebar,
     * `scroll` the one wrapped in scroll containers, and `unknown` a shell no
     * stylesheet was written against. Null means the shell has not mounted.
     */
    function detectShellDialect() {
      const root = document.querySelector(SIDEBAR_ROOT);
      if (root === null) return null;
      const scrollRegion = root.querySelector(':scope > .kB3qhq_scrollRegion');
      if (scrollRegion !== null) {
        return scrollRegion.querySelector(':scope > .kB3qhq_scrollArea') !== null ? 'scroll' : 'unknown';
      }
      return root.querySelector(':scope > .kB3qhq_regionArea') !== null ? SHELL_FLAT : 'unknown';
    }

    function stylesheetFor(dialect) {
      const variant = CSS_VARIANTS[dialect];
      if (typeof variant !== 'string' || variant === '') return CSS;
      return `${CSS}\n\n/* ---- variant: ${dialect} ---- */\n${variant}`;
    }

    /** Swap the injected stylesheet when the detected structure changes. */
    function applyStylesheet(dialect) {
      shellDialect = dialect;
      if (styleTag !== null) styleTag.textContent = stylesheetFor(dialect);
    }

    /** Which anchors of the running DSH build are gone. */
    function missingAnchors() {
      const missing = REQUIRED_ANCHORS.filter((selector) => document.querySelector(selector) === null);
      // A sidebar column without its root class means the sidebar was rebuilt
      // under another name; the skin would render a second rail beside it.
      if (document.querySelector(SIDEBAR_COLUMN) !== null && document.querySelector(SIDEBAR_ROOT) === null) {
        missing.push(SIDEBAR_ROOT);
      }
      // A shell that matches no known dialect cannot be styled without the
      // half-applied layout this gate exists to prevent.
      if (detectShellDialect() === 'unknown') {
        missing.push(shellDialect === 'scroll' ? '.kB3qhq_scrollRegion > .kB3qhq_scrollArea' : '.kB3qhq_regionArea');
      }
      return missing;
    }

    function readAccent() {
      try {
        const stored = window.localStorage.getItem(ACCENT_KEY);
        return stored !== null && /^#[0-9a-f]{6}$/iu.test(stored) ? stored : null;
      } catch {
        return null;
      }
    }

    /** 强调色影响到的皮肤令牌：一条链路同时喂结构层与微信皮肤。 */
    const ACCENT_SKIN_TOKENS = [
      '--wc-accent-solid',
      '--wc-accent-bright',
      '--wc-accent-press',
      '--wc-accent-soft',
      '--wc-accent-line',
      '--wc-green',
      '--wc-link',
      '--wc-link-hover',
      '--wc-sel-ink',
      '--wc-sel-ink-dim'
    ];

    /** 相对亮度：只在「浅色强调色要不要换深色文字」这一处做判断。 */
    function relativeLuminance(hex) {
      const value = hex.replace('#', '');
      const channels = [0, 2, 4].map((index) => {
        const channel = parseInt(value.slice(index, index + 2), 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function clearAccentRamp() {
      const body = document.body;
      if (body === null) return;
      for (const token of ACCENT_SKIN_TOKENS) body.style.removeProperty(token);
    }

    /**
     * 选中的颜色直接写进皮肤令牌，而不是另起一套 --isl-* 变量：
     * 选中态、焦点环、链接、图钉、模型药丸与左侧图标栏一起换色，
     * 深浅主题靠 color-mix 与 --wc-ink-1 自适应，无需两套值。
     */
    /** #rgb / #rrggbb → [r, g, b]。 */
    function parseHex(hex) {
      const raw = String(hex || '').replace('#', '').trim();
      if (raw.length === 3) return raw.split('').map((c) => parseInt(c + c, 16));
      if (raw.length === 6) return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16));
      return null;
    }

    function toHex(rgb) {
      return '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
    }

    /**
     * 选中态是实心填充，上面压白字。用户挑的强调色未必够深（橙色 #e07a2e 白字只有 3.0:1），
     * 所以实心色按需要往黑压，直到白字达标；挑中的原色仍作为装饰亮色保留。
     */
    function solidForWhiteInk(hex) {
      const rgb = parseHex(hex);
      if (rgb === null) return hex;
      const contrast = (candidate) => {
        const [hi, lo] = [relativeLuminance(candidate), relativeLuminance('#ffffff')].sort((a, b) => b - a);
        return (hi + 0.05) / (lo + 0.05);
      };
      let mix = 0;
      while (mix <= 0.6 && contrast(toHex(rgb.map((v) => v * (1 - mix)))) < 4.5) mix += 0.02;
      return toHex(rgb.map((v) => v * (1 - mix)));
    }

    function applyAccentRamp(color) {
      const body = document.body;
      if (body === null) return;
      if (color === null) {
        clearAccentRamp();
        return;
      }
      const style = body.style;
      const solid = solidForWhiteInk(color);
      const light = relativeLuminance(solid) > 0.42;
      const mixed = (weight, target) => `color-mix(in srgb, ${color} ${weight}%, ${target})`;
      style.setProperty('--wc-accent-solid', solid);
      style.setProperty('--wc-accent-bright', color);
      style.setProperty('--wc-accent-press', `color-mix(in srgb, ${solid} 86%, #000)`);
      style.setProperty('--wc-accent-soft', mixed(10, 'var(--wc-surface)'));
      style.setProperty('--wc-accent-line', mixed(40, 'var(--wc-surface)'));
      style.setProperty('--wc-green', color);
      // 链接与焦点环跟着主题墨色走：浅色主题压深、深色主题提亮。
      style.setProperty('--wc-link', mixed(62, 'var(--wc-ink-1)'));
      style.setProperty('--wc-link-hover', mixed(80, 'var(--wc-ink-1)'));
      style.setProperty('--wc-sel-ink', light ? 'var(--wc-ink-1)' : '#ffffff');
      style.setProperty('--wc-sel-ink-dim', light ? 'color-mix(in srgb, var(--wc-ink-1) 72%, transparent)' : 'rgba(255, 255, 255, 0.92)');
    }

    function applyAccent(color) {
      const body = document.body;
      if (body === null) return;
      if (color === null) {
        body.removeAttribute('data-dsh-wc-accent');
        body.style.removeProperty('--isl-accent');
      } else {
        body.setAttribute('data-dsh-wc-accent', '');
        body.style.setProperty('--isl-accent', color);
      }
      applyAccentRamp(color);
    }

    function storeAccent(color) {
      try {
        if (color === null) window.localStorage.removeItem(ACCENT_KEY);
        else window.localStorage.setItem(ACCENT_KEY, color);
      } catch {
        /* private mode: keep the session choice. */
      }
    }

    function useLocale() {
      return React.useSyncExternalStore(
        (listener) => (localeService === undefined ? () => {} : localeService.subscribe(listener)),
        () => (localeService === undefined ? 'en' : localeService.getSnapshot().active),
      );
    }

    /** Sidebar glyph for the window bar (divider on the left, workspace rail). */
    function PanelGlyph() {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('rect', {
          x: 2.5,
          y: 3.5,
          width: 15,
          height: 13,
          rx: 3,
          stroke: 'currentColor',
          strokeWidth: 1.5,
        }),
        h('path', { d: 'M7.5 4v12', stroke: 'currentColor', strokeWidth: 1.5 }),
      );
    }

    /** Mirror glyph for the right sidebar toggle (divider on the right). */
    function RightPanelGlyph() {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('rect', {
          x: 2.5,
          y: 3.5,
          width: 15,
          height: 13,
          rx: 3,
          stroke: 'currentColor',
          strokeWidth: 1.5,
        }),
        h('path', { d: 'M12.5 4v12', stroke: 'currentColor', strokeWidth: 1.5 }),
      );
    }

    /** Small glyphs used by the composer model picker. */
    function ModelGlyph() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 1.5, y: 1.5, width: 13, height: 13, rx: 4, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M5 9.5 6.8 6l1.7 3.5L10.2 6 12 9.5', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function CheckGlyph() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm3.5 8.5 3 3 6-6.5', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function ChevronGlyph() {
      return h(
        'svg',
        { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm4 6 4 4 4-4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function ResetGlyph() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3.5 6.5A5 5 0 1 1 3 9.5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M3 3.5v3h3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function DownloadGlyph() {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M10 3.4v8.2', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
        h('path', { d: 'm6.7 8.7 3.3 3.3 3.3-3.3', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M4.5 15.6h11', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
      );
    }

    function RestartGlyph() {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M16.4 8.1A6.5 6.5 0 1 0 16.4 12', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' }),
        h('path', { d: 'M16.4 3.9v4.2h-4.2', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function DotMatrixGlyph({ variant }) {
      const rings = [2, 1, 2, 1, 0, 1, 2, 1, 2];
      const smiley = new Set([0, 2, 7]);
      // Windows for the 720 ms smiley rotation: each cell is lit for one or
      // two 180 ms phases; the first cell wraps across the cycle boundary.
      const phases = [
        { span: 'wrap', delay: 0 },
        { span: 1, delay: 360 },
        { span: 2, delay: 0 },
        { span: 1, delay: 180 },
        { span: null, delay: 0 },
        { span: 1, delay: 540 },
        { span: 2, delay: 360 },
        { span: 1, delay: 0 },
        { span: 2, delay: 180 },
      ];
      return h(
        'span',
        { className: `isl-dmx isl-dmx-${variant}`, 'aria-hidden': true },
        Array.from({ length: 9 }, (_, index) =>
          h('span', {
            key: index,
            className: 'isl-dmx-dot',
            'data-col': index % 3,
            'data-ring': rings[index],
            'data-on': smiley.has(index) ? '1' : '0',
            'data-span': variant === 'smiley' ? phases[index].span ?? undefined : undefined,
            style:
              variant === 'smiley'
                ? { animationDelay: `${phases[index].delay}ms` }
                : { '--dmx-col': index % 3, '--dmx-ring': rings[index] },
          }),
        ),
      );
    }

    /** Shared face for the live rail button and the settings showcase. */
    function UpdateGlyph({ phase }) {
      if (phase === 'available') return h(DownloadGlyph);
      if (phase === 'ready' || phase === 'error') return h(RestartGlyph);
      if (phase === 'downloading') return h(DotMatrixGlyph, { variant: 'column' });
      if (phase === 'verifying') return h(DotMatrixGlyph, { variant: 'smiley' });
      return h(DotMatrixGlyph, { variant: 'ripple' });
    }

    function readRailPins() {
      try {
        const raw = window.localStorage.getItem(RAIL_PIN_KEY);
        const parsed = raw === null ? [] : JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
      } catch {
        return [];
      }
    }

    function uniqueRailIds(values) {
      const seen = new Set();
      const result = [];
      for (const value of values) {
        if (typeof value !== 'string' || value === '' || seen.has(value)) continue;
        seen.add(value);
        result.push(value);
      }
      return result;
    }

    /**
     * The rail shows every panel entry by default and remembers the user's
     * order and the entries they hid. Configurations written by 1.0.x only
     * stored pins, so they are read once and migrated into an order prefix.
     */
    function readRailConfig() {
      try {
        const raw = window.localStorage.getItem(RAIL_CONFIG_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          return {
            order: uniqueRailIds(Array.isArray(parsed?.order) ? parsed.order : []),
            hidden: uniqueRailIds(Array.isArray(parsed?.hidden) ? parsed.hidden : []),
          };
        }
      } catch {
        /* fall through to the legacy pin list */
      }
      return { order: uniqueRailIds(['schedules', 'plugins', ...readRailPins()]), hidden: [] };
    }

    function writeRailConfig(config) {
      try {
        window.localStorage.setItem(RAIL_CONFIG_KEY, JSON.stringify(config));
        // The legacy key only seeds the first migration; drop it once the new
        // configuration exists so clearing that key really resets the rail.
        window.localStorage.removeItem(RAIL_PIN_KEY);
      } catch {
        /* private mode: keep the arrangement for this session only. */
      }
    }

    function HouseGlyph() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3 8.6 10 3l7 5.6V16a1 1 0 0 1-1 1h-4v-4.5H8V17H4a1 1 0 0 1-1-1V8.6Z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round' }));
    }

    function ClockGlyph() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 10, cy: 10, r: 7, stroke: 'currentColor', strokeWidth: 1.5 }),
        h('path', { d: 'M10 6.2V10l2.6 1.6', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    function PluginsGlyph() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 3, y: 3, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('rect', { x: 11, y: 3, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('rect', { x: 3, y: 11, width: 6, height: 6, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M14 11v6M11 14h6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    function PlugGlyph() {
      return h('svg', { width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0V7ZM10 15v3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function CheckGlyph() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'm3 8.4 3.2 3.2L13 4.8', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function PlusGlyph() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M10 4v12M4 10h12', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    function GearGlyph() {
      return h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 12, cy: 12, r: 3, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('path', {
          d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    /**
     * Best effort selection of one settings section once the dialog is up. The
     * settings navigation has no service of its own, so the row is matched by
     * its label inside the dialog and simply skipped when it is not there.
     */
    function revealSettingsSection(label) {
      if (typeof label !== 'string' || label === '') return;
      let attempts = 0;
      const tick = () => {
        attempts += 1;
        const scope = document.querySelector('[role="dialog"]') ?? document;
        const cells = [
          ...scope.querySelectorAll('button, a, [role="tab"], [role="option"], [class*="navCell"]'),
        ];
        const target = cells.find((cell) => (cell.textContent ?? '').trim() === label);
        if (target instanceof HTMLElement) {
          target.click();
          return;
        }
        if (attempts < 12) window.setTimeout(tick, 120);
      };
      window.setTimeout(tick, 140);
    }

    function openSettings(options) {
      const section = options?.section;
      // The account launcher owns the Settings row; clicking that row is the
      // reliable path on desktop (configurable shortcuts go through the native
      // keyboard bridge, so a synthetic keydown never reaches them).
      const trigger = document.querySelector('.kB3qhq_footArea button[aria-haspopup="menu"]');
      if (trigger instanceof HTMLElement) {
        trigger.click();
        window.setTimeout(() => {
          const item = [
            ...document.querySelectorAll('[role="menu"] [role="menuitem"], [role="menu"] [role="menuitemradio"], [role="menu"] button, [role="menu"] a'),
          ].find((element) => /设置|Settings|偏好|Preferences/i.test(element.textContent ?? ''));
          if (item instanceof HTMLElement) item.click();
          revealSettingsSection(section);
        }, 60);
        return;
      }
      try {
        const row = (shortcutsService?.catalog?.getSnapshot?.() ?? []).find(
          (value) => value.id === 'settings.open' && value.binding !== null && value.binding !== undefined,
        );
        if (row?.binding !== undefined) {
          const modifiers = new Set(row.binding.modifiers ?? []);
          window.dispatchEvent(
            new KeyboardEvent('keydown', {
              code: row.binding.code,
              key: ',',
              metaKey: modifiers.has('meta'),
              ctrlKey: modifiers.has('control'),
              altKey: modifiers.has('alt'),
              shiftKey: modifiers.has('shift'),
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      } catch {
        /* ignore */
      }
      revealSettingsSection(section);
    }

    function LocateGlyph() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 8, r: 4, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }));
    }

    function defaultPinIcon() {
      try {
        const entries = slotsService?.entriesOfSlot?.('contextMenu.icon') ?? [];
        const entry =
          entries.find((value) => value.options?.key === 'workspace.unpin') ??
          entries.find((value) => value.options?.key === 'workspace.pin');
        if (entry?.component !== undefined) return h(entry.component, { size: 14 });
      } catch {
        /* fall back to the local glyph */
      }
      return h(PinGlyph);
    }

    function revealPinnedSession(sessionId, title) {
      const projectRows = () => [...document.querySelectorAll('.JoiKIa_projectRow')];
      const stateOf = (row) =>
        row.getAttribute('aria-expanded') ??
        row.querySelector('[aria-expanded]')?.getAttribute('aria-expanded');
      const expanded = (row) => stateOf(row) === 'true';
      const toggle = (row) => {
        const chevron = row.querySelector('.JoiKIa_chevron');
        if (chevron instanceof HTMLElement) chevron.click();
        else row.click();
      };

      // Expand every workspace briefly so the target session exists in the DOM.
      for (const row of projectRows()) {
        if (!expanded(row)) toggle(row);
      }

      window.setTimeout(() => {
        const candidates = [...document.querySelectorAll('.JoiKIa_sessionRow')].filter((row) =>
          (row.textContent ?? '').includes(title),
        );
        if (candidates.length === 0) return;
        const row = candidates[0];

        // The owner is the nearest preceding Workspace row; nested ancestors stay open.
        let owner = null;
        for (const project of projectRows()) {
          if ((project.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) owner = project;
        }

        for (const project of projectRows()) {
          const keep = project === owner || project.contains(owner);
          if (keep) {
            if (!expanded(project)) toggle(project);
          } else if (expanded(project)) {
            toggle(project);
          }
        }

        window.setTimeout(() => {
          row.scrollIntoView({ block: 'center', behavior: 'smooth' });
          if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '-1');
          row.focus({ preventScroll: true });
          row.classList.add('isl-located');
          window.setTimeout(() => row.classList.remove('isl-located'), 1400);
        }, 140);
      }, 180);
    }

    function PinGlyph() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M6 2v4L4 8v1.5h3.2V14l.8 1 .8-1V9.5H12V8l-2-2V2', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' }));
    }

    /**
     * Left rail: the workspace home plus every panel launcher registered in
     * `sidebar.panellist`. Entries are shown directly, reordered by dragging,
     * and shown or hidden from the right-click management menu.
     */
    function IslandsRail({ usePanelInfo }) {
      const active = usePanelInfo((info) => info.activePanelId ?? null);
      const [config, setConfig] = React.useState(readRailConfig);
      const [menu, setMenu] = React.useState(null);
      const [dragId, setDragId] = React.useState(null);
      const [ripples, setRipples] = React.useState([]);
      const rippleSeq = React.useRef(0);
      const [, refreshEntries] = React.useState(0);
      const railRef = React.useRef(null);
      const menuRef = React.useRef(null);
      const itemRefs = React.useRef(new Map());
      const configRef = React.useRef(config);
      const dragRef = React.useRef(null);
      const suppressClickRef = React.useRef(false);
      const lang = useLocale() ?? 'en';
      const copy = String(lang).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      configRef.current = config;

      const allEntries = (() => {
        try {
          const seen = new Set();
          return (slotsService?.entriesOfSlot('sidebar.panellist') ?? []).flatMap((entry) => {
            const id = entry.options.id;
            if (typeof id !== 'string' || id === '' || seen.has(id)) return [];
            seen.add(id);
            return [{
              id,
              order: entry.options.order ?? 0,
              label: typeof entry.options.label === 'function' ? entry.options.label() : entry.options.label,
              registrant: entry.registrant,
              component: entry.component,
            }];
          });
        } catch {
          return [];
        }
      })();

      const byId = new Map(allEntries.map((entry) => [entry.id, entry]));
      const storedIndex = new Map(config.order.map((id, index) => [id, index]));
      // The two shipped panels lead on a fresh install; every other launcher
      // follows registration order until the user drags it somewhere else.
      const defaultIds = [
        ...['schedules', 'plugins'].filter((id) => byId.has(id)),
        ...allEntries.map((entry) => entry.id).filter((id) => id !== 'schedules' && id !== 'plugins'),
      ];
      const defaultIndex = new Map(defaultIds.map((id, index) => [id, index]));
      const orderedEntries = [...allEntries].sort((left, right) => {
        const leftIndex = storedIndex.get(left.id);
        const rightIndex = storedIndex.get(right.id);
        if (leftIndex !== undefined || rightIndex !== undefined) {
          if (leftIndex === undefined) return 1;
          if (rightIndex === undefined) return -1;
          if (leftIndex !== rightIndex) return leftIndex - rightIndex;
        }
        return (defaultIndex.get(left.id) ?? 0) - (defaultIndex.get(right.id) ?? 0);
      });
      const visible = orderedEntries.filter((entry) => !config.hidden.includes(entry.id));

      // A plugin can register a panel after the shell is already mounted.
      React.useEffect(() => {
        try {
          const unsubscribe = slotsService?.subscribe?.('sidebar.panellist', () => refreshEntries((value) => value + 1));
          return typeof unsubscribe === 'function' ? unsubscribe : undefined;
        } catch {
          return undefined;
        }
      }, []);

      React.useEffect(() => {
        if (menu === null) return;
        const onDown = (event) => {
          if (railRef.current?.contains(event.target) === true) return;
          if (menuRef.current?.contains(event.target) === true) return;
          setMenu(null);
        };
        const onKey = (event) => {
          if (event.key === 'Escape') setMenu(null);
        };
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
          document.removeEventListener('mousedown', onDown, true);
          document.removeEventListener('keydown', onKey, true);
        };
      }, [menu]);

      React.useEffect(
        () => () => {
          dragRef.current?.detach?.();
          dragRef.current = null;
        },
        [],
      );

      const iconFor = (id, size) => {
        const entry = byId.get(id);
        if (entry?.component !== undefined) {
          try {
            return h(entry.component, { size, active: active === id });
          } catch {
            /* fall back to the generic glyph */
          }
        }
        if (id === 'schedules') return h(ClockGlyph);
        if (id === 'plugins') return h(PluginsGlyph);
        return h(PlugGlyph);
      };

      // Official panels are registered by the bundled web-client fiber, whose
      // internal name is `wc`; that code means nothing in the UI. Third-party
      // entries keep their package name so the owner is still recognizable.
      const ownerFor = (registrant) => {
        if (typeof registrant !== 'string') return undefined;
        const code = registrant.trim();
        if (code === '') return undefined;
        // The bundled client reports the fiber as `WC` (older bundles may use
        // lower case); both are the same internal name, not a plugin name.
        return code.toLowerCase() === 'wc' ? copy.builtIn : code;
      };

      const labelFor = (id) => {
        const entry = byId.get(id);
        const label = entry?.label ?? id;
        const owner = ownerFor(entry?.registrant);
        return owner === undefined ? label : `${label} · ${owner}`;
      };

      const openMenuAt = (x, y, contextId) => {
        const width = 248;
        const height = Math.min(window.innerHeight - 16, 76 + orderedEntries.length * 36);
        const left = Math.max(8, Math.min(x, window.innerWidth - width - 8));
        const top = y + height + 8 <= window.innerHeight ? y : Math.max(8, y - height);
        setMenu({ left, top, contextId });
      };

      const toggleHidden = (id) => {
        const current = configRef.current;
        const hidden = current.hidden.includes(id)
          ? current.hidden.filter((value) => value !== id)
          : [...current.hidden, id];
        const next = { order: current.order, hidden };
        configRef.current = next;
        setConfig(next);
        writeRailConfig(next);
      };

      const addRipple = (event) => {
        const button = event.currentTarget;
        if (button === null) return;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.4;
        // Keyboard activation (Enter/Space) reports detail 0 and no pointer
        // position; centre the ripple on the tile instead.
        const centered = event.detail === 0 || (event.clientX === 0 && event.clientY === 0);
        const x = centered ? rect.width / 2 : event.clientX - rect.left;
        const y = centered ? rect.height / 2 : event.clientY - rect.top;
        const key = `ripple-${rippleSeq.current++}`;
        setRipples((values) => [...values, { key, x, y, size }]);
      };

      const removeRipple = (key) => {
        setRipples((values) => values.filter((value) => value.key !== key));
      };

      const select = (id) => {
        setMenu(null);
        // The home button is the workspace drawer's opener in the narrow
        // layout; on desktop it returns to the conversation as before.
        if (id === null) {
          const frame = document.querySelector('.PIRFFq_frame');
          if (frame !== null && frame.hasAttribute('data-sidebar-drawer')) {
            layoutService?.toggleSidebar();
            return;
          }
        }
        layoutService?.selectPanel(id);
      };

      const autoScroll = (clientY) => {
        const rail = railRef.current;
        if (rail === null) return;
        const rect = rail.getBoundingClientRect();
        if (clientY < rect.top + 32) rail.scrollTop -= 12;
        else if (clientY > rect.bottom - 32) rail.scrollTop += 12;
      };

      const beforeIdAt = (clientY, id) => {
        for (const entry of visible) {
          if (entry.id === id) continue;
          const node = itemRefs.current.get(entry.id);
          if (node === undefined) continue;
          const rect = node.getBoundingClientRect();
          if (clientY < rect.top + rect.height / 2) return entry.id;
        }
        return null;
      };

      const moveEntryBefore = (id, beforeId) => {
        const current = configRef.current;
        const baseOrder = orderedEntries.map((entry) => entry.id);
        const currentOrder = uniqueRailIds([...current.order, ...baseOrder]);
        const without = currentOrder.filter((value) => value !== id);
        let index = beforeId === null ? without.length : without.indexOf(beforeId);
        if (index === -1) index = without.length;
        without.splice(index, 0, id);
        if (without.length === currentOrder.length && without.every((value, at) => value === currentOrder[at])) return;
        const next = { order: without, hidden: current.hidden };
        configRef.current = next;
        setConfig(next);
      };

      const beginDrag = (event, id) => {
        if (event.button !== 0 || dragRef.current !== null) return;
        const pointerId = event.pointerId;
        const startX = event.clientX;
        const startY = event.clientY;
        const source = event.currentTarget;
        const origin = source.getBoundingClientRect();
        const state = {
          id,
          active: false,
          detach: null,
          ghost: null,
          offsetX: startX - origin.left,
          offsetY: startY - origin.top,
        };
        const positionGhost = (x, y) => {
          if (state.ghost === null) return;
          state.ghost.style.transform = `translate3d(${x - state.offsetX}px, ${y - state.offsetY}px, 0)`;
        };
        const detach = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp, true);
          window.removeEventListener('pointercancel', onUp, true);
          if (state.ghost !== null) {
            state.ghost.remove();
            state.ghost = null;
          }
        };
        const onMove = (moveEvent) => {
          if (moveEvent.pointerId !== pointerId) return;
          if (!state.active) {
            if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
            state.active = true;
            suppressClickRef.current = true;
            setDragId(id);
            setMenu(null);
            // Clone the rendered icon so the ghost keeps the exact glyph and
            // size of the row, then park it under the pointer at the grab
            // offset. It must never intercept pointer events.
            const ghost = source.cloneNode(true);
            ghost.className = 'isl-railGhost';
            ghost.removeAttribute('data-rail-id');
            ghost.removeAttribute('data-draggable');
            ghost.removeAttribute('title');
            ghost.removeAttribute('aria-label');
            ghost.removeAttribute('aria-pressed');
            ghost.setAttribute('aria-hidden', 'true');
            ghost.tabIndex = -1;
            state.ghost = ghost;
            positionGhost(moveEvent.clientX, moveEvent.clientY);
            document.body.appendChild(ghost);
          }
          moveEvent.preventDefault();
          positionGhost(moveEvent.clientX, moveEvent.clientY);
          autoScroll(moveEvent.clientY);
          moveEntryBefore(id, beforeIdAt(moveEvent.clientY, id));
        };
        const onUp = (upEvent) => {
          if (upEvent.pointerId !== pointerId) return;
          detach();
          dragRef.current = null;
          if (!state.active) return;
          upEvent.preventDefault();
          setDragId(null);
          writeRailConfig(configRef.current);
          // The click that follows a drag must not select the icon; clear the
          // guard after the browser has dispatched it.
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 0);
        };
        state.detach = detach;
        dragRef.current = state;
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('pointercancel', onUp, true);
      };

      const button = (id, label, glyph, extraClass, draggable = false) => {
        // The house is a navigation trigger (conversation / workspace drawer),
        // not a destination in the panel model. It therefore never carries the
        // persistent selected fill; hover and focus still show that it is live.
        const selected = id !== null && active === id;
        // `dragId` is null while idle, so the house (id null) must not match it.
        const dragging = id !== null && dragId === id;
        return h(
          'button',
          {
            type: 'button',
            key: id ?? 'workspace',
            ref: draggable
              ? (node) => {
                  if (node === null) itemRefs.current.delete(id);
                  else itemRefs.current.set(id, node);
                }
              : undefined,
            className:
              'isl-railBtn' +
              (selected ? ' is-active' : '') +
              (dragging ? ' is-dragging' : '') +
              (extraClass ? ` ${extraClass}` : ''),
            title: label,
            'aria-label': label,
            'aria-pressed': id === null ? undefined : selected,
            'data-rail-id': id ?? 'workspace',
            'data-draggable': draggable ? '' : undefined,
            onClick: (event) => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              if (id === null) addRipple(event);
              select(id);
            },
            onPointerDown: draggable ? (event) => beginDrag(event, id) : undefined,
          },
          glyph,
          id === null
            ? ripples.map((ripple) =>
                h('span', {
                  key: ripple.key,
                  className: 'isl-railRipple',
                  'aria-hidden': true,
                  style: {
                    left: `${ripple.x}px`,
                    top: `${ripple.y}px`,
                    width: `${ripple.size}px`,
                    height: `${ripple.size}px`,
                  },
                  onAnimationEnd: () => removeRipple(ripple.key),
                }),
              )
            : null,
        );
      };

      const menuNode = menu !== null
        ? ReactDOM.createPortal(
            h(
              'div',
              {
                ref: menuRef,
                className: 'isl-railMenu',
                role: 'menu',
                style: { left: menu.left, top: menu.top },
                onContextMenu: (event) => event.preventDefault(),
              },
              h('div', { className: 'isl-railMenuTitle' }, copy.railTitle),
              orderedEntries.length === 0
                ? h('div', { className: 'isl-railMenuEmpty' }, copy.noExtras)
                : orderedEntries.map((entry) => {
                    const shown = !config.hidden.includes(entry.id);
                    const owner = ownerFor(entry.registrant);
                    return h(
                      'button',
                      {
                        type: 'button',
                        key: entry.id,
                        className:
                          'isl-railMenuRow' +
                          (menu.contextId === entry.id ? ' is-current' : '') +
                          (shown ? '' : ' is-hidden'),
                        role: 'menuitemcheckbox',
                        'aria-checked': shown,
                        title: shown ? copy.railHide : copy.railShow,
                        onClick: () => toggleHidden(entry.id),
                      },
                      h('span', { className: 'isl-railMenuIcon' }, iconFor(entry.id, 16)),
                      h(
                        'span',
                        { className: 'isl-railMenuText' },
                        h('span', { className: 'isl-railMenuLabel' }, entry.label ?? entry.id),
                        owner === undefined
                          ? null
                          : h('span', { className: 'isl-railMenuSub' }, owner),
                      ),
                      h(
                        'span',
                        { className: 'isl-railMenuCheck' + (shown ? ' is-on' : ''), 'aria-hidden': true },
                        shown ? h(CheckGlyph) : null,
                      ),
                    );
                  }),
              h('div', { className: 'isl-railMenuHint' }, copy.railHint),
            ),
            document.body,
          )
        : null;

      return h(
        'nav',
        {
          ref: railRef,
          className: 'isl-rail' + (dragId === null ? '' : ' is-dragging'),
          'aria-label': copy.workspace,
          onContextMenu: (event) => {
            event.preventDefault();
            const target = event.target instanceof Element ? event.target.closest('[data-rail-id]') : null;
            const id = target?.getAttribute('data-rail-id') ?? null;
            const anchor = target?.getBoundingClientRect() ?? railRef.current?.getBoundingClientRect();
            // Shift+F10 and the context-menu key dispatch a contextmenu event
            // without a pointer position; anchor that menu on the focused row.
            const point = event.clientX === 0 && event.clientY === 0
              ? { x: (anchor?.right ?? 48) + 8, y: anchor?.top ?? 8 }
              : { x: event.clientX, y: event.clientY };
            openMenuAt(point.x, point.y, id === 'workspace' ? null : id);
          },
        },
        button(null, copy.workspace, h(HouseGlyph)),
        h('div', { className: 'isl-railDivider', 'aria-hidden': true }),
        visible.map((entry) => button(entry.id, labelFor(entry.id), iconFor(entry.id, 18), null, true)),
        visible.length === 0
          ? h(
              'button',
              {
                type: 'button',
                className: 'isl-railBtn isl-railAdd',
                title: copy.railTitle,
                'aria-label': copy.railTitle,
                'aria-haspopup': 'menu',
                'aria-expanded': menu !== null,
                onClick: (event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  openMenuAt(rect.right + 8, rect.top, null);
                },
              },
              h(PlusGlyph),
            )
          : null,
        menuNode,
      );
    }

    function IslandsRailSettings() {
      const lang = useLocale() ?? 'en';
      const copy = String(lang).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      return h(
        'button',
        {
          type: 'button',
          className: 'isl-railBtn isl-railSettings',
          title: withShortcut(copy.settings, 'settings.open'),
          'aria-label': withShortcut(copy.settings, 'settings.open'),
          onClick: openSettings,
        },
        h(GearGlyph),
      );
    }

    /**
     * The desktop preload exposes update state only to the product page. Keep
     * the lookup optional so the same bundle stays inert in a plain browser.
     */
    function desktopUpdateBridge() {
      try {
        const bridge = globalThis.dshDesktop;
        return bridge?.protocolVersion === 1 ? bridge.updates : undefined;
      } catch {
        return undefined;
      }
    }

    function formatCopy(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (match, key) =>
        values[key] === undefined ? match : String(values[key]),
      );
    }

    const UPDATE_FAILURE_KEYS = {
      check: 'updateFailedCheck',
      'check-network': 'updateFailedCheckNetwork',
      download: 'updateFailedDownload',
      'download-network': 'updateFailedDownloadNetwork',
      install: 'updateFailedInstall',
      'install-network': 'updateFailedInstallNetwork',
      'stop-failed': 'updateFailedStop',
      'tasks-changed': 'updateFailedTasksChanged',
      'tasks-unavailable': 'updateFailedTasksUnavailable',
      'fullscreen-timeout': 'updateFailedFullscreen',
    };

    function updateFailureCopy(state, copy) {
      const key = UPDATE_FAILURE_KEYS[state?.failure] ?? 'updateFailedGeneric';
      return copy[key] ?? copy.updateFailedGeneric;
    }

    const UPDATE_CONFIGURATION_KEYS = {
      read: 'updateConfigRead',
      format: 'updateConfigFormat',
      channel: 'updateConfigChannel',
      cleanup: 'updateConfigCleanup',
    };

    /** DSH 0.2.2-rc.2 added channel configuration failures to the presentation. */
    function updateConfigurationCopy(state, copy) {
      const key = UPDATE_CONFIGURATION_KEYS[state?.configurationError] ?? 'updateConfigGeneric';
      return {
        label: copy.updateConfigUnavailable,
        detail: copy[key] ?? copy.updateConfigGeneric,
      };
    }

    function updatePresentationCopy(state, failed, copy) {
      if (failed) return { label: copy.updateRetry, detail: copy.updateRetry };
      if (typeof state?.configurationError === 'string') return updateConfigurationCopy(state, copy);
      const version = typeof state?.version === 'string' ? state.version : undefined;
      switch (state?.phase) {
        case 'available': {
          const label = version === undefined
            ? copy.updateAvailablePlain
            : formatCopy(copy.updateAvailable, { version });
          return { label, detail: label };
        }
        case 'downloading': {
          const percent = Math.max(0, Math.min(100, Math.round(Number(state.percent) || 0)));
          const label = formatCopy(copy.updateDownloading, { percent });
          return {
            label,
            detail: version === undefined
              ? label
              : formatCopy(copy.updateDownloadingDetail, { percent, version }),
          };
        }
        case 'verifying':
          return { label: copy.updateVerifying, detail: copy.updateVerifying };
        case 'installing':
          return { label: copy.updateInstalling, detail: copy.updateInstalling };
        case 'ready':
          return {
            label: copy.updateReady,
            detail: version === undefined
              ? copy.updateReady
              : formatCopy(copy.updateReadyDetail, { version }),
          };
        case 'error':
          return { label: copy.updateRetry, detail: updateFailureCopy(state, copy) };
        default:
          return { label: '', detail: '' };
      }
    }

    /** One subscription shared by the rail button; null until the bridge answers. */
    function useDesktopUpdate() {
      const updates = React.useMemo(() => desktopUpdateBridge(), []);
      const [view, setView] = React.useState({ state: undefined, failed: false });

      React.useEffect(() => {
        if (updates === undefined) return undefined;
        let live = true;
        let received = false;
        const apply = (state) => {
          if (!live) return;
          received = true;
          setView({ state, failed: false });
        };
        let unsubscribe;
        try {
          unsubscribe = updates.subscribe?.(apply);
        } catch {
          /* a bridge without a subscriber still gets the status probe */
        }
        Promise.resolve()
          .then(() => updates.status())
          .then(
            (state) => {
              if (live && !received) apply(state);
            },
            () => {
              if (live && !received) setView({ state: undefined, failed: true });
            },
          );
        return () => {
          live = false;
          try {
            unsubscribe?.();
          } catch {
            /* already detached by the shell */
          }
        };
      }, [updates]);

      return { updates, ...view };
    }

    /**
     * Desktop update entry above the settings gear. Available and ready are
     * actionable; busy phases are a 3x3 dot-matrix animation; failures keep
     * the same footprint with a danger tint and a retry glyph.
     */
    function IslandsUpdateButton() {
      const { updates, state, failed } = useDesktopUpdate();
      const [pending, setPending] = React.useState(false);
      const enabled = useEnabled();
      const lang = useLocale() ?? 'en';
      const copy = String(lang).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      const configurationError = typeof state?.configurationError === 'string';
      const phase = failed || configurationError ? 'error' : state?.phase;
      if (!enabled || updates === undefined || phase === undefined || phase === 'idle') return null;
      if (!['available', 'downloading', 'verifying', 'installing', 'ready', 'error'].includes(phase)) return null;

      const clickable = phase === 'available' || phase === 'ready' || phase === 'error';
      const busy = pending || phase === 'downloading' || phase === 'verifying' || phase === 'installing';
      const { label, detail } = updatePresentationCopy(state, failed, copy);
      const open = () => {
        if (!clickable || pending) return;
        setPending(true);
        Promise.resolve()
          .then(() => updates.open())
          .catch(() => {})
          .finally(() => setPending(false));
      };

      return h(
        'button',
        {
          type: 'button',
          className: `isl-updateButton is-${phase}${clickable ? ' is-clickable' : ''}${pending ? ' is-pending' : ''}`,
          'data-phase': phase,
          'data-clickable': clickable ? 'true' : 'false',
          title: detail,
          'aria-label': label,
          'aria-disabled': clickable ? undefined : 'true',
          'aria-busy': busy ? 'true' : undefined,
          onClick: open,
        },
        h(UpdateGlyph, { phase }),
        phase === 'error' ? h('span', { className: 'isl-updateErrorDot', 'aria-hidden': true }) : null,
      );
    }

    const UPDATE_SHOWCASE_PHASES = ['available', 'downloading', 'verifying', 'installing', 'ready', 'error'];
    const UPDATE_STATE_LABELS = {
      available: 'updateStateAvailable',
      downloading: 'updateStateDownloading',
      verifying: 'updateStateVerifying',
      installing: 'updateStateInstalling',
      ready: 'updateStateReady',
      error: 'updateStateError',
    };

    /** Static, non-interactive copies of the rail button for the settings page. */
    function IslandsUpdateShowcase({ copy }) {
      return h(
        'div',
        { className: 'isl-updateShowcase' },
        h(
          'div',
          { className: 'isl-updateShowcaseHead' },
          h('div', { className: 'isl-updateShowcaseTitle' }, copy.updateShowcaseTitle),
          h('div', { className: 'isl-updateShowcaseDesc' }, copy.updateShowcaseDesc),
        ),
        h(
          'div',
          { className: 'isl-updateShowcaseGrid' },
          UPDATE_SHOWCASE_PHASES.map((phase) => {
            const label = copy[UPDATE_STATE_LABELS[phase]] ?? phase;
            return h(
              'div',
              { className: 'isl-updateShowcaseItem', key: phase },
              h(
                'div',
                { className: 'isl-updateShowcaseStage' },
                h(
                  'span',
                  {
                    className: `isl-updateButton is-preview is-${phase}`,
                    'data-phase': phase,
                    title: label,
                    'aria-hidden': 'true',
                  },
                  h(UpdateGlyph, { phase }),
                  phase === 'error' ? h('span', { className: 'isl-updateErrorDot' }) : null,
                ),
              ),
              h('div', { className: 'isl-updateShowcaseLabel' }, label),
              h('div', { className: 'isl-updateShowcasePhase' }, phase),
            );
          }),
        ),
      );
    }

    const EMPTY_MENU_STATE = Object.freeze({ current: null, groups: [], status: 'idle', retainedEffort: undefined, error: null });

    function modelIn(groups, selection) {
      for (const group of groups) {
        if (group.id !== selection.provider) continue;
        const model = group.models.find((entry) => entry.id === selection.model);
        if (model !== undefined) return model;
      }
      return undefined;
    }

    /**
     * Composer model + reasoning picker. Replaces the shipped two-level menu:
     * the trigger is a chip, the menu opens straight onto the model list, and
     * reasoning effort lives on a stepped slider.
     */
    function ModelPicker({ sessionId, locked }) {
      const active = useLocale() ?? 'en';
      const copy = String(active).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      const directory = React.useMemo(() => {
        try {
          return modelDirectories !== undefined && sessionId !== undefined
            ? modelDirectories.directoryFor(sessionId)
            : null;
        } catch {
          return null;
        }
      }, [sessionId]);
      const subscribe = React.useCallback(
        (listener) => (directory === null ? () => {} : directory.store.subscribe(listener)),
        [directory],
      );
      const getSnapshot = React.useCallback(
        () => (directory === null ? EMPTY_MENU_STATE : directory.store.getSnapshot()),
        [directory],
      );
      const state = React.useSyncExternalStore(subscribe, getSnapshot);
      const [open, setOpen] = React.useState(false);
      const [position, setPosition] = React.useState(null);
      const [pane, setPane] = React.useState('effort');
      const [draft, setDraft] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const rootRef = React.useRef(null);
      const triggerRef = React.useRef(null);
      const panelRef = React.useRef(null);

      React.useEffect(() => {
        if (directory !== null) directory.load().catch(() => {});
      }, [directory]);

      const current = state.current ?? null;
      const groups = Array.isArray(state.groups) ? state.groups : [];
      const reasoning = current !== null && directory !== null ? directory.catalog.reasoningFor(current) : undefined;
      const efforts = Array.isArray(reasoning?.efforts) ? reasoning.efforts : [];
      const effective = current?.reasoningEffort ?? reasoning?.defaultEffort;
      // 有些模型给了等级列表却没给默认值：此时退回「滑杆停在哪一档」的名字，
      // 不要让强制项标签空着（空标签会让用户看不出当前强度）。
      const sliderId = draft ?? effective ?? efforts[0]?.id;
      const effortName = efforts.find((level) => level.id === sliderId)?.name ?? state.retainedEffort;
      const modelName = current === null
        ? state.status === 'loading' ? copy.loading : copy.pick
        : modelIn(groups, current)?.name ?? current.model;

      const close = () => {
        setOpen(false);
        setError('');
        setDraft(null);
      };

      const openMenu = () => {
        if (locked || directory === null) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect === undefined) return;
        setPosition({
          bottom: Math.max(8, window.innerHeight - rect.top + 8),
          right: Math.max(8, window.innerWidth - rect.right),
          width: Math.min(300, window.innerWidth - 24),
        });
        setPane('effort');
        setDraft(null);
        setError('');
        setOpen(true);
        directory.load().catch(() => {});
      };

      React.useEffect(() => {
        const onOpen = () => openMenu();
        window.addEventListener('islands:model-open', onOpen);
        return () => window.removeEventListener('islands:model-open', onOpen);
      }, [openMenu]);

      React.useEffect(() => {
        if (!open) return;
        const onDown = (event) => {
          if (rootRef.current?.contains(event.target) === true) return;
          if (panelRef.current?.contains(event.target) === true) return;
          close();
        };
        const onKey = (event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          close();
        };
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
          document.removeEventListener('mousedown', onDown, true);
          document.removeEventListener('keydown', onKey, true);
        };
      }, [open]);

      const choose = (selection, stayOpen = false) => {
        if (directory === null || busy) return;
        setBusy(true);
        setError('');
        directory
          .select(selection)
          .then((result) => {
            setBusy(false);
            if (result.ok) {
              if (stayOpen) {
                setPane('effort');
                setDraft(null);
              } else {
                close();
              }
            } else {
              setError(result.error?.message ?? copy.failed);
            }
          })
          .catch((problem) => {
            setBusy(false);
            setError(String(problem?.message ?? problem));
          });
      };

      const chooseEffort = (effortId) => {
        if (directory === null || current === null || busy) return;
        setDraft(effortId);
        setBusy(true);
        setError('');
        directory
          .select({ provider: current.provider, model: current.model, reasoningEffort: effortId })
          .then((result) => {
            setBusy(false);
            if (!result.ok) setError(result.error?.message ?? copy.failed);
          })
          .catch((problem) => {
            setBusy(false);
            setError(String(problem?.message ?? problem));
          });
      };

      const sliderIndex = Math.max(0, efforts.findIndex((level) => level.id === sliderId));
      const percent = efforts.length > 1 ? Math.round((sliderIndex / (efforts.length - 1)) * 100) : 0;

      const trigger = h(
        'button',
        {
          ref: triggerRef,
          type: 'button',
          className: 'isl-modelTrigger',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-label': modelName,
          title: withShortcut(
            effortName === undefined ? modelName : `${modelName} · ${effortName}`,
            'islands.model.open',
            /Mac/i.test(navigator.platform ?? '') ? '⌘⇧M' : 'Ctrl+Shift+M',
          ),
          disabled: locked || directory === null,
          onClick: () => (open ? close() : openMenu()),
        },
        h('span', { className: 'isl-modelIcon' }, h(ModelGlyph)),
        h('span', { className: 'isl-modelName' }, modelName),
        effortName === undefined ? null : h('span', { className: 'isl-modelEffort' }, effortName),
        h('span', { className: 'isl-modelChevron' + (open ? ' is-open' : '') }, h(ChevronGlyph)),
      );

      const modelPane = h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'isl-modelPaneHead' },
          h(
            'button',
            {
              type: 'button',
              className: 'isl-modelBack',
              title: copy.back,
              'aria-label': copy.back,
              onClick: () => setPane('effort'),
            },
            h('span', { className: 'isl-modelBackIcon' }, h(ChevronGlyph)),
          ),
          h('span', { className: 'isl-modelMenuTitle' }, copy.models),
        ),
        h(
          'div',
          { className: 'isl-modelGroups' },
          groups.length === 0
            ? h('div', { className: 'isl-modelEmpty' }, state.status === 'loading' ? copy.loading : copy.empty)
            : groups.map((group) =>
                h(
                  'div',
                  { className: 'isl-modelGroup', key: group.id },
                  h('div', { className: 'isl-modelGroupName' }, group.name),
                  group.models.map((model) => {
                    const selected = current !== null && current.provider === group.id && current.model === model.id;
                    return h(
                      'button',
                      {
                        type: 'button',
                        role: 'menuitemradio',
                        'aria-checked': selected,
                        className: 'isl-modelOption' + (selected ? ' is-selected' : ''),
                        key: model.id,
                        onClick: () => choose({ provider: group.id, model: model.id }, true),
                      },
                      h('span', { className: 'isl-modelOptionName' }, model.name),
                      selected ? h('span', { className: 'isl-modelCheck' }, h(CheckGlyph)) : null,
                    );
                  }),
                ),
              ),
        ),
      );

      const ratio = efforts.length > 1 ? sliderIndex / (efforts.length - 1) : 0;

      const effortPane = h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'isl-effortPopup' },
          h(
            'button',
            {
              type: 'button',
              className: 'isl-effortReset',
              title: copy.reset,
              'aria-label': copy.reset,
              disabled: reasoning?.defaultEffort === undefined,
              onClick: () => chooseEffort(reasoning?.defaultEffort),
            },
            h(ResetGlyph),
          ),
          h('div', { className: 'isl-effortName' }, effortName ?? ''),
          h(
            'button',
            { type: 'button', className: 'isl-effortModel', onClick: () => setPane('model'), title: copy.models },
            h('span', { className: 'isl-effortModelName' }, modelName),
            h('span', { className: 'isl-effortModelChevron' }, h(ChevronGlyph)),
          ),
          efforts.length > 1
            ? h(
                'div',
                { className: 'isl-effortSliderWrap' },
                h('input', {
                  type: 'range',
                  className: 'isl-effortSlider',
                  min: 0,
                  max: Math.max(0, efforts.length - 1),
                  step: 1,
                  value: sliderIndex,
                  'aria-label': copy.effort,
                  style: { '--isl-ratio': String(ratio) },
                  onChange: (event) => setDraft(efforts[Number(event.target.value)]?.id),
                  onPointerUp: () => {
                    if (draft !== null && draft !== effective) chooseEffort(draft);
                  },
                  onKeyUp: () => {
                    if (draft !== null && draft !== effective) chooseEffort(draft);
                  },
                }),
                h(
                  'div',
                  { className: 'isl-effortDots', 'aria-hidden': true },
                  efforts.map((level, index) =>
                    h('span', {
                      key: level.id,
                      className: 'isl-effortDot' + (index <= sliderIndex ? ' is-filled' : ''),
                    }),
                  ),
                ),
              )
            : h('div', { className: 'isl-modelEmpty' }, copy.noEffort),
        ),
      );

      const panel = open && position !== null
        ? ReactDOM.createPortal(
            h(
              'div',
              {
                ref: panelRef,
                className: 'isl-modelMenu',
                role: 'menu',
                style: { right: position.right, bottom: position.bottom, width: position.width },
              },
              pane === 'model' ? modelPane : effortPane,
              error === '' ? null : h('div', { className: 'isl-modelError' }, error),
            ),
            document.body,
          )
        : null;

      return h('div', { className: 'isl-model', ref: rootRef }, trigger, panel);
    }

    /** Live open/closed state of the native right sidebar, read from its attribute. */
    function useRightPanelOpen() {
      const [open, setOpen] = React.useState(false);
      React.useEffect(() => {
        const read = () => setOpen(document.querySelector('.Dv5QdW_panel[data-sidebar-right-open]') !== null);
        read();
        const observer = new MutationObserver(read);
        // The pane can mount already open (restored layout), in which case no
        // attribute mutation for its open state is ever observed. Watch for
        // insertion too, not only later attribute flips.
        observer.observe(document.getElementById('root') ?? document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['data-sidebar-right-open'],
        });
        return () => observer.disconnect();
      }, []);
      return open;
    }

    function rightPanelOpenNow() {
      return document.querySelector('.Dv5QdW_panel[data-sidebar-right-open]') !== null;
    }

    /**
     * The shipped control is a button that the skin hides and DSH can disable
     * (it is `disabled` whenever the layout already counts the pane as open),
     * so clicking it is not a dependable contract. Ask the layout service
     * first and only fall back to the control when the service ignored us.
     */
    function toggleRightPanel() {
      const wantOpen = !rightPanelOpenNow();
      try {
        if (wantOpen) layoutService?.openRightbar?.(true, false);
        else layoutService?.closeRightbar?.();
      } catch {
        /* fall through to the shipped control */
      }
      window.setTimeout(() => {
        if (rightPanelOpenNow() === wantOpen) {
          // The pane can be mounted with its width preference already set;
          // republish so a collapsed workspace gets the right grid track.
          if (wantOpen) publishRightbarWidth?.();
          return;
        }
        const selector = wantOpen ? '[data-sidebar-right-expand]' : '[data-sidebar-right-toggle]';
        const target = document.querySelector(selector);
        if (target instanceof HTMLElement) target.click();
      }, 120);
    }

    /**
     * Always-visible right sidebar toggle; drives the native open/collapse actions.
     *
     * Rendered into `document.body`, not into the top bar: the frame's overlay
     * layer is z-index 20, while the workbench panel host (dsh-better-sidebar)
     * is a full-viewport fixed layer at z-index 25 and re-enables pointer
     * events on its dock strip — the same top-right band the native expand
     * button used to occupy. Anything painted inside the frame therefore sits
     * UNDER that strip: the toggle still renders (the strip is transparent
     * there) but never sees hover or clicks. A body-level portal escapes both
     * stacking contexts; the stylesheet keeps it above the workbench
     * (25/40/60/90) and below the app's menus and dialogs (1000+).
     */
    function RightPanelToggle() {
      const open = useRightPanelOpen();
      const active = useLocale() ?? 'en';
      const copy = String(active).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      const label = open ? copy.closeRight : copy.openRight;
      return ReactDOM.createPortal(
        h(
          'button',
          {
            type: 'button',
            className: 'isl-rightToggle',
            'aria-label': withShortcut(label, 'sidebar.right.toggle'),
            title: withShortcut(label, 'sidebar.right.toggle'),
            'aria-pressed': open,
            onClick: toggleRightPanel,
          },
          h(RightPanelGlyph),
        ),
        document.body,
      );
    }

    /**
     * Collapse the workspace island without asking DSH to swap the sidebar for
     * its rail-only render tree. The expanded rail stays mounted, the workspace
     * column is hidden, and the frame track shrinks to the rail width.
     */
    function toggleWorkspace() {
      const frame = document.querySelector('.PIRFFq_frame');
      if (frame !== null && frame.hasAttribute('data-sidebar-drawer')) {
        // Narrow layout: the workspace is a drawer, owned by DSH's native
        // narrow expansion state. The rail's home button and the shortcut both
        // open/close it here.
        layoutService?.toggleSidebar();
        return;
      }
      if (frame !== null && frame.hasAttribute('data-sidebar-collapsed')) {
        layoutService?.toggleSidebar();
        document.body.removeAttribute(WORKSPACE_ATTR);
        return;
      }
      const collapsed = document.body.hasAttribute(WORKSPACE_ATTR);
      if (collapsed) document.body.removeAttribute(WORKSPACE_ATTR);
      else document.body.setAttribute(WORKSPACE_ATTR, '');
      if (frame !== null) {
        frame.setAttribute('data-islands-animating', '');
        window.clearTimeout(animateTimer);
        animateTimer = window.setTimeout(() => {
          frame.removeAttribute('data-islands-animating');
        }, 360);
      }
    }

    /** Window chrome strip above the islands; owns the workspace toggle. */
    function IslandsTopBar() {
      const active = useLocale() ?? 'en';
      const copy = String(active).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      return h(
        'header',
        { className: 'isl-topbar' },
        h('div', { className: 'isl-topbarLead', 'aria-hidden': true }),
        h(
          'button',
          {
            type: 'button',
            className: 'isl-topbarToggle',
            'aria-label': withShortcut(copy.topbarToggle, 'sidebar.left.toggle'),
            title: withShortcut(copy.topbarToggle, 'sidebar.left.toggle'),
            onClick: () => toggleWorkspace(),
          },
          h(PanelGlyph),
        ),
        h('div', { className: 'isl-topbarDrag', 'aria-hidden': true }),
        h(RightPanelToggle),
      );
    }

    function IslandsLogo({ size = 30 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', 'aria-hidden': true },
        h('rect', { width: 64, height: 64, rx: 16, fill: '#0f1115' }),
        h('rect', { x: 10, y: 10, width: 44, height: 44, rx: 11, fill: '#22252b' }),
        h('rect', { x: 16, y: 16, width: 14, height: 32, rx: 6, fill: '#4176e6' }),
        h('rect', { x: 34, y: 16, width: 14, height: 14, rx: 6, fill: '#f5f7fa' }),
        h('rect', { x: 34, y: 34, width: 14, height: 14, rx: 6, fill: '#7aaaff' }),
      );
    }

    /** One pinned row: hover reveals unpin + locate, and a clipped title marquees. */
    function PinnedRow({ session, copy, pinIcon }) {
      const titleRef = React.useRef(null);
      const frameRef = React.useRef(0);
      const revealingRef = React.useRef(false);
      const id = session.id ?? session.sessionId;
      const title = String(session.title ?? '').trim() || copy.untitled;
      // 头像与侧栏同一套：未命名的会话按 id 取色，命名后跟标题走。
      let avatar = null;
      if (typeof host.avatarUrl === 'function') {
        try {
          avatar = host.avatarUrl(String(session.title ?? '').trim() || String(id ?? ''));
        } catch {
          avatar = null;
        }
      }

      React.useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

      const place = (left, range) => {
        const element = titleRef.current;
        if (element === null) return;
        if (typeof element.scrollTo === 'function') element.scrollTo({ left, behavior: 'instant' });
        else element.scrollLeft = left;
        if (left > 0) element.dataset.scrolled = '';
        else delete element.dataset.scrolled;
        if (left < range) element.dataset.clipped = '';
        else delete element.dataset.clipped;
      };

      const enter = (event) => {
        if (event?.pointerType === 'touch') return;
        if (titleRef.current === null || revealingRef.current) return;
        revealingRef.current = true;
        cancelAnimationFrame(frameRef.current);
        // Measure after hover has laid out the two action buttons; otherwise
        // the title still has its resting width and the marquee never starts.
        frameRef.current = requestAnimationFrame(() => {
          const element = titleRef.current;
          if (element === null) return;
          const range = element.scrollWidth - element.clientWidth;
          if (range <= 8) return;
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            place(range, range);
            return;
          }
          let previous;
          let position = 0;
          const step = (now) => {
            position += previous === undefined ? 0 : (now - previous) * 0.03;
            previous = now;
            place(Math.min(position, range), range);
            if (position < range) frameRef.current = requestAnimationFrame(step);
          };
          frameRef.current = requestAnimationFrame(step);
        });
      };

      const leave = () => {
        revealingRef.current = false;
        cancelAnimationFrame(frameRef.current);
        place(0, 0);
      };

      return h(
        'div',
        {
          className: 'isl-pinnedRow',
          role: 'button',
          tabIndex: 0,
          title,
          onClick: () => uiWorkspaceService?.openSession(id),
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            uiWorkspaceService?.openSession(id);
          },
          onPointerEnter: enter,
          onPointerLeave: leave,
        },
        avatar === null
          ? null
          : h('span', {
              className: 'isl-pinnedAvatar',
              'aria-hidden': true,
              style: { backgroundImage: `url("${avatar}")` },
            }),
        h('span', { className: 'isl-pinnedName', ref: titleRef }, title),
        h(
          'button',
          {
            type: 'button',
            className: 'isl-pinnedPinBtn',
            title: copy.unpin,
            'aria-label': copy.unpin,
            onClick: (event) => {
              event.stopPropagation();
              workspacesService?.unpinSession?.(id).catch?.(() => {});
            },
          },
          pinIcon,
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'isl-pinnedLocate',
            title: copy.locate,
            'aria-label': copy.locate,
            onClick: (event) => {
              event.stopPropagation();
              revealPinnedSession(id, title);
            },
          },
          h(LocateGlyph),
        ),
      );
    }

    /**
     * Aggregate pinned sessions above the workspace groups. The block lives
     * in a host div inserted before the DSH workspace list, so it participates
     * in the sidebar flow while rendering as React through a portal.
     */
    function IslandsPinnedSection({ useWorkspaces, useSessions }) {
      const pinnedIds = useWorkspaces((state) => state.pinnedSessionIds ?? []);
      const sessions = useSessions((state) => state.byId ?? {});
      const [host, setHost] = React.useState(null);
      const [collapsed, setCollapsed] = React.useState(() => {
        try {
          return window.localStorage.getItem('dsh-wechat-skin:islands:pinned-collapsed') === '1';
        } catch {
          return false;
        }
      });
      const lang = useLocale() ?? 'en';
      const copy = String(lang).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;

      React.useEffect(() => {
        let current = null;
        const attach = () => {
          const header = document.querySelector('.Kjh-qa_sectionHeader');
          const tree = document.querySelector('.Kjh-qa_treeBody') ?? document.querySelector('.Kjh-qa_list');
          const target = header?.parentElement ?? tree?.parentElement;
          if (target === null || target === undefined) return;
          let anchor = target.querySelector(':scope > .isl-pinnedHost');
          if (anchor === null || !anchor.isConnected) {
            anchor = document.createElement('div');
            anchor.className = 'isl-pinnedHost';
          }
          // Sit between the New Session row and the Workspace section header.
          if (header !== null && header !== undefined) {
            if (anchor.nextElementSibling !== header) target.insertBefore(anchor, header);
          } else if (tree !== null && tree !== undefined) {
            if (anchor.nextElementSibling !== tree) target.insertBefore(anchor, tree);
          } else {
            target.appendChild(anchor);
          }
          if (current !== anchor) {
            current = anchor;
            setHost(anchor);
          }
        };
        attach();
        const timer = window.setInterval(attach, 800);
        return () => {
          window.clearInterval(timer);
          current?.remove();
        };
      }, []);

      const rows = pinnedIds.map((id) => sessions[id]).filter((session) => session !== undefined);
      const pinIcon = defaultPinIcon();
      if (host === null || rows.length === 0) return null;

      const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
          window.localStorage.setItem('dsh-wechat-skin:islands:pinned-collapsed', next ? '1' : '0');
        } catch {
          /* ignore */
        }
      };

      return ReactDOM.createPortal(
        h(
          'div',
          { className: 'isl-pinned', 'data-open': collapsed ? undefined : '' },
          h(
            'button',
            {
              type: 'button',
              className: 'isl-pinnedHead',
              'aria-expanded': !collapsed,
              title: copy.pinned,
              onClick: toggle,
            },
            h('span', { className: 'isl-pinnedChevron' }, h(ChevronGlyph)),
            h('span', { className: 'isl-pinnedTitle' }, copy.pinned),
            h('span', { className: 'isl-pinnedCount' }, String(rows.length)),
          ),
          collapsed
            ? null
            : h(
                'div',
                { className: 'isl-pinnedList' },
                rows.map((session) =>
                  h(PinnedRow, {
                    key: session.id ?? session.sessionId,
                    session,
                    copy,
                    pinIcon,
                  }),
                ),
              ),
        ),
        host,
      );
    }

    function WarningGlyph() {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M8 2.4 14.2 13H1.8L8 2.4Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' }),
        h('path', { d: 'M8 6.4v3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('circle', { cx: 8, cy: 11.3, r: 0.9, fill: 'currentColor' }),
      );
    }

    /** Amber bar at the top of the Islands page explaining the auto-disable. */
    function CompatibilityBanner({ copy, compat, onForce }) {
      if (compat.status !== 'missing') return null;
      return h(
        'div',
        { className: 'isl-compatBanner', role: 'alert' },
        h('span', { className: 'isl-compatBannerIcon' }, h(WarningGlyph)),
        h(
          'div',
          { className: 'isl-compatBannerText' },
          h('div', { className: 'isl-compatBannerTitle' }, copy.compatBannerTitle),
          h('div', { className: 'isl-compatBannerBody' }, copy.compatBannerBody),
          h(
            'div',
            { className: 'isl-compatBannerList' },
            h('span', null, `${copy.compatMissing}:`),
            compat.missing.map((selector) => h('code', { key: selector, className: 'isl-compatAnchor' }, selector)),
          ),
          h('div', { className: 'isl-compatBannerHint' }, copy.compatFix),
        ),
        h('button', { type: 'button', className: 'isl-compatBannerAction', onClick: onForce }, copy.compatForce),
      );
    }

    /**
     * Turn the skin on only when the build still matches the stylesheet.
     *
     * The plugin's own chrome is plain React and keeps rendering no matter what
     * DSH does, while every layout rule is keyed to the shipped class names. A
     * renamed anchor therefore yields a half-skinned, overlapping UI instead of
     * a clean fallback, so a mismatched build stays on the untouched default.
     */
    function startCompatibilityGate() {
      let frameHandle = null;
      let settled = false;
      let retries = 0;
      let contentSeenAt = null;
      const startedAt = Date.now();

      const stop = () => {
        if (frameHandle !== null) cancelAnimationFrame(frameHandle);
        frameHandle = null;
      };

      const fail = (missing) => {
        if (settled) return;
        settled = true;
        stop();
        setCompat({ status: 'missing', missing, forced: false, version: shellVersion, dialect: shellDialect });
        console.warn('[sone-wx islands] interface anchors missing; the skin stayed off:', {
          version: shellVersion,
          dialect: shellDialect,
          missing,
        });
        // Someone who already switched the skin off does not need a popup; the
        // settings page still carries the explanation.
        if (readStored()) showCompatibilityToast();
      };

      const pass = () => {
        if (settled) return;
        settled = true;
        stop();
        setCompat({ status: 'ok', missing: [], forced: false, version: shellVersion, dialect: shellDialect });
        activate();
      };

      const settle = () => {
        frameHandle = null;
        if (settled) return;
        // The version map picks the stylesheet, but the DOM is the authority on
        // what is actually rendered: if they disagree, trust the structure and
        // swap the variant before the skin turns on.
        const structure = detectShellDialect();
        if (structure !== null && structure !== 'unknown' && structure !== shellDialect) {
          console.warn('[sone-wx islands] shell structure differs from the reported version; selecting the matching stylesheet', {
            version: shellVersion,
            expected: shellDialect,
            actual: structure,
          });
          applyStylesheet(structure);
        }
        const missing = missingAnchors();
        if (missing.length === 0) {
          pass();
          return;
        }
        // Siblings can mount a frame after the frame element itself.
        retries += 1;
        if (retries < 4) {
          frameHandle = requestAnimationFrame(settle);
          return;
        }
        fail(missing);
      };

      const watch = () => {
        frameHandle = null;
        if (settled) return;
        if (document.querySelector(REQUIRED_ANCHORS[0]) !== null) {
          settle();
          return;
        }
        // Anything rendered into the app root means the shell mounted; if the
        // frame anchor is still absent after a grace period it was renamed,
        // and waiting for the hard timeout would only delay the notice.
        const root = document.getElementById('root') ?? document.body;
        if (contentSeenAt === null && root !== null && root.childElementCount > 0) {
          contentSeenAt = Date.now();
        }
        if (contentSeenAt !== null && Date.now() - contentSeenAt > COMPAT_CONTENT_GRACE_MS) {
          fail(missingAnchors());
          return;
        }
        if (Date.now() - startedAt > COMPAT_TIMEOUT_MS) {
          fail(missingAnchors());
          return;
        }
        frameHandle = requestAnimationFrame(watch);
      };

      frameHandle = requestAnimationFrame(watch);
      return stop;
    }

    function activate() {
      if (activated || skinRegistrar === null) return;
      activated = true;
      syncAttribute();
      applyAccent(readAccent());
      try {
        skinRegistrar();
      } catch (error) {
        console.warn('[sone-wx islands] failed to mount the skin', error);
        document.body?.removeAttribute(ATTRIBUTE);
      }
    }

    function forceEnable() {
      try {
        window.sessionStorage.setItem(FORCE_KEY, '1');
      } catch {
        /* private mode: the choice still applies for this page. */
      }
      const structure = detectShellDialect();
      if (structure !== null && structure !== 'unknown') applyStylesheet(structure);
      setCompat({ status: 'ok', missing: [], forced: true, version: shellVersion, dialect: shellDialect });
      activate();
    }

    /**
     * Plain-DOM toast: it must work while the shell is in an unknown state, so
     * it is appended to `body`, styled by the always-injected stylesheet and
     * removed without React.
     */
    function showCompatibilityToast() {
      if (document.body === null) return;
      const copy = currentCopy();
      const host = document.createElement('div');
      host.className = 'isl-compatToast';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      host.tabIndex = 0;
      host.title = copy.compatView;

      const body = document.createElement('div');
      body.className = 'isl-compatToastBody';
      const title = document.createElement('div');
      title.className = 'isl-compatToastTitle';
      title.textContent = copy.compatTitle;
      const text = document.createElement('div');
      text.className = 'isl-compatToastText';
      text.textContent = copy.compatBody;
      const action = document.createElement('div');
      action.className = 'isl-compatToastAction';
      action.textContent = copy.compatView;
      body.append(title, text, action);

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'isl-compatToastClose';
      close.setAttribute('aria-label', copy.compatDismiss);
      close.textContent = '\u00d7';

      let timer = null;
      let closed = false;
      const dismiss = () => {
        if (closed) return;
        closed = true;
        if (timer !== null) window.clearTimeout(timer);
        host.classList.remove('is-visible');
        window.setTimeout(() => host.remove(), 200);
      };

      const openSection = () => {
        dismiss();
        openSettings({ section: 'Islands UI' });
      };

      timer = window.setTimeout(dismiss, 5000);
      close.addEventListener('click', (event) => {
        event.stopPropagation();
        dismiss();
      });
      host.addEventListener('click', openSection);
      host.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openSection();
      });

      host.append(body, close);
      document.body.append(host);
      requestAnimationFrame(() => host.classList.add('is-visible'));
    }

    /** Islands settings page: skin switch + accent color. */
    function IslandsSettingsPage() {
      const on = useEnabled();
      const compat = useCompat();
      const lang = useLocale() ?? 'en';
      const copy = String(lang).toLowerCase().startsWith('zh') ? COPY.zh : COPY.en;
      const blocked = compat.status === 'missing';
      const [accent, setAccent] = React.useState(readAccent);
      const chooseAccent = (color) => {
        setAccent(color);
        applyAccent(color);
        storeAccent(color);
      };
      return h(
        'div',
        { className: 'isl-settingsPage' },
        h(
          'div',
          { className: 'isl-settingsPageHead' },
          h('span', { className: 'isl-settingsPageLogo' }, h(IslandsLogo, { size: 30 })),
          h(
            'div',
            { className: 'isl-settingsPageHeadText' },
            h('div', { className: 'isl-settingsPageTitle' }, copy.title),
            h('div', { className: 'isl-settingsPageDesc' }, copy.description),
          ),
        ),
        h(
          'div',
          { className: 'isl-settingsMeta' },
          h('span', null, copy.compatDetected),
          h('code', { className: 'isl-settingsMetaValue' }, shellVersion ?? 'unknown'),
          h('span', { className: 'isl-settingsMetaSeparator', 'aria-hidden': true }, '·'),
          h('span', null, copy.compatStructure),
          h(
            'code',
            { className: 'isl-settingsMetaValue' },
            shellDialect === 'scroll' ? copy.compatStructureScroll : copy.compatStructureFlat,
          ),
        ),
        h(CompatibilityBanner, { copy, compat, onForce: forceEnable }),
        compat.forced ? h('div', { className: 'isl-compatForced' }, copy.compatForced) : null,
        h(
          'div',
          { className: 'isl-prefRow' },
          h(
            'div',
            { className: 'isl-prefText' },
            h('div', { className: 'isl-prefTitle' }, copy.enable),
            h('div', { className: 'isl-prefDesc' }, copy.enableDesc),
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'switch',
              className: 'isl-switch',
              'aria-checked': on,
              'aria-label': copy.enable,
              title: blocked ? copy.compatBannerTitle : copy.enable,
              disabled: blocked,
              onClick: () => setEnabled(!on),
            },
            h('span', { className: 'isl-switchThumb' }),
          ),
        ),
        h(
          'div',
          { className: 'isl-prefRow' },
          h(
            'div',
            { className: 'isl-prefText' },
            h('div', { className: 'isl-prefTitle' }, copy.accent),
            h('div', { className: 'isl-prefDesc' }, copy.accentDesc),
          ),
          h(
            'div',
            { className: 'isl-accentPicker' },
            h('button', {
              type: 'button',
              className: 'isl-accentSwatch is-default' + (accent === null ? ' is-selected' : ''),
              title: copy.accentDefault,
              'aria-label': copy.accentDefault,
              'aria-pressed': accent === null,
              onClick: () => chooseAccent(null),
            }),
            ACCENT_PRESETS.map((color) =>
              h('button', {
                type: 'button',
                key: color,
                className:
                  'isl-accentSwatch' + (accent !== null && accent.toLowerCase() === color.toLowerCase() ? ' is-selected' : ''),
                style: { background: color },
                title: color,
                'aria-label': color,
                'aria-pressed': accent !== null && accent.toLowerCase() === color.toLowerCase(),
                onClick: () => chooseAccent(color),
              }),
            ),
            h(
              'label',
              { className: 'isl-accentCustom', title: copy.accentCustom },
              h('input', {
                type: 'color',
                value: accent ?? DEFAULT_ACCENT,
                'aria-label': copy.accentCustom,
                onChange: (event) => chooseAccent(event.target.value),
              }),
            ),
          ),
        ),
        // Preview hidden on request. The component and its styles stay in place;
        // restore the next line to show the state gallery again.
        // h(IslandsUpdateShowcase, { copy }),
      );
    }

    function IslandsSectionIcon({ size = 16 }) {
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 1.5, y: 1.5, width: 5.5, height: 5.5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('rect', { x: 9, y: 1.5, width: 5.5, height: 5.5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('rect', { x: 1.5, y: 9, width: 5.5, height: 5.5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('rect', { x: 9, y: 9, width: 5.5, height: 5.5, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
      );
    }

    /** 取一个可选服务：没有声明 inject 时 cordis 会抛，这里吞掉并降级。 */
    function safeService(ctx, name) {
      try {
        return ctx.get(name) ?? null;
      } catch {
        return null;
      }
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.inject(['uiWorkspace', 'workspaces'], (scope) => {
          uiWorkspaceService = scope.uiWorkspace;
          workspacesService = scope.workspaces;
        });

        pluginCtx = ctx;
        // 宿主把本层当作 sone-wx 的一部分来挂载，ctx 上没有声明 inject，
        // 直接取 ctx.locale / ctx.layout 会被 cordis 拒绝（without inject），
        // 所以一律走容错的 safeService()。
        localeService = safeService(ctx, 'locale');
        layoutService = safeService(ctx, 'layout');
        slotsService = ctx.slots;
        applyAccent(readAccent());

        // Pick the stylesheet before the first paint: the base sheet plus the
        // variant of the release the client booted with. The compatibility gate
        // verifies the mounted structure and can still swap it before the skin
        // turns on.
        shellVersion = readDshVersion();
        shellDialect = dialectForVersion(shellVersion) ?? SHELL_FLAT;

        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = 'sone-wx-islands';
          tag.dataset.pluginCss = 'sone-wx-islands/islands.css';
          tag.textContent = stylesheetFor(shellDialect);
          styleTag = tag;
          document.head.appendChild(tag);
          return () => {
            styleTag = null;
            tag.remove();
            document.body?.removeAttribute(ATTRIBUTE);
          };
        }, 'dsh-wechat-skin:islands: stylesheet');

        // Everything below turns the chrome on, so it runs only after the gate
        // has confirmed this build still matches the stylesheet.
        const registerSkinChrome = (ctx) => {
          ctx.effect(() => {
            const root = document.documentElement;
            let panel = null;
            let styleObserver = null;
            let mountObserver = null;
            let locateFrame = null;
            let retryTimer = null;

            // Publish the right pane's PREFERRED width, not the width the column
            // currently has. The column is 0 while the pane is closed (and while
            // the independent workspace collapse pins the right track), so a
            // measurement-based value can never recover after the pane opens:
            // the track would stay 0 and the panel clamp would keep it hidden.
            // The panel itself always carries its resolved width in
            // `--dsh-sidebar-width` (and its inline width), even while closed.
            const publish = () => {
              if (panel === null) return;
              const value = (panel.style.getPropertyValue('--dsh-sidebar-width') || panel.style.width || '').trim();
              if (value !== '') root.style.setProperty('--isl-rightbar-w', value);
            };

            const watch = (next) => {
              if (next === panel) return;
              styleObserver?.disconnect();
              styleObserver = null;
              panel = next;
              if (panel === null) return;
              styleObserver = new MutationObserver(publish);
              styleObserver.observe(panel, { attributes: true, attributeFilter: ['style'] });
              publish();
            };

            const locate = () => {
              locateFrame = null;
              const next = document.querySelector('.Dv5QdW_panel');
              watch(next);
              if (next === null) return;
              mountObserver?.disconnect();
              mountObserver = null;
              if (retryTimer !== null) {
                clearTimeout(retryTimer);
                retryTimer = null;
              }
            };

            const scheduleLocate = () => {
              if (locateFrame !== null) return;
              locateFrame = requestAnimationFrame(locate);
            };

            locate();
            publishRightbarWidth = locate;
            // The client applies before the shell mounts, so the first query can
            // miss the right pane. Watch until it appears (bounded: a profile
            // without the right pane must not keep a document-wide observer).
            if (panel === null && document.body !== null) {
              mountObserver = new MutationObserver(scheduleLocate);
              mountObserver.observe(document.body, { childList: true, subtree: true });
              retryTimer = setTimeout(() => {
                mountObserver?.disconnect();
                mountObserver = null;
                retryTimer = null;
              }, 10_000);
            }

            return () => {
              if (locateFrame !== null) cancelAnimationFrame(locateFrame);
              if (retryTimer !== null) clearTimeout(retryTimer);
              mountObserver?.disconnect();
              styleObserver?.disconnect();
              if (publishRightbarWidth === locate) publishRightbarWidth = null;
              root.style.removeProperty('--isl-rightbar-w');
            };
          }, 'dsh-wechat-skin:islands: rightbar width');

          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register({ name: 'shell.overlay', id: 'islands-topbar', order: -100 }, IslandsTopBar),
          );

          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register({ name: 'shell.overlay', id: 'islands-rail', order: -90 }, IslandsRail),
          );

          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register({ name: 'shell.overlay', id: 'islands-rail-settings', order: -89 }, IslandsRailSettings),
          );

          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register({ name: 'shell.overlay', id: 'islands-update', order: -87 }, IslandsUpdateButton),
          );

          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register({ name: 'shell.overlay', id: 'islands-pinned', order: -88 }, IslandsPinnedSection),
          );

          ctx.inject(['slots', 'modelDirectories'], (scope) => {
            modelDirectories = scope.modelDirectories;
            // Single slots render the lowest priority; a negative priority shadows
            // the shipped selector without colliding with it.
            scope.slots.inject('conversation.input.model', () =>
              scope.slots.register({ name: 'conversation.input.model', priority: -1 }, ModelPicker),
            );
          });

          // Take the workspace shortcut over at the shortcut service layer: fixed
          // input listeners run before the catalog dispatch, so the DSH
          // sidebar.left.toggle never swaps in its rail-only render tree.
          ctx.inject(['shortcuts'], (scope) => {
            shortcutsService = scope.shortcuts;

            ctx.effect(
              () => {
                try {
                  return scope.shortcuts.register({
                    id: 'islands.model.open',
                    label: () => 'Model picker',
                    defaults: {
                      'desktop:macos': { code: 'KeyM', modifiers: ['primary', 'shift'] },
                      'desktop:windows': { code: 'KeyM', modifiers: ['primary', 'shift'] },
                      'desktop:linux': { code: 'KeyM', modifiers: ['primary', 'shift'] },
                    },
                    regions: ['page', 'editable'],
                    modals: [],
                    resolve: () => ({
                      status: 'handled',
                      run: () => window.dispatchEvent(new CustomEvent('islands:model-open')),
                    }),
                  });
                } catch (error) {
                  console.warn('[sone-wx islands] model picker shortcut unavailable', error);
                  return undefined;
                }
              },
              'dsh-wechat-skin:islands: model picker shortcut',
            );

            if (typeof scope.shortcuts.observeFixedInput !== 'function') return;
          const off = scope.shortcuts.observeFixedInput((input) => {
              if (input.type !== 'keydown') return;
              if (!document.body.hasAttribute(ATTRIBUTE)) return;
              const gesture = input.gesture;
              if (gesture.code !== 'KeyB' || gesture.repeat || gesture.composing) return;
              if (!(gesture.meta || gesture.control) || gesture.alt || gesture.shift) return;
              const modal = input.context?.modal;
              if (modal !== null && modal !== undefined && modal !== 'sidebar') return;
              // Desktop delivers the platform's primary chord through the native
              // keyboard bridge, bypassing fixed input. Let that path collapse the
              // DSH and let the frame observer below convert it; intercepting both
              // would toggle twice. The secondary chord is handled here.
              const runtime = scope.shortcuts.runtime;
              const platform = scope.shortcuts.platform;
              const nativeOwned =
                runtime === 'desktop' &&
                ((platform === 'macos' && gesture.meta && !gesture.control) ||
                  (platform !== 'macos' && gesture.control && !gesture.meta));
              if (nativeOwned) return;
              input.consume();
              toggleWorkspace();
            });
            scope.effect(() => off, 'dsh-wechat-skin:islands: workspace collapse shortcut');
          });

          // The native primary chord reaches DSH's own sidebar collapse before any
          // fixed listener. Convert that collapse into our workspace collapse
          // immediately (and restore the expanded sidebar render tree) so the
          // old rail never stays on screen. Drawer mode is different: its open
          // state is native, and the independent desktop collapse must never hide
          // the drawer's workspace, so entering the drawer clears that attribute.
          ctx.effect(() => {
            let observer;
            let timer;
            const fix = () => {
              const frame = document.querySelector('.PIRFFq_frame');
              if (frame === null) return;
              if (frame.hasAttribute('data-sidebar-drawer')) {
                document.body.removeAttribute(WORKSPACE_ATTR);
                return;
              }
              if (!frame.hasAttribute('data-sidebar-collapsed')) return;
              const wasCollapsed = document.body.hasAttribute(WORKSPACE_ATTR);
              if (wasCollapsed) document.body.removeAttribute(WORKSPACE_ATTR);
              else document.body.setAttribute(WORKSPACE_ATTR, '');
              layoutService?.toggleSidebar();
            };
            const attach = () => {
              const frame = document.querySelector('.PIRFFq_frame');
              if (frame === null) {
                timer = window.setTimeout(attach, 200);
                return;
              }
              fix();
              observer = new MutationObserver(fix);
              observer.observe(frame, {
                attributes: true,
                attributeFilter: ['data-sidebar-collapsed', 'data-sidebar-drawer'],
              });
            };
            attach();
            return () => {
              window.clearTimeout(timer);
              observer?.disconnect();
            };
          }, 'dsh-wechat-skin:islands: native collapse conversion');
        };
        skinRegistrar = () => registerSkinChrome(ctx);

        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: 'sone-wx-islands', order: 51, label: '浮岛布局' },
            IslandsSettingsPage,
          ),
        );

        ctx.slots.inject('settings.section.icon', () =>
          ctx.slots.register({ name: 'settings.section.icon', id: 'sone-wx-islands' }, IslandsSectionIcon),
        );

        if (isForced()) {
          const structure = detectShellDialect();
          if (structure !== null && structure !== 'unknown') applyStylesheet(structure);
          setCompat({ status: 'ok', missing: [], forced: true, version: shellVersion, dialect: shellDialect });
          activate();
          return;
        }
        ctx.effect(() => startCompatibilityGate(), 'dsh-wechat-skin:islands: compatibility gate');      },
    };
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
    var MAX_TAGLINE = 40
    /** Host 只回错误码，文案在这里按当前语言取。 */
    var ERROR_KEYS = { unsupported_type: 'typeError', too_large: 'sizeError', bad_image: 'badImage', unauthorized: 'authError', forbidden: 'authError' }

    var TEXT = {
      zh: {
        entry: 'SONE主题',
        pageTitle: '品牌修改',
        mark: '品牌标志',
        markDesc: '显示在左侧栏顶部、收起状态的侧栏条，以及新会话页的大标志。',
        title: '品牌标题',
        titleDesc: '显示在标志右侧。留空则回到宿主默认标题。',
        titlePlaceholder: '留空使用默认',
        tagline: '新会话标语',
        taglineDesc: '新会话页大标志旁的标语文字。留空显示官方默认。',
        taglinePlaceholder: '留空使用默认',
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
        confirmAgain: '再点一次确认',
        resetHint: '清空标题、图片与标语，回到内置 SONE 标志',
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
        mark: 'Brand mark',
        markDesc: 'Shown at the top of the sidebar, in the collapsed rail, and as the large mark on the new-session page.',
        title: 'Brand title',
        titleDesc: 'Shown beside the mark. Leave it empty to fall back to the host title.',
        titlePlaceholder: 'Empty uses the default',
        tagline: 'New-session tagline',
        taglineDesc: 'The headline text beside the mark on the new-session page. Leave it empty to keep the default.',
        taglinePlaceholder: 'Empty uses the default',
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
        confirmAgain: 'Click again to confirm',
        resetHint: 'Clears the title, images and tagline back to the built-in SONE mark',
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
      heroTagline: '',
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
        heroTagline: typeof payload.heroTagline === 'string' ? payload.heroTagline : '',
        mark: payload.mark || null,
        wordmark: payload.wordmark || null
      })
      stampHeroTagline()
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

    /**
     * 在新会话页 hero 区渲染自定义标语：标语值写在 body 的 CSS 变量
     * --dsh-wc-hero-tagline 上，并由 body 的 data-dsh-wc-tagline-set 开关
     * 启用替换规则——WECHAT_CSS 把官方标题 span（无类名）font-size 归零，
     * 再用它的 ::after 以原标题字号渲染标语，视觉上直接替换官方标语文字。
     * body 不是 React 管辖节点，变量与开关一次写入全局生效，hero 区重挂载
     * 后自动带上，无需任何 DOM 插入/文本改写/MutationObserver 跟随——
     * 那些做法都会和 React 的重渲染打架（表现即标题与标语叠写、元素反复
     * 消失）。清空标语时移除变量与开关，官方标题原样恢复。
     */
    function applyHeroTagline(root, tagline) {
      if (typeof document === 'undefined' || !document.body || !document.body.style) return 0
      var wanted = String(tagline || '').trim()
      var current = document.body.style.getPropertyValue('--dsh-wc-hero-tagline') || ''
      var flagged = document.body.getAttribute('data-dsh-wc-tagline-set') || ''
      var next = wanted === '' ? '' : JSON.stringify(wanted)
      var nextFlag = wanted === '' ? '' : '1'
      if (current === next && flagged === nextFlag) return 0
      if (next === '') document.body.style.removeProperty('--dsh-wc-hero-tagline')
      else document.body.style.setProperty('--dsh-wc-hero-tagline', next)
      if (nextFlag === '') document.body.removeAttribute('data-dsh-wc-tagline-set')
      else document.body.setAttribute('data-dsh-wc-tagline-set', '1')
      return 1
    }

    function stampHeroTagline() {
      if (typeof document === 'undefined') return
      applyHeroTagline(document, state.heroTagline)
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
      var armedBrandPair = useState(null)
      var armedBrand = armedBrandPair[0]
      var setArmedBrand = armedBrandPair[1]
      var armBrandTimer = (0, _react.useRef)(null)
      useEffect(function () {
        return function () { if (armBrandTimer.current) window.clearTimeout(armBrandTimer.current) }
      }, [])
      function armBrand() {
        setArmedBrand('brand')
        if (armBrandTimer.current) window.clearTimeout(armBrandTimer.current)
        armBrandTimer.current = window.setTimeout(function () {
          setArmedBrand(function (current) { return current === 'brand' ? null : current })
        }, 4000)
      }
      var title = useState(snap.title)
      var tagline = useState(snap.heroTagline)
      var status = useState({ kind: '', detail: '' })
      var dirty = title[0] !== snap.title
      var taglineDirty = tagline[0] !== snap.heroTagline

      useEffect(function () {
        title[1](snap.title)
        tagline[1](snap.heroTagline)
      }, [snap.title, snap.heroTagline])

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

      function saveTagline() {
        if (!taglineDirty) return
        post({ heroTagline: tagline[0].trim() }).then(function () {
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
          return post({ title: '', wordmarkImage: false, heroMark: true, heroTagline: '' })
        }).then(function () {
          setStatus('ok', t('resetDone'))
          load().catch(function () {})
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
            h('div', { style: S.itemTitle }, t('tagline')),
            h('div', { style: S.itemHint }, t('taglineDesc'))),
          h('div', { style: S.itemControl },
            h('input', {
              style: S.input,
              value: tagline[0],
              maxLength: MAX_TAGLINE,
              placeholder: t('taglinePlaceholder'),
              onChange: function (event) {
                tagline[1](event.target.value)
                setStatus('', '')
              },
              onKeyDown: function (event) {
                if (event.key === 'Enter') { event.preventDefault(); saveTagline() }
                if (event.key === 'Escape') { tagline[1](snap.heroTagline); setStatus('', '') }
              },
              onBlur: function () { if (taglineDirty) saveTagline() }
            }),
            h('button', {
              type: 'button',
              className: 'dsh-wc-btn dsh-wc-btn-primary',
              disabled: !taglineDirty,
              onClick: saveTagline
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
            onClick: function () {
              if (armedBrand === 'brand') { setArmedBrand(null); resetBrand() } else armBrand()
            }
          }, armedBrand === 'brand' ? t('confirmAgain') : t('resetBrand')))))

      children.push(h('div', { style: S.status, key: 'status' },
        status[0].kind === 'err'
          ? h('span', { style: S.err }, status[0].detail)
          : status[0].kind === 'ok'
            ? h('span', { style: S.ok }, status[0].detail)
            : null))

      return h('div', { style: S.root, className: 'dsh-wc-brand-card', 'aria-label': t('pageTitle') }, children)
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


          load().catch(function () {})

          var onBrandReload = function () { load().catch(function () {}) }
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
        load().catch(function () {})
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
missing.length === 0 ? (0, react_jsx_runtime.jsx)(WechatSkinRow, props) : null,
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
let islandsDispose = null;
try {
const islands = createSoneIslandsLayer(require, {
css: ISLANDS_CSS,
cssVariants: ISLANDS_CSS_VARIANTS,
readEnabled: () => readJson(ISLANDS_KEY, true) !== false,
writeEnabled: (value) => writeJson(ISLANDS_KEY, value === true), avatarUrl: (key) => avatarUrlForKey(key)
});
islands.apply(ctx);
islandsDispose = () => { try { islands.setEnabled(false); } catch (e) {} };
} catch (error) { try { console.warn("[sone-wx] islands layer failed to mount", error); } catch (e) {} }
applyTableStabilizer(ctx);
if (ctx.slots && typeof ctx.slots.inject === "function") ctx.effect(() => {
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
try { if (islandsDispose) islandsDispose(); } catch {}
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