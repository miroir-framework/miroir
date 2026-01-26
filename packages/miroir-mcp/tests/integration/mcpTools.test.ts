import loglevelNextLog from 'loglevelnext';
import {
  adminConfigurationDeploymentLibrary,
  ApplicationDeploymentMap,
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  book5,
  book6,
  ConfigurationService,
  defaultLevels,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityPublisher,
  LocalCacheInterface,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  type ApplicationEntitiesAndInstances,
  type EntityDefinition,
  type EntityInstance,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MetaEntity,
  type MiroirConfigClient,
  type SpecificLoggerOptionsMap
} from "miroir-core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";


import { loadMiroirMcpConfig } from "../../src/config/configLoader.js";
import { MiroirMcpConfig } from "../../src/config/configSchema.js";
import { setupMiroirPlatform } from '../../src/startup/setup.js';
import { initializeStoreStartup } from "../../src/startup/storeStartup.js";
import { mcpRequestHandlers_EntityEndpoint } from "../../src/tools/handlers_InstanceEndpoint.js";

const packageName = "miroir-mcp";
const fileName = "mcpTools.test";
  
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


export const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
  {
    entity: entityAuthor as MetaEntity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [author1, author2, author3 as EntityInstance],
  },
  {
    entity: entityBook as MetaEntity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      // // book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ],
  },
  {
    entity: entityPublisher as MetaEntity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [publisher1 as EntityInstance, publisher2 as EntityInstance, publisher3 as EntityInstance],
  },
];

// Test configuration
let miroirConfig: MiroirMcpConfig;
let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
// let miroirContext: MiroirContextInterface;
// let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

const globalTimeOut = 30000;

describe("MCP Tools Integration Tests", () => {
  // ################################################################################################
  beforeAll(async () => {
    // Load configuration (test can override with env var MIROIR_MCP_CONFIG_PATH)
    miroirConfig = loadMiroirMcpConfig();
    
    // Initialize framework
    miroirCoreStartup();
    
    // Initialize stores based on configuration
    initializeStoreStartup(miroirConfig);
    
    // Register test implementation
    ConfigurationService.registerTestImplementation({ expect: expect as any });

    // Setup MiroirContext
    const miroirActivityTracker = new MiroirActivityTracker();
    const miroirEventService = new MiroirEventService(miroirActivityTracker);
    
    // Start loggers
    MiroirLoggerFactory.startRegisteredLoggers(
      miroirActivityTracker,
      miroirEventService,
      loglevelnext,
      loggerOptions,
    );

    const {
      // persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      // localCache: locallocalCache,
      // miroirContext: localmiroirContext,
    } = await setupMiroirPlatform(
      miroirConfig as any as MiroirConfigClient,
      miroirActivityTracker,
      miroirEventService,
    );


    domainController = localdomainController;
    localCache = domainController.getLocalCache();
    applicationDeploymentMap = miroirConfig.client.applicationDeploymentMap;

    // Initialize store startup (register store factories)
    await initializeStoreStartup(miroirConfig);

    // Open stores for all configured deployments
    for (const [deploymentUuid, storeConfig] of Object.entries(
      miroirConfig.client.deploymentStorageConfig
    )) {
      log.info(`Opening stores for deployment ${deploymentUuid}`);

      const openStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_openStore",
        actionLabel: `Open stores for ${deploymentUuid}`,
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: Object.keys(applicationDeploymentMap).find(
            (appUuid) => applicationDeploymentMap[appUuid] === deploymentUuid
          ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          deploymentUuid: deploymentUuid,
          configuration: {
            [deploymentUuid]: storeConfig as StoreUnitConfiguration,
          },
        },
      };

      const result = await domainController.handleAction(
        openStoreAction,
        applicationDeploymentMap
      );

      if (result.status !== "ok") {
        throw new Error(
          `Failed to open stores for deployment ${deploymentUuid}: ${JSON.stringify(result)}`
        );
      }
    }

    log.info("MCP test setup completed");
  }, globalTimeOut);

  // ################################################################################################
  beforeEach(async () => {
    // Reset Miroir deployment to clean state before each test
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
    ]);

    const createLibraryAction = resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      adminConfigurationDeploymentLibrary.uuid,
      {
        dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstancesWithoutBook3,
    );
    const beforeAllResult = await domainController.handleCompositeAction(
      createLibraryAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (beforeAllResult.status !== "ok") {
      throw new Error(`Failed to execute beforeEach composite action: ${JSON.stringify(beforeAllResult)}`);
    }

    const refreshLibrary = await domainController.handleAction(
      {
        actionType: "rollback",
        actionLabel: "Refresh Library Local Cache",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: selfApplicationLibrary.uuid,
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    if (refreshLibrary.status !== "ok") {
      throw new Error(
        `Failed to open stores for application ${selfApplicationLibrary.uuid}: ${JSON.stringify(refreshLibrary)}`
      );
    }


  });

  // ################################################################################################
  afterAll(async () => {
    // Close all stores
    for (const deploymentUuid of Object.keys(miroirConfig.client.deploymentStorageConfig)) {
      const closeStoreAction: StoreOrBundleAction = {
        actionType: "storeManagementAction_closeStore",
        actionLabel: `Close stores for ${deploymentUuid}`,
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: Object.keys(applicationDeploymentMap).find(
            (appUuid) => applicationDeploymentMap[appUuid] === deploymentUuid
          ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        },
      };

      await domainController.handleAction(closeStoreAction, applicationDeploymentMap);
    }

    log.info("MCP test teardown completed");
  });

  // ################################################################################################
  describe("Configuration and Setup", () => {
    it("should load configuration successfully", () => {
      expect(miroirConfig).toBeDefined();
      expect(miroirConfig.client.applicationDeploymentMap).toBeDefined();
      expect(miroirConfig.client.deploymentStorageConfig).toBeDefined();
    });

    it("should have initialized domain controller", () => {
      expect(domainController).toBeDefined();
      expect(localCache).toBeDefined();
    });

    it("should have valid application deployment map", () => {
      expect(applicationDeploymentMap).toBeDefined();
      expect(Object.keys(applicationDeploymentMap).length).toBeGreaterThan(0);
    });
  });

  // ################################################################################################
  describe("MCP Tool Handlers - InstanceActions", () => {
    // const testEntityUuid = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"; // Book entity
    const testEntity = entityBook; // Book entity
    const testEntityUuid = entityBook.uuid; // Book entity
    const testApplicationUuid = selfApplicationLibrary.uuid; // Library
    const testInstance = book1; // Book1 instance
    const testInstanceUuid = book1.uuid; // Book1 instance

    it(
      "should execute createInstance action",
      async () => {
        const testInstanceUuid = "test-book-" + Date.now();
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: testEntityUuid,
          instances: [
            {
              parentName: "Book",
              parentUuid: testEntityUuid,
              applicationSection: "data" as const,
              instances: [
                {
                  uuid: testInstanceUuid,
                  parentUuid: testEntityUuid,
                  name: "Test Book from MCP",
                  author: "Test Author",
                  isbn: "TEST-123",
                } as any,
              ],
            },
          ],
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_createInstance.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("createInstance result:", JSON.stringify(result, null, 2));
        // Verify the MCP layer processed the action correctly
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
      },
      globalTimeOut
    );

    it(
      "should execute getInstance action",
      async () => {
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: testEntityUuid,
          uuid: testInstanceUuid,
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_getInstance.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("getInstance result:", JSON.stringify(result, null, 2));
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
      },
      globalTimeOut
    );

    it(
      "should execute getInstances action",
      async () => {
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: testEntityUuid,
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_getInstances.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("getInstances result:", JSON.stringify(result, null, 2));
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
      },
      globalTimeOut
    );

    it(
      "should execute updateInstance action",
      async () => {
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: testEntityUuid,
          instances: [
            {
              parentName: testEntity.name,
              parentUuid: testEntity.uuid,
              applicationSection: "data" as const,
              instances: [
                {
                  ...testInstance,
                  "name": "Updated Book Name from MCP",
                } as any,
              ],
            },
          ],
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_updateInstance.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("updateInstance result:", JSON.stringify(result, null, 2));
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
      },
      globalTimeOut
    );

    it(
      "should execute deleteInstance action",
      async () => {
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: testEntity.uuid,
          uuid: testInstanceUuid,
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_deleteInstance.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("deleteInstance result:", JSON.stringify(result, null, 2));
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
      },
      globalTimeOut
    );

    it(
      "should handle error cases gracefully",
      async () => {
        const params = {
          application: testApplicationUuid,
          applicationSection: "data" as const,
          parentUuid: "00000000-0000-0000-0000-000000000000",
          uuid: "non-existent-uuid",
        };

        const result = await mcpRequestHandlers_EntityEndpoint.miroir_getInstance.actionHandler(
          params,
          domainController,
          applicationDeploymentMap
        );

        log.info("Error case result:", JSON.stringify(result, null, 2));
        // Should return error in content, not throw
        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        // Error should be in the text content
        const contentText = result.content[0].text;
        expect(contentText).toContain("error");
      },
      globalTimeOut
    );
  });
});
