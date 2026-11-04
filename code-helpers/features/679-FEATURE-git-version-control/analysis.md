# 679 Git version control from the Miroir UI

> Git operations (history, changes, stage and commit, branches, checkout, fetch, pull, push, clone) run from the Miroir UI on the repository that holds a filesystem deployment. The feature is off unless `features.git` is set at startup, and its code loads on first use. This analysis records the decisions taken in two grilling rounds with A, the current state they build on, and how they leave room for ApplicationVersion-based versioning.

Related issue: https://github.com/miroir-framework/miroir/issues/679
Grilling rounds: [`grilling-round-1.md`](./grilling-round-1.md), [`grilling-round-2.md`](./grilling-round-2.md)
Related analyses: [`../576-DESIGN-feature-switches/analysis.md`](../576-DESIGN-feature-switches/analysis.md) (switch kinds, `features.*`), [`../636-REFACTOR-server-library/analysis.md`](../636-REFACTOR-server-library/analysis.md) (server package split)
Reference docs: [`process-capabilities.md`](../../../docs/reference/process-capabilities.md), [`environments.md`](../../../docs/reference/environments.md), [`data-architecture-deployments.md`](../../../docs/reference/data-architecture-deployments.md), [`versioning.md`](../../../docs/reference/versioning.md), [`code-splitting.md`](../../../docs/internals/code-splitting.md)
Key sources: [`processCapabilities.ts`](../../../packages/miroir-core/src/1_core/processCapabilities.ts), [`ActionImplementations.ts`](../../../packages/miroir-core/src/3_controllers/ActionImplementations.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`SecretStore.ts`](../../../packages/miroir-core/src/4_services/SecretStore.ts), [`ConfigurationService.ts`](../../../packages/miroir-core/src/3_controllers/ConfigurationService.ts), [`PageDispatcher.tsx`](../../../packages/miroir-react/src/PageDispatcher.tsx)

**Document role:** analysis and decision record. Decisions D1 to D23 were confirmed by A in the two grilling rounds. Goals G1 to G7 are drafted from the issue text and are to be confirmed.
**Status:** decisions confirmed, goals to confirm. Implementation follows [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

Survey of `_integration` at 143cb19 (2026-11-04).

---

## 1. Goals

- **G1. See the history and the changes.** To know what changed in my application and when, as an application designer, I can see the commit graph of the repository that holds my application and the files I changed since the last commit, each named by its Entity and instance.
- **G2. Commit my work.** To keep a restorable record of my application, as an application designer, I can stage and commit my changes from Miroir, after Miroir has written its own pending edits to disk.
- **G3. Branch and go back.** To try changes without losing a working version, as an application designer, I can create, delete and check out branches, tags and commits, and Miroir shows the application as it is at that point.
- **G4. Share through a remote.** To work with others or on several machines, as an application designer, I can fetch, pull and push to the upstream remote, with credentials kept as Admin secrets.
- **G5. Start from a remote repository.** To work on an application someone else published, as an application designer without Git installed, I can clone a repository from the Miroir UI and open the application it contains.
- **G6. No cost when off.** To keep a plain runtime small, as an application operator, I run Miroir with `features.git` off and no Git code is downloaded, imported or reachable.
- **G7. Pay on first use.** To start fast, as an application designer with the feature on, I download the Git page and the Git library only when I first open the page or run a Git action.

## 2. Non-goals

- ApplicationVersion-based versioning (version graph, snapshots, generated migrations). Section 7 records how this design relates to it; no issue owns it yet.
- Merges with conflicts, rebase, cherry-pick, stash, submodules, worktrees. Pull is fast-forward only (D17).
- SSH remotes (D20). isomorphic-git speaks HTTPS only.
- Remote management (adding, renaming or removing remotes) and choosing a remote other than the upstream (D17).
- Restoring one file or one instance from an older commit without moving HEAD (D16).
- A file watcher that reloads Miroir on any outside change to the section folders (D13).
- Semantic, field-by-field diffs of instances (D15). A later issue can reuse `json-diff`.
- Git for non-filesystem stores (IndexedDB, PostgreSQL, MongoDB).
- Per-deployment credential overrides (D18 option 3), a follow-up if two accounts on one host are needed.

---

## 3. Decision record

| # | Decision | Choice | Serves |
|---|---|---|---|
| D1 | Which repository | the work tree enclosing the section folders (`findRoot`); `git init` offered when none | G1 |
| D2 | What "the application's changes" cover | history repo-wide; changes and "stage all" filtered to the application's folders, toggle to show the rest | G1, G2 |
| D3 | Git implementation | adapter interface in core, isomorphic-git as first implementation | G5, G6 |
| D4 | Startup switch | process capability `git` (`features.git`, default false) | G6 |
| D5 | What is lazy-loaded | own package; client chunk on page open; server `import()` on first Git action | G6, G7 |
| D6 | How the UI calls Git | Miroir actions `gitAction_*` on a new Miroir Endpoint, run by `DomainController` | G1 to G5 |
| D7 | Open Miroir transaction | checkout, pull, branch switch refuse; commit offers "Commit Miroir changes first" | G2, G3 |
| D8 | Reload after checkout or pull | the action ends by reloading the deployment from its store | G3, G4 |
| D9 | "Change tree" | history graph panel and changes panel on one page | G1 |
| D10 | Display of file changes | files named by Entity and instance, JSON text diff below | G1 |
| D11 | Checkouts | branches, tags, commits (detached HEAD with banner); refused when local changes conflict | G3 |
| D12 | Push and pull | upstream only, fast-forward pull, fetch button with ahead / behind | G4 |
| D13 | Rights | `designerTools` | G1 to G5 |
| D14 | ApplicationVersion | Git-specific design, plus section 7 | all |
| D15 | Adapter layering | interface in `miroir-core` layer 0, implementation in `miroir-git-isomorphic` | G6, G7 |
| D16 | Credential secret | one `MiroirSecret` per host, `git.<host>`, value `{ username, token }`; user-scoped with authentication | G4, G5 |
| D17 | Credential entry | dialog on 401 / 403 that can save the secret, and the Admin Secrets page | G4, G5 |
| D18 | Commit author | logged-in `MiroirUser`, else repo config, else asked and remembered in `.git/config` | G2 |
| D19 | Clone result | clone, find the deployments in the repo, pick one, register it in Admin, open it | G5 |
| D20 | Clone location | `<filesystemDeploymentRootDirectory>/<repo name>`, folder name editable | G5 |
| D21 | SSH remotes | local operations work; fetch, pull, push refuse with a message | G4 |
| D22 | Remote operation tests | in-process HTTP Git server over a temp bare repo; CI needs the Git binary | G4, G5 |
| D23 | Work split | parent issue #679 and four sub-issues, one PR each | all |

**Shared drivers.** Reuse the mechanisms that already exist for switches (#273), action definitions (#341), server-routed actions and secrets (#472), and store factories. Keep `isomorphic-git` behind one package so that G6 holds by construction. Keep every Git operation a Miroir action so that MCP clients and the action runner get it with no extra transport.

### D1. Which repository

**Status:** Accepted, D1-a. **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Enclosing work tree** ★ | `git.findRoot({ fs, filepath: <section directory> })` for each filesystem section of the deployment | works on today's layout; no new attribute | a `live` dev deployment acts on the Miroir monorepo; `copy` sections under `.miroir/` (gitignored) are "not in a repository" |
| D1-b. Miroir-owned repo per application | new Deployment attribute `gitRepository: { path }` | clean for user applications | nothing for existing layouts |
| D1-c. Both | discovery, overridden by the attribute | flexible | the attribute has no user yet |

**Decision:** D1-a. D1-b can come later as an override. When the sections of one deployment resolve to different roots, the page lists each repository separately (an edge case, not a goal).

### D2. Scope of the changes view

**Status:** Accepted, D2-c. **Serves:** G1, G2.

| Option | Pros | Cons |
|---|---|---|
| D2-a. Whole repository | simple | a commit from Library's page sweeps in monorepo code changes |
| D2-b. Application folders only | focused | hides why a checkout is refused |
| **D2-c. History repo-wide, changes filtered, toggle** ★ | history and branches are repo-wide by nature; "stage all" stays safe | one more control |

`statusMatrix({ filepaths })` takes the application's section folders, which keeps status fast on the monorepo. The toggle runs a full `statusMatrix` on demand.

### D3. Git implementation

**Status:** Accepted, D3-c with isomorphic-git first (A's answer to round 1 Q3). **Serves:** G5, G6.

| Option | Pros | Cons |
|---|---|---|
| D3-a. isomorphic-git only | no Git binary; already declared | HTTPS only; no global config; no hooks |
| D3-b. `git` CLI | uses the user's config, SSH keys, credential helpers | users must install Git; G5 fails |
| **D3-c. Adapter interface, isomorphic-git implementation** ★ | clean layering; G5 holds; a CLI implementation can be added later | the interface must be designed now |

**Decision:** D3-c. A CLI implementation behind the same interface is a possible follow-up for SSH users. It is not planned.

### D4. Startup switch

**Status:** Accepted, D4-a. **Serves:** G6.

`ProcessCapabilities` gets `git: boolean`, read from `features.git === true`. `ProcessCapabilityName` gets `"git"`. `assertProcessCapability("git", snapshot)` refuses with `FeatureUnavailable` and `errorContext.capability = "git"`. `dev.json` and `desktop.json` turn it on. Rejected: a per-application opt-in (D4-b, no need yet), an environment variable read by the server only (D4-c, the UI could not hide anything).

### D5. Lazy loading

**Status:** Accepted, D5-c. **Serves:** G6, G7.

| Where | What | When |
|---|---|---|
| Client | `GitPage` and its components, one `React.lazy` chunk in `PageDispatcher` | the user opens the page; with `git` off the route and the menu entry are absent |
| Server, Electron main, emulated server | `@miroir-framework/git-isomorphic` (and through it `isomorphic-git`) | the first `gitAction_*`, through a dynamic `import()` behind the registered factory |
| Bundle policy | `isomorphic-git` and `@miroir-framework/git-isomorphic` added to `forbiddenEager` | every build |

Rejected: D5-a (client chunk plus server `import()`, but the code inside `miroir-server`) because a build without the switch would still carry it; D5-b (page shell eager) because it saves nothing.

### D6. Git operations as Miroir actions

**Status:** Accepted, D6-a. **Serves:** G1 to G5.

A new Miroir Endpoint, `GitEndpoint`, declares the `gitAction_*` actions with `actionImplementation: { actionImplementationType: "libraryImplementation", inMemoryImplementationFunctionName: "handleAction_gitAction_<op>" }`, as `StoreManagementEndpoint` (`bbd08cbb-79ff-4539-b91f-7a14f15ac55f`) does. The action types join `SERVER_ROUTED_MIROIR_ACTION_TYPES`, so a client in `realServer` mode forwards them with `forwardServerRoutedAction`, as `setExternalServiceCredential` already does. MCP and the action runner see them through the Endpoint.

Rejected: dedicated REST routes (D6-b), which would need code in `server.ts`, the Electron IPC and `RestClientStub`; Endpoint instances in a separate application (D6-c), which would make Git depend on deploying an extra application.

Cost: the Endpoint is a `miroir-app-miroir` asset, and `miroir-app-miroir` is eager on the page (cap `eagerPackageMaxBytes` in `bundle-policy.json`). The Endpoint JSON adds a few kB to the meta-model. The implementations stay in the lazy package.

### D7. Miroir's own uncommitted edits

**Status:** Accepted. **Serves:** G2, G3.

| Git action | With an open Miroir transaction |
|---|---|
| status, log, diff, fetch, branch create / delete | runs |
| checkout, pull, branch switch | refused (`Action2Error "InvalidAction"`, context `{ reason: "openMiroirTransaction" }`) |
| commit | refused with the same reason; the UI offers "Commit Miroir changes first", which runs the Miroir `commit` action and retries |

### D8. Reload after checkout or pull

**Status:** Accepted, D8-a. **Serves:** G3, G4.

The filesystem store reads instance files from disk on each read (`FileSystemInstanceStoreSectionMixin.ts`, `fs.readFileSync` lines 120 and 198), so after the files change only Miroir's in-memory state is stale. The Git action returns which deployments it touched; the client then runs the Miroir `rollback` action on each, which is `loadConfigurationFromPersistenceStore` (`DomainController.ts:622`). Rejected: asking for a page reload (D8-b), a file watcher (D8-c, non-goal).

### D9 to D13 (UI and scope)

- **D9.** One `GitPage` per application, two panels: history (graph of `git.log` commits with refs, click a commit to list its files) and changes (unstaged / staged, stage, unstage, commit message, commit).
- **D10.** A changed path `<section dir>/<entity uuid>/<instance key>.json` is shown as "Entity <name>, instance <name>". The mapping lives in core layer 2, above the adapter. Files outside a section show their path.
- **D11.** Checkout of a branch, a tag or a commit. A detached HEAD shows a banner with "back to <branch>". The adapter refuses a checkout that would overwrite local changes (isomorphic-git's `checkout` without `force` throws `CheckoutConflictError`). No stash.
- **D12.** `fetch`, `pull` (fetch, then `fastForward`; divergence refused with "resolve outside Miroir"), `push` (sets the upstream on `origin` for a branch without one). The history panel shows ahead / behind counts after a fetch.
- **D13.** Git actions need `designerTools`. Without authentication, everyone can, as for designer tools.

### D14. ApplicationVersion

**Status:** Accepted, D14-c. **Serves:** all goals. Git-specific names and interface, plus section 7 below. Rejected: a generic `versionControl` port (D14-b), because Git's model (files, refs, a work tree) and an ApplicationVersion graph (Entities, snapshots, migrations) are unlikely to share one interface, and guessing it now would bend the Git design.

### D15. Interface and implementation layout

**Status:** Accepted, D15-a. **Serves:** G6, G7.

| Piece | Location | Imports |
|---|---|---|
| `GitRepositoryInterface`, `GitRepositoryFactory`, result types | `miroir-core/src/0_interfaces/4-services/GitRepositoryInterface.ts` | nothing from Git |
| Factory register | `ConfigurationService.registerGitRepositoryFactory(loader)`, next to the store factory registers | interface only |
| `handleAction_gitAction_*` | `miroir-core/src/3_controllers/GitActions.ts`, registered in `miroirActionImplementations` | interface only |
| Path to Entity mapping, application folder list | `miroir-core/src/2_domain/` | interface only |
| isomorphic-git implementation | new package `packages/miroir-git-isomorphic` (`@miroir-framework/git-isomorphic`, layer 4) | `isomorphic-git`, `node:fs` |
| Startup | `miroirGitIsomorphicStartup(configurationService)` registers a loader `() => import("@miroir-framework/git-isomorphic")`; called by `miroir-server`, Electron main and the test setup when `features.git` is on | |

Rejected: the implementation in `miroir-server` and again in Electron (D15-b), an interface outside core (D15-c, then `DomainController` could not check the capability or run the actions).

### D16 to D18 (credentials and author)

- **D16.** A secret named `git.<host>` (for example `git.github.com`), value the JSON string `{ "username": "...", "token": "..." }`, stored as a `MiroirSecret` row (`a96856df-2b38-494a-8027-82617e2d64ad`) through `persistSecretRow` (the #472 path), with `scope: "user"` and `miroirUser` when a principal is logged in, else `scope: "process"`. The adapter receives an `onAuth` callback built in core from `resolveSecret("git.<host>", principal)`; the adapter never reads secrets. Needs the wrapping key (`MIROIR_SECRETS_MASTER_KEY`), as other secrets do.
- **D17.** A 401 or 403 from the remote returns `Action2Error "ExternalServiceUnauthorized"` (an existing `ActionErrorType`, `DomainElement.ts:176`) with `{ reason: "authenticationRequired", host }`. The UI opens a dialog (username, token, "Save as secret") and retries with the credential in the action payload; a save runs a `gitAction_setCredential` that persists the row. The Admin Secrets Report (`MiroirSecretList`, `288c9faf-c92e-49a4-b535-99ed7bb01793`) lists `git.*` rows like the others.
- **D18.** Author: the logged-in `MiroirUser` (name, email); else `user.name` / `user.email` from the repository's `.git/config` (isomorphic-git does not read `~/.gitconfig`); else the commit form asks and "remember for this repository" writes them with `git.setConfig`.

### D19 and D20 (clone)

- **D19.** `gitAction_clone` clones, then scans the clone for deployable layouts: each `**/assets/deployment/*.json` whose `parentUuid` is the Deployment Entity (`7959d814-400c-4e80-988f-a00fe582ab98`) and whose `selfApplication` row exists in a `*_model/` folder next to it. One result: install it. Several: return the list, and the UI shows a picker. None: refuse with the reason and keep the folder. Installing writes a Deployment row in Admin whose section `directory` values are rewritten to the clone's folders, then opens the application.
- **D20.** Target `<filesystemDeploymentRootDirectory>/<repo name>`, editable folder name, refused if the folder exists and is not empty, and refused if the resolved path leaves the root.

### D21 and D22 (SSH, tests)

- **D21.** A remote URL that is not `http:` or `https:` makes fetch, pull and push refuse with "SSH remotes are not supported, set an HTTPS URL for origin". Local operations still work.
- **D22.** Local operations are tested against real temp repositories. Remote operations are tested against an in-process HTTP Git server over a temp bare repo (`git-http-mock-server` or equivalent, which calls `git http-backend`), so the test suite needs Git on the machine. Users do not.

### D23. Work split

Parent #679, four sub-issues, one PR each, in this order: (a, #680) read-only history and changes, with the interface, the package, the switch and the page; (b, #681) stage, commit, branches, checkout and the reload; (c, #682) credentials, fetch, pull, push; (d, #683) clone and install. The TDD plan's slices are grouped by sub-issue.

---

## 4. Current state

### 4.1 Process capabilities (aligned, to extend)

`getProcessCapabilities` (`processCapabilities.ts:96`) builds the snapshot from `config.features`:

```typescript
// processCapabilities.ts:96-115 (getProcessCapabilities)
return {
  ai: features?.ai === true && environment !== "sandbox",
  mcp: features?.mcp === true,
  agentBackend: features?.agentBackend ?? (features?.cursor === true ? "cursor" : "none"),
  designerTools: features?.designerTools !== false,
  availableStoreTypes,
  creatableStoreTypes: availableStoreTypes.filter((storageType) => storageType !== "bundled"),
  storeAdministration: hasNonBundledAdminStorageType(adminStoreFactoryRegister),
};
```

- The server serves it on `GET /capabilities`; Electron builds it in `ipcServerSetup.ts:105` and sets it on `RestClientStub` and `DomainController` (lines 113 to 114).
- `features` is copied from the environment by `miroir-env` (`environmentState.ts:277`). `environments/dev.json:14` sets `ai`, `mcp`, `agentBackend`, `agentModel`; `desktop.json:11` has a `features` object.
- `assertProcessCapability` (`processCapabilities.ts:117`) treats every name except `availableStoreTypes` and `agent` as `snapshot[name] === true`, so adding `git` needs only the type and the snapshot field.

### 4.2 Miroir action definitions (aligned, to extend)

Since #341, a Miroir action is declared in a bundled Endpoint and implemented by a named library function:

- `StoreManagementEndpoint` (`miroir-app-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json`) declares 5 actions, each with `actionImplementationType: "libraryImplementation"` and an `inMemoryImplementationFunctionName` (`handleAction_storeManagementAction_createStore`, `_deleteStore`, `_resetAndInitApplicationDeployment`, `_openStore`, `_closeStore`), enumerated with a script.
- `miroirActionImplementations` (`ActionImplementations.ts`) maps those names to handlers. `registerMiroirActionImplementation` (#575, same file) adds one from a layer above at startup.
- `handleMiroirAction` (`DomainController.ts:3273`) refuses an action with no bundled definition, then `handleApplicationAction` runs the library implementation (`DomainController.ts:3440`).
- An Endpoint of the Miroir application is wired by hand into the fundamental schema (`getMiroirFundamentalMlSchema.ts:284`, `2879`, `3207` for `storeManagementEndpoint`) and into `defaultEndpointApplicationMap` (`Deployment.ts:102`). A new `GitEndpoint` needs the same three places, then `npm run build -w miroir-app-miroir` and `npm run devBuild -w @miroir-framework/core`.

### 4.3 Server-routed actions (aligned, reused)

`SERVER_ROUTED_MIROIR_ACTION_TYPES` (`1_core/constants.ts:16`) lists `probeExternalService` and `setExternalServiceCredential`. Their handlers start with `if (this.persistenceStoreAccessMode !== "local") return this.forwardServerRoutedAction(...)` (`DomainController.ts:3874`), which posts the action to the server and turns a JSON error back into an `Action2Error` (`DomainController.ts:3759`). Git actions follow the same pattern: they must run where the files are.

### 4.4 Secrets (aligned, reused)

- `MiroirSecret` (Admin Entity `a96856df-2b38-494a-8027-82617e2d64ad`) has `name`, `ciphertext` (AES-256-GCM, never returned to clients), optional `algorithm`, optional `miroirUser` (absent means process-scoped), optional `description`.
- `resolveSecret(name, principal)` (`SecretStore.ts:51`) returns the user's entry first, then the process entry, and throws on an unknown name.
- `handleSetExternalServiceCredential` (`DomainController.ts:3857`) is the closest precedent: it checks the wrapping key (`getSecretsMasterKey()`), probes with a one-shot process secret, then calls `persistSecretRow` with `scope: principal?.miroirUserUuid ? "user" : "process"`.

### 4.5 Filesystem deployments (aligned)

- A filesystem section's `directory` is relative to `filesystemDeploymentRootDirectory` (`PersistenceStoreController.ts:82`, `PersistenceStoreControllerManager.ts:151`). The Library package's Deployment row (`miroir-example-library/assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json`) has `admin`, `model` and `data` sections with directories `miroir-app-admin/assets`, `miroir-example-library/assets/library_model`, `miroir-example-library/assets/library_data`.
- A deployable package has `assets/deployment/<deployment uuid>.json`, `<prefix>_model/` (with the `SelfApplication` row under `a659d350-dd97-4da9-91de-524fa01745dc/`) and `<prefix>_data/`.
- Environments: `live` sections are the package folders (inside the Miroir monorepo); `copy` sections are under `.miroir/<env>/` (gitignored). `test-*` environments copy every section (`environments.md:24-27`).

### 4.6 Git in the repository today (misaligned)

- `miroir-server/package.json:49` declares `isomorphic-git` 1.44.3, locked in `package-lock.json`, imported nowhere (`636` analysis line 209 notes the same). The plan moves the dependency to `miroir-git-isomorphic` and removes it from `miroir-server`.
- isomorphic-git 1.44.3 exports `findRoot`, `init`, `clone`, `statusMatrix` (with `filepaths` and `filter`), `add`, `remove`, `resetIndex`, `commit`, `log`, `listBranches`, `branch`, `deleteBranch`, `currentBranch`, `checkout` (with `filepaths`), `fetch`, `fastForward`, `pull`, `push`, `listRemotes`, `getConfig`, `setConfig`, `readBlob`, `walk`, `isDescendent`, `stash` (`node_modules/isomorphic-git/index.d.ts`). `commit` defaults the author to the `user.name` / `user.email` config of the repository.

### 4.7 UI hooks (aligned, to extend)

- `PageDispatcher.tsx:38-47` declares every route page as `React.lazy`; the switch at lines 161 and 205 maps a route name to a page. A `git` route follows the same pattern.
- `RootComponent.tsx:601` and `620` read `context.processCapabilities.ai` to decide what to mount; the Git menu entry reads `processCapabilities.git` the same way.
- `bundle-policy.json` lists `forbiddenEager` packages (`@copilotkit/*`, `diff`, `json-diff`, …); `scripts/check_bundle_policy.py` checks it on each build.
- The Runners page (`routes/Runners.tsx`) hosts `Runner_CreateApplication` and `Runner_InstallApplication` (installs from an application bundle, not from a folder). The clone flow is a new Runner next to them.

### 4.8 Reload path (aligned, reused)

The Miroir `rollback` action runs `loadConfigurationFromPersistenceStore(applicationUuid, deploymentUuid, applicationDeploymentMap)` (`DomainController.ts:622`), which reloads the deployment from its store into the local cache. The filesystem store reads from disk on each call, so no store-level cache needs clearing.

---

## 5. Key reuse

| Piece | Location |
|---|---|
| Process capability snapshot and refusal | `miroir-core/src/1_core/processCapabilities.ts` |
| Library action implementations and registration | `miroir-core/src/3_controllers/ActionImplementations.ts` (`registerMiroirActionImplementation`) |
| Endpoint precedent | `StoreManagementEndpoint`, uuid `bbd08cbb-79ff-4539-b91f-7a14f15ac55f` |
| Endpoint Entity | uuid `3d8da4d4-8f76-4bb4-9212-14869d81c00c` |
| Server-routed action forwarding | `SERVER_ROUTED_MIROIR_ACTION_TYPES`, `DomainController.forwardServerRoutedAction` |
| Secret storage and lookup | `persistSecretRow`, `resolveSecret`, `getSecretsMasterKey`; Entity `MiroirSecret` uuid `a96856df-2b38-494a-8027-82617e2d64ad` |
| Secrets Report | `MiroirSecretList` uuid `288c9faf-c92e-49a4-b535-99ed7bb01793` |
| Factory registers | `ConfigurationService` (`StoreSectionFactoryRegister`, `adminStoreFactoryRegister`) |
| Lazy server import precedent | `mountCopilotKitRoute.ts:42` (`import("miroir-ai")`) |
| Reload | Miroir `rollback` action, `loadConfigurationFromPersistenceStore` |
| Deployment Entity | uuid `7959d814-400c-4e80-988f-a00fe582ab98` |
| SelfApplication Entity | uuid `a659d350-dd97-4da9-91de-524fa01745dc` |
| Lazy route pages | `PageDispatcher.tsx` |
| Bundle guard | `packages/miroir-standalone-app/bundle-policy.json`, `scripts/check_bundle_policy.py` |

---

## 6. Interface sketch

A sketch for slice 0 to lock, not a contract yet. Paths are relative to the repository root.

```typescript
// miroir-core/src/0_interfaces/4-services/GitRepositoryInterface.ts
export type GitAuth = { username: string; password: string };
export type GitOnAuth = (url: string) => GitAuth | undefined | Promise<GitAuth | undefined>;

export type GitFileStatus = {
  path: string;
  head: "absent" | "present";
  workdir: "absent" | "unmodified" | "modified";
  stage: "absent" | "unmodified" | "modified";
};
export type GitCommitSummary = {
  oid: string; parents: string[]; message: string;
  author: { name: string; email: string; timestamp: number };
  refs: string[];
};

export interface GitRepositoryInterface {
  readonly root: string;
  status(filepaths?: string[]): Promise<GitFileStatus[]>;
  log(options?: { ref?: string; depth?: number }): Promise<GitCommitSummary[]>;
  diff(path: string, options?: { from?: string; to?: "workdir" | "stage" | string }): Promise<{ before?: string; after?: string }>;
  stage(paths: string[]): Promise<void>;
  unstage(paths: string[]): Promise<void>;
  commit(message: string, author: { name: string; email: string }): Promise<string>;
  branches(): Promise<{ current?: string; local: string[]; remote: string[] }>;
  createBranch(name: string, startPoint?: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
  checkout(ref: string): Promise<void>;
  fetch(onAuth: GitOnAuth): Promise<{ ahead: number; behind: number }>;
  pull(onAuth: GitOnAuth, author: { name: string; email: string }): Promise<void>;
  push(onAuth: GitOnAuth): Promise<void>;
  getConfig(key: string): Promise<string | undefined>;
  setConfig(key: string, value: string): Promise<void>;
}

export interface GitRepositoryFactory {
  findRoot(directory: string): Promise<string | undefined>;
  open(root: string): Promise<GitRepositoryInterface>;
  init(directory: string): Promise<GitRepositoryInterface>;
  clone(url: string, directory: string, onAuth: GitOnAuth): Promise<GitRepositoryInterface>;
}
```

Errors cross the interface as `Action2Error` values with stable `errorContext.reason` strings (`notARepository`, `checkoutConflict`, `notFastForward`, `authenticationRequired`, `unsupportedRemoteProtocol`), so the UI never parses library messages.

---

## 7. ApplicationVersion: the two futures

A asked to keep ApplicationVersion-based versioning in mind. Two futures were named:

| Future | What it means for this design | Choices here that would block it |
|---|---|---|
| F1. A version graph kept in Git | `ApplicationVersion` rows (and the `modelVersion` section of #234) are files in the same repository; a Miroir "freeze" could also create a Git tag or commit | none: D2's filter already includes the `modelVersion` folder; a freeze action can call `GitRepositoryInterface.commit` |
| F2. ApplicationVersion replaces Git | Miroir's commit / rollback grows into its own history, snapshots and migrations; Git becomes one export target or disappears | none: Git lives behind its own capability, Endpoint and package, and can be switched off or removed without touching core actions; D14 avoids a shared interface that F2 would have to fit |

What would block either: storing Git state (commit ids, branch names) in model Entities, or making Miroir's `commit` action call Git. This design does neither.

---

## Next step

Implementation follows [`tdd-implementation-plan.md`](./tdd-implementation-plan.md), grouped into the four sub-issues of D23.
