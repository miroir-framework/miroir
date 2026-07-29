# Issue #221 — Analysis: Decouple ReportPage / JzodElementEditor from EntityVersion for Entity present-model fields

GitHub issue: https://github.com/miroir-framework/miroir/issues/221

**Document role:** inventory of view-layer uses of `EntityVersion` / `entityVersion` / `entityDefinition*` that only exist to bear attributes now on live `Entity`, grouped by the **simplest migration scenario** that covers each group. Implementation follow-ups should pick one group at a time.

## Status and sequencing

| Step | Issue | Role |
|------|-------|------|
| ✅ | #217 | Entity = authoritative present model; snapshot concept → `EntityVersion` |
| → | **#220** | Core / store / Action EntityDefinition debt (blocks #216 freeze path) |
| → | **#221 (this)** | View tree (ReportPage ↓, JzodElementEditor ↓) stops using EntityVersion for live present-model fields |
| blocked until #220 “reasonable” | #216 | Freeze → historical EntityVersions (must not be live schema source) |

Parents / related:

- Issue: https://github.com/miroir-framework/miroir/issues/221
- Parent feature: [#216](https://github.com/miroir-framework/miroir/issues/216)
- Sibling tech debt: [#220](https://github.com/miroir-framework/miroir/issues/220) — owns Action/store vocabulary; this issue owns the UI slice #220 deferred
- TDD plan (1 slice per group): [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md)
- Present-model field list: `ENTITY_PRESENT_MODEL_DEFINITION_FIELDS` in `packages/miroir-core/src/1_core/entityPresentModel.ts`

### In-scope present-model attributes (deprecated on EntityVersion for live UI)

Primary (issue statement):

| Attribute | Typical live UI use |
|-----------|---------------------|
| `mlSchema` | Form schema, columns, FK walk, delete cascade, diagrams |
| `idAttribute` | PK navigation / instance identity in grids |
| `defaultInstanceDetailsReportUuid` | “Open details report” navigation |
| `externalDataSource` | (not used under ReportPage/JzodElementEditor today) |
| `cache` | AI promote path only (adjacent; not ReportPage core) |

Companions used the same way in this tree:

| Attribute | Typical live UI use |
|-----------|---------------------|
| `viewAttributes` | Column filter in grid column defs |
| `display` | Fold paths in instance details section |

**Policy:** live Report / instance UX must read these from `Entity`. Reading them from EntityVersion (or dual-read “definition” carriers typed as EntityVersion) is **deprecated**. True historical snapshot viewing remains EntityVersion and is out of scope unless a call site misuses snapshots as live schema.

---

## 1. Scope map (what is / isn’t coupled)

```
ReportPage                          — mount only; no Entity/EV
  └─ ReportDisplay                  — mapping.entityVersions (often mis-destructured as entityDefinitions)
       └─ ReportViewWithEditor
            └─ ReportSectionViewWithEditor
                 ├─ ReportSectionListDisplay → JsonObjectEdit/DeleteFormDialog, EntityInstanceGrid
                 ├─ ReportSectionEntityInstance → TypedValueObjectEditor → JzodElementEditor*
                 └─ ModelDiagramReportSectionView → MermaidClassDiagram
```

| Surface | Coupling today |
|---------|----------------|
| `ReportPage.tsx` | None |
| `JzodElementEditor*` + children | **None** — schema via Formik / `typeCheckKeyMap` / raw `JzodObject` |
| Dialogs, grids, FK helpers, column defs, diagram section | **High** — prop names, types, dual-read carriers |
| `miroir-react` | No ReportPage/JzodElementEditor |
| `miroir-sandbox` ReportPage | Stub |

Shared funnels (prefer migrating these once per group rather than per call site):

| Helper | Path | Role |
|--------|------|------|
| `resolvePresentEntityFromModel` | `miroir-core/.../entityPresentModel.ts` | Live Entity by uuid; expects `entityVersions` key (not `entityDefinitions`) |
| `entityMLSchema` / `entityWithResolvedMLSchema` | `miroir-core/.../EntityVersion.ts` | Flatten Entity.mlSchema |
| `getEntityPrimaryKeyAttributes` | `miroir-core/.../EntityPrimaryKey.ts` | Reads `idAttribute` from any carrier |
| `analyzeForeignKeyAttributes` | `standalone-app/.../foreignKeyAttributeAnalyzer.ts` | Walks `.mlSchema.definition`; Entity \| EntityVersion carrier |
| `PresentModelSchemaCarrier` | `JsonObjectEditFormDialog.tsx`, `scripts.ts` | Dual-shape carrier (`uuid` vs `entityUuid`) |
| `presentModelSource` | `EntityInstanceGrid.tsx` | Prefer `currentEntity` if `.mlSchema`, else `currentEntityDefinition` |
| `getMDataGridColumnDefinitionsFromEntityDefinition` | `getColumnDefinitionsFromEntityAttributes.ts` | `mlSchema` + `viewAttributes`; param still `entityVersion` |
| Diagram projection | `miroir-diagram-class` + `ModelDiagramReportSectionView` | Entity → EV-shaped carriers; APIs still `entityDefinitions` |

---

## 2. Migration groups (simplest scenario first)

Groups are ordered by **migration simplicity**. Each group shares one scenario: do that scenario once for all listed uses.

### Group A — Rename only (Entity / `JzodObject` already in hand)

**Scenario:** Change prop / parameter / local names and types from EntityVersion / `entityDefinition*` vocabulary to Entity / present-model vocabulary. **No parent plumbing change**; values already come from Entity (or are already a bare `JzodObject` taken from `Entity.mlSchema`).

| Site | Attribute(s) | Notes |
|------|--------------|-------|
| `JsonObjectDeleteFormDialog` | schema as `entityDefinitionJzodSchema: JzodObject` | Rename → `mlSchema` / `entityMlSchema` |
| `JsonObjectEditFormDialog` (schema prop) | `entityDefinitionJzodSchema` | Same; already fed `Entity.mlSchema` |
| `getColumnDefinitionsFromEntityAttributes.ts` | `mlSchema`, `viewAttributes` | Rename fn/param `entityVersion` / `…FromEntityDefinition` → Entity |
| `EntityInstanceCellRenderer` | logs `cellRendererParams.entityVersion` | Naming in cell params only |
| `ValueObjectGridInterface` | Zod `entityVersion.optional()` in cell params | Rename → present Entity / drop if unused |
| `ReportSectionEntityInstance` | `mlSchema`, `display` | Already resolves Entity; clean debug labels / unused EV imports |
| `EntityInstanceSelectorPanel` | `currentReportTargetEntity?.mlSchema` | Already Entity |
| `InlineReportEditor` | — | Unused `EntityVersion` import |
| `ReportTools.reportSectionsFormSchema` | `mlSchema` via Entity | Already Entity resolve; naming only (also see Group C key fix) |

**Validation:** Typecheck + ReportPage / dialog / grid tests; grep view tree for renamed symbols → zero on live path.

**AFK:** yes. Low behavior risk.

---

### Group B — Parent must pass `Entity` (stop stuffing Entity into `entityVersion` props)

**Scenario:** Call sites already have (or can resolve) a live Entity but pass it as `entityVersion={Entity}` / omit `entity`. Collapse APIs to `entity: Entity` (+ optional bare `mlSchema` if needed). Fix Entity identity on carriers (`uuid`, not only `entityUuid`).

| Site | Attribute(s) | Notes |
|------|--------------|-------|
| `ReportSectionListDisplay` → edit dialog | full Entity / `mlSchema` | Passes `entityVersion={Entity}`; rename at boundary |
| `EntityInstanceGrid` → edit dialog | `mlSchema`, later `defaultInstanceDetailsReportUuid` | `entityVersion={presentModelSource}`; ensure `entity` prop set |
| `JsonObjectEditFormDialog` API | `defaultInstanceDetailsReportUuid` on Entity | Collapse dual props (`entity` + `entityVersion`) → `entity: Entity` |
| `scripts.ts` `deleteCascade` | `mlSchema` (reverse FK walk) | Param `entityVersion: PresentModelSchemaCarrier` + list `entityDefinitions`; rename; recursive find must accept Entity `uuid` |
| `GlideDataGridComponent` | `currentEntityDefinition` | Typed EV-like; **unused in body** after destructure — pass Entity or delete |
| `ModelDiagramReportSectionView` | `mlSchema` | Prefer `entities`; stop casting to `EntityVersion[]` for Mermaid |
| `ModelDiagramPage` | diagram input | Prefer entities-only when complete; drop EV fallback list when unused |
| Mermaid / `entitiesToMermaidClassDiagram` | `Entity.mlSchema` | Done (#221) — Entity present-model input |

**Validation:** Open list report → edit/create instance → dialog shows schema; delete cascade still finds reverse FKs on Entity-only model; diagram renders from `entities`.

**AFK:** yes if parents already hold Entity; HITL only if diagram metamodel field `entityDefinitions` must stay for transformer output shape (#220 Case 8 adjacency).

---

### Group C — Fix resolve / mapping keys (correctness before renames)

**Scenario:** Mapping property is already `entityVersions`, but UI destructures or passes **`entityDefinitions`** into `resolvePresentEntityFromModel`, which only reads `entityVersions`. EV fallback is a no-op; live resolve depends entirely on `entities`. Fix keys/aliases so resolution is correct and dual-read can be removed later.

| Site | Attribute(s) | Notes |
|------|--------------|-------|
| `ReportDisplay` / mapping destructure pattern | whole present model | `entityDefinitions` often `undefined` at runtime |
| `ReportViewWithEditor` | Report Entity resolve | `entityDefinitions: miroirMapping.model.entityVersions` → use `entityVersions` |
| `ReportSectionListDisplay` | parent Entity resolve | Same wrong key into `resolvePresentEntityFromModel` |
| `ReportTools` objectInstance case | `mlSchema` | Same |
| Context type name | — | `DeploymentUuidToReportsEntities` / `deploymentUuidToReportsEntitiesMapping` — rename when touching UI |

**Validation:** With incomplete Entity (no mlSchema) and a matching EntityVersion row, resolve still finds fallback **or** (preferred post-#221) incompleteness fails loudly once Group D removes fallback. Add/adjust a focused test for the key.

**AFK:** yes. Do early — unblocks honest dual-read removal.

---

### Group D — Remove dual-read fallbacks (Entity-only after Groups A–C)

**Scenario:** Temporary `Entity ?? EntityVersion` / carrier unions stay until parents always pass Entity with `mlSchema`. Then delete the EV branch.

| Site | Attribute(s) | Notes |
|------|--------------|-------|
| `EntityInstanceGrid.presentModelSource` | `mlSchema`, `idAttribute`, `defaultInstanceDetailsReportUuid`, `conceptLevel` | Prefer `currentEntity` else `currentEntityDefinition` — delete EV branch; make `currentEntity` required for EntityInstance |
| `EntityInstanceGridInterface` | Zod `currentEntityDefinition: entityVersion.optional()` | Remove optional EV |
| `foreignKeyAttributeAnalyzer` `ForeignKeySchemaCarrier` | `mlSchema` | Accept Entity only (or keep EV until MetaModel redundant rows gone — EOL comment) |
| `scripts.ts` deleteCascade schema list | `mlSchema` | Prefer `entities` only |
| `ModelDiagramReportSectionView` | `mlSchema` | Entities first, else report-section `entityDefinitions` transformer output — quarantine metamodel field as debt |
| AI paths (`AiActionsProvider`, `AiEntityProposalForm`) | `mlSchema`, `defaultInstanceDetailsReportUuid`, `viewAttributes`, `cache`, `idAttribute` | Adjacent dual-write; **optional** in this issue — EOL or follow-up |

**Validation:** Report list/details/FK nav with Entity-complete fixtures; no `currentEntityDefinition` in EntityInstance props; grep dual-read in grid → zero.

**AFK:** after Groups B+C; HITL if any deployment still ships incomplete Entity without Entity island.

---

### Group E — Legitimate EntityVersion (leave alone)

**Scenario:** No migration for #221. Historical / freeze / persistence layout.

| Site | Notes |
|------|-------|
| #216 freeze / Cross / Application Version history | Snapshots are EntityVersion by design |
| Asset folder `54b9c72f-…` EntityVersion rows | Persistence layout |
| Evolution-trace / Action op strings | Owned by #220 / WP1 — not view props |
| Bootstrapped Report form schema asset imported as `entityDefinitionReport` | Naming legacy; content is Report form `mlSchema`, not “present fields on EV for live Entity” — optional rename only (Group A-like) |

No ReportPage / JzodElementEditor call site is clearly “viewing a frozen historical EntityVersion snapshot” as live schema. If product later adds version-history UI, that is a new feature path, not a Group D leftover.

---

### Group F — Out of tree / non-goals

| Site | Notes |
|------|-------|
| `JzodElementEditor` internals | Already EntityVersion-free — do not “migrate” |
| `ReportPage` itself | No coupling |
| Sandbox ReportPage stub | No work |
| Importers / runners commented dual-write | Outside ReportPage hot path; #220 or follow-up |
| Exhaustive string purge of `EntityDefinition` | #220 / #213 |

---

## 3. Attribute × group matrix

| Attribute | Dominant groups | Primary consumers |
|-----------|-----------------|-------------------|
| `mlSchema` | A, B, C, D | Dialogs, columns, FK analyzer, deleteCascade, grids, diagrams |
| `idAttribute` | D → A | `EntityInstanceGrid` via PK helpers on `presentModelSource` |
| `defaultInstanceDetailsReportUuid` | B, D | Grid navigation; dialog default details report |
| `viewAttributes` | A | Column definitions helper |
| `display` | A | `ReportSectionEntityInstance` fold init |
| `cache` | D (AI only) / F | Not ReportPage core |
| `externalDataSource` | F | No hits under scoped tree |

---

## 4. Suggested implementation order

1. **Group C** — fix `entityVersions` keys into `resolvePresentEntityFromModel` (correctness).
2. **Group A** — renames where Entity/`JzodObject` already flows.
3. **Group B** — dialog/grid/diagram APIs take `entity: Entity`; fix `deleteCascade` identity.
4. **Group D** — delete dual-read once parents are Entity-complete; quarantine AI/diagram metamodel leftovers with EOL.
5. **Do not** migrate Group E/F under this issue.

Thin vertical slices preferred (e.g. “edit dialog Entity-only” then “grid presentModelSource Entity-only” then “diagram Entity-only”).

---

## 5. Acceptance checklist (maps to issue)

- [x] Live ReportPage tree resolves listed present-model fields from Entity.
- [x] Live props/types no longer require EntityVersion for those fields.
- [x] Edit/delete dialogs + EntityInstance grid Entity-only for schema/PK/details-report.
- [x] Wrong `entityDefinitions` resolve keys fixed.
- [x] JzodElementEditor remains free of EntityVersion coupling.
- [x] Historical EntityVersion (#216) untouched as live schema source.

Dropped from issue (obsolete): dual-read EOL tracking; dedicated ReportPage integ / Cross-mapping AC.

---

## 6. References

- Issue #221: https://github.com/miroir-framework/miroir/issues/221
- Parent #216 analysis: [`../216-FEATURE-application-versions-and-freeze/analysis.md`](../216-FEATURE-application-versions-and-freeze/analysis.md)
- Sibling #220 analysis: [`../220-REFACTOR-entitydefinition-tech-debt/analysis.md`](../220-REFACTOR-entitydefinition-tech-debt/analysis.md)
- #217 analysis: [`../217-/analysis.md`](../217-/analysis.md)
- Present-model helpers: `packages/miroir-core/src/1_core/entityPresentModel.ts`
