# 234 — Analysis: versioning modes and deployment asset alignment

## Summary

Issue #232 (closed) made `modelVersion` a first-class runtime storage section and routed all `versionHistoryEntityUuids` there on read/write/freeze. **Static deployment assets, package exports, and bundled import logic were not migrated.** They still place version-history entity *instances* under `data` or `model`, contradicting runtime routing and the documented architecture.

Issue 234 introduces explicit **versioning modes** (`unversioned`, `versioned-internal`, `versioned-external`) and performs a **partial migration of the Miroir self-application deployment package**: relocate VH instances from `miroir_data/` into a new **`assets/miroir_modelVersion/`** tree aligned with the storage section.

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
| VH in git-tracked deployment assets | **Yes, allowed and intended** for filesystem-backed deployments: VH instance JSON lives under **`assets/miroir_modelVersion/`**, not under `miroir_data/` or `miroir_model/` |
| What “internal” does *not* mean | It does **not** mean “no VH in the repo” or “VH only appears after runtime freeze.” Git may version the `modelVersion` directory like any other assets path; Miroir versioning features read/write those rows as **`modelVersion` section** instances, not as generic git history |
| First implementation slice | **Formal `versioningMode` + relocate Miroir VH assets** (`miroir_data/` → `miroir_modelVersion/`); no long-lived fallback that reads VH from legacy `data`/`model` paths |
| Bundled Miroir profile | **No `modelVersion` section** in bundled config — version-related features are **unavailable** in bundled/sandbox mode (live model + data only) |
| Other deployment packages | **Inventory + proposed mode** in this analysis; asset relocation deferred to follow-up slices |

**Rationale:** Runtime already routes VH to `modelVersion`. Static assets must use the same section layout so filesystem seeding, store bootstrap, and git-tracked deployments agree with `getApplicationSection()`. The old `#222` layout (VH under `miroir_data/`) is the bug, not the presence of VH JSON in git.

---

## Versioning modes — corrected semantics

| Mode | Who owns version history? | Live model | VH storage section | VH in git deployment assets | Bundled profile |
|---|---|---|---|---|---|
| **unversioned** | none | `model` | not used | `*_model/` + `*_data/` only | model + data |
| **versioned-internal** | **Miroir framework** (`modelVersion` section) | `model` | **`modelVersion`** — freeze, query, rollback helpers use **stored VH instances** | **`*_modelVersion/`** may exist and be git-tracked (e.g. `miroir_modelVersion/`) | typically **no** `modelVersion` — versioning features disabled |
| **versioned-external** | **External VCS (Git)** | `model` | not used for app versioning semantics | current model in `*_model/`; history = **git history of assets**, not Miroir VH rows | model + data (no Miroir VH) |

**Internal vs external** is about **which system Miroir consults** when assisting application versioning:

- **Internal:** Miroir reads/writes **`SelfApplicationVersion`, `EntityVersion`, … instances in `modelVersion`** (whether loaded from git-backed `assets/miroir_modelVersion/` or a runtime filesystem store).
- **External:** Miroir holds the **current** model; history and diffs come from **Git** (GitProxy, committed asset history), not from persisted VH entity rows in a store section.

Git tracking the `modelVersion` folder is orthogonal: it is still **Miroir-managed VH content** at rest in the deployment package, not “external” versioning.

---

## Current state after #232

### Runtime (aligned)

- `getApplicationSection()` checks `versionHistoryEntityUuids` **first** and returns `"modelVersion"` for 17 entity families.
- Freeze persists new history to `modelVersion` on writable backends.
- Bundled backend rejects **`modelVersion` writes**; bundled Miroir config omits the section entirely.

### Static assets & import (misaligned)

Deployment packages use **`*_model/` + `*_data/` only** — no `*_modelVersion/` yet. VH **instances** sit in the wrong section:

| Deployment package | VH instance folders (parent UUID) | Counts (indicative) | **Wrong location today** | **Target (versioned-internal)** |
|---|---|---|---|---|
| `miroir-test-app_deployment-miroir` | `54b9c72f…`, `c3f0facf…`, `e4320b9e…`, `3d8da4d4…` | 34+2+3+11 | `miroir_data/` | **`miroir_modelVersion/`** |
| `miroir-test-app_deployment-admin` | `54b9c72f…`, `c3f0facf…` | 8+1 | `admin_model/` | follow-up slice |
| `miroir-test-app_deployment-library` | … | 6+2 | `library_model/` | follow-up |
| `miroir-test-app_deployment-designer` | … | 5+1 | `designer_model/` | follow-up |
| `miroir-test-app_deployment-postgres` | … | 3+1 | `postgres_model/` | follow-up |

**Unchanged:** live **Entity** rows (metaclass definitions) stay in **`*_model/`** — e.g. `miroir_model/16dbfe28…/54b9c72f….json` is the Entity row for the EntityVersion *concept*, not a VH instance row.

### Locked legacy tests (#222)

[`222.phase1.assets-layout.unit.test.ts`](../../../packages/miroir-core/tests/1_core/222-entityversion-to-miroir-data/222.phase1.assets-layout.unit.test.ts) asserts VH under `miroir_data/`. Must be superseded by #234 locks asserting **`miroir_modelVersion/`** layout.

---

## Problem detail — Miroir package

### Export surface

[`index.ts`](../../../packages/miroir-test-app_deployment-miroir/index.ts) exports ~84 symbols from VH paths under **`miroir_data/`**. Migration **repoints** exports to **`assets/miroir_modelVersion/<parentUuid>/`** (same instance UUIDs, new section directory).

### Instance categories to **relocate** (not delete)

Under `miroir_data/` today, grouped by role:

1. **Compatibility EntityVersion snapshots** — meta-model mirrors (Entity, Query, Endpoint, …) kept for legacy consumers; still VH-shaped **instances** → **`modelVersion`**
2. **SelfApplicationVersion rows** — application version chain
3. **Historical*Version rows** — post-#230 history families

All move to **`miroir_modelVersion/`** with the same parentUuid folder structure. Present-model authority remains on **Entity** rows in `miroir_model/`.

**Validation:** bootstrap and nonreg must pass with VH loaded from `modelVersion` on filesystem profiles, not from `data`.

### `bundledData.ts`

- **Writable / filesystem git-backed Miroir:** seed `modelVersion` from `miroir_modelVersion/` assets when config includes the section.
- **Bundled Miroir (demo):** **no `modelVersion` section** — do not import VH into bundled store; versioning UI/actions unavailable (by design).
- Remove VH from `data` classification entirely; stop `#222` “EntityVersion → data” rule for Miroir.

---

## Proposed inventory — all deployment packages

| Package | Proposed mode | VH asset home (when internal) | Slice |
|---|---|---|---|
| `miroir-test-app_deployment-miroir` | **`versioned-internal`** | **`miroir_modelVersion/`** | **1 — relocate** |
| `miroir-test-app_deployment-admin` | `versioned-external` (proposed) | no Miroir VH section; git tracks current model | 2+ |
| `miroir-test-app_deployment-library` | `versioned-external` (proposed) | same | 2+ |
| `miroir-test-app_deployment-designer` | `versioned-external` (proposed) | same | 2+ |
| `miroir-test-app_deployment-postgres` | fixture-specific | TBD | 2+ |

---

## Impact analysis

### 1. Schema & generated types

- Add `versioningMode`: `unversioned` | `versioned-internal` | `versioned-external`.
- Map legacy `versioningEnabled: true` + Miroir → `versioned-internal`.
- Freeze gate: internal + writable `modelVersion` required for freeze; bundled without section → versioning features disabled.

### 2. Miroir deployment package (slice 1)

- Create `assets/miroir_modelVersion/` mirroring entity-uuid folder layout.
- **Move** VH JSON from `miroir_data/` (and any stray VH under `miroir_model/` instances) into `miroir_modelVersion/`.
- Update `index.ts` export paths; keep symbols where still needed for package build / modelValidation.
- Filesystem store seeding: ensure deployment package build exposes `modelVersion` slice for non-bundled profiles.

### 3. Bundled / sandbox

- Bundled Miroir: **omit `modelVersion`** from `StoreUnitConfiguration`; `bundledData.ts` excludes VH parents from model and data.
- Document: bundled = unversioned UX for Miroir self-app despite `versioningMode` on SelfApplication metadata.

### 4. Tests

| Area | Action |
|---|---|
| `#222` phase1 | Replace with #234: VH under `miroir_modelVersion/`, absent from `miroir_data/` |
| Asset layout characterization | Automated inventory per package |
| Filesystem bootstrap | Load VH from `modelVersion` section matches git assets |
| Bundled | Assert no modelVersion section; VH queries empty / versioning disabled |
| `applicationVersionFreeze` integ | Unchanged — writable backends |

### 5. Documentation

- Clarify internal vs external in `bundles-and-versioning.md` and `data-architecture-deployments.md`.
- Document four-folder asset layout: `*_model/`, `*_data/`, optional `*_modelVersion/` for versioned-internal.

---

## Architectural options

### Option A — Relocate to `*_modelVersion/` assets (recommended)

Move VH JSON to git-tracked `miroir_modelVersion/`; wire package exports and filesystem seeding; bundled stays without section.

**Pros:** Aligns git layout, runtime routing, and mode semantics.  
**Cons:** Large path churn in `index.ts`; must wire store bootstrap to read new asset tree.

### Option B — Runtime-only `modelVersion` (no asset folder)

Keep VH only in runtime stores; delete from git assets.

**Pros:** Smaller git tree.  
**Cons:** **Rejected** — loses seed data; contradicts maintainer intent for git-backed internal VH.

### Option C — Dual-read fallback from `data`

**Rejected** — hides misconfiguration; contradicts slice-1 decision.

---

## Recommended implementation slices

### Slice 0 — Characterization

- Tests lock current wrong layout vs target `miroir_modelVersion/` paths.
- Inventory all VH parent folders per package.

### Slice 1 — Contract

- `versioningMode` on SelfApplication; Miroir → `versioned-internal`.

### Slice 2 — Miroir asset relocation

- `miroir_data/` VH → `miroir_modelVersion/`; update exports and validation.
- Filesystem profile loads VH from `modelVersion`.

### Slice 3 — Bundled alignment

- No modelVersion in bundled Miroir; versioning features off; `#222` tests retired.

### Slice 4+ — Other packages

- Per inventory; external apps likely remove VH from `*_model/` rather than add `*_modelVersion/`.

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

**`versioned-internal`** means Miroir owns application version history in the **`modelVersion` storage section** — including, for the Miroir deployment package, a git-tracked **`assets/miroir_modelVersion/`** directory. #234 **relocates** VH instances out of the wrong `miroir_data/` (and similar) paths; it does **not** strip VH from the repo. **Bundled Miroir** deliberately omits `modelVersion`, so versioning features are unavailable there. **Slice 1** scopes relocation to the Miroir package only.
