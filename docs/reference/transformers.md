# Transformer reference — business-oriented catalog

This document is a **human-oriented guide** to the stock Miroir transformers: what each one is
*for* in business terms, what it consumes, and what it produces. It complements the technical
references:

- [Transformer result schema inference](./transformer-result-schema.md) — how the output `mlSchema`
  of a transformer is derived without running it (issue #88 / Proposal B).
- [mlSchema subtyping](../../packages/miroir-core/src/1_core/jzod/mlSchemaSubtype.ts) — the LSP
  subtype relation used by the compatibility checker (#250, #251).
- Dependent-types proposal:
  [dependent-types-for-transformer-composition](../proposals/dependent-types-for-transformer-composition.md).

Stock definitions live in the Miroir application deployment assets
(`packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-…/`, one JSON file per
transformer, keyed by `transformerType` in `applicationTransformerDefinitions`).

**Virtual attributes** (Entity `mlSchema` tag `virtualAttribute`) are not a transformer type.
They attach an inline transformer to an attribute so Queries, reports, and later transformers
in the same boxed query can use that name. Evaluation is **instance-local** (stored fields of
that row only — FK uuids as scalars, no JOIN) and **lazy** (computed only when the query or
display requires the name). They are never persisted. See [Entity API](./api/entity.md#virtual-attributes).

---

## Classification topics

Every transformer below is classified along four axes. Read this once; it is the legend for all
the tables that follow.

1. **Business role** — the category under which the transformer is listed in this document:
   - **Read a value** — pull data from the context, parameters, a literal, or navigate a path.
   - **Compute a scalar** — produce a number, string, boolean, uuid, date…
   - **Decide** — choose between alternatives (`ifThenElse`, `case`).
   - **Build an object** — assemble an object from other values.
   - **Transform a list — constant cardinality** — each item becomes exactly one item
     (`mapList`, `sortList`).
   - **Transform a list — reduced cardinality** — some items are dropped
     (`filterList`, `find`, `pickFromList`, `getUniqueValues`).
   - **Combine / aggregate a list** — items are merged into one thing, or the list is measured
     (`concatLists`, `aggregate`, `listLength`, `listReducerToSpreadObject`, `indexListBy`).
   - **Convert object ⇄ list** — shape-shift between an object and a list of its parts.
   - **Schema / meta-model utilities** — advanced transformers that manipulate Jzod schemas or
     whole application models (MLS, admin).
   - **Application examples** — transformers shipped as examples inside a specific application.

2. **Declared input** — the type the transformer officially accepts on its *piped input* (the
   `inputOutput.input` contract, from issue #249). A transformer with input `undefined` does not
   consume the piped value (it reads from the context, parameters, or nowhere). Note the piped
   input is *not* always expressed as an `applyTo` attribute — see “How transformers take input”.

3. **Declared output** — the `inputOutput.output` contract. `any` means “depends on the operands”:
   the precise type is computed by `resolveTransformerResultSchema` (e.g. `getFromContext` of the
   list row yields the row entity, `pickFromList` yields the list element).

4. **Cardinality effect** — how the shape of the value changes:
   `1→1`, `list→list (same)`, `list→list (fewer)`, `list→scalar`, `list→object`,
   `object→list`, `none→scalar`.

### How transformers take input

- **`applyTo`** — most transformers apply to a value produced by another transformer
  (their “piped input”). Example: `mapList.applyTo` produces the list to map.
- **`definition`** — templates and object builders describe their *output shape* here
  (`mustacheStringTemplate.definition` is the template string; `createObject.definition` is a
  record of key → transformer).
- **`args` / `left` / `right`** — operators take their operands as arrays or pairs
  (`numericOp.args`, `plus.args`, `boolExpr.left/right`).
- **`referenceToOuterObject`** — inside list combinators (`mapList`, `filterList`, `find`,
  `mergeIntoObject`, `createObjectFromPairs`), the name under which the *outer* value (e.g. the
  row) stays reachable inside the element transformer, via `getFromContext`.
- **`getFromContext` / `getFromParameters`** — read a value by `referenceName` or `referencePath`
  instead of consuming the pipe.

---

## Quick reference by business role

| Role | Transformers |
|------|--------------|
| Read a value | `getFromContext`, `getFromParameters`, `returnValue`, `constantAsExtractor`, `accessDynamicPath`, `getActiveDeployment` |
| Compute a scalar | `numericOp`, `plus`, `boolExpr`, `stringOp`, `mustacheStringTemplate`, `generateUuid`, `currentDate`, `currentTimestamp` |
| Decide | `ifThenElse`, `case` |
| Build an object | `createObject`, `dataflowObject`, `mergeIntoObject`, `createObjectFromPairs`, `object_fromEntries` |
| List — constant cardinality | `mapList`, `sortList` |
| List — reduced cardinality | `filterList`, `find`, `pickFromList`, `getUniqueValues` |
| Combine / aggregate a list | `concatLists`, `aggregate`, `listLength`, `listReducerToSpreadObject`, `indexListBy` |
| Object ⇄ list | `getObjectValues`, `getObjectEntries`, `object_fromEntries`, `indexListBy` |
| Schema / meta-model utilities | `jzodTypeCheck`, `defaultValueForSchema`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `unfoldSchemaOnce`, `resolveTransformerResultSchema`, `ansiColumnsToJzodSchema`, `spreadSheetToJzodSchema`, `duplicateApplicationModel`, `entityDefinition_extractAttributes` |
| Application examples | `transformer_menu_addItem` (library app) |

*(`object_fromEntries` and `indexListBy` appear in two roles; see their sections.)*

---

## 1. Read a value

These transformers *source* data rather than transform it.

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `getFromContext` | Read a value from the runtime context by name (`referenceName`) or nested path (`referencePath`), e.g. the current `row`. | `undefined` | `any` (actual: the context value) | `none→1` |
| `getFromParameters` | Read a value from the build/query parameters (safe lookup with `expectedType`). | `undefined` | `any` | `none→1` |
| `returnValue` | A literal constant; optionally declares its exact `mlSchema`. | `undefined` | `any` (typed by `mlSchema`) | `none→1` |
| `constantAsExtractor` | A constant wrapped as an extractor result (mainly for tests). | `undefined` | `any` (typed by `valueJzodSchema`) | `none→1` |
| `accessDynamicPath` | Navigate nested object attributes through a dynamic path (`objectAccessPath`), like `a.b[0].c`. | `object` | `any` (the value at the path) | `1→1` |
| `getActiveDeployment` | Given an application uuid, return its active deployment uuid. | `string` | `string` | `1→1` |

Example — the default identity transformer of a list panel:

```json
{ "transformerType": "getFromContext", "interpolation": "runtime", "referenceName": "row" }
```

---

## 2. Compute a scalar

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `numericOp` | Arithmetic (`+`, `-`, `*`, `/`) over `args`, left-to-right. | `any` | `number` | `n→1` |
| `plus` | Add numbers / bigints, or concatenate strings (`args`). | `any` | `any` | `n→1` |
| `boolExpr` | Boolean expression: `==`, `!=`, `===`, `!==`, `deepEqual`, `notDeepEqual`, `<`, `<=`, `>`, `>=`, `&&`, `\|\|`, `!`, `isNull`, `isNotNull` over `left`/`right`. | `any` | `boolean` | `n→1` |
| `stringOp` | String operations on `applyTo`: `toLowerCase`, `toUpperCase`, `trim`, `substring`, `replace`, `split`, `join`, `length`. | `any` | `any` (result schema: `string`) | `1→1` (or `list→scalar` for `length`/`join`) |
| `mustacheStringTemplate` | Render a mustache template (`definition`) with the piped value as variable context, e.g. `"Hello {{name}}"`. | `string` | `string` | `1→1` |
| `generateUuid` | New UUID v4. | `undefined` | `string` (uuid) | `none→1` |
| `currentDate` | Today’s date, ISO `YYYY-MM-DD`. | `undefined` | `string` | `none→1` |
| `currentTimestamp` | Now, ISO 8601 timestamp. | `undefined` | `string` | `none→1` |

---

## 3. Decide

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `ifThenElse` | Evaluate `if` (usually a `boolExpr`); return `then` when true, `else` when false. Both branches optional. | `any` | `any` (the chosen branch) | `1→1` |
| `case` | SQL-like `CASE WHEN`: match a `discriminator` value against `whens` (`when` / `then` clauses), optional `else`. | `any` | `any` (the matched branch) | `1→1` |

---

## 4. Build an object

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `createObject` | Build an object from a `definition` record: each key maps to a transformer producing its value. Attributes are evaluated independently (no piped input; inner transformers read context / `defaultInput` when they need the enclosing value). | `undefined` | `object` | `none→object` |
| `dataflowObject` | Build an object in *steps*: `definition` keys are evaluated in order and later steps can read earlier results from the context. | `object` | `object` | `1→1` |
| `mergeIntoObject` | Start from `applyTo` (usually the row) and merge / override attributes declared in `definition`. The idiomatic “return the row, enriched with computed fields”. | `any` | `object` | `1→1` |
| `createObjectFromPairs` | Build an object from an array of `{attributeKey, attributeValue}` pairs with templating (useful when attribute *names* are dynamic). | `any` | `object` | `1→1` |
| `object_fromEntries` | Build an object from an array of `[key, value]` pairs — `Object.fromEntries()`. Inverse of `getObjectEntries`. | `array` | `any` (result schema: `record`) | `list→object` |

Example — enrich a Book row with a computed label:

```json
{
  "transformerType": "mergeIntoObject",
  "applyTo": { "transformerType": "getFromContext", "referenceName": "row" },
  "definition": {
    "transformerType": "createObject",
    "definition": {
      "label": {
        "transformerType": "mustacheStringTemplate",
        "definition": "{{name}} ({{year}})"
      }
    }
  }
}
```

`mergeIntoObject.definition` is the overlay transformer (typically `createObject`). It does **not** take the row as piped input. The `applyTo` result is bound into context as `defaultInput` (or `referenceToOuterObject` when set) so nested transformers can `getFromContext` it if they need it.

---

## 5. Transform a list — constant cardinality

Every input item yields exactly one output item; the list keeps its length.

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `mapList` | Apply `elementTransformer` to every item of `applyTo`. Inside the element transformer, the item is the piped input; the outer value stays reachable as `referenceToOuterObject`. | `array` | `array` (of transformed elements) | `list→list (same)` |
| `sortList` | Sort `applyTo` by an `orderBy` attribute (or primitive value), direction via `orderByDirection` (default ascending). | `array` | `array` | `list→list (same)` |

Example — extract the title of every Book:

```json
{
  "transformerType": "mapList",
  "applyTo": { "transformerType": "getFromContext", "referenceName": "row" },
  "elementTransformer": {
    "transformerType": "mustacheStringTemplate",
    "definition": "{{name}}"
  }
}
```

---

## 6. Transform a list — reduced cardinality

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `filterList` | Keep items of `applyTo` for which `predicate` (a transformer returning boolean) is true. | `array` | `array` | `list→list (fewer)` |
| `find` | First item of `applyTo` matching `predicate`; `undefined`/`null` if none. | `array` | `any` (the element) | `list→1` |
| `pickFromList` | Item of `applyTo` at `index`. | `array` | `any` (the element) | `list→1` |
| `getUniqueValues` | Deduplicate `applyTo`; optional `attribute` dedupes on that attribute. | `array` | `array` | `list→list (fewer)` |

---

## 7. Combine / aggregate a list

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `concatLists` | Concatenate the `lists` (each must resolve to an array) into one list, in order. | `array` | `array` | `lists→list` |
| `aggregate` | Aggregate `applyTo` with `function` (`count`, `sum`, `avg`, `min`, `max`, `json_agg`, `json_agg_strict`), optional `distinct`, `groupBy` attributes and `having` clause. Without `groupBy` returns one row `{aggregate: value}` (or `{function: value}`); with `groupBy` returns one row per group: group attributes + aggregate value. | `array` | `array` (of aggregate rows) | `list→list (much fewer)` |
| `listLength` | Number of items in `applyTo`. | `array` | `number` | `list→scalar` |
| `listReducerToSpreadObject` | Merge a list of objects into one spread object (later items override earlier keys). | `array` | `object` | `list→object` |
| `indexListBy` | Index a list into a dictionary keyed by `indexAttribute` — `{ item[indexAttribute]: item }`. | `array` | `object` (record of items) | `list→object` |

---

## 8. Convert object ⇄ list

| Transformer | Business use | Declared input | Declared output | Cardinality |
|-------------|--------------|----------------|-----------------|-------------|
| `getObjectValues` | All values of an object, as an array. | `object` | `array` | `object→list` |
| `getObjectEntries` | `[key, value]` pairs of an object, as an array. | `any` | `array` | `object→list` |
| `object_fromEntries` | Inverse of `getObjectEntries`: array of pairs → object. | `array` | `any` (result schema: `record`) | `list→object` |
| `indexListBy` | List → dictionary (see section 7). | `array` | `object` | `list→object` |

---

## 9. Schema / meta-model utilities

Advanced transformers operating on Jzod schemas or whole application models. Mostly used inside the
Miroir application itself (MLS = Miroir Meta-Language Schema), not in ordinary report/action logic.

| Transformer | Business use | Declared input | Declared output |
|-------------|--------------|----------------|-----------------|
| `jzodTypeCheck` | Validate a value object against a Jzod schema (`mlSchema`), returning a type-check result. | `object` | `object` |
| `defaultValueForSchema` | Generate a default value object conforming to a Jzod schema (`mlSchema`). | `object` | `any` |
| `resolveConditionalSchema` | Resolve an `ifThenElse` schema declaration against a value object to the concrete schema. | `object` | `object` |
| `resolveSchemaReferenceInContext` | Resolve a `schemaReference` within a relative reference context. | `object` | `object` |
| `unfoldSchemaOnce` | Unfold a Jzod schema one level, resolving immediate references. | `object` | `object` |
| `resolveTransformerResultSchema` | Infer the output `mlSchema` of a nested `transformer` without evaluating it (the design-time API — see [transformer-result-schema.md](./transformer-result-schema.md)). | `object` | `object` |
| `ansiColumnsToJzodSchema` | Convert `information_schema.columns` rows into a Jzod object schema (nullable → `optional`, JSON columns → open object). | `array` | `object` |
| `spreadSheetToJzodSchema` | Convert spreadsheet contents into an ML schema. | *(none declared)* | *(schemaReference)* |
| `duplicateApplicationModel` | Duplicate an application model, rewriting the application uuid throughout. | `object` | `object` |
| `entityDefinition_extractAttributes` | Extract attribute definitions from an Entity (`16dbfe28-…` = the Entity entity). | Entity (uuid-typed) | `array` |

---

## 10. Application examples

| Transformer | Business use | Declared input | Declared output |
|-------------|--------------|----------------|-----------------|
| `transformer_menu_addItem` | Library-app example: add a MenuItem to an existing Menu (parameters: `menuReference`, `menuItemReference`, insertion indices). | Menu (uuid-typed) | Menu (uuid-typed) |

---

## Notes and gotchas

- **`any` output means “derived, not fixed”** — use
  [`resolveTransformerResultSchema`](./transformer-result-schema.md) (or the #251 mlSchema display
  in the list transformer panel) to see the precise type. Example: `getFromContext` of the list
  row is declared `any` but actually yields the row entity.
- **`interpolation: "build" | "runtime"`** — transformers may be evaluated at build time (on the
  model) or at runtime (on the data); the distinction is per instance, not per transformer type.
- **`referenceToOuterObject`** — inside list combinators (`mapList` / `filterList` / `find`),
  the element transformer's *piped* input is the list element; the outer value stays reachable
  via `getFromContext` under `referenceToOuterObject` (the list panel uses `"row"`).
  `mergeIntoObject` / `createObjectFromPairs` instead bind `applyTo` into **context** under
  that name (or `defaultInput`); the overlay/`createObject` itself does not consume a pipe.
- **SQL parity** — most library-implemented transformers have an SQL counterpart
  (`sqlImplementationFunctionName`, e.g. `sqlStringForMapperListToListTransformer`), so they can be
  pushed down to Postgres queries; transformers without one (marked `-` / `TODO` / `N/A` above and
  in the definitions) run in memory only.
- **`dataflowSequence`** is a structural container (array of steps) and has no stock definition of
  its own; see [transformer-result-schema.md](./transformer-result-schema.md).
