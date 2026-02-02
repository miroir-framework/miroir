# Query Implementation Architecture

This document explains the internal architecture of Miroir Query execution in memory, helping you understand how queries work under the hood.

## Core Execution Flow

When a query is executed, it follows this pipeline:

```
Query Definition
    ↓
runQuery / runQueryFromDomainState
    ↓
extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList
    ↓
[For each extractor/combiner]
    ↓
Extract base data → Apply filters → Apply combiners → Apply transformers
    ↓
Return results
```

---

## Key Implementation Files

| File | Purpose |
|------|---------|
| [DomainStateQuerySelectors.ts](../../packages/miroir-core/src/2_domain/DomainStateQuerySelectors.ts) | Query execution for DomainState (test/in-memory state) |
| [ReduxDeploymentsStateQuerySelectors.ts](../../packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts) | Query execution for Redux state (production runtime) |
| [QuerySelectors.ts](../../packages/miroir-core/src/2_domain/QuerySelectors.ts) | Common query execution logic (state-agnostic) |
| [ExtractorByEntityReturningObjectListTools.ts](../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.ts) | Filter and orderBy logic |

---

## State Abstraction Layers

Miroir queries can run on two state representations:

### 1. DomainState (Test/Development)
```typescript
type DomainState = {
  [deploymentUuid: string]: {
    [applicationSection: "model" | "data"]: {
      [entityUuid: string]: EntityInstancesUuidIndex
    }
  }
}
```

**Access path**: `domainState[deploymentUuid][applicationSection][entityUuid]`

### 2. ReduxDeploymentsState (Production Runtime)
```typescript
type ReduxDeploymentsState = {
  [deploymentUuid: string]: {
    [applicationSection: "model" | "data"]: {
      [entityUuid: string]: EntityInstancesUuidIndex
    }
  }
}
```

**Access path**: Same as DomainState

Both representations are isomorphic at the data level, differing only in how they're managed (plain object vs Redux store).

---

## Core Extraction Functions

### `selectEntityInstanceUuidIndexFromDomainState`

**Purpose**: Fetch entity instances as a UUID-indexed object from DomainState

**Location**: `DomainStateQuerySelectors.ts`

**Signature**:
```typescript
selectEntityInstanceUuidIndexFromDomainState(
  domainState: DomainState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DomainState>
): Domain2QueryReturnType<EntityInstancesUuidIndex>
```

**Key responsibilities**:
1. Extract deployment/application/entity context from params
2. Navigate to entity instances in state: `domainState[deploymentUuid][applicationSection][entityUuid]`
3. Apply filter and orderBy (if present)
4. Return instances as `{ [uuid]: instance }` object

**Error cases**:
- `DomainStateNotLoaded` - domainState is undefined
- `DeploymentNotFound` - deployment UUID not in state
- `ApplicationSectionNotFound` - "model" or "data" section missing
- `EntityNotFound` - entity UUID not found in section

---

### `selectEntityInstanceListFromDomainState`

**Purpose**: Fetch entity instances as an array from DomainState

**Location**: `DomainStateQuerySelectors.ts`

**Implementation**:
```typescript
const result = selectEntityInstanceUuidIndexFromDomainState(...);
if (result instanceof Domain2ElementFailed) {
  return result;
}
return Object.values(result);
```

**Key point**: Delegates to `selectEntityInstanceUuidIndexFromDomainState`, then converts index to array.

---

### `applyExtractorForSingleObjectListToSelectedInstancesListInMemory`

**Purpose**: Apply combiner logic or additional filtering to a list of instances

**Location**: `QuerySelectors.ts` (state-agnostic)

**Signature**:
```typescript
applyExtractorForSingleObjectListToSelectedInstancesListInMemory(
  selectedInstancesList: Domain2QueryReturnType<EntityInstance[]>,
  query: BoxedExtractorOrCombinerReturningObjectList,
): Domain2QueryReturnType<EntityInstance[]>
```

**Handles three extractor types**:

#### 1. `extractorByEntityReturningObjectList`
Simply applies filter and orderBy:
```typescript
return applyExtractorFilterAndOrderBy(selectedInstancesList, localQuery);
```

#### 2. `combinerByRelationReturningObjectList` (N:1 or 1:N)
Filters instances by matching a foreign key attribute:
```typescript
// Get reference object from context
const referenceObject = query.contextResults[relationQuery.objectReference];
const otherIndex = referenceObject[relationQuery.objectReferenceAttribute ?? "uuid"];

// Filter instances matching the foreign key
const finalInstanceList = selectedInstancesList.filter((i: EntityInstance) => {
  const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid;
  return (i as any)[localIndex] === otherIndex;
});

// Optionally transform each result
if (relationQuery.applyTransformer) {
  return finalInstanceList.map(e => 
    transformer_extended_apply(..., {...context, referenceObject, foreignKeyObject: e})
  );
}
```

**Example**: Get all books for a publisher
- `referenceObject` = publisher instance from context
- `otherIndex` = publisher.uuid
- Filter books where `book.publisher === otherIndex`

#### 3. `combinerByManyToManyRelationReturningObjectList` (M:N)
Filters instances by matching against a list of references:
```typescript
const otherList = query.contextResults[relationQuery.objectListReference];

const finalInstanceList = selectedInstancesList.filter(
  (selectedInstance: EntityInstance) => {
    const otherListAttribute = relationQuery.objectListReferenceAttribute;
    const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid;

    return Object.values(otherList).findIndex(
      (v: any) => v[otherListAttribute] == selectedInstance[rootListAttribute]
    ) >= 0;
  }
);
```

**Example**: Get all publishers for books by an author
- Get books by author (list)
- For each book, extract its publisher UUID
- Return unique publishers matching those UUIDs

---

## Filter and OrderBy Implementation

**Module**: `ExtractorByEntityReturningObjectListTools.ts`

### Filter Matching

```typescript
export const instanceMatchesFilter = (
  instance: EntityInstance,
  filter: ExtractorFilter
): boolean => {
  const attributeValue = instance[filter.attributeName];

  // Check for undefined attribute
  if (filter.undefined) {
    const result = attributeValue === undefined;
    return filter.not ? !result : result;
  }

  // String matching (case-insensitive regex)
  if (typeof attributeValue === "string") {
    const matchResult = attributeValue.match(new RegExp(filter.value ?? "", "i")) != null;
    return filter.not ? !matchResult : matchResult;
  }

  // Number matching (exact equality)
  if (typeof attributeValue === "number") {
    const matchResult = attributeValue == filter.value;
    return filter.not ? !matchResult : matchResult;
  }

  return filter.not ? true : false;
};
```

**Filter semantics**:
- **String values**: Regex match, case-insensitive
  - `filter.value = "or"` matches "Author", "Victor", etc.
- **Number values**: Exact equality
- **`not` flag**: Inverts the match
- **`undefined` flag**: Tests for undefined attribute

### OrderBy Implementation

```typescript
export const applyOrderBy = (
  instances: EntityInstance[],
  orderBy: ExtractorOrderBy | undefined
): EntityInstance[] => {
  if (!orderBy) return instances;

  const orderByAttribute = orderBy.attributeName;
  const isAscending = (orderBy.direction ?? "asc").toLowerCase() === "asc";

  return [...instances].sort((a, b) => {
    const aValue = a[orderByAttribute];
    const bValue = b[orderByAttribute];

    if (aValue < bValue) return isAscending ? -1 : 1;
    if (aValue > bValue) return isAscending ? 1 : -1;
    return 0;
  });
};
```

---

## Execution Context

Queries carry context through execution via these properties:

### 1. `contextResults`
Results from previously executed extractors/combiners:
```typescript
contextResults: {
  book: { uuid: "...", name: "...", publisher: "..." },
  publisher: { uuid: "...", name: "..." },
}
```

**Usage**: Combiners reference previous results
```typescript
objectReference: "book" // refers to contextResults["book"]
```

### 2. `queryParams`
Parameters passed to the query (from templates):
```typescript
queryParams: { wantedBookUuid: "caef8a59..." }
```

**Usage**: Templates resolve these at build-time
```typescript
instanceUuid: {
  transformerType: "getFromParameters",
  referenceName: "wantedBookUuid"
}
```

### 3. `pageParams`
UI/application-level parameters:
```typescript
pageParams: { applicationSection: "data" }
```

---

## Transformer Integration

Queries can apply transformers at two stages:

### 1. Inline `applyTransformer` (on extractors/combiners)

Applied to each extracted/combined instance:
```typescript
{
  extractorOrCombinerType: "extractorForObjectByDirectReference",
  // ... extractor config
  applyTransformer: {
    transformerType: "createObject",
    interpolation: "runtime",
    definition: {
      bookTitle: {
        transformerType: "getFromContext",
        referencePath: ["referenceObject", "name"]
      }
    }
  }
}
```

**Context available**:
- `referenceObject` - the extracted/combined instance
- `foreignKeyObject` - related instance (for combiners)
- All `contextResults`
- All `queryParams`

### 2. `runtimeTransformers` (on query)

Applied after all extractors/combiners complete:
```typescript
runtimeTransformers: {
  publishers: {
    transformerType: "getUniqueValues",
    applyTo: {
      transformerType: "getFromContext",
      referenceName: "books" // from contextResults
    },
    attribute: "publisher"
  }
}
```

**Context available**:
- All `contextResults` (all extractor/combiner results)
- All `queryParams`

---

## Common Query Patterns

### Pattern 1: Direct Object Fetch

```typescript
extractors: {
  book: {
    extractorOrCombinerType: "extractorForObjectByDirectReference",
    parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f"
  }
}
```

**Execution**:
1. Navigate to `state[deploymentUuid][applicationSection][entityUuid]`
2. Return `instances[instanceUuid]`

### Pattern 2: Filtered List Fetch

```typescript
extractors: {
  authors: {
    extractorOrCombinerType: "extractorForObjectListByEntity",
    parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
    filter: {
      attributeName: "name",
      value: "or"
    }
  }
}
```

**Execution**:
1. Get all instances from entity
2. Apply filter: `name.match(/or/i)`
3. Return matching instances

### Pattern 3: Foreign Key Join

```typescript
extractors: {
  book: { /* fetch book */ }
},
combiners: {
  publisher: {
    extractorOrCombinerType: "combinerForObjectByRelation",
    parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
    objectReference: "book", // from contextResults
    AttributeOfObjectToCompareToReferenceUuid: "publisher"
  }
}
```

**Execution**:
1. Extractor runs, puts book in `contextResults.book`
2. Combiner reads `book.publisher` (UUID)
3. Fetches all publishers
4. Returns publisher matching `publisher.uuid === book.publisher`

---

## Error Handling Pattern

All extraction functions return `Domain2QueryReturnType<T>`:

```typescript
type Domain2QueryReturnType<T> = T | Domain2ElementFailed;
```

**Check for errors**:
```typescript
const result = selectEntityInstanceUuidIndexFromDomainState(...);
if (result instanceof Domain2ElementFailed) {
  // Handle error: result.queryFailure, result.failureMessage, etc.
  return result;
}
// Use result as T
```

**Common error types**:
- `ReferenceNotFound` - Entity or instance UUID not found
- `EntityNotFound` - Entity doesn't exist in deployment
- `DeploymentNotFound` - Deployment not loaded
- `IncorrectParameters` - Missing required parameters
- `DomainStateNotLoaded` - State object is undefined

---

## Testing Strategies

### Unit Tests

Test individual extraction functions with mock state:

```typescript
const domainState: DomainState = {
  [deploymentUuid]: {
    data: {
      [bookEntityUuid]: {
        [book1Uuid]: book1Instance,
        [book2Uuid]: book2Instance,
      }
    }
  }
};

const result = selectEntityInstanceUuidIndexFromDomainState(
  domainState,
  applicationDeploymentMap,
  extractorParams
);
```

**File**: `packages/miroir-core/tests/2_domain/queries.unit.test.ts`

### Integration Tests

Test full query execution through persistence layer:

**Files**:
- `packages/miroir-standalone-app/tests/4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx`
- `packages/miroir-standalone-app/tests/4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx`

---

## Performance Considerations

### Index vs List

- **EntityInstancesUuidIndex** (`{ [uuid]: instance }`):
  - Fast direct access by UUID: O(1)
  - Cannot apply orderBy efficiently
  - Preferred for combiners doing lookups

- **EntityInstance[]**:
  - Supports orderBy: O(n log n)
  - Linear scan for filters: O(n)
  - Preferred for list operations

### Filter Optimization

Filters are applied during extraction (not after all data is loaded):

```typescript
// Filter happens HERE (in selectEntityInstanceUuidIndexFromDomainState)
const filteredInstancesArray = applyExtractorFilterAndOrderBy(
  Object.values(entityInstances),
  localSelect
);
```

This minimizes data transferred through the pipeline.

---

## Debugging Tips

### Enable Query Logging

```bash
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run vitest -w miroir-core -- queries.unit
```

### Common Log Points

In `DomainStateQuerySelectors.ts`:
```typescript
log.info("selectEntityInstanceUuidIndexFromDomainState params", extractorParams);
log.info("selectEntityInstanceUuidIndexFromDomainState filtered result", result);
```

In `QuerySelectors.ts`:
```typescript
log.info("applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerByRelationReturningObjectList", ...);
```

### Inspecting Context

Add debug logging to see context flow:
```typescript
console.log("contextResults:", query.contextResults);
console.log("queryParams:", query.queryParams);
```
