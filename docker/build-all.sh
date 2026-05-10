#!/bin/bash

#docker run --name mycontainer --rm --entrypoint="" -it miroir-framework/ci-builder:latest sh
#docker run --name mycontainer --rm --entrypoint="" -it miroir-framework/miroir-server:latest sh
#docker run --name mycontainer --rm --entrypoint="" -p 3080:3080 -v /mnt/c/miroir-release:/release -it miroir-framework/ci-builder-electron:latest bash
#docker run --name mycontainer --rm --entrypoint="" myimage echo "Hello, World!"

#   docker run -p 3080:3080 -v /mnt/c/miroir-data:/data miroir-framework/miroir:latest
#   docker run -p 3080:3080 -v /mnt/c/miroir-release:/release miroir-framework/ci-builder-electron:latest

# docker run -p 3080:3080 -v 'c:/miroir-build':'/build' -it miroir-framework/ci:latest bash
# docker run -p 3080:3080 -v /c/miroir-build:/build -it miroir-framework/ci:latest bash

# docker exec -i miroir-framework/ci /bin/bash
# docker exec -it  bash
# docker run -it -d eager_sammet /bin/bash

# cd /build/miroir/ && clear && npm run run:prod -w miroir-server

docker build --no-cache --rm -t miroir-framework/ci:latest ci
docker build --no-cache --rm -t miroir-framework/ci-workspace-dev:latest ci-workspace-dev
docker build --no-cache --rm -t miroir-framework/ci-builder:latest ci-builder
docker build --no-cache --rm -t miroir-framework/ci-builder-electron:latest ci-builder-electron
# docker build --no-cache --rm -t miroir-framework/miroir-server:latest miroir-server