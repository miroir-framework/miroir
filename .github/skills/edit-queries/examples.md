# Query Test Examples

This file contains detailed examples of Miroir Query test patterns.

## Quick Test Commands

```bash
# Run all query unit tests
npm run vitest -w miroir-core -- queries.unit

# Run specific test by name
npm run vitest -w miroir-core -- queries.unit -t "select 1 object"

# Watch mode for TDD
npm run vitest -w miroir-core -- queries.unit --watch -t "my test name"
```

---

## Example 1: Simple Object Fetch

Fetch a single book by UUID:

```typescript
"fetch book by UUID": {
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
  },
  ...testExtractorTools,
  testAssertions: {
    result: {
      resultAccessPath: ["book"],
      expectedResult: {
        uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        name: "Et dans l'éternité, je ne m'ennuierai pas",
        author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
        publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
      },
    },
  },
},
```

---

## Example 2: Fetch Object List with Filter

Fetch all authors whose name contains "or":

```typescript
"select Authors with filter": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: { applicationSection: "data" },
    queryParams: {},
    extractors: {
      authors: {
        extractorOrCombinerType: "extractorForObjectListByEntity",
        parentName: "Author",
        parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
        filter: {
          attributeName: "name",
          value: {
            transformerType: "returnValue",
            mlSchema: { type: "string" },
            value: "or",
          },
        },
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    result: {
      resultAccessPath: ["authors"],
      expectedResult: [
        // Authors with "or" in their name
        { uuid: "...", name: "Victor Hugo", /* ... */ },
      ],
    },
  },
},
```

---

## Example 3: Foreign Key Join (N:1)

Fetch a book and its publisher:

```typescript
"book with publisher": {
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
        objectReference: "book",  // Reference to extractor result
        AttributeOfObjectToCompareToReferenceUuid: "publisher",  // FK field
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    bookResult: {
      resultAccessPath: ["book"],
      expectedResult: {
        uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        name: "Et dans l'éternité, je ne m'ennuierai pas",
        publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
      },
    },
    publisherResult: {
      resultAccessPath: ["publisher"],
      expectedResult: {
        uuid: "516a7366-39e7-4998-82cb-80199a7fa667",
        name: "Folio",
      },
    },
  },
},
```

---

## Example 4: One-to-Many Relation (1:N)

Fetch an author and all their books:

```typescript
"author with books": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: { applicationSection: "data" },
    queryParams: {},
    extractors: {
      author: {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        parentName: "Author",
        parentUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
        instanceUuid: "ce7b601d-be5f-4bc6-a5af-14091594046a",  // Paul Veyne
      },
    },
    combiners: {
      books: {
        extractorOrCombinerType: "combinerByRelationReturningObjectList",
        parentName: "Book",
        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        objectReference: "author",  // Reference to extractor result
        AttributeOfListObjectToCompareToReferenceUuid: "author",  // FK in Book
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    booksResult: {
      resultAccessPath: ["books"],
      expectedResult: [
        // All books by Paul Veyne
        { uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f", name: "Et dans l'éternité...", author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
      ],
    },
  },
},
```

---

## Example 5: Using Query Templates

Query template with build-time parameter substitution:

```typescript
"book by UUID from queryParams": {
  queryTemplate: {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
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
    },
  },
  query: {
    // The resolved version (what the template becomes)
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: {},
    queryParams: { wantedBookUuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f" },
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
    result: {
      resultAccessPath: ["book"],
      expectedResult: {
        uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        name: "Et dans l'éternité, je ne m'ennuierai pas",
      },
    },
  },
},
```

---

## Example 6: Runtime Transformers

Extract unique publishers from a book list:

```typescript
"unique publishers from books": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: { applicationSection: "data" },
    queryParams: {},
    extractors: {
      books: {
        extractorOrCombinerType: "extractorByEntityReturningObjectList",
        parentName: "Book",
        parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      },
    },
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
    },
  },
  ...testExtractorTools,
  testAssertions: {
    result: {
      resultAccessPath: ["publishers"],
      expectedResult: [
        { publisher: "516a7366-39e7-4998-82cb-80199a7fa667" },
        { publisher: "c1c97d54-aba8-4599-883a-7fe8f3874095" },
        { publisher: "1f550a2a-33f5-4a56-83ee-302701039494" },
      ],
    },
  },
},
```

---

## Example 7: Using applyTransformer

Transform extracted data inline:

```typescript
"book with author name via applyTransformer": {
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
        foreignKeysForTransformer: ["author"],  // Load author object
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
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    result: {
      resultAccessPath: ["book"],
      expectedResult: {
        bookTitle: "Et dans l'éternité, je ne m'ennuierai pas",
        authorName: "Paul Veyne",
      },
    },
  },
},
```

---

## Example 8: Error Handling Tests

Test for proper error responses:

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
        parentUuid: "INVALID-UUID",  // This entity doesn't exist
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

"error on non-existing instance: InstanceNotFound": {
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
        instanceUuid: "INVALID-INSTANCE-UUID",  // This instance doesn't exist
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

---

## Example 9: Heteronomous Many-to-Many Join

Complex join returning list of object lists:

```typescript
"instances of all entities": {
  query: {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    application: selfApplicationLibrary.uuid,
    contextResults: {},
    pageParams: { applicationSection: "data" },
    queryParams: {},
    extractors: {
      entities: {
        extractorOrCombinerType: "extractorByEntityReturningObjectList",
        applicationSection: "model",
        parentName: "Entity",
        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      },
    },
    combiners: {
      instancesOfEntities: {
        extractorOrCombinerType: "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList",
        rootExtractorOrReference: "entities",
        subQueryTemplate: {
          query: {
            extractorOrCombinerType: "extractorForObjectListByEntity",
            parentUuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "uuid",
            },
          },
          rootQueryObjectTransformer: {
            transformerType: "recordOfTransformers",
            definition: {
              uuid: {
                transformerType: "objectTransformer",
                attributeName: "uuid",
              },
            },
          },
        },
      },
    },
  },
  ...testExtractorTools,
  testAssertions: {
    result: {
      resultAccessPath: ["instancesOfEntities"],
      expectedResult: {
        // Each entity UUID maps to list of its instances
        "d7a144ff-d1b9-4135-800c-a7cfc1f38733": [/* authors */],
        "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": [/* books */],
        "a027c379-8468-43a5-ba4d-bf618be25cab": [/* publishers */],
      },
    },
  },
},
```

---

## Test Helper Functions

The test file provides these helper tools in `testExtractorTools`:

```typescript
const testExtractorTools = {
  // Domain State runners
  getQueryTemplateRunnerParamsForDomainState,
  runQueryTemplateFromDomainState,
  getQueryRunnerParamsForDomainState,
  runQueryFromDomainState,

  // Deployment Entity State runners
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  runQueryTemplateFromReduxDeploymentsState,
  getQueryRunnerParamsForReduxDeploymentsState,
  runQueryFromReduxDeploymentsState,
};
```

Always spread `...testExtractorTools` in your test case to include the query runners.
