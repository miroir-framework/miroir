# 691 — Arrange the Git page around what the user is doing

> The Git page of #679 shows every panel at once. This analysis splits it into activities (Changes,
> Branches, Setup), keeps the branch and its remote always on screen, folds the history, and adds a
> revert of unstaged edits.

Related issue: https://github.com/miroir-framework/miroir/issues/691
Parent issue: [#679](https://github.com/miroir-framework/miroir/issues/679) · Prerequisites: #680, #681, #682, #683 ✅ (merged)
Related analyses: [`../679-FEATURE-git-version-control/analysis.md`](../679-FEATURE-git-version-control/analysis.md) (decisions D1 to D23, cited here as #679-Dn)
Key sources: [`GitPageView.tsx`](../../../packages/miroir-react/src/components/Git/GitPageView.tsx), [`GitWritePanels.tsx`](../../../packages/miroir-react/src/components/Git/GitWritePanels.tsx), [`GitRemotePanel.tsx`](../../../packages/miroir-react/src/components/Git/GitRemotePanel.tsx), [`GitClonePanel.tsx`](../../../packages/miroir-react/src/components/Git/GitClonePanel.tsx), [`routes/GitPage.tsx`](../../../packages/miroir-react/src/routes/GitPage.tsx), [`GitActions.ts`](../../../packages/miroir-core/src/3_controllers/GitActions.ts)

**Status:** decisions confirmed with the user (grilling of 2026-11-05); goals to be confirmed.

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
- Reverting staged content, or a commit (`git revert`, reset): later, unscheduled. Unstaging stays the way to take a file out of the index.
- Merge, rebase, stash, conflict resolution: excluded by #679, unchanged.
- New Git page features unrelated to layout: owned by #679's other sub-issues and their bugs (#689, #690).
- A per-user preference saved in Admin for the default activity: rejected in D1, may come later.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Switching activity | **tabs Changes / Branches / Setup, the tab in the URL (`&view=`)** | G1, G2, G4, G6 |
| D2 Fetch, Pull, Push | **in the always-visible header, next to the remote** | G3 |
| D3 What revert does | **drops unstaged edits only: the file goes back to its staged content, or to HEAD when nothing is staged; an unstaged new file is deleted** | G1 |
| D4 Revert granularity | **per file, plus "Revert all"** | G1 |
| D5 History when folded | **a strip under the active tab with the last commit, unfolding in place** | G5 |
| D6 Clone panel | **in Setup; also shown when no application is selected** | G4 |
| D7 Long branch lists | **local branches first; remote branches and tags folded behind a filter field** | G2 |
| D8 Diff placement | **beside the file list on wide screens, below it on narrow ones** | G1 |
| D9 Revert safety | **refused while the application has unsaved Miroir changes (#679-D7); a confirmation lists the files; the application reloads after it (#679-D8)** | G1 |

**Rationale:** the user works in one activity at a time (issue #691). The only thing every activity needs is to know which branch and which remote they are on, so that is the header. Everything else moves into the activity that uses it, or folds.

### D1 — How the user switches activity

**Status:** Accepted, D1-a. **Serves:** G1, G2, G4, G6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Tabs** ★ | Changes (default), Branches, Setup; `&view=changes\|branches\|setup` in the URL | one activity on screen; a link opens a view; testable by URL | one click to change activity |
| D1-b. Folding sections | the four panels fold, several open | flexible | the user still arranges the page; no single "current activity" |
| D1-c. Mode saved per user | a preference row in Admin | remembered across sessions | needs a new Admin attribute; a link cannot set it |

**Decision:** D1-a. Without `view`, the page opens on Changes. A repository that does not exist yet shows the "Create a Git repository" offer whatever the tab (today's `git-no-repository` box).

### D2 — Where Fetch, Pull and Push live

**Status:** Accepted, D2-a. **Serves:** G3.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Header** ★ | daily actions next to what they act on; reachable from every tab | the header grows by three buttons |
| D2-b. Branches tab | near checkout | hidden while committing, when push is most often wanted |
| D2-c. Setup tab | all remote things together | push becomes a setup action |

**Decision:** D2-a. The header shows the branch chip (or the detached HEAD), `remote: URL`, "n to push", "n to pull", Fetch, Pull, Push, and Refresh. Setting the remote URL moves to Setup. When Fetch, Pull or Push is refused for want of a token, the credential form opens under the header, where the action was started.

### D3 — What revert does to a file

**Status:** Accepted, D3-a (user's choice, against the recommended D3-b). **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Unstaged edits only** ★ | the work-tree file is rewritten with its index content; a file absent from the index (an untracked new file) is deleted; a file deleted from the work tree but in the index comes back | staged work is never lost; matches `git restore <path>` | a fully staged file has nothing to revert: "Revert" is not offered for it |
| D3-b. Back to HEAD | index and work tree both reset; a new file is deleted | one action undoes everything | drops staged work too; `git restore --staged --worktree` semantics |

**Decision:** D3-a. Truth table, per file of the application (`inApplication`):

| `staged` | `unstaged` | `change` | Revert |
|---|---|---|---|
| false | true | modified / deleted | the file takes its HEAD content back (the index equals HEAD) |
| false | true | added | the file is deleted (untracked) |
| true | true | any | the file takes its staged content back; it stays staged |
| true | false | any | not offered: nothing unstaged |

### D4 — Revert granularity

**Status:** Accepted, D4-a. **Serves:** G1. Options were per file plus "Revert all" (★), a multi-file selection (the checkboxes already toggle staging, so a second selection model would be needed), and per hunk (excluded, see Non-goals). "Revert all" covers every file with unstaged edits in the application's folders, as "Stage all" does (#679-D2).

### D5 — History when folded

**Status:** Accepted, D5-a. **Serves:** G5. A strip under the active tab shows the last commit (short oid, first line, author, date, refs). Unfolding shows today's commit list in place; choosing a commit shows its files and their diff, as today. Options rejected: a side drawer (covers the activity) and a History tab (history is wanted while committing or checking out).

### D6 — Clone panel

**Status:** Accepted, D6-a. **Serves:** G4. The Clone panel moves into Setup. It does not depend on the selected application (its actions run on Admin, `routes/GitPage.tsx` `GitCloneSection`), so the page also shows it when no application is selected, under the application selector. Rejected: keeping it folded above the selector (it stays out of place on every visit).

### D7 — Long branch lists

**Status:** Accepted. **Serves:** G2. Local branches are listed first, unfolded. Remote branches and tags are folded under "Remote branches (n)" and "Tags (n)", with one filter field that narrows both by name. The user's repository lists about 40 remote branches (screenshot of 2026-11-05).

### D8 — Diff placement

**Status:** Accepted. **Serves:** G1. In Changes and in the unfolded history, the diff of the selected file sits to the right of the list when the page is wide, and below it when narrow (one flex row that wraps). Today the diff panel comes after every panel (`GitPageView`, after `CommitFilesPanel`).

### D9 — Revert safety

**Status:** Accepted. **Serves:** G1. Revert rewrites deployment files, as a checkout does, so:
- it is refused with `openMiroirTransaction` while the application has unsaved Miroir changes. The check is application-scoped, like a commit's (`openMiroirTransactionError` in `GitActions.ts`), because only the application's files are reverted;
- the page asks for confirmation and lists the files and what happens to each one (back to the staged or HEAD content, or deleted);
- the touched deployment reloads afterwards, through `touchedDeployments` and `reloadTouchedDeployments` (#679-D8), and a reload failure shows the existing `git-reload-warning`.

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

`ui.gitPage` (MiroirTest c98e8263-fdc0-453e-b516-9e8ef5021776) has 27 cases: 21 in the `GitPage` suite, 6 in `GitClonePanel`. They find elements by testid (`git-changes`, `git-branch-*`, `git-remote`, `git-history`, ...) and assume every panel is on screen. Cases about branches, the remote and history will need to open their tab or unfold the history first.

## 5. Key reuse

| Piece | Location |
|-------|----------|
| Panels to move, unchanged inside | `ChangeList`, `CommitList`, `CommitFilesPanel`, `DiffPanel` (`GitPageView.tsx`); `GitBranchList`, `GitCommitForm`, `GitDetachedBanner`, `GitCommandError` (`GitWritePanels.tsx`); `GitRemotePanel`; `GitClonePanel` |
| Command runner and refresh | `useGitCommand`, `useGitRequest` |
| Unsaved-changes refusal | `openMiroirTransactionError`, `GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES` (`GitAction.ts`) |
| Reload after file changes | `touchedDeployments`, `rebootTouchedStores` (`GitActions.ts`), `reloadTouchedDeployments` (`DomainController.ts`) |
| Repository lock | `withRepositoryLock` (`GitActions.ts`) |
| URL parameters | `useSearchParams` in `routes/GitPage.tsx` (already reads `application`) |
| Git Endpoint | uuid `a7f243cb-9345-425a-918d-4e433a94f4bf` (#679), its JSON regenerated with each new action |

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Header component (`GitHeader`) built from `GitRemotePanel`'s remote line and buttons; `GitRemotePanel` keeps only "set the URL" | high | low | adopt |
| 2 | `gitAction_revert { paths?, all? }` on the server, with a port method `restore(paths)` that writes each file from the index, or deletes it when absent from the index | high | medium | adopt |
| 3 | Tabs with MUI `Tabs`, the value read from and written to `view` in the URL | high | low | adopt |
| 4 | Revert in the client only, by writing files through the store | — | — | reject: the client has no file access, and #679-D6 routes every Git action through the server |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md), to be written once the goals are confirmed (skill `miroir-analysis-to-tdd-plan`).
