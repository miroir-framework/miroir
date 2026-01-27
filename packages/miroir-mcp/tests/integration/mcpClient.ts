


import loglevelNextLog from 'loglevelnext';
import {
  defaultLevels,
  LoggerInterface,
  MiroirLoggerFactory,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type SpecificLoggerOptionsMap
} from "miroir-core";

const packageName = "miroir-mcp";
const fileName = "mcpClient";
  
const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
}

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  // context: undefined,
  specificLoggerOptions: specificLoggerOptions,
}

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", fileName)
).then((logger: LoggerInterface) => {
  log = logger;
});


// ################################################################################################
// HTTP MCP Client for testing via HTTP transport
// ################################################################################################

/**
 * Makes an MCP tool call via HTTP to a running MCP server
 * @param serverUrl - Base URL of the MCP server (e.g., 'http://localhost:3080')
 * @param toolName - Name of the tool to call
 * @param params - Tool parameters
 * @returns MCP response with content array
 */
export async function callMcpToolViaHttp(
  serverUrl: string,
  toolName: string,
  params: unknown
): Promise<{ content: Array<{ type: string; text: string, parsed: Record<string, any> }> }> {
  try {
    log.info(`callMcpToolViaHttp - calling tool: ${toolName} at ${serverUrl} with params:`, params);
    
    // First, establish SSE connection to get session
    const sseResponse = await fetch(`${serverUrl}/sse`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    if (!sseResponse.ok) {
      throw new Error(`Failed to establish SSE connection: ${sseResponse.statusText}`);
    }

    // Read the SSE stream to extract the session ID from the endpoint event
    // Use a timeout to avoid hanging forever
    const { sessionId, reader } = await Promise.race([
      readSessionIdFromSSE(sseResponse),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout reading session ID from SSE stream')), 5000)
      )
    ]);

    log.info(`Extracted session ID from SSE stream: ${sessionId}`);

    const requestId = Date.now();

    // Setup a promise to read the response from SSE stream
    const responsePromise = readJsonRpcResponseFromSSE(reader, requestId);

    // Now make the tool call via POST /message with sessionId as query parameter
    const messageResponse = await fetch(`${serverUrl}/message?sessionId=${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
        },
      }),
    });

    // POST response should be 202 Accepted, actual response comes via SSE
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`MCP server request failed: ${messageResponse.statusText} - ${errorText}`);
    }

    // Wait for the JSON-RPC response from SSE stream
    const response = await Promise.race([
      responsePromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for response from SSE stream')), 10000)
      )
    ]);
    
    log.info('Received JSON-RPC response:', JSON.stringify(response, null, 2));
    
    // Check for JSON-RPC error
    if (response.error) {
      throw new Error(`MCP tool call failed: ${JSON.stringify(response.error)}`);
    }

    // Parse the text content back to an object if it's JSON
    // The server stringifies the result, so we need to parse it back
    if (response.result?.content?.[0]?.type === 'text' && response.result.content[0].text) {
      try {
        const parsedContent = response.result.content[0].parsed??JSON.parse(response.result.content[0].text);
        log.info('Parsed content from text:', JSON.stringify(parsedContent, null, 2));
        
        // Replace the stringified text with the parsed object for easier handling
        response.result = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(parsedContent, null, 2),
              // Also add the parsed object for programmatic access
              parsed: parsedContent,
            }
          ]
        };
      } catch (e) {
        // If parsing fails, keep the original text
        log.info('Content is not JSON, keeping as text');
      }
    }

    // Cleanup: cancel the SSE reader now that we're done
    try {
      await reader.cancel();
    } catch (e) {
      // Ignore cleanup errors
      log.info('SSE reader cleanup error (can be ignored):', e);
    }

    // Return the result in the expected format
    return response.result;
  } catch (error) {
    log.error(`Error calling MCP tool via HTTP:`, error);
    throw error;
  }
}

/**
 * Helper function to read session ID from SSE stream
 * Works with node-fetch v3+ which uses Web Streams API
 * MCP SSE protocol sends: event: endpoint\ndata: /message?sessionId=...
 * Returns both the sessionId and the reader (kept alive for the session)
 */
async function readSessionIdFromSSE(response: any): Promise<{ sessionId: string; reader: any }> {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let isEndpointEvent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        throw new Error('SSE stream ended without providing sessionId');
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      log.info('Received SSE data, buffer length:', buffer.length);
      
      // Parse SSE format line by line
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this is the endpoint event
        if (trimmedLine === 'event: endpoint') {
          isEndpointEvent = true;
          log.info('Found endpoint event');
          continue;
        }
        
        // Look for data line after endpoint event
        if (isEndpointEvent && trimmedLine.startsWith('data: ')) {
          const dataContent = trimmedLine.substring(6);
          log.info('Endpoint data:', dataContent);
          
          // Extract sessionId from URL like: /message?sessionId=xxx
          const match = dataContent.match(/[?&]sessionId=([^&]+)/);
          if (match && match[1]) {
            const sessionId = match[1];
            log.info('Extracted sessionId from endpoint URL:', sessionId);
            
            // DON'T cancel the reader - keep the SSE connection alive
            // Return both sessionId and reader so caller can keep connection open
            return { sessionId, reader };
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`Error reading SSE stream: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to read JSON-RPC response from SSE stream
 * Waits for a message event with matching request ID
 */
async function readJsonRpcResponseFromSSE(reader: any, requestId: number): Promise<any> {
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        throw new Error('SSE stream ended before receiving response');
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE format line by line
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for event type
        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.substring(7);
          log.info('SSE event type:', currentEvent);
          continue;
        }
        
        // Look for data line with message event
        if (currentEvent === 'message' && trimmedLine.startsWith('data: ')) {
          const dataContent = trimmedLine.substring(6);
          log.info('Message data:', dataContent);
          
          try {
            const jsonRpcResponse = JSON.parse(dataContent);
            log.info('Parsed JSON-RPC response:', jsonRpcResponse);
            
            // Check if this response matches our request ID
            if (jsonRpcResponse.id === requestId) {
              return jsonRpcResponse;
            } else {
              log.warn(`Ignoring JSON-RPC response with unmatched ID: ${jsonRpcResponse.id}`);
            }
          } catch (e) {
            log.info('Failed to parse message data as JSON:', e);
          }
          
          currentEvent = null; // Reset for next message
        }
      }
    }
  } catch (error) {
    throw new Error(`Error reading JSON-RPC response from SSE: ${error instanceof Error ? error.message : String(error)}`);
  }
}
