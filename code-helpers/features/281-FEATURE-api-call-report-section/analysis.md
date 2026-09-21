# 281 — Typed API-call report section without an Entity

> How to display an OpenAPI GET payload in a Report as a typed object UI whose
> Jzod comes from `Endpoint.operations[].responseSchema`, without creating a
> full Entity. #267’s Entity-backed path remains. Sync is generalized off the
> Spotify `get-playlist` constants.

Related issue: https://github.com/miroir-framework/miroir/issues/281
Prerequisite: [#267 OpenAPI external services](https://github.com/miroir-framework/miroir/issues/267) ✅ — [`../267-FEATURE-openapi-external-services/analysis.md`](../267-FEATURE-openapi-external-services/analysis.md)
Related: [#208 cache policy](https://github.com/miroir-framework/miroir/issues/208) (HTTP instance cache stays later) · Postgres `conceptLevel: "External"` reports (fusion later, unscheduled)
Key sources: [`syncExternalServiceSchema.ts`](../../../packages/miroir-core/src/2_domain/syncExternalServiceSchema.ts) · [`endpointDefinition.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/endpointDefinition.ts) · [`createReportQueryLoadExecutor.ts`](../../../packages/miroir-core/src/2_domain/createReportQueryLoadExecutor.ts) · [`ReportSectionViewWithEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx) · [`ReportSectionEntityInstance.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx) · [`ReportTools.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportTools.ts) · [`ReportInputSection.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportInputSection.tsx) · [`SpotifyPlaylistReport`](../../../packages/miroir-test-app_deployment-spotify/assets/spotify_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/10ce3252-7840-4041-a769-9a0e2d5ee10b.json) · [`SpotifyPlaylist` Entity](../../../packages/miroir-test-app_deployment-spotify/assets/spotify_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/56166585-b6fd-42c6-95d3-32a80c3304f7.json) · [`SpotifyService` Endpoint](../../../packages/miroir-test-app_deployment-spotify/assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-21 grilling). Implementation plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written after this analysis).

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| OpenAPI Endpoint + server GET + Spotify example with Entity display schema | [#267](https://github.com/miroir-framework/miroir/issues/267) | ✅ |
| Typed report section from operation `responseSchema`; Entity optional | **#281 (this document)** | **this** |
| Entity `mlSchema` as schemaReference to the operation (no copy) | later, unscheduled | later |
| HTTP instance cache keyed by `(endpoint, operation, params)` | later, unscheduled (#208 adjacent) | later |
| Fusion with Postgres read-only external Entities | later, unscheduled | later |
| `apiCallListReportSection` / list variant | later, unscheduled | later |

#267 D3 accepted duplication between Entity `mlSchema` and operation `responseSchema`, and listed lifting it as a non-goal. This issue **lifts the display coupling** (reports need not own an Entity) and **stops unconditional Entity emission**. It does **not** make Entity `mlSchema` a live schemaReference (still a copy when an Entity is requested).

---

## Decision record

Confirmed with the user (2026-09-21). Defaults accepted except Q3 (repeat ids) and Q4 (new section type). ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | What is the product gap? | **Typed object UI for an HTTP payload without creating an Entity.** Fetch/cache already work without one. |
| D2 | Where does the Jzod live? | **`Endpoint.operations[].responseSchema` is canonical.** Entity `mlSchema` remains a copy when an Entity is requested. |
| D3 | How does the section find the schema? | **Repeat `endpointUuid` + `operationId` on the section.** Mismatch with the extractor that produced `fetchedDataReference` is a hard fail. |
| D4 | New section type or extend existing? | **New `apiCallReportSection`.** Flies separately from Entity-bound instance sections and from unstructured `jsonReportSection`. Eventual fusion with read-only external Entities is later. |
| D5 | HTTP instance cache? | **None.** Query stash only. Write this down in docs/tests. Entity-backed HTTP path does not cache instances either. |
| D6 | Sync shape | **One transformer** (`syncExternalServiceSchema`). Entity only when `operationSync.<operationId>.entity` is set. Remove Spotify-specific constants. |
| D7 | Does the section fetch? | **Display only.** Extractor still runs server-side (#267 D5). |
| D8 | OpenAPI bound subset | **`operationSync.<id>.boundPaths` required.** No bound → fail closed (`oneOf`/`anyOf` still rejected without a unique bound match). |
| D9 | Sync selection vs runtime allowlist | **Keep `scope`.** Require `endpointUuid`. Default `scope` to `enabledOperations` when that list is non-empty. Sync does not rewrite `enabledOperations`. |
| D10 | Designer control surface | **`externalService.operationSync` on the Endpoint**, edited with the generic instance editor. Transformer runner supplies `endpointUuid` (+ `appModel`); everything else is read from that Endpoint. Tests may still pass overrides in `transformerParams`. |
| D11 | Read-only? | **Always.** No submit, no instance write. Writes would be a different section/action later. |
| D12 | Root object vs arrays | **One object section.** Nested arrays render inside the object editor. Spotify’s extra tracks `jsonReportSection` goes. |
| D13 | Mismatch / lookup failure | **Hard fail.** Message names Endpoint, operation, and extractor. No silent JSON dump. |
| D14 | Example app | **Delete `SpotifyPlaylist`.** Report uses `apiCallReportSection`. Keep an Entity-backed HTTP report as a **CI fixture** (no regression). |
| D15 | Re-sync when `entity` is set | **Per keyed operation:** `createEntity` if uuid absent, `updateInstance` (refresh `mlSchema`) if present. Several keys → several actions, not `createdEntities[0]`. |
| D16 | Extra `operationSync` keys | **Ignored** if not in `scope`. Presence in `operationSync` does not enable the call. |

**Rationale:** the Entity is a display costume for HTTP data, not a store identity. The report query already fetches without it. A new section type names that difference (no cache, schema from the Endpoint). Sync intent has to live on the Endpoint **before** `operations[]` exists, because bound paths are an input to conversion.

### D1 — product gap

**Status:** Accepted — typed display without an Entity.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Typed UI, no Entity** ★ | New section reads operation Jzod | Removes modeling tax for “just show this GET” | Another report-section arm |
| D1-b. Also cache HTTP rows without an Entity | Shadow instance store keyed by operation+params | Navigate-away reuse | Invents a PK owner; #208-sized |
| D1-c. Keep Entity, only stop copying schemas | schemaReference Entity → operation | Smaller report change | Designer still creates an Entity |

**Decision:** D1-a. D1-b is a later cache issue. D1-c is a later de-duplication of Entity `mlSchema`, not this display seam.

### D4 — section type

**Status:** Accepted — `apiCallReportSection`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. New union member** ★ | 16th `reportSection` arm | Clarity: HTTP payload ≠ Entity instance ≠ raw JSON | Dual-write Report Entity + EntityVersion; `ReportSectionViewWithEditor` / `ReportTools` / bootstrap filter |
| D4-b. Optional `parentUuid` on `objectInstanceReportSection` | Schema-source XOR | Smallest diff | Mixes store identity with HTTP |
| D4-c. `jsonReportSection` + optional schema | Dump grows a Jzod | Reuses unstructured section | Unstructured vs typed in one type |
| D4-d. Generic schema-backed object section | Not named after HTTP | Cleaner long-term | User chose HTTP-named type **for now** |

**Decision:** D4-a. Postgres `SchemaDetails` still uses `objectInstanceReportSection` + Entity (`a72bb361-…`, `parentUuid` `cbc94d62-…`). Fusion of those read-only externals with this section is later, unscheduled.

**Section shape (target):**

```json
{
  "type": "apiCallReportSection",
  "definition": {
    "label": "Playlist",
    "fetchedDataReference": "playlist",
    "endpointUuid": "0e5cb172-12ea-4467-8598-5889338ae454",
    "operationId": "get-playlist"
  }
}
```

`fetchedDataReference`, `endpointUuid`, and `operationId` are required. No `parentUuid`. Optional `combinerTemplates` / `runtimeTransformers` are **not** copied from `objectInstanceReportSection` unless a later issue needs them; the Report-level extractors already produce the context key.

### D3 / D13 — repeated ids and hard fail

**Status:** Accepted — boilerplate for a check.

The extractor at `fetchedDataReference` must be `extractorTemplateForExternalService` or `extractorForExternalService` with the same `endpointUuid` and `actionType === operationId`. Then load that Endpoint from the current application model, find `operations[]` by `operationId`, use `responseSchema`.

Hard fail (no typed editor, no JSON fallback) when:

- the referenced key is missing, or is a combiner/runtimeTransformer rather than that extractor;
- ids disagree;
- Endpoint is unknown;
- operation is missing from `operations[]`.

`enabledOperations` is a **runtime fetch** gate (`ExternalServiceClient.ts` ~680–686), not a display-schema gate. A disabled operation can still have a materialized `responseSchema`; the query will fail at fetch, not at section render. Do not treat “not enabled” as a section mismatch.

### D5 — no cache (explicit)

**Status:** Accepted.

Today, with or without `SpotifyPlaylist`:

- Server: `resolveExtractorForExternalServiceInBoxedQuery` writes `contextResults[extractorName]` (`DomainController.ts` L3291–3294). It does not call `loadNewInstancesInLocalCache`.
- Report load: `queryContainsExternalExtractor` → whole-query `queryExecutionStrategy: "storage"` → return `returnedDomainElement` (`createReportQueryLoadExecutor.ts` L186–220). The store-backed branch (L223+) is the one that `loadNewInstancesInLocalCache`s.
- Client stash: `ReportQueryLoadService.resultByKey` (`ReportQueryLoadService.ts` L72, L95–97, L138–141).

This issue **does not add** an HTTP instance cache. Docs and a characterization test must say so, so later work cannot assume Entity-backed HTTP is cached.

### D6 / D8 / D9 / D10 / D15 / D16 — sync

**Status:** Accepted — one transformer; intent on the Endpoint.

`handleTransformer_syncExternalServiceSchema` already upserts `operations[]` and optionally `createEntity`. After this issue:

1. **Required `endpointUuid`.** Drop `DEFAULT_SPOTIFY_ENDPOINT_UUID` (`syncExternalServiceSchema.ts` L40, L475).
2. **No Spotify Entity default.** Drop `DEFAULT_GET_PLAYLIST_ENTITY_UUID` / `DEFAULT_GET_PLAYLIST_ENTITY_VERSION_UUID` and `entityDefaultsForOperation`’s `get-playlist` branch (L38–39, L378–388).
3. **No `DEFAULT_BOUNDED_PATHS`.** Conversion uses `operationSync[operationId].boundPaths`. Missing or empty for an in-scope GET → fail (L44–60 today is the Spotify list).
4. **`operationSync` on `externalService`** (new field, dual-write Endpoint Entity `3d8da4d4-…` and EntityVersion `e3c1cc69-…`, plus `EndpointExternalService` in `endpointDefinition.ts`):

```json
"operationSync": {
  "get-playlist": {
    "boundPaths": ["id", "name", "owner.id", "owner.display_name", "images.url", "images.height", "images.width", "tracks.total", "tracks.items.track.id", "tracks.items.track.name", "tracks.items.track.artists.id", "tracks.items.track.artists.name", "tracks.items.track.duration_ms"],
    "entity": { "uuid": "<only if promoting>", "name": "SpotifyPlaylist" }
  }
}
```

`entity` omitted → no Entity action. Spotify example omits it.

5. **Scope:** `transformerParams.scope` if provided; else `enabledOperations` when non-empty; else fail as today (“requires scope”). Sync does **not** write `enabledOperations`.
6. **Re-sync:** Endpoint `updateInstance` must keep `operationSync` (spread existing `externalService`, replace `operations[]` only). Per `operationSync` entity key: create or update; **all** keys, not `createdEntities[0]` (L577–581).
7. **Keys not in scope:** ignored.
8. **Invocation:** transformer runner (existing `transformerRunnerReportSection` / builder). Params: `endpointUuid`, `appModel` from `localCache.currentModelEnvironment(app, map)`, `openApiDocument` from the Endpoint instance (or params override). No new Sync button. No sync-on-save.

`openApiDocument` stays inert provenance at runtime (#267 D2).

### D7 — display only

**Status:** Accepted.

A section that fetched would bypass #267 D5 (token on the server only). Parameter bindings stay on the extractor (`playlist_id` ← `playlistId`).

### D11 / D12 — editor

**Status:** Accepted — read-only object editor; nested arrays inside it.

Precedent: `ReportInputSection` uses `TypedValueObjectEditor` with `formValueMLSchema` (no Entity), `valueObjectEditMode="create"`, `displaySubmitButton="noDisplay"`, `useActionButton={false}` (`ReportInputSection.tsx` L106–118). `ValueObjectEditMode` is only `"create" | "update"` (`ReportSectionEntityInstance.tsx` L108) — there is no `"view"` flag. Read-only is **no submit / no instance action**, not a new edit-mode enum (unless implementation finds a disable-inputs prop already on the editor; do not add a third mode in this issue unless the editor already has one).

`objectInstanceReportSection` goes through `ReportSectionEntityInstance`, which resolves `parentUuid` to an Entity `mlSchema` and fails with “report target entity not found!” when missing (L654–666). **Do not** route `apiCallReportSection` through that component. Mount `TypedValueObjectEditor` (or a thin wrapper) from `ReportSectionViewWithEditor`, schema from the Endpoint.

Spotify report sections today (enumerated): `inputReportSection`, `objectInstanceReportSection`, `jsonReportSection`. After: `inputReportSection`, `apiCallReportSection`. Drop the tracks `jsonReportSection` and the Report/Query `tracks` runtimeTransformer if nothing else reads it.

### D14 — example vs fixture

**Status:** Accepted.

| Asset | uuid | After this issue |
|---|---|---|
| Entity `SpotifyPlaylist` | `56166585-b6fd-42c6-95d3-32a80c3304f7` | **Deleted** from `miroir-test-app_deployment-spotify` |
| Report `SpotifyPlaylistReport` | `10ce3252-7840-4041-a769-9a0e2d5ee10b` | `apiCallReportSection`; keep uuid (menu + `homePageUrl`) |
| Query `spotifyGetPlaylist` | `371aed0c-05bb-4b77-8cf1-2c82407555c1` | Extractor unchanged; drop `tracks` transformer if unused |
| Endpoint `SpotifyService` | `0e5cb172-12ea-4467-8598-5889338ae454` | Add `operationSync.get-playlist.boundPaths`; no `entity` |
| Entity-backed HTTP report | new CI fixture (standalone-app tests, not the example package) | Proves D4 “no regression” |

`defaultSpotifyAppModel.entities` is `[entitySpotifyPlaylist]` today (`Spotify.ts` L49). After: `[]`. `entitySpotifyPlaylist` export goes.

---

## 1. Goals

1. **Typed playlist without an Entity** — In order to see a Spotify playlist as a structured form without defining an application Entity, as a report viewer, I can open `SpotifyPlaylistReport` and get a typed object UI driven by `get-playlist`’s `responseSchema`.
2. **Author an API section** — In order to display any enabled GET without a display Entity, as a report designer, I can add an `apiCallReportSection` that names the Endpoint, operation, and query key.
3. **Catch a wrong binding** — In order not to render the wrong schema on the wrong payload, as a report designer, I see a hard-fail message when the section’s Endpoint/operation disagree with the extractor (or the operation schema cannot be resolved).
4. **Sync schema without forcing an Entity** — In order to refresh operation Jzod from OpenAPI without creating a table-less Entity, as an application designer, I edit `operationSync` on the Endpoint and run `syncExternalServiceSchema`; I get `operations[].responseSchema` and an Entity only if I opted in.
5. **Keep Entity reports working** — In order not to break existing HTTP+Entity reports, as a report designer, I can still use `objectInstanceReportSection` with `parentUuid` pointing at an `externalDataSource.kind: "http"` Entity.

## 2. Non-goals

- HTTP instance cache / local-cache identity for API payloads (later; #208 adjacent).
- Entity `mlSchema` as a schemaReference to the operation (later).
- Dedicated Endpoint Sync button; sync-on-save (D10).
- `apiCallListReportSection`; fusion with Postgres `conceptLevel: "External"` Entities (later).
- Non-GET operations from this section; PUT `change-playlist-details` UI.
- Unbounded conversion of `oneOf`/`anyOf` (still fail without a unique bound match; #267 D3 converter rules).
- Dedicated admin UI for external services (#267 non-goal, unchanged).
- Changing #267 fetch, secrets, SSRF, or `extractorForExternalService` dispatch.

---

## 3. Current state

Programmatic inventory (2026-09-21): `spotify_model` has **7** JSON files (Entity, Endpoint, Report, SelfApplication, ApplicationModelBranch, Menu, Query). `SpotifyPlaylist.mlSchema` **equals** `operations[0].responseSchema` (same object tree). Report `section.definition` types: `inputReportSection`, `objectInstanceReportSection`, `jsonReportSection`. Report Entity and EntityVersion `reportSection` unions are **identical**, **15** members.

### 3.1 Entity is a display costume, not a fetch identity (aligned with D1, misaligned with the example)

`extractorForExternalService` / template carry `endpointUuid`, `actionType`, `parameterBindings` — no Entity uuid (`getMiroirFundamentalJzodSchema.ts` extractor schema; Query `371aed0c-…`).

`SpotifyPlaylist` (`56166585-…`): `idAttribute: "id"`, `externalDataSource: { kind: "http", endpoint: "0e5cb172-…" }`, `defaultInstanceDetailsReportUuid: "10ce3252-…"`. No `spotify_data/56166585-…` instances. Stores skip bootstrap for `kind: "http"` (#267).

Who references the Entity: Report `objectInstanceReportSection.definition.parentUuid`; package export / `defaultSpotifyAppModel.entities`; sync defaults for `get-playlist`. The Query does not. Menu and SelfApplication `homePageUrl` reference the **Report** uuid, not the Entity.

### 3.2 Fetch path never cache-fills HTTP rows (aligned with D5)

See D5 citations. Slice 5 integ reports (`externalServiceReport.integ.test.tsx` fixtures) render with `jsonReportSection` only — **no Entity**.

### 3.3 Typed instance UI requires `parentUuid` (misaligned with D1)

`objectInstanceReportSection.definition.parentUuid` is a required uuid string (no `optional`) on both Report present-model Entity `3f2baa83-…` and EntityVersion `952d2c65-…`. `ReportSectionEntityInstance` looks up that uuid in the deployment entity mapping, then `entityWithResolvedMLSchema(entity).mlSchema`. Missing Entity → “report target entity not found!”.

`reportSectionsFormSchema` for `objectInstanceReportSection` also resolves the Entity and **throws** if missing (`ReportTools.ts` L79–98). `jsonReportSection` is not handled in that switch (falls through to default throw). Form-schema generation is used by `JsonObjectEditFormDialog`, not the happy-path Spotify report render (`reportSectionsFormValue` returns `{}` for `jsonReportSection`, L268–273).

`ReportSectionViewWithEditor` switches on 15 `type` values including `grid` / `list` literals (L370, L413) matching `gridReportSection` / `listReportSection`. There is no `apiCallReportSection` arm.

Bootstrap copy in `getMiroirFundamentalJzodSchema.ts` L1578–1601 filters a **named subset** of Report context (`styledReportSection` is listed but is **not** a `reportSection` union member; `openReportSection` is a union member but **omitted** from that filter). Full context is then overlaid via `makeReferencesAbsolute`. Adding `apiCallReportSection` must land on **both** Report Entity and EntityVersion (authoritative present-model + snapshot) **and** be added to that filter list or it will rely only on the overlay — do both to match existing members that appear in the filter.

### 3.4 Unstructured JSON already works (aligned with “no Entity”, misaligned with “typed”)

`jsonReportSection` schema: `label?` + `fetchedDataReference?` only. Render: `<pre>{JSON.stringify(formik.values[fetchedDataReference], null, 2)}</pre>` (`ReportSectionViewWithEditor.tsx` L637–652).

Typed Jzod **without** an Entity already exists: `inputReportSection.definition.inputMLSchema` → `TypedValueObjectEditor`.

### 3.5 Sync is Spotify-specialized (misaligned with D6)

| Constant / behavior | Location | Problem |
|---|---|---|
| `DEFAULT_GET_PLAYLIST_ENTITY_UUID` `56166585-…` | `syncExternalServiceSchema.ts` L38, L384 | Always `createEntity` for `get-playlist` |
| `DEFAULT_GET_PLAYLIST_ENTITY_VERSION_UUID` `1a34fdf2-…` | L39 | Same; **no** EntityVersion JSON in the Spotify package |
| `DEFAULT_SPOTIFY_ENDPOINT_UUID` `0e5cb172-…` | L40, L475 | Fallback if caller omits `endpointUuid` |
| `DEFAULT_BOUNDED_PATHS["get-playlist"]` | L44–60 | Only bound list in the converter |
| `entity: createdEntities[0]` | L577–581 | Drops additional entities |
| Transformer params schema | TransformerDefinition `c615ff0e-…` | `openApiDocument`, `appModel`, `scope` only — no `endpointUuid` / `operationSync` on the transformer JSON (params are a side channel today) |
| `enabledOperations` | Endpoint instance + `ExternalServiceClient.ts` L680 | Runtime allowlist, **not** a sync input |

`convertSchema` throws on `oneOf`/`anyOf` unless a bound tree selects exactly one variant (L229–245). Unbounded `PlaylistObject.tracks.items[].track` is `oneOf` Track/Episode in the excerpt OpenAPI string on the Endpoint. Removing hardcoded bounds **without** `operationSync.boundPaths` makes `get-playlist` sync fail. That is intended (D8).

### 3.6 Postgres “external” is not this section (aligned with non-goal)

`SchemaDetails` (`a72bb361-…`) uses `objectInstanceReportSection` + `objectListReportSection` with Entity `parentUuid`s (`cbc94d62-…` Schema, `35961086-…` Table). Those Entities have `conceptLevel: "External"` and SQL `externalDataSource`. They are **row collections in Postgres**, cached as instances. Not HTTP `contextResults`. Do not pretend `apiCallReportSection` replaces them in this issue.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| `extractorTemplateForExternalService` + server query intercept | #267; `DomainController.resolveExtractorForExternalServiceInBoxedQuery`; Query `371aed0c-…` |
| `operations[].responseSchema` (bounded Jzod) | Endpoint `0e5cb172-…`; `lenientValidateJzod` in `ExternalServiceClient` |
| `convertSchema` / `responseSchemaForOperation` / `collectParameters` | `syncExternalServiceSchema.ts` |
| `handleTransformer_syncExternalServiceSchema` | TransformerDefinition `c615ff0e-…` |
| `getExternalService` / `EndpointExternalService` | `endpointDefinition.ts` |
| `queryContainsExternalExtractor` + async report load | `queryContainsExternalExtractor.ts`; `createReportQueryLoadExecutor.ts` L186–220 |
| `ReportQueryLoadService.getResult` | stash for `reportData` |
| `TypedValueObjectEditor` + `inputReportSection` no-submit pattern | `ReportInputSection.tsx` |
| Report `reportSection` union (15 members) | Entity `3f2baa83-…` + EntityVersion `952d2c65-…` |
| Spotify report uuid (menu / home) | `10ce3252-…` |
| `inputReportSection` `urlParamFields: ["playlistId"]` | same Report; keep |
| Fake Spotify server + `spotifyApp` / `externalServiceReport` integ | standalone-app tests |

---

## 5. Target design (mechanisms)

### 5.1 Render path

1. Report query unchanged: `extractorTemplateForExternalService` → POST `/query` → `contextResults.playlist`.
2. `reportSectionsFormValue` for `apiCallReportSection`: seed Formik at the section path from `reportData[fetchedDataReference]` (same as instance sections with a reference; `ReportTools.ts` L180–184).
3. `ReportSectionViewWithEditor` new arm: resolve schema (D3/D13); on success `TypedValueObjectEditor` with that Jzod; on failure error banner (full message, no dump of the payload as a substitute UI).
4. Do not call `ReportSectionEntityInstance`.

### 5.2 Schema dual-write

| Asset | Change |
|---|---|
| Report Entity `3f2baa83-…` context | add `apiCallReportSection`; add union member |
| Report EntityVersion `952d2c65-…` | same |
| `getMiroirFundamentalJzodSchema.ts` filter list L1582–1601 | add `"apiCallReportSection"` |
| Endpoint Entity `3d8da4d4-…` `externalService` | add `operationSync` (optional record) |
| Endpoint EntityVersion `e3c1cc69-…` | same |
| `EndpointExternalService` TS type | add `operationSync?` |
| TransformerDefinition `c615ff0e-…` | document `endpointUuid` required; `scope` optional when `enabledOperations` non-empty; read `operationSync` from Endpoint |

Then `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.

### 5.3 Mismatch check (normative)

Inputs: section `{ endpointUuid, operationId, fetchedDataReference }`, report query templates/extractors, current model endpoints.

1. Let `ex = extractors[fetchedDataReference] ?? extractorTemplates[fetchedDataReference]`.
2. If missing or type not external-service extractor → fail `ApiCallReportSectionBindingMismatch` (name TBD; stable `errorType` or UI string is enough if not an `Action2Error`).
3. If `ex.endpointUuid !== endpointUuid` or `ex.actionType !== operationId` → fail, message includes both pairs.
4. If Endpoint missing or `operations` has no `operationId` → fail `ApiCallReportSectionSchemaNotFound`.
5. Else schema = that `responseSchema`.

### 5.4 Docs

State in `docs/guides/core-concepts.md` (or the reports/external-services note if one exists after #267): HTTP GET results used by reports live in the query context stash, not the Entity instance cache, whether or not an Entity exists.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md), following `miroir-analysis-to-tdd-plan` (vertical slices; Slice 0 characterizes current Spotify+sync contracts).
