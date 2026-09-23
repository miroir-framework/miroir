# Issue #284 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, the real external-service client, and the multistep host,
> through `connectExternalService` and the wizard Report. No mocks. The tracer (Slice 1) is a public
> Discogs-shaped Finish: probe a fake server, then one endpoint and one report exist.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/284
Prerequisites: [#267](https://github.com/miroir-framework/miroir/issues/267) ✅ · [#270](https://github.com/miroir-framework/miroir/issues/270) ✅ · [#274](https://github.com/miroir-framework/miroir/issues/274) ✅ · [#281](https://github.com/miroir-framework/miroir/issues/281) ✅
Working branch: `284-FEATURE-openapi-connection-wizard`

**Resume note:** plan reviewed, no slice started.

---

## Scope

- `connectExternalService` on the domain-action union, probe-then-save, derived uuids.
- `securityScheme` `none`, `authorizationTemplate`, `extraHeaders`.
- Convertible-GET walker (`listConvertibleGetOperations`, `boundPathsForOperation`).
- Multistep envelopes: on-Next action, boolean branch, visited-step Back and Finish gate, bag-driven input schema.
- Wizard report `dbd94bfe-…` and the home-page `openReportSection`.
- Redaction of secret values in the host dump and in composite logs.

This plan does **not** add a Discogs deployment package, rewrite Spotify endpoint `0e5cb172-…`, teach the Sync button to fetch a URL, add OAuth 1.0a or a consent screen, create applications, or roll back a save that landed after a successful probe (analysis D20, D21, D23).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize linear host, Bearer header, home report | ⬜ | `connectExternalService.284.phase0` |
| 1 | **Tracer.** Public Finish writes endpoint + report | ⬜ | phase1 integ, fake server sees User-Agent and no Authorization |
| 2 | Failed probe and name clash write nothing | ⬜ | phase2 integ |
| 3 | Second Finish updates the same rows | ⬜ | phase3 integ |
| 4 | Authenticated probes (token, client credentials, refresh grant) | ⬜ | phase4 integ |
| 5 | Branching host: path, Back, on-Next failure | ⬜ | `multistepBranch.284` |
| 6 | Wizard report, home button, document step | ⬜ | `wizardWalk.284` + `modelValidation` |
| 7 | Nonreg, docs, cleanup, AC | ⬜ | nonreg steps |

Slice 1 is the first behavioral slice. Slice 0 is the safety net only.

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md). Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 | One process-scoped connection per application |
| D3 | `none`, authorization code, client credentials, custom template `{secret}` |
| D4 / D9 / D13 / D20 | Probe first. Register in the process map. Persist only after success. No rollback. Snapshot + `unregisterProcessSecret` |
| D5 / D15 | `multistepStep` envelope. Finish and Next gate `visitedStepIds` only. Back pops that stack |
| D6 / D8 | Paste, `FileReader` upload, server HTTPS fetch. Store text. Sync button unchanged |
| D7 / D16 | Walker skips `oneOf` / `anyOf`. User checks operations |
| D10 / D18 | uuid v5. Foreign name refuses. Unchecked operations removed |
| D11 | Mapping table in analysis D11 |
| D12 / D21 / D22 | Home button, `openAs: "route"`, picker excludes `360fcf1f-…` and `55af124e-…` |
| D14 | Twelve step ids. A run visits a subset |
| D17 | Report is model-section `conceptLevel: "Model"`. OpenAPI parameter names. No Entity |
| D23 | Fixture application in tests. No Discogs package |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Wizard report `ConnectExternalService` | `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a` |
| SelfApplication on that report | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| Domain envelope endpoint (existing composite endpoint) | `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5` |
| Endpoint uuid namespace | Endpoint entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c` |
| Report uuid namespace | Report entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| Branch-host fixture report (test-local, not a deployment asset) | `4f7dab24-b3eb-4d59-9275-dcc8f912ecd2` |
| Nonreg unit | `unit-284-openapi-connection-wizard` |
| Nonreg integ | `integ-action-284-openapi-connection-wizard` |
| Nonreg app stack | `appstack-284-openapi-connection-wizard` |

Endpoint and validation-report uuids are derived at runtime (analysis D10). They are not allocated here.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Action integ | `RUN_TEST=connectExternalService.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284` |
| Host integ | `RUN_TEST=multistepBranch.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepBranch.284` |
| Wizard walk | `RUN_TEST=wizardWalk.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem wizardWalk.284` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and the same for `packages/miroir-standalone-app/tsconfig.json` |

Vitest, not MiroirTest: a live HTTP server, the process secret map, and the React host are not expressible as a declarative MiroirTest. Same reason as #267's external-service integ tests and #274's `multistepProcess` host tests. No mocks. `RestClientStub` is the framework's own server stand-in when the test boots the app shell.

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock the behavior Slice 1–6 will change, so a regression is visible.

### 0.1 RED → GREEN — inventory

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/284-openapi-connection-wizard/connectExternalService.284.phase0.integ.test.ts`

Behavior asserted (current, must pass before any product change):

- `MiroirWebAppOrDesktopHome` (`29ef8018-…`) has exactly three sections: `markdownReportSection`, `inputReportSection`, `storedReportDisplay`. No `openReportSection`.
- Spotify endpoint `0e5cb172-…` `securityScheme.type` is `oauth2AuthorizationCode`. File bytes are hashed in the test and that hash is the lock.
- `listReportSection.definition` items are a single `reportSection` reference (`3f2baa83-….json`).
- `handleApplicationAction` returns `actionImplementationType not supported yet` for `libraryImplementation` (analysis R3).
- A multistep list with two required `inputReportSection`s fails `allGatedStepsAllowFinish` when only the first bag is filled (`MultistepReportHost.tsx` L170–191).
- `executeExternalServiceOperation` on an endpoint with `credentialKey` and `securityScheme.type: "http"` sends `Authorization: Bearer <secret>` and no User-Agent. Use the existing insecure-baseUrl allowlist and a local server.

### Validation

```bash
RUN_TEST=connectExternalService.284.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase0
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 1 — Tracer: public Finish writes the endpoint and the report

**Status:** ⬜ pending

### Goal

A maintainer can finish a public connection. After a 200 from the fake server, the target application has one endpoint and one model-section report, and no Entity was created.

**Layers cut:** domain-action schema → `handleAction` → external-service client (`none`, `extraHeaders`) → sync walker → endpoint and report upsert.

### 1.1 RED

**Test:** `connectExternalService.284.phase1.integ.test.ts` (same issue directory)

Boot a fixture application on `applicationDeploymentMap` (not Miroir, not Admin). Local HTTP server on the allowlist. One GET whose JSON response is `{ "id": "1", "name": "x" }` plus an unused `oneOf` sibling the walker must ignore.

Call `connectExternalService` through `domainController.handleAction` with a bag: public scheme, User-Agent `MiroirTest/284`, that document text, one checked operation, probe parameters.

Behavior asserted:

- The fake server received `User-Agent: MiroirTest/284` and no `Authorization` header.
- The action status is ok.
- The target model contains an endpoint whose uuid is `uuidv5(application + "\n" + name, 3d8da4d4-…)`, `securityScheme.type` is `none`, `extraHeaders["User-Agent"]` is that string, `enabledOperations` is the one id, and `boundPaths` does not include the `oneOf` branch.
- A report exists in the **model** section, `conceptLevel: "Model"`, uuid `uuidv5(application + "\n" + name + "\n" + operationId, 3f2baa83-…)`, with `apiCallReportSection` and `urlParamFields` equal to the OpenAPI parameter name.
- The target model's entity list did not gain a row.
- Spotify file `0e5cb172-….json` hash is unchanged (phase0 lock still holds).

RED fails because `actionType: "connectExternalService"` is not a domain action.

### 1.2 GREEN

- Add `connectExternalService` to the domain-action union (Entity + EntityVersion for the action schema, then `devBuild`). Envelope `endpoint` is `1e2ef8e6-…`.
- Branch in `handleAction`. Do not add a `libraryImplementation` (phase0 must stay red for that path, green for the new action type).
- `listConvertibleGetOperations` / `boundPathsForOperation` in `syncExternalServiceSchema.ts`, used by the handler. No second converter.
- `securityScheme` `none` and `extraHeaders` on the Endpoint schema (dual-write `3d8da4d4-…` and `e3c1cc69-…`).
- Client: `none` sends no Authorization. Copy `extraHeaders` onto the fetch headers.
- Upsert endpoint and report on the bag's application, section `model`.

### 1.3 Refactor checkpoint

- Handler reads the target model via `applicationDeploymentMap[bag.application]`, never `props.application` from the host (the host is not in this slice).
- Phase0 Bearer test still passes (`http` without template).

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=connectExternalService.284.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase0
RUN_TEST=connectExternalService.284.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase1
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 2 — Failed probe and name clash write nothing

**Status:** ⬜ pending

### Goal

A maintainer whose probe fails, or whose endpoint name belongs to another uuid, can see that failure and find no new row.

**Layers cut:** same handler + `SecretStore` snapshot.

### 2.1 RED

**Test:** `connectExternalService.284.phase2.integ.test.ts`

- Fake server returns 401. Action error message is the client's own HTTP message (`unwrap` not required yet: this slice calls `handleAction` directly, so there is no composite wrapper). No endpoint row, no report row, no `MiroirSecret` row.
- Pre-register process secret `discogsToken=old`. Bag uses that name with `new`. After the 401, `resolveSecret("discogsToken")` is `old`.
- Bag uses a fresh name. After the 401, `resolveSecret` throws for that name (`unregisterProcessSecret`).
- Seed an endpoint with the bag's name and a uuid that is not the derived one. Action fails with a message that names the clash. Secret map and rows unchanged. No second endpoint.

### 2.2 GREEN

Snapshot via `resolveSecret` before `registerHydratedProcessSecret`. On failure, re-register or `unregisterProcessSecret`. Clash check against the target model's endpoints before register (analysis §5.2 step 1).

### 2.3 Refactor checkpoint

- One restore function in `SecretStore.ts`. The handler does not call `clearSecrets`.

### Validation

```bash
RUN_TEST=connectExternalService.284.phase2 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase2
RUN_TEST=connectExternalService.284.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase1
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 3 — Second Finish updates the same rows

**Status:** ⬜ pending

### Goal

A maintainer can Finish again under the same endpoint name. The endpoint uuid stays. Unchecked operations disappear. The same probe updates the report's input defaults.

**Layers cut:** handler upsert path.

### 3.1 RED

**Test:** `connectExternalService.284.phase3.integ.test.ts`

After Slice 1's public endpoint exists, call the action again with a different checked operation (and that operation as the probe), same endpoint name.

- Endpoint uuid unchanged. `enabledOperations` equals the new set only.
- Report uuid is the new operation's derived uuid. The previous report uuid is still present (analysis D10, different probe).
- A third call with the **same** probe updates that report's input default to the new parameter value. Report count for that probe stays one.

### 3.2 GREEN

Upsert by derived uuid. Replace `operations` / `enabledOperations` / `operationSync` with the checked set. Do not delete reports for other probe ids.

### 3.3 Refactor checkpoint

- Phase1 and phase3 share the fixture boot helper in the issue test directory. Not a new exported package API.

### Validation

```bash
RUN_TEST=connectExternalService.284.phase3 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase3
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 4 — Authenticated probes

**Status:** ⬜ pending

### Goal

A maintainer can finish a custom-token connection, a client-credentials connection, and an authorization-code connection. The fake upstream sees the header or the token grant the scheme requires.

**Layers cut:** client header template + OAuth grants (already present) + secret upsert + log redaction.

Three RED → GREEN cycles in this slice. They share one fake server and one action. Splitting them would copy the fixture three times.

### 4.1 RED

**Test:** `connectExternalService.284.phase4.integ.test.ts`

1. Custom token. Template `Discogs token={secret}`. Server records `Authorization: Discogs token=sekret`. Endpoint `securityScheme` is `http` with that template and `credentialKey`. A `MiroirSecret` row exists for the generated name, ciphertext not equal to the raw token. Process map holds the value after success.
2. Client credentials. Fake token URL returns a bearer token. API server records `Authorization: Bearer <that token>`. Endpoint type is `oauth2ClientCredentials`.
3. Authorization code. Fake token URL receives `grant_type=refresh_token`. API server records `Bearer`. Endpoint has `refreshTokenKey`.
4. A memory log appender registered through the existing logger factory does not contain `sekret` (or the refresh token) after the call. The assertion is absence of the secret string, not a snapshot of log wording.

### 4.2 GREEN

- `authorizationTemplate` on `http` (dual-write). Absent template keeps `Bearer ${token}` (phase0).
- Replace `{secret}` once. Handler uses the D11 table.
- `secrets.set` on Admin `55af124e-…` after the probe.
- Keys-only logging on the new handler path. `handleCompositeActionTemplate` entry and per-step logs (L4795–4803, L4846–4855, L4992–4998) print key names, or pass bodies through `redactRegisteredSecretValuesInString` plus a denylist of bag fields `clientSecret`, `refreshToken`, `token`, `secretValue` **before** registration.

### 4.3 Refactor checkpoint

- Phase0 Bearer test still passes for an `http` scheme with no template.
- Do not log the bag in `runMultistepFinish` (L63–69) even though the host slice is later. Change it here so the action tests that go through the composite see the same rule. Slice 4's RED calls `handleCompositeActionTemplate` with a one-step sequence, not only `handleAction`, so the wrapper path is what the wizard will use.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=connectExternalService.284.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase0
RUN_TEST=connectExternalService.284.phase4 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase4
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 5 — Branching multistep host

**Status:** ⬜ pending

### Goal

A maintainer walking a branching report can take the false path, go Back to the choice, and Finish without filling the step they skipped. A failed on-Next action stays on the document step and shows that action's message.

**Layers cut:** `multistepStep` schema → host → one fixture report rendered in the app shell.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/284-openapi-connection-wizard/multistepBranch.284.integ.test.tsx`

Fixture report `4f7dab24-…` is built in the test (not committed). List children: a choice step, a secret step with a required field, and a review step. The false branch skips the secret step. Both branches name `review`.

Behavior asserted:

- Choosing false and pressing Next lands on review. Finish runs. The required secret field was never filled. (`allGatedStepsAllowFinish` on every child would block this. That is the RED.)
- Back from review returns to the choice, not to the secret step.
- `onNext` that returns an error leaves the step index unchanged. The visible alert text is the action's message, not `handleCompositeActionTemplate compositeInstanceAction error`.
- `MultistepCountryCreate` (`d2b2fbbd-…`) still moves Back by index. Its Finish still requires every step. Covered by the existing #274 suite, re-run in Validation, plus one assertion in this file that a bare-section report's Back goes to the previous index.

### 5.2 GREEN

- Union `reportSection | multistepStep` on `listReportSection.definition` items. Dual-write `952d2c65-…`. `devBuild`.
- `ReportSectionListDisplay`, `reportSectionsFormSchema`, `reportSectionsFormValue` unwrap `multistepStep.section`.
- Host: `visitedStepIds`. Next order is gate, `onNext`, merge under `stepId`, `branch.test`, navigate. Finish gate uses `visitedStepIds` when any child has `stepId`.
- `unwrapAction2ErrorMessage` for Next and Finish.
- Cancel dialog text is only "The values you entered will be discarded."
- Hidden `<pre data-testid="multistep-step-bag">` omits keys `clientSecret`, `refreshToken`, `token`, `secretValue`.

### 5.3 Refactor checkpoint

- `getMultistepChildSections` returns inner sections for the section view and envelopes for the host. One function, two results, not two copies of the walk.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=multistepBranch.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepBranch.284
RUN_TEST=multistepProcess.274 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepProcess.274
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 6 — Wizard report and home button

**Status:** ⬜ pending

### Goal

A maintainer on the Miroir home page can open Connect an external service, pick a fixture application, paste a document, and reach review on the public path. Upload puts file text in the bag. A private URL stays on the document step.

**Layers cut:** report asset → home report → host dynamic schema → document `onNext`.

### 6.1 RED

**Test:** `wizardWalk.284.integ.test.tsx`

Render `MiroirWebAppOrDesktopHome`. The button label is Connect an external service. Activating it shows the wizard (`openAs: "route"`).

- The application step lists the fixture application and does not list Miroir `360fcf1f-…` or Admin `55af124e-…`.
- Paste a two-GET document, one of which is only an `oneOf`. Next stays on the document step only when the text is not YAML/JSON. A valid document shows the convertible GET and hides the `oneOf`-only operation.
- A `file` input read via `FileReader` fills the same bag text.
- URL `http://127.0.0.1/...` (not on the allowlist) stays on the document step. The alert names the private-host refusal.
- Public path: Next from "authenticated = no" lands on operations, not on a secret step.
- Secret step inputs are masked. After filling a token on the custom path, `multistep-step-bag` text does not contain the token.
- Finish on the public path with the fixture server running performs the Slice 1 outcome (endpoint + report). This is the UI tracer for the same action.

RED fails because the home report has no button and report `dbd94bfe-…` does not exist.

### 6.2 GREEN

- Commit report `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a` under `miroir_model`, `selfApplication` `360fcf1f-…`, `conceptLevel: "Model"`, twelve envelopes from analysis §5.1. Finish sequence is one `connectExternalService`.
- `inputSchemaFromBag` on `operations` and `probeParams`, evaluated when the step opens (analysis D5).
- Document `onNext` calls the same walker and, for a URL, `fetch` on the server under `assertBaseUrlAllowed`.
- Add `openReportSection` to `29ef8018-…`, label Connect an external service, `openAs: "route"`, `reportUuid` `dbd94bfe-…`, `application` `360fcf1f-…`.
- Do not edit `MiroirSandboxHome`.

### 6.3 Refactor checkpoint

- The picker reads `applicationDeploymentMap` keys. It does not hardcode Spotify or Library.

### Validation

```bash
RUN_TEST=wizardWalk.284 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem wizardWalk.284
RUN_TEST=connectExternalService.284.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase1
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 7 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 7.1 Nonreg

Add to `scripts/nonreg-manifest.json`:

- `unit-284-openapi-connection-wizard` — phase0 (if it remains a pure inventory; otherwise fold into integ)
- `integ-action-284-openapi-connection-wizard` — phase1 through phase4
- `appstack-284-openapi-connection-wizard` — `multistepBranch.284` and `wizardWalk.284`

If one step's command line exceeds the manifest's practical length, split the same way #281 did, and name the sibling step in this section when that happens.

### 7.2 Docs

- `docs/reference/api/reports.md` multistep section: step id, branch, on-Next, visited Back.
- `analysis.md` status → implemented once slices are done (not in this planning commit).

### 7.3 Issue-directory cleanup

Move assertions that should live as feature suites out of `tests/**/issues/284-openapi-connection-wizard/` per `docs/contributing/testing.md` (#238). Delete the issue directory when the feature-named files cover the same behaviors.

### 7.4 Tracer bullet (narrative)

1. Open the Miroir home page. Press Connect an external service.
2. Pick an application that is not Miroir or Admin. Name the endpoint.
3. Paste a public OpenAPI document. Set a User-Agent. Leave authenticated off.
4. Check one GET. Fill its parameters. Finish.
5. The endpoint and the report exist. The report's call returns the same payload.

Automated equivalent: `wizardWalk.284` Finish assertion, plus `connectExternalService.284.phase1`.

### AC checklist (#284)

| Criterion | Proven by | Status |
|---|---|---|
| Home button opens the wizard. Picker excludes Miroir and Admin | `wizardWalk.284` | ⬜ |
| Paste, upload, HTTPS URL. Private URL stays on the document step | `wizardWalk.284` | ⬜ |
| Public, authorization-code, client-credentials, and custom-token connections finish | phase1, phase4 | ⬜ |
| Operation list is convertible GETs. `oneOf` subtrees omitted. `boundPaths` written | phase1 | ⬜ |
| Failed probe writes nothing and restores the process map | phase2 | ⬜ |
| Success upserts secrets, endpoint, report. No Entity | phase1, phase4 | ⬜ |
| Second Finish updates the endpoint. Unchecked operations removed. Same probe updates the report | phase3 | ⬜ |
| Foreign name refuses | phase2 | ⬜ |
| Back follows the path. Boolean test selects the next step. Failed Next stays | `multistepBranch.284` | ⬜ |
| Secret values absent from logs and from the hidden bag dump | phase4, `multistepBranch.284`, `wizardWalk.284` | ⬜ |
| Discogs-shaped public, Discogs-shaped token, Spotify-shaped refresh grant. `0e5cb172-…` unchanged | phase1, phase4, phase0 hash | ⬜ |
| `modelValidation` after schema dual-write | Slice 1, 4, 5, 6 Validation | ⬜ |

### Realization

<Appended on completion, together with Status ✅ DONE.>
