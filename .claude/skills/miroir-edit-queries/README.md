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
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit
```

### 2. Add Your Test Case

Add a `queryTest` leaf to the MiroirTest suite `queries_library`:
`packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/a7a74c51-f24e-43d6-bd62-ba3ebcded97d.json` (leaf shape in [SKILL.md](SKILL.md)), then
`npm run build -w miroir-test-app_deployment-miroir`.

### 3. Run Your Test

```bash
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit --filter '{"queries_library":["my new query test"]}'
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
| `npm run testMiroir -w miroir-core -- --suites queries_library --mode unit` | All query tests |
| `... --filter '{"queries_library":["<miroirTestLabel>"]}'` | Selected leaves |
| `npm run testMiroir -w miroir-core -- --suites resolveQueryTemplates --mode unit` | Template resolution |

## Recent Enhancements

### Multiple Values Filter (February 2026)

The `filter` attribute in `extractorTemplateInstancesByEntity` and `extractorInstancesByEntity` now supports filtering on multiple values using the `values` array:

```typescript
{
  extractorOrCombinerType: "extractorInstancesByEntity",
  parentName: "Author",
  parentUuid: "...",
  filter: {
    attributeName: "name",
    values: ["Norman", "Veyne"],  // Match any of these values
  }
}
```

**Key Points**:

- `values` is an array of values to match against (similar to SQL `IN`)
- Exclusive with `value` - use one or the other, not both
- Works with `not` flag: `not: true` means "match none of these values"
- String matching uses regex (case-insensitive)
- Number matching uses equality

**Implementation**:

- Schema: [359f1f9b-7260-4d76-a864-72c839b9711b.json](../../../packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json)
- In-memory: [ExtractorByEntityReturningObjectListTools.ts](../../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.ts)
- SQL (Postgres): [SqlGenerator.ts](../../../packages/miroir-store-postgres/src/1_core/SqlGenerator.ts)
- Tests: MiroirTest suite `queries_library` - search for "values filter"

**Test Examples**:

```bash
npm run testMiroir -w miroir-core -- --suites queries_library --mode unit --filter '{"queries_library":["select Authors with values filter (multiple values)"]}'
```

## Related Skills

- [miroir-edit-transformers](../miroir-edit-transformers/) - Library transformer development
- [miroir-edit-composite-transformers](../miroir-edit-composite-transformers/) - Composite transformer development
