# 240 — Inject shared application model-scope menu from Miroir template in edit report mode

> Analysis: eliminate copy-pasted model-scope sidebar items (Application, Entities, Queries, …)
> from per-application menus by defining them once as a Menu in the Miroir meta-application and
> injecting them at render time when **edit report mode** is on.

Related issue: https://github.com/miroir-framework/miroir/issues/240
Related analyses: [`../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md`](../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md) (dynamic deployment discovery patterns)

Key sources:
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/SidebarSection.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/SidebarSection.tsx)
- [`packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`](../../../packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.tsx)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed (grill-me 2026-08-18) — [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) ready.
**Document history:** reviewed 2026-08-18 against the codebase — corrected Library / Postgres menu inventories (§3.2), link counts (8 links + 1 divider), snippet branch attribution (§3.1), and edit-mode suppression semantics (§5.3 step 3 is new filter logic, not existing behaviour).

---

## Decision record

| Decision | Choice |
|---|---|
| Canonical model-scope items | **8 report links + 1 divider** — Application, Entities, Queries, Reports, Menus, Endpoints, Runners, Tests, then divider; **exclude** Entity Definitions and Evolution Trace items |
| Item labels | **Generic** (`Entities`, not `Library Entities`) |
| Template storage | **Dedicated Menu entity** in Miroir data, exported as `menuApplicationModelScopeTemplate` |
| Merge strategy | **Inject + suppress + cleanup** — prepend template when edit mode on; hide app items with `menuItemScope: "model"`; remove duplicated items from Library / CreateApplication runner |
| Placement | **Top of each application's menu** — structure `<model scope> → divider → data scope>`; scales to future multi-app sidebar |
| Deduplication | **`menuItemScope: "model"` on app model links** — no report-UUID-based dedup |
| Helper location | **Standalone-app view layer** (`mergeApplicationModelScopeMenuItems.ts`) |
| CreateApplication runner | **Remove model-scope generation now** |
| Tests | **Unit tests for helper only** |

**Rationale:** Report UUIDs for list/detail reports are already **canonical across applications** (cloned at app creation with stable UUIDs from Miroir). Only `selfApplication`, `instanceUuid` (SelfApplication item), and labels need runtime rewriting. Keeping the template as Miroir data preserves editability; injection in the view layer avoids core/UI coupling.

### D1 — Template storage

**Status:** Accepted — dedicated Menu entity (D1-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Dedicated Menu in Miroir data** ★ | New `Menu` JSON under `miroir_data/dde4c883-…/`, exported from `index.ts` | Data-editable; stable import; same pattern as `menuDefaultMiroir` | Standalone-app imports deployment package |
| D1-b. Section in `menuDefaultMiroir` | Marked section extracted at runtime | Single file | Mixes Miroir self-nav with reusable template |
| D1-c. Runtime query by menu name | Sidebar queries Miroir model for menu | Fully dynamic | Query overhead; naming-convention fragility |

**Decision:** D1-a. Rejected options may be revisited if template must become user-editable without redeploying the standalone app (unscheduled).

### D2 — Merge strategy

**Status:** Accepted — inject + suppress + data cleanup (D2-c).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Inject only | Prepend template; keep app `menuItemScope: "model"` items | Minimal change | Duplicates in Library edit mode |
| D2-b. Inject if missing | Inject only when app menu has no model-scope items | No Library migration | Two code paths; permanent special cases |
| **D2-c. Inject + suppress + cleanup** ★ | Template authoritative in edit mode; strip model-scope from app menus and runner | Single source of truth; no duplicates | Requires data migration |

**Decision:** D2-c.

### D3 — Deduplication rule

**Status:** Accepted — enforce `menuItemScope: "model"` (D3-b).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. Suppress by report UUID | Hide app items whose `reportUuid` matches template | Catches unmarked duplicates (e.g. Designer) | Implicit coupling to template report set |
| **D3-b. Require `menuItemScope: "model"`** ★ | Existing `SidebarSection` filter | Explicit, schema-aligned | Designer model links must be annotated |

**Decision:** D3-b. Designer `"Designer Entities"` / `"Designer Reports"` gain `menuItemScope: "model"` — hidden in normal mode, and suppressed in edit mode while injection is active (§5.3 step 3); the injected generic labels (`Entities`, `Reports`) take their place.

---

## 1. Goals

1. **Single definition** — model-scope sidebar block defined once in Miroir meta-application data, not copy-pasted per app.
2. **Edit-mode injection** — when `generalEditMode` is on, non-Miroir / non-Admin apps show the standard model-scope block above their data-scope menu items.
3. **No Library regression** — normal browsing (edit mode off) shows data items only; edit mode shows the same visual order as today (`model → divider → data`).
4. **Future-ready per-app layout** — injection structured per application section so a multi-app sidebar can repeat `<model> → divider → data>` per app.

## 2. Non-goals

- Multi-application sidebar rendering (show several apps at once) — structure only; wiring deferred.
- Changes to Miroir / Admin `showModelTools` sidebar sections in [`Sidebar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx).
- Entity Definitions or Evolution Trace / Trace Events in the shared block (app-specific or versioning follow-ups).
- Integration / component tests beyond helper unit tests.
- New `menuItemScope` enum values or schema changes (`data` | `model` already exists on `MiroirMenuReportLink`).

---

## 3. Current state

### 3.1 Edit report mode and menu filtering (**aligned mechanism, misaligned data**)

Edit report mode is `context.viewParams.generalEditMode`, toggled from [`AppBar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx) and persisted in `sessionStorage`.

[`SidebarSection.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/SidebarSection.tsx) filters menu items. The same filter appears in both the `simpleMenu` branch (quoted, lines ~295–306) and the `complexMenu` branch (lines ~327–337, applied per section inside a `flatMap`):

```typescript
// simpleMenu branch (comment line present in source)
.filter(
  (curr: MiroirMenuReportLink | MiroirMenuItemDivider) =>
    // context.viewParams.generalEditMode
    ((curr.selfApplication === adminSelfApplication.uuid ||
      curr.selfApplication === deployment_Miroir.uuid) &&
      context.showModelTools) ||
    (curr.selfApplication !== adminSelfApplication.uuid &&
      curr.selfApplication !== deployment_Miroir.uuid &&
      (!curr.menuItemScope ||
        curr.menuItemScope == "data" ||
        context.viewParams.generalEditMode)),
)
```

- Items with **`menuItemScope: "model"`** are hidden unless `generalEditMode` is on.
- Items **without** `menuItemScope` always show.
- Miroir / Admin items in the **app menu** path use `showModelTools`; separate Miroir/Admin blocks are appended in `Sidebar.tsx` when `showModelTools` is on.

**Misalignment:** model-scope content is duplicated in application menu JSON instead of injected from a shared template.

### 3.2 Library menu — baked-in model scope (**misaligned**)

Menu instance `LibraryMenu`, uuid `dd168e5a-2a21-4d2d-a443-032c6d15eb22`, in [`library_model/.../dd168e5a….json`](../../../packages/miroir-test-app_deployment-library/assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json):

Item-by-item inventory:

- **7 model report links marked `menuItemScope: "model"`**: Application, Entities, Queries, Reports, Menus, Endpoints, Runners.
- **1 model-section link NOT marked**: `Library Tests` (reportUuid `58dc6706-…`) has `section: "model"` but no `menuItemScope` — it renders in **both** modes today (current-state anomaly; cleanup removes it regardless).
- **2 dividers marked `"model"`**: one after the model block, one after the data block.
- 6 data links (no scope) between the dividers.
- **2 evolution trace links marked `"model"`** after the second divider.
- App-prefixed labels (`Library Entities`, …).
- Canonical report UUIDs (same as Miroir source reports).

The Postgres deployment menu [`postgres_model/.../dd168e5a….json`](../../../packages/miroir-test-app_deployment-postgres/assets/postgres_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json) is a **distinct application menu** (`PostgresManagerMenu`), not a copy of LibraryMenu: 7 model links marked `"model"` (no Tests, no evolution links) + 1 divider + 3 data links explicitly scoped `"data"`.

### 3.3 CreateApplication runner — generates model scope (**misaligned**)

[`Runner_CreateApplication.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.tsx) (`appDefaultMenu` transformer) builds a default menu with model-scope items (Application, Entities, Entity Definitions, Queries, …) for every new application.

### 3.4 Designer menu — partial model links without scope (**misaligned**)

[`designer_model/.../dd168e5a….json`](../../../packages/miroir-test-app_deployment-designer/assets/designer_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json): `"Designer Entities"` and `"Designer Reports"` use canonical report UUIDs but **lack** `menuItemScope: "model"`, so they appear in normal and edit modes.

### 3.5 Miroir / Admin — special treatment (**aligned, out of scope**)

| App | SelfApplication uuid | Default menu uuid | Sidebar treatment |
|---|---|---|---|
| Miroir | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` | `eaac459c-6c2b-475c-8ae4-c6c3032dae00` (`menuDefaultMiroir`) | Extra `SidebarSection` when `showModelTools`; no `menuItemScope` on items |
| Admin | `55af124e-8c05-4bae-a3ef-0933d41daa92` | `dd168e5a-2a21-4d2d-a443-032c6d15eb22` (`menuDefaultAdmin`) | Same |

[`Sidebar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/Sidebar.tsx) renders the current application's menu first, then appends Miroir + Admin sections when `showModelTools` is enabled.

### 3.6 Canonical report UUIDs (**aligned — reuse as-is**)

Reports live under entity Report uuid `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` in Miroir data. Applications clone these with **stable UUIDs**:

| Menu label (generic) | Report name | Report uuid |
|---|---|---|
| Application | `SelfApplicationDetails` | `cd24df86-204c-4a72-9ac0-87f2b92f25fe` |
| Entities | `EntityList` | `c9ea3359-690c-4620-9603-b5b402e4a2b9` |
| Queries | `QueryList` | `32e52150-ac95-4d96-91b7-f231b85fe76e` |
| Reports | `ReportList` | `1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855` |
| Menus | `MenuList` | `ecfd8787-09cc-417d-8d2c-173633c9f998` |
| Endpoints | `EndpointList` | `ace3d5c9-b6a7-43e6-a277-595329e7532a` |
| Runners | `RunnerList` | `3c26c31e-c988-40b2-af47-d7380e35ba80` |
| Tests | `MiroirTestList` | `58dc6706-0473-468c-90ee-61b54b157140` |

Menu entity uuid: `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`.

---

## 4. Key reuse

| Piece | Location |
|---|---|
| `menuItemScope` on menu items | All three item types (`MiroirMenuPageLink`, `MiroirMenuReportLink`, `MiroirMenuItemDivider`) in [`miroirFundamentalType.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts) — `"data"` \| `"model"` |
| Edit mode flag | `context.viewParams.generalEditMode` via [`MiroirContextReactProvider.tsx`](../../../packages/miroir-react/src/contexts/MiroirContextReactProvider.tsx) |
| Menu filtering | [`SidebarSection.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/SidebarSection.tsx) |
| Miroir self-application | uuid `360fcf1f-f0d4-4f8a-9262-07886e70fa15` — `selfApplicationMiroir` |
| Admin self-application | uuid `55af124e-8c05-4bae-a3ef-0933d41daa92` — `adminSelfApplication` |
| Reference menu export pattern | `menuDefaultMiroir` uuid `eaac459c-6c2b-475c-8ae4-c6c3032dae00` in [`miroir-test-app_deployment-miroir/index.ts`](../../../packages/miroir-test-app_deployment-miroir/index.ts) |
| Menu item rendering | `MenuItemDisplay` in SidebarSection |
| CreateApplication menu template | `appDefaultMenu` in [`Runner_CreateApplication.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.tsx) |

---

## 5. Target behaviour (summary)

### 5.1 New Miroir Menu template

- New file under `packages/miroir-test-app_deployment-miroir/assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/` (uuid assigned at implementation).
- Export: `menuApplicationModelScopeTemplate` from `miroir-test-app_deployment-miroir/index.ts`.
- `menuType: "complexMenu"` with one section; items use generic labels, canonical report UUIDs from §3.6, `menuItemScope: "model"`, `selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15"` as placeholder.
- Application item includes `instanceUuid` placeholder (rewritten to target app uuid).

### 5.2 Helper `mergeApplicationModelScopeMenuItems`

Location: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/mergeApplicationModelScopeMenuItems.ts`

```
Input:  template Menu, targetApplicationUuid
Output: MiroirMenuItem[] — selfApplication/instanceUuid rewritten, 8 links + divider
```

### 5.3 SidebarSection integration

When `generalEditMode && applicationUuid ∉ { selfApplicationMiroir, adminSelfApplication }` (injection active):

1. Call helper with `menuApplicationModelScopeTemplate` and current `applicationUuid`.
2. Prepend resolved items before app menu content (all sections).
3. **Extend the filter**: while injection is active, app items with `menuItemScope: "model"` are **suppressed** — the template is authoritative. This is *new* logic: the existing filter (§3.1) *reveals* model-scope items in edit mode, it never suppresses them. Without this step, apps that keep annotated model links (e.g. Designer after §5.4) would show duplicates next to the injected generic block.

When `generalEditMode` is off: unchanged (data-scope only; app model links hidden by the existing filter).

### 5.4 Data cleanup (same change)

| Asset | Action |
|---|---|
| Library menu `dd168e5a-…` | Remove all `menuItemScope: "model"` items (incl. evolution trace links) |
| Postgres menu `dd168e5a-…` | Same |
| `Runner_CreateApplication.tsx` `appDefaultMenu` | Remove model-scope items from generated default menu |
| Designer menu `dd168e5a-…` | Add `menuItemScope: "model"` to model-report links in Designer section |

---

## 6. Proposals / options

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Dedicated template Menu + SidebarSection injection (confirmed design) | High — fixes duplication across all apps | Medium | **Adopt** |
| 2 | Report-UUID dedup instead of `menuItemScope` enforcement | Low — avoids Designer annotation | Low | **Reject** (D3-b) |
| 3 | Move helper to `miroir-core` | Medium — reusable outside standalone app | Medium | **Defer** (no current consumer) |
| 4 | Runtime menu query instead of static import | Low — avoids import coupling | Medium | **Reject** (D1-a) |
| 5 | Include Evolution Trace items in shared block | Low — parity with old Library menu | Low | **Reject** (confirmed non-goal) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
