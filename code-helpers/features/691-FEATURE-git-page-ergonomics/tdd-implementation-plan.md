# Issue #691 TDD implementation plan

> Vertical TDD slices (RED, then GREEN), integration-first per `docs/contributing/testing.md`.
> The layout slices run the real `GitPageView` and its request hooks through the MiroirTest component suite `ui.gitPage`, on the fixture `GitPageForTest`, which answers the Git actions from an in-memory repository. The revert slice runs `gitAction_revert` through the real `DomainController` (emulated server, filesystem store) on real temporary Git repositories, as the #679 Git tests do. No mocks.
> The tracer bullet (slice 1) proves the thinnest whole path of the new layout: a `view` given to the page opens that activity, the tabs switch it, and the existing cases keep passing once they open the right tab.
>
> **Execution model:** human in the loop. No slice contains a commit step; commits happen only when A asks. Each slice ends with its Validation commands; on success its Realization is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/691
Parent: [#679](https://github.com/miroir-framework/miroir/issues/679), plan [`../679-FEATURE-git-version-control/tdd-implementation-plan.md`](../679-FEATURE-git-version-control/tdd-implementation-plan.md) ✅
Working branch: `claude/691-git-page-ergonomics`, from `_integration`.

**Resume note:** plan revised after an adversarial review (D9 unsaved-changes scope, symbolic links, RED cases that passed before the change, test commands). All slices done (2026-11-05); a code review after slice 8 is folded into slice 9.

---

## Scope

In (analysis section 1):

- G1. Work on my changes: the Changes tab, the diff beside the list, revert of the unstaged edits of one file or of all of them (slices 1, 4, 7, 8).
- G2. Move between branches: the Branches tab, local branches first, remote branches and tags folded behind a filter (slices 1, 6).
- G3. Know where I push: the header with the branch, the remote URL, ahead / behind, Fetch, Pull, Push (slice 2).
- G4. Set up a repository: the Setup tab with the remote URL and the Clone panel, the Clone panel also shown before an application is chosen (slices 2, 5).
- G5. Look back when needed: the history folded to its last commit, unfolded in place (slice 3).
- G6. Share a view: `&view=` in the URL opens an activity (slice 1).

Out (analysis section 2): reverting part of a file; reverting staged content (a later goal, D3-b); `git revert` of a commit and branch reset; merge, rebase, stash; changes to #689 and #690; a per-user default activity saved in Admin.

Also out: checkout and pull keep reloading every deployment of the repository (#679); revert reloads only its own (D9). Checking out a remote branch keeps giving a detached HEAD at that commit, as since #681 (`GitWritePanels.tsx` sends `origin/<name>`); creating a local branch that tracks it is not in this issue.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the Git page cases and the status rows revert relies on | ✅ | `ui.gitPage` (27 cases), `gitRevert.integ.test.ts` "status rows" |
| 1 | Tracer: tabs Changes / Branches / Setup, `view` from the URL | ✅ | `ui.gitPage` "opens on the tab named by view" |
| 2 | Header: branch, remote, ahead / behind, Fetch / Pull / Push; set the remote in Setup | ✅ | `ui.gitPage` "keeps the branch and the remote in the header on every tab" |
| 3 | History folded to its last commit, unfolded in place | ✅ | `ui.gitPage` "shows the last commit, and the history on demand" |
| 4 | Diff beside the change list; each tab keeps its selection | ✅ | `ui.gitPage` "shows the diff of a change on Changes only, and keeps it across tabs" |
| 5 | Clone panel in Setup, and alone before an application is chosen | ✅ | `ui.gitPage` "shows the Clone panel on the Setup tab" |
| 6 | Branches: local first, remote branches and tags folded, filter | ✅ | `ui.gitPage` "finds a remote branch by name and checks it out" |
| 7 | `gitAction_revert` on the server | ✅ | `gitRevert.integ.test.ts` |
| 8 | Revert in the page, with a confirmation | ✅ | `ui.gitPage` "reverts a file after listing what happens to it" |
| 9 | Nonreg, docs, AC | ✅ | full nonreg, tracer narrative |

---

## Locked implementation defaults

From the analysis decision record (confirmed by A on 2026-11-05), binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 | tabs Changes (default) / Branches / Setup; `&view=changes\|branches\|setup`; an unknown or missing value opens Changes; with `notARepository`, Changes and Branches show `git-no-repository`, Setup still shows Clone | G1, G2, G4, G6 |
| D2 | header: title, branch chip or detached HEAD, `git-root`, `remote: URL`, to push / to pull, Fetch, Pull, Push, Refresh, per the state table of the analysis; detached banner and reload warning under the header; remote-action errors and the credential form under the header, the set-URL error in Setup | G3 |
| D3 | D3-a: revert makes the work-tree file equal to the index (rewritten, re-created, or deleted when the index has no entry), per the truth table of the analysis; offered only when `unstaged` and `inApplication` | G1 |
| D4 | per file, plus "Revert all" over every file with unstaged edits in the application's folders | G1 |
| D5 | a strip under the active tab with the last commit; unfolding shows the commit list, the files of a commit and their diff in place | G5 |
| D6 | Clone in Setup; alone (no tabs) when no application is chosen; nothing but `git-unavailable` with `git` off | G4 |
| D7 | local branches unfolded; "Remote branches (n)" and "Tags (n)" folded, one filter field narrowing both | G2 |
| D8 | diff to the right of the list when wide, below when narrow (one wrapping flex row); the Changes tab and the history each keep their own selection, across tab switches | G1 |
| D9 | paths by `pathsToStage(..., (file) => file.unstaged)` and the `workTreeFile` containment check, the parent's real path checked for a re-created file, and a work-tree symbolic link refused, never followed; unsaved-changes check repository-wide, as for checkout and pull (D13); only the action's own deployment reported as touched and reloaded; repository lock; a confirmation listing each file and its outcome | G1 |
| D10 | `GitPageView` takes `view`, `onViewChange`, `setupExtras`; the route owns `useSearchParams` and passes the Admin-bound Clone panel as `setupExtras` | G4, G6 |
| D11 (plan) | `GitFileStatus` gains `revertOutcome` (`"rewritten" \| "recreated" \| "deleted"`), set when `unstaged`, so the confirmation can say what happens before the action runs. The flags alone cannot: rows `[1,0,3]` and `[1,1,0]` both read deleted, staged, unstaged, and revert re-creates the first and deletes the second; rows `[0,2,3]` and `[0,0,3]` both read added, staged, unstaged, and revert rewrites the first and re-creates the second | G1 |
| D12 (plan) | a named path with no unstaged edit is left out, as `gitAction_stage` does; when no file is left, the action is refused with `nothingToRevert` | G1 |
| D13 (plan, revises D9) | the unsaved-changes check of revert is repository-wide, like checkout and pull, not application-scoped like commit. The reload that follows a revert is a `rollback` (`DomainController.reloadTouchedDeployments`), and a rollback empties the whole local-cache transaction, every application's changes included (`UndoRedoReducer.ts` `rollback`, `UndoRedoStore.ts`). An application-scoped check would let a revert of A silently drop B's unsaved edits. Making rollback application-scoped in both local caches is out of this issue | G1 |

D11, D12 and D13 are new in this plan: the analysis did not settle them, and D13 changes the unsaved-changes part of D9. None changes a goal; they are recorded here for A's review, and the analysis D9 is updated to match.

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Action type | `gitAction_revert { application, paths?: string[], all?: boolean }` |
| Result | `GitRevertResult { files: { path, outcome }[], touchedDeployments, reloadFailures? }` |
| Port method | `GitRepositoryInterface.restoreFromIndex(paths: string[]): Promise<{ path: string; outcome: GitRevertOutcome }[]>` |
| Status field | `GitFileStatus.revertOutcome?: GitRevertOutcome`, `GitRevertOutcome = "rewritten" \| "recreated" \| "deleted"` |
| Error reason (new) | `nothingToRevert` (added to the `GitActionErrorReason` union in `GitRepositoryInterface.ts`); reused `invalidPayload`, `pathOutsideApplication`, `openMiroirTransaction`, `symbolicLink` (a new `GitRepositoryErrorCode` mapped to it in `REPOSITORY_ERROR_REASONS`, `GitActions.ts`) |
| `GitPageView` props | `view?: string`, `onViewChange?: (view: GitPageViewName) => void`, `setupExtras?: React.ReactNode`; `GitPageViewName = "changes" \| "branches" \| "setup"` |
| URL parameter | `view` on `?page=git&application=X` |
| Test ids (new) | `git-tab-changes`, `git-tab-branches`, `git-tab-setup`, `git-header`, `git-open-setup`, `git-history-strip`, `git-history-toggle`, `git-branch-filter`, `git-remote-branches-toggle`, `git-tags-toggle`, `git-revert-<path>`, `git-revert-all`, `git-revert-confirm`, `git-revert-outcome-<path>`, `git-revert-apply`, `git-revert-cancel`, `git-setup-extras` |
| Test ids kept | `git-page`, `git-current-branch`, `git-root`, `git-changes`, `git-branches`, `git-remote` (now the Setup content), `git-history` (the unfolded list), `git-no-remote`, `git-no-upstream`, `git-no-repository`, `git-unavailable`, `git-reload-warning`, `git-commit-<oid>`, `git-stage-<path>`, `git-stage-all` |
| MiroirTest suite | `ui.gitPage` `c98e8263-fdc0-453e-b516-9e8ef5021776` (existing; cases added to its `GitPage` suite) |
| Integ test file | `packages/miroir-standalone-app/tests/3_controllers/git/gitRevert.integ.test.ts` |
| Nonreg step | none new: `integ-git-version-control` runs `3_controllers/git/`, and `ui.gitPage` runs with the component tests |

**Why no `issues/691-*` directory.** Since #683 the Git tests live in the feature folder `3_controllers/git/`, which the nonreg step runs as a whole. A file named after the feature goes there directly, so there is no issue directory to clean up in slice 9.

**Component test count.** `EXPECTED_LEAF_COUNT` in `packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx` (233 today) goes up by the number of cases each slice adds. Each slice updates it in GREEN.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Git page (MiroirTest component) | `npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit` |
| Component test count | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit` |
| Git actions (vitest integ) | `npm run build -w @miroir-framework/git-isomorphic && MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitRevert` |
| Every Git integ test | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/` |
| Unsaved-changes rule (vitest unit) | `npm run testByFile -w @miroir-framework/core -- gitPendingChanges.unit` |
| Action registry (vitest unit) | `npm run testByFile -w @miroir-framework/core -- ActionImplementations.unit` |
| Block palette (MiroirTest unit) | `npm run testMiroir -w @miroir-framework/core -- --suites fn.blockModel --mode unit` |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Bundle policy | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for `miroir-core`, `miroir-react`, `miroir-react-testing`, `miroir-git-isomorphic` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (after slices 4 and 7, and in slice 9) | `npm run nonreg:filesystem -- --runner shared` |

**Why vitest for the revert tests.** Each test builds a temporary Git repository on disk and puts a file in a given index and work-tree state before the action runs. MiroirTest has no setup step that creates a repository or stages a file, so this is not reachable through MiroirTest. The tests still dispatch the real `gitAction_revert` to a real `DomainController` on the `emulatedServer-filesystem` profile; only the setup is TypeScript.

**Why MiroirTest component tests for the layout.** `ui.gitPage` renders the real `GitPageView` with its hooks; only the Git answers come from `GitPageForTest`, the fixture the #679 cases already use. The route `routes/GitPage.tsx` needs the full app context (Formik selector, DomainController, Admin model), which the component tests do not provide; its few lines (read and write `view` and `application`, choose what to show without an application) are checked in the running app in slices 1 and 5, as the tracer narrative of slice 9 records.

**What the step runner can express.** Steps are `change`, `click`, `setChecked`, `expectElement` (with `present: false` for an absent element). A `byText` target must match exactly one element, and the only scoping is `parentContains` on a direct parent. So a case proves where something is shown by its presence on one tab and its absence on another, not by nesting.

---

## Slice 0. Characterize the Git page cases and the status rows revert relies on

**Status:** ✅ DONE

### Goal

Lock what later slices change: the 27 `ui.gitPage` cases pass as they are, and `gitAction_status` gives, for each row of the D3 truth table, the flags the analysis assumes.

### 0.1 Baseline of the Git page

**Test:** MiroirTest `ui.gitPage`, unchanged.

Behavior asserted:
- the 27 cases pass on `_integration` as merged (21 `GitPage`, 6 `GitClonePanel`);
- the analysis table of section 4.3 is the list of cases each slice touches: slice 1 the three Branches cases, slice 2 "sets the remote", slice 3 the four history cases. Any other case that breaks in a slice is a regression, not an expected edit.

### 0.2 Characterization: status rows

**Test:** `gitRevert.integ.test.ts`, `describe("the status of each row a revert reads")`, one `it.each` over the 13 rows of the D3 table. Each case commits a Library book file, then puts it in the row's state with `isomorphic-git` (`git.add`, `git.remove`, writes and deletes in the work tree), and calls `gitAction_status`. A write that follows a `git.add` of the same file bumps its modification time, as `editUbik` does (`gitTestSetup.ts`), or isomorphic-git's stat cache misreads rows `[1,1,3]`, `[1,2,3]` and `[0,2,3]`.

Behavior asserted:
- each row gives the `change`, `staged`, `unstaged` of the D3 table, with `inApplication` true;
- `[0,2,2]`, `[1,2,2]`, `[1,0,0]` read `unstaged` false (revert not offered);
- the pairs named in D11 give equal flags (this is the case for `revertOutcome`).

It passes on arrival: it characterizes `statusFromMatrixRow`, and is the safety net for the field slice 7 adds.

### Validation

**Nonreg scopes:** `smoke,actions,external`: a new file in the Git test folder, which the `integ-git-version-control` step runs.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run build -w @miroir-framework/git-isomorphic && MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitRevert
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```

### Realization

- `ui.gitPage` passed as merged: 27 cases (29 tests with the entry checks).
- `gitRevert.integ.test.ts`, "the status of each row a revert reads": the 13 rows are built with isomorphic-git and each reads the flags of the D3 table. The test also checks the row it built (`statusMatrix`), so a misbuilt row cannot pass by accident. A helper `writeWorkTreeFile` (in `gitTestSetup.ts`, now used by `editUbik`) moves the modification time on at each write.
- Deviation: the scoped nonreg of this slice was folded into the full run of slice 9.

---

## Slice 1. Tracer: tabs Changes / Branches / Setup, `view` from the URL

**Status:** ✅ DONE

### Goal

The user sees one activity at a time and opens a given one from a link (G1, G2, G6).

**Layers cut:** `GitPageView` (tabs, `view` props) → `GitPageForTest` (a `view` prop, the tab kept in fixture state) → route `routes/GitPage.tsx` (`useSearchParams`) → `ui.gitPage` asset.

### 1.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: opens on Changes, and shows the branches on their tab": `git-changes` present, `git-branches` absent; click `git-tab-branches`; `git-branches` present, `git-changes` absent.
- "GitPage: opens on the tab named by view": `componentProps.view: "branches"`; `git-branches` present, `git-changes` absent.
- "GitPage: opens on Changes for an unknown view": `view: "history"`; `git-changes` present, `git-branches` absent.
- "GitPage: offers to create a repository on Changes and Branches": `noRepository`, `view: "branches"`; `git-no-repository` and `git-tab-setup` present (today the box shows with no tabs).

Each case fails today on its absence or tab assertion: every panel is rendered at once (`GitPageView.tsx`, the flex row of four `Panel`s).

Edited cases (they open Branches first): "creates a branch and checks it out", "explains a checkout refused by uncommitted changes", "asks before deleting a branch with commits of its own".

### 1.2 GREEN

- `GitPageView`: MUI `Tabs` with the three tabs. Changes holds today's Changes panel, Branches today's Branches panel, Setup holds `setupExtras` (empty for now). The Remote panel stays above the tabs and the History panel below them, unchanged, until slices 2 and 3.
- The value: `view` prop parsed to a `GitPageViewName` (unknown or missing is `changes`), kept in local state when `onViewChange` is absent (the fixture), else controlled.
- Route: reads `view` with the `useSearchParams` it already has, and writes it with a functional `setSearchParams` that keeps every parameter (`page` routes the page in `PageDispatcher.tsx`). It also writes `application` when the selector changes it (today the choice stays in Formik state), so a copied link opens the same application and tab (G6).
- `EXPECTED_LEAF_COUNT` + 4.

### 1.3 Refactor checkpoint

- Analysis 4.1 "every panel is always rendered": done for Changes and Branches; Remote and History follow in slices 2 and 3.
- `GitPageView.tsx` is 591 lines: tab content goes into one function per tab in the same file; files split only if a slice adds a component of its own (slice 2 header, slice 3 history strip).

### Validation

**Nonreg scopes:** `smoke,ui,core`: `miroir-react`, `miroir-react-testing` (ui), the `ui.gitPage` asset in `miroir-app-miroir` (core).

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react-testing/tsconfig.json
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

In the running app: `?page=git&application=<Library>&view=branches` opens Branches; a tab click changes `view` and keeps `page` and `application`; choosing another application in the selector writes it to the URL.

### Realization

- `GitPageView` takes `view`, `onViewChange`, `setupExtras`; `gitPageView(view)` maps a missing or unknown value to `changes`. Without `onViewChange` the page keeps its own tab (the fixture).
- The route writes `view` and `application` on a tab change with a functional `setSearchParams` that keeps every parameter. Deviation: choosing an application in the selector does not write it to the URL by itself; that would need a `useEffect`, which `AGENTS.md` asks to avoid. The link is complete after any tab change.
- 4 cases RED, then GREEN; 3 Branches cases open their tab first. `EXPECTED_LEAF_COUNT` 237.

---

## Slice 2. Header: branch, remote, ahead / behind, Fetch / Pull / Push; set the remote in Setup

**Status:** ✅ DONE

### Goal

On every tab the user sees which branch and which remote they work with, and fetches, pulls or pushes from there (G3); setting the remote URL is a Setup task (G4).

**Layers cut:** new `GitHeader` (from the title row and `GitRemotePanel`'s remote line and buttons) → `GitRemotePanel` reduced to setting the URL, in Setup → `GitPageView` → `ui.gitPage` asset.

### 2.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: keeps the branch and the remote in the header on every tab": the application name, `git-current-branch`, `origin: https://…`, "to push" and "to pull" present on Changes, then on Branches, then on Setup.
- "GitPage: links to Setup when there is no remote": `noRemote`; on Branches `git-no-remote` present and `git-remote-url` absent; click `git-open-setup`; `git-remote-url` present.
- "GitPage: shows only the title and Refresh for a folder with no repository": `noRepository`; `git-header` present, the Fetch button absent.
- "GitPage: keeps a pull refusal on every tab": `remoteDiverged`; pull on Changes; the refusal text present; open Branches; still present.
- "GitPage: shows the set-URL refusal in Setup only": `noRemote`; on Setup an SSH URL gives its refusal; open Changes; the refusal text absent.

Edited case: "sets the remote of a repository with none, refusing SSH" opens Setup first. The other remote cases are unchanged (the header shows what they look for).

### 2.2 GREEN

- `GitHeader` in `components/Git/GitHeader.tsx`, rendered above the detached banner, the reload warning and the tabs. States per the D2 table. Fetch, Pull, Push and the credential form (`GitCredentialForm`, shared with the Clone panel since #683) move with it.
- `GitRemotePanel` keeps the URL field and Set, in the Setup tab (`git-remote`). Its single `error` state splits: the header owns the remote-action error and `git-credential-notice`, the Setup panel owns the set-URL error.
- `git-no-remote` holds a link `git-open-setup`, which calls the tab change.
- `EXPECTED_LEAF_COUNT` + 5.

### 2.3 Refactor checkpoint

- `GitRemotePanel` and `GitHeader` share the remote command runner (`useGitCommand`); no copy of the token retry.
- Dead code: the old Remote `Panel` of the flex row.

The D2 states "status loading or failed" and "remote, no upstream" get a case if the fixture can give them (a status that never answers, a status without `tracking`); otherwise they are checked in the running app and the Realization says so.

### Validation

**Nonreg scopes:** `smoke,ui,core`.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

### Realization

- New `GitHeader.tsx`: title, branch chip, Refresh, `git-root`, the remote line with to push / to pull and Fetch, Pull, Push, the credential form, the remote-action error and `git-credential-notice`. With no remote: "This repository has no remote" and `git-open-setup`.
- `GitRemotePanel` keeps only the URL field and Set, on the Setup tab, with its own error (`git-set-remote-error`).
- 5 cases (4 RED; "keeps a pull refusal on every tab" passed on arrival, as a guard). "sets the remote" opens Setup first. `EXPECTED_LEAF_COUNT` 242.
- Not done: the D2 states "loading or failed" and "no upstream" have no case; the fixture has no status that never answers. They are shown as before (the `Loading` notice under the header, `git-no-upstream`).

---

## Slice 3. History folded to its last commit, unfolded in place

**Status:** ✅ DONE

### Goal

The history no longer takes a column: the user sees the last commit under the tab and unfolds the history only to look back (G5).

**Layers cut:** new `GitHistoryStrip` → `GitPageView` (the history's own selection) → `ui.gitPage` asset.

### 3.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: shows the last commit, and the history on demand": `git-history-strip` holds the first line of the last commit; `git-history` absent; click `git-history-toggle`; `git-history` present with every commit.
- "GitPage: says when the branch has no commit yet": an empty log; the strip says "No commit yet".

Edited cases (they unfold the history first): "lists the commits with their refs", "shows the files of a commit and their diff against its parent", "checks out a commit as a detached HEAD, then goes back to the branch", "fetches, then pulls the commits of the upstream", and the two that read a commit's text in the history after committing, "asks for the author when the repository has none" and "stages a change, then commits the staged changes". Section 4.3 of the analysis missed these two.

### 3.2 GREEN

- `GitHistoryStrip` in `components/Git/GitHistoryStrip.tsx`, under the tab content on every tab: short oid, first line, author, date, refs of `log.commits[0]`, with its own testid (not `git-commit-<oid>`, which the unfolded list keeps). Unfolded, the strip gives way to the list, so a commit's text is shown once (a `byText` target must match exactly one element).
- Unfolded: `CommitList`, then `CommitFilesPanel` and its `DiffPanel` beside it. `Selection` splits here into two state values, the history's (commit, file) and the Changes tab's (change); the union type goes. Slice 4 moves the Changes diff into its tab.
- The fold state is local to the page: not in the URL.
- `EXPECTED_LEAF_COUNT` + 2.

### 3.3 Refactor checkpoint

- Analysis 4.1 "nothing folds" and "one `Selection` serves both": the history part is done here.
- The old History `Panel` and the shared `CommitFilesPanel` placement go.

### Validation

**Nonreg scopes:** `smoke,ui,core`.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

### Realization

- New `GitHistoryStrip.tsx` under the tab content, with a toggle; unfolded, the strip keeps only its toggle, so a commit's text is shown once. The selection is split here: the history keeps its commit and file, the Changes tab its change.
- 2 new cases; 4 history cases unfold first. "asks for the author" and "stages a change, then commits" pass unedited: the strip shows the new commit's first line and author. `EXPECTED_LEAF_COUNT` 244.

---

## Slice 4. Diff beside the change list; each tab keeps its selection

**Status:** ✅ DONE

### Goal

The user reads a change's diff next to the list they pick it from, and finds it again after a look at another tab (G1).

**Layers cut:** `GitPageView` (the Changes selection and its `DiffPanel` inside the Changes tab) → `ui.gitPage` asset.

### 4.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: shows the diff of a change on Changes only, and keeps it across tabs": select a change; `git-diff` present; open Branches; `git-diff` absent (today the diff panel stays under every panel); open Changes; `git-diff` present with the same file.
- "GitPage: keeps the history's selection apart from the change's": select a change, unfold the history, select a commit file; the change's diff title and the commit file's diff title both present.

The existing case "shows the diff of a change against HEAD" passes unchanged.

### 4.2 GREEN

- The Changes tab is one wrapping flex row: the list (`flex: 1 1 360px`), then the `DiffPanel` of the selected change (`flex: 2 1 480px`). jsdom has no layout, so wide and narrow are checked in the running app, not by a case.
- The selection of the Changes tab is state of the page, not of the tab content, so it survives a tab switch. A stage or unstage keeps it (as today, `onCommandSuccess`); a commit, checkout or pull clears it (`refresh`).
- `EXPECTED_LEAF_COUNT` + 2.

### 4.3 Refactor checkpoint

- Analysis 4.1 "the diff panel comes after every panel": done.
- Two `DiffPanel`s may now be on screen: their testids become `git-diff` (Changes) and `git-commit-diff` (history) if a case needs to tell them apart.

### Validation

**Nonreg scopes:** `smoke,ui,core`, then the full run: slices 1 to 4 rebuilt the page.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
npm run nonreg:filesystem -- --runner shared
```

### Realization

- The Changes tab is a wrapping flex row: the list, then the change's `DiffPanel` (`flex: 2 1 480px`). The status notice shows once, under the header, not in each tab.
- 2 cases; "keeps the history's selection apart" passed on arrival (slice 3 split the selection). `EXPECTED_LEAF_COUNT` 246.
- Deviation: the full nonreg of this slice and the bundle policy moved to slice 9.

---

## Slice 5. Clone panel in Setup, and alone before an application is chosen

**Status:** ✅ DONE

### Goal

Cloning is a Setup task: it sits next to the remote, and the user can still clone before choosing any application (G4).

**Layers cut:** route `routes/GitPage.tsx` (`GitCloneSection` passed as `setupExtras`, or alone) → `GitPageView` (`setupExtras` in Setup, never with `git` off) → `GitPageForTest` (a `withClonePanel` prop rendering the real `GitClonePanel` on the fixture runner) → `ui.gitPage` asset.

### 5.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: shows the Clone panel on the Setup tab": `withClonePanel`; `git-clone-url` absent on Changes; open Setup; `git-clone-url` and `git-remote-url` present.
- Guard, passing on arrival: "GitPage: shows no Clone panel while git is off": `gitEnabled: false`, `withClonePanel`; `git-unavailable` present, `git-clone-url` absent. `GitPageView` returns early with `git` off, so this keeps D6's rule when `setupExtras` is added; the route's own rule is checked in the running app.
- "GitPage: shows the Clone panel on Setup for a folder with no repository": `noRepository`, `withClonePanel`, `view: "setup"`; `git-clone-url` present.

### 5.2 GREEN

- `GitPageView` renders `setupExtras` in Setup, after the remote URL, inside `git-setup-extras`.
- Route: with an application chosen, `GitCloneSection` goes to `GitPageForApplication` as `setupExtras`; with none, the route renders it under the selector, without tabs; with `git` off, the route renders only the `git-unavailable` notice (today `GitCloneSection` renders even then).
- `EXPECTED_LEAF_COUNT` + 3.

### 5.3 Refactor checkpoint

- `GitCloneSection` builds its Admin-bound runner once; the route has no second copy of the `handleAction` wrapper (it has one per runner today: extract a `useGitRunner(application)` hook in the route file if both stay).

### Validation

**Nonreg scopes:** `smoke,ui,core`.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react-testing/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

In the running app: with no application chosen, the Clone panel shows alone; with `git` off, only the notice.

### Realization

- The fixture gets `withClonePanel` (the real lazy `GitClonePanel` on the fixture runner). The route passes `GitCloneSection` as `setupExtras`, renders it alone with no application, and only the `git-unavailable` notice with `git` off and no application.
- 3 cases (one guard). `EXPECTED_LEAF_COUNT` 249.

---

## Slice 6. Branches: local first, remote branches and tags folded, filter

**Status:** ✅ DONE

### Goal

With dozens of remote branches, the user still sees their local branches at once and finds any other by name (G2).

**Layers cut:** `GitBranchList` (`GitWritePanels.tsx`) → `ui.gitPage` asset (fixture branches given through `status` and `log`, as today).

### 6.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases on a fixture with 2 local branches, 30 remote branches and 3 tags:
- "GitPage: lists the local branches, and folds the remote branches and tags": the local branches present; `git-remote-branches-toggle` reads "Remote branches (30)", `git-tags-toggle` "Tags (3)"; no remote branch row present.
- "GitPage: finds a remote branch by name and checks it out": type part of a name in `git-branch-filter`; the folds open on the matching rows only (one `git-ref-origin/<name>` present, another absent); Check out on it; `git-detached` present (a remote branch checks out as a detached HEAD, see Scope).

### 6.2 GREEN

- `GitBranchList`: local section as today; remote branches and tags each behind a fold with its count; one filter field (case-insensitive substring) that opens both folds while it is not empty and lists only matching rows; the counts show the matches.
- `EXPECTED_LEAF_COUNT` + 2.

### 6.3 Refactor checkpoint

- One row component for a branch, a remote branch and a tag, if the three copies differ only in their label.

### Validation

**Nonreg scopes:** `smoke,ui,core`.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

### Realization

- `GitBranchList`: the filter field `git-branch-filter`, then "Remote branches (n)" and "Tags (n)" toggles; a non-empty filter opens both folds on the matching names.
- 2 cases; checking out `origin/topic-07` gives a detached HEAD, as planned. `EXPECTED_LEAF_COUNT` 251.

---

## Slice 7. `gitAction_revert` on the server

**Status:** ✅ DONE

### Goal

A designer, or any client of the Git Endpoint, drops the unstaged edits of chosen files, or of every file of the application, and Miroir shows the files as they now are (G1, D3, D9, D11, D12).

**Layers cut:** port `GitRepositoryInterface` (`restoreFromIndex`, `revertOutcome`) → `miroir-git-isomorphic` → `GitAction.ts` (type, registries) → `GitActions.ts` (`handleAction_gitAction_revert`) → Git Endpoint JSON → client reload (`DomainController`) → `GitPageForTest` (an answer for the new action).

### 7.1 RED

**Test:** `gitRevert.integ.test.ts`, on the Library copy of `test-filesystem`, after `initCommittedRepository`:
1. `it.each` over the 10 offered rows of D3: after `gitAction_revert { paths: [file] }`, the work-tree file holds the index content, or is absent when the index has no entry; the index is unchanged (`git.listFiles` and the staged blob oids as before); the result names the file with the outcome of the D3 table; `gitAction_status` no longer lists it as `unstaged`.
2. `gitAction_status` gives each row's `revertOutcome`, the two D11 pairs included, and none for the 3 rows not offered.
3. "reverts every unstaged file of the sections, and only those": unstaged edits in two book files and in a file of the repository outside the sections; `{ all: true }` reverts the two, the third is untouched.
4. "skips a fully staged file, and refuses when nothing is left": `[1,2,2]` named alone is refused with `nothingToRevert`; named with an unstaged file, only the unstaged one is in the result.
5. "refuses a path outside the application": `../x`, an absolute path, `.git/config`, a file of the repository outside the sections, each refused with `pathOutsideApplication`; nothing written.
6. "refuses while Miroir has unsaved changes, of any application": an instance edited in the local cache and not committed in Miroir (as in `gitCommit.integ.test.ts`, "is refused by the client while…"): `openMiroirTransaction`; the file keeps its edit. The same with the unsaved change in the Miroir application instead of the Library (D13).
7. "writes nothing through a symbolic link": (a) the parent folder of a deleted file replaced by a link out of the repository: refused with `symbolicLink`, nothing written outside; (b) an edited file replaced by a link to another file of the repository: refused with `symbolicLink`, the link target unchanged; (c) a new unstaged file that is a link (`[0,2,0]`): the link is removed, its target unchanged.
8. "keeps the mode of an executable file, and refuses a link in the index": a `0o100755` entry is rewritten executable; a `0o120000` entry is refused with `symbolicLink`.
9. "reloads the reverted deployment only": a second deployment B whose sections are folders of the Library repository (a copy of `appForTest` under new uuids, written with the `writeApp` helper of `gitClone.integ.test.ts` moved to `gitTestSetup.ts`, and opened as its install does), and an application-deployment map that holds Miroir, Library and B. Without the fix, `touchedDeployments` names Library and B; with it, Library only, and the local cache shows the Library file content as reverted. The repository is built with isomorphic-git, so the test needs no native git and no HTTP server.
10. "refuses without the git capability, writing nothing" (`setGitCapability(context, false)`).

Also, `gitPendingChanges.unit.test.ts`: a revert is refused for unsaved changes of its own application and of any other (repository-wide, like checkout and pull, D13).

### 7.2 GREEN

- **Port.** `restoreFromIndex(paths)` in `GitRepositoryInterface.ts`; implementation in `miroir-git-isomorphic` per analysis 6.1: `git.walk({ trees: [STAGE()] })` over the paths, `git.readBlob({ oid })`, write the bytes with the entry's mode (executable for `0o100755`, refuse `0o120000`), delete the work-tree file when the index has no entry; every write and delete through `workTreeFile`, the parent folder's real path checked before a re-creation. `workTreeFile` follows links (`realpathSync`), so `restoreFromIndex` first `lstat`s each path: a link in the work tree is refused with the new `symbolicLink` code for a rewrite, and unlinked (not followed) for a delete. `statusFromMatrixRow` sets `revertOutcome` when `unstaged` (`stage === 0`: deleted; `workdir === 0`: recreated; else rewritten).
- **Action.** `GIT_ACTION_TYPES` and `GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES` get `gitAction_revert`; `GIT_ACTIONS_KEEPING_FILES` does not. `openMiroirTransactionError` treats revert like checkout and pull: every pending change counts (D13). `handleAction_gitAction_revert` in `GitActions.ts`, under `withRepositoryLock`: `pathsToStage(opened, payload, (file) => file.unstaged)`, `nothingToRevert` when empty, `restoreFromIndex`, then `touchedDeployments: [the action's own deployment]`, `rebootTouchedStores` of that list, and `GitRevertResult`.
- **Endpoint.** A hand-written `gitAction_revert` entry in `a7f243cb-9345-425a-918d-4e433a94f4bf.json` with its payload schema (`application`, `paths?`, `all?`); `npm run build -w miroir-app-miroir`.
- **Lists of action types.** The `fn.blockModel` palette (MiroirTest `0161aae9-8ff2-4efb-9da5-ee8926961196`) and `ActionImplementations.unit.test.ts`.
- **Fixture.** `GitPageForTest` answers `gitAction_revert` from its in-memory status using each file's `revertOutcome`, so slice 8 can show the effect; `openMiroirTransaction` refuses it too. Its stage and unstage recompute `revertOutcome` (a staged file loses it; an unstaged one gets it back), so the field never goes stale.
- The client reload needs no change: `DomainController` already calls `reloadTouchedDeployments` on any Git result, and it gets one deployment.

### 7.3 Refactor checkpoint

- Analysis 4.2 "no way to write a file back from the index": done.
- `pathsToStage` now serves three actions; rename it `pathsToChange` if that reads better at its call sites.
- The monorepo helpers of `gitClone.integ.test.ts` that test 9 reuses move to `gitTestSetup.ts`.

### Validation

**Nonreg scopes:** `smoke,core,actions,external,ui`: core interfaces and the Endpoint asset (core), `GitActions.ts` and the store reboot (actions), the Git step (external), the fixture in `miroir-react-testing` (ui). The full run covers them all: the Git action surface changed.

```bash
npm run build -w miroir-app-miroir && npm run build -w @miroir-framework/core
npm run build -w @miroir-framework/git-isomorphic
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/
npm run testByFile -w @miroir-framework/core -- gitPendingChanges.unit
npm run testByFile -w @miroir-framework/core -- ActionImplementations.unit
npm run testMiroir -w @miroir-framework/core -- --suites fn.blockModel --mode unit
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-git-isomorphic/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react-testing/tsconfig.json
npm run test -w @miroir-framework/core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

- Port `restoreFromIndex(paths)`: walks `STAGE()`, checks every path before writing any (an index link, a work-tree link with an index entry, a nearest existing folder whose real path leaves the work tree or enters `.git`, a folder), then writes the blob bytes with mode `0o755` or `0o644`, or removes the file (a link is removed, not followed). `statusFromMatrixRow` sets `revertOutcome`.
- `gitAction_revert` in `GitActions.ts`: `pathsToStage(..., (file) => file.unstaged)`, `nothingToRevert`, `restoreFromIndex`, the action's own deployment as `touchedDeployments`, `rebootTouchedStores`. `openMiroirTransactionError` treats it like checkout and pull (D13). Endpoint entry (19 actions), `fn.blockModel` palette, `ActionImplementations.unit.test.ts`, `gitPendingChanges.unit.test.ts`.
- `gitRevert.integ.test.ts`: 44 tests. Test 9 builds one repository around the Library and Miroir copies (`.miroir/test-filesystem`); with `touchedDeployments` of the checkout instead of the fix, it fails and names Miroir too (checked by swapping the line).
- Problems met: building a row commits the whole index, so a staged row must be built after the rows that commit; the refusal test saves its Miroir change afterwards (a `rollback` left the transaction).
- Every Git integ test: 11 files, 154 tests pass. Core unit tests for the registries, `fn.blockModel` (107) and `modelValidation` of `miroir-app-miroir` (174) pass.

---

## Slice 8. Revert in the page, with a confirmation

**Status:** ✅ DONE

### Goal

From the Changes tab, the user reverts one file or all of them, after reading what will happen to each (G1, D4, D9).

**Layers cut:** `ChangeList` (a Revert per file, "Revert all") → a confirmation in `GitPageView` → `GitPageForTest` (slice 7's answer) → `ui.gitPage` asset.

### 8.1 RED

**Test:** MiroirTest `ui.gitPage`, new cases:
- "GitPage: reverts a file after listing what happens to it": click `git-revert-<path>` of an edited book; `git-revert-confirm` lists it with `git-revert-outcome-<path>` "rewritten"; click `git-revert-apply`; the file leaves the list.
- "GitPage: lists each file of Revert all with what happens to it": three files of outcomes rewritten, recreated, deleted; click `git-revert-all`; each outcome shown; apply; none left.
- "GitPage: keeps the file when the revert is cancelled": `git-revert-cancel`; the file is still listed.
- "GitPage: offers no revert for a fully staged file": a `[1,2,2]` file has no `git-revert-<path>`.
- "GitPage: explains a revert refused while Miroir changes are not saved": `openMiroirTransaction`; the refusal text shown, the file still listed.
- "GitPage: warns when Miroir could not reload the reverted files": a fixture prop `revertReloadFailure`; `git-reload-warning` present after the revert.

### 8.2 GREEN

- `ChangeList`: a Revert button on each row with `unstaged` and `inApplication` (the page asks for the status of the sections only, so every listed row is in the application today; the check guards a later "other changes" view); "Revert all" next to "Stage all", disabled when no row has one.
- Confirmation: an MUI `Dialog` (`git-revert-confirm`) listing each file by its Entity and instance name, with its `revertOutcome`; apply runs `gitAction_revert` through `command`, then refreshes; `reloadFailures` go to `git-reload-warning`, a refusal to `GitCommandError`.
- `EXPECTED_LEAF_COUNT` + 6.

### 8.3 Refactor checkpoint

- The revert dialog is the page's first; the delete-branch flow stays as it is (a refusal, then "Delete anyway", `GitWritePanels.tsx`).

### Validation

**Nonreg scopes:** `smoke,ui,core`.

```bash
npm run build -w miroir-app-miroir && npm run testMiroir -w miroir-standalone-app -- --suites ui.gitPage --mode unit
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core
```

### Realization

- `ChangeList` has a Revert button on each unstaged file of the application; "Revert all" sits next to "Stage all". The confirmation is an inline warning (`git-revert-confirm`), not a dialog, with each file's label and outcome.
- `gitCommandErrorText` words `nothingToRevert` and `symbolicLink`.
- Fixture: `gitAction_revert` from the in-memory status; `revertOutcome` derived for props files that lack it and recomputed by stage and unstage; `revertReloadFailure`.
- 6 cases. `ui.gitPage`: 53 tests pass. `EXPECTED_LEAF_COUNT` 257.

---

## Slice 9. Nonreg, docs, AC

**Status:** ✅ DONE

### 9.1 Nonreg

- No new step: `integ-git-version-control` runs `3_controllers/git/` (with `gitRevert.integ.test.ts`), and `ui.gitPage` runs with the component tests. Its title gains "revert".
- Run `npm run nonreg:filesystem -- --runner shared`, then the pre-push gate of `AGENTS.md`.
- The bundle policy, with the app and Electron sizes against their baselines.

### 9.2 Docs

- `docs/guides/version-control-with-git.md`: the panel table and "Clone panel at the top" rewritten for the header, the three tabs, the folded history, revert and `&view=`.
- `analysis.md` status set to implemented; this plan's progress table DONE.

### 9.3 Issue-directory cleanup

None: the new test file is in the feature folder `3_controllers/git/`, and the new cases are in the feature suite `ui.gitPage`.

### 9.4 Tracer bullet (narrative)

1. Start the server and the client with `git` on; open the Git page with no application: the Clone panel shows alone.
2. Choose the Library: the header shows the branch, `remote: URL`, to push / to pull; the Changes tab is open; the history is one line.
3. Edit a book in Miroir and save it to disk; the book is listed; select it: its diff shows beside the list.
4. Revert it: the dialog says "rewritten"; apply: the book leaves the list, and the Library shows its old title.
5. Open Branches; type part of a remote branch name; check it out; the header shows a detached HEAD at its commit, and the banner offers the way back.
6. Copy the URL (`&view=branches`), open it in a new tab: Branches is open.
7. Open Setup: the remote URL and the Clone panel.
8. Unfold the history, select a commit and a file: the diff shows beside the commit's files.

Automated equivalent: `ui.gitPage` (steps 2 to 8 on fixture answers) and `gitRevert.integ.test.ts` (step 4 on a real repository and store). Steps 1 and 6 go through the route and are checked by hand.

### AC checklist (#691)

| Criterion | Proven by | Status |
|---|---|---|
| One activity at a time: Changes, Branches, Setup; Changes by default | `ui.gitPage` slice 1 cases | ✅ |
| A header names the application, the branch, the remote with its URL, to push and to pull | `ui.gitPage` "keeps the branch and the remote in the header on every tab" | ✅ |
| History always reachable, folded by default, opened on demand | `ui.gitPage` "shows the last commit, and the history on demand" | ✅ |
| Revert of chosen files or of every changed file of the application, by a server `gitAction_*` | `gitRevert.integ.test.ts` 1 and 3 | ✅ |
| Revert refused while Miroir has unsaved changes | `gitRevert.integ.test.ts` 6, `gitPendingChanges.unit.test.ts` | ✅ |
| Revert reloads the touched deployment | `gitRevert.integ.test.ts` 9 | ✅ |
| Revert asks for confirmation in the page | `ui.gitPage` slice 8 cases | ✅ |
| No action removed; the existing `ui.gitPage` cases pass once they open the right activity | `ui.gitPage` (27 cases, 8 edited to open their tab or unfold the history) | ✅ |

The issue says revert goes "back to HEAD". A chose D3-a (2026-11-05): revert drops unstaged edits and keeps staged content; reverting staged content is a later goal.

### Realization

- Nonreg `npm run nonreg:filesystem -- --runner shared`: 128 steps passed, 2 failed, `integ-runner.freezeApplicationVersion` and `appstack-uiIntegrationTestLauncher.integ`. Both failed while creating the Admin instances of a shared workspace (`Entity not found in data section` in `.miroir/test-filesystem@w1` and `@w2`), and both pass when run alone (`--only`, same runner). Not compared with `_integration`.
- Pre-push gate of `AGENTS.md`: all pass after one fix (`miroir/action-result`: the revert returned a refused restore by a throw). Core unit tests 3426 passed. Bundle policy of the app: 0 violations (843604 bytes gzipped loaded with the page, baseline 827963); the Electron build was not rebuilt.
- Code review after slice 8, fixed here:
  - the folder check compares real paths, so a folder that is a link to another folder of the repository is refused (`symbolicLink`), with a test;
  - files are written to a temporary file and renamed over the target; deletes run before writes;
  - a write that fails halfway still reloads the deployment (`touchedDeployments` on the error, read by `reloadTouchedDeployments`);
  - the mode: with `core.filemode` false (what isomorphic-git's init writes) the work-tree mode is kept; with true the index's executable bit comes back. The test covers both;
  - the page reverts the files the confirmation listed, Refresh clears a pending confirmation, the commit draft survives a tab change, and a tab change replaces the history entry.
  - Left as is: a payload path naming a folder is refused as `pathOutsideApplication`, the reason the staging paths use.
- Running app (`cloud-agent` environment, `MIROIR_AUTH_ENABLED=false`, Playwright): a tab change writes `application` and `view`; the copied link opens on Branches; Setup shows the remote URL and the Clone panel; the history unfolds in place. The check found that the app's MUI theme sets `spacing: 0`, so every `gap` of the page was 0 and the header ran together. The route now wraps the page in `GitSpacing` (MUI's default spacing), Fetch, Pull and Push wrap together, and the Branches and Remote panels take the height of their content. Step 1 (no application) was not seen: the selector starts on Miroir.
- Steps 3 to 5 (edit, revert and remote checkout on a real application) were not run by hand: the app edits the package assets of this repository live, and a revert there would act on the working copy. `gitRevert.integ.test.ts` covers step 4 on a real repository and store.

