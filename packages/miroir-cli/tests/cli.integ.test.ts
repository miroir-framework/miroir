// CLI Integration Tests
// TDD-style: Write tests first, then implement the CLI commands

import loglevelNextLog from 'loglevelnext';
import {
  ApplicationDeploymentMap,
  ConfigurationService,
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
  StoreOrBundleAction,
  StoreUnitConfiguration,
  noValue,
  type ApplicationEntitiesAndInstances,
  type EntityVersion,
  type EntityInstance,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MetaEntity,
  type MiroirConfigClient,
  type SpecificLoggerOptionsMap,
  miroirFundamentalMlSchema,
  type MlSchema,
  type EndpointDefinition,
  type SelfApplication,
  type Entity,
} from "miroir-core";
import {
  getDefaultLibraryModelEnvironmentDEFUNCT,
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
  deployment_Library_DO_NO_USE,
  resolveLibraryDeploymentUuid,
} from "miroir-example-library";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { openTestEnvironment, selectedTestEnvironment } from "miroir-env";
import { initializePlatform } from "../src/platform.js";
import {
  cliRequestHandlers,
  cliRequestHandlers_EntityEndpoint,
  cliRequestHandlers_Library_lendingEndpoint,
  type CliCommandHandler,
} from "../src/commands/commandsFromEndpoint.js";

import { defaultMiroirMetaModel, instanceEndpointV1 } from "miroir-app-miroir";
import { deployment_Miroir } from 'miroir-app-admin';
const packageName = "miroir-cli";
const fileName = "cli.integ.test";

const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const specificLoggerOptions: SpecificLoggerOptionsMap = {};

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: specificLoggerOptions,
}

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const libraryEntitiesAndInstancesWithoutBook3: ApplicationEntitiesAndInstances = [
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
    instances: [
      user1 as EntityInstance,
      user2 as EntityInstance,
      user3 as EntityInstance,
    ],
  }
];

// Test configuration
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
      objects: [testInstance],
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
    // #345: the CLI runs on a test environment, its copies seeded again for this test file
    const environmentName = selectedTestEnvironment(process.env) ?? "test-filesystem";
    openTestEnvironment(environmentName, { reseed: true });
    ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

    const platform = await initializePlatform({ env: { ...process.env, MIROIR_ENV: environmentName } });
    expect(platform.environment.name).toBe(environmentName);
    domainController = platform.domainController;
    localCache = domainController.getLocalCache();
    applicationDeploymentMap = platform.applicationDeploymentMap;
    log.info("CLI test setup completed on environment", environmentName);
  }, globalTimeOut);

  beforeEach(async () => {
    // Reset Miroir deployment to clean state before each test
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      deployment_Miroir as Deployment,
    ]);
    const defaultLibraryAppModelDEFUNCT = getDefaultLibraryModelEnvironmentDEFUNCT(
      defaultMiroirMetaModel,
      instanceEndpointV1 as EndpointDefinition,
      resolveLibraryDeploymentUuid(applicationDeploymentMap),
    );
    
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
      libraryEntitiesAndInstancesWithoutBook3,
      defaultLibraryAppModelDEFUNCT.currentModel as any,
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

  describe(
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
