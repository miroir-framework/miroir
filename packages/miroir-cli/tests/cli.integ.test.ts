// CLI Integration Tests
// TDD-style: Write tests first, then implement the CLI commands

import loglevelNextLog from 'loglevelnext';
import {
  adminConfigurationDeploymentLibrary,
  ApplicationDeploymentMap,
  ConfigurationService,
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
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  noValue,
  type ApplicationEntitiesAndInstances,
  type EntityDefinition,
  type EntityInstance,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MetaEntity,
  type MiroirConfigClient,
  type SpecificLoggerOptionsMap,
  defaultLibraryAppModel,
} from "miroir-core";
import {
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
  entityPublisher,
  entityDefinitionUser,
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
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { loadMiroirCliConfig } from "../src/config/configLoader.js";
import { MiroirCliConfig } from "../src/config/configSchema.js";
import { setupMiroirPlatform } from '../src/startup/setup.js';
import { initializeStoreStartup } from "../src/startup/storeStartup.js";
import {
  cliRequestHandlers,
  cliRequestHandlers_EntityEndpoint,
  cliRequestHandlers_Library_lendingEndpoint,
  type CliCommandHandler,
} from "../src/commands/commandsFromEndpoint.js";

const packageName = "miroir-cli";
const fileName = "cli.integ.test";

const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {};

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
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
let miroirConfig: MiroirCliConfig;
let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

const globalTimeOut = 60000;

// ################################################################################################
// Test Case Interface
// ################################################################################################
export interface CliCommandTest {
  testName: string;
  commandName: string;
  handler: CliCommandHandler<any>;
  params: any;
  tests: (expect: any, result: any) => void;
}

// ################################################################################################
// Test Cases for CLI Commands
// ################################################################################################
const testEntity = entityBook;
const testEntityUuid = entityBook.uuid;
const testApplicationUuid = selfApplicationLibrary.uuid;
const testInstance = book1;
const testInstanceUuid = book1.uuid;
const testBookUuid = noValue.uuid;

export const cliInstanceActionTests: CliCommandTest[] = [
  {
    testName: "should execute createInstance command",
    commandName: "createInstance",
    handler: cliRequestHandlers_EntityEndpoint.createInstance,
    params: {
      application: selfApplicationLibrary.uuid,
      applicationSection: "data" as const,
      parentUuid: entityBook.uuid,
      objects: [
        {
          parentName: "Book",
          parentUuid: entityBook.uuid,
          applicationSection: "data" as const,
          instances: [
            {
              uuid: testBookUuid,
              parentUuid: entityBook.uuid,
              name: "Test Book from CLI",
              author: "Test Author",
              isbn: "TEST-CLI-123",
            } as any,
          ],
        },
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    },
  },
  {
    testName: "should execute getInstance command",
    commandName: "getInstance",
    handler: cliRequestHandlers_EntityEndpoint.getInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      uuid: testInstanceUuid,
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    },
  },
  {
    testName: "should execute getInstances command",
    commandName: "getInstances",
    handler: cliRequestHandlers_EntityEndpoint.getInstances,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
      // Note: getInstances returns success but returnedDomainElement is not populated
      // by handleInstanceAction in DomainController (same behavior as MCP)
    },
  },
  {
    testName: "should execute updateInstance command",
    commandName: "updateInstance",
    handler: cliRequestHandlers_EntityEndpoint.updateInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      objects: [
        {
          parentName: testEntity.name,
          parentUuid: testEntity.uuid,
          applicationSection: "data" as const,
          instances: [
            {
              ...testInstance,
              name: "Updated Book Name from CLI",
            } as any,
          ],
        },
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    },
  },
  {
    testName: "should execute deleteInstance command",
    commandName: "deleteInstance",
    handler: cliRequestHandlers_EntityEndpoint.deleteInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      objects: [
        {
          parentName: testEntity.name,
          parentUuid: testEntity.uuid,
          applicationSection: "data" as const,
          instances: [testInstance],
        },
      ],
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    },
  },
  {
    testName: "calling getInstance on non-existing instance should return error",
    commandName: "getInstance",
    handler: cliRequestHandlers_EntityEndpoint.getInstance,
    params: {
      application: testApplicationUuid,
      applicationSection: "data" as const,
      parentUuid: testEntityUuid,
      uuid: "non-existent-uuid",
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("error");
    },
  },
];

export const cliLibraryEndpointTests: CliCommandTest[] = [
  {
    testName: "should execute lendDocument command",
    commandName: "lendDocument",
    handler: cliRequestHandlers_Library_lendingEndpoint.lendDocument,
    params: {
      book: book1.uuid,
      user: user1.uuid,
      startDate: new Date().toISOString(),
    },
    tests: (expect: any, result: any) => {
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    },
  },
];

export const ALL_CLI_TEST_CASES: CliCommandTest[] = [
  ...cliInstanceActionTests,
  ...cliLibraryEndpointTests,
];

// ################################################################################################
// Test Runner
// ################################################################################################
async function runCliTest(
  cliTest: CliCommandTest,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
) {
  log.info(`Running CLI test: "${cliTest.testName}" with params:`, JSON.stringify(cliTest.params, null, 2));
  
  const result = await cliTest.handler.execute(
    cliTest.params,
    domainController,
    applicationDeploymentMap,
  );
  
  log.info(`CLI test "${cliTest.testName}" result:`, JSON.stringify(result, null, 2));
  cliTest.tests(expect, result);
  
  return result;
}

// ################################################################################################
// Test Suite
// ################################################################################################
describe("CLI Commands Integration Tests", () => {
  beforeAll(async () => {
    // Load configuration
    miroirConfig = loadMiroirCliConfig();
    
    if (!miroirConfig) {
      throw new Error("Failed to load MiroirCLI configuration");
    }

    if (!miroirConfig.client.applicationDeploymentMap) {
      throw new Error("MiroirCLI configuration missing client.applicationDeploymentMap");
    }

    if (!miroirConfig.client.deploymentStorageConfig) {
      throw new Error("MiroirCLI configuration missing client.deploymentStorageConfig");
    }

    // Initialize framework
    miroirCoreStartup();
    
    // Initialize stores based on configuration
    await initializeStoreStartup(miroirConfig);
    
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
      domainController: localdomainController,
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

    log.info("CLI test setup completed");
  }, globalTimeOut);

  beforeEach(async () => {
    // Reset Miroir deployment to clean state before each test
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
    ]);

    const createLibraryAction = resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      adminConfigurationDeploymentLibrary.uuid,
      {
        dataStoreType: "app",
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstancesWithoutBook3,
      defaultLibraryAppModel,
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
        `Failed to refresh Library: ${JSON.stringify(refreshLibrary)}`
      );
    }
  });

  describe.sequential(
    "CLI Command Handlers - All Tests",
    () => {
      it.each(ALL_CLI_TEST_CASES.map(test => [test.testName, test]))(
        "test %s",
        async (currentTestSuiteName, testAction: CliCommandTest) => {
          await runCliTest(
            testAction,
            domainController,
            applicationDeploymentMap,
          );
        },
        globalTimeOut
      );
    }
  );
});
