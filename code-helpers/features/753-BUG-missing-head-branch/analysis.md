# #753: a HEAD that names a missing branch

Follow-up to #689 (option 2 of that issue). The fix for #689 lets the isomorphic-git port read linked worktrees. A repository whose `HEAD` names a branch that does not exist still reads as a fresh repository: every indexed file `added` and `staged`, no current branch, an empty log. The Git page then offers stage, commit and checkout on that state.

## Current code

- `IsomorphicGitRepository.branches()` (`packages/miroir-git-isomorphic/src/index.ts`) calls `git.currentBranch` with `test: true`, so a branch that does not resolve gives `current: undefined`. `head` is `resolveRef("HEAD")`, also undefined.
- `status()` compares the index with an unresolvable `HEAD` and reports every indexed file as `added`, `staged`.
- `openRepository` (`packages/miroir-core/src/3_controllers/GitActions.ts`) is the one place every `gitAction_*` on a deployment opens its repository (also `modelFilesAt`, used by the versioning checks). It refuses a missing repository, sections in several repositories, and a deployment ignored by an enclosing repository.
- `GitPageView` shows a failed `gitAction_status` as an error alert and renders the change list, the commit form, the branch list and the remote panel only when the status is `ok`.

## Decisions

- **D1. The port reports facts, core decides.** A new port method `headBranch()` returns the branch `HEAD` names, whether or not it exists (`currentBranch` with `test: false`), and undefined for a detached `HEAD`. Whether that state is legitimate is a rule of `GitActions`, not of the isomorphic-git adapter.
- **D2. Unborn branch versus missing branch.** `HEAD` names a branch that does not resolve in two cases. Before the first commit (`git init`, then `git add`), the repository has no ref at all; that state is legitimate and reads as now. When the repository has other branches, remote branches or tags, the branch is missing: a ref deleted or a worktree whose common directory is not read. `missingHeadBranch` returns the branch only in the second case.
- **D3. Refused in `openRepository`, as `gitFailure`.** Every action on the deployment (reads and writes) returns `gitFailure` with `{ directory, root, branch }` and a message that names the branch and the repository root, and says to check out an existing branch with git. The issue asks for the gitdir in the message; core does not know the gitdir, so the message names the work tree root. No new error reason: the Git page needs no special case.
- **D4. Git page.** No change of behaviour is needed: with a failed status, the page already shows only the error and offers no write action. The status error alert gets `data-testid="git-status-error"` so a component test can find it.

## Known gap

An orphan branch (`git checkout --orphan new` in a repository that has commits) is unborn while other branches exist; D2 refuses it as missing. Miroir does not create orphan branches, and the user can make a first commit with git.

## Tests

| Done when | Test |
|---|---|
| A removed branch ref of a worktree's `HEAD` gives `gitFailure` naming the branch | `gitWorktree.integ.test.ts`, "A HEAD that names a missing branch (#753)": status, log, stage and checkout refused |
| A fresh repository with staged files and no commit still returns `ok` | `gitHistory.integ.test.ts`, "reads a repository with staged files and no commit yet as such (#753)" |
| The Git page shows the failure and offers no stage, commit or checkout | MiroirTest `ui.gitPage`, "GitPage: shows a HEAD that names a missing branch as an error, with no write action (#753)" |
