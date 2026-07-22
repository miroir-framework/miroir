# Agent instructions (shared)

This file is the **single source of truth** for project-wide agent instructions.
It is loaded by **Cursor** (`AGENTS.md`) and by **GitHub Copilot** (coding agent / VS Code; `.github/copilot-instructions.md` includes this file via `@AGENTS.md`).

Edit this file only — do not duplicate its contents elsewhere.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

# Miroir Framework Agent Instructions

## Project Overview

The Miroir Framework is a comprehensive web application development environment that integrates development-time and runtime activities, inspired by Smalltalk's interactive development model. This repository (`miroir-app-dev`) is the main npm-workspaces monorepo (`packages/*`) with a layered architecture.

Sibling repos (linked locally when developing schemas / codegen) live next to this checkout:

- **jzod**: JSON interface to Zod schemas (`@miroir-framework/jzod`)
- **jzod-ts**: TypeScript type generation for Jzod schemas (`@miroir-framework/jzod-ts`)

## Architecture: Layered Domain-Driven Design (Clean or Hexagonal Architecture)

The `miroir-core` and other packages follow a strict layered architecture in `src/`:

```
0_interfaces/    → Core type definitions and Jzod schemas
1_core/          → Foundation layer (tools, constants, domain state)
2_domain/        → Domain logic (selectors, transformers, templates)  
3_controllers/   → Application controllers (DomainController, ActionRunner)
4_services/      → Infrastructure services (persistence stores)
4_views/         → UI layer
5_setup/         → Composition / wiring
5_tests/         → Shared test helpers (e.g. MiroirTest CLI parsing)
```

**Key Principle**: Interface dependencies may flow both ways, but implementation Dependencies flow downwards only. Layer 3 can use implementations from layers 2 and 1, but layer 1 cannot reference an implementation from layer 3. Layer 1 may freely reference interfaces from layer 2 or 3, however.

## Package Dependencies & Build Order

Core dependency graph (see `build-all.sh`; must be built in this order):
1. Optional siblings: `jzod`, `jzod-ts` (when linked locally)
2. `miroir-test-app_deployment-miroir`, `miroir-test-app_deployment-admin` (definition of core types and concepts as Jzod schemas)
3. `miroir-core` (foundation with generated types)
4. `miroir-localcache*`, `miroir-store-*` packages (`filesystem`, `indexedDb`, `postgres`, `mongodb`, `bundled`)
5. `miroir-react`, `miroir-mcp`, `miroir-diagram-class`
6. `miroir-cli`, `miroir-ai`, `miroir-mcp`
7. `miroir-standalone-app`
8. `miroir-test-app_deployment-library`, `miroir-test-app_deployment-postgres` (example / test applications)

Artefacts (after the packages above): `miroir-server` release binary (`npm run build:release -w miroir-server`), `miroir-standalone-app-electron`, Docker image.

`miroir-designer` and `miroir-runtime` are unused stubs (LICENSE / README only).

**Note**: `miroir-core` has a `devBuild` step to generate TypeScript types (the files in `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated`) from Jzod schemas. It must be built every time some core schema in `packages/miroir-test-app_deployment-miroir/assets` is modified, after building `miroir-test-app_deployment-miroir` itself. Prefer `./build-all.sh` / `./build-all.sh devBuild` for full ordered builds.

## Coding Conventions & Style

## General Guidelines

- TypeScript with strict settings (`tsconfig.json` in each package)
- ESM modules only (`"type": "module"` in `package.json`)
- Avoid debouncing in general, it's usually an anti-pattern, a sign of bad design
- Avoid deep nesting, prefer early returns within functions

## Within React:
 - Prefer functional components with hooks
 - avoid `useEffect` unless strictly necessary, always ask for confirmation before adding a `useEffect`
 - do not use publish-subscribe patterns to push data from one component to another, this is an anti-pattern, and it is redundant with React principles. Instead, feed the data to React.FC components through props and hooks (useSelector, useDispatch, etc.). Services providing subscription mechanisms may be defined for uses outside of React components (for example on the server side).
 - do not call a function in a useMemo to get data in a FC, useMemo can not work properly to get data from a service via a plain function. If a useMemo is needed to limit rendering, then enable access to the wanted data from the service via a hook.

## Development Workflows

### Build Commands
```bash
# Core package (includes type generation)
npm run devBuild -w miroir-core

# Core package (excludes type generation)
npm run build -w miroir-core

# Build multiple stores in parallel
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled

# Type checking only (no build on miroir-standalone-app)
npx tsc --noEmit --skipLibCheck
```

### Testing Patterns

always favor integration tests to unit tests, avoid mocking when possible

### Core Testing Commands

Entity-backed tests use the unified **`MiroirTest`** model (Feature #196). Prefer `testMiroir` for suite selection; `testByFile` + `RUN_TEST` remains for per-file selective runs.

```bash
# Rebuild deployment after MiroirTest JSON changes
npm run build -w miroir-test-app_deployment-miroir

# MiroirTest CLI — dynamic import by registry key (preferred)
npm run testMiroir -w miroir-core -- --suites mustache,alterObject --mode unit

# MiroirTest integration (runs in standalone-app; --mode integ is an alias for integration)
npm run testMiroir -w miroir-standalone-app -- --suites miroirCoreTransformers --mode integration

# Per-file vitest (RUN_TEST gate on most loaders)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Schema / migration smoke
npm run testByFile -w miroir-core -- miroirTest.migration

# Specific test with debug logging
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json npm run vitest -w miroir-core -- domainSelector

# All miroir-core unit tests
npm run test -w miroir-core -- ''

# Repo-wide non-regression (unit + MiroirTest integ + curated app-stack)
npm run nonreg
```

**MiroirTest UI:** standalone app menu **Miroir Tests** (unit mode only). Plan: `code-helpers/features/196-FEATURE-migrate-tests-to-MiroirTest/plan.md`. Contributor guide: `docs/contributing/testing.md`. Full reference: `docs/reference/testing.md`.

### Integration Testing by Store Type
```bash
# File System persistence tests
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json npm run testByFile -w miroir-standalone-app -- DomainController.integ

# IndexedDB persistence tests  
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json npm run testByFile -w miroir-standalone-app -- DomainController.integ

# PostgreSQL persistence tests
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug.json npm run testByFile -w miroir-standalone-app -- DomainController.integ
```


### Application Development

For a full packaged run, the built server serves the client at **https://localhost:3080** (or http if TLS certs are absent). See `docs/guides/build-it-yourself.md`.

For active frontend development, assume Vite client at **http://localhost:5173** (default Vite port) and API server at **http://localhost:3080** (or https when `certs/` is set up).

When those are not already running:
```bash
# Build / refresh the server release binary (there is no `npm run dev` on miroir-server)
npm run build:server -w miroir-server
# or full client+server release: npm run build:release -w miroir-server

# Launch server (defaults work from repo root; see build-it-yourself.md for TLS flags)
NODE_ENV=development node packages/miroir-server/release/index.js
# equivalent: npm run run:prod -w miroir-server

# Launch Vite client (use `dev`, not a removed `startDev` script)
npm run dev -w miroir-standalone-app
```

## Code Patterns & Conventions

### Schema-First Development

The Miroir Framework allows to create applications by defining data structures and behaviors through JSON-declared schemas.

The whole approach to the framework is based on a meta-language, named "ML", "MML" (for Miroir Meta-Language), "MMLS" (for Miroir Meta-Language Schema) or Jzod. The meta-schema is given in `packages/miroir-test-app_deployment-miroir/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json`. It defines the structure of all data in Miroir, and it is bootstrapped, defining its own structure (it is itself a Jzod Schema). It corresponds to a subset of Typescript types.

Each core concept in Miroir (Entity, EntityDefinition, Query, Transformer, Report, Endpoint, etc.) are defined as an Entity, and each Entity can have multiple versions (EntityDefinitions). They are all defined using the Meta-language (Jzod schemas).

### Application / Deployment Structure: (Meta-)Model + Data
The Deployment of every Application is stored in two parts (here filesystem storage is used as an example, but it can be any persistence backend):
- **Model**: JSON files defining Entities, EntityDefinitions, Queries, Transformers, Reports, any logic or model-related information of an Application. For the Miroir application itself (in `packages/miroir-test-app_deployment-miroir/assets/miroir_model/`) this contains the Meta-Model (Entity and EntityDefinition) plus other model-level concepts. For any other Application, this contains the actual application model.
- **Data**: JSON files defining the actual data instances of an application Model. For the Miroir application itself (in `packages/miroir-test-app_deployment-miroir/assets/miroir_data/`) this contains instances for non-bootstrapped concepts that belong to the Model of the Miroir Application but not only to its Meta-Model: `Query`, `Transformer`, `Report`, etc. For any other application, this contains the actual application data.

Canonical layout reference: `docs/reference/data-architecture-deployments.md`.

### Miroir Core Concepts: Meta-Model

-  The bootstrapped Entity `Entity` is defined in file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json`
- Each EntityDefinition defines the attributes of an Entity using a (Jzod) ML schema. The bootstrapped EntityDefinition `EntityDefinition` can be found in file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json` 
- The Jzod schemas are used to generate TypeScript types and Zod validation schemas.
- Application / deployment Jzod assets live under `packages/miroir-test-app_deployment-*/assets/` (not under `miroir-core/src/assets/`, which only holds leftover fixtures such as `miroirAdmin/` and `test1_model/`).
- Generated TypeScript types from Jzod schemas are written to `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/` (mainly `miroirFundamentalType.ts`). Generator helpers live in `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/`.
- Run `npm run devBuild -w miroir-core` to produce TS types (and then build)
- TS Types from miroir-core are exported through a large `index.ts` (1200+ lines)

The Entities are bootstrapped to themselves as meta-classes (there is an Entity named "Entity"). EntityDefinition is also bootstrapped to itself as a meta-class (there is an EntityDefinition named EntityDefinition, which jzodSchema defines the format of all EntityDefinitions, including itself).

### Primary Key Support

EntityDefinitions support three kinds of primary keys via the `idAttribute` field:
- **UUID PK** (default): `idAttribute` is absent or `"uuid"` — standard UUID-based identity.
- **Non-UUID single PK**: `idAttribute` is a single string naming any attribute (e.g. `"code"`).
- **Composite PK**: `idAttribute` is a `string[]` array (e.g. `["region", "code"]`).

Helper functions for PK handling are in `packages/miroir-core/src/1_core/EntityPrimaryKey.ts`:
- `getEntityPrimaryKeyAttribute(entityDefinition)` — returns `string | string[]`
- `getEntityPrimaryKeyAttributes(entityDefinition)` — always returns `string[]`
- `entityHasCompositePrimaryKey(entityDefinition)` / `entityHasUuidPrimaryKey(entityDefinition)`
- `serializeCompositeKeyValue(attributes, instance)` / `parseCompositeKeyValue(serialized)` — composite key serialization using `|` separator with `\` escaping
- `getInstancePrimaryKeyValue(entityDefinition, instance)` — returns the PK value as a string (serialized for composite)
- `getForeignKeyValue(fkAttribute, referenceObject)` — resolves FK value from a reference object; `fkAttribute` can be `string | string[]`
- `instanceMatchesForeignKey(fkAttribute, instance, referenceValue)` — tests FK match for both single and composite keys

Combiner FK attributes (`AttributeOfObjectToCompareToReferenceUuid`, `AttributeOfListObjectToCompareToReferenceUuid`) accept `string | string[]` to support composite-PK joins. All store backends (filesystem, IndexedDB, PostgreSQL) and local caches (Redux, Zustand) support composite PKs.

### Miroir Core Concepts: Model

Other core concepts are defined as Entities / EntityDefinitions, for example:
  - `Query`: allows to fetch data objects based on criteria, in file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json`. General Query combines Extractors, Combiners, and Transformers
  - `Transformer`: a pure function, allow to transform data, can be run either on client or server side in-memory, or in the database (Postgres). In file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`
  - `Report`: allows to display data in the UI, based on a Query and several display sections, in file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json`
  - `Endpoint`: allows to define Actions, which can perform side-effects on Entity instances and on the Model of an Application. Actions can run on the client or the server. Definition in file `packages/miroir-test-app_deployment-miroir/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json`

### Logging
each file has its own logger instance, named after the file, for example `DomainController.ts` has a logger named `DomainController`. Loggers are configured via environment variable `VITE_MIROIR_LOG_CONFIG_FILENAME`, see example config files in `packages/miroir-standalone-app/tests/`.

example logger setup in `DomainController.ts`:

```typescript
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainController")
).then((logger: LoggerInterface) => {log = logger});
```

then use `log.debug(...)`, `log.info(...)`, etc. in the file.

### State Management Pattern
- Redux + Redux-Sagas for complex async flows
- Domain state isolated from UI state
- Query selectors (as React hooks) for domain state access
- Transformer pattern for data manipulation

### File Naming Conventions
- Interfaces: PascalCase with descriptive prefixes (`Action*`, `CarryOn_*`)
- Implementation files: camelCase descriptive names
- Test files: `*.unit.test.ts` for unit tests, `*.integ.test.ts` for integration tests, with descriptive module names

### Error Handling
- For Actions, consistent `ActionReturnType` pattern with `ActionSuccess` | `ActionError`
- Vitest-like assertion helpers for in-app / MiroirTest runs: `packages/miroir-core/src/1_core/test-expect.ts` (`describe`, `it`, `expect`)

## Store Architecture

Multiple persistence backends with unified interface:
- `miroir-store-filesystem`: File system persistence
- `miroir-store-indexedDb`: Browser IndexedDB
- `miroir-store-postgres`: PostgreSQL with admin schema pattern
- `miroir-store-mongodb`: MongoDB backend
- `miroir-store-bundled`: Read-only statically imported deployment data (sandbox / demo)

Each store implements the same interface defined in `miroir-core`.

## Testing & Debugging

### Test Configuration
- Vitest workspace with single-thread execution (`--poolOptions.threads.singleThread`)
- Environment-specific logging via `VITE_MIROIR_LOG_CONFIG_FILENAME`
- Test configuration via `VITE_MIROIR_TEST_CONFIG_FILENAME`
- Test fixtures in `tests/resources/` directories
- In test mode the `RestClientStub` is used to simulate server interactions without a live server

### Mixed Test Framework Setup
- **Core framework**: Uses Vitest for all testing
- **Some store packages**: Have Jest configurations for legacy compatibility
- **Test environments**: `happy-dom` for React components, `node` for server-side tests
- **Critical**: All tests use single-thread execution for reliability


## Key Files for Understanding

- `packages/miroir-core/src/index.ts`: Complete type export surface
- `packages/miroir-core/src/3_controllers/DomainController.ts`: Core business logic
- `packages/miroir-core/src/2_domain/QuerySelectors.ts`: Data access patterns
- `docs/guides/why-miroir.md`: Project philosophy and design decisions
- `docs/reference/data-architecture-deployments.md`: Deployments, store backends, model/data layout
- `docs/contributing/testing.md` / `docs/reference/testing.md`: Testing workflows
- `build-all.sh`: Canonical package build order and artefacts

## Platform Notes

- Use git-bash for Windows development
- Monorepo managed with npm workspaces (`packages/*`)
- ESM modules throughout (`"type": "module"`)
- TypeScript compilation via tsup for libraries, Vite for applications

## Example Application: Library

Model and data for the example Library application live in the deployment package:
- Model: `packages/miroir-test-app_deployment-library/assets/library_model/`
- Data: `packages/miroir-test-app_deployment-library/assets/library_data/`

The library application model includes Entities `Author`, `Book`, `Country`, `Publisher`, `User`, and `LendingHistoryItem`. EntityDefinitions are under `packages/miroir-test-app_deployment-library/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`.

Library application data directories (entity uuid → folder):
- authors: `packages/miroir-test-app_deployment-library/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/`
- books: `packages/miroir-test-app_deployment-library/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/`
- countries: `packages/miroir-test-app_deployment-library/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/`
- publishers: `packages/miroir-test-app_deployment-library/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/`
- users: `packages/miroir-test-app_deployment-library/assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/`
- lending history: `packages/miroir-test-app_deployment-library/assets/library_data/e81078f3-2de7-4301-bd79-d3a156aec149/`

## Critical Dependencies

- `@miroir-framework/jzod` and `@miroir-framework/jzod-ts` must be linked locally from sibling checkouts when regenerating types
- Build order is critical due to generated types (`build-all.sh`)
- Some packages have circular development dependencies requiring careful build orchestration
