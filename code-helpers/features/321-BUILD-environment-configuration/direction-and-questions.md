# 321 — Proposed direction and open questions (grilling round 1)

> Draft direction for per-developer and per-test environment configuration, built on [current-state-inventory.md](current-state-inventory.md), and the first round of decisions for A. `analysis.md` is written once these are settled.

## Proposed direction

Today three things are fused in `packages/miroir-test-app_deployment-*/assets` (inventory F1–F3). The direction separates them:

| Layer | Content | Where | Versioned? |
|---|---|---|---|
| **Application source** | model and seed data of each application (framework: Miroir, Admin model; examples: Library, Designer, Spotify, Postgres; test fixtures: appForTest) | `packages/*/assets` as today | yes, reviewed in PRs |
| **Environment definition** | a named environment: the applications installed, for each one its store backend and **mode** (`live`: sections point at the package assets, so UI edits land in git; `copy`: seeded into the environment's state directory), connection settings, secret *names*, server and client settings, log preset | one file per environment, in a single folder; tracked for shared environments (`dev`, each test profile, `cloud-agent`, `docker`), gitignored for a developer's own (`local`, which extends a tracked one) | shared ones yes; personal ones no |
| **Environment state** | the live Admin store (Deployment, AdminApplication, users, rights, secrets, ViewParams) and every `copy`-mode store | a gitignored directory per environment, created and reconciled from the definition at startup | no |

One resolver reads the selected environment and produces what each runtime needs today (server config, client config, test profile, the boot Admin/Miroir deployments), so the hardcoded `deployment_Admin` store location, the `webMiroirConfigName` constant and the per-profile JSONs all derive from one place. A single command prints the resolved environment (the "one consistent view"), and a check compares the live Admin Deployment rows with the definition and warns on any deviation (for example an application installed from the UI that the definition does not list).

## Round 1 questions

❓ **Q1 - Where the live Admin registry lives**: Deployment, AdminApplication, users, rights, secrets and ViewParams rows are written at runtime into tracked `miroir-test-app_deployment-admin/assets/admin_data` (F2, F8). Options: (a) keep as today; (b) move the live Admin data to a gitignored per-environment state directory, the tracked `admin_data` becoming only the seed; (c) move it outside the repo (`~/.miroir/`).

➡️ (b). It removes the merge conflicts and accidental secret commits, keeps everything inside the checkout, and follows the Docker seed-then-copy precedent.

❓ **Q2 - Form of an environment definition**: (a) a JSON file per environment, validated by an ML schema, readable before any store opens; (b) instances of a new Entity in the Admin application, edited from the UI.

➡️ (a), with the ML schema in the Miroir model so it can later be shown and edited through a Report. The Admin rows are derived from the file, not the other way round, because the file must be read before Admin can be opened.

❓ **Q3 - Live editing of application source**: keep a per-application `live` mode (model/data sections on the package assets, UI edits become git diffs) next to a `copy` mode?

➡️ Yes. `live` for Miroir, Library, Designer, Spotify and Postgres in the default `dev` environment; `copy` for every application in every test environment, so no test can touch `packages/*/assets`.

❓ **Q4 - How a developer picks and changes their environment**: a gitignored `local` definition that `extends` a tracked one and overrides what differs (installed apps, store backends, connection strings), selected with an environment variable (`MIROIR_ENV`), defaulting to `local` when it exists, else `dev`.

➡️ Yes. Installing an application from the UI then also records it in the `local` definition, so the "managed" path and the UI path agree.

❓ **Q5 - Test environments**: each test profile becomes a named, tracked environment; each run starts from a fresh `copy` of Admin seeded from the one canonical Admin package, and the three drifted Admin copies (standalone-app, miroir-mcp, miroir-core tests; F4) are retired.

➡️ Yes. This also removes the committed test output of §5.3 and the manual snapshot/restore in `PersistenceStoreController.integ`.

❓ **Q6 - Deviation handling**: what happens when the live state differs from the definition, or a shell variable overrides a profile (today silent, §5.1)?

➡️ Warn locally (startup log + a check command); fail in CI and in nonreg, which also records the resolved environment in its snapshot.

❓ **Q7 - Dead and stale configuration**: 5 unreferenced test profiles, the dead client config, `Jenkinsfile` and the `ci/` Docker test scripts, Electron's unreferenced `assets/*.json`, the stale `admin_data` in library / postgres / spotify, and the `*_DO_NOT_USE` deployment files. Delete them in an early slice?

➡️ Yes, unless you still run Jenkins or `ci/build/test_core.sh` somewhere; say which to keep.

❓ **Q8 - Runtimes in scope for this issue**: (a) server, web client, test launchers, nonreg and cloud-session setup; (b) also Docker, Electron, miroir-cli and standalone miroir-mcp.

➡️ (a), with (b) adopting the same resolver in follow-up issues. The CLI and Docker paths look broken today (inventory §4) and deserve their own fixes.

❓ **Q9 - Package naming**: separate framework applications (Miroir, Admin), examples (Library, Designer, Spotify, Postgres) and test fixtures (appForTest) in names and folders, in this issue or later?

➡️ Later, in a follow-up issue once environments exist, so this issue's diffs stay about configuration and the renames touch fewer config paths.
