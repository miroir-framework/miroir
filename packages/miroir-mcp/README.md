# miroir-mcp

Model Context Protocol (MCP) server for the Miroir Framework. Exposes the Endpoint actions of the deployed Miroir applications as MCP tools, enabling external systems to interact with Miroir applications through the standardized MCP interface.

## Where MCP runs

miroir-mcp is a library. The MCP endpoint is served by:

- **miroir-server**, on the port of `server.mcpUrl` of the selected environment, when `features.mcp` is on;
- **the Electron main process**, on its loopback server.

Both take their stores from their environment (`environments/*.json`, see `docs/reference/environments.md`). The package has no configuration file and no binary of its own (#345).

Example Cursor / VS Code configuration (`.vscode/mcp.json` or `.cursor/mcp.json`) for the `dev` environment:

```json
{
  "servers": {
    "miroir": {
      "url": "https://localhost:4080/mcp"
    }
  }
}
```

The endpoint is a **stateless Streamable HTTP** endpoint at `/mcp`.

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

```bash
npm run build -w miroir-mcp
npm run testByFile -w miroir-mcp                        # all tests
npm run testByFile -w miroir-mcp -- mcpTools.integ      # one file
```

## Architecture

The MCP server follows Miroir's layered architecture:

1. **Startup Layer** (`src/startup/`): store initialization from a client configuration (tests)
2. **MCP Server** (`src/mcpServer.ts`): Framework initialization and stateless Streamable HTTP MCP protocol handling
3. **Tools Layer** (`src/tools/`): Tool definitions and handlers

All actions are executed through `DomainController.handleAction()`, ensuring consistency with the rest of the Miroir framework.

## Testing

The integration tests run on a test environment: `MIROIR_ENV` when it names a `test-*` environment, else `test-filesystem`. Each test file seeds the environment's copies in `.miroir/<environment>/` again from the package assets and boots it like the server (`openTestEnvironment` and `bootEnvironment` from miroir-env, `tests/integration/mcpTestPlatform.ts`), so no test writes into tracked files.

## License

MIT

## Links

- [Miroir Framework](https://github.com/miroir-framework/miroir)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
