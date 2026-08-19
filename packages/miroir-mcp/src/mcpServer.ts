import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Express } from "express";
import * as logger from 'loglevelnext';

import {
  ApplicationDeploymentMap,
  defaultMetaModelEnvironment,
  DomainControllerInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContextInterface,
  MiroirLoggerFactory,
  StoreOrBundleAction
} from "miroir-core";


import { MiroirMcpConfig } from "./config/configSchema.js";
import { type EndpointToolRegistry } from "./tools/EndpointToolRegistry.js";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;

/** ModelEndpoint uuid — rollback reloads persisted model/data into the local cache. */
const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";

/** Stateless Streamable HTTP MCP endpoint path. */
export const MCP_HTTP_ENDPOINT = "/mcp";

/**
 * openStore wires persistence backends but does not populate instance rows (including
 * Endpoint definitions) into the local cache. Roll back each deployed application so
 * currentModel().endpoints is available to the MCP tool registry.
 */
export async function refreshLocalCachesForDeployedApplications(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<void> {
  for (const applicationUuid of Object.keys(applicationDeploymentMap).sort()) {
    const result = await domainController.handleAction(
      {
        actionType: "rollback",
        actionLabel: `Load persisted state into local cache (${applicationUuid})`,
        endpoint: MODEL_ENDPOINT_UUID,
        payload: {
          application: applicationUuid,
        },
      },
      applicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
    if (result.status !== "ok") {
      log.warn(
        `refreshLocalCachesForDeployedApplications: rollback failed for ${applicationUuid}: ${JSON.stringify(result)}`,
      );
    }
  }
}

async function logAvailableMcpTools(
  endpointToolRegistry: EndpointToolRegistry,
  reason: "initial" | "updated",
): Promise<void> {
  try {
    const tools = await endpointToolRegistry.listTools();
    const toolNames = tools.map((tool) => tool.name).sort();
    log.info(
      `MCP tools ${reason} (${toolNames.length}): ${toolNames.join(", ") || "(none)"}`,
    );
  } catch (error) {
    log.error(`Failed to list MCP tools (${reason}):`, error);
  }
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * MCP Server for Miroir Framework
 * Exposes InstanceEndpoint actions as MCP tools
 */
export class MiroirMcpServer {
  private httpServer?: any;
  private isShuttingDown: boolean = false;

  constructor(
    private app: Express,
    private applicationDeploymentMap: ApplicationDeploymentMap,
    private domainController: DomainControllerInterface,
    private endpointToolRegistry: EndpointToolRegistry,
  ) {}

  // ##############################################################################################
  /**
   * One MCP Protocol Server per HTTP request: the SDK's Protocol instance supports a
   * single transport at a time ("Already connected to a transport" otherwise).
   */
  private createMcpServer(): Server {
    const mcpServer = new Server(
      {
        name: "miroir-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    setupHandlersForServer(
      mcpServer,
      this.endpointToolRegistry,
      this.domainController,
      this.applicationDeploymentMap,
    );

    return mcpServer;
  }

  // ##############################################################################################
  /**
   * Setup Express routes for MCP server
   */
  async setup(): Promise<void> {
    this.app.use(express.json());

    await refreshLocalCachesForDeployedApplications(
      this.domainController,
      this.applicationDeploymentMap,
    );

    // Log when the tool surface changes. Stateless MCP has no persistent session to push
    // notifications to — clients re-fetch tools/list when needed.
    this.endpointToolRegistry.start(() => {
      void logAvailableMcpTools(this.endpointToolRegistry, "updated");
      log.debug(
        "Tool surface changed; stateless MCP clients should re-fetch tools/list",
      );
    });
    await logAvailableMcpTools(this.endpointToolRegistry, "initial");

    this.app.post(MCP_HTTP_ENDPOINT, async (req, res) => {
      log.info(`Received POST request on ${MCP_HTTP_ENDPOINT}`);

      const mcpServer = this.createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      try {
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);

        res.on("close", () => {
          transport.close().catch((error) => {
            log.debug(`closing MCP transport: ${error}`);
          });
          mcpServer.close().catch((error) => {
            log.debug(`closing MCP server: ${error}`);
          });
        });
      } catch (error) {
        log.error(`Error handling MCP request on ${MCP_HTTP_ENDPOINT}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    this.app.get(MCP_HTTP_ENDPOINT, (_req, res) => {
      res.status(405).set("Allow", "POST").json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      });
    });

    this.app.delete(MCP_HTTP_ENDPOINT, (_req, res) => {
      res.status(405).set("Allow", "POST").json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      });
    });

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "ok", name: "miroir-mcp-server", version: "1.0.0" });
    });
  }
  // ##############################################################################################
  /**
   * Start the MCP server with HTTP transport
   */
  async run(port: number): Promise<void> {
    this.httpServer = this.app.listen(port, () => {
      log.info(`Miroir MCP Server running on http://localhost:${port}`);
      log.info(`MCP endpoint: http://localhost:${port}${MCP_HTTP_ENDPOINT}`);
    });
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      log.info("Shutdown already in progress, ignoring...");
      return;
    }

    this.isShuttingDown = true;
    log.info("Shutting down Miroir MCP Server...");

    this.endpointToolRegistry.stop();

    // Close HTTP server
    if (this.httpServer) {
      log.info("Closing HTTP server...");
      await new Promise<void>((resolve, reject) => {
        this.httpServer.close((err: any) => {
          if (err) {
            log.error("Error closing HTTP server:", err);
            reject(err);
          } else {
            log.info("HTTP server closed");
            resolve();
          }
        });
      });
    }

    // // Close all stores
    // for (const deploymentUuid of Object.keys(this.config.client.deploymentStorageConfig)) {
    //   const closeStoreAction: StoreOrBundleAction = {
    //     actionType: "storeManagementAction_closeStore",
    //     actionLabel: `Close stores for ${deploymentUuid}`,
    //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    //     endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    //     payload: {
    //       application: Object.keys(this.applicationDeploymentMap).find(
    //         (appUuid) => this.applicationDeploymentMap[appUuid] === deploymentUuid
    //       ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    //     },
    //   };

    //   await this.domainController.handleAction(
    //     closeStoreAction,
    //     this.applicationDeploymentMap
    //   );
    // }

    // log.info("All stores closed successfully");
  }
} // End of MiroirMcpServer class

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
  // ##############################################################################################
  /**
   * Setup MiroirLoggerFactory with configuration
   */
  export async function setupLogging(
    config: MiroirMcpConfig,
    miroirContext: MiroirContextInterface,
  ): Promise<void> {
    const loglevel = logger.default;
    const loglevelnext = loglevel as any as LoggerFactoryInterface;

    const logConfig: LoggerOptions = (config.client.logConfig || {
      defaultLevel: "INFO",
      defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
      specificLoggerOptions: {},
    }) as LoggerOptions;

    // Register logger for this module
    const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "mcpServer");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
    ).then((logger: LoggerInterface) => {
      log = logger;
    });

    // Start all registered loggers
    MiroirLoggerFactory.startRegisteredLoggers(
      miroirContext.miroirActivityTracker as MiroirActivityTracker,
      miroirContext.miroirEventService,
      loglevelnext,
      logConfig,
    );

    log.info("Logging initialized");
  }

  // ##############################################################################################
  // ##############################################################################################
  /**
   * Open stores for all configured deployments
   */
  export async function openStores(
    config: MiroirMcpConfig,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<void> {
    for (const [deploymentUuid, storeConfig] of Object.entries(
      config.client.deploymentStorageConfig,
    )) {
      log.info(`Opening stores for deployment ${deploymentUuid}`);

      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        actionLabel: `Open stores for ${deploymentUuid}`,
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application:
            Object.keys(applicationDeploymentMap).find(
              (appUuid) => applicationDeploymentMap[appUuid] === deploymentUuid,
            ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          deploymentUuid: deploymentUuid,
          configuration: {
            [deploymentUuid]: storeConfig,
          },
        },
      };

      const result = await domainController.handleAction(
        openStoreAction,
        applicationDeploymentMap,
      );

      if (result.status !== "ok") {
        throw new Error(
          `Failed to open stores for deployment ${deploymentUuid}: ${JSON.stringify(result)}`,
        );
      }

      log.info(`Successfully opened all stores for deployment ${deploymentUuid}`);
    }
  }
  // ##############################################################################################
  /**
   * Setup MCP request handlers for a server instance
   */
  export function setupHandlersForServer(
    server: Server,
    endpointToolRegistry: EndpointToolRegistry,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): void {
    // List available tools: computed live from the registry on each request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("ListToolRequest Received list_tools request");
      return {
        tools: await endpointToolRegistry.listTools(),
      };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      log.info(`Received call_tool request: ${request.params.name}
      with contents: ${JSON.stringify(request.params)}`);

      const { name, arguments: args } = request.params;

      try {
        return await endpointToolRegistry.callTool(name, args);
      } catch (error) {
        log.error(`Error handling tool call ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "error",
                error: {
                  type: "internal_error",
                  message: error instanceof Error ? error.message : String(error),
                },
              }),
            },
          ],
        };
      }
    });
  }
  // ##############################################################################################
/**
 * Factory function to create and start MCP server
 */
export async function setupMcpServer(
  app: Express,
  applicationDeploymentMap: ApplicationDeploymentMap,
  endpointToolRegistry: EndpointToolRegistry,
  domainController: DomainControllerInterface,
): Promise<MiroirMcpServer> {

  const server = new MiroirMcpServer(app, applicationDeploymentMap, domainController, endpointToolRegistry);

  await server.setup();

  // NOTE: no process-level signal / exception handlers are registered here: they are the
  // responsibility of the entrypoint (src/index.ts). Registering them here would also
  // hook process.exit into any process embedding the server (e.g. integration tests).

  return server;
}
