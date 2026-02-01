# Plus Transformer (`+`)

## Overview

The **plus transformer** (`transformerType: "+"`) implements the addition and concatenation operator, similar to the JavaScript `+` operator but with SQL-compatible type constraints. It performs:

- **Addition** for numbers and bigints
- **Concatenation** for strings

Unlike JavaScript's `+` operator which performs type coercion, the plus transformer returns an error when operand types don't match, ensuring SQL compatibility.

## UUID

`6318c3cc-6f2e-476b-b7ae-10de01977009`

## Schema

```json
{
  "transformerType": "+",
  "interpolation": "runtime",
  "left": <TransformerForBuildPlusRuntime>,
  "right": <TransformerForBuildPlusRuntime>
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `transformerType` | `"+"` | Yes | Identifies this as a plus transformer |
| `interpolation` | `"build"` \| `"runtime"` | No | When to evaluate (default: `"runtime"`) |
| `label` | `string` | No | Optional label for debugging |
| `left` | `TransformerForBuildPlusRuntime` | Yes | Left operand transformer |
| `right` | `TransformerForBuildPlusRuntime` | Yes | Right operand transformer |

## Behavior

### Number Addition

When both operands evaluate to JavaScript `number` types, returns their sum.

```json
{
  "transformerType": "+",
  "interpolation": "runtime",
  "left": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "number" },
    "interpolation": "runtime",
    "value": 5
  },
  "right": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "number" },
    "interpolation": "runtime",
    "value": 3
  }
}
// Result: 8
```

### String Concatenation

When both operands evaluate to `string` types (without bigint mlSchema), returns concatenated string.

```json
{
  "transformerType": "+",
  "interpolation": "runtime",
  "left": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "string" },
    "interpolation": "runtime",
    "value": "Hello, "
  },
  "right": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "string" },
    "interpolation": "runtime",
    "value": "World!"
  }
}
// Result: "Hello, World!"
```

### Bigint Addition

When both operands have `mlSchema.type === "bigint"`, performs bigint addition. Since JSON doesn't support native bigints, bigint values are represented as strings with an `mlSchema` of type `"bigint"`. The result is also returned as a string.

```json
{
  "transformerType": "+",
  "interpolation": "runtime",
  "left": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "bigint" },
    "interpolation": "runtime",
    "value": "9007199254740992"
  },
  "right": {
    "transformerType": "returnValue",
    "mlSchema": { "type": "bigint" },
    "interpolation": "runtime",
    "value": "1"
  }
}
// Result: "9007199254740993"
```

### Using References

Operands can reference context or parameter values:

```json
{
  "transformerType": "+",
  "interpolation": "runtime",
  "left": {
    "transformerType": "getFromParameters",
    "interpolation": "runtime",
    "referenceName": "value1"
  },
  "right": {
    "transformerType": "getFromParameters",
    "interpolation": "runtime",
    "referenceName": "value2"
  }
}
// With params { value1: 100, value2: 50 } => Result: 150
```

## Error Handling

The plus transformer returns a `TransformerFailure` in the following cases:

### Type Mismatch

When operand types don't match (e.g., number + string, number + bigint):

```json
{
  "transformerType": "+",
  "left": { "value": 5 },           // number
  "right": { "value": "test" }      // string
}
// Result: TransformerFailure with message:
// "Type mismatch: cannot apply + to number and string. Both operands must be of the same type (number, string, or bigint)."
```

### Null/Undefined Operands

When either operand is null or undefined:

```json
// Result: TransformerFailure with message:
// "Cannot apply + to null/undefined: left=null, right=5"
```

### Failed Operand Resolution

When an operand transformer fails (e.g., reference not found):

```json
{
  "transformerType": "+",
  "left": {
    "transformerType": "getFromParameters",
    "referenceName": "nonExistent"
  },
  "right": { "value": 5 }
}
// Result: TransformerFailure with innerError containing the operand failure
```

## SQL Compatibility

The plus transformer is designed for SQL compatibility:

1. **Strict Type Matching**: Unlike JavaScript, mixing types is not allowed
2. **No Implicit Coercion**: Numbers won't be converted to strings or vice versa
3. **Bigint Support**: Large integers beyond JavaScript's safe integer range are supported via string representation
4. **Deterministic Errors**: Type mismatches return clear errors rather than unexpected results

When implemented in SQL (PostgreSQL), this maps to:
- `+` operator for numbers/bigints
- `||` operator for strings

## Related Transformers

- `returnValue` - For constant operand values
- `getFromParameters` - For parameter references
- `getFromContext` - For context references
- `ifThenElse` - For conditional logic around arithmetic
