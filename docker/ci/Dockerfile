# =============================================================================
# Miroir Framework CI — Docker Image
# =============================================================================
# simple build:
#   ci-builder-electron – full npm install + ordered workspace builds
#
# Usage run the build then create container to access the built release artifacts:
#   docker build -t miroir-framework/ci:latest .
#   #docker run -p 3080:3080 -v miroir-release:/release miroir-framework/ci:latest
#
# =============================================================================

FROM ubuntu:26.04
WORKDIR /build

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  nodejs \
  npm \
  git \
  curl \
  wget \
  nano \
  make \
  g++ \
  xz-utils \
  rpm

# install nvm to handle more recent npm version than available on ubuntu:26.04
# (needed for langium@4.2.3, that requires: { node: '>=20.10.0', npm: '>=10.2.3' }, ubuntu:26.04 has node 22 and npm 9 (!))
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

RUN export NVM_DIR="$HOME/.nvm" ; \
  if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi ; \ 
  if [ -s "$NVM_DIR/bash_completion" ]; then . "$NVM_DIR/bash_completion"; fi ; \
  nvm install --lts ;

RUN echo "This is the CI image. It is meant to be used as a base image for other CI images that need to build the miroir packages and access the built release artifacts." \
  && echo "To build the miroir packages and access the built release artifacts, create a container from this image and mount a volume to /build/release:" \
  && echo "  docker run -p 3080:3080 -v /path/to/local/release:/release -it miroir-framework/ci:latest bash" \
  && echo "Then inside the container, run:" \
  && echo "  cp -r /build/release/* /release/" \
  && echo "This will copy the built release artifacts to your local machine." \
  && echo "Note: The build process can take a while, especially for the electron app, so be patient."

RUN git clone https://github.com/miroir-framework/jzod.git
RUN git clone https://github.com/miroir-framework/jzod-ts.git
RUN git clone https://github.com/miroir-framework/miroir.git
# RUN echo "git clone https://github.com/miroir-framework/jzod.git && \
# git clone https://github.com/miroir-framework/jzod-ts.git && \
# git clone https://github.com/miroir-framework/miroir.git" >> /git-clone.sh
# RUN chmod +x /git-clone.sh

# RUN git config --global --add safe.directory /build/jzod
# RUN git config --global --add safe.directory /build/jzod-ts
# RUN git config --global --add safe.directory /build/miroir

RUN chmod a+x /build/miroir/ci/build/*.sh

# VOLUME /build
VOLUME /release

# # # RUN cp -r /miroir-build/miroir/packages/miroir-standalone-app-electron/release/* /release/
