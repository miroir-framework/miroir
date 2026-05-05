# =============================================================================
# Miroir Framework — Docker Image
# =============================================================================
# simple build:
#   ci-builder – full npm install + ordered workspace builds
#
# Usage (see docker-compose.yml for the easy path):
#   docker build -t miroir-framework/ci-builder:latest .
#   #docker run -p 3080:3080 -v miroir-data:/data miroir-framework/ci-builder:latest
#
# =============================================================================


# =============================================================================
# Stage 1: builder — install all deps and build every workspace package
# =============================================================================
FROM miroir-framework/ci-workspace-dev:latest AS ci-builder

# Native build tools required by some npm packages (e.g. bcrypt, node-gyp)
RUN apk add --no-cache python3 make g++

#WORKDIR /miroir/jzod-ts
#RUN npm link

# Install ALL dependencies (including devDeps needed for building).
WORKDIR /miroir/jzod
RUN npm link
RUN rm -f package-lock.json && npm install
RUN npm run build

WORKDIR /miroir/jzod-ts
RUN npm link
RUN npm link @miroir-framework/jzod
RUN rm -f package-lock.json && npm install
RUN npm run build


# ---------------------------------------------------------------------------
# Build in strict dependency order (mirrors build-all.sh / copilot-instructions)
# ---------------------------------------------------------------------------
WORKDIR /miroir/miroir

RUN npm link @miroir-framework/jzod
RUN npm link @miroir-framework/jzod-ts

# 1. Application deployment metadata packages (define core types as Jzod schemas)
RUN npm run build -w miroir-test-app_deployment-miroir
RUN npm run build -w miroir-test-app_deployment-admin
RUN npm run build -w miroir-test-app_deployment-library
RUN npm run build -w miroir-test-app_deployment-postgres
RUN npm run build -w miroir-test-app_deployment-designer

# 2. miroir-core — includes devBuild step to generate TypeScript types from schemas
RUN npm run devBuild -w miroir-core

# 3. Local-cache and store packages (can run in parallel, all only depend on miroir-core)
RUN npm run build -w miroir-localcache-redux
RUN npm run build -w miroir-store-filesystem
RUN npm run build -w miroir-store-indexedDb
RUN npm run build -w miroir-store-mongodb
RUN npm run build -w miroir-store-postgres

# 3'. extract model bundles from example applications
RUN npm run extract-library-model -w miroir-test-app_deployment-library
# RUN npm run extract-postgresManager-model -w miroir-test-app_deployment-postgres

# 4. UI / MCP / diagram packages
RUN npm run build -w miroir-react
RUN npm run build -w miroir-mcp
RUN npm run build -w miroir-diagram-class

# # 5. Server (tsup bundle) and standalone app (Vite production build)
# #    The standalone-app Vite config auto-detects missing TLS certs → uses plain
# #    HTTP proxy target http://localhost:3080, which is correct for Docker.
# #    NODE_OPTIONS increases the V8 heap limit to prevent OOM during Vite's large
# #    bundle compilation (default ~2 GB is not enough for this workspace).
# RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build -w miroir-standalone-app
# RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build:dev -w miroir-server
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build:release -w miroir-server

# Remove devDependencies from node_modules to reduce the layer transferred to
# the final stage (saves several hundred MB).
RUN npm prune --omit=dev
