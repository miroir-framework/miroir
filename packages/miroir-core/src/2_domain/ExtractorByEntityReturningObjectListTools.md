# ExtractorByEntityReturningObjectListTools

## Overview

This module provides centralized filter and orderBy functionality for `ExtractorByEntityReturningObjectList` extractors. It consolidates duplicated filter/orderBy logic that was previously scattered across multiple selector functions.

## Functions

### `instanceMatchesFilter(instance, filter)`
Tests if a single entity instance matches the given filter criteria.

### `applyFilter(instances, filter)`
Filters an array of entity instances based on the given filter criteria.

### `applyOrderBy(instances, orderBy)`
Sorts an array of entity instances based on the given orderBy criteria.

### `applyExtractorFilterAndOrderBy(instances, extractor)`
Main entry point that applies both filter and orderBy operations from an `ExtractorByEntityReturningObjectList`.

## Refactored Functions

The following functions have been refactored to use this centralized module:

| Function | File | Test Coverage |
|----------|------|---------------|
| `selectEntityInstanceUuidIndexFromDomainState` | [DomainStateQuerySelectors.ts](DomainStateQuerySelectors.ts) | `queries.unit.test.ts` - "select Authors with filter" |
| `selectEntityInstanceUuidIndexFromReduxDeploymentsState` | [ReduxDeploymentsStateQuerySelectors.ts](ReduxDeploymentsStateQuerySelectors.ts) | `queries.unit.test.ts` - "select Authors with filter" |
| `extractEntityInstanceList` | [ExtractorRunnerInMemory.ts](ExtractorRunnerInMemory.ts) | `queries.unit.test.ts` - "select Authors with filter" |
| `applyExtractorForSingleObjectListToSelectedInstancesListInMemory` | [QuerySelectors.ts](QuerySelectors.ts) | `queries.unit.test.ts` - "select Authors with filter" |
| `applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory` | [QuerySelectors.ts](QuerySelectors.ts) | `queries.unit.test.ts` - "select Authors with filter" |

## Non-Regression Testing

To run non-regression tests for filter functionality:

```bash
# Run the queries.unit.test with filter test
npm run test -w miroir-core -- queries.unit

# Or run the specific filter test
npm run vitest -w miroir-core -- --testNamePattern="select Authors with filter"
```

The test "select Authors with filter" in `packages/miroir-core/tests/2_domain/queries.unit.test.ts` exercises:
- Filter by attribute name (string matching)
- Case-insensitive regex matching
- Both DomainState and ReduxDeploymentsState selector paths

## Filter Type Definition

```typescript
export type ExtractorFilter = {
  attributeName: string;
  not?: boolean;
  undefined?: boolean;
  value?: any;
};
```

## OrderBy Type Definition

```typescript
export type ExtractorOrderBy = {
  attributeName: string;
  direction?: "ASC" | "DESC";
};
```

## Filter Behavior

- **String values**: Case-insensitive regex matching
- **Number values**: Exact equality matching
- **`not` flag**: Negates the match result
- **`undefined` flag**: Matches instances where the attribute is undefined
