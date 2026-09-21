# Issue #281 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, emulated server, fake Spotify HTTP server, and
> `ReportViewWithEditor` through the Report JSON (`apiCallReportSection`) and
> `syncExternalServiceSchema` transformer. No mocks. The tracer proves a playlist
> renders as a typed object UI from `operations[].responseSchema` with **no** Entity `parentUuid`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/281
Prerequisite: [`../267-FEATURE-openapi-external-services/`](../267-FEATURE-openapi-external-services/) ✅
Working branch: `281-FEATURE-api-call-report-section`

**Resume note:** Slices not started.

---

## Scope

- New `apiCallReportSection` (Report Entity + EntityVersion + view + `ReportTools`).
- Schema lookup via `useCurrentModelEnvironment.endpointsByUuid`; mismatch hard fail vs **report inline** extractors.
- `readonly={true}` typed editor; nested arrays inside the object.
- `operationSync` on Endpoint; generalize `syncExternalServiceSchema` (no Spotify constants; Entity only when opted in; D9 scope default).
- Example app: delete `SpotifyPlaylist`; keep an HTTP Entity as a **test fixture**.

This plan does **not** add HTTP instance cache, Entity `mlSchema` schemaReference, Sync-on-save UI, `apiCallListReportSection`, Postgres-external fusion, or non-GET writes (analysis non-goals).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current Spotify + sync + section contracts | ⬜ | `apiCallReport.281.phase0.unit.test.ts` |
| 1 | Tracer: typed playlist UI from Endpoint schema, no `parentUuid` | ⬜ | `apiCallReport.281.phase1.integ.test.tsx` + `spotifyApp` |
| 2 | Binding / schema lookup hard fail | ⬜ | `apiCallReport.281.phase2.integ.test.tsx` |
| 3 | Sync: `operationSync`, no Spotify defaults, Entity opt-in | ⬜ | `externalServiceSync` + `apiCallReport.281.phase3.unit.test.ts` |
| 4 | Delete example Entity; rewrite blast radius; HTTP Entity fixture | ⬜ | `spotifyApp` + `externalServiceHttpStoreSkip` + modelValidation spotify |
| 5 | Docs, nonreg, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md) D1–D16 (post-review). Binding. Deviations go in Realization.

| Decision | Choice |
|---|---|
| D1 | Typed UI without an Entity |
| D2 | `operations[].responseSchema` is canonical |
| D3 | Repeat `endpointUuid` + `operationId`; check **report** `extractorTemplates` |
| D4 | New `apiCallReportSection` |
| D5 | No HTTP instance cache (query stash only) |
| D6 | One transformer; Entity only if `operationSync.<id>.entity` |
| D7 | Section display-only |
| D8 | `boundPaths` required; fail closed |
| D9 | **New:** default `scope` to `enabledOperations` when non-empty; require `endpointUuid` |
| D10 | Intent on Endpoint `operationSync`; transformer runner |
| D11 | `TypedValueObjectEditor` `readonly={true}` |
| D12 | One object section; nested arrays in the editor |
| D13 | Hard fail; no JSON fallback |
| D14 | Delete example Entity; CI fixture keeps Entity-backed HTTP |
| D15 | One `createEntity` per opted-in key (filesystem upserts); not `updateInstance` |
| D16 | Extra `operationSync` keys ignored |
| Lookup | `useCurrentModelEnvironment(…).endpointsByUuid` — **not** `deploymentUuidToReportsEntitiesMapping` |
| Form switches | Explicit `apiCallReportSection` in `reportSectionsFormValue` **and** `reportSectionsFormSchema` |
| Sequencing | Endpoint `operationSync` + Spotify boundPaths asset **before** deleting `DEFAULT_BOUNDED_PATHS` |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Report `SpotifyPlaylistReport` (keep) | `10ce3252-7840-4041-a769-9a0e2d5ee10b` |
| Endpoint `SpotifyService` (keep) | `0e5cb172-12ea-4467-8598-5889338ae454` |
| Query `spotifyGetPlaylist` (parallel asset; not the report runner) | `371aed0c-05bb-4b77-8cf1-2c82407555c1` |
| Example Entity `SpotifyPlaylist` (deleted Slice 4) | `56166585-b6fd-42c6-95d3-32a80c3304f7` |
| TransformerDefinition `syncExternalServiceSchema` | `c615ff0e-140a-4d16-b3d4-d7e04081d65b` |
| Report Entity / EntityVersion (schema dual-write) | `3f2baa83-…` / `952d2c65-…` |
| Endpoint Entity / EntityVersion (`operationSync`) | `3d8da4d4-…` / `e3c1cc69-…` |
| MiroirTest `externalServiceSync` (extend) | `f4e5dde0-3dba-493b-a208-04494dbbb2f5` |
| MiroirTest `externalServiceSyncExecute` (extend) | `394242e7-6443-41b8-b061-9bf2bcf06f17` |
| HTTP Entity **test fixture** (Slice 4; same uuid, not the example package) | `56166585-b6fd-42c6-95d3-32a80c3304f7` copied under `packages/miroir-core/tests/4_services/fixtures/` (or keep inline in `externalServiceHttpStoreSkip`) |
| Entity-backed HTTP **report** CI fixture | inline Report JSON in `apiCallReport.281.phase4.integ.test.tsx` (objectInstance + fixture Entity). No new production uuid. |
| Issue vitest directory | `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/` |
| Sync unit vitest (transformer fail-closed / no Entity) | `packages/miroir-core/tests/2_domain/issues/281-api-call-report-section/syncExternalServiceSchema.281.phase3.unit.test.ts` |
| Nonreg | extend existing step `externalServices-spotify` (no new step unless the command line overflows) |

No new production Report/Endpoint uuids.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0/2/3 unit (standalone-app) | `RUN_TEST=apiCallReport.281.phaseN npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phaseN` |
| Slice 1/2/4 integ report | `RUN_TEST=apiCallReport.281.phaseN npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phaseN --profile emulatedServer-filesystem` |
| Existing Spotify UI | `RUN_TEST=spotifyApp npm run testByFile -w miroir-standalone-app -- spotifyApp --profile emulatedServer-filesystem` |
| Existing report path | `RUN_TEST=externalServiceReport npm run testByFile -w miroir-standalone-app -- externalServiceReport --profile emulatedServer-filesystem` |
| Sync MiroirTest unit | `npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit` |
| Sync execute integ | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites externalServiceSyncExecute --mode integ` |
| HTTP store skip | `RUN_TEST=externalServiceHttpStoreSkip npm run testByFile -w miroir-core -- externalServiceHttpStoreSkip` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` — **before** tests in any slice that changed Jzod |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` and `-w miroir-test-app_deployment-spotify` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `packages/miroir-standalone-app/tsconfig.json` and `packages/miroir-test-app_deployment-spotify/tsconfig.json` |

**Vitest exception:** React report rendering, `MemoryRouter`, and the fake HTTP server lifecycle are not MiroirTest-reachable (same justification as #267 `externalServiceReport` / `spotifyApp`). Transformer fail-closed / no-`createEntity` assertions that are painful as declarative MiroirTest JSON may use the Slice 3 vitest **in addition to** extending `externalServiceSync`.

**No mocks.** Fake Spotify server + `RestClientStub` emulated profile as in #267.

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock today’s Spotify report, sync constants, section union, and “HTTP is not instance-cache” so later slices have a safety net. Characterization **passes on day one**.

### 0.1 Characterization (passing)

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase0.unit.test.ts`

Vitest: JSON inventory is not a MiroirTest.

Behavior locked:

- `spotify_model` has **7** JSON files; names/uuids match analysis D14 table.
- Report `10ce3252-…` section types are exactly `inputReportSection`, `objectInstanceReportSection`, `jsonReportSection`; `objectInstance` `parentUuid` is `56166585-…`; inline `extractorTemplates.playlist` is `extractorTemplateForExternalService` / `0e5cb172-…` / `get-playlist`.
- `SpotifyPlaylist.mlSchema` deep-equals Endpoint `operations[0].responseSchema`.
- Report Entity + EntityVersion `reportSection` unions are identical, **15** members, **no** `apiCallReportSection`.
- `syncExternalServiceSchema.ts` source contains `DEFAULT_GET_PLAYLIST_ENTITY_UUID`, `DEFAULT_SPOTIFY_ENDPOINT_UUID`, `DEFAULT_BOUNDED_PATHS`, `createdEntities[0]`.
- `getReportsAndEntitiesForDeploymentUuid` return type/shape has no `endpoints` key (analysis R1).
- `reportSectionsFormSchema` throws for `jsonReportSection` and `inputReportSection`.
- Query `371aed0c-…` extractor JSON equals the report embed (document they can drift).

Do **not** assert line numbers.

### Validation

```bash
RUN_TEST=apiCallReport.281.phase0 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase0
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: typed playlist from Endpoint schema without Entity `parentUuid`

**Status:** ⬜ pending

### Goal

A report viewer can open `SpotifyPlaylistReport` and see playlist **name** (and nested track names from the bounded schema) as a typed object UI, with **no** `objectInstanceReportSection` / **no** `parentUuid`. Fetch path unchanged (#267).

**Layers cut:** Report Entity + EntityVersion `apiCallReportSection` → `devBuild` → `ReportSectionViewWithEditor` + `ReportTools` → Spotify report JSON → fake-server UI test.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase1.integ.test.tsx`

Vitest `.tsx` + fake server + `MemoryRouter`: not MiroirTest-reachable.

Reuse the sanctioned harness from `spotifyApp.integ.test.tsx` (extract a shared helper in the refactor checkpoint if the file does not export one — do not fork a second fake-server stack).

Behavior asserted (WHAT, not “Redux was not called”):

- Render `reportSpotifyPlaylist` with `playlistId` of the fake-server fixture.
- Playlist name from the fixture is visible (e.g. `"Rock Classics"` / whatever `spotifyApp` already asserts).
- No text `report target entity not found`.
- No `<pre>` JSON dump of the whole playlist as the only UI (the old tracks `jsonReportSection` is gone; nested tracks appear as object/array fields).
- Report JSON `section.definition` has an `apiCallReportSection` with `endpointUuid: 0e5cb172-…`, `operationId: "get-playlist"`, `fetchedDataReference: "playlist"`.
- **HTTP not cached:** after render, local cache instance map for Entity `56166585-…` is empty / undefined (query stash only). If the test process still has the Entity in `defaultSpotifyAppModel` this slice, assert **no** `loadNewInstancesInLocalCache` for that uuid (spy on DomainController **only if** an existing test already does; otherwise assert `getInstances` for that entity from the client cache is empty). Prefer: `ReportQueryLoadService.getResult` is the source of `reportData`, matching #267.

This RED fails today because the union rejects `apiCallReportSection` and the view has no arm.

### 1.2 GREEN

Schema rebuild **first**:

- Dual-write `apiCallReportSection` on Report Entity `3f2baa83-…` and EntityVersion `952d2c65-…` (`label?`, required `fetchedDataReference`, `endpointUuid`, `operationId`).
- Add union member; add `"apiCallReportSection"` to `getMiroirFundamentalJzodSchema.ts` filter list (~L1582–1601).
- `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.

View:

- `ReportSectionViewWithEditor` arm: resolve Endpoint via `useCurrentModelEnvironment(props.application, props.applicationDeploymentMap).endpointsByUuid` (R1). **Forbidden:** `deploymentUuidToReportsEntitiesMapping`.
- `TypedValueObjectEditor` with `formValueMLSchema = operation.responseSchema`, `readonly={true}`.
- Do **not** mount `ReportSectionEntityInstance`.
- `reportSectionsFormValue`: seed from `reportData[fetchedDataReference]` (`objectInstance` analogue L179–226).
- `reportSectionsFormSchema`: explicit arm returning `{}` (must not throw).

Spotify report `10ce3252-…`: replace `objectInstance` + tracks `jsonReportSection` with one `apiCallReportSection`. Keep `inputReportSection`. Keep inline extractors. Drop Report-level `tracks` runtimeTransformer if unused.

**Do not** delete Entity `56166585-…` in this slice (Slice 4). **Do not** change sync constants yet (Slice 3). Existing `responseSchema` on the Endpoint is enough for the tracer.

### 1.3 Refactor checkpoint

- Extract shared Spotify report render helper from `spotifyApp.integ.test.tsx` if Slice 1 copied setup.
- `openReportSection` still omitted from the bootstrap **filter** list — do not “fix” that here unless regen breaks; analysis already records the overlay.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
RUN_TEST=apiCallReport.281.phase0 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase0
RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
RUN_TEST=spotifyApp npm run testByFile -w miroir-standalone-app -- spotifyApp --profile emulatedServer-filesystem
RUN_TEST=externalServiceReport npm run testByFile -w miroir-standalone-app -- externalServiceReport --profile emulatedServer-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Update Slice 0 inventory if it asserted “no apiCallReportSection” / three section types — those characterization tests **flip** in this slice (edit phase0 or split “pre-281 shape” vs “post-tracer shape”). Prefer: phase0 keeps historical constants/sync asserts; section-type asserts move to phase1.

### Realization

<Appended on completion.>

---

## Slice 2 — Binding / schema lookup hard fail

**Status:** ⬜ pending

### Goal

A report designer sees a hard-fail message (no typed editor, no JSON dump) when the section’s Endpoint/operation disagree with the **report inline** extractor, or the schema cannot be resolved.

**Layers cut:** same view arm as Slice 1 (deepen, don’t add a parallel component).

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase2.integ.test.tsx`

Three cases (same fake-server harness):

1. Section `operationId: "not-get-playlist"` vs extractor `get-playlist` → message contains both ids.
2. Valid ids but Endpoint uuid that is not in `endpointsByUuid` → message names the uuid; no `report target entity not found`.
3. `fetchedDataReference: "tracks"` while only extractor key is `playlist` → message names the key.

Also: `enabledOperations` omit is **not** this banner (fetch error from #267). One test that a well-bound section + disabled operation still fails as an **external-service** error, not a binding mismatch (R14).

### 2.2 GREEN

Implement analysis §5.3 in the Slice 1 arm. Compare to `reportDefinition.definition.extractorTemplates` / resolved extractors. Accept #272 aliases `extractorFromAction` / `extractorTemplateFromAction`.

### 2.3 Refactor checkpoint

- One small resolver function (Endpoint + extractor → schema | error string) in a deep module, tested through the UI tests above — **do not** add a new public package export unless the view file is unreadable. If extracted, unit-test the helper with **real** Spotify report JSON (import the asset), not an inline clone.

### Validation

```bash
RUN_TEST=apiCallReport.281.phase2 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase2 --profile emulatedServer-filesystem
RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
```

### Realization

<Appended on completion.>

---

## Slice 3 — Sync: `operationSync`, drop Spotify defaults, Entity opt-in

**Status:** ⬜ pending

### Goal

An application designer can run `syncExternalServiceSchema` so `operations[].responseSchema` updates from OpenAPI **without** `createEntity`, unless `operationSync.<id>.entity` is set. No `get-playlist` / Spotify uuid constants remain in `syncExternalServiceSchema.ts`.

**Layers cut:** Endpoint Entity + EntityVersion `operationSync` → `EndpointExternalService` type → transformer handler → TransformerDefinition params → Spotify Endpoint asset `operationSync.get-playlist.boundPaths` (no `entity`) → MiroirTest / unit.

**Order (analysis R6):** dual-write `operationSync` + commit boundPaths on Endpoint `0e5cb172-…` **before** deleting `DEFAULT_BOUNDED_PATHS`.

### 3.1 RED → GREEN cycles (one slice, grouped)

**Tests:**

- Extend MiroirTest `externalServiceSync` (`f4e5dde0-…`): sync of `get-playlist` **without** `entity` in `operationSync` yields `compositeActionSequence` whose `actionSequence` has **no** `createEntity` (only Endpoint `updateInstance`).
- Extend `externalServiceSyncExecute` (`394242e7-…`) if it currently asserts `createSpotifyPlaylist` — flip to operations-only **or** add a second case with `entity` set.
- Vitest `packages/miroir-core/tests/2_domain/issues/281-api-call-report-section/syncExternalServiceSchema.281.phase3.unit.test.ts` (justified: fail-closed `oneOf` without boundPaths and “missing endpointUuid” are awkward as MiroirTest JSON; still call the **real** `handleTransformer_syncExternalServiceSchema` with the **real** OpenAPI excerpt string from the Spotify Endpoint asset — no cloned schema):

  1. Missing `endpointUuid` → TransformerFailure (no `DEFAULT_SPOTIFY_ENDPOINT_UUID`).
  2. In-scope GET without `boundPaths` → fail (`oneOf` or explicit empty-bound error).
  3. `operationSync.get-playlist.boundPaths` from the Endpoint instance (in `appModel`) produces `responseSchema` equal to today’s bounded Jzod (lock a **literal** subset: `id`, `name`, `owner.display_name` present).
  4. Two `entity` keys → **two** `createEntity` actions, not `[0]`.
  5. `scope` omitted + `enabledOperations: ["get-playlist"]` → syncs that operation (D9 **new** behavior).
  6. `operationSync` extra key not in scope → ignored; `enabledOperations` unchanged on the upserted Endpoint.
  7. Re-sync: `createEntity` for an existing uuid (filesystem upsert) — if this test cannot boot a filesystem store, prove upsert in `externalServiceSyncExecute` integ instead.

### 3.2 GREEN

- Dual-write `operationSync` (optional record: `boundPaths: string[]`, optional `entity: { uuid, name }`) on Endpoint Entity `3d8da4d4-…` + EntityVersion `e3c1cc69-…`; `EndpointExternalService` in `endpointDefinition.ts`.
- TransformerDefinition `c615ff0e-…`: add `endpointUuid` to `transformerParameterSchema`.
- Rebuild miroir + `devBuild`.
- Spotify Endpoint JSON: `operationSync.get-playlist.boundPaths` = today’s `DEFAULT_BOUNDED_PATHS` list; **no** `entity`.
- Handler: required `endpointUuid`; bound paths from Endpoint `operationSync` (params override allowed for tests); drop `DEFAULT_*` and `entityDefaultsForOperation` get-playlist branch; emit `createEntity` **only** when `entity` present, **all** keys; D9 scope default; spread `externalService` so `operationSync` survives (`buildCompositeAction` L403–411).

### 3.3 Refactor checkpoint

- Delete dead `entityDefaultsForOperation` if it becomes a one-liner.
- Keep `convertSchema` / `responseSchemaForOperation` as the shared core (D6).

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
RUN_TEST=syncExternalServiceSchema.281.phase3 npm run testByFile -w miroir-core -- syncExternalServiceSchema.281.phase3
npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites externalServiceSyncExecute --mode integ
RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

Prove postgres/indexedDb Entity `createEntity` upsert **or** document leftover: if those stores error on existing uuid, add a store-specific cycle here (analysis D15). At minimum filesystem + the execute integ profile used by `externalServiceSyncExecute`.

### Realization

<Appended on completion.>

---

## Slice 4 — Delete example Entity; blast radius; CI fixture

**Status:** ⬜ pending

### Goal

The Spotify **example package** no longer ships Entity `56166585-…`. Menu/home still open report `10ce3252-…`. HTTP `kind: "http"` store-skip and an Entity-backed `objectInstanceReportSection` still pass in **tests**.

**Layers cut:** `spotify_model` Entity file gone → `Spotify.ts` / `index.ts` / `index.d.ts` → dogfood script → tests listed in analysis D14.

### 4.1 RED

**Tests:**

- `spotifyApp.integ.test.tsx` still renders the playlist (will fail if it still imports `entitySpotifyPlaylist` for boot/schema).
- New/extended: `packages/miroir-core/tests/4_services/externalServiceHttpStoreSkip.unit.test.ts` still passes **after** the example file is gone (must not import from `miroir-test-app_deployment-spotify` Entity asset).
- `apiCallReport.281.phase4.integ.test.tsx`: inline `objectInstanceReportSection` + fixture HTTP Entity + same fake playlist → still shows typed instance UI (no regression D4/D14).
- `dogfood-sync-spotify-schema.ts` does not write `56166585-….json` unless `operationSync.entity` is passed.

Characterization: `spotify_model` JSON count is **6**.

### 4.2 GREEN

- Delete `packages/miroir-test-app_deployment-spotify/assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json`.
- `defaultSpotifyAppModel.entities = []`; drop export.
- Move HTTP Entity JSON into `miroir-core` test fixture (same uuid) for store-skip.
- Rewrite `spotifyApp` asserts that used `entitySpotifyPlaylist.mlSchema` to read **Endpoint** `responseSchema` instead.
- Align Query `371aed0c-…` extractors with the report embed (drop `tracks` if unused).
- Update MiroirTest expected composites that `createSpotifyPlaylist`.

### 4.3 Refactor checkpoint

- Dead `entitySpotifyPlaylist` imports; `index.d.ts`.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
RUN_TEST=spotifyApp npm run testByFile -w miroir-standalone-app -- spotifyApp --profile emulatedServer-filesystem
RUN_TEST=externalServiceHttpStoreSkip npm run testByFile -w miroir-core -- externalServiceHttpStoreSkip
RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
RUN_TEST=apiCallReport.281.phase4 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase4 --profile emulatedServer-filesystem
npm run testMiroir -w miroir-core -- --suites externalServiceSync --mode unit
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites externalServiceSyncExecute --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-test-app_deployment-spotify/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 5 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 5.1 Nonreg

- Add `apiCallReport.281.phase1` (and phase2/4 if still issue-scoped) **or** the feature-named successors to the existing `externalServices-spotify` command in `scripts/nonreg-manifest.json`.
- Do not drop `spotifyApp` / `externalServiceReport` / `externalServiceHttpStoreSkip`.

### 5.2 Docs

- `analysis.md` status → implemented when slices 1–4 are DONE.
- Document HTTP report data = query stash, not Entity instance cache: `docs/reference/data-architecture-deployments.md` (already mentions `kind: "http"` skip) plus a short note in `docs/guides/core-concepts.md` Report section **or** `docs/reference/api/entity.md` HTTP paragraph — pick the file that already discusses #267 HTTP entities; do not create a new guide.
- `docs/contributing/testing.md` / `docs/reference/testing.md`: mention `apiCallReport` / updated `spotifyApp` if suite keys change.

### 5.3 Issue-directory cleanup

- Move still-valuable asserts from `tests/**/issues/281-*` into `externalServiceReport` / `spotifyApp` / `syncExternalServiceSchema` feature files; delete the issue directory (#238).

### 5.4 Tracer bullet (narrative)

1. Open Spotify app home (`reportUuid=10ce3252-…`).
2. Enter a playlist id, OK.
3. Typed playlist object (name, owner, nested tracks) appears; no Entity in the model list.
4. Break the section `operationId` in the report editor → hard-fail message, input section still usable (#267 URL params).
5. Run `syncExternalServiceSchema` from the transformer runner with `endpointUuid` set; review composite: Endpoint upsert only.

Automated equivalent: phase1 + phase2 + `externalServiceSync` + `spotifyApp`.

### AC checklist (#281)

| Criterion | Proven by | Status |
|---|---|---|
| Typed `get-playlist` UI without Entity `56166585-…` | Slice 1 phase1 + Slice 4 `spotifyApp` | ⬜ |
| `objectInstanceReportSection` + HTTP Entity still works | Slice 4 phase4 fixture | ⬜ |
| Section vs extractor mismatch hard fail | Slice 2 | ⬜ |
| Unknown Endpoint / missing operation / missing extractor hard fail | Slice 2 | ⬜ |
| HTTP payload not in instance cache | Slice 1 cache assert + Slice 0 lock | ⬜ |
| Sync without `operationSync.entity` emits no `createEntity`; no Spotify constants | Slice 3 | ⬜ |
| Missing `boundPaths` fail closed | Slice 3 | ⬜ |
| Re-sync / several entity keys | Slice 3 | ⬜ |
| `operationSync` survives Endpoint upsert | Slice 3 | ⬜ |
| Example package no longer ships the Entity; menu/home still the report | Slice 4 | ⬜ |
| `modelValidation` miroir + spotify | Slices 1, 3, 4 | ⬜ |

### Realization

<Appended on completion.>
