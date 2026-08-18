# 241 — Scope Designer requirements per DesignerApplication (multi-app design)

> Analysis: the Designer deployment already stores Activities, User Stories, and Roles with a required
> `designerApplication` FK, but reports and menu navigation still behave like a single-app workspace.
> This issue scopes list/detail reports and menu structure so several target applications can be designed in parallel.

Related issue: https://github.com/miroir-framework/miroir/issues/241
Related analyses: [`../240-FEATURE-inject-application-model-scope-menu/analysis.md`](../240-FEATURE-inject-application-model-scope-menu/analysis.md) (Designer menu; multi-app sidebar deferred there)

Key sources:
- [`packages/miroir-test-app_deployment-designer/assets/designer_model/`](../../../packages/miroir-test-app_deployment-designer/assets/designer_model/)
- [`packages/miroir-test-app_deployment-designer/assets/designer_data/`](../../../packages/miroir-test-app_deployment-designer/assets/designer_data/)
- [`packages/miroir-test-app_deployment-designer/index.ts`](../../../packages/miroir-test-app_deployment-designer/index.ts)
- [`packages/miroir-test-app_deployment-designer/tests/modelValidation.unit.test.ts`](../../../packages/miroir-test-app_deployment-designer/tests/modelValidation.unit.test.ts)

**Document role:** analysis and architectural decision record (decisions confirmed via grill-me, 2026-08-18).
**Status:** **implemented** (2026-08-18) — see [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## Decision record

| Decision | Choice |
|---|---|
| Data model | **FK already sufficient** — required `designerApplication` on Activity, UserStory, Role; no cross-FK validation |
| Application list/detail reports | **Fix/rename in place** — reuse UUIDs `951d74b2`, `f730ecf1`; wire to Designer selfApplication |
| Navigation hub | **Designer Applications menu item first**, then Roles, Activities, User Stories |
| Global list reports | **Keep unfiltered extractors** — cross-app overview; show `designerApplication` as first column |
| Global Roles menu | **Keep** — CRUD for Role entity rows per app |
| DesignerApplication details — roles section | **Derived from user stories** — distinct `userStory.role` values, not a Role-entity combiner |
| DesignerApplication details layout | **Composite report** — instance header + 3 scoped list sections |
| Details section order | Header → Activities → User Stories → derived Roles |
| List column order | **`designerApplication` first** in `viewAttributes` on Activity, UserStory, Role |
| Acceptance seed data | **Designer populated** (`880831db-…`) + **Library empty** (`5af03c98-…`) |

**Rationale:** The FK was introduced when the entity was renamed UserStory and DesignerApplication was modelled, but reports were never updated for multi-app navigation. Reusing report UUIDs preserves `defaultInstanceDetailsReportUuid` on the DesignerApplication entity. Cross-app lists remain useful for analysts working across apps; the DesignerApplications hub provides per-app drill-down.

### D1 — Application reports: fix vs new UUIDs

**Status:** Accepted — fix/rename existing reports (D1-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Fix/rename `ApplicationList` / `ApplicationDetails`** ★ | Same UUIDs; correct `selfApplication`, `parentName`, labels; expand details | Entity `defaultInstanceDetailsReportUuid` unchanged; no orphan references | Misleading historical names in git history |
| D1-b. New `DesignerApplicationList` / `Details` | Fresh UUIDs | Clean naming from day one | Must update entity default report UUID; migrate menu links |

**Decision:** D1-a.

### D2 — DesignerApplication details — roles section semantics

**Status:** Accepted — roles derived from user stories (D2-c).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. All Role entity rows for app | `combinerOneToMany` on `role.designerApplication` | Simple combiner | Shows unused roles |
| D2-b. Distinct roles referenced by user stories | Runtime transformer over scoped user stories + roles index | Matches “roles of user stories” wording | More transformer JSON |
| **D2-c. Same as D2-b; no standalone Role list on details** ★ | Derived list only on details; global RoleList for CRUD | Clear separation browse vs define | Two ways to see roles |

**Decision:** D2-c.

### D3 — Global Roles menu

**Status:** Accepted — keep global RoleList with app column (D3-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Keep Roles menu item** ★ | Unchanged menu entry; `viewAttributes` reorder | Supports defining roles before user stories exist | Slight overlap with derived roles on details |
| D3-b. Remove Roles menu | Roles only on DesignerApplication details | Single navigation path | Cannot create roles independently |

**Decision:** D3-a.

---

## 1. Goals

1. **Per-app requirements hub** — menu lists DesignerApplications; detail report shows that app’s activities, user stories, and roles used by those user stories.
2. **Cross-app overview** — global Activities, User Stories, and Roles lists remain, with DesignerApplication visible as the first column.
3. **Correct report wiring** — application list/detail reports target the Designer selfApplication and `DesignerApplication` entity (not Admin / `"Application"`).
4. **Acceptance proof** — Designer app instance has requirements data; Library instance exists with none.

## 2. Non-goals

- Cross-FK consistency (e.g. `userStory.activity.designerApplication` must match `userStory.designerApplication`) — unscheduled.
- Seeding requirements for Admin, Postgres, or Miroir DesignerApplication rows — only Designer + Library needed for acceptance.
- New report UUIDs for application list/details.
- Multi-application sidebar rendering — structural prep only; runtime wiring is #240 follow-up territory.
- TypeScript / standalone-app code changes unless report execution exposes a gap (expected: JSON-only in deployment package).

---

## 3. Current state

Inventory produced programmatically from `packages/miroir-test-app_deployment-designer/assets/` (2026-08-18).

### 3.1 Data model (**aligned**)

| Entity | UUID | `designerApplication` FK | Optional? | `defaultInstanceDetailsReportUuid` |
|--------|------|--------------------------|-----------|-------------------------------------|
| DesignerApplication | `25d935e7-9e93-42c2-aade-0472b883492b` | n/a (is the target) | — | `f730ecf1-88b6-46ea-8147-aa24ff7cdfcf` |
| Activity | `fd622624-1a7e-46fa-9964-c4ecfb543de3` | → `25d935e7` | **required** | `27204998-2a4c-4ae0-b867-c145df0e599b` |
| UserStory | `59debf06-405d-4def-a7eb-3db45360310d` | → `25d935e7` | **required** | `ee31f325-3e77-46b7-a3dd-025ed33c4b0d` |
| Role | `702535cd-e6fa-49d6-aa6f-b5874821e5a3` | → `25d935e7` | **required** | `b061a485-ff8f-4273-ae03-9c699c370258` |

All requirements data instances today reference **`880831db-4f76-40b1-97c0-6a2f3f4ffccb`** (Designer): 3 Activities, 5 UserStories, 3 Roles. No Activity/UserStory/Role rows reference Library (`5af03c98-…`) or other DesignerApplication instances.

DesignerApplication **data** instances (5):

| UUID | name | selfApplication |
|------|------|-----------------|
| `880831db-4f76-40b1-97c0-6a2f3f4ffccb` | Designer | same |
| `5af03c98-fe5e-490b-b08f-e1230971c57f` | Library | same |
| `55af124e-8c05-4bae-a3ef-0933d41daa92` | Admin | same |
| `84d28eb1-d98a-499e-bf24-62cade033da6` | Postgres | same |
| `360fcf1f-f0d4-4f8a-9262-07886e70fa15` | Miroir | same |

Designer **shell** selfApplication: `880831db-4f76-40b1-97c0-6a2f3f4ffccb` (name `Designer` in `designer_model/a659d350-…/880831db-….json`).

### 3.2 Entity `viewAttributes` (**misaligned** for list column order)

| Entity | `designerApplication` position | Current order (abbrev.) |
|--------|-------------------------------|-------------------------|
| Activity | **4 / 5** | name, defaultLabel, description, **designerApplication**, uuid |
| UserStory | **9 / 10** | name, …, activity, **designerApplication**, uuid |
| Role | **4 / 5** | name, defaultLabel, description, **designerApplication**, uuid |

Target: **`designerApplication` first** on all three.

### 3.3 Menu `DesignerMenu` (**misaligned**)

File: `designer_model/dde4c883-…/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json`

Section **Requirements** — **3 items** today (no DesignerApplications entry):

| label | reportUuid | section | menuItemScope |
|-------|------------|---------|---------------|
| Roles | `87f62ef5-913a-4652-b331-c126ff0e4fdb` | data | absent |
| Activities | `1366684b-e0c0-4c91-9496-dccd97d9a28d` | data | absent |
| User Stories | `7f037bbb-3a5a-4111-b8ec-85ef756c9ff2` | data | absent |

Target: **4 items** — Designer Applications first (report `951d74b2` after fix), then Roles, Activities, User Stories.

### 3.4 Reports (**mixed**)

Eight report JSON files on disk under `designer_model/3f2baa83-…/`:

| Report | UUID | selfApplication | Extractors / combiners | Scoped by `designerApplication`? |
|--------|------|-----------------|------------------------|-----------------------------------|
| ActivityList | `1366684b-…` | `880831db` | `activities` → all Activity | **No** |
| ActivityDetails | `27204998-…` | `880831db` | PK activity + `combinerOneToMany` userStories by **activity** | By activity FK (implicit) |
| UserStoryList | `7f037bbb-…` | `880831db` | all UserStory + Role; `userStoriesWithUserStory` RT | **No** |
| UserStoryDetails | `ee31f325-…` | `880831db` | PK userStory | n/a |
| RoleList | `87f62ef5-…` | `880831db` | all Role | **No** |
| RoleDetails | `b061a485-…` | `880831db` | PK role | n/a |
| ApplicationList | `951d74b2-…` | **`55af124e` (Admin)** | all rows; `parentName: "Application"` | **Miswired** |
| ApplicationDetails | `f730ecf1-…` | **`55af124e` (Admin)** | PK only; `parentName: "Application"` | **Miswired**; no sub-lists |

**Reuse pattern for scoped lists:** `ActivityDetails` already combines an instance extractor with `combinerOneToMany` filtering UserStories by FK attribute:

```json
"userStoriesOfActivity": {
  "extractorOrCombinerType": "combinerOneToMany",
  "parentName": "UserStory",
  "parentUuid": "59debf06-405d-4def-a7eb-3db45360310d",
  "objectReference": "activity",
  "AttributeOfListObjectToCompareToReferenceUuid": "activity"
}
```

`DesignerApplicationDetails` should mirror this with `objectReference: "application"` (or renamed context key) and `AttributeOfListObjectToCompareToReferenceUuid: "designerApplication"` for Activities and UserStories.

**User story formatting:** reuse `UserStoryList` / `ActivityDetails` runtime transformer `userStoriesWithUserStory` (mustache template on benefit/goal + role name from `rolesIndex`).

**Derived roles:** no existing report implements “distinct roles from user story FKs”; new runtime transformer chain on `DesignerApplicationDetails` (map user stories → role UUIDs → dedupe → join `rolesIndex`).

### 3.5 Package exports (**misaligned** naming)

[`index.ts`](../../../packages/miroir-test-app_deployment-designer/index.ts) still exports `reportApplicationList` / `reportApplicationDetails` and does not export ActivityList, UserStoryList, or ActivityDetails (reports exist as assets only).

---

## 4. Key reuse

| Piece | Location / UUID |
|-------|-----------------|
| Entity DesignerApplication | `25d935e7-9e93-42c2-aade-0472b883492b` |
| Designer selfApplication (shell) | `880831db-4f76-40b1-97c0-6a2f3f4ffccb` |
| ActivityList (global, keep) | `1366684b-e0c0-4c91-9496-dccd97d9a28d` |
| UserStoryList (global, keep) | `7f037bbb-3a5a-4111-b8ec-85ef756c9ff2` |
| RoleList (global, keep) | `87f62ef5-913a-4652-b331-c126ff0e4fdb` |
| ActivityDetails combiner pattern | `27204998-2a4c-4ae0-b867-c145df0e599b` |
| UserStory mustache RT pattern | `7f037bbb-…` / `27204998-…` → `userStoriesWithUserStory` |
| Application list/detail (fix in place) | `951d74b2-…`, `f730ecf1-…` |
| Menu | `dd168e5a-2a21-4d2d-a443-032c6d15eb22` |
| Model validation tests | `tests/modelValidation.unit.test.ts` |
| Empty acceptance DesignerApplication | Library `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Populated acceptance DesignerApplication | Designer `880831db-4f76-40b1-97c0-6a2f3f4ffccb` |

---

## 5. Proposals / target design

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Reorder `viewAttributes` on Activity, UserStory, Role | Low — display only | Low | **Adopt** |
| 2 | Fix `ApplicationList` / `ApplicationDetails` wiring + rename | High — unblocks hub navigation | Medium | **Adopt** |
| 3 | Expand `ApplicationDetails` → composite `DesignerApplicationDetails` | High — core UX | Medium | **Adopt** |
| 4 | Add Designer Applications menu item (first) | Medium | Low | **Adopt** |
| 5 | Filter global list extractors by parameter | Medium | Medium | **Reject** — keep global unfiltered lists per D3/global lists decision |
| 6 | New report UUIDs for application list/details | Low | Medium | **Reject** — reuse UUIDs per D1 |
| 7 | MiroirTest integration for scoped report execution | Medium | Medium | **Defer** to tdd plan — start with modelValidation + manual |

### 5.1 Target menu (4 items)

| Order | Menu label | Report | UUID |
|------|------------|--------|------|
| 1 | Designer Applications | DesignerApplicationList | `951d74b2-…` |
| 2 | Roles | RoleList | `87f62ef5-…` |
| 3 | Activities | ActivityList | `1366684b-…` |
| 4 | User Stories | UserStoryList | `7f037bbb-…` |

### 5.2 Target `DesignerApplicationDetails` sections

| Order | Section type | Data source |
|------|--------------|-------------|
| 1 | `objectInstanceReportSection` | PK extractor on DesignerApplication |
| 2 | `objectListReportSection` | `combinerOneToMany` Activity where `activity.designerApplication` = instance |
| 3 | `objectListReportSection` | `combinerOneToMany` UserStory + `userStoriesWithUserStory` RT |
| 4 | `objectListReportSection` | Derived distinct roles from section 3 user stories |

### 5.3 Target `DesignerApplicationList` fixes

- `name` → `DesignerApplicationList`; labels → "Designer Applications"
- `selfApplication` → `880831db-4f76-40b1-97c0-6a2f3f4ffccb`
- `parentName` / section parent → `DesignerApplication` (entity uuid `25d935e7-…`)
- `index.ts` exports → `reportDesignerApplicationList`, `reportDesignerApplicationDetails`

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
