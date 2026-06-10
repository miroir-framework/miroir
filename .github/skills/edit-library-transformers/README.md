# Library-Implemented Transformer Skill

A specialized skill for creating and updating **Library-Implemented** Miroir Transformers - those that require TypeScript handler functions.

## When to Use This Skill

✅ **Use this skill when:**
- Creating transformers with `transformerImplementationType: "libraryImplementation"`
- Working with transformer handler functions in `TransformersForRuntime.ts`
- Need to implement low-level, reusable transformation logic
- Want in-memory AND/OR database (SQL) execution support

❌ **Don't use this skill when:**
- Creating composite transformers (use `edit-composite-transformers` instead)
- Working with transformers composed of other transformers only

## Quick Start

### Invoke via natural language:
```
"Create a library transformer called formatDate"
"Update the mapList transformer handler"
"Add SQL implementation for the aggregate transformer"
```

### Direct invocation:
```
/edit-library-transformers create myTransformer
/edit-library-transformers update existingTransformer
```

## What This Skill Does

1. **Pre-flight verification** - Runs tests to establish baseline
2. **TDD workflow** - Guides you through:
   - Writing tests first
   - Creating JSON definition
   - Implementing TypeScript handler
   - Registering in multiple locations
   - Generating types via devBuild
3. **Type generation** - Ensures proper schema registration for type generation
4. **Test execution** - Runs unit and integration tests

## Key Characteristics of Library Transformers

- **TypeScript Implementation**: Requires handler function in `TransformersForRuntime.ts`
- **Type Generation**: Needs schema registration in 2 files for `devBuild`
- **Multiple Registrations**: Must be registered in 3+ locations
- **Reusable**: Can be used by composite transformers
- **Examples**: `ifThenElse`, `mapList`, `createObject`, `dataflowObject`, `aggregate`

## The 8-Step Workflow

1. ✅ **Pre-flight**: Run tests to establish baseline
2. 📝 **Test First**: Write test cases (TDD)
3. ❌ **Verify Failure**: Run tests, expect them to fail
4. 📄 **Define JSON**: Create TransformerDefinition with `libraryImplementation`
5. 💻 **Implement Handler**: Add TypeScript function + registrations
6. 📦 **Export**: Import and export in `Transformers.ts`
7. 🔑 **Register Schemas**: Add to 2 schema files (CRITICAL step!)
8. ✅ **devBuild + Test**: Generate types and verify success

## Files You'll Modify

| File | What You Add |
|------|--------------|
| `a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` | TransformerDefinition JSON |
| `TransformersForRuntime.ts` | Handler function + 2 registrations |
| `Transformers.ts` | Import + export + array entry |
| `getMiroirFundamentalJzodSchema.ts` | 2 schema entries + 1 dependency |
| `generate-ts-types.ts` | 4 type generation entries |
| `33f60ac8-6511-43b1-b153-6b86e3177532.json` | Test cases (`miroirTest_miroirCoreTransformers`) |

## Test Commands

```bash
# Unit tests (in-memory execution)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests (PostgreSQL execution)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'

# devBuild to generate types
npm run devBuild -w miroir-core
```

## Directory Structure

```
edit-library-transformers/
├── SKILL.md                          # Main skill instructions
├── README.md                         # This file
├── examples.md                       # Complete examples
├── template-library-transformer.json # TransformerDefinition template
└── template-test-case.json           # Test case template
```

## Key Locations

| Location | Purpose |
|----------|---------|
| `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/*.json` | Transformer definitions |
| `2_domain/TransformersForRuntime.ts` | Handler implementations |
| `2_domain/Transformers.ts` | Exports and registration |
| `0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` | Schema registration |
| `scripts/generate-ts-types.ts` | Type generation config |
| `miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/33f60ac8-6511-43b1-b153-6b86e3177532.json` | Test suite (`miroirTest_miroirCoreTransformers`) |

## Common Pitfalls

⚠️ **Forgetting schema registration** (Step 7) - Most common error! Without this, `devBuild` won't generate types correctly.

⚠️ **Incorrect handler signature** - Must match the expected pattern with correct parameter types.

⚠️ **Missing registrations** - Must register in both `inMemoryTransformerImplementations` AND `applicationTransformerDefinitions`.

⚠️ **Not running devBuild** - Type generation is required after adding new transformers.

## See Also

- [SKILL.md](SKILL.md) - Complete step-by-step instructions
- [examples.md](examples.md) - Working examples with full code
- `edit-composite-transformers` skill - For transformers without TypeScript
