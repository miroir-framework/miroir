# 691 — Arrange the Git page around what the user is doing

> The Git page of #679 shows every panel at once. This analysis splits it into activities (Changes,
> Branches, Setup), keeps the branch and its remote always on screen, folds the history, and adds a
> revert of unstaged edits.

Related issue: https://github.com/miroir-framework/miroir/issues/691
Parent issue: [#679](https://github.com/miroir-framework/miroir/issues/679) · Prerequisites: #680, #681, #682, #683 ✅ (merged)
Related analyses: [`../679-FEATURE-git-version-control/analysis.md`](../679-FEATURE-git-version-control/analysis.md) (decisions D1 to D23, cited here as #679-Dn)
Key sources: [`GitPageView.tsx`](../../../packages/miroir-react/src/components/Git/GitPageView.tsx), [`GitWritePanels.tsx`](../../../packages/miroir-react/src/components/Git/GitWritePanels.tsx), [`GitRemotePanel.tsx`](../../../packages/miroir-react/src/components/Git/GitRemotePanel.tsx), [`GitClonePanel.tsx`](../../../packages/miroir-react/src/components/Git/GitClonePanel.tsx), [`routes/GitPage.tsx`](../../../packages/miroir-react/src/routes/GitPage.tsx), [`GitActions.ts`](../../../packages/miroir-core/src/3_controllers/GitActions.ts)

**Status:** goals and decisions confirmed with the user (2026-11-05); revised after an adversarial review (D3 table, D9 scope, D10, sections 4.3 and 6).

---

## 1. Goals

- **G1 — Work on my changes.** In order to save and undo my design work as an application designer, I can see the files I changed, read their diffs, stage and commit them, and revert the unstaged edits of one file or of all of them, without the rest of the page in the way.
- **G2 — Move between branches.** In order to explore, test or integrate as an application designer, I can see my local branches first, find a remote branch or tag by name, check one out and create a branch.
- **G3 — Know where I push.** In order not to push to the wrong place as an application designer, I always see the current branch, the remote it follows with its URL, and how many commits are to push and to pull, and I can fetch, pull and push from there.
- **G4 — Set up a repository.** In order to start working on an application as an application designer, I can set the remote of the repository and clone an application from Git in one place, which I can also reach before choosing an application.
- **G5 — Look back when needed.** In order to keep the page compact as an application designer, I see the last commit, and unfold the history and the files of a commit only when I need them.
- **G6 — Share a view.** In order to point a colleague at a view as an application designer, I can open the Git page on a given activity from a link.

## 2. Non-goals

- Reverting part of a file (a hunk or a line): later, unscheduled.
- Reverting staged content: a goal of a later stage (user, 2026-11-05). D3 keeps it open: a revert that also resets the index (D3-b) can be added without changing what this issue's revert does. Until then, unstaging is the way to take a file out of the index.
- Reverting a commit (`git revert`) or resetting a branch: later, unscheduled.
- Merge, rebase, stash, conflict resolution: excluded by #679, unchanged.
- New Git page features unrelated to layout. The fixes #689 (linked worktrees) and #690 (CRLF) are merged and unchanged here.
- A per-user preference saved in Admin for the default activity: rejected in D1, may come later.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Switching activity | **tabs Changes / Branches / Setup, the tab in the URL (`&view=`)** | G1, G2, G4, G6 |
| D2 Fetch, Pull, Push | **in the always-visible header, next to the remote** | G3 |
| D3 What revert does | **drops unstaged edits only: the work-tree file is made equal to the index, so it takes the index content back, or is deleted when the index has no entry for it** | G1 |
| D4 Revert granularity | **per file, plus "Revert all"** | G1 |
| D5 History when folded | **a strip under the active tab with the last commit, unfolding in place** | G5 |
| D6 Clone panel | **in Setup; also shown when no application is selected** | G4 |
| D7 Long branch lists | **local branches first; remote branches and tags folded behind a filter field** | G2 |
| D8 Diff placement | **beside the file list on wide screens, below it on narrow ones** | G1 |
| D9 Revert safety | **paths checked on the server as for staging; refused while the application has unsaved Miroir changes (#679-D7); only the application's own deployment reloads; a confirmation lists each file and what happens to it** | G1 |
| D10 Page structure | **`GitPageView` takes the activity and a Setup slot as props; the route owns the URL and the Admin-bound Clone panel** | G4, G6 |

**Rationale:** the user works in one activity at a time (issue #691). The only thing every activity needs is to know which branch and which remote they are on, so that is the header. Everything else moves into the activity that uses it, or folds.

### D1 — How the user switches activity

**Status:** Accepted, D1-a. **Serves:** G1, G2, G4, G6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Tabs** ★ | Changes (default), Branches, Setup; `&view=changes\|branches\|setup` in the URL | one activity on screen; a link opens a view; testable by URL | one click to change activity |
| D1-b. Folding sections | the four panels fold, several open | flexible | the user still arranges the page; no single "current activity" |
| D1-c. Mode saved per user | a preference row in Admin | remembered across sessions | needs a new Admin attribute; a link cannot set it |

**Decision:** D1-a. Without `view`, or with an unknown value, the page opens on Changes. When the application's files are in no repository (`notARepository`), Changes and Branches show today's "Create a Git repository" box (`git-no-repository`) and Setup still shows the Clone panel. The route reads and writes `view` (D10).

### D2 — Where Fetch, Pull and Push live

**Status:** Accepted, D2-a. **Serves:** G3.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Header** ★ | daily actions next to what they act on; reachable from every tab | the header grows by three buttons |
| D2-b. Branches tab | near checkout | hidden while committing, when push is most often wanted |
| D2-c. Setup tab | all remote things together | push becomes a setup action |

**Decision:** D2-a. The header shows the title, the branch chip (or the detached HEAD), the repository root (`git-root`), `remote: URL`, "n to push", "n to pull", Fetch, Pull, Push, and Refresh. Per state:

| State | Header shows |
|---|---|
| status loading or failed | the title and Refresh; the error under the header |
| `notARepository` | the title and Refresh |
| no remote | "No remote" and a link to the Setup tab (today `git-no-remote` says to give a URL in the same panel) |
| remote, no upstream | the remote line; Push, which sets the upstream (today `git-no-upstream`) |
| remote and upstream | the remote line, ahead / behind, Fetch, Pull, Push |

The detached-HEAD banner (`GitDetachedBanner` with its "back to" button) and `git-reload-warning` sit under the header, above the tabs: they concern every activity. `GitRemotePanel` has one `error` state for Set and for Fetch / Pull / Push (`GitRemotePanel.tsx`); it is split in two, the remote-action error and `git-credential-notice` under the header, the set-URL error in Setup. Setting the remote URL moves to Setup. When Fetch, Pull or Push is refused for want of a token, the credential form opens under the header, where the action was started.

### D3 — What revert does to a file

**Status:** Accepted, D3-a (user's choice, against the recommended D3-b). **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Unstaged edits only** ★ | the work-tree file is made equal to the index: rewritten with its index content, re-created when the index has it and the work tree does not, deleted when the index has no entry for it | staged work is never lost; `git restore <path>` for tracked files, plus `git clean` of an untracked file | a fully staged file has nothing to revert: "Revert" is not offered for it |
| D3-b. Back to HEAD | index and work tree both reset; a new file is deleted | one action undoes everything | drops staged work too; `git restore --staged --worktree` semantics |

**Decision:** D3-a. D3-b is deferred, not rejected: reverting staged content is a later goal (see Non-goals). Truth table over the rows of isomorphic-git's `statusMatrix` (`[head, workdir, stage]`), with the flags `statusFromMatrixRow` (`miroir-git-isomorphic/src/index.ts`) derives from them. Revert is offered when `unstaged` is true and the file is `inApplication`; what it does depends on whether the index has an entry (`stage` ≠ 0):

| Row | `change` | `staged` | `unstaged` | Case | Revert |
|---|---|---|---|---|---|
| `[0,2,0]` | added | false | true | new file, not staged | **deleted** |
| `[0,2,2]` | added | true | false | new file, staged | not offered |
| `[0,2,3]` | added | true | true | staged, then edited | **rewritten** with the staged content |
| `[0,0,3]` | added | true | true | staged, then deleted from the work tree | **re-created** with the staged content |
| `[1,2,1]` | modified | false | true | edited | **rewritten** with HEAD's content (the index equals HEAD) |
| `[1,2,2]` | modified | true | false | edited and staged | not offered |
| `[1,2,3]`, `[1,1,3]` | modified | true | true | staged, then edited again | **rewritten** with the staged content |
| `[1,0,1]` | deleted | false | true | deleted from the work tree | **re-created** with HEAD's content |
| `[1,0,0]` | deleted | true | false | deletion staged | not offered |
| `[1,0,3]` | deleted | true | true | staged, then deleted from the work tree | **re-created** with the staged content |
| `[1,1,0]`, `[1,2,0]` | deleted | true | true | removed from the index, file kept (`git rm --cached`) | **deleted**: the index has no entry |

- A file with `inApplication` false is refused with `pathOutsideApplication`, as for staging.
- Ignored files are not in `statusMatrix`, so they are never listed and never deleted.
- The confirmation names each file with what happens to it (rewritten, re-created, deleted).

### D4 — Revert granularity

**Status:** Accepted, D4-a. **Serves:** G1. Options were per file plus "Revert all" (★), a multi-file selection (the checkboxes already toggle staging, so a second selection model would be needed), and per hunk (excluded, see Non-goals). "Revert all" covers every file with unstaged edits in the application's folders, as "Stage all" does (#679-D2).

### D5 — History when folded

**Status:** Accepted, D5-a. **Serves:** G5. A strip under the active tab shows the last commit (short oid, first line, author, date, refs). Unfolding shows today's commit list in place; choosing a commit shows its files and their diff, as today. Options rejected: a side drawer (covers the activity) and a History tab (history is wanted while committing or checking out).

### D6 — Clone panel

**Status:** Accepted, D6-a. **Serves:** G4. The Clone panel moves into Setup. It does not depend on the selected application (its actions run on Admin, `routes/GitPage.tsx` `GitCloneSection`), so the page also shows it when no application is selected, under the application selector, without tabs. With `git` off, the page shows only the `git-unavailable` notice, the Clone panel included (today `GitCloneSection` renders even then, and its actions return `FeatureUnavailable`). Rejected: keeping it folded above the selector (it stays out of place on every visit).

### D7 — Long branch lists

**Status:** Accepted. **Serves:** G2. Local branches are listed first, unfolded. Remote branches and tags are folded under "Remote branches (n)" and "Tags (n)", with one filter field that narrows both by name. The user's repository lists about 40 remote branches (screenshot of 2026-11-05).

### D8 — Diff placement

**Status:** Accepted. **Serves:** G1. In Changes and in the unfolded history, the diff of the selected file sits to the right of the list when the page is wide, and below it when narrow (one flex row that wraps). Today the diff panel comes after every panel (`GitPageView`, after `CommitFilesPanel`), and one `Selection` serves both the changes and the history. It splits in two: the Changes tab keeps its selected change and shows its diff; the unfolded history keeps its selected commit and file, and shows that diff beside the commit's files. Switching tab keeps both.

### D9 — Revert safety

**Status:** Accepted. **Serves:** G1. Revert rewrites deployment files, as a checkout does, so:
- **Paths.** The server picks the files with `pathsToStage(opened, payload, (file) => file.unstaged)` (`GitActions.ts`), the function of `gitAction_stage`. It refuses a path that is not a file of the application's sections (`isApplicationRepositoryPath`: no `..`, no absolute path, no `.git`) and a path that has not changed. A write or a delete goes through the work-tree containment check that `stage` uses (`workTreeFile` in `miroir-git-isomorphic`); a re-created file has its parent folder's real path checked, so a symbolic link cannot lead it out of the work tree.
- **Unsaved changes.** It is refused with `openMiroirTransaction` while the application has unsaved Miroir changes. The check is application-scoped, like a commit's (`openMiroirTransactionError`, `GitActions.ts`).
- **Reload.** That scope holds only if the reload is scoped the same way. `touchedDeployments` (`GitActions.ts`) returns every deployment with a section folder in the repository, and `reloadTouchedDeployments` (`DomainController.ts`) rolls back each of them, which would drop other applications' unsaved changes. Revert therefore reports only the action's own deployment as touched, for `rebootTouchedStores` and for the reload; it writes no file of another deployment.
- **Lock.** It runs under the repository lock, like every deployment action (`withRepositoryLock` in `runGitAction`).
- **Confirmation.** The page lists the files and what happens to each one (D3), and a reload failure shows the existing `git-reload-warning`.

### D10 — Page structure

**Status:** Accepted (follows from D1 and D6). **Serves:** G4, G6. `GitPageView` (in `@miroir-framework/react`) gets the activity as props, `view` and `onViewChange`, and the Setup extra content as a `setupExtras` node. The route `routes/GitPage.tsx` reads and writes `view` with `useSearchParams` (it already reads `application`), and passes the Clone panel bound to the Admin runner (`GitCloneSection`) as `setupExtras`: `GitPageView`'s `runGitAction` is bound to the selected application. The component tests drive the activity through the fixture's props.

---

## 4. Current state

### 4.1 Page layout (misaligned)

`GitPage` ([`routes/GitPage.tsx`](../../../packages/miroir-react/src/routes/GitPage.tsx)) renders, in order: `GitCloneSection` (the Clone panel, always), the application selector, then `GitPageForApplication`, which renders `GitPageView`.

`GitPageView` ([`GitPageView.tsx`](../../../packages/miroir-react/src/components/Git/GitPageView.tsx), function `GitPageView`) renders a title row (`{applicationName}: Git`, the branch chip `git-current-branch`, Refresh), the repository root (`git-root`), the detached-HEAD banner, then one wrapping flex row of four `Panel`s of `flex: "1 1 360px"`:

| Panel | testid | Content |
|---|---|---|
| Changes | `git-changes` | `ChangeList`, "Stage all", `GitCommitForm` |
| Branches | `git-branches` | `GitBranchList`: local branches, then every remote branch and tag, each with Check out; create a branch |
| Remote | `git-remote` | `GitRemotePanel`: `remote: URL`, ahead / behind, Fetch / Pull / Push, set the URL, the credential form |
| History | `git-history` | `CommitList`, up to 200 commits (`depth ?? 200` in `GitActions.ts`) |

Below the row: `CommitFilesPanel` when a commit is selected, then `DiffPanel` when a file is selected. Every panel is always rendered; nothing folds.

### 4.2 Git actions (revert missing)

`GIT_ACTION_TYPES` ([`GitAction.ts`](../../../packages/miroir-core/src/0_interfaces/3_controllers/GitAction.ts)) has 18 actions: status, log, commitFiles, diff, init, stage, unstage, commit, createBranch, deleteBranch, checkout, setRemote, fetch, pull, push, setCredential, clone, installClonedDeployment. None discards a change. `GitRepositoryInterface` has `readFile(path, ref?)`, `stage`, `unstage`, `checkout(ref)`, but no way to write a file back from the index.

`GitFileStatus` already gives what D3's truth table needs: `change`, `staged` (index differs from HEAD), `unstaged` (work tree differs from the index), and `GitStatusResult.files[].inApplication`.

### 4.3 Tests

`ui.gitPage` (MiroirTest c98e8263-fdc0-453e-b516-9e8ef5021776) has 27 cases: 21 in the `GitPage` suite (fixture `gitPageForTest`), 6 in `GitClonePanel` (fixture `gitClonePanelForTest`, which renders the panel alone and is unaffected). The panel testids are barely used: `git-remote` by no case, `git-changes` and `git-history` only in "shows nothing else while git is off", as absent elements. What the layout changes:

| Case | Needs |
|---|---|
| lists the commits with their refs; shows the files of a commit and their diff; checks out a commit as a detached HEAD; fetches, then pulls the commits of the upstream | the history unfolded |
| creates a branch and checks it out; explains a checkout refused by uncommitted changes; asks before deleting a branch with commits of its own | the Branches tab |
| sets the remote of a repository with none, refusing SSH | the Setup tab |
| lists the changes, named by Entity and instance | `git-root` stays (D2 header) |
| the other remote cases (remote and ahead / behind, push, diverged pull, token asked, token not saved) | nothing: the header shows them |

If the history strip shows the last commit with the `git-commit-<oid>` testid of the list, that testid appears twice once unfolded: the strip gets its own testid.

## 5. Key reuse

| Piece | Location |
|-------|----------|
| Panels moved as they are | `CommitList`, `CommitFilesPanel`, `DiffPanel` (`GitPageView.tsx`); `GitCommitForm`, `GitDetachedBanner`, `GitCommandError` (`GitWritePanels.tsx`); `GitClonePanel` |
| Panels moved and changed | `ChangeList` (a Revert per file, D4), `GitBranchList` (folding and filter, D7), `GitRemotePanel` (split between header and Setup, D2) |
| Command runner and refresh | `useGitCommand`, `useGitRequest` |
| Unsaved-changes refusal | `openMiroirTransactionError` (`GitActions.ts`), `GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES` (`GitAction.ts`) |
| Path checks | `pathsToStage`, `isApplicationRepositoryPath` (`GitActions.ts`); `workTreeFile` (`miroir-git-isomorphic`) |
| Reload after file changes | `touchedDeployments`, `rebootTouchedStores` (`GitActions.ts`), `reloadTouchedDeployments` (`DomainController.ts`) |
| Repository lock | `withRepositoryLock` (`GitActions.ts`) |
| URL parameters | `useSearchParams` in `routes/GitPage.tsx` (already reads `application`) |
| Git Endpoint | uuid `a7f243cb-9345-425a-918d-4e433a94f4bf` (#679): its JSON lists each action by hand (18 today); `miroir-app-miroir` is rebuilt after an edit |

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Header component (`GitHeader`) built from `GitRemotePanel`'s remote line and buttons; `GitRemotePanel` keeps only "set the URL" | high | low | adopt |
| 2 | `gitAction_revert { paths?, all? }` on the server, with a port method `restoreFromIndex(paths)` (below) | high | medium | adopt |
| 3 | Tabs with MUI `Tabs`, the value read from and written to `view` in the URL | high | low | adopt |
| 4 | Revert in the client only, by writing files through the store | — | — | reject: the client has no file access, and #679-D6 routes every Git action through the server |

### 6.1 Writing a file from the index

`GitRepositoryInterface.readFile(path, ref?)` reads the work tree or a commit, not the index, and `git.checkout({ filepaths, force })` writes from a commit and resets those index entries, which would drop staged content (the `[*,*,3]` rows of D3). The port method `restoreFromIndex(paths)` therefore:
- walks the index with `git.walk({ trees: [STAGE()] })` for the paths, and reads each entry's blob with `git.readBlob({ oid })`;
- writes the blob bytes as they are, with the index mode: executable for `0o100755`, and refuses `0o120000` (a symbolic link) with `symbolicLink`, as clone does;
- deletes the work-tree file when the index has no entry for it.

Line endings: the blob holds what the repository stores, LF for text in this repository. #690 normalizes CRLF to LF when comparing, so a written file shows as unchanged. Native Git with `core.autocrlf=true` would write CRLF; Miroir does not read that setting (#690) and writes the blob bytes.

### 6.2 What a new Git action must be added to

| Place | Change |
|---|---|
| `GIT_ACTION_TYPES` (`GitAction.ts`) | add `gitAction_revert` |
| `GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES` (`GitAction.ts`) and `gitPendingChanges.unit.test.ts` | add it; a case for it |
| `GIT_ACTIONS_KEEPING_FILES` (`GitAction.ts`) | leave it out: the server forgets the model environments after a revert (`RestServer.ts`) |
| Git Endpoint JSON `a7f243cb-…` | a hand-written entry with its payload schema; rebuild `miroir-app-miroir` |
| `fn.blockModel` action palette (MiroirTest `0161aae9-…`) and `ActionImplementations.unit.test.ts` | the list of action types |
| `gitPageForTest` fixture (`miroir-react-testing`) | a `gitAction_revert` result |
| `docs/guides/version-control-with-git.md` | the panel table and "Clone panel at the top" are rewritten for the tabs |
| automatic, no change | `SERVER_ROUTED_MIROIR_ACTION_TYPES`, `DESIGNER_ONLY_ACTION_TYPES`, `handleAction_*` follow `GIT_ACTION_TYPES` |

No new dependency: MUI `Tabs` is part of `@mui/material`, already in the bundle.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md), to be written once the goals are confirmed (skill `miroir-analysis-to-tdd-plan`).
