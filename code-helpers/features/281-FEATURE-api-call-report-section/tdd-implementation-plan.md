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

**Resume note:** Slice 1 ✅ DONE. Slice 2 (binding / schema lookup hard fail) not started.

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
| 0 | Characterize current Spotify + sync + section contracts | ✅ | `apiCallReport.281.phase0.unit.test.ts` (stable asserts only) |
| 1 | **First behavioral slice (tracer):** typed playlist UI from Endpoint schema, no `parentUuid` | ✅ | cloned report + `apiCallReport.281.phase1.integ.test.tsx`; GREEN updates committed asset + `spotifyApp` |
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
| Report Entity (schema dual-write) | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| Report EntityVersion | `952d2c65-4da2-45c2-9394-a0920ceedfb6` |
| Endpoint Entity (`operationSync`) | `3d8da4d4-8f76-4bb4-9212-14869d81c00c` |
| Endpoint EntityVersion | `e3c1cc69-066d-4f52-beeb-b659dc7a88b9` |
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

**Status:** ✅ DONE

### Goal

Lock today’s Spotify report, sync constants, section union, and “HTTP is not instance-cache” so later slices have a safety net. Characterization **passes on day one**.

### 0.1 Characterization (passing)

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase0.unit.test.ts`

Vitest: JSON inventory is not a MiroirTest.

Behavior locked:

- `spotify_model` has **7** JSON files; names/uuids match analysis D14 table.
- `SpotifyPlaylist.mlSchema` deep-equals Endpoint `operations[0].responseSchema` (until Slice 4).
- Report `10ce3252-…` section types / `parentUuid` / union “no apiCallReportSection” live only in `describe("pre-281 inventory")` — **Slice 1 deletes that block** (P4). Do not re-run phase0’s pre-281 describe after tracer GREEN.
- Inline `extractorTemplates.playlist` on the report is `extractorTemplateForExternalService` / `0e5cb172-…` / `get-playlist` (keep: still true after tracer).
- `syncExternalServiceSchema.ts` source contains `DEFAULT_GET_PLAYLIST_ENTITY_UUID`, `DEFAULT_SPOTIFY_ENDPOINT_UUID`, `DEFAULT_BOUNDED_PATHS`, `createdEntities[0]` (until Slice 3).
- `getReportsAndEntitiesForDeploymentUuid` return shape has no `endpoints` key (keep).
- Query `371aed0c-…` extractor JSON equals the report embed (keep; can drift).

Move `reportSectionsFormSchema` throw-asserts for `jsonReportSection` / `inputReportSection` into Slice 1 unit RED (P12) so phase0 stays runnable after the new arm exists.

### 0.2 Refactor checkpoint

None. Characterization only.

### Validation

```bash
RUN_TEST=apiCallReport.281.phase0 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase0
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

- **Created:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase0.unit.test.ts` (8 tests, `RUN_TEST` gate matching #274/#253 phase0).
- **Locked:** recursive inventory of 7 `spotify_model` JSON files (uuids/names per D14); `entitySpotifyPlaylist.mlSchema` === `get-playlist` `operations[0].responseSchema`; report `extractorTemplates.playlist`; query/report extractor parity; `syncExternalServiceSchema.ts` text for Spotify defaults + `createdEntities[0]`; `DeploymentUuidToReportsEntities` / `getReportsAndEntitiesForDeploymentUuid` body without `endpoints`; `describe("pre-281 inventory")` for report section triple + 15-member `reportSection` union (Entity + EntityVersion) excluding `apiCallReportSection`.
- **Validation (2026-09-21):** `RUN_TEST=apiCallReport.281.phase0 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase0` → **8/8 pass**; spotify `modelValidation.unit.test.ts` → **7/7 pass**; miroir `modelValidation.unit.test.ts` → **152/152 pass**.
- **Deviations:** none. Union members read from `mlSchema.definition.definition.context.reportSection` (schemaReference arms), not top-level `definition.definition`.

---

## Slice 1 — Tracer: typed playlist from Endpoint schema without Entity `parentUuid`

**Status:** ✅ DONE

### Goal

A report viewer can open `SpotifyPlaylistReport` and see playlist **name** (and nested track names from the bounded schema) as a typed object UI, with **no** `objectInstanceReportSection` / **no** `parentUuid`. Fetch path unchanged (#267).

**Layers cut:** Report Entity + EntityVersion `apiCallReportSection` → `devBuild` → `ReportSectionViewWithEditor` + `ReportTools` → Spotify report JSON → fake-server UI test.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase1.integ.test.tsx`

Vitest `.tsx` + fake server + `MemoryRouter`: not MiroirTest-reachable.

**Fixture contract (P2):** same boot as `spotifyApp.integ.test.tsx` (`resetAndInitApplicationDeployment` + `SeedSpotifyDeploymentMapping`, fake server, `allowInsecureBaseUrlsForTests`, `registerSecrets`). Extract a shared helper in 1.3 if the file does not export one. Endpoints must land in the Redux Endpoint instance index (`useEndpointsOfApplications`).

**Report under test (P1):** do **not** import committed `reportSpotifyPlaylist` for the tracer RED. Pass an **in-test structural clone** of `10ce3252-…` with `apiCallReportSection` (`endpointUuid: 0e5cb172-…`, `operationId: "get-playlist"`, `fetchedDataReference: "playlist"`), same inline extractors, `inputReportSection` kept, no `objectInstance` / no tracks `jsonReportSection`. GREEN later writes that shape to the committed asset.

**Primary failure mode (P13):** fixture playlist **name** is missing (whatever `spotifyApp` already asserts, e.g. `"Rock Classics"`). Do not treat Jzod union parse as the main RED.

Also:

- No text `report target entity not found`.
- Nested track names from the fixture appear as object/array fields, not as the only UI being a `<pre>` dump of the playlist.
- `reportSectionsFormSchema(clone)` does **not** throw (P12). Today `default` throws (`ReportTools.ts` L111–116).
- **HTTP not cached (P5 WHAT):** same as `spotifyApp.integ.test.tsx` L556–581 — Entity may still exist in the **model**, but there is **no** filesystem data directory / instance files for `56166585-…`. Do **not** spy `loadNewInstancesInLocalCache`.

### 1.2 GREEN

Schema rebuild **first**:

- Dual-write `apiCallReportSection` on Report Entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` and EntityVersion `952d2c65-4da2-45c2-9394-a0920ceedfb6` (`label?`, required `fetchedDataReference`, `endpointUuid`, `operationId`).
- Add union member; add `"apiCallReportSection"` to `getMiroirFundamentalJzodSchema.ts` filter list (~L1582–1601).
- `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.

View (**child** `ReportSectionViewWithEditor`, not `ReportViewWithEditor`):

- `useCurrentModelEnvironment(props.application, props.applicationDeploymentMap).endpointsByUuid[endpointUuid]` (R1). Fallback `currentModel.endpoints.find` if the index is empty (same pattern as `objectListReportSection` ~L201). **Forbidden:** `deploymentUuidToReportsEntitiesMapping`. Do **not** copy `ReportViewWithEditor`’s `defaultMiroirModelEnvironment` Formik seed for schema lookup.
- `TypedValueObjectEditor` with `formValueMLSchema = operation.responseSchema`, `readonly={true}`.
- Do **not** mount `ReportSectionEntityInstance`.
- `reportSectionsFormValue`: seed from `reportData[fetchedDataReference]`.
- `reportSectionsFormSchema`: explicit arm returning `{}`.

Then write the clone’s section shape into committed `10ce3252-…`. Keep `inputReportSection` and inline extractors. Drop Report-level `tracks` runtimeTransformer if unused.

**Do not** delete Entity `56166585-…` (Slice 4). **Do not** change sync constants (Slice 3). Tracer uses the **pre-sync** bounded `responseSchema` already on Endpoint JSON (P19). Delete phase0 `describe("pre-281 inventory")` in this slice (P4).

### 1.3 Refactor checkpoint

- Extract shared Spotify report render helper from `spotifyApp.integ.test.tsx` if Slice 1 copied setup.
- `openReportSection` still omitted from the bootstrap **filter** list — do not “fix” that here unless regen breaks.

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

Phase0 `pre-281 inventory` describe must already be gone (P4). Do not re-run deleted asserts.

### Realization

- **Files created:** `packages/miroir-standalone-app/tests/4_view/issues/281-api-call-report-section/apiCallReport.281.phase1.integ.test.tsx` (Spotify boot copied from `spotifyApp`; in-test `structuredClone` of `10ce3252-…` with `apiCallReportSection`; no shared helper extracted).
- **Files modified:** Report Entity `3f2baa83-…` + EntityVersion `952d2c65-…` (`miroir_modelVersion/…`, not `miroir_model/…`); `getMiroirFundamentalJzodSchema.ts` filter list; generated `miroirFundamentalType.ts` / `miroirFundamentalJzodSchema.ts`; `ReportSectionViewWithEditor.tsx`; `ReportTools.ts`; committed Spotify report `10ce3252-…`; `spotifyApp.integ.test.tsx`; phase0 (deleted `describe("pre-281 inventory")`); `playlist-ok.json` (4_view + 3_controllers copies).
- **RED failure observed:** after boot + render, waitFor 15s: `expected playlist name Rock Classics in typed UI (display value or text): expected false to be true`. Harness was healthy: `playlistId` input showed `test-playlist-001`; second list slot was an empty `<div>` (no `apiCallReportSection` arm). `--bail=1` stopped before the form-schema `it`; `default` in `reportSectionsFormSchema` still threw for the new type.
- **GREEN:** dual-write `apiCallReportSection` (`label?`, required `fetchedDataReference` / `endpointUuid` / `operationId` strings) + union member; filter list; `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`. View arm on **child** `ReportSectionViewWithEditor`: `useCurrentModelEnvironment(…).endpointsByUuid` then `getExternalService` → `operations[].responseSchema`, fallback `currentModel.endpoints.find`; `TypedValueObjectEditor` `readonly={true}`, `displaySubmitButton="noDisplay"`, `useActionButton={false}`. `reportSectionsFormValue` seeds `reportData[fetchedDataReference]` at `reportSectionPath.join("_")`; `reportSectionsFormSchema` returns `{}`. Committed report: `inputReportSection` + `apiCallReportSection`; dropped `objectInstance` / `json` / `runtimeTransformers.tracks`.
- **Validation:**
  - `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` → **pass** (before GREEN tests)
  - miroir `modelValidation` (`modelValidation.unit.test.ts`, vitest root `./tests`) → **152/152 pass**
  - spotify `modelValidation` → **7/7 pass** (report JSON accepted in the union)
  - `RUN_TEST=apiCallReport.281.phase0` → **6/6 pass** (pre-281 inventory gone)
  - `RUN_TEST=apiCallReport.281.phase1 --profile emulatedServer-filesystem` → **3/3 pass**
  - `RUN_TEST=spotifyApp --profile emulatedServer-filesystem` → **7/7 pass**
  - `RUN_TEST=externalServiceReport --profile emulatedServer-filesystem` → **5/5 pass**
  - `tsc` miroir-core → **pass**
  - `tsc` miroir-standalone-app → **pass** after re-exporting generated `ReportLink` from `miroir-core/src/index.ts` (AppBar already imported it; latent gap, not Slice 1 behavior).
- **Deviations:**
  - EntityVersion dual-write path is `packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-…/952d2c65-….json` (plan’s `miroir_model/` path does not exist).
  - No shared Spotify render helper (1.3 optional; copy is acceptable).
  - `openReportSection` not added to the bootstrap filter; regen did not break.
  - `playlist-ok.json`: added `images: []` and artist `id` so editor `jzodTypeCheck` matches the bounded `responseSchema`. Fetch `lenientValidateJzod` already stripped extras (`href`, unknown root keys) but **does not** fill missing required fields (`images`, `artists[].id`). Without that, the readonly editor showed `typeError:` instead of fields. Same two keys added on the 3_controllers fixture copy.
  - `spotifyApp`: playlist name/owner/tracks asserted via **display value or text** because `readonly` `TypedValueObjectEditor` uses `ThemedDisplayValue` (not inputs). Metadata-only: no query failure / no `FailedTransformer`; **dropped** `jsonReportSection` `<pre> "[]"`. New-shape still forbids typeError dump. HTTP-no-data-directory and `entitySpotifyPlaylist.mlSchema` jzodTypeCheck kept.
  - Did **not** extract a shared helper; did **not** commit until parent slice commit.
  - Re-exported generated `ReportLink` from `miroir-core/src/index.ts` so standalone-app `tsc` passes (`AppBar` already imported it).

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
RUN_TEST=spotifyApp npm run testByFile -w miroir-standalone-app -- spotifyApp --profile emulatedServer-filesystem
RUN_TEST=externalServiceReport npm run testByFile -w miroir-standalone-app -- externalServiceReport --profile emulatedServer-filesystem
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-spotify -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
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

- Extend MiroirTest `externalServiceSync` (`f4e5dde0-…`): the **inline** `appModel.endpoints[]` object must already include `operationSync.get-playlist.boundPaths` in the RED JSON **before** GREEN deletes `DEFAULT_BOUNDED_PATHS` (P6). Sync of `get-playlist` **without** `entity` yields `compositeActionSequence` with **no** `createEntity`.
- D9 RED in the same suite **or** phase3 vitest: omit `scope`, `enabledOperations: ["get-playlist"]` on that param endpoint → operation is materialized (today this fails L459–461).
- Extend `externalServiceSyncExecute` (`394242e7-…`):
  1. Flip/remove `createSpotifyPlaylist` as the default path (operations-only).
  2. **Mandatory re-sync (P3, filesystem):** a case with `operationSync.get-playlist.entity` set; execute the composite **twice**; second run succeeds; Entity `mlSchema` matches the materialized `responseSchema` (`createEntity` upsert, not `updateInstance`).
  3. **Mandatory second store:** same re-sync case with `--profile emulatedServer-sql` (postgres). If postgres `createEntity` currently errors on an existing uuid, GREEN must make upsert-or-equivalent work there in this slice — not a leftover.
- Vitest `packages/miroir-core/tests/2_domain/issues/281-api-call-report-section/syncExternalServiceSchema.281.phase3.unit.test.ts` (justified: fail-closed params awkward as MiroirTest JSON; real `handleTransformer_syncExternalServiceSchema` + real OpenAPI excerpt from the Spotify Endpoint asset; `appModel` in **transformerParams**, unit `defaultMetaModelEnvironment` is irrelevant):

  1. Missing `endpointUuid` → TransformerFailure.
  2. In-scope GET without `boundPaths` → fail.
  3. Param endpoint carries `operationSync.get-playlist.boundPaths` → `responseSchema` has literal `id`, `name`, `owner.display_name`.
  4. Two `entity` keys → **two** `createEntity` actions, not `[0]`.
  5. `scope` omitted + `enabledOperations: ["get-playlist"]` → syncs that operation.
  6. Extra `operationSync` key not in scope → ignored; `enabledOperations` unchanged.

### 3.2 GREEN

- Dual-write `operationSync` on Endpoint Entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c` + EntityVersion `e3c1cc69-066d-4f52-beeb-b659dc7a88b9`; `EndpointExternalService` in `endpointDefinition.ts`.
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
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites externalServiceSyncExecute --mode integ
RUN_TEST=apiCallReport.281.phase1 npm run testByFile -w miroir-standalone-app -- apiCallReport.281.phase1 --profile emulatedServer-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 4 — Delete example Entity; blast radius; CI fixture

**Status:** ⬜ pending

### Goal

The Spotify **example package** no longer ships Entity `56166585-…`. Menu/home still open report `10ce3252-…`. HTTP `kind: "http"` store-skip and an Entity-backed `objectInstanceReportSection` still pass in **tests**.

**Layers cut:** `spotify_model` Entity file gone → `Spotify.ts` / `index.ts` / `index.d.ts` → dogfood script → tests listed in analysis D14.

### 4.1 RED

Write tests that **fail while the Entity file still exists** (P7). Do not list post-delete regressions under RED.

- `defaultSpotifyAppModel.entities` is `[]` (fails today: `[entitySpotifyPlaylist]`).
- `spotify_model` JSON count is **6** (fails today: 7).
- `packages/miroir-test-app_deployment-spotify/index.ts` does not export `entitySpotifyPlaylist` (fails today).
- `spotifyApp.integ.test.tsx` does not import `entitySpotifyPlaylist` (fails today).
- `dogfood-sync-spotify-schema.ts` does not write `56166585-….json` unless `operationSync.entity` is set (fails if it still hardcodes the path).

`externalServiceHttpStoreSkip` already uses an inline `httpEntity` (not the package file) — keep it as **Validation** after GREEN, not RED.

`apiCallReport.281.phase4.integ.test.tsx` (Entity-backed `objectInstance` fixture) is a **GREEN companion** / Validation test, not the RED that forces deletion.

### 4.2 GREEN

- Delete `packages/miroir-test-app_deployment-spotify/assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json`.
- `defaultSpotifyAppModel.entities = []`; drop export.
- Keep HTTP Entity as **inline / tests fixture** for `externalServiceHttpStoreSkip` (already inline) and write `apiCallReport.281.phase4.integ.test.tsx` (`objectInstanceReportSection` + fixture Entity) as the no-regression proof.
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

- Add `apiCallReport.281.phase1` (and phase2/4 if still issue-scoped) to `externalServices-spotify` in `scripts/nonreg-manifest.json`. If the command string is unwieldy, add a sibling step `apiCallReport-281` rather than overflowing one line (P17).
- Do not drop `spotifyApp` / `externalServiceReport` / `externalServiceHttpStoreSkip`.
- **Issue AC #8 is stale** vs D15 (GitHub still says `updateInstance` / update mlSchema). Slice 5 **must** edit https://github.com/miroir-framework/miroir/issues/281 so re-sync is `createEntity` upsert, matching the plan AC table (P9).

### 5.2 Docs

- `analysis.md` status → implemented when slices 1–4 are DONE.
- Document HTTP report data = query stash, not Entity instance cache: `docs/reference/data-architecture-deployments.md` (already mentions `kind: "http"` skip) plus a short note in `docs/guides/core-concepts.md` Report section **or** `docs/reference/api/entity.md` HTTP paragraph — pick the file that already discusses #267 HTTP entities; do not create a new guide.
- `docs/contributing/testing.md` / `docs/reference/testing.md`: mention `apiCallReport` / updated `spotifyApp` if suite keys change.
- Rewrite issue #281 AC #8 to D15 (`createEntity` upsert). Add analysis + plan links on the issue if missing.

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
| Typed playlist UI **without** `objectInstanceReportSection` / `parentUuid` (Entity file may still exist in the package) | Slice 1 phase1 | ✅ |
| Example package no longer ships Entity `56166585-…`; typed UI still works | Slice 4 `spotifyApp` | ⬜ |
| `objectInstanceReportSection` + HTTP Entity still works | Slice 4 phase4 fixture | ⬜ |
| Section vs extractor mismatch hard fail | Slice 2 | ⬜ |
| Unknown Endpoint / missing operation / missing extractor hard fail | Slice 2 | ⬜ |
| HTTP payload not persisted as Entity instances (no data-section files) | Slice 1 P5 assert (`spotifyApp` L556–581 pattern) | ⬜ |
| Sync without `operationSync.entity` emits no `createEntity`; no Spotify constants | Slice 3 | ⬜ |
| Missing `boundPaths` fail closed | Slice 3 | ⬜ |
| Re-sync via `createEntity` upsert (filesystem **and** postgres); several entity keys | Slice 3 execute integ (both profiles) + unit two-`createEntity` | ⬜ |
| `operationSync` survives Endpoint upsert | Slice 3 | ⬜ |
| Menu/home still the playlist report | Slice 4 `spotifyApp` | ⬜ |
| `modelValidation` miroir + spotify | Slices 1, 3, 4 | ⬜ |
| GitHub issue AC #8 rewritten to D15 (`createEntity` upsert, not `updateInstance`) | Slice 5 | ⬜ |

### Realization

<Appended on completion.>
