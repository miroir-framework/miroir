#!/usr/bin/env node
/**
 * Miroir MCP Server - Entry Point
 * 
 * Exposes Miroir Framework's InstanceEndpoint actions as MCP tools
 * Runs as stdio transport server for integration with MCP clients
 */

import { startMcpServer, MiroirMcpServer } from "./mcpServer.js";

let server: MiroirMcpServer | null = null;

/**
 * Main entry point
 */
async function main() {
  try {
    console.error("[miroir-mcp] Starting Miroir MCP Server...");
    
    server = await startMcpServer();
    
    console.error("[miroir-mcp] Server started successfully");
  } catch (error) {
    console.error("[miroir-mcp] Failed to start server:", error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
async function shutdown(signal: string) {
  console.error(`[miroir-mcp] Received ${signal}, shutting down...`);
  
  if (server) {
    try {
      await server.shutdown();
    } catch (error) {
      console.error("[miroir-mcp] Error during shutdown:", error);
    }
  }
  
  process.exit(0);
}

// Register signal handlers
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("[miroir-mcp] Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[miroir-mcp] Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
main();

// Export for programmatic use
export { startMcpServer, MiroirMcpServer };
export * from "./config/configSchema.js";
export * from "./config/configLoader.js";
export * from "./tools/instanceActions.js";
