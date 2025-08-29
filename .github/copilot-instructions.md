# Miroir Framework Copilot Instructions

## Project Overview

The Miroir Framework is a comprehensive web application development environment that integrates development-time and runtime activities, inspired by Smalltalk's interactive development model. This is a **multi-workspace monorepo** containing:

- **jzod**: JSON interface to Zod schemas (`@miroir-framework/jzod`)
- **jzod-ts**: TypeScript type generation for Jzod schemas (`@miroir-framework/jzod-ts`)
- **miroir-app-dev**: Main framework monorepo with layered architecture

## Architecture: Layered Domain-Driven Design (Clean or Hexagonal Architecture)

The `miroir-core` and other packages follows a strict layered architecture in `src/`:

```
0_interfaces/    → Core type definitions and Jzod schemas
1_core/          → Foundation layer (tools, constants, domain state)
2_domain/        → Domain logic (selectors, transformers, templates)  
3_controllers/   → Application controllers (DomainController, ActionRunner)
4_services/      → Infrastructure services (persistence stores)
4_views/         → UI layer
```

**Key Principle**: Dependencies flow downward only. Layer 3 can use 2 and 1, but layer 1 cannot reference layer 3.

## Package Dependencies & Build Order

Core dependency graph (must be built in this order):
1. `miroir-core` (foundation with generated types)
2. `miroir-localcache-redux`, `miroir-store-*` packages
3. `miroir-react`, `miroir-server`
4. `miroir-standalone-app`, `miroir-designer`

## Development Workflows

### Build Commands
```bash
# Core package (includes type generation)
npm run devBuild -w miroir-core

# Build multiple stores in parallel
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres

# Type checking only (no build on miroir-standalone-app)
npx tsc --noEmit --skipLibCheck
```

### Testing Patterns

always favor integration tests to unit tests, avoid mocking when possible

for test commands, see the "Automated tests" section in `README.md`


### Application Development
```bash
# Background server build (for active development)
npm run build-tsup -w miroir-server

# Launch server
npm run dev -w miroir-server

# Launch client (no run dev on miroir-standalone-app - use startDev)
npm run dev -w miroir-standalone-app
```

## Code Patterns & Conventions

### Schema-First Development

The Miroir Framework allows to create applications by defining data structures and behaviors through JSON-declared schemas.

- the meta-schema is given in `packages/miroir-core/src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json`. It defines the structure of all data in Miroir, and it is bootstrapped, defining its own structure. It is equivalent to a subset of Typescript types.
- All miroir-core types generated from Jzod schemas in `miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/`
- most important Concepts (Entity, EntityDefinition, Query, Transformer, Report):
  - `Entity`: declares a core concept, defines data objects, in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json`
  - `EntityDefinition`: one version of an Entity, defines its attributes (jzodSchema), in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json` 
  - `Query`: allows to fetch data objects based on criteria, in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json`. General Query combines Extractors, Combiners, and Transformers
  - `Transformer`: a pure function, allow to transform data, can be run either on client or server side in-memory, or in the database (Postgres). In file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`
  - `Report`: allows to display data in the UI, based on a Query and several display sections, in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json`
  - `Endpoint`: allows to define Actions, which can perform side-effects on Entity instances. Actions can run on the client or the server. Definition in file `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json`
- Run `npm run devBuild` in `miroir-core` before building
- Types from miroir-core are exported through massive index.ts (1294+ lines)

### State Management Pattern
- Redux + Redux-Sagas for complex async flows
- Domain state isolated from UI state
- Query selectors for domain state access
- Transformer pattern for data manipulation

### File Naming Conventions
- Interfaces: PascalCase with descriptive prefixes (`Action*`, `CarryOn_*`)
- Implementation files: camelCase descriptive names
- Test files: `*.test.ts` with descriptive module names

### Error Handling
- Consistent `ActionReturnType` pattern with `ActionSuccess` | `ActionError`
- Zod validation with custom error handlers in `zodParseErrorHandler.ts`
- Test utilities in `test-expect.ts` for assertion patterns

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
- Test fixtures in `tests/resources/` directories
- In test mode the `RestClientStub` is used to simulate server interactions without a live server


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

## Critical Dependencies

- `@miroir-framework/jzod` and `@miroir-framework/jzod-ts` must be linked locally
- Build order is critical due to generated types
- Some packages have circular development dependencies requiring careful build orchestration
