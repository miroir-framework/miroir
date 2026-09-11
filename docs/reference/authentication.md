# Authentication (#71) and access (#262, #264)

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

Wrapping key (optional until the first persisted or imported secret exists): `--secrets-master-key` or `MIROIR_SECRETS_MASTER_KEY`. This is the **only standing launch secret** after named secrets have been imported. There is no ephemeral wrapping key: a launch that must decrypt existing rows, or that passes `--secret` / `MIROIR_SECRET_*` / AI key env vars, fails if the wrapping key is missing. See [named secrets](#named-secrets-270).

## HTTP

| Method | Path | When auth is on |
|---|---|---|
| GET | `/auth/status` | Public. `{ "enabled": boolean }` only |
| POST | `/auth/login` | Public. Body `{ "username", "password" }` → `{ token, principal }` |
| POST | `/auth/change-password` | Requires Bearer. Body `{ "currentPassword", "newPassword" }` → `{ changed: true }`. Updates only the principal’s `MiroirUserCredential`. |
| GET | `/secrets` | Requires Bearer. `{ "secrets": [ { "name", "scope": "process" \| "user", "miroirUser"? } ] }` — names and scopes only. Process rows plus the caller’s own user-scoped rows. Never `ciphertext` or plaintext. |
| POST | `/secrets` | Requires Bearer. Body `{ "name", "value", "scope": "process" \| "user" }` → `{ "set": true }`. Process write: any authenticated user (until #219 C2). User write: **self only**. |
| DELETE | `/secrets` | Requires Bearer. Body `{ "name", "scope": "process" \| "user" }` → `{ "deleted": true }`. Same writer rules as POST. |
| CRUD / action / query | existing REST | Requires `Authorization: Bearer <token>`, then application **or** deployment access |
| `/api/copilotkit` | same Express app | Same Bearer gate |

Seed logins (dev only):

| Username | Password | Access |
|---|---|---|
| `alice` | `alice-dev` | Library application grant (covers the Library filesystem deployment). Designer denied. Admin and Miroir always allowed. |
| `dave` | `dave-dev` | Library **filesystem deployment** grant only (no Library application grant). Designer denied. Admin and Miroir always allowed. |
| `carol` | `carol-dev` | No application or deployment grants. Admin and Miroir always allowed. Library and Designer denied. |
| `bob` | — | Inactive; cannot log in. |

Change seed passwords after first use.

Denied REST returns **403** `{ "status": "error", "errorType": "AccessDenied" }`. Missing or unusable identity still returns **401** `AuthenticationRequired`. Unknown `deploymentUuid` is 403. The UI shows an application if the user has an application grant **or** any granted deployment of that application, and sends a denied report URL to `/?page=home`. CopilotKit stays identity-only (no `deploymentUuid` on the request). A second Library deployment (same-app narrowing) is not in this increment.

Generic CRUD/query responses strip `passwordHash` and `ciphertext`. Generic create/update/delete of `MiroirUserCredential` or `MiroirSecret` is rejected; only `POST /auth/change-password` may update the principal’s hash, and only `POST`/`DELETE` `/secrets` may set or delete a named secret. MCP tool **responses** are redacted the same way (not only logs). Duplicate `username` or credential FK values fail closed at login (same `AuthenticationFailed` body). After login, REST/CopilotKit re-bind the token to the current Admin directory so a deactivated user cannot keep using an unexpired token. The browser treats an expired or malformed stored token as logged out, and `RestClient` clears the session on `AuthenticationRequired`.

## Named secrets (#270)

Admin entity `MiroirSecret` (uuid `a96856df-2b38-494a-8027-82617e2d64ad`) stores process-scoped rows (`miroirUser` absent) and per-user rows (`miroirUser` set). Ciphertext is AES-256-GCM (`aes-256-gcm$<iv>$<ciphertext>$<tag>`, base64url). `resolveSecret(name, principal?)` prefers a user-scoped row when a principal is present, otherwise the process row.

`--secret` / `MIROIR_SECRET_*` / `AI_OPENAI_KEY` / `AI_ANTHROPIC_KEY` / `AI_GOOGLE_KEY` / `AI_GITHUB_TOKEN` import **process-scoped** rows once, then are discarded. Steady-state launch is the wrapping key alone. `registerSecrets` remains an in-process **test hatch** (used by Spotify integ and `LIVE_SPOTIFY_*`). The UI form is `/?page=secrets` (no Admin menu item). Vite-dev proxies `/secrets` like `/auth`.

## Not gated yet

MCP (`mcpUrl`, default port 4080), `miroir-cli`, and Electron IPC stay open. Follow-up: [#263](https://github.com/miroir-framework/miroir/issues/263).

## Legacy

Client JSON field `monoUserAutentification` has never been read. Do not use it as the hatch.
