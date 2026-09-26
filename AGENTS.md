# Agent instructions (shared)

Single source of truth for agent instructions: `CLAUDE.md` and `.github/copilot-instructions.md` only include it (`@AGENTS.md`). Edit this file only.

# Miroir Framework

Miroir is a web application development environment that merges development-time and runtime activities, inspired by Smalltalk. This repository is the npm-workspaces monorepo (`packages/*`). Philosophy: `docs/guides/why-miroir.md`.

Sibling repos, linked locally only when regenerating types from schemas: **jzod** (`@miroir-framework/jzod`, JSON interface to Zod) and **jzod-ts** (`@miroir-framework/jzod-ts`, TypeScript generation from Jzod schemas).

## Working here as an agent

- **Integration branch: `_integration`.** Branch from it and open PRs against it; `main` is the default branch.
- **Session setup:** `python scripts/agent_session_setup.py` installs dependencies and builds what the tests below need, skipping what is already there, then prints the session state. Claude Code cloud sessions run it automatically at start (`.claude/settings.json`). `--dry-run` shows what it would do.
- **Pre-push gate** (what `.github/workflows/pr-checks.yml` runs on every PR):
  ```bash
  python scripts/sync_agent_skills.py --check
  python -m pytest scripts/tests/test_agent_*.py -q
  npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
  npm run test -w miroir-core -- ''
  ```
  Also typecheck every other package you touched (`npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json`). Never run `tsc` from the repo root: the root `tsconfig.json` has no `include` and loads the whole monorepo.
- **Non-regression** (`scripts/run-nonreg.py`, steps in `scripts/nonreg-manifest.json`, snapshots in `test-results/nonreg/`):

  | Command | Runs | Needs |
  |---|---|---|
  | `npm run nonreg:unit` | 33 unit steps (MiroirTest unit, guards, platform unit tests) | built packages only |
  | `npm run nonreg:filesystem` | unit + integration on the filesystem profile | built packages only |
  | `npm run nonreg:default` | unit + integration on the default `emulatedServer-sql` profile | a running PostgreSQL |
  | `npm run nonreg -- --tier full` | everything, including postgres `modelValidation` | a running PostgreSQL |

  Typical use: `nonreg:unit` for any change under `packages/`; `nonreg:filesystem` as well when the change touches stores, local cache, DomainController or actions.
- **Feature work:** non-trivial features and refactors start with `code-helpers/features/<issue>-<TYPE>-<slug>/analysis.md` then `tdd-implementation-plan.md` (skills `miroir-feature-analysis`, `miroir-analysis-to-tdd-plan`). Move and rename files with `git mv`.
- **Skills:** Miroir skills are `.agents/skills/miroir-*`, next to a small shared core (`skills-lock.json`). `.agents/skills/` is canonical; `.claude/skills/` holds generated copies, so after editing a skill run `python scripts/sync_agent_skills.py`. Other skills are personal installs and are gitignored (`docs/contributing/development-setup.md`).
- **Ad-hoc scripts** (diagnostics, repo helpers, one-off tooling) are written in **Python**. Use JS/TS only when the script must run inside a package's Node/Vite/Vitest workflow or import TypeScript modules from the monorepo.
- **Code graph (optional):** when `graphify-out/graph.json` exists, `graphify query "<question>"`, `graphify path "<A>" "<B>"` and `graphify explain "<concept>"` answer broad cross-package questions with a scoped subgraph; after modifying code, refresh it with `graphify update .`. It is not built by default; `python scripts/agent_session_setup.py --graphify` installs and builds it (about 40 seconds). For focused questions, search the code directly.

## Architecture: layered (clean / hexagonal)

`miroir-core` and the other packages follow a strict layering in `src/`:

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

**Key principle:** interface dependencies may flow both ways; implementation dependencies flow downwards only. Layer 3 may use implementations from layers 2 and 1; layer 1 never references an implementation from layer 3 (it may reference interfaces from any layer).

## Packages and build order

Build in this order (`build-all.sh` is canonical; `./build-all.sh` or `./build-all.sh devBuild` for a full ordered build):

1. Optional siblings: `jzod`, `jzod-ts` (when linked locally)
2. `miroir-test-app_deployment-miroir`, `miroir-test-app_deployment-admin` (core types and concepts as Jzod schemas)
3. `miroir-core` (foundation, generated types)
4. `miroir-localcache*`, `miroir-store-*` (`filesystem`, `indexedDb`, `postgres`, `mongodb`, `bundled`; see `docs/reference/data-architecture-deployments.md`)
5. `miroir-react`, `miroir-mcp`, `miroir-diagram-class`
6. `miroir-cli`, `miroir-ai`
7. `miroir-standalone-app`
8. `miroir-test-app_deployment-library`, `miroir-test-app_deployment-postgres` (example / test applications)

Artefacts: `miroir-server` release binary (`npm run build:release -w miroir-server`), `miroir-standalone-app-electron`, Docker image. `miroir-designer` and `miroir-runtime` are unused stubs.

**Generated types:** `npm run devBuild -w miroir-core` regenerates `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/` (mainly `miroirFundamentalType.ts`) from the Jzod schemas, then builds. Run it after every change to a core schema in `packages/miroir-test-app_deployment-miroir/assets`, once `miroir-test-app_deployment-miroir` itself is rebuilt. Generator helpers: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/`.

```bash
npm run devBuild -w miroir-core    # with type generation
npm run build -w miroir-core       # without
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled
```

## Coding conventions

- TypeScript, strict settings (`tsconfig.json` per package); ESM only (`"type": "module"`).
- Early returns over deep nesting.
- Debouncing is usually a sign of bad design; find the design fix first.
- File naming: interfaces in PascalCase with descriptive prefixes (`Action*`, `CarryOn_*`); implementation files in camelCase; tests `*.unit.test.ts` / `*.integ.test.ts`.
- Actions return `ActionReturnType` (`ActionSuccess` | `ActionError`).
- One logger per file, named after the file; setup pattern and log presets: `docs/contributing/code-style.md`.

### React

- Functional components with hooks.
- Ask for confirmation before adding a `useEffect`; use it only when strictly necessary.
- Feed data to components through props and hooks (`useSelector`, `useDispatch`, …). Publish-subscribe between components is an anti-pattern here; subscription services are for code outside React (e.g. server side).
- To limit rendering with data from a service, expose that data through a hook; a `useMemo` around a plain service call does not track the data.

## Testing

Favor integration tests over unit tests and avoid mocking. Entity-backed tests use the **MiroirTest** model: select them with `testMiroir` (CLI) or the **Miroir Tests** menu of the standalone app. `testByFile` + `RUN_TEST` is only for PLATFORM TypeScript tests that have no MiroirTest entity. Guide: `docs/contributing/testing.md`; full reference (discovery, filters, profiles, log presets): `docs/reference/testing.md`.

```bash
# Rebuild the deployment after MiroirTest JSON changes
npm run build -w miroir-test-app_deployment-miroir

# MiroirTest, selected by instance name
npm run testMiroir -w miroir-core -- --suites mustache,alterObject_atPath --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites miroirCoreTransformers --mode integration

# PLATFORM vitest by file name (optional RUN_TEST)
RUN_TEST=Transformer_ResultSchema.failures npm run testByFile -w miroir-core -- Transformer_ResultSchema.failures

# All miroir-core unit tests
npm run test -w miroir-core -- ''

# Integration on a given store: pick the config, and a log preset (catch-all, scope-query, scope-persistence, …)
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
VITE_MIROIR_LOG_CONFIG_FILENAME=scope-persistence \
npm run testByFile -w miroir-standalone-app -- DomainController.integ
```

Store configs in `packages/miroir-standalone-app/tests/`: `miroirConfig.test-emulatedServer-{filesystem,indexedDb,sql,mongodb}.json` (`sql` needs PostgreSQL). Tests run single-threaded; in test mode `RestClientStub` emulates the server. Assertion helpers for in-app / MiroirTest runs: `packages/miroir-core/src/1_core/testing/test-expect.ts`.

## Running the application

Vite client at http://localhost:5173, API server at http://localhost:3080 (https when `certs/` is set up). A packaged server serves the client itself at https://localhost:3080. Details: `docs/guides/build-it-yourself.md`.

```bash
npm run build:server -w miroir-server                       # server release binary (there is no `npm run dev` on miroir-server)
NODE_ENV=development node packages/miroir-server/release/index.js
npm run dev -w miroir-standalone-app                        # Vite client
```

## Schema-first model

Applications are defined by data structures and behaviours declared as JSON, in a meta-language called **ML** (also MML, MMLS or Jzod), a subset of TypeScript types. The meta-schema is bootstrapped (it describes itself): `packages/miroir-test-app_deployment-miroir/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json`. Jzod schemas generate the TypeScript types and Zod validators; miroir-core exports its types through `packages/miroir-core/src/index.ts`.

Every core concept is an **Entity**; the live Entity row is the authoritative definition (`mlSchema`, primary key `idAttribute`, view / cache fields). `Entity` is its own meta-class (its `parentUuid` is its own uuid). Model history (`EntityVersion`, freeze, `modelVersion`) is optional: `docs/reference/versioning.md`. Primary keys (UUID, single non-UUID, composite) and their helpers: `docs/guides/developer/defining-entities.md`.

Core concept Entities, in `packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/`:

| Concept | Entity file | Role |
|---|---|---|
| Entity | `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json` | the meta-class |
| Query | `e4320b9e-ab45-4abe-85d8-359604b3c62f.json` | fetch data: Extractors, Combiners, Transformers |
| TransformerDefinition | `a557419d-a288-4fb8-8a1e-971c86c113b8.json` | pure functions, in memory (client or server) or in Postgres |
| Report | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json` | UI display of a Query through sections |
| Endpoint | `3d8da4d4-8f76-4bb4-9212-14869d81c00c.json` | Actions with side effects on instances and models |

**Deployments** store each Application as **model** (`{prefix}_model/`: Entities, Queries, Reports, …) and **data** (`{prefix}_data/`: instances) under `packages/miroir-test-app_deployment-*/assets/`, whatever the store backend. `miroir-core/src/assets/` holds only leftover fixtures. Layout, store backends and the Library example: `docs/reference/data-architecture-deployments.md`.

State management: Redux + Redux-Sagas for async flows, domain state isolated from UI state, query selectors exposed as React hooks.

## Key files

- `packages/miroir-core/src/3_controllers/DomainController.ts`: core business logic
- `packages/miroir-core/src/2_domain/QuerySelectors.ts`: data access
- `packages/miroir-core/src/index.ts`: type export surface

## Platform notes

- Windows development uses git-bash.
- Some packages have circular development dependencies: follow the build order above.
