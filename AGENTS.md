## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Cursor Cloud specific instructions

This is the **Miroir Framework**, an npm-workspaces monorepo (packages/*, Node 20+/22, `package-lock.json`). The update script runs `npm install` plus a fix for npm optional-dependency bug #4828 (a plain `npm install` fails to install `@rollup/rollup-linux-x64-gnu`, so `miroir-core`/Vite builds crash with "Cannot find module @rollup/rollup-linux-x64-gnu"). If you hit that error after a manual install, run `npm install --no-save @rollup/rollup-linux-x64-gnu@$(node -p "require('rollup/package.json').version")`.

### Building
- Standard build order/commands live in `build-all.sh` and `docs/guides/build-it-yourself.md`; per-package scripts are in each `package.json`.
- Known caveat (see issue #190, guide disclaims validation): the from-scratch **`.d.ts` (tsup `dts`) phase fails with a circular bootstrap between `miroir-core` and `miroir-test-app_deployment-*` (e.g. "has no exported member named 'JzodObject'"). The **runtime ESM output (`dist/index.js`) is still emitted for every package** before that phase fails, and Vite dev + vitest only need the JS. To get a runnable dev tree, build every workspace lib's JS tolerating the DTS non-zero exit (loop `npm run build -w <pkg>` over the deployment/core/localcache/store/react/diagram packages). Use `NODE_OPTIONS=--max-old-space-size=6144` for Vite/ncc steps.

### Running the app (dev)
- Two services: `miroir-server` (REST API + AI/MCP, port 3080) and `miroir-standalone-app` (React SPA via Vite, port 5173). The web client is hardcoded to `miroirConfigRealServerFilesystemGit`, so it always expects the server at `https://localhost:3080` (filesystem store rooted at the repo, no Postgres needed).
- `miroir-server` has **no dev script**; build a bundle once with `npm run build:server -w miroir-server` then `npm run copy:release-config -w miroir-server`. It also needs `miroir-ai` built (`npm run build -w miroir-ai`).
- Run the server **API-only** with `NODE_ENV=development` (in `prod` mode it refuses to start unless a built client exists at `release/client`): from `packages/miroir-server`, `NODE_EXTRA_CA_CERTS=$(mkcert -CAROOT)/rootCA.pem NODE_ENV=development node release/index.js`. Then run the client: `npm run dev -w miroir-standalone-app`.
- TLS: run `bash scripts/setup-https.sh` (needs `mkcert`) to create `certs/`; both server and Vite auto-enable HTTPS when certs exist. The client calls the server **cross-origin** at `https://localhost:3080`, so Chrome must trust the mkcert CA — add it to Chrome's NSS store (`certutil -d sql:$HOME/.local/share/pki/nssdb -A -t "C,," -n mkcert -i $(mkcert -CAROOT)/rootCA.pem`) and restart Chrome, otherwise background fetches fail silently.
- GUI data caveat: with the shipped `miroirConfigRealServerFilesystemGit` web config the SPA renders but the "Application" selector stays empty — the client does not auto-fetch the deployment list (no calls to :3080 on load). The server engine itself works; verify/drive it via the REST API, e.g. `GET https://localhost:3080/CRUD/<deploymentUuid>/<model|data>/entity/<entityUuid>/all` and create/delete via `POST`/`DELETE https://localhost:3080/CRUD/<deploymentUuid>/<section>/entity` with body `{"deploymentUuid":"...","crudInstances":[<instance>]}`. Known deployment UUIDs: Miroir `10ff36f2-50a3-48d8-b80f-e48e5d13af8e`, Admin `18db21bf-f8d3-4f6a-8296-84b69f6dc48b`; the meta "Entity" entity is `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`.

### Tests / typecheck
- The `nonreg` npm scripts invoke `python` (not `python3`); `python-is-python3` is installed in this environment.
- `npm run nonreg:unit` runs the no-dependency unit tier (passes). The `default`/integration tiers need Postgres (`postgres://postgres:postgres@localhost:5432/postgres`) or a specific store profile; run them via the runner with `python scripts/run-nonreg.py --tier default --profile <emulatedServer-filesystem|emulatedServer-sql> --only <stepId>` **from the repo root** (profile configs resolve paths relative to `process.env.PWD`, and several test/CI configs contain hardcoded `/build/...` or personal absolute paths).
- There is no ESLint config; `npm run typecheck` (`tsc --noEmit`) is the closest gate and currently reports ~31 pre-existing type errors (mostly `miroir-standalone-app` tests/views and `miroir-sandbox`).
