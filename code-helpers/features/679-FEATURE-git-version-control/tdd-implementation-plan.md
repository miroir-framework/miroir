# Issue #679 TDD implementation plan

> Vertical TDD slices (RED, then GREEN), integration-first per `docs/contributing/testing.md`.
> Tests run `gitAction_*` through the real `DomainController` (emulated server, filesystem store) against real temporary Git repositories on disk, and the remote slices against an in-process HTTP Git server over a temporary bare repository. No mocks: the only test-only piece is that HTTP server, which plays the remote.
> The tracer bullet (slice 1) proves the thinnest whole path: `features.git` on, one `gitAction_status` dispatched to `DomainController`, the lazy `@miroir-framework/git-isomorphic` package loaded, the changed file of a deployment section reported; `features.git` off, the same action refused.
>
> **Execution model:** human in the loop. No slice contains a commit step; commits happen only when A asks. Each slice ends with its Validation commands; on success its Realization is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/679
Sub-issues: #680 (A, slices 0 to 4), #681 (B, slices 5 and 6), #682 (C, slices 7 to 9), #683 (D, slices 10 and 11).
Working branch: one branch per sub-issue, named `claude/<sub-issue number>-git-<slug>`, from `_integration`.

**Resume note:** sub-issue A (#680, slices 0 to 4) done on `claude/680-git-read-only`; sub-issue B (#681, slices 5 and 6) done on `claude/681-git-commit-checkout`, chained from it; sub-issue C (#682, slices 7 to 9) done on `claude/682-git-fetch-pull-push`, chained from #681. Sub-issue D (#683, slices 10 and 11) done on `claude/683-git-clone`, chained from #682. Every slice is done.

---

## Scope

In:

- G1. History graph and working tree changes, named by Entity and instance (sub-issue A).
- G2. Stage, unstage and commit, after Miroir's own pending edits (sub-issue B, #681).
- G3. Create, delete and check out branches, tags and commits, with the deployment reloaded (sub-issue B, #681).
- G4. Fetch, pull (fast-forward) and push to the upstream, with `git.<host>` credentials (sub-issue C, #682).
- G5. Clone a remote repository and install the deployment it contains (sub-issue D, #683).
- G6. Nothing Git-related loads or runs with `features.git` off (every sub-issue, first proven in slice 1).
- G7. Client chunk on page open, server import on first action (sub-issue A, slices 1 and 3).

Out (analysis section 2): ApplicationVersion-based versioning; merges with conflicts, rebase, stash; SSH remotes; remote management; restoring one instance from an older commit; a file watcher; semantic diffs; Git for non-filesystem stores; per-deployment credential overrides.

---

## Progress summary

| Slice | Sub-issue | Title | Status | Primary proof |
|---|---|---|---|---|
| 0 | A #680 | Characterize capabilities, Miroir Endpoints, bundle policy | ✅ | `gitVersionControl.679.phase0.unit.test.ts` |
| 1 | A #680 | Tracer: `gitAction_status` behind `features.git`, lazy package | ✅ | `gitStatus.679.phase1.integ.test.ts` |
| 2 | A #680 | Log and diff, paths named by Entity and instance | ✅ | `gitHistory.679.phase2.integ.test.ts`, MiroirTest `fn.gitPathToInstance` |
| 3 | A #680 | Git page: lazy route, menu entry, history and changes panels, real-server forwarding | ✅ | component test `ui.gitPage`, bundle policy |
| 4 | A #680 | No repository: `notARepository`, `gitAction_init` | ✅ | `gitInit.679.phase4.integ.test.ts` |
| 5 | B #681 | Stage, unstage, commit; author; open Miroir transaction | ✅ | `gitCommit.679.phase5.integ.test.ts` |
| 6 | B #681 | Branches and checkout, conflict refusal, reload | ✅ | `gitCheckout.679.phase6.integ.test.ts` |
| 7 | C #682 | Test remote, fetch with ahead / behind, SSH refusal | ✅ | `gitFetch.679.phase7.integ.test.ts` |
| 8 | C #682 | Credentials: `git.<host>` secret, 401 path, save from the dialog | ✅ | `gitCredentials.679.phase8.integ.test.ts` |
| 9 | C #682 | Pull (fast-forward) with reload, push with upstream | ✅ | `gitSync.679.phase9.integ.test.ts` |
| 10 | D #683 | Clone, scan deployments, pick, install, open | ⬜ | `gitClone.679.phase10.integ.test.ts`, runner test `runner.gitClone` |
| 11 | D #683 | Nonreg, docs, dependency cleanup, issue-directory cleanup, AC | ⬜ | nonreg step `integ-git-version-control` |

---

## Locked implementation defaults

From the analysis decision record, binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 | repository = `findRoot` of each filesystem section directory; `gitAction_init` when none | G1 |
| D2 | history repo-wide; status and "stage all" limited to the application's section folders (`statusMatrix({ filepaths })`); `includeOtherChanges` flag for the toggle; commit refuses `otherStagedChanges` unless `includeOtherStagedChanges` | G1, G2 |
| D3, D15 | `GitRepositoryInterface` / `GitRepositoryFactory` in `miroir-core/src/0_interfaces/4-services/`; implementation in `packages/miroir-git-isomorphic` (`@miroir-framework/git-isomorphic`), the only importer of `isomorphic-git` | G5, G6 |
| D4 | `ProcessCapabilities.git`, from `features.git === true`; on in `dev.json`, `desktop.json` | G6 |
| D5 | client `React.lazy` route chunk; server, Electron, emulated server register an `import()` loader with `ConfigurationService.registerGitRepositoryFactory` (no startup function in the package); `forbiddenEager` gets both packages | G6, G7 |
| D6 | `GitEndpoint` in `miroir-app-miroir` data, `libraryImplementation` actions; action types in `SERVER_ROUTED_MIROIR_ACTION_TYPES` | G1 to G5 |
| D7 | checkout, pull, branch switch, commit refused with `reason: "openMiroirTransaction"` while a Miroir transaction is open; checked in the client before forwarding | G2, G3 |
| D8 | actions that move files return `touchedDeployments`; the client runs Miroir `rollback` on each | G3, G4 |
| D10 | path to "Entity, instance" mapping in core layer 2 | G1 |
| D11 | checkout of branch, tag, commit; conflict refused with `reason: "checkoutConflict"` | G3 |
| D12 | upstream only; pull = fetch + `fastForward`, `reason: "notFastForward"` on divergence | G4 |
| D13 | `designerTools` needed | all |
| D16 | secret `git.<host>`, value `{ username, token }`; user scope when a principal is logged in | G4, G5 |
| D17 | 401 / 403 returns `ExternalServiceUnauthorized` with `{ reason: "authenticationRequired", host }`; `gitAction_setCredential` saves | G4, G5 |
| D18 | author: `MiroirUser`, else repo config, else asked and saved with `setConfig` | G2 |
| D19, D20 | clone into `<filesystemDeploymentRootDirectory>/<name>`; scan `**/assets/deployment/*.json`; pick when several; install a Deployment row with rewritten directories | G5 |
| D21 | non-HTTP remote refused with `reason: "unsupportedRemoteProtocol"` | G4 |
| D22 | test remote = in-process HTTP Git server (needs the Git binary in the test machine) | G4, G5 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `GitEndpoint` (Endpoint, `miroir-app-miroir` data) | `a7f243cb-9345-425a-918d-4e433a94f4bf` |
| Runner "Clone application from Git" | `02fa934a-fd26-4cce-a9da-0ece94671fc2` |
| MiroirTest suite `fn.gitPathToInstance` | `41375a10-279b-4fa4-9751-a6c58b9d3fb8` |
| MiroirTest suite `ui.gitPage` | `c98e8263-fdc0-453e-b516-9e8ef5021776` |
| MiroirTest suite `runner.gitClone` | `c5dbb8b2-31d7-45cb-a319-3f0cb052311b` |
| Spare (Menu item, if the Git page gets a menu row instead of an AppBar entry) | `4395e1a1-898c-4ef3-b564-18781a5998d5` |
| Action types | `gitAction_status`, `gitAction_log`, `gitAction_diff`, `gitAction_init`, `gitAction_stage`, `gitAction_unstage`, `gitAction_commit`, `gitAction_createBranch`, `gitAction_deleteBranch`, `gitAction_checkout`, `gitAction_fetch`, `gitAction_pull`, `gitAction_push`, `gitAction_setCredential`, `gitAction_clone`, `gitAction_installClonedDeployment` |
| Implementation names | `handleAction_<action type>` |
| Capability | `git` |
| Route | `git` (`PageDispatcher`) |
| Nonreg step | `integ-git-version-control` (scopes `actions`, `external`) |
| Test directory | `packages/miroir-git-isomorphic/tests/issues/679-git-version-control/` and `packages/miroir-standalone-app/tests/4_view/issues/679-git-version-control/` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Git action integ (vitest) | `RUN_TEST=<name> npm run testByFile -w @miroir-framework/git-isomorphic -- <name>` |
| Path naming (MiroirTest unit) | `npm run testMiroir -w @miroir-framework/core -- --suites fn.gitPathToInstance --mode unit` |
| Git page (MiroirTest component) | `npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit` |
| Clone runner (MiroirTest integ) | `npm run testMiroir -w miroir-standalone-app -- --suites runner.gitClone --mode integration` |
| Capability unit tests | `npm run test -w @miroir-framework/core -- processCapabilities` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core` |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Bundle policy | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py` |
| Dependency policy | `python scripts/check_dependency_policy.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

**Why vitest for the Git action tests.** Each test creates a temporary repository on disk (and in slices 7 to 10 starts an HTTP Git server) before the action runs. MiroirTest has no setup step that creates a Git repository or starts a server, so these behaviors are not reachable through MiroirTest. The tests still dispatch real `gitAction_*` actions to a real `DomainController` on the `emulatedServer-filesystem` profile; only the setup is TypeScript. Pure mappings (slice 2) and UI (slice 3) and the clone runner (slice 10) use MiroirTest.

---

## Slice 0. Characterize capabilities, Miroir Endpoints, bundle policy

**Status:** ✅ DONE

### Goal

Lock the contracts later slices extend, so a change to them shows in the diff.

### 0.1 RED, then GREEN

**Test:** `packages/miroir-core/tests/1_core/issues/679-git-version-control/gitVersionControl.679.phase0.unit.test.ts`

Behavior asserted:

- `getProcessCapabilities` with `features: {}` returns exactly the keys `ai, mcp, agentBackend, designerTools, availableStoreTypes, creatableStoreTypes, storeAdministration` (slice 1 adds `git`).
- The Miroir Endpoints wired into `defaultEndpointApplicationMap` (`Deployment.ts:102`) are listed by uuid; `a7f243cb-…` is not among them.
- `SERVER_ROUTED_MIROIR_ACTION_TYPES` equals `["probeExternalService", "setExternalServiceCredential"]`.
- `bundle-policy.json` `forbiddenEager` does not yet contain `isomorphic-git` (slice 1 adds it); `packages/miroir-server/package.json` declares `isomorphic-git` and no file under `packages/*/src` imports it.

### Validation

```bash
npm run test -w @miroir-framework/core -- gitVersionControl.679.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

Not written as its own file. The contracts it was to lock are already locked by existing tests, which this branch updates where `git` changes them: the capability key lists of `cursorSdk.275.phase0` and the snapshots of `processCapabilities.273.phase1` gain `git`, the Endpoint inventory of `ActionImplementations.unit.test.ts` gains `GitEndpoint` (9 Endpoints, 11 entries), and the action palette case of `fn.blockModel` gains its `GitEndpoint` group.

---

## Slice 1. Tracer: `gitAction_status` behind `features.git`, lazy package

**Status:** ✅ DONE

### Goal

With `features.git` on, an application designer (through any action client) gets the changed files of a deployment's sections in their Git repository. With it off, the action is refused and the Git package is never imported.

**Layers cut:** `GitEndpoint` asset, schema rebuild, `ProcessCapabilities`, `GitRepositoryInterface`, `GitActions.ts`, new package `miroir-git-isomorphic`, startup registration in the test setup, `bundle-policy.json`.

### 1.1 RED

**Test:** `packages/miroir-git-isomorphic/tests/issues/679-git-version-control/gitStatus.679.phase1.integ.test.ts`

Setup: copy `miroir-fixture-appForTest` assets to a temp folder, `git init`, commit them, then modify one instance file and add one; open the deployment on the `emulatedServer-filesystem` profile pointing at the temp folder.

Behavior asserted:

- `features.git: true`: `gitAction_status` for the deployment returns `{ root, files: [ { path, head, workdir, stage } ] }` with exactly the modified and the added file, both inside the model section folder.
- `features.git` absent: the same action returns `Action2Error "FeatureUnavailable"` with `errorContext.capability === "git"`, and the package loader registered on `ConfigurationService` was never called (the test registers a counting loader around the real `import()`).
- `features.git: true` and no Git action run: after the full test startup (the same setup the server and Electron use), the counting loader was never called. A source check in the same test asserts that no file under `packages/*/src` outside `miroir-git-isomorphic` imports `@miroir-framework/git-isomorphic` or `isomorphic-git` statically (only `import(...)` expressions are allowed).

### 1.2 GREEN

- `ProcessCapabilities.git`, `ProcessCapabilityName | "git"`, `features.git` in `ProcessCapabilitiesConfig`; the slice 0 test gets the new key.
- `GitRepositoryInterface.ts` with `status` only, plus `GitRepositoryFactory.findRoot` and `open` (analysis section 6).
- `ConfigurationService.registerGitRepositoryFactory(loader: () => Promise<GitRepositoryFactory>)` and `getGitRepositoryFactory()` (memoized `await loader()`).
- `GitEndpoint` (`a7f243cb-…`) with `gitAction_status`; wire it in `getMiroirFundamentalMlSchema.ts` and `defaultEndpointApplicationMap`; schema rebuild.
- `3_controllers/GitActions.ts`: `handleAction_gitAction_status` checks the capability, resolves the deployment's filesystem section directories, calls `findRoot`, `open`, `status(filepaths)`. Register it in `miroirActionImplementations`.
- `packages/miroir-git-isomorphic`: `package.json` (`"type": "module"`, `isomorphic-git` 1.44.3 exact), `src/index.ts` exporting `createGitRepositoryFactory()` only, no startup function (analysis D15); status maps `statusMatrix` rows to `GitFileStatus`.
- Add the package to `build-all.sh` (step 4, with the stores), `scripts/published-packages.json`, `rename_packages.py` data if it lists packages; `forbiddenEager` gets `isomorphic-git` and `@miroir-framework/git-isomorphic`.

### 1.3 Refactor checkpoint

- The section-directory resolution may duplicate code in `PersistenceStoreControllerManager.ts:151`; extract a shared helper if so.
- Slice 0's list assertions updated in place, not duplicated.

### Validation

**Nonreg scopes:** `smoke,core,actions,external`: core schemas and assets (`core`), a new controller and service (`actions`), process capabilities (`external`).

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run build -w @miroir-framework/git-isomorphic
RUN_TEST=gitStatus.679.phase1 npm run testByFile -w @miroir-framework/git-isomorphic -- gitStatus.679.phase1
npm run test -w @miroir-framework/core -- ''
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-git-isomorphic/tsconfig.json
python scripts/check_dependency_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,external
```

### Realization

- Port `0_interfaces/4-services/GitRepositoryInterface.ts` (repository and factory, with path helpers `resolvePath`, `relativePath`, `commonDirectory` so core never imports `node:path`), action types `0_interfaces/3_controllers/GitAction.ts` (hand-written TS types like the other library-implemented actions; only `features.git` went into the fundamental schema), implementations `3_controllers/GitActions.ts`, naming `2_domain/GitPathNaming.ts`.
- `GitFileStatus` is `{ path, change: added | modified | deleted, staged, unstaged }`, mapped from isomorphic-git's status matrix in `statusFromMatrixRow`.
- `DomainController.handleGitAction`: a remote DomainController forwards (the client config has no `features`), the local one checks `git` and `designerTools`, then runs with the factory from `ConfigurationService.getGitRepositoryFactory()` (a loader memoized on first call, reset after a failed import).
- The section folders come from the store manager: `PersistenceStoreControllerManager` now keeps each deployment's configuration (`getPersistenceStoreConfiguration`), and the local caches expose the manager in local mode (`getLocalPersistenceStoreControllerManager`).
- `@miroir-framework/git-isomorphic` is `private: true` for now (hosts install it from the workspace); `miroir-server` and the Electron main process depend on it and import it dynamically, ncc keeps it external.
- Tests live in `packages/miroir-standalone-app/tests/3_controllers/issues/679-git-version-control/` (the in-process server harness is there), with a shared `gitTestSetup.ts`. The Library copy in `.miroir/test-filesystem/library` is made a nested repository with isomorphic-git.
- An enclosing repository that ignores every section folder (the monorepo ignores `.miroir/`) counts as no repository: `notARepository` carries `enclosingRoot`, and `gitAction_init` creates a nested repository. Found by the slice 4 test, which first met the monorepo's own `.git`.

---

## Slice 2. Log and diff, paths named by Entity and instance

**Status:** ✅ DONE

### Goal

The designer gets the commit history with refs, the files of one commit, and the before / after text of one file, and every path inside a section is named by its Entity and instance.

**Layers cut:** `GitEndpoint` (`gitAction_log`, `gitAction_diff`), interface (`log`, `diff`, `commitFiles`), adapter, `2_domain/gitPathNaming.ts`, `gitAction_status` result enriched.

### 2.1 RED

**Tests:**

- MiroirTest `fn.gitPathToInstance` (`functionCallTest`, `41375a10-…`, in `miroir-app-miroir`): given the real Library model and the section directories of the Library Deployment row, `library_model/16dbfe28-…/<Book entity uuid>.json` maps to `{ entityName: "Entity", instanceName: "Book" }`, a data path maps to the Book instance's name, a path outside the sections maps to `undefined`.
- `gitHistory.679.phase2.integ.test.ts`: after two commits and one branch, `gitAction_log` returns both commits newest first with `refs` containing the branch and `HEAD`; `gitAction_diff` of a modified file returns `before` (HEAD) and `after` (workdir) text.

### 2.2 GREEN

- `log` with `depth` (default 200), `refs` from `listBranches` and `listTags` resolved to oids.
- `diff` via `readBlob` at the ref and `fs.readFile` for the workdir.
- `gitPathToInstance(path, sections, modelEnvironment)` in core layer 2; status and log file lists carry `{ entityName?, instanceName? }`.

### 2.3 Refactor checkpoint

- If the path parsing repeats `FileSystemInstanceStoreSectionMixin` path building, share one helper.

### Validation

**Nonreg scopes:** `smoke,core,actions`.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run testMiroir -w @miroir-framework/core -- --suites fn.gitPathToInstance --mode unit
RUN_TEST=gitHistory.679.phase2 npm run testByFile -w @miroir-framework/git-isomorphic -- gitHistory.679.phase2
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization

- `gitAction_commitFiles` added (the files a commit changed against its first parent), so the history panel can list a commit's files.
- `log` returns `[]` and `branches.head` is undefined in a repository with no commit; refs include remote branches and annotated tags (peeled).
- MiroirTest `fn.gitPathToInstance` (16 cases, both exports) and `fn.gitLineDiff` (spare uuid `4395e1a1-…`, 8 cases) for `2_domain/GitLineDiff.ts`, the line diff of the page.

---

## Slice 3. Git page: lazy route, menu entry, panels, real-server forwarding

**Status:** ✅ DONE

### Goal

With `git` on, the designer opens a Git page for an application and sees the history and the changes. With `git` off, there is no entry and no route, and the page chunk is not on the eager bundle.

**Layers cut:** `SERVER_ROUTED_MIROIR_ACTION_TYPES`, `PageDispatcher` route, AppBar or application menu entry gated by `processCapabilities.git`, `GitPage` with `GitHistoryPanel` and `GitChangesPanel` (read only in this slice), `bundle-policy.json`.

### 3.1 RED

**Tests:**

- MiroirTest `ui.gitPage` (`reactComponentTest`, `c98e8263-…`): with `processCapabilities.git = true` and a status result fixture from slice 1, the page lists the two changed files with their Entity and instance names, and the history panel lists the commits; with `git = false` the menu entry is absent.
- `realServer` forwarding: `gitStatus.679.phase1` runs again with `client.mode = realServer` (`--profile realServer-filesystem`) and gets the same result through `forwardServerRoutedAction`.
- Bundle policy: `check_bundle_policy.py` passes with `isomorphic-git` and `@miroir-framework/git-isomorphic` forbidden eager, and the eager gzip stays within tolerance.

### 3.2 GREEN

- Add every `gitAction_*` type to `SERVER_ROUTED_MIROIR_ACTION_TYPES`; each handler starts with the `forwardServerRoutedAction` guard.
- `GitPage` in `miroir-react/src/routes/GitPage.tsx`, `React.lazy` in `PageDispatcher`; data through a hook that dispatches the actions (no publish-subscribe, no new `useEffect` without asking A).
- `miroir-server` and Electron main register the loader `() => import("@miroir-framework/git-isomorphic").then((m) => m.createGitRepositoryFactory())` when `features.git` is on; neither imports the package statically.

### 3.3 Refactor checkpoint

- Reuse the existing list and diff display components if any match (`json-diff` is already lazy).

### Validation

**Nonreg scopes:** `smoke,ui,actions,external,tooling` (Electron startup).

```bash
npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
RUN_TEST=gitStatus.679.phase1 npm run testByFile -w @miroir-framework/git-isomorphic -- gitStatus.679.phase1 --profile realServer-filesystem
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

Full nonreg here: slices 1 to 3 change core, server and UI.

### Realization

- `GitPage` (`?page=git[&application=X]`, application selector as on the model page) is lazy in `PageDispatcher` and routed only with `processCapabilities.git`; the AppBar entry shows for designers with `git` on. The body is `GitPageView` (changes, history, commit files, diff), exported lazily as `LazyGitPageView`.
- Data without `useEffect`: `useGitRequest` builds a store per request that runs the action on first subscription (`useSyncExternalStore`), as `useYamlParserStatus` does; a generation number re-runs the requests after Refresh or init.
- MiroirTest `ui.gitPage` (6 cases) renders the real view on fixture results through `GitPageForTest` in miroir-react-testing; the component test counts move to 14 instances and 212 leaves.
- Real-server path: instead of a live-server profile, the server library's in-process HTTP test (`createMiroirServerApp.integ.test.ts`) posts `gitAction_*` to `/action/<type>` and checks the refusal reason, init, status and the capability gate. `RestServer` keeps its model environments after these read-only actions (`GIT_ACTIONS_KEEPING_FILES`).
- `bundle-policy.json` forbids `isomorphic-git` and `@miroir-framework/git-isomorphic` on the eager bundle. `features.git: true` in `dev.json` and `desktop.json`.
- Nonreg step `integ-git-version-control` added now (planned for slice 11), since the tests need the package built first.

---

## Slice 4. No repository: `notARepository`, `gitAction_init`

**Status:** ✅ DONE

### Goal

For a deployment outside any repository, the designer is told so and can create one in the section root.

### 4.1 RED

**Test:** `gitInit.679.phase4.integ.test.ts`

- `gitAction_status` on a deployment in a temp folder with no `.git` returns `Action2Error` with `reason: "notARepository"` and the candidate `directory` (the deepest folder that contains every section).
- `gitAction_init` on that directory, then `gitAction_status`, lists every section file as untracked.
- `gitAction_init` on a directory outside `filesystemDeploymentRootDirectory` is refused.

### 4.2 GREEN

- `findRoot` miss mapped to `notARepository`; `init` in the adapter; page shows "Not in a Git repository" with an "Initialize" button.

### 4.3 Refactor checkpoint

- One path guard ("inside the deployment root") shared with slice 10.

### Validation

**Nonreg scopes:** `smoke,actions,ui`.

```bash
RUN_TEST=gitInit.679.phase4 npm run testByFile -w @miroir-framework/git-isomorphic -- gitInit.679.phase4
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,ui
```

### Realization

Covered by `gitHistory.679.phase2.integ.test.ts` (no separate `gitInit` file): `notARepository` with the folder to initialize, `unknownDeployment`, init then status listing every section file as added with an empty log, and a second init keeping the existing repository. The page's "Create a Git repository" button is in `ui.gitPage`.


**Adversarial review of sub-issue A, and what changed:**

- `gitAction_diff` read any file of the host through `path` (`../../etc/hostname`, `.git/config`). Now `isApplicationRepositoryPath` admits only repository-relative paths inside the section folders, never `..`, absolute, backslash or `.git` paths (`pathOutsideApplication`), and the adapter reads a work-tree file only after `realpath` shows it inside the work tree.
- D13 was not enforced per user: with authentication on, anyone with a grant on an application (Miroir and Admin are always allowed) could run Git actions. `authorizeDesignerOnlyAction` (`AccessGate.ts`) now requires an Admin grant, at the REST server, in `RestClientStub` (Electron, tests) and for MCP calls in `executeEndpointAction`.
- `gitAction_init` could create a repository at the deployment root, holding Admin and every other application. It now refuses the deployment root (`outsideDeploymentRoot`) and a folder that holds another open deployment's sections (`sharedFolder`).
- An unknown `from` / `to` revision showed the file as wholly added; it is now a `gitFailure`. A full-length oid must name a commit of the repository.
- `commitFiles` listed a file replaced by a folder (or the reverse) on one side only; both sides now.
- `relativePath` treated a folder named `..x` as outside the root.
- The package's `dist/` was tracked; it is ignored like the other packages'.
- Kept as is: results and errors carry absolute server paths and isomorphic-git's messages (only designers see them now); a change limited to the final newline shows as "No difference".
---

## Slice 5. Stage, unstage, commit; author; open Miroir transaction

**Status:** ✅ DONE

### Goal

The designer stages, unstages and commits the application's changes, with a known author, and cannot commit while Miroir edits are not yet on disk.

### 5.1 RED

**Test:** `gitCommit.679.phase5.integ.test.ts`

- `gitAction_stage` with `all: true` stages only files under the section folders, leaving a modified file elsewhere in the repo unstaged (D2).
- A file outside the section folders already staged (by `git.add` in the test setup, as a terminal would): `gitAction_commit` returns `reason: "otherStagedChanges"` with that path and writes no commit; with `includeOtherStagedChanges: true` it commits both (analysis D2, files staged elsewhere).
- `gitAction_unstage` returns a file to unstaged.
- `gitAction_commit` with a logged-in principal writes a commit authored by the `MiroirUser` name and email; with no principal and `user.name` / `user.email` in `.git/config`, by those; with neither, returns `reason: "authorUnknown"`; with `author` and `rememberAuthor: true` in the payload, commits and writes the config.
- With a Miroir transaction open (a `createInstance` in the local cache not yet committed), `gitAction_commit` returns `reason: "openMiroirTransaction"`; after the Miroir `commit` action, it succeeds and the new instance file is in the commit.
- The same open-transaction case on `--profile realServer-filesystem`: the refusal comes from the client before any request reaches the server (the server's action log has no `gitAction_commit`), and the pending instance is still in the client's local cache.

### 5.2 GREEN

- Interface `stage`, `unstage`, `commit`, `getConfig`, `setConfig`; adapter on `add` / `remove` (deleted files) / `resetIndex` / `commit`.
- Open transaction check through the local cache's pending patches (the same state `rollback` drops), run in the client's `DomainController` before the `forwardServerRoutedAction` guard (analysis D7, where the check runs).
- Commit compares the staged paths with the application's folders and refuses on `otherStagedChanges` unless the payload says to include them.
- Changes panel gets checkboxes, "Stage all", message field, author fields shown only when needed, and "Commit Miroir changes first" on the refusal.

### 5.3 Refactor checkpoint

- One "open transaction" predicate used by slices 5, 6 and 9.

### Validation

**Nonreg scopes:** `smoke,actions,localcache,ui`.

```bash
RUN_TEST=gitCommit.679.phase5 npm run testByFile -w @miroir-framework/git-isomorphic -- gitCommit.679.phase5
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,localcache,ui
```

### Realization

`gitCommit.679.phase5.integ.test.ts` (in miroir-standalone-app, next to the slice 1 and 2 files, 17 tests):

- The port gains `stagedPaths` (HEAD against the index, no work tree read), `stage`, `unstage`, `commit`, `getConfig`, `setConfig`.
- Stage and unstage take named paths, each a changed file of the sections (a folder or an unchanged file is `invalidPayload`), or `all`. Both return the new status.
- Commit refuses an empty message (`invalidPayload`), an empty index (`nothingStaged`), files staged outside the sections (`otherStagedChanges`, unless `includeOtherStagedChanges`), and a missing author (`authorUnknown`).
- The author is the payload's, else the logged-in user's username (MiroirUser has no email attribute, so the email is empty), else `user.name` / `user.email` of `.git/config`. isomorphic-git does not read `~/.gitconfig`.
- D7 lives in `openMiroirTransactionError` (`GitActions.ts`), called first in `DomainController.handleGitAction`, before the forward. A commit looks at the pending changes of its application, a checkout at every pending change.
- The test proves the refusal is the client's: Git is off on the server during that call, so a forwarded action would have come back `FeatureUnavailable`.
- The realServer-filesystem variant was not added: the check runs in the same client DomainController before the same forward.
- Racy Git: isomorphic-git compares whole-second modification times and sizes with the index. An edit of the same size in the second its file was staged looks unchanged, so `editUbik` in the test setup moves the file's time on. A person at the page does not hit this.
- UI: a checkbox per changed file of the application, "Stage all", the commit form with author fields shown on `authorUnknown` ("Remember for this repository" off by default), "Commit them too" on `otherStagedChanges`, and the D7 message. Fixture-driven cases are in `ui.gitPage`.

---

## Slice 6. Branches and checkout, conflict refusal, reload

**Status:** ✅ DONE

### Goal

The designer creates, deletes and checks out branches, tags and commits, and Miroir shows the application as it is at the checked-out point.

### 6.1 RED

**Test:** `gitCheckout.679.phase6.integ.test.ts`

- `gitAction_createBranch` then `gitAction_checkout` of it: `gitAction_status` shows the new current branch.
- On the branch, commit a new instance; checkout `main`; the result lists the deployment in `touchedDeployments`; after the client's `rollback` on it, a `getInstances` on the Entity no longer returns the instance (read through the real local cache).
- Checkout of a commit oid: `branches().current` is `undefined` (detached).
- Checkout with an uncommitted change to a file the target changes returns `reason: "checkoutConflict"` and the file is unchanged on disk.
- Checkout with an open Miroir transaction returns `reason: "openMiroirTransaction"`, also on `--profile realServer-filesystem`, where the files on the server stay unchanged and the pending edit stays in the client's local cache.
- `gitAction_deleteBranch` of the current branch is refused; of another branch, succeeds.

### 6.2 GREEN

- Adapter `branches`, `createBranch`, `deleteBranch`, `checkout` (no `force`); `CheckoutConflictError` mapped to `checkoutConflict`.
- `touchedDeployments`: every deployment of the `applicationDeploymentMap` whose sections are under the repository root.
- UI: branch list with create, delete, checkout; detached HEAD banner with "back to <branch>"; after the action, `rollback` on each touched deployment.

### 6.3 Refactor checkpoint

- The reload loop lives in one hook, reused by pull in slice 9.

### Validation

**Nonreg scopes:** `smoke,actions,localcache,ui`.

```bash
RUN_TEST=gitCheckout.679.phase6 npm run testByFile -w @miroir-framework/git-isomorphic -- gitCheckout.679.phase6
npm run nonreg:filesystem -- --runner shared
```

Full nonreg: end of sub-issue B.

### Realization

`gitCheckout.679.phase6.integ.test.ts` (12 tests):

- The port gains `createBranch`, `deleteBranch`, `branchIsMergedIntoHead` and `checkout`.
- Checkout outcomes:
  - A local branch is checked out as such.
  - A tag, a remote branch or a commit is checked out as a detached HEAD.
  - A name only `origin` has becomes a tracking branch, after a dry run on its commit.
  - Uncommitted changes the checkout would overwrite are `checkoutConflict`, and so is any staged change, since isomorphic-git compares the target with the index only.
  - An unknown name or oid is `unknownRevision`.
- Branch creation and deletion:
  - Creating an existing branch is `branchExists`, a bad name `invalidPayload`.
  - The current branch cannot be deleted (`currentBranch`).
  - A branch whose commits HEAD does not have is deleted only with `force` (`branchNotMerged`), because isomorphic-git keeps no reflog.
- `touchedDeployments`: the deployments of the action's map with a section folder (Admin's included) in the repository.
- Refactor checkpoint: the reload is not a UI hook. `DomainController.reloadTouchedDeployments` runs a `rollback` of each touched application after the action, in the server's local cache and again in the client's after the forward. Every client gets it (the page, MCP, tests), and pull (slice 9) reuses it by returning `touchedDeployments`. A reload that fails is listed in `reloadFailures`, and the page shows it.
- UI: a Branches panel (check out, delete, create; "Delete … anyway" on `branchNotMerged`), "Check out this commit" in the commit files panel, and a detached HEAD banner with "Back to <branch>" (the branch left, else `main`). Checkout controls wait for the status.

**Adversarial review of sub-issue B, and what changed:**

- A checkout overwrote staged changes and deleted staged new files with no conflict (isomorphic-git's `analyze` compares the target with the index). It is now refused while anything is staged.
- `unstage` of a folder wrote the folder's tree as one blob in the index, and the next commit recorded it. Stage and unstage now accept only changed files.
- `stage` followed a symbolic link out of the work tree and committed the outside file. The adapter now stages only files whose real path is in the work tree.
- An unmerged branch could be deleted with one click, losing its commits. It now needs `force`, which the page asks for.
- A reload that failed after a checkout still reported plain success. It is now in `reloadFailures`.
- "Remember author" was on by default and wrote `user.name` / `user.email` into the repository. It is now off by default.
- A checkout of a remote-only name created the local branch even when the checkout was then refused. There is now a dry run first.
- "Back to" could name the wrong branch when a checkout started while the status reloaded. Checkout controls now wait for the status.
- Kept as known limits:
  - D7 sees only the pending changes of the DomainController that runs or forwards the action. A checkout from MCP or from another browser does not see a third client's unsaved edits.
  - A Miroir edit made in another view while a checkout is running is dropped by the reload's `rollback`.

---

## Slice 7. Test remote, fetch with ahead / behind, SSH refusal

**Status:** ✅ DONE (sub-issue C, #682)

### Goal

The designer fetches from the upstream and sees how many commits the branch is ahead and behind; an SSH remote is refused with a clear message.

### 7.1 RED

**Test:** `gitFetch.679.phase7.integ.test.ts`

- A test helper starts an HTTP Git server on a free port over a temp bare repository (D22). A second clone pushes one commit to it. `gitAction_fetch` in the deployment's repository returns `{ ahead: 0, behind: 1 }`.
- With `origin` set to `git@github.com:owner/repo.git`, `gitAction_fetch` returns `reason: "unsupportedRemoteProtocol"`; `gitAction_status` still works.

### 7.2 GREEN

- `packages/miroir-git-isomorphic/tests/helpers/httpGitServer.ts` (dev dependency, exact version, classified as dev per `check_dependency_policy.py`); a `beforeAll` skip with a clear message when `git` is not on the PATH.
- Adapter `fetch` with `isomorphic-git/http/node`; ahead / behind from `log` walks to the merge base (`findMergeBase`).
- History panel: "Fetch" button, ahead / behind badges.

### 7.3 Refactor checkpoint

- Remote URL protocol check in one function, used by fetch, pull, push and clone.

### Validation

**Nonreg scopes:** `smoke,actions,external`.

```bash
RUN_TEST=gitFetch.679.phase7 npm run testByFile -w @miroir-framework/git-isomorphic -- gitFetch.679.phase7
python scripts/check_dependency_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```

### Realization

`gitFetch.679.phase7.integ.test.ts` (7 tests):

- Test remote (D22): `tests/3_controllers/issues/679-git-version-control/gitHttpServer.ts`, next to the other Git tests of the standalone app rather than in `miroir-git-isomorphic` (the actions run through the real DomainController there). It is `git http-backend` behind Node's `http` server on a free port, so no new dependency; `commitOnRemote` plays the other machine with the `git` program, through the bare repository's folder. The tests skip with a message when `git` is not on the PATH.
- The port gains `remoteUrl`, `setRemote`, `fetch`, `upstream`, `aheadBehind`, `fastForward` and `push`. Remote options carry an `onAuth` callback only (D16).
- `aheadBehind` walks both histories newest commit first, marking each commit with the sides it is reached from, and stops when every commit left is reached from both (what `git rev-list --left-right --count` does), so the shared history is not walked.
- `gitAction_setRemote` (new, not in the allocated list): sets `origin`, refusing a non-`http(s)` URL (`unsupportedRemoteProtocol`) and a URL holding a username or token (`invalidPayload`: `.git/config` is a plain file).
- `gitAction_fetch` returns `{ branches, remote, url, tracking }`; `gitAction_status` also returns `tracking` and `remoteUrl`. A missing remote is `noRemote`; a remote that cannot be reached (connection refused, 404) is `remoteUnreachable`.
- Refactor checkpoint: `checkRemoteUrl` in `GitActions.ts` is the one protocol check (setRemote, fetch, pull, push; clone in slice 10).

---

## Slice 8. Credentials: `git.<host>` secret, 401 path, save from the dialog

**Status:** ✅ DONE (sub-issue C, #682)

### Goal

The designer fetches from a remote that needs authentication, enters a username and token once, saves them as an Admin secret, and later fetches without being asked.

### 8.1 RED

**Test:** `gitCredentials.679.phase8.integ.test.ts`

- The test server requires basic auth. `gitAction_fetch` without a secret returns `ExternalServiceUnauthorized` with `{ reason: "authenticationRequired", host: "127.0.0.1:<port>" }`.
- `gitAction_fetch` with `credential: { username, token }` in the payload succeeds and stores nothing.
- `gitAction_setCredential` for that host (wrapping key set) writes a `MiroirSecret` row named `git.127.0.0.1:<port>`, process-scoped with no principal, user-scoped with one; the next `gitAction_fetch` without a payload credential succeeds.
- Without a wrapping key, `gitAction_setCredential` is refused (same message as `setExternalServiceCredential`).
- The row's `ciphertext` never appears in any action result.

### 8.2 GREEN

- `onAuth` built in `GitActions.ts` from the payload credential, else `resolveSecret("git.<host>", principal)`; the adapter only receives the callback (D16).
- `gitAction_setCredential` reuses `persistSecretRow` and `getSecretsMasterKey`.
- Credential dialog in the Git page, opened on `authenticationRequired`, retries the action.

### 8.3 Refactor checkpoint

- If `handleSetExternalServiceCredential` and `gitAction_setCredential` share the "wrapping key then persist" steps, extract them.

### Validation

**Nonreg scopes:** `smoke,actions,external,ui`.

```bash
RUN_TEST=gitCredentials.679.phase8 npm run testByFile -w @miroir-framework/git-isomorphic -- gitCredentials.679.phase8
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external,ui
```

### Realization

`gitCredentials.679.phase8.integ.test.ts` (8 tests):

- The test server answers 401 to any request without the expected basic credentials.
- The adapter turns isomorphic-git's `onAuth` / `onAuthFailure` into one attempt: no credential, or a refused one, stops the operation (`UserCanceledError`), so a fixed token is never retried in a loop. `UserCanceledError` and HTTP 401 / 403 map to `authenticationRequired`.
- `GitActions` returns `ExternalServiceUnauthorized` with `{ reason: "authenticationRequired", host, remote }` (D17). The credential comes from the payload (used for that action, stored nowhere), else from the `git.<host>` secret, where `host` is the remote URL's host and port.
- The actions get a `GitCredentialStore` (`resolve`, `canSave`, `save`) from `DomainController.gitCredentialStore`, which wraps `resolveSecret`, `getSecretsMasterKey` and `persistSecretRow`: core's action code holds no secret store, the adapter sees only `onAuth`.
- `gitAction_setCredential` opens no repository. It refuses a host that is not `name[:port]` (`invalidPayload`) and, without a wrapping key, answers `secretsUnavailable` with the message of `setExternalServiceCredential`. It returns `{ name, scope }`; the test checks that no result holds the token or a row's ciphertext.
- Refactor checkpoint: `handleSetExternalServiceCredential` probes then persists, `gitAction_setCredential` only persists (the retried action was the probe), so the shared part is `persistSecretRow` itself; nothing to extract.
- UI: on `authenticationRequired` the Remote panel shows a username and token form, retries the action with the typed credential, then saves it with `gitAction_setCredential` unless "Save it" is unchecked. A token that works but cannot be saved is said so.

---

## Slice 9. Pull (fast-forward) with reload, push with upstream

**Status:** ✅ DONE (sub-issue C, #682)

### Goal

The designer pulls new commits from the upstream and sees them in Miroir, and pushes local commits, including a new branch.

### 9.1 RED

**Test:** `gitSync.679.phase9.integ.test.ts`

- Remote has one more commit adding an instance: `gitAction_pull` returns `touchedDeployments`; after `rollback`, the instance is in the local cache.
- Local and remote diverged: `gitAction_pull` returns `reason: "notFastForward"` and HEAD is unchanged.
- Open Miroir transaction: `gitAction_pull` returns `reason: "openMiroirTransaction"`.
- `gitAction_push` of `main` with one local commit: the bare repository's `main` points to it.
- `gitAction_push` of a new branch with no upstream: the branch exists on the remote and `branch.<name>.remote` is `origin` in `.git/config`.

### 9.2 GREEN

- Adapter `pull` as `fetch` + `fastForward` (refuse when not a descendant, `isDescendent`), `push` with `setConfig` for the upstream.
- Pull and Push buttons, using the slice 6 reload hook.

### 9.3 Refactor checkpoint

- Remove anything slice 7 duplicated for the pull's fetch step.

### Validation

**Nonreg scopes:** `smoke,actions,external,localcache,ui`.

```bash
RUN_TEST=gitSync.679.phase9 npm run testByFile -w @miroir-framework/git-isomorphic -- gitSync.679.phase9
npm run nonreg:filesystem -- --runner shared
```

Full nonreg: end of sub-issue C.

### Realization

`gitSync.679.phase9.integ.test.ts` (10 tests):

- `gitAction_pull`: refused on a detached HEAD (`detachedHead`, a new reason), a branch without upstream (`noUpstream`), staged changes (`checkoutConflict`, as for a checkout) and unsaved Miroir changes (`openMiroirTransaction`). Then fetch, and `fastForward`: equal or ahead is `upToDate`; diverged is `notFastForward`; otherwise a dry-run checkout on the upstream commit, which returns the conflicting paths without changing anything, then the branch ref moves and is checked out. The result has `touchedDeployments` unless up to date, and `DomainController.reloadTouchedDeployments` (slice 6) reloads them.
- `gitAction_push`: pushes the current branch to its upstream, else to the branch of the same name on `origin`, then writes `branch.<name>.remote` / `.merge`. A remote with commits the branch lacks is `pushRejected`.
- UI: the Remote panel (URL, "n to push / n to pull", Fetch, Pull, Push, the URL field, the token form). The text of the credential result is kept by the page, since a successful action refreshes the status and remounts the panel. The Electron bundle policy lists `simple-get` and its dependencies as lazy (they come with `isomorphic-git/http/node`).
- MiroirTest `ui.gitPage`: 7 more cases (21 with the #681 review case); component test leaves 227.

**Adversarial review of sub-issue C, and what changed:**

- A token written in an existing remote URL (`https://user:token@host/...`, set outside Miroir) came back in every status and remote result and was shown on the page. Results now give the URL without its username and token (`displayedRemoteUrl`); the fetch still uses them.
- Ahead / behind was wrong when shared commits had the timestamp of a side's commit, or the clocks differed (`{1, 11}` for `{1, 1}`). After the walk, the shared mark now goes down to every walked ancestor.
- The credential could reach another host than the one checked: isomorphic-git pushes to `remote.<name>.pushurl` and goes through `http.corsProxy` when the configuration has them. Fetch and push now pass the checked URL and no proxy.
- A pull that failed after the branch moved left the branch on the new commit and the files on the old one. The files and index are now checked out first (`noUpdateHead`), then the branch moves.
- A push the remote itself refused (a hook, a protected branch) read "pull first". It is now `pushRefused` with the remote's message; TLS and more network errors are `remoteUnreachable`.
- A credential saved for `GitHub.com` or `github.com:443` was never found. The secret is now named after the host as a URL gives it.
- The credential form stayed open, every button disabled, when the retried action failed for another reason. It now closes; the token is saved only after a success.
- After a pull, the touched stores read their model's Entities again, as after a checkout (#681 review).
- Kept, as D16 says: a logged-in user with no `git.<host>` secret of their own uses the process one. With authentication on, every Git action has a principal, so `gitAction_setCredential` always saves a user secret; a process secret is saved only with authentication off.

---

## Slice 10. Clone, scan deployments, pick, install, open

**Status:** ✅ done (sub-issue D, #683)

### Goal

A designer without Git installed clones a repository from the UI and opens the application it contains.

### 10.1 RED

**Tests:**

- `gitClone.679.phase10.integ.test.ts`: the test server serves a bare repo built from `miroir-fixture-appForTest` (one deployment). `gitAction_clone` with `{ url, folderName }` clones into `<root>/<folderName>` and returns `{ deployments: [ { deploymentUuid, selfApplication, name } ] }`. `gitAction_installClonedDeployment` writes a Deployment row in Admin whose section directories point inside the clone; opening it and running `getInstances` returns the fixture's instances.
- A repo with two deployments returns both; installing the second works the same way.
- A repo with none returns `reason: "noDeploymentFound"` and the folder is kept.
- `folderName` of `../outside` is refused (`reason: "outsideDeploymentRoot"`); an existing non-empty folder is refused.
- MiroirTest `runner.gitClone` (`c5dbb8b2-…`, `runnerTest`, integration): the Runner (`02fa934a-…`) form with URL and folder name runs clone, then install when one deployment is found.

### 10.2 GREEN

- Adapter `clone` (`singleBranch: false`, `depth` unset); scan in core layer 2 over the cloned tree (`deployment/*.json` with `parentUuid` `7959d814-400c-4e80-988f-a00fe582ab98`, its `selfApplication` row under a sibling `*_model/a659d350-dd97-4da9-91de-524fa01745dc/`).
- Install reuses the existing Deployment creation path used by `Runner_InstallApplication` (rewritten `directory` values relative to `filesystemDeploymentRootDirectory`).
- Runner "Clone application from Git" on the Runners page, with a picker when several deployments are found; credential dialog from slice 8 on `authenticationRequired`.

### 10.3 Refactor checkpoint

- The path guard from slice 4; the protocol check from slice 7.

### Validation

**Nonreg scopes:** `smoke,actions,runners,external,ui`.

```bash
npm run build -w miroir-app-miroir
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitClone
npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,runners,external,ui
```

### Realization

- Port: `GitRepositoryFactory.clone` (`singleBranch: false`, every tag), `directoryState`, `removeDirectory`; `GitRepositoryInterface.listFiles` (the files of HEAD). New reasons `invalidFolderName`, `folderNotEmpty`, `noDeploymentFound`, `unknownClonedDeployment`, `severalDeploymentsFound`, `applicationAlreadyDeployed`.
- Scan: `findClonedDeployments` in `2_domain/GitClonedDeployments.ts`, over the files of HEAD. A section directory written for the machine the repository came from (`<package>/assets/...`, `../<package>/...`) is looked up in the repository three ways: inside the package folder of the Deployment row, under the folder above it (a monorepo's `packages/`), or as is. Git keeps no empty folder, so a section with no file in the repository is placed next to the model section. A deployment whose model section is not in the repository, or with a non-filesystem section, or with no SelfApplication row, is listed in `skipped` with the reason.
- `gitAction_clone { url, folderName, branch?, credential? }`: `folderName` is a path under the deployment root folder (no `..`, no absolute path, no `.git` segment), not inside an open deployment's folder (`sharedFolder`), and missing or empty. The URL takes the slice 7 checks, and is refused with a username or token in it. A clone that fails leaves no folder; a repository with no deployment is kept (`noDeploymentFound`). Credentials work as in slice 8, from the URL's host.
- `gitAction_installClonedDeployment { folderName, deploymentUuid? }` reads the clone again (a client gives no directory), refuses an application that already has a deployment here, and hands the DomainController a `GitDeploymentInstallRequest`. The DomainController runs `createDeploymentCompositeAction` with the new options `skipCreateStore` and `labels`, and with `grantAccessTo` the logged-in user. The Admin section is the one of the process' Admin deployment. After it, each DomainController (server and client) rolls back Admin and the new application, so the client lists the deployment.
- UI: the Clone panel (`GitClonePanel`, lazy) at the top of the Git page instead of the Runners page, which lists nothing today and is not hidden with `git` off. It installs a single deployment at once, lists several to pick from, and opens the credential form, now shared with the Remote panel (`GitCredentialForm`).
- Stored Runner `cloneApplicationFromGit` (`02fa934a-…`): clone then install, from the URL and the folder. It passes them with `getFromParameters`: a mustache template HTML-escapes the `/` of a URL or a path.
- Tests: `gitClone.integ.test.ts` (10), on copies of appForTest under new uuids (`test-filesystem` deploys appForTest), cloned into `.miroir/test-filesystem/git-clones/`. It covers one package, a monorepo with two deployments (one with no data file), no deployment, the folder and URL refusals, a remote asking for a token, the runner, and the capability off. `ui.gitPage` gets a `GitClonePanel` suite of 5 cases; component test leaves 232.
- Not done: the MiroirTest `runner.gitClone`. A MiroirTest has no way to start the Git server the clone needs, and a public repository would make the test depend on the network. The integration test runs the stored Runner instead.

---

## Slice 11. Nonreg, docs, dependency cleanup, issue-directory cleanup, AC

**Status:** ✅ done (sub-issue D, #683)

### 11.1 Nonreg

- Add `integ-git-version-control` to `scripts/nonreg-manifest.json` (scopes `actions`, `external`), running the `miroir-git-isomorphic` integ tests; the step skips with a message when `git` is not on the PATH.
- Run the full `npm run nonreg:filesystem -- --runner shared`.

### 11.2 Docs and dependencies

- `docs/reference/process-capabilities.md`: the `git` row.
- New `docs/guides/version-control-with-git.md`: turning the feature on, credentials, clone, limits (HTTPS only, fast-forward pull).
- `docs/reference/environments.md`: `features.git`.
- Remove `isomorphic-git` from `packages/miroir-server/package.json`; `check_dependency_policy.py` passes.
- `analysis.md` status set to implemented.

### 11.3 Issue-directory cleanup

- Move the still-valuable tests from `tests/issues/679-git-version-control/` into feature-named files (`tests/gitActions.*.integ.test.ts`); delete the issue directory (#238 rule).
- Done: the tests are in `packages/miroir-standalone-app/tests/3_controllers/git/` (`gitStatus`, `gitHistory`, `gitCommit`, `gitCheckout`, `gitFetch`, `gitCredentials`, `gitSync`, `gitClone`, `.integ.test.ts`), and `gitPendingChanges.unit.test.ts` in `packages/miroir-core/tests/3_controllers/`. The nonreg step `integ-git-version-control` runs `3_controllers/git/`. The phase names used in the slices above are the former file names.

### 11.4 Tracer bullet (narrative)

1. Set `features.git: true` in `environments/dev.json`, start the server and the client.
2. Open Library, open the Git page: the history shows the monorepo commits, the changes panel shows nothing.
3. Edit a Book in Miroir, commit the Miroir transaction: the changes panel shows "Entity Book, instance …".
4. Stage all, commit: the history shows the commit.
5. Create a branch, check it out, edit, commit; check out `_integration`: the edit is gone in the UI.
6. Fetch, push the branch (credential dialog on first push).
7. On another machine with no Git, clone the repository from the Clone panel of the Git page and open Library.

Automated equivalent: slices 1, 5, 6, 9 and 10 tests.

### AC checklist (#679)

| Criterion | Proven by | Status |
|---|---|---|
| View the commit history and working tree changes | slices 1, 2, 3 | ✅ |
| Create and delete branches | slice 6 | ✅ |
| Check out a branch, a tag or a commit | slice 6 | ✅ |
| Stage and commit changes | slice 5 | ✅ |
| Fetch, push and pull to the upstream | slices 7, 9 | ✅ |
| Clone and install with no Git installed | slice 10 | ✅ |
| Credentials stored as Admin secrets | slice 8 | ✅ |
| `features.git` off: no Git code loads, actions refused | slices 1, 3 (bundle policy) | ✅ |
| Lazy loading on first use | slices 1, 3 | ✅ |
