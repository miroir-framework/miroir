import { v4 as uuidv4 } from "uuid";

import {
  EntityDefinition,
  InitApplicationParameters,
  JzodObject,
  MiroirConfigClient,
  StoreUnitConfiguration,
  Uuid,
  adminConfigurationDeploymentLibrary,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
} from "miroir-core";
import {
  BuildCompositeAction,
  BuildPlusRuntimeDomainAction,
  CompositeRunTestAssertion
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { adminConfigurationDeploymentParis } from "../../constants";
import {
  TestActionParams,
  createDeploymentCompositeAction,
  resetAndinitializeDeploymentCompositeAction,
} from "./tests-utils";
import { testOnLibrary_deleteLibraryDeployment, testOnLibrary_resetLibraryDeployment } from "./tests-utils-testOnLibrary";

// import test_createEntityAndReportFromSpreadsheetAndUpdateMenu from "./ffe6ab3c-8296-4293-8aaf-ebbad1f0ac9a.json";

// const libraryEntitesAndInstances = [
//   {
//     entity: entityAuthor as MetaEntity,
//     entityDefinition: entityDefinitionAuthor as EntityDefinition,
//     instances: [author1, author2, author3 as EntityInstance],
//   },
//   {
//     entity: entityBook as MetaEntity,
//     entityDefinition: entityDefinitionBook as EntityDefinition,
//     instances: [
//       book1 as EntityInstance,
//       book2 as EntityInstance,
//       book3 as EntityInstance,
//       book4 as EntityInstance,
//       book5 as EntityInstance,
//       book6 as EntityInstance,
//     ],
//   },
//   {
//     entity: entityPublisher as MetaEntity,
//     entityDefinition: entityDefinitionPublisher as EntityDefinition,
//     instances: [
//       publisher1 as EntityInstance,
//       publisher2 as EntityInstance,
//       publisher3 as EntityInstance,
//     ],
//   },
// ];

// ################################################################################################
export const testSuiteNameForBuildPlusRuntimeCompositeAction: string = "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test";
// ################################################################################################

const testSelfApplicationUuid: Uuid = uuidv4();
const testDeploymentUuid: Uuid = uuidv4();
const testApplicationModelBranchUuid: Uuid = uuidv4();
const testApplicationVersionUuid: Uuid = uuidv4();

const testDeploymentStorageConfiguration: StoreUnitConfiguration = getBasicStoreUnitConfiguration(
  "test",
  {
    emulatedServerType: "sql",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  }
);

const initParametersForTest: InitApplicationParameters = getBasicApplicationConfiguration(
  "Test",
  testSelfApplicationUuid,
  testDeploymentUuid,
  testApplicationModelBranchUuid,
  testApplicationVersionUuid
);

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

const fileData: { [k: string]: any }[] = [
  { a: "iso3166-1Alpha-2", b: "iso3166-1Alpha-3", c: "Name" },
  { a: "US", b: "USA", c: "United States" },
  { a: "DE", b: "DEU", c: "Germany" },
];
const newEntityJzodSchema: JzodObject = {
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
    ...(fileData[0]
      ? Object.values(fileData[0]).map((a: string, index) => ({
          [a]: {
            type: "string",
            // optional: true,
            // tag: { id: index + 2 /* uuid attribute has been added*/, defaultLabel: a, editable: true },
          },
        }))
      : [])
  ),
};

// // ##############################################################################################
// // CREATE ENTITY, DEFINITION
// // ##############################################################################################
// const createEntity_newEntity = {
//   uuid: newEntityUuid,
//   parentUuid: entityEntity.uuid,
//   selfApplication: testSelfApplicationUuid,
//   description: createEntity_newEntityDescription,
//   name: newEntityName,
// };

// const createEntity_newEntityDefinition: EntityDefinition = {
//   name: newEntityName,
//   uuid: newEntityDefinitionUuid,
//   parentName: "EntityDefinition",
//   parentUuid: entityEntityDefinition.uuid,
//   entityUuid: createEntity_newEntity.uuid,
//   conceptLevel: "Model",
//   defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
//   jzodSchema: newEntityJzodSchema,
// };

// // const createEntityCompositeAction: BuildPlusRuntimeCompositeAction = {
// const createEntityCompositeAction: BuildCompositeAction = {
//   actionType: "compositeAction",
//   // actionLabel: "createEntityCompositeActionTemplate",
//   actionLabel: "createEntityCompositeAction",
//   actionName: "sequence",
//   definition: [
//     // createEntity
//     {
//       actionType: "createEntity",
//       actionLabel: "createEntity",
//       // deploymentUuid: testDeploymentUuid,
//       deploymentUuid: {
//         transformerType: "parameterReference",
//         interpolation: "build",
//         referenceName: "testDeploymentUuid",
//       } as any, // TODO: remove any
//       endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//       entities: [
//         {
//           // entity: createEntity_newEntity,
//           entity: {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "createEntity_newEntity",
//           },
//           // entityDefinition: createEntity_newEntityDefinition,
//           entityDefinition: {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "createEntity_newEntityDefinition",
//           },
//         },
//       ],
//     },
//   ],
// };
// // const createEntityCompositeActionTemplatePrepActions: CompositeActionTemplate["definition"] = [
// const createEntityCompositeActionPrepActions: any[] = [
//   // test preparation: newApplicationEntityDefinitionList
//   {
//     actionType: "compositeRunBoxedExtractorOrQueryAction",
//     actionLabel: "getListOfEntityDefinitions",
//     nameGivenToResult: "newApplicationEntityDefinitionList",
//     query: {
//       actionType: "runBoxedExtractorOrQueryAction",
//       actionName: "runQuery",
//       endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//       applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//       deploymentUuid: {
//         transformerType: "parameterReference",
//         interpolation: "build",
//         referenceName: "testDeploymentUuid",
//       },
//       query: {
//         queryType: "boxedQueryWithExtractorCombinerTransformer",
//         // deploymentUuid: testDeploymentUuid,
//         deploymentUuid: {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referenceName: "testDeploymentUuid",
//         },
//         pageParams: {
//           // currentDeploymentUuid: testDeploymentUuid,
//           currentDeploymentUuid: {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "testDeploymentUuid",
//             // testDeploymentUuid
//           },
//         },
//         queryParams: {},
//         contextResults: {},
//         extractors: {
//           entityDefinitions: {
//             extractorOrCombinerType: "extractorByEntityReturningObjectList",
//             applicationSection: "model",
//             // parentName: entityEntityDefinition.name,
//             parentName: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntityDefinition", "name"],
//             },
//             // parentUuid: entityEntityDefinition.uuid,
//             parentUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntityDefinition", "uuid"],
//             },
//             orderBy: {
//               attributeName: "name",
//               direction: "ASC",
//             },
//           },
//         },
//       },
//     },
//   },
//   // test preparation: newApplicationEntityList
//   {
//     actionType: "compositeRunBoxedExtractorOrQueryAction",
//     actionLabel: "getListOfEntities",
//     nameGivenToResult: "newApplicationEntityList",
//     query: {
//       actionType: "runBoxedExtractorOrQueryAction",
//       actionName: "runQuery",
//       endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//       applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//       // deploymentUuid: testDeploymentUuid,
//       deploymentUuid: {
//         transformerType: "parameterReference",
//         interpolation: "build",
//         referenceName: "testDeploymentUuid",
//       } as any, // TODO: remove any
//       query: {
//         queryType: "boxedQueryWithExtractorCombinerTransformer",
//         deploymentUuid: {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referenceName: "testDeploymentUuid",
//         } as any, // TODO: remove any
//         pageParams: {
//           // currentDeploymentUuid: testDeploymentUuid,
//           currentDeploymentUuid: {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "testDeploymentUuid",
//           } as any, // TODO: remove any
//         },
//         queryParams: {},
//         contextResults: {},
//         extractors: {
//           entities: {
//             extractorOrCombinerType: "extractorByEntityReturningObjectList",
//             applicationSection: "model",
//             parentName: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntity", "name"],
//             },
//             parentUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntity", "uuid"],
//             },
//             orderBy: {
//               attributeName: "name",
//               direction: "ASC",
//             },
//           },
//         },
//       },
//     },
//   },
// ];
// const createEntityCompositeActionAssertions: CompositeRunTestAssertion[] = [
//   // check entities
//   {
//     actionType: "compositeRunTestAssertion",
//     actionLabel: "checkEntities",
//     nameGivenToResult: "checkEntityList",
//     testAssertion: {
//       testType: "testAssertion",
//       testLabel: "checkEntities",
//       definition: {
//         resultAccessPath: ["newApplicationEntityList", "entities"],
//         ignoreAttributes: ["author", "conceptLevel", "parentDefinitionVersionUuid", "parentName"],
//         expectedValue: [
//           // newEntity,
//           {
//             // uuid: newEntityUuid,
//             uuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityUuid",
//             },
//             // parentUuid: entityEntity.uuid,
//             parentUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntity", "uuid"],
//             },
//             // selfApplication: testSelfApplicationUuid,
//             selfApplication: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "testSelfApplicationUuid",
//             },
//             // description: createEntity_newEntityDescription,
//             description: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "createEntity_newEntityDescription",
//             },
//             // name: newEntityName,
//             name: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityName",
//             },
//           },
//         ],
//       },
//     },
//   },
//   // check entity definitions
//   {
//     actionType: "compositeRunTestAssertion",
//     actionLabel: "checkEntityDefinitions",
//     nameGivenToResult: "checkEntityDefinitionList",
//     testAssertion: {
//       testType: "testAssertion",
//       testLabel: "checkEntityDefinitions", // TODO: index testCompositeActionAssertions in an object, ensuring unique keys
//       definition: {
//         resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
//         ignoreAttributes: [
//           "author",
//           "conceptLevel",
//           "description",
//           "icon",
//           "parentDefinitionVersionUuid",
//           "parentName",
//           "viewAttributes",
//         ],
//         expectedValue: [
//           // newEntityDefinition,
//           {
//             // name: newEntityName,
//             name: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityName",
//             },
//             // uuid: newEntityDefinitionUuid,
//             uuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityDefinitionUuid",
//             },
//             // parentName: "EntityDefinition",
//             parentName: {
//               transformerType: "constant",
//               interpolation: "build",
//               value: "EntityDefinition",
//             },
//             // parentUuid: entityEntityDefinition.uuid,
//             parentUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityEntityDefinition", "uuid"],
//             },
//             // entityUuid: newEntityUuid,
//             entityUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityUuid",
//             },
//             conceptLevel: "Model",
//             // defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
//             defaultInstanceDetailsReportUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "defaultInstanceDetailsReportUuid",
//             },
//             // jzodSchema: newEntityJzodSchema,
//             jzodSchema: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referenceName: "newEntityJzodSchema",
//             },
//           },
//           // {
//           //   transformerType: "parameterReference",
//           //   referenceName: "createEntity_newEntityDefinition",
//           // },
//         ],
//       },
//     },
//   },
// ];

// // ##############################################################################################
// // REPORTS
// // ##############################################################################################
// const newEntityListReport = {
//   uuid: createEntity_newEntityListReportUuid,
//   selfApplication: testSelfApplicationUuid,
//   parentName: "Report",
//   parentUuid: entityReport.uuid,
//   conceptLevel: "Model",
//   name: `${newEntityName}List`,
//   defaultLabel: `List of ${newEntityName}s`,
//   type: "list",
//   definition: {
//     extractors: {
//       instanceList: {
//         extractorOrCombinerType: "extractorByEntityReturningObjectList",
//         parentName: newEntityName,
//         parentUuid: newEntityUuid,
//       },
//     },
//     section: {
//       type: "objectListReportSection",
//       definition: {
//         label: `${newEntityName}s`,
//         parentUuid: newEntityUuid,
//         fetchedDataReference: "instanceList",
//       },
//     },
//   },
// };

// const newEntityDetailsReport = {
//   uuid: createEntity_newEntityDetailsReportUuid,
//   selfApplication: testSelfApplicationUuid,
//   parentName: entityReport.name,
//   parentUuid: entityReport.uuid,
//   conceptLevel: "Model",
//   name: `${newEntityName}Details`,
//   defaultLabel: `Details of ${newEntityName}`,
//   definition: {
//     extractorTemplates: {
//       elementToDisplay: {
//         extractorTemplateType: "extractorForObjectByDirectReference",
//         parentName: newEntityName,
//         parentUuid: newEntityUuid,
//         instanceUuid: {
//           transformerType: "contextReference",
//           interpolation: "runtime",
//           referenceName: "instanceUuid",
//         },
//       },
//     },
//     section: {
//       type: "list",
//       definition: [
//         {
//           type: "objectInstanceReportSection",
//           definition: {
//             label: `My ${newEntityName}`,
//             parentUuid: newEntityUuid,
//             fetchedDataReference: "elementToDisplay",
//           },
//         },
//       ],
//     },
//   },
// };

// // const createReportsCompositeAction: DomainAction = {
// const createReportsCompositeAction: BuildPlusRuntimeDomainAction = {
//   actionType: "transactionalInstanceAction",
//   actionLabel: "createReports",
//   instanceAction: {
//     actionType: "createInstance",
//     applicationSection: "model",
//     // deploymentUuid: testDeploymentUuid,
//     deploymentUuid: {
//       transformerType: "parameterReference",
//       interpolation: "build",
//       referenceName: "testDeploymentUuid",
//     } as any, // TODO: remove any
//     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//     objects: [
//       {
//         parentName: {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referencePath: ["newEntityListReport", "parentName"],
//         } as any, // TODO: remove any
//         parentUuid: {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referencePath: ["newEntityListReport", "parentUuid"],
//         } as any, // TODO: remove any
//         applicationSection: "model",
//         instances: [
//           // List of new entity instances Report Definition
//           {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "newEntityListReport",
//           },
//           {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "newEntityDetailsReport",
//           },
//         ],
//       },
//     ],
//   },
// };

// const createReportsCompositeActionPrepActions: any[] = [
//   // test preparation: newApplicationReportList
//   {
//     actionType: "compositeRunBoxedExtractorOrQueryAction",
//     actionLabel: "getListOfReports",
//     nameGivenToResult: "newApplicationReportList",
//     query: {
//       actionType: "runBoxedExtractorOrQueryAction",
//       actionName: "runQuery",
//       endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//       applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//       // deploymentUuid: testDeploymentUuid,
//       deploymentUuid: {
//         transformerType: "parameterReference",
//         interpolation: "build",
//         referenceName: "testDeploymentUuid",
//       },
//       query: {
//         queryType: "boxedQueryWithExtractorCombinerTransformer",
//         // deploymentUuid: testDeploymentUuid,
//         deploymentUuid: {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referenceName: "testDeploymentUuid",
//         } as any, // TODO: remove any
//         pageParams: {
//           // currentDeploymentUuid: testDeploymentUuid,
//           currentDeploymentUuid: {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "testDeploymentUuid",
//           } as any, // TODO: remove any
//         },
//         runAsSql: true,
//         queryParams: {},
//         contextResults: {},
//         extractors: {
//           reports: {
//             extractorOrCombinerType: "extractorByEntityReturningObjectList",
//             applicationSection: "model",
//             parentName: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityReport", "name"],
//             },
//             parentUuid: {
//               transformerType: "parameterReference",
//               interpolation: "build",
//               referencePath: ["entityReport", "uuid"],
//             },
//             orderBy: {
//               // TODO: orderBy is ignored!?
//               attributeName: "name",
//               direction: "ASC",
//             },
//           },
//         },
//       },
//     },
//   },
// ];

// const createReportsCompositeActionAssertions: CompositeRunTestAssertion[] = [
//   {
//     actionType: "compositeRunTestAssertion",
//     actionLabel: "checkReports",
//     nameGivenToResult: "checkReportList",
//     testAssertion: {
//       // testType: "testAssertion",
//       testType: "testAssertion",
//       testLabel: "checkReports",
//       definition: {
//         resultAccessPath: ["newApplicationReportList", "reports"],
//         ignoreAttributes: ["author", "parentDefinitionVersionUuid", "type"],
//         // expectedValue: [newEntityListReport, newEntityDetailsReport],
//         expectedValue: [
//           {
//             transformerType: "parameterReference",
//             interpolation: "build",
//             referenceName: "newEntityListReport",
//           },
//           // newEntityDetailsReport,
//         {
//           transformerType: "parameterReference",
//           interpolation: "build",
//           referenceName: "newEntityDetailsReport",
//         }
//         ],
//       },
//     },
//   },
// ];
// ##############################################################################################
// MENU
// ##############################################################################################

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################

const testDeploymentConfiguration: MiroirConfigClient = {
  miroirConfigType: "client",
  client: {
    emulateServer: true,
    rootApiUrl: "http://localhost:3080",
    deploymentStorageConfig: {
      [testDeploymentUuid]: testDeploymentStorageConfiguration,
    },
  },
};
export function getTestSuitesForBuildPlusRuntimeCompositeAction(
  miroirConfig: any,
) {
  const testSuitesForBuildPlusRuntimeCompositeAction: Record<string, TestActionParams> = {
    [testSuiteNameForBuildPlusRuntimeCompositeAction]: {
      testActionType: "testBuildPlusRuntimeCompositeActionSuite",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      testActionLabel: testSuiteNameForBuildPlusRuntimeCompositeAction,
      testParams: {
        createEntity_newEntityDescription,
        newEntityUuid,
        newEntityName,
        newEntityDefinitionUuid,
        newEntityJzodSchema,
        createEntity_newEntityListReportUuid,
        createEntity_newEntityDetailsReportUuid,
        defaultInstanceDetailsReportUuid,
        //
        adminConfigurationDeploymentParis, //??
        testDeploymentUuid,
        testSelfApplicationUuid,
        entityEntity,
        entityEntityDefinition,
        entityMenu,
        entityReport,
        testAdminConfigurationDeploymentUuid: testDeploymentUuid, // TODO: remove this
      },
      testCompositeAction: {
        testType: "testBuildPlusRuntimeCompositeActionSuite",
        testLabel: testSuiteNameForBuildPlusRuntimeCompositeAction,
        beforeAll: createDeploymentCompositeAction(
          testDeploymentUuid,
          testDeploymentStorageConfiguration
        ),
        beforeEach: resetAndinitializeDeploymentCompositeAction(
          testDeploymentUuid,
          initParametersForTest,
          []
        ),
        afterEach: testOnLibrary_resetLibraryDeployment(
          testDeploymentConfiguration,
          testDeploymentUuid
        ),
        afterAll: testOnLibrary_deleteLibraryDeployment(
          testDeploymentConfiguration,
          testDeploymentUuid
        ),
        testCompositeActions: {
          // ...test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions
          "create new Entity and reports from spreadsheet": {
            testType: "testBuildPlusRuntimeCompositeAction",
            testLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
            compositeAction: {
              actionType: "compositeAction",
              actionLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
              actionName: "sequence",
              templates: {
                createEntity_newEntity: {
                  uuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityUuid",
                  },
                  parentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["entityEntity", "uuid"],
                  },
                  selfApplication: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testSelfApplicationUuid",
                  },
                  description: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "createEntity_newEntityDescription",
                  },
                  name: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityName",
                  },
                },
                createEntity_newEntityDefinition: {
                  name: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityName",
                  },
                  uuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityDefinitionUuid",
                  },
                  parentName: "EntityDefinition",
                  parentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["entityEntityDefinition", "uuid"],
                  },
                  entityUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["createEntity_newEntity", "uuid"],
                  },
                  conceptLevel: "Model",
                  defaultInstanceDetailsReportUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "defaultInstanceDetailsReportUuid",
                  },
                  jzodSchema: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityJzodSchema",
                  },
                },
                newEntityListReport: {
                  uuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "createEntity_newEntityListReportUuid",
                  },
                  selfApplication: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testSelfApplicationUuid",
                  },
                  parentName: "Report",
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "{{entityReport.uuid}}",
                  },
                  conceptLevel: "Model",
                  name: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "{{newEntityName}}List",
                  },
                  defaultLabel: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "List of {{newEntityName}}s",
                  },
                  type: "list",
                  definition: {
                    extractors: {
                      instanceList: {
                        extractorOrCombinerType: "extractorByEntityReturningObjectList",
                        parentName: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityName",
                        },
                        parentUuid: {
                          transformerType: "mustacheStringTemplate",
                          interpolation: "build",
                          definition: "{{createEntity_newEntity.uuid}}",
                        },
                      },
                    },
                    section: {
                      type: "objectListReportSection",
                      definition: {
                        label: {
                          transformerType: "mustacheStringTemplate",
                          interpolation: "build",
                          definition: "{{newEntityName}}s",
                        },
                        parentUuid: {
                          transformerType: "mustacheStringTemplate",
                          interpolation: "build",
                          definition: "{{createEntity_newEntity.uuid}}",
                        },
                        fetchedDataReference: "instanceList",
                      },
                    },
                  },
                },
                newEntityDetailsReport: {
                  uuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "createEntity_newEntityDetailsReportUuid",
                  },
                  selfApplication: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testSelfApplicationUuid",
                  },
                  parentName: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "{{entityReport.name}}",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "{{entityReport.uuid}}",
                  },
                  conceptLevel: "Model",
                  name: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "{{newEntityName}}Details",
                  },
                  defaultLabel: {
                    transformerType: "mustacheStringTemplate",
                    interpolation: "build",
                    definition: "Details of {{newEntityName}}",
                  },
                  definition: {
                    extractorTemplates: {
                      elementToDisplay: {
                        transformerType: "constant",
                        interpolation: "build",
                        value: {
                          extractorTemplateType: "extractorForObjectByDirectReference",
                          parentName: {
                            transformerType: "contextReference",
                            interpolation: "build",
                            referenceName: "newEntityName",
                          },
                          parentUuid: {
                            transformerType: "mustacheStringTemplate",
                            interpolation: "build",
                            definition: "{{newEntityUuid}}",
                          },
                          instanceUuid: {
                            transformerType: "constant",
                            interpolation: "runtime",
                            value: {
                              transformerType: "contextReference",
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
                              interpolation: "build",
                              definition: "My {{newEntityName}}",
                            },
                            parentUuid: {
                              transformerType: "mustacheStringTemplate",
                              interpolation: "build",
                              definition: "{{newEntityUuid}}",
                            },
                            fetchedDataReference: "elementToDisplay",
                          },
                        },
                      ],
                    },
                  },
                },
              },
              definition: [
                {
                  actionType: "createEntity",
                  actionLabel: "createEntity",
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testDeploymentUuid",
                  },
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
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
                },
                {
                  actionType: "transactionalInstanceAction",
                  actionLabel: "createReports",
                  instanceAction: {
                    actionType: "createInstance",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: [
                      {
                        parentName: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["newEntityListReport", "parentName"],
                        },
                        parentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["newEntityListReport", "parentUuid"],
                        },
                        applicationSection: "model",
                        instances: [
                          {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referenceName: "newEntityListReport",
                          },
                          {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referenceName: "newEntityDetailsReport",
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commit",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testDeploymentUuid",
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "getListOfEntityDefinitions",
                  nameGivenToResult: "newApplicationEntityDefinitionList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      pageParams: {
                        currentDeploymentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "testDeploymentUuid",
                        },
                      },
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        entityDefinitions: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityEntityDefinition", "name"],
                          },
                          parentUuid: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityEntityDefinition", "uuid"],
                          },
                          orderBy: {
                            attributeName: "name",
                            direction: "ASC",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "getListOfEntities",
                  nameGivenToResult: "newApplicationEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      pageParams: {
                        currentDeploymentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "testDeploymentUuid",
                        },
                      },
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        entities: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityEntity", "name"],
                          },
                          parentUuid: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityEntity", "uuid"],
                          },
                          orderBy: {
                            attributeName: "name",
                            direction: "ASC",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "getListOfReports",
                  nameGivenToResult: "newApplicationReportList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      pageParams: {
                        currentDeploymentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "testDeploymentUuid",
                        },
                      },
                      runAsSql: true,
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        reports: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityReport", "name"],
                          },
                          parentUuid: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityReport", "uuid"],
                          },
                          orderBy: {
                            attributeName: "name",
                            direction: "ASC",
                          },
                        },
                      },
                    },
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  actionLabel: "getMenu",
                  nameGivenToResult: "menuUpdateQueryResult",
                  queryTemplate: {
                    actionType: "runBoxedQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        menuList: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityMenu", "name"],
                          },
                          parentUuid: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityMenu", "uuid"],
                          },
                        },
                      },
                      runtimeTransformers: {
                        menu: {
                          transformerType: "listPickElement",
                          interpolation: "runtime",
                          applyTo: {
                            referenceType: "referencedTransformer",
                            reference: {
                              transformerType: "contextReference",
                              interpolation: "runtime",
                              referenceName: "menuList",
                            },
                          },
                          index: 0,
                        },
                        menuItem: {
                          transformerType: "freeObjectTemplate",
                          interpolation: "runtime",
                          definition: {
                            reportUuid: {
                              // transformerType: "contextReference",
                              // interpolation: "runtime",
                              transformerType: "parameterReference",
                              interpolation: "build",
                              referenceName: "createEntity_newEntityListReportUuid",
                            },
                            label: {
                              transformerType: "mustacheStringTemplate",
                              // interpolation: "runtime",
                              interpolation: "build",
                              definition: "List of {{newEntityName}}s",
                            },
                            section: "data",
                            selfApplication: {
                              // transformerType: "contextReference",
                              // interpolation: "runtime",
                              transformerType: "parameterReference",
                              interpolation: "build",
                              referencePath: ["adminConfigurationDeploymentParis", "uuid"],
                            },
                            icon: "local_drink",
                          },
                        },
                        updatedMenu: {
                          transformerType: "transformer_menu_addItem",
                          interpolation: "runtime",
                          menuItemReference: {
                            transformerType: "contextReference",
                            interpolation: "runtime",
                            referenceName: "menuItem",
                          },
                          menuReference: {
                            transformerType: "contextReference",
                            interpolation: "runtime",
                            referenceName: "menu",
                          },
                          menuSectionItemInsertionIndex: -1,
                        },
                      },
                    },
                  },
                },
                {
                  actionType: "transactionalInstanceAction",
                  actionLabel: "updateMenu",
                  instanceAction: {
                    actionType: "updateInstance",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: [
                      {
                        parentName: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["entityMenu", "name"],
                        },
                        parentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["entityMenu", "uuid"],
                        },
                        applicationSection: "model",
                        instances: [
                          {
                            transformerType: "contextReference",
                            interpolation: "runtime",
                            referencePath: ["menuUpdateQueryResult", "updatedMenu"],
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  actionType: "commit",
                  actionLabel: "commit",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testDeploymentUuid",
                  },
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  actionLabel: "getNewMenuList",
                  nameGivenToResult: "newMenuList",
                  queryTemplate: {
                    actionType: "runBoxedQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        menuList: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: "Menu",
                          parentUuid: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityMenu", "uuid"],
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
            testCompositeActionAssertions: [
              {
                actionType: "compositeRunTestAssertion",
                actionLabel: "checkEntities",
                nameGivenToResult: "checkEntityList",
                testAssertion: {
                  testType: "testAssertion",
                  testLabel: "checkEntities",
                  definition: {
                    resultAccessPath: ["newApplicationEntityList", "entities"],
                    ignoreAttributes: [
                      "author",
                      "conceptLevel",
                      "parentDefinitionVersionUuid",
                      "parentName",
                    ],
                    expectedValue: [
                      {
                        uuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityUuid",
                        },
                        parentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["entityEntity", "uuid"],
                        },
                        selfApplication: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "testSelfApplicationUuid",
                        },
                        description: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "createEntity_newEntityDescription",
                        },
                        name: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityName",
                        },
                      },
                    ],
                  },
                },
              },
              {
                actionType: "compositeRunTestAssertion",
                actionLabel: "checkEntityDefinitions",
                nameGivenToResult: "checkEntityDefinitionList",
                testAssertion: {
                  testType: "testAssertion",
                  testLabel: "checkEntityDefinitions",
                  definition: {
                    resultAccessPath: ["newApplicationEntityDefinitionList", "entityDefinitions"],
                    ignoreAttributes: [
                      "author",
                      "conceptLevel",
                      "description",
                      "icon",
                      "parentDefinitionVersionUuid",
                      "parentName",
                      "viewAttributes",
                    ],
                    expectedValue: [
                      {
                        name: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityName",
                        },
                        uuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityDefinitionUuid",
                        },
                        parentName: "EntityDefinition",
                        parentUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["entityEntityDefinition", "uuid"],
                        },
                        entityUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referencePath: ["newEntityUuid"],
                        },
                        conceptLevel: "Model",
                        defaultInstanceDetailsReportUuid: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "defaultInstanceDetailsReportUuid",
                        },
                        jzodSchema: {
                          transformerType: "parameterReference",
                          interpolation: "build",
                          referenceName: "newEntityJzodSchema",
                        },
                      },
                    ],
                  },
                },
              },
              {
                actionType: "compositeRunTestAssertion",
                actionLabel: "checkReports",
                nameGivenToResult: "checkReportList",
                testAssertion: {
                  testType: "testAssertion",
                  testLabel: "checkReports",
                  definition: {
                    resultAccessPath: ["newApplicationReportList", "reports"],
                    ignoreAttributes: ["author", "parentDefinitionVersionUuid", "type"],
                    expectedValue: [
                      {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "newEntityListReport",
                      },
                      {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "newEntityDetailsReport",
                      },
                    ],
                  },
                },
              },
              {
                actionType: "compositeRunTestAssertion",
                actionLabel: "checkMenus",
                nameGivenToResult: "checkMenuList",
                testAssertion: {
                  testType: "testAssertion",
                  testLabel: "checkMenus",
                  definition: {
                    resultAccessPath: ["newMenuList", "menuList"],
                    ignoreAttributes: ["author"],
                    expectedValue: [
                      {
                        uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
                        parentName: "Menu",
                        parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
                        parentDefinitionVersionUuid: null,
                        name: "LibraryMenu",
                        defaultLabel: "Meta-Model",
                        description:
                          "This is the default menu allowing to explore the Library SelfApplication.",
                        definition: {
                          menuType: "complexMenu",
                          definition: [
                            {
                              items: [
                                {
                                  icon: "category",
                                  label: "Library Entities",
                                  section: "model",
                                  reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "category",
                                  label: "Library Entity Definitions",
                                  section: "model",
                                  reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "list",
                                  label: "Library Reports",
                                  section: "model",
                                  reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "auto_stories",
                                  label: "Library Books",
                                  section: "data",
                                  reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "star",
                                  label: "Library Authors",
                                  section: "data",
                                  reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "account_balance",
                                  label: "Library Publishers",
                                  section: "data",
                                  reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "flag",
                                  label: "Library countries",
                                  section: "data",
                                  reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  icon: "person",
                                  label: "Library Users",
                                  section: "data",
                                  reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
                                  selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
                                },
                                {
                                  reportUuid: {
                                    transformerType: "parameterReference",
                                    interpolation: "build",
                                    referenceName: "createEntity_newEntityListReportUuid",
                                  },
                                  label: {
                                    transformerType: "mustacheStringTemplate",
                                    interpolation: "build",
                                    definition: "List of {{newEntityName}}s",
                                  },
                                  section: "data",
                                  selfApplication: {
                                    transformerType: "parameterReference",
                                    interpolation: "build",
                                    referencePath: ["adminConfigurationDeploymentParis", "uuid"],
                                  },
                                  icon: "local_drink",
                                },
                              ],
                              label: "library",
                              title: "Library",
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        } as any, // TODO: remove any
      },
      // } as TestActionParams,
    },
  };
  return {testSuitesForBuildPlusRuntimeCompositeAction, testDeploymentStorageConfiguration, testDeploymentUuid};
}