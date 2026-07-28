# Issue #220 — TDD: `renameEntity` Entity-only (no `entityVersion`)

## Scope

Like [`createEntity-remove-entityVersion-tdd-plan.md`](./createEntity-remove-entityVersion-tdd-plan.md) and [`dropEntity-remove-entityVersion-tdd-plan.md`](./dropEntity-remove-entityVersion-tdd-plan.md): `renameEntity` must not take / use `entityVersion` / `entityVersionUuid`, and must **not** insert, modify, or delete EntityVersion instances.

**Done means:** action schema + planner + transformer + store mixins + callers are Entity-only.

### Out of scope

- `alterEntityAttribute` dual-write (separate slice)
- freeze / historical EntityVersions (#216)

## Target interface

```ts
// ModelActionRenameEntity.payload
{ application: Uuid; transactional?: boolean; entityName?: string; entityUuid: string; targetValue: string }
// no entityVersionUuid

// Behavior: rename live Entity name (+ storage space rename). Never touch EntityVersion rows.
```

## Slices

### Slice 1 — Store mixins

**RED:** source-contract: `renameEntityClean` bodies must not call `persistEntityThenEntityDefinition` / upsert `entityEntityDefinition`.

**GREEN:** FS / IDB / Mongo / Postgres always Entity-only rename (`applyEntityOnlyRename` or equivalent); remove dual-write branch requiring `entityVersionUuid`.

**Validation:** unit source contracts; PersistenceStoreController.integ rename still renames Entity.

### Slice 2 — Planner + transformer

**RED:** `planRenameEntityMutation(entityUuid, targetValue)` — no EV arg; always `entityOnly` or undefined. Transformer emits one `updateInstance` object.

**GREEN:** drop dualWrite mode from rename planner path; stop passing `entityVersionUuid`.

### Slice 3 — Action schema + codegen

Remove `entityVersionUuid` from ModelEndpoint `renameEntity`; regen types. Update phase11/12 asserts (rename like create/drop).

### Slice 4 — Callers

Strip `entityVersionUuid` from MiroirTest, integ, zodParse, evolutionTrace fixtures.

### Slice 5 — Grep gate + nonreg

Grep gate; PersistenceStoreController.integ; MiroirTest model CRUD rename cases under sql.

## Validation checklist

- [x] Stores never upsert/delete EntityVersion on rename
- [x] Planner/transformer Entity-only
- [x] Schema/types: no `entityVersionUuid` on renameEntity
- [x] Callers updated
- [x] Grep gate + integ nonreg: PersistenceStoreController.integ 11/11; MiroirTest Rename Entity Publisher and Commit ok under sql

### Realization

- `applyEntityOnlyRename` always renames (no completeness gate).
- Store mixins Entity-only; dual-write branch removed.
- `planRenameEntityMutation(entityUuid, targetName)` only; transformer one `updateInstance`.
- ModelEndpoint + regen; evolutionTrace treats rename like create/drop.
- MiroirTest model CRUD + evolution WP1 payloads stripped.
