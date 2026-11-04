# Issue #679 TDD implementation plan

> Vertical TDD slices (RED, then GREEN), integration-first per `docs/contributing/testing.md`.
> Tests run `gitAction_*` through the real `DomainController` (emulated server, filesystem store) against real temporary Git repositories on disk, and the remote slices against an in-process HTTP Git server over a temporary bare repository. No mocks: the only test-only piece is that HTTP server, which plays the remote.
> The tracer bullet (slice 1) proves the thinnest whole path: `features.git` on, one `gitAction_status` dispatched to `DomainController`, the lazy `@miroir-framework/git-isomorphic` package loaded, the changed file of a deployment section reported; `features.git` off, the same action refused.
>
> **Execution model:** human in the loop. No slice contains a commit step; commits happen only when A asks. Each slice ends with its Validation commands; on success its Realization is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/679
Sub-issues: #680 (A, slices 0 to 4), #681 (B, slices 5 and 6), #682 (C, slices 7 to 9), #683 (D, slices 10 and 11).
Working branch: one branch per sub-issue, named `claude/<sub-issue number>-git-<slug>`, from `_integration`.

**Resume note:** plan written, no slice started. Goals G1 to G7 to confirm with A.

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
| 0 | A #680 | Characterize capabilities, Miroir Endpoints, bundle policy | ⬜ | `gitVersionControl.679.phase0.unit.test.ts` |
| 1 | A #680 | Tracer: `gitAction_status` behind `features.git`, lazy package | ⬜ | `gitStatus.679.phase1.integ.test.ts` |
| 2 | A #680 | Log and diff, paths named by Entity and instance | ⬜ | `gitHistory.679.phase2.integ.test.ts`, MiroirTest `fn.gitPathToInstance` |
| 3 | A #680 | Git page: lazy route, menu entry, history and changes panels, real-server forwarding | ⬜ | component test `ui.gitPage`, bundle policy |
| 4 | A #680 | No repository: `notARepository`, `gitAction_init` | ⬜ | `gitInit.679.phase4.integ.test.ts` |
| 5 | B #681 | Stage, unstage, commit; author; open Miroir transaction | ⬜ | `gitCommit.679.phase5.integ.test.ts` |
| 6 | B #681 | Branches and checkout, conflict refusal, reload | ⬜ | `gitCheckout.679.phase6.integ.test.ts` |
| 7 | C #682 | Test remote, fetch with ahead / behind, SSH refusal | ⬜ | `gitFetch.679.phase7.integ.test.ts` |
| 8 | C #682 | Credentials: `git.<host>` secret, 401 path, save from the dialog | ⬜ | `gitCredentials.679.phase8.integ.test.ts` |
| 9 | C #682 | Pull (fast-forward) with reload, push with upstream | ⬜ | `gitSync.679.phase9.integ.test.ts` |
| 10 | D #683 | Clone, scan deployments, pick, install, open | ⬜ | `gitClone.679.phase10.integ.test.ts`, runner test `runner.gitClone` |
| 11 | D #683 | Nonreg, docs, dependency cleanup, issue-directory cleanup, AC | ⬜ | nonreg step `integ-git-version-control` |

---

## Locked implementation defaults

From the analysis decision record, binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 | repository = `findRoot` of each filesystem section directory; `gitAction_init` when none | G1 |
| D2 | history repo-wide; status and "stage all" limited to the application's section folders (`statusMatrix({ filepaths })`); `includeOtherChanges` flag for the toggle | G1, G2 |
| D3, D15 | `GitRepositoryInterface` / `GitRepositoryFactory` in `miroir-core/src/0_interfaces/4-services/`; implementation in `packages/miroir-git-isomorphic` (`@miroir-framework/git-isomorphic`), the only importer of `isomorphic-git` | G5, G6 |
| D4 | `ProcessCapabilities.git`, from `features.git === true`; on in `dev.json`, `desktop.json` | G6 |
| D5 | client `React.lazy` route chunk; server, Electron, emulated server `import()` behind `ConfigurationService.registerGitRepositoryFactory`; `forbiddenEager` gets both packages | G6, G7 |
| D6 | `GitEndpoint` in `miroir-app-miroir` data, `libraryImplementation` actions; action types in `SERVER_ROUTED_MIROIR_ACTION_TYPES` | G1 to G5 |
| D7 | checkout, pull, branch switch, commit refused with `reason: "openMiroirTransaction"` while a Miroir transaction is open | G2, G3 |
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

**Status:** ⬜ pending

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

---

## Slice 1. Tracer: `gitAction_status` behind `features.git`, lazy package

**Status:** ⬜ pending

### Goal

With `features.git` on, an application designer (through any action client) gets the changed files of a deployment's sections in their Git repository. With it off, the action is refused and the Git package is never imported.

**Layers cut:** `GitEndpoint` asset, schema rebuild, `ProcessCapabilities`, `GitRepositoryInterface`, `GitActions.ts`, new package `miroir-git-isomorphic`, startup registration in the test setup, `bundle-policy.json`.

### 1.1 RED

**Test:** `packages/miroir-git-isomorphic/tests/issues/679-git-version-control/gitStatus.679.phase1.integ.test.ts`

Setup: copy `miroir-fixture-appForTest` assets to a temp folder, `git init`, commit them, then modify one instance file and add one; open the deployment on the `emulatedServer-filesystem` profile pointing at the temp folder.

Behavior asserted:

- `features.git: true`: `gitAction_status` for the deployment returns `{ root, files: [ { path, head, workdir, stage } ] }` with exactly the modified and the added file, both inside the model section folder.
- `features.git` absent: the same action returns `Action2Error "FeatureUnavailable"` with `errorContext.capability === "git"`, and the package loader registered on `ConfigurationService` was never called (the test registers a counting loader around the real `import()`).

### 1.2 GREEN

- `ProcessCapabilities.git`, `ProcessCapabilityName | "git"`, `features.git` in `ProcessCapabilitiesConfig`; the slice 0 test gets the new key.
- `GitRepositoryInterface.ts` with `status` only, plus `GitRepositoryFactory.findRoot` and `open` (analysis section 6).
- `ConfigurationService.registerGitRepositoryFactory(loader: () => Promise<GitRepositoryFactory>)` and `getGitRepositoryFactory()` (memoized `await loader()`).
- `GitEndpoint` (`a7f243cb-…`) with `gitAction_status`; wire it in `getMiroirFundamentalMlSchema.ts` and `defaultEndpointApplicationMap`; schema rebuild.
- `3_controllers/GitActions.ts`: `handleAction_gitAction_status` checks the capability, resolves the deployment's filesystem section directories, calls `findRoot`, `open`, `status(filepaths)`. Register it in `miroirActionImplementations`.
- `packages/miroir-git-isomorphic`: `package.json` (`"type": "module"`, `isomorphic-git` 1.44.3 exact), `src/index.ts` exporting `createGitRepositoryFactory()` and `miroirGitIsomorphicStartup(configurationService)`; status maps `statusMatrix` rows to `GitFileStatus`.
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

---

## Slice 2. Log and diff, paths named by Entity and instance

**Status:** ⬜ pending

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

---

## Slice 3. Git page: lazy route, menu entry, panels, real-server forwarding

**Status:** ⬜ pending

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
- `miroir-server` and Electron main call `miroirGitIsomorphicStartup` when `features.git` is on.

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

---

## Slice 4. No repository: `notARepository`, `gitAction_init`

**Status:** ⬜ pending

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

---

## Slice 5. Stage, unstage, commit; author; open Miroir transaction

**Status:** ⬜ pending (sub-issue B, #681)

### Goal

The designer stages, unstages and commits the application's changes, with a known author, and cannot commit while Miroir edits are not yet on disk.

### 5.1 RED

**Test:** `gitCommit.679.phase5.integ.test.ts`

- `gitAction_stage` with `all: true` stages only files under the section folders, leaving a modified file elsewhere in the repo unstaged (D2).
- `gitAction_unstage` returns a file to unstaged.
- `gitAction_commit` with a logged-in principal writes a commit authored by the `MiroirUser` name and email; with no principal and `user.name` / `user.email` in `.git/config`, by those; with neither, returns `reason: "authorUnknown"`; with `author` and `rememberAuthor: true` in the payload, commits and writes the config.
- With a Miroir transaction open (a `createInstance` in the local cache not yet committed), `gitAction_commit` returns `reason: "openMiroirTransaction"`; after the Miroir `commit` action, it succeeds and the new instance file is in the commit.

### 5.2 GREEN

- Interface `stage`, `unstage`, `commit`, `getConfig`, `setConfig`; adapter on `add` / `remove` (deleted files) / `resetIndex` / `commit`.
- Open transaction check through the local cache's pending patches (the same state `rollback` drops).
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

---

## Slice 6. Branches and checkout, conflict refusal, reload

**Status:** ⬜ pending (sub-issue B, #681)

### Goal

The designer creates, deletes and checks out branches, tags and commits, and Miroir shows the application as it is at the checked-out point.

### 6.1 RED

**Test:** `gitCheckout.679.phase6.integ.test.ts`

- `gitAction_createBranch` then `gitAction_checkout` of it: `gitAction_status` shows the new current branch.
- On the branch, commit a new instance; checkout `main`; the result lists the deployment in `touchedDeployments`; after the client's `rollback` on it, a `getInstances` on the Entity no longer returns the instance (read through the real local cache).
- Checkout of a commit oid: `branches().current` is `undefined` (detached).
- Checkout with an uncommitted change to a file the target changes returns `reason: "checkoutConflict"` and the file is unchanged on disk.
- Checkout with an open Miroir transaction returns `reason: "openMiroirTransaction"`.
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

---

## Slice 7. Test remote, fetch with ahead / behind, SSH refusal

**Status:** ⬜ pending (sub-issue C, #682)

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

---

## Slice 8. Credentials: `git.<host>` secret, 401 path, save from the dialog

**Status:** ⬜ pending (sub-issue C, #682)

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

---

## Slice 9. Pull (fast-forward) with reload, push with upstream

**Status:** ⬜ pending (sub-issue C, #682)

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

---

## Slice 10. Clone, scan deployments, pick, install, open

**Status:** ⬜ pending (sub-issue D, #683)

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
RUN_TEST=gitClone.679.phase10 npm run testByFile -w @miroir-framework/git-isomorphic -- gitClone.679.phase10
npm run build -w miroir-app-miroir
npm run testMiroir -w miroir-standalone-app -- --suites runner.gitClone --mode integration
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,runners,external,ui
```

### Realization

---

## Slice 11. Nonreg, docs, dependency cleanup, issue-directory cleanup, AC

**Status:** ⬜ pending (sub-issue D, #683)

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

### 11.4 Tracer bullet (narrative)

1. Set `features.git: true` in `environments/dev.json`, start the server and the client.
2. Open Library, open the Git page: the history shows the monorepo commits, the changes panel shows nothing.
3. Edit a Book in Miroir, commit the Miroir transaction: the changes panel shows "Entity Book, instance …".
4. Stage all, commit: the history shows the commit.
5. Create a branch, check it out, edit, commit; check out `_integration`: the edit is gone in the UI.
6. Fetch, push the branch (credential dialog on first push).
7. On another machine with no Git, clone the repository from the Runners page and open Library.

Automated equivalent: slices 1, 5, 6, 9 and 10 tests; `runner.gitClone`.

### AC checklist (#679)

| Criterion | Proven by | Status |
|---|---|---|
| View the commit history and working tree changes | slices 1, 2, 3 | ⬜ |
| Create and delete branches | slice 6 | ⬜ |
| Check out a branch, a tag or a commit | slice 6 | ⬜ |
| Stage and commit changes | slice 5 | ⬜ |
| Fetch, push and pull to the upstream | slices 7, 9 | ⬜ |
| Clone and install with no Git installed | slice 10 | ⬜ |
| Credentials stored as Admin secrets | slice 8 | ⬜ |
| `features.git` off: no Git code loads, actions refused | slices 1, 3 (bundle policy) | ⬜ |
| Lazy loading on first use | slices 1, 3 | ⬜ |
