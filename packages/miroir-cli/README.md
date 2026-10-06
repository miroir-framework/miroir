# Summary
Package Created: miroir-cli
A command-line interface for the Miroir Framework that automatically exposes Endpoint Actions as CLI commands.

## Key Features
Auto-generated commands from Endpoints - Using the cliCommandEntry() factory pattern (similar to miroir-mcp's mcpToolEntry())

## 8 Commands Available:

- createInstance - Create new entity instances
- getInstance - Get a single instance by UUID
- getInstances - Get all instances of an entity
- updateInstance - Update an existing instance
- deleteInstance - Delete an instance
- deleteInstanceWithCascade - Delete with cascade
- loadNewInstancesInLocalCache - Load instances into cache
- lendDocument - Library-specific lending action

JSON-only I/O - Input via --payload or --file, output as JSON

Environment-driven - Runs on an environment of the repository (`environments/<name>.json`, see `docs/reference/environments.md`): `--env <name>`, else `MIROIR_ENV`, else `environments/local.json`, else `dev`. It emulates the server in process on that environment's stores and opens every deployment the environment installs; do not run it on the environment of a running miroir-server.


Usage example

```sh
# Run a command on the selected environment (from the repository)
miroir-cli getInstance --payload '{"application":"...","applicationSection":"data","parentUuid":"...","uuid":"..."}'

# On a given environment, from a file
miroir-cli --env test-filesystem createInstance --file ./payload.json

# List available commands
miroir-cli list
```

Authentication - With authentication on (the default, see `docs/reference/authentication.md`), every command except `list` and `help` runs as a platform user: `--user <name>` with the password in `MIROIR_PASSWORD` or typed at the prompt, or `--token <bearer>` / `MIROIR_AUTH_TOKEN` (a token from a server sharing `MIROIR_AUTH_TOKEN_SECRET`). Commands on an application the user may not open fail with `AccessDenied`. `--disable-auth` or `MIROIR_AUTH_ENABLED=0` turns it off.

```sh
MIROIR_PASSWORD=alice-dev miroir-cli --env test-filesystem --user alice getInstances --payload '{...}'
```