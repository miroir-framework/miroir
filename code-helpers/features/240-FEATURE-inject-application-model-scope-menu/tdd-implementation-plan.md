# Issue #240 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Confirmed coverage decision (analysis): **unit tests for the merge/filter helper module only** —
> the helper is not reachable through the Miroir ML (pure view-layer functions), so vitest unit
> tests are the justified exception; sidebar wiring and data cleanup slices prove themselves via
> modelValidation, the helper suite staying GREEN, and manual tracer bullets. No mocks.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen only
> when the user explicitly asks. Each slice ends with its Validation commands; on success its
> Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/240

**Resume note:** Slice 0 ✅ — next: Slice 1 (template Menu asset + export).

---

## Scope

In scope:

- `menuApplicationModelScopeTemplate` Menu asset in Miroir data + package export;
- view-layer helper module (`mergeApplicationModelScopeMenuItems`, injection gate, suppression predicate) with unit tests;
- `SidebarSection.tsx` wiring: inject template block + suppress app model-scope items when injection is active (both menu branches);
- data cleanup: Library + Postgres menus stripped of model-scope items; CreateApplication runner stops generating them; Designer model links annotated `menuItemScope: "model"`.

This plan does **not** implement multi-application sidebar rendering, Evolution Trace / Entity Definitions items in the shared block, component/integration tests beyond the helper unit tests, new `menuItemScope` enum values, or moving the helper to `miroir-core` (analysis §6 proposal 3 — deferred).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current menus & filter behavior | ✅ | inventory locks GREEN (transitional) |
| 1 | Template Menu asset + export (applicative contract) | ⬜ | miroir `modelValidation` + build |
| 2 | Helper module: merge + gate + suppression | ⬜ | `applicationModelScopeMenu` unit suite GREEN |
| 3 | SidebarSection wiring (injection + suppression) | ⬜ | helper suite GREEN + manual tracer |
| 4 | Library menu cleanup | ⬜ | library `modelValidation` + tracer parity with Slice 3 |
| 5 | Postgres menu cleanup | ⬜ | postgres `modelValidation` |
| 6 | CreateApplication runner: data-only default menu | ⬜ | `Runner_Miroir.integ` GREEN + menu assertion |
| 7 | Designer menu annotation | ⬜ | designer build + manual tracer |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg + AC checklist |

---

## Locked implementation defaults

Carried from the analysis decision record (confirmed 2026-08-18); binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| Canonical model-scope items | **8 report links + 1 divider** (Application, Entities, Queries, Reports, Menus, Endpoints, Runners, Tests, then divider); **exclude** Entity Definitions and Evolution Trace items |
| Item labels | **Generic** (`Entities`, not `Library Entities`) |
| Template storage | **Dedicated Menu entity** in Miroir data, exported as `menuApplicationModelScopeTemplate` |
| Merge strategy | **Inject + suppress + cleanup** (D2-c) |
| Placement | **Top of each application's menu** — `<model scope> → divider → data scope>` |
| Deduplication | **`menuItemScope: "model"` enforcement** — no report-UUID-based dedup (D3-b) |
| Helper location | **Standalone-app view layer** |
| CreateApplication runner | **Remove model-scope generation now** |
| Tests | **Unit tests for helper module only** |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `menuApplicationModelScopeTemplate` Menu | `a4ed0b44-57c2-45ee-a33c-c7c09bde969d` (under `miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/`) |
| Helper unit suite (permanent, feature-named) | `packages/miroir-standalone-app/tests/4_view/applicationModelScopeMenu.unit.test.ts` |
| Slice 0 inventory locks (transitional, issue-scoped) | `packages/miroir-standalone-app/tests/4_view/issues/240-model-scope-menu/modelScopeMenu.240.phase0.unit.test.ts` |

Locked constants (from analysis §3.5–§3.6):

| Role | uuid |
|---|---|
| Miroir self-application | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| Admin self-application | `55af124e-8c05-4bae-a3ef-0933d41daa92` |
| Library self-application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Menu entity | `dde4c883-ae6d-47c3-b6df-26bc6e3c1842` |
| SelfApplicationDetails report | `cd24df86-204c-4a72-9ac0-87f2b92f25fe` |
| EntityList report | `c9ea3359-690c-4620-9603-b5b402e4a2b9` |
| MiroirTestList report | `58dc6706-0473-468c-90ee-61b54b157140` |

---

## Public interface under test (new)

```typescript
// packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/applicationModelScopeMenu.ts

/** True when edit mode is on and the app is not Miroir or Admin. */
export function isApplicationModelScopeInjectionActive(
  generalEditMode: boolean,
  applicationUuid: string,
): boolean;

/**
 * Resolve template menu items for a target application:
 * rewrite selfApplication (+ instanceUuid on Application link), preserve labels/report UUIDs.
 */
export function mergeApplicationModelScopeMenuItems(
  templateMenu: Menu,
  targetApplicationUuid: string,
): MiroirMenuItem[];

/**
 * Whether an app-menu item should render given injection + existing Sidebar rules.
 * Encapsulates the extended suppression rule (analysis §5.3 step 3): when injection is active,
 * app items with menuItemScope === "model" are hidden even though generalEditMode is on.
 */
export function shouldShowAppMenuItem(
  item: MiroirMenuItem,
  ctx: {
    generalEditMode: boolean;
    showModelTools: boolean;
    sectionApplicationUuid: string;
    injectionActive: boolean;
    adminSelfApplicationUuid: string;
    miroirSelfApplicationUuid: string;
  },
): boolean;
```

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Helper unit tests (Slices 2–3, gate Slice 8) | `npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu` |
| Slice 0 inventory locks | `npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240` |
| Deployment validation (per touched package) | `npm run testByFile -w miroir-test-app_deployment-<miroir\|library\|designer\|postgres> -- tests/modelValidation.unit.test.ts` |
| Runner regression (Slice 6) | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- Runner_Miroir.integ` |
| Rebuild after data edits | `npm run build -w miroir-test-app_deployment-<pkg>` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |

---

## Slice 0 — Characterize current menus & filter behavior

**Status:** ✅ DONE

### Goal

Lock current menu asset inventories so the cleanup slices (4–7) produce reviewable diffs and the annotation change (7) is proven. Transitional locks — deleted in Slice 8 per the `issues/` directory rule (`docs/contributing/testing.md`, #238).

### 0.1 RED → GREEN — menu asset inventory locks

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/240-model-scope-menu/modelScopeMenu.240.phase0.unit.test.ts`

Behavior asserted (values verified against the assets during analysis review):

- **Library** (via `menuDefaultLibrary` export): 18 items = 7 model-marked links + 1 **unscoped** `Library Tests` link (`58dc6706-…`) + 2 model-marked dividers + 6 data links + 2 model-marked evolution trace links.
- **Postgres** (fs-read asset — not exported by its package): 11 items = 7 model-marked links + 1 model-marked divider + 3 `"data"`-scoped links.
- **Designer** (fs-read asset): 2 sections — `Requirements`: 4 unscoped data links; `Designer`: 3 links of which `Designer Entities` / `Designer Reports` are `section: "model"` **without** `menuItemScope`.
- **CreateApplication runner** (`appDefaultMenu` transformer source): generates 8 model-marked links (incl. Entity Definitions `f9aff35d-…`) + 1 model-marked divider, no data items.

### 0.2 Filter behavior baseline

No separate test: the `injectionActive: false` rows of Slice 2.3's truth table characterize the existing `SidebarSection` filter; Slice 3 must keep them Green.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240
```

### Realization

- Added transitional inventory locks in `packages/miroir-standalone-app/tests/4_view/issues/240-model-scope-menu/modelScopeMenu.240.phase0.unit.test.ts` (8 tests).
- **Library** (`menuDefaultLibrary`): 18 items — 7 core `menuItemScope: "model"` report links (evolution trace links excluded from core count), 1 unscoped `Library Tests` link, 2 model dividers, 6 data links, 2 evolution model links.
- **Postgres** (fs-read `postgres_model/.../dd168e5a-….json`): 11 items — 7 model links, 1 model divider, 3 data-scoped links.
- **Designer** (fs-read `designer_model/.../dd168e5a-….json`): Requirements section 4 unscoped data links; Designer section — Entities/Reports `section: "model"` without `menuItemScope`, Applications `section: "data"`.
- **CreateApplication runner** (`Runner_CreateApplication.tsx` `appDefaultMenu` source slice): 8 model-marked report links + 1 model divider (includes Entity Definitions `f9aff35d-…`), no data items.
- Filter baseline (§0.2): deferred to Slice 2.3 truth-table rows with `injectionActive: false` — no separate test in this slice.
- **Deviation:** Designer assertions use `expect(item?.menuItemScope).toBeUndefined()` instead of `toMatchObject({ menuItemScope: undefined })` — Vitest treats explicit `undefined` in `toMatchObject` as a required property.
- **Validation:** `npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240` — 8/8 GREEN (2026-08-18).

---

## Slice 1 — Template Menu asset + export (applicative contract)

**Status:** ⬜ pending

### Goal

The canonical model-scope block exists once, as Miroir meta-application data — the applicative interface every later slice consumes.

**Layers cut:** JSON asset → package export. No schema change (Menu schema unchanged).

### 1.1 Tasks (data slice — proof via modelValidation)

1. Add `packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/a4ed0b44-57c2-45ee-a33c-c7c09bde969d.json`:
   - `name`: `ApplicationModelScopeTemplate`; `menuType: "complexMenu"`, one section;
   - 8 report links (analysis §3.6 UUIDs), generic labels, `section: "model"`, all `menuItemScope: "model"` — **Tests included and marked** (fixes the Library anomaly at the source);
   - 1 divider, `menuItemScope: "model"`;
   - placeholder `selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15"`; Application link carries `instanceUuid` with the same placeholder.
2. Export `menuApplicationModelScopeTemplate` from `miroir-test-app_deployment-miroir/index.ts` (same pattern as `menuDefaultMiroir`).
3. Do **not** add it to `src/Model.ts` `menus` array (line 293) — consumed by standalone-app import, not Miroir runtime navigation.
4. Rebuild the package.

### 1.2 Refactor checkpoint

- None expected — pure additive asset. Confirm no existing asset duplicates this block (analysis §3.2: it is currently copy-pasted per app; cleanup slices 4–7 handle removal).

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 2 — Helper module: merge + gate + suppression

**Status:** ⬜ pending

### Goal

The three helper functions exist with their contracts locked by unit tests — grouped into **one** slice (three RED → GREEN cycles) since confirmed coverage is helper-only. Tests import the **real** `menuApplicationModelScopeTemplate` (Slice 1), not an inline fixture copy.

**Layers cut:** view-layer module only; consumers arrive in Slice 3.

### 2.1 RED → GREEN — `mergeApplicationModelScopeMenuItems` identity rewrite

**RED:** every returned item has `selfApplication === <target app uuid>` (links and divider); template input is not mutated.

**GREEN:** deep-clone `templateMenu.definition.definition[0].items` (guard `complexMenu` shape); rewrite `selfApplication` on report links and dividers.

### 2.2 RED → GREEN — full canonical block shape

**RED:**

- Output length === 9, order preserved (Application, Entities, …, Tests, divider).
- Application item: `instanceUuid === targetApplicationUuid`, `reportUuid === cd24df86-…`.
- Entities item: `reportUuid === c9ea3359-…`, generic label `"Entities"` unchanged; `menuItemScope`, `section`, `icon` preserved on all items.
- Divider: `miroirMenuItemType === "miroirMenuItemDivider"`, `menuItemScope === "model"`.
- Invalid / empty template → `[]` (locked behavior, no throw).

**GREEN:** set `instanceUuid` on the Application link when present in template; preserve all other fields.

### 2.3 RED → GREEN — injection gate + suppression predicate

**RED** — truth table for `isApplicationModelScopeInjectionActive` and `shouldShowAppMenuItem`:

| Case | `generalEditMode` | app | item.menuItemScope | injectionActive | expect show |
|---|---|---|---|---|---|
| Data item, edit off | false | Library | — | false | true |
| Model item, edit off | false | Library | model | false | false |
| Model item, edit on, Miroir/Admin item | true | Miroir | model | false | per existing `showModelTools` rules |
| Model item, edit on, injection (Library) | true | Library | model | true | **false** (suppressed) |
| Data item, edit on, injection | true | Library | data / — | true | true |
| Model item, edit on, injection off | true | Library | model | false | true (legacy reveal — pre-cleanup apps) |

Rows with `injectionActive: false` **characterize existing filter behavior** (Slice 0.2 baseline) — they are the regression lock for the Slice 3 refactor.

**GREEN:** implement both functions; no Sidebar changes yet.

### 2.4 Refactor checkpoint

- Keep the module deep: three functions, no leaked internals; consumers get behavior, not predicates to reassemble.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 3 — Wire `SidebarSection.tsx` (injection + suppression)

**Status:** ⬜ pending

### Goal

First user-observable behavior: in edit mode, a non-Miroir/Admin app's sidebar shows the injected generic model block on top, and the app's own model-scope items no longer duplicate it.

**Layers cut:** view component only; asset and helpers land in Slices 1–2.

### 3.1 Tasks

1. Import `menuApplicationModelScopeTemplate`, `mergeApplicationModelScopeMenuItems`, `isApplicationModelScopeInjectionActive`, `shouldShowAppMenuItem`.
2. Compute `injectionActive = isApplicationModelScopeInjectionActive(context.viewParams.generalEditMode, props.applicationUuid)`.
3. When active: `injectedItems = mergeApplicationModelScopeMenuItems(menuApplicationModelScopeTemplate, props.applicationUuid)`.
4. Replace **both** inline `.filter(...)` branches (`simpleMenu` ~L295–306 and `complexMenu` ~L327–337) with `shouldShowAppMenuItem` — preserving the existing Admin/Miroir/`showModelTools` behavior (truth-table rows with `injectionActive: false` stay GREEN).
5. Render order: injected block first, then filtered app items; `complexMenu`: prepend **once** before the `flatMap` over sections (analysis decision: top of each application's menu).

### 3.2 Proof

Per the confirmed coverage decision there is no new component test for this slice — deviation from the one-new-test-per-slice default, recorded here. Proof is:

- the Slice 2 suite staying GREEN (wiring delegates the predicate to `shouldShowAppMenuItem`);
- the manual tracer bullet below;
- build + typecheck.

**Tracer bullet (manual):**

1. Library, edit mode **off** → data items only (Books, Authors, …; no Entities).
2. Edit mode **on** → generic Application, Entities, …, Tests, divider, then Library's data items; Library's own model items suppressed (no duplicates).
3. Miroir / Admin sidebars unchanged.

### 3.3 Refactor checkpoint

- The two duplicated inline filter branches collapse into one tested predicate (duplication extraction + module deepening — the analysis's §3.1 misalignment note).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu
npm run build -w miroir-standalone-app
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 4 — Library menu cleanup

**Status:** ⬜ pending

### Goal

Library menu holds data-scope items only; the template is the single source of model-scope navigation.

### 4.1 Tasks

1. Edit `packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`:
   - Remove all `menuItemScope: "model"` items (7 links + 2 dividers + 2 evolution trace links);
   - remove the unscoped `Library Tests` link (`58dc6706-…`) — covered by the template;
   - keep exactly the 6 data links (Books, Authors, Publishers, countries, Users, Lending History).
2. Rebuild the package.

### 4.2 Proof

- Slice 0 inventory lock updated to the post-cleanup inventory (6 items) — the diff between lock states *is* the reviewable change record;
- library `modelValidation` GREEN;
- tracer parity: Library edit/normal mode look identical to Slice 3's tracer result.

### 4.3 Refactor checkpoint

- None beyond the deletion itself (dead data removal).

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 5 — Postgres menu cleanup

**Status:** ⬜ pending

### Goal

`PostgresManagerMenu` holds data-scope items only.

### 5.1 Tasks

1. Edit `packages/miroir-test-app_deployment-postgres/assets/postgres_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`: remove the 7 model-marked links + the model-marked divider; keep the 3 `"data"`-scoped links (Postgres Schemas / Tables / Table Columns).
2. Rebuild the package.

### 5.2 Proof

- Slice 0 inventory lock updated (11 → 3 items);
- postgres `modelValidation` GREEN (runs in `nonreg --tier full`; run it explicitly here).

### 5.3 Refactor checkpoint

- None beyond the deletion itself.

### Validation

```bash
npm run build -w miroir-test-app_deployment-postgres
npm run testByFile -w miroir-test-app_deployment-postgres -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 6 — CreateApplication runner: data-only default menu

**Status:** ⬜ pending

### Goal

Newly created applications get a menu without baked-in model-scope items — injection provides them in edit mode from day one.

### 6.1 Tasks

1. In `Runner_CreateApplication.tsx` `appDefaultMenu` transformer, remove all 8 model-marked links (Application, Entities, **Entity Definitions** — excluded from the canonical block per analysis, Queries, Reports, Menus, Endpoints, Runners) and the model-marked divider. The generated section keeps `items: []` (the transformer currently generates no data items — verified).
2. The generated Menu must remain a valid `complexMenu` instance.

### 6.2 Proof

- `Runner_Miroir.integ` (already exercises `createApplicationAndDeployment`) stays GREEN; **extend** its createApplication case with one assertion: the generated default menu contains no item with `menuItemScope: "model"` (minimal strengthening inside an existing suite — confirm with user; if declined, manual spot-check instead).

### 6.3 Refactor checkpoint

- Removing the generation code is the refactor (dead template logic eliminated, runner transformer simplified).

### Validation

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- Runner_Miroir.integ
npm run build -w miroir-standalone-app
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 7 — Designer menu: annotate model links

**Status:** ⬜ pending

### Goal

Designer's own model links obey the suppression rule — hidden in normal mode, suppressed under injection in edit mode (D3-b).

### 7.1 Tasks

1. Edit `packages/miroir-test-app_deployment-designer/assets/designer_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`: add `menuItemScope: "model"` to `"Designer Entities"` and `"Designer Reports"` (both already `section: "model"`).
2. Rebuild the package.

### 7.2 Proof

- Slice 0 inventory lock updated (2 links now marked);
- designer build + manual tracer:
  - Designer, edit mode off → Requirements section only;
  - Designer, edit mode on → injected generic block at top, then Requirements + Designer data items; **no duplicate** Entities/Reports rows.

### 7.3 Refactor checkpoint

- None beyond the annotation itself.

### Validation

```bash
npm run build -w miroir-test-app_deployment-designer
npm run testByFile -w miroir-standalone-app -- modelScopeMenu.240
```

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg coverage

- Helper unit suite and miroir/library `modelValidation` run in default `npm run nonreg` (unit tier + early modelValidation steps) — **no new manifest step needed**; postgres `modelValidation` covered by `--tier full`. Recorded here in lieu of a manifest change (deviation note).
- Run: `npm run nonreg -- --only default-miroir-modelValidation,default-library-modelValidation` plus the helper suite command as the issue gate.

### 8.2 Docs

- `analysis.md` status → **implemented**; this plan's progress table all DONE.
- `docs/contributing/testing.md` / `docs/reference/testing.md`: no new suite keys — nothing to add.

### 8.3 Issue-directory cleanup

- Delete `tests/4_view/issues/240-model-scope-menu/` (Slice 0 locks served their diff-review purpose; the permanent coverage is the feature-named helper suite).

### 8.4 Tracer bullet (narrative, full path)

1. Library, edit mode off → data items only.
2. Edit mode on → injected generic block (Application … Tests, divider) then Library data items; no duplicates.
3. Create a new application via the CreateApplication runner → its menu has no model items; edit mode shows the injected block.
4. Designer, edit mode on → injected block, no duplicate Designer Entities/Reports.
5. Miroir / Admin sidebars unchanged throughout.

### AC checklist (#240)

| # | Acceptance criterion | Proven by | Status |
|---|---|---|---|
| 1 | Single template Menu in Miroir data + export | Slice 1 (`modelValidation`) | ⬜ |
| 2 | Helper rewrites `selfApplication` / `instanceUuid` | Slice 2 (unit suite) | ⬜ |
| 3 | Sidebar injects block when `generalEditMode` (non-Miroir/Admin) | Slice 3 (tracer) | ⬜ |
| 4 | App `menuItemScope: "model"` items suppressed during injection | Slices 2.3, 3 | ⬜ |
| 5 | Library / Postgres menus cleaned | Slices 4–5 (`modelValidation` + lock diff) | ⬜ |
| 6 | CreateApplication runner cleaned | Slice 6 (`Runner_Miroir.integ`) | ⬜ |
| 7 | Designer model links annotated | Slice 7 (tracer) | ⬜ |
| 8 | Unit tests for helper module | Slice 2 | ⬜ |

### Realization

<Appended on completion, together with Status ✅ DONE.>

---

## Out of scope / follow-ups

- Multi-application sidebar (render several app blocks at once) — structure only; wiring deferred.
- Evolution Trace / Entity Definitions in the shared template (confirmed non-goal).
- Component/integration tests for `SidebarSection` rendering (confirmed non-goal).
- Moving the helper to `miroir-core` (analysis §6 proposal 3 — deferred, no current consumer).
- Adding `menuApplicationModelScopeTemplate` to Miroir `src/Model.ts` `menus` array (not required for runtime injection).
