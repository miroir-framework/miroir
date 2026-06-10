# Transformer Skills Architecture

## Overview

The Miroir transformer editing capabilities are now split into **two specialized skills** instead of one monolithic skill:

1. **`edit-library-transformers`** - For transformers with TypeScript implementation
2. **`edit-composite-transformers`** - For transformers composed of other transformers

## Architecture Decision

### Why Two Separate Skills Instead of One?

After analyzing the original `edit-transformers` skill, we identified these key differences:

| Aspect | Library Transformers | Composite Transformers |
|--------|---------------------|------------------------|
| **Implementation** | TypeScript handler functions | JSON composition only |
| **Files Modified** | 6 files | 3 files |
| **Workflow Steps** | 8 steps | 5 steps |
| **devBuild Required** | Yes (type generation) | No |
| **Schema Registration** | Required (2 files) | Not required |
| **Complexity** | High - multiple integrations | Low - JSON only |
| **Development Time** | Longer (code + types + tests) | Faster (JSON + tests) |

The workflows are **fundamentally different** enough that maintaining separate skills:
- ✅ Reduces confusion for users
- ✅ Provides clearer, more focused instructions
- ✅ Enables skill-specific optimizations
- ✅ Makes each skill easier to maintain
- ✅ Allows better natural language invocation

## How to Choose Which Skill to Use

### Use `edit-library-transformers` when:

- ✅ Need imperative logic (loops, complex algorithms)
- ✅ Building fundamental, reusable primitives
- ✅ Require performance-critical operations
- ✅ Need to interact with external systems
- ✅ Want SQL execution support (database transformers)
- ✅ Creating operators (==, !=, <, >, etc.)

**Examples**: `ifThenElse`, `mapList`, `aggregate`, `createObject`, `dataflowObject`

### Use `edit-composite-transformers` when:

- ✅ Can express logic as transformer composition
- ✅ Building domain-specific transformations
- ✅ Combining existing transformers in new ways
- ✅ Want rapid development without TypeScript
- ✅ Don't need SQL execution
- ✅ Creating application-specific business logic

**Examples**: `spreadSheetToJzodSchema`, format conversions, data pipelines

## Quick Comparison

### Library Transformer Workflow (8 Steps)
1. Run pre-flight tests
2. Write test cases (TDD)
3. Verify tests fail
4. Create TransformerDefinition JSON
5. Implement TypeScript handler function
6. Export and register in Transformers.ts
7. **Register schemas (2 files - CRITICAL!)**
8. Run devBuild and tests

### Composite Transformer Workflow (5 Steps)
1. Run pre-flight tests
2. Write test cases (TDD)
3. Verify tests fail
4. Create TransformerDefinition JSON with composition
5. Export and register in Transformers.ts
6. Run tests (no devBuild!)

## Files Modified Summary

### Library Transformers (6 files)
1. `a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` - Definition
2. `TransformersForRuntime.ts` - Handler + 2 registrations
3. `Transformers.ts` - Export + registration
4. `getMiroirFundamentalJzodSchema.ts` - Schema registration (2 entries + dependency)
5. `generate-ts-types.ts` - Type generation (4 entries)
6. `a311f363-e238-4203-bdfc-29e8c160c26b/33f60ac8-6511-43b1-b153-6b86e3177532.json` - Tests (`miroirTest_miroirCoreTransformers`)

### Composite Transformers (3 files)
1. `a557419d-a288-4fb8-8a1e-971c86c113b8/<uuid>.json` - Definition with composition
2. `Transformers.ts` - Export + registration
3. `a311f363-e238-4203-bdfc-29e8c160c26b/33f60ac8-6511-43b1-b153-6b86e3177532.json` - Tests (`miroirTest_miroirCoreTransformers`)

## Skill Invocation Examples

### Natural Language

**Library transformers:**
```
"Create a library transformer called stringConcat"
"Add a TypeScript handler for date formatting"
"Implement an aggregate transformer for summing values"
```

**Composite transformers:**
```
"Create a composite transformer to filter and format users"
"Build a transformer that combines filtering and mapping"
"Compose a data pipeline for spreadsheet conversion"
```

### Direct Invocation

```bash
/edit-library-transformers create myLibraryTransformer
/edit-composite-transformers create myCompositeTransformer
```

## Skill Contents

Each skill includes:
- **SKILL.md** - Complete step-by-step workflow instructions
- **README.md** - Quick reference and overview
- **examples.md** - Real-world examples with complete code
- **template-*.json** - JSON templates for quick starts

### Library Transformers Additional Files
- `template-library-transformer.json` - TransformerDefinition template
- `template-test-case.json` - Test case template

### Composite Transformers Additional Files
- `template-composite-transformer.json` - TransformerDefinition template
- `template-test-case.json` - Test case template

## Migration from Old Skill

The original `edit-transformers` skill has been renamed to `edit-transformers-OLD` for reference but should not be used.

**Migration guide:**
1. Identify if your transformer is library or composite
2. Use the appropriate new skill
3. Follow the focused workflow for that transformer type
4. Refer to skill-specific examples

## Benefits of Two-Skill Architecture

### For Users
- 🎯 **Clearer Intent** - Skill name immediately indicates purpose
- 📚 **Focused Documentation** - Only see relevant information
- ⚡ **Faster Learning** - Simpler, targeted workflows
- ✅ **Fewer Mistakes** - Less confusion about required steps

### For Maintainers
- 🔧 **Easier Updates** - Changes isolated to relevant skill
- 📖 **Better Documentation** - Each skill self-contained
- 🧪 **Simpler Testing** - Test workflows independently
- 🎨 **Cleaner Code** - No conditional logic for two different paths

## Testing

Both skills share the same test infrastructure:

```bash
# Unit tests (in-memory)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests (database)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

**Key difference:**
- Library transformers require `devBuild` before final testing
- Composite transformers can run tests immediately

## See Also

- [edit-library-transformers/SKILL.md](edit-library-transformers/SKILL.md)
- [edit-library-transformers/README.md](edit-library-transformers/README.md)
- [edit-composite-transformers/SKILL.md](edit-composite-transformers/SKILL.md)
- [edit-composite-transformers/README.md](edit-composite-transformers/README.md)
- [edit-transformers-OLD/](edit-transformers-OLD/) - Original skill (for reference only)
