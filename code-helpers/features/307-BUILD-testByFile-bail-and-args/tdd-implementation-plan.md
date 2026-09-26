# #307 TDD plan

Single slice (the change is one function plus the spawn call).

## Slice 1: bail override and shell-free spawn

- **Red:** `tests/helpers/test-by-file.profile.unit.test.ts`, `describe("buildTestByFileVitestArgs (#307)")`: default `--bail=1`; `--no-bail` drops it; `--bail=<n>` / `--bail <n>` replace it; `--bail=0` / `--bail 0` drop it; `-t "field at 1"` stays one argument.
- **Green:** add `buildTestByFileVitestArgs` to `scripts/testByFileLauncher.ts`; in `scripts/test-by-file.ts` spawn `node <vitest>/vitest.mjs` without a shell.
- **End-to-end checks (manual, recorded in the PR):**
  - `npm run testByFile -w miroir-standalone-app -- test-by-file.profile.unit -t "a user --bail"` runs exactly 1 test, 1 file.
  - A throwaway file with 3 failing cases: default reports `1 failed (3)`; `--no-bail` and `--bail=0` report `3 failed (3)`.
- **Docs:** `docs/reference/testing.md` and `docs/contributing/testing.md` drop the `.`-for-space and `npx vitest` workarounds.
- **Gate:** `tsc` on `miroir-standalone-app` (no new errors in `scripts/`), `npm run nonreg` on filesystem storage.
