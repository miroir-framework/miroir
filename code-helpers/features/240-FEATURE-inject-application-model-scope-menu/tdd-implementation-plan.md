# 240 — TDD implementation plan: inject shared application model-scope menu

> Vertical TDD slices (RED → GREEN each). Unit tests cover the pure merge/filter
> helper module only (per analysis §2 non-goals). Sidebar wiring and data cleanup
> slices end with a tracer-bullet manual check in the browser.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/240

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
 * Encapsulates the extended suppression rule (§5.3 step 3): when injection is active,
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

Template data (not under unit test — static JSON):

- `menuApplicationModelScopeTemplate` exported from `miroir-test-app_deployment-miroir/index.ts`
- New Menu uuid assigned at implementation (under `miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/`)

Locked constants (from analysis §3.5–§3.6):

| Role | uuid |
|---|---|
| Miroir self-application | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| Admin self-application | `55af124e-8c05-4bae-a3ef-0933d41daa92` |
| Library self-application | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| SelfApplicationDetails report | `cd24df86-204c-4a72-9ac0-87f2b92f25fe` |
| EntityList report | `c9ea3359-690c-4620-9603-b5b402e4a2b9` |
| MiroirTestList report | `58dc6706-0473-468c-90ee-61b54b157140` |

---

## Slice 1 — tracer bullet: `mergeApplicationModelScopeMenuItems` rewrites identity

**RED** — `packages/miroir-standalone-app/tests/4_view/applicationModelScopeMenu.unit.test.ts`:

- Import a minimal fixture `Menu` (inline in test or copied subset) with one `miroirMenuReportLink` whose `selfApplication` is Miroir uuid.
- `mergeApplicationModelScopeMenuItems(template, LIBRARY_APP_UUID)` returns one item with `selfApplication === LIBRARY_APP_UUID`.
- Expected failure: module / function not found.

**GREEN** — create `applicationModelScopeMenu.ts` with:

- Deep-clone items from `templateMenu.definition.definition[0].items` (guard `complexMenu` shape).
- Map report links and dividers: replace `selfApplication` with `targetApplicationUuid`.

**Commit:** `test(#240): RED/GREEN mergeApplicationModelScopeMenuItems identity rewrite`

---

## Slice 2 — full template shape: 8 links + divider + Application `instanceUuid`

**RED** — extend unit tests:

- Fixture matches canonical block (labels: Application, Entities, …, Tests, then divider).
- Output length === 9.
- Application item: `instanceUuid === targetApplicationUuid`, `reportUuid === cd24df86-…`.
- Entities item: `reportUuid === c9ea3359-…`, generic label `"Entities"` unchanged.
- Divider: `miroirMenuItemType === "miroirMenuItemDivider"`, `menuItemScope === "model"`.
- Invalid / empty template → `[]` (or throw — pick one, lock in test).

**GREEN** — complete mapper:

- Set `instanceUuid` on Application link when present in template.
- Preserve `menuItemScope`, `section`, `icon`, `reportUuid`, labels.

**Commit:** `feat(#240): complete mergeApplicationModelScopeMenuItems canonical block`

---

## Slice 3 — filter helper: injection gate + model-scope suppression

**RED** — unit tests for `isApplicationModelScopeInjectionActive` and `shouldShowAppMenuItem`:

| Case | `generalEditMode` | app | item.menuItemScope | injectionActive | expect show |
|---|---|---|---|---|---|
| Data item, edit off | false | Library | — | false | true |
| Model item, edit off | false | Library | model | false | false |
| Model item, edit on, no injection (Miroir) | true | Miroir | model | false | per existing Miroir/showModelTools rules |
| Model item, edit on, injection (Library) | true | Library | model | true | **false** (suppressed) |
| Data item, edit on, injection | true | Library | data / — | true | true |
| Model item, edit on, injection off | true | Library | model | false | true (legacy reveal — pre-cleanup apps only) |

**GREEN** — implement both functions; no Sidebar changes yet.

**Commit:** `feat(#240): applicationModelScopeMenu filter helpers`

---

## Slice 4 — Miroir Menu template asset + export

**No automated test** (static JSON). Manual assertion: file validates against Menu schema / loads in dev.

**Tasks:**

1. Add `packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/<new-uuid>.json`:
   - `name`: `ApplicationModelScopeTemplate`
   - `menuType`: `complexMenu`, one section
   - 8 report links (§3.6 UUIDs), generic labels, all `menuItemScope: "model"`, `section: "model"` (Tests included with `menuItemScope: "model"` — fixes Library anomaly)
   - 1 divider (`menuItemScope: "model"`)
   - Placeholder `selfApplication`: `360fcf1f-f0d4-4f8a-9262-07886e70fa15`
   - Application link: `instanceUuid` same placeholder
2. Export `menuApplicationModelScopeTemplate` from `miroir-test-app_deployment-miroir/index.ts` (+ `index.d.ts` if generated manually).
3. `npm run build -w miroir-test-app_deployment-miroir`.

**Note:** Do **not** add to `src/Model.ts` `menus` array — template is consumed by standalone-app import, not Miroir runtime navigation.

**Commit:** `feat(#240): add menuApplicationModelScopeTemplate Menu asset`

---

## Slice 5 — wire `SidebarSection.tsx`

**No new automated test** (per analysis). Refactor both `simpleMenu` and `complexMenu` branches to use shared helpers.

**Tasks:**

1. Import `menuApplicationModelScopeTemplate`, `mergeApplicationModelScopeMenuItems`, `isApplicationModelScopeInjectionActive`, `shouldShowAppMenuItem`.
2. Compute `injectionActive = isApplicationModelScopeInjectionActive(context.viewParams.generalEditMode, props.applicationUuid)`.
3. When `injectionActive`: `injectedItems = mergeApplicationModelScopeMenuItems(menuApplicationModelScopeTemplate, props.applicationUuid)`.
4. Replace inline `.filter(...)` with `shouldShowAppMenuItem` (preserve existing Admin/Miroir/showModelTools behaviour from §3.1).
5. Render order: `[...injectedItems mapped to MenuItemDisplay, ...filteredAppItems]`.
6. `complexMenu`: prepend injected block **once** before the `flatMap` over sections (Option A / per-app top).

**Tracer bullet (manual):**

1. Open Library, edit mode **off** → sidebar shows Books, Authors, … only (no Entities).
2. Toggle edit mode **on** → generic Application, Entities, …, Tests, divider, then data items.
3. Miroir / Admin unchanged.

**Commit:** `feat(#240): inject model-scope menu in SidebarSection when edit mode on`

---

## Slice 6 — Library menu data cleanup

**Tasks:**

1. Edit `packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`:
   - Remove all items with `menuItemScope: "model"` (7 links + 2 dividers + 2 evolution trace links).
   - Remove unscoped Tests link (`58dc6706-…`) — covered by template.
   - Keep 6 data links (Books, Authors, Publishers, countries, Users, Lending History).
2. `npm run build -w miroir-test-app_deployment-library`.

**Tracer bullet:** Repeat Slice 5 checks — visual result must match pre-change edit-mode Library.

**Commit:** `refactor(#240): strip model-scope items from Library menu`

---

## Slice 7 — Postgres menu data cleanup

**Tasks:**

1. Edit `packages/miroir-test-app_deployment-postgres/assets/postgres_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`:
   - Remove all `menuItemScope: "model"` items + model divider.
   - Keep data-scoped items (`menuItemScope: "data"` or unscoped).
2. `npm run build -w miroir-test-app_deployment-postgres`.

**Commit:** `refactor(#240): strip model-scope items from Postgres menu`

---

## Slice 8 — CreateApplication runner: data-only default menu

**Tasks:**

1. In `Runner_CreateApplication.tsx` `appDefaultMenu` transformer, remove items from Application through Tests and model divider (keep only data links pattern — empty `items: []` initially or only post-divider data items if runner adds them later).
2. Verify runner still creates a valid `complexMenu` Menu instance.

**Optional check:** run CreateApplication runner once in UI / existing runner test if present; not blocking if no suite exists.

**Commit:** `refactor(#240): stop baking model-scope into CreateApplication default menu`

---

## Slice 9 — Designer menu: annotate model links

**Tasks:**

1. Edit `packages/miroir-test-app_deployment-designer/assets/designer_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`:
   - Add `menuItemScope: "model"` to `"Designer Entities"` and `"Designer Reports"` (both `section: "model"`).
2. `npm run build -w miroir-test-app_deployment-designer`.

**Tracer bullet:**

- Designer, edit mode off → Requirements section only (Roles, Activities, …); Designer Entities/Reports hidden.
- Designer, edit mode on → injected generic block at top, then Requirements + Designer data items; no duplicate Entities/Reports.

**Commit:** `fix(#240): mark Designer model-report links with menuItemScope model`

---

## Slice 10 — regression gate

**Automated:**

```bash
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu
npm run build -w miroir-test-app_deployment-miroir
npm run build -w miroir-test-app_deployment-library
npm run build -w miroir-standalone-app
```

**Manual AC checklist:**

| # | Criterion | Verify |
|---|---|---|
| 1 | Single template Menu in Miroir data | Slice 4 file + export |
| 2 | Library edit mode shows model → divider → data | Slice 5–6 tracer |
| 3 | Library normal mode shows data only | Slice 6 tracer |
| 4 | Designer no duplicate model links in edit mode | Slice 9 tracer |
| 5 | New apps via CreateApplication get data-only menu | Slice 8 spot-check |
| 6 | Miroir / Admin sidebar sections unchanged | Slice 5 tracer |

**Commit:** `chore(#240): close implementation — tests green`

Update [`./analysis.md`](./analysis.md) status line to **implemented**.

---

## Definition of done (maps to issue #240)

| # | Acceptance criterion | Slice |
|---|---|---|
| 1 | `menuApplicationModelScopeTemplate` Menu in Miroir deployment | 4 |
| 2 | Helper rewrites `selfApplication` / `instanceUuid` | 1–2 |
| 3 | Sidebar injects block when `generalEditMode` (non-Miroir/Admin) | 5 |
| 4 | App `menuItemScope: "model"` suppressed during injection | 3, 5 |
| 5 | Library / Postgres menus cleaned | 6–7 |
| 6 | CreateApplication runner cleaned | 8 |
| 7 | Designer model links annotated | 9 |
| 8 | Unit tests for helper module | 1–3 |

---

## Commands reference

```bash
# Helper unit tests (slices 1–3, gate slice 10)
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu

# Rebuild touched deployment packages after data edits
npm run build -w miroir-test-app_deployment-miroir
npm run build -w miroir-test-app_deployment-library
npm run build -w miroir-test-app_deployment-designer
npm run build -w miroir-test-app_deployment-postgres
npm run build -w miroir-standalone-app
```

---

## Out of scope / follow-ups

- Multi-application sidebar (render several app blocks at once).
- Evolution Trace / Entity Definitions in shared template.
- Component/integration tests for `SidebarSection` rendering.
- Moving helper to `miroir-core` (analysis §6 proposal 3 — deferred).
- Adding `menuApplicationModelScopeTemplate` to Miroir `Model.ts` meta-model `menus` array (not required for runtime injection).
