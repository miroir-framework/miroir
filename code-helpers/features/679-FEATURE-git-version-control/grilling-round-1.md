# Git version control from the UI: grilling round 1

Facts checked on `_integration` (143cb19) before asking:

- **Switches.** The only switch system is the process capabilities of #273 (`miroir-core/src/1_core/processCapabilities.ts`): `features` in `environments/<env>.json`, read once at process start, served by `GET /capabilities`, used by the UI to hide and by `DomainController.assertProcessCapability` to refuse (`Action2Error "FeatureUnavailable"`). `ai` is the model to follow for lazy loading: a client chunk (`RootComponent.tsx`) plus a server `import("miroir-ai")` on first use. #576 surveyed all of this.
- **Where filesystem sections live.** A section is either `live` (the package folder itself, e.g. `packages/miroir-example-library/assets/library_model/`, filesystem only) or `copy` (under `.miroir/<env>/<application>/…`, gitignored). In `dev`, models are edited live in the package assets, so today the only Git repo around a Miroir deployment is the Miroir monorepo. A deployment created from the UI on the filesystem store goes under `filesystemDeploymentRootDirectory`.
- **Which processes touch the disk.** The server (`realServer`), the Electron main process, and the in-process server of `emulatedServer` (tests). A browser-only client (IndexedDB) has no filesystem.
- **Git library.** `miroir-server/package.json` declares `isomorphic-git` 1.44.3, imported nowhere. No other Git library is in the repo.
- **Miroir's own commit / rollback.** Model edits go into local cache transactions, then `commit` replays them to the store, `rollback` drops them (`DomainController.ts`). Until a Miroir commit, the files on disk do not hold the edits.
- **Existing actions on stores.** `storeManagementAction_*` (create store, reset deployment) are actions handled by `DomainController`, which is where capability checks happen.
- No GitHub issue covers Git operations from the UI. #234 introduced `versionedMode` / `modelVersion`, related to ApplicationVersion.

All questions below are independent of each other.

---

❓ **Q1 - Which repository does an application act on?**

1. The Git work tree that encloses the deployment's section folders, found with `git rev-parse --show-toplevel`. If there is none, the page offers `git init` in the section's root folder.
2. A repository that Miroir creates and owns per application, at a path given in the deployment (new attribute, e.g. `gitRepository: { path }`).
3. Both: discovery by default, an explicit path when set.

With option 1 a `live` dev deployment of Library acts on the Miroir monorepo itself, and a `copy` section under `.miroir/` (ignored by Git) shows "not in a repository". Option 2 is the clean case for a user application but does nothing for the existing layout.

➡️ Option 1 for this issue. Option 2 can come later as an attribute that overrides discovery.

❓ **Q2 - What does "the application's changes" cover when the repo holds more than the application?**

A deployment has up to four sections (model, data, modelVersion, devData), possibly in different folders, inside a repo that may hold other applications and code.

1. The whole repository: status, staging and commits see every file.
2. Only the application's section folders: the status lists only those paths, and "stage all" stages only those.
3. The whole repository in the history view, but the changes view and "stage all" are filtered to the application's folders, with a toggle "show other changes".

➡️ Option 3. The history and branches are repo-wide by nature; a commit made from an application page should not sweep in unrelated files.

❓ **Q3 - Which Git implementation?**

1. `isomorphic-git` (pure JS, already declared). No Git binary needed, works in the Electron main process and Node. No SSH: push / pull over HTTPS only, with a token Miroir must supply.
2. The `git` command line, behind a thin adapter (`child_process`, or `simple-git`). Needs Git installed; uses the user's own config, SSH keys and credential helpers, so push / pull works as in a terminal.
3. An adapter interface with both behind it.

➡️ Option 2. Credentials are the hard part of push / pull, and the CLI solves them for free; anyone keeping an application in a local Git repo has Git installed. Drop the unused `isomorphic-git` dependency.

❓ **Q4 - What is the startup switch?**

1. A new process capability `git` (`features.git` in the environment, default `false`), served by `/capabilities`: off, the UI shows nothing and `DomainController` refuses Git actions with `FeatureUnavailable`.
2. Same, plus a per-application opt-in on the SelfApplication or Deployment row.
3. An environment variable read by the server only.

➡️ Option 1. It is the existing mechanism and gives both the hiding and the refusal. `features.git: true` goes in `dev.json` and `desktop.json`; tests turn it on per profile.

❓ **Q5 - What exactly is lazy-loaded, and when?**

"On first access to a local git repo" can mean:

1. Client: the version control page and its components are one `React.lazy` chunk, loaded when the user opens the page. Server: the Git module is a dynamic `import()` on the first Git action.
2. Same, but the client chunk loads only when a Git action returns "this deployment is in a repository" (the page shell is in the main bundle).
3. Same as 1, and the Git code lives in its own package (`@miroir-framework/git`, like `miroir-ai`), so a server or Electron build without the switch does not even ship it.

With the switch off, nothing Git-related loads in any case.

➡️ Option 3: own package, client chunk on page open, server `import()` on first action. A bundle-policy entry (`bundle-policy.json`) checks that the main chunk does not grow.

❓ **Q6 - How does the UI call Git?**

1. As Miroir actions: a new family `gitAction_status`, `gitAction_log`, `gitAction_commit`, … declared in the core ML schema and run through `DomainController`, like `storeManagementAction_*`. MCP and the action runner get them with no extra work, and the capability check is the usual one.
2. As dedicated REST routes (`/git/...`) outside the action model, with their own client calls in the server, Electron IPC and `RestClientStub`.
3. As Endpoint instances of an application (`miroir-app-git`?), like the HTTP-backed Endpoints of #267.

➡️ Option 1. The schema part is small and stays in core; the implementation is in the lazy package (Q5). Option 2 duplicates the three transports.

❓ **Q7 - What happens to Miroir's own uncommitted edits?**

When the local cache holds a Miroir transaction not yet committed to the store, the files on disk are behind what the user sees.

1. A Git commit (and checkout, pull) refuses while a Miroir transaction is open, and says so.
2. A Git commit first runs the Miroir commit, then stages and commits.
3. Ignore it: Git sees the disk, and the user is told nothing.

➡️ Option 1 for checkout / pull / branch switch, which would otherwise lose the edits. For a Git commit, option 2 behind an explicit "Commit Miroir changes first" button on the refusal.

❓ **Q8 - How does Miroir reload after a checkout or a pull changes the files?**

1. The Git action ends by reloading the deployment from its store (same path as `loadConfigurationFromPersistenceStore` / `resetModel`), then refreshes the UI's local cache. The user stays on the page.
2. The UI asks the user to reload the whole page.
3. A file watcher on the section folders reloads on any outside change, Git or not.

➡️ Option 1. Option 3 would also cover edits made outside Miroir, but it is a separate feature.

❓ **Q9 - What does "view the change tree of the repo" mean to you?**

1. The commit graph: commits with their branches and merges, as `git log --graph` draws it.
2. The working tree changes: modified, added and deleted files, staged or not, with their diffs.
3. Both, on one page.

➡️ Option 3: a history panel (graph, click a commit to see its files) and a changes panel (stage / unstage / commit).

❓ **Q10 - How are file changes shown?**

1. Raw: file paths and a text diff of the JSON.
2. Named: each file mapped to its Entity and instance (`library_model/<entity uuid>/<instance uuid>.json` shown as "Entity Book, instance Author.name"), with the JSON diff below.
3. Semantic: a field-by-field diff of the instance, as the model editors present it.

➡️ Option 2. The path-to-instance mapping is cheap and makes the list readable; option 3 can reuse `json-diff` (already a server dependency) in a later issue.

❓ **Q11 - Which checkouts are allowed?**

1. Branches only.
2. Branches, tags and any commit (detached HEAD, shown with a banner and a "back to branch" action).
3. Option 2, plus "restore one file / one instance from commit X" without moving HEAD.

What happens to local changes: refuse when the work tree has changes in the files the checkout would touch (no stash in this issue).

➡️ Option 2. Option 3 is useful but is closer to ApplicationVersion-style rollback; keep it out.

❓ **Q12 - How far do push and pull go?**

1. Push and pull on the current branch's upstream only; pull is fast-forward only and refuses on divergence ("resolve outside Miroir"). Push of a branch without upstream sets it on `origin`. No remote management.
2. Option 1 plus fetch, choice of remote, and adding a remote from the UI.
3. Option 2 plus merge pulls with a conflict view.

➡️ Option 1, plus a "fetch" button so the history shows ahead / behind counts. Merges and conflicts belong to a later issue.

❓ **Q13 - Who may run Git actions when authentication is on?**

1. Anyone with the `designerTools` right.
2. A new `MiroirRight` (`versionControl`), separate from designer tools.
3. Read actions (status, log, diff) with `designerTools`; write actions (commit, checkout, branch, push, pull) with a new `versionControl` right.

➡️ Option 1 for now. Without authentication (the usual local case) everyone can, as for designer tools.

❓ **Q14 - How much should the design prepare for ApplicationVersion-based versioning?**

1. Nothing: Git actions are Git actions, named so; ApplicationVersion gets its own design later.
2. A generic `versionControl` port (status, history, commit, branch, checkout, sync) with Git as the first implementation, so an ApplicationVersion backend could plug in under the same UI.
3. Option 1, plus a written note in the analysis on the two futures you named (ApplicationVersion graph stored in Git, or replacing Git), and which choices here would block either.

➡️ Option 3. Git's model (files, branches, detached HEAD) and an ApplicationVersion graph (Entities, snapshots, migrations) are unlikely to share an interface that fits both; guessing it now would bend the Git design.
