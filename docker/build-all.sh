#!/bin/bash

#docker run --name mycontainer --rm --entrypoint="" -it miroir-framework/ci-builder:latest sh
#docker run --name mycontainer --rm --entrypoint="" myimage echo "Hello, World!"

# docker build --no-cache --rm -t miroir-framework/ci-workspace-dev:latest ci-workspace-dev
docker build --no-cache --rm -t miroir-framework/ci-builder:latest ci-builder