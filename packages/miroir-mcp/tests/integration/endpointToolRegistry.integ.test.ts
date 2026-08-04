import loglevelNextLog from 'loglevelnext';
import express, { type Express } from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ApplicationDeploymentMap,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  DomainControllerInterface,
  emptyMetaModel,
  LocalCacheInterface,
  LoggerInterface,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  Deployment,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  type ApplicationEntitiesAndInstances,
  type Entity,
  type EntityVersion,
  type EntityInstance,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MetaModel,
  type MiroirConfigClient,
  type SelfApplication,
  type SpecificLoggerOptionsMap,
  defaultSelfApplicationDeploymentMap,
} from "miroir-core";
import {
  deployment_Library_DO_NO_USE,
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityDefinitionUser,
  entityPublisher,
  entityUser,
  folio as publisher1,
  penguin as publisher2,
  springer as publisher3,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
  user1,
  user2,
  user3,
  defaultLibraryAppModel,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
import { adminSelfApplication, deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";

import { loadMiroirMcpConfig } from "../../src/config/configLoader.js";
import { MiroirMcpConfig } from "../../src/config/configSchema.js";
import { MiroirMcpServer, setupMcpServer } from "../../src/mcpServer.js";
import { setupMiroirPlatform } from "../../src/startup/setup.js";
import { initializeStoreStartup } from "../../src/startup/storeStartup.js";
import { EndpointToolRegistry } from "../../src/tools/EndpointToolRegistry.js";
import { callMcpToolViaHttp, listMcpToolsViaHttp } from "./mcpClient.js";

const packageName = "miroir-mcp";
const fileName = "endpointToolRegistry.test";

const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {};

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: specificLoggerOptions,
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, "info", fileName)
).then((logger: LoggerInterface) => {
  log = logger;
});

const applicationDeploymentMapWithLibrary: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

const libraryEntitiesAndInstances: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as Entity,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as Entity,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as Entity,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
  {
    entity: entityUser as Entity,
    instances: [user1 as EntityInstance, user2 as EntityInstance, user3 as EntityInstance],
  },
];

let miroirConfig: MiroirMcpConfig;
let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

const globalTimeOut = 60000;

describe("EndpointToolRegistry integration", () => {
  // ##############################################################################################
  beforeAll(async () => {
    miroirConfig = loadMiroirMcpConfig();
    if (!miroirConfig) {
      throw new Error("Failed to load MiroirMCP configuration");
    }

    miroirCoreStartup();
    await initializeStoreStartup(miroirConfig);
    ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

    const miroirActivityTracker = new MiroirActivityTracker();
    const miroirEventService = new MiroirEventService(miroirActivityTracker);

    MiroirLoggerFactory.startRegisteredLoggers(
      miroirActivityTracker,
      miroirEventService,
      loglevelnext,
      loggerOptions,
    );

    const { domainController: localdomainController } = await setupMiroirPlatform(
      miroirConfig as any as MiroirConfigClient,
      miroirActivityTracker,
      miroirEventService,
    );

    domainController = localdomainController;
    localCache = domainController.getLocalCache();
    applicationDeploymentMap = miroirConfig.client.applicationDeploymentMap;

    for (const [deploymentUuid, storeConfig] of Object.entries(
      miroirConfig.client.deploymentStorageConfig,
    )) {
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
            [deploymentUuid]: storeConfig as StoreUnitConfiguration,
          },
        },
      };

      const result = await domainController.handleAction(openStoreAction, applicationDeploymentMap);
      if (result.status !== "ok") {
        throw new Error(
          `Failed to open stores for deployment ${deploymentUuid}: ${JSON.stringify(result)}`,
        );
      }
    }
    log.info("EndpointToolRegistry test setup completed");
  }, globalTimeOut);

  // ##############################################################################################
  beforeEach(async () => {
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      deployment_Miroir as Deployment,
    ]);

    const createLibraryAction = resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      deployment_Library_DO_NO_USE.uuid,
      {
        dataStoreType: "app",
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary as SelfApplication,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstances,
      defaultLibraryAppModel as any,
    );
    const beforeEachResult = await domainController.handleCompositeAction(
      createLibraryAction,
      applicationDeploymentMapWithLibrary,
      defaultMiroirModelEnvironment,
      {},
    );
    if (beforeEachResult.status !== "ok") {
      throw new Error(
        `Failed to execute beforeEach composite action: ${JSON.stringify(beforeEachResult)}`,
      );
    }

    const refreshLibrary = await domainController.handleAction(
      {
        actionType: "rollback",
        actionLabel: "Refresh Library Local Cache",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: selfApplicationLibrary.uuid,
        },
      },
      applicationDeploymentMapWithLibrary,
      defaultMiroirModelEnvironment,
    );
    if (refreshLibrary.status !== "ok") {
      throw new Error(`Failed to refresh Library cache: ${JSON.stringify(refreshLibrary)}`);
    }

    // refresh the Admin deployment cache: AdminApplication instances are the source of
    // application names (and, later, dynamic deployment discovery)
    const refreshAdmin = await domainController.handleAction(
      {
        actionType: "rollback",
        actionLabel: "Refresh Admin Local Cache",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: adminSelfApplication.uuid,
        },
      },
      applicationDeploymentMapWithLibrary,
      defaultMiroirModelEnvironment,
    );
    if (refreshAdmin.status !== "ok") {
      throw new Error(`Failed to refresh Admin cache: ${JSON.stringify(refreshAdmin)}`);
    }
  });

  // ##############################################################################################
  afterAll(async () => {
    log.info("EndpointToolRegistry test teardown completed");
  });

  // ##############################################################################################
  describe.sequential("listTools", () => {
    it(
      "enumerates one tool per (endpoint, action) of all deployed applications",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);

        const tools = await registry.listTools();
        const toolNames = tools.map((t) => t.name);

        console.log("listTools returned tools:", JSON.stringify(toolNames, null, 2));

        // known tools: Miroir instance endpoint actions
        expect(toolNames).toContain("Miroir_createInstance");
        expect(toolNames).toContain("Miroir_getInstances");
        // known tool: Library lending endpoint action
        expect(toolNames).toContain("Library_lendDocument");

        // every tool is a valid MCP tool: name pattern, object input schema, description
        for (const tool of tools) {
          expect(tool.name).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
          expect(tool.inputSchema.type).toBe("object");
          expect(tool.description).toBeTruthy();
        }

        // tool names are unique
        expect(new Set(toolNames).size).toBe(toolNames.length);
      },
      globalTimeOut,
    );
  });

  // ##############################################################################################
  describe.sequential("callTool", () => {
    it(
      "executes a dynamically listed tool (createInstance + getInstance on Library books)",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
        const createdBookUuid = "b5334e2d-1f42-4a67-9c0d-000000000001";

        const createResult = await registry.callTool("Miroir_createInstance", {
          application: selfApplicationLibrary.uuid,
          applicationSection: "data",
          parentUuid: entityBook.uuid,
          objects: [
            {
              parentName: "Book",
              parentUuid: entityBook.uuid,
              applicationSection: "data",
              instances: [
                {
                  uuid: createdBookUuid,
                  parentUuid: entityBook.uuid,
                  name: "Registry Book",
                  author: "Registry Author",
                  isbn: "TEST-REG-1",
                } as any,
              ],
            },
          ],
        });
        expect(createResult.content[0].parsed?.status).toBe("success");

        // getInstance reads through the persistence store: created instances live in the
        // current (uncommitted) transaction, so read a pre-seeded instance instead (same
        // pattern as the existing mcpTools test cases, which getInstance on book1).
        const getResult = await registry.callTool("Miroir_getInstance", {
          application: selfApplicationLibrary.uuid,
          applicationSection: "data",
          parentUuid: entityBook.uuid,
          uuid: book1.uuid,
        });
        expect(getResult.content[0].parsed?.status).toBe("success");
      },
      globalTimeOut,
    );

    it(
      "returns a structured unknown_tool error for a tool that is not listed",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
        const result = await registry.callTool("NoSuch_tool", {});
        expect(result.content[0].parsed?.status).toBe("error");
        expect(result.content[0].parsed?.error?.type).toBe("unknown_tool");
      },
      globalTimeOut,
    );
  });

  // ##############################################################################################
  describe.sequential("MiroirMcpServer wired to EndpointToolRegistry", () => {
    let mcpServer: MiroirMcpServer;
    let httpServer: any;
    let mcpServerUrl: string;

    beforeAll(async () => {
      const app: Express = express();
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      mcpServer = await setupMcpServer(app, applicationDeploymentMap, registry, domainController);
      await new Promise<void>((resolve) => {
        httpServer = app.listen(0, () => resolve());
      });
      mcpServerUrl = `http://localhost:${httpServer.address().port}`;
      log.info(`test MCP server listening on ${mcpServerUrl}`);
    }, globalTimeOut);

    afterAll(async () => {
      if (httpServer) {
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      }
    });

    it(
      "serves ListTools from the registry over the MCP protocol",
      async () => {
        const tools = await listMcpToolsViaHttp(mcpServerUrl);
        const toolNames = tools.map((t) => t.name);
        expect(toolNames).toContain("Miroir_createInstance");
        expect(toolNames).toContain("Library_lendDocument");
      },
      globalTimeOut,
    );

    it(
      "serves CallTool with structured unknown_tool error over the MCP protocol",
      async () => {
        const result = await callMcpToolViaHttp(mcpServerUrl, "NoSuch_tool", {});
        expect(result.content[0].parsed?.status).toBe("error");
        expect(result.content[0].parsed?.error?.type).toBe("unknown_tool");
      },
      globalTimeOut,
    );
  });

  // ##############################################################################################
  describe.sequential("hot-reload on model change", () => {
    const testEndpointUuid = "aa0d5f7e-1111-4a67-9c0d-0000000000e1";

    it(
      "emits onChange and lists new tools when an endpoint is added to the Library model, without restart",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
        const initialTools = (await registry.listTools()).map((t) => t.name);
        expect(initialTools).not.toContain("Library_testPing");

        let changeCount = 0;
        registry.start(() => {
          changeCount++;
        });
        try {
          const createEndpointResult = await domainController.handleAction(
            {
              actionType: "createInstance",
              actionLabel: "add test endpoint to Library model",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89", // instanceEndpointV1
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "model",
                objects: [
                  {
                    uuid: testEndpointUuid,
                    parentName: "Endpoint",
                    parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
                    application: selfApplicationLibrary.uuid,
                    name: "TestPing",
                    version: "1",
                    definition: {
                      actions: [
                        {
                          actionParameters: {
                            actionType: { type: "literal", definition: "testPing" },
                            payload: {
                              type: "object",
                              definition: {
                                message: { type: "string" },
                              },
                            },
                          },
                        },
                      ],
                    },
                  } as any,
                ],
              },
            },
            applicationDeploymentMap,
          );
          expect(createEndpointResult.status).toBe("ok");

          // the subscription is synchronous with the local-cache store update
          expect(changeCount).toBeGreaterThan(0);

          const toolsAfterChange = (await registry.listTools()).map((t) => t.name);
          expect(toolsAfterChange).toContain("Library_testPing");
        } finally {
          registry.stop();
        }
      },
      globalTimeOut,
    );

    it(
      "emits onChange and drops tools when an endpoint is removed from the Library model, without restart",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
        const initialTools = (await registry.listTools()).map((t) => t.name);
        expect(initialTools).toContain("Library_lendDocument");

        let changeCount = 0;
        registry.start(() => {
          changeCount++;
        });
        try {
          const deleteEndpointResult = await domainController.handleAction(
            {
              actionType: "deleteInstance",
              actionLabel: "remove lending endpoint from Library model",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89", // instanceEndpointV1
              payload: {
                application: selfApplicationLibrary.uuid,
                applicationSection: "model",
                parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
                objects: [
                  {
                    uuid: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de", // lendingEndpoint
                    parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
                  },
                ],
              },
            },
            applicationDeploymentMap,
          );
          expect(deleteEndpointResult.status).toBe("ok");

          expect(changeCount).toBeGreaterThan(0);

          const toolsAfterChange = (await registry.listTools()).map((t) => t.name);
          expect(toolsAfterChange).not.toContain("Library_lendDocument");
          expect(toolsAfterChange).not.toContain("Library_returnDocument");

          const removedToolResult = await registry.callTool("Library_lendDocument", {});
          expect(removedToolResult.content[0].parsed?.status).toBe("error");
          expect(removedToolResult.content[0].parsed?.error?.type).toBe("unknown_tool");
        } finally {
          registry.stop();
        }
      },
      globalTimeOut,
    );
  });

  // ##############################################################################################
  describe.sequential("hot-reload on deployment change", () => {
    const pingAppUuid = "aa0d5f7e-2222-4a67-9c0d-0000000000a9";
    const pingDeploymentUuid = "aa0d5f7e-2222-4a67-9c0d-0000000000d9";
    const pingBranchUuid = "aa0d5f7e-2222-4a67-9c0d-0000000000b9";
    const pingVersionUuid = "aa0d5f7e-2222-4a67-9c0d-0000000000v9".replace("v", "c");
    const pingEndpointUuid = "aa0d5f7e-2222-4a67-9c0d-0000000000e9";

    const pingStoreConfig: StoreUnitConfiguration = {
      admin: { emulatedServerType: "filesystem", directory: "miroir-mcp/tests/tmp/pingapp_admin" },
      model: { emulatedServerType: "filesystem", directory: "miroir-mcp/tests/tmp/pingapp_model" },
      data: { emulatedServerType: "filesystem", directory: "miroir-mcp/tests/tmp/pingapp_data" },
    } as StoreUnitConfiguration;

    it(
      "discovers a deployment added at runtime and lists its endpoint tools, without restart",
      async () => {
        const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
        const initialTools = (await registry.listTools()).map((t) => t.name);
        expect(initialTools).not.toContain("PingApp_testPing");

        let changeCount = 0;
        registry.start(() => {
          changeCount++;
        });
        try {
          // 1. create the deployment: registers AdminApplication + Deployment in Admin data,
          //    opens and creates the stores
          const createDeployment = createDeploymentCompositeAction(
            "PingApp",
            pingDeploymentUuid,
            pingAppUuid,
            deployment_Admin as Deployment,
            pingStoreConfig,
            { skipOpenAdminStore: true },
          );
          const extendedDeploymentMap: ApplicationDeploymentMap = {
            ...applicationDeploymentMap,
            [pingAppUuid]: pingDeploymentUuid,
          };
          const createDeploymentResult = await domainController.handleCompositeAction(
            createDeployment,
            extendedDeploymentMap,
            defaultMiroirModelEnvironment,
            {},
          );
          if (createDeploymentResult.status !== "ok") {
            console.log("createDeploymentResult:", JSON.stringify(createDeploymentResult, null, 2));
          }
          expect(createDeploymentResult.status).toBe("ok");

          // 2. initialize the new application's model with one endpoint
          const pingSelfApplication = {
            uuid: pingAppUuid,
            parentName: "SelfApplication",
            parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
            name: "PingApp",
            defaultLabel: "The PingApp",
            description: "Runtime-created test application",
          } as any as SelfApplication;
          const pingBranch = {
            uuid: pingBranchUuid,
            parentName: "ApplicationModelBranch",
            parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
            selfApplication: pingAppUuid,
            headVersion: pingVersionUuid,
            name: "master",
            description: "The master branch of PingApp",
          } as any;
          const pingVersion = {
            uuid: pingVersionUuid,
            parentName: "ApplicationVersion",
            parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
            name: "Initial",
            selfApplication: pingAppUuid,
            branch: pingBranchUuid,
            description: "Initial PingApp version",
            modelStructureMigration: [],
            modelCUDMigration: [],
          } as any;
          const pingEndpoint = {
            uuid: pingEndpointUuid,
            parentName: "Endpoint",
            parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
            application: pingAppUuid,
            name: "PingEndpoint",
            version: "1",
            definition: {
              actions: [
                {
                  actionParameters: {
                    actionType: { type: "literal", definition: "testPing" },
                    payload: {
                      type: "object",
                      definition: {
                        message: { type: "string" },
                      },
                    },
                  },
                },
              ],
            },
          } as any;
          const pingMetaModel: MetaModel = {
            ...emptyMetaModel,
            applicationUuid: pingAppUuid,
            applicationName: "PingApp",
            applications: [pingSelfApplication],
            applicationVersions: [pingVersion],
            endpoints: [pingEndpoint],
          };
          const initPing = resetAndinitializeDeploymentCompositeAction(
            pingAppUuid,
            pingDeploymentUuid,
            {
              dataStoreType: "app",
              metaModel: defaultMiroirMetaModel,
              selfApplication: pingSelfApplication,
              applicationModelBranch: pingBranch,
              applicationVersion: pingVersion,
            },
            [],
            pingMetaModel,
          );
          const initPingResult = await domainController.handleCompositeAction(
            initPing,
            extendedDeploymentMap,
            defaultMiroirModelEnvironment,
            {},
          );
          expect(initPingResult.status).toBe("ok");

          // 3. the registry discovers the new deployment from the Admin deployment registry
          expect(changeCount).toBeGreaterThan(0);

          const toolsAfterChange = (await registry.listTools()).map((t) => t.name);
          expect(toolsAfterChange).toContain("PingApp_testPing");
        } finally {
          registry.stop();

          // the Admin deployment store is NOT tmp-backed: the PingApp AdminApplication /
          // Deployment rows created above persist on disk and would pollute subsequent
          // runs (and other test files). Remove them explicitly.
          const cleanupErrors: string[] = [];
          for (const [entityUuid, instanceUuid] of [
            ["25d935e7-9e93-42c2-aade-0472b883492b", pingAppUuid], // AdminApplication
            ["7959d814-400c-4e80-988f-a00fe582ab98", pingDeploymentUuid], // Deployment
          ] as const) {
            const deleteResult = await domainController.handleAction(
              {
                actionType: "deleteInstance",
                actionLabel: "remove PingApp row from Admin registry",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89", // instanceEndpointV1
                payload: {
                  application: adminSelfApplication.uuid,
                  applicationSection: "data",
                  parentUuid: entityUuid,
                  objects: [{ uuid: instanceUuid, parentUuid: entityUuid }],
                },
              },
              applicationDeploymentMap,
            );
            if (deleteResult.status !== "ok") {
              cleanupErrors.push(JSON.stringify(deleteResult));
            }
          }
          if (cleanupErrors.length > 0) {
            log.warn(`PingApp cleanup errors (ignored): ${cleanupErrors.join("; ")}`);
          }
        }
      },
      globalTimeOut,
    );
  });
});
