# Docker Reference

**Audience:** anyone building or running the Miroir Docker image.
**Scope:** the two Dockerfiles, what the image seeds, and how the server finds its configuration. Environments in general: [environments.md](environments.md).

---

## Images

| File | Built by | Contents |
|---|---|---|
| `Dockerfile` (root) | `docker compose up` (`docker-compose.yml`) | multi-stage: builds the monorepo, keeps `node_modules`, `packages/`, the server release bundle and the web client (served by the server from `public/`) |
| `docker/miroir-server/Dockerfile` | CI (`build-linux-runnables.yml`, `ci/docker/build_miroir.sh`) | the server release bundle `packages/miroir-server/release/` built beforehand |

Both use `tini` as PID 1, `packages/miroir-server/docker-entrypoint.sh` as entrypoint, port 3080, and volumes `/data` (application data) and `/certs` (TLS certificates, optional).

---

## Configuration: the `docker` environment

The server runs the tracked environment `environments/docker.json` (#345):

- `MIROIR_ROOT=/data`, `MIROIR_ENV=docker` are set in both images; the server takes its settings (`rootApiUrl`, CORS origins, `features.ai` / `features.mcp`) and the applications to open from that definition.
- `packagesDirectory: "."`: each application's assets live at `/data/<package>/assets` (for example `/data/miroir-app-admin/assets/admin_data`).
- Applications: Miroir, Admin, Library, every section `live` in `/data` (the volume is already the copy).
- At every start the server writes the Deployment and AdminApplication rows of Admin data from the definition; applications installed from the UI go to `/data/.miroir/docker/apps/` and stay registered in Admin data.

There is no server config file in the image any more (`miroirConfig.server.docker.json` was removed with #345).

---

## Seed-then-copy

The image holds a seed in `/seed`:

```
/seed/environments/docker.json
/seed/miroir-app-miroir/assets/          (model, data, modelVersion)
/seed/miroir-app-admin/assets/           (model, data without Deployment / AdminApplication rows)
/seed/miroir-example-library/assets/     (library_model, library_data)
```

The entrypoint:

1. copies `/seed` into an empty `/data` (first start);
2. on a non-empty `/data`: applies the #344 package-rename migration, and copies the definitions of `/seed/environments/` that `/data/environments/` lacks (volumes seeded before #345), never overwriting one;
3. sets up TLS from `/certs` when `localhost.pem` and `localhost-key.pem` are there;
4. starts the server.

`MIROIR_SEED_DIR` and `MIROIR_DATA_DIR` override `/seed` and `/data` (tests: `scripts/tests/test_docker_entrypoint.py`).

A volume seeded by an image from before #345 keeps its data: its Admin and Miroir Deployment rows are rewritten from the definition at the next start, and deployments the definition does not install (for example Spotify's row from the old seed) are opened with a warning.

---

## Usage

```bash
docker compose up           # build and start; the first run seeds the miroir-data volume
docker compose down -v      # stop and delete the volume (destroys its data)
```

To change the configuration, edit `environments/docker.json` in the volume (`/data/environments/docker.json`) and restart the container.

---

## Related

- [Environments](environments.md)
- `code-helpers/features/345-BUILD-runtimes-adopt-environments/analysis.md`
