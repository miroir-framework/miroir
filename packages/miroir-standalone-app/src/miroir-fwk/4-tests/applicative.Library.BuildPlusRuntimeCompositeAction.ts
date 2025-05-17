import { v4 as uuidv4 } from "uuid";

import {
  entityAuthor,
  MetaEntity,
  entityDefinitionAuthor,
  EntityDefinition,
  author1,
  author2,
  author3,
  EntityInstance,
  entityBook,
  entityDefinitionBook,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  entityPublisher,
  entityDefinitionPublisher,
  publisher1,
  publisher2,
  publisher3,
  Uuid,
  StoreUnitConfiguration,
  getBasicStoreUnitConfiguration,
  InitApplicationParameters,
  getBasicApplicationConfiguration,
  JzodObject,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  adminConfigurationDeploymentLibrary,
  entityMenu,
} from "miroir-core";
import {
  BuildCompositeAction,
  CompositeRunTestAssertion,
  BuildPlusRuntimeDomainAction,
  miroirConfig,
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { adminConfigurationDeploymentParis } from "../../constants";
import {
  TestActionParams,
  createDeploymentCompositeAction,
  resetAndinitializeDeploymentCompositeAction,
} from "./tests-utils";
import { testOnLibrary_resetLibraryDeployment } from "./tests-utils-testOnLibrary";

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
const testAdminConfigurationDeploymentUuid: Uuid = uuidv4();
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
  testAdminConfigurationDeploymentUuid,
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
// CREATE ENTITY, DEFINITION
// ##############################################################################################
const createEntity_newEntity = {
  uuid: newEntityUuid,
  parentUuid: entityEntity.uuid,
  selfApplication: testSelfApplicationUuid,
  description: createEntity_newEntityDescription,
  name: newEntityName,
};

const createEntity_newEntityDefinition: EntityDefinition = {
  name: newEntityName,
  uuid: newEntityDefinitionUuid,
  parentName: "EntityDefinition",
  parentUuid: entityEntityDefinition.uuid,
  entityUuid: createEntity_newEntity.uuid,
  conceptLevel: "Model",
  defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
  jzodSchema: newEntityJzodSchema,
};

// const createEntityCompositeAction: BuildPlusRuntimeCompositeAction = {
const createEntityCompositeAction: BuildCompositeAction = {
  actionType: "compositeAction",
  // actionLabel: "createEntityCompositeActionTemplate",
  actionLabel: "createEntityCompositeAction",
  actionName: "sequence",
  definition: [
    // createEntity
    {
      actionType: "modelAction",
      actionName: "createEntity",
      actionLabel: "createEntity",
      deploymentUuid: testAdminConfigurationDeploymentUuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      entities: [
        {
          // entity: createEntity_newEntity,
          entity: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "createEntity_newEntity",
          },
          // entityDefinition: createEntity_newEntityDefinition,
          entityDefinition: {
            transformerType: "parameterReference",
            interpolation: "build",
            referenceName: "createEntity_newEntityDefinition",
          },
        },
      ],
    },
  ],
};
// const createEntityCompositeActionTemplatePrepActions: CompositeActionTemplate["definition"] = [
const createEntityCompositeActionPrepActions: any[] = [
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
      deploymentUuid: testAdminConfigurationDeploymentUuid,
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: testAdminConfigurationDeploymentUuid,
        pageParams: {
          currentDeploymentUuid: testAdminConfigurationDeploymentUuid,
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
      deploymentUuid: testAdminConfigurationDeploymentUuid,
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: testAdminConfigurationDeploymentUuid,
        pageParams: {
          currentDeploymentUuid: testAdminConfigurationDeploymentUuid,
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
const createEntityCompositeActionAssertions: CompositeRunTestAssertion[] = [
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
        ignoreAttributes: ["author", "conceptLevel", "parentDefinitionVersionUuid", "parentName"],
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
// REPORTS
// ##############################################################################################
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
          transformerType: "contextReference",
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

// const createReportsCompositeAction: DomainAction = {
const createReportsCompositeAction: BuildPlusRuntimeDomainAction = {
  actionType: "transactionalInstanceAction",
  actionLabel: "createReports",
  instanceAction: {
    actionType: "instanceAction",
    actionName: "createInstance",
    applicationSection: "model",
    deploymentUuid: testAdminConfigurationDeploymentUuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    objects: [
      {
        parentName: newEntityListReport.parentName,
        parentUuid: newEntityListReport.parentUuid,
        applicationSection: "model",
        instances: [
          // List of new entity instances Report Definition
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
      deploymentUuid: testAdminConfigurationDeploymentUuid,
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        deploymentUuid: testAdminConfigurationDeploymentUuid,
        pageParams: {
          currentDeploymentUuid: testAdminConfigurationDeploymentUuid,
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
              // TODO: orderBy is ignored!?
              attributeName: "name",
              direction: "ASC",
            },
          },
        },
      },
    },
  },
];

const createReportsCompositeActionAssertions: CompositeRunTestAssertion[] = [
  {
    actionType: "compositeRunTestAssertion",
    actionLabel: "checkReports",
    nameGivenToResult: "checkReportList",
    testAssertion: {
      // testType: "testAssertion",
      testType: "testAssertion",
      testLabel: "checkReports",
      definition: {
        resultAccessPath: ["newApplicationReportList", "reports"],
        ignoreAttributes: ["author", "parentDefinitionVersionUuid", "type"],
        // expectedValue: [newEntityDetailsReport, newEntityListReport],
        expectedValue: [newEntityListReport, newEntityDetailsReport],
      },
    },
  },
];
// ##############################################################################################
// MENU
// ##############################################################################################

// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
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
        //
        testSelfApplicationUuid,
        entityMenu,
        entityReport,
        testAdminConfigurationDeploymentUuid,
      },
      testCompositeAction: {
        testType: "testBuildPlusRuntimeCompositeActionSuite",
        testLabel: testSuiteNameForBuildPlusRuntimeCompositeAction,
        beforeAll: createDeploymentCompositeAction(
          testAdminConfigurationDeploymentUuid,
          testDeploymentStorageConfiguration
        ),
        beforeEach: resetAndinitializeDeploymentCompositeAction(
          testAdminConfigurationDeploymentUuid,
          initParametersForTest,
          []
        ),
        afterEach: testOnLibrary_resetLibraryDeployment(
          miroirConfig,
          testAdminConfigurationDeploymentUuid
        ),
        // afterAll: testOnLibrary_deleteLibraryDeployment(miroirConfig, testAdminConfigurationDeploymentUuid),
        testCompositeActions: {
          "create new Entity and reports from spreadsheet": {
            testType: "testBuildPlusRuntimeCompositeAction",
            testLabel: "createEntityAndReportFromSpreadsheet",
            compositeAction: {
              actionType: "compositeAction",
              actionLabel: "createEntityAndReportFromSpreadsheet",
              actionName: "sequence",
              templates: {
                createEntity_newEntity: {
                  uuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "newEntityUuid",
                  },
                  parentUuid: entityEntity.uuid,
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
                  parentUuid: entityEntityDefinition.uuid,
                  entityUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["createEntity_newEntity", "uuid"],
                  },
                  conceptLevel: "Model",
                  defaultInstanceDetailsReportUuid: defaultInstanceDetailsReportUuid,
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
                        // TODO: gets interpreted both at build and runtime! Too complex!
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
                            transformerType: "constant", // protecting runtime reference from handleRuntimeCompositeAction runtime interpretation
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
                ...(createEntityCompositeAction as any).definition,
                createReportsCompositeAction,
                // commit
                {
                  actionType: "modelAction",
                  actionName: "commit",
                  actionLabel: "commit",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testAdminConfigurationDeploymentUuid",
                  },
                },
                ...createEntityCompositeActionPrepActions,
                ...createReportsCompositeActionPrepActions,
                // update menu
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
                      referenceName: "testAdminConfigurationDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testAdminConfigurationDeploymentUuid",
                      },
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        menuList: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          // parentName: entityMenu.name,
                          parentName: {
                            transformerType: "parameterReference",
                            interpolation: "build",
                            referencePath: ["entityMenu", "name"],
                          },
                          parentUuid: entityMenu.uuid,
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
                            reportUuid: createEntity_newEntityListReportUuid,
                            label: "List of " + newEntityName,
                            section: "data",
                            selfApplication: adminConfigurationDeploymentParis.uuid,
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
                // update current menu
                {
                  actionType: "transactionalInstanceAction",
                  actionLabel: "updateMenu",
                  instanceAction: {
                    actionType: "instanceAction",
                    actionName: "updateInstance",
                    applicationSection: "model",
                    deploymentUuid: {
                      transformerType: "parameterReference",
                      interpolation: "build",
                      referenceName: "testAdminConfigurationDeploymentUuid",
                    },
                    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                    objects: [
                      {
                        parentName: entityMenu.name,
                        parentUuid: entityMenu.uuid,
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
                // commit
                {
                  actionType: "modelAction",
                  actionName: "commit",
                  actionLabel: "commit",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "testAdminConfigurationDeploymentUuid",
                  },
                },
                // fetch menuUpdateQueryResult: current menu
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
                      referenceName: "testAdminConfigurationDeploymentUuid",
                    },
                    query: {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: {
                        transformerType: "parameterReference",
                        interpolation: "build",
                        referenceName: "testAdminConfigurationDeploymentUuid",
                      },
                      // runAsSql: true,
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        menuList: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: "model",
                          parentName: "Menu",
                          parentUuid: entityMenu.uuid,
                        },
                      },
                    },
                  },
                },
              ],
            },
            testCompositeActionAssertions: [
              ...createEntityCompositeActionAssertions,
              ...createReportsCompositeActionAssertions,
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
                                  // reportUuid: "7802e89c-2e81-4ff5-b3dd-4c0e2d879748",
                                  reportUuid: createEntity_newEntityListReportUuid,
                                  label: "List of newEntityTest",
                                  section: "data",
                                  selfApplication: adminConfigurationDeploymentParis.uuid,
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
        },
      },
      // } as TestActionParams,
    },
  };
  return testSuitesForBuildPlusRuntimeCompositeAction;
}