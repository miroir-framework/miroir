# Using AI in Miroir

The in-app assistant is the CopilotKit sidebar in the standalone app (sparkle icon in the AppBar). The browser never holds provider keys. Inference runs on the **persistence process** (`miroir-server`).

There are two backends behind that same sidebar:

| Backend | What you subscribe to | How Miroir talks to it |
|---|---|---|
| Token | OpenAI, Anthropic, Google, GitHub Models, or an OpenAI-compatible gateway (OpenCode, a local proxy, …) | CopilotKit `serviceAdapter` using `AI_PROVIDER_TYPE` + a named secret |
| Agent | A Cursor API key, or an Anthropic API key | One local agent SDK, picked before start with `features.agentBackend`: `cursor` (`@cursor/sdk`) or `claude` (`@anthropic-ai/claude-agent-sdk`). The agent reaches Miroir through MCP. Not a fifth token provider |

Default omitted pick is the token path. The agent is opt-in in the AppBar when snapshot `agentBackend` is not `"none"`.

MCP for **external** clients (Claude Desktop, ChatGPT connectors, and so on) is a different door: [MCP integration](mcp-integration.md). The in-app agent uses the process `/mcp` URL automatically; you do not paste that URL anywhere.

## Shared setup

Do this once, whichever backend you use.

1. Persistence-side config has `features.ai: true`. Shipped `packages/miroir-server/config/miroirConfig.server.json` already does. Missing `ai` is false. Restart after you change flags. Details: [Process capabilities](../reference/process-capabilities.md).
2. If authentication is on (the server default), **log in**. CopilotKit is identity-gated. [Authentication](../reference/authentication.md).
3. API keys are **named secrets**, not standing env vars after the first import. Generate a wrapping key and keep it: [Named secrets](../reference/authentication.md#named-secrets-270).
4. Run `miroir-server` (Node). Vite at http://localhost:5173 proxies `/api/copilotkit` to the API. A packaged server serves the client at https://localhost:3080 (or http if you have no TLS certs). [Build it yourself](build-it-yourself.md).

The public sandbox page forces `ai` off. The assistant does not appear there.

Packaged **Electron** in this release shows the AI AppBar (`ai` is on in main) but does not import named secrets and ships no agent SDK. Use `miroir-server` for a working assistant.

## Token backend (OpenAI, Anthropic, Google, GitHub, OpenCode, …)

### What to set

These stay in the **environment** on every launch (they are not secrets):

| Variable | Role |
|---|---|
| `AI_PROVIDER_TYPE` | `openai` \| `anthropic` \| `google` \| `github` |
| `AI_MODEL` | Model id the provider expects (for example `gpt-4o`, `claude-sonnet-4-5`, `gemini-2.0-flash`) |
| `AI_BASE_URL` | Optional. OpenAI and Anthropic clients, and GitHub Models. Google ignores it. |

The key is imported **once** into a process-scoped secret, then discarded:

| Provider | Env alias (import) | Secret name |
|---|---|---|
| OpenAI and OpenAI-compatible gateways | `AI_OPENAI_KEY` | `aiOpenaiKey` |
| Anthropic | `AI_ANTHROPIC_KEY` | `aiAnthropicKey` |
| Google Gemini | `AI_GOOGLE_KEY` | `aiGoogleKey` |
| GitHub Models | `AI_GITHUB_TOKEN` | `aiGithubToken` |

Equivalent: `--secret aiOpenaiKey=<value>` (and the other names). A non-empty import without `MIROIR_SECRETS_MASTER_KEY` (or `--secrets-master-key`) fails startup.

### OpenAI subscription

```sh
export MIROIR_SECRETS_MASTER_KEY='<wrapping-key>'
export AI_PROVIDER_TYPE=openai
export AI_MODEL=gpt-4o
export AI_OPENAI_KEY='sk-...'   # first launch only

NODE_ENV=production node packages/miroir-server/release/index.js
```

Later launches keep `MIROIR_SECRETS_MASTER_KEY`, `AI_PROVIDER_TYPE`, and `AI_MODEL`. Drop `AI_OPENAI_KEY`.

### Anthropic subscription

Talk to Anthropic's API with the Anthropic adapter:

```sh
export MIROIR_SECRETS_MASTER_KEY='<wrapping-key>'
export AI_PROVIDER_TYPE=anthropic
export AI_MODEL=claude-sonnet-4-5
export AI_ANTHROPIC_KEY='sk-ant-...'   # first launch only
```

`AI_BASE_URL` is optional if you terminate TLS on a proxy that still speaks the Anthropic API.

### Google

```sh
export AI_PROVIDER_TYPE=google
export AI_MODEL=gemini-2.0-flash
export AI_GOOGLE_KEY='...'   # first launch only; wraps as aiGoogleKey
```

No `AI_BASE_URL` on this adapter.

### GitHub Models / Copilot-style token

Personal access token with `models:read`. Default endpoint is `https://models.inference.ai.azure.com` (Chat Completions, not the Responses API).

```sh
export AI_PROVIDER_TYPE=github
export AI_MODEL=gpt-4o
export AI_GITHUB_TOKEN='ghp_...'   # first launch only; wraps as aiGithubToken
# optional: export AI_BASE_URL='https://models.inference.ai.azure.com'
```

### OpenAI-compatible gateways (OpenCode, local proxies, Azure-style `/v1`, …)

Miroir has no `opencode` provider type. If the product gives you a Chat Completions URL and a bearer key, use the **openai** adapter and point `AI_BASE_URL` at that origin.

```sh
export AI_PROVIDER_TYPE=openai
export AI_MODEL='<id the gateway lists>'
export AI_BASE_URL='https://<gateway>/v1'   # include /v1 if the vendor documents it
export AI_OPENAI_KEY='<gateway key>'        # first launch only; still stored as aiOpenaiKey
```

That covers OpenCode when it exposes an OpenAI-compatible API, and any other `/chat/completions` proxy. If OpenCode (or another host) is only a place you store an **Anthropic** key and you call Anthropic's API yourself, use `AI_PROVIDER_TYPE=anthropic` instead.

There is no first-class `AiConfiguration` admin screen on the request path today. Provider and model come from these env vars (or a request body `aiConfig` the stock UI does not send for the token path).

### Check the token path

```sh
curl -sS https://localhost:3080/api/copilotkit/health
```

Configured token path returns JSON with `configured: true` plus `provider` and `model`. Missing `AI_PROVIDER_TYPE` or `AI_MODEL` returns **503** even if an agent key is imported. This health URL is the token-adapter check, not the agent check.

Open the app, click the AppBar sparkle (**AI Assistant**). Leave the robot icon off (agent pick absent). Send a short message.

## Agent backend (Cursor or Claude)

An agent backend is a **local** SDK agent in the server process. It runs its own loop and calls Miroir tools through MCP, while CopilotKit shows its text and review forms. Each process runs at most one agent SDK, picked before start:

| `features.agentBackend` | SDK | Key (named secret) |
|---|---|---|
| `"none"` (default) | none is loaded | - |
| `"cursor"` | `@cursor/sdk`, model `auto` | `aiCursorKey`, imported from `CURSOR_API_KEY` |
| `"claude"` | `@anthropic-ai/claude-agent-sdk`, model `claude-opus-5-5` or `features.agentModel` | `aiAnthropicKey`, imported from `AI_ANTHROPIC_KEY` (the same secret as the Anthropic token provider) |

The server loads the picked SDK on the first agent request, and never loads the other one. With `ai` off, it does not load `miroir-ai` at all. `features.cursor: true` still works as `agentBackend: "cursor"` for one release; `miroir-env check` warns about it.

Both agents run in a scratch working directory under `os.tmpdir()` (`.miroir-cursor-cwd`, `.miroir-claude-cwd`), not in your application asset tree, and use only the Miroir MCP tools. The Claude agent gets no built-in tool (no shell, file or web tool), reads no Claude settings or MCP servers from disk, and receives only `ANTHROPIC_API_KEY` plus the path, home, temp and proxy variables of the server environment.

### Requirements

- Persistence-side `features.ai` and `features.mcp` **true**, and `features.agentBackend` set. An agent request refuses with HTTP **403** `FeatureUnavailable`, `errorContext.capability` `"agent"`, `"mcp"` or `"ai"`, when one of them is missing.
- The backend's named secret, imported once with `--secret` or its env alias. This is **not** a Miroir login token. When authentication is on, you still log in; CopilotKit sends that session Bearer. A 401 `AuthenticationRequired` is the identity gate, not a rejected key.
- Cursor: Node **≥ 22.13.0** on the server process, and a Cursor **user API key** or **service-account** key from [Cursor Dashboard → API Keys](https://cursor.com/dashboard/api) (Team Admin keys are not accepted). Pricing follows that key's Cursor plan; see [Cursor SDK TypeScript](https://cursor.com/docs/sdk/typescript).
- Claude: an Anthropic API key from the [Claude Console](https://console.anthropic.com/). Usage is billed to that key.

The shipped environments do not set `agentBackend`. Add it to the environment the server runs (for example a personal `environments/local.json`):

```json
{
  "features": {
    "ai": true,
    "mcp": true,
    "agentBackend": "claude",
    "agentModel": "claude-sonnet-5-5"
  }
}
```

`agentModel` is optional and only used by the Claude backend. Restart the server.

### First launch

```sh
export MIROIR_SECRETS_MASTER_KEY='<wrapping-key>'
export AI_ANTHROPIC_KEY='sk-ant-...'   # claude; first launch only, wraps as aiAnthropicKey
# export CURSOR_API_KEY='crsr_...'     # cursor; first launch only, wraps as aiCursorKey

# token env still needed if you want to switch back to the token chat:
# export AI_PROVIDER_TYPE=anthropic
# export AI_MODEL=claude-sonnet-5-5

NODE_ENV=production node packages/miroir-server/release/index.js
```

You can keep both a token provider and the agent configured. The AppBar pick chooses which one `/api/copilotkit` uses.

### In the UI

1. Sparkle icon: open the assistant (needs snapshot `ai`).
2. Robot icon, labelled with the backend (**Cursor** or **Claude**): appears only when snapshot `agentBackend` is not `"none"` **and** the AI shell is shown. Click until the tooltip says the agent is on. The pick is sessionStorage key `miroirAiBackend` (this browser tab), stored as `"agent"`; an older `"cursor"` value reads the same. Clearing it returns to the token path.
3. Chat as usual. The agent calls Miroir MCP at `http://127.0.0.1:<apiPort>/mcp` (ungated, no extra Bearer). When the server runs with TLS certificates, it calls the dedicated MCP listener (`server.mcpUrl` port, plain HTTP) instead. Write tools such as `Library_lendDocument` run immediately. Sidebar **forms** (`propose_generateMiroirEntity`, `propose_lendDocument`) stay CopilotKit review steps: Accept on lend POSTs `/lendDocument`; Reject does not.

If the robot icon is missing, `GET /capabilities` still has `agentBackend: "none"` (config not saved, or you did not restart).

### Docker

The image keeps only the agent SDK it is built for, with the `AGENT_BACKEND` build argument (default `none`; the Claude Agent SDK alone weighs about 250 MB):

```sh
docker build --build-arg AGENT_BACKEND=claude -t miroir-framework/miroir:claude .
```

Set the same `agentBackend` in the `docker` environment of the volume (`/data/environments/docker.json`). A server whose `agentBackend` names an SDK the image does not hold fails at start and names the missing SDK.

### Electron

Packaged Electron ships neither agent SDK. With `agentBackend` set, packaged startup calls `assertAgentSdkPackaged` and fails with a message naming the SDK. Token secrets are also not imported on that process. Use `miroir-server` for an agent; the development (unpackaged) app can load both SDKs.

## What the assistant can do

Frontend CopilotKit actions (both backends, with the agent runtime dropping `generateMiroirReport` / `getMiroirContext` from the **server** execute list):

- Lookups: `lookupApplicationByName`, `lookupDeploymentByApplicationUuid`, `lookupEntityByName`, `findInstanceByName`
- Dates: `getCurrentDate`, `getCurrentTimestamp`
- Review forms: `propose_generateMiroirEntity`, `propose_lendDocument`

The agent can also execute model/data tools through MCP on loopback `/mcp` (names like `Miroir_getInstances`, `Library_lendDocument`). Those writes are not queued for a second review.

Select the Library (or other) application in the sidebar so lookups and lend proposals target the deployment you are looking at.

## If it does not work

| Symptom | What to check |
|---|---|
| No sparkle in the AppBar | `GET /capabilities` → `ai` must be true. Sandbox forces `ai` false. Restart after config edits. |
| Sparkle present, chat 404 | CopilotKit route not mounted (`features.ai` false on the process that serves `/api`). |
| Chat 200 with empty stream / `t.pipe is not a function` | The agent's `run()` must return an RxJS Observable (CopilotKit calls `.pipe()`). Rebuild `miroir-ai` and restart `miroir-server`. |
| DevTools EventStream has `TEXT_MESSAGE_*` but the sidebar stays on the greeting | CopilotKit 1.59 CopilotChat reads `agent.messages` for a local agent named `default`. Messages and the composer each call `useAgent`; if `getAgent("default")` misses, each widget keeps its own provisional agent. The POST still streams; the list you see is the other agent. This build registers one shared `ProxiedCopilotRuntimeAgent` as `selfManagedAgents.default`. Hard-refresh the Vite client after pull. Console `Agent default not found` is the same miss. |
| Chat 401 `AuthenticationRequired` | Miroir login, not the agent key. CopilotKit POSTs to `/api/copilotkit` with the session Bearer (`Authorization` from the login token in sessionStorage). Log in (seed `alice` / `alice-dev` in dev). A 401 after login usually means the SPA is stale; refresh so CopilotKit sends `headers`. |
| Chat 403 `FeatureUnavailable` `agent`, `mcp` or `ai` | Agent pick is on but snapshot has `agentBackend: "none"`, or lacks `mcp` or `ai`. |
| Chat 503 `AI provider not configured` | Token path: set `AI_PROVIDER_TYPE` and `AI_MODEL` on the **server** process. |
| Chat 503 `missing secret \`aiOpenaiKey\`` (or Anthropic/Google/GitHub) | Import the matching env alias once with a wrapping key, then relaunch with the wrapping key only. |
| Chat 503 `missing secret \`aiCursorKey\`` or `aiAnthropicKey` / Node version | Import `CURSOR_API_KEY` or `AI_ANTHROPIC_KEY`; for Cursor use Node ≥ 22.13.0. |
| Server start fails with `Agent SDK is not packaged` | The picked SDK does not resolve: a Docker image built for another `AGENT_BACKEND`, or a packaged Electron app. Rebuild the image with the matching argument, or set `agentBackend` to `"none"`. |
| Chat 503 `Cannot find package '@connectrpc/connect'` (or `@bufbuild/protobuf`, `@statsig/js-client`) | `@cursor/sdk` is present but its runtime packages are not. From the repo root run `npm install`, then restart `miroir-server`. Those packages are declared on `miroir-ai` next to `@cursor/sdk`. |
| `/api/copilotkit/health` is 503 but the agent chat works | Expected: health only looks at `AI_PROVIDER_TYPE` + `AI_MODEL`. |
| Robot icon missing | Snapshot `agentBackend` is `"none"`. |
| Electron chat never has a key | Use `miroir-server` and import secrets there. |

Example health and snapshot (adjust host/scheme):

```sh
curl -sS https://localhost:3080/capabilities
curl -sS https://localhost:3080/api/copilotkit/health
```

## Related

- [Process capabilities](../reference/process-capabilities.md): `ai`, `mcp`, `agentBackend` flags
- [Named secrets](../reference/authentication.md#named-secrets-270): wrapping key, import-once aliases
- [Build it yourself](build-it-yourself.md): server flags, TLS
- [MCP integration](mcp-integration.md): external MCP clients
- [Code splitting](../internals/code-splitting.md): when the CopilotKit chunk loads
- Issues [#244](https://github.com/miroir-framework/miroir/issues/244), [#270](https://github.com/miroir-framework/miroir/issues/270), [#273](https://github.com/miroir-framework/miroir/issues/273), [#275](https://github.com/miroir-framework/miroir/issues/275)
