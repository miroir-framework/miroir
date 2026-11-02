# Miroir application

Created by `npm create @miroir-framework/app`.

```bash
npm install
npm run build      # the server (tsc, into dist-server/) and the client (Vite, into dist/)
npm start          # http://localhost:3080
```

`PORT=4000 npm start` listens on another port. The server listens on this machine only; `HOST=0.0.0.0 npm start`
opens it to the network, with authentication on (below). `npm run dev:client` serves the client with Vite on port 5173, against a
running server.

## Layout

| Path | What it is |
|---|---|
| `environments/local.json` | The environment: server URL, the applications and where each one is stored |
| `src/server/server.ts` | The server: seeds `.miroir/` on first start, opens the deployments, serves Miroir's routes and `dist/` |
| `src/client/index.tsx` | The client: one startup call, then Miroir's shell |
| `.miroir/local/` | The data of the Miroir and Admin applications (filesystem store), copied from `@miroir-framework/core` on first start |

## Storage

Each application of `environments/local.json` has a `store`. The project starts on `filesystem`. For Postgres, add the
store package (`npm install @miroir-framework/store-postgres`), register it in `src/server/server.ts`
(`stores: [miroirFileSystemStoreSectionStartup, miroirPostgresStoreSectionStartup]`), and declare the connection:

```json
"connections": { "postgres": { "host": "localhost", "port": 5432, "user": "postgres", "passwordEnv": "MIROIR_POSTGRES_PASSWORD" } }
```

then set `"store": "postgres"` on the application. The environment format is described in Miroir's
[`docs/reference/environments.md`](https://github.com/miroir-framework/miroir/blob/main/docs/reference/environments.md).

## Authentication

Off in `environments/local.json` (`server.authentication.enabled`). Turn it on before the server is reachable by
anyone else; the client then shows Miroir's login page. Set `MIROIR_AUTH_TOKEN_SECRET` so that sessions survive a
restart.
