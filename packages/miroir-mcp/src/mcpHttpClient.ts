import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
  type StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { MCP_HTTP_ENDPOINT } from "./mcpConstants.js";

export type McpHttpFetch = NonNullable<StreamableHTTPClientTransportOptions["fetch"]>;

function mcpEndpointUrl(serverUrl: string): URL {
  const trimmed = serverUrl.replace(/\/$/, "");
  if (trimmed.endsWith(MCP_HTTP_ENDPOINT)) {
    return new URL(trimmed);
  }
  return new URL(`${trimmed}${MCP_HTTP_ENDPOINT}`);
}

async function withMcpClient<T>(
  serverUrl: string,
  operation: (client: Client) => Promise<T>,
  fetchImpl?: McpHttpFetch,
): Promise<T> {
  const client = new Client({
    name: "miroir-mcp-client",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(
    mcpEndpointUrl(serverUrl),
    fetchImpl ? { fetch: fetchImpl } : undefined,
  );
  await client.connect(transport);
  try {
    return await operation(client);
  } finally {
    await transport.close();
  }
}

function withParsedToolContent(result: {
  content?: Array<{ type: string; text?: string }>;
}): { content: Array<{ type: string; text: string; parsed: Record<string, unknown> }> } {
  const content = (result.content ?? []).map((entry) => {
    const text = entry.text ?? "";
    let parsed: Record<string, unknown> = {};
    if (entry.type === "text" && text) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = { text };
      }
    }
    return {
      type: entry.type,
      text,
      parsed,
    };
  });
  return { content };
}

export async function sendMcpRequestViaHttp(
  serverUrl: string,
  method: string,
  params: unknown,
  fetchImpl?: McpHttpFetch,
): Promise<unknown> {
  return withMcpClient(serverUrl, async (client) => {
    if (method === "tools/list") {
      return client.listTools();
    }
    if (method === "tools/call") {
      const { name, arguments: args } = params as {
        name: string;
        arguments: Record<string, unknown>;
      };
      return client.callTool({ name, arguments: args });
    }
    throw new Error(`Unsupported MCP method: ${method}`);
  }, fetchImpl);
}

export async function callMcpToolViaHttp(
  serverUrl: string,
  toolName: string,
  params: unknown,
  fetchImpl?: McpHttpFetch,
): Promise<{ content: Array<{ type: string; text: string; parsed: Record<string, unknown> }> }> {
  const result = await sendMcpRequestViaHttp(
    serverUrl,
    "tools/call",
    {
      name: toolName,
      arguments: params,
    },
    fetchImpl,
  );
  return withParsedToolContent(result as { content?: Array<{ type: string; text?: string }> });
}

export async function listMcpToolsViaHttp(
  serverUrl: string,
  fetchImpl?: McpHttpFetch,
): Promise<Array<{ name: string; description?: string; inputSchema: unknown }>> {
  const result = (await sendMcpRequestViaHttp(serverUrl, "tools/list", {}, fetchImpl)) as {
    tools?: Array<{ name: string; description?: string; inputSchema: unknown }>;
  };
  return result?.tools ?? [];
}
