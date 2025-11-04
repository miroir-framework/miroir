import * as vitest from 'vitest';
// import { describe, expect } from 'vitest';

import { v4 as uuidv4 } from "uuid";

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  ConfigurationService,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityPublisher,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  JzodObject,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  resetAndInitApplicationDeployment,
  SelfApplicationDeploymentConfiguration,
  selfApplicationDeploymentMiroir,
  StoreUnitConfiguration,
  Uuid
} from "miroir-core";


// import { packageName } from 'miroir-core';
// import { AdminApplicationDeploymentConfiguration } from 'miroir-core/src/0_interfaces/1_core/StorageConfiguration.js';
import {
  AdminApplicationDeploymentConfiguration,
  InitApplicationParameters,
  LocalCacheInterface,
  LoggerOptions,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from '../../src/startup.js';
import {
  createDeploymentCompositeAction,
  deleteAndCloseApplicationDeployments,
  resetAndinitializeDeploymentCompositeAction,
  runTestOrTestSuite,
  setupMiroirTest,
} from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { cleanLevel, packageName } from './constants.js';
import {
  testOnLibrary_deleteLibraryDeployment,
  testOnLibrary_resetLibraryDeployment,
} from "../../src/miroir-fwk/4-tests/tests-utils-testOnLibrary.js";
import { CompositeActionTemplate } from 'miroir-core';
import { TransactionalInstanceAction } from 'miroir-core';
import { CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction } from 'miroir-core';
import { CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction, transformer } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import { entityReport } from 'miroir-core';
import { displayTestSuiteResultsDetails } from 'miroir-core';
import { runTransformerTestSuite } from 'miroir-core';
import { TransformerForBuildOrRuntime } from 'miroir-core';
import { entityMenu } from 'miroir-core';
import { loadTestConfigFiles } from '../utils/fileTools.js';
import { TestCompositeActionParams } from 'miroir-core';

let domainController: DomainControllerInterface | undefined = undefined;
let localCache: LocalCacheInterface | undefined = undefined;
// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
// let globalTestSuiteResults: TestSuiteResult = {};


const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const RUN_TEST= process.env.RUN_TEST

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
const fileName = "DomainNewController.integ.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig:any;
let loggerOptions:LoggerOptions;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

const {miroirConfig: miroirConfigParam, logConfig} = await loadTestConfigFiles(env)
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const miroirStoreUnitConfigurationForTest: StoreUnitConfiguration = {
  "admin": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_admin"
  },
  "model": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_model"
  },
  "data": {
    "emulatedServerType": "filesystem",
    "directory":"./tests/tmp/miroir_data"
  }
}

const typedAdminConfigurationDeploymentMiroir = {
  ...adminConfigurationDeploymentMiroir,
  configuration: miroirStoreUnitConfigurationForTest,
} as AdminApplicationDeploymentConfiguration;

// ################################################################################################
// beforeAll(
const beforeAll = async () => {
  const {
    persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
    domainController: localdomainController,
    localCache: locallocalCache,
    miroirContext: localmiroirContext,
  } = await setupMiroirTest(miroirConfig);

  persistenceStoreControllerManager = localpersistenceStoreControllerManager;
  domainController = localdomainController;
  localCache = locallocalCache;
  miroirContext = localmiroirContext;

  const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
    typedAdminConfigurationDeploymentMiroir.uuid,
    typedAdminConfigurationDeploymentMiroir.configuration,
  );
  const createDeploymentResult = await domainController.handleCompositeAction(
    createMiroirDeploymentCompositeAction,
    defaultMiroirMetaModel
  );
  if (createDeploymentResult.status !== "ok") {
    throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
  }

  return Promise.resolve();
}

// ################################################################################################
// beforeEach(
const beforeEach = async  () => {
  if (!domainController) {
    throw new Error("beforeEach DomainController is not initialized");
  }
  await resetAndInitApplicationDeployment(domainController, [
    selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
  ]);
  document.body.innerHTML = '';
}

// // ################################################################################################
// afterEach(
//   async () => {
//   }
// )

// ################################################################################################
afterAll(
  async () => {
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    // await deleteAndCloseApplicationDeployments(
    //   miroirConfig,
    //   domainController,
    //   [
    //     typedAdminConfigurationDeploymentMiroir
    //   ],
    // );
    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")

    // console.log("globalTestSuiteResults:\n", Object.values(globalTestSuiteResults).map((r) => "\"" + r.testLabel + "\": " + r.testResult).join("\n"));
    displayTestSuiteResultsDetails(expect,Object.keys(testTemplateSuitesDEFUNCT!!!)[0]);
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

const testSuiteName: string = "applicative.Library.Template.integ.test";

const libraryEntitesAndInstances = [
  {
    entity: entityAuthor as MetaEntity,
    entityDefinition: entityDefinitionAuthor as EntityDefinition,
    instances: [
      author1,
      author2,
      author3 as EntityInstance,
    ]
  },
  {
    entity: entityBook as MetaEntity,
    entityDefinition: entityDefinitionBook as EntityDefinition,
    instances: [
      book1 as EntityInstance,
      book2 as EntityInstance,
      book3 as EntityInstance,
      book4 as EntityInstance,
      book5 as EntityInstance,
      book6 as EntityInstance,
    ]
  },
  {
    entity: entityPublisher as MetaEntity,
    entityDefinition: entityDefinitionPublisher as EntityDefinition,
    instances: [
      publisher1 as EntityInstance,
      publisher2 as EntityInstance,
      publisher3 as EntityInstance,
    ]
  }
];

const  testSelfApplicationUuid: Uuid = uuidv4();
const  testAdminConfigurationDeploymentUuid: Uuid = uuidv4();
const  testApplicationModelBranchUuid: Uuid = uuidv4();
const  testApplicationVersionUuid: Uuid = uuidv4();

const testDeploymentStorageConfiguration: StoreUnitConfiguration = getBasicStoreUnitConfiguration(
  "test",
  {
    emulatedServerType: "sql",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  }
)

const initParametersForTest:InitApplicationParameters = getBasicApplicationConfiguration(
  "Test",
  testSelfApplicationUuid,
  testAdminConfigurationDeploymentUuid,
  testApplicationModelBranchUuid,
  testApplicationVersionUuid,
)

const newEntityUuid: Uuid = uuidv4();
const newEntityName: string = "newEntityTest";
const createEntity_newEntityDescription: string = "a new entity for testing";
const newEntityDefinitionUuid: Uuid = uuidv4();

const createEntity_newEntityDetailsReportUuid = uuidv4();
const createEntity_newEntityListReportUuid = uuidv4();

const defaultInstanceDetailsReportUuid: Uuid = uuidv4();

// const newEntity: MetaEntity = {
//   uuid: newEntityUuid,
//   parentUuid: entityEntity.uuid,
//   selfApplication: testSelfApplicationUuid,
//   description: createEntity_newEntityDescription,
//   name: newEntityName,
// }

const fileData: {[k: string]: any}[] = [
  { a: "iso3166-1Alpha-2", b: "iso3166-1Alpha-3", c: "Name" },
  { a: "US", b: "USA", c: "United States" },
  { a: "DE", b: "DEU", c: "Germany" },
];
const newEntityJzodSchema:JzodObject = {
  type: "object",
  definition: Object.assign(
    {},
    {
      uuid: {
        type: "string",
        validations: [{ type: "uuid" }],
        tag: { id: 1, defaultLabel: "Uuid", editable: false },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { id: 2, defaultLabel: "Uuid", editable: false },
      },
      parentUuid: {
        type: "string",
        validations: [{ type: "uuid" }],
        tag: { id: 3, defaultLabel: "parentUuid", editable: false },
      },
    },
    ...(
      fileData[0]?
      Object.values(fileData[0]).map(
        (a: string, index) => (
          {
            [a]: {
              type: "string",
              // optional: true,
              // tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
            },
          }
        )
      )
      : []
    )
  ),
};

// const createReportsCompositeActionTemplate: TransactionalInstanceAction = {

const newEntityListReport = {
  uuid: createEntity_newEntityListReportUuid,
  selfApplication: testSelfApplicationUuid,
  parentName: "Report",
  parentUuid: entityReport.uuid,
  conceptLevel: "Model",
  name: `${newEntityName}List`,
  defaultLabel: `List of ${newEntityName}s`,
  type: "list",
  definition: {
    extractors: {
      instanceList: {
        extractorOrCombinerType: "extractorByEntityReturningObjectList",
        parentName: newEntityName,
        parentUuid: newEntityUuid,
      },
    },
    section: {
      type: "objectListReportSection",
      definition: {
        label: `${newEntityName}s`,
        parentUuid: newEntityUuid,
        fetchedDataReference: "instanceList",
      },
    },
  },
};

const newEntityDetailsReport = {
  uuid: createEntity_newEntityDetailsReportUuid,
  selfApplication: testSelfApplicationUuid,
  parentName: entityReport.name,
  parentUuid: entityReport.uuid,
  conceptLevel: "Model",
  name: `${newEntityName}Details`,
  defaultLabel: `Details of ${newEntityName}`,
  definition: {
    extractorTemplates: {
      elementToDisplay: {
        extractorTemplateType: "extractorForObjectByDirectReference",
        parentName: newEntityName,
        parentUuid: newEntityUuid,
        instanceUuid: {
          transformerType: "getFromContext",
          interpolation: "runtime",
          referenceName: "instanceUuid",
        },
      },
    },
    section: {
      type: "list",
      definition: [
        {
          type: "objectInstanceReportSection",
          definition: {
            label: `My ${newEntityName}`,
            parentUuid: newEntityUuid,
            fetchedDataReference: "elementToDisplay",
          },
        },
      ],
    },
  },
};

const createEntityCompositeActionTemplate: CompositeActionTemplate = {
  actionType: "compositeAction",
  actionLabel: "createEntityCompositeActionTemplate",
  actionName: "sequence",
  templates: {
    // all
    testAdminConfigurationDeploymentUuid,
    // createEntity
    newEntityName,
    newEntityUuid,
    newEntityDefinitionUuid,
    testSelfApplicationUuid,
    defaultInstanceDetailsReportUuid,
    createEntity_newEntityDescription,
    createEntity_newEntity: {
      uuid: {
        transformerType: "getFromContext",
        referenceName: "newEntityUuid",
      },
      parentUuid: entityEntity.uuid,
      selfApplication: {
        transformerType: "getFromContext",
        referenceName: "testSelfApplicationUuid",
      },
      description: {
        transformerType: "getFromContext",
        referenceName: "createEntity_newEntityDescription",
      },
      name: {
        transformerType: "getFromContext",
        referenceName: "newEntityName",
      },
    },
    spreadsheetContents: fileData,
    newEntityJzodSchema: {
      transformerType: "spreadSheetToJzodSchema",
      interpolation: "runtime",
      spreadsheetContents: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "spreadsheetContents",
      },
    },
    // report creation
    entityReport,
    createEntity_newEntityListReportUuid,
    createEntity_newEntityDetailsReportUuid,
    createEntity_newEntityDefinition: {
      name: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "newEntityName",
      },
      uuid: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "newEntityDefinitionUuid",
      },
      parentName: "EntityDefinition",
      parentUuid: entityEntityDefinition.uuid,
      entityUuid: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referencePath: ["createEntity_newEntity", "uuid"],
      },
      conceptLevel: "Model",
      defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
      jzodSchema: {
        transformerType: "getFromContext",
        interpolation: "runtime",
        referenceName: "newEntityJzodSchema",
      },
    },
    // newEntityListReport: {
    //   uuid: {
    //     transformerType: "getFromContext",
    //     interpolation: "runtime",
    //     referenceName: "createEntity_newEntityListReportUuid",
    //   },
    //   selfApplication: {
    //     transformerType: "getFromContext",
    //     interpolation: "runtime",
    //     referenceName: "testSelfApplicationUuid",
    //   },
    //   parentName: "Report",
    //   parentUuid: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "{{entityReport.uuid}}",
    //   },
    //   conceptLevel: "Model",
    //   name: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "{{newEntityName}}List",
    //   },
    //   defaultLabel: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "List of {{newEntityName}}s",
    //   },
    //   type: "list",
    //   definition: {
    //     extractors: {
    //       instanceList: {
    //         extractorOrCombinerType: "extractorByEntityReturningObjectList",
    //         parentName: {
    //           transformerType: "getFromContext",
    //           interpolation: "runtime",
    //           referenceName: "newEntityName",
    //         },
    //         parentUuid: {
    //           transformerType: "mustacheStringTemplate",
    //           interpolation: "runtime",
    //           definition: "{{createEntity_newEntity.uuid}}",
    //         },
    //       },
    //     },
    //     section: {
    //       type: "objectListReportSection",
    //       definition: {
    //         label: {
    //           transformerType: "mustacheStringTemplate",
    //           interpolation: "runtime",
    //           definition: "{{newEntityName}}s",
    //         },
    //         parentUuid: {
    //           transformerType: "mustacheStringTemplate",
    //           interpolation: "runtime",
    //           definition: "{{createEntity_newEntity.uuid}}",
    //         },
    //         fetchedDataReference: "instanceList",
    //       },
    //     },
    //   },
    // },
    // // Details of an instance Report Definition
    // newEntityDetailsReport: {
    //   uuid: {
    //     transformerType: "getFromContext",
    //     interpolation: "runtime",
    //     referenceName: "createEntity_newEntityDetailsReportUuid",
    //   },
    //   selfApplication: {
    //     transformerType: "getFromContext",
    //     interpolation: "runtime",
    //     referenceName: "testSelfApplicationUuid",
    //   },
    //   parentName: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "{{entityReport.name}}",
    //   },
    //   parentUuid: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "{{entityReport.uuid}}",
    //   },
    //   conceptLevel: "Model",
    //   name: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "{{newEntityName}}Details",
    //   },
    //   defaultLabel: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "runtime",
    //     definition: "Details of {{newEntityName}}",
    //   },
    //   definition: {
    //     extractorTemplates: {
    //       elementToDisplay: {
    //         transformerType: "returnValue",
    //         interpolation: "runtime",
    //         value: {
    //           extractorTemplateType: "extractorForObjectByDirectReference",
    //           parentName: {
    //             transformerType: "getFromContext",
    //             interpolation: "runtime",
    //             referenceName: "newEntityName",
    //           },
    //           parentUuid: {
    //             transformerType: "mustacheStringTemplate",
    //             interpolation: "runtime",
    //             definition: "{{newEntityUuid}}",
    //           },
    //           instanceUuid: {
    //             transformerType: "constantObject",
    //             value: {
    //               transformerType: "getFromContext",
    //               interpolation: "runtime",
    //               referenceName: "instanceUuid",
    //             },
    //           },
    //         },
    //       },
    //     },
    //     section: {
    //       type: "list",
    //       definition: [
    //         {
    //           type: "objectInstanceReportSection",
    //           definition: {
    //             label: {
    //               transformerType: "mustacheStringTemplate",
    //               interpolation: "runtime",
    //               definition: "My {{newEntityName}}",
    //             },
    //             parentUuid: {
    //               transformerType: "mustacheStringTemplate",
    //               interpolation: "runtime",
    //               definition: "{{newEntityUuid}}",
    //             },
    //             fetchedDataReference: "elementToDisplay",
    //           },
    //         },
    //       ],
    //     },
    //   },
    // },
    // menu update
    entityMenu,
  },
  definition: [
    // createEntity
    {
      // actionType: "modelAction",
      actionType: "createEntity",
      actionLabel: "createEntity",
      deploymentUuid: {
        transformerType: "parameterReference",
        interpolation: "build",
        referenceName: "testAdminConfigurationDeploymentUuid",
      },
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        entities: [
          {
            entity: {
              transformerType: "parameterReference",
              interpolation: "build",
              referenceName: "createEntity_newEntity",
            },
            entityDefinition: {
              transformerType: "parameterReference",
              interpolation: "build",
              referenceName: "createEntity_newEntityDefinition",
            },
          },
        ],
      }
    },
  ],
};
// const createEntityCompositeActionTemplatePrepActions: CompositeActionTemplate["definition"] = [
const createEntityCompositeActionTemplatePrepActions: any[] = [
  // test preparation: newApplicationEntityDefinitionList
  {
    actionType: "compositeRunBoxedExtractorOrQueryAction",
    actionLabel: "getListOfEntityDefinitions",
    nameGivenToResult: "newApplicationEntityDefinitionList",
    query: {
      actionType: "runBoxedExtractorOrQueryAction",
      actionName: "runQuery",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
      deploymentUuid: {
        transformerType: "parameterReference",
        interpolation: "build",
        referenceName: "testAdminConfigurationDeploymentUuid",
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: {
          transformerType: "parameterReference",
          interpolation: "build",
          referenceName: "testAdminConfigurationDeploymentUuid",
        },
        pageParams: {
          currentDeploymentUuid: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "testAdminConfigurationDeploymentUuid",
          },
        },
        queryParams: {},
        contextResults: {},
        extractors: {
          entityDefinitions: {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            applicationSection: "model",
            parentName: entityEntityDefinition.name,
            parentUuid: entityEntityDefinition.uuid,
            orderBy: {
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
  // test preparation: newApplicationEntityList
  {
    actionType: "compositeRunBoxedExtractorOrQueryAction",
    actionLabel: "getListOfEntities",
    nameGivenToResult: "newApplicationEntityList",
    query: {
      actionType: "runBoxedExtractorOrQueryAction",
      actionName: "runQuery",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
      deploymentUuid: {
        transformerType: "parameterReference",
        interpolation: "build",
        referenceName: "testAdminConfigurationDeploymentUuid",
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: {
          transformerType: "parameterReference",
          interpolation: "build",
          referenceName: "testAdminConfigurationDeploymentUuid",
        },
        pageParams: {
          currentDeploymentUuid: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "testAdminConfigurationDeploymentUuid",
          },
        },
        queryParams: {},
        contextResults: {},
        extractors: {
          entities: {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            applicationSection: "model",
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
            orderBy: {
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
];
const createEntityCompositeActionTemplateAssertions = [
  // check entities
  {
    actionType: "compositeRunTestAssertion",
    actionLabel: "checkEntities",
    nameGivenToResult: "checkEntityList",
    testAssertion: {
      testType: "testAssertion",
      testLabel: "checkEntities",
      definition: {
        resultAccessPath: ["newApplicationEntityList", "entities"],
        ignoreAttributes: ["author"],
        expectedValue: [
          // newEntity,
          {
            uuid: newEntityUuid,
            parentUuid: entityEntity.uuid,
            selfApplication: testSelfApplicationUuid,
            description: createEntity_newEntityDescription,
            name: newEntityName,
          },
        ],
      },
    },
  },
  // check entity definitions
  {
    actionType: "compositeRunTestAssertion",
    actionLabel: "checkEntityDefinitions",
    nameGivenToResult: "checkEntityDefinitionList",
    testAssertion: {
      testType: "testAssertion",
      testLabel: "checkEntityDefinitions", // TODO: index testCompositeActionAssertions in an object, ensuring unique keys
      definition: {
        resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
        ignoreAttributes: ["author"],
        expectedValue: [
          // newEntityDefinition,
          {
            name: newEntityName,
            uuid: newEntityDefinitionUuid,
            parentName: "EntityDefinition",
            parentUuid: entityEntityDefinition.uuid,
            entityUuid: newEntityUuid,
            conceptLevel: "Model",
            defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
            jzodSchema: newEntityJzodSchema,
          },
          // {
          //   transformerType: "parameterReference",
          //   referenceName: "createEntity_newEntityDefinition",
          // },
        ],
      },
    },
  },
];

// ##############################################################################################
const createReportsCompositeActionTemplate: CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction = {
  actionType: "transactionalInstanceAction",
  actionLabel: "createReports",
  instanceAction: {
    actionType: "instanceAction",
    actionName: "createInstance",
    applicationSection: "model",
    deploymentUuid: {
      transformerType: "parameterReference",
      interpolation: "build",
      referenceName: "testAdminConfigurationDeploymentUuid",
    },
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: [
      {
        parentName: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "{{newEntityListReport.parentName}}",
        },
        parentUuid: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "{{newEntityListReport.parentUuid}}",
        },
        applicationSection: "model",
        instances: [
          // List of new entity instances Report Definition
          {
            uuid: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "createEntity_newEntityListReportUuid",
            },
            selfApplication: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testSelfApplicationUuid",
            },
            parentName: "Report",
            parentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{entityReport.uuid}}",
            },
            conceptLevel: "Model",
            name: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{newEntityName}}List",
            },
            defaultLabel: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "List of {{newEntityName}}s",
            },
            type: "list",
            definition: {
              extractors: {
                instanceList: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  parentName: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referenceName: "newEntityName",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "runtime",
                    definition: "{{createEntity_newEntity.uuid}}",
                  },
                },
              },
              section: {
                type: "objectListReportSection",
                definition: {
                  label: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "runtime",
                    definition: "{{newEntityName}}s",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "runtime",
                    definition: "{{createEntity_newEntity.uuid}}",
                  },
                  fetchedDataReference: "instanceList",
                },
              },
            },
          },
          // Details of an entity instance Report Definition
          {
            uuid: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "createEntity_newEntityDetailsReportUuid",
            },
            selfApplication: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testSelfApplicationUuid",
            },
            parentName: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{entityReport.name}}",
            },
            parentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{entityReport.uuid}}",
            },
            conceptLevel: "Model",
            name: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{newEntityName}}Details",
            },
            defaultLabel: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "Details of {{newEntityName}}",
            },
            definition: {
              extractorTemplates: {
                elementToDisplay: {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  value: {
                    extractorTemplateType: "extractorForObjectByDirectReference",
                    parentName: {
                      transformerType: "getFromContext",
                      interpolation: "runtime",
                      referenceName: "newEntityName",
                    },
                    parentUuid: {
                      transformerType: "mustacheStringTemplate",
                      interpolation: "runtime",
                      definition: "{{newEntityUuid}}",
                    },
                    instanceUuid: {
                      transformerType: "constantObject",
                      value: {
                        transformerType: "getFromContext",
                        interpolation: "runtime",
                        referenceName: "instanceUuid",
                      },
                    },
                  },
                },
              },
              section: {
                type: "list",
                definition: [
                  {
                    type: "objectInstanceReportSection",
                    definition: {
                      label: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "runtime",
                        definition: "My {{newEntityName}}",
                      },
                      parentUuid: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "runtime",
                        definition: "{{newEntityUuid}}",
                      },
                      fetchedDataReference: "elementToDisplay",
                    },
                  },
                ],
              },
            },
          },
          // {
          //   transformerType: "parameterReference",
          //   interpolation: "build",
          //   referenceName: "newEntityListReport",
          // },
          // {
          //   transformerType: "parameterReference",
          //   interpolation: "build",
          //   referenceName: "newEntityDetailsReport",
          // },
        ],
      },
    ],
  } as any as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceCUDAction,
};

const createReportsCompositeActionPrepActions: any[] = [
  // test preparation: newApplicationReportList
  {
    actionType: "compositeRunBoxedExtractorOrQueryAction",
    actionLabel: "getListOfReports",
    nameGivenToResult: "newApplicationReportList",
    query: {
      actionType: "runBoxedExtractorOrQueryAction",
      actionName: "runQuery",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
      deploymentUuid: {
        transformerType: "parameterReference",
        interpolation: "build",
        referenceName: "testAdminConfigurationDeploymentUuid",
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: {
          transformerType: "parameterReference",
          interpolation: "build",
          referenceName: "testAdminConfigurationDeploymentUuid",
        },
        pageParams: {
          currentDeploymentUuid: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "testAdminConfigurationDeploymentUuid",
          },
        },
        runAsSql: true,
        queryParams: {},
        contextResults: {},
        extractors: {
          reports: {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            applicationSection: "model",
            parentName: entityReport.name,
            parentUuid: entityReport.uuid,
            orderBy: {
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
  // test preparation: newReportList
  {
    actionType: "compositeRunBoxedExtractorOrQueryAction",
    actionLabel: "fetchNewApplicationEntityList",
    nameGivenToResult: "newApplicationEntityList",
    query: {
      actionType: "runBoxedExtractorOrQueryAction",
      actionLabel: "getListOfEntities",
      actionName: "runQuery",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      applicationSection: "model", // TODO: give only selfApplication section in individual queries?
      deploymentUuid: {
        transformerType: "parameterReference",
        interpolation: "build",
        referenceName: "testAdminConfigurationDeploymentUuid",
      },
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",

        deploymentUuid: {
          transformerType: "parameterReference",
          interpolation: "build",
          referenceName: "testAdminConfigurationDeploymentUuid",
        },
        pageParams: {
          currentDeploymentUuid: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "testAdminConfigurationDeploymentUuid",
          },
        },
        queryParams: {},
        contextResults: {},
        extractors: {
          entities: {
            extractorOrCombinerType: "extractorByEntityReturningObjectList",
            applicationSection: "model",
            parentName: entityReport.name,
            parentUuid: entityReport.uuid,
            orderBy: {
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
]


const createReportsCompositeActionTemplateAssertions = [
  {
    actionType: "compositeRunTestAssertion",
    actionLabel: "checkReports",
    nameGivenToResult: "checkReportList",
    testAssertion: {
      testType: "testAssertion",
      testLabel: "checkReports",
      definition: {
        resultAccessPath: ["newApplicationReportList", "reports"],
        ignoreAttributes: ["author"],
        expectedValue: [newEntityDetailsReport, newEntityListReport],
      },
    },
  },
];

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
const testTemplateSuitesDEFUNCT: Record<string, TestCompositeActionParams> = {
  [testSuiteName]: {
    testActionType: "testCompositeActionTemplateSuite",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    testActionLabel: "applicative.Library.integ.test",
    testCompositeActionSuite: {
      testType: "testCompositeActionTemplateSuite",
      testLabel: "applicative.Library.integ.test",
      beforeAll: createDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        testDeploymentStorageConfiguration
      ),
      beforeEach: resetAndinitializeDeploymentCompositeAction(
        testAdminConfigurationDeploymentUuid,
        initParametersForTest,
        // libraryEntitesAndInstances
        []
      ),
      // afterEach: testOnLibrary_resetLibraryDeployment(
      //   miroirConfig,
      //   testAdminConfigurationDeploymentUuid
      // ),
      // afterAll: testOnLibrary_deleteLibraryDeployment(miroirConfig, testAdminConfigurationDeploymentUuid),
      testCompositeActions: {
        // "create new Entity from spreadsheet": {
        //   testType: "testCompositeActionTemplate",
        //   testLabel: "createEntityFromSpreadsheet",
        //   compositeActionTemplate: {
        //     actionType: "compositeAction",
        //     actionLabel: "selectEntityEntity",
        //     actionName: "sequence",
        //     templates: createEntityCompositeActionTemplate.templates,
        //     definition: [
        //       ...((createEntityCompositeActionTemplate as any).definition),
        //       ...createEntityCompositeActionTemplatePrepActions,
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     ...createEntityCompositeActionTemplateAssertions,
        //   ],
        // },
        "create new Entity and reports from spreadsheet": {
          testType: "testCompositeActionTemplate",
          testLabel: "createEntityAndReportFromSpreadsheet",
          compositeActionTemplate: {
            actionType: "compositeAction",
            actionLabel: "createEntityAndReportFromSpreadsheet",
            actionName: "sequence",
            templates: createEntityCompositeActionTemplate.templates,
            definition: [
              // ...(createEntityCompositeActionTemplate as any).definition,
              createReportsCompositeActionTemplate,
              // commit
              {
                // actionType: "modelAction",
                actionType: "commit",
                actionLabel: "commit",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid: {
                  transformerType: "parameterReference",
                  interpolation: "build",
                  referenceName: "testAdminConfigurationDeploymentUuid",
                },
              },
              // ...createEntityCompositeActionTemplatePrepActions,
              ...createReportsCompositeActionPrepActions,
            ],
          },
          testCompositeActionAssertions: [
            // ...createEntityCompositeActionTemplateAssertions,
            ...createReportsCompositeActionTemplateAssertions,
            // // check reports
            // {
            //   actionType: "compositeRunTestAssertion",
            //   actionLabel: "checkReports",
            //   nameGivenToResult: "checkReportList",
            //   testAssertion: {
            //     testType: "testAssertion",
            //     testLabel: "checkReports",
            //     definition: {
            //       resultAccessPath: ["newApplicationReportList", "reports"],
            //       ignoreAttributes: ["author"],
            //       expectedValue: [newEntityDetailsReport, newEntityListReport],
            //     },
            //   },
            // },
          ],
        },
        // "create new Entity and reports from spreadsheet and update Menu": {
        //   testType: "testCompositeActionTemplate",
        //   testLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
        //   compositeActionTemplate: {
        //     actionType: "compositeAction",
        //     actionLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
        //     actionName: "sequence",
        //     templates: createEntityCompositeActionTemplate.templates,
        //     definition: [
        //       ...(createEntityCompositeActionTemplate as any).definition,
        //       createReportsCompositeActionTemplate,
        //       // commit
        //       {
        //         actionType: "modelAction",
        //         actionName: "commit",
        //         actionLabel: "commit",
        //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //         deploymentUuid: {
        //           transformerType: "parameterReference",
        //           interpolation: "build",
        //           referenceName: "testAdminConfigurationDeploymentUuid",
        //         },
        //       },
        //       ...createReportsCompositeActionTemplatePrepActions,
        //       ...createEntityCompositeActionTemplatePrepActions,
        //       // rollback / refresh
        //       {
        //         actionName: "rollback",
        //         actionType: "modelAction",
        //         actionLabel: "rollback",
        //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //         deploymentUuid: {
        //           transformerType: "parameterReference",
        //           interpolation: "build",
        //           referenceName: "testAdminConfigurationDeploymentUuid",
        //         },
        //       },
        //       {
        //         actionType: "modelAction",
        //         actionName: "remoteLocalCacheRollback",
        //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //         deploymentUuid: {
        //           transformerType: "parameterReference",
        //           interpolation: "build",
        //           referenceName: "testAdminConfigurationDeploymentUuid",
        //         },
        //       },
        //       // getMenu: fetch menuUpdateQueryResult
        //       {
        //         actionType: "compositeRunBoxedQueryTemplateAction",
        //         actionLabel: "getMenu",
        //         nameGivenToResult: "menuUpdateQueryResult",
        //         queryTemplate: {
        //           // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
        //           actionType: "runBoxedQueryTemplateAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model",
        //           deploymentUuid: {
        //             transformerType: "parameterReference",
        //             interpolation: "build",
        //             referenceName: "testAdminConfigurationDeploymentUuid",
        //           },
        //           query: {
        //             queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        //             deploymentUuid: {
        //               transformerType: "parameterReference",
        //               interpolation: "build",
        //               referenceName: "testAdminConfigurationDeploymentUuid",
        //             },
        //             // runAsSql: true,
        //             pageParams: {},
        //             queryParams: {},
        //             contextResults: {},
        //             extractorTemplates: {
        //               menuList: {
        //                 extractorTemplateType: "extractorTemplateForObjectListByEntity",
        //                 applicationSection: "model",
        //                 parentName: "Menu",
        //                 parentUuid: {
        //                   transformerType: "mustacheStringTemplate",
        //                   interpolation: "build",
        //                   definition: "{{entityMenu.uuid}}",
        //                 },
        //               },
        //             },
        //             runtimeTransformers: {
        //               menu: {
        //                 transformerType: "pickFromList",
        //                 interpolation: "runtime",
        //                 applyTo: {
      //                     transformerType: "getFromContext",
      //                     interpolation: "runtime",
      //                     referenceName: "menuList",
        //                 },
        //                 index: 0,
        //               },
        //               menuItem: {
        //                 transformerType: "freeObjectTemplate",
        //                 definition: {
        //                   reportUuid: {
        //                     transformerType: "mustacheStringTemplate",
        //                     interpolation: "build",
        //                     definition: "{{createEntity_newEntityListReportUuid}}",
        //                   },
        //                   label: {
        //                     transformerType: "mustacheStringTemplate",
        //                     interpolation: "build",
        //                     definition: "List of {{newEntityName}}",
        //                   },
        //                   section: "data",
        //                   selfApplication: {
        //                     transformerType: "mustacheStringTemplate",
        //                     interpolation: "build",
        //                     definition: "{{adminConfigurationDeploymentParis.uuid}}",
        //                   }, // TODO: replace with selfApplication uuid, this is a deployment at the moment
        //                   icon: "local_drink",
        //                 },
        //               },
        //               updatedMenu: {
        //                 transformerType: "transformer_menu_addItem",
        //                 interpolation: "runtime",
        //                 menuItemReference: {
        //                   transformerType: "getFromContext",
        //                   interpolation: "runtime",
        //                   referenceName: "menuItem",
        //                 },
        //                 menuReference: {
        //                   transformerType: "getFromContext",
        //                   interpolation: "runtime",
        //                   referenceName: "menu",
        //                 },
        //                 menuSectionItemInsertionIndex: -1,
        //               },
        //             },
        //           },
        //         },
        //       } as any,
        //       // update current menu
        //       {
        //         actionType: "transactionalInstanceAction",
        //         actionLabel: "updateMenu",
        //         instanceAction: {
        //           actionType: "instanceAction",
        //           actionName: "updateInstance",
        //           applicationSection: "model",
        //           deploymentUuid: {
        //             transformerType: "parameterReference",
        //             interpolation: "build",
        //             referenceName: "testAdminConfigurationDeploymentUuid",
        //           },
        //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //           objects: [
        //             {
        //               parentName: entityMenu.name,
        //               parentUuid: entityMenu.uuid,
        //               applicationSection: "model",
        //               instances: [
        //                 {
        //                   transformerType: "getFromContext",
        //                   interpolation: "runtime",
        //                   referencePath: ["menuUpdateQueryResult", "updatedMenu"],
        //                 }
        //               ],
        //             },
        //           ],
        //         },
        //       },
        //       // commit
        //       {
        //         actionType: "modelAction",
        //         actionName: "commit",
        //         actionLabel: "commit",
        //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //         deploymentUuid: {
        //           transformerType: "parameterReference",
        //           interpolation: "build",
        //           referenceName: "testAdminConfigurationDeploymentUuid",
        //         },
        //       },
        //       // fetch menuUpdateQueryResult: current menu
        //       {
        //         actionType: "compositeRunBoxedQueryTemplateAction",
        //         actionLabel: "getNewMenuList",
        //         nameGivenToResult: "newMenuList",
        //         queryTemplate: {
        //           // actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
        //           actionType: "runBoxedQueryTemplateAction",
        //           actionName: "runQuery",
        //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //           applicationSection: "model",
        //           deploymentUuid: {
        //             transformerType: "parameterReference",
        //             interpolation: "build",
        //             referenceName: "testAdminConfigurationDeploymentUuid",
        //           },
        //           query: {
        //             queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        //             deploymentUuid: {
        //               transformerType: "parameterReference",
        //               interpolation: "build",
        //               referenceName: "testAdminConfigurationDeploymentUuid",
        //             },
        //             // runAsSql: true,
        //             pageParams: {},
        //             queryParams: {},
        //             contextResults: {},
        //             extractorTemplates: {
        //               menuList: {
        //                 extractorTemplateType: "extractorTemplateForObjectListByEntity",
        //                 applicationSection: "model",
        //                 parentName: "Menu",
        //                 parentUuid: {
        //                   transformerType: "mustacheStringTemplate",
        //                   interpolation: "build",
        //                   definition: "{{entityMenu.uuid}}",
        //                 },
        //               },
        //             },
        //           },
        //         },
        //       } as any,
        //     ],
        //   },
        //   testCompositeActionAssertions: [
        //     ...createEntityCompositeActionTemplateAssertions,
        //     ...createReportsCompositeActionTemplateAssertions,
        //     // check menu
        //     {
        //       actionType: "compositeRunTestAssertion",
        //       actionLabel: "checkMenus",
        //       nameGivenToResult: "checkMenuList",
        //       testAssertion: {
        //         testType: "testAssertion",
        //         testLabel: "checkMenus",
        //         definition: {
        //           resultAccessPath: ["newMenuList", "menuList"],
        //           ignoreAttributes: ["author"],
        //           expectedValue: [
        //             {
        //               uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
        //               parentName: "Menu",
        //               parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
        //               parentDefinitionVersionUuid: null,
        //               name: "LibraryMenu",
        //               defaultLabel: "Meta-Model",
        //               description:
        //                 "This is the default menu allowing to explore the Library SelfApplication.",
        //               definition: {
        //                 menuType: "complexMenu",
        //                 definition: [
        //                   {
        //                     items: [
        //                       {
        //                         icon: "category",
        //                         label: "Library Entities",
        //                         section: "model",
        //                         reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "category",
        //                         label: "Library Entity Definitions",
        //                         section: "model",
        //                         reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "list",
        //                         label: "Library Reports",
        //                         section: "model",
        //                         reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "auto_stories",
        //                         label: "Library Books",
        //                         section: "data",
        //                         reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "star",
        //                         label: "Library Authors",
        //                         section: "data",
        //                         reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "account_balance",
        //                         label: "Library Publishers",
        //                         section: "data",
        //                         reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "flag",
        //                         label: "Library countries",
        //                         section: "data",
        //                         reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         icon: "person",
        //                         label: "Library Users",
        //                         section: "data",
        //                         reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
        //                         selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
        //                       },
        //                       {
        //                         // reportUuid: "7802e89c-2e81-4ff5-b3dd-4c0e2d879748",
        //                         reportUuid: createEntity_newEntityListReportUuid,
        //                         label: "List of newEntityTest",
        //                         section: "data",
        //                         selfApplication: "",
        //                         icon: "local_drink",
        //                       },
        //                     ],
        //                     label: "library",
        //                     title: "Library",
        //                   },
        //                 ],
        //               },
        //             },
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // },
      },
    },
  } as TestCompositeActionParams,
};


// const display
// TODO: duplicate test with ExtractorTemplatePersistenceStoreRunner.integ.test.tsx
if (RUN_TEST == testSuiteName) {
  if (beforeAll) await beforeAll(); // beforeAll is a function, not the call to the jest/vitest hook
  if (beforeEach) await beforeEach(); // beforeAll is a function, not the call to the jest/vitest hook
  // await runTransformerTestSuite(vitest, [], currentTestSuite, runTransformerIntegrationTest);
  if (!localCache) {
    throw new Error("running test localCache is not defined!");
  }
  if (!domainController) {
    throw new Error("running test domainController is not defined!");
  }
  for (const [currentTestSuiteName, testAction] of Object.entries(testTemplateSuitesDEFUNCT!!!)) {
    const testSuiteResults = await runTestOrTestSuite(localCache, domainController, testAction);
    if (!testSuiteResults || testSuiteResults.status !== "ok") {
      vitest.expect(testSuiteResults?.status, `${currentTestSuiteName} failed!`).toBe("ok");
    }
  }
  // Object.entries(testTemplateSuites).forEach(
  //   e => {
  //   async (currentTestSuiteName, testAction: TestActionParams) => {
  //     const testSuiteResults = await runTestOrTestSuite(localCache, domainController, testAction);
  //     if (testSuiteResults.status !== "ok") {
  //       expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
  //     }
  //   }
  // }
  // );

} else {
  console.log("################################ skipping test suite:", testSuiteName, "RUN_TEST=", RUN_TEST);
}

// describe.sequential(testName, () => {
//   it.each(Object.entries(testTemplateSuites))(
//     "test %s",
//     async (currentTestSuiteName, testAction: TestActionParams) => {
//       const testSuiteResults = await runTestOrTestSuite(localCache, domainController, testAction);
//       if (testSuiteResults.status !== "ok") {
//         expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
//       }
//     }
//   );
// });




// describe.sequential(testName, () => {
//   it.each(Object.entries(testTemplateSuites))(
//     "test %s",
//     async (currentTestSuiteName, testAction: TestActionParams) => {
//       const testSuiteResults = await runTestOrTestSuite(localCache, domainController, testAction);
//       if (testSuiteResults.status !== "ok") {
//         expect(testSuiteResults.status, `${currentTestSuiteName} failed!`).toBe("ok");
//       }
//     }
//   );
// });

