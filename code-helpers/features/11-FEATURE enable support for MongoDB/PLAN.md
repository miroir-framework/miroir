# Feature 11: Enable Support for MongoDB

## Overview

Create a new `miroir-store-mongodb` package following the established mixin-based architecture pattern used by `miroir-store-indexedDb` and `miroir-store-filesystem`, using TDD with existing integration tests to validate compatibility.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Collection naming | Use entity UUID directly | UUIDs meet MongoDB naming constraints (no dots, under 120 chars) |
| Document ID strategy | Use instance UUID as `_id` | Simpler queries, guaranteed uniqueness, native MongoDB pattern |
| Index optimization | Skip initially | Add later if performance testing shows benefit; integration tests validate correctness first |
| Connection pooling | Single shared MongoClient | Different database/collection namespacing; follows IndexedDB pattern of shared Level instance |
| Error handling | Fail fast | Consistent with existing store implementations |

## Implementation Steps

### Step 1: Set Up Package Structure and Dependencies

Create `packages/miroir-store-mongodb/` with:
- `package.json` (dependencies: `miroir-core`, `mongodb` ^6.0)
- `tsup.config.ts`
- `tsconfig.json`
- `src/4_services/` directory

### Step 2: Extend miroir-core Configuration Types

Add `MongoDbStoreSectionConfiguration` type:
```typescript
type MongoDbStoreSectionConfiguration = {
    emulatedServerType: "mongodb";
    connectionString: string;  // e.g., "mongodb://localhost:27017"
    database: string;          // Database name
};
```

Update `StoreSectionConfiguration` union in miroir-core, then run `npm run devBuild -w miroir-core`.

### Step 3: Implement MongoDB Connection Wrapper and Base Classes

Create:
- `MongoDb.ts` - Manages MongoClient, database, collections by entity UUID
- `MongoDbStore.ts` - Base store class implementing `PersistenceStoreAbstractInterface`
- `MongoDbAdminStore.ts` - Admin operations implementing `PersistenceStoreAdminSectionInterface`

### Step 4: Apply Mixin Architecture for CRUD Operations

Create:
- `MongoDbStoreSection.ts` - Section base with storage space handling
- `MongoDbInstanceStoreSectionMixin.ts` - Instance CRUD operations
- `MongoDbEntityStoreSectionMixin.ts` - Entity/collection operations
- `MongoDbDataStoreSection.ts` - Final data section class
- `MongoDbModelStoreSection.ts` - Final model section class

### Step 5: Register Store Factories and Create Test Configuration

Create:
- `startup.ts` with `miroirMongoDbStoreSectionStartup()` function
- `index.ts` exporting all public classes and startup function
- Test config `miroirConfig.test-emulatedServer-mongodb`

Update `miroir-standalone-app` startup to call MongoDB registration.

### Step 6: Run TDD Cycle with Integration Tests

Execute:
```bash
VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mongodb \
VITE_MIROIR_LOG_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/specificLoggersConfig_DomainController_debug \
npm run testByFile -w miroir-standalone-app -- ExtractorPersistenceStoreRunner.integ.test
```

Iterate on implementation until all tests pass.

## File Structure

```
miroir-store-mongodb/
├── src/
│   ├── 4_services/
│   │   ├── constants.ts
│   │   ├── MongoDb.ts
│   │   ├── MongoDbStore.ts
│   │   ├── MongoDbAdminStore.ts
│   │   ├── MongoDbStoreSection.ts
│   │   ├── MongoDbInstanceStoreSectionMixin.ts
│   │   ├── MongoDbEntityStoreSectionMixin.ts
│   │   ├── MongoDbDataStoreSection.ts
│   │   └── MongoDbModelStoreSection.ts
│   ├── constants.ts
│   ├── index.ts
│   └── startup.ts
├── package.json
├── tsup.config.ts
├── tsconfig.json
└── README.md
```

## MongoDB Data Structure

```javascript
// Collection name: <entityUuid>
// Document structure:
{
  _id: "<instanceUuid>",    // Instance UUID used as MongoDB _id
  uuid: "<instanceUuid>",   // Kept for compatibility with EntityInstance interface
  parentUuid: "<entityUuid>",
  parentName: "<entityName>",
  // ... other EntityInstance fields
}
```

## Dependencies

```json
{
  "dependencies": {
    "miroir-core": "*",
    "mongodb": "^6.0.0"
  }
}
```

## Test Configuration

`miroirConfig.test-emulatedServer-mongodb`:
```json
{
  "client": {
    "emulateServer": true,
    "deploymentStorageConfig": {
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
        "admin": {
          "emulatedServerType": "mongodb",
          "connectionString": "mongodb://localhost:27017",
          "database": "miroir_admin"
        },
        "model": {
          "emulatedServerType": "mongodb",
          "connectionString": "mongodb://localhost:27017",
          "database": "miroir_model"
        },
        "data": {
          "emulatedServerType": "mongodb",
          "connectionString": "mongodb://localhost:27017",
          "database": "miroir_data"
        }
      }
    }
  }
}
```

## Progress Tracking

- [ ] Step 1: Package structure created
- [ ] Step 2: miroir-core types extended
- [ ] Step 3: Base classes implemented
- [ ] Step 4: Mixin classes implemented
- [ ] Step 5: Factory registration and test config
- [ ] Step 6: Integration tests passing
