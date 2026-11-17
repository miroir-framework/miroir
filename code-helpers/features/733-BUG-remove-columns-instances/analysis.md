# #733: a removed attribute stays in the stored instances

Narrowed on 2026-11-17 after #745 (PR #755). A migration run replays the traced model Actions. On SQL, a replayed `alterEntityAttribute` with `removeColumns` drops the column and its values (#745 D7). On the filesystem, IndexedDB and MongoDB stores it rewrites the Entity row only, so the instances keep the attribute. If the attribute is added again later, possibly with another type, the old values come back.

## Current code

- `FileSystemEntityStoreSectionMixin.alterEntityAttribute`, `IndexedDbEntityStoreSectionMixin.alterEntityAttribute` and `MongoDbEntityStoreSectionMixin.alterEntityAttribute` read the Entity row, apply `applyMlSchemaColumnChanges` (core, `1_core/Entity/modelEntityDualWrite.ts`) and `upsertInstance` the row in the model section. They never touch the data section (`this.dataStore`).
- The `upsertInstance` of each data section replaces the whole instance: the filesystem rewrites the JSON file, IndexedDB `putValue` overwrites the key, MongoDB `putInstance` calls `replaceOne`. Writing an instance without the attribute removes it.
- `sqlDbEntityStoreSectionMixin.alterEntityAttribute` checks first, changes the columns, then writes the Entity row. It removes only the columns the previous Entity row declares.

## Decisions

- **D1. One core helper for the three document stores.** `removeAttributesFromInstances(dataSection, entity, attributes)` in `1_core/Entity/modelEntityDualWrite.ts`. It reads every instance of the Entity, then writes back, without the attributes, each instance that holds one of them. The three mixins call it before writing the Entity row, as SQL does.
- **D2. Attributes the Entity row declares only.** Like SQL, the helper removes the names of `removeColumns` that the previous Entity row declares. A name it does not declare changes nothing.
- **D3. Read fails, nothing written.** A failed read of the instances returns the error before any write, and the Entity row is not written. A write that fails part way returns the error and leaves the Entity row as it was. The document stores have no transaction, so the instances already written stay without the attribute; running the step again finishes the removal, since an instance without the attribute is skipped.
- **D4. External Entities and Entities without storage are skipped.** An external Entity has no instances in the store (`isExternalEntity`). An Entity the data section does not register (`getEntityUuids`) has no storage to change.

## Out of scope

- `addColumns` of an attribute some instances already hold. Once removal clears the values, a re-add finds none.
- MongoDB runtime proof: the session cannot download `mongod` (#757). MongoDB gets the same helper and is typechecked.

## Tests

| Done when | Test |
|---|---|
| A removal leaves no value in the instances, and a re-add finds none, on every store | `alterEntityAttributeRemoveColumns.integ.test.ts` (new), run on filesystem, IndexedDB and PostgreSQL; nonreg step `integ-alter-entity-remove-columns` |
| The C10 migration run: no Publisher file holds `mottoC9` after the removal, and none after the re-add as a number | `migrationRun.integ.test.ts`, C10 |

## Plan

One slice, kept in this file instead of a separate `tdd-implementation-plan.md` (a small fix):

1. Red: the new store-level test and C10 with its assertions reversed fail on the filesystem.
2. Green: the helper (D1 to D4), called by the three mixins.
3. Check: the store-level test on IndexedDB and PostgreSQL, then the pre-push gate and `nonreg:filesystem` with the shared runner.
