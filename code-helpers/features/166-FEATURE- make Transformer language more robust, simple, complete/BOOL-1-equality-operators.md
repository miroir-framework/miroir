# BOOL-1: Equality Operators in `boolExpr` Transformer

## Overview

The `boolExpr` transformer supports four distinct equality operators, each with different semantics. Choosing the right one is critical for correctness when comparing values of potentially different types or complex structure.

| Operator       | Name                  | Type coercion | Object recursion | SQL mapping |
|----------------|-----------------------|:-------------:|:----------------:|:-----------:|
| `==`           | Loose equality        | ✓             | ✗                | `=`         |
| `!=`           | Loose inequality      | ✓             | ✗                | `<>`        |
| `===`          | Strict equality       | ✗             | ✗                | `=`         |
| `!==`          | Strict inequality     | ✗             | ✗                | `<>`        |
| `deepEqual`    | Deep structural equal | ✗             | ✓                | `=`         |
| `notDeepEqual` | Deep structural inequal| ✗            | ✓                | `<>`        |

---

## Operator Semantics

### `==` — Loose Equality (default)

Mirrors JavaScript's `==` operator. Applies type coercion before comparing, so values of different types can compare as equal.

**Evaluation rule**: `left == right`

**Examples where type coercion matters**:
- `0 == false` → `true` (number `0` coerces to boolean `false`)
- `0 == ""` → `true` (both coerce to number `0`)
- `"1" == 1` → `true` (string `"1"` coerces to number `1`)
- `null == undefined` → `true`

**Use when**: You intentionally want falsy/truthy coercion, e.g. testing whether a field is absent or null without distinguishing the two.

---

### `!=` — Loose Inequality

Inverse of `==`. Returns `true` when `left != right` under loose comparison.

**Use when**: Same as `==`, but negated.

---

### `===` — Strict Equality

Mirrors JavaScript's `===` operator. **No type coercion**: both value and type must match.

**Evaluation rule**: `left === right`

**Examples**:
- `"hello" === "hello"` → `true`
- `"1" === 1` → `false` (different types: string vs number)
- `0 === false` → `false` (different types: number vs boolean)
- `0 === ""` → `false` (different types: number vs string)

**Use when**: You need type-safe comparison, e.g. comparing a field that could be either `0` (number) or `false` (boolean) and the difference matters.

---

### `!==` — Strict Inequality

Inverse of `===`. Returns `true` when types or values differ.

**Examples**:
- `"1" !== 1` → `true`
- `"hello" !== "hello"` → `false`

---

### `deepEqual` — Deep Structural Equality

Uses `fast-deep-equal` for recursive structural comparison. Two objects or arrays are equal if they have the same keys/indices with equal values at every level. Primitives are compared by value with **no type coercion**.

**Evaluation rule**: `deepEqual(left, right)` (structural recursion, no coercion)

**Examples**:
- `{ a: 1, b: "x" }` deepEqual `{ a: 1, b: "x" }` → `true`
- `{ a: { b: { c: 42 } } }` deepEqual `{ a: { b: { c: 42 } } }` → `true`
- `[1, 2, 3]` deepEqual `[1, 2, 3]` → `true`
- `{ a: 1, b: "hello" }` deepEqual `{ a: 1, b: "world" }` → `false`
- Two different object **references** with same content → `true` (unlike `===`)

**Use when**: You need to compare the full content of two records or complex nested structures (e.g., checking if a fetched entity matches a reference snapshot).

---

### `notDeepEqual` — Deep Structural Inequality

Inverse of `deepEqual`.

**Examples**:
- `{ x: 1 }` notDeepEqual `{ x: 2 }` → `true`
- `{ x: 1 }` notDeepEqual `{ x: 1 }` → `false`

---

## Difference Between `===` and `deepEqual` for Objects

| Expression | `===` | `deepEqual` |
|---|:---:|:---:|
| `{ a: 1 }` vs `{ a: 1 }` (different refs) | `false` | `true` |
| `"hello"` vs `"hello"` | `true` | `true` |
| `"1"` vs `1` | `false` | `false` |

`===` uses JavaScript reference equality for objects — two distinct object literals with the same content are **not** `===` equal. Use `deepEqual` when comparing object/array values by content.

---

## SQL Behaviour (PostgreSQL)

When a `boolExpr` transformer runs inside a SQL query (via `SqlGenerator`), the operators map as follows:

| Operator       | SQL operator | Notes |
|----------------|:------------:|-------|
| `==`           | `=`          | Standard SQL equality |
| `!=`           | `<>`         |       |
| `===`          | `=`          | In SQL/jsonb, `=` is already value-based |
| `!==`          | `<>`         |       |
| `deepEqual`    | `=`          | jsonb `=` in PostgreSQL is structural deep equality |
| `notDeepEqual` | `<>`         |       |

**Important**: In PostgreSQL, `jsonb =` performs a structural deep comparison. There is no loose coercion in SQL. The distinction between `==` and `===` (or between `!=` and `!==`) only manifests in the JavaScript runtime. In SQL, all six map to either `=` or `<>`.

---

## Usage in Transformer JSON

```json
{
  "transformerType": "boolExpr",
  "interpolation": "runtime",
  "operator": "===",
  "left": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "currentObject",
    "referencePath": ["status"]
  },
  "right": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "active"
  }
}
```

### Common Patterns

**Type-safe field check** (use `===` to avoid coercing `0` to `false`):
```json
{ "operator": "===", "left": <countField>, "right": { "value": 0 } }
```

**Presence test** (use `==` to catch both `null` and `undefined`):
```json
{ "operator": "==", "left": <optionalField>, "right": { "value": null } }
```

**Full record comparison** (use `deepEqual`):
```json
{ "operator": "deepEqual", "left": <fetchedRecord>, "right": <referenceSnapshot> }
```

---

## Test Coverage

The following test cases are defined in `transformerTest_miroirCoreTransformers` (boolExpr test suite):

| Test label | Operator | Expected |
|---|---|:---:|
| strict equality true - identical strings | `===` | `true` |
| strict equality false - string vs number | `===` | `false` |
| strict inequality true - string vs number | `!==` | `true` |
| strict inequality false - identical strings | `!==` | `false` |
| loose equality: 0 == "" (coercion) | `==` | `true` |
| strict equality: 0 === "" (no coercion) | `===` | `false` |
| loose equality: 0 == false | `==` | `true` |
| strict equality: 0 === false | `===` | `false` |
| deepEqual true - identical objects | `deepEqual` | `true` |
| deepEqual false - different objects | `deepEqual` | `false` |
| deepEqual true - nested arrays with same content | `deepEqual` | `true` |
| deepEqual with deeply nested identical objects | `deepEqual` | `true` |
| deepEqual: different nested value | `deepEqual` | `false` |
| notDeepEqual true - different objects | `notDeepEqual` | `true` |
| notDeepEqual false - identical objects | `notDeepEqual` | `false` |
