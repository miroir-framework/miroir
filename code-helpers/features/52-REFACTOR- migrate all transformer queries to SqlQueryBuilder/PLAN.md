# Issue #52: Migrate SqlGenerator.ts to use SqlQueryBuilder.ts

## Summary

Most SQL queries in `SqlGenerator.ts` are built via raw string concatenation. The `SqlQueryBuilder.ts` module provides a semi-structured query builder (`sqlQuery`, `sqlSelectExpression`, `sqlQueryHereTableDefinition`, `sqlDefineColumn`, etc.) that improves readability and maintainability. This plan catalogues every function in `SqlGenerator.ts` and determines how to best migrate it.

---

## Classification of functions

### Case 1 — Already use `SqlQueryBuilder.ts` and need no further simplification

| Function | Lines | Builder functions used | Notes |
|---|---|---|---|
| `sqlStringForFreeObjectTransformer` | 1640–1921 | `sqlQuery`, `sqlDefineColumn`, `sqlQueryHereTableDefinition`, `sqlSelectExpression` | Already well-structured via the builder. Only internal attribute SQL (`getFreeObjectAttributesSql`) is still partial. |
| `sqlStringForListReducerToSpreadObjectTransformer` — `json_array` branch | 3097–3281 | `sqlQuery`, `sql_jsonb_object_agg`, `sql_jsonb_array_elements`, `sql_jsonb_each`, `sqlColumnAccessOld`, `sqlSelectColumns`, `sqlNameQuote` | Good builder usage already for the `json_array` branch. |
| `sqlStringForListReducerToIndexObjectTransformer` — `json_array` branch | 2926–3096 | `sqlQuery`, `sql_jsonb_object_agg`, `sql_jsonb_array_elements` | Good builder usage for the `json_array` branch. |

### Case 2 — Already use `SqlQueryBuilder.ts` but could be further simplified

| Function | Lines | Potential improvement |
|---|---|---|
| `sqlStringForListReducerToSpreadObjectTransformer` — `json` / `tableOf1JsonColumn` branch | 3200–3280 | Uses raw `"SELECT " + ... + ' AS ' + ...` string concatenation instead of `sqlQuery`. Should be migrated to `sqlQuery` like the `json_array` branch. |
| `sqlStringForListReducerToIndexObjectTransformer` — `json_array` branch | Uses raw string `'"' + applyToLabelElements +"\"" + " ->> " + "'" + ...` for JSON accessor; could be cleaned up with a helper or `bypass`. |

### Case 3 — Do NOT use `SqlQueryBuilder.ts` and COULD be simplified

These are the primary migration targets:

| Function | Lines | Current pattern | Suggested builder migration |
|---|---|---|---|
| `sqlStringForExtractor` | 514–588 | `SELECT * FROM "schema"."entity" WHERE ...` | Use `sqlQuery({ select: "*", from: [...], where: ... })` |
| `sqlStringForCombiner` | 438–511 | `SELECT "table".* FROM "schema"."table", "ref" WHERE ...` | Use `sqlQuery({ select: [...], from: [...], where: ... })` |
| `sqlStringForConditionalTransformer` | 1029–1138 | `"case when " + cond + " then " + then + " else " + else + " end"` | Use `sqlSelectExpression({ queryPart: "case", when, then, else })` for the CASE expression |
| `sqlStringForCaseTransformer` | 1430–1589 | `"case " + whenClauses.join(" ") + elseClause + " end"` | Extend `SqlQuerySelectExpressionSchema` with a multi-`when` CASE variant, then use `sqlSelectExpression` |
| `sqlStringForContextReferenceTransformer` | 3457–3578 | `"SELECT " + path + ' FROM "' + name + '"'` | Use `sqlQuery({ select: [...], from: [{ queryPart: "tableLiteral", name }] })` |
| `sqlStringForObjectEntriesTransformer` | 2840–2881 | `SELECT jsonb_agg(json_build_array(key, value)) AS "..." FROM "innerQuery", jsonb_each(...)` | Use `sqlQuery` with `{ queryPart: "call", fct: "jsonb_agg", params: [...] }` |
| `sqlStringForObjectValuesTransformer` | 2883–2924 | `SELECT jsonb_agg(value) AS "..." FROM "innerQuery", jsonb_each(...)` | Same as above |
| `sqlStringForDataflowObjectTransformer` | 3282–3456 | `SELECT jsonb_build_object(...) AS "..." FROM ...` (target=false branch) | Use `sqlQuery` for the jsonb_build_object SELECT |
| `sqlStringForObjectFullTemplateTransformer` | 2348–2695 | `"SELECT jsonb_build_object(" + pairs + ')...' + "FROM " + refs` | Use `sqlQuery` with `{ queryPart: "call", fct: "jsonb_build_object", ... }` |
| `sqlStringForObjectAlterTransformer` | 2696–2839 | Complex ROW_NUMBER + `||` merge pattern | Use `sqlQuery` for the SELECT + FROM + WHERE clause |
| `sqlStringForMustacheStringTemplateTransformer` | 3819–3990 | `SELECT ${parts.join(" || ")} AS "..."` | Use `sqlQuery` with bypass for the concatenation expression |
| `sqlStringForCountTransformer` | 726–974 | `SELECT json_build_object(...) FROM (...) LATERAL ...` | Use `sqlQuery` with `{ queryPart: "call", ... }` for aggregates |
| `sqlStringForUniqueTransformer` | 1922–2000 | `SELECT DISTINCT ON (...) ...` | Needs builder extension for DISTINCT ON (see Case 4) |
| `sqlStringForMapperListToListTransformer` | 2001–2204 | Nested subqueries with LATERAL | Use `sqlQuery` for the LATERAL join CTE SQL |
| `sqlStringForListPickElementTransformer` | 2205–2347 | `SELECT * FROM (...) ORDER BY ... LIMIT 1 OFFSET n` | Needs builder extension for LIMIT/OFFSET (see Case 4); `sqlQuery` for inner SELECT |
| `sqlStringForQuery` | 4121–4344 | WITH clause: `'"' + name + '" AS (' + sql + ')'` joined by separators | Introduce `sqlWith([...ctes], finalSelect)` builder |
| `sqlStringForNewUuidTransformer` | 3781–3817 | `select gen_random_uuid() AS "..."` | Use `sqlQuery({ select: [{ queryPart: "defineColumn", ... }] })` |
| `sqlStringForConstantAsExtractorTransformer` | 3644–3780 | `SELECT * FROM jsonb_to_recordset(...) AS x(...)` | Use `sqlQuery` with bypass |
| `getConstantSql` | 336–376 | `select $N::type AS "label"` | Use `sqlQuery({ select: [{ queryPart: "defineColumn", ... }] })` |
| `sqlStringForBoolExprTransformer` | 1140–1261 | `"case when " + conditionSql + " then true::boolean else false::boolean end"` | Use `sqlSelectExpression({ queryPart: "case", ... })` |
| `sqlStringForPlusTransformer` | 1264–1427 | `"select " + expr + ' AS "plus"'` | Use `sqlQuery` for top-level wrapping |

### Case 4 — Do NOT use `SqlQueryBuilder.ts` and would NOT benefit (or need builder extensions first)

| Function | Lines | Reason |
|---|---|---|
| `getIdAttributeForEntity` | 77–84 | No SQL generation, pure lookup |
| `parseSerializedCompositePkValue` | 135–155 | String parsing, no SQL |
| `getSchemaForEntity` | 157–168 | Pure lookup |
| `isJson` | 245–247 | Type predicate |
| `getSqlTypeForValue` | 275–334 | Type determination |
| `sqlWhereClauseForPk` | 95–113 | Low-level WHERE fragment; could become a builder helper |
| `sqlJoinConditionForPk` | 117–130 | Low-level JOIN ON fragment; could become a builder helper |
| `sqlIsFalsy` / `sqlIsNull` / `sqlIsNotNull` | 997–1027 | Boolean expression helpers; should move to `SqlQueryBuilder.ts` |
| `sqlStringForApplyTo` | 592–710 | Dispatcher, no direct SQL |
| `sqlStringForRuntimeTransformer` | 3992–4120 | Dispatcher, no direct SQL |
| `sqlStringForParameterReferenceTransformer` | 3580–3622 | Dispatcher |
| `sqlStringForObjectDynamicAccessTransformer` | 3624–3642 | Not implemented (stub) |
| `sqlStringForConstantAnyTransformer` | 382–402 | Delegates to `getConstantSql` |
| `sqlStringForConstantTransformer` | 405–422 | Delegates to `getConstantSql` |
| `sqlStringForListPickElementTransformer` | needs `LIMIT`/`OFFSET`/`ORDER BY`/`DISTINCT ON` in builder |
| `sqlStringForUniqueTransformer` | needs `DISTINCT ON`, `ORDER BY` |
| `sqlStringForCountTransformer` | needs `GROUP BY`, `HAVING`, `ORDER BY`, `LATERAL` |

---

## Plan (a): Functions to migrate to SqlQueryBuilder (from Cases 2 + 3)

Priority is based on frequency of raw concatenation, complexity, and ease of migration.

### Phase 1 — Low-risk, straightforward migrations

1. **`sqlStringForConditionalTransformer`** (lines 1029–1138) — Replace `"case when " + ... + " end"` with `sqlSelectExpression({ queryPart: "case", when, then, else })`.
2. **`sqlStringForBoolExprTransformer`** (lines 1140–1261) — Replace `"case when " + conditionSql + " then true::boolean else false::boolean end"` with `sqlSelectExpression({ queryPart: "case", ... })`.
3. **`sqlStringForPlusTransformer`** (lines 1264–1427) — Replace top-level `"select " + expr + ' AS "..."'` with `sqlQuery`.
4. **`sqlStringForNewUuidTransformer`** (lines 3781–3817) — Replace `'select gen_random_uuid() AS "..."'` with `sqlQuery`.
5. **`getConstantSql`** (lines 336–376) — Replace `'select $N::type AS "label"'` with `sqlQuery`.
6. **`sqlStringForObjectEntriesTransformer`** (lines 2840–2881) — Replace raw SELECT with `sqlQuery`.
7. **`sqlStringForObjectValuesTransformer`** (lines 2883–2924) — Replace raw SELECT with `sqlQuery`.

### Phase 2 — Moderate complexity migrations

8. **`sqlStringForContextReferenceTransformer`** (topLevelTransformer branch, lines 3512–3540) — Replace `"SELECT " + ... + ' FROM "..."'` with `sqlQuery`.
9. **`sqlStringForMustacheStringTemplateTransformer`** (lines 3819–3990) — Replace top-level `'SELECT ${concat} AS "..."'` with `sqlQuery`.
10. **`sqlStringForExtractor`** (lines 514–588) — Replace `'SELECT * FROM "schema"."entity" WHERE ...'` with `sqlQuery`.
11. **`sqlStringForCombiner`** (lines 438–511) — Replace `'SELECT "table".* FROM ...'` with `sqlQuery`.
12. **`sqlStringForCaseTransformer`** (lines 1430–1589) — Replace CASE expression building with `sqlSelectExpression` (requires extended `case` support, see Plan (b) #1).
13. **`sqlStringForListReducerToSpreadObjectTransformer`** — `json`/`tableOf1JsonColumn` branch (lines 3200–3280) — Migrate to `sqlQuery`.

### Phase 3 — Higher complexity / dependent on builder extensions

14. **`sqlStringForObjectFullTemplateTransformer`** (lines 2348–2695) — Migrate `jsonb_build_object` SELECT to `sqlQuery`.
15. **`sqlStringForObjectAlterTransformer`** (lines 2696–2839) — Migrate ROW_NUMBER + merge SELECT to `sqlQuery`.
16. **`sqlStringForDataflowObjectTransformer`** (lines 3282–3456) — Migrate `jsonb_build_object` SELECT to `sqlQuery`.
17. **`sqlStringForMapperListToListTransformer`** (lines 2001–2204) — Migrate CTE SQL strings to `sqlQuery`.
18. **`sqlStringForCountTransformer`** (lines 726–974) — Migrate aggregate SELECTs to `sqlQuery`. Depends on `GROUP BY`, `HAVING`, `ORDER BY`, `LATERAL` in the builder.
19. **`sqlStringForUniqueTransformer`** (lines 1922–2000) — Depends on `DISTINCT ON`, `ORDER BY` in the builder.
20. **`sqlStringForListPickElementTransformer`** (lines 2205–2347) — Depends on `LIMIT`, `OFFSET`, `ORDER BY` in the builder.
21. **`sqlStringForQuery`** (lines 4121–4344) — Migrate WITH clause assembly. Depends on `sqlWith` builder.
22. **`sqlStringForConstantAsExtractorTransformer`** (lines 3644–3780) — Use `sqlQuery` with bypass for `jsonb_to_recordset`.

---

## Plan (b): Improvements to `SqlQueryBuilder.ts`

### Non-controversial (can implement now)

1. **Multi-WHEN `case` expression** — The current `SqlQuerySelectExpressionSchema` `case` variant only supports `when` / `then` / `else` (single condition). Extend it to support `CASE discriminator WHEN val1 THEN result1 WHEN val2 THEN result2 ... ELSE default END` (used by `sqlStringForCaseTransformer`).
2. **Move `sqlIsFalsy`, `sqlIsNull`, `sqlIsNotNull`** from `SqlGenerator.ts` to `SqlQueryBuilder.ts` — These are reusable boolean expression helpers that don't depend on transformer-specific types.
3. **`sqlWith` builder function** — Add `sqlWith(ctes: {name: string, sql: string}[], finalSelect: string): string` to compose CTE WITH clauses. This is the most repetitive pattern in `sqlStringForQuery`.

### Require more design consideration (defer)

4. **`GROUP BY` / `HAVING` / `ORDER BY` support** in `SqlQuerySelectSchema` — Currently `sqlQuery` only has `select`, `from`, `where`. Adding groupBy/having/orderBy would enable migration of `sqlStringForCountTransformer`, `sqlStringForUniqueTransformer`, etc.
5. **`LIMIT` / `OFFSET` support** in `SqlQuerySelectSchema` — Needed for `sqlStringForListPickElementTransformer`.
6. **`DISTINCT ON` support** — Needed for `sqlStringForUniqueTransformer`.
7. **`LATERAL` join support** in `SqlQueryHereTableDefinitionSchema` — Needed for various aggregate/list transformers.
8. **`sqlWhereClauseForPk` / `sqlJoinConditionForPk` as builder functions** — Could move to `SqlQueryBuilder.ts` as WHERE/JOIN condition helpers.

---

## Test strategy

- **TDD baseline**: `RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- transformers.integ`
- **Non-regression**:
  - `ExtractorPersistenceStoreRunner.integ.test` (sql config)
  - `ExtractorTemplatePersistenceStoreRunner.integ.test` (sql config)
  - `PersistenceStoreController.integ.test` (sql config)
- 2 `ansiColumnsToJzodSchema` tests fail (no SQL implementation) — known, do not fix.

---

## Implementation Results

### Plan (b) — Non-controversial builder improvements (DONE)

- **`sqlIsFalsy`, `sqlIsNull`, `sqlIsNotNull`**: Moved from `SqlGenerator.ts` to `SqlQueryBuilder.ts` as exported functions. Removed local definitions from SqlGenerator.
- **`sqlWith`**: Added to `SqlQueryBuilder.ts` — composes CTE WITH clauses from `{ name, sql, sqlResultAccessPath }[]` arrays.
- **`SqlStringForTransformerElementValueType`**: Exported type alias from `SqlQueryBuilder.ts` for reuse.
- **`isJsonType`**: Added helper predicate to `SqlQueryBuilder.ts`.
- **`groupBy`**: Added to `RootSqlQuery` schema, types, zod validation, and `sqlQuery` builder function.

### Plan (a) Phase 1 — Low-risk migrations (DONE, 7 functions)

All migrated to use `sqlQuery` / `sqlSelectExpression` builder:

1. `getConstantSql` — `sqlQuery` with `defineColumn`
2. `sqlStringForConditionalTransformer` — `sqlSelectExpression` with `case`
3. `sqlStringForBoolExprTransformer` — `sqlSelectExpression` with `case`
4. `sqlStringForPlusTransformer` — `sqlQuery` for top-level wrapping (both single- and multi-element)
5. `sqlStringForNewUuidTransformer` — `sqlQuery` with `defineColumn`
6. `sqlStringForObjectEntriesTransformer` — `sqlQuery` with `call` expression for `jsonb_agg`
7. `sqlStringForObjectValuesTransformer` — `sqlQuery` with `call` expression for `jsonb_agg`

**Tests**: 177 passed, 2 failed (same as baseline) ✓

### Plan (a) Phase 2 — Moderate complexity migrations (DONE, 6 functions)

8. `sqlStringForContextReferenceTransformer` (topLevel branch) — `sqlQuery` with `tableLiteral` from
9. `sqlStringForMustacheStringTemplateTransformer` (both branches) — `sqlQuery` for no-placeholder and main branch
10. `sqlStringForExtractor` (both `extractorByPrimaryKey` and `extractorInstancesByEntity`) — `sqlQuery` with `where`
11. `sqlStringForCombiner` (`combinerOneToOne` and `combinerOneToMany`) — `sqlQuery` with `select` and `from` lists
12. `sqlStringForCaseTransformer` — `sqlQuery` with `defineColumn` wrapping the raw CASE expression (multi-WHEN stays as raw string since schema only supports single when/then/else)
13. `sqlStringForListReducerToSpreadObjectTransformer` (json/tableOf1JsonColumn) — `sqlQuery` with `groupBy`

**Tests**: 177 passed, 2 failed (same as baseline) ✓

### Regression Tests (ALL PASSED)

| Test Suite | Config | Result |
|---|---|---|
| `ExtractorPersistenceStoreRunner.integ.test` | emulatedServer-sql | 12/12 passed |
| `ExtractorTemplatePersistenceStoreRunner.integ.test` | emulatedServer-sql | 6/6 passed |
| `PersistenceStoreController.integ.test` | emulatedServer-sql | 11/11 passed |

### Plan (b) — Builder extensions for Phase 3 (DONE)

- **DISTINCT ON**: Added `distinctOn` field to `RootSqlQuery` schema, types, zod, and `sqlQuery` builder function.
- **ORDER BY**: Added `orderBy` (string) field to `RootSqlQuery`.
- **LIMIT / OFFSET**: Added `limit` (number) and `offset` (number) fields to `RootSqlQuery`.
- **HAVING**: Added `having` (string) field to `RootSqlQuery`.
- **LATERAL**: Added `lateral` (boolean) field to `SqlQueryHereTableDefinitionSchema` hereTable variant, with `LATERAL` prefix in `sqlQueryHereTableDefinition`.
- **Jzod schema**: Updated `SqlQueryBuilder.ts` Jzod schema to include all new fields.
- **TDD tests**: 16+ new unit tests for all extensions (ORDER BY, LIMIT/OFFSET, DISTINCT ON, LATERAL, HAVING, sqlWith, combined clauses). All 59 SqlQueryBuilder unit tests pass.

### Plan (a) Phase 3 — Higher complexity migrations (DONE, 9 functions)

14. `sqlStringForObjectFullTemplateTransformer` — `sqlQuery` with `bypass` for `jsonb_build_object`, `tableLiteral` from, `orderBy`
15. `sqlStringForObjectAlterTransformer` — `sqlQuery` with `bypass` for ROW_NUMBER/merge expression, `where` clause
16. `sqlStringForDataflowObjectTransformer` — `sqlQuery` for both target and non-target branches, `sqlNameQuote` for consistency
17. `sqlStringForMapperListToListTransformer` — `sqlQuery` for nested 3-level subqueries and final SELECT in `extraWith`
18. `sqlStringForCountTransformer` — `sqlQuery` with `groupBy`, `having`, `orderBy`, `LATERAL` hereTable entries; refactored `buildHavingSql` to return `havingExpression`
19. `sqlStringForUniqueTransformer` — `sqlQuery` with `distinctOn`, `orderBy`, `LATERAL`, nested queries
20. `sqlStringForListPickElementTransformer` — `sqlQuery` with `orderBy`, `limit`, `offset`, `LATERAL`, `bypass` for complex aggregates
21. `sqlStringForQuery` — Replaced `queryParts[]` + `tokenSeparatorForWithRtn` assembly with `sqlWith(ctes, finalSelect)`; removed `tokenSeparatorForWithRtn` import
22. `sqlStringForConstantAsExtractorTransformer` — `sqlQuery` with `bypass` for `jsonb_to_recordset`, `call` for `jsonb_array_elements`, `defineColumn` for scalar

**Tests**: 177 passed, 2 failed (same as baseline) ✓

### Final Regression Tests — Phase 3 (ALL PASSED)

| Test Suite | Config | Result |
|---|---|---|
| `transformers.integ.test` | (in-memory) | 177 passed, 2 failed (baseline) |
| `ExtractorPersistenceStoreRunner.integ.test` | emulatedServer-sql | 12/12 passed |
| `ExtractorTemplatePersistenceStoreRunner.integ.test` | emulatedServer-sql | 6/6 passed |
| `PersistenceStoreController.integ.test` | emulatedServer-sql | 11/11 passed |
| `SqlQueryBuilder.test.ts` (unit) | vitest | 59/59 passed |
