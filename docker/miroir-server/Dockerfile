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
# Stage 1: builder — get built artifacts from the ci-builder image
# (which has all dependencies installed and every workspace package built)
# =============================================================================
FROM miroir-framework/ci-builder:latest AS builder
WORKDIR /miroir


# =============================================================================
# Stage 2: final — slim production image
# =============================================================================
# FROM miroir-framework/ci-builder:latest
FROM node:22-alpine
WORKDIR /miroir

# tini provides proper PID-1 signal handling (SIGTERM → graceful shutdown)
RUN apk add --no-cache tini

# -------------------------------------------------------------------------
# Serve the SPA from the same Express server (same origin → no CORS needed)
# -------------------------------------------------------------------------
COPY --from=builder /miroir-build/miroir/packages/miroir-server/release \
                    /miroir/packages/miroir-server/release

# # -------------------------------------------------------------------------
# # Workspace root
# # -------------------------------------------------------------------------
# COPY --from=builder /miroir-build/miroir/package.json /miroir/package-lock.json ./

# # Production node_modules (workspace symlinks intact, devDeps stripped)
# COPY --from=builder /miroir-build/miroir/node_modules ./node_modules

# # -------------------------------------------------------------------------
# # All workspace packages (dist/ + assets/ + package.json)
# # Source files were left in the builder layer, not propagated here because
# # the layer was already built — only the artifacts matter at runtime.
# # -------------------------------------------------------------------------
# COPY --from=builder /miroir-build/miroir/packages ./packages

# # -------------------------------------------------------------------------
# # Serve the SPA from the same Express server (same origin → no CORS needed)
# # -------------------------------------------------------------------------
# COPY --from=builder /miroir-build/miroir/packages/miroir-standalone-app/dist \
#                     /miroir/packages/miroir-server/public

# -------------------------------------------------------------------------
# Same assets must be found in public folder
# -------------------------------------------------------------------------
COPY --from=builder /miroir-build/miroir/packages/miroir-server/public \
                    /miroir/packages/miroir-server/public

# -------------------------------------------------------------------------
# Docker-specific server config (HTTP, filesystemDeploymentRootDirectory=/data)
# Overrides the dev config that was pulled in with the packages/ copy above.
# -------------------------------------------------------------------------
COPY --from=builder /miroir-build/miroir/packages/miroir-server/config/miroirConfig.server.docker.json \
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
COPY --from=builder /miroir-build/miroir/packages/miroir-test-app_deployment-miroir/assets \
                    /seed/miroir-test-app_deployment-miroir/assets

# Admin application assets
COPY --from=builder /miroir-build/miroir/packages/miroir-test-app_deployment-admin/assets \
                    /seed/miroir-test-app_deployment-admin/assets

# # Library demo assets (model + data only; admin dir is created automatically by the store)
# COPY --from=builder /miroir-build/miroir/packages/miroir-test-app_deployment-library/assets/library_model \
#                     /seed/miroir-test-app_deployment-library/assets/library_model
# COPY --from=builder /miroir-build/miroir/packages/miroir-test-app_deployment-library/assets/library_data \
#                     /seed/miroir-test-app_deployment-library/assets/library_data

# Docker-specific seed overrides (Docker-compatible library deployment record with
# corrected directory paths — no ".." traversal — placed into admin_data).
COPY --from=builder /miroir-build/miroir/packages/miroir-server/docker/seed \
     /seed

# -------------------------------------------------------------------------
# Entrypoint
# -------------------------------------------------------------------------
COPY --from=builder /miroir-build/miroir/packages/miroir-server/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# -------------------------------------------------------------------------
# Runtime declarations
# -------------------------------------------------------------------------
VOLUME /data
EXPOSE 3080

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["node", "/miroir/packages/miroir-server/release/server.js"]
