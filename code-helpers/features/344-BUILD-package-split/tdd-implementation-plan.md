# #344 TDD plan: package split

Analysis: [analysis.md](analysis.md). The change is a rename, so the "tests" are the existing suites: each slice is green when the build, the pre-push gate and the suites naming the renamed packages pass.

A one-off script (not committed) does, per package, `git mv packages/<old> packages/<new>`, replaces the name in tracked files (except historical `code-helpers/features/`), in `package-lock.json`, and relinks `node_modules/<new>`.

| Slice | Packages | Green when |
|---|---|---|
| 0 | analysis + plan | n/a |
| 1 | framework: `miroir` → `miroir-app-miroir`, `admin` → `miroir-app-admin` | full ordered build, gate, `nonreg:unit -- --runner shared` |
| 2 | examples: `library`, `spotify`, `designer`, `postgres` → `miroir-example-*` | build of renamed packages and dependants, gate |
| 3 | fixture: `appForTest` → `miroir-fixture-appForTest`; AGENTS.md and data-architecture doc state the roles | gate, `nonreg:filesystem -- --runner shared` |
