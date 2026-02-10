# Library MetaModel Extraction Scripts

This package contains two scripts for generating a complete MetaModel JSON file for the Library example application:

## Scripts

### 1. `generate-library-metamodel.ts` (Static Generation)

The original script that **statically imports** all model elements from the TypeScript index and assembles them into a MetaModel.

**Usage:**
```bash
npm run generate-library-model
```

**Output:** `dist/library-metamodel.json`

**Pros:**
- Fast execution
- No external dependencies beyond TypeScript
- Type-safe

**Cons:**
- Requires manual code updates when model elements change
- Must import each element explicitly

### 2. `extract-library-metamodel.ts` (Dynamic Extraction)

The new script that **dynamically reads** model elements from the filesystem-deployed store.

**Usage:**
```bash
npm run extract-library-model
```

**Output:** `dist/library-metamodel-extracted.json`

**Pros:**
- Automatically reflects changes in the assets folders
- No code modifications needed when model changes
- Demonstrates how to mount and read from Miroir stores programmatically

**Cons:**
- Requires more dependencies (store packages)
- Slower execution due to store initialization

## Configuration

The dynamic extraction script uses `scripts/extractMetaModelConfig.json` which configures:
- Library model directory: `./assets/library_model`
- Library data directory: `./assets/library_data`  
- Admin directory: `../../miroir-standalone-app/tests/assets/admin`

All paths are automatically resolved to absolute paths during script execution.

## How the Dynamic Extraction Works

1. **Initializes Miroir framework** - Registers all store backends (filesystem, IndexedDB, PostgreSQL)
2. **Mounts the filesystem store** - Connects to the library deployment's model and data directories
3. **Reads model elements** - Queries the store for:
   - Entities (Author, Book, Publisher, etc.)
   - EntityDefinitions
   - Endpoints
   - Menus
   - Reports
   - JzodSchemas
   - Queries (StoredQueries)
   - ApplicationVersions
4. **Assembles the MetaModel** - Combines all elements into the standard MetaModel structure
5. **Writes output** - Saves to `dist/library-metamodel-extracted.json`

## MetaModel Structure

Both scripts produce the same JSON structure:

```typescript
{
  applicationUuid: string,
  applicationName: string,
  entities: Entity[],
  entityDefinitions: EntityDefinition[],
  endpoints: EndpointDefinition[],
  menus: Menu[],
  reports: Report[],
  storedQueries: Query[],
  jzodSchemas: MlSchema[],
  applicationVersions: ApplicationVersion[],
  applicationVersionCrossEntityDefinition: []
}
```

## Use Cases

- **Static generation**: Use for production builds or when model is stable
- **Dynamic extraction**: Use during development or to verify filesystem deployment integrity

## Technical Notes

### Entity UUIDs

The script queries these Miroir meta-model entities:
- Entity: `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`
- EntityDefinition: `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd`
- Menu: `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`
- Report: `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`
- Endpoint: `3d8da4d4-8f76-4bb4-9212-14869d81c00c`
- JzodSchema: `5e81e1b9-38be-487c-b3e5-53796c57fccf`
- QueryVersion: `e4320b9e-ab45-4abe-85d8-359604b3c62f`
- ApplicationVersion: `c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24`

### Dependencies

The extraction script requires:
- `miroir-core`
- `miroir-test-app_deployment-admin`
- `miroir-store-filesystem`
- `miroir-store-indexedDb`
- `miroir-store-postgres`

All are configured as devDependencies and linked in the monorepo.
