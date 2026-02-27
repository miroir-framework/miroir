# Composite Transformer Skill

A specialized skill for creating and updating **Composite** Miroir Transformers - those composed entirely of other transformers without TypeScript code.

## When to Use This Skill

✅ **Use this skill when:**
- Creating transformers with `transformerImplementationType: "transformer"`
- Building domain-specific transformations by composing existing transformers
- Want to create transformations without writing TypeScript code
- Need reusable business logic combinations

❌ **Don't use this skill when:**
- Need TypeScript implementation (use `edit-library-transformers` instead)
- Require imperative logic or external system interactions
- Want SQL execution support

## Quick Start

### Invoke via natural language:
```
"Create a composite transformer to filter and format user data"
"Update the spreadSheetToJzodSchema transformer"
"Build a transformer that combines filtering and mapping"
```

### Direct invocation:
```
/edit-composite-transformers create myCompositeTransformer
/edit-composite-transformers update existingCompositeTransformer
```

## What This Skill Does

1. **Pre-flight verification** - Runs tests to establish baseline
2. **TDD workflow** - Guides you through:
   - Writing tests first
   - Creating JSON definition with transformer composition
   - Registering in Transformers.ts
   - Running tests (no devBuild needed!)
3. **No TypeScript** - Pure JSON approach
4. **Test execution** - Runs unit and integration tests

## Key Characteristics of Composite Transformers

- **No TypeScript**: 100% JSON-based definition
- **Composition**: Built by combining other transformers
- **No devBuild**: No type generation needed
- **Simple**: Only 3 files to modify
- **Reusable**: Great for domain-specific logic
- **Examples**: `spreadSheetToJzodSchema`, data format conversions

## The 5-Step Workflow

1. ✅ **Pre-flight**: Run tests to establish baseline
2. 📝 **Test First**: Write test cases (TDD)
3. ❌ **Verify Failure**: Run tests, expect them to fail
4. 📄 **Define JSON**: Create TransformerDefinition with transformer composition
5. 📦 **Export**: Import and export in `Transformers.ts`
6. ✅ **Test**: Verify success (no devBuild needed!)

## Files You'll Modify

| File | What You Add |
|------|--------------|
| `a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` | TransformerDefinition with composition |
| `Transformers.ts` | Import + export + array entry |
| `a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` | Test cases |

**Only 3 files!** Much simpler than library transformers.

## Test Commands

```bash
# Unit tests (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests (PostgreSQL execution)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

**Note**: No devBuild command needed!

## Building Blocks

Composite transformers are built using these core transformers:

| Transformer | Purpose |
|-------------|---------|
| `dataflowObject` | Sequential multi-step processing |
| `getFromContext` | Access variables/parameters |
| `mapList` | Transform each item in a list |
| `createObject` | Build new objects |
| `ifThenElse` | Conditional logic |
| `accessDynamicPath` | Navigate nested objects |
| `pickFromList` | Filter lists |
| `aggregate` | Count, sum, group operations |

## Directory Structure

```
edit-composite-transformers/
├── SKILL.md                          # Main skill instructions
├── README.md                         # This file
├── examples.md                       # Complete examples
├── template-composite-transformer.json # TransformerDefinition template
└── template-test-case.json           # Test case template
```

## Key Locations

| Location | Purpose |
|----------|---------|
| `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/*.json` | Transformer definitions |
| `2_domain/Transformers.ts` | Exports and registration |
| `miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` | Test suite |

## Common Patterns

### Pattern 1: Sequential Processing
Use `dataflowObject` to process data in steps:
```json
{
  "transformerType": "dataflowObject",
  "target": "result",
  "definition": {
    "step1": { /* first transformation */ },
    "step2": { /* use result of step1 */ },
    "result": { /* final result */ }
  }
}
```

### Pattern 2: Filter and Map
Filter a list then transform each item:
```json
{
  "step1": { /* pickFromList to filter */ },
  "step2": { /* mapList to transform */ }
}
```

### Pattern 3: Conditional Processing
Use `ifThenElse` for different logic paths. The condition goes in the `if` attribute (typically a `boolExpr` transformer):
```json
{
  "transformerType": "ifThenElse",
  "if": {
    "transformerType": "boolExpr",
    "operator": "==",
    "left": { /* value to check */ },
    "right": { /* comparison value */ }
  },
  "then": { /* transformer if true */ },
  "else": { /* transformer if false */ }
}
```

## Advantages

✅ **Fast Development** - No TypeScript to write  
✅ **No Build Step** - Skip devBuild entirely  
✅ **Declarative** - Clear, readable JSON  
✅ **Testable** - Same testing as library transformers  
✅ **Maintainable** - Easy to understand and modify  
✅ **Composable** - Reuse existing transformers  

## Limitations

❌ **No Imperative Logic** - Can't write loops or complex algorithms  
❌ **No SQL Execution** - Only in-memory execution  
❌ **Performance** - May be slower than optimized TypeScript  
❌ **External Systems** - Can't call external APIs or services  

For these cases, use `edit-library-transformers` instead.

## See Also

- [SKILL.md](SKILL.md) - Complete step-by-step instructions
- [examples.md](examples.md) - Working examples with full compositions
- `edit-library-transformers` skill - For transformers with TypeScript
