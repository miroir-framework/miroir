

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import loglevelNextLog from 'loglevelnext';
import {
  defaultLevels,
  LoggerInterface,
  MiroirLoggerFactory,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type SpecificLoggerOptionsMap
} from "miroir-core";

import { MCP_HTTP_ENDPOINT } from "../../src/mcpServer.js";

const packageName = "miroir-mcp";
const fileName = "mcpClient";
  
const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: specificLoggerOptions,
}

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});


// ################################################################################################
// HTTP MCP Client for testing via stateless Streamable HTTP transport
// ################################################################################################

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
): Promise<T> {
  const client = new Client({
    name: "miroir-mcp-test-client",
    version: "1.0.0",
  });
  const transport = new StreamableHTTPClientTransport(mcpEndpointUrl(serverUrl));

  await client.connect(transport);
  try {
    return await operation(client);
  } finally {
    await transport.close();
  }
}

function withParsedToolContent(
  result: { content?: Array<{ type: string; text?: string }> },
): { content: Array<{ type: string; text: string; parsed: Record<string, unknown> }> } {
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

/**
 * Sends a JSON-RPC request to a running MCP server over stateless Streamable HTTP.
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:4080')
 * @param method - JSON-RPC method (e.g., 'tools/call', 'tools/list')
 * @param params - Method parameters
 * @returns The JSON-RPC result
 */
export async function sendMcpRequestViaHttp(
  serverUrl: string,
  method: string,
  params: unknown,
): Promise<any> {
  log.info(`sendMcpRequestViaHttp - ${method} at ${serverUrl} with params:`, params);

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
    throw new Error(`Unsupported MCP method for test client: ${method}`);
  });
}

/**
 * Makes an MCP tool call via HTTP to a running MCP server
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:4080')
 * @param toolName - Name of the tool to call
 * @param params - Tool parameters
 * @returns MCP response with content array
 */
export async function callMcpToolViaHttp(
  serverUrl: string,
  toolName: string,
  params: unknown
): Promise<{ content: Array<{ type: string; text: string, parsed: Record<string, any> }> }> {
  const result = await sendMcpRequestViaHttp(serverUrl, 'tools/call', { name: toolName, arguments: params });
  return withParsedToolContent(result);
}

/**
 * Lists the tools of a running MCP server via HTTP
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:4080')
 * @returns Array of MCP tool descriptions
 */
export async function listMcpToolsViaHttp(
  serverUrl: string,
): Promise<Array<{ name: string; description?: string; inputSchema: unknown }>> {
  const result = await sendMcpRequestViaHttp(serverUrl, 'tools/list', {});
  return result?.tools ?? [];
}
