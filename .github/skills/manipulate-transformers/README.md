# Miroir Transformer Manipulation Skill

A skill for creating and updating Miroir Transformers following TDD (Test-Driven Development) practices.

## Quick Start

### Invoke via natural language:
```
"Create a new transformer called formatDate"
"Update the mapList transformer to support filtering"
"Run the transformer tests"
"Show me how to create a composite transformer"
```

### Direct invocation:
```
/manipulate-transformers create myTransformer
/manipulate-transformers update existingTransformer
```

## What This Skill Does

1. **Pre-flight verification** - Runs transformer tests before any work to establish baseline
2. **TDD workflow** - Guides you through writing tests first, then implementation
3. **Type distinction** - Handles both library-implemented and composite transformers
4. **Test execution** - Runs unit and integration tests

## Key Concepts

### Library-Implemented Transformers
- Require TypeScript implementation
- Have `transformerImplementationType: "libraryImplementation"`
- Need handler functions in `TransformersForRuntime.ts`

### Composite Transformers
- No TypeScript code needed
- Have `transformerImplementationType: "transformer"`
- Composed of existing transformers
- Great for domain-specific transformations

## Test Commands

```bash
# Unit tests (in-memory)
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit'

# Integration tests (PostgreSQL)
RUN_TEST=transformers.integ.test npm run testByFile -w miroir-core -- 'transformers.integ'
```

## Files Structure

```
manipulate-transformers/
├── SKILL.md                          # Main skill instructions
├── examples.md                       # Detailed examples
├── template-library-transformer.json # Template for library transformers
├── template-composite-transformer.json # Template for composite transformers
└── template-test-case.json           # Template for test cases
```

## Key Project Locations

| File | Purpose |
|------|---------|
| `miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/*.json` | Transformer definitions |
| `2_domain/Transformers.ts` | Transformer exports and registration |
| `2_domain/TransformersForRuntime.ts` | Implementation functions |
| `miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json` | Test suite |

## Workflow Summary

1. **Check baseline** - Run tests, note current state
2. **Write test** - Add test case to suite
3. **Run test** - Verify it fails
4. **Implement** - Create transformer definition (and handler if library type)
5. **Run test** - Verify it passes
6. **Rebuild** - Run `devBuild` if schemas changed

## See Also

- [SKILL.md](SKILL.md) - Full skill instructions
- [examples.md](examples.md) - Complete examples with code
