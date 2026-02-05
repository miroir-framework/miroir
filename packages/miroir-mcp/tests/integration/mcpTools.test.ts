import loglevelNextLog from 'loglevelnext';
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ApplicationDeploymentMap,
  ConfigurationService,
  defaultLibraryAppModelDEFUNCT,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  DomainControllerInterface,
  LocalCacheInterface,
  LoggerInterface,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetAndinitializeDeploymentCompositeAction,
  Deployment,
  selfApplicationDeploymentMiroir,
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
import { loadMiroirMcpConfig } from "../../src/config/configLoader.js";
import { MiroirMcpConfig } from "../../src/config/configSchema.js";
import { setupMiroirPlatform } from '../../src/startup/setup.js';
import { initializeStoreStartup } from "../../src/startup/storeStartup.js";
import {
  ALL_MCP_TEST_CASES,
  type McpToolTest
} from "./mcpToolsTestCases.js";


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
} from "miroir-example-library";
import { callMcpToolViaHttp } from './mcpClient.js';

// import { runMcpTestsViaHttp } from './mcpClient.js';

const packageName = "miroir-mcp";
const fileName = "mcpTools.test";
  
const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "4_miroir-core_RestTools": {level:defaultLevels.INFO, },
  // // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined},
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


const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
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
  {
    entity: entityUser as MetaEntity,
    entityDefinition: entityDefinitionUser as EntityDefinition,
    instances: [
      user1 as EntityInstance,
      user2 as EntityInstance,
      user3 as EntityInstance,
    ],
  }
];

// Test configuration
let miroirConfig: MiroirMcpConfig;
let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

const globalTimeOut = 60000;

/**
 * Run MCP tests via HTTP transport
 * Calls the actual MCP server running on the specified URL
 */
export async function runMcpTestsViaHttp(
  mcpTest: McpToolTest,
  serverUrl: string = 'http://localhost:3080',
  // timeout = 30000,
) {
  // Extract tool name from handler
  const toolName = mcpTest.toolName;

  if (!toolName) {
    throw new Error(`runMcpTestsViaHttp Could not find tool name for handler in test: ${mcpTest.testName}`);
  }
  log.info(`runMcpTestsViaHttp "${mcpTest.testName}" (HTTP) calling with:`, JSON.stringify(mcpTest.params, null, 2));

  const result = await callMcpToolViaHttp(serverUrl, toolName, mcpTest.params);
  
  log.info(`runMcpTestsViaHttp "${mcpTest.testName}" (HTTP) result:`, JSON.stringify(result, null, 2));
  
  // Verify the MCP layer processed the action correctly
  mcpTest.tests(expect, result);
  log.info(`Test suite '${mcpTest.testName}' results: ${JSON.stringify(result, null, 2)}`);
  // expect(JSON.stringify(result.content[0]?.parsed?.status)).toContain("success");
  
  return result;
}

export async function runMcpTestsViaHandler(
  mcpTest: McpToolTest,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  // timeout = 30000,
) {
  const result = await mcpTest.handler.actionHandler(
    mcpTest.params,
    domainController,
    applicationDeploymentMap,
  );
  log.info(`${mcpTest.testName} result:`, JSON.stringify(result, null, 2));
  // Verify the MCP layer processed the action correctly
  mcpTest.tests(expect, result);
  return result;
}


describe("MCP Tools Integration Tests", () => {
  // ##############################################################################################
  beforeAll(async () => {
    // Load configuration (test can override with env var MIROIR_MCP_CONFIG_PATH)
    miroirConfig = loadMiroirMcpConfig();
    
    if (!miroirConfig) {
      throw new Error("Failed to load MiroirMCP configuration");
    }

    if (!miroirConfig.client.applicationDeploymentMap) {
      throw new Error("MiroirMCP configuration missing client.applicationDeploymentMap");
    }

    if (!miroirConfig.client.deploymentStorageConfig) {
      throw new Error("MiroirMCP configuration missing client.deploymentStorageConfig");
    }
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

    if (!domainController) {
      throw new Error("Failed to initialize DomainController");
    }
    if (!localCache) {
      throw new Error("Failed to initialize LocalCache");
    }

    if (!applicationDeploymentMap) {
      throw new Error("Failed to initialize ApplicationDeploymentMap");
    }
    if (Object.keys(applicationDeploymentMap).length === 0) {
      throw new Error("ApplicationDeploymentMap is empty");
    }

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

  // ##############################################################################################
  beforeEach(async () => {
    // Reset Miroir deployment to clean state before each test
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      selfApplicationDeploymentMiroir as Deployment,
    ]);

    const createLibraryAction = resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      deployment_Library_DO_NO_USE.uuid,
      {
        dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstancesWithoutBook3,
      defaultLibraryAppModelDEFUNCT,
    );
    const beforeEachResult = await domainController.handleCompositeAction(
      createLibraryAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (beforeEachResult.status !== "ok") {
      throw new Error(`Failed to execute beforeEach composite action: ${JSON.stringify(beforeEachResult)}`);
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

  // // ##############################################################################################
  // afterAll(async () => {
  //   // Close all stores
  //   for (const deploymentUuid of Object.keys(miroirConfig.client.deploymentStorageConfig)) {
  //     const closeStoreAction: StoreOrBundleAction = {
  //       actionType: "storeManagementAction_closeStore",
  //       actionLabel: `Close stores for ${deploymentUuid}`,
  //       application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //       endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
  //       payload: {
  //         application: Object.keys(applicationDeploymentMap).find(
  //           (appUuid) => applicationDeploymentMap[appUuid] === deploymentUuid
  //         ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //       },
  //     };

  //     await domainController.handleAction(closeStoreAction, applicationDeploymentMap);
  //   }

  //   log.info("MCP test teardown completed");
  // });

  // describe.sequential(
  //   "MCP Tool Handlers - All Tests",
  //   () => {
  
  //     it.each(ALL_MCP_TEST_CASES.map(test => [test.testName, test]))(
  //       "test %s",
  //       async (currentTestSuiteName, testAction: McpToolTest) => {
  //         const testSuiteResults = await runMcpTestsViaHandler(
  //           testAction,
  //           domainController,
  //           applicationDeploymentMap,
  //         );
  //       },
  //       globalTimeOut
  //     );
  //   } //  end describe('MCP Tool Handlers - All Tests',
  // );

  describe.sequential(
    "MCP Tool Handlers via HTTP - All Tests",
    () => {
      it.each(ALL_MCP_TEST_CASES.map(test => [test.testName, test]))(
        "test %s (via HTTP)",
        async (currentTestSuiteName, testAction: McpToolTest) => {
          const testSuiteResults = await runMcpTestsViaHttp(
            testAction,
            'http://localhost:3080',
          );
        },
        globalTimeOut
      );
    } //  end describe('MCP Tool Handlers via HTTP - All Tests',
  );
  
});
