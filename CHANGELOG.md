# Changelog

本文件只保留最近若干版本；逐版完整记录在 [README.md](README.md) 的「更新记录」一节，
那里从 v1.0.0 起逐条列出。版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## 1.47.0

浮岛布局与构建分层。

- 新增 `src/` 与 `build.mjs`：`client.js` 变成构建产物，`node build.mjs --check` 校验，
  `test/build-check.mjs` 与 CI 都盯着这一步。
- 移植 dsh-islands-ui（MIT，DawnCHL）的结构层：浮岛画布与圆角面板、40px 自绘顶栏、
  常驻左侧图标栏（拖动排序 / 右键增删）、置顶聚合、两级模型与推理弹层、桌面更新入口、强调色。
- 结构层 `--isl-*` 全部桥接到 `--wc-*`；强调色写进皮肤令牌，选中态、焦点环、链接、
  图钉与模型药丸一起换色。
- 修掉结构层在宿主里静默挂不上的问题（`ctx` 无 inject 声明时 `ctx.layout` 会抛），
  改用容错的 `safeService()`。
- `NOTICE` 增补上游 MIT 版权与许可全文。

## 1.46.1

- 输入框玻璃让位 dsh-chat-ux（`[data-chat-ux-composer-glass]` 时不叠第二层玻璃）。
- 新增 `locale/zh.json`、`locale/en.json`，插件列表显示中文名而非裸包名。
- 视觉回归去掉 Python 依赖：`test/png.mjs` 纯 Node 解码与比对，新增 `test/png-test.mjs`
  钉住「pct 是百分比」这个单位。

## 1.46.0

公开前的全面审查与修复：星标不再改宿主列表几何（改为行内标记 + 26px 让位）、
分享弹层改为 portal + 焦点陷阱 + `Esc` 捕获、右栏 touched 改 sessionStorage、
标语换 `display:none` 方案、24 条被宿主内联压制的死声明、LICENSE/NOTICE/.gitignore、
README 恢复被截断的更新记录与安装章节、测试去本机路径与业务数据。

## 1.45.0

右栏面板默认宽度 45% → 35%，拖过手柄后永久尊重用户值，窗口变化按比例跟随。

## 1.44.0

会话星标：行内星形按钮、`dsh-wechat-skin:starred` 本地存储、按钮只注入一次、
`aria-pressed` 与中英双语标签。

## 1.43.0

预设分享码：`SWX1.<base64url>` 单行码，只含外观设置（不含头像图片与侧栏排序），
粘贴即导入，走与导入配置相同的校验链路。
