# Issue #220 — TDD: `dropEntity` Entity-only (no `entityVersion`)

## Scope

Like [`createEntity-remove-entityVersion-tdd-plan.md`](./createEntity-remove-entityVersion-tdd-plan.md): `dropEntity` must not take / use `entityVersion` / `entityVersionUuid`, and must **not** insert, modify, or delete EntityVersion (`entityDefinition`) instances.

**Done means:** action schema + transformer + store mixins + callers are Entity-only; EntityVersions are left alone (orphaned residual dual-write rows are out of band for drop).

Related: #217 present-model Entity; #216 freeze (historical EVs) — drop must not wipe history.

### Out of scope

- rename / alter dual-write
- freeze / mint historical EntityVersions
- `createDataStorageSpaceForInstancesOfEntity` EV param

## Target interface

```ts
// ModelActionDropEntity.payload
{ application: Uuid; transactional?: boolean; entityUuid: string }
// no entityVersionUuid

// Store / PSC (already)
dropEntity(entityUuid: string): Promise<Action2VoidReturnType>
```

**Behavior:** drop Entity row + storage space for that entity. Do **not** delete EntityVersion rows.

## Slices

### Slice 1 — Store mixins (FS / Mongo cascade off)

**RED:** source-contract tests: `dropEntity` bodies must not call `deleteInstance` on `entityEntityDefinition` / filter EV by `entityUuid`.

**GREEN:** FS + Mongo Entity-only (match Postgres / IndexedDB). Clean dead EV loops on Postgres if present.

**Validation:** unit source contracts green; `PersistenceStoreController.integ` drop still removes Entity.

### Slice 2 — Transformer

**RED:** `ModelEntityActionTransformer` dropEntity emits **one** `deleteInstance` (Entity only), even when a live EV exists in the model.

**GREEN:** remove `resolveLiveEntityDefinitionForAction` for drop; ignore `entityVersionUuid` if still on payload until Slice 3.

**Validation:** `ModelEntityActionTransformer.217.phase*` / new 220 drop unit tests.

### Slice 3 — Action schema + codegen

**RED:** ModelEndpoint JSON `dropEntity` payload has no `entityVersionUuid`.

**GREEN:** edit ModelEndpoint asset; `npm run build -w miroir-test-app_deployment-miroir` + `npm run devBuild -w miroir-core`.

**Validation:** generated `ModelActionDropEntity` / Zod lack `entityVersionUuid`; phase11/12 optional-EV asserts updated/removed for drop.

### Slice 4 — Callers

**RED→GREEN:** Runner `dropEntity`, MiroirTest JSON (`domain_controller_model_crud`, noParentUuid, etc.), integ fixtures, zodParseActions, evolutionTrace — strip `entityVersionUuid`.

### Slice 5 — Cleanup + nonreg

- Grep gate: no `entityVersionUuid` on dropEntity action construction in packages (except historical docs if any).
- Nonreg: MiroirTest model CRUD + undo/redo under sql profile; `PersistenceStoreController.integ`; `ExtractorPersistenceStoreRunner.integ` smoke if bootstrap touched.

## Validation checklist (overall)

- [x] FS/Mongo/Postgres/IndexedDB `dropEntity` do not delete EntityVersions
- [x] Transformer: single Entity `deleteInstance`
- [x] Schema/types: no `entityVersionUuid` on dropEntity
- [x] Callers updated (Runner, MiroirTest model CRUD / noParentUuid, integ, zodParse, evolutionTrace)
- [x] Grep gate + integ nonreg: PersistenceStoreController.integ 11/11; MiroirTest `Drop Entity Publisher and Commit` ok under sql

### Realization notes

- Store mixins Entity-only; removed FS/Mongo EV cascade and dead commented loops on IDB/Postgres.
- Transformer no longer calls `resolveLiveEntityDefinitionForAction` for drop.
- ModelEndpoint drop payload Entity-only; regenerated types; `evolutionTraceWriter` treats drop like create (no EV uuid).
- Runner `dropEntity` no longer queries EntityVersions before drop.
- Fixed pre-existing broken `index.ts` exports of commented `getResolvedEntityPrimaryKey*`.
