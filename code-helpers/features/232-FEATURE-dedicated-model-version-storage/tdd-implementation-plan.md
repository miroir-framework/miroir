# Issue #232 — TDD Implementation Plan

## Scope

Implement the accepted ADR choice in
[`../232-FEATURE-dedicated-modelVersion-storage-analysis.md`](../232-FEATURE-dedicated-modelVersion-storage-analysis.md):
make `modelVersion` a first-class deployment storage section, distinct from
the live `model` and application `data` sections.

The completed behavior is:

- a versioned deployment has an independently configured `modelVersion`
  section;
- a freeze persists version-history rows there;
- callers can read those rows through the normal persistence interface; and
- live model definitions continue to use `model`, while application data
  continues to use `data`.

This plan is deliberately limited to storage separation. It does not add
branching, checkout, pruning, version-history UI, remote synchronization, or
new modelVersion entity types.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/232
- Decision record / analysis:
  [`../232-FEATURE-dedicated-modelVersion-storage-analysis.md`](../232-FEATURE-dedicated-modelVersion-storage-analysis.md)
- Existing freeze producer:
  [`../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md`](../216-FEATURE-application-versions-and-freeze/tdd-implementation-plan.md)
- Historical non-Entity freeze rows:
  [`../227-FEATURE-freeze-non-entity-model-elements/tdd-implementation-plan.md`](../227-FEATURE-freeze-non-entity-model-elements/tdd-implementation-plan.md)

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the existing section matrix | Done | Current two-section behavior locked; updated after Slice 1 transition |
| 1 | Add the section contract and versioning configuration gate | Done | `ApplicationSection` includes `"modelVersion"`; all freeze resolvers return `"modelVersion"` |
| 2 | Generalize persistence section routing | Planned | Controller routes a read/write by section without a model/data branch |
| 3 | Filesystem freeze tracer bullet | Planned | Freeze writes history only to `modelVersion` |
| 4 | SQL backend parity | Planned | SQL freeze/read path uses its configured history schema |
| 5 | Remaining backend policy, docs, and regression locks | Planned | Explicit support policy and unchanged live behavior |

---

## Locked implementation defaults

| Decision | Choice for this plan |
|---|---|
| Architecture | Option A: `modelVersion` is a first-class `ApplicationSection`, not a flag on `model` and not a use of `data`. |
| Configuration compatibility | `modelVersion` is optional for an unversioned deployment, preserving existing unversioned configurations. A versioned deployment must have it; attempting a history write without it returns an explicit configuration error. |
| Section contents | All freeze-produced history is co-located in `modelVersion`: `SelfApplicationVersion`, historical Entity/Query/Report/Menu/Endpoint/Runner/Theme/TransformerDefinition versions, and their ApplicationVersion cross rows. |
| Live sections | Current Entity/model-concept rows remain in `model`; ordinary application rows remain in `data`. No live-model migration is part of #232. |
| Persistence abstraction | Replace the controller's model-versus-data conditional routing with a section-keyed internal registry. Do not add another chain of section conditionals at every call site. |
| Backend order | Filesystem is the end-to-end tracer. SQL is required parity for server deployments. IndexedDB/MongoDB/Bundled receive an explicit support decision in Slice 5; bundled remains read-only and cannot support internal freeze writes. |
| Loading history | Startup/rollback of the active model does not eagerly load all historical snapshots. History is loaded only by explicit queries/reads targeting `modelVersion`. |
| Migration | Existing snapshot rows in `model` or `data` are not migrated automatically in this issue. Compatibility/migration is a follow-up once a legacy-data policy is agreed. |

---

## Target public interfaces and behavior

1. **Section vocabulary**
   - `ApplicationSection` includes `"modelVersion"`.
   - Request actions, query extractors, and REST routes can carry that section
     without casts or a fallback to `data`.

2. **Deployment configuration**
   - `StoreUnitConfiguration` can specify:
     `{ admin, model, data, "modelVersion"?: ... }`. The configuration key
     is the same literal section name used by requests and persistence routing.
   - A versioned deployment is rejected with a diagnostic that identifies its
     deployment and missing history section when it tries to persist history.

3. **Persistence**
   - `PersistenceStoreController` resolves an explicitly requested section
     from one internal section registry.
   - A `modelVersion` read, upsert, delete, and boxed query reach the
     configured backing store, not the model or data backing store.

4. **Freeze**
   - `resolveFreeze*ApplicationSection` returns `"modelVersion"` for every
     history entity family.
   - `persistFreezeApplicationVersionPlan` writes all history-plan batches to
     `modelVersion`.
   - A later edit to a live Entity or model concept changes neither the stored
     history row nor its section.

5. **Bootstrap**
   - The active model still loads only from `model`; history is not a
     bootstrap dependency.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Core targeted tests | `npm run testByFile -w miroir-core -- <pattern>` |
| Filesystem freeze integration | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze` |
| SQL freeze integration | `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze` |
| Deployment/schema rebuild | `npm run build -w miroir-test-app_deployment-miroir` then `npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck` |

Legend:

- **RED**: add one behavior-level test that fails.
- **GREEN**: add only the code needed for that test.
- **NON-REGRESSION**: run the directly related existing tests after the slice.

Tests must use public behavior: configuration validation, persistence reads and
writes, and freeze actions. Do not mock or assert calls to private store fields.
Each numbered test below is a separate red → green cycle; do not batch all RED
tests before implementation.

---

## Slice 0 — Characterize the existing section matrix

### Goal

Lock the current contract and current history-placement behavior before changing
the storage topology.

### 0.1 RED → GREEN — Existing section and configuration shape

**Test:** `packages/miroir-core/tests/1_core/modelVersionStorage.232.phase0.unit.test.ts`

Characterize, without production changes:

- `ApplicationSection` currently accepts only `model` and `data`;
- `StoreUnitConfiguration` currently exposes `admin`, `model`, and `data`;
- filesystem and SQL configuration fixtures have only those three sections;
- a current freeze plan resolves historical rows to the existing section
  matrix, not to `modelVersion`.

The test is a characterization lock. Once Slice 1 changes the contract, retain
only assertions that document the intentional before/after transition; do not
retain stale expectations merely to preserve old behavior.

### Validation

```bash
npm run testByFile -w miroir-core -- modelVersionStorage.232.phase0
npm run testByFile -w miroir-core -- applicationVersionFreeze
```

---

## Slice 1 — Add the section contract and versioning configuration gate

### Goal

Make `modelVersion` expressible and validate its availability before any
backend-specific persistence work.

### 1.1 RED → GREEN — Configuration accepts a history section

**Test:** evolve `modelVersionStorage.232.phase0.unit.test.ts` into
`modelVersionStorage.232.contract.unit.test.ts`.

Behavior:

- a valid StoreUnit configuration with `modelVersion` parses;
- existing unversioned configuration without it still parses;
- an action/configuration path that enables internal versioning but lacks
  `modelVersion` produces a descriptive configuration error, rather than
  silently selecting `model` or `data`.

**GREEN:**

- update the authoritative Jzod schema that generates
  `ApplicationSection` and `StoreUnitConfiguration`;
- regenerate core types/schemas;
- add a single configuration-validation helper at the deployment/versioning
  boundary, rather than spreading missing-section checks over freeze batches.

### 1.2 RED → GREEN — Freeze resolves every historical family to the new section

**Test:** `packages/miroir-core/tests/1_core/applicationVersionFreeze.232.section.unit.test.ts`

Behavior:

- every exported `resolveFreeze*ApplicationSection` helper returns
  `"modelVersion"` for a versioned application;
- plan-level history section fields for EntityVersion, QueryVersion, and the
  other already supported historical families are all `"modelVersion"`;
- live `getApplicationSection` behavior for Entity and application data is
  unchanged.

**GREEN:**

- introduce one shared version-history section resolver and delegate the
  existing family-specific helpers to it;
- keep `getApplicationSection` responsible only for live model/data
  classification.

### Validation

```bash
npm run testByFile -w miroir-core -- modelVersionStorage.232.contract
npm run testByFile -w miroir-core -- applicationVersionFreeze.232.section
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
```

---

## Slice 2 — Generalize persistence section routing

### Goal

Make a section addressable through the persistence controller without
hard-coding a third branch beside `model` and `data`.

### 2.1 RED → GREEN — Explicit section routing

**Test:** `packages/miroir-core/tests/4_services/persistenceStoreController.232.sections.unit.test.ts`

Use real in-memory/error section implementations already available to the
controller, or a small test store implementing the public section interface.
Do not mock controller internals.

Behavior:

- a caller that asks to read/write `modelVersion` is routed to the registered
  history section;
- `model` and `data` still resolve to their existing sections;
- an unconfigured `modelVersion` request fails with a named configuration
  error and does not fall back to `data`.

**GREEN:**

- refactor `PersistenceStoreController` constructor/state to hold a
  `Map<ApplicationSection, PersistenceStore...>` (or equivalent deep module);
- centralize `getSectionStore(section)` and have CRUD/query methods use it;
- preserve the special relationship, if still required, between the model
  store and data store while creating the model store.

### 2.2 RED → GREEN — Store startup opens configured history storage

**Test:** configuration/controller integration test in the existing store
startup test area.

Behavior:

- opening a filesystem-configured deployment registers and opens distinct
  `model`, `data`, and `modelVersion` stores;
- the store name/path exposed for `modelVersion` differs from `model`;
- opening an unversioned configuration without `modelVersion` remains valid
  until an operation requests history storage.

**GREEN:**

- add `modelVersion` factory registrations to the core configuration
  mechanism and filesystem startup;
- use the model-section implementation only when it is semantically suitable,
  but pass the actual `"modelVersion"` section identity through to the store.

### Validation

```bash
npm run testByFile -w miroir-core -- persistenceStoreController.232
npm run testByFile -w miroir-core -- modelVersionStorage.232
npx tsc --noEmit --skipLibCheck
```

---

## Slice 3 — Filesystem freeze tracer bullet

### Goal

Prove the complete user-visible path: freeze a versioned deployment, then
retrieve the historical snapshot from `modelVersion` while the live model
continues to use `model`.

### 3.1 RED → GREEN — Freeze separates live and historical rows

**Test:** add a `232 — modelVersion section persistence` describe block to
[`packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts`](../../../packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts).

Behavior:

1. Configure a versioned filesystem deployment with distinct `model` and
   `modelVersion` directories.
2. Freeze `V1`.
3. Read the historical EntityVersion and SelfApplicationVersion rows through
   the persistence public API with `applicationSection: "modelVersion"` and
   find them.
4. Read the same historical parent UUID from `model` and find no history rows.
5. Alter a live Entity in `model`; re-read the `V1` row from `modelVersion`
   and confirm the snapshot is unchanged.

**GREEN:**

- route every `persistFreezeApplicationVersionPlan` history batch, including
  SelfApplicationVersion and all cross rows, to the plan's
  `modelVersion` section;
- update test configuration/fixture setup with a distinct history directory;
- do not change active-model rollback loading.

### 3.2 RED → GREEN — Explicit history reads do not pollute bootstrap

**Test:** extend the same integration suite.

Behavior:

- after restart/rollback, the live model loads successfully from `model`
  without eagerly reading all `modelVersion` rows;
- an explicit history read remains available after the active model loads.

### Validation

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze
npm run testByFile -w miroir-core -- applicationVersionFreeze
```

---

## Slice 4 — SQL backend parity

### Goal

Support the same section separation for server-grade PostgreSQL deployments.

### 4.1 RED → GREEN — SQL configuration creates a distinct history schema

**Test:** SQL store/controller integration test using the existing SQL profile.

Behavior:

- a deployment may configure a history schema distinct from the live model
  schema;
- opening the deployment resolves `"modelVersion"` to that configured schema;
- a history write/read cannot return rows from the live model schema.

**GREEN:**

- register the SQL section factory for `modelVersion`;
- ensure the created store retains the actual section identity and uses the
  configured SQL schema;
- extend SQL setup/migration only as required for the existing section-store
  abstraction.

### 4.2 RED → GREEN — SQL freeze tracer

**Test:** reuse the Slice 3 freeze story under
`miroirConfig.test-emulatedServer-sql.json`.

Behavior:

- freeze persists history to SQL `modelVersion`;
- live model remains in its configured model schema;
- a post-freeze live-model edit leaves the historical snapshot unchanged.

### Validation

```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json npm run testByFile -w miroir-standalone-app -- applicationVersionFreeze
npm run build -w miroir-store-postgres
npx tsc --noEmit --skipLibCheck
```

---

## Slice 5 — Remaining backend policy, documentation, and regression locks

### Goal

Finish with an explicit backend support matrix, user-facing architecture
documentation, and regression tests for the separation invariant.

### 5.1 RED → GREEN — Backend support policy

**Test/documented behavior:**

- IndexedDB and MongoDB either support `modelVersion` through the same public
  section behavior as filesystem/SQL, with tests, or reject internal
  versioning at configuration time with a precise unsupported-backend error.
- Bundled storage remains read-only; a bundled deployment cannot enable
  versioned-internal persistence.

Choose the minimal behavior that is true for the backend; do not claim support
without an executable test.

### 5.2 RED → GREEN — Documentation and configuration examples

Update:

- [`docs/reference/data-architecture-deployments.md`](../../../docs/reference/data-architecture-deployments.md)
  with the fourth section, its purpose, and backend layout;
- [`docs/getting-started/workflow-and-versioning.md`](../../../docs/getting-started/workflow-and-versioning.md)
  to link the design statement to the implemented storage topology;
- representative filesystem and SQL configuration examples with distinct
  `modelVersion` locations.

### 5.3 NON-REGRESSION — Separation matrix

Add or retain tests that prove:

- unversioned deployments do not require history storage;
- history rows never fall back to `model` or `data`;
- live Entity/model rows never move to `modelVersion`;
- active-model bootstrap does not depend on historical rows.

### Validation

```bash
npm run testByFile -w miroir-core -- modelVersionStorage.232
npm run testByFile -w miroir-core -- applicationVersionFreeze
npx tsc --noEmit --skipLibCheck
```

Run the smallest successful backend-specific integration suites while building
each slice. Escalate to `npm run nonreg` once all supported writable backends
have their explicit policy tests.

---

## Out of scope

- Automatic migration of legacy version-history rows from `model` or `data`.
- Branch, merge, checkout, rollback, pruning, or retention policy.
- Version-history reports/UI beyond allowing an explicit query to target the
  new section.
- Versioned-external / Git history storage.
- Data versioning.

---

## Suggested file layout

| Concern | Likely home |
|---|---|
| Authoritative section/config schema | `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` and deployment assets; regenerate generated files |
| Live vs history section resolution | `packages/miroir-core/src/1_core/Model.ts` and `src/1_core/versioning/applicationVersionFreeze.ts` |
| Configuration gate | Core deployment/versioning boundary, close to the first history-write entry point |
| Generic section lookup | `packages/miroir-core/src/4_services/PersistenceStoreController.ts` |
| Section factory registration | `packages/miroir-store-filesystem/src/startup.ts`, `packages/miroir-store-postgres/src/startup.ts`, then other backend startup files per Slice 5 |
| Targeted core tests | `packages/miroir-core/tests/1_core/modelVersionStorage.232.*.test.ts` and a persistence-controller test near existing service tests |
| Freeze integration | `packages/miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` |
