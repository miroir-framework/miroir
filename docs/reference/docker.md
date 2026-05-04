All 6 files are created. Here's a summary of everything that was built:

---

**Files created:**

| File | Purpose |
|---|---|
| Dockerfile | Multi-stage build: `node:20-alpine` builder → slim production image |
| .dockerignore | Excludes node_modules, dist, certs, Electron releases from build context |
| docker-compose.yml | One-command `docker compose up`, named volume `miroir-data` |
| docker-entrypoint.sh | Detects empty `/data`, seeds from `/seed/`, then starts the server |
| miroirConfig.server.docker.json | `rootApiUrl: http://localhost:3080`, `filesystemDeploymentRootDirectory: /data`, plain HTTP |
| packages/miroir-server/docker/seed/…/f714bb2f-…json | Docker-compatible library deployment record (no `..` path traversal) |

**Key design decisions applied:**
- **Single container**: Express serves both the SPA (from `public/`) and the API
- **Plain HTTP** on port 3080 — TLS termination is the reverse-proxy's job
- **`/data` volume**: seeded on first run with miroir + admin framework data + library demo, user deployments accumulate there
- **Library demo fix**: the original deployment record has broken `../` paths; the Docker-specific JSON in `docker/seed/` overrides it with correct absolute-relative paths matching `/data` as the root
- **`node:20-alpine`** base image, `tini` for PID-1 signal handling, devDeps pruned before final stage copy

**Usage:**
```bash
docker compose up           # builds + starts; first run seeds /data
# then open http://localhost:3080
docker compose down -v      # ⚠️ also wipes the data volume
``` 