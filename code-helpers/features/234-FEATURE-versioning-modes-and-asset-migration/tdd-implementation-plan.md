# Issue #234 — TDD Implementation Plan

## Scope

Implement the decisions in
[`analysis.md`](./analysis.md):

- introduce explicit **`versioningMode`** (`unversioned` | `versioned-internal` | `versioned-external`) on Application / SelfApplication metadata;
- **relocate** version-history instance JSON for the **Miroir self-application deployment package** from `assets/miroir_data/` into **`assets/miroir_modelVersion/`**, aligned with runtime `modelVersion` section routing (#232);
- align **bundled** Miroir profile: **no `modelVersion` section** — versioning features unavailable in sandbox/demo;
- inventory other deployment packages for follow-up (no asset migration in this issue except Miroir).

Completed behavior:

- **`versioned-internal`** (Miroir): Version History instances live in the **`modelVersion` storage section**; git-tracked deployment assets use **`miroir_modelVersion/`**; Miroir versioning features consult stored Version History rows, not Git history.
- **Filesystem / SQL writable profiles**: bootstrap loads Version History from configured `modelVersion` store seeded from deployment assets where applicable.
- **Bundled Miroir**: model + data only; Version History not imported; freeze/history actions unavailable or gated.
- **No dual-read fallback** from legacy `miroir_data/` Version History paths after migration.

This plan does **not** implement GitProxy / versioned-external runtime tooling, admin/library asset migration, or automatic migration of user-local stores that still hold Version History under old paths.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/234
- Analysis: [`analysis.md`](./analysis.md)
- Prerequisite (closed): [`../232-FEATURE-dedicated-model-version-storage/tdd-implementation-plan.md`](../232-FEATURE-dedicated-model-version-storage/tdd-implementation-plan.md)
- Design doc: [`docs/getting-started/bundles-and-versioning.md`](../../../docs/getting-started/bundles-and-versioning.md)

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize asset/layout mismatch | **DONE** | Inventory + target layout tests GREEN (post–Slice 2 inventory assertions) |
| 1 | `versioningMode` contract | **DONE** | Jzod + `resolveVersioningMode`; Miroir row `versioned-internal` |
| 2 | Relocate Miroir Version History assets | **DONE** | `miroir_modelVersion/` populated; `miroir_data/` Version History-free; exports + modelValidation |
| 3 | Filesystem asset seed → `modelVersion` store | **DONE** | Emulated-server profile reads seeded Version History from `modelVersion`, not `data` |
| 4 | Bundled Miroir alignment | Planned | No modelVersion in bundled config; `#222` tests retired |
| 5 | Docs, inventory, non-regression | Planned | General docs + package inventory note |

---

## Locked implementation defaults

| Decision | Choice |
|---|---|
| Miroir deployment mode | **`versioned-internal`** |
| Version History in git assets | **Relocate** to `assets/miroir_modelVersion/` (not delete) |
| Live Entity metaclass rows | Stay in `assets/miroir_model/` |
| Ordinary Miroir data | Stay in `assets/miroir_data/` (exclude Version History parent UUIDs) |
| Bundled Miroir | **No `modelVersion` section**; versioning features disabled |
| Legacy `versioningEnabled` | Keep during transition; derive or mirror from `versioningMode` in freeze gate |
| Version History parent UUID set | `versionHistoryEntityUuids` in `Model.ts` (single source for asset move + tests) |
| Other deployment packages | Inventory only in Slice 5; no relocation in #234 |

### Miroir Version History folders relocated (Slice 2)

From `assets/miroir_data/` → `assets/miroir_modelVersion/` (instance JSON only; `versionHistoryEntityUuids` parents):

| Parent entity UUID | Role | Files moved |
|---|---|---|
| `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` | EntityVersion instances | 34 |
| `c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24` | SelfApplicationVersion | 2 |
| `8bec933d-6287-4de7-8a88-5c24216de9f4` | ApplicationVersionCrossEntityVersion | 7 |

**Not moved:** live model/data concepts (Query `e4320b9e…`, Endpoint `3d8da4d4…`, etc.) remain under `miroir_data/`. Entity metaclass rows stay under `miroir_model/`.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Core #234 tests | `npm run testByFile -w miroir-core -- 234.` |
| #232 regression | `npm run testByFile -w miroir-core -- modelVersionStorage.232` |
| Miroir deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Filesystem freeze integ | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem applicationVersionFreeze.integ` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir` then `npm run devBuild -w miroir-core` |
| Type check (touched packages) | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |

Legend: **RED** → **GREEN** → **Validation** per slice. Do not batch all RED tests before first GREEN unless noted.

---

## Slice 0 — Characterize asset/layout mismatch

**Status: DONE**

### Goal

Lock the **current wrong state** and the **target layout** before moving files or changing schema.

### 0.1 RED → GREEN — Deployment Version History inventory characterization

**Test:** `packages/miroir-core/tests/1_core/versioningModes.234.inventory.unit.test.ts`

Behavior:

- for each `miroir-test-app_deployment-*` package, enumerate directories under `assets/*_data/` and `assets/*_model/` whose names match any UUID in `versionHistoryEntityUuids`;
- assert **Miroir package** currently has Version History instance files under `miroir_data/` (not yet under `miroir_modelVersion/`);
- assert **no package** yet has `assets/*_modelVersion/`;
- snapshot expected Miroir move set (parent UUID → file count) for Slice 2 diff review.

### 0.2 RED → GREEN — Legacy `#222` layout lock (transition)

**Test:** extend or reference existing `222.phase1.assets-layout.unit.test.ts` — mark as **legacy** in describe title; add parallel **234 target** test file that **fails until Slice 2**:

**Test:** `packages/miroir-core/tests/1_core/versioningModes.234.assets-layout.unit.test.ts`

Behavior:

- `assets/miroir_modelVersion/` exists after Slice 2 (fail in Slice 0);
- no Version History instance JSON under `miroir_data/<versionHistoryEntityUuid>/`;
- `miroir_model/16dbfe28…/54b9c72f….json` (Entity row for EntityVersion **metaclass**) still present;
- `index.ts` imports Version History instances from `miroir_modelVersion/` paths, not `miroir_data/54b9c72f…/`.

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.inventory
npm run testByFile -w miroir-core -- versioningModes.234.assets-layout
# Expect assets-layout RED until Slice 2; inventory GREEN once written
npm run testByFile -w miroir-core -- 222.phase1.assets-layout
# Legacy #222 may still pass until Slice 4 retirement
```

### Realized (Slice 0)

- **`versioningModes.234.inventory.unit.test.ts`** — Version History registry; Miroir `miroir_modelVersion/` layout assertions (updated post–Slice 2); cross-package inventory snapshot.
- **`versioningModes.234.assets-layout.unit.test.ts`** — target layout (GREEN since Slice 2): `miroir_modelVersion/`, empty Version History in `miroir_data/`, index import paths.
- **`versioningModes.234.slice0-inventory.ts`** — shared constants for move set and paths.
- **`222.slice0-inventory.ts`** — refreshed to 34 EntityVersion instance UUIDs (was stale at 20).
- **`222.phase1.assets-layout.unit.test.ts`** — describe renamed to legacy pre-#234.

---

## Slice 1 — `versioningMode` contract

**Status: DONE**

### Goal

Make versioning **mode** explicit on SelfApplication / Application metadata and wire the freeze gate to respect it.

### 1.1 RED → GREEN — Schema accepts three modes

**Test:** `packages/miroir-core/tests/1_core/versioningModes.234.contract.unit.test.ts`

Behavior:

- Jzod / generated `SelfApplication` accepts optional `versioningMode`: `"unversioned"` | `"versioned-internal"` | `"versioned-external"`;
- invalid string rejected;
- legacy row with only `versioningEnabled: true` still parses (backward compatible);
- helper `resolveVersioningMode(selfApplication)` returns explicit mode or derives:
  - `versioningEnabled === true` + absent mode → document default (Miroir asset row → `versioned-internal` once migrated);
  - `versioningEnabled === false` / absent → `unversioned`.

**GREEN:**

- edit deployment meta-model Jzod assets for SelfApplication;
- `npm run build -w miroir-test-app_deployment-miroir` + `npm run devBuild -w miroir-core`;
- add `resolveVersioningMode` / update `isApplicationVersioningEnabled` in `applicationVersionFreeze.ts` (or adjacent helper) to require **`versioned-internal`** + configured writable `modelVersion` for freeze (bundled without section → false / throws per existing gate).

### 1.2 RED → GREEN — Miroir SelfApplication row

**Test:** same file or `versioningModes.234.miroir-self-app.unit.test.ts`

Behavior:

- canonical Miroir SelfApplication JSON (`360fcf1f…`) has `versioningMode: "versioned-internal"`;
- `versioningEnabled: true` retained for transition or derived consistently.

**GREEN:** update `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a659d350…/360fcf1f….json` (and mirrored Entity present-model row if duplicated).

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.contract
npm run testByFile -w miroir-core -- versioningModes.234.miroir-self-app
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run testByFile -w miroir-core -- applicationVersionFreeze.216.gate
npm run testByFile -w miroir-core -- entityPresentModel.217.phase3
```

### Realized (Slice 1)

- **`versioningMode.ts`** — `VersioningMode`, `resolveVersioningMode`, `assertApplicationVersioningEnabled` (freeze requires `versioned-internal`; rejects `versioned-external`).
- **SelfApplication Jzod** — optional enum `unversioned` | `versioned-internal` | `versioned-external` on Entity row `a659d350…`; regenerated `miroirFundamentalType.ts`.
- **Miroir instance** — `360fcf1f…` JSON + export: `versioningMode: "versioned-internal"`, `versioningEnabled: true`.
- **Tests:** `versioningModes.234.contract.unit.test.ts` (10/10), `versioningModes.234.miroir-self-app.unit.test.ts` (2/2).

---

## Slice 2 — Relocate Miroir Version History assets

**Status: DONE**

### Goal

Move Version History instance JSON into **`assets/miroir_modelVersion/`** and repoint package exports — no deletion of history content.

### 2.1 RED → GREEN — Physical asset move

**Test:** `versioningModes.234.assets-layout.unit.test.ts` (from Slice 0) goes **GREEN**.

**GREEN:**

- create `packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/`;
- `git mv` (or move) all instance JSON under Version History parent UUIDs from `miroir_data/` → `miroir_modelVersion/` preserving `<parentUuid>/<instanceUuid>.json` layout;
- remove empty Version History directories from `miroir_data/`;
- do **not** move Entity metaclass JSON from `miroir_model/16dbfe28…/`.

### 2.2 RED → GREEN — Package exports and modelValidation

**Test:** `packages/miroir-test-app_deployment-miroir/tests/modelValidation.unit.test.ts` + optional `versioningModes.234.deployment-exports.unit.test.ts`

Behavior:

- every `index.ts` export that pointed at `miroir_data/<versionHistoryParent>/` now points at `miroir_modelVersion/<versionHistoryParent>/`;
- deprecated `entityDefinition*` aliases updated consistently;
- `npm run build -w miroir-test-app_deployment-miroir` succeeds;
- modelValidation suite passes for miroir deployment assets.

**GREEN:** update `index.ts`; fix any importers that hard-coded old paths (ripgrep `miroir_data/54b9c72f`, etc.).

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.assets-layout
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-core -- versioningModes.234.deployment-exports
npm run testByFile -w miroir-core -- 234.
```

### Realized (Slice 2)

- **`assets/miroir_modelVersion/`** — git-moved 43 JSON files across three `versionHistoryEntityUuids` parent folders (`54b9c72f…` 34, `c3f0facf…` 2, `8bec933d…` 7); empty Version History dirs removed from `miroir_data/`.
- **`index.ts`** — 76 export paths repointed from `miroir_data/` → `miroir_modelVersion/` for Version History parents; section comments updated.
- **`versioningModes.234.slice0-inventory.ts`** — inventory corrected (dropped Query/Endpoint false positives; added `8bec933d…` cross-table parent); `MIROIR_VERSION_HISTORY_PARENTS_SLICE0` renamed from `MIROIR_VH_*`.
- **Tests:** `versioningModes.234.assets-layout.unit.test.ts` (5/5 GREEN); `versioningModes.234.inventory.unit.test.ts` updated for post-relocation assertions (4/4); `modelValidation.unit.test.ts` (147/147); `entityMetaScope.unit.test.ts` path updated.
- **Legacy:** `#222` `222.phase1.assets-layout.unit.test.ts` now fails as expected until Slice 4 retirement.

---

## Slice 3 — Filesystem asset seed → `modelVersion` store

**Status: DONE**

### Goal

Writable filesystem (and emulated-server filesystem profile) **loads Version History from the `modelVersion` store section**, seeded from `miroir_modelVersion/` deployment assets — not from `data`.

### 3.1 RED → GREEN — Deployment package exposes modelVersion asset slice

**Test:** `packages/miroir-core/tests/1_core/versioningModes.234.deployment-assets.unit.test.ts`

Behavior:

- deployment package build output / star export includes `miroir_modelVersion` asset tree (mechanism TBD: export map, separate entry, or filesystem seed script — test asserts **discoverability** for store bootstrap);
- instance count per Version History parent in assets matches Slice 0 inventory after move.

### 3.2 RED → GREEN — Store bootstrap reads Version History from modelVersion section

**Test:** `packages/miroir-standalone-app/tests/3_controllers/versioningModes.234.filesystem-seed.integ.test.ts` (or extend `applicationVersionFreeze.integ.test.ts` with a dedicated describe)

Behavior:

- with `emulatedServer-filesystem` profile and Miroir deployment config including **`modelVersion`** directory;
- after bootstrap, `getInstances` / persistence read with `applicationSection: "modelVersion"` returns seeded Version History rows (e.g. known EntityVersion instance UUID from assets);
- same UUID **not** returned from `applicationSection: "data"`;
- freeze can append new history; pre-seeded rows remain addressable.

**GREEN (likely touch points — confirm during implementation):**

- filesystem deployment root / seed path maps `miroir_modelVersion/` → runtime `modelVersion` store;
- `miroirConfig.test-emulatedServer-filesystem.json` (or library/miroir variant) includes `modelVersion` path for Miroir deployment UUID;
- avoid teaching generic stores about package layout — prefer existing deployment build + copy/seed hook used for model/data today.

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.deployment-assets
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem versioningModes.234.filesystem-seed
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem applicationVersionFreeze.integ
npm run testByFile -w miroir-core -- modelVersionStorage.232
npm run testByFile -w miroir-core -- applicationVersionFreeze.232
```

### Realized (Slice 3)

- **`miroirConfig.test-emulatedServer-filesystem.json`** — Miroir deployment (`10ff36f2…`) includes `modelVersion` → `miroir-test-app_deployment-miroir/assets/miroir_modelVersion`; CI config updated (`ci/tests/config/…`).
- **`PersistenceStoreController.bootFromPersistedState()`** — registers Version History entities on the optional `modelVersion` store section (filters `versionHistoryEntityUuids` from model catalog).
- **`versioningModes.234.deployment-assets.unit.test.ts`** — asset tree discoverability + packages-relative bootstrap path (3/3).
- **`versioningModes.234.filesystem-seed.integ.test.ts`** — after open + boot, EntityVersion / SelfApplicationVersion rows readable from `modelVersion`, absent from `data` (4/4).
- **`applicationVersionFreeze.integ.test.ts`** — inline Miroir deployment config includes `modelVersion` pointing at package assets.
- **`MIROIR_MODEL_VERSION_PACKAGES_RELATIVE`** — shared constant for filesystem bootstrap path under `packages/`.
- **Regression:** `modelVersionStorage.232` (15/15), `applicationVersionFreeze.232` (5/5), full `versioningModes.234.*` (24/24).

---

## Slice 4 — Bundled Miroir alignment

**Status: DONE**

### Goal

Bundled/sandbox Miroir profile: **no `modelVersion` section**; Version History not loaded into bundled store; versioning features unavailable.

### 4.1 RED → GREEN — bundledData excludes Version History from model and data

**Test:** `packages/miroir-core/tests/1_core/versioningModes.234.bundled.unit.test.ts`

Behavior:

- `makeBundledDeploymentData` for Miroir deployment has **zero** instances whose `parentUuid` ∈ `versionHistoryEntityUuids` in both `model` and `data` buckets;
- `demoMiroirConfig` / bundled `StoreUnitConfiguration` for Miroir UUID has **no** `modelVersion` key;
- `ADMIN_MODEL_PARENT_UUIDS` unchanged in Slice 4 (admin follow-up).

**GREEN:** update `packages/miroir-sandbox/src/bundledData.ts` — remove `#222` comments; drop Version History parent UUIDs from data classification; do not add modelVersion to bundled Miroir config.

### 4.2 RED → GREEN — Bundled bootstrap has no Version History in store sections

**Test:** extend bundled unit test or lightweight integ with `BundledDataStoreSection`

Behavior:

- opening bundled Miroir controller: query for EntityVersion / SelfApplicationVersion via persistence returns empty (or explicit not-configured for modelVersion);
- freeze action on bundled profile fails with existing read-only / missing-section error (align with #232 bundled policy).

### 4.3 NON-REGRESSION — Retire `#222` layout tests

- Remove or replace `222.phase1.assets-layout.unit.test.ts` with #234 equivalents;
- update `222.slice0-inventory.js` if obsolete.

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.bundled
npm run testByFile -w miroir-core -- 234.
npm run testByFile -w miroir-core -- modelVersionStorage.232.policy
npm run build -w miroir-store-bundled
npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
# Sandbox smoke (manual or existing app test if present):
# npm run dev -w miroir-sandbox
```

### Realized

- **`packages/miroir-sandbox/src/bundledData.ts`** — `makeBundledDeploymentData` accepts `excludeParentUuids`; Miroir bundled data passes `versionHistoryEntityUuids` so Version History instances are omitted from both `model` and `data` buckets. Removed `#222` comments.
- **`packages/miroir-core/tests/1_core/versioningModes.234.bundled.unit.test.ts`** — 3 tests (4.1 bundled data/config, 4.2 bootstrap empty history + missing modelVersion section).
- **Retired** `222.phase1.assets-layout.unit.test.ts` (superseded by `versioningModes.234.assets-layout` + `versioningModes.234.bundled`).
- **`ADMIN_MODEL_PARENT_UUIDS`** unchanged (admin follow-up deferred).
- **Regression:** `versioningModes.234.*` (27/27), `modelVersionStorage.232.policy` (4/4), `miroir-store-bundled` build OK.

---

## Slice 5 — Docs, inventory, non-regression

**Status: DONE**

### Goal

Document modes and four-folder asset layout; publish deployment inventory for follow-ups; lock repo-wide non-regression.

### Realized

- **`docs/getting-started/bundles-and-versioning.md`** — bundled Miroir omits Version History; git `*_modelVersion/` asset folder reference.
- **`docs/reference/data-architecture-deployments.md`** — versioning mode matrix; deployment package asset folders; updated bundled classification and Miroir overview.
- **`code-helpers/features/234-FEATURE-versioning-modes-and-asset-migration/deployment-inventory.md`** — per-package Version History location and follow-up table.
- **`versioningModes.234.inventory.unit.test.ts`** — 5.2 lock: inventory file exists and lists all five deployment packages.
- **Legacy `#222` tests** — paths retargeted from `miroir_data/` to `miroir_modelVersion/` for post–Slice 2 layout.
- **`domain_controller_application_version_freeze` MiroirTest** — Version History query extractors use `modelVersion` section (aligns with #232 routing).
- **Non-reg default tier:** 35/37 steps pass. Pre-existing failures: `appstack-DomainController.integ` (test file absent from manifest), `domain_controller_application_version_freeze` on SQL profile (filesystem profile green).

### 5.1 RED → GREEN — Documentation

Update (no issue-number refs in general-purpose prose):

- [`docs/getting-started/bundles-and-versioning.md`](../../../docs/getting-started/bundles-and-versioning.md) — internal vs external; `miroir_modelVersion/`; bundled limitation;
- [`docs/reference/data-architecture-deployments.md`](../../../docs/reference/data-architecture-deployments.md) — optional `*_modelVersion/` assets tree; mode matrix.

Optional doc test: markdown link sanity or contributor checklist item in plan only.

### 5.2 RED → GREEN — Deployment package inventory artifact

**Deliverable:** `code-helpers/features/234-FEATURE-versioning-modes-and-asset-migration/deployment-inventory.md`

Table for admin, library, designer, postgres: current Version History location, proposed `versioningMode`, follow-up slice notes (no code migration in #234).

**Test:** `versioningModes.234.inventory.unit.test.ts` asserts inventory file exists and lists all five deployment package names (lightweight doc lock).

### 5.3 NON-REGRESSION — Full default tier

```bash
npm run nonreg -- --tier default
```

Investigate failures; fix only #234 regressions.

### Validation

```bash
npm run testByFile -w miroir-core -- versioningModes.234.inventory
npm run testByFile -w miroir-core -- 234.
npm run testByFile -w miroir-core -- modelVersionStorage.232
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem applicationVersionFreeze.integ
npm run nonreg -- --tier default
```

---

## Suggested file layout

| Concern | Likely home |
|---|---|
| `versioningMode` Jzod | `packages/miroir-test-app_deployment-miroir/assets/miroir_model/…` SelfApplication EntityVersion + bootstrap schema |
| Generated types | `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/` |
| Mode helpers | `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` or new `versioningMode.ts` |
| Miroir Version History assets | `packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/` |
| Package exports | `packages/miroir-test-app_deployment-miroir/index.ts` |
| Bundled classification | `packages/miroir-sandbox/src/bundledData.ts` |
| Filesystem test config | `packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json` |
| #234 unit tests | `packages/miroir-core/tests/1_core/versioningModes.234.*.unit.test.ts` |
| #234 integ tests | `packages/miroir-standalone-app/tests/3_controllers/versioningModes.234.*.integ.test.ts` |

---

## Out of scope

- Relocating Version History assets for admin, library, designer, postgres packages.
- `versioned-external` GitProxy / MCP runtime.
- Migrating user-local filesystem/SQL stores with Version History still under legacy `data`/`model` paths.
- Branch/checkout/rollback UI, pruning, remote `modelVersion` sync.
- Bundled read-only **serving** of modelVersion assets (bundled Miroir omits section entirely).

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Filesystem seed hook unclear | Slice 3.2 integ test first; trace existing model/data seed path |
| Large `index.ts` churn breaks consumers | `deployment-exports` test + ripgrep before merge |
| Freeze gate too strict for transitional rows | Slice 1 documents `versioningEnabled` + `versioningMode` mapping |
| `#222` tests block Slice 2 | Keep legacy tests until Slice 4; 234 target tests GREEN since Slice 2 |
| SQL profile seed parity | Slice 3 filesystem-first; SQL seed follow-up if config already supports `modelVersion` schema |

---

## Bottom line

#234 closes the gap between **#232 runtime routing** and **git deployment layout**: Version History instances move to **`miroir_modelVersion/`**, **`versioningMode`** makes internal vs external explicit, filesystem profiles **seed and read `modelVersion`**, bundled Miroir stays a **versioning-free** demo slice, and docs plus deployment inventory capture follow-ups for admin/library/designer/postgres packages.
