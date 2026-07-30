# 225 — Versioning UI (freeze Runner + Versioning report)

> Operator UI to freeze the current present model into a named Application Version and
> browse existing versions — consuming the freeze primitive from **#216**.

Related issue: https://github.com/miroir-framework/miroir/issues/225  
Prerequisite: [#216 Freeze Application Versions](https://github.com/miroir-framework/miroir/issues/216) ✅  
Later consumers: [#9 WP2](https://github.com/miroir-framework/miroir/issues/9) · [#215](https://github.com/miroir-framework/miroir/issues/215)

Working branch: `cursor/versioning-ui-freeze-report-2a38`

**Status:** ✅ implemented — Phases 0–6 complete on `cursor/versioning-ui-freeze-report-2a38` (PR #226).

TDD plan: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md)

### Delivered surfaces

| Surface | Uuid / key |
|---------|------------|
| Freeze Runner | `20d51c4c-52e5-4077-baf3-5e87bd75e496` / `freezeApplicationVersion` |
| runnerTest suite | `967eff73-…` / `runner_freeze_application_version` |
| ApplicationVersionDetails | `17e78252-2540-4003-9305-d85c0c02d7ba` |
| Versioning report | `c2b89408-bed7-473d-ab0a-2f4adc6a85e1` |
| AppBar | `commit` → Versioning via `applicationSelector` |
| Nonreg | `integ-runner-runner_freeze_application_version` (filesystem) |

### Tracer (filesystem / manual)

1. Sidebar → select Library (versioned).
2. AppBar `commit` → Versioning report for Library.
3. Freeze form must load (not stuck on “Loading runner definition…” — Runner is fetched from Miroir while SAV list stays Library-scoped).
4. Freeze `UI-V1` via Runner → list shows V1; empty `modelCUDMigration`.
5. Alter Entity; freeze `UI-V2` → list shows both; V2 details: `previousVersion` + diff.
6. Open V1 details → unchanged by live edits (#216 isolation).

Automated tracer equivalent: `runner_freeze_application_version` integ (V1 baseline + V1→alter→V2).

**Runtime fix (runner load):** `resolveRunnerDefinitionApplication` / `useRunner` always load Runner instances from Miroir data, even when the Versioning page application is Library.

---

## 1. Goals

1. **Freeze Runner** invoking Model Endpoint `freezeApplicationVersion`.
2. **AppBar** `commit` icon → **Versioning** report.
3. Versioning report scoped to **sidebar-selected application**.
4. Report shows freeze Runner + Application Version list; row → details report.
5. **runnerTest** MiroirTest integ suite for the freeze Runner.

## 2. Non-goals

- Re-implement freeze / tip / diff (#216).
- WP2 apply / rollback UI; paired data migrations; non-Entity snapshots; Option B.

## 3. Key reuse

| Piece | Location |
|-------|----------|
| Freeze planner / Action | `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` |
| Model Endpoint | `7947ae40-eb34-4149-887b-15a9021e714e` |
| Runner templates | `createEntity` / `dropEntity` under Runner Entity `e54d7dc1-…` |
| runnerTest pattern | suite `runner_create_entity` (`4b4645f5-…`) |
| actionTest freeze suite | `domain_controller_application_version_freeze` (`d7e9f81b-…`) |
| AppBar report link | `AppBar.tsx` `miroirMenuReportLink` |
| SAV Entity | `c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24` |
| Existing AV list | `ApplicationVersionList` `0810de28-…` |
| Current application | `Sidebar` / `toolsPageState.applicationSelector` |

## 4. Suggested slices

1. Freeze Runner + registry + runnerTest integ.
2. Application Version details report (+ `defaultInstanceDetailsReportUuid` on SAV).
3. Versioning report (runner + filtered list + drill-down).
4. AppBar `commit` → Versioning report (current-application aware).
5. Docs + nonreg / MiroirTest wiring.

Full acceptance criteria: issue **#225**.
