# ifThenElse Transformer

## Quick Overview

The `ifThenElse` transformer provides conditional branching logic. It evaluates a condition using an operator and returns one of two values based on whether the condition is true (`then`) or false (`else`).

Supported operators:
- **Binary comparison**: `==`, `!=`, `<`, `<=`, `>`, `>=`
- **Unary null/undefined check**: `isNull`, `isNotNull`
- **Unary boolean NOT**: `!`

## What It Does

- **Input**: A `left` operand, an optional `right` operand (for binary operators), and `then`/`else` branches
- **Output**: The result of the `then` transformer when the condition is true, or the `else` transformer when false
- **Purpose**: Conditional logic — choose different values based on comparisons or truthiness tests

## Basic Structure

### Binary operators

```json
{
  "transformerType": "==",
  "interpolation": "runtime",
  "left": <left-operand>,
  "right": <right-operand>,
  "then": <result-if-true>,
  "else": <result-if-false>
}
```

### Unary operators (`isNull`, `isNotNull`, `!`)

```json
{
  "transformerType": "isNull",
  "interpolation": "runtime",
  "left": <value-to-test>,
  "then": <result-if-true>,
  "else": <result-if-false>
}
```

The `right` operand is **not used** (and should be omitted) for unary operators.

## Key Properties

### `transformerType` (required)

The comparison operator:

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

### `left` (required)

The left operand. For unary operators, this is the only value tested.

### `right` (optional — required for binary operators)

The right operand. **Must be omitted** for unary operators (`isNull`, `isNotNull`, `!`).

### `then` (required)

The transformer to evaluate and return when the condition is **true**.

### `else` (required)

The transformer to evaluate and return when the condition is **false**.

## Null and Undefined Handling

> **Important**: JSON has no `undefined` value. Transformers stored as JSON can only represent `null` explicitly.

The unary operators address this gap:

- **`isNull`**: Uses JS loose equality (`left == null`), which is true for **both** `null` and `undefined`. Use this to detect missing/absent values regardless of whether they are `null` in JSON or `undefined` at runtime.
- **`isNotNull`**: Uses JS loose inequality (`left != null`), which is false for **both** `null` and `undefined`.
- **`!`**: Applies JS boolean NOT semantics. True for all **falsy** values: `null`, `undefined`, `0`, `false`, `""` (empty string). Use this for broader "nothing here" checks.

### Comparison: `isNull` vs `!`

| Value     | `isNull` result | `!` result |
|-----------|-----------------|------------|
| `null`    | true            | true       |
| `undefined` | true          | true       |
| `0`       | **false**       | true       |
| `false`   | **false**       | true       |
| `""`      | **false**       | true       |
| `"hello"` | false           | false      |
| `1`       | false           | false      |

Choose `isNull`/`isNotNull` for strict null/undefined checks; choose `!` for broad falsy checks.

## Examples

### Binary: String equality

```json
{
  "transformerType": "==",
  "interpolation": "runtime",
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
  "transformerType": "isNull",
  "interpolation": "runtime",
  "left": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "optionalValue"
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
  "transformerType": "!",
  "interpolation": "runtime",
  "left": {
    "transformerType": "getFromParameters",
    "interpolation": "runtime",
    "referenceName": "isEnabled"
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
  "transformerType": "<",
  "interpolation": "runtime",
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

| Feature           | `ifThenElse`              | `case`                          |
|-------------------|---------------------------|----------------------------------|
| Conditions        | Single condition           | Multiple `when` clauses          |
| Operator types    | Binary + Unary (`!`, null) | Equality only (matched via `==`) |
| Null/falsy tests  | `isNull`, `isNotNull`, `!` | Not supported                    |
| Use when          | Simple if/else logic       | Multi-branch dispatch            |

## Common Pitfalls

1. **Omitting `right` for binary operators** — binary operators (`==`, `!=`, etc.) require a `right` value. Omitting it results in `rightValue` being `undefined`, which may produce unexpected results.

2. **Including `right` for unary operators** — the `right` field is silently ignored by `isNull`, `isNotNull`, and `!`. Omit it for clarity.

3. **Confusing `isNull` and `!` for zero/false** — `isNull` only tests for null/undefined. If you also want to catch `0`, `false`, or `""`, use `!` instead.
