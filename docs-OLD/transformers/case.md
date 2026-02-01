# case Transformer

## Quick Overview

The `case` transformer provides conditional switching logic similar to SQL's `CASE WHEN` expression. It evaluates a discriminator value and compares it against a list of `when` clauses, returning the corresponding `then` result when a match is found.

Think of it like a switch statement in JavaScript, but with the power of Miroir's transformer system.

## What It Does

- **Input**: A discriminator value and a list of when/then pairs
- **Output**: The result of the matching `then` clause, the `else` value, or `undefined`
- **Purpose**: Route to different results based on value matching

## SQL Equivalent

```sql
CASE discriminator
  WHEN 'value1' THEN 'result1'
  WHEN 'value2' THEN 'result2'
  ELSE 'default'
END
```

## Basic Structure

```json
{
  "transformerType": "case",
  "interpolation": "runtime",
  "discriminator": <value-to-test>,
  "whens": [
    { "when": <value-to-match>, "then": <result-if-matched> },
    { "when": <another-value>, "then": <another-result> }
  ],
  "else": <default-result>
}
```

## Key Properties

### 1. `discriminator` (required)

The value to test against. Can be any transformer that produces a value:

- A context reference: `{ "transformerType": "getFromContext", "referenceName": "status" }`
- A parameter reference: `{ "transformerType": "getFromParameters", "referenceName": "type" }`
- A computed value from any transformer

### 2. `whens` (required)

An array of `when`/`then` pairs. Each entry contains:

- **`when`**: A transformer that produces the value to compare against the discriminator
- **`then`**: A transformer that produces the result if this `when` matches

The `whens` are evaluated in order. The first match wins.

### 3. `else` (optional)

A fallback transformer to execute if no `when` clause matches. If omitted and no match is found, the result is `undefined`.

## Simple Examples

### Example 1: User Status Display

**Context:**
```json
{
  "status": "active"
}
```

**Transformer:**
```json
{
  "transformerType": "case",
  "interpolation": "runtime",
  "discriminator": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "status"
  },
  "whens": [
    {
      "when": { "transformerType": "returnValue", "value": "active" },
      "then": { "transformerType": "returnValue", "value": "User is active" }
    },
    {
      "when": { "transformerType": "returnValue", "value": "inactive" },
      "then": { "transformerType": "returnValue", "value": "User is inactive" }
    },
    {
      "when": { "transformerType": "returnValue", "value": "suspended" },
      "then": { "transformerType": "returnValue", "value": "User is suspended" }
    }
  ],
  "else": { "transformerType": "returnValue", "value": "Unknown status" }
}
```

**Output:** `"User is active"`

### Example 2: Number-Based Switching

**Context:**
```json
{
  "priority": 1
}
```

**Transformer:**
```json
{
  "transformerType": "case",
  "interpolation": "runtime",
  "discriminator": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "priority"
  },
  "whens": [
    {
      "when": { "transformerType": "returnValue", "value": 1 },
      "then": { "transformerType": "returnValue", "value": "High priority" }
    },
    {
      "when": { "transformerType": "returnValue", "value": 2 },
      "then": { "transformerType": "returnValue", "value": "Medium priority" }
    },
    {
      "when": { "transformerType": "returnValue", "value": 3 },
      "then": { "transformerType": "returnValue", "value": "Low priority" }
    }
  ],
  "else": { "transformerType": "returnValue", "value": "No priority set" }
}
```

**Output:** `"High priority"`

### Example 3: Complex Then Clause

The `then` clause can contain any transformer, including complex compositions:

**Context:**
```json
{
  "operation": "create",
  "entityName": "User"
}
```

**Transformer:**
```json
{
  "transformerType": "case",
  "interpolation": "runtime",
  "discriminator": {
    "transformerType": "getFromContext",
    "interpolation": "runtime",
    "referenceName": "operation"
  },
  "whens": [
    {
      "when": { "transformerType": "returnValue", "value": "create" },
      "then": {
        "transformerType": "mustacheStringTemplate",
        "interpolation": "runtime",
        "definition": "Creating new {{entityName}} instance..."
      }
    },
    {
      "when": { "transformerType": "returnValue", "value": "update" },
      "then": {
        "transformerType": "mustacheStringTemplate",
        "interpolation": "runtime",
        "definition": "Updating {{entityName}} instance..."
      }
    },
    {
      "when": { "transformerType": "returnValue", "value": "delete" },
      "then": {
        "transformerType": "mustacheStringTemplate",
        "interpolation": "runtime",
        "definition": "Deleting {{entityName}} instance..."
      }
    }
  ]
}
```

**Output:** `"Creating new User instance..."`

## Comparison with `ifThenElse`

| Feature | `case` | `ifThenElse` |
|---------|--------|--------------|
| Comparison type | Equality only | Any operator (==, !=, <, >, etc.) |
| Multiple conditions | Yes (multiple whens) | Requires nesting |
| Best for | Multiple discrete values | Binary conditions |
| Else clause | Optional | Required |

**Use `case` when:** You have multiple distinct values to match against.

**Use `ifThenElse` when:** You need comparison operators beyond equality, or have a simple binary condition.

## Implementation Notes

- The discriminator is evaluated once, then compared against each `when` value in order
- Matching uses JavaScript equality (`==`), so `1 == "1"` would match
- If a `when` or `then` transformer fails, the error propagates
- The `else` clause is only evaluated if no `when` matches

## Related Transformers

- `ifThenElse` - For binary conditions with comparison operators
- `dataflowObject` - For complex sequential logic
- `returnValue` - Often used in `when` and `then` clauses

## Error Handling

If the discriminator fails to evaluate, the entire transformer fails with a `TransformerFailure`. Similarly, if a matched `then` clause fails, the error propagates.

```json
{
  "queryFailure": "FailedTransformer",
  "transformerPath": ["case"],
  "failureOrigin": ["handleTransformer_case"]
}
```
