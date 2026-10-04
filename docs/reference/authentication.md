# Authentication (#71) and access (#262, #263, #264)

Platform users prove identity with a username and password stored in the **Admin** application (`MiroirUser` + `MiroirUserCredential`). Successful login returns a Bearer token. After identity, `MiroirRight` is evaluated as a **union**:

- An **application** grant on `(user, targetType=application, targetUuid)` allows every deployment of that application.
- A **deployment** grant on `(user, targetType=deployment, targetUuid)` allows that deployment only.
- Either is enough. `capability` is ignored. Admin and Miroir (and their deployments) are always allowed. Designer and Library need a grant of either kind.

Hatch-off skips both identity and rights (today’s open API).

## Hatch (startup only)

Authentication defaults **on**. Turn it off to restore today’s open API (no login UI, no 401, no principal). The hatch is **not** an Admin or application setting.

| Source | Name | Notes |
|---|---|---|
| CLI | `--disable-auth` / `--enable-auth` | Last flag wins |
| Env | `MIROIR_AUTH_ENABLED` | `0` / `false` / `off` disables; `1` / `true` / `on` enables |
| Config | `server.authentication.enabled` | In the server JSON passed to `--config` |
| Default | enabled | When none of the above set a value |

Precedence: CLI > env > config > default on.

Test launchers set `MIROIR_AUTH_ENABLED=0` when unset so non-regression stays on the open path.

Token secret (optional): `server.authentication.tokenSecret` or `MIROIR_AUTH_TOKEN_SECRET`. If both are missing and auth is on, the process generates an ephemeral secret (tokens die on restart). **Do not reuse that value as the secrets wrapping key** — an ephemeral token secret would make every `MiroirSecret` row unreadable after restart.

Wrapping key (optional until the first persisted or imported secret exists): `--secrets-master-key` or `MIROIR_SECRETS_MASTER_KEY`. This is the **only standing launch secret** after named secrets have been imported. There is no ephemeral wrapping key: a launch that must decrypt existing rows, or that passes `--secret` / `MIROIR_SECRET_*` / AI key env vars, fails if the wrapping key is missing. Generate it once — [Generate the wrapping key](#generate-the-wrapping-key). See also [named secrets](#named-secrets-270).

## HTTP

| Method | Path | When auth is on |
|---|---|---|
| GET | `/auth/status` | Public. `{ "enabled": boolean }` only |
| POST | `/auth/login` | Public. Body `{ "username", "password" }` → `{ token, principal }` |
| POST | `/auth/change-password` | Requires Bearer. Body `{ "currentPassword", "newPassword" }` → `{ changed: true }`. Updates only the principal’s `MiroirUserCredential`. |
| CRUD / action / query | existing REST | Requires `Authorization: Bearer <token>`, then application **or** deployment access |
| `/api/copilotkit` | same Express app | Same Bearer gate |
| `/mcp` | main app and MCP listener | Same Bearer gate, under the [MCP switch](#mcp) |

Seed logins (dev only):

| Username | Password | Access |
|---|---|---|
| `alice` | `alice-dev` | Library application grant (covers the Library filesystem deployment). Designer denied. Admin and Miroir always allowed. |
| `dave` | `dave-dev` | Library **filesystem deployment** grant only (no Library application grant). Designer denied. Admin and Miroir always allowed. |
| `carol` | `carol-dev` | No application or deployment grants. Admin and Miroir always allowed. Library and Designer denied. |
| `bob` | — | Inactive; cannot log in. |

Change seed passwords after first use.

Denied REST returns **403** `{ "status": "error", "errorType": "AccessDenied" }`. Missing or unusable identity still returns **401** `AuthenticationRequired`. Unknown `deploymentUuid` is 403. The UI shows an application if the user has an application grant **or** any granted deployment of that application, and sends a denied report URL to `/?page=home`. A configuration refresh (`storeManagementAction_openStore` for every non-Admin deployment) **warns and skips** an AccessDenied store; it still loads Admin, Miroir, and any other deployment the principal may open. CopilotKit stays identity-only (no `deploymentUuid` on the request). A second Library deployment (same-app narrowing) is not in this increment.

Generic CRUD/query responses strip `passwordHash` and `ciphertext`. Generic create/update/delete of `MiroirUserCredential` or `MiroirSecret` is rejected; only `POST /auth/change-password` may update the principal’s hash, and only labeled `secrets.set` / `secrets.delete` (CLI `--secret` import, or the same labels on a domain action) may set or delete a named secret. MCP tool **responses** are redacted the same way (not only logs). Duplicate `username` or credential FK values fail closed at login (same `AuthenticationFailed` body). After login, REST/CopilotKit re-bind the token to the current Admin directory so a deactivated user cannot keep using an unexpired token. The browser treats an expired or malformed stored token as logged out, and `RestClient` clears the session on `AuthenticationRequired`.

## Named secrets (#270)

Admin entity `MiroirSecret` (uuid `a96856df-2b38-494a-8027-82617e2d64ad`) stores process-scoped rows (`miroirUser` absent) and per-user rows (`miroirUser` set). Ciphertext is AES-256-GCM (`aes-256-gcm$<iv>$<ciphertext>$<tag>`, base64url). `resolveSecret(name, principal?)` prefers a user-scoped row when a principal is present, otherwise the process row.

`--secret` / `MIROIR_SECRET_*` / `AI_OPENAI_KEY` / `AI_ANTHROPIC_KEY` / `AI_GOOGLE_KEY` / `AI_GITHUB_TOKEN` / `CURSOR_API_KEY` import **process-scoped** rows once, then are discarded. Steady-state launch is the wrapping key alone. How to turn the in-app assistant on with those keys: [Using AI in Miroir](../guides/using-ai.md). `registerSecrets` remains an in-process **test hatch** (used by Spotify integ and `LIVE_SPOTIFY_*`). The Admin lightbulb menu lists existing secrets (same list/detail reports as Users and Rights). Writes go through CLI `--secret` import or labeled `secrets.set` / `secrets.delete` actions.

The default Admin seed (and Docker first-run copy of it) has **no** `MiroirSecret` instance rows. `docker compose up` does not need a wrapping key until you import or persist a secret.

### Generate the wrapping key

Miroir does not generate `MIROIR_SECRETS_MASTER_KEY`. It is any UTF-8 string you choose; the process SHA-256-hashes it and uses that digest as the AES-256-GCM key. Pick a **high-entropy** value once, store it outside the repo (env, secret store, Compose override — not committed JSON), and pass the **same** string on every later launch. A lost or changed key makes every `MiroirSecret` row unreadable. There is no ephemeral wrapping key.

```sh
python -c "import secrets; print(secrets.token_urlsafe(32))"
# or: openssl rand -base64 32
```

Then:

```sh
export MIROIR_SECRETS_MASTER_KEY='<that-value>'
# or: --secrets-master-key '<that-value>'
```

Do **not** reuse `MIROIR_AUTH_TOKEN_SECRET` (that one can be ephemeral). Tests use the dummy `test-secrets-master`; do not use that in a real deployment. Launch examples: [Build it yourself §7](../guides/build-it-yourself.md#7-start-the-server).

## MCP, CLI and Electron (#263)

With authentication on, these three doors ask for the same identity and apply the same access rule as REST: a Bearer token from `/auth/login`, then an application or deployment grant (Admin and Miroir always allowed). With the hatch off they stay open, as before.

### MCP

Both MCP routes are gated: the dedicated listener (`server.mcpUrl`, default port 4080) and `/mcp` on the main app.

- A POST without a valid `Authorization: Bearer <token>` gets HTTP **401** `AuthenticationRequired`.
- A tool call on an application the user may not open returns a tool error of type `AccessDenied`. Other tools in the same session still work.
- The in-app agent (Claude or Cursor backend) sends the CopilotKit caller's `Authorization` to `/mcp`, so its tool calls run as the logged-in user.

MCP has its own switch, so non-regression or a trusted local client can keep MCP open while the rest is gated:

| Source | Name | Notes |
|---|---|---|
| CLI | `--disable-mcp-auth` / `--enable-mcp-auth` | Last flag wins |
| Env | `MIROIR_MCP_AUTH_ENABLED` | Same values as `MIROIR_AUTH_ENABLED` |
| Config | `server.authentication.mcp` | Server JSON, or `server.authentication` of the environment |
| Default | follows the global hatch | |

The global hatch wins: with authentication off, MCP is open whatever this switch says. Test launchers set `MIROIR_MCP_AUTH_ENABLED=0` when unset.

### miroir-cli

The CLI uses the same hatch (`--disable-auth` / `--enable-auth`, `MIROIR_AUTH_ENABLED`, `server.authentication.enabled` of the environment). With it on, every command except `list` and `help` needs one of:

- `--user <name>`, with the password in `MIROIR_PASSWORD` or typed at the prompt (no echo). Without a terminal and without `MIROIR_PASSWORD`, the CLI stops.
- `--token <bearer>` or `MIROIR_AUTH_TOKEN`: a token issued by a server with the same `MIROIR_AUTH_TOKEN_SECRET`. A token from another secret is refused.

A failed login prints `{ "status": "error", "error": { "type": "AuthenticationFailed" } }` and exits 1; an inactive user and a wrong password look the same. A command on an application the user may not open fails with `AccessDenied`.

### Electron

The desktop app follows the same hatch, default on; turn it off with `--disable-auth`, `MIROIR_AUTH_ENABLED=0` or `server.authentication.enabled: false` in the environment. With it on, the renderer shows the login page and logs in over IPC. Every `rest-call`, `server-action` and `server-query` message carries the session Bearer; the main process answers `AuthenticationRequired` without one and `AccessDenied` for an application the user may not open. The loopback `/api/copilotkit` and `/mcp` routes are gated like the server's, `/mcp` under the MCP switch.

## Legacy

Client JSON field `monoUserAutentification` has never been read. Do not use it as the hatch.
