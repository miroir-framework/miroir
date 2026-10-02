import loglevelNextLog from 'loglevelnext';
import express, { type Express } from "express";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ApplicationDeploymentMap,
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
  type ApplicationEntitiesAndInstances,
  type Entity,
  type EntityVersion,
  type EntityInstance,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MetaEntity,
  type MiroirConfigClient,
  type SpecificLoggerOptionsMap,
  ConfigurationService,
  type SelfApplication,
  miroirFundamentalMlSchema,
  type EndpointDefinition,
  type MlSchema,
  defaultSelfApplicationDeploymentMap,
} from "miroir-core";
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
  endpointDocument,
  getDefaultLibraryModelEnvironmentDEFUNCT,
} from "miroir-example-library";
import { callMcpToolViaHttp } from './mcpClient.js';
import { startMcpTestPlatform } from './mcpTestPlatform.js';
import { MiroirMcpServer, setupMcpServer } from "../../src/mcpServer.js";
import { EndpointToolRegistry } from "../../src/tools/EndpointToolRegistry.js";

import { defaultMiroirMetaModel } from "miroir-app-miroir";
import { deployment_Miroir } from 'miroir-app-admin';
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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const applicationDeploymentMapWithLibrary: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

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
      // // book3 as EntityInstance,
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
let mcpServer: MiroirMcpServer;
let httpServer: any;
let mcpServerUrl: string;

const globalTimeOut = 60000;

/**
 * Run MCP tests via HTTP transport
 * Calls the actual MCP server running on the specified URL
 */
export async function runMcpTestsViaHttp(
  mcpTest: McpToolTest,
  serverUrl: string,
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

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

describe("MCP Tools Integration Tests", () => {
  // ##############################################################################################
  beforeAll(async () => {
    const platform = await startMcpTestPlatform(expect, loggerOptions);
    domainController = platform.domainController;
    localCache = domainController.getLocalCache();
    applicationDeploymentMap = platform.applicationDeploymentMap;

    // Self-contained MCP server: the registry-backed server runs in-process on an
    // ephemeral port, no external MCP server needs to be running for these tests.
    const app: Express = express();
    const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
    mcpServer = await setupMcpServer(app, applicationDeploymentMap, registry, domainController);
    await new Promise<void>((resolve) => {
      httpServer = app.listen(0, () => resolve());
    });
    mcpServerUrl = `http://localhost:${httpServer.address().port}`;

    log.info(`MCP test setup completed, in-process MCP server listening on ${mcpServerUrl}`);
  }, globalTimeOut);

  // ##############################################################################################
  beforeEach(async () => {
    // Reset Miroir deployment to clean state before each test
    await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
      deployment_Miroir as Deployment,
    ]);

    const createLibraryAction = resetAndinitializeDeploymentCompositeAction(
      selfApplicationLibrary.uuid,
      deployment_Library_DO_NO_USE.uuid,
      {
        dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationLibrary as SelfApplication,
        applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
        applicationVersion: selfApplicationVersionLibraryInitialVersion,
      },
      libraryEntitiesAndInstancesWithoutBook3,
      defaultLibraryModelEnvironment.currentModel as any,
    );
    const beforeEachResult = await domainController.handleCompositeAction(
      createLibraryAction,
      applicationDeploymentMapWithLibrary,
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
      applicationDeploymentMapWithLibrary,
      defaultMiroirModelEnvironment,
    );

    if (refreshLibrary.status !== "ok") {
      throw new Error(
        `Failed to open stores for application ${selfApplicationLibrary.uuid}: ${JSON.stringify(refreshLibrary)}`
      );
    }
  });

  // ##############################################################################################
  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
    log.info("MCP test teardown completed");
  });

  describe(
    "MCP Tool Handlers via HTTP - All Tests",
    () => {
      it.each(ALL_MCP_TEST_CASES.map(test => [test.testName, test]))(
        "test %s (via HTTP)",
        async (currentTestSuiteName, testAction: McpToolTest) => {
          const testSuiteResults = await runMcpTestsViaHttp(
            testAction,
            mcpServerUrl,
          );
        },
        globalTimeOut
      );
    } //  end describe('MCP Tool Handlers via HTTP - All Tests',
  );
  
});
