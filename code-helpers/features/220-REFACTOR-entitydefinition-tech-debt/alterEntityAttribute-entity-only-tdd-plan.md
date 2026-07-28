# Issue #220 — TDD: `alterEntityAttribute` Entity-only (no `entityVersion`)

## Scope

Like [`createEntity`](./createEntity-remove-entityVersion-tdd-plan.md) / [`dropEntity`](./dropEntity-remove-entityVersion-tdd-plan.md) / [`renameEntity`](./renameEntity-remove-entityVersion-tdd-plan.md) / [`duplicateAttribute`](./duplicateAttribute-entity-only-tdd-plan.md): `alterEntityAttribute` must not take / use `entityVersionUuid`, and must **not** insert, modify, or delete EntityVersion instances.

**Done means:** action schema + planner + transformer + store mixins + callers are Entity-only.

### Out of scope

- freeze / historical EntityVersions (#216)
- Removing unused `applyAlterEntityAttributePair` helper (may remain for tests / migration until cleaned)

## Target interface

```ts
// ModelActionAlterEntityAttribute.payload
{
  application: Uuid;
  transactional?: boolean;
  entityName: string;
  entityUuid: string;
  addColumns?: { name: string; definition: JzodElement }[];
  removeColumns?: string[];
  update?: JzodElement;
}
// no entityVersionUuid

// Behavior: mutate live Entity.mlSchema (+ Postgres data-table sync). Never touch EntityVersion rows.
// Requires Entity with complete present model (mlSchema); incomplete Entity → Action2Error.
```

## Slices

### Slice 1 — Store mixins

**RED:** `alterEntityAttribute` bodies must not dual-write / require `entityVersionUuid`.

**GREEN:** FS / IDB / Mongo / Postgres always Entity-only via `applyEntityOnlyAlterAttribute`; error if incomplete; Postgres sync uses Entity only.

### Slice 2 — Planner + transformer

**RED:** `planAlterEntityAttributeMutation(currentModel, entityUuid, changes)` — no EV arg; always `entityOnly` or undefined.

**GREEN:** drop dualWrite branch; transformer one `updateInstance` for Entity.

### Slice 3 — Action schema + codegen

Remove `entityVersionUuid` from ModelEndpoint `alterEntityAttribute`; regen types. Update phase11/12 asserts (alter like create/drop/rename).

### Slice 4 — Callers

Strip `entityVersionUuid` from MiroirTest, zodParse, evolutionTrace, ModelUpdate, LEGACY comments, phase5/11 fixtures.

### Slice 5 — Grep gate + nonreg

Grep gate; PersistenceStoreController.integ; MiroirTest `domain_controller_model_crud` under sql (Alter + Duplicate).

## Validation checklist

- [x] Stores never upsert EntityVersion on alter
- [x] Planner/transformer Entity-only
- [x] Schema/types: no `entityVersionUuid` on alterEntityAttribute
- [x] Callers updated (MiroirTest, zodParse, evolutionTrace, ModelUpdate, phase11/12)
- [x] Grep gate `220.alterEntityAttribute-entity-only` 9/9; PersistenceStoreController.integ 11/11; MiroirTest `domain_controller_model_crud` 8/8 under sql

### Realization

- Store mixins Entity-only via `applyEntityOnlyAlterAttribute`; incomplete Entity → Action2Error; Postgres sync uses Entity only.
- `planAlterEntityAttributeMutation(currentModel, entityUuid, changes)` — no EV arg; always `entityOnly`.
- Transformer one Entity `updateInstance`.
- ModelEndpoint + regen; evolutionTrace treats alter like create/drop/rename.
- MiroirTest model CRUD + evolution WP1 payloads stripped.
