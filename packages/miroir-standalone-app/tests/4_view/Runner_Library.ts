import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  emptyApplicationModel,
  formatYYYYMMDD_HHMMSS,
  getMiroirConfig,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  testBuildPlusRuntimeCompositeActionSuiteForRunner,
  type DomainControllerInterface,
  type LoggerInterface,
  type LoggerOptions,
  type Menu,
  type MiroirConfigClient,
  type Runner,
  type StoreUnitConfiguration
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  runnerCreateEntity,
  runnerDeployApplication,
  runnerDropApplication,
  runnerDropEntity,
} from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../../src/loglevelnextImporter";
import { runTestOrTestSuite } from "../../src/miroir-fwk/4-tests/tests-utils";
import { miroirAppStartup } from "../../src/startup";
import { loadTestConfigFiles } from "../utils/fileTools";

import { adminSelfApplication, entityApplicationForAdmin, entityDeployment } from "miroir-test-app_deployment-admin";
import { book1, defaultLibraryAppModel, deployment_Library_DO_NO_USE, entityAuthor, entityDefinitionAuthor, entityLendingHistoryItem, lendDocument, menuDefaultLibrary, selfApplicationLibrary, user1 } from "miroir-test-app_deployment-library";
import simplifiedLibraryData from "../assets/library_extract/simplified-library-data.json";
import simplifiedLibraryModel from "../assets/library_extract/simplified-library-model.json";
import {
  afterAllTests,
  beforeAllTests,
  beforeEachTest,
  getTestConfig,
  testApplicationStorageConfiguration,
  type RunnerTestParams,
} from "./RunnerIntegTestTools";
import { start } from "repl";

// ################################################################################################
const pageLabel = "Runner_Miroir.integ.test";

export const libraryTestIdentifiers = {
  testApplicationUuid: selfApplicationLibrary.uuid,
  testApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  testApplicationName: selfApplicationLibrary.name,
  installTestApplicationUuid: selfApplicationLibrary.uuid,
  installTestApplicationDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
  installTestApplicationName: selfApplicationLibrary.name,
}

let miroirConfig: any;

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
miroirConfig = miroirConfigParam;

const {
  applicationDeploymentMap,
  miroirDeploymentStorageConfiguration,
  adminDeploymentStorageConfiguration,
  adminDeployment,
  libraryDeploymentStorageConfiguration,
} = getTestConfig(
  miroirConfig,
  libraryTestIdentifiers.testApplicationDeploymentUuid,
  libraryTestIdentifiers.testApplicationName,
  libraryTestIdentifiers.testApplicationUuid,
);
const installTestDeploymentStorageConfiguration: StoreUnitConfiguration = testApplicationStorageConfiguration(
  libraryDeploymentStorageConfiguration,
  libraryTestIdentifiers.installTestApplicationName,
);
const installInternalMiroirConfig = getMiroirConfig(
  miroirConfig,
  installTestDeploymentStorageConfiguration,
  libraryTestIdentifiers.installTestApplicationDeploymentUuid,
);

export const libraryLendBookRunnerTest: RunnerTestParams = {
    pageLabel,
    testCompositeActionLabel: "Lend Book Test Composite Action",
    runner: lendDocument as unknown as Runner,
    testApplicationUuid: libraryTestIdentifiers.testApplicationUuid,
    testApplicationDeploymentUuid: libraryTestIdentifiers.testApplicationDeploymentUuid,
    testApplicationName: libraryTestIdentifiers.testApplicationName,
    testParams: {
      // ["createEntity"]: {
      //   // used by the preRunnerCompositeAction to create the entity before dropping it
      //   application: testApplicationUuid,
      //   entity: entityAuthor,
      //   entityDefinition: entityDefinitionAuthor,
      //   addDefaultReports: false,
      //   addMenuLink: false,
      // },
      [lendDocument.name]: {
        // application: testApplicationUuid,
        // entity: entityAuthor.uuid,
        user: user1.uuid,
        book: book1.uuid,
        startDate: new Date("2024-01-01"),
      },
    }, // testParams
    // preRunnerCompositeActions: [runnerCreateEntity.definition.actionTemplate as any], // preRunnerCompositeActions: create the entity before dropping it
    preRunnerCompositeActions: [], // preRunnerCompositeActions: create the entity before dropping it
    preTestCompositeActions: [
      {
        // performs query on local cache for emulated server, and on server for remote server
        actionType: "compositeRunBoxedQueryAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        actionLabel: "fetchLendingHistory",
        nameGivenToResult: "LendingHistoryList",
        payload: {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: libraryTestIdentifiers.testApplicationUuid,
            applicationSection: "data",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: libraryTestIdentifiers.testApplicationUuid,
              pageParams: { 
                currentDeploymentUuid: libraryTestIdentifiers.testApplicationDeploymentUuid,
              },
              extractors: {
                items: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "data",
                  parentName: entityLendingHistoryItem.name,
                  parentUuid: entityLendingHistoryItem.uuid,
                  orderBy: {
                    attributeName: "name",
                    direction: "ASC",
                  },
                },
              },
            },
          },
        },
      },
    ], // preTestCompositeActions
    testCompositeActionAssertions: [
      {
        actionType: "compositeRunTestAssertion",
        actionLabel: "checkNumberOfLendingHistoryItems",
        nameGivenToResult: "checkNumberOfLendingHistoryItems",
        testAssertion: {
          testType: "testAssertion",
          testLabel: "checkNumberOfLendingHistoryItems",
          definition: {
            resultAccessPath: ["0"],
            resultTransformer: {
              transformerType: "aggregate",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["LendingHistoryList", "items"],
              },
            },
            expectedValue: { aggregate: 1 },
          },
        },
      },
      // {
      //   actionType: "compositeRunTestAssertion",
      //   actionLabel: "checkEntityList",
      //   nameGivenToResult: "checkEntityList",
      //   testAssertion: {
      //     testType: "testAssertion",
      //     testLabel: "checkEntityList",
      //     definition: {
      //       resultAccessPath: ["libraryEntityList", "entities"],
      //       ignoreAttributes: ["author", "storageAccess"],
      //       expectedValue: [],
      //     },
      //   },
      // },
    ],
    internalMiroirConfig: installInternalMiroirConfig,
    adminDeployment,
    testDeploymentStorageConfiguration: installTestDeploymentStorageConfiguration,
    initialModel: defaultLibraryAppModel,
    // initialModel: {
    //   applicationUuid: "",
    //   applicationName: "",
    //   applications: [],
    //   applicationVersions: [],
    //   applicationVersionCrossEntityDefinition: [],
    //   endpoints: [],
    //   entities: [],
    //   entityDefinitions: [],
    //   jzodSchemas: [],
    //   menus: [ menuDefaultLibrary as Menu ],
    //   reports: [],
    //   runners: [],
    //   storedQueries: [],
    //   themes: [],
    // },
  };
