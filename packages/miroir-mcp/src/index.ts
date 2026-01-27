#!/usr/bin/env node
/**
 * Miroir MCP Server - Entry Point
 * 
 * Exposes Miroir Framework's InstanceEndpoint actions as MCP tools
 * Runs as stdio transport server for integration with MCP clients
 */

import express, { Express } from "express";
import {
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  type MiroirConfigClient,
} from "miroir-core";
import { loadMiroirMcpConfig } from "./config/configLoader.js";
import { MiroirMcpServer, openStores, setupLogging, setupMcpServer } from "./mcpServer.js";
import { setupMiroirPlatform } from "./startup/setup.js";
import { initializeStoreStartup } from "./startup/storeStartup.js";
import { mcpRequestHandlers } from "./tools/handlersForEndpoint.js";

const PORT = 3080;
let server: MiroirMcpServer | null = null;

/**
 * Main entry point
 */
async function main() {
  try {
    console.error("[miroir-mcp] Starting Miroir MCP Server...");

    // Initialize Miroir core
    miroirCoreStartup();

    const app:Express = express();
  
    const config = loadMiroirMcpConfig();

    const miroirActivityTracker = new MiroirActivityTracker();
    if (!miroirActivityTracker) {
      throw new Error("MiroirActivityTracker initialization failed");
    }
    const miroirEventService = new MiroirEventService(miroirActivityTracker);

    const {
      persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      miroirContext: localmiroirContext,
    } = await setupMiroirPlatform(
      config as any as MiroirConfigClient,
      miroirActivityTracker,
      miroirEventService,
    );

    // Initialize store backends based on configuration
    await initializeStoreStartup(config);
  
    await setupLogging(config, localmiroirContext);
  
    // Open stores for all configured deployments
    await openStores(
      config,
      localdomainController,
      config.client.applicationDeploymentMap,
    );
  
    server = await setupMcpServer(
      app,
      config.client.applicationDeploymentMap,
      mcpRequestHandlers,
      localdomainController,
      // localmiroirContext,
    );
    
    await server.run(PORT);

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
console.warn("[miroir-mcp] Miroir MCP is in library mode, not starting server automatically...");
// main();

// Export for programmatic use
export * from "./config/configLoader.js";
export * from "./config/configSchema.js";
export { mcpRequestHandlers, MiroirMcpServer, setupMcpServer };

