#! /bin/bash
BUILD_DIR=/build

cd ${BUILD_DIR}/jzod-ts
npm link # use local version of jzod

# Install ALL dependencies (including devDeps needed for building).
cd ${BUILD_DIR}/jzod
npm link
rm -f package-lock.json && npm install
npm run build

cd ${BUILD_DIR}/jzod-ts
npm link
npm link @miroir-framework/jzod
rm -f package-lock.json && npm install
npm run build


# ---------------------------------------------------------------------------
# Build in strict dependency order (mirrors build-all.sh / copilot-instructions)
# ---------------------------------------------------------------------------
cd ${BUILD_DIR}/miroir

# no need to install to build, the build does not depend on additional packages

# 0. use local versions of packages, this is a dev build, not a production release build
npm link @miroir-framework/jzod
npm link @miroir-framework/jzod-ts

# 1. Application deployment metadata packages (define core types as Jzod schemas)
npm run build -w miroir-test-app_deployment-miroir
npm run build -w miroir-test-app_deployment-admin
npm run build -w miroir-test-app_deployment-library
npm run build -w miroir-test-app_deployment-postgres
npm run build -w miroir-test-app_deployment-designer

# 2. miroir-core — includes devBuild step to generate TypeScript types from schemas
npm run devBuild -w miroir-core

# 3. Local-cache and store packages (can run in parallel, all only depend on miroir-core)
npm run build -w miroir-localcache-redux
npm run build -w miroir-store-filesystem
npm run build -w miroir-store-indexedDb
npm run build -w miroir-store-mongodb
npm run build -w miroir-store-postgres

# 3'. extract model bundles from example applications
npm run extract-library-model -w miroir-test-app_deployment-library
# npm run extract-postgresManager-model -w miroir-test-app_deployment-postgres

# 4. UI / MCP / diagram packages
npm run build -w miroir-react
npm run build -w miroir-mcp
npm run build -w miroir-diagram-class

NODE_OPTIONS=--max-old-space-size=4096 npm run build:release -w miroir-server

