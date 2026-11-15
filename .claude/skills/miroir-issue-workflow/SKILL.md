---
name: miroir-issue-workflow
description: The lifecycle of a Miroir GitHub issue, from branch to closed issue. Use when starting work on an issue, when its PR is opened or merged, or when checking an issue's acceptance criteria.
argument-hint: [issue-number]
---

# Miroir issue workflow

One issue, one branch, one PR, then an **acceptance check** on the issue. The issue is done when the acceptance check is posted and the issue is closed, not when the PR merges.

The issue's acceptance criteria are its `Done when` (or `Acceptance criteria`) section. Read them first and keep them in view: every later step serves them.

## 1. Branch

Branch from `_integration`, with the issue number in the name: `claude/<N>-<slug>` (e.g. `claude/175-pk-less-entities`). Skip this step when the session already assigns a branch.

_Done: the branch exists, based on the current `origin/_integration`._

## 2. Analysis

Write `code-helpers/features/<N>-<TYPE>-<slug>/analysis.md` with the `miroir-feature-analysis` skill. Small fixes (one file, obvious change, no design choice) skip steps 2 and 3; say so in the PR.

Then get an adversarial review: a subagent reads the analysis cold, with the issue and the code but without your reasoning, and hunts for wrong claims about the current code, missed callers, and acceptance criteria the design does not reach. Fix what it finds, or record the rejected point and why in the analysis. A decision that changes the issue's goal goes to the user, with a recommendation.

_Done: every acceptance criterion maps to a decision in the analysis, and every review finding is fixed or answered._

## 3. TDD plan

Write the sibling `tdd-implementation-plan.md` with the `miroir-analysis-to-tdd-plan` skill, and review it the same way: the reviewer checks that the slices are vertical, that each has a red test, and that the last slice closes every acceptance criterion.

_Done: each acceptance criterion is proved by a named test or check in some slice._

## 4. Implement

Work slice by slice: red, green, refactor. Commit when the user asks, at the granularity they choose (a session given a branch to push to is asked to commit and push its work). After the last slice:

- run the non-regression suite with the shared runner, at the tier `AGENTS.md` gives for what you touched (e.g. `npm run nonreg:filesystem -- --runner shared`);
- run the pre-push gate from `AGENTS.md`, plus `tsc` on every package you touched.

A failure you believe predates your change is proved on `_integration`, not assumed. Record it for the PR description.

_Done: the gate passes and every nonreg failure is fixed or shown to predate the branch._

## 5. Pull request

Open the PR against `_integration`. The description has one `Closes #<N>` line per issue it addresses (it links the PR in the issue's Development field), a summary of the change, how it was tested (nonreg tier and result), and known gaps. Run the `unslop` skill on it before posting. Assign the PR and request a review from the user, then subscribe to its activity.

While it is open, fix CI failures and answer each review finding: fix it, or reply with why it is wrong or out of scope. A finding that grows the scope becomes a follow-up issue (step 6), linked in the reply.

_Done: the PR is merged._

## 6. Acceptance check

After the merge, check out the merge commit (or `_integration` at it) and evaluate each acceptance criterion against the merged code, not against the plan or the PR description. Post one comment on the issue:

- Open with: Acceptance criteria, checked on `_integration` after #<PR> (merge commit <sha>):
- One bullet per criterion, in the issue's order, the criterion in bold followed by its verdict:
  - **met**: name the evidence, a file, a test, a CI step or a measured number;
  - **met as reworded**: the criterion as written cannot hold; give the decision that changed it (e.g. `D9` in the analysis), why, and what holds instead, with evidence;
  - **not met**: what is missing, and the follow-up issue that tracks it;
  - **open question**: what was observed, and what is not established.
- Scope items of the issue that are not acceptance criteria, when they are worth confirming.
- Follow-ups: the work found during the issue that is not done, each with its issue link.

Run `unslop` on the comment before posting. Then:

- open an issue for each follow-up and each `not met` (title `<TYPE> #<N>: ...`, body with problem, scope and `Done when`), add it to the GitHub Project with `gh project item-add 2 --owner miroir-framework --url <issue-url>`, and put its link in the comment;
- close the issue by hand (`state_reason: completed`). `Closes #N` closes it only on a merge into `main`, so an issue merged into `_integration` stays open until you close it. Leave it open while a criterion is `not met` or an `open question`, until the user agrees to the follow-up or to defer the question.

Worked example: https://github.com/miroir-framework/miroir/issues/696#issuecomment-6810168298

_Done: the comment is posted with every criterion given a verdict and its evidence, each follow-up has an issue, and the issue is closed._
