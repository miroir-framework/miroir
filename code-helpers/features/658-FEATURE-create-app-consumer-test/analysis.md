# 658 — `@miroir-framework/create-app` template and an out-of-workspace consumer test

> A new project starts with `npm create @miroir-framework/app <dir>`, and the release pipeline proves, outside the workspace, that the packed tarballs of the published set install, type-check, build and serve such a project. This analysis settles what the template contains, where the generated server gets its Miroir and Admin data, and where and how the consumer test runs.

Related issue: https://github.com/miroir-framework/miroir/issues/658
Parent issue: [#621](https://github.com/miroir-framework/miroir/issues/621) (plan item I7) · Prerequisites: #636 ✅, #639 ✅, #643 ✅, #649 ✅, #650 ✅, #652 ✅
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (W9, open question 4), [`../649-BUILD-core-public-api/analysis.md`](../649-BUILD-core-public-api/analysis.md) (G2: the template guard), [`../652-BUILD-bundle-meta-model-and-local-cache/analysis.md`](../652-BUILD-bundle-meta-model-and-local-cache/analysis.md) (core's subpaths)
Key sources: [`ci/release/release_lib/tarballs.py`](../../../ci/release/release_lib/tarballs.py), [`packages/miroir-env/src/environmentState.ts`](../../../packages/miroir-env/src/environmentState.ts), [`packages/miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts), [`packages/miroir-sandbox/src/index.tsx`](../../../packages/miroir-sandbox/src/index.tsx), [`packages/miroir-standalone-app/vite/environmentConfig.js`](../../../packages/miroir-standalone-app/vite/environmentConfig.js)

**Status:** decisions confirmed (grilling rounds 1 and 2, 2026-11-02, all as recommended). Implementation: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## 1. Goals

- **G1 — Start a project from one command.** To start a Miroir application without copying the monorepo's startup code, as an application developer, I run `npm create @miroir-framework/app my-app`, then `npm install`, `npm run build` and `npm start`, and get the standard Miroir shell served by my own server on the filesystem store.
- **G2 — Know the packed set works outside the workspace.** To publish without discovering a broken tarball from a user's bug report, as the Miroir maintainer, I get a release run that fails when the generated project does not install, type-check, build, start or answer from the packed tarballs.
- **G3 — Keep the template on the supported API.** To keep generated projects working across 0.x releases, as the Miroir maintainer, I am told when the template imports a core export that is not marked `@public` (the #649 guard, moved to the template).

## 2. Non-goals

- Flipping `private` on the published set, making the release plan select the whole set, removing the consumer-check exemption of private packages in `classify_packages`, the manual `npm publish` commands: the release item (#621 I8, its own sub-issue).
- Generator prompts (store choice, JavaScript instead of TypeScript), extra templates: later, unscheduled.
- An example application in the generated project; a user's own application package served by the server: the step after #621.
- A browser render in the consumer test (Playwright): later, if the HTTP checks prove too weak.
- Electron and Docker taking their seed from core's tarball instead of `packages/`: possible after this issue, not done here.
- `import.meta.env` reads in published code (#621 I5 slice 4): still open. The consumer test is where a regression would show; fixing it is not this issue's job unless the test fails on it (§7).
- Running the consumer test on every PR.

## 3. Decision record

| # | Decision | Choice | Serves | Status |
|---|---|---|---|---|
| D1 | Template package name | **`@miroir-framework/create-app`**, so `npm create @miroir-framework/app <dir>`; lockstep version with the set | G1 | Accepted |
| D2 | What the generated project is | **a Vite client on `startMiroirClient` (real server mode) and a Node server on `startMiroirNode` + `createMiroirServerApp`, which also serves the built client** | G1, G2 | Accepted |
| D3 | Default store | **filesystem on the server, state under `<project>/.miroir/`**; Postgres and MongoDB documented as a change of store package and of `store` in the environment | G1 | Accepted |
| D4 | Template content | **startup only**: Miroir and Admin deployments opened at start, `RootComponent` + `PageDispatcher`, logger setup; no demo data, no admin migration, no model diagram, no example application | G1, G3 | Accepted |
| D5 | Where the template lives | **new workspace package `packages/miroir-create-app` with a `template/` folder and a bin that copies it**; `miroir-sandbox` stays the GitHub Pages demo | G1 | Accepted |
| D6 | Generator behaviour | **no prompts**: copy, set the project name, pin every `@miroir-framework/*` dependency to the generator's own version, fail on a non-empty target | G1 | Accepted |
| D7 | When the consumer test runs | **in `release_version.py --apply` after the layer checks, as a standalone command on a tarball folder or on the built workspace, and as a nonreg step of the `full` tier**; not in PR CI, where a fast generator test covers the template | G2 | Accepted |
| D8 | What the smoke check asserts | **install from tarballs, `tsc --noEmit`, `vite build`, server start on a free port on the filesystem store, `GET /` returns the built `index.html`, one REST GET returns the Miroir deployment's Entity list containing `Entity`**; no browser | G2 | Accepted |
| D9 | `private` packages in the consumer test | **installed from their tarballs whatever the flag**; the flag flip belongs to I8 | G2 | Accepted |
| D10 | Seed data of the generated server | **core's tarball ships the Miroir and Admin asset folders the server needs; the project's environment points `packagesDirectory` at them and the existing `copy` mode seeds `.miroir/`** | G1, G2 | Accepted |
| D11 | Server configuration | **`environments/local.json` in the project, read by `@miroir-framework/env` (`MIROIR_ROOT` = project folder)** | G1 | Accepted |

**Rationale.** The test is only as good as what it builds: a client-only project (the sandbox) would never load the server library, the filesystem store or env from a tarball. The generated project therefore runs the same code path as `miroir-server` (environment, seed, `startMiroirNode`, `createMiroirServerApp`), minus the host features (TLS, secrets import, CopilotKit, MCP listener) that a new project does not need on day one.

### D1 — Template package name

| Option | Pros | Cons |
|---|---|---|
| D1-a. `create-miroir-app` (unscoped) | `npm create miroir-app` is shorter | anyone can take the name before the first publish; outside the scope's lockstep rules |
| **D1-b. `@miroir-framework/create-app`** ★ | the scope is owned, so the name is safe; follows #650's rules (manifest guard, `publishConfig.access`) | `npm create @miroir-framework/app` is longer |

An unscoped alias can be published later; it would only forward to D1-b.

### D2 — What the generated project is

| Option | Pros | Cons |
|---|---|---|
| D2-a. Client only (the sandbox's setup: bundled + IndexedDB, emulated server) | no server code in the template | the epic's "start the server on the filesystem store" has nothing to start; server, env and store-filesystem tarballs untested |
| **D2-b. Client and server** ★ | the test loads every package a real deployment needs; the project matches how Miroir is deployed (server serving the client) | the template has a server file to maintain |

### D5 — Where the template lives

| Option | Pros | Cons |
|---|---|---|
| **D5-a. New package `packages/miroir-create-app`** ★ | the demo and the template evolve separately; the sandbox keeps its bundled stores (D3 differs) | two startup examples in the repo |
| D5-b. Turn the sandbox into the template | one example | the GitHub Pages demo needs no server; merging makes both worse |

The template's files under `template/` are not a workspace (`workspaces` is `packages/*`), so their `package.json` is never linked or versioned by Lerna: the generator writes the versions (D6).

### D7 — When the consumer test runs

| Option | Pros | Cons |
|---|---|---|
| **D7-a. Release run + standalone command + `full` nonreg step** ★ | every release proves the tarballs; the maintainer can rerun it on a kept tarball folder; the nonreg `full` tier catches drift between releases | not on PRs |
| D7-b. Also in `pr-checks.yml` | earliest feedback | builds and packs every package, then installs from the registry: many minutes per PR, and network-dependent |

The standalone command has two inputs: `--tarballs <dir>` (a `release-tarballs/` folder from `--apply`) and `--pack` (packs the already built workspace packages, unversioned, for the nonreg step and for local runs).

### D10 — Seed data of the generated server

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. Ship the asset folders in core's tarball** ★ | core's build copies `miroir_model`, `miroir_data` (from `miroir-app-miroir/assets`) and `admin_model`, `admin_data` (from `miroir-app-admin/assets`) to `dist/seed/<package>/assets/`; the environment says `"packagesDirectory": "node_modules/@miroir-framework/core/dist/seed"` | no new seeding code: `seedEnvironmentStateAtStart` already copies `copy` sections; same start as Docker and the desktop app | the data is in the tarball twice (folders and bundled JavaScript) |
| D10-b. Miroir on the bundled store, Admin seeded from `dist/admin.js` | the sandbox's `adminMigration.ts`, on the server | no duplicate data | new seeding code; environments cannot describe a bundled store; Miroir's deployment is read-only |
| D10-c. `miroir-env seed` writes the bundled data out as folders | a new command | no duplicate data in the tarball | new code; the bundled subset is not the full asset folder (212 of 249 Miroir data and model files, §4.3) |

Not shipped: `miroir_modelVersion`, `miroir_devData`, `test-resources` (the generated environment declares neither section; `test-resources` is test-only).

### D11 — Server configuration

| Option | Pros | Cons |
|---|---|---|
| **D11-a. `environments/local.json` + `@miroir-framework/env`** ★ | the documented way to configure a Miroir process (`docs/reference/environments.md`); the same file feeds the server and the Vite client (`environmentRealServerClientConfig`); Postgres is a change of `store` | the project depends on `@miroir-framework/env` (and its `pg`, `mongodb` dependencies) |
| D11-b. A hand-written `MiroirConfigServer` in `server.ts` | fewer moving parts | duplicates what env computes (store directories, seed, Admin rows); the client config has to be written by hand too |

---

## 4. Current state

### 4.1 Release pipeline: pack and install, nothing runs (misaligned with G2)

`ci/release/release_lib/tarballs.py`, `validate_layer_consumer` (lines 135–196): for each layer, writes a `package.json` in a temporary folder with every tarball of P0…Pn as a `file:` dependency, runs `npm install --ignore-scripts`, and checks each distributeable package's installed `version`. It skips a layer with no distributeable package. No code is imported, built or started. `classify_packages` (`plan.py`) treats `private` packages as bundle-only; today core, react, server and the stores are `private: true` (§4.5).

### 4.2 Server startup from an environment (aligned, reused)

`miroir-server/src/server.ts` (625 lines) does, in this order: `resolveEnvironmentFromFiles({ cwd, env })` (line 211), `seedEnvironmentStateAtStart(resolved)` (line 231), `environmentServerConfig(resolved)`, `setProcessTokenSecret` (line 286), `startMiroirNode(miroirConfig, { stores: [filesystem, indexedDb, mongodb, postgres], loggers, externalServiceClient })` (line 333), `openEnvironmentBootDeployments(domainController, resolved, process.env)`, the secrets import, `getProcessCapabilities` (line 522), `createMiroirServerApp({ … })` (line 548), then `listen`. The test platform of the server library (`packages/miroir-server-library/tests/support/serverTestPlatform.ts`) does the same in 60 lines with one store and `bootEnvironment`. The generated server follows the test platform's shape.

`seedEnvironmentState` (`environmentState.ts:47`) copies, for every `copy` filesystem section, `<root>/<applicationAssetsDirectory(…, packagesDirectory)>` to the section's directory under `.miroir/<environment>/`. `applicationAssetsDirectory` (core `1_core/environment/Environment.ts:118`) resolves `<packagesDirectory>/<package>/assets/<key>_<section>`. `environmentRoot` takes `MIROIR_ROOT` when set, else the closest ancestor with `workspaces` (`environmentFiles.ts:83`): a generated project sets `MIROIR_ROOT`.

### 4.3 What core's tarball carries of the meta-model (misaligned with D10)

Core's `files` (`packages/miroir-core/package.json`) ship `dist/meta-model.js` and `dist/admin.js` (#652), each bundling the JSON its private package imports in `index.ts`: Miroir imports 212 `miroir_data` and 41 `miroir_model` files (of 249 JSON files in those two folders) and 78 `miroir_modelVersion` files; Admin imports 24 `admin_data` and 25 `admin_model` files (of 54). No asset folder is shipped. Sizes in the repo: `miroir_data` 5.2 MB, `miroir_model` 508 KB, Admin 324 KB.

### 4.4 Client in real-server mode (aligned, reused)

`miroir-standalone-app/vite/environmentConfig.js`: `webClientEnvironment` calls `environmentRealServerClientConfig(resolved)` and injects it as `__MIROIR_CLIENT_CONFIG__`, read by `src/index.tsx` (line 128). `startMiroirClient` (`miroir-react/src/startMiroirClient.ts:76`) builds the platform, fetches the server's capabilities and returns `{ domainController, miroirContext, processCapabilities, localCacheBinding, emulatedServer? }`. The standalone app passes `stores: [miroirIndexedDbStoreSectionStartup]` even in real-server mode; whether a real-server client needs any store registered is to be checked in the implementation (the template should register none).

### 4.5 Packages the generated project needs

| Package | Folder | `private` today | Runtime `@miroir-framework/*` deps |
|---|---|---|---|
| `@miroir-framework/core` | `miroir-core` | yes | `jzod`, `jzod-ts` (published from the sibling repos) |
| `@miroir-framework/react` | `miroir-react` | yes | core |
| `@miroir-framework/server` | `miroir-server-library` | yes | core, mcp |
| `@miroir-framework/mcp` | `miroir-mcp` | no | core |
| `@miroir-framework/store-filesystem` | `miroir-store-filesystem` | yes | core |
| `@miroir-framework/env` | `miroir-env` | no | core |

`@miroir-framework/server` imports `miroir-ai` dynamically, only when the `ai` capability is on (`mountCopilotKitRoute`); the generated project leaves `ai` off. The template does not import `miroir-diagram-class` or `miroir-localcache-redux` (the sandbox does: `index.tsx:74`, `package.json`).

### 4.6 The template guard (#649)

`scripts/tests/test_core_public_api.py` scans `packages/miroir-sandbox/src` (`SANDBOX_SRC`, line 22; `sandbox_core_imports`, line 213) and fails when it imports a core name without `@public`. D2 of #649 defines "public" as what the template imports plus the startup signatures' types.

### 4.7 Published set registration

`scripts/published-packages.json` lists folder → published name; `scripts/tests/test_package_manifests.py` checks the manifest rules (`files`, `exports`, `sideEffects`, `engines`, `repository`, `license`, `publishConfig.access`) and pack contents of each entry. A new package of the set gets an entry there.

## 5. Key reuse

| Piece | Location |
|---|---|
| Environment resolution, seed, boot | `@miroir-framework/env`: `resolveEnvironmentFromFiles`, `seedEnvironmentStateAtStart`, `environmentServerConfig`, `bootEnvironment` / `openEnvironmentBootDeployments`, `environmentRealServerClientConfig` |
| Node startup | `@miroir-framework/server/startup`: `startMiroirNode` |
| HTTP surface | `@miroir-framework/server`: `createMiroirServerApp` (`clientDirectory` option serves the built client) |
| React startup and shell | `@miroir-framework/react`: `startMiroirClient`, `RootComponent`, `PageDispatcher`, `ErrorPage`, `LocalCacheProvider`, `MiroirContextReactProvider` |
| Vite config of a Miroir client | `packages/miroir-sandbox/vite.config.js` (polyfills, emotion, dedupe), `packages/miroir-standalone-app/vite/environmentConfig.js` |
| Tarball install in a temp folder | `ci/release/release_lib/tarballs.py` (`validate_layer_consumer`), `release_lib/common.py` (`run`, `executable`, `ReleaseError`) |
| Template import guard | `scripts/tests/test_core_public_api.py` |
| Manifest guard | `scripts/tests/test_package_manifests.py`, `scripts/published-packages.json` |
| Smoke URL | `GET /CRUD/10ff36f2-50a3-48d8-b80f-e48e5d13af8e/model/entity/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/all` (Miroir deployment, Entity `Entity`), same route shape as `createMiroirServerApp.integ.test.ts:69` |

## 6. Target design

### 6.1 Generated project

```
my-app/
  package.json            name from <dir>; @miroir-framework/{core,react,server,store-filesystem,env} pinned to the generator's version
  environments/local.json miroir + admin, store filesystem, mode copy, packagesDirectory node_modules/@miroir-framework/core/dist/seed
  tsconfig.json           client (src/client), noEmit
  tsconfig.server.json    server (src/server), emits dist-server/
  vite.config.ts          root src/client, injects __MIROIR_CLIENT_CONFIG__ from environments/local.json
  src/client/index.html, index.tsx    startMiroirClient + RootComponent/PageDispatcher
  src/server/server.ts    env → seed → startMiroirNode → bootEnvironment → createMiroirServerApp({ clientDirectory: dist }) → listen
  .gitignore              node_modules, dist, dist-server, .miroir
  README.md
```

Scripts: `build` = `tsc -p tsconfig.server.json && vite build`, `typecheck` = `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.server.json`, `start` = `node dist-server/server.js`. The server listens on `PORT` when set, else on the port of `server.rootApiUrl`. Authentication is off in `local.json` (a new local project); turning it on is documented.

### 6.2 Generator

`packages/miroir-create-app`: `bin/create-app.js` (plain ESM JavaScript, no build step, so the tarball is the source) and `template/`. It copies `template/` to `<dir>`, renames `_gitignore` to `.gitignore` (npm drops `.gitignore` from tarballs), writes the project name and replaces the `@miroir-framework/*` versions with its own `version`. Exit code 1 with a message on a non-empty target or a missing argument.

### 6.3 Consumer test

`ci/release/release_lib/consumer_project.py`, run by `ci/release/consumer_project.py` and by `release_version.py --apply`:

1. Tarballs: from `--tarballs <dir>` (`manifest.json` of `pack_layer`), or `--pack` (runs `npm pack` on the built workspace packages the project needs).
2. Generate with the generator's tarball (`npx --yes <create-app tarball> <tmp>/app`), outside the repository.
3. Point every `@miroir-framework/*` dependency at its tarball: `dependencies` for the direct ones, `overrides` for the transitive ones (server → mcp).
4. `npm install`, `npm run typecheck`, `npm run build`.
5. `npm start` with `PORT=<free port>`, wait for the port, then `GET /` (status 200, `<div id="root">` in the body) and the smoke URL (§5; status 200, a row with uuid `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`). Stop the server; on failure print its output.

In `--apply`, it runs after the last layer check when the tarball set holds the generator and the five packages of §4.5, and logs a skip otherwise (until I8 selects the whole set).

## 7. Risks

| Risk | Effect | Handling |
|---|---|---|
| `import.meta.env` reads in published code (I5 slice 4 open) | a consumer's Vite build gets other values than the workspace build | the consumer test builds with Vite, as the sandbox does, so it should pass; a failure here is fixed in this issue |
| A dist file names a private package or a workspace path | install or start fails outside the workspace | exactly what the test is for; #652's pack checks already cover the known cases |
| `npm install` needs the registry for third-party dependencies | the test fails offline | documented; the nonreg step is in the `full` tier |
| Two copies of core in the generated project | stores register on another copy | #645's guard warns at start; the test fails on that warning in the server output |
| Duration | a release run takes several minutes more | runs once per release, after the layer checks |

## 8. Document history

- v1 (2026-11-02): decisions D1–D9 from grilling round 1, D10–D11 from round 2, all as recommended.
