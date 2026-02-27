# HTTPS Setup — User Installation & Usage Guide

This guide explains how to install and use Miroir with HTTPS enabled.  Choose the section that matches your deployment scenario.

---

## Electron Desktop App (end-user installation)

### Production build (packaged installer)

The packaged Electron application serves its UI through a custom `app://` protocol that does **not** use HTTP or HTTPS.  No TLS configuration is needed.  Simply install and launch the application normally.

### Development preview (running from source)

If you are running the Electron app from source (e.g., to test a pre-release build):

1. Follow the [Developer Setup Guide](./https-setup-developer.md) to install `mkcert` and generate certificates.
2. Start the Vite dev server and then Electron:

```bash
# Terminal 1 — frontend dev server
npm run dev -w miroir-standalone-app

# Terminal 2 — Electron
cd packages/miroir-standalone-app-electron
bash start-dev.sh     # bash/Git Bash (Windows/macOS/Linux)
```

---

## Self-hosted Web App

Choose one of the two deployment strategies below.  **Option A (Caddy)** is recommended because it manages TLS certificates automatically with no manual renewal.

---

### Option A — Reverse proxy with Caddy (recommended)

[Caddy](https://caddyserver.com) automatically obtains and renews Let's Encrypt certificates.  Run the Miroir API server on plain HTTP internally (no cert needed on the app side) and let Caddy handle TLS.

#### 1. Install Caddy

```bash
# Debian / Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# macOS
brew install caddy
```

#### 2. Build the frontend

```bash
npm run build -w miroir-standalone-app
# Static files output → packages/miroir-standalone-app/dist/
```

#### 3. Create `Caddyfile`

```
your-domain.example.com {
    # Serve the built frontend
    root * /path/to/miroir-standalone-app/dist
    file_server

    # Proxy API routes to the Miroir server (running on plain HTTP internally)
    reverse_proxy /query*    localhost:3080
    reverse_proxy /action*   localhost:3080
    reverse_proxy /CRUD*     localhost:3080
}
```

Caddy automatically provisions a Let's Encrypt certificate for `your-domain.example.com`.

#### 4. Start the Miroir server (HTTP only — TLS handled by Caddy)

When running behind a reverse proxy, disable TLS in the Miroir server by pointing env vars to non-existent files or by omitting the cert files (the server falls back to HTTP automatically):

```bash
# Ensure no cert files exist, OR explicitly unset env vars
unset MIROIR_TLS_CERT MIROIR_TLS_KEY
npm run dev -w miroir-server
```

#### 5. Start Caddy

```bash
caddy run --config /path/to/Caddyfile
```

---

### Option B — Direct TLS in the Miroir server

Use this approach for simple self-hosted setups where adding a reverse proxy is not desired.

#### 1. Obtain a TLS certificate

For a public domain (recommended): use [certbot](https://certbot.eff.org) to obtain a free Let's Encrypt certificate:

```bash
sudo certbot certonly --standalone -d your-domain.example.com
# Certificate: /etc/letsencrypt/live/your-domain.example.com/fullchain.pem
# Key:         /etc/letsencrypt/live/your-domain.example.com/privkey.pem
```

For a private/internal network only, use [mkcert](https://github.com/FiloSottile/mkcert) on the server and distribute the CA certificate to all clients (see [Developer Guide](./https-setup-developer.md)).

#### 2. Configure certificate paths

Set environment variables before starting the server:

```bash
export MIROIR_TLS_CERT="/etc/letsencrypt/live/your-domain.example.com/fullchain.pem"
export MIROIR_TLS_KEY="/etc/letsencrypt/live/your-domain.example.com/privkey.pem"
npm run dev -w miroir-server
```

Or create a `.env` file (sourced by your process manager):

```bash
MIROIR_TLS_CERT=/etc/letsencrypt/live/your-domain.example.com/fullchain.pem
MIROIR_TLS_KEY=/etc/letsencrypt/live/your-domain.example.com/privkey.pem
```

#### 3. Update server config

In `packages/miroir-server/config/miroirConfig.server.json`, update `rootApiUrl` to use your domain:

```json
{
  "server": {
    "rootApiUrl": "https://your-domain.example.com:3080"
  }
}
```

#### 4. Update CORS origins

In `packages/miroir-server/src/server.ts`, add your frontend domain to the CORS `origin` array:

```typescript
app.use(cors({
  origin: [
    'https://your-domain.example.com',       // your production frontend
    'https://localhost:5173',                  // dev fallback
  ],
  ...
}));
```

#### 5. Build and deploy the frontend

```bash
npm run build -w miroir-standalone-app
```

Copy the `packages/miroir-standalone-app/dist/` directory to your web server (nginx, Caddy served statically, etc.) or serve it through Express:

```bash
# Serve dist/ with a simple static server (example)
npx serve packages/miroir-standalone-app/dist
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `MIROIR_TLS_CERT` | `<repo-root>/certs/localhost.pem` | Path to the TLS certificate (PEM) |
| `MIROIR_TLS_KEY` | `<repo-root>/certs/localhost-key.pem` | Path to the TLS private key (PEM) |
| `NODE_EXTRA_CA_CERTS` | _(not set)_ | Path to additional root CA PEM trusted by Node.js. Required when using mkcert or a private CA. |

---

## Verifying HTTPS is active

When the server starts with TLS enabled, the log output will show:

```
HTTPS server listening on port 3080
  cert: /path/to/localhost.pem
  key:  /path/to/localhost-key.pem
```

When falling back to plain HTTP (cert files absent):

```
[WARN] TLS certificate files not found — falling back to plain HTTP.
  Expected cert: /path/to/localhost.pem
  Expected key:  /path/to/localhost-key.pem
  Run  scripts/setup-https.sh  (bash) or  scripts/setup-https.ps1  (PowerShell) to generate local certificates.
```
