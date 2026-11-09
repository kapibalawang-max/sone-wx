# Sone-wx

DeepSeek Harness 插件：**微信风格皮肤 + 品牌自定义**，设置里独立「SONE主题」分区（不再占用通用页）。

由三个本地插件合并而来（2026-11-08）：

- `dsh-wechat-skin`（移植自 licheng-ma/dsh-wechat-skin v1.0.0，本地已深度定制 79 轮）：绿色气泡、会话/消息头像、字号五档、消息密度、气泡尾巴、对话宽度、侧边栏宽度、侧边栏背景色、输入框拖高、运行状态点圈、深浅两套配色。localStorage 键保持 `dsh-wechat-skin:*`，老数据直接延续。
- `dsh-brand-studio`：品牌标志/标题/文字标志图片，接管侧栏与新会话页品牌位。
- `dsh-table-stabilizer`：宽表格悬停跳动修复（把 `--dsh-scrollbar-width` 绑到表格容器，实测滚动条高度），纯 client 行为，无设置项。数据从 `~/.dsh/dsh-brand-studio/brand/` 首次启动自动迁移到 `~/.dsh/sone-wx/brand/`，接口 `/sone-wx/brand`。

## 结构

- `index.js` — Host 半：品牌数据真源 + webServer 路由（含一次性迁移）。
- `client.js` — Client 半：皮肤（含全部样式与行为）+ 品牌编辑器，合并注册一个 `settings.section`。
- 维护铁律沿用 dsh-wechat-skin：DSH 升级后哈希类名可能漂移，需按当前 `*.module.css` 重新映射；样式改 `client.js` 内 WECHAT_CSS（本插件无独立 src，双源合并为单源）。

## 更新记录

- 2026-11-09 新增「侧边栏背景色」：默认值按微信 4.x 实测取色（会话列表 rgb(238,238,240)），深浅主题各一套；选自定义色时文字按底色亮度自动切换深/浅（会话列表、hover 行同步适配）；键 `dsh-wechat-skin:sidebar-bg`，「微信色」恢复默认。同日修掉 macOS 上 DSH 的蓝色渐变覆盖皮肤侧栏底色的问题（皮肤规则加 !important 提高优先级）。
- 2026-11-09 新增「侧边栏宽度」：设置页 200–440px 滑块（步进 4）直接改写三栏框架的侧栏轨道；自定义宽度时接管原生拖拽手柄（拖动即改宽度并落盘），状态栏显示当前 px；选「跟随系统」清除覆盖。键 `dsh-wechat-skin:sidebar-width`。
- 2026-11-08 审查修复：组分隔线统一 0.5px、次要按钮高度统一 30px、卸载时回收输入框拖拽监听与字号变量、diag 落盘改原子写。
- 2026-11-08 设置页布局统一：品牌半去卡片改扁平分组，与皮肤半同一套分组/字号/按钮/绿色主色。
- 2026-11-08 去掉「停用微信皮肤」开关：皮肤恒启用（enabled=true），删除 toggle/readEnabled/writeEnabled/STORAGE_KEY 与相关 locale 键，设置页保留字号/头像/密度/宽度/尾巴/恢复默认。

## 兼容

dsh 0.2.2-rc.1（compatibility 声明）。宿主半永久保留 brand 的 webServer 实现（生产验证过），皮肤半不做任何网络调用。
