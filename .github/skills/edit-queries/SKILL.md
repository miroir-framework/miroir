---
name: edit-queries
description: Create or update Miroir Queries (with Extractors, Combiners, and Transformers) in a TDD style. Use when defining data access patterns, query templates, or working with boxedQueryWithExtractorCombinerTransformer.
allowed-tools: Read, Grep, Glob, Bash(npm *), Edit, Create
---

# Miroir Query TDD Development

This skill guides the creation and modification of Miroir Queries following Test-Driven Development practices.

## Miroir Query Architecture Overview

Miroir Queries combine three components to fetch and transform data:

1. **Extractors** - Fetch data from the persistence layer
2. **Combiners** - Join/combine data from extractors (similar to SQL JOINs)
3. **Runtime Transformers** - Transform the extracted/combined data

There are two main query types:

| Type | Description |
|------|-------------|
| `boxedQueryWithExtractorCombinerTransformer` | Resolved query (ready to execute) |
| `boxedQueryTemplateWithExtractorCombinerTransformer` | Query template (requires resolution first) |

---

## CRITICAL: Pre-flight Check

**BEFORE starting any query work, verify current test state to avoid investigating unrelated issues:**

```bash
# Run query unit tests
npm run vitest -w miroir-core -- queries.unit

# Run query template resolution tests
npm run vitest -w miroir-core -- resolveQueryTemplates.unit
```

If tests are failing, inform the user of the baseline state before proceeding.

---

## Test Execution Commands

### Unit Tests (In-Memory - Fast)

```bash
# All query unit tests
npm run vitest -w miroir-core -- queries.unit

# Query template resolution tests
npm run vitest -w miroir-core -- resolveQueryTemplates.unit

# Watch mode for TDD
npm run vitest -w miroir-core -- queries.unit --watch
```

### Integration Tests (Database Execution)

#### Filesystem Persistence
```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run vitest -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

#### IndexedDB Persistence
```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb npm run vitest -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

#### PostgreSQL Persistence
```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql npm run vitest -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ
```

### Extractor Template Tests (with Query Resolution)

```bash
# Filesystem
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run vitest -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ

# IndexedDB
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb npm run vitest -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ

# PostgreSQL
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql npm run vitest -w miroir-standalone-app -- ExtractorTemplatePersistenceStoreRunner.integ
```

---

## Narrowing Down Test Execution

### Using Vitest Pattern Matching

Run specific tests by name pattern:

```bash
# Run tests matching "select 1 object"
npm run vitest -w miroir-core -- queries.unit -t "select 1 object"

# Run tests matching "combiner"
npm run vitest -w miroir-core -- queries.unit -t "combiner"

# Run tests matching "filter"
npm run vitest -w miroir-core -- queries.unit -t "filter"
```

### Using Test Name Filter in queries.unit.test.ts

The test file uses `it.each()` with a `testExtractorParams` record. Filter tests by:

1. **Comment out unwanted test cases** in the `testExtractorParams` object
2. **Use `.only`** on specific test:
   ```typescript
   it.only.each([["test name", testParams]])(...)
   ```

### Integration Test Filtering

For integration tests, use the `-t` flag with vitest:

```bash
# Run only "select object by direct reference" tests
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run vitest -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ -t "select object"
```

---

## TDD Workflow for Queries

### Step 1: Verify Current Test State
Always run tests first to establish baseline:
```bash
npm run vitest -w miroir-core -- queries.unit
```

### Step 2: Write the Test First
Add test case to `packages/miroir-core/tests/2_domain/queries.unit.test.ts`:

```typescript
"my new query test": {
  queryTemplate: {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: {},
    extractorTemplates: {
      // Define extractors with build-time interpolation
    },
    combinerTemplates: {
      // Define combiners with runtime references
    },
  },
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: {},
    extractors: {
      // Resolved extractors (no templates)
    },
    combiners: {
      // Resolved combiners
    },
  },
  ...testExtractorTools,
  testAssertions: {
    test1: {
      resultAccessPath: ["myExtractorName"], // Optional: navigate to specific result
      expectedResult: {
        // Expected output
      },
    },
  },
},
```

### Step 3: Run the Test (Expect Failure)
```bash
npm run vitest -w miroir-core -- queries.unit -t "my new query test"
```

### Step 4: Implement/Fix the Query
Modify extractors, combiners, or transformers as needed.

### Step 5: Run Tests Again (Expect Success)
```bash
npm run vitest -w miroir-core -- queries.unit -t "my new query test"
```

---

## Query Structure Reference

### BoxedQueryWithExtractorCombinerTransformer

```typescript
interface BoxedQueryWithExtractorCombinerTransformer {
  queryType: "boxedQueryWithExtractorCombinerTransformer";
  application: string;            // Application UUID
  contextResults: Record<string, any>;
  pageParams: Record<string, any>;
  queryParams: Record<string, any>;
  extractors?: ExtractorOrCombinerRecord;        // Data extractors
  combiners?: ExtractorOrCombinerRecord;         // Combiner operations
  runtimeTransformers?: Record<string, Transformer>;  // Post-processing
}
```

### BoxedQueryTemplateWithExtractorCombinerTransformer

Template version where values can use build-time interpolation:

```typescript
interface BoxedQueryTemplateWithExtractorCombinerTransformer {
  queryType: "boxedQueryTemplateWithExtractorCombinerTransformer";
  application: string;
  contextResults: Record<string, any>;
  pageParams: Record<string, any>;
  queryParams: Record<string, any>;
  extractorTemplates?: ExtractorOrCombinerTemplateRecord;
  combinerTemplates?: ExtractorOrCombinerTemplateRecord;
  runtimeTransformers?: Record<string, Transformer>;
}
```

---

## Extractor Types

### extractorForObjectByDirectReference
Fetch a single object by UUID:

```typescript
{
  extractorOrCombinerType: "extractorForObjectByDirectReference",
  parentName: "Book",
  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",  // Entity UUID
  instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f", // Instance UUID
}
```

### extractorForObjectListByEntity
Fetch all instances of an entity with optional filter:

```typescript
{
  extractorOrCombinerType: "extractorForObjectListByEntity",
  parentName: "Author",
  parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  filter: {
    attributeName: "name",
    value: {
      transformerType: "returnValue",
      mlSchema: { type: "string" },
      value: "or",  // Partial match
    },
  },
}
```

### extractorByEntityReturningObjectList
Fetch all instances without filter:

```typescript
{
  extractorOrCombinerType: "extractorByEntityReturningObjectList",
  parentName: "Book",
  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
}
```

---

## Combiner Types

### combinerForObjectByRelation
Follow a foreign key to get related object (N:1):

```typescript
{
  extractorOrCombinerType: "combinerForObjectByRelation",
  parentName: "Publisher",
  parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  objectReference: "book",  // Reference to extractor result
  AttributeOfObjectToCompareToReferenceUuid: "publisher",  // FK attribute
}
```

### combinerByRelationReturningObjectList
Get all related objects (1:N):

```typescript
{
  extractorOrCombinerType: "combinerByRelationReturningObjectList",
  parentName: "Book",
  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  objectReference: "author",  // Reference to extractor result
  AttributeOfListObjectToCompareToReferenceUuid: "author",  // FK attribute
}
```

### combinerByManyToManyRelationReturningObjectList
Many-to-many relation through a list:

```typescript
{
  extractorOrCombinerType: "combinerByManyToManyRelationReturningObjectList",
  parentName: "Publisher",
  parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  objectListReference: "booksOfAuthor",  // Reference to list result
  objectListReferenceAttribute: "publisher",  // Attribute to match
}
```

---

## Using Templates with Build-Time Interpolation

Templates allow dynamic values to be resolved at build time:

```typescript
extractorTemplates: {
  book: {
    extractorOrCombinerType: "extractorForObjectByDirectReference",
    parentName: "Book",
    parentUuid: {
      transformerType: "returnValue",
      mlSchema: { type: "uuid" },
      interpolation: "build",
      value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    },
    instanceUuid: {
      transformerType: "getFromParameters",
      interpolation: "build",
      referenceName: "wantedBookUuid",  // Read from queryParams
    },
  },
}
```

### Template Interpolation Types

| Interpolation | Description |
|---------------|-------------|
| `build` | Resolved at template expansion time |
| `runtime` | Resolved during query execution |

---

## Using applyTransformer

Transform data inline on extractor/combiner results:

```typescript
{
  extractorOrCombinerType: "extractorForObjectByDirectReference",
  parentName: "Book",
  parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
  foreignKeysForTransformer: ["author"],  // Load FK objects
  applyTransformer: {
    transformerType: "createObject",
    interpolation: "runtime",
    definition: {
      bookTitle: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referencePath: ["referenceObject", "name"],
      },
      authorName: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referencePath: ["foreignKeyObjects", "author", "name"],
      },
    },
  },
}
```

---

## Runtime Transformers

Apply transformations to extracted data:

```typescript
runtimeTransformers: {
  publishers: {
    transformerType: "getUniqueValues",
    interpolation: "runtime",
    applyTo: {
      transformerType: "getFromContext",
      referenceName: "books",
    },
    attribute: "publisher",
  },
}
```

---

## Key Files Reference

| Purpose | Path |
|---------|------|
| Query unit tests | `packages/miroir-core/tests/2_domain/queries.unit.test.ts` |
| Query template resolution tests | `packages/miroir-core/tests/2_domain/resolveQueryTemplates.unit.test.ts` |
| Extractor integration tests | `packages/miroir-standalone-app/tests/4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` |
| Template integration tests | `packages/miroir-standalone-app/tests/4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` |
| Domain state test data | `packages/miroir-core/tests/2_domain/domainState.json` |
| Query selector implementation | `packages/miroir-core/src/2_domain/DomainStateQuerySelectors.ts` |
| Query template resolver | `packages/miroir-core/src/2_domain/Templates.ts` |
| Query types (generated) | `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` |

---

## Example Test Cases

### Test: Select Single Object by UUID

```typescript
"select 1 object from Domain State": {
  queryTemplate: {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: {},
    extractorTemplates: {
      book: {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        parentName: "Book",
        parentUuid: {
          transformerType: "returnValue",
          mlSchema: { type: "uuid" },
          interpolation: "build",
          value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        },
        instanceUuid: {
          transformerType: "returnValue",
          mlSchema: { type: "uuid" },
          interpolation: "build",
          value: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      },
    },
  },
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: {},
    extractors: {
      book: {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        parentName: "Book",
        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    test1: {
      resultAccessPath: ["book"],
      expectedResult: {
        uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        name: "Et dans l'éternité, je ne m'ennuierai pas",
        // ... other book attributes
      },
    },
  },
},
```

### Test: Error on Non-Existing Entity

```typescript
"error on non-existing Entity: EntityNotFound": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: {},
    extractors: {
      book: {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        parentName: "Book",
        parentUuid: "XXXXXX",  // Invalid UUID
        instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    test1: {
      expectedResult: {
        queryFailure: "ReferenceNotFound",
        queryContext: "runQuery could not run extractor: book",
      },
    },
  },
},
```

### Test: Combiner with Foreign Key Join

```typescript
"select object and related by FK": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: { applicationSection: "data" },
    queryParams: {},
    extractors: {
      book: {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        parentName: "Book",
        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        instanceUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
      },
    },
    combiners: {
      publisher: {
        extractorOrCombinerType: "combinerForObjectByRelation",
        parentName: "Publisher",
        parentUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
        objectReference: "book",
        AttributeOfObjectToCompareToReferenceUuid: "publisher",
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    test1: {
      resultAccessPath: ["publisher"],
      expectedResult: {
        uuid: "516a7366-39e7-4998-82cb-80199a7fa667",
        name: "Folio",
        // ...
      },
    },
  },
},
```

---

## Library Example Entity UUIDs (for Testing)

Commonly used UUIDs from the Library example application:

| Entity | UUID |
|--------|------|
| Author (Entity) | `d7a144ff-d1b9-4135-800c-a7cfc1f38733` |
| Book (Entity) | `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` |
| Publisher (Entity) | `a027c379-8468-43a5-ba4d-bf618be25cab` |
| Library Application | `5af03c98-fe5e-490b-b08f-e1230971c57e` (selfApplicationLibrary.uuid) |
| Library Deployment | `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` |

### Example Instances

| Instance | UUID |
|----------|------|
| Book: "Et dans l'éternité..." | `caef8a59-39eb-48b5-ad59-a7642d3a1e8f` |
| Author: Paul Veyne | `ce7b601d-be5f-4bc6-a5af-14091594046a` |
| Publisher: Folio | `516a7366-39e7-4998-82cb-80199a7fa667` |
| Publisher: Penguin | `c1c97d54-aba8-4599-883a-7fe8f3874095` |
| Publisher: Springer | `1f550a2a-33f5-4a56-83ee-302701039494` |

---

## Debugging Tips

### Enable Debug Logging

```bash
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug npm run vitest -w miroir-core -- queries.unit
```

### Check Query Resolution

Use `resolveQueryTemplateWithExtractorCombinerTransformer` to debug template resolution:

```typescript
import { resolveQueryTemplateWithExtractorCombinerTransformer } from "../../src/2_domain/Templates";

const resolvedQuery = resolveQueryTemplateWithExtractorCombinerTransformer(
  queryTemplate, 
  defaultMiroirModelEnvironment
);
console.log(JSON.stringify(resolvedQuery, null, 2));
```

### Inspect Domain State

The unit tests use `domainState.json`. Check it for available test data:
- File: `packages/miroir-core/tests/2_domain/domainState.json`

---

## Common Errors

### "ReferenceNotFound" / "EntityNotFound"

**Cause**: Invalid `parentUuid` (entity doesn't exist in domain state)

**Solution**: Verify the entity UUID matches test data in `domainState.json`

### "InstanceNotFound"

**Cause**: Invalid `instanceUuid` (instance doesn't exist)

**Solution**: Verify the instance UUID matches test data

### Query returns empty result

**Causes**:
- Wrong `applicationSection` (should be `"data"` or `"model"`)
- Filter doesn't match any instances
- Incorrect foreign key attribute name

**Solution**: Check `pageParams.applicationSection` and verify filter values

---

## Checklist

Before submitting query changes:

- [ ] Pre-flight tests passed (baseline established)
- [ ] Test case(s) written first (TDD)
- [ ] Both `queryTemplate` and `query` provided (when applicable)
- [ ] `testAssertions` defined with expected results
- [ ] Unit tests pass: `npm run vitest -w miroir-core -- queries.unit`
- [ ] Query template resolution tested (if using templates)
- [ ] Integration tests pass on at least one storage backend

---

## Implementation Architecture

### Understanding Query Execution Internals

For deep understanding of how queries are executed in memory, see [implementation.md](implementation.md), which covers:

- **Core execution flow**: From query definition to results
- **State abstraction layers**: DomainState vs ReduxDeploymentsState
- **Key functions**:
  - `selectEntityInstanceUuidIndexFromDomainState` - Base entity extraction
  - `applyExtractorForSingleObjectListToSelectedInstancesListInMemory` - Combiner logic
  - `applyExtractorFilterAndOrderBy` - Filter and sort implementation
- **Context propagation**: How `contextResults`, `queryParams`, and `pageParams` flow
- **Transformer integration**: Inline `applyTransformer` vs `runtimeTransformers`
- **Error handling patterns**: Working with `Domain2QueryReturnType`

### Key Implementation Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| [DomainStateQuerySelectors.ts](../../packages/miroir-core/src/2_domain/DomainStateQuerySelectors.ts) | DomainState query execution | `selectEntityInstanceUuidIndexFromDomainState`, `selectEntityInstanceListFromDomainState` |
| [ReduxDeploymentsStateQuerySelectors.ts](../../packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts) | Redux state query execution | `selectEntityInstanceUuidIndexFromReduxDeploymentsState` |
| [QuerySelectors.ts](../../packages/miroir-core/src/2_domain/QuerySelectors.ts) | State-agnostic query logic | `applyExtractorForSingleObjectListToSelectedInstancesListInMemory`, `runQuery` |
| [ExtractorByEntityReturningObjectListTools.ts](../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.ts) | Filter and orderBy | `instanceMatchesFilter`, `applyFilter`, `applyOrderBy` |

### Query Execution Pipeline

```
BoxedQueryWithExtractorCombinerTransformer
    ↓
runQueryFromDomainState
    ↓
[For each extractor in order]
    ↓
selectEntityInstanceUuidIndexFromDomainState
    → Navigate: domainState[deploymentUuid][applicationSection][entityUuid]
    → Apply filter (regex for strings, equality for numbers)
    → Apply orderBy
    → Store in contextResults[extractorName]
    ↓
[For each combiner in order]
    ↓
applyExtractorForSingleObjectListToSelectedInstancesListInMemory
    → combinerByRelationReturningObjectList (N:1 or 1:N FK join)
    → combinerByManyToManyRelationReturningObjectList (M:N relation)
    → Apply applyTransformer (if present)
    → Store in contextResults[combinerName]
    ↓
[For each runtimeTransformer]
    ↓
transformer_extended_apply
    → Transform final results
    ↓
Return contextResults
```

### Filter Implementation Details

**String matching** (case-insensitive regex):
```typescript
filter: { attributeName: "name", value: "or" }
// Matches: "Author", "Victor", "George Orwell"
// Uses: new RegExp("or", "i")
```

**Number matching** (exact equality):
```typescript
filter: { attributeName: "year", value: 2020 }
// Matches only instances where year === 2020
```

**Negation**:
```typescript
filter: { attributeName: "name", value: "test", not: true }
// Matches all instances where name does NOT match /test/i
```

**Undefined check**:
```typescript
filter: { attributeName: "optionalField", undefined: true }
// Matches instances where optionalField === undefined
```

### Combiner Join Logic

#### N:1 or 1:N Join (`combinerByRelationReturningObjectList`)

**Conceptual SQL equivalent**:
```sql
SELECT * FROM books 
WHERE books.publisher = (SELECT uuid FROM context WHERE name = 'publisher')
```

**Miroir implementation**:
1. Get reference object from `contextResults[objectReference]`
2. Extract join key: `referenceObject[objectReferenceAttribute]`
3. Filter instances: `instance[AttributeOfListObjectToCompareToReferenceUuid] === joinKey`

**Example**: Get books for a publisher
```typescript
extractors: { publisher: { /* fetch publisher */ } },
combiners: {
  books: {
    extractorOrCombinerType: "combinerByRelationReturningObjectList",
    parentUuid: "e8ba151b-...", // Book entity
    objectReference: "publisher", // from contextResults
    AttributeOfListObjectToCompareToReferenceUuid: "publisher" // book.publisher
  }
}
// Result: books where book.publisher === publisher.uuid
```

#### M:N Join (`combinerByManyToManyRelationReturningObjectList`)

**Conceptual SQL equivalent**:
```sql
SELECT DISTINCT * FROM publishers
WHERE uuid IN (
  SELECT publisher FROM books 
  WHERE author = 'authorUuid'
)
```

**Miroir implementation**:
1. Get list from `contextResults[objectListReference]`
2. For each candidate instance:
   - Extract its key: `instance[AttributeOfRootListObjectToCompareToListReferenceUuid]`
   - Check if any list item matches: `listItem[objectListReferenceAttribute] === instanceKey`
3. Return matching instances

### Transformer Context

When `applyTransformer` runs on a combiner:

**Available context**:
```typescript
{
  ...contextResults,           // All previous extractor/combiner results
  ...queryParams,              // Query parameters
  referenceObject: object,     // The joined/referenced object
  foreignKeyObject: instance   // Current instance being transformed
}
```

**Example**:
```typescript
applyTransformer: {
  transformerType: "createObject",
  definition: {
    bookTitle: {
      transformerType: "getFromContext",
      referencePath: ["foreignKeyObject", "name"] // Current book
    },
    publisherName: {
      transformerType: "getFromContext",
      referencePath: ["referenceObject", "name"] // Referenced publisher
    }
  }
}
```

---

## Additional Resources

- See [implementation.md](implementation.md) for detailed query execution architecture
- See [query-editor SKILL.md](../query-editor/SKILL.md) for transformer-related query work
- See existing tests in `queries.unit.test.ts` for more patterns
- Review `resolveQueryTemplates.unit.test.ts` for template resolution examples
- Check [ExtractorByEntityReturningObjectListTools.md](../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.md) for filter/orderBy details
