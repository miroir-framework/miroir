# `aggregate` Transformer

Aggregates a list of objects — counting rows, summing/averaging numeric fields, collecting values into arrays, etc. Supports grouping, distinct counting, and post-group filtering (`HAVING`).

## Schema

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "applyTo": <Transformer (→ list)>,
  "attribute": "<string>",
  "attributeObject": { "<outputKey>": "<sourceAttribute>", ... },
  "groupBy": "<string | string[]>",
  "function": "count" | "sum" | "avg" | "min" | "max" | "json_agg" | "json_agg_strict",
  "distinct": true | false,
  "having": <Transformer (→ boolean)>,
  "orderBy": "..."
}
```

### Fields

| Field | Required | Type | Description |
|---|---|---|---|
| `applyTo` | **yes** | Transformer → list | Source list to aggregate |
| `attribute` | no | string | Single attribute to aggregate. Required for `sum`, `avg`, `min`, `max`. For `json_agg`/`json_agg_strict`, use either `attribute` (scalar values) or `attributeObject` (built objects). |
| `attributeObject` | no | `Record<string, string>` | For `json_agg`/`json_agg_strict`: build an object per row. Map of output key → source attribute name. Takes precedence over `attribute`. Maps to `JSON_BUILD_OBJECT` in SQL. |
| `groupBy` | no | string \| string[] | Group results by one or more attributes |
| `function` | no | enum | Aggregate function. Defaults to `count` if omitted |
| `distinct` | no | boolean | Count/aggregate only distinct attribute values |
| `having` | no | Transformer → boolean | Filter groups after aggregation. Context includes `aggregateValue` |
| `orderBy` | no | string | Sort attribute (SQL implementation) |

### Result Key Naming (AGG-3)

- When `function` is **omitted** (legacy): result key is `"aggregate"` for backward compatibility
- When `function` is **explicitly specified**: result key is the function name (e.g., `"count"`, `"sum"`, `"avg"`)

## Examples

### Basic count

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Input: `[{a:1}, {a:2}, {a:3}]` → Output: `[{ "aggregate": 3 }]`

### Sum with explicit function

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "sum",
  "attribute": "price",
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Input: `[{price:10}, {price:20}, {price:30}]` → Output: `[{ "sum": 60 }]`

### Count with groupBy

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "count",
  "groupBy": "category",
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Input: `[{category:"A"}, {category:"B"}, {category:"A"}]`  
Output: `[{ "category": "A", "count": 2 }, { "category": "B", "count": 1 }]`

### Distinct count

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "count",
  "attribute": "status",
  "distinct": true,
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Input: `[{status:"A"}, {status:"B"}, {status:"A"}]` → Output: `[{ "count": 2 }]`

### Having clause (post-group filter)

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "sum",
  "attribute": "amount",
  "groupBy": "category",
  "having": {
    "transformerType": "boolExpr",
    "interpolation": "runtime",
    "operator": ">",
    "left": { "transformerType": "getFromContext", "interpolation": "runtime", "contextKey": "aggregateValue" },
    "right": { "transformerType": "constantNumber", "interpolation": "runtime", "value": 100 }
  },
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Only groups where `sum(amount) > 100` are included in the result.

### json_agg and json_agg_strict

`json_agg` collects all attribute values into an array. `json_agg_strict` excludes `null`/`undefined` values.

**Scalar values** (single attribute):

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "json_agg",
  "attribute": "name",
  "applyTo": { "transformerType": "contextReference", "interpolation": "runtime", "referenceName": "items" }
}
```

Input: `[{name:"Alice"}, {name:"Bob"}]` → Output: `[{ "json_agg": ["Alice", "Bob"] }]`

**Object values** via `attributeObject` (multiple attributes per row):

```json
{
  "transformerType": "aggregate",
  "interpolation": "runtime",
  "function": "json_agg",
  "attributeObject": {
    "column_name": "column_name",
    "data_type": "data_type",
    "is_nullable": "is_nullable"
  },
  "groupBy": "table_name",
  "applyTo": { "transformerType": "getFromContext", "interpolation": "runtime", "referenceName": "columnsOfSchema" }
}
```

This is equivalent to the SQL:
```sql
SELECT table_name, JSON_AGG(JSON_BUILD_OBJECT('column_name', column_name, 'data_type', data_type, 'is_nullable', is_nullable))
FROM information_schema.columns GROUP BY table_name
```

`json_agg_strict` with `attributeObject` omits rows where **all** values are null.

## SQL Mapping

| In-memory | SQL |
|---|---|
| `function: "count"` | `COUNT(attribute)::int` or `COUNT(*)::int` |
| `function: "sum"` | `SUM(attribute::numeric)::numeric` |
| `function: "avg"` | `AVG(attribute::numeric)::numeric` |
| `function: "min"` | `MIN(attribute::numeric)::numeric` |
| `function: "max"` | `MAX(attribute::numeric)::numeric` |
| `function: "json_agg"` | `JSON_AGG(attribute)` |
| `function: "json_agg_strict"` | `JSON_AGG(attribute) FILTER (WHERE attribute IS NOT NULL)` |
| `function: "json_agg"` + `attributeObject` | `JSON_AGG(JSON_BUILD_OBJECT('k', col, ...))` |
| `function: "json_agg_strict"` + `attributeObject` | `JSON_AGG(JSON_BUILD_OBJECT(...)) FILTER (WHERE ... IS NOT NULL)` |
| `distinct: true` | `COUNT(DISTINCT attribute)` etc. |
| `having: <transformer>` | `HAVING <sql-expr>` |

## Implementation

- **In-memory**: `handleCountTransformer` in `TransformersForRuntime.ts`
- **SQL**: `sqlStringForCountTransformer` in `SqlGenerator.ts`
- **Definition**: `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-.../4ee5c863-5ade-4706-92bd-1fc2d89c3766.json`
