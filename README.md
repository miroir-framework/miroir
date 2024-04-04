# Miroir

This is the monorepo for the Miroir Framework

## installation

# From Source

Clone git repository

```sh
$ git clone https://github.com/miroir-framework/miroir.git
```

go to the created directory, and download dependencies:

```sh
$ npm install
```

build the client and server (shell):

```sh
npm run devBuild -w miroir-core && npm run build -w miroir-localcache-redux -w miroir-server-msw-stub -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres
```

# From binary packages

TBW

## Development process

Use of the server is not mandatory to develop on the client, as MSW can be used to simulate the server.

build server in backround (useful when developing the server):

```sh
 npm run build-tsup -w miroir-server
```

launch server:

```sh
npm run dev -w miroir-server
```

launch client:

```sh
npm run startDev -w miroir-standalone-app
```

## Organization

TBW

## Usage



## Contribute

TBW