# miroir-mcp

Model Context Protocol (MCP) server for the Miroir Framework. Exposes Miroir's InstanceEndpoint actions as MCP tools, enabling external systems to interact with Miroir applications through the standardized MCP interface.

## Features

- **7 MCP Tools**: Full coverage of InstanceEndpoint actions
  - `miroir_createInstance` - Create new entity instances
  - `miroir_getInstance` - Retrieve a single instance
  - `miroir_getInstances` - Retrieve all instances of an entity
  - `miroir_updateInstance` - Update existing instances
  - `miroir_deleteInstance` - Delete an instance
  - `miroir_deleteInstanceWithCascade` - Delete with cascade
  - `miroir_loadNewInstancesInLocalCache` - Load instances in cache only

- **Configuration-Driven**: JSON-based configuration for deployments and storage
- **Multiple Storage Backends**: Filesystem, IndexedDB, PostgreSQL (via peer dependencies)
- **Framework Logging**: Integrated with Miroir's MiroirLoggerFactory
- **Type-Safe**: Full TypeScript support with Zod validation

## Installation

```bash
npm install miroir-mcp

# Install required store package(s)
npm install miroir-store-filesystem

# Optional: for other storage backends
npm install miroir-store-indexedDb
npm install miroir-store-postgres
```

## Quick Start

### 1. Create a Configuration File

Create `miroirMcpConfig.json`:

```json
{
  "applicationDeploymentMap": {
    "360fcf1f-f0d4-4f8a-9262-07886e70fa15": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "5af03c98-fe5e-490b-b08f-e1230971c57f": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
  },
  "storeSectionConfiguration": {
    "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
      "admin": {
        "emulatedServerType": "filesystem",
        "directory": "./data/miroir_admin"
      },
      "model": {
        "emulatedServerType": "filesystem",
        "directory": "./data/miroir_model"
      },
      "data": {
        "emulatedServerType": "filesystem",
        "directory": "./data/miroir_data"
      }
    },
    "f714bb2f-a12d-4e71-a03b-74dcedea6eb4": {
      "admin": {
        "emulatedServerType": "filesystem",
        "directory": "./data/miroir_admin"
      },
      "model": {
        "emulatedServerType": "filesystem",
        "directory": "./data/library_model"
      },
      "data": {
        "emulatedServerType": "filesystem",
        "directory": "./data/library_data"
      }
    }
  },
  "logConfig": {
    "defaultLevel": "INFO",
    "defaultTemplate": "[{{time}}] {{level}} {{name}} ### ",
    "specificLoggerOptions": {}
  }
}
```

### 2. Run the MCP Server

```bash
# Using environment variable to specify config
MIROIR_MCP_CONFIG_PATH=./miroirMcpConfig.json npx miroir-mcp

# Or use default embedded configuration
npx miroir-mcp
```

### 3. Use with MCP Clients

The server runs on stdio transport and can be integrated with any MCP-compatible client (Claude Desktop, VS Code extensions, etc.).

Example Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "miroir": {
      "command": "npx",
      "args": ["miroir-mcp"],
      "env": {
        "MIROIR_MCP_CONFIG_PATH": "/path/to/your/miroirMcpConfig.json"
      }
    }
  }
}
```

## Configuration

### Environment Variables

- `MIROIR_MCP_CONFIG_PATH`: Path to configuration JSON file (optional, uses default if not provided)
- `MIROIR_MCP_LOG_CONFIG`: Path to logger configuration JSON file (optional)

### Configuration Schema

```typescript
{
  applicationDeploymentMap: {
    [applicationUuid: string]: deploymentUuid
  },
  storeSectionConfiguration: {
    [deploymentUuid: string]: {
      admin: StoreSectionConfiguration,
      model: StoreSectionConfiguration,
      data: StoreSectionConfiguration
    }
  },
  logConfig?: {
    defaultLevel: string,
    defaultTemplate: string,
    specificLoggerOptions?: { [loggerName: string]: { level?: string, template?: string } }
  }
}
```

### Storage Types

**Filesystem:**
```json
{
  "emulatedServerType": "filesystem",
  "directory": "./data/path"
}
```

**PostgreSQL:**
```json
{
  "emulatedServerType": "sql",
  "connectionString": "postgres://user:pass@localhost:5432/db",
  "schema": "schemaName"
}
```

**IndexedDB:**
```json
{
  "emulatedServerType": "indexedDb",
  "indexedDbName": "databaseName"
}
```

## MCP Tools Reference

### miroir_createInstance

Create new entity instances.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID
- `instances`: Array of instances to create

**Example:**
```json
{
  "applicationSection": "data",
  "deploymentUuid": "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  "instances": [
    {
      "uuid": "new-book-uuid",
      "parentUuid": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
      "name": "New Book",
      "author": "Author Name"
    }
  ]
}
```

### miroir_getInstance

Retrieve a single instance by UUID.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID
- `uuid`: Instance UUID

### miroir_getInstances

Retrieve all instances of an entity.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID

### miroir_updateInstance

Update existing instances.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `instances`: Array of instances with updated data

### miroir_deleteInstance

Delete a single instance.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID
- `uuid`: Instance UUID to delete

### miroir_deleteInstanceWithCascade

Delete instance and all dependent instances.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID
- `uuid`: Instance UUID to delete

### miroir_loadNewInstancesInLocalCache

Load instances into local cache without persistence.

**Parameters:**
- `applicationSection`: "model" | "data"
- `deploymentUuid`: Deployment UUID
- `parentUuid`: Entity UUID
- `instances`: Array of instances to load

## Development

### Running Tests

```bash
# Install dependencies including filesystem store for tests
npm install
npm install miroir-store-filesystem

# Run integration tests
npm test

# Run specific test file
npm run testByFile -- mcpTools
```

### Building

```bash
npm run build
```

## Architecture

The MCP server follows Miroir's layered architecture:

1. **Configuration Layer** (`src/config/`): Schema validation and loading
2. **Startup Layer** (`src/startup/`): Conditional store initialization
3. **MCP Server** (`src/mcpServer.ts`): Framework initialization and MCP protocol handling
4. **Tools Layer** (`src/tools/`): Tool definitions and handlers

All actions are executed through `DomainController.handleAction()`, ensuring consistency with the rest of the Miroir framework.

## Testing

The MCP server supports test mode with emulated server configuration, matching the pattern used in Miroir's integration tests.

### Test Mode Configuration

When `testMode` or `emulateServer` is enabled, the MCP server creates a dual-controller setup:

- **Client-side controller**: Uses remote persistence (through RestClientStub)
- **Server-side controller**: Uses local persistence (direct store access)

This enables testing of rollback and other operations that require the full client-server architecture without network overhead.

Example test configuration (`tests/miroirConfig.test-emulatedServer.json`):

```json
{
  "testMode": true,
  "emulateServer": true,
  "rootApiUrl": "http://localhost:3080",
  "applicationDeploymentMap": { ... },
  "storeSectionConfiguration": { ... }
}
```

### Running Integration Tests

```bash
# Run all tests (uses test configuration from vitest.config.ts)
npm test

# Run specific test file
npm run testByFile -- mcpTools.test
```

The test configuration is automatically loaded via the `MIROIR_MCP_CONFIG_PATH` environment variable set in `vitest.config.ts`.

## Troubleshooting

### "Failed to initialize filesystem store"

Ensure `miroir-store-filesystem` is installed:

```bash
npm install miroir-store-filesystem
```

### Store directory not found

The server creates directories automatically, but ensure the parent path exists and is writable.

### Configuration validation errors

Validate your configuration against the schema. Common issues:

- Missing required fields (`applicationSection`, `deploymentUuid`, etc.)
- Invalid UUIDs
- Incorrect storage type names

## License

MIT

## Links

- [Miroir Framework](https://github.com/miroir-framework/miroir)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
