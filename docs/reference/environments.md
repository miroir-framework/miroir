# Environments Reference

**Audience:** framework contributors and anyone running Miroir from this repository (server, web client, tests, coding-agent sessions, miroir-cli, miroir-mcp, Electron, Docker).
**Scope:** how an environment is selected, the definition file format, where running state lives, the `miroir-env` command, and how deviations are reported. Introduced by #321; every runtime adopted it with #345.

---

## Key points

- An **environment** says which applications are installed and where each of their stores lives. It is one JSON file in `environments/`, validated by the `miroirEnvironment` ML schema.
- Every runtime takes its configuration from an environment ([Runtimes](#runtimes)): the server, the web client served by Vite, the tests, coding-agent sessions, miroir-cli, miroir-mcp, Electron and Docker. There is no other per-run configuration file (the release binary run outside a checkout, without `MIROIR_ROOT`, is the one exception).
- **Running state** (Admin data, copied stores, applications installed from the UI) lives in the gitignored `.miroir/<environment>/`. Running Miroir or its tests never writes tracked files; the application models you edit live in their package assets are the exception, on purpose.
- `npm run miroir-env -- show` prints the resolved environment; `npm run miroir-env -- check` compares the state with it. Deviations warn locally and fail in CI and nonreg.

---

## The environments of this repository

| Environment | Used by | Stores |
|---|---|---|
| `dev` | default for the server and the web client | models edited **live** in the package assets; Admin data **copied** in `.miroir/dev/`; the only one, with `test-filesystem`, that installs Meta (`miroir-app-meta`, live, since its data is the tracked bundle size history) |
| `local` | `environments/local.json`, gitignored: a developer's own environment | whatever it declares, usually `{ "extends": "dev" }` plus extra applications |
| `cloud-agent` | coding-agent cloud sessions (`local.json` = `{ "extends": "cloud-agent" }`) | `dev` with the AI features off |
| `test-filesystem` | profile `emulatedServer-filesystem`, `realServer-filesystem` | every section copied in `.miroir/test-filesystem/` |
| `test-sql` | profile `emulatedServer-sql` (the default), `realServer-sql`, transformer sessions without a profile | Postgres schemas `test_sql_<application>`; Admin copied in `.miroir/test-sql/` |
| `test-indexedDb` | profile `emulatedServer-indexedDb`, `realServer-indexedDb` | IndexedDB stores named `.miroir/test-indexedDb/<application>/indexedDb…`; Admin copied in `.miroir/test-indexedDb/` |
| `test-mongodb` | profile `emulatedServer-mongodb`, `realServer-mongodb` | MongoDB databases `test_mongodb_<application>`; Admin copied in `.miroir/test-mongodb/` |
| `docker` | the Docker images (`MIROIR_ROOT=/data`) | Miroir, Admin, Library **live** in the volume, which is already a copy of the image's seed ([docker.md](docker.md)) |
| `desktop` | the packaged Electron application (`MIROIR_ROOT=<user data>/miroir`) | Miroir and Admin **live** in the user data folder, seeded on first start |

Test environments (`test-*`) hold copies only: a `live` section in a test environment is refused.

---

## Runtimes

| Runtime | Environment | How it gets there |
|---|---|---|
| miroir-server (checkout) | the selected one | `npm run` or `node packages/miroir-server/release/index.js` from the checkout |
| miroir-server (release binary elsewhere) | none | `--config <file>`, default `config/miroirConfig.server.json` ([build-it-yourself.md](../guides/build-it-yourself.md)); `MIROIR_ROOT` switches it to an environment |
| Web client (Vite) | the selected one | `vite.config.js` injects its client configuration ([Web client](#web-client)) |
| Tests (vitest, MiroirTest) | `test-<storage>` | `--profile`, or `MIROIR_ENV=test-*`; default `test-sql` (`test-filesystem` for miroir-mcp and miroir-cli) |
| Coding-agent sessions | `cloud-agent` | `environments/local.json` written by `agent_session_setup.py --cloud-agent` |
| miroir-cli | the selected one | `--env <name>` (same as `MIROIR_ENV`); prints `environment: <name>, selected by …` on stderr |
| miroir-mcp | the one of its host | a library: miroir-server and Electron start it on their DomainController; its tests run on `test-filesystem` |
| Electron, development | the selected one | the main process boots it (`src/environmentBoot.ts`), the renderer asks for its client configuration over IPC (`get-client-config`) |
| Electron, packaged | `desktop` | first start copies `resources/miroir-assets` to `<user data>/miroir`; `MIROIR_ROOT` points there |
| Docker | `docker` | `MIROIR_ROOT=/data`, `MIROIR_ENV=docker` in the image; the entrypoint seeds `/data` from `/seed` ([docker.md](docker.md)) |

Electron and Docker share one seeding rule: copy the seed into an empty root; on later starts keep everything and only add the environment definitions the root lacks.

---

## Selection

First match wins:

1. `--name <environment>` (the `miroir-env` command only);
2. `MIROIR_ENV`;
3. `environments/local.json`;
4. `dev`.

`miroir-env show` and the server log both print the selected environment and why it was selected (for example `selected by environments/local.json`).

The environments are read from `<root>/environments/`, where the root is `MIROIR_ROOT` when set, else the repository root found above the working directory. `MIROIR_ROOT` runs an environment outside a checkout (Docker, packaged Electron): the root then holds `environments/` and the application assets.

Tests select their environment through their profile (`--profile emulatedServer-filesystem` sets `MIROIR_ENV=test-filesystem`). A test run ignores, with a warning, a `MIROIR_ENV` that is not a test environment: tests never run on `dev` or `local`.

`scripts/agent_session_setup.py --cloud-agent` (run by the Claude Code SessionStart hook) writes `environments/local.json` = `{ "extends": "cloud-agent" }` when the file is absent, and never touches an existing one. Without `--cloud-agent` it writes nothing.

---

## Definition file format

```json
{
  "name": "dev",
  "extends": "…",
  "description": "…",
  "server": { "rootApiUrl": "https://localhost:3080", "mcpUrl": "https://localhost:4080", "corsAllowedOrigins": ["http://localhost:5173"] },
  "client": { "mode": "realServer" },
  "features": { "ai": true, "mcp": true },
  "connections": {
    "postgres": { "host": "localhost", "port": 5432, "user": "postgres", "passwordEnv": "MIROIR_POSTGRES_PASSWORD" },
    "mongodb": { "url": "mongodb://localhost:27017/" }
  },
  "applications": {
    "library": {
      "package": "miroir-example-library",
      "selfApplication": "5af03c98-fe5e-490b-b08f-e1230971c57f",
      "deployment": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
      "store": "filesystem",
      "mode": "live",
      "sections": { "data": { "mode": "copy" }, "modelVersion": {} }
    }
  }
}
```

| Field | Meaning |
|---|---|
| `extends` | Name of the environment this one is merged over. Objects merge key by key; `null` removes an inherited entry (for example `"applications": { "designer": null }`). |
| `server` | What the server of this environment listens on. `rootApiUrl` is also the URL the web client calls. |
| `client.mode` | `realServer` (a client calls a running server) or `emulatedServer` (tests: the client runs the server in-process). |
| `features` | Process capabilities of the server ([Process capabilities](process-capabilities.md)). Never sent to the web client. |
| `connections.postgres` | Host, port, user and database of Postgres stores. `passwordEnv` names the variable that holds the password; a definition never contains a password. |
| `connections.mongodb` | URL of MongoDB stores. |
| `applications.<key>` | One installed application. The key names it in paths (`.miroir/<env>/<key>/…`) and in store names. |
| `packagesDirectory` | Where the application packages are, relative to the root: `packages` by default, `.` when each package's `assets/` sits directly under the root (`docker`, `desktop`). |
| `package` | The folder of `packagesDirectory` whose `assets/` hold the application's sections (`<key>_model`, `<key>_data`, `<key>_modelVersion`; `assetPrefix` overrides `<key>`). |
| `selfApplication`, `deployment` | The application and deployment uuids. Admin and Miroir must use the uuids the platform opens. |
| `store` | `filesystem`, `sql`, `indexedDb` or `mongodb`. |
| `mode` | `live`: the section is the package folder itself (filesystem only, never in `test-*`). `copy`: the section lives in the state, seeded from the package on first use. |
| `sections` | Per-section `mode` / `store` overrides for `model`, `data`, `modelVersion`. Declaring `modelVersion` adds that section. The `admin` section follows the application. |
| `configuration` | A complete store configuration used as given, instead of `package` / `store` / `mode` (applications installed outside the package layout, for example from the UI). |

`logPreset` and `secrets` are accepted by the schema but not read yet.

Paths are relative to the root (`MIROIR_ROOT`, else the repository root), which is the filesystem root of every environment.

---

## State directory

```
.miroir/<environment>/
  env.lock.json              definition the state was built from (show and the server report a change)
  admin/data/                Admin data: users, rights, secrets, view settings; Deployment and
                             AdminApplication rows generated from the definition
  <application>/<section>/   copied sections (mode "copy")
  apps/                      stores of applications installed at runtime (Runners deployApplication,
                             createApplication)
```

- Copies are seeded from the package assets the first time they are needed. Test sessions wipe and seed their copies once per test file.
- At start, the server writes the Deployment and AdminApplication rows the definition implies, then opens every deployment.
- While the server runs with `environments/local.json` selected, `local.json` follows the Deployment rows it writes and deletes, so an application installed from the UI is recorded there. With a tracked environment selected, the server logs a hint to run `miroir-env import` instead.

### Worker state

`MIROIR_TEST_WORKER=w<N>` gives a run of a test environment a state of its own, so parallel nonreg jobs (#477) never touch the same stores: `.miroir/<environment>@w<N>/`, SQL schemas and MongoDB databases `<environment>_w<N>_<application>` (`test_sql_w2_library`), IndexedDB names under `.miroir/<environment>@w<N>/`. Test applications installed at run time take the same prefix. The definition and its name do not change: only where the state lives. A worker name other than `w<number>` is an error; outside `test-*` environments the variable is ignored with a warning.

---

## The `miroir-env` command

`npm run miroir-env -- <command>` (after `npm run build -w miroir-env`). Every command takes `--name <environment>`.

| Command | Does |
|---|---|
| `show [--json]` | Prints the selected environment, its source, the files it is built from, where its state stands, and each deployment with its stores. |
| `check [--strict] [--tracked-clean]` | Validates every definition, then compares the state of the selected environment with it: rows the next start creates or rewrites, deployments the definition does not install, pre-#321 rows in the package Admin data. `--tracked-clean` also fails when asset files under `packages/*/assets`, `packages/*/tests/assets` or `packages/*/tests/test_assets` differ from `HEAD`. |
| `import [--dry-run]` | Records the deployments of the state that the definition does not install in `environments/local.json`. |
| `prune [--dry-run]` | Deletes those deployments and their stores from the state. Stop the server first. |
| `deploy <app> [--state <dir>] [--dry-run]` | Deploys example application `packages/miroir-example-<app>` (`github` or `miroir-example-github`) in the Admin data of the state, `.miroir/<environment>/` or `--state <dir>`: an AdminApplication row and a Deployment row opening the package assets live. Does nothing when the application is already deployed. The definition does not install it: record it with `import`. |
| `clear` | Removes the state of a test environment: its `.miroir/<environment>/` directory, its SQL schemas and its MongoDB databases, test applications installed at run time included. With `MIROIR_TEST_WORKER` set, removes only that worker's state; without it, keeps the workers' states. A schema or database whose name also starts with the name of another, longer environment (`test_sql_w2_*` when `test-sql-w2` exists) is kept. Honors `MIROIR_TEST_POSTGRES_HOST` and `MIROIR_TEST_MONGODB_CONNECTION_STRING`; a server that does not answer gives a `warning:` line. Refuses an environment that is not `test-*`. |

---

## Deviations

| Deviation | Locally | Under `--strict` or `CI` |
|---|---|---|
| Invalid definition, unknown `extends`, `live` section in a test environment | error | error |
| Deployment in the state that the definition does not install | warning (opened anyway) | error |
| Deployment rows left in the package Admin data by a pre-#321 checkout | warning | error |
| Database password variable (`passwordEnv`) not set, for an environment with Postgres stores | warning | error |
| A shell variable that contradicts the test profile (for example `MIROIR_TEST_APP_STORE_TYPE`) | warning, the shell value is kept | error |
| Asset files changed (`--tracked-clean`, nonreg) | error | error |

Where the checks run:

- **PR checks** (`.github/workflows/pr-checks.yml`): `npm run miroir-env -- check --strict --tracked-clean`, also in the pre-push gate of `AGENTS.md`.
- **Nonreg** (`scripts/run-nonreg.py`): every tier starts with `unit-321-environment-before`, which records the asset files already changed (a developer's own edits), `miroir-env show --json` (`environment.json`) and the warnings of `miroir-env check --snapshot` (`environment-check-before.json`, e.g. an application deployed by hand) in the snapshot. Every tier ends with `unit-321-tracked-assets`, which fails when the run changed an asset file, then runs `miroir-env check --strict --since` that file: only warnings the run brought fail.

---

## Web client

`vite.config.js` (`vite/environmentConfig.js`) injects:

- `__MIROIR_CLIENT_CONFIG__`: the client configuration of the selected environment, read by `src/index.tsx`. Vite also proxies the API routes to that environment's `rootApiUrl`. Served without certificates, the client calls it over HTTP, like the server listens.
- `__MIROIR_TEST_CLIENT_CONFIGS__`: for in-app test runs, the configuration of each `realServer-<storage>` profile, built from `test-<storage>`. A served client seeds the copies missing from `.miroir/test-*/`.

No database password reaches the browser. For `realServer-sql` from the browser, start the server with `PGPASSWORD` (or `~/.pgpass`).

---

## First run of an existing checkout

Before #321, applications installed from the UI were written into `packages/miroir-app-admin/assets/admin_data`, which the server no longer reads. `npm run miroir-env -- check` lists those rows, and `npm run miroir-env -- import` records the deployments in `environments/local.json`.

---

## Related

- [Testing reference](testing.md): profiles, `MIROIR_TEST_CLIENT`, test environments per store.
- [Data architecture: deployments](data-architecture-deployments.md): store backends and deployment layout.
- [Docker reference](docker.md): the `docker` environment and the image seed.
- Design and decisions: `code-helpers/features/321-BUILD-environment-configuration/analysis.md`, and for the runtimes `code-helpers/features/345-BUILD-runtimes-adopt-environments/analysis.md`.
