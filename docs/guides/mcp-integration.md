# Model Context Protocol (MCP) Integration

> ⚠️⚠️⚠️ This document is a placeholder and needs to be completed.

## Overview

Miroir includes native support for the Model Context Protocol (MCP), enabling AI agents and LLMs to interact with your applications.

MCP is off unless the **persistence-side** config sets `features.mcp: true` and you restart that process. Missing `mcp` is false. How to set or unset the flag, and what it mounts: [Process capabilities](../reference/process-capabilities.md).

Shipped `miroir-server` defaults (`packages/miroir-server/config/miroirConfig.server.json`) turn MCP on. The HTTP app then mounts `/mcp`, and `server.mcpUrl` (default `https://localhost:4080`) starts the dedicated MCP listener. Electron main does the same when its hardcoded `features.mcp` is true, on loopback HTTP. The sandbox page leaves MCP off unless you set the flag there.

## What is MCP?

(Content to be added)

## Miroir MCP Server

(Content to be added)

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
