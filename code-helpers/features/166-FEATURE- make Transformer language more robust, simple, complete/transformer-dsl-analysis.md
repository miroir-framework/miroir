# Miroir Transformer DSL — Comprehensive Analysis

> **Purpose**: Evaluate the current core transformer language for use as a full-blown functional DSL for business logic. Organized by programming-language aspects. Designed for consumption by AI agents performing future refactorings.
>
> **Scope**: Core transformers only — excludes MLS/schema transformers (`defaultValueForMLSchema`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `unfoldSchemaOnce`, `jzodTypeCheck`) and spreadsheet transformers (`spreadSheetToJzodSchema`).
>
> **Constraints**: Transformers must remain (1) side-effect free, (2) interpretable both in-memory and via SQL, (3) non-recursive (no recursive function calls).
>
> **Date**: 2026-02-27

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Literals and Constants](#2-literals-and-constants)
3. [Variable Access and Scoping](#3-variable-access-and-scoping)
4. [Arithmetic Expressions](#4-arithmetic-expressions)
5. [String Expressions](#5-string-expressions)
6. [Boolean and Comparison Expressions](#6-boolean-and-comparison-expressions)
7. [Conditional Branching](#7-conditional-branching)
8. [Object Construction and Manipulation](#8-object-construction-and-manipulation)
9. [List/Collection Operations](#9-listcollection-operations)
10. [Aggregation](#10-aggregation)
11. [Sequential Computation (Binding/Dataflow)](#11-sequential-computation-bindingdataflow)
12. [Function Abstraction and Composition](#12-function-abstraction-and-composition)
13. [Error Handling](#13-error-handling)
14. [Type System and Validation](#14-type-system-and-validation)
15. [Side-Effect Boundary (UUID Generation)](#15-side-effect-boundary-uuid-generation)
16. [Domain-Specific Utilities](#16-domain-specific-utilities)
17. [Cross-Cutting Concerns](#17-cross-cutting-concerns)
18. [Summary: Gaps and Recommendations](#18-summary-gaps-and-recommendations)

---

## 1. Architecture Overview

### Current Design

The transformer system uses a **definition-driven dispatch** architecture:

- **Type definitions**: Generated from Jzod schemas → TypeScript types + Zod validators in `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts`
- **In-memory runtime**: `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` (~4000 lines)
- **SQL runtime**: `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts` (~4100 lines)
- **Registry**: `applicationTransformerDefinitions` maps `transformerType` → `TransformerDefinition`, which points to either a `libraryImplementation` (TypeScript handler fn) or a `transformer` (composite definition)
- **Dual runtimes**: Both the in-memory and SQL runtimes read from the same registry, ensuring identical semantics

### Two-Phase Evaluation

Every transformer has an optional `interpolation: "build" | "runtime"` field:
- **`"build"`** phase: Template expansion at definition time (compile-time). Uses `transformerParams` ("parameters").
- **`"runtime"`** phase: Execution at runtime. Uses `contextResults` ("context").
- A transformer is evaluated only when `step == interpolation` (default `"build"`).

### Type Hierarchy

| Union Type | Scope | Variable Access |
|---|---|---|
| `TransformerForBuild` | Build phase only | `getFromParameters` |
| `TransformerForBuildPlusRuntime` | Both phases | `getFromParameters` + `getFromContext` |
| `TransformerForRuntime` (internal) | Runtime only | `getFromContext` |

All three accept **primitive values** (string, number, boolean), **arrays**, and **plain objects** (without `transformerType`) as implicit `returnValue` members.

### Assessment

| Aspect | Status | Notes |
|---|---|---|
| Dual-runtime (in-memory + SQL) | ✅ Good | Both runtimes use the same registry; SQL coverage is near-complete |
| Definition-driven dispatch | ✅ Good | Extensible; composite transformers work in both runtimes |
| Two-phase evaluation | ⚠️ Complex | Powerful but adds cognitive overhead; the build/runtime distinction is not always intuitive |
| Error propagation | ✅ Good | `TransformerFailure` chain with `innerError` for root cause analysis |
| Schema-first approach | ✅ Good | Jzod schema → TS types → Zod validators — single source of truth |

---

## 2. Literals and Constants

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `returnValue` | Return a literal value (`value` field) | ✅ | ✅ |
| `constantAsExtractor` | Return a literal with optional `valueJzodSchema` | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- `returnValue` handles all JS primitive types (string, number, bigint, boolean, undefined, null, object, array)
- `constantAsExtractor` allows an optional Jzod schema annotation on the constant — useful for type-aware SQL generation
- Plain values (not wrapped in `{transformerType: ...}`) are automatically treated as literals by the dispatch

**Potential issues**:
- **`returnValue` vs `constantAsExtractor` overlap**: Both serve as literal constructors. The distinction exists for SQL generation (extractor context vs expression context) but is confusing for DSL users
- **No `null` literal transformer**: `returnValue` with `value: null` works in-memory but SQL behavior may vary
- **`symbol` and `function` types** are explicitly rejected by `returnValue` — correct behavior for a serializable DSL

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| LIT-1 | Deprecate or merge `constantAsExtractor` into `returnValue` with optional schema hint | Medium | Reduces conceptual overhead |
| LIT-2 | Add explicit `null` transformer or ensure `returnValue` + `null` has documented SQL semantics | Low | Clarity for null comparisons |

---

## 3. Variable Access and Scoping

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `getFromParameters` | Lookup from build-time parameters (`transformerParams`) | ✅ | ✅ |
| `getFromContext` | Lookup from runtime context (`contextResults`) | ✅ | ✅ |
| `accessDynamicPath` | Dynamic property traversal using a path array | ✅ | ⚠️ partial |

### Analysis

**Satisfactory aspects**:
- Both `getFromParameters` and `getFromContext` support `referenceName` (direct key) and `referencePath` (dot-path traversal)
- `safe` mode (returns `undefined` instead of failure on missing keys) — essential for optional field access
- `accessDynamicPath` supports computed path segments (each segment can itself be a transformer)

**Potential issues**:
- **`getFromParameters` vs `getFromContext` naming confusion**: Both do the same thing (key lookup) but on different data sources. The two-phase model forces users to know which "bank" their data is in, adding friction
- **`accessDynamicPath` initial accumulator bug**: The `reduce` call (line ~2058) starts with `undefined` as accumulator — first path element must resolve to a root object from context, but this is fragile and undocumented
- **`accessDynamicPath` SQL** has a TODO/not-implemented for certain cases (SqlGenerator.ts line ~3410)
- **No destructuring**: Cannot bind multiple variables from an object in one step — must use multiple `getFromContext` calls or `dataflowObject` steps
- **No `let`-style local binding** outside `dataflowObject` — all variable binding requires the heavyweight `dataflowObject` wrapper

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| VAR-1 | Consider unifying `getFromParameters`/`getFromContext` into a single `get` with an explicit `from: "params" \| "context" \| "auto"` | Medium | Reduces concept count; `"auto"` checks both |
| VAR-2 | Fix `accessDynamicPath` initial accumulator — use first path element to resolve root object | High | Current behavior is fragile |
| VAR-3 | Complete `accessDynamicPath` SQL implementation | High | SQL parity |
| VAR-4 | Add a `destructure` transformer for multi-variable binding from a single object | Low | Convenience for complex dataflows |
| VAR-5 | Add a `let` / `bind` lightweight transformer (single variable binding without full `dataflowObject`) | Medium | Ergonomic local binding |

---

## 4. Arithmetic Expressions

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `+` | Addition (numbers) or concatenation (strings) | ✅ | ✅ |
| `numericOp` | Unified numeric ops with `op: "-" | "*" | "/"` and `args: Transformer[]` | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- Accepts N operands via `args: Transformer[]` (not limited to binary)
- Left-to-right fold semantics
- BigInt support (with `mlSchema.type === "bigint"` detection)
- Type-safe: rejects mixed number/string operands

**Potential issues**:
- ~~**Only addition/concatenation** — no subtraction, multiplication, division, or modulo~~ **Resolved for subtraction/multiplication/division (ARITH-1/2/3); modulo remains open**
- **No unary minus** (negation)
- **No numeric functions**: `abs`, `floor`, `ceil`, `round`, `min`, `max` are absent
- **`args` naming** is generic — could be confusing vs object/list operation `args`
- For SQL generation, `+` maps cleanly (Postgres `+` for numbers, `||` for strings). Other arithmetic operators would also map cleanly to SQL

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| ARITH-1 | ~~Add `-` (subtraction) transformer, same `args: Transformer[]` shape~~ **DONE** | High | Basic arithmetic necessity |
| ARITH-2 | ~~Add `*` (multiplication) transformer~~ **DONE** | High | Basic arithmetic necessity |
| ARITH-3 | ~~Add `/` (division) transformer with defined behavior for division by zero~~ **DONE** | High | Basic arithmetic necessity |
| ARITH-4 | Add `%` (modulo) transformer | Medium | Common in pagination, cycling logic |
| ARITH-5 | Add `negate` / unary `-` transformer | Medium | Sign inversion |
| ARITH-6 | Add `math` transformer with `function: "abs" \| "floor" \| "ceil" \| "round" \| "min" \| "max"` | Medium | All map directly to SQL functions |
| ARITH-7 | Consider a unified `arithmetic` transformer: `{ op: "+" \| "-" \| "*" \| "/" \| "%", args: [...] }` similar to how `boolExpr` unifies boolean ops | Medium | Consistency with `boolExpr` pattern |

---

## 5. String Expressions

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `mustacheStringTemplate` | Mustache-style string interpolation (`{{var}}`) | ✅ | ✅ |
| `+` (with strings) | String concatenation | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- Mustache templates are familiar and readable for simple interpolation
- Templates can reference both params and context (depending on `interpolation`)
- String concatenation via `+` is type-safe (rejects number+string mixing)

**Potential issues**:
- **Mustache is flat**: No control flow, no nested expressions — only variable substitution. For complex string building, must combine `+` with many `mustacheStringTemplate` calls
- **No string manipulation functions**: No `substring`, `split`, `join`, `replace`, `trim`, `toLowerCase`, `toUpperCase`, `startsWith`, `endsWith`, `includes`, `length`, `indexOf`, or `match`/regex
- **Mustache does not go through `transformer_extended_apply`**: Variables must be in the flat params/context object — cannot use nested transformer evaluation for template data
- **SQL mapping of mustache**: SQL generation must parse the mustache template and convert to SQL string interpolation/concatenation — this is a complex, fragile mapping

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| STR-1 | Add `stringOp` transformer: `{ op: "substring" \| "trim" \| "toLowerCase" \| "toUpperCase" \| "replace" \| "split" \| "join" \| "length", ... }` | High | All map to SQL functions (`SUBSTRING`, `TRIM`, `LOWER`, `UPPER`, `REPLACE`, `STRING_TO_ARRAY`, `ARRAY_TO_STRING`, `LENGTH`) |
| STR-2 | Add `stringTest` transformer: `{ op: "startsWith" \| "endsWith" \| "includes" \| "matches", ... }` returning boolean | Medium | Maps to SQL `LIKE`, `SIMILAR TO`, `~` |
| STR-3 | Consider `templateString` as a replacement for `mustacheStringTemplate` that uses nested transformer evaluation for each interpolation slot | Low | More composable, but complex SQL mapping |
| STR-4 | Add `format` / `sprintf`-style transformer for formatted number/date output | Low | Maps to SQL `TO_CHAR` |

---

## 6. Boolean and Comparison Expressions

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `boolExpr` | Unified boolean/comparison expression with `operator` field | ✅ | ✅ |

**`boolExpr` operators**: `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `isNull`, `isNotNull`, `!`

### Analysis

**Satisfactory aspects**:
- Comprehensive set of comparison and logical operators in a single transformer
- Unary operators (`isNull`, `isNotNull`, `!`) correctly skip `right` evaluation
- Full SQL mapping for all operators
- `left` and `right` are full recursive transformers — can nest arbitrarily

**Potential issues**:
- **Loose equality** (`==` in JS): `0 == ""` is `true`, `null == undefined` is `true`. SQL `=` has stricter semantics. This semantic mismatch between JS and SQL runtimes is a **correctness hazard**
- **No strict equality (`===`)**: Cannot distinguish `0` from `""` or `null` from `undefined`
- **Legacy `transformerType` shortcuts**: Code in `Runner_InstallApplication.tsx` uses `transformerType: "&&"`, `transformerType: "isNotNull"`, `transformerType: "!="` directly — these are **not registered** in `applicationTransformerDefinitions` and would fail at dispatch. This indicates a legacy pattern that was supplanted by `boolExpr` but not fully migrated
- **Unknown operators silently return `false`**: The `default` case in the switch returns `false` instead of a `TransformerFailure` — could mask typos
- **No `in` / `notIn` operator**: Cannot test set membership (common in business logic: "status in ['active', 'pending']"). SQL `IN (...)` is a basic construct
- **No `between` operator**: Must compose `>=` and `<=` with `&&` — verbose for range checks. SQL `BETWEEN` is standard
- **No `typeof` / type-checking operator**: Cannot branch on the type of a value

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| BOOL-1 | Switch from JS `==` to `===` (strict equality), or add `===` as a separate operator | High | JS/SQL semantic consistency |
| BOOL-2 | Add `in` / `notIn` operators: `{ operator: "in", left: value, right: array }` | High | Maps to SQL `IN (...)`; very common in business rules |
| BOOL-3 | Add `between` operator: `{ operator: "between", left: value, right: [low, high] }` | Medium | Maps to SQL `BETWEEN`; convenience |
| BOOL-4 | Return `TransformerFailure` for unknown operators instead of silent `false` | High | Bug prevention |
| BOOL-5 | Clean up legacy `transformerType` shortcuts (`"&&"`, `"isNotNull"`, etc.) — either register them as aliases in the dispatch or migrate all call sites to `boolExpr` | High | Consistency; prevent runtime failures |
| BOOL-6 | Add `typeOf` operator returning a type string | Low | Dynamic type testing |

---

## 7. Conditional Branching

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `ifThenElse` | If-then-else with recursive condition and branches | ✅ | ✅ |
| `case` | Pattern matching: discriminator + when/then pairs + else | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- `ifThenElse` is the standard conditional — well-understood, maps cleanly to SQL `CASE WHEN ... THEN ... ELSE ... END`
- `case` provides multi-way branching with a discriminator, mapping to SQL `CASE discriminator WHEN ... THEN ... END`
- Both support omitting branches: `ifThenElse` defaults to `true`/`false`; `case` defaults to `undefined`
- All sub-expressions are fully recursive transformers

**Potential issues**:
- **`ifThenElse` defaults** (`true`/`false`) are surprising — an omitted `then` returning `true` is non-obvious. Defaulting to `undefined` or requiring explicit branches would be safer
- **`case` uses loose equality** (`==`) for when-matching — same JS/SQL semantic mismatch as `boolExpr`
- **No guard-style pattern matching**: Each `when` in `case` is a simple equality check against the discriminator. Cannot express `when age > 18` — must fall back to nested `ifThenElse`
- **`case` returns `undefined` on no match without `else`**: Silent failure; SQL `CASE` returns `NULL` which is analogous, but could mask logic errors

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| COND-1 | Change `ifThenElse` defaults from `true`/`false` to `undefined` (or require explicit branches) | Medium | Less surprising semantics |
| COND-2 | Add guard-style `case` variant where `when` entries are boolean expressions, not equality checks | Medium | More expressive pattern matching; maps to SQL `CASE WHEN condition THEN ...` |
| COND-3 | Use strict equality in `case` discriminator matching | Medium | Consistency with BOOL-1 |

---

## 8. Object Construction and Manipulation

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `createObject` | Build an object from key→transformer map (parallel evaluation) | ✅ | ✅ |
| `createObjectFromPairs` | Build an object from an array of `{ attributeKey, attributeValue }` definitions | ✅ | ✅ |
| `object_fromEntries` | Build an object from key/value entry tuples | ✅ | ✅ |
| `mergeIntoObject` | Shallow-merge a base object (`applyTo`) with an override object (`definition`) | ✅ | ✅ |
| `getObjectEntries` | Return `Object.entries()` of an object | ✅ | ✅ |
| `getObjectValues` | Return `Object.values()` of an object | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- `createObject` is the workhorse for building result objects — clean, intuitive
- `createObjectFromPairs` allows computed keys (the key itself can be a transformer) — essential for dynamic schemas
- `mergeIntoObject` allows `referenceToOuterObject` so the override can reference the base — useful for "update field X" patterns
- `getObjectEntries` / `getObjectValues` provide object decomposition — mirror JS built-ins

**Potential issues**:
- **No `getObjectKeys`**: `Object.keys()` equivalent is missing — must use `getObjectEntries` + `mapList` to extract keys
- **No `omit` / `pick`**: Cannot select a subset of keys or exclude specific keys from an object — very common in data transformation
- **No deep merge**: `mergeIntoObject` does shallow spread (`{...base, ...override}`) — nested objects are replaced entirely
- **No `delete` / `removeKey`**: Cannot remove a key from an object
- **`createObject` vs `createObjectFromPairs` confusion**: Both create objects but with different input shapes. `createObjectFromPairs` additionally supports `applyTo`, `referenceToOuterObject`, and `applyFunction` — the extra features make it heavier
- **No `spread` / `concat` for objects**: Cannot merge N objects in one step; must chain `mergeIntoObject` calls

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| OBJ-1 | Add `getObjectKeys` transformer | Medium | Completes the `Object.keys/values/entries` triad; maps to SQL `jsonb_object_keys` |
| OBJ-2 | Add `pick` transformer: `{ keys: string[], applyTo }` → subset of object | High | Very common; maps to SQL `jsonb_build_object` with selected keys |
| OBJ-3 | Add `omit` transformer: `{ keys: string[], applyTo }` → object minus specified keys | High | Complement of `pick`; maps to SQL `applyTo - 'key'` (jsonb) |
| OBJ-4 | Add `deepMerge` option to `mergeIntoObject` or a separate `deepMergeObjects` transformer | Low | Required for nested config updates |
| OBJ-5 | Add `removeKey` / `deleteKey` transformer | Medium | Object key deletion |
| OBJ-6 | Add `spreadObjects` transformer: merge N objects in one step | Low | Convenience; reduces nesting |
| OBJ-7 | Add `hasKey` / `hasOwnProperty` boolean transformer | Medium | Object key existence check; maps to SQL `jsonb ? 'key'` |

---

## 9. List/Collection Operations

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `mapList` | Map a transformer over each element of a list (or object values) | ✅ | ✅ |
| `filterList` | Filter list elements with a predicate transformer | ✅ | ✅ |
| `find` | Return first list element matching a predicate | ✅ | ✅ |
| `sortList` | Sort a list by field/expression and direction | ✅ | ✅ |
| `listLength` | Return list length as a number | ✅ | ✅ |
| `concatLists` | Concatenate multiple lists | ✅ | ✅ |
| `pickFromList` | Pick an element by index (supports negative indexing) | ✅ | ✅ |
| `indexListBy` | Convert list to object keyed by an attribute | ✅ | ✅ |
| `listReducerToSpreadObject` | Spread all objects in a list into one merged object | ✅ | ✅ |
| `getUniqueValues` | Extract unique values of a given attribute from a list | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- `mapList` is the primary iteration primitive — works on both arrays and objects (treating object as entries)
- `mapList` supports `elementTransformer` as a full recursive transformer — highly composable
- `mapList` supports `orderBy` for deterministic output ordering
- `pickFromList` supports negative indexing (`-1` = last element) — Pythonic convenience
- `pickFromList` returns `undefined` on out-of-bounds (SQL-compatible)
- `indexListBy` is a clean "GROUP BY key" operation — `Object.fromEntries` semantics
- `getUniqueValues` maps to SQL `DISTINCT`

**Potential issues — MAJOR GAPS**:
- ~~**No `filter` / `filterList`**: Cannot filter a list by a predicate. This is arguably the most critical missing collection operation. Currently, filtering requires `mapList` + `ifThenElse` returning `null` + a custom "remove nulls" step — extremely verbose~~ **DONE (LIST-1)**
- ~~**No `find` / `findFirst`**: Cannot find the first element matching a predicate~~ **DONE (LIST-2)**
- **No `flatMap`**: Cannot flatten nested lists produced by mapping
- **No `reduce` / `fold`**: The only reducer is `listReducerToSpreadObject` (spread merge). No general-purpose reduce with accumulator
- ~~**No `sort`**: `orderBy` is available on some transformers but there's no standalone sort transformer~~ **DONE (LIST-3)**
- **No `some` / `any`**: Cannot test if any element matches a predicate (boolean result)
- **No `every` / `all`**: Cannot test if all elements match a predicate (boolean result)
- ~~**No `concat` / `append`**: Cannot concatenate two lists~~ **DONE (LIST-6)**
- **No `flatten`**: Cannot flatten a list of lists
- **No `zip`**: Cannot combine two lists element-wise
- **No `take` / `drop` / `slice`**: Cannot take/skip N elements from a list
- ~~**No `length` / `count`**: Must use `aggregate` without `groupBy` to count — awkward. A direct `listLength` would be cleaner~~ **Resolved for `listLength` (LIST-4), aggregate gap note still applies for grouped counting use-cases**
- **No `reverse`**: Cannot reverse a list
- **No `head` / `tail`**: Must use `pickFromList` with index 0 / -1 — works but not idiomatic
- **`mapList` on objects**: Works but semantics are unclear from the name. Consider a separate `mapObject` or rename to `map`
- **`indexListBy` loses duplicates**: Last entry with a given key wins — no aggregate or array-collect behavior

### Recommendations

| ID | Recommendation | Priority | Status | Rationale |
|---|---|---|---|---|
| LIST-1 | **~~Add `filterList`~~**: `{ applyTo, predicate: Transformer (→ boolean) }` | **Critical** | **DONE** | Most important missing operation. Maps to SQL `WHERE`. Without it, business logic requiring filtering is extremely verbose |
| LIST-2 | ~~Add `find` / `findFirst`~~: `{ applyTo, predicate }` → first matching element or `null` | High | **DONE** | Common operation; maps to SQL `... WHERE ... LIMIT 1` |
| LIST-3 | ~~Add `sortList`~~: `{ applyTo, by: string \| Transformer, direction: "asc" \| "desc" }` | High | **DONE** | Standalone sort; maps to SQL `ORDER BY` |
| LIST-4 | Add `listLength` / `count`: `{ applyTo }` → number | High | | Simpler than `aggregate`; maps to SQL `array_length` or `COUNT(*)` |
| LIST-5 | Add `flatMap`: `{ applyTo, elementTransformer }` | Medium | | Maps to SQL `LATERAL`; essential for one-to-many transformations |
| LIST-6 | Add `concatLists`: `{ lists: Transformer[] }` → merged list | Medium | DONE | Maps to SQL `ARRAY_CAT` or `UNION ALL` |
| LIST-7 | Add `some` / `every`: `{ applyTo, predicate }` → boolean | Medium | | Maps to SQL `EXISTS (SELECT ... WHERE ...)` / `NOT EXISTS (SELECT ... WHERE NOT ...)` |
| LIST-8 | Add `slice`: `{ applyTo, start?, end? }` → sub-list | Medium | | Maps to SQL `OFFSET ... LIMIT ...` or `array[start:end]` |
| LIST-9 | Add `reduce` / `fold`: `{ applyTo, initialValue, reducer: Transformer }` | Low | | General purpose but hard to map to SQL. May be limited to in-memory-only |
| LIST-10 | Add `reverse`: `{ applyTo }` | Low | | Convenience; SQL can use `ORDER BY ... DESC` |
| LIST-11 | Add `flatten`: `{ applyTo, depth? }` | Low | | Maps to SQL `unnest` |
| LIST-12 | Add `groupBy` as standalone: `{ applyTo, by: string, collect: Transformer }` → `Record<key, element[]>` | Medium | | More general than `aggregate`; maps to SQL `GROUP BY` |

---

## 10. Aggregation

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `aggregate` | Count with optional `groupBy` (single attribute or array of attributes) | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- Supports both ungrouped count and grouped count
- `groupBy` accepts string or string array — flexible grouping
- Returns SQL-compatible result set format (`[{ ...groupKeys, aggregate: count }]`)

**Potential issues**:
- **Name is misleading**: Called `aggregate` but only supports `COUNT`. `SUM`, `AVG`, `MIN`, `MAX` are missing in the in-memory implementation
- **No `attribute` for aggregation target**: The `attribute` field is defined in the type but not used meaningfully in the in-memory implementation — counting always counts rows, not distinct values of an attribute
- **No `having` clause**: Cannot filter groups after aggregation
- **SQL implementation may support more aggregate functions** than the in-memory one — potential semantic divergence

### Recommendations

| ID | Recommendation | Priority | Status | Rationale |
|---|---|---|---|---|
| AGG-1 | Extend `aggregate` with `function: "count" \| "sum" \| "avg" \| "min" \| "max" \| "json_agg"  \| "json_agg_strict"` | High | **DONE** | All map directly to SQL aggregates. Essential for business reporting |
| AGG-2 | Add `having` clause support to `aggregate`: `{ having: Transformer (→ boolean) }` | Medium | **DONE** | SQL `HAVING`; enables post-group filtering |
| AGG-3 | Rename `aggregate` field in results from `aggregate` to the function name (e.g., `count`, `sum`) for clarity | Low | **DONE** | Result readability. Backward compatible: legacy (no `function`) still uses `"aggregate"` key |
| AGG-4 | Add `distinct` flag on `aggregate` for `COUNT(DISTINCT ...)` and other aggregates | Medium | **DONE** | SQL `COUNT(DISTINCT ...)`; works with all aggregate functions |

---

## 11. Sequential Computation (Binding/Dataflow)

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `dataflowObject` | Sequential evaluation with accumulated context — each step can reference prior steps | ✅ | ✅ |
| `dataflowSequence` | **Defined in types but NOT IMPLEMENTED** in either runtime | ❌ | ❌ |

### Analysis

**Satisfactory aspects**:
- `dataflowObject` is the core "let*" / sequential-binding form — the most important control-flow construct in the DSL
- Each step builds on all prior steps via context accumulation (`{ ...contextResults, ...resultObject }`)
- `target` field allows selecting a single output key — avoids exposing intermediate values
- Maps to SQL CTEs (Common Table Expressions) — excellent SQL correspondence

**Potential issues**:
- **`dataflowSequence` is a dead type**: Defined in generated types but has NO implementation — this is confusing for DSL users who may try to use it
- **`dataflowObject` does not check for step failures**: A `TransformerFailure` from step N is stored in the result object and visible to later steps as a truthy object — it does not short-circuit the sequence
- **Key ordering dependency in `Object.entries` iteration**: `dataflowObject` depends on `Object.entries` preserving insertion order — this is guaranteed in modern JS but is a subtle dependency for a DSL
- **No early-return / break semantic**: Cannot exit a `dataflowObject` early based on a condition
- **Name confusion**: `dataflowObject` returns an object (record of all intermediate + final results), not a single value — the name doesn't convey sequential semantics. A name like `letBindings`, `sequence`, or `pipeline` would be clearer

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| SEQ-1 | Either implement `dataflowSequence` or remove it from the type definitions | High | Dead types cause confusion |
| SEQ-2 | Add failure propagation to `dataflowObject`: if a step returns `TransformerFailure`, short-circuit and return the failure | High | Currently silent failures propagate through the chain |
| SEQ-3 | Consider renaming `dataflowObject` to `let` or `pipeline` or `sequence` for DSL clarity | Medium | Better conveys sequential semantics |
| SEQ-4 | Add an optional `earlyReturn: { condition: Transformer, value: Transformer }` capability to `dataflowObject` steps | Low | Enables conditional bailout from long sequences |

---

## 12. Function Abstraction and Composition

### Current Mechanism

Transformers support composition via `TransformerDefinition` with `transformerImplementationType: "transformer"`:

```typescript
{
  transformerImplementationType: "transformer",
  definition: TransformerForBuildPlusRuntime  // the composite body
}
```

The `transformerInterface` (Jzod schema) defines the parameter schema. At call time, parameters are evaluated (call-by-value), and the composite body is executed with evaluated parameters in context.

### Analysis

**Satisfactory aspects**:
- **Parametric composition**: Composite transformers receive evaluated arguments — clean call-by-value semantics
- **Interface-driven**: Parameter schemas provide documentation and potential validation
- **Transparent to runtimes**: Both in-memory and SQL dispatch handle composite transformers identically
- **No recursion**: By design — composite transformer calls don't allow self-reference, preventing infinite loops

**Potential issues**:
- **No lambda / anonymous function**: Cannot define a local function inline — must register in `applicationTransformerDefinitions`
- **No higher-order transformers**: Cannot pass a transformer as an argument to another transformer (except via `elementTransformer` in `mapList` and similar)
- **No function composition operator**: Cannot compose two transformers `f` then `g` into `g(f(x))` without wrapping in `dataflowObject`
- **No partial application / currying**: Cannot partially apply arguments to a transformer
- **`applyFunction` escape hatch**: Some transformers support `applyFunction` — a runtime-only JS function reference that bypasses the DSL. This is not serializable and not SQL-translatable — it should be documented as a migration/legacy mechanism, not a DSL feature

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| FN-1 | Add `pipe` / `compose` transformer: `{ steps: Transformer[] }` where each step's output is the next step's input | Medium | Simpler than `dataflowObject` for linear transformation chains |
| FN-2 | Deprecate `applyFunction` escape hatch or document it as internal-only | Medium | Not serializable or SQL-translatable |
| FN-3 | Consider `apply` / `callTransformer`: invoke a registered transformer by name with provided arguments | Medium | Enables dynamic dispatch; could be limited to non-recursive calls via a depth counter |
| FN-4 | Add `identity` transformer (pass-through) | Low | Useful as default in higher-order contexts |

---

## 13. Error Handling

### Current Mechanism

All handlers return `TransformerReturnType<T>` = `T | TransformerFailure`. `TransformerFailure` carries:
- `queryFailure`: failure type string (e.g., `"FailedTransformer"`, `"TransformerNotFound"`, `"FailedTransformer_mustache"`)
- `transformerPath`: breadcrumb path to the failing transformer
- `failureOrigin`: array of function names in the error chain
- `queryContext`: human-readable context string
- `queryParameters`: the failing transformer/params
- `innerError`: optional nested `TransformerFailure` for root-cause chaining

### Analysis

**Satisfactory aspects**:
- Consistent pattern — no exceptions, predictable error flow
- Error chain (`innerError`) allows tracing failures to root cause
- `transformerPath` provides location information — critical for debugging complex transformer trees
- `getInnermostTransformerError` utility extracts root cause

**Potential issues**:
- **No `try/catch` equivalent in the DSL**: Cannot recover from a failure within the transformer language — a failure propagates all the way up. Business logic sometimes needs "try this, fall back to that"
- **`dataflowObject` does NOT propagate failures**: A failing step is stored in the result object and visible to later steps — contradicts the otherwise-consistent failure propagation pattern
- **Boolean coercion of `TransformerFailure`**: In `ifThenElse`, a `TransformerFailure` in the `if` position is truthy (it's an object) — executes the `then` branch, masking the error
- **No "expected" vs "unexpected" failure distinction**: All failures are `TransformerFailure` — cannot distinguish "value not found" (expected in optional access) from "transformer implementation bug" (unexpected)

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| ERR-1 | Add `tryCatch` transformer: `{ try: Transformer, catch: Transformer }` — if `try` fails, evaluate `catch` with failure in context | High | Essential for resilient business logic; maps to SQL `COALESCE` or `CASE WHEN ... IS NULL THEN ...` |
| ERR-2 | Add `coalesce` / `firstNonNull` transformer: `{ values: Transformer[] }` — return first non-null, non-failure result | High | Very common pattern; maps directly to SQL `COALESCE(...)` |
| ERR-3 | Fix `ifThenElse` to detect `TransformerFailure` in condition and propagate it (instead of treating as truthy) | High | Bug fix |
| ERR-4 | Fix `dataflowObject` to detect failures in steps and either propagate or make failure handling configurable | High | Consistency with rest of system |
| ERR-5 | Consider a severity level on `TransformerFailure`: `"expected"` vs `"unexpected"` | Low | Enables differential error handling |

---

## 14. Type System and Validation

### Current State

- Types are defined by Jzod schemas → generated TS types + Zod validators
- `constantAsExtractor` has an optional `valueJzodSchema` — the only transformer with a type annotation
- No runtime type checking within the transformer execution — values flow untyped
- `boolExpr` uses JS loose equality (`==`) — no type awareness

### Analysis

**Potential issues**:
- **No type conversion transformers**: Cannot convert string↔number, parse JSON, stringify, cast types. Business data often arrives as strings that need numeric interpretation
- **No `typeof` operator**: Cannot branch on value type
- **No runtime validation**: Cannot validate a value against a Jzod schema within a transformer (outside of MLS-specific transformers)
- **Implicit type coercion**: JS loose equality and truthy/falsy checks allow implicit coercion — this diverges from SQL's strict typing

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| TYPE-1 | Add `toNumber` transformer: parse string to number | High | Maps to SQL `CAST(... AS NUMERIC)`. Very common need |
| TYPE-2 | Add `toString` transformer: convert any value to string | High | Maps to SQL `CAST(... AS TEXT)` |
| TYPE-3 | Add `toBoolean` transformer | Medium | Maps to SQL `CAST(... AS BOOLEAN)` |
| TYPE-4 | Add `parseJson` / `jsonParse` transformer | Medium | Maps to SQL `::jsonb` cast |
| TYPE-5 | Add `jsonStringify` transformer | Medium | Maps to SQL `to_json(...)::text` |
| TYPE-6 | Add `typeOf` transformer returning `"string" \| "number" \| "boolean" \| "object" \| "array" \| "null" \| "undefined"` | Medium | Maps to SQL `jsonb_typeof(...)` |

---

## 15. Side-Effect Boundary (UUID Generation)

### Current Transformers

| transformerType | Description | In-memory | SQL |
|---|---|---|---|
| `generateUuid` | Generate a new UUID v4 | ✅ | ✅ |

### Analysis

**Satisfactory aspects**:
- Clean, single-purpose transformer
- SQL equivalent: `gen_random_uuid()`
- The only intentional side-effect in the transformer language — appropriately isolated

**Potential issues**:
- ~~**No `currentTimestamp` / `now()`**: Cannot access current time — useful for audit trails, created_at fields. Maps to SQL `NOW()` / `CURRENT_TIMESTAMP`~~ **DONE (SIDE-1)**
- ~~**No `currentDate`**: Similarly useful~~ **DONE (SIDE-2)**

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| SIDE-1 | ~~Add `currentTimestamp` transformer returning ISO string~~ **DONE** | Medium | Maps to SQL `NOW()`. Common need for audit/tracking fields |
| SIDE-2 | ~~Add `currentDate` transformer~~ **DONE** | Low | Maps to SQL `CURRENT_DATE` |

---

## 16. Domain-Specific Utilities

### Current Transformers

| transformerType | Description | In-memory | SQL | Core? |
|---|---|---|---|---|
| `transformer_menu_addItem` | Insert a menu item into a menu structure | ✅ | ❌ | UI-specific |
| `getActiveDeployment` | Look up active deployment for an application | ✅ | ❌ | Admin-specific |

### Analysis

**Potential issues**:
- **`transformer_menu_addItem` mutates its input**: Uses `Array.splice` on the menu items array — violates the side-effect-free guarantee. The comment "TODO: DO A COPY OF THE MENU, DO NOT UPDATE VIA REFERENCE" acknowledges this
- **Neither has SQL implementation**: These are in-memory-only, which is acceptable for UI/admin operations but breaks the dual-runtime guarantee

### Recommendations

| ID | Recommendation | Priority | Rationale |
|---|---|---|---|
| DOM-1 | Fix `transformer_menu_addItem` to deep-clone the menu before modification | High | Side-effect-free violation is a correctness bug |
| DOM-2 | Mark in-memory-only transformers explicitly in their `TransformerDefinition` | Medium | Makes the dual-runtime limitation visible |

---

## 17. Cross-Cutting Concerns

### 17.1 Naming Consistency

| Issue | Examples | Recommendation |
|---|---|---|
| Mixed casing in `transformerType` values | `getFromContext` (camelCase), `createObject` (camelCase), `+` (operator), `ifThenElse` (camelCase) | Adopt consistent camelCase for all word-based types; operators stay symbolic |
| Verb inconsistency | `createObject` vs `getObjectEntries` vs `pickFromList` vs `mapList` vs `indexListBy` | Standardize: `createX`, `getX`, `mapX`, `filterX`, `reduceX`, `pickX`, `sortX` |
| `returnValue` vs `constantAsExtractor` | Overlapping literal constructors | See LIT-1 |
| `listReducerToSpreadObject` | Overly long name | Could be `spreadList` or `mergeList` |

### 17.2 `applyTo` Resolution Pattern

Many transformers use an `applyTo` field that is resolved via `resolveApplyTo` / `resolveApplyTo_legacy`. This creates an implicit "input pipeline" — the transformer operates on whatever `applyTo` resolves to.

**Assessment**: This is a powerful pattern (similar to Unix pipes or method chaining) but inconsistently applied:
- Some transformers use `applyTo` (list ops, object ops)
- Some don't (arithmetic, boolean, conditional)
- Some use `left`/`right` (boolean, arithmetic)
- Some use `definition` (createObject, dataflowObject)

**Recommendation**: Standardize — either all transformers accept `applyTo` as their primary input, or clearly document which transformers are "operators" (left/right) vs "functions" (applyTo).

### 17.3 `orderBy` on List Transformers

Several list transformers support optional `orderBy` for sorting output. This is inconsistently present:
- `mapList` ✅
- `pickFromList` ✅
- `getUniqueValues` ✅
- `getObjectEntries` ❌
- `getObjectValues` ❌
- `indexListBy` ❌

**Recommendation**: Either add `orderBy` to all list-returning transformers or extract sorting into a standalone `sortList` transformer (see LIST-3).

### 17.4 Build/Runtime Duplication

Every transformer type exists in both `TransformerForBuild_X` and `TransformerForBuildPlusRuntime_X` variants, differing only in the `interpolation` field type. This doubles the type surface area.

**Recommendation**: Consider unifying into a single type per transformer with `interpolation?: "build" | "runtime"` (always optional). The "Build" vs "BuildPlusRuntime" distinction complicates the DSL without adding safety — the runtime already checks step/interpolation dynamically.

---

## 18. Summary: Gaps and Recommendations

### Critical Gaps (blocking DSL adoption for general business logic)

| Category | Gap | Recommendation ID |
|---|---|---|
| **List operations** | ~~No `filter` / `filterList`~~ **DONE** | ~~LIST-1~~ **DONE** |
| **Arithmetic** | ~~Only `+` — no subtraction, multiplication, division~~ **DONE** | ~~ARITH-1, ARITH-2, ARITH-3~~ **DONE** |
| **Error handling** | No `tryCatch` or `coalesce` for graceful fallbacks | ERR-1, ERR-2 |
| **Boolean** | Legacy `transformerType` shortcuts (`"&&"`, `"isNotNull"`) not dispatched | BOOL-5 |
| **Type conversion** | No `toNumber`, `toString` — data parsing is impossible | TYPE-1, TYPE-2 |

### High Priority Improvements

| Category | Improvement | Recommendation ID |
|---|---|---|
| Boolean | Strict equality; `in`/`notIn` operators; error on unknown operator | BOOL-1, BOOL-2, BOOL-4 |
| Error handling | Fix `ifThenElse` and `dataflowObject` failure propagation | ERR-3, ERR-4 |
| Aggregation | ~~Support `sum`, `avg`, `min`, `max` — not just `count`~~ | ~~AGG-1~~ **DONE** |
| Objects | `pick` and `omit` transformers | OBJ-2, OBJ-3 |
| Lists | ~~`find`, `sortList`~~ `listLength` | ~~LIST-2, LIST-3~~ LIST-4 |
| Strings | String manipulation (`substring`, `trim`, `lower`, `upper`, `replace`, `split`, `join`, `length`) | STR-1 |
| Variables | Fix `accessDynamicPath` initial accumulator; complete SQL impl | VAR-2, VAR-3 |
| Sequencing | Implement or remove `dataflowSequence`; add failure propagation to `dataflowObject` | SEQ-1, SEQ-2 |
| Domain | Fix `menu_addItem` mutation | DOM-1 |

### Medium Priority Improvements

| Category | Improvement | Recommendation ID |
|---|---|---|
| Arithmetic | Modulo, negation, math functions | ARITH-4, ARITH-5, ARITH-6 |
| Strings | Boolean string tests (`startsWith`, etc.) | STR-2 |
| Boolean | `between` operator; guard-style `case` | BOOL-3, COND-2 |
| Objects | `getObjectKeys`, `removeKey`, `hasKey` | OBJ-1, OBJ-5, OBJ-7 |
| Lists | `flatMap`, ~~`concatLists`~~, `some`/`every`, `slice`, `groupBy` | LIST-5, ~~LIST-6~~, LIST-7, LIST-8, LIST-12 |
| Aggregation | ~~`having` clause, `countDistinct`~~ | ~~AGG-2, AGG-4~~ **DONE** |
| Functions | `pipe`/`compose`, deprecate `applyFunction`, `callTransformer` | FN-1, FN-2, FN-3 |
| Type system | `toBoolean`, `parseJson`, `jsonStringify`, `typeOf` | TYPE-3, TYPE-4, TYPE-5, TYPE-6 |
| Side effects | ~~`currentTimestamp`, `currentDate`~~ **DONE** | ~~SIDE-1, SIDE-2~~ **DONE** |
| Variables | Unified `get` accessor, `let` binding | VAR-1, VAR-5 |
| Sequencing | Rename `dataflowObject` for clarity | SEQ-3 |
| Naming | Standardize naming conventions across transformers | §17.1 |
| Literals | Merge `constantAsExtractor` into `returnValue` | LIT-1 |

### Low Priority / Future Enhancements

| Category | Improvement | Recommendation ID |
|---|---|---|
| Arithmetic | Unified `arithmetic` transformer | ARITH-7 |
| Strings | `templateString` with nested evaluation; `format`/`sprintf` | STR-3, STR-4 |
| Objects | Deep merge, spread N objects | OBJ-4, OBJ-6 |
| Lists | General `reduce`/`fold`, `reverse`, `flatten` | LIST-9, LIST-10, LIST-11 |
| Functions | `identity` transformer | FN-4 |
| Error | Severity levels on failures | ERR-5 |
| Boolean | `typeOf` operator | BOOL-6 |
| Literals | Explicit `null` handling | LIT-2 |
| Variables | `destructure` transformer | VAR-4 |
| Sequencing | Early return in `dataflowObject` | SEQ-4 |
| Side effects | `currentDate` | SIDE-2 |

---

## Appendix A: Complete Transformer Inventory

### Core Transformers (in scope)

| # | transformerType | Category | In-memory | SQL | Registered |
|---|---|---|---|---|---|
| 1 | `returnValue` | Literal | ✅ | ✅ | ✅ |
| 2 | `constantAsExtractor` | Literal | ✅ | ✅ | ✅ |
| 3 | `generateUuid` | Side-effect | ✅ | ✅ | ✅ |
| 4 | `getFromParameters` | Variable access | ✅ | ✅ | ✅ |
| 5 | `getFromContext` | Variable access | ✅ | ✅ | ✅ |
| 6 | `accessDynamicPath` | Variable access | ✅ | ⚠️ | ✅ |
| 7 | `mustacheStringTemplate` | String | ✅ | ✅ | ✅ |
| 8 | `+` | Arithmetic/String | ✅ | ✅ | ✅ |
| 9 | `boolExpr` | Boolean/Comparison | ✅ | ✅ | ✅ |
| 10 | `ifThenElse` | Branching | ✅ | ✅ | ✅ |
| 11 | `case` | Branching | ✅ | ✅ | ✅ |
| 12 | `createObject` | Object | ✅ | ✅ | ✅ |
| 13 | `createObjectFromPairs` | Object | ✅ | ✅ | ✅ |
| 14 | `mergeIntoObject` | Object | ✅ | ✅ | ✅ |
| 15 | `getObjectEntries` | Object | ✅ | ✅ | ✅ |
| 16 | `getObjectValues` | Object | ✅ | ✅ | ✅ |
| 17 | `mapList` | List | ✅ | ✅ | ✅ |
| 18 | `pickFromList` | List | ✅ | ✅ | ✅ |
| 19 | `indexListBy` | List | ✅ | ✅ | ✅ |
| 20 | `listReducerToSpreadObject` | List | ✅ | ✅ | ✅ |
| 21 | `getUniqueValues` | List | ✅ | ✅ | ✅ |
| 22 | `aggregate` | Aggregation | ✅ | ✅ | ✅ |
| 23 | `dataflowObject` | Sequencing | ✅ | ✅ | ✅ |
| 24 | `dataflowSequence` | Sequencing | ❌ **Not impl.** | ❌ **Not impl.** | ❌ |
| 25 | `transformer_menu_addItem` | Domain (UI) | ✅ | ❌ | ✅ |
| 26 | `getActiveDeployment` | Domain (Admin) | ✅ | ❌ | ✅ |

### Unregistered Legacy Patterns (used in callsites but NOT in dispatch registry)

| Pattern | Used as | Should be |
|---|---|---|
| `transformerType: "&&"` | Logical AND | `boolExpr` with `operator: "&&"` |
| `transformerType: "\|\|"` | Logical OR | `boolExpr` with `operator: "\|\|"` |
| `transformerType: "!="` | Not-equal comparison | `boolExpr` with `operator: "!="` |
| `transformerType: "isNotNull"` | Null check | `boolExpr` with `operator: "isNotNull"` |
| `transformerType: "isNull"` | Null check | `boolExpr` with `operator: "isNull"` |

---

## Appendix B: Implementation File Map

| File | Lines | Purpose |
|---|---|---|
| `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` | ~18000 | Generated TypeScript types (all transformer union types) |
| `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema.ts` | — | Generated Jzod schemas (source of truth for types) |
| `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` | ~3989 | In-memory runtime: handler functions + dispatch |
| `packages/miroir-core/src/2_domain/Transformers.ts` | ~219 | Transformer definition imports and registry exports |
| `packages/miroir-core/src/2_domain/Transformer_tools.ts` | ~147 | Schema reference substitution + interface generation |
| `packages/miroir-core/src/2_domain/TransformerUtils.ts` | ~115 | Async wrapper utilities |
| `packages/miroir-core/src/1_core/Menu.ts` | — | `handleTransformer_menu_AddItem` implementation |
| `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts` | ~4113 | SQL generation for all SQL-supported transformers |
| `packages/miroir-store-postgres/src/1_core/SqlQueryBuilder.ts` | ~631 | SQL query builder helpers |
| `packages/miroir-core/tests/2_domain/transformers.unit.test.ts` | — | Unit tests (in-memory) |
| `packages/miroir-core/tests/4_services/transformers.integ.test.ts` | — | Integration tests (SQL) |

---

## Appendix C: SQL Parity Matrix

| transformerType | In-memory | SQL Generator | Notes |
|---|---|---|---|
| `returnValue` | ✅ | ✅ `sqlStringForConstantTransformer` | |
| `constantAsExtractor` | ✅ | ✅ `sqlStringForConstantAsExtractorTransformer` | |
| `generateUuid` | ✅ | ✅ `sqlStringForNewUuidTransformer` | `gen_random_uuid()` |
| `getFromParameters` | ✅ | ✅ `sqlStringForParameterReferenceTransformer` | |
| `getFromContext` | ✅ | ✅ `sqlStringForContextReferenceTransformer` | |
| `accessDynamicPath` | ✅ | ⚠️ `sqlStringForObjectDynamicAccessTransformer` | Incomplete; TODO in code |
| `mustacheStringTemplate` | ✅ | ✅ `sqlStringForMustacheStringTemplateTransformer` | |
| `+` | ✅ | ✅ `sqlStringForPlusTransformer` | |
| `boolExpr` | ✅ | ✅ `sqlStringForBoolExprTransformer` | |
| `ifThenElse` | ✅ | ✅ `sqlStringForConditionalTransformer` | SQL `CASE WHEN` |
| `case` | ✅ | ✅ `sqlStringForCaseTransformer` | SQL `CASE` |
| `createObject` | ✅ | ✅ `sqlStringForFreeObjectTransformer` | SQL `jsonb_build_object` |
| `createObjectFromPairs` | ✅ | ✅ `sqlStringForObjectFullTemplateTransformer` | |
| `mergeIntoObject` | ✅ | ✅ `sqlStringForObjectAlterTransformer` | SQL `\|\|` (jsonb merge) |
| `getObjectEntries` | ✅ | ✅ `sqlStringForObjectEntriesTransformer` | |
| `getObjectValues` | ✅ | ✅ `sqlStringForObjectValuesTransformer` | |
| `mapList` | ✅ | ✅ `sqlStringForMapperListToListTransformer` | SQL `LATERAL` |
| `pickFromList` | ✅ | ✅ `sqlStringForListPickElementTransformer` | SQL `OFFSET/LIMIT` |
| `indexListBy` | ✅ | ✅ `sqlStringForListReducerToIndexObjectTransformer` | |
| `listReducerToSpreadObject` | ✅ | ✅ `sqlStringForListReducerToSpreadObjectTransformer` | |
| `getUniqueValues` | ✅ | ✅ `sqlStringForUniqueTransformer` | SQL `DISTINCT` |
| `aggregate` | ✅ | ✅ `sqlStringForCountTransformer` | SQL `COUNT/GROUP BY` |
| `dataflowObject` | ✅ | ✅ `sqlStringForDataflowObjectTransformer` | SQL CTEs |
| `dataflowSequence` | ❌ | ❌ | Not implemented |
| `transformer_menu_addItem` | ✅ | ❌ | In-memory only (UI) |
| `getActiveDeployment` | ✅ | ❌ | In-memory only (admin) |


## Appending D: Bugs found:

- `transformer_menu_addItem` mutates its input (violates side-effect-free guarantee)
- `ifThenElse` treats TransformerFailure in condition as truthy
- `dataflowObject` silently stores step failures without propagation
- `dataflowSequence` is defined in types but not implemented anywhere
- `boolExpr` returns false for unknown operators instead of an error
- JS loose equality (`==`) creates semantic mismatch with SQL =