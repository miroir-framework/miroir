# 339 — ExternalServiceClient: inject its environment instead of module-level state

> How `ExternalServiceClient` gets its fetch, OAuth2 token cache, secret resolver, rotated-secret
> persistence and insecure base URL policy today (module state and setters), and the injected
> design that replaces it: an `ExternalServiceEnvironment` built in the composition roots and a
> client built on it, handed to `DomainController` at construction.

Related issue: https://github.com/miroir-framework/miroir/issues/339
Parent: #330 (PR #336, review commit c9522f6) · Related: #267, #270, #284
Related analyses: [`../330-FEATURE-report-level-miroir-tests/`](../330-FEATURE-report-level-miroir-tests/), [`../270-FEATURE-persistent-named-secrets/`](../270-FEATURE-persistent-named-secrets/), [`../284-FEATURE-openapi-connection-wizard/`](../284-FEATURE-openapi-connection-wizard/)
Key sources: [`ExternalServiceClient.ts`](../../../packages/miroir-core/src/4_services/ExternalServiceClient.ts), [`OutboundFetch.ts`](../../../packages/miroir-core/src/1_core/OutboundFetch.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`runReportTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReportTest.tsx)

**Status:** decisions taken by the agent with recommended defaults (A to confirm or overturn on the PR).

---

## Decision record

| Decision | Choice |
|---|---|
| D1 What `DomainController` receives | **A client** (`ExternalServiceClientInterface`) built on an environment: layer 3 depends on an interface only |
| D2 Where the default environment lives | **`miroir-core/src/5_setup/externalServiceEnvironment.ts`**, used by `setupMiroirDomainController` when its caller passes no client |
| D3 Token cache ownership | **An object in the environment** (`ExternalServiceTokenCache`, with `clear()`), created per environment |
| D4 Insecure base URL policy | **An immutable allow list in the environment**; a test that needs another policy builds another client |
| D5 Report test fake HTTP | **The test session owns a switchable fetch** (`FakeOutboundHttp`) that its environment uses; the Report runner scopes a suite's answers on it |
| D6 Rotated-secret persistence on the server | **A callback in the server's environment**, closing over the server's controller and deployment map |
| D7 `SecretStore` itself | **Out of scope**: stays module-level; the environment carries `resolveSecret` so the client no longer imports it |

### D1 — What DomainController receives

| Option | Pros | Cons |
|---|---|---|
| **D1-a. A client built on the environment** ★ | `DomainController` imports only `0_interfaces`; removes the layer 3 → 4 import of `executeExternalServiceOperation` | one more interface |
| D1-b. The environment, controller calls a free function | smallest diff | keeps the layer 3 → 4 implementation import the issue names as a consequence |

### D2 — Default environment

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Factory in `5_setup`, used as default by `setupMiroirDomainController`** ★ | runtimes (CLI, MCP, Electron, browser) keep working unchanged; the client has no default | a default still exists, but in the composition layer, built per controller |
| D2-b. Required parameter of `setupMiroirDomainController` | every root decides explicitly | ~15 call sites to change for identical values |

### D3 — Token cache

The issue lists the cache in the environment. An injected `ExternalServiceTokenCache` lets tests that share
one session controller reset it between tests with `tokenCache.clear()` on their own instance, instead of
`clearExternalServiceTokenCacheForTests()` on process state. Rejected: a cache private to the client
(tests would need a new controller per test to reset it).

### D4 — Insecure base URL policy

`insecureBaseUrls: readonly string[]` in the environment. Tests that start their fake server before the
session (all of them today) pass its URL at construction. `externalServiceGuards.integ` toggles the list
mid-file; it builds a second client with an empty list for its "default-deny" cases. Rejected: a mutable
policy object (it would reintroduce the setter).

### D5 — Report test fake HTTP

A session is built once and shared by many Report suites, each with its own `fakeHttpResponses`. The
session's environment gets `fetch = fakeOutboundHttp.fetch`, where `fakeOutboundHttp` is a test double
from `5_tests/FakeHttpResponses.ts`: it answers with the fake the Report runner installs for a leaf
(`fakeOutboundHttp.answerWith(responses)`, released in `finally`) and otherwise forwards to the real
fetch. The execution environment exposes it (`MiroirTestExecutionEnvironment.fakeOutboundHttp`).

| Option | Pros | Cons |
|---|---|---|
| **D5-a. Session-owned switchable fetch** ★ | no production setter; scoping lives in test code that owns the session | still a set/release per leaf, on a test object |
| D5-b. A new session (controllers) per suite | fully immutable | re-bootstraps stores per suite: far slower |
| D5-c. Keep `setOutboundFetch` on the controller | no change | the issue's acceptance forbids it |

Consequence: a session that did not build its controllers (UI launcher `hostMode: "embedded"`, which
reuses the app's controller) has no `fakeOutboundHttp`; a Report suite with `fakeHttpResponses` is then
skipped with a message, as it already is without an emulated server. Today that case replaced the
fetch of the app's own controller, which the runner's own comment says it must not do.

### D6 — Rotated secrets on the server

`server.ts` builds its environment with `persistRotatedSecret: (args) => persistRotatedSecretRow(domainController, args, applicationDeploymentMap)`.
The closure is only called during an external call, after both constants are initialised.

---

## 1. Goals

1. **Controllable client** — In order to test external service calls without process-wide setup, as a Miroir developer, I can hand a DomainController the fetch, secrets, token cache and URL policy it must use.
2. **Isolated Report tests** — In order to trust Report tests with fake HTTP, as a report designer, I can run them without any other controller of the process seeing the fake answers.

## 2. Non-goals

- Making `SecretStore` injectable (probe snapshot/restore in `DomainController` still uses it; later, unscheduled).
- Changing external service behaviour, error types or messages.

## 3. Current state

### 3.1 Module-level state in `ExternalServiceClient.ts` (misaligned)

| State | Declaration | Setter / reset |
|---|---|---|
| insecure base URL allow list | `const allowedInsecureBaseUrls = new Set<string>()` | `allowInsecureBaseUrlsForTests`, `clearAllowedInsecureBaseUrlsForTests` |
| OAuth2 access tokens | `const oauth2TokenCache = new Map<…>()` | `clearExternalServiceTokenCacheForTests` |
| rotated refresh tokens | `const rotatedRefreshTokens = new Map<string,string>()` | same |
| rotated-secret persistence | `let persistRotatedSecret: PersistRotatedSecret \| undefined` | `setPersistRotatedSecret`, `clearPersistRotatedSecret` |
| fetch | `fetchImpl: OutboundFetch = outboundFetch` default parameter on 5 functions | none (default = `globalThis.fetch`) |
| secrets | `import { resolveSecret } from "./SecretStore.js"` | `registerSecrets`, … (SecretStore) |

### 3.2 DomainController (misaligned)

- `private outboundFetchReplacement` + `setOutboundFetch()` (`DomainController.ts:429-467`), declared on `DomainControllerInterface` (`setOutboundFetch`, line 234).
- Imports the implementations `executeExternalServiceOperation` and `assertBaseUrlAllowed` from `4_services/ExternalServiceClient` (one of the 6 `miroir/layers` suppressions of the file in `eslint-suppressions.json`).
- 4 calls to `executeExternalServiceOperation(…, this.fetchOutbound)` (endpoint action, `extractorForExternalService`, local probe, probe with temporary secrets) and one direct `this.fetchOutbound(url, { redirect: "manual" })` in `handlePrepareOpenApiDocument` after `assertBaseUrlAllowed(url)`.

### 3.3 Callers of the module-level API

| Caller | Uses |
|---|---|
| `miroir-server/src/server.ts:589` | `setPersistRotatedSecret` |
| `runReportTest.tsx:315-395` | `controller.setOutboundFetch(fake)` / `(undefined)` on the session's controllers |
| 10 standalone integ files (external service dispatch/guards/query/report, spotifyApp, 281 phases 1/2/4, 270 phase 1, 284 harness phases 1-4) | `allowInsecureBaseUrlsForTests`, `clearAllowedInsecureBaseUrlsForTests`, `clearExternalServiceTokenCacheForTests` |
| `externalServiceGuards.integ`, `connectExternalService.284.phase0.integ` | `executeExternalServiceOperation` directly |
| core `secretsOauthCache.270.phase5.unit`, `DomainControllerOutboundFetch.unit`, `ActionImplementations.unit` | setters, direct call, `setOutboundFetch` |
| `new DomainController(…)` | `setupMiroirDomainController` (redux, zustand), `componentTestTools.tsx:790`, 4 unit tests |

Test sessions reach `setupMiroirDomainController` through `setupMiroirTest` (called by
`runAppStackIntegrationBootstrap`, used by `AppStackIntegrationTestSession` and `RunnerTestSession`)
and `IntegrationTestSession` (src).

## 4. Key reuse

| Piece | Location |
|---|---|
| `createFakeOutboundFetch` (Report fake answers) | `miroir-core/src/5_tests/FakeHttpResponses.ts` |
| `persistRotatedSecretRow` | `miroir-core/src/4_services/SecretsService.ts` |
| `resolveSecret` | `miroir-core/src/4_services/SecretStore.ts` |
| `setupMiroirDomainController` | `miroir-localcache-redux/src/sagaTools.ts`, `miroir-localcache-zustand/src/setupTools.ts` |

## 5. Target design

- `0_interfaces/4-services/ExternalServiceClientInterface.ts`: `OutboundFetch`, `PersistRotatedSecret`,
  `ExternalServiceTokenCache`, `ExternalServiceEnvironment { fetch, resolveSecret, tokenCache,
  insecureBaseUrls, persistRotatedSecret? }`, `ExternalServiceClientInterface { fetch,
  executeOperation(endpoint, actionType, bindings, principal?), assertBaseUrlAllowed(url) }`.
- `4_services/ExternalServiceClient.ts`: `createExternalServiceClient(environment)`,
  `createExternalServiceTokenCache()`; every internal function reads its environment argument; no
  module-level mutable state, no fetch import.
- `5_setup/externalServiceEnvironment.ts`: `defaultExternalServiceEnvironment(overrides?)` (global
  fetch, `SecretStore.resolveSecret`, a new token cache, empty allow list).
- `DomainController` constructor: 5th parameter `externalServiceClient: ExternalServiceClientInterface`.
- `1_core/OutboundFetch.ts` removed; `setOutboundFetch`, `setPersistRotatedSecret`,
  `clearPersistRotatedSecret`, `allowInsecureBaseUrlsForTests`, `clearAllowedInsecureBaseUrlsForTests`,
  `clearExternalServiceTokenCacheForTests`, the free `executeExternalServiceOperation` /
  `assertBaseUrlAllowed` exports and `outboundFetch` removed.

Implementation plan: [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
