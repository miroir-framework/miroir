# 321 — Environment configuration: current-state inventory

> One view of how the platform is configured today: which applications exist, where their deployments are declared, and which configuration each runtime and each test uses, locally, in CI and in Claude cloud sessions. First step of #321; the design (`analysis.md`) follows once the open questions are settled.

- Issue: https://github.com/miroir-framework/miroir/issues/321
- Related: [#234 deployment inventory](../234-FEATURE-versioning-modes-and-asset-migration/deployment-inventory.md), [#157 configurable filesystem deployment root](<../157-FEATURE- harden startup sequence & enable admin deployment choice on client - server/PLAN.md>), [data-architecture-deployments.md](../../../docs/reference/data-architecture-deployments.md), [docs/reference/testing.md](../../../docs/reference/testing.md)
- Snapshot: branch `claude/environment-configuration-7z5rjb`, 2026-09-27 (same tree as `_integration`).

## 1. Summary

| # | Finding | Consequence |
|---|---|---|
| F1 | The **Admin application's data is the live registry of installed applications**: the server opens `deployment_Admin` and `deployment_Miroir` (hardcoded, imported from `miroir-test-app_deployment-admin`), then reads every `Deployment` row (entity `7959d814`) from Admin data and opens it ([server.ts:376-401, 450-515](../../../packages/miroir-server/src/server.ts)). | Which apps a developer sees is decided by files in git, not by a per-developer setting. |
| F2 | In dev, the server's `filesystemDeploymentRootDirectory` is `".."` ([miroirConfig.server.json](../../../packages/miroir-server/config/miroirConfig.server.json)), i.e. `packages/`. The Admin deployment's stores point at `miroir-test-app_deployment-admin/assets`. | Every runtime write to Admin (deploy / create / drop application, rights, secrets, ViewParams, password change) edits **tracked files**. This is the merge-conflict source. |
| F3 | The same mechanism is what makes live model editing work: Library, Designer and Miroir deployments point their `model` / `data` sections at their package `assets/`. | UI edits land as JSON diffs in git. Wanted behaviour, but today it is inseparable from F2. |
| F4 | **Four tracked copies of the Admin application** (model + data) exist, and they drift: deployment-admin (28 model files), standalone-app `tests/assets` (21), miroir-mcp `tests/assets` (18), miroir-core `tests/test_assets` (18), plus the Docker seed overlay. `diff -rq` between the first two reports 26 differences. | Tests run on an Admin model that is not the shipped one. |
| F5 | **Tests write into the tracked test Admin copy** (`miroir-standalone-app/tests/assets/admin_data`) under every emulated profile; committed files already contain test output (§5.3). | Non-reproducible test baseline; noisy diffs. |
| F6 | **39 tracked configuration files** (§4), with 5 test profiles unreferenced, 1 dead client config, machine-specific paths (`/users/nono/…`, `C:/Users/nono/…`, `/home/workspace/…`, `/build/miroir`, `192.168.1.160`), and drifted duplicates (`ci/tests/config` vs `tests/miroirConfig.test-ci-*`). | Nobody can tell from one place which configuration a given run uses. |
| F7 | The **web client's config is chosen by a hardcoded constant** (`webMiroirConfigName = "miroirConfigRealServerFilesystemGit"`, [index.tsx:141](../../../packages/miroir-standalone-app/src/index.tsx)); switching means editing source. | A per-developer choice becomes a tracked diff. |
| F8 | **Per-developer values are stored in tracked Admin data**: ViewParams `441cb6fd` holds `sidebarWidth`, `postgresConnectionString`, `mongoConnectionString`; `MiroirSecret` rows (`a96856df/`, not gitignored) receive encrypted secrets when a developer imports one. | Local preferences and secrets can be committed by accident (they were, then deleted, in #270). |
| F9 | Nothing compares what is running with what configuration management says; no warning exists for a deviation. | Required by #321. |

## 2. Applications

| Package | SelfApplication | Role today | Registered in git Admin data? | Depended on by |
|---|---|---|---|---|
| `miroir-test-app_deployment-miroir` | `360fcf1f` Miroir, `versioned-internal` | **Framework**: meta-model, core Entities, runners, MiroirTest instances | yes, `10ff36f2` | 19 packages (standalone-app imports it in 110 files) |
| `miroir-test-app_deployment-admin` | `55af124e` Admin, `unversioned` | **Framework**: registry of apps/deployments, users, rights, secrets, ViewParams | yes, `18db21bf` (also hardcoded in miroir-core `Deployment.ts:58,79-82`) | cli, core, mcp, react, sandbox, server, electron, appForTest, library, postgres, spotify |
| `miroir-test-app_deployment-library` | `5af03c98` Library | Example, **used by many tests** | yes, `f714bb2f` | ai, cli, core, redux, zustand, mcp, react, server, standalone-app |
| `miroir-test-app_deployment-designer` | `880831db` Designer | Example | yes, `f0359240` | none (only the Admin row and the Dockerfile) |
| `miroir-test-app_deployment-spotify` | `00514586` Spotify | Example, used by `externalServices-spotify` tests | **no** (only in `spotify/assets/admin_data` and the Docker seed); yet Admin rights `9a968c7b`, `f46164d0` grant access to it | standalone-app |
| `miroir-test-app_deployment-postgres` | `84d28eb1` Postgres manager | Example | **no** | none; `index.ts` is fully commented out |
| `miroir-test-app_deployment-appForTest` | `eef01001-0001…` appForTest, `versioned-internal` | **Test fixture** | **no** | standalone-app |

Every package also ships `assets/deployment/*.json` exported as `*_DO_NOT_USE`, and library / postgres carry a stale `admin_data/7959d814…/f714bb2f.json` ("Deployment of application library", mongodb stores, the Library uuid).

## 3. Deployment declarations (programmatic enumeration)

Every tracked `Deployment` row (entity `7959d814`), by location. Paths are relative to the runtime's `filesystemDeploymentRootDirectory`.

| Location | Rows | Stores | Used by |
|---|---|---|---|
| `miroir-test-app_deployment-admin/assets/admin_data` | Admin `18db21bf`, Miroir `10ff36f2`, Library `f714bb2f`, Designer `f0359240` | filesystem, all in `packages/*/assets` (Miroir's `admin` section points at `…-miroir/src/assets`, which does not exist in git and is created at runtime) | dev server, Electron dev, realServer test profiles |
| `miroir-standalone-app/tests/assets/admin_data` | Admin `18db21bf` (fs `../miroir-standalone-app/tests/assets/*`), Miroir `10ff36f2` and Library `f714bb2f` (indexedDb, `tests/tmp`), Spotify `fd47d115` (fs `tests/tmp`), 3× `testApplication_CreateEntity` (sql) | mixed; **test output** | every emulated test profile (Admin section) |
| `miroir-mcp/tests/assets/admin_data` | Admin, Miroir, Library | fs `miroir-mcp/tests/{assets,tmp}` | miroir-mcp standalone tests |
| `miroir-core/tests/test_assets/admin_data` | Admin, Miroir, Library | fs, broken paths (`../miroir-test-app_deployment-admin-admin/…`, `test/test_assets/…`) | miroir-core unit fixtures |
| `miroir-server/docker/seed/…/admin_data` | Library `f714bb2f`, Spotify `fd47d115` | fs, no `..` | Docker image, overlaid on the git Admin data |
| `miroir-test-app_deployment-{library,postgres}/assets/admin_data` | `f714bb2f` | mongodb | nothing (leftover of a deploy run) |
| `miroir-test-app_deployment-spotify/assets/admin_data` | Spotify `fd47d115` | fs | nothing at runtime |

Code that writes `AdminApplication` + `Deployment` rows into the Admin data section:

| Writer | Where |
|---|---|
| Stored Runner `deployApplication` (UI: Install application) | `miroir_data/e54d7dc1…/4f3cd0b1….json:870-1001` |
| Stored Runner `createApplication` and its TS twin | `bcc872dc….json:633-760`, `Runner_CreateApplication.tsx:380-500` |
| `createDeploymentCompositeAction` (tests, playfields) | [Deployment.ts:132-257](../../../packages/miroir-core/src/1_core/Deployment.ts) |
| Stored Runner `dropApplication` (deletes them) | `1cd065d8….json:77-120` |
| Other runtime writes into Admin data | ViewParams (`ViewParamsUpdateQueue.ts:119-131`), MiroirSecret (`SecretsService.ts:295,358`), credential change, testbed rights |

## 4. Runtime configurations

| Runtime | How the config is chosen | Config file(s) | Where Admin lives | Writes into tracked files? |
|---|---|---|---|---|
| **miroir-server (dev)** | `--config`, default `../config/miroirConfig.server.json` resolved against the bundle file ([parseServerArgs.ts:23](../../../packages/miroir-core/src/4_services/parseServerArgs.ts), `server.ts:216-218`) | `miroirConfig.server.json`: URLs, CORS, features, root `".."`. No deployments. | hardcoded `deployment_Admin` → `packages/miroir-test-app_deployment-admin/assets` | **yes** |
| **Web client (Vite)** | hardcoded constant `index.tsx:141`; no env var | `src/assets/miroirConfig-realServer-filesystem-git.json` (active), 4 selectable, `miroirConfig.json` fallback, 1 dead | real-server mode uses only `rootApiUrl`; the server decides stores | via the server |
| **Electron** | code (`ipcServerSetup.ts:184-191`, `index.tsx:431-454`) + `app.config.json` root (dev `".."`, prod `./resources/miroir-assets`) | `app.config.json`; `assets/{10ff36f2,18db21bf}.json` are unreferenced | dev: git assets; packaged: copied assets | dev: **yes** |
| **Docker** | Dockerfile copies `miroirConfig.server.docker.json` (root `/data`) | + `docker/seed/` overlay, `docker-entrypoint.sh` seeds `/data` on first run | `/data` (copy) | no. Build looks broken (`build-tsup` script missing, `CMD dist/server.js` vs `release/index.js`), not run |
| **miroir-cli** | `--config` → `MIROIR_CLI_CONFIG_PATH` → embedded `src/config/defaultConfig.json` | opens only `deploymentStorageConfig` entries | `./tests/assets/*` (does not exist in the package) | no. Filesystem stores likely fail: the schema drops `filesystemDeploymentRootDirectory` (`configSchema.ts:46-55`); inferred, not run |
| **miroir-mcp standalone** | `MIROIR_MCP_CONFIG_PATH` → `src/config/defaultConfig.json` | own fixture copies under `miroir-mcp/tests/` | tracked copy | its tracked copy |
| **miroir-mcp in server** | none, uses the server's controller | — | server's | as server |
| **miroir-sandbox** | code, bundled Admin + Miroir | `bundledData.ts:44-62` | bundled, read-only | no |

Secrets and credentials:
- Postgres `postgres:postgres` appears in 103 tracked places; hosts `localhost`, `host.docker.internal`, `172.24.0.8`, `192.168.1.160` (test default, [IntegrationTestSession.ts:61](../../../packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.ts)).
- API keys enter via `--secret` / `MIROIR_SECRET_*` / `AI_*` and are stored AES-256-GCM encrypted as `MiroirSecret` rows; the wrapping key `MIROIR_SECRETS_MASTER_KEY` is supplied at launch. In dev those rows land in tracked `admin_data/a96856df…/`.
- 3 scrypt password hashes are tracked in `admin_data/6c3ab489…/`; 4 test ciphertexts in `miroir-test-app_deployment-admin/tests/secrets/`.

## 5. Test configurations

### 5.1 How a test run picks its configuration

- `--profile <name>` ([integrationTestProfiles.ts:47-108](../../../packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts)) maps to `tests/miroirConfig.test-<name>.json` and sets `VITE_MIROIR_TEST_CONFIG_FILENAME`, `VITE_MIROIR_LOG_CONFIG_FILENAME`, `MIROIR_TEST_{APP,ADMIN}_STORE_TYPE`, `MIROIR_TEST_POSTGRES_HOST`, `MIROIR_TEST_ADMIN_SQL_SCHEMA`.
- **Variables already in the shell override the profile silently** (`respectExistingEnv` defaults to true, `:166-168,206`).
- The four emulated profile JSONs hardcode root `/users/nono/documents/devhome/miroir-app-dev/packages`; `applyPortableFilesystemDeploymentRoot` ([fileTools.ts:26-48](../../../packages/miroir-standalone-app/tests/utils/fileTools.ts)) rewrites it to `<repo>/packages` (or `MIROIR_TEST_FILESYSTEM_ROOT`) when that path is missing.
- Without a profile, `IntegrationTestSession` defaults to sql on `192.168.1.160` (docs say `localhost`).

### 5.2 Profiles and entry points

| Profile / entry | Admin store | App stores | Needs | Used by |
|---|---|---|---|---|
| `emulatedServer-sql` | fs tracked `standalone-app/tests/assets/admin*` | Postgres `localhost` | PostgreSQL | nonreg `default` tier |
| `emulatedServer-filesystem` | same | fs `tests/tmp/*` (gitignored) | — | nonreg `filesystem` tier; always used by freeze, spotify, 281, 270 steps |
| `emulatedServer-indexedDb` | same | LevelDB `tests/tmp` | — | manual |
| `emulatedServer-mongodb` | `../miroir-standalone-app/tests/assets/admin` (resolves outside `packages/`, looks broken) | MongoDB | MongoDB | manual |
| `realServer-{sql,filesystem,indexedDb,mongodb}` | **git `miroir-test-app_deployment-admin/assets`** | per store | running server | manual; no nonreg step |
| `ci-emulatedServer-{host,dockerized}-sql` | none → code falls back to `deployment_Admin` = **git Admin assets** (`src/miroir-fwk/4-tests/runnerIntegTestSupport.ts:260-264`) | Postgres docker | Postgres | registered, not in nonreg |
| `ci-emulatedServer-{filesystem,indexedDb}`, `mixed_*`, `docker-*`, `test.json` | none | absolute machine paths | stale | 5 unreferenced; `Jenkinsfile:67-90`, `ci/build/test_core.sh` |
| miroir-core unit, `testMiroir --mode unit`, guards, `modelValidation`, component tests | none | memory / `os.tmpdir()` / read-only walks | — | nonreg `unit` tier, PR checks |
| `testMiroir --mode integ` core suites | env only | sql `testApplication` or fs `tests/tmp/testApplication` | Postgres under default | nonreg |
| runner / `domain_controller_*` / appstack steps | profile JSON | per JSON; ephemeral run targets | Postgres under default | nonreg; `ensureMiroirPlatform` / `ensureLibraryPlayfield` **upsert Deployment rows into tracked `tests/assets/admin_data`** |

### 5.3 Committed test output in the test Admin copy

`miroir-standalone-app/tests/assets/admin_data/7959d814…/`: `10ff36f2` and `f714bb2f` renamed "Deployment of application …" with `tests/tmp/indexedDb-*` stores; `2ae62d8b`, `9d0a5637`, `f3ad7464` (`testApplication_CreateEntity`, sql) with 4 matching AdminApplications in `25d935e7…/` (`01ce212d`, `2ffe2114`, `57621786`, `ac47391c`). `PersistenceStoreController.integ.test.tsx:202-205,268-271` snapshots and restores two fixtures by hand for that reason.

### 5.4 CI and Claude cloud sessions

- GitHub Actions: only `pr-checks.yml` (skill sync, pytest, miroir-core typecheck and unit tests). No integration test, no nonreg, no database.
- Claude cloud: `.claude/settings.json` SessionStart runs `scripts/agent_session_setup.py` (builds packages, reports Postgres state); no profile or env defaults. `ci/claude-cloud-env-script.sh` hardcodes `/home/user/miroir`.
- `scripts/run-nonreg.py` records each step's `requires` but never skips on it; steps marked `"requires": "none"` that take `{profile}` still need Postgres under the default profile (appstack-273, integ-action-274, appstack-274, 284).
- Jenkins and `ci/` Docker scripts reference removed `specificLoggersConfig_*` files and absolute paths.

## 6. Hardcoded identities and paths (to be absorbed by an environment definition)

| What | Where |
|---|---|
| `deployment_Admin` / `deployment_Miroir` as the boot deployments | `miroir-core/src/1_core/Deployment.ts:58,79-82`; `server.ts:376-379`; Electron `index.tsx:438`; `miroir-core/src/ApplicationDeploymentAdmin.ts` (marked TODO REMOVE) |
| Library `f714bb2f` fallback | `library/src/resolveLibraryDeploymentUuid.ts:25`; local `Deployment` literals in 6 test files |
| Miroir app `360fcf1f` fallback | CLI, MCP (`mcpServer.ts`) |
| Malformed pinned test uuid `bbbbbbb-bbbb-…` (7 chars) | `src/miroir-fwk/4-tests/IntegrationTestSession.ts:93` |
| Machine paths / hosts | §5.1, §4 |

## 7. What is already right (to keep)

- Application **model** as reviewed JSON in git, editable live from the UI (F3).
- Test app stores under gitignored `tests/tmp`, ephemeral run targets and `hostMode: "isolated"` identities; `seedMiroirModelVersionTmpFromPackageAssets.ts` copies `miroir_modelVersion` into tmp instead of pointing at package assets.
- Docker's **seed then copy** pattern (`docker/seed` overlay, `/data` on first run): the closest existing precedent for "tracked template, untracked live state".
- Secrets encrypted at rest with a launch-time wrapping key.
