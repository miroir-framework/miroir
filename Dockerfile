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

# Install ALL dependencies (including devDeps needed for building) from the
# lockfile, as CI does. The lockfile lists the musl-libc platform binaries Alpine
# needs (e.g. @rollup/rollup-linux-x64-musl). Resolving without it pulls newer
# versions than the ones the code is typed against (miroir-ai's dts build fails).
RUN npm ci --no-audit

# ---------------------------------------------------------------------------
# Build in strict dependency order (mirrors build-all.sh / copilot-instructions)
# ---------------------------------------------------------------------------

# 1. Application deployment metadata packages (define core types as ML schemas)
RUN npm run build -w miroir-app-miroir
RUN npm run build -w miroir-app-admin
RUN npm run build -w miroir-example-library
RUN npm run build -w miroir-example-postgres
RUN npm run build -w miroir-example-designer

# 2. miroir-core — includes devBuild step to generate TypeScript types from schemas
RUN npm run devBuild -w miroir-core

# 2'. miroir-env — environment resolution, imported by the server and by the
#     standalone-app vite.config.js
RUN npm run build -w miroir-env

# 3. Local-cache and store packages (can run in parallel, all only depend on miroir-core)
RUN npm run build -w miroir-localcache-redux \
 && npm run build -w miroir-store-bundled \
 && npm run build -w miroir-store-filesystem \
 && npm run build -w miroir-store-indexedDb \
 && npm run build -w miroir-store-mongodb \
 && npm run build -w miroir-store-postgres

# 3'. extract model bundles from example applications
RUN npm run extract-library-model -w miroir-example-library
# RUN npm run extract-postgresManager-model -w miroir-example-postgres

# 4. UI / MCP / diagram packages
RUN npm run build -w miroir-react
RUN npm run build -w miroir-mcp
RUN npm run build -w miroir-diagram-class
RUN npm run build -w miroir-ai

# 4'. Applications the standalone app bundles besides Library
RUN npm run build -w miroir-example-spotify
RUN npm run build -w miroir-fixture-appForTest

# 5. Standalone app (Vite production build), then the server release bundle
#    (ncc, packages/miroir-server/release/), which copies the client build into
#    release/client. The standalone-app Vite config auto-detects missing TLS
#    certs → uses plain HTTP proxy target http://localhost:3080, which is correct
#    for Docker. NODE_OPTIONS increases the V8 heap limit to prevent OOM during
#    Vite's large bundle compilation (default ~2 GB is not enough for this workspace).
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build -w miroir-standalone-app
RUN npm run build:release -w miroir-server

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
# Seed data — bundled in the image, copied to /data on first run (#345)
#
# /data is the root of the `docker` environment (environments/docker.json):
# the server runs with MIROIR_ROOT=/data and MIROIR_ENV=docker, and the
# environment places each application's assets at /data/<package>/assets
# (packagesDirectory "."). The Deployment and AdminApplication rows of Admin
# data are generated from the definition at every start, so the seed carries
# only their (empty) entity directories.
# -------------------------------------------------------------------------
COPY --from=builder /miroir/environments/docker.json /seed/environments/docker.json
COPY --from=builder /miroir/packages/miroir-app-miroir/assets /seed/miroir-app-miroir/assets
COPY --from=builder /miroir/packages/miroir-app-admin/assets /seed/miroir-app-admin/assets
COPY --from=builder /miroir/packages/miroir-example-library/assets/library_model \
                    /seed/miroir-example-library/assets/library_model
COPY --from=builder /miroir/packages/miroir-example-library/assets/library_data \
                    /seed/miroir-example-library/assets/library_data
RUN for entity in 7959d814-400c-4e80-988f-a00fe582ab98 25d935e7-9e93-42c2-aade-0472b883492b; do \
      rm -rf "/seed/miroir-app-admin/assets/admin_data/${entity}" && \
      mkdir -p "/seed/miroir-app-admin/assets/admin_data/${entity}"; \
    done

ENV MIROIR_ROOT=/data
ENV MIROIR_ENV=docker

# -------------------------------------------------------------------------
# Entrypoint
# -------------------------------------------------------------------------
COPY packages/miroir-server/docker-entrypoint.sh /docker-entrypoint.sh
# Strip CR in case the checkout converted line endings (Windows core.autocrlf).
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# -------------------------------------------------------------------------
# Runtime declarations
# -------------------------------------------------------------------------
# /certs — mount the host's mkcert-generated cert directory here at runtime:
#   docker run -v ./certs:/certs:ro ...
# Required files: localhost.pem, localhost-key.pem, rootCA.pem
# If absent the server falls back to HTTP.
VOLUME /certs
VOLUME /data
EXPOSE 3080

# Named API secrets persist as Admin MiroirSecret rows. Pass the wrapping key at
# runtime (the only standing launch secret): -e MIROIR_SECRETS_MASTER_KEY=...
# Generate: docs/reference/authentication.md#generate-the-wrapping-key
# --secret / MIROIR_SECRET_* / AI_* key env vars are bootstrap import only.
ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["node", "/miroir/packages/miroir-server/release/index.js"]
