# Issue #472 — TDD Implementation Plan

> Integration first, no mocks. Tests drive the real DomainController, local cache and filesystem store
> through the test profiles; outbound GitHub calls go to the local fake HTTP server
> (`startFakeExternalServiceServer`) or to `fakeHttpResponses` in report MiroirTests. The interfaces under
> test are the GitHub package's JSON assets, the Miroir action `setExternalServiceCredential`, and the
> Report definition field `finishOpenReport`.

**Resume note:** update the progress table and each slice's Status / Realization as slices land.

## Scope

In: G1 (connect with my own token), G2 (my repositories), G3 (second OpenAPI example), G4 (reusable credential step), per [`analysis.md`](./analysis.md).

Out: OAuth / device flow / GitHub Apps, GitHub Enterprise, other GitHub Reports, pagination inputs, table display of array responses, excerpt rebuild script, token deletion UI (all later, unscheduled).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/472
- Analysis: [`analysis.md`](./analysis.md)
- Prerequisite plans: [`../284-FEATURE-openapi-connection-wizard/tdd-implementation-plan.md`](../284-FEATURE-openapi-connection-wizard/tdd-implementation-plan.md), [`../274-FEATURE-multistep-reports/tdd-implementation-plan.md`](../274-FEATURE-multistep-reports/tdd-implementation-plan.md)
- Branch: `claude/472-github-example-app` (from `_integration` 1180c7c9)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | GitHub package skeleton, registered like Spotify | ✅ DONE | `modelValidation` of miroir-example-github, `testEnvironmentConfig.unit` |
| 1 | GitHubService Endpoint synced from the excerpt | ✅ DONE | `githubEndpointSync.unit` (committed operations = sync of the excerpt) |
| 2 | Repositories Report lists my repositories | ⬜ pending | `githubApp.integ` "lists the connected user's repositories" |
| 3 | `setExternalServiceCredential` checks and saves a token | ⬜ pending | `setExternalServiceCredential.integ` |
| 4 | The action runs on the server with the caller's principal | ⬜ pending | `setExternalServiceCredential.integ` "through the REST route" |
| 5 | `finishOpenReport` opens a Report after Finish | ⬜ pending | `multistepFinishOpenReport.integ` |
| 6 | GitHub home page: connect walk | ⬜ pending | MiroirTest `report.githubConnect` |
| 7 | Live test, nonreg steps, docs, cleanup | ⬜ pending | `npm run nonreg:filesystem -- --runner shared` |

## Locked implementation defaults

| ID | Default | Serves |
|---|---|---|
| D1 | PAT, `{type:"http", scheme:"bearer"}`, `credentialKey: "githubToken"` | G1, G3 |
| D2 | Per-user row when a principal exists, else process row | G1 |
| D3 | Encrypted row only; no wrapping key → error "wrapping key required" | G1 |
| D4 | Token → Next `GET /user` → "Connected as" → Finish saves and opens repositories | G1, G2 |
| D5 | Generic `setExternalServiceCredential {application, endpointUuid, credential, probeOperationId, probeParameters?, probeOnly?}`, returns the probe body | G4 |
| D6 | `GET /user/repos?per_page=100&sort=updated`; bound `id, name, full_name, private, language, stargazers_count, updated_at, html_url` | G2 |
| D7 | Hand-cut excerpt, source commit `836ce198db13a6fb194547e53eea99c6ddae495b` in `info.description` | G3 |
| D8 | `extraHeaders` User-Agent / Accept / X-GitHub-Api-Version | G1, G2 |
| D11 | Server-side, routed like `probeExternalService` | G1, G4 |
| D12 | Probe with an in-memory endpoint copy and a one-shot credential name | G1, G4 |
| D13 | Excerpt `/user` response = `public-user` only | G1, G3 |
| D14 | `apiCallReportSection` for the repositories array | G2 |
| D15 | Optional `finishOpenReport {reportUuid, application?, applicationSection?}` on Report definitions | G1, G2 |

## Allocated UUIDs / keys

See analysis §5 for the model uuids. Suite key: `report.githubConnect` (MiroirTest `2b1cb9f1-f230-48f0-bae0-7aee8f9dddee`). Operation ids: `users/get-authenticated`, `repos/list-for-authenticated-user`. Application key in environments: `github`.

## Test execution conventions

| Purpose | Command |
|---|---|
| GitHub model validation | `npm run testByFile -w miroir-example-github -- tests/modelValidation.unit.test.ts` |
| Standalone-app vitest file | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem <name>` |
| Report MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.githubConnect --mode integ` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

---

## Slice 0 — GitHub package skeleton, registered like Spotify

**Status:** ✅ DONE

**Goal:** the GitHub application deploys in the test environment with no Endpoint yet (SelfApplication, branch, menu, deployment rows).

**RED:** `testEnvironmentConfig.unit.test.ts` expects deployment `752c2412-…` among the test-filesystem keys; `miroir-example-github` has no `tests/modelValidation.unit.test.ts` to run.

**GREEN:**
- `packages/miroir-example-github/` copied from Spotify: `package.json`, `tsup.config.js`, `vite.config.js`, `tsconfig.json`, `.gitignore`, `index.ts`, `index.d.ts`, `src/GitHub.ts`, `assets/deployment/{6c4edcb2…,752c2412…}.json`, `assets/github_model/` (SelfApplication, ApplicationModelBranch, Menu), `assets/github_data/.gitkeep`, `tests/modelValidation.unit.test.ts`.
- Registration per analysis §4.1: environments (test-filesystem + three overrides), browser indexedDb config, `testEnvironmentConfig.unit.test.ts`, `build-all.sh`, `Dockerfile`, `pr-checks.yml`, standalone-app dependency + `npm install` for the lockfile, `multistep.274.phase0` `ASSET_TREES`.

**Refactor checkpoint:** none expected (pure data).

**Validation:**
```bash
npm run build -w miroir-example-github
npm run testByFile -w miroir-example-github -- tests/modelValidation.unit.test.ts
RUN_TEST=testEnvironmentConfig npm run testByFile -w miroir-standalone-app -- testEnvironmentConfig
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

Package, registration and lockfile entries as planned; the lockfile was edited by hand (two package entries and the standalone-app dependency) because `npm install` in this container also rewrites unrelated `dev`/`peer` flags. Scoped nonreg (smoke, core, tooling, shared runner): 33 passed, 0 failed.

## Slice 1 — GitHubService Endpoint synced from the excerpt

**Status:** ✅ DONE

**Goal:** the Endpoint `0c642e2a-…` carries the excerpt and `operations[]` for both operations, produced by `syncExternalServiceSchema`.

**RED:** `packages/miroir-example-github/tests/githubEndpointSync.unit.test.ts`: running `syncExternalServiceSchema` on `assets/test-resources/githubOpenApiExcerpt.json` with the Endpoint's `operationSync` gives exactly the committed `operations[]`; the excerpt's `info.description` names the source commit; `enabledOperations` lists both operation ids. (vitest: the comparison reads two package files, which a MiroirTest cannot.)

**GREEN:** excerpt (D7, D13), Endpoint asset (D1, D8, `operationSync.boundPaths` per D6 and `login, name, avatar_url, html_url`), `scripts/sync-github-schema.ts` modelled on `dogfood-sync-spotify-schema.ts` (`npm run dogfood-sync`), exported `githubServiceEndpoint`.

**Refactor checkpoint:** if the two dogfood scripts share most code, move the common part into a miroir-core helper used by both.

**Validation:**
```bash
npm run build -w miroir-example-github
npm run testByFile -w miroir-example-github -- githubEndpointSync
npm run testByFile -w miroir-example-github -- tests/modelValidation.unit.test.ts
```

### Realization

`scripts/sync-github-schema.ts` calls miroir-core's exported `materializeExternalServiceOperations` (the conversion `syncExternalServiceSchema` uses) instead of copying the Spotify script, so there was nothing to share with it and the refactor checkpoint had no work. The test failed on the empty `operations[]` before `npm run dogfood-sync -w miroir-example-github` filled it. Bound fields: `/user` login, id, name, avatar_url, html_url; `/user/repos` id, name, full_name, owner.login, private, html_url, description, language, stargazers_count, updated_at.

## Slice 2 — Repositories Report lists my repositories

**Status:** ⬜ pending

**Goal (G2):** with `githubToken` registered, the Report `9bd8a57a-…` shows the repositories returned by `GET /user/repos`, and the request carries the token, the three headers and `per_page=100&sort=updated`.

**RED:** `packages/miroir-standalone-app/tests/4_view/githubApp.integ.test.tsx` (copy of `spotifyApp.integ.test.tsx` setup): "lists the connected user's repositories" (fixture of two repositories, assert full names rendered), "sends the bearer token and GitHub headers" (assert `receivedRequests`), "shows GitHub's 401 message for a bad token".

**GREEN:** Query `ae2b3612-…` and Report `9bd8a57a-…` (extractorTemplateForExternalService with constant bindings + apiCallReportSection), menu item, `defaultGitHubAppModel` / `getDefaultGitHubModelEnvironment` exports.

**Refactor checkpoint:** shared deployment boot between `spotifyApp.integ` and `githubApp.integ` moves to `tests/utils/` if it is copied verbatim.

**Validation:**
```bash
RUN_TEST=githubApp npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem githubApp
npm run testByFile -w miroir-example-github -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

## Slice 3 — `setExternalServiceCredential` checks and saves a token

**Status:** ⬜ pending

**Goal (G1, G4):** on a local DomainController, the action probes with the candidate token and saves it.

**RED:** `packages/miroir-standalone-app/tests/3_controllers/setExternalServiceCredential.integ.test.ts`, on the server DomainController with `setSecretsMasterKey("test-secrets-master")`:
1. `probeOnly` with a good token returns the `/user` body and writes no `MiroirSecret` row.
2. A bad token returns an Action2Error with GitHub's 401 message and writes nothing.
3. Without a principal, Finish writes a process row named `githubToken` (uuid `miroirSecretInstanceUuid("githubToken","process")`), and the repositories call then uses it.
4. With principal Alice, Finish writes a user row (`miroirUser` = Alice); with a different stored user token, the probe still uses the candidate (D12).
5. A second Finish updates the same row.
6. No wrapping key: error "wrapping key required", nothing written.

**GREEN:**
- Action entry on Miroir Endpoint `1e2ef8e6-…` (libraryImplementation `handleAction_setExternalServiceCredential`), schema rebuild.
- `DomainControllerActionHost.handleSetExternalServiceCredential(action, applicationDeploymentMap, principal?)`, `ActionImplementations` entry.
- `DomainController`: load the endpoint, require `http` scheme + `credentialKey`, probe per D12, persist with a new `persistSecretRow({name, value, scope, miroirUserUuid?})` upsert in `SecretsService` (create or update under `withSecretRowWriteLock`, label `secrets.set`), then register the hydrated secret.

**Refactor checkpoint:** `persistRotatedSecretRow` becomes a call to `persistSecretRow` (update path); `persistImportedProcessSecrets` stays (batch import).

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
RUN_TEST=setExternalServiceCredential npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem setExternalServiceCredential
npm run test -w miroir-core -- ''
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,external
```

## Slice 4 — The action runs on the server with the caller's principal

**Status:** ⬜ pending

**Goal (D11):** a client DomainController in remote mode forwards the action to `/action/setExternalServiceCredential`; the server runs it with the request's principal and returns the probe body.

**RED:** in `setExternalServiceCredential.integ.test.ts`, "through the REST route": the client DomainController (RestClientStub, principal Alice) calls the action; the row is Alice's and the client gets the `/user` body. Same for the zustand cache (`--local-cache zustand` nonreg).

**GREEN:** next to `probeExternalService`: `RestPersistenceClientAndRestClient.ts` (redux, zustand), `PersistenceReduxSaga.ts`, `PersistenceAsyncStore.ts`, `RestServer.ts`; client-side forward in `DomainController` as in `runExternalServiceProbe`.

**Refactor checkpoint:** if the four places now test two action types each, extract a shared `SERVER_ROUTED_MIROIR_ACTION_TYPES` constant in miroir-core (deepening, no new behavior).

**Validation:**
```bash
RUN_TEST=setExternalServiceCredential npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem setExternalServiceCredential
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-redux/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-zustand/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,localcache,external
```

## Slice 5 — `finishOpenReport` opens a Report after Finish

**Status:** ⬜ pending

**Goal (D15):** a multistep Report with `finishOpenReport` navigates to that Report after a successful Finish; without it the host still calls `navigate(-1)`.

**RED:** `packages/miroir-standalone-app/tests/4_view/multistepFinishOpenReport.integ.test.tsx`: a two-step Library multistep fixture with `finishOpenReport` lands on the target report route after Finish; a failing Finish stays on the step.

**GREEN:** Report entity `3f2baa83-…` and its EntityVersion get `finishOpenReport` (optional object), schema rebuild, `MultistepReportHost.leaveProcess` uses `openReportHref` when set and no `onDismissed` is given.

**Refactor checkpoint:** none expected.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
RUN_TEST=multistepFinishOpenReport npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepFinishOpenReport
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui,runners
```

## Slice 6 — GitHub home page: connect walk

**Status:** ⬜ pending

**Goal (G1):** the GitHub app opens on the multistep Report `295d0905-…`: token, Next, "Connected as <login>", Finish, repositories.

**RED:** MiroirTest `report.githubConnect` in `packages/miroir-example-github/assets/github_model/a311f363-…/2b1cb9f1-….json` with `fakeHttpResponses` for `GET https://api.github.com/user` and `/user/repos?...`: a bad token shows GitHub's message on step 1; a good token shows the login on step 2; Finish lands on the repositories Report listing the fixture repositories.

**GREEN:** Report `295d0905-…` (`type: "multistep"`, step `credential` with inputPrefix `token` and onNext `setExternalServiceCredential probeOnly`, step `connected` with `runtimeTransformers` + `jsonReportSection` on `["credential", "login"]`, Finish = the action without `probeOnly`, `finishOpenReport` → `9bd8a57a-…`), SelfApplication `homePageUrl` → `295d0905-…`, menu item "Connect".

**Refactor checkpoint:** if report tests have no wrapping key (analysis §6), set the test key in the report-test setup, or end the MiroirTest at step 2 and rely on Slice 3 for the save.

**Validation:**
```bash
npm run build -w miroir-example-github
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.githubConnect --mode integ
npm run testByFile -w miroir-example-github -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,external
```

## Slice 7 — Live test, nonreg steps, docs, cleanup

**Status:** ⬜ pending

**Goal:** opt-in live check, nonreg coverage, docs.

**RED / GREEN:**
- `packages/miroir-standalone-app/tests/external-services/githubLive.integ.test.ts`, skipped unless `LIVE_GITHUB_TOKEN` is set: `/user` and `/user/repos` succeed with the real API and pass response validation.
- `scripts/nonreg-manifest.json`: `default-github-modelValidation` (core), `externalServices-github` (external: endpoint sync, `githubApp`, `setExternalServiceCredential`, `multistepFinishOpenReport`), `integ-report.githubConnect` (external, ui, shared report group).
- Docs: `data-architecture-deployments.md` example table, `versioning.md`, `testing.md` (steps, `LIVE_GITHUB_TOKEN`), `authentication.md` (per-user token from a Report), `build-it-yourself.md` (creating a token).

**Validation:**
```bash
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

## AC checklist

| Issue AC | Proof |
|---|---|
| 1. Deploys like Spotify | Slice 0 `modelValidation`, `testEnvironmentConfig.unit` |
| 2. Endpoint from the excerpt via the sync | Slice 1 `githubEndpointSync.unit` |
| 3. Home multistep: token, check, save | Slices 3, 4, 6 (`setExternalServiceCredential.integ`, `report.githubConnect`) |
| 4. Repositories Report | Slice 2 `githubApp.integ`, Slice 6 Finish landing |
| 5. Tests with faked HTTP, model validation | Slices 0–6 |
