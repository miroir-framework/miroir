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

# Development process

## launching client & server for interactive tests

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

## Automated tests

### Miroir-core

```js
$ VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run test -w miroir-core -- domainSelector
```
results in:
```sh
PASS tests/2_domain/domainSelector.unit.test.ts
  domainSelector
    √ error on non-existing Entity: EntityNotFound (151 ms)
    √ error on non-existing Entity: EntityNotFound (17 ms)
    √ error on non-existing object uuid: InstanceNotFound (14 ms)
    √ select 1 object from Domain State (22 ms)
    √ select 1 object from Domain State using context reference (19 ms)
    √ select 1 object from Domain State using direct query parameter reference (19 ms)
    √ select 1 object from the uuid found in an attribute of another object from Domain State (21 ms)
    √ select Authors (10 ms)
    √ select Books of Publisher of given Book from Domain State (30 ms)
    √ select custom-built result: Books of Publisher of given Book from Domain State (27 ms)
    √ select custom-built result with queryCombiner: instances of all Entites from Domain State, indexed by Entity Uuid (10 ms)

Test Suites: 1 skipped, 1 passed, 1 of 2 total
Tests:       1 skipped, 11 passed, 12 total
Snapshots:   0 total
Time:        6.032 s, estimated 8 s
Ran all test suites with tests matching "domainSelector".
```

## Organization

TBW

## Usage



## Contribute

TBW