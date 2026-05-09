# =============================================================================
# Miroir Framework — miroir-server Docker Image
# =============================================================================
#
# The build context must be the pre-built miroir workspace directory produced
# by build_server.sh (i.e. the directory that directly contains packages/).
# The Dockerfile is supplied via -f.
# MIROIR_BUILD_DIR is the sub-directory within the build context that holds
# packages/ (default: "." means the context root IS the workspace).
#
# Usage:
#   docker build \
#     --build-arg MIROIR_BUILD_DIR=. \
#     -f docker/miroir-server/Dockerfile \
#     -t miroir-framework/miroir:latest \
#     /path/to/miroir-build/miroir
#
#   docker run -p 3080:3080 -v miroir-data:/data miroir-framework/miroir:latest
#
# On first run with an empty /data volume the container seeds it with:
#   • Miroir framework model + data
#   • Admin application model + data
#   • Library demo application model + data
# Subsequent starts skip the seed step.
# =============================================================================
FROM node:22-alpine
WORKDIR /miroir

# Sub-directory within the build context that contains packages/.
# Default "." means the build context root IS the miroir workspace.
# Override with --build-arg MIROIR_BUILD_DIR=<subdir> if needed.
ARG MIROIR_BUILD_DIR=.

# tini provides proper PID-1 signal handling (SIGTERM → graceful shutdown)
RUN apk add --no-cache tini nano bash

# # Debug: confirm the resolved sub-directory (visible in docker build output)
# RUN echo "MIROIR_BUILD_DIR=${MIROIR_BUILD_DIR}"

# TLS certificates are NOT generated inside the image.
# Mount host-generated certs (trusted by the host browser) at runtime — see VOLUME below.

# -------------------------------------------------------------------------
# Server release bundle
# -------------------------------------------------------------------------
COPY packages/miroir-server/release /miroir/release

# -------------------------------------------------------------------------
# Docker-specific server config (HTTP, filesystemDeploymentRootDirectory=/data)
# Overrides the default config bundled inside the release directory.
# -------------------------------------------------------------------------
COPY packages/miroir-server/config/miroirConfig.server.docker.json \
     /miroir/release/miroirConfig.server.json

# -------------------------------------------------------------------------
# Seed data (framework + admin + library assets, Docker-compatible paths)
# -------------------------------------------------------------------------
COPY packages/miroir-server/docker/seed/. /seed/

# -------------------------------------------------------------------------
# Entrypoint
# -------------------------------------------------------------------------
COPY packages/miroir-server/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

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

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["node", "/miroir/release/index.js"]
