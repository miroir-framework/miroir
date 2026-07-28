# Issue #221 — TDD Implementation Plan

## Scope

Decouple the **ReportPage ↓** and **JzodElementEditor ↓** view trees from `EntityVersion` / `entityVersion` / `entityDefinition*` when those only carried **Entity present-model** fields (`mlSchema`, `idAttribute`, `defaultInstanceDetailsReportUuid`, `externalDataSource`, `cache`, plus companions `viewAttributes` / `display`).

This plan turns [`./analysis.md`](./analysis.md) **Groups A–F** into **one vertical TDD slice per group**. **Done means code + tests**, not docs alone.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/221
- Analysis: [`./analysis.md`](./analysis.md)
- Sibling #220: [`../220-REFACTOR-entitydefinition-tech-debt/tdd-implementation-plan.md`](../220-REFACTOR-entitydefinition-tech-debt/tdd-implementation-plan.md)
- Parent #216: [`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)

### Slice ↔ group map (implementation order)

| Slice | Analysis group | Kind | Status |
|-------|----------------|------|--------|
| 1 | **C** — Fix resolve / mapping keys | Migrate | ✅ DONE |
| 2 | **A** — Rename only | Migrate | ✅ DONE |
| 3 | **B** — Parents pass `Entity` | Migrate | ⬜ |
| 4 | **D** — Remove dual-read fallbacks | Migrate | ⬜ |
| 5 | **E** — Legitimate EntityVersion | Characterization lock (no migrate) | ⬜ |
| 6 | **F** — Out of tree / non-goals | Characterization lock (no migrate) | ⬜ |

Slices **5–6** are intentional non-migrations: they lock what #221 must **not** change and what is already clean.

---

## Locked defaults

| Item | Choice |
|------|--------|
| Live schema source | **Entity** only for Report/instance UX |
| EntityVersion in this tree | Historical / freeze only (#216); not live `mlSchema` carrier |
| `resolvePresentEntityFromModel` | Call sites pass `entityVersions` (never `entityDefinitions` as the key) |
| Dual-read (`Entity ?? EntityVersion`) | Allowed only until Slice 4; then delete or EOL-quarantine |
| AI create-entity dual-write | Optional under Slice 4; EOL comment OK if not removed |
| Diagram metamodel field `definition.entityDefinitions` | Quarantine / EOL in Slice 4; full schema rename stays #220/#213 |
| Deprecated TS alias `EntityDefinition = EntityVersion` | Keep generated alias; view code prefers `Entity` / `EntityVersion` correctly |

---

## Target public interfaces (view)

1. **Dialogs**
   - `JsonObjectEditFormDialog` / `JsonObjectDeleteFormDialog`: `entity: Entity` + `mlSchema: JzodObject` (or schema derived from `entity.mlSchema`). No `entityVersion` / `entityDefinitionJzodSchema` props.
2. **Grid**
   - `EntityInstanceGrid` (EntityInstance mode): required `currentEntity: Entity` with `mlSchema`; no `currentEntityDefinition` / `presentModelSource` EV fallback.
3. **Columns**
   - `getMDataGridColumnDefinitionsFromEntity(entity: Entity | Pick<Entity,"mlSchema"|"viewAttributes">)` (rename from `…FromEntityDefinition` / `entityVersion` param).
4. **Resolve**
   - Report subtree call sites: `resolvePresentEntityFromModel({ entities, entityVersions }, uuid)`.
5. **Diagram**
   - Prefer `entities` / `presentEntitiesAsDiagramCarriers`; stop casting live Entity to `EntityVersion[]` for Mermaid.
6. **deleteCascade**
   - Params named for Entity / `entities`; identity via `uuid` (and optional legacy `entityUuid` only until Slice 4).

`JzodElementEditor*` stays schema-only (`JzodObject` / Formik) — no Entity/EntityVersion props (Slice 6 lock).

---

## Test execution conventions

| Purpose | Command |
|---------|---------|
| Standalone view unit | `npm run testByFile -w miroir-standalone-app -- <pattern>` |
| Core present-model | `npm run testByFile -w miroir-core -- entityPresentModel` |
| Diagram package | `npm run testByFile -w miroir-diagram-class -- entityDefinitionsToMermaid` |
| ReportPage integ (when needed) | `npm run testByFile -w miroir-standalone-app -- ReportPage.integ` |
| Type-check | `npx tsc --noEmit --skipLibCheck` |

Legend:

- **RED**: new/stricter test fails first
- **GREEN**: minimal code to pass
- **NON-REGRESSION**: related existing suites stay green

Prefer behavior through public helpers / component props over mocking Redux. Prefer extending existing `foreignKeyAttributeAnalyzer`, diagram, and `entityPresentModel.217.*` suites over inventing parallel harnesses.

---

## Slice 1 — Group C: Fix resolve / mapping keys

### Goal

Report subtree passes the correct MetaModel key (`entityVersions`) into `resolvePresentEntityFromModel`, so EntityVersion fallback can work until Slice 4 and live resolve is honest.

### 1.1 RED → GREEN — Wrong key is a no-op (characterization → fix)

**RED** (extend core present-model tests, e.g. under `packages/miroir-core/tests/1_core/` as `221.phase1.resolveKeys.unit.test.ts` or extend `entityPresentModel.217.phase8`):

- Given incomplete Entity (no `mlSchema`) + matching EntityVersion with `mlSchema`.
- `resolvePresentEntityFromModel({ entities, entityVersions }, uuid)` returns enriched present model (existing contract).
- Assert that passing **only** `{ entities, entityDefinitions: versions }` (wrong key, no `entityVersions`) does **not** see the versions array — documents today’s bug; after GREEN, production call sites must not use that shape.

**GREEN** (view call sites only; do not broaden core API to accept `entityDefinitions`):

- `ReportViewWithEditor.tsx` — `entityVersions: miroirMapping.model.entityVersions` (drop `entityDefinitions:` alias key).
- `ReportSectionListDisplay.tsx` — same for `resolvePresentEntityFromModel`.
- `ReportTools.ts` objectInstance path — same.
- Fix mapping destructure patterns that bind `entityDefinitions` from a structure that only has `entityVersions` (alias locally if needed: `const entityVersions = mapping.entityVersions`).

Optional rename of context type `DeploymentUuidToReportsEntitiesDefinitions*` can wait for Slice 2/3 if it thrashs; key correctness is the Slice 1 exit.

### Validation (Slice 1)

- [x] New/updated unit test documents wrong-key no-op and correct-key resolve.
- [x] Grep Report subtree: `resolvePresentEntityFromModel` call sites use `entityVersions` key only.
- [x] `npm run testByFile -w miroir-core -- 221.phase1` (or extended entityPresentModel pattern)
- [x] Mapping destructures bind `entityVersions` (ReportDisplay, List/Instance/ViewWithEditor sections)
- [ ] `npx tsc --noEmit --skipLibCheck` on touched packages

### Realization (Slice 1)

- Core: `packages/miroir-core/tests/1_core/221-view-decouple-entityversion/221.phase1.resolveKeys.unit.test.ts`
- View contract: `packages/miroir-standalone-app/tests/4_view/221-view-decouple-entityversion/221.phase1.resolveKeys.unit.test.ts`
- Fixed resolve keys: `ReportViewWithEditor`, `ReportTools`, `ReportSectionListDisplay`
- Fixed mapping destructures: `ReportDisplay`, `ReportSectionListDisplay`, `ReportSectionEntityInstance`, `ReportSectionViewWithEditor`
- Left for later slices: `deleteCascade` param `entityDefinitions`, diagram metamodel `definition.entityDefinitions`

### NON-REGRESSION

```
npm run testByFile -w miroir-core -- entityPresentModel.217
```

---

## Slice 2 — Group A: Rename only (Entity / `JzodObject` already in hand)

### Goal

Rename props/params/locals that already carry Entity or bare `JzodObject` from EntityVersion / `entityDefinition*` vocabulary to present-model vocabulary. **No parent plumbing change.**

### 2.1 RED → GREEN — Column helper + dialog schema prop names

**RED:**

- Unit test (new `packages/miroir-standalone-app/tests/4_view/221.phase2.rename.unit.test.ts` or extend column/FK tests) that:
  - Calls the **target** column helper name `getMDataGridColumnDefinitionsFromEntity` with an Entity-shaped `{ mlSchema, viewAttributes }` and asserts columns derived from `mlSchema` / filtered by `viewAttributes`.
  - Fails while only `…FromEntityDefinition` / `entityVersion` param exist.
- Optionally: source/contract assert that `JsonObjectEditFormDialog` / `JsonObjectDeleteFormDialog` prop type includes `mlSchema` (or `entityMlSchema`) and **not** `entityDefinitionJzodSchema`.

**GREEN:**

| Site | Change |
|------|--------|
| `getColumnDefinitionsFromEntityAttributes.ts` | Rename fn + param `entityVersion` → Entity / `entity` |
| `JsonObjectEditFormDialog` / `JsonObjectDeleteFormDialog` | `entityDefinitionJzodSchema` → `mlSchema` (or `entityMlSchema`); update call sites that only rename the prop |
| `ValueObjectGridInterface` / cell params | `entityVersion` → present Entity name or drop if unused |
| `EntityInstanceCellRenderer` | Log label / param name |
| `ReportSectionEntityInstance` / `ReportTools` / `EntityInstanceSelectorPanel` | Debug labels, unused `EntityVersion` imports (`InlineReportEditor`) |

Keep deprecated aliases **only** if needed for one commit compile; delete within the same slice.

### Validation (Slice 2)

- [x] Column helper test red→green under new name.
- [x] Grep `4_view`: no `entityDefinitionJzodSchema`; no `getMDataGridColumnDefinitionsFromEntityDefinition`.
- [x] `npm run testByFile -w miroir-standalone-app -- 221.phase2` (and adaptiveColumnWidths / existing column tests if they import the helper)
- [ ] `npx tsc --noEmit --skipLibCheck` on touched packages

### Realization (Slice 2)

- Test: `packages/miroir-standalone-app/tests/4_view/221-view-decouple-entityversion/221.phase2.rename.unit.test.ts`
- Renamed `getMDataGridColumnDefinitionsFromEntityDefinition` → `getMDataGridColumnDefinitionsFromEntity`; param `entityVersion` → `entity`
- Dialogs: `entityDefinitionJzodSchema` → `mlSchema` (edit + delete) + call sites
- Cell params: `entityVersion` → `entity` (`ValueObjectGridInterface`, column helper, cell renderer log)
- Dropped unused `EntityVersion` imports (`InlineReportEditor`, `ReportTools`)
- Incidental: fixed pre-existing typo `__fk_aggregatery-uuid` → `__fk_country-uuid` in FK analyzer unit test
- Left for Slice 3: dialog/grid `entityVersion={Entity}` prop plumbing, `deleteCascade` param names

### NON-REGRESSION

```
npm run testByFile -w miroir-standalone-app -- foreignKeyAttributeAnalyzer
npm run testByFile -w miroir-standalone-app -- JzodElementEditor
```

---

## Slice 3 — Group B: Parents pass `Entity`

### Goal

Collapse APIs that still declare `entityVersion` while parents pass a live Entity. Fix `deleteCascade` identity for Entity carriers (`uuid`). Prefer Entity for diagram input without casting to `EntityVersion[]`.

### 3.1 RED → GREEN — Edit dialog + deleteCascade Entity identity

**RED:**

1. **Dialog contract test** (component or prop-type contract): `JsonObjectEditFormDialog` requires `entity: Entity` (with `defaultInstanceDetailsReportUuid` available from `entity`); rejects / does not require `entityVersion`.
2. **`deleteCascade` unit test** (new or under `scripts` tests): given Entity carrier **without** `entityUuid` (only `uuid`) + `entities[]` with `mlSchema`, reverse-FK walk still finds related entities. Fails while recursive find uses only `ed.entityUuid`.

**GREEN:**

| Site | Change |
|------|--------|
| `JsonObjectEditFormDialog` | Single `entity: Entity`; drop `entityVersion` / dual carrier for live edit |
| `ReportSectionListDisplay` / `EntityInstanceGrid` | Pass `entity={…}` (not `entityVersion={Entity}`) |
| `scripts.ts` `deleteCascade` | Rename params to Entity/`entities`; `carrierIdentityUuid` prefers `uuid`; schema list from `entities` |
| `GlideDataGridComponent` | Replace or delete unused `currentEntityDefinition` |
| `ModelDiagramReportSectionView` / `ModelDiagramPage` | Prefer `entities`; stop casting live list to `EntityVersion[]` |
| `miroir-diagram-class` | Prefer `presentEntitiesAsDiagramCarriers` / Entity-named entry; keep thin deprecated alias for old fn name if needed for one slice |

### Validation (Slice 3)

- [ ] deleteCascade Entity-`uuid` test green.
- [ ] Dialog call sites in Report list + grid pass `entity`.
- [ ] Diagram unit tests still green with Entity carriers:
  ```
  npm run testByFile -w miroir-diagram-class -- entityDefinitionsToMermaid
  ```
- [ ] Typecheck; optional `ReportPage.integ` smoke if dialog mount path covered

### NON-REGRESSION

```
npm run testByFile -w miroir-standalone-app -- foreignKeyAttributeAnalyzer
```

---

## Slice 4 — Group D: Remove dual-read fallbacks

### Goal

After Slices 1–3, delete `Entity ?? EntityVersion` live paths in the Report/grid/FK/deleteCascade tree. Quarantine AI / diagram metamodel leftovers with EOL if not removed.

### 4.1 RED → GREEN — Grid requires `currentEntity`

**RED:**

- Extend grid interface / behavior test: EntityInstance mode **requires** `currentEntity` with `mlSchema`; passing only `currentEntityDefinition` is invalid (type or runtime assert).
- Update `foreignKeyAttributeAnalyzer.unit.test.ts`: primary fixtures are **Entity** with `mlSchema` (identity `uuid`); EntityVersion-shaped carriers either fail typecheck or are removed from the happy-path suite.

**GREEN:**

| Site | Change |
|------|--------|
| `EntityInstanceGrid` | Delete `presentModelSource` EV branch; use `currentEntity` only |
| `EntityInstanceGridInterface` | Remove `currentEntityDefinition: entityVersion.optional()` |
| `foreignKeyAttributeAnalyzer` | Entity-only carrier (or `@deprecated` EV overload with EOL) |
| `scripts.ts` deleteCascade | `entities` only for schema walk |
| `ModelDiagramReportSectionView` | Entities-first; EV/transformer `entityDefinitions` behind EOL comment |
| AI paths | Optional: EOL dual-read or leave with comment pointing to follow-up |

### Validation (Slice 4)

- [ ] Grep `EntityInstanceGrid.tsx`: no `currentEntityDefinition` / EV fallback.
- [ ] FK analyzer tests green on Entity fixtures.
- [ ] `npm run testByFile -w miroir-standalone-app -- foreignKeyAttributeAnalyzer`
- [ ] `npm run testByFile -w miroir-standalone-app -- ReportPage.integ` (or narrower grid/dialog test if integ too heavy)
- [ ] Typecheck

### NON-REGRESSION

```
npm run testByFile -w miroir-core -- entityPresentModel.217
npm run testByFile -w miroir-diagram-class -- entityDefinitionsToMermaid
```

---

## Slice 5 — Group E: Legitimate EntityVersion (characterization lock)

### Goal

**No migration.** Prove #221 does not treat historical EntityVersion / freeze as live Report schema, and does not rewrite persistence/history contracts.

### 5.1 RED → GREEN — Lock “history ≠ live Report schema”

**RED→GREEN** (usually already green; write as permanent guard):

New `packages/miroir-standalone-app/tests/4_view/221.phase5.entityVersion-history-lock.unit.test.ts` (and/or core):

- Assert freeze / snapshot helpers still return `EntityVersion` with **new** uuid ≠ live Entity uuid (reuse existing #216/#220 snapshot asserts; import or re-declare the contract).
- Assert Report view sources under `4_view/components/Reports` and dialogs do **not** import `applicationVersionFreeze` / Cross resolvers for schema (source grep test, same style as #220 Phase 0).
- Document Group E inventory (asset folder `54b9c72f-…`, evolution-trace op strings) as **out of scope** in the test file header comment — no code change required.

### Validation (Slice 5)

- [ ] Lock test green.
- [ ] No production edits under `applicationVersionFreeze` / Cross for this slice.
- [ ] `npm run testByFile -w miroir-core -- applicationVersionFreeze` still green if invoked

---

## Slice 6 — Group F: Out of tree / non-goals (characterization lock)

### Goal

**No migration of JzodElementEditor internals / ReportPage mount / sandbox stub.** Lock that editors stay EntityVersion-free and that this issue does not expand into #220/#213 purges.

### 6.1 RED → GREEN — JzodElementEditor has no EntityVersion coupling

**RED→GREEN:**

New `packages/miroir-standalone-app/tests/4_view/221.phase6.jzodElementEditor-no-entityVersion.unit.test.ts`:

- Read `JzodElementEditor.tsx`, `JzodElementEditorInterface.ts`, and immediate children under `ValueObjectEditor/` (or maintain an explicit file list).
- Assert sources do **not** contain `EntityVersion`, `entityVersion`, `entityDefinition`, `EntityDefinition` as identifiers/imports (allow comments only if needed; prefer zero).
- Existing `JzodElementEditor` unit tests remain green (schema-only editing behavior unchanged).

Optional: assert `ReportPage.tsx` still only mounts `ReportDisplay` (no Entity/EV imports) — documents Group F “ReportPage itself”.

### Validation (Slice 6)

- [ ] Source lock test green.
- [ ] `npm run testByFile -w miroir-standalone-app -- JzodElementEditor`
- [ ] No drive-by renames outside Report/dialog/grid/FK/diagram/deleteCascade surface

---

## Exit criteria (#221)

- [ ] Slices **1–4** merged: live Report/grid/dialog path Entity-only for present-model fields.
- [ ] Slices **5–6** lock tests merged: history and JzodElementEditor boundaries held.
- [ ] Analysis §5 acceptance checklist satisfied.
- [ ] Issue #221 acceptance criteria checked off.
- [ ] No new live-schema resolution via ApplicationVersion Cross mappings.

---

## References

- Analysis groups: [`./analysis.md`](./analysis.md) §2
- Present-model fields: `packages/miroir-core/src/1_core/entityPresentModel.ts` (`ENTITY_PRESENT_MODEL_DEFINITION_FIELDS`)
- FK tests to migrate in Slice 4: `packages/miroir-standalone-app/tests/4_view/utils/foreignKeyAttributeAnalyzer.unit.test.ts`
- Diagram tests: `packages/miroir-diagram-class/tests/entityDefinitionsToMermaidClassDiagram.unit.test.ts`
