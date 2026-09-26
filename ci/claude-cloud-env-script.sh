#!/usr/bin/env bash
set -euo pipefail

cd /home/user/miroir

npm ci
# package-lock.json is generated on Windows and only records the win32 rollup binary (npm/cli#4828).
npm install --no-save "@rollup/rollup-linux-x64-gnu@$(node -p 'require("rollup/package.json").version')"
./build-all.sh