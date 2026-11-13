# Sone-wx

DeepSeek Harness 插件：**微信风格皮肤 + 品牌自定义**，设置里独立「SONE主题」分区（不再占用通用页）。

由三个本地插件合并而来（2026-11-08）：

- `dsh-wechat-skin`（移植自 licheng-ma/dsh-wechat-skin v1.0.0，本地已深度定制 79 轮）：绿色气泡、会话/消息头像、界面与正文两级字号、列表密度、对话宽度、侧边栏背景色、侧边栏入口排序、主题预设、输入框美化、设置页实时预览、适配自检、配置导出导入、输入框随内容自动增高、AI 头像开关（关闭后会话区左对齐）、我的头像开关（关闭后发送气泡贴右）、运行状态点圈、字体族/高对比度/头像形状、行高、减少动效、输入框效果（毛玻璃/发送形变/光标）、选中色与滚动条、深浅两套配色、对比度与交互收口。localStorage 键保持 `dsh-wechat-skin:*`，老数据直接延续。
- `dsh-brand-studio`：品牌标志/标题/文字标志图片，接管侧栏与新会话页品牌位。
- `dsh-table-stabilizer`：宽表格悬停跳动修复（把 `--dsh-scrollbar-width` 绑到表格容器，实测滚动条高度），纯 client 行为，无设置项。数据从 `~/.dsh/dsh-brand-studio/brand/` 首次启动自动迁移到 `~/.dsh/sone-wx/brand/`，接口 `/sone-wx/brand`。

## 结构

- `index.js` — Host 半：品牌数据真源 + webServer 路由（含一次性迁移）。
- `client.js` — Client 半：皮肤（含全部样式与行为）+ 品牌编辑器，合并注册一个 `settings.section`。
- 维护铁律沿用 dsh-wechat-skin：DSH 升级后哈希类名可能漂移，需按当前 `*.module.css` 重新映射；样式改 `client.js` 内 WECHAT_CSS（本插件无独立 src，双源合并为单源）。

## 更新记录
### v1.45.2

- 调整：移除会话区思考模块（reasoning）的背景色药丸——浅色 `rgba(0,0,0,.035)`、深色 `rgba(255,255,255,.06)` 的底色与配套内边距、圆角全部去掉，思考内容回归画布上的普通文字，仅保留字号随全局字阶缩放。

### v1.45.1

- 修复：设置页「SONE主题 渲染出错」（ReferenceError: useState/useEffect is not defined）。v1.43.0 在 WechatSkinRow 内新增分享码状态与 Esc 关闭逻辑时误用了裸 `useState`/`useEffect`，而该组件作用域内未引入这两个 Hook（其余代码均为 `(0, _react.useState)` 形式），React 渲染即抛错、被错误边界接管。现改为与组件内其他 Hook 一致的 `(0, _react.useState)`/`(0, _react.useEffect)` 写法。
- 验证：真实设置页（自签 cookie + headless Chrome）确认外观/消息/布局/辅助四组与 33 行设置项完整渲染、无渲染出错；43 套测试全绿。  

## 兼容

dsh 0.2.2-rc.1 / 0.2.2-rc.2（compatibility 声明，engines.node >=20.11）。宿主半永久保留 brand 的 webServer 实现（生产验证过），皮肤半只在「导出/导入配置」时访问本机的 `/sone-wx/brand` 路由，其余不联网。
