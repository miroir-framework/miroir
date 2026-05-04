# =============================================================================
# Miroir Framework — Docker Image
# =============================================================================
# Multi-stage build:
#   builder  – full npm install + ordered workspace builds
#   final    – slim Alpine runtime image
#
# Usage (see docker-compose.yml for the easy path):
#   docker build -t miroir-framework/miroir:latest .
#   docker run -p 3080:3080 -v miroir-data:/data miroir-framework/miroir:latest
#
# On first run with an empty /data volume the container seeds it with:
#   • Miroir framework model + data
#   • Admin application model + data
#   • Library demo application model + data
# Subsequent starts skip the seed step.
# =============================================================================


# =============================================================================
# Stage 1: builder — install all deps and build every workspace package
# =============================================================================
FROM node:22-alpine AS builder
WORKDIR /miroir

# Native build tools required by some npm packages (e.g. bcrypt, node-gyp)
RUN apk add --no-cache python3 make g++

# Copy the entire monorepo source
COPY . .

# Install ALL dependencies (including devDeps needed for building).
# The lockfile is generated on the host OS (Windows/macOS) and does NOT contain
# the musl-libc platform binaries needed by Alpine Linux (e.g.
# @rollup/rollup-linux-x64-musl). Deleting it forces npm to resolve optional
# native deps correctly for the current target platform.
RUN rm -f package-lock.json && npm install

# ---------------------------------------------------------------------------
# Build in strict dependency order (mirrors build-all.sh / copilot-instructions)
# ---------------------------------------------------------------------------

# 1. Application deployment metadata packages (define core types as Jzod schemas)
RUN npm run build -w miroir-test-app_deployment-miroir
RUN npm run build -w miroir-test-app_deployment-admin

# 2. miroir-core — includes devBuild step to generate TypeScript types from schemas
RUN npm run devBuild -w miroir-core

# 3. Local-cache and store packages (can run in parallel, all only depend on miroir-core)
RUN npm run build -w miroir-localcache-redux \
 && npm run build -w miroir-store-filesystem \
 && npm run build -w miroir-store-indexedDb \
 && npm run build -w miroir-store-mongodb \
 && npm run build -w miroir-store-postgres

# 4. UI / MCP / diagram packages
RUN npm run build -w miroir-react
RUN npm run build -w miroir-mcp
RUN npm run build -w miroir-diagram-class

# 5. Server (tsup bundle) and standalone app (Vite production build)
#    The standalone-app Vite config auto-detects missing TLS certs → uses plain
#    HTTP proxy target http://localhost:3080, which is correct for Docker.
RUN npm run build-tsup -w miroir-server
RUN npm run build -w miroir-standalone-app

# Remove devDependencies from node_modules to reduce the layer transferred to
# the final stage (saves several hundred MB).
RUN npm prune --omit=dev


# =============================================================================
# Stage 2: final — slim production image
# =============================================================================
FROM node:22-alpine
WORKDIR /miroir

# tini provides proper PID-1 signal handling (SIGTERM → graceful shutdown)
RUN apk add --no-cache tini

# -------------------------------------------------------------------------
# Workspace root
# -------------------------------------------------------------------------
COPY --from=builder /miroir/package.json /miroir/package-lock.json ./

# Production node_modules (workspace symlinks intact, devDeps stripped)
COPY --from=builder /miroir/node_modules ./node_modules

# -------------------------------------------------------------------------
# All workspace packages (dist/ + assets/ + package.json)
# Source files were left in the builder layer, not propagated here because
# the layer was already built — only the artifacts matter at runtime.
# -------------------------------------------------------------------------
COPY --from=builder /miroir/packages ./packages

# -------------------------------------------------------------------------
# Serve the SPA from the same Express server (same origin → no CORS needed)
# -------------------------------------------------------------------------
COPY --from=builder /miroir/packages/miroir-standalone-app/dist \
                    /miroir/packages/miroir-server/public

# -------------------------------------------------------------------------
# Docker-specific server config (HTTP, filesystemDeploymentRootDirectory=/data)
# Overrides the dev config that was pulled in with the packages/ copy above.
# -------------------------------------------------------------------------
COPY packages/miroir-server/config/miroirConfig.server.docker.json \
     /miroir/packages/miroir-server/config/miroirConfig.server.json

# -------------------------------------------------------------------------
# Seed data — bundled in the image, copied to /data on first run
#
# Layout mirrors the relative paths used in deployment configuration JSONs
# (filesystemDeploymentRootDirectory + deployment.configuration.*.directory).
#
# Miroir framework bootstrap data (read from deployment configs on startup):
#   miroir-test-app_deployment-miroir/assets/miroir_model   (model section)
#   miroir-test-app_deployment-miroir/assets/miroir_data    (data  section)
#   miroir-test-app_deployment-miroir/src/assets            (admin section)
#   miroir-test-app_deployment-admin/assets/admin_model     (model section)
#   miroir-test-app_deployment-admin/assets/admin_data      (data  section)
#
# Library demo application data:
#   miroir-test-app_deployment-library/assets/library_model
#   miroir-test-app_deployment-library/assets/library_data
# -------------------------------------------------------------------------

# Miroir framework assets
COPY --from=builder /miroir/packages/miroir-test-app_deployment-miroir/assets \
                    /seed/miroir-test-app_deployment-miroir/assets
COPY --from=builder /miroir/packages/miroir-test-app_deployment-miroir/src \
                    /seed/miroir-test-app_deployment-miroir/src

# Admin application assets
COPY --from=builder /miroir/packages/miroir-test-app_deployment-admin/assets \
                    /seed/miroir-test-app_deployment-admin/assets

# Library demo assets (model + data only; admin dir is created automatically by the store)
COPY --from=builder /miroir/packages/miroir-test-app_deployment-library/assets/library_model \
                    /seed/miroir-test-app_deployment-library/assets/library_model
COPY --from=builder /miroir/packages/miroir-test-app_deployment-library/assets/library_data \
                    /seed/miroir-test-app_deployment-library/assets/library_data

# Docker-specific seed overrides (Docker-compatible library deployment record with
# corrected directory paths — no ".." traversal — placed into admin_data).
COPY packages/miroir-server/docker/seed \
     /seed

# -------------------------------------------------------------------------
# Entrypoint
# -------------------------------------------------------------------------
COPY packages/miroir-server/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# -------------------------------------------------------------------------
# Runtime declarations
# -------------------------------------------------------------------------
VOLUME /data
EXPOSE 3080

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["node", "/miroir/packages/miroir-server/dist/server.js"]
