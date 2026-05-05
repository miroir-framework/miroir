#!/bin/bash

#docker run --name mycontainer --rm --entrypoint="" -it miroir-framework/ci-builder:latest sh
#docker run --name mycontainer --rm --entrypoint="" -it miroir-framework/miroir-server:latest sh
#docker run --name mycontainer --rm --entrypoint="" myimage echo "Hello, World!"

#   docker run -p 3080:3080 -v /mnt/c/miroir-data:/data miroir-framework/miroir:latest

# docker build --no-cache --rm -t miroir-framework/ci-workspace-dev:latest ci-workspace-dev
# docker build --no-cache --rm -t miroir-framework/ci-builder:latest ci-builder
docker build --no-cache --rm -t miroir-framework/miroir-server:latest miroir-server