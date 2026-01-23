import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  ConfigurationService,
  DomainControllerInterface,
  LocalCacheInterface,
  LoggerInterface,
  LoggerFactoryInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContext,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  PersistenceStoreControllerManagerInterface,
  ApplicationDeploymentMap,
  StoreOrBundleAction,
  StoreUnitConfiguration,
} from "miroir-core";

import { setupMiroirDomainController } from "miroir-localcache-redux";

import { MiroirMcpConfig } from "./config/configSchema.js";
import { loadMiroirMcpConfig } from "./config/configLoader.js";
import { initializeStoreStartup } from "./startup/storeStartup.js";
import { allInstanceActionTools } from "./tools/instanceActions.js";
import {
  handleCreateInstance,
  handleGetInstance,
  handleGetInstances,
  handleUpdateInstance,
  handleDeleteInstance,
  handleDeleteInstanceWithCascade,
  handleLoadNewInstancesInLocalCache,
} from "./tools/toolHandlers.js";

const packageName = "miroir-mcp";
let log: LoggerInterface = console as any as LoggerInterface;

/**
 * MCP Server for Miroir Framework
 * Exposes InstanceEndpoint actions as MCP tools
 */
export class MiroirMcpServer {
  private server: Server;
  private config: MiroirMcpConfig;
  private domainController!: DomainControllerInterface;
  private localCache!: LocalCacheInterface;
  private miroirContext!: MiroirContextInterface;
  private persistenceStoreControllerManager!: PersistenceStoreControllerManagerInterface;
  private applicationDeploymentMap!: ApplicationDeploymentMap;

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
      }
    );

    // Load configuration
    this.config = loadMiroirMcpConfig();

    // Setup request handlers
    this.setupHandlers();
  }

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

      // Setup logging
      await this.setupLogging();

      // Setup MiroirContext
      const miroirActivityTracker = new MiroirActivityTracker();
      const miroirEventService = new MiroirEventService(miroirActivityTracker);

      this.miroirContext = new MiroirContext(
        miroirActivityTracker,
        miroirEventService,
        { miroirConfigType: "server" } as any
      );

      // Setup persistence store controller manager
      this.persistenceStoreControllerManager = new PersistenceStoreControllerManager(
        ConfigurationService.adminStoreFactoryRegister,
        ConfigurationService.StoreSectionFactoryRegister
      );

      // Setup domain controller
      this.domainController = await setupMiroirDomainController(this.miroirContext, {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: this.persistenceStoreControllerManager,
      });

      this.localCache = this.domainController.getLocalCache();
      this.applicationDeploymentMap = this.config.applicationDeploymentMap;

      // Open stores for all configured deployments
      await this.openStores();

      log.info("Miroir MCP Server initialized successfully");
    } catch (error) {
      log.error("Failed to initialize Miroir MCP Server:", error);
      throw error;
    }
  }

  /**
   * Setup MiroirLoggerFactory with configuration
   */
  private async setupLogging(): Promise<void> {
    const loglevel = (await import("loglevelnext")).default;
    const loglevelnext = loglevel as any as LoggerFactoryInterface;

    const logConfig: LoggerOptions = (this.config.logConfig || {
      defaultLevel: "INFO",
      defaultTemplate: "[{{time}}] {{level}} {{name}} ### ",
      specificLoggerOptions: {},
    }) as LoggerOptions;

    // Register logger for this module
    MiroirLoggerFactory.registerLoggerToStart(
      MiroirLoggerFactory.getLoggerName(packageName, "info", "mcpServer")
    ).then((logger: LoggerInterface) => {
      log = logger;
    });

    // Start all registered loggers
    MiroirLoggerFactory.startRegisteredLoggers(
      this.miroirContext.miroirActivityTracker as MiroirActivityTracker,
      this.miroirContext.miroirEventService,
      loglevelnext,
      logConfig
    );

    log.info("Logging initialized");
  }

  /**
   * Open stores for all configured deployments
   */
  private async openStores(): Promise<void> {
    for (const [deploymentUuid, storeConfig] of Object.entries(
      this.config.storeSectionConfiguration
    )) {
      log.info(`Opening stores for deployment ${deploymentUuid}`);

      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        actionLabel: `Open stores for ${deploymentUuid}`,
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: Object.keys(this.applicationDeploymentMap).find(
            (appUuid) => this.applicationDeploymentMap[appUuid] === deploymentUuid
          ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          deploymentUuid: deploymentUuid,
          configuration: {
            [deploymentUuid]: storeConfig,
          },
        },
      };

      const result = await this.domainController.handleAction(
        openStoreAction,
        this.applicationDeploymentMap
      );

      if (result.status !== "ok") {
        throw new Error(
          `Failed to open stores for deployment ${deploymentUuid}: ${JSON.stringify(result)}`
        );
      }

      log.info(`Successfully opened all stores for deployment ${deploymentUuid}`);
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("Received list_tools request");
      return {
        tools: allInstanceActionTools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      log.info(`Received call_tool request: ${request.params.name}`);

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "miroir_createInstance":
            return await handleCreateInstance(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_getInstance":
            return await handleGetInstance(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_getInstances":
            return await handleGetInstances(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_updateInstance":
            return await handleUpdateInstance(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_deleteInstance":
            return await handleDeleteInstance(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_deleteInstanceWithCascade":
            return await handleDeleteInstanceWithCascade(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          case "miroir_loadNewInstancesInLocalCache":
            return await handleLoadNewInstancesInLocalCache(
              args,
              this.domainController,
              this.applicationDeploymentMap
            );

          default:
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
   * Start the MCP server with stdio transport
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info("Miroir MCP Server running on stdio");
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    log.info("Shutting down Miroir MCP Server...");

    // Close all stores
    for (const deploymentUuid of Object.keys(this.config.storeSectionConfiguration)) {
      const closeStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_closeStore",
        actionLabel: `Close stores for ${deploymentUuid}`,
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: Object.keys(this.applicationDeploymentMap).find(
            (appUuid) => this.applicationDeploymentMap[appUuid] === deploymentUuid
          ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        },
      };

      await this.domainController.handleAction(
        closeStoreAction,
        this.applicationDeploymentMap
      );
    }

    log.info("All stores closed successfully");
  }
}

/**
 * Factory function to create and start MCP server
 */
export async function startMcpServer(): Promise<MiroirMcpServer> {
  const server = new MiroirMcpServer();
  await server.initialize();
  await server.run();
  return server;
}
