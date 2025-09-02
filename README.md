# Miroir

**caveat: developments are still ongoing, only a fraction of the goals described below have been reached yet. First official release is not yet available (soon)**
This is the monorepo for the Miroir Framework. The Miroir Framework aims at becoming a comprehensive web application development environment that integrates development-time and runtime activities, inspired by Smalltalk's interactive development model.

The foreseen first use case for the framework is the need for automation or data-management "in the small" that often takes the form of a spreadsheet and, as the developed "software" gains tracktion, needs to migrate to a more sturdy development environment. In speadsheets indeed, means to address ubiquitous software development issues such as non-regression, automated testing, or moving technical environment are scant, if any exist at all. The Miroir Frameworks integrates all activities taking place during of software creation, at any scale, providing opinionated solutions and tools while keeping the requirement to use them at a minimum. Along the way, it ensures the development and runtime environments to be as close as possible, guaranteeing instantaneous feedback that fosters experimental programming. One can then concentrate on the problem to be solved, being rid of usual chores like compiling before getting feedback.

Activities encompassed by the Miroir Framework are (tentative):

- modeling and management of the application's data: (logical and physical) data model elaboration and evolution, data store management (Relational schema maintenance, data migration, etc.)
- business: coding value-producing analysis and behavior, create you own Domain-Specific Language (DSL), make it available as a service, desktop, or web application.
- software tooling: enable software versioning, produce artefacts, automated Test management (unit tests, integration tests), enable continuous integration
- favoring an experimental, incremental development approach: Test-Driven Development, decoupling of sub-systems


## installation

# From Source

Clone git repository

```sh
git clone https://github.com/miroir-framework/miroir.git
```

go to the created directory, and download dependencies:

```sh
npm install
```

For local dependencies on Jzod:
```sh
npm link @miroir-framework/jzod-ts @miroir-framework/jzod
```

build the client and server (shell):

```sh
npm run devBuild -w miroir-core && npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres
```

# From binary packages

TBW

# Configuration

## Data stores

### indexedDb

### File System

### Postgres

there must be an "admin" user/schema, that is used as a life line, to create / administer other user/schemas.

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
$ VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run vitest -w miroir-core -- domainSelector
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

To run the Transformer tests, in unit configuration (transformers are executed by the client or server, in memory)

```sh
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'
```

To run the Transformer tests, in integration configuration (transformers are executed on the database as sql queries)

```sh
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```


to run all the miroir-core unit tests (except the two transformer tests above):

```sh
npm run test -w miroir-core -- ''
```




### Miroir-standalone-app

#### Persistence store integration tests

The LocalStoreController can be tested:

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- PersistenceStoreController
```

Should result in something resembling:

```sh
 ✓ 4_storage/PersistenceStoreController.integ.test.tsx  (12 tests) 1522ms

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  15:48:36
   Duration  10.38s (transform 943ms, setup 114ms, collect 3.30s, tests 1.52s, environment 480ms, prepare 260ms)
```

#### Persistence store Extractor runner intergration tests

The extractor runners ExtractorTemplatePersistenceStoreRunner (for indexedDb, Postgres/sql, filesystem peristent storage) can be tested:

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner
```


#### automated integration tests On File System

Using jest / vitest environment only
```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

Using real server

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-filesystem VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

#### automated integration tests On Indexed DB

Using jest / vitest environment only (nodejs), DB will exist as files on the local filesystem

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

Using a real server running on nodejs, DB will exist as files on the local filesystem

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-indexedDb VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

#### automated integration tests On Postgres

Using jest / vitest environment only (nodejs), the "miroir" and "library" schemas are created, then dropped at the end of the test

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

Using a real server running on nodejs, the "miroir" and "library" schemas are NOT created or dropped, they have to exist for the test to pass [issue #24](https://github.com/miroir-framework/miroir/issues/24).

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-sql VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

#### integration tests for Applicative CompositeActions

```sh
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug RUN_TEST="applicative.Library.BuildPlusRuntimeCompositeAction.integ.test" npm run testByFile -w miroir-standalone-app -- applicative.Library.BuildPlusRuntimeCompositeAction.integ.test
```




## Organization

TBW

## Usage



## Contribute

TBW