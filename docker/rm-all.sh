#!/bin/bash

# for i in `docker image ls | tail -n +2 | tr -s ' '  | cut -f3 -d ' '` ; do docker rmi $i ; done

# docker image rm miroir-framework/ci-workspace-dev:latest
# docker image rm miroir-framework/ci-builder:latest
docker image rm miroir-framework/miroir-server:latest
# docker image rm miroir-framework/miroir:latest