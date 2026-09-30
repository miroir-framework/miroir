# Issue #339 — TDD Implementation Plan

> Refactor with no new model data: every behavior here is framework-internal machinery (fetch,
> token cache, URL policy, controller wiring), not reachable through MiroirTest, so the vehicle is
> vitest against the real `DomainController` and the real client, plus the existing external service
> integ suites and Report tests as the non-regression net. No mocks: fetches are fake HTTP answers
> (`createFakeOutboundFetch`) or the local fake external service server the integ tests already use.

**Resume note:** slices land in order on `claude/issue-339-f2hly9`; each slice keeps every suite green.

## Scope

In: analysis § 5 target design. Out: injectable `SecretStore` (later, unscheduled); external service behaviour.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/339
- Analysis: [`analysis.md`](analysis.md)
- Branch: `claude/issue-339-f2hly9` (from `_integration`)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | Client built on an injected environment | ⬜ pending | `externalServiceClient.339.unit` |
| 2 | DomainController receives the client at construction | ⬜ pending | `DomainControllerOutboundFetch.unit` (rewritten) |
| 3 | Test sessions and Report tests on the injected environment | ⬜ pending | `reportTestFakeHttp.integ`, 284/270/external service integ |
| 4 | Server environment, removal of module state and setters, cleanup | ⬜ pending | lint, `nonreg:filesystem` |

## Locked implementation defaults

Analysis decision record D1-D7, unchanged.

## Allocated UUIDs / keys

None (no model elements, no MiroirTest suites).

## Test execution conventions

| Purpose | Command |
|---|---|
| core unit | `npm run test -w miroir-core -- <file>` |
| standalone integ (filesystem) | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- <name>` |
| typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| gate | AGENTS.md pre-push gate |
| nonreg | `npm run nonreg:filesystem -- --runner shared` |

## Slice 0 — characterization

Not needed as a separate slice: the existing suites listed in the issue's acceptance
(`DomainControllerOutboundFetch.unit`, 270 OAuth cache, 284, external service integ, Report tests with
fake HTTP) already characterise the behaviour; they run green on the base before slice 1.

## Slice 1 — Client built on an injected environment

**Status:** ⬜ pending

- **RED** `packages/miroir-core/tests/4_services/issues/339-external-service-environment/externalServiceClient.339.unit.test.ts`:
  two clients with different environments do not share their token cache, their allow list or their
  fetch; a rotated refresh token is persisted through the environment's `persistRotatedSecret`.
- **GREEN** interfaces in `0_interfaces/4-services/ExternalServiceClientInterface.ts`;
  `createExternalServiceClient`, `createExternalServiceTokenCache` in `ExternalServiceClient.ts`;
  internal functions take the environment. The legacy free functions stay, as wrappers over one
  legacy environment, until slice 4.
- **Refactor checkpoint** duplicated client-credentials / authorization-code request code left as is (behaviour-preserving scope).
- **Validation** new unit test, 270 unit tests, core typecheck.

## Slice 2 — DomainController receives the client at construction

**Status:** ⬜ pending

- **RED** rewrite `DomainControllerOutboundFetch.unit`: a controller built with a client on a fake
  fetch sends its requests there; another controller built on another client does not.
- **GREEN** 5th constructor parameter; `setOutboundFetch` removed from the controller and
  `DomainControllerInterface`; `setupMiroirDomainController` (redux, zustand) takes an optional client,
  defaulting to `defaultExternalServiceEnvironment()` from `5_setup`.
- **Refactor checkpoint** drop the `miroir/layers` suppression the removed import used.
- **Validation** core unit tests, typecheck of core, localcache-redux, localcache-zustand, standalone-app.

## Slice 3 — Test sessions and Report tests on the injected environment

**Status:** ⬜ pending

- **RED** `reportTestFakeHttp.integ` and the Report connection wizard test run with the runner using
  `executionEnvironment.fakeOutboundHttp` instead of `setOutboundFetch`.
- **GREEN** `createFakeOutboundHttp(fallback)` in `5_tests/FakeHttpResponses.ts`; `setupMiroirTest`
  and `runAppStackIntegrationBootstrap` accept `externalServiceEnvironment` overrides and return
  `fakeOutboundHttp`; integ tests pass `insecureBaseUrls` and their own `tokenCache`.
- **Validation** the standalone integ files listed in the analysis § 3.3, on the filesystem profile.

## Slice 4 — Server environment, removal, cleanup

**Status:** ⬜ pending

- **GREEN** `server.ts` builds its client with `persistRotatedSecret`; remove `OutboundFetch.ts`,
  `setPersistRotatedSecret`, `clearPersistRotatedSecret`, `allowInsecureBaseUrlsForTests`,
  `clearAllowedInsecureBaseUrlsForTests`, `clearExternalServiceTokenCacheForTests`, free
  `executeExternalServiceOperation` / `assertBaseUrlAllowed`; migrate the remaining direct callers.
- **Validation** gate (lint included), server typecheck, `nonreg:filesystem -- --runner shared`.

## AC checklist

| Acceptance criterion | Proof |
|---|---|
| no module-level mutable state, no default fetch import | slice 4 diff; `externalServiceClient.339.unit` |
| DomainController receives the environment; no `setOutboundFetch` | slice 2 |
| Report fake-HTTP tests, 270 OAuth cache, 284, `DomainControllerOutboundFetch.unit` pass | slices 2-3 |
| `npm run lint`, `nonreg:filesystem` pass | slice 4 |
