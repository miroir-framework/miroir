# 321 — Proposed direction and design questions

> Draft direction for per-developer and per-test environment configuration, built on [current-state-inventory.md](current-state-inventory.md), and the design questions put to A, with answers. `analysis.md` is written once they are settled.

## Proposed direction

Today three things are fused in `packages/miroir-test-app_deployment-*/assets` (inventory F1–F3). The direction separates them:

| Layer | Content | Where | Versioned? |
|---|---|---|---|
| **Application source** | model and seed data of each application (framework: Miroir, Admin model; examples: Library, Designer, Spotify, Postgres; test fixtures: appForTest) | `packages/*/assets` as today | yes, reviewed in PRs |
| **Environment definition** | a named environment: the applications installed, for each one its store backend and **mode** (`live`: sections point at the package assets, so UI edits land in git; `copy`: seeded into the environment's state directory), connection settings, secret *names*, server and client settings, log preset | one file per environment, in a single folder; tracked for shared environments (`dev`, each test profile, `cloud-agent`, `docker`), gitignored for a developer's own (`local`, which extends a tracked one) | shared ones yes; personal ones no |
| **Environment state** | the live Admin store (Deployment, AdminApplication, users, rights, secrets, ViewParams) and every `copy`-mode store | a gitignored directory per environment, created and reconciled from the definition at startup | no |

One resolver reads the selected environment and produces what each runtime needs today (server config, client config, test profile, the boot Admin/Miroir deployments), so the hardcoded `deployment_Admin` store location, the `webMiroirConfigName` constant and the per-profile JSONs all derive from one place. A single command prints the resolved environment (the "one consistent view"), and a check compares the live Admin Deployment rows with the definition and warns on any deviation (for example an application installed from the UI that the definition does not list).

## Round 1 questions

**Answered 2026-09-27: all recommendations accepted.** On Q7, A has not run Jenkins in a while, does not know which `ci/` scripts are still useful, wants them kept compatible with the new setup as far as possible, and plans a release soon that may need some of them (see round 2, R2-Q1 and R2-Q2).

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

## Round 2 questions

❓ **R2-Q1 - Which `ci/` pieces to keep**: [inventory §5.5](current-state-inventory.md) splits them in two. The release path is in use: `ci/release/` (release tree, tested by `release-tree.yml`), `ci/docker/build_miroir.sh` + `ci/lib/common.sh` + `docker/miroir-server/Dockerfile` (Docker job of `build-linux-runnables.yml`), and `ci/claude-cloud-env-script.sh`. The Jenkins era is referenced only by itself: `Jenkinsfile`, `ci/build/*.sh`, `ci/tests/config/*.json`, `docker/ci/`, `docker/ci-builder-electronDEFUNCT/`, plus the older root `Dockerfile` / `docker-compose.yml`, which cannot build as written.

➡️ Keep the release path and make it consume a tracked `docker` environment (its seed then comes from the environment instead of the `docker/seed` overlay). Delete the Jenkins-era set and the root `Dockerfile` / `docker-compose.yml`, after the release.

❓ **R2-Q2 - Release timing**: release from `_integration` as it is now, before any #321 change lands, or after?

➡️ Before. #321 first ships only documents and the cleanup waits for the release. Separately, the release Docker image looks like it reads its config from `/miroir/config/` while the Dockerfile puts it in `/miroir/release/` (inventory §4, not run): worth a small fix of its own before the release, which I can do in a separate thread.

❓ **R2-Q3 - Where the files live**: tracked definitions in a top-level `environments/` folder (`dev.json`, `test-filesystem.json`, `test-sql.json`, `test-indexedDb.json`, `test-mongodb.json`, `cloud-agent.json`, `docker.json`), the personal `environments/local.json` gitignored, and environment state in a gitignored `.miroir/<environment>/` at the repo root.

➡️ Yes.

❓ **R2-Q4 - What an environment definition holds**: installed applications (package and SelfApplication uuid), for each its mode (`live` / `copy`) and store backend per section (`admin`, `model`, `data`, `modelVersion`); server settings (URLs, ports, CORS, features); client mode (real or emulated server); log preset; database hosts and users, with passwords only as environment-variable references; the names of expected secrets; `extends` for inheritance. Test-only mechanics (ephemeral run targets, `hostMode: "isolated"`) stay in test code.

➡️ Yes.

❓ **R2-Q5 - Transition from today's configuration files**: the resolver builds `MiroirConfigServer` / `MiroirConfigClient` and the test profile values in memory from the environment. Today's inputs (`--config`, `VITE_MIROIR_TEST_CONFIG_FILENAME`, `--profile`, `webMiroirConfigName`) keep working during the transition with a deprecation warning, and the 39 files are removed slice by slice once nothing reads them.

➡️ Yes; `--profile <name>` becomes an alias of `MIROIR_ENV=test-<name>`.

❓ **R2-Q6 - The Admin application itself in `dev`**: Admin's **model** (Entities, Reports, Menu) stays `live` on the package, so editing Admin from the UI still changes git; Admin's **data** lives in the environment state. Of today's tracked `admin_data`, users, credentials, rights, Bundle, ApplicationVersion and the default ViewParams stay as tracked **seed**; Deployment and AdminApplication rows are **generated** from the environment definition; secrets and a developer's ViewParams changes never go back to git.

➡️ Yes.

❓ **R2-Q7 - First run for an existing checkout**: your current tracked Admin data may list applications you deployed locally. On the first run with the new setup, an `env import` command reads the current Admin Deployment rows and writes the differences into `environments/local.json`; it is run by hand, not automatically.

➡️ Yes.

❓ **R2-Q8 - Reconciliation at startup**: definition → state. Missing deployments are created; a deployment present in the state but absent from the definition (for example installed from the UI while the `local` file could not be written) triggers a warning and is kept. Nothing is deleted automatically; an explicit `env prune` removes extras.

➡️ Yes.

❓ **R2-Q9 - What CI checks**: GitHub Actions runs no integration test today. Add to `pr-checks.yml` a fast `env check` that validates every tracked environment against its ML schema and fails if any tracked file under `packages/*/assets` or `tests/assets` changed during the job; running nonreg in CI stays out of scope.

➡️ Yes.
