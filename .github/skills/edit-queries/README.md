# Edit Queries Skill

Create and update Miroir Queries following TDD practices.

## When to Use

Use this skill when:
- Creating new queries with extractors, combiners, and transformers
- Debugging query execution issues
- Adding tests for query functionality
- Working with `boxedQueryWithExtractorCombinerTransformer` or `boxedQueryTemplateWithExtractorCombinerTransformer`

## Quick Start

### 1. Run Pre-flight Tests

```bash
npm run vitest -w miroir-core -- queries.unit
```

### 2. Add Your Test Case

Edit `packages/miroir-core/tests/2_domain/queries.unit.test.ts`:

```typescript
"my new query test": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    // ... query definition
  },
  ...testExtractorTools,
  testAssertions: {
    test1: {
      expectedResult: { /* expected output */ },
    },
  },
},
```

### 3. Run Your Test

```bash
npm run vitest -w miroir-core -- queries.unit -t "my new query test"
```

## Files in This Skill

- [SKILL.md](SKILL.md) - Main skill instructions
- [examples.md](examples.md) - Detailed test examples
- [implementation.md](implementation.md) - Query execution architecture and internals

## Understanding Query Implementation

The [implementation.md](implementation.md) guide provides deep insights into:

- How queries are executed in-memory
- State navigation patterns (`DomainState` vs `ReduxDeploymentsState`)
- Filter and orderBy implementation details
- Combiner join logic (N:1, 1:N, M:N relations)
- Context propagation through extractors and combiners
- Transformer integration points
- Error handling patterns

**When to read it**:
- Debugging unexpected query behavior
- Understanding performance characteristics
- Implementing new extractor/combiner types
- Working on query execution infrastructure

## Key Test Commands

| Command | Purpose |
|---------|---------|
| `npm run vitest -w miroir-core -- queries.unit` | All unit tests |
| `npm run vitest -w miroir-core -- queries.unit -t "pattern"` | Filtered tests |
| `npm run vitest -w miroir-core -- resolveQueryTemplates.unit` | Template resolution |

## Related Skills

- [query-editor](../query-editor/) - Transformer-focused query work
- [edit-library-transformers](../edit-library-transformers/) - Library transformer development
- [edit-composite-transformers](../edit-composite-transformers/) - Composite transformer development
