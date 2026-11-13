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
const SKIN_VERSION = "1.47.7";
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
__SONE_CSS__
`;

				/** Settings-row button styles: injected even when the skin is off, so the row keeps hover/active/disabled feedback. */
		
const WECHAT_UI_CSS = `
__SONE_UI_CSS__
		`;

/** Sidebar-structure dialect stylesheets: only the one matching the running shell is appended. */
const SKIN_DIALECT_CSS = __SONE_DIALECTS__;

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
	const ISLANDS_CSS = `__SONE_ISLANDS_CSS__`;
	const ISLANDS_CSS_VARIANTS = __SONE_ISLANDS_CSS_VARIANTS__;

	__SONE_ISLANDS_LAYER__
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