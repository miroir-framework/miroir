# Issue #621 — TDD Implementation Plan (epic)

> Epic plan: it names the eight issues to create under #621 and their vertical TDD slices (RED → GREEN each).
> Tests are integration-first per `docs/contributing/testing.md`. They run the real DomainController, local cache and
> store profiles (`test-filesystem` first), through the surfaces a package consumer uses: MCP tools, CLI commands,
> the Express router, the startup calls, `npm pack` tarballs and a generated project. No mocks.
> The tracer bullet of the epic is I1 slice 1: an Endpoint added to a fixture application becomes an MCP tool with no code naming it.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step; commits happen only when the user
> explicitly asks. Each slice ends with its Validation commands; on success its Realization summary is appended
> and its Status flips to ✅ DONE.
>
> **Granularity:** I1, I2 and I3 get their own `analysis.md` (analysis §5). Their slices below are provisional:
> the issue's own `tdd-implementation-plan.md` refines them and this plan then links to it. The other issues
> are planned in full here.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/621
Prerequisite: none. Related: #592 / #600 / #604 (shell moves, parent #13), #519 (per-application model environment), #326 (release tree, dependency policy)
Working branch: one branch per issue, `claude/<issue>-<slug>` from `_integration`

**Resume note:** plan written, no issue created yet.

---

## Scope

In (analysis §1):

- G1 Install Miroir from the registry: I5, I6, I8.
- G2 Pick my store: I3 (stores injected), I5 (manifests), I6 (store packages published one by one).
- G3 Agent and CLI access to my application: I1.
- G4 Start a project from a template: I3, I4, I7.
- G5 Upgrade in one step: I5 (duplicate-core guard, peers), I6 (lockstep names), I8.
- G6 Release by hand: I8.

This plan does **not** run `npm publish` (D4), give consumers their own React shell (D5), or make the server serve a user-chosen bundle (next step after #621, its own issue; I3 slice 3 only makes the client folder a parameter). The meta-model size (#337 F3) stays out.

---

## Issues to create

Titles follow the repo's `TYPE: description` convention. Each issue is added to the miroir-framework GitHub Project (#2) as a sub-issue of #621, and its branch carries its number.

| Id | Proposed title | Analysis items | Needs | Own analysis | Decisions to confirm first |
|---|---|---|---|---|---|
| I1 | FEATURE: MCP tools, CLI commands and CopilotKit actions from the Endpoints of every deployed application | W1 | none | yes | D9 |
| I2 | REFACTOR: move the app shell and routes of miroir-standalone-app to miroir-react | W2 | #592 slice 4 (reports cycle), done inside I2 | yes (next #13 slice) | none |
| I3 | REFACTOR: extract a server library (Express router factory) from miroir-server | W3 | I4 slice 1 helps, not required | yes | none |
| I4 | REFACTOR: one startup call for Node hosts and one for React clients | W4 | none | no | D8 |
| I5 | BUILD: well-formed package manifests, peer dependencies, duplicate-core guard, core subpaths | W5, W6, W7 | none | no | D10, D11 |
| I6 | BUILD: rename the published packages to @miroir-framework/* | W8 | I1, I2, I5 | no | D7, D8 |
| I7 | FEATURE: create-miroir-app template and an out-of-workspace consumer test | W9 | I3, I4, I6 | no | template name (analysis §7) |
| I8 | BUILD: release pipeline produces publish-ready tarballs for the published set | W10 | I6, I7 | no | none |

Order: I1, I4 and I5 can start now and run in parallel. I2 and I3 next. I6 waits for I1, I2 and I5. I7, then I8, close the epic.

---

## Progress summary

| Issue | Slice | Title | Status | Primary proof |
|---|---|---|---|---|
| I1 | 0 | Characterize the endpoint surfaces | ⬜ | `endpointSurfaces.<I1>.phase0.integ.test.ts` (miroir-mcp, miroir-cli) |
| I1 | 1 | Tracer: fixture Endpoint becomes an MCP tool | ⬜ | `endpointActionCatalog.<I1>.phase1.integ.test.ts` |
| I1 | 2 | CLI commands from the catalog | ⬜ | `cli.integ.test.ts`, new fixture command case |
| I1 | 3 | Each call runs with its application's model environment | ⬜ | rejection of a fixture instance by its own Entity schema |
| I1 | 4 | CopilotKit actions from the catalog | ⬜ | `copilotKitActions.<I1>.phase4.unit.test.ts` |
| I1 | 5 | No runtime dependency on example packages, nonreg, docs | ⬜ | `scripts/tests/test_package_runtime_dependencies.py` |
| I2 | 0 | Characterize the shell modules and the sandbox alias | ⬜ | inventory script output |
| I2 | 1 | Break the reports / component-tests cycle | ⬜ | lint layer rule + existing UI suites |
| I2 | 2 | Shell and routes in miroir-react, host services injected | ⬜ | standalone app UI integ suites |
| I2 | 3 | Sandbox builds without the alias | ⬜ | sandbox `vite build` + `unit-435`, `unit-443` |
| I2 | 4 | Nonreg, bundle guard, cleanup | ⬜ | full nonreg, `scripts/check_bundle_policy.py` |
| I3 | 0 | Characterize the server's HTTP surface | ⬜ | `serverHttpSurface.<I3>.phase0.integ.test.ts` |
| I3 | 1 | Tracer: REST handlers from a router mounted on a bare Express app | ⬜ | `miroirRouter.<I3>.phase1.integ.test.ts` |
| I3 | 2 | Auth, capabilities and MCP behind router options | ⬜ | phase0 test green against the router |
| I3 | 3 | Client folder as a parameter | ⬜ | router serves a temporary `index.html` |
| I3 | 4 | Stores injected; the library imports no driver | ⬜ | dist import scan + Postgres-free start |
| I4 | 0 | Characterize the two `setupMiroirPlatform` copies | ⬜ | `startMiroir.<I4>.phase0.unit.test.ts` |
| I4 | 1 | `startMiroirNode`: CLI and MCP share one call | ⬜ | `cli.integ`, `unit-345-mcp` |
| I4 | 2 | `startMiroirClient`: sandbox and standalone app share one call | ⬜ | sandbox tests, standalone UI integ smoke |
| I4 | 3 | Server and Electron on `startMiroirNode` | ⬜ | `environmentBoot`, server phase0 test |
| I5 | 1 | Duplicate copies of core are reported | ⬜ | `duplicateCore.<I5>.phase1.unit.test.ts` |
| I5 | 2 | Manifest contract for the published set | ⬜ | `scripts/tests/test_package_manifests.py` |
| I5 | 3 | Named subpaths replace `./src/*` | ⬜ | `npm pack --dry-run` file list, typecheck |
| I5 | 4 | No `import.meta.env` in published code | ⬜ | `tools.<I5>.phase4.unit.test.ts` |
| I6 | 0 | Characterize every package-name reference | ⬜ | rename script `--report` |
| I6 | 1 | Rename script, rerunnable on open branches | ⬜ | `scripts/tests/test_rename_packages.py` |
| I6 | 2 | Apply the rename | ⬜ | `build-all.sh`, full nonreg |
| I6 | 3 | Meta-model and local cache join core and react (D7, D8) | ⬜ | packed core exposes `./meta-model`, `./admin` |
| I7 | 1 | Generator writes a runnable project | ⬜ | `create-miroir-app` unit test on a temp folder |
| I7 | 2 | Consumer test builds and starts the generated project from tarballs | ⬜ | `ci/release/tests/test_consumer_project.py` |
| I8 | 1 | Published set selected, consumer check covers it | ⬜ | `ci/release/tests/test_release_version.py` |
| I8 | 2 | Handoff lists the manual publish commands, pipeline never publishes | ⬜ | `ci/release/tests/test_tarballs.py` |

---

## Locked implementation defaults

From the analysis decision record. D1 to D6 are confirmed. D7 to D11 are the recommended options and bind the plan unless the user overrides them before the issue that needs them starts; an override is recorded in that slice's Realization.

| Decision | Choice | Serves | Used by |
|---|---|---|---|
| D1 Package cut | curated scoped set (option B) | G1, G2, G5 | I6 |
| D2 Registry | npmjs.org, public | G1 | I8 |
| D3 Names | rename in the repo | G1 | I6 |
| D4 Publish step | manual | G6 | I8 |
| D5 Client | standalone app is the only client | scope | I2, I7 |
| D6 Sequencing | every item lands before a publish | G1, G5 | all |
| D7 Meta-model packages | stay private workspace packages, bundled into core, exposed as `@miroir-framework/core/meta-model` and `/admin` (D7-b) | G1, G5 | I6 |
| D8 Local cache | bundled into react; its Node entry exposed by `@miroir-framework/server` (D8-a) | G1 | I4, I6 |
| D9 Endpoint surfaces | one endpoint action catalog in `miroir-core`, adapters per surface (D9-b); per-action opt-in (D9-c) only as a follow-up | G3 | I1 |
| D10 Shared libraries | peers for `zod`, `react`, `react-dom`, `@mui/material`, `@emotion/*`; exact dependencies for the rest (D10-b) | G1, G5 | I5 |
| D11 Core API | 0.x promises no stability; `@public` TSDoc marks the supported part (D11-a) | G5 | I5 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| I1 fixture Endpoint in `miroir-fixture-appForTest` (`appForTest_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/`) | `bb447b8c-a687-408a-bc59-293aea293906` |
| I1 fixture Endpoint name / action type | `fixtureEndpoint` / `fixtureCreateItem` |
| I1 nonreg step | `unit-<I1>-endpoint-surfaces` (scopes `runners`, `tooling`) |
| I3 nonreg step | `integ-<I3>-server-router` (scopes `actions`, `tooling`) |
| I4 nonreg step | `unit-<I4>-startup-calls` (scopes `tooling`, `localcache`) |
| I5 pytest guard | `scripts/tests/test_package_manifests.py` (runs in the pre-push gate's `pytest scripts/tests`) |
| I6 rename script | `scripts/rename_packages.py`, mapping in `scripts/package-rename-map.json` |
| I7 consumer test | `ci/release/tests/test_consumer_project.py` |
| Spare (I3 / I7 fixtures if needed) | `65434538-bc31-4d02-a55c-6cd23f77720c`, `11d3cd67-18b0-4a13-89f8-5939df789ad8` |

`<I1>` … `<I8>` are replaced by the issue numbers once created.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| MCP tests on a test environment | `npm run testByFile -w miroir-mcp -- <name>` (`MIROIR_ENV=test-filesystem` by default) |
| CLI tests | `npm run testByFile -w miroir-cli -- <name>` |
| CopilotKit tests | `npm run testByFile -w miroir-ai -- <name>` |
| Server tests | `npm run testByFile -w miroir-server -- <name>` |
| Fixture model validation | `npm run testByFile -w miroir-fixture-appForTest -- tests/modelValidation.unit.test.ts` |
| Standalone app UI integ | `npm run testMiroir -w miroir-standalone-app -- --suites <ui suite> --mode integ` |
| Release pipeline tests | `python -m pytest ci/release/tests -q` |
| Repo script tests | `python -m pytest scripts/tests -q` |
| Dependency policy | `python scripts/check_dependency_policy.py` |
| Bundle guard | `python scripts/check_bundle_policy.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg (per slice) | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (every 2 or 3 slices, last slice of each issue) | `npm run nonreg:filesystem -- --runner shared` |

Vitest is the vehicle for most slices here, because the behavior under test is a package surface (an MCP server, a `commander` program, an Express router, a tarball), not something a MiroirTest can express. Each slice says why when it uses vitest or pytest.

---

# I1 — Endpoint action catalog for MCP, CLI and CopilotKit

Provisional slices; the I1 analysis settles the questions of analysis §8.1 (eager or lazy CLI registration) and §3 D9 (naming across surfaces, refresh, access checks).

## I1 Slice 0 — Characterize the endpoint surfaces

**Status:** ⬜ pending

### Goal

Lock what each surface exposes today, so the refactor keeps it.

### 0.1 RED → GREEN — current tool, command and action lists

**Test:** `packages/miroir-mcp/tests/integration/issues/<I1>-endpoint-surfaces/endpointSurfaces.<I1>.phase0.integ.test.ts` and the same name under `packages/miroir-cli/tests/issues/<I1>-endpoint-surfaces/`. Vitest: the surfaces are the MCP `listTools` result and the `commander` command list, which no MiroirTest reaches.

Behavior asserted:
- MCP `EndpointToolRegistry.listTools` on `test-filesystem` lists the Library `lendingEndpoint` and `bookEndpoint` actions under their current names (`toolNameFor`).
- `getAllCommands()` of miroir-cli lists the core `instanceEndpointV1` commands plus `lendDocument`, and no other application action (known misalignment, analysis §3 D9).
- `handleMcpAction` without a model environment falls back to the Library environment (known misalignment, recorded, removed in slice 3).

### Validation

```bash
npm run testByFile -w miroir-mcp -- endpointSurfaces
npm run testByFile -w miroir-cli -- endpointSurfaces
```

### Realization

---

## I1 Slice 1 — Tracer: an Endpoint added to a fixture application becomes an MCP tool

**Status:** ⬜ pending

### Goal

An MCP client sees a tool for an Endpoint of `miroir-fixture-appForTest` that no TypeScript names.

**Layers cut:** fixture Endpoint JSON asset → `miroir-core` catalog (layer 2/3) → `miroir-mcp` registry.

### 1.1 RED

**Test:** `packages/miroir-mcp/tests/integration/issues/<I1>-endpoint-surfaces/endpointActionCatalog.<I1>.phase1.integ.test.ts`

Behavior asserted:
- With the fixture deployed on `test-filesystem`, `listTools` contains a tool for `fixtureEndpoint` / `fixtureCreateItem`.
- Calling it creates the instance; a following `getInstances` tool call returns it.

### 1.2 GREEN

- Add Endpoint `bb447b8c-…` to the fixture's model assets (one action creating an instance of an existing fixture Entity), rebuild the fixture.
- Move the enumeration of `EndpointToolRegistry.listTools` (applications of the map, well-formed endpoints, actions with a type and a payload, sorted, named by `toolNameFor`) into `endpointActionCatalog` in `miroir-core`. `EndpointToolRegistry` keeps naming collisions and access checks and reads the catalog.

### Refactor checkpoint

`toolNameFor` and `sanitizeToolNamePart` move to core with the catalog if the CLI needs them in slice 2; otherwise they stay.

### Validation

```bash
npm run build -w miroir-fixture-appForTest
npm run testByFile -w miroir-fixture-appForTest -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-mcp -- endpointSurfaces endpointActionCatalog endpointToolRegistry
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,runners
```

### Realization

---

## I1 Slice 2 — CLI commands from the catalog

**Status:** ⬜ pending

### Goal

`miroir` lists and runs a command for every action of every deployed application, the fixture's included, and the hard-coded Library entry is gone.

**Layers cut:** catalog → `miroir-cli/src/commands/commandsFromEndpoint.ts` → `commander` program.

### 2.1 RED

**Test:** new case in `packages/miroir-cli/tests/cli.integ.test.ts`

Behavior asserted:
- The fixture's `fixtureCreateItem` command exists and creates an instance.
- `lendDocument` still exists (now from the catalog) and the slice 0 command list is unchanged otherwise.

### 2.2 GREEN

Replace `cliRequestHandlers_Library_lendingEndpoint` with commands built from the catalog once the stores are open (or lazily, per the I1 analysis).

### Refactor checkpoint

The CLI and MCP adapters share the "catalog entry → payload schema + action envelope" step; extract it if both copies remain.

### Validation

```bash
npm run testByFile -w miroir-cli -- cli.integ endpointSurfaces
npx tsc --noEmit --skipLibCheck -p packages/miroir-cli/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,runners
```

### Realization

---

## I1 Slice 3 — Each call runs with its application's model environment

**Status:** ⬜ pending

### Goal

An agent or CLI call on the fixture application validates and runs with the fixture's model, not the Library's.

### 3.1 RED

**Test:** `endpointActionCatalog.<I1>.phase3.integ.test.ts` (miroir-mcp) and a case in `cli.integ.test.ts`

Behavior asserted:
- A `fixtureCreateItem` call with an instance its fixture Entity rejects is refused, naming the mismatch (#558 path, `rejectInstancesNotMatchingTheirEntity`), on MCP and CLI.
- The same call with a valid instance succeeds.

### 3.2 GREEN

The CLI passes `currentModelEnvironment(applicationUuid, map)` as MCP already does; remove the `getDefaultLibraryModelEnvironmentDEFUNCT` fallback of `handleMcpAction` and the Library environment in `commandsFromEndpoint.ts`.

### Validation

```bash
npm run testByFile -w miroir-mcp -- endpointActionCatalog
npm run testByFile -w miroir-cli -- cli.integ
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## I1 Slice 4 — CopilotKit actions from the catalog

**Status:** ⬜ pending

### Goal

The CopilotKit route offers the actions of every deployed application, with no Library UUID in `miroir-ai`.

### 4.1 RED

**Test:** `packages/miroir-ai/tests/unit/issues/<I1>-endpoint-surfaces/copilotKitActions.<I1>.phase4.unit.test.ts`. Vitest: CopilotKit actions are a TypeScript surface of the AI route.

Behavior asserted:
- `createMiroirCopilotKitActions` for a map holding the Library and the fixture returns `lendDocument` and `fixtureCreateItem`.
- The `cursorSdk.275` source-pin tests that name `lendingEndpoint` are updated to the catalog, not deleted.

### 4.2 GREEN

Build the actions from the catalog; drop `deployment_Library_DO_NO_USE`, `selfApplicationLibrary` and the UUID filter from `miroirCopilotKitActions.ts`.

### Validation

```bash
npm run testByFile -w miroir-ai -- copilotKitActions cursorSdk
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,external,runners
```

### Realization

---

## I1 Slice 5 — No runtime dependency on example packages; nonreg, docs, cleanup

**Status:** ⬜ pending

### 5.1 RED

**Test:** `scripts/tests/test_package_runtime_dependencies.py`. Pytest: a repository-wide manifest rule.

Behavior asserted:
- No package outside `miroir-example-*`, `miroir-fixture-*`, the standalone app, the sandbox and the server binary lists a `miroir-example-*` or `miroir-fixture-*` package in `dependencies` or `peerDependencies`.

### 5.2 GREEN

Remove `miroir-example-library` from `miroir-mcp`, `miroir-cli`, `miroir-ai`, `miroir-localcache-redux`, `miroir-localcache-zustand` dependencies (devDependencies stay where tests use it).

### Final checklist

- Nonreg step `unit-<I1>-endpoint-surfaces` (scopes `runners`, `tooling`) runs the phase tests.
- Docs: `docs/reference/` MCP and CLI pages say tools and commands come from deployed Endpoints.
- Tracer narrative: deploy the fixture, list MCP tools, run the CLI command, see the same instance.
- Move lasting assertions into `endpointToolRegistry.integ.test.ts` and `cli.integ.test.ts`; delete `issues/<I1>-*`.
- AC checklist: G3 → slices 1 to 4; "no code names an application" → slice 5 guard.

### Validation

```bash
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

# I2 — App shell and routes to miroir-react

Provisional; the I2 analysis follows the #592 survey method (§4.1: parse imports, follow them transitively, classify movable modules).

## I2 Slice 0 — Characterize the shell modules and the sandbox alias

**Status:** ⬜ pending

### 0.1 RED → GREEN

**Test:** the #592 survey script rerun on `miroir-standalone-app/src/miroir-fwk/4_view` (59 modules); its output, committed in the I2 folder, lists each module and its blocker. The `@miroir-app` alias of `miroir-sandbox/vite.config.js` and its five imports are recorded.

### Validation

```bash
python code-helpers/features/<I2>-REFACTOR-<slug>/survey_shell_modules.py
npm run build -w miroir-sandbox
```

### Realization

---

## I2 Slice 1 — Break the reports / component-tests cycle

**Status:** ⬜ pending

### Goal

The report sections no longer import `4-tests/componentTests`, so they can move (#592 §5.3, slice 4).

### 1.1 RED

**Test:** the `miroir/layers` lint rule extended to forbid imports from `4_view` into `4-tests`; it fails on today's code.

### 1.2 GREEN

Invert the dependency (the test tools register with the view through the existing test provider of #600), as the I2 analysis decides.

### Validation

```bash
npm run lint
npm run nonreg:filesystem -- --runner shared --scope smoke,ui --only unit-610-report-section-renderers
```

### Realization

---

## I2 Slice 2 — Shell and routes in miroir-react, host services injected

**Status:** ⬜ pending

### Goal

`RootComponent`, `AppBar`, `Sidebar`, `PageDispatcher`, `ErrorPage`, the `routes/` pages and `reportSectionRenderers.tsx` are exported by `miroir-react`. Electron IPC (`ElectronIpcProxy`), the auth transport and the AI routes (`@copilotkit/*`) stay in the app and reach the shell as injected services.

### 2.1 RED

**Test:** the standalone app's UI integration suites import the shell from `miroir-react`; they fail until the move.

### 2.2 GREEN

`git mv` per #592 D5 (same relative paths), index exports, a host-services context for the three injected services.

### Validation

```bash
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
python scripts/check_bundle_policy.py
```

### Realization

---

## I2 Slice 3 — The sandbox builds without the alias

**Status:** ⬜ pending

### Goal

`miroir-sandbox` builds and runs from library packages only: the proof the client side of the epic needs.

### 3.1 RED

Remove the `@miroir-app` alias and its `tsconfig` path; the sandbox build fails.

### 3.2 GREEN

Import the five modules from `miroir-react`.

### Validation

```bash
npm run build -w miroir-sandbox
npm run nonreg:filesystem -- --runner shared --only unit-435-test-sandbox-header --only unit-443-test-sandbox-play-pause --scope smoke,ui
```

### Realization

---

## I2 Slice 4 — Nonreg, bundle guard, cleanup

**Status:** ⬜ pending

Full nonreg, bundle report within the #337 budget, docs (`docs/internals/application-startup.md` and the UI architecture folder map), issue-directory cleanup, AC checklist.

### Validation

```bash
npm run nonreg:filesystem -- --runner shared
python scripts/check_bundle_policy.py
```

### Realization

---

# I3 — Server library

Provisional; the I3 analysis settles analysis §8.2 (router only, or TLS and `listen` too).

## I3 Slice 0 — Characterize the server's HTTP surface

**Status:** ⬜ pending

### 0.1 RED → GREEN

**Test:** `packages/miroir-server/tests/issues/<I3>-server-library/serverHttpSurface.<I3>.phase0.integ.test.ts`. Vitest: it starts the real server process on `test-filesystem` and talks HTTP, which no MiroirTest does.

Behavior asserted:
- `GET /capabilities` and `GET /auth/status` answer as today.
- One REST action from `restServerDefaultHandlers` (`getInstances` on the Library) returns the seeded instances.
- MCP `tools/list` on the MCP port answers.
- `GET /` serves `index.html` from the client folder when it exists.

### Validation

```bash
npm run build:server -w miroir-server
npm run testByFile -w miroir-server -- serverHttpSurface
```

### Realization

---

## I3 Slice 1 — Tracer: REST handlers from a router on a bare Express app

**Status:** ⬜ pending

### Goal

A Node program mounts Miroir's REST API on its own Express app with one call.

### 1.1 RED

**Test:** `miroirRouter.<I3>.phase1.integ.test.ts` creates `express()`, mounts `createMiroirRouter({ domainController, persistenceStoreControllerManager, applicationDeploymentMap })`, and runs the slice 0 REST assertion in-process.

### 1.2 GREEN

Move the `restServerDefaultHandlers` loop (server.ts ~623) into the router factory; `server.ts` mounts the router.

### Validation

```bash
npm run testByFile -w miroir-server -- serverHttpSurface miroirRouter
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,tooling
```

### Realization

---

## I3 Slice 2 — Auth, capabilities and MCP behind router options

**Status:** ⬜ pending

The login, password, status and capabilities routes and the MCP mounting (`EndpointToolRegistry`, `setupMcpServer`) move behind options of the factory. **RED:** the slice 0 test runs against a server built only from the router and fails on the missing routes. **GREEN:** move them. The #263 gate tests (`mcpServerGate.263.phase7`) stay green.

### Validation

```bash
npm run testByFile -w miroir-server -- serverHttpSurface miroirRouter mcpServerGate
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,runners
```

### Realization

---

## I3 Slice 3 — Client folder as a parameter

**Status:** ⬜ pending

**RED:** `miroirRouter.<I3>.phase3.integ.test.ts` passes `clientDirectory` pointing at a temporary folder holding an `index.html` and expects it on `GET /`. **GREEN:** replace the fixed `path.join(__dirname, 'client')` with the option; the binary passes its current folder. This is the hook for the "server serves the user's bundle" issue that follows the epic.

### Validation

```bash
npm run testByFile -w miroir-server -- miroirRouter
```

### Realization

---

## I3 Slice 4 — Stores injected; the library imports no driver

**Status:** ⬜ pending

**RED:** a test scans the built router entry for imports of `mongodb`, `pg`, `sequelize`, `level` and finds the four store packages (server.ts lines 90–93 today). **GREEN:** the factory takes the store startups as a parameter; only the binary imports them. A Postgres-free start (filesystem store only) passes slice 0.

### Final checklist

Nonreg step `integ-<I3>-server-router` (scopes `actions`, `tooling`); docs `docs/guides/build-it-yourself.md` (mount the router); cleanup; AC.

### Validation

```bash
npm run build:server -w miroir-server
npm run testByFile -w miroir-server
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

# I4 — One startup call per side

## I4 Slice 0 — Characterize the two `setupMiroirPlatform` copies

**Status:** ⬜ pending

**Test:** `packages/miroir-cli/tests/issues/<I4>-startup-calls/startMiroir.<I4>.phase0.unit.test.ts`. Vitest: a TypeScript function of a host package.

Behavior asserted: on `test-filesystem` with `emulateServer`, the CLI copy returns `domainController`, `localCache`, `domainControllerForServer` and `restClientStub` (`setup.ts:102–110`); the MCP copy returns the same minus the last two (analysis §4.6).

### Validation

```bash
npm run testByFile -w miroir-cli -- startMiroir
```

### Realization

---

## I4 Slice 1 — `startMiroirNode`: the CLI and MCP share one call

**Status:** ⬜ pending

### Goal

A Node host gets a working domain controller from one call, with the stores it passes.

### 1.1 RED

**Test:** `startMiroir.<I4>.phase1.integ.test.ts` calls `startMiroirNode(config, { stores: [miroirFileSystemStoreSectionStartup] })` and reads Library instances through the returned domain controller.

### 1.2 GREEN

`startMiroirNode` in `miroir-localcache-redux/node` (moves to `@miroir-framework/server` in I6, D8-a), starting from the CLI copy and its larger return shape; the CLI and MCP call it; both `startup/setup.ts` files go.

### Validation

```bash
npm run testByFile -w miroir-cli -- startMiroir cli.integ
npm run testByFile -w miroir-mcp
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,localcache
```

### Realization

---

## I4 Slice 2 — `startMiroirClient`: the sandbox and the standalone app share one call

**Status:** ⬜ pending

**RED:** a `miroir-react` test renders `MiroirContextReactProvider` and `LocalCacheProvider` from what `startMiroirClient(config, { stores })` returns, on the IndexedDB and bundled stores the sandbox uses, and displays one report. **GREEN:** extract the ~100 lines of `miroir-sandbox/src/index.tsx` (loggers, `miroirCoreStartup`, store registration, `MiroirContext`, `RestClientStub`, the two `PersistenceStoreControllerManager`s, `setupMiroirDomainController`); the sandbox and `miroir-standalone-app/src/index.tsx` call it.

### Validation

```bash
npm run build -w miroir-sandbox
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

### Realization

---

## I4 Slice 3 — Server and Electron on `startMiroirNode`

**Status:** ⬜ pending

`server.ts` (~400–440) and `miroir-standalone-app-electron/src/ipcServerSetup.ts` call `startMiroirNode`. Proof: the I3 slice 0 test if I3 has landed, otherwise `environmentBoot` and a server start on `test-filesystem`. Nonreg step `unit-<I4>-startup-calls`; cleanup; AC.

### Validation

```bash
npm run testByFile -w miroir-standalone-app-electron -- environmentBoot
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

# I5 — Well-formed packages

## I5 Slice 1 — Duplicate copies of core are reported

**Status:** ⬜ pending

### Goal

A consumer whose tree holds two copies of core gets a warning that names both versions, instead of "no store factory for …" later.

### 1.1 RED

**Test:** `packages/miroir-core/tests/4_services/issues/<I5>-package-hygiene/duplicateCore.<I5>.phase1.unit.test.ts`. Vitest: it loads two copies of the built core module from two temporary paths, which only a Node test can do.

Behavior asserted: the second `miroirCoreStartup()` logs a warning naming both instances' versions and paths; a single copy logs nothing.

### 1.2 GREEN

A version stamp on `globalThis` (`Symbol.for("miroir-core")`) set at startup.

### Validation

```bash
npm run build -w miroir-core
npm run testByFile -w miroir-core -- duplicateCore
npm run test -w miroir-core -- ''
```

### Realization

---

## I5 Slice 2 — Manifest contract for the published set

**Status:** ⬜ pending

### 2.1 RED

**Test:** `scripts/tests/test_package_manifests.py`. Pytest: it checks manifests across packages.

Behavior asserted, for each package of the published set (analysis §4.1): `files`, an `exports` map, `sideEffects`, `engines.node`, `repository`, `license`; no `miroir-localcache-zustand` in `miroir-react` dependencies; one `react` peer range and one `@mui/material` peer range across the set; `zod`, `react`, `react-dom`, `@mui/material`, `@emotion/*` as peers (D10-b).

### 2.2 GREEN

Fix the manifests; teach `scripts/check_dependency_policy.py` the peer rule.

### Validation

```bash
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm install --package-lock-only --ignore-scripts
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

---

## I5 Slice 3 — Named subpaths replace `./src/*`

**Status:** ⬜ pending

**RED:** a `test_package_manifests.py` case fails while `miroir-core` exports `./src/*`. **GREEN:** `./testing` (for `loadApplicationMiroirTestsFromFolders`, 16 imports) and `./generated` (one import); move the imports; either ship `src/` in `files` or drop the declaration maps (D11). `@public` TSDoc on the supported exports (D11-a).

### Validation

```bash
cd packages/miroir-core && npm pack --dry-run --json && cd -
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
```

### Realization

---

## I5 Slice 4 — No `import.meta.env` in published code

**Status:** ⬜ pending

**RED:** `tools.<I5>.phase4.unit.test.ts` sets `MIROIR_IS_SANDBOX` and `MODE` through `vi.stubEnv` and expects `miroir-core/src/tools.ts` (lines 34, 66) to see them. **GREEN:** read `globalThis.process?.env` at call time, the #604 D12 pattern. Then full nonreg, cleanup, AC.

### Validation

```bash
npm run testByFile -w miroir-core -- tools
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

# I6 — Rename to `@miroir-framework/*`

## I6 Slice 0 — Characterize every package-name reference

**Status:** ⬜ pending

`scripts/rename_packages.py --report` counts references per old name: imports (655 files for `miroir-core`, 220 for `miroir-app-miroir`, 155 for `miroir-react`, …, analysis §5), manifests, `build-all.sh`, `ci/release/`, `scripts/nonreg-manifest.json`, eslint rules, docs, logger `packageName` strings. The report is committed in the I6 folder.

### Validation

```bash
python scripts/rename_packages.py --report
```

### Realization

---

## I6 Slice 1 — Rename script, rerunnable on open branches

**Status:** ⬜ pending

**RED:** `scripts/tests/test_rename_packages.py` runs the script on a small fixture tree (manifests, an import, a dynamic `import()`, a `vi.mock` path, a doc link, a logger name) and expects every reference renamed and a second run to change nothing. Pytest: the script is a repo tool. **GREEN:** the script, driven by `scripts/package-rename-map.json`.

### Validation

```bash
python -m pytest scripts/tests/test_rename_packages.py -q
```

### Realization

---

## I6 Slice 2 — Apply the rename

**Status:** ⬜ pending

### Goal

Every package of the published set has its `@miroir-framework/*` name, and the repo builds, lints and passes nonreg under the new names.

### 2.1 RED

The I5 manifest test gains a "published name is `@miroir-framework/…`" rule; it fails.

### 2.2 GREEN

Run the script; regenerate `package-lock.json`; fix what the script cannot (generated files, snapshot paths).

### Validation

```bash
python scripts/rename_packages.py --apply
npm install
./build-all.sh full build
npm run lint
python -m pytest scripts/tests ci/release/tests -q
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## I6 Slice 3 — Meta-model and local cache join core and react (D7, D8)

**Status:** ⬜ pending

**RED:** a `test_tarballs.py` case packs core and expects `./meta-model` and `./admin` in its `exports` and their JSON in the tarball; another expects `@miroir-framework/react` to carry no dependency on the local cache package and `@miroir-framework/server` to expose the Node entry. **GREEN:** core's tsup bundles `miroir-app-miroir` and `miroir-app-admin` (`noExternal`, their `.map` files excluded from the input, the problem `miroir-core/tsup.config.ts` describes); imports move to the subpaths; same for the local cache. Full nonreg, docs (`AGENTS.md` package list and build order), AC.

### Validation

```bash
./build-all.sh full build
python -m pytest ci/release/tests -q
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

# I7 — Template and consumer test

## I7 Slice 1 — The generator writes a runnable project

**Status:** ⬜ pending

**RED:** `packages/create-miroir-app/tests/generate.unit.test.ts` runs the generator into a temporary folder and expects a Vite client calling `startMiroirClient`, a Node server mounting the I3 router, an `environments/local.json` on the filesystem store (analysis §8.4), and a `package.json` depending on the published names at the product version. Vitest: the generator is a Node program. **GREEN:** the package, its templates taken from `miroir-sandbox`.

### Validation

```bash
npm run testByFile -w create-miroir-app -- generate
```

### Realization

---

## I7 Slice 2 — The consumer test builds and starts the generated project from tarballs

**Status:** ⬜ pending

### Goal

Proof that a project outside the workspace installs, builds and runs from the packed tarballs alone.

### 2.1 RED

**Test:** `ci/release/tests/test_consumer_project.py` (marked slow). Pytest: it drives the release pipeline.

Behavior asserted: after `release_version.py --apply` packs the set, the generated project installs from the tarballs only (no registry hit, no workspace link), `vite build` passes, the server starts on the filesystem store, `GET /capabilities` answers and one query returns the seeded data.

### 2.2 GREEN

Extend `tarballs.py` `validate_layer_consumer` with the generated project for the last layer.

### Validation

```bash
python -m pytest ci/release/tests -q -m slow
```

### Realization

---

# I8 — Publish-ready release pipeline

## I8 Slice 1 — Published set selected, consumer check covers it

**Status:** ⬜ pending

**RED:** `test_release_version.py` expects the plan's `distributeable` set to equal the published set of analysis §4.1 and every private package to be bundle-only. Today private packages skip the consumer check and `miroir-core` is private. **GREEN:** `classify_packages` reads the published set; the consumer check runs for every published package.

### Validation

```bash
python -m pytest ci/release/tests -q
```

### Realization

---

## I8 Slice 2 — The handoff lists the manual publish commands; the pipeline never publishes

**Status:** ⬜ pending

**RED:** `test_tarballs.py` expects `release-handoff.json` to list, layer by layer, `npm publish <tarball> --access public --provenance`, and a guard to fail if any pipeline code path runs `npm publish` without `--dry-run`. **GREEN:** the handoff entries, an `npm publish --dry-run` per tarball in validation, and `ci/release/README.md` describing the manual publish (order, `npm login`, provenance from GitHub Actions or not).

### Final checklist (epic)

- Full nonreg on `test-filesystem`.
- Tracer narrative of the epic: release plan → tarballs → generated project runs → the maintainer reads the handoff and publishes by hand.
- AC of #621 mapped: package set (I6), MCP and CLI for deployed applications (I1), shell (I2), server library (I3), startup calls (I4), manifests and guards (I5), template and consumer test (I7), publish-ready pipeline (I8).

### Validation

```bash
python -m pytest ci/release/tests -q
python ci/release/release_version.py --dry-run
npm run nonreg:filesystem -- --runner shared
```

### Realization
