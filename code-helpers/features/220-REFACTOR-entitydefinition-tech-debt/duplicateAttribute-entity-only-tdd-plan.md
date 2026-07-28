# Issue #220 — TDD: `entity_DuplicateAttribute` Entity-only (no EntityVersion)

## Scope

Like [`createEntity`](./createEntity-remove-entityVersion-tdd-plan.md) / [`dropEntity`](./dropEntity-remove-entityVersion-tdd-plan.md) / [`renameEntity`](./renameEntity-remove-entityVersion-tdd-plan.md): `entity_DuplicateAttribute` must not take / use EntityVersion ids, and must **not** insert, modify, or delete EntityVersion instances.

`entity_DuplicateAttribute` is a **compositeActionTemplate** (not a store mixin): it expands to lookup + `alterEntityAttribute`. Entity-first means the composite reads **Entities** and calls `alterEntityAttribute` **without** `entityVersionUuid` (Entity-only alter path when present model is complete).

### Out of scope

- Full `alterEntityAttribute` Entity-only schema cleanup (still may accept optional `entityVersionUuid` for incomplete Entities)
- freeze / historical EntityVersions (#216)

## Target interface

```ts
// entity_DuplicateAttribute.payload
{
  application: Uuid;
  transactional?: boolean;
  columns?: string[];
  sourceEntityName?: string;
  sourceEntityUuid: string;
  targetEntityName?: string;
  targetEntityUuid: string;
}
// no sourceEntityDefinitionUuid / targetEntityDefinitionUuid / entityVersion*
```

**Behavior:** copy named attributes from source Entity `mlSchema` onto target Entity via `alterEntityAttribute` (Entity-only). Never read/write EntityVersion rows.

## Slices

### Slice 1 — Action implementation (composite)

**RED:** source-contract: ModelEndpoint `entity_DuplicateAttribute.actionImplementation` must not look up EntityVersion / `*EntityDefinitionUuid` / `entityVersionUuid`.

**GREEN:** rewrite composite to:
1. load source Entity by `sourceEntityUuid`
2. load target Entity by `targetEntityUuid` (for name / sanity)
3. extract columns from source Entity `mlSchema` (`entityDefinition_extractAttributes` with Entity as input — same `mlSchema.definition` shape)
4. `alterEntityAttribute` with `entityUuid` = target, **no** `entityVersionUuid`

### Slice 2 — Action schema + codegen

Remove `sourceEntityDefinitionUuid` / `targetEntityDefinitionUuid` from payload; regen types.

### Slice 3 — Callers

Strip EV uuids from MiroirTest `domain_controller_model_crud` Duplicate leaf (and any other live callers).

### Slice 4 — Grep gate + nonreg

Grep gate unit test; MiroirTest Duplicate leaf under sql; PersistenceStoreController.integ smoke if touched.

## Validation checklist

- [x] Implementation never queries EntityVersion / passes `entityVersionUuid` to alter
- [x] Schema/types: no `*EntityDefinitionUuid` on DuplicateAttribute (regen via `devBuild`)
- [x] Callers updated (MiroirTest Duplicate leaf; LEGACY comments)
- [x] Grep gate `220.duplicateAttribute-entity-only` 3/3; MiroirTest `domain_controller_model_crud` 8/8 under sql (Duplicate `checkPublisherHasNotChanged` ok)

### Realization

- Composite looks up source/target **Entity** by uuid; extracts attrs via `entityDefinition_extractAttributes` on Entity `mlSchema`.
- Nested `alterEntityAttribute` has **no** `entityVersionUuid` → Entity-only alter when present model complete.
- Payload: `{ application, transactional?, columns?, sourceEntityName?, sourceEntityUuid, targetEntityName?, targetEntityUuid }`.
