# =============================================================================
# Miroir Framework — Docker Image
# =============================================================================
#   ci-workspace-dev  – full npm install + ordered workspace builds
#
# =============================================================================


# =============================================================================
# Stage 1: builder — install all deps and build every workspace package
# =============================================================================
FROM node:22-alpine AS ci-workspace-dev
WORKDIR /miroir

# Native build tools required by some npm packages (e.g. bcrypt, node-gyp)
# RUN apk add --no-cache python3 make g++
RUN apk add --no-cache git

# Clone additional repositories
# Clone the repository
RUN git clone https://github.com/miroir-framework/jzod.git
RUN git clone https://github.com/miroir-framework/jzod-ts.git
RUN git clone https://github.com/miroir-framework/miroir.git

