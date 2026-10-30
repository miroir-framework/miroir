# Issue #519 — TDD Implementation Plan

> Vertical slices, RED → GREEN each, integration-first, no mocks. The server path is exercised
> through the emulated server (`RestClientStub` → `RestServer` handlers → server DomainController →
> real store sections) on the filesystem and Postgres profiles; the SQL translation through its
> public function `sqlStringForQuery`.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/519
Prerequisite plan: [`../497-FEATURE-visual-block-editor/tdd-implementation-plan-502.md`](../497-FEATURE-visual-block-editor/tdd-implementation-plan-502.md) (slice 4 moved here)
Working branch: `claude/519-server-app-model-environment`

**Resume note:** plan written 2026-10-30 from `_integration` at `973c1a7`.

---

## Scope

- **G1** server-side queries use the application's composite TransformerDefinitions.
- **G2** Postgres translates a query using an application composite.
- **G3** a composite saved through the server is seen by the server's next query.
- Out: composite parameters read with `getFromContext` in SQL; domain calls outside the REST handlers; sharing the MetaModel builder with the local caches (analysis §2).

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | Postgres translates an application composite | ✅ | `SqlGenerator.registry.unit.test.ts` |
| 2 | The server runs a query with the application's environment | ✅ | `serverModelEnvironment.519.integ.test.ts` (filesystem, sql) |
| 3 | A composite saved through the server is used by its next query | ✅ | same file, "saved" case |
| 4 | Docs, nonreg, AC | ✅ | nonreg, AC checklist |

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 SQL definitions | `transformerDefinitions` is the last, optional parameter of `sqlStringForRuntimeTransformer` and of `ITransformerHandler` (default `applicationTransformerDefinitions`); every handler passes it on; `sqlStringForQuery` and `sqlStringForCombiner` give `transformerDefinitionRegistry(modelEnvironment)` | G2 |
| D2 Server model | `ServerModelEnvironments` (miroir-core `4_services`): per PersistenceStoreControllerManager, per deployment, a promise of the `MiroirModelEnvironment` built from the model section read through the deployment's PersistenceStoreController; Miroir and unknown applications get `defaultMiroirModelEnvironment` | G1, G3 |
| D3 Forwarding | DomainController forwards its environment to the persistence store (queries and query templates); the filesystem, IndexedDB, MongoDB and bundled sections pass it to their extractor runners, which fall back to the default | G1, G2 |
| D4 Refresh | the REST handlers drop a deployment's environment after a model action, a store or bundle action, or an instance write on a `model` section | G3 |

## Allocated keys

- Composite used by the tests: `countBooks` (uuid `5f19c2a4-8d3e-4b7a-9c61-2e4d5b6a7c80`), no parameter, body `aggregate` over `getFromContext` `books`.
- No new Entity, Endpoint or MiroirTest suite: the server path and SQL generation are not reachable through MiroirTest (the runner calls the DomainController of the client, and SQL generation is internal to the Postgres store).

## Test execution conventions

| What | Command |
|---|---|
| SQL generator unit | `cd packages/miroir-store-postgres && npx vitest run test/SqlGenerator.registry.unit.test.ts` |
| Server path, filesystem | `npm run testByFile -w miroir-standalone-app -- serverModelEnvironment.519 --profile emulatedServer-filesystem` |
| Server path, Postgres | `MIROIR_POSTGRES_PASSWORD=… npm run testByFile -w miroir-standalone-app -- serverModelEnvironment.519 --profile emulatedServer-sql` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for miroir-core, miroir-store-*, miroir-localcache-redux, miroir-standalone-app |

---

## Slice 1 — Postgres translates an application composite

**Status:** ✅ DONE

RED: `packages/miroir-store-postgres/test/SqlGenerator.registry.unit.test.ts` (vitest: SQL generation is internal to the Postgres store). A query whose runtime transformer is `{ transformerType: "countBooks" }`: `sqlStringForQuery` with an environment whose `currentModel.transformerDefinitions` holds `countBooks` gives the same SQL as the query with the composite's body inlined; with the default environment it returns `QueryNotExecutable`.

GREEN: D1.

Refactor checkpoint: the handlers that call each other directly pass the definitions too.

Validation: the unit file; the existing `test/*.test.ts` of the package (5 failures of `SqlGenerator.sqlStringForExtractor.test.ts` predate the change); `tsc` miroir-store-postgres.

### Realization (2026-10-30)

RED: the "translates" case failed with `QueryNotExecutable` ("transformerType not found in applicationTransformerDefinitions: countBooks"). GREEN: `transformerDefinitions` (default the stock map) is the last parameter of `sqlStringForRuntimeTransformer`, of `ITransformerHandler` and of the 36 handlers; the 7 handlers that declared 7 parameters now declare the 9 of `ITransformerHandler` before it. The 40 recursive calls and the 19 calls of `sqlStringForApplyTo` pass it on (a script padded the omitted optional arguments with `undefined`, which keeps their defaults); `compileVirtualAttributeSqlExpression` takes it from `sqlStringForExtractor`, and `sqlStringForQuery` gives `transformerDefinitionRegistry(modelEnvironment)`. The refusal message now says "not found in the TransformerDefinition registry". The package's unit files: 91 pass, the 5 failures of `SqlGenerator.sqlStringForExtractor.test.ts` are the ones on `_integration`.

## Slice 2 — The server runs a query with the application's environment

**Status:** ✅ DONE

RED: `packages/miroir-standalone-app/tests/4_storage/issues/519-server-model-environment/serverModelEnvironment.519.integ.test.ts`. Library testbed with `countBooks` in its model section (written before the session starts the server environment); `domainController.handleAction(runBoxedQueryAction, queryExecutionStrategy "storage", runAsSql)` with runtime transformer `countBooks` returns the count of books, on filesystem and sql.

GREEN: D2, D3; `RestServer` handlers ask `ServerModelEnvironments` for the environment of the action's application.

Refactor checkpoint: the `TODO: get the right model` comments go; `handleQueryTemplateActionForServerONLY` declares the environment it receives.

Validation: the integ file on both profiles; `npm run nonreg:filesystem -- --runner shared --scope smoke,actions,core`.

### Realization (2026-10-30)

`ServerModelEnvironments` (`miroir-core/src/4_services/ServerModelEnvironments.ts`): `metaModelFromPersistenceStore` reads 13 model Entities with `getInstances` (a missing collection gives `[]`; the version-history arrays stay empty), `modelEnvironmentForApplicationModel` adds the deployment schema (`getMiroirFundamentalSchemaForDeployment`) and the endpoints (Miroir's, then the application's). One instance per PersistenceStoreControllerManager (`serverModelEnvironments`, a WeakMap), so the real server, Electron and the emulated server of each test session have their own. Miroir, an application without deployment or without an open store get `defaultMiroirModelEnvironment`, as before; a failed read logs a warning and gives it too. `RestServer`: model and instance actions, `/query` and `/queryTemplate` (both branches) take the environment of the action's application; the TODO comments are gone. Forwarding: `DomainController.executeBoxedExtractorOrQueryAction` passes its environment to `handlePersistenceActionForLocalPersistenceStore`; `handleQueryTemplateActionForServerONLY` declares and forwards one (its action implementation passes the action's environment); the redux saga and the zustand store pass it to `PersistenceStoreController.handleQueryTemplateActionForServerONLY`; the filesystem, IndexedDB, MongoDB and bundled sections and the Postgres template runner use `currentModel ?? defaultMetaModelEnvironment`. Deviation: the plan's "written before the session starts" setup was replaced by slice 3's order (refused, saved, used), which covers both slices in one file.

## Slice 3 — A composite saved through the server is used by its next query

**Status:** ✅ DONE

RED: same file. The query fails while `countBooks` is absent (which builds the server's environment), then `createInstance` of `countBooks` on the Library model section through the DomainController, then the same query returns the count.

GREEN: D4.

Validation: the integ file on both profiles.

### Realization (2026-10-30)

`forgetModelEnvironmentChangedBy` (`RestServer.ts`) drops the deployment's environment after a model action and after an instance write on a `model` section, and every environment after a store, bundle or server-routed action; the CRUD POST/PUT/DELETE handler drops it for a `model` section. The three cases pass on `emulatedServer-filesystem` and `emulatedServer-sql` (the sql run goes through `SqlDbQueryRunner`, so the composite is translated to SQL). Not run on `_integration` to show RED: the first case shows the server's registry decides, and without the forwarding the third case runs with Miroir's stock map.

## Slice 4 — Docs, nonreg, AC

**Status:** ✅ DONE

`docs/reference/transformers.md` ("Composite TransformerDefinitions"): the server and Postgres read the registry; the SQL parameter limit. Full `npm run nonreg:filesystem -- --runner shared`; the Postgres integ file. AC checklist:

| AC | Proof |
|---|---|
| Integration test on filesystem and Postgres, through the emulated server, a runtime transformer using an application composite gets its result | slice 2 and 3 cases |
| SqlGenerator unit case: translates with the registry, `QueryNotExecutable` without | slice 1 |
