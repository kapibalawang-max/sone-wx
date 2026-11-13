# 贡献指南

## 目录结构

- `src/` 是唯一可信来源：`src/css/skin/`（皮肤样式）、`src/css/ui/`（设置页样式）、`src/css/islands/`（浮岛结构层样式）、`src/js/islands.js`（浮岛结构层逻辑）、`src/client.template.js`（插件主体）。
- `client.js` 是构建产物，**不要手改**。改完 `src/` 后跑 `node build.mjs`。

## 提交前

```bash
node build.mjs --check   # client.js 与 src/ 是否一致
node --check client.js
npm run ci               # 构建校验 + 语法 + 27 个离线套件
npm test                 # 完整 45 套件（需要本机 Chrome 与 DSH 安装）
```

`npm test` 里有一组依赖本机 DSH（读 `app.asar` 校验 CSS Module 哈希类名），换了 DSH 版本要重跑 `node test/fixtures.mjs` 再跑一遍，哈希漂移时 `test/host-hash-test.mjs` 会指出来。

## 样式约定

- 颜色只用皮肤令牌（`--wc-*`）与宿主令牌（`--dsw-alias-*`），不写裸 hex；深浅主题与纸张主题各走同一套阶梯。
- 边框与分隔线一律 0.5px；字号档位不超过四档，最小 12px。
- 动效默认不做，需要反馈时用 ease-out、250ms。

## 提交信息

`<type>(sone-wx): v<版本> <一句话>`
