# Authentication (#71)

Platform users prove identity with a username and password stored in the **Admin** application (`MiroirUser` + `MiroirUserCredential`). Successful login returns a Bearer token. `MiroirRight` is **not** evaluated in this increment.

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

Token secret (optional): `server.authentication.tokenSecret` or `MIROIR_AUTH_TOKEN_SECRET`. If both are missing and auth is on, the process generates an ephemeral secret (tokens die on restart).

## HTTP

| Method | Path | When auth is on |
|---|---|---|
| GET | `/auth/status` | Public. `{ "enabled": boolean }` only |
| POST | `/auth/login` | Public. Body `{ "username", "password" }` → `{ token, principal }` |
| POST | `/auth/change-password` | Requires Bearer. Body `{ "currentPassword", "newPassword" }` → `{ changed: true }`. Updates only the principal’s `MiroirUserCredential`. |
| CRUD / action / query | existing REST | Requires `Authorization: Bearer <token>` |
| `/api/copilotkit` | same Express app | Same Bearer gate |

Seed login (dev only): username `alice`, password `alice-dev`. Change it after first use. User `bob` is inactive and cannot log in.

## Not gated yet (R3)

MCP (`mcpUrl`, default port 4080), `miroir-cli`, and Electron IPC stay open. They should reuse `AuthPrincipal`, `extractPrincipalFromAuthorizationHeader`, and `assertRequestAllowed` later.

## Legacy

Client JSON field `monoUserAutentification` has never been read. Do not use it as the hatch.
