#!/usr/bin/env bash
set -euo pipefail

cd /home/user/miroir

npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
./build-all.sh