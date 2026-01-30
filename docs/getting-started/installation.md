# Miroir Installation


## Overview

### Using the Miroir Framework

There are 2 ways of using The Miroir Framework:

1. build an application on one of the existing runtimes (general use),
2. integrate Miroir as a foundation in your own runtime (advanced use).

This document covers case 1, the second case is covered by the developer documentation [TODO: PROVIDE LINK](TODO)

### Runtime installation Overview

The Miroir Framework runtime comes in 2 flavors:

- a standalone application for the desktop (Windows only, for the moment)
- a server application that can be accessed through a web-browser
<!-- only use the MCP server for creation interface, use Runtime only for rendering? -->

The server can enable access to multiple users at the same time, though multiuser work on the same Miroir application is not covered yet (to be implemented)

## Standalone Application Installation

On windows, use [this link](TODO) to download the portable Miroir Standalone Runtime (Windows 64bits). It runs without installation procedure.

## Server Installation

On windows, use [this link](TODO) to download the portable Miroir Server Runtime (Windows 64bits). It runs without installation procedure.

The default URL to access the server is: [http://localhost:3080](http://localhost:3080)

<!-- 
## Command Line Interface installation
 -->

## Model and Data Storage

The Miroir Framework, to deploy Miroir applications or create an application, requires some persistent storage space.

Such storage space can be:

- a local disk space (local to the machine on which the server or the standalone app is deployed)
- a remote disk space (accessed by the machine on which the server or the standalone app is deployed)
- a local or remove database server
- a local or remote key / value (NOSQL) store (to be implemented)

