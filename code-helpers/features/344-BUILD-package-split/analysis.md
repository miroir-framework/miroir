# #344 BUILD: split application packages into framework, example and fixture packages

Follow-up of #321, decision D9 ("Package renames: later issue").

## Problem

The seven packages holding application models and data share one prefix, `miroir-test-app_deployment-*`, whatever their role. The name does not say which applications the framework needs, which are examples, and which exist only for tests.

## Classification

| Old package | Role | Evidence | New package |
|---|---|---|---|
| `miroir-test-app_deployment-miroir` | framework | meta-model; built before `miroir-core`, which generates its types from it | `miroir-app-miroir` |
| `miroir-test-app_deployment-admin` | framework | Admin application (deployments, users, rights); every server boots it | `miroir-app-admin` |
| `miroir-test-app_deployment-library` | example | the Library demo used across docs and tests | `miroir-example-library` |
| `miroir-test-app_deployment-spotify` | example | demo application | `miroir-example-spotify` |
| `miroir-test-app_deployment-designer` | example | Designer application, shipped in the Docker image and `dev` | `miroir-example-designer` |
| `miroir-test-app_deployment-postgres` | example | its README calls it an example app; shipped in the Docker image; only its own `modelValidation` test uses it | `miroir-example-postgres` |
| `miroir-test-app_deployment-appForTest` | fixture | exists only for tests (`test-filesystem`, standalone-app tests) | `miroir-fixture-appForTest` |

The issue table listed `postgres` as a fixture; this analysis classifies it as an example for the reasons above.

## Decisions

- **D1 Prefixes, not folders.** Packages stay in `packages/` (workspace glob `packages/*` unchanged) and take a role prefix: `miroir-app-` (framework), `miroir-example-`, `miroir-fixture-`. Folder name = npm package name, as today. Moving to `examples/` or `fixtures/` workspace roots would break every relative path between sibling packages for no gain in readability.
- **D2 Asset prefixes unchanged.** `assets/{prefix}_model/` and `{prefix}_data/` keep their names (`library_model`, `admin_data`, ...): they name the application's deployment, not the package.
- **D3 History left alone.** Feature documents under `code-helpers/features/` other than this one keep the old names: they describe the code as it was. Everything else (code, tests, JSON assets and Deployment rows, `environments/`, build, CI, Docker, release, docs, skills, `package-lock.json`) is updated.
- **D4 `git mv`** for every folder, so history is kept.

## Impact

About 290 tracked files outside `code-helpers/features/` mention an old name: package manifests and imports, MiroirTest and Deployment JSON rows (paths such as `packages/<package>/assets/...`), `build-all.sh`, `Dockerfile`, `ci/build/build_server.sh`, `.github/` workflows and actions, `environments/*.json`, `scripts/nonreg-manifest.json`, `scripts/agent_session_setup.py`, docs and skills. One test builds a name from a template (`miroir-env/tests/testEnvironments.unit.test.ts`).

## Risks

- Stale `node_modules/<old>` links and `dist/` builds after the move: relink workspaces and rebuild before testing.
- Deployment rows that store a package path: covered by the text replacement, checked by `nonreg:filesystem`.
