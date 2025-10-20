# Miroir Framework Copilot Instructions

## Project Overview

The Miroir Framework is a comprehensive web application development environment that integrates development-time and runtime activities, inspired by Smalltalk's interactive development model. This is a **multi-workspace monorepo** containing:

- **jzod**: JSON interface to Zod schemas (`@miroir-framework/jzod`)
- **jzod-ts**: TypeScript type generation for Jzod schemas (`@miroir-framework/jzod-ts`)
- **miroir-app-dev**: Main framework monorepo with layered architecture

## Architecture: Layered Domain-Driven Design (Clean or Hexagonal Architecture)

The `miroir-core` and other packages follow a strict layered architecture in `src/`:

```
0_interfaces/    → Core type definitions and Jzod schemas
1_core/          → Foundation layer (tools, constants, domain state)
2_domain/        → Domain logic (selectors, transformers, templates)  
3_controllers/   → Application controllers (DomainController, ActionRunner)
4_services/      → Infrastructure services (persistence stores)
4_views/         → UI layer
```

**Key Principle**: Interface dependencies may flow both ways, but implementation Dependencies flow downwards only. Layer 3 can use implementations from layers 2 and 1, but layer 1 cannot reference an implementation from layer 3. Layer 1 may freely reference interfaces from layer 2 or 3, however.

## Package Dependencies & Build Order

Core dependency graph (must be built in this order):
1. `miroir-core` (foundation with generated types)
2. `miroir-localcache-redux`, `miroir-store-*` packages  
3. `miroir-react`, `miroir-server`
4. `miroir-standalone-app`, `miroir-designer`

**Note**: `miroir-core` has a `devBuild` step to generate TypeScript types (the files in `packages\miroir-core\src\0_interfaces\1_core\preprocessor-generated`) from Jzod schemas. It must be built every time some core schema in `packages\miroir-core\src\assets\miroir_data` or `packages\miroir-core\src\assets\miroir_model` is modified.

**Note**: `miroir-runtime` and `miroir-query-jsonata` are additional packages in the ecosystem.

## Coding Conventions & Style

## General Guidelines

- TypeScript with strict settings (`tsconfig.json` in each package)
- ESM modules only (`"type": "module"` in `package.json`)
- Avoid debouncing in general, it's usually an anti-pattern, a sign of bad design
- Avoid deep nesting, prefer early returns within functions

## Within React:
 - Prefer functional components with hooks
 - avoid `useEffect` unless strictly necessary, always ask for confirmation before adding a `useEffect`
 - do not use publish-subscribe patterns to push data from one component to another, this is an anti-pattern, and it is redundant with React principles. Instead, feed the data to React.FC components through props and hooks (useSelector, useDispatch, etc.). Services providing subscription mechanisms may de defined for uses outside of React components (for example on the server side).
 - do not call a function in a useMemo to get data in a FC, useMemo can not work properly to get data from a service via a plain function. If a useMemo is needed to limit rendering, then enable access to the wanted data from the service via a hook.

## Development Workflows

### Build Commands
```bash
# Core package (includes type generation)
npm run devBuild -w miroir-core

# Core package (excludes type generation)
npm run build -w miroir-core

# Build multiple stores in parallel
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres

# Type checking only (no build on miroir-standalone-app)
npx tsc --noEmit --skipLibCheck
```

### Testing Patterns

always favor integration tests to unit tests, avoid mocking when possible

### Core Testing Commands
```bash
# Specific test with debug logging (miroir-core)
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run vitest -w miroir-core -- domainSelector

# Unit tests for transformers (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests for transformers (database execution)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'

# All miroir-core unit tests
npm run test -w miroir-core -- ''
```

### Integration Testing by Store Type
```bash
# File System persistence tests
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ

# IndexedDB persistence tests  
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ

# PostgreSQL persistence tests
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run testByFile -w miroir-standalone-app -- DomainController.integ
```


### Application Development

It shall be assumed that the client already run and are available at http://localhost:5173 and the server at http://localhost:3080

In any case when this would not be the case, use the following commands to start both server and client in development mode:
```bash
# Background server build (for active development)
npm run build-tsup -w miroir-server

# Launch server
npm run dev -w miroir-server

# Launch client (use dev, not startDev)
npm run dev -w miroir-standalone-app
```

## Code Patterns & Conventions

### Schema-First Development

The Miroir Framework allows to create applications by defining data structures and behaviors through JSON-declared schemas.

The whole approach to the framework is based on a meta-language, name "ML", "MML" (for Miroir Meta-Language), "MMLS" (for Miroir Meta-Language Schema) or Jzod. The meta-schema is given in `packages/miroir-core/src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json`. It defines the structure of all data in Miroir, and it is bootstrapped, defining its own structure (it is itself an Jzod Schema). It corresponds to a subset of Typescript types.

Each core concept in Miroir (Entity, EntityDefinition, Query, Transformer, Report, Endpoint, etc.) are defined as an Entity, and each Entity can have multiple versions (EntityDefinitions). They are all defined using the Meta-language (Jzod schemas).

### Application / Deployment Structure: (Meta-)Model + Data
The Deployment of every Application is stored in two parts (here filesystem storage is used as an example, but it can be any persistence backend):
- **Model**: JSON files defining Entities, EntityDefinitions, Queries, Transformers, Reports, any logic or model-related information of an Application. For the Miroir application itself (in `packages/miroir-core/src/assets/miroir_model/`) this contains only the Meta-Model (Entity and EntityDefinition). For any other Application, this contain the actual application model.
- **Data**: JSON files defining the actual data instances of an application Model. For the Miroir application itself (in `packages/miroir-core/src/assets/miroir_data/`) this contains only data for non-bootstrapped concepts, that are the concepts belonging to the Model of the Miroir Application, but not to its Meta-Model: `Query`, `Transformer`, `Report`, etc. For any other application, this contains the actual application data.

### Miroir Core Concepts: Meta-Model

-  The bootstrapped Entity `Entity` is defined in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json`
- Each EntityDefinition defines the attributes of an Entity using a (Jzod) ML schema. The bootstrapped EntityDefinition `EntityDefinition` can be found in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json` 
- The Jzod schemas are used to generate TypeScript types and Zod validation schemas.
- The Jzod schemas for miroir and other applications can be found in directory `miroir-core/src/assets/`.
- All miroir-core types generated from Jzod schemas are found in `miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/`.
- Run `npm run devBuild` in `miroir-core` to produce TS types and zod Schemas
- TS Types from miroir-core are exported through massive index.ts (1200+ lines)

The Entities are bootstrapped to themselves as meta-classes (there is an Entity named "Entity"). EntityDefinition is also bootstrapped to itself as a meta-class (there is an EntityDefinition named EntityDefinition, which jzodSchema defines the format of all EntityDefinitions, including itself).

### Miroir Core Concepts: Model

Other core concepts are defined as Entities / EntityDefinitions, for example:
  - `Query`: allows to fetch data objects based on criteria, in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json`. General Query combines Extractors, Combiners, and Transformers
  - `Transformer`: a pure function, allow to transform data, can be run either on client or server side in-memory, or in the database (Postgres). In file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`
  - `Report`: allows to display data in the UI, based on a Query and several display sections, in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json`
  - `Endpoint`: allows to define Actions, which can perform side-effects on Entity instances and on the Model of an Application. Actions can run on the client or the server. Definition in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json`

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
- Vitest emulation to run test in the UI to be found in `test-expect.ts` for assertion patterns (`describe`, `it`, `expect`)

## Store Architecture

Multiple persistence backends with unified interface:
- `miroir-store-filesystem`: File system persistence
- `miroir-store-indexedDb`: Browser IndexedDB
- `miroir-store-postgres`: PostgreSQL with admin schema pattern

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
- `rationale.md`: Project philosophy and design decisions
- `works.md`: Development history and milestone tracking

## Platform Notes

- Use git-bash for Windows development
- Monorepo managed with npm workspaces
- ESM modules throughout (`"type": "module"`)
- TypeScript compilation via tsup for libraries, Vite for applications

## Example Application: Library

data and Model for the example Library application can be found in:
- Model: `packages/miroir-core/src/assets/library_model/`
- data: `packages/miroir-core/src/assets/library_data/`

the library application model contains Entities `Author`, `Book`, `Country`, `Publisher`, and `User`. See files in directory `packages/miroir-core/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/`

the library application data can be found:
- authors: `packages/miroir-core/src/assets/library_data/d7d7a144ff-d1b9-4135-800c-a7cfc1f38733/`
- books: `packages/miroir-core/src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/`
- countries: `packages/miroir-core/src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/`
- publishers: `packages/miroir-core/src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/`
- users: `packages/miroir-core/src/assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/`

## Critical Dependencies

- `@miroir-framework/jzod` and `@miroir-framework/jzod-ts` must be linked locally
- Build order is critical due to generated types
- Some packages have circular development dependencies requiring careful build orchestration
