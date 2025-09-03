import { v4 as uuidv4 } from "uuid";

import {
  EntityDefinition,
  InitApplicationParameters,
  JzodObject,
  MiroirConfigClient,
  StoreUnitConfiguration,
  TestCompositeActionParams,
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
export const testSuiteNameForBuildPlusRuntimeCompositeAction: string =
  "applicative.Library.BuildPlusRuntimeCompositeAction.integ.test";
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
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  // TODO: correct deploymentUuid usage
                  /**
                   * The types of 'compositeAction.definition' are incompatible between these types.
Type '{ actionType: "createEntity"; actionLabel: string; deploymentUuid: { transformerType: "parameterReference"; interpolation: "build"; referenceName: string; }; endpoint: "7947ae40-eb34-4149-887b-15a9021e714e"; payload: { ...; }; }' is not assignable to type 'BuildPlusRuntimeDomainAction_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction | ... 4 more ... | { ...; }'.
Types of property 'deploymentUuid' are incompatible.
  Type '{ transformerType: "parameterReference"; interpolation: "build"; referenceName: string; }' is not assignable to type 'string | TransformerForBuildPlusRuntimeCarryOnObject'.
	Types of property 'transformerType' are incompatible.
	  Type '"parameterReference"' is not assignable to type '"defaultValueForMLSchema" | "resolveConditionalSchema" | "resolveSchemaReferenceInContext" | "unfoldSchemaOnce" | "jzodTypeCheck"'.ts(2634)
                   */
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testDeploymentUuid",
                  },
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
                {
                  actionType: "transactionalInstanceAction",
                  actionLabel: "createReports",
                  instanceAction: {
                    actionType: "createInstance",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    payload: {
                      applicationSection: "model",
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
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    payload: {
                      applicationSection: "model",
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
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "getListOfEntities",
                  nameGivenToResult: "newApplicationEntityList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    payload: {
                      applicationSection: "model",
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
                },
                {
                  actionType: "compositeRunBoxedExtractorOrQueryAction",
                  actionLabel: "getListOfReports",
                  nameGivenToResult: "newApplicationReportList",
                  query: {
                    actionType: "runBoxedExtractorOrQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    payload: {
                      applicationSection: "model",
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
                },
                {
                  actionType: "compositeRunBoxedQueryAction",
                  actionLabel: "getMenu",
                  nameGivenToResult: "menuUpdateQueryResult",
                  queryTemplate: {
                    actionType: "runBoxedQueryAction",
                    actionName: "runQuery",
                    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    payload: {
                      applicationSection: "model",
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
                              transformerType: "contextReference",
                              interpolation: "runtime",
                              referenceName: "menuList",
                            },
                            index: 0,
                          },
                          menuItem: {
                            transformerType: "freeObjectTemplate",
                            interpolation: "runtime",
                            definition: {
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
                },
                {
                  actionType: "transactionalInstanceAction",
                  actionLabel: "updateMenu",
                  instanceAction: {
                    actionType: "updateInstance",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    payload: {
                      applicationSection: "model",
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
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testDeploymentUuid",
                    },
                    payload: {
                      applicationSection: "model",
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
                        defaultLabel: "Library Menu",
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
        }
        // } as any, // TODO: remove any
      },
      // } as TestActionParams,
    },
  };
  return {
    testSuitesForBuildPlusRuntimeCompositeAction,
    testDeploymentStorageConfiguration,
    testDeploymentUuid,
  };
}