# 234 — Analysis: versioning modes and deployment asset alignment

## Summary

Issue #232 (closed) made `modelVersion` a first-class runtime storage section and routed all `versionHistoryEntityUuids` there on read/write/freeze. **Static deployment assets, package exports, and bundled import logic were not migrated.** They still place version-history entity *instances* under `data` or `model`, contradicting runtime routing and the documented architecture.

Issue 234 introduces explicit **versioning modes** (`unversioned`, `versioned-internal`, `versioned-external`) and performs a **partial migration of the Miroir self-application deployment package**: relocate Version History instances from `miroir_data/` into a new **`assets/miroir_modelVersion/`** tree aligned with the storage section.

Related:

- GitHub issue: https://github.com/miroir-framework/miroir/issues/234
- Prerequisite (closed): dedicated `modelVersion` section (#232)
- Design doc: [`docs/getting-started/bundles-and-versioning.md`](../../../docs/getting-started/bundles-and-versioning.md)
- Runtime section registry: [`packages/miroir-core/src/1_core/Model.ts`](../../../packages/miroir-core/src/1_core/Model.ts) (`versionHistoryEntityUuids`, `getApplicationSection`)
- Stale bundled wiring: [`packages/miroir-sandbox/src/bundledData.ts`](../../../packages/miroir-sandbox/src/bundledData.ts)

---

## Decision record

| Decision | Choice |
|---|---|
| Miroir self-app deployment package mode | **`versioned-internal`** — version history is managed **within the Miroir framework** via the `modelVersion` storage section (not external Git VCS) |
| Version History in git-tracked deployment assets | **Yes, allowed and intended** for filesystem-backed deployments: Version History instance JSON lives under **`assets/miroir_modelVersion/`**, not under `miroir_data/` or `miroir_model/` |
| What “internal” does *not* mean | It does **not** mean “no Version History in the repo” or “Version History only appears after runtime freeze.” Git may version the `modelVersion` directory like any other assets path; Miroir versioning features read/write those rows as **`modelVersion` section** instances, not as generic git history |
| First implementation slice | **Formal `versioningMode` + relocate Miroir Version History assets** (`miroir_data/` → `miroir_modelVersion/`); no long-lived fallback that reads Version History from legacy `data`/`model` paths |
| Bundled Miroir profile | **No `modelVersion` section** in bundled config — version-related features are **unavailable** in bundled/sandbox mode (live model + data only) |
| Other deployment packages | **Miroir only** gets full `versioned-internal` asset relocation. **Admin, library, designer, postgres** classified **`unversioned`** in Slice 6 (metadata + menus; no `*_modelVersion/` migration) |

**Rationale:** Runtime already routes Version History to `modelVersion`. Static assets must use the same section layout so filesystem seeding, store bootstrap, and git-tracked deployments agree with `getApplicationSection()`. The old `#222` layout (Version History under `miroir_data/`) is the bug, not the presence of Version History JSON in git.

---

## Versioning modes — corrected semantics

| Mode | Who owns version history? | Live model | Version History storage section | Version History in git deployment assets | Bundled profile |
|---|---|---|---|---|---|
| **unversioned** | none | `model` | not used | `*_model/` + `*_data/` only | model + data |
| **versioned-internal** | **Miroir framework** (`modelVersion` section) | `model` | **`modelVersion`** — freeze, query, rollback helpers use **stored Version History instances** | **`*_modelVersion/`** may exist and be git-tracked (e.g. `miroir_modelVersion/`) | typically **no** `modelVersion` — versioning features disabled |
| **versioned-external** | **External VCS (Git)** | `model` | not used for app versioning semantics | current model in `*_model/`; history = **git history of assets**, not Miroir Version History rows | model + data (no Miroir Version History) |

**Internal vs external** is about **which system Miroir consults** when assisting application versioning:

- **Internal:** Miroir reads/writes **`SelfApplicationVersion`, `EntityVersion`, … instances in `modelVersion`** (whether loaded from git-backed `assets/miroir_modelVersion/` or a runtime filesystem store).
- **External:** Miroir holds the **current** model; history and diffs come from **Git** (GitProxy, committed asset history), not from persisted Version History entity rows in a store section.

Git tracking the `modelVersion` folder is orthogonal: it is still **Miroir-managed Version History content** at rest in the deployment package, not “external” versioning.

---

## Current state after #232

### Runtime (aligned)

- `getApplicationSection()` checks `versionHistoryEntityUuids` **first** and returns `"modelVersion"` for 17 entity families.
- Freeze persists new history to `modelVersion` on writable backends.
- Bundled backend rejects **`modelVersion` writes**; bundled Miroir config omits the section entirely.

### Static assets & import (misaligned)

Deployment packages use **`*_model/` + `*_data/` only** — no `*_modelVersion/` yet. Version History **instances** sit in the wrong section:

| Deployment package | Version History instance folders (parent UUID) | Counts (indicative) | **Wrong location today** | **Target (versioned-internal)** |
|---|---|---|---|---|
| `miroir-test-app_deployment-miroir` | `54b9c72f…`, `c3f0facf…`, `e4320b9e…`, `3d8da4d4…` | 34+2+3+11 | `miroir_data/` | **`miroir_modelVersion/`** |
| `miroir-test-app_deployment-admin` | `54b9c72f…`, `c3f0facf…` | 8+1 | `admin_model/` | follow-up slice |
| `miroir-test-app_deployment-library` | … | 6+2 | `library_model/` | follow-up |
| `miroir-test-app_deployment-designer` | … | 5+1 | `designer_model/` | follow-up |
| `miroir-test-app_deployment-postgres` | … | 3+1 | `postgres_model/` | follow-up |

**Unchanged:** live **Entity** rows (metaclass definitions) stay in **`*_model/`** — e.g. `miroir_model/16dbfe28…/54b9c72f….json` is the Entity row for the EntityVersion *concept*, not a Version History instance row.

### Locked legacy tests (#222)

[`222.phase1.assets-layout.unit.test.ts`](../../../packages/miroir-core/tests/1_core/222-entityversion-to-miroir-data/222.phase1.assets-layout.unit.test.ts) asserts Version History under `miroir_data/`. Must be superseded by #234 locks asserting **`miroir_modelVersion/`** layout.

---

## Problem detail — Miroir package

### Export surface

[`index.ts`](../../../packages/miroir-test-app_deployment-miroir/index.ts) exports ~84 symbols from Version History paths under **`miroir_data/`**. Migration **repoints** exports to **`assets/miroir_modelVersion/<parentUuid>/`** (same instance UUIDs, new section directory).

### Instance categories to **relocate** (not delete)

Under `miroir_data/` today, grouped by role:

1. **Compatibility EntityVersion snapshots** — meta-model mirrors (Entity, Query, Endpoint, …) kept for legacy consumers; still Version History-shaped **instances** → **`modelVersion`**
2. **SelfApplicationVersion rows** — application version chain
3. **Historical*Version rows** — post-#230 history families

All move to **`miroir_modelVersion/`** with the same parentUuid folder structure. Present-model authority remains on **Entity** rows in `miroir_model/`.

**Validation:** bootstrap and nonreg must pass with Version History loaded from `modelVersion` on filesystem profiles, not from `data`.

### `bundledData.ts`

- **Writable / filesystem git-backed Miroir:** seed `modelVersion` from `miroir_modelVersion/` assets when config includes the section.
- **Bundled Miroir (demo):** **no `modelVersion` section** — do not import Version History into bundled store; versioning UI/actions unavailable (by design).
- Remove Version History from `data` classification entirely; stop `#222` “EntityVersion → data” rule for Miroir.

---

## Proposed inventory — all deployment packages

| Package | Mode | Version History asset home | Slice |
|---|---|---|---|
| `miroir-test-app_deployment-miroir` | **`versioned-internal`** | **`miroir_modelVersion/`** | **1–5 — done** |
| `miroir-test-app_deployment-admin` | **`unversioned`** | none (no freeze; present-model EV snapshots stay in `admin_model/`) | **6 — done** |
| `miroir-test-app_deployment-library` | **`unversioned`** | none | **6 — done** |
| `miroir-test-app_deployment-designer` | **`unversioned`** | none | **6 — done** |
| `miroir-test-app_deployment-postgres` | **`unversioned`** | none | **6 — done** |

Rationale for unversioned satellites: example / admin / fixture apps are git-shipped with a stable present model; in-app freeze and Application Version history UI are not needed. Miroir remains the sole **`versioned-internal`** reference deployment.

---

## Impact analysis

### 1. Schema & generated types

- Add `versioningMode`: `unversioned` | `versioned-internal` | `versioned-external`.
- Map legacy `versioningEnabled: true` + Miroir → `versioned-internal`.
- Freeze gate: internal + writable `modelVersion` required for freeze; bundled without section → versioning features disabled.

### 2. Miroir deployment package (slice 1)

- Create `assets/miroir_modelVersion/` mirroring entity-uuid folder layout.
- **Move** Version History JSON from `miroir_data/` (and any stray Version History under `miroir_model/` instances) into `miroir_modelVersion/`.
- Update `index.ts` export paths; keep symbols where still needed for package build / modelValidation.
- Filesystem store seeding: ensure deployment package build exposes `modelVersion` slice for non-bundled profiles.

### 3. Bundled / sandbox

- Bundled Miroir: **omit `modelVersion`** from `StoreUnitConfiguration`; `bundledData.ts` excludes Version History parents from model and data.
- Document: bundled = unversioned UX for Miroir self-app despite `versioningMode` on SelfApplication metadata.

### 4. Tests

| Area | Action |
|---|---|
| `#222` phase1 | Replace with #234: Version History under `miroir_modelVersion/`, absent from `miroir_data/` |
| Asset layout characterization | Automated inventory per package |
| Filesystem bootstrap | Load Version History from `modelVersion` section matches git assets |
| Bundled | Assert no modelVersion section; Version History queries empty / versioning disabled |
| `applicationVersionFreeze` integ | Unchanged — writable backends |

### 5. Documentation

- Clarify internal vs external in `bundles-and-versioning.md` and `data-architecture-deployments.md`.
- Document four-folder asset layout: `*_model/`, `*_data/`, optional `*_modelVersion/` for versioned-internal.

---

## Architectural options

### Option A — Relocate to `*_modelVersion/` assets (recommended)

Move Version History JSON to git-tracked `miroir_modelVersion/`; wire package exports and filesystem seeding; bundled stays without section.

**Pros:** Aligns git layout, runtime routing, and mode semantics.  
**Cons:** Large path churn in `index.ts`; must wire store bootstrap to read new asset tree.

### Option B — Runtime-only `modelVersion` (no asset folder)

Keep Version History only in runtime stores; delete from git assets.

**Pros:** Smaller git tree.  
**Cons:** **Rejected** — loses seed data; contradicts maintainer intent for git-backed internal Version History.

### Option C — Dual-read fallback from `data`

**Rejected** — hides misconfiguration; contradicts slice-1 decision.

---

## Recommended implementation slices

### Slice 0 — Characterization

- Tests lock current wrong layout vs target `miroir_modelVersion/` paths.
- Inventory all Version History parent folders per package.

### Slice 1 — Contract

- `versioningMode` on SelfApplication; Miroir → `versioned-internal`.

### Slice 2 — Miroir asset relocation

- `miroir_data/` Version History → `miroir_modelVersion/`; update exports and validation.
- Filesystem profile loads Version History from `modelVersion`.

### Slice 3 — Bundled alignment

- No modelVersion in bundled Miroir; versioning features off; `#222` tests retired.

### Slice 4+ — Other packages

- **Slice 6 (closed in #234):** admin, library, designer, postgres → **`unversioned`** (`versioningMode` on SelfApplication; strip version-history menu links; library bundled meta-model drops seeded `applicationVersions`).
- Future: reclassify a satellite app to `versioned-internal` only if product needs in-app freeze for that deployment package.

---

## Risks

| Risk | Mitigation |
|---|---|
| Filesystem seed not loading new `miroir_modelVersion/` tree | Integration test: compare instance counts asset dir ↔ store section |
| Code still imports old `miroir_data/54b9c72f…` paths | Ripgrep + update `index.ts` and consumers |
| Confusion between git versioning and `versioned-internal` | Document explicitly in mode matrix (this analysis) |
| Bundled users expect freeze/history | Document bundled limitation; writable profile required |

---

## Suggested validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-core -- 234.
npm run testByFile -w miroir-core -- modelVersionStorage.232
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem applicationVersionFreeze.integ
npm run nonreg -- --tier default
```

---

## Bottom line

**`versioned-internal`** means Miroir owns application version history in the **`modelVersion` storage section** — including, for the Miroir deployment package, a git-tracked **`assets/miroir_modelVersion/`** directory. #234 **relocates** Version History instances out of the wrong `miroir_data/` paths; it does **not** strip Version History from the Miroir repo. **Bundled Miroir** deliberately omits `modelVersion`, so versioning features are unavailable there.

**Satellite deployment packages** (admin, library, designer, postgres) are explicitly **`unversioned`**: no in-app freeze, no Application Versions / Entity Definitions menu entries; domain schema lives on **Entity** rows only (no per-entity EntityVersion JSON in git assets).

---

## Closing analysis (issue complete)

### Delivered

| Area | Outcome |
|---|---|
| **Contract** | `versioningMode` enum on SelfApplication; `resolveVersioningMode` / `assertApplicationVersioningEnabled` in `versioningMode.ts` |
| **Miroir assets** | Version History instances under `assets/miroir_modelVersion/`; absent from `miroir_data/` for VH parent UUIDs |
| **Filesystem** | Writable profiles seed and read Version History from `modelVersion` (integ tests green) |
| **Bundled Miroir** | No `modelVersion` section; VH excluded from bundled import |
| **Docs** | Mode matrix in `bundles-and-versioning.md` and `data-architecture-deployments.md` |
| **Miroir UI routing** | Entity Versions / Application Versions reports and menus use `modelVersion`; report query load includes combiner targets |
| **Satellite apps** | Admin, library, designer, postgres: `versioningMode: "unversioned"`; menus consistent; library `applicationVersions: []` |

### Acceptance criteria (GitHub issue)

- [x] `versioningMode` (3-valued) expressible on Application metadata with documented semantics
- [x] Miroir deployment no longer ships VH instance JSON under `miroir_data/` for version-history parents
- [x] Bundled demo config aligned with Miroir = `versioned-internal` trimmed assets
- [x] Non-regression tests: bundled load + writable freeze path (`versioningModes.234.*`, `modelVersionStorage.232`)
- [x] Application inventory completed for all `miroir-test-app_deployment-*` packages with **resolved** mode (not merely proposed)

### Known limitations (documented, not blockers)

- Unversioned apps use synthetic init-only `ApplicationVersion` objects in tests/init (not shipped as model assets).
- User-local stores with pre-#232 VH rows under `data`/`model` are not auto-migrated.
- `versioned-external` mode is defined but unused.
- Full default `npm run nonreg` had pre-existing failures unrelated to #234 (SQL freeze profile, absent integ manifest entry).

### Validation run at close

```bash
npm run testByFile -w miroir-core -- 234.
npm run testByFile -w miroir-core -- entityPresentModel.217.phase3
npm run build -w miroir-test-app_deployment-library
```
