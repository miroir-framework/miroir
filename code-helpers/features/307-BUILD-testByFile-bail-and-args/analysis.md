# #307 BUILD: `testByFile` bail override and exact argument passing

Follow-up to #303 (item 4 of its `follow-ups.md`).

## Problem

`packages/miroir-standalone-app/scripts/test-by-file.ts`:

1. Always appends `--bail=1`. After the first failing case, later cases are reported as not run. A user `--bail=0` is rejected by vitest because `--bail` is then given twice.
2. Spawns `npx vitest …` with `shell: true`. The shell re-splits the joined command line, so `-t "a b"` becomes `-t a b`, and `b` becomes a file filter.

## Decisions (defaults taken, no grill: small change)

| # | Question | Decision |
|---|----------|----------|
| 1 | Default bail? | Keep `--bail=1` (unchanged behavior for everyone who relies on it). |
| 2 | Override syntax? | `--no-bail`, `--bail=<n>` and `--bail <n>`; `0` means no bail flag at all. `--no-bail` is consumed by the launcher, not forwarded. |
| 3 | How to avoid the shell? | Spawn `process.execPath` on vitest's own CLI (`vitest/vitest.mjs`, resolved from the package). Works on Windows too, where spawning `npx.cmd` without a shell is refused by recent Node. |
| 4 | Scope | Only `testByFile` in `miroir-standalone-app`. `test-miroir-runner.ts` also uses `shell: true`, but it forwards no user argv to vitest, so it is left as is. |

## Seam

Pure function `buildTestByFileVitestArgs(userArgs)` in `scripts/testByFileLauncher.ts` builds the vitest argv (bail handling); `test-by-file.ts` only resolves the vitest CLI and spawns it. Unit-tested next to the existing launcher tests in `tests/helpers/test-by-file.profile.unit.test.ts`.
