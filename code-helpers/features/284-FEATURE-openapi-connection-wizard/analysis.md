# 284 — Wizard to connect an application to an OpenAPI service

> How an application maintainer attaches one deployment-wide OpenAPI connection
> to an existing application: a branching multistep Report, a probe-before-save
> Finish, and an Endpoint plus a validation Report. Spotify and Discogs are the
> acceptance shapes. The hand-built Spotify endpoint stays.

Related issue: https://github.com/miroir-framework/miroir/issues/284
Prerequisites: [#267 OpenAPI external services](https://github.com/miroir-framework/miroir/issues/267) ✅ [`../267-FEATURE-openapi-external-services/analysis.md`](../267-FEATURE-openapi-external-services/analysis.md) · [#270 persistent named secrets](https://github.com/miroir-framework/miroir/issues/270) ✅ [`../270-FEATURE-persistent-named-secrets/analysis.md`](../270-FEATURE-persistent-named-secrets/analysis.md) · [#274 multi-step Reports](https://github.com/miroir-framework/miroir/issues/274) ✅ [`../274-FEATURE-multistep-reports/analysis.md`](../274-FEATURE-multistep-reports/analysis.md) · [#281 typed API-call report section](https://github.com/miroir-framework/miroir/issues/281) ✅ [`../281-FEATURE-api-call-report-section/analysis.md`](../281-FEATURE-api-call-report-section/analysis.md)
Key sources: [`MultistepReportHost.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx) · [`ExternalServiceClient.ts`](../../../packages/miroir-core/src/4_services/ExternalServiceClient.ts) · [`syncExternalServiceSchema.ts`](../../../packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts) · [`endpointDefinition.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/endpointDefinition.ts) · [`OpenApiEndpointSyncButton.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/OpenApiEndpointSyncButton.tsx) · [`SecretStore.ts`](../../../packages/miroir-core/src/4_services/SecretStore.ts) · [`HomePage.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/HomePage.tsx) · [`MiroirWebAppOrDesktopHome`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/29ef8018-43fc-4ee9-a736-6f9d625be7b7.json) · [`MultistepCountryCreate`](../../../packages/miroir-test-app_deployment-library/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/d2b2fbbd-6844-4422-8412-4e3c303296bc.json) · [`SpotifyService`](../../../packages/miroir-test-app_deployment-spotify/assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-23 grilling). Revised after adversarial review ([`./adversarial-review.md`](./adversarial-review.md), R1–R17 applied). Plan in [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md), revised after [`./plan-adversarial-review.md`](./plan-adversarial-review.md) (P1–P18). No slice started.

**Document history:** first draft committed on `284-FEATURE-openapi-connection-wizard`. Review found the walk counted as ten steps while §5.1 lists twelve step ids, Finish gating every list child (including secret steps the user never opened), no registration path for `connectExternalService`, the validation report placed in `data` instead of `model`, and host mechanisms (on-Next action, dynamic input schema, upload, visited-step Back) named without call sites. Product choices D1–D23 are unchanged. Mechanisms below are tightened.

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| External-service Endpoint, server GET, named secrets, sync transformer | [#267](https://github.com/miroir-framework/miroir/issues/267) | ✅ |
| Persisted `MiroirSecret` rows | [#270](https://github.com/miroir-framework/miroir/issues/270) | ✅ |
| Linear multistep Report, Finish = one composite, in-memory bag | [#274](https://github.com/miroir-framework/miroir/issues/274) | ✅ |
| `apiCallReportSection` reads `operations[].responseSchema` | [#281](https://github.com/miroir-framework/miroir/issues/281) | ✅ |
| Connection wizard + branching multistep | **#284 (this document)** | **this issue** |
| Per-user OAuth consent screen | later, unscheduled (#267 revisit) | later |
| OAuth 1.0a | later, unscheduled | later |
| Discogs deployment package | later, unscheduled | later |
| Endpoint Sync button re-fetches a URL | later, unscheduled | later |

---

## Decision record

Confirmed with the user (2026-09-23). Defaults accepted except Q4 (all writes on Finish), Q6 (paste, upload, **and** URL), and Q22 (home-page button, picker always step 1). ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | Who connects? | **One process-scoped connection per application**, run by the maintainer. Per-user tokens stay later. |
| D2 | How many wizards? | **One multistep Report** in the Miroir application. Spotify and Discogs are acceptance shapes. |
| D3 | Which auth outcomes? | **`none`**, **`oauth2AuthorizationCode`** (refresh token already in hand), **`oauth2ClientCredentials`** (in the list, runtime already has it), **custom Authorization template**. No consent screen. No OAuth 1.0a. |
| D4 | When are rows written? | **Only on Finish**, one server action, secret values included. Cancel writes nothing. |
| D5 | Where does branching live? | **On multistep reports.** Boolean transformer, two next step ids, rejoin allowed. No test means the next section. |
| D6 | How does the document arrive? | **Paste, browser upload, or URL.** Server fetches HTTPS and refuses loopback and private hosts. Finish stores the text in `openApiDocument`. |
| D7 | Which operations are offered? | **GET operations with at least one convertible field.** Wizard chooses `boundPaths` and skips `oneOf` / `anyOf` subtrees. User checks operations and picks one probe. |
| D8 | Spec URL vs stored text | **Store the text.** The existing Sync button keeps parsing stored text. It does not learn to fetch. |
| D9 | Probe vs save | **Probe from the bag first.** Failure writes nothing. Success upserts secrets, then the endpoint, then the report. No compensating delete. |
| D10 | Second run | **Derived uuids.** Same endpoint name updates that endpoint. Checked operations replace the set. Same probe updates that report. |
| D11 | Header for a raw token | **Template with marker `{secret}`.** Default `Bearer {secret}`. Discogs acceptance uses `Discogs token={secret}`. |
| D12 | Where the wizard lives | **Miroir application.** Button on `MiroirWebAppOrDesktopHome` opens it as its own page. Step 1 always picks the target. |
| D13 | Secrets during the probe | **Register in the process map, call, persist rows after success.** On failure, remove values this action added and restore a previous map value. |
| D14 | Walk | **Twelve step ids** in §5.1. One run visits a subset. The three secret steps are mutually exclusive. User-Agent is on the base-URL step for every path. Blank omits the header. |
| D15 | What the host must grow | **Stable step id, on-Next server action, input schema from a bag transformer, boolean test after that action.** Failure stays on the step and shows that failure's own message. Back follows the path taken. |
| D16 | Response fields | **Wizard-owned `boundPaths`.** User does not pick fields. Playlist `oneOf` tracks stay out until someone edits `boundPaths` on the endpoint. |
| D17 | Names and the saved report | **Generated secret names, editable.** Report is input section + `apiCallReportSection`. No Entity. Probe parameter names are the OpenAPI names. Defaults are the values that just succeeded. Those fields are also URL parameters. |
| D18 | Name clash | **Refuse Finish** when another endpoint in that application has the same name and a different uuid. Do not adopt `0e5cb172-…`. |
| D19 | Public Discogs and token Discogs | **Two runs, two names, one scheme each.** |
| D20 | Save failure after a good probe | **No undo.** Order is secrets, endpoint, report. Retry upserts from the same bag. |
| D21 | Launcher | **`openReportSection` on the web/desktop home**, `openAs: "route"`. No sandbox button. No Admin entry. No shell action. |
| D22 | Picker population | **Keys of the runtime application→deployment map**, except Miroir `360fcf1f-…` and Admin `55af124e-…`. The wizard does not create an application. |
| D23 | Discogs package | **Tests only**, fixture application, local HTTP server. |

**Rationale:** the runtime already calls a synced GET and stores a secret by name. The missing product is the walk that fills those rows, and a multistep host that can branch. Writes stay on Finish so a cancelled walk leaves no rows.

### D5 / D15 — branching without breaking the linear report

**Status:** Accepted — optional step envelope. Bare sections stay valid.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Envelope beside the section** ★ | A list child is either a `ReportSection` (today) or `{ stepId, section, onNext?, branch?, inputSchemaFromBag? }` | `MultistepCountryCreate` (`d2b2fbbd-…`) stays a bare list. Flow fields are not added to all 16 section types | The list **child** schema (`listReportSection.definition` items, Report entity `3f2baa83-…` L161–169) becomes `reportSection` or `multistepStep`. Dual-write EntityVersion `952d2c65-…`. Non-host list renderers must unwrap or reject the envelope |
| D5-b. `stepId` on every section type | Optional fields on all 16 `reportSection` arms | One object shape | Dual-write across every section schema for three optional fields |
| D5-c. Private wizard state machine | React-only flow | No report-engine change | The next wizard copies it. User asked for report branching |

**Decision:** D5-a.

A child with no `stepId` keeps today's index walk (`handleNext` / `handleBack`, `MultistepReportHost.tsx` L360–381). A child with `stepId` is the envelope. `getMultistepChildSections` (L96–105) must return the inner `section` to `ReportSectionViewWithEditor`, and keep the envelope for the host.

**List schema.** `listReportSection.definition` items are a `reportSection` reference only (`3f2baa83-….json` L161–169). The item becomes a union `reportSection | multistepStep`, dual-written on EntityVersion `952d2c65-…`. That union is on every list, not only multistep reports. `ReportSectionListDisplay`, `ReportTools.reportSectionsFormSchema`, and `reportSectionsFormValue` must unwrap `multistepStep` to its `section` (or reject it with a named error). They must not fall through a closed switch.

**Next.** Today `handleNext` (L365–381) only checks `currentStepAllowsNext` and adds 1 to `stepIndex`. There is no DomainController call. Target order, all on the host: client gate on the **resolved** schema, then optional `onNext` server action, then merge its returned object into the bag under `stepId`, then optional `branch.test`, then go to `whenTrue` or `whenFalse`. A failed action or a failed test stays on the current step. This is not the report-query failure banner in `ReportViewWithEditor.tsx` L541–544.

**Back.** The host keeps `visitedStepIds: string[]`. Back pops that stack. `stepIndex - 1` remains only for a report whose children have no `stepId` (`MultistepCountryCreate`).

**Finish gate.** `allGatedStepsAllowFinish` (L170–191, called at L403–405) runs `currentStepAllowsNext` on **every** list child. A static list that contains all three secret steps would fail Finish for the two the user never opened. Target: when the report uses step ids, the gate runs only on `visitedStepIds`. Non-taken secret steps stay in the list. They are not optional empty bags.

**Dynamic schema.** `ReportSectionViewWithEditor.tsx` L738–747 passes the static `inputMLSchema` into `ReportInputSection`. The host, when `stepIndex` changes, evaluates `inputSchemaFromBag` against the bag and passes the resulting Jzod as the input schema for that step. `currentStepAllowsNext` and `collectStepBagKeys` use that resolved object, not the JSON field. The "at least one operation, and the probe is one of them" rule is required fields on that resolved schema. `inputMLSchema` on the stored section stays absent. It is `jzodElement` only (`3f2baa83-…` L726–738).

**Upload.** Paste is an `inputReportSection` string. Upload is a file input on that same document step, read in the browser with `FileReader`, and the text is written into the bag under `document.text` before Next. There is no report section that does this today (`BlobEditorField` and `Importer` are unrelated). The document step's `onNext` sends either that text or the URL to the server. The server parses. The server fetches when the source is a URL. Bytes do not go to the server as a multipart body.

### D9 / D13 — probe, then rows

**Status:** Accepted — register, call, then persist. No rollback.

`resolveSecret` (`SecretStore.ts` L44–61) reads the process map only. A probe that runs before `MiroirSecret` rows exist fails with an unknown secret, including the Spotify refresh-token grant (`ExternalServiceClient.ts` L590–600), which needs client id and client secret before the API call.

The Finish action calls `registerHydratedProcessSecret` (`SecretStore.ts` L27–29) for each typed value, then `executeExternalServiceOperation` with an endpoint object built from the bag (not yet loaded from the store). That helper only overwrites. There is no unregister. `clearSecrets` (L64–67) wipes the whole map and must not be used. Before registering, the action snapshots each name with `resolveSecret` (miss means "was absent"). On probe failure it re-registers the snapshot, or deletes the key when the name was absent. Deleting a key is a new `unregisterProcessSecret` in `SecretStore.ts`. It does not write rows.

On success the same action upserts secrets (`actionLabel: "secrets.set"`, Admin application `55af124e-…`), then the endpoint, then the report. `handleCompositeActionTemplate` returns on the first error and does not roll back (`DomainController.ts` L5000–5015). That window is accepted (D20).

A concurrent call can observe a temporary map value. That is a consequence of D13, not a second product mode.

### D11 — Authorization template

**Status:** Accepted — optional template, `{secret}` marker, new scheme `none`.

Today every non-OAuth credential becomes `Bearer ${token}` (`ExternalServiceClient.ts` L602–613). `securityScheme` is required and is `http` | `oauth2ClientCredentials` | `oauth2AuthorizationCode` (`endpointDefinition.ts` L11–37). There is no `extraHeaders`.

Target on `externalService`:

- `securityScheme` gains `{ type: "none" }`. No `credentialKey`. No Authorization header.
- `http` gains optional `authorizationTemplate`. Absent template keeps `Bearer ${token}` so existing endpoints stay valid. Present template replaces the single marker `{secret}`.
- optional `extraHeaders: Record<string, string>`. The wizard writes `User-Agent` only when the field is non-blank.

OAuth2 schemes are unchanged and still send `Bearer` plus the granted token.

| Wizard choice | `securityScheme` written | Header |
|---|---|---|
| Public | `{ type: "none" }`, no `credentialKey` | none. `extraHeaders["User-Agent"]` when filled |
| Authorization code | existing `oauth2AuthorizationCode` plus the three secret **names** | `Bearer` plus the refresh grant, as today |
| Client credentials | existing `oauth2ClientCredentials` plus the two secret names | `Bearer` plus the client-credentials grant, as today |
| Custom token | `{ type: "http", scheme: "bearer", authorizationTemplate }` plus `credentialKey` | template with `{secret}` replaced. Discogs acceptance template is `Discogs token={secret}` |

`scheme: "bearer"` on the custom-token row is the existing `http.scheme` string. The template, not that string, decides the header. An absent template on an old `http` endpoint still means `Bearer ${token}`.

### D10 / D18 — identity

**Status:** Accepted — uuid v5, refuse a foreign name.

| Row | Uuid |
|---|---|
| Endpoint | `uuidv5(applicationUuid + "\n" + endpointName,` Endpoint entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c`) |
| Validation report | `uuidv5(applicationUuid + "\n" + endpointName + "\n" + probeOperationId,` Report entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`) |
| Secret | existing `miroirSecretInstanceUuid(name, "process")` (`SecretsService.ts` L28–34) |

`uuidv5` of Spotify's application `00514586-…` plus name `SpotifyService` under the Endpoint entity namespace is `c01ea4f1-d8b7-5831-839e-9a770a1755a8`, not the hand-built row `0e5cb172-…`. Finish refuses when a row with that name exists under any other uuid. It does not rewrite `0e5cb172-…`.

Unchecked operations are removed from `enabledOperations` and `operations`. A secret name edited on a later run updates the new name. The old secret row stays. A different probe leaves the previous report.

---

## 1. Goals

1. **Open the wizard** — In order to start a connection without hunting through menus, as an application maintainer, I can open Connect an external service from the Miroir home page and land in the wizard.
2. **Choose the application** — In order to attach the API to the application that will call it, as an application maintainer, I can pick that application on the first step from the deployed applications other than Miroir and Admin.
3. **Supply the contract** — In order to sync from the document I actually have, as an application maintainer, I can paste OpenAPI text, upload a file, or give an HTTPS URL, and see a failure on that step when the text cannot be parsed or the URL is refused.
4. **Choose access** — In order to call a public API or an API that needs a token I already hold, as an application maintainer, I can pick no credential, an OAuth2 refresh-token grant, an OAuth2 client-credentials grant, or a custom Authorization template, and enter the secret values once.
5. **Choose operations** — In order to expose only the reads I want, as an application maintainer, I can check convertible GET operations and mark one as the probe.
6. **Prove the call** — In order to know the connection works before it is saved, as an application maintainer, I can Finish and have a failed probe leave no secret, no endpoint, and no report.
7. **Reuse the connection** — In order to call the same operation again, as an application maintainer, I can open the report Finish created and run the probe with the parameters that succeeded.
8. **Run it again** — In order to change operations or secret values without a second endpoint, as an application maintainer, I can Finish again under the same endpoint name and update that endpoint.

## 2. Non-goals

- Per-user tokens and a browser consent screen (later, unscheduled; #267 revisit).
- OAuth 1.0a (later, unscheduled).
- A Discogs deployment package (later, unscheduled). Discogs is a fixture application plus a local HTTP server.
- Adopting or rewriting Spotify endpoint `0e5cb172-…`.
- Teaching `OpenApiEndpointSyncButton` to fetch a URL (later, unscheduled).
- Non-GET operations, and choosing an `oneOf` / `anyOf` variant in the wizard (later, unscheduled).
- Creating an application from the wizard.
- A button on `MiroirSandboxHome` (`1c306453-…`).
- Rolling back a secret or endpoint write that succeeded after the probe (D20).
- Deleting a secret whose name changed on a later run.
- HTTP instance cache, and an Entity per operation (#281 non-goal, still).

## 3. Current state

### 3.1 Home page (aligned enough to hang a button)

`HomePage` sets `currentApplication` to `selfApplicationMiroir.uuid` and does not use the sidebar selector (`HomePage.tsx` L73–75). When the SelfApplication row has `homePageUrl`, it navigates to `reportUrl(...)` (`HomePage.tsx` L132–149).

Miroir SelfApplication `360fcf1f-f0d4-4f8a-9262-07886e70fa15` (`name: "Miroir"`) points `homePageUrl` at section `data`, report `29ef8018-43fc-4ee9-a736-6f9d625be7b7`. That report's `name` is `MiroirWebAppOrDesktopHome`. Its three sections, in order, are `markdownReportSection`, `inputReportSection` (label "Input to the Report"), `storedReportDisplay`. There is no `openReportSection` on it today.

The same report JSON's `selfApplication` field is `5af03c98-fe5e-490b-b08f-e1230971c57f`, which is the Library SelfApplication (`name: "Library"`). The page URL is built from `homePageUrl.selfApplication` (`360fcf1f-…`), not from that field. The wizard report uses `360fcf1f-…`. It does not copy the Library uuid.

`MiroirSandboxHome` is `1c306453-7958-47e9-ba6c-9b79a7b37c92`, one markdown section. It gets no button (D21).

`openReportSection` is `{ label, reportUuid, openAs: "modal" | "route", application?, applicationSection?, deploymentUuid? }` (`miroirFundamentalType.ts` L3435–3444). `openAs: "route"` is the launcher (D21).

Admin SelfApplication is `55af124e-8c05-4bae-a3ef-0933d41daa92` (`name: "Admin"`). Spotify SelfApplication is `00514586-bf72-4de3-beea-0a627c821404` (`name: "Spotify"`). `defaultSelfApplicationDeploymentMap` (`Deployment.ts` L79–82) contains only Miroir and Admin. Other applications appear when the running `applicationDeploymentMap` gains them. The picker reads that map and drops `360fcf1f-…` and `55af124e-…` (D22). A stock map with only those two keys shows an empty list. That is the rule, not a special case.

### 3.2 Multistep host (misaligned — linear index)

The only committed multistep report is Library `MultistepCountryCreate` `d2b2fbbd-6844-4422-8412-4e3c303296bc`. Its `definition.section` is a `list` of bare sections. Finish is `definition.compositeActionSequence`.

`handleNext` advances `stepIndex + 1` after `currentStepAllowsNext` (`MultistepReportHost.tsx` L365–381). `handleBack` does `stepIndex - 1` (L360–363). There is no step id, no branch test, no on-Next action. `currentStepAllowsNext` (L244–276) checks required input fields for `inputReportSection` and `objectInstanceReportSection`. Every other section type returns true.

`runMultistepFinish` (L55–76) logs `Object.keys(stepBag)` and the **whole** `sequence`, then calls `handleCompositeActionTemplate` with the bag as `actionParamValues`. The hidden `<pre data-testid="multistep-step-bag">` JSON-stringifies the bag (L461–463). `handleCompositeActionTemplate` also logs the full sequence and `localActionParams` at entry (L4795–4803), and on each sub-action logs the action object plus `localContext` (L4846–4855) and `JSON.stringify(actionResult)` (L4992–4998). `ReportViewWithEditor.tsx` L517–520 dumps Formik values in the debug panel, which includes the bag while the wizard is mounted. `redactRegisteredSecretValuesInString` (`SecretStore.ts` L69–84) exists and is not called on any of these paths. Secret values in the bag would show up in all of them.

Finish failure displays `result.errorMessage` only (L420–422). A template sub-action failure is rewrapped as `"handleCompositeActionTemplate compositeInstanceAction error"` (L5007–5014). The inner message is the nested error, not `errorMessage`. The wizard's "show that failure's own message" (D15) is not what the host does today.

Cancel copy (L521–522): "The values you entered will be discarded. Mid-step writes already saved are not undone." `MultistepCountryCreate` also writes only on Finish. The second sentence is already stale for the only existing multistep report. This issue replaces it with the first sentence alone.

Refresh unmounts the host. The bag is `useState` (L302–304). A refresh clears the walk. That matches D4.

### 3.3 External service call (misaligned — Bearer, GET, no User-Agent)

`resolveAuthorizationHeader` (`ExternalServiceClient.ts` L571–615):

- `oauth2ClientCredentials` and `oauth2AuthorizationCode` return `Bearer ${token}`.
- any other case with `credentialKey` returns `Bearer ${token}` via `resolveSecret`.
- otherwise `undefined` (no Authorization header).

`fetchExternalServiceOperation` rejects non-GET (L688–695), requires `enabledOperations` (L680–686), and calls `assertBaseUrlAllowed` (L697, definition L144–167): HTTPS, and `isLoopbackOrPrivateHostname` (L89–104) unless the origin is on the test allowlist. The fetch sets `headers.Authorization` only (L709–720). No User-Agent.

Success is status 200–299, JSON body, then `lenientValidateJzod` (L770–814). Unknown keys are stripped. A required field missing from the body is not an error (`lenientValidateJzod` L250–255 `continue`). That is the probe's success rule. Do not tighten it in this issue.

### 3.4 Sync (aligned on bounds, misaligned on "sync this URL")

`parseOpenApiDocument` (`syncExternalServiceSchema.ts` L65–79) accepts an object or a YAML/JSON string. A URL string is parsed as YAML and fails.

`OpenApiEndpointSyncButton` (`OpenApiEndpointSyncButton.tsx` L66–86) calls `buildOpenApiEndpointSyncComposite` on the endpoint object already in the form. It does not `fetch`. D8 leaves that button on that path.

In-scope methods other than GET are skipped (`syncExternalServiceSchema.ts` L530–537). `operationSync.<id>.boundPaths` must be a non-empty array (L539–545). `oneOf` / `anyOf` throw when the bound is empty or matches not exactly one variant (L241–257). Spotify endpoint `0e5cb172-…` carries hand-written `operationSync.get-playlist.boundPaths`, including `tracks.items.track.*`, because the playlist track is a `oneOf`. The wizard will not emit those paths (D16). The hand-built file is not edited.

`syncExternalServiceSchema` emits a composite that upserts the endpoint and, only when `operationSync.<id>.entity` is set, a `createEntity`. The wizard does not set `entity` (D17).

### 3.5 Secrets (aligned)

`MiroirSecret` entity uuid `a96856df-2b38-494a-8027-82617e2d64ad`. Rows are written with `actionLabel: "secrets.set"` on the Admin application (`SecretsService.ts` L23, L325). Process-scoped identity is `miroirSecretInstanceUuid(name, "process")`. The wizard uses that. It does not invent a second secret table.

### 3.6 Report section union (aligned — 16 members)

Report entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` `reportSection` union (L1333–1449), discriminator `type`, 16 schema references in order: `accordionReportSection`, `graphReportSection`, `gridReportSection`, `jsonReportSection`, `apiCallReportSection`, `inputReportSection`, `listReportSection`, `markdownReportSection`, `modelDiagramReportSection`, `objectListReportSection`, `objectInstanceReportSection`, `storedReportDisplay`, `runnerReportSection`, `transformerRunnerReportSection`, `miroirTestReportSection`, `openReportSection`.

EntityVersion of Report is `952d2c65-4da2-45c2-9394-a0920ceedfb6`. Endpoint entity is `3d8da4d4-8f76-4bb4-9212-14869d81c00c`. EntityVersion of Endpoint is `e3c1cc69-066d-4f52-beeb-b659dc7a88b9`. Schema additions (`none`, `authorizationTemplate`, `extraHeaders`, `multistepStep`) are dual-written on those pairs, then `devBuild`.

Spotify validation report `10ce3252-7840-4041-a769-9a0e2d5ee10b` lives under `spotify_model/` with `conceptLevel: "Model"`. It is a **structural** template only: `extractorTemplates` entry `extractorTemplateForExternalService`, an `inputReportSection`, and `apiCallReportSection` with the same `endpointUuid` and `operationId`. Its URL field is `playlistId`, and the extractor maps OpenAPI `playlist_id` through `referenceName: "playlistId"`. The wizard does not copy that alias. Wizard input fields and `urlParamFields` use the OpenAPI parameter name (`playlist_id`), and `parameterBindings` use that same name as `referenceName`. Generated reports are `conceptLevel: "Model"` in the target application's **model** section, same as `10ce3252-…` and `d2b2fbbd-…`. They are not data-section rows.

## 4. Key reuse

| Piece | Location |
|---|---|
| `executeExternalServiceOperation` | `packages/miroir-core/src/4_services/ExternalServiceClient.ts` |
| `assertBaseUrlAllowed` / `isLoopbackOrPrivateHostname` | same file, L144–167 and L89–104. Spec-URL fetch uses the same rule |
| `syncExternalServiceSchema` | `packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts`. Wizard calls it in-process for `boundPaths` and for the endpoint upsert body. It does not shell out to the Sync button |
| `registerHydratedProcessSecret` / `resolveSecret` | `packages/miroir-core/src/4_services/SecretStore.ts` L27–29, L44–61 |
| `secrets.set` | `SecretsService.ts`, label constant in `AuthenticationPolicy.ts` |
| `apiCallReportSection` | type at `miroirFundamentalType.ts` L3295–3302. Example report `10ce3252-…` |
| `openReportSection` | `miroirFundamentalType.ts` L3435–3444 |
| `MultistepReportHost` | `MultistepReportHost.tsx`. Extend. Do not add a second pager |
| Linear fixture to keep green | `d2b2fbbd-…` `MultistepCountryCreate` |
| Home button target | report `29ef8018-…` |
| Transformer `syncExternalServiceSchema` | uuid `c615ff0e-140a-4d16-b3d4-d7e04081d65b` |
| Hand-built endpoint left untouched | `0e5cb172-12ea-4467-8598-5889338ae454` |

## 5. Target mechanisms

### 5.1 Walk

The wizard report is one `type: "multistep"` report on SelfApplication `360fcf1f-…`. The report instance is model-section, `conceptLevel: "Model"`. The list has **twelve** step ids. A public run visits eight of them (`application`, `name`, `document`, `baseUrl`, `authenticated`, `operations`, `probeParams`, `review`). An authenticated run also visits `scheme` and exactly one of `secretsAuthCode`, `secretsClient`, `secretsCustom`. Finish's `compositeActionSequence` is a single sub-action `connectExternalService` whose parameters are the step bag. The server action owns probe and upserts. The client does not assemble per-secret `createInstance` actions. The host's `application` prop on that page is Miroir. Persistence uses the bag's target application uuid, not that prop.

| Step id | Shown | Bag writes | Branch |
|---|---|---|---|
| `application` | always | target application uuid | next `name` |
| `name` | always | endpoint name | next `document` |
| `document` | always | on Next: parse pasted/uploaded text, or fetch URL, into `openApiDocument` plus the convertible operation list | stay on failure |
| `baseUrl` | always | base URL (default first `servers` entry), optional User-Agent | next `authenticated` |
| `authenticated` | always | boolean | true → `scheme`, false → `operations` |
| `scheme` | authenticated | `authorizationCode` / `clientCredentials` / `customToken` via nested tests | one secret step |
| `secretsAuthCode` | that scheme | three values, token URL, scopes (prefilled from the document when that flow exists) | next `operations` |
| `secretsClient` | that scheme | two values, token URL, scopes | next `operations` |
| `secretsCustom` | that scheme | one value, template default `Bearer {secret}` | next `operations` |
| `operations` | always | checked operation ids, probe id. Schema from `inputSchemaFromBag` | at least one checked, probe ∈ checked |
| `probeParams` | always | parameters for the probe. Schema from `inputSchemaFromBag` | next `review` |
| `review` | always | no new secrets | Finish |

Secret name fields default to `{endpointName}ClientId`, `{endpointName}ClientSecret`, `{endpointName}RefreshToken`, `{endpointName}Token` and are editable. Inputs are masked. Review shows names only.

Nested booleans, not a switch: `authenticated` is the first test. On the scheme step, `scheme == authorizationCode`, else `scheme == clientCredentials`, else custom token.

### 5.2 `connectExternalService`

New `actionType` on the domain-action union, handled in `DomainController.handleAction`. It is not an Endpoint `libraryImplementation`. `handleApplicationAction` still rejects every implementation type other than `compositeActionTemplate` (`DomainController.ts` L3194–3201).

The wizard's Finish sequence is one sub-action of this type. `handleCompositeActionTemplate` already passes the bag as `localActionParams` into `handleAction` (L4984–4990). The handler reads that bag. It does not log it.

The page application is Miroir (`HomePage.tsx` L73–75, and `runMultistepFinish` forwards `props.application`). The handler ignores that for writes. It loads the target application's model through `applicationDeploymentMap[bag.application]` and reads that model's endpoints for the name-clash check (D18). Tests must put the fixture application on that map (D22). Secret writes use application `55af124e-…`. Endpoint and report writes use the bag's application uuid, section `model`.

Scheme objects written on the endpoint are the table in D11. A custom token is `type: "http"` plus `authorizationTemplate` plus `credentialKey`. It is not `type: "none"`.

Order:

1. Name clash (D18) against the **target** model's endpoints. Refusal returns before any map register and before any write.
2. Build the unsaved endpoint object (derived uuid, document text, scheme from the D11 table, `extraHeaders`, `enabledOperations`, `operationSync.boundPaths` from §5.3, `operations` from `syncExternalServiceSchema` for that scope). No `entity` key.
3. Snapshot and register secret values in the process map (D13).
4. Probe `executeExternalServiceOperation` for the probe id and probe parameters.
5. On probe failure: restore the map (D13), return the probe's own error message, write nothing.
6. On success: `secrets.set` for each name (Admin `55af124e-…`), upsert the endpoint on the target application's **model** section, upsert the report on that same model section (`conceptLevel: "Model"`, input defaults = probe values, `urlParamFields` = OpenAPI parameter names, `apiCallReportSection`).
7. If step 6 fails partway: return that step's own error. Do not delete the rows already written (D20).

### 5.3 Bound paths

`syncExternalServiceSchema` does not list convertible operations. It converts only when `boundPaths` is already present (`syncExternalServiceSchema.ts` L539–545). New helpers, same module, sharing `deref` / `convertSchema`:

- `listConvertibleGetOperations(doc)` returns GET `operationId`s whose kept path set is non-empty.
- `boundPathsForOperation(doc, operationId)` returns that set.

The document step's `onNext` and Finish both call these. They do not grow a second converter. For each GET, walk the response schema. Keep a dotted path when `convertSchema` accepts it. Do not descend into `oneOf` or `anyOf`. If the kept set is empty, the operation is absent from the checklist. Finish writes that set as `operationSync.<id>.boundPaths`. This is why a Spotify-shaped `get-playlist` sync from the wizard omits `tracks.items.track.*` even though file `0e5cb172-…` contains them.

### 5.4 Errors and redaction

Next-action failure and branch-test failure stay on the current step. They do not use the Finish-only `setFinishError` path, but they use the same unwrap. Finish failure stays on `review`. The text is the innermost `errorMessage` (`Action2Error.innerError`, `DomainElement.ts` L216), not the wrapper `"handleCompositeActionTemplate compositeInstanceAction error"` (`DomainController.ts` L5009). One `unwrapAction2ErrorMessage` used by the host for both Next and Finish.

These sites must not show secret values. `redactRegisteredSecretValuesInString` (`SecretStore.ts` L69–84) is necessary and not sufficient, because the values are not registered yet while the user is still typing, and the logs fire with the raw bag:

- `runMultistepFinish` sequence argument (`MultistepReportHost.tsx` L63–69)
- hidden `<pre data-testid="multistep-step-bag">` (L461–463)
- `handleCompositeActionTemplate` entry log of `localActionParams` (L4795–4803)
- per sub-action log of `currentAction` and `localContext` (L4846–4855, L4992–4998)
- Formik debug dump (`ReportViewWithEditor.tsx` L517–520) while a multistep report is mounted

Target: those logs print keys only, or run the redactor after registration and a bag-key denylist (`clientSecret`, `refreshToken`, `token`, `secretValue`) before registration. The hidden `<pre>` omits those keys always.

### 5.5 Acceptance shapes

All three run against a fixture application (created in the test, not a new deployment package) and a local HTTP server on the existing insecure-baseUrl allowlist.

| Run | Scheme | Probe |
|---|---|---|
| Discogs-shaped public | `none`, User-Agent set | one convertible GET |
| Discogs-shaped token, second endpoint name | template `Discogs token={secret}` | one convertible GET, Authorization header is that template |
| Spotify-shaped authorization code | three secrets, refresh-token grant against the fake token URL | `get-playlist` without `oneOf` track paths |

Also: failed probe leaves no rows and no new process-map value. Second Finish updates the same endpoint uuid and the same report uuid. Name clash with a pre-seeded other uuid refuses. `MultistepCountryCreate` still pages linearly. `0e5cb172-…` bytes unchanged. Client-credentials is a branch in the report and a save of `oauth2ClientCredentials` on the endpoint. It is not a fourth live grant in the acceptance table. The runtime grant already exists (`ExternalServiceClient.ts` L578–588).

## 6. Proposals

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Envelope + one `connectExternalService` action + home `openReportSection` | Cuts host, client header, sync bounds, and one report | High | **Adopt** (D5-a, §5.2) |
| 2 | Generate the Finish composite in the browser from the bag | Reuses `createInstance` only | High, and secret values sit in a client-built action list that today's logger stringifies | Reject |
| 3 | Per-service wizard reports | No branch engine | Duplicates the walk | Reject (D2) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis is reviewed, following the `miroir-analysis-to-tdd-plan` skill).
