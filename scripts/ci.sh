#!/usr/bin/env bash
# 本地门禁：与 .github/workflows/ci.yml 跑同一套检查，任何时候都能在不联网的情况下验证。
# 用法：npm run ci
set -euo pipefail
cd "$(dirname "$0")/.."

echo '== build --check =='
node build.mjs --check

echo '== syntax =='
node --check client.js
node --check index.js
node --check src/js/islands.js

echo '== offline suites =='
node test/run-offline.mjs
