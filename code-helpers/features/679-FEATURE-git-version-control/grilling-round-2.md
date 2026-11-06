# Git version control from the UI: grilling round 2

## Settled in round 1

All recommendations kept, except Q3, changed as follows:

- **Q3.** An adapter interface, cleanly segregated per the layering rules, with `isomorphic-git` as its first (and for now only) implementation. Git credentials are stored as `MiroirSecret` rows in Admin. A user can **clone a remote repository from the Miroir UI** without Git installed locally.

The rest, as recommended: Q1 discover the enclosing work tree (offer `git init` when none); Q2 history repo-wide, changes and "stage all" filtered to the application's folders with a "show other changes" toggle; Q4 process capability `features.git`, default off; Q5 own package, client chunk on page open, server `import()` on first action, bundle-policy check; Q6 Miroir actions `gitAction_*` through `DomainController`; Q7 checkout / pull / branch switch refuse while a Miroir transaction is open, Git commit offers "Commit Miroir changes first"; Q8 reload the deployment from its store after a checkout or pull; Q9 history graph plus changes panel; Q10 files named by Entity and instance, JSON diff; Q11 branches, tags, commits (detached HEAD with banner), refuse on conflicting local changes, no stash; Q12 push / pull on upstream, fast-forward only, plus fetch; Q13 `designerTools` right; Q14 Git-specific design plus a note on the two ApplicationVersion futures.

## Facts checked for this round

- **isomorphic-git transports and config.** It speaks HTTP(S) only: no SSH, and no `file://` remotes. Authentication goes through an `onAuth` callback returning `{ username, password }` (a personal access token goes in `password`, or in `username` for some hosts). It reads the repository's `.git/config` but not the user's global `~/.gitconfig`, so `user.name` / `user.email` are unknown unless set in the repo or passed on each commit. It runs no Git hooks. `statusMatrix` takes a `filepaths` filter, which matters when the work tree is the Miroir monorepo (Q2's filter keeps status fast; "show other changes" scans the whole tree on demand).
- **Secrets.** `MiroirSecret` (Admin, `a96856df`) holds `name`, one encrypted `ciphertext` string, and an optional `miroirUser` (absent means process-scoped). Rows are written through the `secrets.set` action and never returned to clients. Endpoints refer to secrets by name.
- **What a deployable package looks like.** `packages/miroir-example-library/assets/` holds `deployment/<deployment uuid>.json` (a `Deployment` row whose `configuration` gives each section's `filesystem` directory), `library_model/` (including the `SelfApplication` row) and `library_data/`. The Install Application runner (`Runner_InstallApplication.tsx`) installs from an application bundle, not from a folder.
- **Layering.** Store implementations follow the pattern: an interface in `miroir-core/src/0_interfaces/4-services/`, an implementation in its own package (`miroir-store-*`), a factory registered at startup (`registerStoreOnDemand` in Electron).

All questions below are independent of each other.

---

❓ **Q1 - Where do the interface and the implementation live?**

1. Interface `GitRepositoryInterface` (open, init, clone, status, log, diff, stage, commit, branch, checkout, fetch, pull, push) in `miroir-core/src/0_interfaces/4-services/`. Implementation in a new package `packages/miroir-git-isomorphic` (`@miroir-framework/git-isomorphic`), layer 4, the only package that imports `isomorphic-git`. The server and Electron register it as a factory on demand, as stores are. `DomainController` handles `gitAction_*` against the interface only.
2. Same interface, implementation in `miroir-server` (and duplicated in Electron).
3. Interface and implementation both in a new `@miroir-framework/git` package, core knowing nothing about Git beyond the action schema.

➡️ Option 1. Same shape as the stores, one implementation for server, Electron and the in-process emulated server, and core never imports `isomorphic-git`. The interface speaks in repository terms (paths, refs, commits); mapping files to Entities and instances (round 1 Q10) is done above it, in core layer 2.

❓ **Q2 - What does a Git credential secret hold, and how is it found?**

A `MiroirSecret` has one encrypted string.

1. One secret per remote host, named by convention `git.<host>` (e.g. `git.github.com`); its value is JSON `{ "username": "...", "token": "..." }`. The adapter's `onAuth` looks it up by the remote URL's host.
2. One secret per repository: the Deployment row gets a new attribute `git: { credentialSecret: "<name>" }`.
3. Option 1 by default, option 2 as an override when a deployment needs a different account for the same host.

When authentication is on, the secret is the user's (`miroirUser` set), so each person pushes as themselves; without authentication it is process-scoped.

➡️ Option 1 now. Option 3's override is a small follow-up if two accounts on one host are ever needed.

❓ **Q3 - How does the user enter a credential?**

1. On the first push / pull / clone that gets a 401 / 403, a dialog asks for username and token, offers "Save as secret", and retries. Saving goes through `secrets.set`.
2. Only beforehand, on the Admin Secrets page; Git actions fail with "no credential for github.com" until then.
3. Both: the dialog, and the Secrets page shows and edits `git.*` secrets like any other.

➡️ Option 3. Public repositories need no credential, so clone of a public repo works with nothing set up.

❓ **Q4 - Who is the commit author?**

isomorphic-git does not read `~/.gitconfig`.

1. The logged-in `MiroirUser` (name, email) when authentication is on; otherwise the repo's `user.name` / `user.email` from `.git/config`; otherwise the commit form asks, with "remember for this repository" writing them to `.git/config`.
2. Always asked in the commit form, prefilled from the last commit.
3. A process-wide author in the environment file (`features.git: { author: {...} }`).

➡️ Option 1.

❓ **Q5 - What does "clone from the UI" produce?**

1. A clone only: the repository lands in a folder, and the user then attaches it to an application by hand.
2. Clone and install: Miroir clones into a folder, looks for a deployable package layout (`assets/deployment/*.json`, `*_model/` with a `SelfApplication` row, `*_data/`), registers the `Deployment` row in Admin with its section directories rewritten to the clone's folders, and opens the application. A repository with no such layout is refused after cloning, with the reason, and the folder is kept.
3. Option 2, and a repository with several deployments lists them and lets the user pick.

➡️ Option 3. It is option 2 plus a picker, and the Miroir monorepo itself (several deployments) is the first repository anyone will try.

❓ **Q6 - Where does a clone go?**

1. Under `filesystemDeploymentRootDirectory`, in a folder named after the repository (`<root>/<repo name>`), with the folder name editable in the clone form.
2. Any folder the user types.
3. A fixed `.miroir/<env>/clones/` folder.

➡️ Option 1. It keeps the clone inside a folder the server already writes to, and option 2's arbitrary paths would let a UI user write anywhere the server can.

❓ **Q7 - What happens with a repository whose remote is SSH?**

A repository cloned with the Git CLI often has `origin = git@github.com:owner/repo.git`, which isomorphic-git cannot use.

1. Status, log, commit, branch and checkout work (they are local); push, pull and fetch refuse with "SSH remotes are not supported, use an HTTPS URL".
2. Option 1, plus an action "use the HTTPS URL for this remote" that rewrites `origin` for known hosts (GitHub, GitLab, Bitbucket).
3. Option 1, plus a per-session HTTPS URL override that leaves `.git/config` alone.

➡️ Option 1 now. Rewriting a user's remote is a surprise; they can change it themselves, and the message says how.

❓ **Q8 - How are remote operations tested?**

isomorphic-git has no `file://` transport, so push, pull, fetch and clone need an HTTP Git server.

1. A small in-process HTTP Git server in the test helpers, started on a free port over a bare repo in a temp folder. `git-http-mock-server` (by the isomorphic-git authors) does this but calls the `git http-backend` binary, so CI needs Git installed (it is, on GitHub runners); local dev runs need it too.
2. A pure-JS HTTP Git server (e.g. `node-git-server` is also CLI-backed; a pure-JS one would have to be written on top of isomorphic-git's packfile code).
3. Local operations tested against real temp repos; remote operations tested only against a public GitHub repository, in a tagged suite run on demand.

Local operations (status, commit, branch, checkout, log, diff) are tested in every case against real temp repositories, with no mocking.

➡️ Option 1. Git being needed by the test suite is not the same as Git being needed by users, which is the requirement.

❓ **Q9 - Is the work split into several issues and PRs?**

1. One issue, one PR.
2. One issue, several PRs: (a) interface, isomorphic-git package, `features.git`, `gitAction_*` read actions (status, log, diff) and the page with history and changes; (b) stage, commit, branch, checkout and the reload of Q8; (c) credentials, fetch / pull / push; (d) clone and install.
3. A parent issue with four sub-issues matching (a) to (d), each with its own PR, all added to the "miroir-framework" GitHub Project.

➡️ Option 3. Each step is usable on its own, and (c) / (d) carry the riskier choices.
