# ifThenElse Transformer

## Quick Overview

The `ifThenElse` transformer provides conditional branching logic. It evaluates a boolean condition (the `if` attribute) and returns one of two values based on whether it is true (`then`) or false (`else`).

The condition is typically provided as a [`boolExpr`](./boolExpr.md) transformer, which evaluates comparison and logical operators.

## What It Does

- **Input**: A boolean condition (`if` attribute, typically a `boolExpr`), and optional `then`/`else` branches
- **Output**: The result of the `then` transformer when the condition is true, or the `else` transformer when false
- **Purpose**: Conditional logic — choose different values based on comparisons or truthiness tests

## Basic Structure

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": <boolean-condition>,
  "then": <result-if-true>,
  "else": <result-if-false>
}
```

The `if` attribute is most commonly a `boolExpr`:

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": "==",
    "left": <left-operand>,
    "right": <right-operand>
  },
  "then": <result-if-true>,
  "else": <result-if-false>
}
```

## Key Properties

### `transformerType` (required)

Always `"ifThenElse"`.

### `if` (required)

A transformer that evaluates to a boolean. Typically a `boolExpr` transformer, but any transformer returning a truthy/falsy value works.

### `then` (optional)

The transformer to evaluate and return when `if` is **true**. When omitted, returns `true`.

### `else` (optional)

The transformer to evaluate and return when `if` is **false**. When omitted, returns `false`.

## The `boolExpr` Condition

Use the `boolExpr` transformer for the `if` condition:

| Operator      | Type   | Description                                          |
|---------------|--------|------------------------------------------------------|
| `==`          | Binary | Loose equality (JS `==`)                             |
| `!=`          | Binary | Loose inequality (JS `!=`)                           |
| `<`           | Binary | Less than                                            |
| `<=`          | Binary | Less than or equal                                   |
| `>`           | Binary | Greater than                                         |
| `>=`          | Binary | Greater than or equal                                |
| `isNull`      | Unary  | True if `left == null` (null **or** undefined)       |
| `isNotNull`   | Unary  | True if `left != null` (not null **and** not undefined) |
| `!`           | Unary  | True if `!left` (JS falsy: null, undefined, 0, false, `""`) |
| `&&`          | Binary | Logical AND                                          |
| `\|\|`        | Binary | Logical OR                                           |

## Null and Undefined Handling

> **Important**: JSON has no `undefined` value. Transformers stored as JSON can only represent `null` explicitly.

The unary operators in `boolExpr` address this gap:

- **`isNull`**: Uses JS loose equality (`left == null`), which is true for **both** `null` and `undefined`. Use this to detect missing/absent values regardless of whether they are `null` in JSON or `undefined` at runtime.
- **`isNotNull`**: Uses JS loose inequality (`left != null`), which is false for **both** `null` and `undefined`.
- **`!`**: Applies JS boolean NOT semantics. True for all **falsy** values: `null`, `undefined`, `0`, `false`, `""` (empty string). Use this for broader "nothing here" checks.

### Comparison: `isNull` vs `!`

| Value       | `isNull` result | `!` result |
|-------------|-----------------|------------|
| `null`      | true            | true       |
| `undefined` | true            | true       |
| `0`         | **false**       | true       |
| `false`     | **false**       | true       |
| `""`        | **false**       | true       |
| `"hello"`   | false           | false      |
| `1`         | false           | false      |

Choose `isNull`/`isNotNull` for strict null/undefined checks; choose `!` for broad falsy checks.

## Examples

### Binary: String equality

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": "==",
    "left": {
      "transformerType": "getFromParameters",
      "interpolation": "runtime",
      "referenceName": "userType"
    },
    "right": {
      "transformerType": "returnValue",
      "interpolation": "runtime",
      "mlSchema": { "type": "string" },
      "value": "admin"
    }
  },
  "then": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "admin access"
  },
  "else": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "regular access"
  }
}
```

### Unary: Null check

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": "isNull",
    "left": {
      "transformerType": "getFromContext",
      "interpolation": "runtime",
      "referenceName": "optionalValue"
    }
  },
  "then": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "value is absent"
  },
  "else": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "value is present"
  }
}
```

### Unary: ! (NOT / falsy check)

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": "!",
    "left": {
      "transformerType": "getFromParameters",
      "interpolation": "runtime",
      "referenceName": "isEnabled"
    }
  },
  "then": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "disabled"
  },
  "else": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "enabled"
  }
}
```

### Numeric comparison

```json
{
  "transformerType": "ifThenElse",
  "interpolation": "runtime",
  "if": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": "<",
    "left": {
      "transformerType": "getFromParameters",
      "interpolation": "runtime",
      "referenceName": "score"
    },
    "right": {
      "transformerType": "returnValue",
      "interpolation": "runtime",
      "mlSchema": { "type": "number" },
      "value": 50
    }
  },
  "then": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "below threshold"
  },
  "else": {
    "transformerType": "returnValue",
    "interpolation": "runtime",
    "mlSchema": { "type": "string" },
    "value": "at or above threshold"
  }
}
```

## Comparison to `case`

| Feature           | `ifThenElse`                    | `case`                          |
|-------------------|---------------------------------|----------------------------------|
| Conditions        | Single condition (via `boolExpr`) | Multiple `when` clauses         |
| Operator types    | All `boolExpr` operators        | Equality only (matched via `==`) |
| Null/falsy tests  | `isNull`, `isNotNull`, `!`      | Not supported                    |
| Use when          | Simple if/else logic            | Multi-branch dispatch            |

## Common Pitfalls

1. **Forgetting to wrap the condition in `boolExpr`** — the `if` attribute must be a transformer returning a boolean value. Use `{ "transformerType": "boolExpr", "operator": "==", ... }` rather than putting the operator directly in `ifThenElse`.

2. **Omitting `right` for binary `boolExpr` operators** — binary operators (`==`, `!=`, etc.) require a `right` value. Omitting it results in `rightValue` being `undefined`, which may produce unexpected results.

3. **Including `right` for unary `boolExpr` operators** — the `right` field is silently ignored by `isNull`, `isNotNull`, and `!`. Omit it for clarity.

4. **Confusing `isNull` and `!` for zero/false** — `isNull` only tests for null/undefined. If you also want to catch `0`, `false`, or `""`, use `!` instead.
