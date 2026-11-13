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
    const ACCENT_PRESETS = ['#4176e6', '#7c5cff', '#1f9d63', '#e07a2e', '#d94f8a', '#d64545'];
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
      const effortName = efforts.find((level) => level.id === effective)?.name ?? state.retainedEffort;
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

      const sliderId = draft ?? effective;
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
        console.warn('[islands-ui] interface anchors missing; the skin stayed off:', {
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
          console.warn('[islands-ui] shell structure differs from the reported version; selecting the matching stylesheet', {
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
        console.warn('[islands-ui] failed to mount the skin', error);
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

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.inject(['uiWorkspace', 'workspaces'], (scope) => {
          uiWorkspaceService = scope.uiWorkspace;
          workspacesService = scope.workspaces;
        });

        pluginCtx = ctx;
        localeService = ctx.locale;
        layoutService = ctx.layout;
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
                  console.warn('[islands-ui] model picker shortcut unavailable', error);
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
