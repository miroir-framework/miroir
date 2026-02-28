import { v4 as uuidv4 } from "uuid";

import {
  InitApplicationParameters,
  JzodObject,
  MiroirConfigClient,
  StoreUnitConfiguration,
  TestCompositeActionParams,
  Uuid,
  createDeploymentCompositeAction,
  emptyMetaModel,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  resetAndinitializeDeploymentCompositeAction,
} from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

// ################################################################################################
export const testSuiteNameForBuildPlusRuntimeCompositeAction: string =
  "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test";
// ################################################################################################

const testApplicationName: string = "test";
const testSelfApplicationUuid: Uuid = uuidv4();
// const testDeploymentUuid: Uuid = uuidv4();
const testDeploymentUuid: Uuid = "3c7ae605-e938-419d-8110-99d0e3b31ac2";
const testApplicationModelBranchUuid: Uuid = uuidv4();
const testApplicationVersionUuid: Uuid = uuidv4();

const testDeploymentStorageConfiguration: StoreUnitConfiguration = getBasicStoreUnitConfiguration(
  testApplicationName,
  {
    emulatedServerType: "sql",
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  }
);

const initParametersForTest: InitApplicationParameters = getBasicApplicationConfiguration(
  testApplicationName,
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
export function getTestSuitesForBuildPlusRuntimeCompositeAction(miroirConfig: any): {
  testSuitesForBuildPlusRuntimeCompositeAction: Record<string, TestCompositeActionParams>;
  testDeploymentStorageConfiguration: any;
  testDeploymentUuid: Uuid;
} {
  const testSuitesForBuildPlusRuntimeCompositeAction: Record<string, TestCompositeActionParams> = {
    [testSuiteNameForBuildPlusRuntimeCompositeAction]: {
      testActionType: "testBuildPlusRuntimeCompositeActionSuite",
      application: selfApplicationLibrary.uuid, // NOT USED
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
          testApplicationName,
          testDeploymentUuid,
          testSelfApplicationUuid,
          testDeploymentStorageConfiguration
        ),
        beforeEach: resetAndinitializeDeploymentCompositeAction(
          testSelfApplicationUuid,
          testDeploymentUuid,
          initParametersForTest,
          [],
          emptyMetaModel,
        ),
        // afterEach: testOnLibrary_resetLibraryDeployment(
        //   testDeploymentConfiguration,
        //   testDeploymentUuid
        // ),
        // afterAll: testOnLibrary_deleteLibraryDeployment(
        //   testDeploymentConfiguration,
        //   testDeploymentUuid
        // ),
        testCompositeActions: {
          //           // ...test_createEntityAndReportFromSpreadsheetAndUpdateMenu.definition.testCompositeActions
          "create new Entity and reports from spreadsheet": {
            testType: "testBuildPlusRuntimeCompositeAction",
            testLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",
            compositeActionSequence: {
              actionType: "compositeActionSequence",
              endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              actionLabel: "createEntityAndReportFromSpreadsheetAndUpdateMenu",              // endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
              payload: {
                application: {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referenceName: "testSelfApplicationUuid",
                } as any,
                // templates: {
                //   createEntity_newEntity: {
                //     uuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "newEntityUuid",
                //     },
                //     parentUuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referencePath: ["entityEntity", "uuid"],
                //     },
                //     selfApplication: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "testSelfApplicationUuid",
                //     },
                //     description: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "createEntity_newEntityDescription",
                //     },
                //     name: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "newEntityName",
                //     },
                //   },
                //   createEntity_newEntityDefinition: {
                //     name: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "newEntityName",
                //     },
                //     uuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "newEntityDefinitionUuid",
                //     },
                //     parentName: "EntityDefinition",
                //     parentUuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referencePath: ["entityEntityDefinition", "uuid"],
                //     },
                //     entityUuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referencePath: ["createEntity_newEntity", "uuid"],
                //     },
                //     conceptLevel: "Model",
                //     defaultInstanceDetailsReportUuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "defaultInstanceDetailsReportUuid",
                //     },
                //     mlSchema: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "newEntityJzodSchema",
                //     },
                //   },
                //   newEntityListReport: {
                //     uuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "createEntity_newEntityListReportUuid",
                //     },
                //     selfApplication: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "testSelfApplicationUuid",
                //     },
                //     parentName: "Report",
                //     parentUuid: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "{{entityReport.uuid}}",
                //     },
                //     conceptLevel: "Model",
                //     name: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "{{newEntityName}}List",
                //     },
                //     defaultLabel: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "List of {{newEntityName}}s",
                //     },
                //     type: "list",
                //     definition: {
                //       extractors: {
                //         instanceList: {
                //           extractorOrCombinerType: "extractorByEntityReturningObjectList",
                //           parentName: {
                //             transformerType: "getFromParameters",
                //             interpolation: "build",
                //             referenceName: "newEntityName",
                //           },
                //           parentUuid: {
                //             transformerType: "mustacheStringTemplate",
                //             interpolation: "build",
                //             definition: "{{createEntity_newEntity.uuid}}",
                //           },
                //         },
                //       },
                //       section: {
                //         type: "objectListReportSection",
                //         definition: {
                //           label: {
                //             transformerType: "mustacheStringTemplate",
                //             interpolation: "build",
                //             definition: "{{newEntityName}}s",
                //           },
                //           parentUuid: {
                //             transformerType: "mustacheStringTemplate",
                //             interpolation: "build",
                //             definition: "{{createEntity_newEntity.uuid}}",
                //           },
                //           fetchedDataReference: "instanceList",
                //         },
                //       },
                //     },
                //   },
                //   newEntityDetailsReport: {
                //     uuid: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "createEntity_newEntityDetailsReportUuid",
                //     },
                //     selfApplication: {
                //       transformerType: "getFromParameters",
                //       interpolation: "build",
                //       referenceName: "testSelfApplicationUuid",
                //     },
                //     parentName: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "{{entityReport.name}}",
                //     },
                //     parentUuid: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "{{entityReport.uuid}}",
                //     },
                //     conceptLevel: "Model",
                //     name: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "{{newEntityName}}Details",
                //     },
                //     defaultLabel: {
                //       transformerType: "mustacheStringTemplate",
                //       interpolation: "build",
                //       definition: "Details of {{newEntityName}}",
                //     },
                //     definition: {
                //       extractorTemplates: {
                //         elementToDisplay: {
                //           transformerType: "returnValue",
                //           interpolation: "build",
                //           value: {
                //             extractorOrCombinerType: "extractorForObjectByDirectReference",
                //             parentName: {
                //               transformerType: "getFromContext",
                //               interpolation: "build",
                //               referenceName: "newEntityName",
                //             },
                //             parentUuid: {
                //               transformerType: "mustacheStringTemplate",
                //               interpolation: "build",
                //               definition: "{{newEntityUuid}}",
                //             },
                //             instanceUuid: {
                //               transformerType: "returnValue",
                //               interpolation: "runtime",
                //               value: {
                //                 transformerType: "getFromContext",
                //                 interpolation: "runtime",
                //                 referenceName: "instanceUuid",
                //               },
                //             },
                //           },
                //         },
                //       },
                //       section: {
                //         type: "list",
                //         definition: [
                //           {
                //             type: "objectInstanceReportSection",
                //             definition: {
                //               label: {
                //                 transformerType: "mustacheStringTemplate",
                //                 interpolation: "build",
                //                 definition: "My {{newEntityName}}",
                //               },
                //               parentUuid: {
                //                 transformerType: "mustacheStringTemplate",
                //                 interpolation: "build",
                //                 definition: "{{newEntityUuid}}",
                //               },
                //               fetchedDataReference: "elementToDisplay",
                //             },
                //           },
                //         ],
                //       },
                //     },
                //   },
                // },
                definition: [
                  // createEntity
                  {
                    actionType: "createEntity",
                    actionLabel: "createEntity",                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    payload: {
                      application: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        referenceName: "testSelfApplicationUuid",
                      } as any,
                      deploymentUuid: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                      entities: [
                        {
                          entity: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "createEntity_newEntity",
                          },
                          entityDefinition: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "createEntity_newEntityDefinition",
                          },
                        },
                      ],
                    },
                  },
                  // // // createReports
                  // // {
                  // //   actionType: "transactionalInstanceAction",
                  // //   actionLabel: "createReports",
                  // //   instanceAction: {
                  // //     actionType: "createInstance",
                  // //     deploymentUuid: {
                  // //       transformerType: "getFromParameters",
                  // //       interpolation: "build",
                  // //       referenceName: "testDeploymentUuid",
                  // //     },
                  // //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  // //     payload: {
                  // //       applicationSection: "model",
                  // //       objects: [
                  // //         {
                  // //           parentName: {
                  // //             transformerType: "getFromParameters",
                  // //             interpolation: "build",
                  // //             referencePath: ["newEntityListReport", "parentName"],
                  // //           },
                  // //           parentUuid: {
                  // //             transformerType: "getFromParameters",
                  // //             interpolation: "build",
                  // //             referencePath: ["newEntityListReport", "parentUuid"],
                  // //           },
                  // //           applicationSection: "model",
                  // //           instances: [
                  // //             {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referenceName: "newEntityListReport",
                  // //             },
                  // //             {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referenceName: "newEntityDetailsReport",
                  // //             },
                  // //           ],
                  // //         },
                  // //       ],
                  // //     },
                  // //   },
                  // // },
                  // commit
                  {
                    actionType: "commit",
                    actionLabel: "commit",                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    payload: {
                      application: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        referenceName: "testSelfApplicationUuid",
                      } as any,
                      deploymentUuid: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        referenceName: "testDeploymentUuid",
                      },
                    },
                  },
                  // getListOfEntityDefinitions
                  {
                    actionType: "compositeRunBoxedQueryAction",
                    actionLabel: "getListOfEntityDefinitions",
                    nameGivenToResult: "newApplicationEntityDefinitionList",
                    query: {
                      actionType: "runBoxedQueryAction",                      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                      payload: {
                        application: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "testSelfApplicationUuid",
                        } as any,
                        deploymentUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "testDeploymentUuid",
                        },
                        applicationSection: "model",
                        query: {
                          queryType: "boxedQueryWithExtractorCombinerTransformer",
                          application: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "testSelfApplicationUuid",
                          } as any,
                          deploymentUuid: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "testDeploymentUuid",
                          },
                          pageParams: {
                            currentDeploymentUuid: {
                              transformerType: "getFromParameters",
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
                                transformerType: "getFromParameters",
                                interpolation: "build",
                                referencePath: ["entityEntityDefinition", "name"],
                              } as any,
                              parentUuid: {
                                transformerType: "getFromParameters",
                                interpolation: "build",
                                referencePath: ["entityEntityDefinition", "uuid"],
                              } as any,
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
                  // getListOfEntities
                  {
                    actionType: "compositeRunBoxedQueryAction",
                    actionLabel: "getListOfEntities",
                    nameGivenToResult: "newApplicationEntityList",
                    query: {
                      actionType: "runBoxedQueryAction",                      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                      payload: {
                        application: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "testSelfApplicationUuid"
                        } as any,
                        deploymentUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "testDeploymentUuid",
                        } as any,
                        applicationSection: "model",
                        query: {
                          queryType: "boxedQueryWithExtractorCombinerTransformer",
                          application: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "testSelfApplicationUuid",
                          } as any,
                          deploymentUuid: {
                            transformerType: "getFromParameters",
                            interpolation: "build",
                            referenceName: "testDeploymentUuid",
                          } as any,
                          pageParams: {
                            currentDeploymentUuid: {
                              transformerType: "getFromParameters",
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
                                transformerType: "getFromParameters",
                                interpolation: "build",
                                referencePath: ["entityEntity", "name"],
                              } as any,
                              parentUuid: {
                                transformerType: "getFromParameters",
                                interpolation: "build",
                                referencePath: ["entityEntity", "uuid"],
                              } as any,
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
                  // // // getListOfReports
                  // // {
                  // //   actionType: "compositeRunBoxedExtractorOrQueryAction",
                  // //   actionLabel: "getListOfReports",
                  // //   nameGivenToResult: "newApplicationReportList",
                  // //   query: {
                  // //     actionType: "runBoxedExtractorOrQueryAction",
                  // //     actionName: "runQuery",
                  // //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  // //     deploymentUuid: {
                  // //       transformerType: "getFromParameters",
                  // //       interpolation: "build",
                  // //       referenceName: "testDeploymentUuid",
                  // //     },
                  // //     payload: {
                  // //       applicationSection: "model",
                  // //       query: {
                  // //         queryType: "boxedQueryWithExtractorCombinerTransformer",
                  // //         deploymentUuid: {
                  // //           transformerType: "getFromParameters",
                  // //           interpolation: "build",
                  // //           referenceName: "testDeploymentUuid",
                  // //         },
                  // //         pageParams: {
                  // //           currentDeploymentUuid: {
                  // //             transformerType: "getFromParameters",
                  // //             interpolation: "build",
                  // //             referenceName: "testDeploymentUuid",
                  // //           },
                  // //         },
                  // //         runAsSql: true,
                  // //         queryParams: {},
                  // //         contextResults: {},
                  // //         extractors: {
                  // //           reports: {
                  // //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  // //             applicationSection: "model",
                  // //             parentName: {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referencePath: ["entityReport", "name"],
                  // //             },
                  // //             parentUuid: {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referencePath: ["entityReport", "uuid"],
                  // //             },
                  // //             orderBy: {
                  // //               attributeName: "name",
                  // //               direction: "ASC",
                  // //             },
                  // //           },
                  // //         },
                  // //       },
                  // //     },
                  // //   },
                  // // },
                  // // // getMenu
                  // // {
                  // //   actionType: "compositeRunBoxedQueryAction",
                  // //   actionLabel: "getMenu",
                  // //   nameGivenToResult: "menuUpdateQueryResult",
                  // //   queryTemplate: {
                  // //     actionType: "runBoxedQueryAction",
                  // //     actionName: "runQuery",
                  // //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  // //     deploymentUuid: {
                  // //       transformerType: "getFromParameters",
                  // //       interpolation: "build",
                  // //       referenceName: "testDeploymentUuid",
                  // //     },
                  // //     payload: {
                  // //       applicationSection: "model",
                  // //       query: {
                  // //         queryType: "boxedQueryWithExtractorCombinerTransformer",
                  // //         deploymentUuid: {
                  // //           transformerType: "getFromParameters",
                  // //           interpolation: "build",
                  // //           referenceName: "testDeploymentUuid",
                  // //         },
                  // //         pageParams: {},
                  // //         queryParams: {},
                  // //         contextResults: {},
                  // //         extractors: {
                  // //           menuList: {
                  // //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  // //             applicationSection: "model",
                  // //             parentName: {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referencePath: ["entityMenu", "name"],
                  // //             },
                  // //             parentUuid: {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referencePath: ["entityMenu", "uuid"],
                  // //             },
                  // //           },
                  // //         },
                  // //         runtimeTransformers: {
                  // //           menu: {
                  // //             transformerType: "pickFromList",
                  // //             interpolation: "runtime",
                  // //             applyTo: {
                  // //               transformerType: "getFromContext",
                  // //               interpolation: "runtime",
                  // //               referenceName: "menuList",
                  // //             },
                  // //             index: 0,
                  // //           },
                  // //           menuItem: {
                  // //             transformerType: "createObject",
                  // //             interpolation: "runtime",
                  // //             definition: {
                  // //               reportUuid: {
                  // //                 transformerType: "getFromParameters",
                  // //                 interpolation: "build",
                  // //                 referenceName: "createEntity_newEntityListReportUuid",
                  // //               },
                  // //               label: {
                  // //                 transformerType: "mustacheStringTemplate",
                  // //                 interpolation: "build",
                  // //                 definition: "List of {{newEntityName}}s",
                  // //               },
                  // //               section: "data",
                  // //               selfApplication: {
                  // //                 transformerType: "getFromParameters",
                  // //                 interpolation: "build",
                  // //                 referencePath: ["adminConfigurationDeploymentParis", "uuid"],
                  // //               },
                  // //               icon: "local_drink",
                  // //             },
                  // //           },
                  // //           updatedMenu: {
                  // //             transformerType: "transformer_menu_addItem",
                  // //             interpolation: "runtime",
                  // //             menuItemReference: {
                  // //               transformerType: "getFromContext",
                  // //               interpolation: "runtime",
                  // //               referenceName: "menuItem",
                  // //             },
                  // //             menuReference: {
                  // //               transformerType: "getFromContext",
                  // //               interpolation: "runtime",
                  // //               referenceName: "menu",
                  // //             },
                  // //             menuSectionItemInsertionIndex: -1,
                  // //           },
                  // //         },
                  // //       },
                  // //     },
                  // //   },
                  // // },
                  // // // updateMenu
                  // // {
                  // //   actionType: "transactionalInstanceAction",
                  // //   actionLabel: "updateMenu",
                  // //   instanceAction: {
                  // //     actionType: "updateInstance",
                  // //     deploymentUuid: {
                  // //       transformerType: "getFromParameters",
                  // //       interpolation: "build",
                  // //       referenceName: "testDeploymentUuid",
                  // //     },
                  // //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                  // //     payload: {
                  // //       applicationSection: "model",
                  // //       objects: [
                  // //         {
                  // //           parentName: {
                  // //             transformerType: "getFromParameters",
                  // //             interpolation: "build",
                  // //             referencePath: ["entityMenu", "name"],
                  // //           },
                  // //           parentUuid: {
                  // //             transformerType: "getFromParameters",
                  // //             interpolation: "build",
                  // //             referencePath: ["entityMenu", "uuid"],
                  // //           },
                  // //           applicationSection: "model",
                  // //           instances: [
                  // //             {
                  // //               transformerType: "getFromContext",
                  // //               interpolation: "runtime",
                  // //               referencePath: ["menuUpdateQueryResult", "updatedMenu"],
                  // //             },
                  // //           ],
                  // //         },
                  // //       ],
                  // //     },
                  // //   },
                  // // },
                  // // // commit
                  // // {
                  // //   actionType: "commit",
                  // //   actionLabel: "commit",
                  // //   endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  // //   deploymentUuid: {
                  // //     transformerType: "getFromParameters",
                  // //     interpolation: "build",
                  // //     referenceName: "testDeploymentUuid",
                  // //   },
                  // // },
                  // // // getNewMenuList
                  // // {
                  // //   actionType: "compositeRunBoxedQueryAction",
                  // //   actionLabel: "getNewMenuList",
                  // //   nameGivenToResult: "newMenuList",
                  // //   queryTemplate: {
                  // //     actionType: "runBoxedQueryAction",
                  // //     actionName: "runQuery",
                  // //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                  // //     deploymentUuid: {
                  // //       transformerType: "getFromParameters",
                  // //       interpolation: "build",
                  // //       referenceName: "testDeploymentUuid",
                  // //     },
                  // //     payload: {
                  // //       applicationSection: "model",
                  // //       query: {
                  // //         queryType: "boxedQueryWithExtractorCombinerTransformer",
                  // //         deploymentUuid: {
                  // //           transformerType: "getFromParameters",
                  // //           interpolation: "build",
                  // //           referenceName: "testDeploymentUuid",
                  // //         },
                  // //         pageParams: {},
                  // //         queryParams: {},
                  // //         contextResults: {},
                  // //         extractors: {
                  // //           menuList: {
                  // //             extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  // //             applicationSection: "model",
                  // //             parentName: "Menu",
                  // //             parentUuid: {
                  // //               transformerType: "getFromParameters",
                  // //               interpolation: "build",
                  // //               referencePath: ["entityMenu", "uuid"],
                  // //             },
                  // //           },
                  // //         },
                  // //       },
                  // //     },
                  // //   },
                  // // },
                ],
              },
            },
            testCompositeActionAssertions: [
              // checkEntities
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
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "newEntityUuid",
                        },
                        parentUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referencePath: ["entityEntity", "uuid"],
                        },
                        selfApplication: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "testSelfApplicationUuid",
                        },
                        description: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "createEntity_newEntityDescription",
                        },
                        name: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "newEntityName",
                        },
                      },
                    ],
                  },
                },
              },
              // checkEntityDefinitions
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
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "newEntityName",
                        },
                        uuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "newEntityDefinitionUuid",
                        },
                        parentName: "EntityDefinition",
                        parentUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referencePath: ["entityEntityDefinition", "uuid"],
                        },
                        entityUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referencePath: ["newEntityUuid"],
                        },
                        conceptLevel: "Model",
                        defaultInstanceDetailsReportUuid: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "defaultInstanceDetailsReportUuid",
                        },
                        mlSchema: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          referenceName: "newEntityJzodSchema",
                        },
                      },
                    ],
                  },
                },
              },
              // // checkReports
              // {
              //   actionType: "compositeRunTestAssertion",
              //   actionLabel: "checkReports",
              //   nameGivenToResult: "checkReportList",
              //   testAssertion: {
              //     testType: "testAssertion",
              //     testLabel: "checkReports",
              //     definition: {
              //       resultAccessPath: ["newApplicationReportList", "reports"],
              //       ignoreAttributes: ["author", "parentDefinitionVersionUuid", "type"],
              //       expectedValue: [
              //         {
              //           transformerType: "getFromParameters",
              //           interpolation: "build",
              //           referenceName: "newEntityListReport",
              //         },
              //         {
              //           transformerType: "getFromParameters",
              //           interpolation: "build",
              //           referenceName: "newEntityDetailsReport",
              //         },
              //       ],
              //     },
              //   },
              // },
              // // checkMenus
              // {
              //   actionType: "compositeRunTestAssertion",
              //   actionLabel: "checkMenus",
              //   nameGivenToResult: "checkMenuList",
              //   testAssertion: {
              //     testType: "testAssertion",
              //     testLabel: "checkMenus",
              //     definition: {
              //       resultAccessPath: ["newMenuList", "menuList"],
              //       ignoreAttributes: ["author"],
              //       expectedValue: [
              //         {
              //           uuid: "dd168e5a-2a21-4d2d-a443-032c6d15eb22",
              //           parentName: "Menu",
              //           parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
              //           parentDefinitionVersionUuid: null,
              //           name: "LibraryMenu",
              //           defaultLabel: "Library Menu",
              //           description:
              //             "This is the default menu allowing to explore the Library SelfApplication.",
              //           definition: {
              //             menuType: "complexMenu",
              //             definition: [
              //               {
              //                 items: [
              //                   {
              //                     icon: "category",
              //                     label: "Library Entities",
              //                     section: "model",
              //                     reportUuid: "c9ea3359-690c-4620-9603-b5b402e4a2b9",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "category",
              //                     label: "Library Entity Definitions",
              //                     section: "model",
              //                     reportUuid: "f9aff35d-8636-4519-8361-c7648e0ddc68",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "list",
              //                     label: "Library Reports",
              //                     section: "model",
              //                     reportUuid: "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "auto_stories",
              //                     label: "Library Books",
              //                     section: "data",
              //                     reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "star",
              //                     label: "Library Authors",
              //                     section: "data",
              //                     reportUuid: "66a09068-52c3-48bc-b8dd-76575bbc8e72",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "account_balance",
              //                     label: "Library Publishers",
              //                     section: "data",
              //                     reportUuid: "a77aa662-006d-46cd-9176-01f02a1a12dc",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "flag",
              //                     label: "Library countries",
              //                     section: "data",
              //                     reportUuid: "08176cc7-43ae-4fca-91b7-bf869d19e4b9",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     icon: "person",
              //                     label: "Library Users",
              //                     section: "data",
              //                     reportUuid: "3df9413d-5050-4357-910c-f764aacae7e6",
              //                     selfApplication: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
              //                   },
              //                   {
              //                     reportUuid: {
              //                       transformerType: "getFromParameters",
              //                       interpolation: "build",
              //                       referenceName: "createEntity_newEntityListReportUuid",
              //                     },
              //                     label: {
              //                       transformerType: "mustacheStringTemplate",
              //                       interpolation: "build",
              //                       definition: "List of {{newEntityName}}s",
              //                     },
              //                     section: "data",
              //                     selfApplication: {
              //                       transformerType: "getFromParameters",
              //                       interpolation: "build",
              //                       referencePath: ["adminConfigurationDeploymentParis", "uuid"],
              //                     },
              //                     icon: "local_drink",
              //                   },
              //                 ],
              //                 label: "library",
              //                 title: "Library",
              //               },
              //             ],
              //           },
              //         },
              //       ],
              //     },
              //   },
              // },
            ],
          },
        },
      },
    },
  };
  return {
    testSuitesForBuildPlusRuntimeCompositeAction,
    testDeploymentStorageConfiguration,
    testDeploymentUuid,
  };
}