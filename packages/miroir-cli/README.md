# Summary
Package Created: miroir-cli
A command-line interface for the Miroir Framework that automatically exposes Endpoint Actions as CLI commands.

## Key Features
Auto-generated commands from Endpoints - Using the cliCommandEntry() factory pattern (similar to miroir-mcp's mcpToolEntry())

## 8 Commands Available:

createInstance - Create new entity instances
getInstance - Get a single instance by UUID
getInstances - Get all instances of an entity
updateInstance - Update an existing instance
deleteInstance - Delete an instance
deleteInstanceWithCascade - Delete with cascade
loadNewInstancesInLocalCache - Load instances into cache
lendDocument - Library-specific lending action
JSON-only I/O - Input via --payload or --file, output as JSON

Config-driven - Uses MIROIR_CLI_CONFIG_PATH environment variable or --config option


Usage example

```sh
# Set config
export MIROIR_CLI_CONFIG_PATH=./config.json

# Run a command
miroir-cli getInstance --payload '{"application":"...","applicationSection":"data","parentUuid":"...","uuid":"..."}'

# Or from file
miroir-cli createInstance --file ./payload.json

# List available commands
miroir-cli list
```