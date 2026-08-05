# Issue #227 — Analysis: Broaden Application Version freeze beyond Entities

Follow-up to **#225** (Versioning UI) and **#216** (Entity-only freeze).

GitHub issue: https://github.com/miroir-framework/miroir/issues/230

Related:

- #216 ADR **D4** — Entities only for v1; deferred: Report, Query, Menu, Endpoint, Transformer, …
- #225 — operator freeze Runner + Versioning report (ships against Entity-only freeze)
- `code-helpers/features/216-FEATURE-application-versions-and-freeze/analysis.md`

## Status

**In progress** — tracer slice **QueryVersion** complete; remaining eight element types pending.

## Problem

`freezeApplicationVersion` (#216) snapshots **live Entities** into historical **EntityVersion** rows and links them to a new **SelfApplicationVersion** via **ApplicationVersionCrossEntityVersion**. Present-model **Queries**, **Reports**, **Menus**, **Endpoints**, **Runners**, **Themes**, **MlSchemas**, **MiroirTests**, and **Transformer definitions** are **not** captured. Restoring or diffing a release therefore cannot reconstruct the full model island the operator saw at freeze time.

## Goal

Extend Application Version contents so a freeze captures **all versioned model elements**, using the same pattern as Entity:

| Present model (live) | Historical snapshot at freeze | Cross to SAV |
|---|---|---|
| `Entity` | `EntityVersion` | `ApplicationVersionCrossEntityVersion` ✅ |
| `Query` (`entityQueryVersion`) | `QueryVersion` | `ApplicationVersionCrossQueryVersion` | ✅ tracer |
| `Report` | `ReportVersion` | `ApplicationVersionCrossReportVersion` |
| `Menu` | `MenuVersion` | `ApplicationVersionCrossMenuVersion` |
| `EndpointDefinition` | `EndpointVersion` | `ApplicationVersionCrossEndpointVersion` |
| `Runner` | `RunnerVersion` | `ApplicationVersionCrossRunnerVersion` |
| `StoredMiroirTheme` | `ThemeVersion` | `ApplicationVersionCrossThemeVersion` |
| `MlSchema` | `MlSchemaVersion` | `ApplicationVersionCrossMlSchemaVersion` |
| `MiroirTestDefinition` | `MiroirTestVersion` | `ApplicationVersionCrossMiroirTestVersion` |
| Transformer (library / composite) | `TransformerDefinitionVersion` | `ApplicationVersionCrossTransformerDefinitionVersion` |

Naming note: the present-model Query Entity is exported as `entityQueryVersion` (uuid `e4320b9e-…`) but instances are **live Queries** in `MetaModel.storedQueries`. Historical rows use a **separate** Entity type also named **QueryVersion** (uuid `7f3a8b2c-…`) with `queryUuid` → live Query.

## Accepted pattern (per element type)

Mirror #216 Entity freeze:

1. **Snapshot** — deep-copy present-model instances; mint **new UUIDs**; set stable FK (`queryUuid`, `reportUuid`, …) to live instance.
2. **Cross rows** — one per snapshot, linking new SAV uuid → historical snapshot uuid.
3. **Persist** — same `createInstance` batch path as EntityVersion; section from `getApplicationSection` / dedicated write-section helper (#222).
4. **Plan** — pure `buildFreezeApplicationVersionPlan` extension; `planFreezeApplicationVersionFromMetaModel` reads present collection from `MetaModel`.
5. **Diff (Option A)** — deferred per element until WP2 consumers need it; Entity `modelCUDMigration` stays unchanged in first slices.

Out of scope for this epic’s first slices:

- UI lists on ApplicationVersionDetails for every element type (add incrementally).
- Option B accrued Action log.
- Data migrations (#215).

## MetaModel / deployment impact

Each historical type needs:

- Entity JSON under `miroir_model/16dbfe28-…/`
- EntityVersion bootstrap row under `miroir_data/54b9c72f-…/`
- Cross Entity JSON + bootstrap row
- Registration in `miroir-test-app_deployment-miroir/src/Model.ts`
- Freeze module constants + persist parent entity uuid

`MetaModel` generated type (`miroirFundamentalType.ts`) gains optional collections later (`queryVersions`, `applicationVersionCrossQueryVersion`, …) when Jzod meta-schema is updated; tracer slice uses local TypeScript types in `applicationVersionFreeze.ts`.

## Tracer slice: QueryVersion

**Why Query first**

- Library ships real `storedQueries` (good integration fixture).
- Present Query Entity and bootstrap EntityVersion row already exist (`entityQueryVersion`, `entityVersionQueryVersionV1`).
- Query body (`definition`) is self-contained JSON — snapshot is a straight deep copy.
- Smaller surface than Report (sections/UI) or Endpoint (action payloads).

**Snapshot fields** (from live Query instance):

- `name`, `description?`, `defaultLabel?`, `definition` (deep copy)
- `queryUuid` → live Query `uuid`
- new `uuid`, `parentUuid` → historical QueryVersion Entity

**Bootstrap uuids (this slice)**

| Concept | UUID |
|---|---|
| Historical QueryVersion Entity | `7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c` |
| ApplicationVersionCrossQueryVersion Entity | `9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d` |
| Present Query Entity (existing) | `e4320b9e-ab45-4abe-85d8-359604b3c62f` |

## Rollout order (suggested)

1. **QueryVersion** — tracer (this issue)
2. **ReportVersion** — high visibility; complex `sections`
3. **MenuVersion** — tree structure
4. **EndpointVersion** — action definitions
5. **RunnerVersion**, **ThemeVersion**, **MlSchemaVersion**, **MiroirTestVersion**
6. **TransformerDefinitionVersion** — mixed library + composite transformers

Each step: unit tests on snapshot/plan, optional integ via `freezeApplicationVersion` Runner, then ApplicationVersionDetails section when needed.

## Risks

| Risk | Mitigation |
|---|---|
| Metamodel proliferation (9 Cross entities) | Accept for v1 clarity; generalize Cross schema later if painful |
| Large JSON entity definitions | Use `type: "any"` for heavy `definition` fields in historical Entity mlSchema |
| Bootstrap queries frozen by mistake | Exclude metamodel Query instances by parent/concept filters if needed |
| MetaModel type drift | Local freeze types until Jzod regeneration is batched |

## Success criteria (epic)

- [ ] Freeze plan includes snapshots + Cross for all nine element types
- [ ] Persist path writes historical rows + Cross in correct application section
- [ ] Unit + integ tests per type (or shared parameterized suite)
- [ ] ApplicationVersionDetails can list linked historical rows (incremental)

## Success criteria (QueryVersion tracer)

- [x] Analysis + TDD plan
- [x] `snapshotQueriesAsHistoricalQueryVersions` with new UUIDs + `queryUuid`
- [x] Plan includes `queryVersions` + `crossQueryVersions`
- [x] DomainController persists QueryVersion + Cross batches
- [x] Unit tests (snapshot + plan)
- [x] Integ tests (QueryVersion persist + isolation)
- [x] ApplicationVersionDetails lists linked QueryVersions (report section)
