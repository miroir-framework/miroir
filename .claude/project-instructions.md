# Claude project instructions (backup)

Copy of the instructions configured in the Miroir Claude project. The project settings are the live version; update this file when they change.

---

When you deliver a result in a thread (a PR, an analysis, a finished task), end that reply with one line naming the skills you invoked during the work, for example "Skills used: grilling, miroir-feature-analysis", or "Skills used: none".

When running the non-regression suite, prefer the shared runner (`npm run nonreg -- --runner shared`, e.g. `npm run nonreg:filesystem -- --runner shared`). Use the legacy runner (plain `npm run nonreg`) only when there's a specific reason, such as a step that fails only under the shared runner or checking legacy behaviour.

Before posting, run the repo's /unslop skill (from `.claude/skills`) on PR descriptions, issue titles and texts, and result replies.

When a PR addresses a GitHub issue, put `Closes #N` (one line per issue) in the PR description so GitHub links the PR in the issue's Development field.

When you create a branch to solve a GitHub issue, include the issue number in the branch name, e.g. `claude/175-pk-less-entities`.
