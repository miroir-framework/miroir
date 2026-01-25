import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import type { ZodTypeAny } from "zod";

import {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  LocalCacheInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  StoreOrBundleAction,
  type Action2VoidReturnType,
  type InstanceAction,
  type MiroirConfigClient
} from "miroir-core";


import { loadMiroirMcpConfig } from "./config/configLoader.js";
import { MiroirMcpConfig } from "./config/configSchema.js";
import { setupMiroirPlatform } from "./startup/setup.js";
import { initializeStoreStartup } from "./startup/storeStartup.js";
import { allInstanceActionTools, CreateInstanceToolSchema, DeleteInstanceToolSchema, DeleteInstanceWithCascadeToolSchema, GetInstancesToolSchema, GetInstanceToolSchema, UpdateInstanceToolSchema } from "./tools/instanceActions.js";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;

export type ToolHandler = (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<{ content: Array<{ type: string; text: string }> }>

// Constants for InstanceEndpoint
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MIROIR_APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

/**
 * Base handler that wraps tool invocation with common logic:
 * - Parameter validation
 * - Action construction
 * - DomainController invocation
 * - Response formatting
 */
async function handleInstanceAction(
  toolName: string,
  params: unknown,
  schema: any,
  actionBuilder: (validatedParams: any) => InstanceAction,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    log.info(`${toolName} - received params:`, params);
    
    // Validate parameters
    const validatedParams = schema.parse(params);
    log.info(`${toolName} - validated params:`, validatedParams);

    // Build the action
    const action = actionBuilder(validatedParams);
    log.info(`${toolName} - constructed action:`, JSON.stringify(action, null, 2));

    // Execute via DomainController
    const result: Action2VoidReturnType = await domainController.handleAction(
      action,
      applicationDeploymentMap
    );

    log.info(`${toolName} - result:`, JSON.stringify(result, null, 2));

    // Format response for MCP
    if (result.status === "ok") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "success",
                action: toolName,
                result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      // Error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "error",
                action: toolName,
                error: {
                  type: "errorType" in result ? result.errorType : "unknown",
                  message: "errorMessage" in result ? result.errorMessage : "Action failed",
                  stack: "errorStack" in result ? result.errorStack : undefined,
                  context: "errorContext" in result ? result.errorContext : undefined,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  } catch (error) {
    log.error(`${toolName} - exception:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "error",
              action: toolName,
              error: {
                type: "validation_error",
                message: error instanceof Error ? error.message : String(error),
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
}

// ################################################################################################
// Tool to schema and action mapping
// ################################################################################################
const mcpRequestHandlers: Record<
  string,
  {
    schema: ZodTypeAny;
    actionEnvelope: {
      actionType: string;
      actionLabel: string;
      application: string;
      endpoint: string;
    };
    actionHandler: ToolHandler;
  }
> = {
  miroir_createInstance: {
    schema: CreateInstanceToolSchema,
    actionEnvelope: {
      actionType: "createInstance",
      actionLabel: "MCP: Create instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_createInstance", (p) => ({
      application: p.applicationUuid,
      applicationSection: p.applicationSection,
      objects: p.instances,
    })),
  },
  miroir_getInstance: {
    schema: GetInstanceToolSchema,
    actionEnvelope: {
      actionType: "getInstance",
      actionLabel: "MCP: Get instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_getInstance", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      parentUuid: p.parentUuid,
      uuid: p.uuid,
    })),
  },
  miroir_getInstances: {
    schema: GetInstancesToolSchema,
    actionEnvelope: {
      actionType: "getInstances",
      actionLabel: "MCP: Get instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_getInstances", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      parentUuid: p.parentUuid,
    })),
  },
  miroir_updateInstance: {
    schema: UpdateInstanceToolSchema,
    actionEnvelope: {
      actionType: "updateInstance",
      actionLabel: "MCP: Update instances",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_updateInstance", (p) => ({
      application: p.application,
      applicationSection: p.applicationSection,
      objects: p.instances,
    })),
  },
  miroir_deleteInstance: {
    schema: DeleteInstanceToolSchema,
    actionEnvelope: {
      actionType: "deleteInstance",
      actionLabel: "MCP: Delete instance",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_deleteInstance", (p) => ({
      application: p.applicationUuid,
      applicationSection: p.applicationSection,
      objects: [
        {
          parentName: p.parentName,
          parentUuid: p.parentUuid,
          applicationSection: p.applicationSection,
          instances: [{ uuid: p.uuid, parentUuid: p.parentUuid }],
        },
      ],
    })),
  },
  miroir_deleteInstanceWithCascade: {
    schema: DeleteInstanceWithCascadeToolSchema,
    actionEnvelope: {
      actionType: "deleteInstanceWithCascade",
      actionLabel: "MCP: Delete instance with cascade",
      application: MIROIR_APP_UUID,
      endpoint: INSTANCE_ENDPOINT_UUID,
    },
    actionHandler: createHandler("miroir_deleteInstanceWithCascade", (p) => ({
      application: p.applicationUuid,
      applicationSection: p.applicationSection,
      objects: [
        {
          parentName: p.parentName,
          parentUuid: p.parentUuid,
          applicationSection: p.applicationSection,
          instances: [{ uuid: p.uuid, parentUuid: p.parentUuid }],
        },
      ],
    })),
  },
  // miroir_loadNewInstancesInLocalCache: {
  //   schema: LoadNewInstancesInLocalCacheToolSchema,
  //   actionEnvelope: {
  //     actionType: "loadNewInstancesInLocalCache",
  //     actionLabel: "MCP: Load new instances in local cache",
  //     application: MIROIR_APP_UUID,
  //     endpoint: INSTANCE_ENDPOINT_UUID,
  //   },
  //   actionHandler: createHandler("miroir_loadNewInstancesInLocalCache", (p) => ({
  //     application: p.applicationUuid,
  //     applicationSection: p.applicationSection,
  //     objects: p.instances,
  //   })),
  // },
};

  // ################################################################################################
// Generic handler factory
// ################################################################################################
/**
 * Creates a handler function for a given tool name with custom payload building logic
 */
export function createHandler(
  toolName: string,
  payloadBuilder: (validatedParams: any) => any
): (
  params: unknown,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap
) => Promise<{ content: Array<{ type: string; text: string }> }> {
  return async (
    params: unknown,
    domainController: DomainControllerInterface,
    applicationDeploymentMap: ApplicationDeploymentMap
  ) => {
    const config = mcpRequestHandlers[toolName];
    return handleInstanceAction(
      toolName,
      params,
      config.schema,
      (p) =>
        ({
          ...config.actionEnvelope,
          payload: payloadBuilder(p),
        }) as InstanceAction,
      domainController,
      applicationDeploymentMap,
    );
  };
}

// ################################################################################################
/**
 * MCP Server for Miroir Framework
 * Exposes InstanceEndpoint actions as MCP tools
 */
export class MiroirMcpServer {
  private server: Server;
  private config: MiroirMcpConfig; // TODO: should be identical to MiroirConfigClient
  private domainController!: DomainControllerInterface;
  private localCache!: LocalCacheInterface;
  private miroirContext!: MiroirContextInterface;
  private persistenceStoreControllerManager!: PersistenceStoreControllerManagerInterface;
  private applicationDeploymentMap!: ApplicationDeploymentMap;
  private httpServer?: any;
  private port: number = 3080;
  private sessions: Map<string, { server: Server; transport: SSEServerTransport }> = new Map();
  private isShuttingDown: boolean = false;

  // Additional components for emulated server mode (test mode)
  // private persistenceStoreControllerManagerForServer?: PersistenceStoreControllerManagerInterface;
  // private domainControllerForServer?: DomainControllerInterface;
  // private restClient?: RestClientInterface;

  constructor() {
    this.server = new Server(
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

    // Load configuration
    this.config = loadMiroirMcpConfig();

    // Setup request handlers
    this.setupHandlers();
  }

  // ##############################################################################################
  /**
   * Initialize Miroir framework and domain controller
   */
  async initialize(): Promise<void> {
    try {
      log.info("Initializing Miroir MCP Server...");

      // Initialize Miroir core
      miroirCoreStartup();

      // Initialize store backends based on configuration
      await initializeStoreStartup(this.config);

      // // Setup MiroirContext
      const miroirActivityTracker = new MiroirActivityTracker();
      if (!miroirActivityTracker) {
        throw new Error("MiroirActivityTracker initialization failed");
      }
      const miroirEventService = new MiroirEventService(miroirActivityTracker);

      const {
        persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
        domainController: localdomainController,
        // localCache: locallocalCache,
        miroirContext: localmiroirContext,
      } = await setupMiroirPlatform(
        this.config as any as MiroirConfigClient,
        miroirActivityTracker,
        miroirEventService,
      );

      this.domainController = localdomainController;
      this.miroirContext = localmiroirContext;
      this.persistenceStoreControllerManager = localpersistenceStoreControllerManager;
      // Setup logging
      await this.setupLogging();

      this.localCache = this.domainController.getLocalCache();
      this.applicationDeploymentMap = this.config.client.applicationDeploymentMap;

      // Open stores for all configured deployments
      await this.openStores();

      log.info("Miroir MCP Server initialized successfully");
    } catch (error) {
      log.error("Failed to initialize Miroir MCP Server:", error);
      throw error;
    }
  }

  // ##############################################################################################
  /**
   * Setup MiroirLoggerFactory with configuration
   */
  private async setupLogging(): Promise<void> {
    const loglevel = (await import("loglevelnext")).default;
    const loglevelnext = loglevel as any as LoggerFactoryInterface;

    const logConfig: LoggerOptions = (this.config.client.logConfig || {
      defaultLevel: "INFO",
      defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
      specificLoggerOptions: {},
    }) as LoggerOptions;

    // Register logger for this module
    MiroirLoggerFactory.registerLoggerToStart(
      MiroirLoggerFactory.getLoggerName(packageName, "info", "mcpServer"),
    ).then((logger: LoggerInterface) => {
      log = logger;
    });

    // Start all registered loggers
    MiroirLoggerFactory.startRegisteredLoggers(
      this.miroirContext.miroirActivityTracker as MiroirActivityTracker,
      this.miroirContext.miroirEventService,
      loglevelnext,
      logConfig,
    );

    log.info("Logging initialized");
  }

  // ##############################################################################################
  /**
   * Open stores for all configured deployments
   */
  private async openStores(): Promise<void> {
    for (const [deploymentUuid, storeConfig] of Object.entries(
      this.config.client.deploymentStorageConfig,
    )) {
      log.info(`Opening stores for deployment ${deploymentUuid}`);

      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        actionLabel: `Open stores for ${deploymentUuid}`,
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application:
            Object.keys(this.applicationDeploymentMap).find(
              (appUuid) => this.applicationDeploymentMap[appUuid] === deploymentUuid,
            ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          deploymentUuid: deploymentUuid,
          configuration: {
            [deploymentUuid]: storeConfig,
          },
        },
      };

      const result = await this.domainController.handleAction(
        openStoreAction,
        this.applicationDeploymentMap,
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
  private setupHandlersForServer(server: Server): void {
    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("Received list_tools request");
      return {
        tools: allInstanceActionTools,
      };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      log.info(`Received call_tool request: ${request.params.name}`);

      const { name, arguments: args } = request.params;

      try {
        if (!(name in mcpRequestHandlers)) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "error",
                  error: {
                    type: "unknown_tool",
                    message: `Unknown tool: ${name}`,
                  },
                }),
              },
            ],
          };
        }
        return await mcpRequestHandlers[name].actionHandler(
          args,
          this.domainController,
          this.applicationDeploymentMap,
        );
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

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    this.setupHandlersForServer(this.server);
  }
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  /**
   * Start the MCP server with HTTP transport
   */
  async run(): Promise<void> {
    const app = express();
    app.use(express.json());

    // SSE endpoint for MCP protocol - establishes the event stream
    app.get("/sse", async (req, res) => {
      log.info("New SSE connection request");

      // Set headers to keep the connection alive
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Create a new Server instance for this connection
      const clientServer = new Server(
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

      // Setup handlers for this client server (same as main server)
      this.setupHandlersForServer(clientServer);

      // Create transport for this session
      const transport = new SSEServerTransport("/message", res);

      // Connect will call transport.start() which sends the endpoint event with sessionId
      await clientServer.connect(transport);

      // Extract the session ID that was generated by the transport
      const sessionId = (transport as any)._sessionId;

      log.info(`Session ID extracted from transport: ${sessionId}, type: ${typeof sessionId}`);

      // Store both server and transport for this session
      this.sessions.set(sessionId, { server: clientServer, transport });

      log.info(
        `SSE connection established with session ${sessionId}, total sessions: ${this.sessions.size}`,
      );

      // Send periodic heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        res.write(`event: ping\ndata: heartbeat\n\n`);
      }, 25000); // Send heartbeat every 25 seconds

      // Clean up when connection closes
      req.on("close", () => {
        clearInterval(heartbeatInterval); // Clear the heartbeat interval
        this.sessions.delete(sessionId);
        log.info(
          `SSE connection closed for session ${sessionId}, ${this.sessions.size} sessions remaining`,
        );
      });
    });

    // POST endpoint for receiving messages from client
    app.post("/message", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      log.info(
        `Received message on /message endpoint for session ${sessionId}, type: ${typeof sessionId}`,
      );
      log.info(`Available sessions: ${Array.from(this.sessions.keys()).join(", ")}`);

      if (!sessionId) {
        log.error("No sessionId provided in POST request");
        res.status(400).send("Missing sessionId");
        return;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        log.error(`No session found for sessionId ${sessionId}`);
        log.error(`All sessions: ${JSON.stringify(Array.from(this.sessions.keys()))}`);
        res.status(404).send("Session not found");
        return;
      }

      // Let the transport handle the POST message
      try {
        await session.transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        log.error(`Error handling POST message:`, error);
        if (!res.headersSent) {
          res.status(500).send("Internal server error");
        }
      }
    });

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({ status: "ok", name: "miroir-mcp-server", version: "1.0.0" });
    });

    this.httpServer = app.listen(this.port, () => {
      log.info(`Miroir MCP Server running on http://localhost:${this.port}`);
      log.info(`SSE endpoint: http://localhost:${this.port}/sse`);
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

    // Close all MCP sessions
    log.info(`Closing ${this.sessions.size} active sessions...`);
    for (const [sessionId, session] of this.sessions.entries()) {
      try {
        await session.server.close();
        log.info(`Closed session ${sessionId}`);
      } catch (error) {
        log.error(`Error closing session ${sessionId}:`, error);
      }
    }
    this.sessions.clear();

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
}

/**
 * Factory function to create and start MCP server
 */
export async function startMcpServer(): Promise<MiroirMcpServer> {
  const server = new MiroirMcpServer();
  await server.initialize();
  await server.run();

  // Signal handling for graceful shutdown
  let shutdownInProgress = false;
  const shutdownHandler = async (signal: string) => {
    if (shutdownInProgress) {
      log.info(`Shutdown already in progress, ignoring ${signal}`);
      return;
    }
    shutdownInProgress = true;
    
    log.info(`[miroir-mcp] Received ${signal}, shutting down...`);
    
    // Remove signal handlers to prevent re-entry
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    
    try {
      await server.shutdown();
      log.info("Shutdown complete. Exiting process.");
      process.exit(0);
    } catch (err) {
      log.error("Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdownHandler("SIGINT"));
  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  process.on("uncaughtException", async (err) => {
    log.error("Uncaught exception:", err);
    await shutdownHandler("uncaughtException");
  });

  return server;
}
