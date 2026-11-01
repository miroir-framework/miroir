# Model Context Protocol (MCP) Integration

The **in-app** CopilotKit assistant (OpenAI-compatible keys, or a Cursor or Claude agent) is documented in [Using AI in Miroir](using-ai.md). This page is for **external** MCP clients (Claude Desktop, ChatGPT, other agents) talking to Miroir's MCP HTTP server.

> ⚠️⚠️⚠️ Connecting those external clients is still a stub. Flag and URL facts below are current.

## Overview

Miroir includes native support for the Model Context Protocol (MCP), enabling AI agents and LLMs to interact with your applications.

MCP is off unless the **persistence-side** config sets `features.mcp: true` and you restart that process. Missing `mcp` is false. How to set or unset the flag, and what it mounts: [Process capabilities](../reference/process-capabilities.md).

Shipped `miroir-server` defaults (`packages/miroir-server/config/miroirConfig.server.json`) turn MCP on. The HTTP app then mounts `/mcp`, and `server.mcpUrl` (default `https://localhost:4080`) starts the dedicated MCP listener. Electron main does the same when its hardcoded `features.mcp` is true, on loopback HTTP. The sandbox page leaves MCP off unless you set the flag there.

## What is MCP?

(Content to be added)

## Miroir MCP Server

### Authentication

When authentication is on (the server default), an MCP client must send `Authorization: Bearer <token>`, with a token from `POST /auth/login`. Without it the server answers 401; tools on an application the user may not open return an `AccessDenied` tool error. `--disable-mcp-auth` or `MIROIR_MCP_AUTH_ENABLED=0` keeps MCP open while the rest stays gated. See [MCP in the authentication reference](../reference/authentication.md#mcp).

### Tools, CLI commands and assistant actions from Endpoints

Every Endpoint action of every deployed application is an MCP tool, a `@miroir-framework/cli` command and, for applications other than Miroir and Admin, an in-app assistant action. Nothing is coded per application: deploy an application, or add an Endpoint to its model, and the action appears (live for MCP and the assistant, at the next run for the CLI). The list comes from the endpoint action catalog of `@miroir-framework/core` (`listEndpointActions`, #627).

| Rule | Detail |
|---|---|
| Name | `<application>_<actionType>`, e.g. `Library_lendDocument`, `Miroir_createInstance`; `<application>_<endpoint>_<actionType>` when two endpoints of one application declare the same action type; at most 64 characters (a longer name is cut and ends with a hash of the full name). The same name on every surface. |
| CLI alias | the bare action type (`lendDocument`, `createInstance`) when exactly one command has it; `list` and `help` are never aliases. `miroir-cli list` shows the commands grouped by application, with their aliases. |
| Payload | checked against the action's payload schema. A `createInstance` or `updateInstance` is also checked against the Entities of the application it names (`payload.application`), not of the Miroir application that owns the instance endpoint. Instances inside composite actions are not checked yet. |
| Model | a call runs with the model of the application it targets: the application named in the payload of a Miroir action when that application is deployed, else the endpoint's own application. |
| Access | with authentication on, a call runs as its caller and only on deployments the caller may open (MCP Bearer, CLI `--user` / `--token`, the assistant's session). |
| Assistant | the assistant offers the actions of applications other than Miroir and Admin (their framework actions stay on MCP). A proposal form posts its accepted payload to `POST /api/copilotkit/endpointAction/<name>`, which only runs those actions. |

An environment that installs an application package needs that package installed: `@miroir-framework/cli` on an environment naming `miroir-example-library` loads the Library assets from it. The CLI itself does not depend on any application package.

## Connecting AI Agents

### Claude Desktop

(Content to be added)

### ChatGPT

(Content to be added)

### Other MCP Clients

(Content to be added)

## Use Cases

(Content to be added)

## Examples

(Content to be added)

## Best Practices

(Content to be added)

---

**Note**: Detailed MCP integration guide coming soon.
