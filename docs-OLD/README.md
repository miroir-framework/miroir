# Miroir

**caveat 1: developments are still ongoing, only a fraction of the goals described below have been reached yet. First official release is not yet available (soon)**

**caveat 2: Miroir's current main weakness is that, trying to blend in many aspects of software engineering, it is difficult to give a clear outline of it. Time will tell...**

## Introduction

**Miroir is an end-to-end, low code, agentic development platform for data-centric applications.**

- Miroir is **end-to-end** as it allows to define concepts used across both storage (database, NoSQL) and presentation (Web UI, web Services) and to leverage the same concepts in "business" code (e.g. computed attributes, business presentation functions, data migration, etc.).
- Miroir will be **low-code** as value-adding behavior can be created, modified and tested at run-time, without the need to build a new package or redeploy a running application. Miroir provides the necessary interpreters and visual reprensentation (yet to be provided) to muster all aspects of an application. JSON is presently available as textual representation for all model elements.
- Miroir will be **agentic**, being available to any A.I. client implementing the **Model Context Protocol (MCP)**. Miroir thus allows one to use natural language to manipulate and define business-related behavior, freely combining "structured" and "loose" code.
- Miroir is **data-centric** and **Language-oriented**, fostering the creation of **Domain-Specific Languages** for Model manipulation, using these languages in low-code or natural language code.

## Envisioned Use case: start small, grow seamlessly

The foreseen first use case for the framework is the need for automation or data-management "in the small" that often takes the form of a spreadsheet and, as the developed "software" gains traction, needs to migrate to a more sturdy development environment. In speadsheets indeed, means to address ubiquitous software development issues such as non-regression, automated testing, or changing technical environment are scant, if any exist at all. The Miroir Frameworks integrates all activities taking place during of software creation, at any scale, providing opinionated solutions and tools while keeping the requirement to use them at a minimum. Along the way, it ensures the development and runtime environments to be as close as possible, guaranteeing instantaneous feedback that fosters an experimental to software creation. One can then concentrate on the problem to be solved, being rid of usual chores like compiling every time before getting feedback. 

## This Repository
This is the monorepo for the Miroir Framework.

Activities encompassed by the Miroir Framework are (tentatively):

- **modeling and management of the application's data:** (logical and physical) data model elaboration and evolution, data store management (Relational schema maintenance, data migration, etc.)
- **practicing domain-driven development:** coding value-producing analysis and behavior from the application domain, create you own Domain-Specific Languages (DSLs), make them available as a services, or as a desktop and web applications.
- **managing the software development cycle:** enable software versioning, produce artefacts, automated Test management (unit tests, integration tests), enable continuous integration.
- **adapt your development environment to your needs**: benefit from the powerful javascript / web universe, leverage the LLM tools, adopt an experimental and incremental development approach (Test-Driven Development), be free to run your business-domain code in the client, on the server or in the database (SQL), or even switch data storage architecture according to your needs.
 
Miroir is developed largely in Miroir, making it extremely adaptable.

The technically-inclined reader can refer to the defined [LLM-agent instructions employed during development](https://github.com/miroir-framework/miroir/blob/master/.github/copilot-instructions.md), which provide a Markdown-format description of the development environment.

## Current State

### What already exists

- The Meta-Language [jzod](https://github.com/miroir-framework/jzod), also called MML for Miroir Meta-Language.
- The Miroir Meta-model, used to define an application's logical data model: Entity and EntityDefinitions. Attributes and other properties of an Entity are defined using an MML (jzod) Schema.
- Connectors to PostgreSQL, to an indexedDB key-value datastore, and to a JSON file-based datastore.
- The core of the Miroir application model use to define business-domain data presentation and behavior: Transformer, Query, Report, Endpoint & Action, Test, Application.
- An interpreter for Actions, Transformers and Queries (in-memory and SQL).
- A Web Application and a server leveraging the mentioned interpreters and providing rudimentary local cache management for data (to be used as working space).
- A substancial set of tests for non-regression on core features.
- An Event system to monitor activities and troubleshoot issues.
- A desktop application using Electron providing the same functionality as the Web App / Web Server combination.

### Present Developments

Today's on-going effort are centered on the identifcation and provision of actual workflows in the web interface:

- finalize the Event system, allowing to monitor activities and troubleshoot issue while during the development phase.
- providing an interactive, instant-feedback giving Transformer editor, enabling to create Transformer that encode the domain logic in a straightforward and confident way.
- provide similar editors for Queries and Actions.
- Provide a read/write connector to Spreadsheets (ODS and other formats) to store an Application's model and data.
- make a first official release ecompassing the above points.

### Future Developments

Here's an overview, browse the [issues](https://github.com/miroir-framework/miroir/issues) for more details on some of the following (envisioned) goals

- enable graphs in Reports (using D3js)
- enable some text edition tool (probably based on Markdown, potentially html) to enable the creation of text-containing Reports and to create the documentation for Miroir
- enable visual (UML-Like) Application Model edition
- enable block-based visual programming (low code) for Actions and Transformers
- support NOSQL datastores (MongoDB, ElasticSearch, DuckDb, etc.)
- support for a Miroir Command Line Interface
- support connection to software versioning tools: local Git repos, Github.
- support connection to issue-tracking and project management tools (Github, Jira, etc.)
- support for LLM-based tools & MCP client
- "Freezing" code to Javascript: generate js libraries from Miroir Transformers, Queries and Actions giving a proper escape hatch or enabling to use Miroir as an Application generator
- "Freezing" code to Rust: enabling the production of industrial web services implemented in Rust, maybe even a Rust-based Desktop / Web Application?
- develop "example" applications and tools: a relational DB model manager, an interface to the R programming platform

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