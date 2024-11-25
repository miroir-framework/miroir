import { v4 as uuidv4 } from "uuid";
// import { describe, expect } from 'vitest';

import {
  CompositeActionTemplate,
  DomainAction,
  DomainElement,
  EntityInstance,
  jzodSchema,
  MetaModel,
  StoreUnitConfiguration,
  TransformerForBuild,
  TransformerForRuntime
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformer_apply } from "../../2_domain/Transformers";
import {
  author1,
  author2,
  author3,
  author4,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  Country1,
  Country2,
  Country3,
  Country4,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityReport,
  ignorePostgresExtraAttributesOnList,
  MetaEntity,
  Uuid
} from "../../index";
import { resolveCompositeActionTemplate } from "../../2_domain/ResolveCompositeAction";
import { JzodObject } from "@miroir-framework/jzod-ts";
import { transformer } from "zod";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
const adminConfigurationDeploymentParis = {
  uuid: "f1b74341-129b-474c-affa-e910d6cba01d",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "ParisApplicationSqlDeployment",
  defaultLabel: "ParisApplicationSqlDeployment",
  application: "70e02039-e283-4381-9575-8c52aed18a87",
  description: "The default Sql Deployment for Application Paris",
  configuration: {
    admin: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "miroirAdmin",
    },
    model: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "ParisModel",
    },
    data: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "ParisData",
    },
  },
};

// describe.sequential("templatesDEFUNCT.unit.test", () => {
describe("resolveCompositeActionTemplate.unit.test", () => {
  // TODO: test failure cases!
  // ################################################################################################
  it("resolve action template for createEntity", async () => {
    console.log("resolve basic transformer constantUuid START");

    const instances:EntityInstance[] = [];

    const actionHandlerCreateFountainEntity: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionName: "sequence",
      templates: {
        newEntityDefinition: {
          name: {
            transformerType: "parameterReference",
            referenceName: "createEntity_newEntityName",
          },
          uuid: {
            transformerType: "parameterReference",
            referenceName: "createEntity_newEntityDefinitionUuid",
          },
          parentName: "EntityDefinition",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityEntityDefinition.uuid}}",
          },
          entityUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{createEntity_newEntity.uuid}}",
          },
          conceptLevel: "Model",
          defaultInstanceDetailsReportUuid: {
            transformerType: "parameterReference",
            referenceName: "createEntity_newEntityDetailsReportUuid",
          },
          jzodSchema: {
            transformerType: "parameterReference",
            referenceName: "jzodSchema",
          },
        },
        // list of instances Report Definition
        newEntityListReport: {
          uuid: {
            transformerType: "parameterReference",
            referenceName: "createEntity_newEntityListReportUuid",
          },
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: "Report",
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.uuid}}",
          },
          conceptLevel: "Model",
          name: {
            transformerType: "mustacheStringTemplate",
            definition: "{{createEntity_newEntityName}}List",
          },
          defaultLabel: {
            transformerType: "mustacheStringTemplate",
            definition: "List of {{createEntity_newEntityName}}s",
          },
          type: "list",
          definition: {
            extractors: {
              instanceList: {
                queryType: "extractorByEntityReturningObjectList",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "createEntity_newEntityName",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntity.uuid}}",
                },
              },
            },
            section: {
              type: "objectListReportSection",
              definition: {
                label: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntityName}}s",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntity.uuid}}",
                },
                fetchedDataReference: "instanceList",
              },
            },
          },
        },
        // Details of an instance Report Definition
        newEntityDetailsReport: {
          uuid: {
            transformerType: "parameterReference",
            referenceName: "createEntity_newEntityDetailsReportUuid",
          },
          application: {
            transformerType: "parameterReference",
            referenceName: "currentApplicationUuid",
          },
          parentName: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.name}}",
          },
          parentUuid: {
            transformerType: "mustacheStringTemplate",
            definition: "{{entityReport.uuid}}",
          },
          conceptLevel: "Model",
          name: {
            transformerType: "mustacheStringTemplate",
            definition: "{{createEntity_newEntityName}}Details",
          },
          defaultLabel: {
            transformerType: "mustacheStringTemplate",
            definition: "Details of {{createEntity_newEntityName}}",
          },
          definition: {
            extractorTemplates: {
              elementToDisplay: {
                queryType: "extractorForObjectByDirectReference",
                parentName: {
                  transformerType: "parameterReference",
                  referenceName: "createEntity_newEntityName",
                },
                parentUuid: {
                  transformerType: "freeObjectTemplate",
                  definition: {
                    transformerType: "constantString",
                    constantStringValue: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{createEntity_newEntity.uuid}}",
                    },
                  },
                },
                instanceUuid: {
                  transformerType: "constantObject",
                  constantObjectValue: {
                    transformerType: "parameterReference",
                    referenceName: "instanceUuid",
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
                      definition: "My {{createEntity_newEntityName}}",
                    },
                    parentUuid: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{createEntity_newEntity.uuid}}",
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
        // createEntity
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "createEntity",
          domainAction: {
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {
                entity: {
                  transformerType: "parameterReference",
                  referenceName: "createEntity_newEntity",
                },
                entityDefinition: {
                  transformerType: "parameterReference",
                  referenceName: "newEntityDefinition",
                },
              },
            ],
          },
        } as any,
        // createReports
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "createReports",
          domainAction: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "createInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentName}}",
                  },
                  parentUuid: {
                    transformerType: "mustacheStringTemplate",
                    definition: "{{newEntityListReport.parentUuid}}",
                  },
                  applicationSection: "model",
                  instances: [
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityListReport",
                    },
                    {
                      transformerType: "parameterReference",
                      referenceName: "newEntityDetailsReport",
                    },
                  ],
                },
              ],
            },
          },
        },
        // commit
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "commit",
          domainAction: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
          // action: {
          //   transformerType: "parameterReference",
          //   referenceName: "commitAction",
          // },
        },
        // instances for new Entity, put in "menuUpdateQueryResult"
        {
          compositeActionType: "queryTemplate",
          
          nameGivenToResult: "menuUpdateQueryResult",
          queryTemplate: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: "model",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid"
            },
            query: {
              queryType: "queryWithExtractorCombinerTransformer",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              // runAsSql: true,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractorTemplates: {
                menuList: {
                  queryType: "extractorTemplateForObjectListByEntity",
                  applicationSection: "model",
                  parentName: "Menu",
                  parentUuid: {
                    transformerType: "freeObjectTemplate",
                    definition: {
                      transformerType: {
                        transformerType: "constantString",
                        constantStringValue: "constantUuid"
                      },
                      constantUuidValue: {
                        transformerType: "mustacheStringTemplate",
                        definition: "{{entityMenu.uuid}}",
                      },
                    },
                  },
                },
              },
              runtimeTransformers: {
                // menuList: {
                //   transformerType: "objectValues",
                //   interpolation: "runtime",
                //   referencedExtractor: "menuUuidIndex",
                // },
                menu: {
                  transformerType: "listPickElement",
                  interpolation: "runtime",
                  referencedExtractor: "menuList",
                  index: 1
                },
                menuItem: {
                  transformerType: "freeObjectTemplate",
                  definition: {
                    reportUuid: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{createEntity_newEntityListReportUuid}}",
                    },
                    label: {
                      transformerType: "mustacheStringTemplate",
                      definition: "List of {{createEntity_newEntityName}}"
                    },
                    section: "data",
                    application: {
                      transformerType: "mustacheStringTemplate",
                      definition: "{{adminConfigurationDeploymentParis.uuid}}",
                    }, // TODO: replace with application uuid, this is a deployment at the moment
                    icon: "local_drink"
                  }
                },
                updatedMenu:{
                  transformerType: "transformer_menu_addItem",
                  interpolation: "runtime",
                  transformerDefinition: {
                    menuItemReference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "menuItem"
                    },
                    menuReference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "menu"
                    },
                    menuSectionItemInsertionIndex: -1,
                  }
                }
              },
            }
          }
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "updateMenu",
          domainAction: {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "updateInstance",
              applicationSection: "model",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: entityMenu.name,
                  parentUuid: entityMenu.uuid,
                  applicationSection: "model",
                  instances: [
                    {
                      transformerType: "objectDynamicAccess",
                      interpolation: "runtime",
                      objectAccessPath: [
                        {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "menuUpdateQueryResult",
                        },
                        "updatedMenu"
                      ],
                    },
                  ]
                }
              ],
            }
          }
        },
        // commit
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "commit",
          domainAction: {
            actionName: "commit",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
        },
        // insert imported instances
        {
          compositeActionType: "domainAction",
          domainAction: {
            actionType: "instanceAction",
            actionName: "createInstance",
            applicationSection: "data",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntity.name}}",
                },
                parentUuid: {
                  transformerType: "mustacheStringTemplate",
                  definition: "{{createEntity_newEntity.uuid}}",
                },
                applicationSection: "data",
                instances: instances,
              },
            ],
          },
        },
        // rollback / refresh
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "rollback",
          domainAction: {
            actionName: "rollback",
            actionType: "modelAction",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid",
            },
          },
        },
      ],
    };
    const jzodSchema:JzodObject = {
      type: "object",
      definition: {
        uuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
        },
        parentName: {
          type: "string",
          optional: true,
          tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
        },
        parentUuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { id: 1, defaultLabel: "parentUuid", editable: false } as any,
        },
      },
    };

    const newEntityUuid = "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const currentApplicationUuid = "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const createEntity_newEntityDescription = "newEntityDescription";
    const createEntity_newEntityName = "newEntityName";

    const newEntity: MetaEntity = {
      uuid: newEntityUuid,
      parentUuid: entityEntity.uuid,
      application: currentApplicationUuid,
      description: createEntity_newEntityDescription,
      name: createEntity_newEntityName,
    }

    const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
      currentApplicationName: "Paris",
      currentApplicationUuid,
      currentDeploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      createEntity_newEntityName,
      createEntity_newEntityDescription,
      createEntity_newEntityUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      createEntity_newEntityDefinitionUuid: "d4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      createEntity_newEntityDetailsReportUuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      createEntity_newEntityListReportUuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      createEntity_newEntity: newEntity,
      adminConfigurationDeploymentParis: {},
      //TODO: tag params, should be passed as context instead?
      jzodSchema,
      entityEntityDefinition,
      entityReport,
      entityMenu,
    }

    const {
      resolvedCompositeActionDefinition,
      resolvedCompositeActionTemplates,
    } = resolveCompositeActionTemplate(
      actionHandlerCreateFountainEntity,
      actionEffectiveParamsCreateEntity,
      {} as MetaModel
    // ): CompositeAction {
    );

    const expectedResult = [
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "createEntity",
        domainAction: {
          actionType: "modelAction",
          actionName: "createEntity",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          entities: [
            {
              entity: {
                uuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                application: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                description: "newEntityDescription",
                name: "newEntityName",
              },
              entityDefinition: {
                name: "newEntityName",
                uuid: "d4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                parentName: "EntityDefinition",
                parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                entityUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                conceptLevel: "Model",
                defaultInstanceDetailsReportUuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                jzodSchema: {
                  type: "object",
                  definition: {
                    uuid: {
                      type: "string",
                      validations: [
                        {
                          type: "uuid",
                        },
                      ],
                      tag: {
                        id: 1,
                        defaultLabel: "Uuid",
                        editable: false,
                      },
                    },
                    parentName: {
                      type: "string",
                      optional: true,
                      tag: {
                        id: 1,
                        defaultLabel: "Uuid",
                        editable: false,
                      },
                    },
                    parentUuid: {
                      type: "string",
                      validations: [
                        {
                          type: "uuid",
                        },
                      ],
                      tag: {
                        id: 1,
                        defaultLabel: "parentUuid",
                        editable: false,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "createReports",
        domainAction: {
          actionType: "transactionalInstanceAction",
          instanceAction: {
            actionType: "instanceAction",
            actionName: "createInstance",
            applicationSection: "model",
            deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: "Report",
                parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
                applicationSection: "model",
                instances: [
                  {
                    uuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                    application: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                    parentName: "Report",
                    parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
                    conceptLevel: "Model",
                    name: "newEntityNameList",
                    defaultLabel: "List of newEntityNames",
                    type: "list",
                    definition: {
                      extractors: {
                        instanceList: {
                          queryType: "extractorByEntityReturningObjectList",
                          parentName: "newEntityName",
                          parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                        },
                      },
                      section: {
                        type: "objectListReportSection",
                        definition: {
                          label: "newEntityNames",
                          parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                          fetchedDataReference: "instanceList",
                        },
                      },
                    },
                  },
                  {
                    uuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                    application: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                    parentName: "Report",
                    parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
                    conceptLevel: "Model",
                    name: "newEntityNameDetails",
                    defaultLabel: "Details of newEntityName",
                    definition: {
                      extractorTemplates: {
                        elementToDisplay: {
                          queryType: "extractorForObjectByDirectReference",
                          parentName: "newEntityName",
                          parentUuid: {
                            transformerType: "constantString",
                            constantStringValue: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                          },
                          instanceUuid: {
                            transformerType: "parameterReference",
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
                              label: "My newEntityName",
                              parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                              fetchedDataReference: "elementToDisplay",
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "commit",
        domainAction: {
          actionName: "commit",
          actionType: "modelAction",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
        },
      },
      {
        compositeActionType: "queryTemplate",
        nameGivenToResult: "menuUpdateQueryResult",
        queryTemplate: {
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: "model",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
          query: {
            queryType: "queryWithExtractorCombinerTransformer",
            deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractorTemplates: {
              menuList: {
                queryType: "extractorTemplateForObjectListByEntity",
                applicationSection: "model",
                parentName: "Menu",
                parentUuid: {
                  transformerType: "constantUuid",
                  constantUuidValue: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
                },
              },
            },
            runtimeTransformers: {
              menu: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                referencedExtractor: "menuList",
                index: 1,
              },
              menuItem: {
                reportUuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
                label: "List of newEntityName",
                section: "data",
                application: "",
                icon: "local_drink",
              },
              updatedMenu: {
                transformerType: "transformer_menu_addItem",
                interpolation: "runtime",
                transformerDefinition: {
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
        compositeActionType: "domainAction",
        compositeActionStepLabel: "updateMenu",
        domainAction: {
          actionType: "transactionalInstanceAction",
          instanceAction: {
            actionType: "instanceAction",
            actionName: "updateInstance",
            applicationSection: "model",
            deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            objects: [
              {
                parentName: "Menu",
                parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
                applicationSection: "model",
                instances: [
                  {
                    transformerType: "objectDynamicAccess",
                    interpolation: "runtime",
                    objectAccessPath: [
                      {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "menuUpdateQueryResult",
                      },
                      "updatedMenu",
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "commit",
        domainAction: {
          actionName: "commit",
          actionType: "modelAction",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
        },
      },
      {
        compositeActionType: "domainAction",
        domainAction: {
          actionType: "instanceAction",
          actionName: "createInstance",
          applicationSection: "data",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          objects: [
            {
              parentName: "newEntityName",
              parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
              applicationSection: "data",
              instances: [],
            },
          ],
        },
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "rollback",
        domainAction: {
          actionName: "rollback",
          actionType: "modelAction",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
        },
      },
    ];

    console.log("################################ resolvedCompositeActionDefinition", JSON.stringify(resolvedCompositeActionDefinition, null, 2));
    console.log("################################ expectedResult", JSON.stringify(expectedResult, null, 2));
    expect(resolvedCompositeActionDefinition).toEqual(expectedResult);

    console.log("resolve basic transformer constantUuid END");
  });

  // ################################################################################################
  it("resolve action template for insertMunicipalities", async () => {
    console.log("resolve basic transformer constantUuid START");

    const instances:EntityInstance[] = [];

    const jzodSchema:JzodObject = {
      type: "object",
      definition: {
        uuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
        },
        parentName: {
          type: "string",
          optional: true,
          tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
        },
        parentUuid: {
          type: "string",
          validations: [{ type: "uuid" }],
          tag: { id: 1, defaultLabel: "parentUuid", editable: false } as any,
        },
      },
    };

    const splittedEntityUuid: Uuid = "14b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const splittedEntityName: string = "Test"
    const splittedEntityAttribute: string = "TestAttribute";
    const splittedEntityDefinitionUuid: Uuid = "24b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const newEntityUuid: Uuid = "34b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const newEntityName: string = "Test2"

    // const newEntityUuid = "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const currentApplicationUuid = "44b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const createEntity_newEntityDescription = "newEntityDescription";
    const createEntity_newEntityName = "newEntityName";

    const newEntityDescription = "Municipalities";
    const currentDeploymentUuid = "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const splitEntity_newEntityListReportUuid: string = "64b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const splitEntity_newEntityDetailsReportUuid: string = "74b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
    const menuUuid: string = "8d168e5a-2a21-4d2d-a443-032c6d15eb22";

    const newEntity: MetaEntity = {
      uuid: newEntityUuid,
      parentUuid: entityEntity.uuid,
      application: currentApplicationUuid,
      description: createEntity_newEntityDescription,
      name: createEntity_newEntityName,
    }

    const pageParams = {
      deploymentUuid: currentDeploymentUuid,
      applicationSection: "data",
    };

    // const actionSplitFountainEntityParams = {
    //   currentApplicationUuid: currentApplicationUuid,
    //   currentDeploymentUuid: currentDeploymentUuid,
    //   splittedEntityName,
    //   splittedEntityUuid,
    //   splittedEntityAttribute: splittedEntityAttribute,
    //   splitEntity_newEntityUuid: newEntityUuid,
    //   splitEntity_newEntityName: newEntityName,
    //   splitEntity_newEntityDescription: newEntityDescription,
    //   splitEntity_newEntityListReportUuid: uuidv4(),
    //   splitEntity_newEntityDetailsReportUuid: splitEntity_newEntityDetailsReportUuid,
    //   splitEntity_newEntityDefinitionUuid: uuidv4(),
    //   //TODO: tag params, should be passed as context instead?
    //   // jzodSchema,
    //   // splittedEntityDefinition, // !!!
    //   entityEntity,
    //   entityEntityDefinition,
    //   entityReport,
    //   // newEntity,
      
    // }

    const actionInsertMunicipalitiesParams: Record<string, any> = {
      currentApplicationUuid: currentApplicationUuid,
      currentDeploymentUuid: currentDeploymentUuid,
      // splittedEntityDefinition,
      splittedEntityUuid,
      splittedEntityName,
      splittedEntityAttribute,
      splitEntity_newEntityName: newEntityName,
      splitEntity_newEntityUuid: newEntityUuid,
      splitEntity_newEntityListReportUuid:splitEntity_newEntityListReportUuid
    };

    // const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
    //   currentApplicationName: "Paris",
    //   currentApplicationUuid,
    //   currentDeploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
    //   createEntity_newEntityName,
    //   createEntity_newEntityDescription,
    //   createEntity_newEntityUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
    //   createEntity_newEntityDefinitionUuid: "d4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
    //   createEntity_newEntityDetailsReportUuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
    //   createEntity_newEntityListReportUuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
    //   createEntity_newEntity: newEntity,
    //   adminConfigurationDeploymentParis: {},
    //   //TODO: tag params, should be passed as context instead?
    //   jzodSchema,
    //   entityEntityDefinition,
    //   entityReport,
    //   entityMenu,
    // }

    const actionInsertMunicipalities: CompositeActionTemplate = {
      actionType: "compositeAction",
      actionLabel: "insertMunicipalities",
      actionName: "sequence",
      definition: [
        // // found unique municipalities from fountains
        // {
        //   compositeActionType: "queryTemplate",
        //   nameGivenToResult: newEntityName,
        //   queryTemplate: {
        //     actionType: "queryTemplateAction",
        //     actionName: "runQuery",
        //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        //     // applicationSection: "data",
        //     applicationSection: "model", // TODO: give only application section in individual queries?
        //     deploymentUuid: {
        //       transformerType: "parameterReference",
        //       referenceName: "currentDeploymentUuid"
        //     },
        //     query: {
        //       queryType: "queryTemplateWithExtractorCombinerTransformer",
        //       deploymentUuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentDeploymentUuid",
        //       },
        //       pageParams,
        //       queryParams: { },
        //       contextResults: { },
        //       extractorTemplates: {
        //         menuUuidIndex: {
        //           queryType: "extractorTemplateForObjectListByEntity",
        //           applicationSection: "model",
        //           parentName: "Menu",
        //           parentUuid: {
        //             transformerType: "constantObject",
        //             constantObjectValue: {
        //               transformerType: "constantUuid",
        //               constantUuidValue: entityMenu.uuid,
        //             }
        //           },
        //         },
        //       },
        //       runtimeTransformers: {
        //         menuList: {
        //           transformerType: "objectValues",
        //           interpolation: "runtime",
        //           referencedExtractor: "menuUuidIndex",
        //         },
        //         menu: {
        //           transformerType: "listPickElement",
        //           interpolation: "runtime",
        //           referencedExtractor: "menuList",
        //           index: 1
        //         },
        //         menuItem: {
        //           transformerType: "freeObjectTemplate",
        //           definition: {
        //             "label": "List of " + newEntityName,
        //             "section": "data",
        //             application: adminConfigurationDeploymentParis.uuid, // TODO: replace with application uuid, this is a deployment at the moment
        //             "reportUuid": actionInsertMunicipalitiesParams.splitEntity_newEntityListReportUuid,
        //             "icon": "location_on"
        //           }
        //         },
        //         updatedMenu:{
        //           transformerType: "transformer_menu_addItem",
        //           interpolation: "runtime",
        //           transformerDefinition: {
        //             menuItemReference: {
        //                 transformerType: "contextReference",
        //                 interpolation: "runtime",
        //                 referenceName: "menuItem"
        //             },
        //             menuReference: {
        //               transformerType: "contextReference",
        //               interpolation: "runtime",
        //               referenceName: "menu"
        //             },
        //             menuSectionItemInsertionIndex: -1,
        //           }
        //         }
        //       },
        //     }
        //   }
        // },
        // // } as any, // TODO: why is type inferrence failing?
        // // update Menu
        // {
        //   compositeActionType: "domainAction",
        //   compositeActionStepLabel: "updateMenu",
        //   domainAction: {
        //     actionType: "transactionalInstanceAction",
        //     instanceAction: {
        //       actionType: "instanceAction",
        //       actionName: "updateInstance",
        //       applicationSection: "model",
        //       deploymentUuid: {
        //         transformerType: "parameterReference",
        //         referenceName: "currentDeploymentUuid",
        //       },
        //       endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //       objects: [
        //         {
        //           parentName: entityMenu.name,
        //           parentUuid: entityMenu.uuid,
        //           applicationSection: "model",
        //           instances: [
        //             {
        //               transformerType: "objectDynamicAccess",
        //               interpolation: "runtime",
        //               objectAccessPath: [
        //                 {
        //                   transformerType: "contextReference",
        //                   interpolation: "runtime",
        //                   referenceName: newEntityName,
        //                 },
        //                 "updatedMenu"
        //               ],
        //             },
        //           ]
        //         }
        //       ],
        //     }
        //   }
        // },
        // // commit
        // {
        //   compositeActionType: "domainAction",
        //   domainAction: {
        //     actionName: "commit",
        //     actionType: "modelAction",
        //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //     deploymentUuid: {
        //       transformerType: "parameterReference",
        //       referenceName: "currentDeploymentUuid",
        //     },
        //   }
        // },
        // update splitted entity instances with foreign key of instances of new entity
        {
          compositeActionType: "queryTemplate",
          compositeActionStepLabel: "calculateEntityInstances",
          nameGivenToResult: newEntityName,
          queryTemplate: {
            actionType: "queryTemplateAction",
            actionName: "runQuery",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            applicationSection: "data",
            // applicationSection: "model", // TODO: give only application section in individual queries?
            deploymentUuid: {
              transformerType: "parameterReference",
              referenceName: "currentDeploymentUuid"
            },
            query: {
              queryType: "queryTemplateWithExtractorCombinerTransformer",
              deploymentUuid: {
                transformerType: "parameterReference",
                referenceName: "currentDeploymentUuid",
              },
              pageParams,
              queryParams: { },
              contextResults: { },
              extractorTemplates: {
                // [splittedEntityName + "UuidIndex"]: {
                //   queryType: "extractorTemplateForObjectListByEntity",
                //   applicationSection: "data",
                //   parentName: {
                //     transformerType: "parameterReference",
                //     referenceName: "splittedEntityName",
                //   },
                //   parentUuid: {
                //     transformerType: "freeObjectTemplate",
                //     definition: {
                //       transformerType: "constantString",
                //       constantStringValue: {
                //         transformerType: "mustacheStringTemplate",
                //         definition: "{{splittedEntityUuid}}",
                //         // definition: "{{splittedEntityDefinition.entityUuid}}",
                //       },
                //     },
                //   },
                // },
              },
              runtimeTransformers: {
                uniqueSplittedEntityInstancesSplitAttributeValues: {
                  transformerType: "freeObjectTemplate",
                  definition: {
                    transformerType: "unique",
                    interpolation: "runtime",
                    referencedExtractor: splittedEntityName + "UuidIndex",
                    attribute: {
                      transformerType: "parameterReference",
                      referenceName: "splittedEntityAttribute",
                    } as any,
                  }
                },
                // [splittedEntityName]: {
                //   transformerType: "objectValues",
                //   interpolation: "runtime",
                //   referencedExtractor: splittedEntityName + "UuidIndex",
                // },
                // municipalities: {
                //   transformerType: "mapperListToList",
                //   interpolation: "runtime",
                //   referencedExtractor: "uniqueSplittedEntityInstancesSplitAttributeValues",
                //   elementTransformer: {
                //     transformerType: "innerFullObjectTemplate", // TODO: innerFullObjectTemplate is not needed, all attributeKeys are constantString, objectTemplate should be enough
                //     interpolation: "runtime",
                //     referenceToOuterObject: "municipality",
                //     definition: [
                //       {
                //         attributeKey: {
                //           interpolation: "runtime",
                //           transformerType: "constantString",
                //           constantStringValue: "parentUuid"
                //         },
                //         attributeValue: {
                //           transformerType: "parameterReference",
                //           referenceName: "splitEntity_newEntityUuid",
                //         }
                //       },
                //       {
                //         attributeKey: {
                //           interpolation: "runtime",
                //           transformerType: "constantString",
                //           constantStringValue: "uuid"
                //         },
                //         attributeValue: {
                //           interpolation: "runtime",
                //           transformerType: "newUuid",
                //         }
                //       },
                //       {
                //         attributeKey: {
                //           interpolation: "runtime",
                //           transformerType: "constantString",
                //           constantStringValue: "name"
                //         },
                //         attributeValue: {
                //           interpolation: "runtime",
                //           transformerType: "mustacheStringTemplate",
                //           definition: "{{municipality.Commune}}" // TODO: correct attribute name!
                //         }
                //       }
                //     ]
                //   }
                // },
                // municipalitiesIndexedByUuid: {
                //   transformerType: "mapperListToObject",
                //   interpolation: "runtime",
                //   referencedExtractor: "municipalities",
                //   indexAttribute: "uuid",
                // },
                // municipalitiesIndexedByName: {
                //   transformerType: "mapperListToObject",
                //   interpolation: "runtime",
                //   referencedExtractor: "municipalities",
                //   indexAttribute: "name",
                // },
                // ["updated" + splittedEntityName]: {
                //   transformerType: "mapperListToList",
                //   interpolation: "runtime",
                //   // referencedExtractor: "fountains",
                //   referencedExtractor: splittedEntityName,
                //   elementTransformer: {
                //     transformerType: "objectAlter",
                //     interpolation: "runtime",
                //     referenceToOuterObject: "objectAlterTmpReference",
                //     definition: {
                //       transformerType: "freeObjectTemplate",
                //       interpolation: "runtime",
                //       definition: {
                //         [newEntityName]: {
                //           transformerType: "objectDynamicAccess",
                //           interpolation: "runtime",
                //           objectAccessPath: [
                //             {
                //               transformerType: "contextReference",
                //               interpolation: "runtime",
                //               referenceName: "municipalitiesIndexedByName",
                //             },
                //             {
                //               transformerType: "objectDynamicAccess",
                //               interpolation: "runtime",
                //               objectAccessPath: [
                //                 {
                //                   transformerType: "contextReference",
                //                   interpolation: "runtime",
                //                   // referenceName: splittedEntityName,
                //                   // referenceName: "fountains",
                //                   referenceName: "objectAlterTmpReference",
                //                 },
                //                 splittedEntityAttribute,
                //                 // "Commune",
                //               ],
                //             },
                //             "uuid"
                //           ],
                //         },
                //       }
                //     }
                //   }
                // },
              },
            }
          }
        },
        // // insert new Entity instance with new uuid for each
        // {
        //   compositeActionType: "domainAction",
        //   compositeActionStepLabel: "insert municipalities",
        //   domainAction: {
        //     actionType: "instanceAction",
        //     actionName: "createInstance",
        //     applicationSection: "data",
        //     deploymentUuid: {
        //       transformerType: "parameterReference",
        //       referenceName: "currentDeploymentUuid",
        //     },
        //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //     objects:[
        //       {
        //         parentName: {
        //           transformerType: "mustacheStringTemplate",
        //           definition: "{{splitEntity_newEntityName}}",
        //         },
        //         parentUuid:{
        //           transformerType: "mustacheStringTemplate",
        //           definition: "{{splitEntity_newEntityUuid}}",
        //         },
        //         applicationSection:'data',
        //         instances: {
        //           transformerType: "contextReference",
        //           interpolation: "runtime",
        //           // referenceName: "municipalities"
        //           referencePath: ["Municipality", "municipalities"]
        //           // referencePath: ["Municipality"]
        //         },
        //       }
        //     ]
        //   },
        // // // },// as CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_instanceAction, // TODO: why is type inferrence failing?
        // },
        // // update SplittedEntity with new FK attribute
        // {
        //   compositeActionType: "domainAction",
        //   compositeActionStepLabel: "update fountains",
        //   domainAction: {
        //     actionType: 'instanceAction',
        //     actionName: "updateInstance",
        //     applicationSection: "data",
        //     deploymentUuid: currentDeploymentUuid,
        //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        //     objects: [
        //       {
        //         parentName: splittedEntityName,
        //         parentUuid: splittedEntityUuid,
        //         // parentUuid:splittedEntityDefinition.entityUuid,
        //         applicationSection:'data',
        //         instances: {
        //           transformerType: "contextReference",
        //           interpolation: "runtime",
        //           // referenceName: "municipalities"
        //           referencePath: ["Municipality", "updated" + splittedEntityName]
        //         }
        //       }
        //     ]
        //   }
        // }

      ]
    };

    const {
      resolvedCompositeActionDefinition,
      resolvedCompositeActionTemplates,
    } = resolveCompositeActionTemplate(
      actionInsertMunicipalities,
      actionInsertMunicipalitiesParams,
      {} as MetaModel
    // ): CompositeAction {
    );

    const expectedResult = [
      // {
      //   compositeActionType: "queryTemplate",
      //   nameGivenToResult: "Test2",
      //   queryTemplate: {
      //     actionType: "queryTemplateAction",
      //     actionName: "runQuery",
      //     endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      //     applicationSection: "model",
      //     deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //     query: {
      //       queryType: "queryTemplateWithExtractorCombinerTransformer",
      //       deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //       pageParams: {
      //         deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //         applicationSection: "data",
      //       },
      //       queryParams: {},
      //       contextResults: {},
      //       extractorTemplates: {
      //         menuUuidIndex: {
      //           queryType: "extractorTemplateForObjectListByEntity",
      //           applicationSection: "model",
      //           parentName: "Menu",
      //           parentUuid: {
      //             transformerType: "constantUuid",
      //             constantUuidValue: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
      //           },
      //         },
      //       },
      //       runtimeTransformers: {
      //         menuList: {
      //           transformerType: "objectValues",
      //           interpolation: "runtime",
      //           referencedExtractor: "menuUuidIndex",
      //         },
      //         menu: {
      //           transformerType: "listPickElement",
      //           interpolation: "runtime",
      //           referencedExtractor: "menuList",
      //           index: 1,
      //         },
      //         menuItem: {
      //           label: "List of Test2",
      //           section: "data",
      //           application: "f1b74341-129b-474c-affa-e910d6cba01d",
      //           reportUuid: "64b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //           icon: "location_on",
      //         },
      //         updatedMenu: {
      //           transformerType: "transformer_menu_addItem",
      //           interpolation: "runtime",
      //           transformerDefinition: {
      //             menuItemReference: {
      //               transformerType: "contextReference",
      //               interpolation: "runtime",
      //               referenceName: "menuItem",
      //             },
      //             menuReference: {
      //               transformerType: "contextReference",
      //               interpolation: "runtime",
      //               referenceName: "menu",
      //             },
      //             menuSectionItemInsertionIndex: -1,
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
      // {
      //   compositeActionType: "domainAction",
      //   compositeActionStepLabel: "updateMenu",
      //   domainAction: {
      //     actionType: "transactionalInstanceAction",
      //     instanceAction: {
      //       actionType: "instanceAction",
      //       actionName: "updateInstance",
      //       applicationSection: "model",
      //       deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //       endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //       objects: [
      //         {
      //           parentName: "Menu",
      //           parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
      //           applicationSection: "model",
      //           instances: [
      //             {
      //               transformerType: "objectDynamicAccess",
      //               interpolation: "runtime",
      //               objectAccessPath: [
      //                 {
      //                   transformerType: "contextReference",
      //                   interpolation: "runtime",
      //                   referenceName: "Test2",
      //                 },
      //                 "updatedMenu",
      //               ],
      //             },
      //           ],
      //         },
      //       ],
      //     },
      //   },
      // },
      // {
      //   compositeActionType: "domainAction",
      //   domainAction: {
      //     actionName: "commit",
      //     actionType: "modelAction",
      //     endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      //     deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //   },
      // },
      {
        compositeActionType: "queryTemplate",
        compositeActionStepLabel: "calculateEntityInstances",
        nameGivenToResult: "Test2",
        queryTemplate: {
          actionType: "queryTemplateAction",
          actionName: "runQuery",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          applicationSection: "data",
          deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
          query: {
            queryType: "queryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
            pageParams: {
              deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
              applicationSection: "data",
            },
            queryParams: {},
            contextResults: {},
            extractorTemplates: {
              // TestUuidIndex: {
              //   queryType: "extractorTemplateForObjectListByEntity",
              //   applicationSection: "data",
              //   parentName: "Test",
              //   parentUuid: {
              //     transformerType: "constantString",
              //     constantStringValue: "14b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
              //   },
              // },
            },
            runtimeTransformers: {
              uniqueSplittedEntityInstancesSplitAttributeValues: {
                transformerType: "unique",
                interpolation: "runtime",
                referencedExtractor: "TestUuidIndex",
                attribute: "TestAttribute",
              },
              // Test: {
              //   transformerType: "objectValues",
              //   interpolation: "runtime",
              //   referencedExtractor: "TestUuidIndex",
              // },
              // municipalities: {
              //   transformerType: "mapperListToList",
              //   interpolation: "runtime",
              //   referencedExtractor: "uniqueSplittedEntityInstancesSplitAttributeValues",
              //   elementTransformer: {
              //     transformerType: "innerFullObjectTemplate",
              //     interpolation: "runtime",
              //     referenceToOuterObject: "municipality",
              //     definition: [
              //       {
              //         attributeKey: {
              //           interpolation: "runtime",
              //           transformerType: "constantString",
              //           constantStringValue: "parentUuid",
              //         },
              //         attributeValue: {
              //           transformerType: "parameterReference",
              //           referenceName: "splitEntity_newEntityUuid",
              //         },
              //       },
              //       {
              //         attributeKey: {
              //           interpolation: "runtime",
              //           transformerType: "constantString",
              //           constantStringValue: "uuid",
              //         },
              //         attributeValue: {
              //           interpolation: "runtime",
              //           transformerType: "newUuid",
              //         },
              //       },
              //       {
              //         attributeKey: {
              //           interpolation: "runtime",
              //           transformerType: "constantString",
              //           constantStringValue: "name",
              //         },
              //         attributeValue: {
              //           interpolation: "runtime",
              //           transformerType: "mustacheStringTemplate",
              //           definition: "{{municipality.Commune}}",
              //         },
              //       },
              //     ],
              //   },
              // },
              // municipalitiesIndexedByUuid: {
              //   transformerType: "mapperListToObject",
              //   interpolation: "runtime",
              //   referencedExtractor: "municipalities",
              //   indexAttribute: "uuid",
              // },
              // municipalitiesIndexedByName: {
              //   transformerType: "mapperListToObject",
              //   interpolation: "runtime",
              //   referencedExtractor: "municipalities",
              //   indexAttribute: "name",
              // },
              // updatedTest: {
              //   transformerType: "mapperListToList",
              //   interpolation: "runtime",
              //   referencedExtractor: "Test",
              //   elementTransformer: {
              //     transformerType: "objectAlter",
              //     interpolation: "runtime",
              //     referenceToOuterObject: "objectAlterTmpReference",
              //     definition: {
              //       transformerType: "freeObjectTemplate",
              //       interpolation: "runtime",
              //       definition: {
              //         Test2: {
              //           transformerType: "objectDynamicAccess",
              //           interpolation: "runtime",
              //           objectAccessPath: [
              //             {
              //               transformerType: "contextReference",
              //               interpolation: "runtime",
              //               referenceName: "municipalitiesIndexedByName",
              //             },
              //             {
              //               transformerType: "objectDynamicAccess",
              //               interpolation: "runtime",
              //               objectAccessPath: [
              //                 {
              //                   transformerType: "contextReference",
              //                   interpolation: "runtime",
              //                   referenceName: "objectAlterTmpReference",
              //                 },
              //                 "TestAttribute",
              //               ],
              //             },
              //             "uuid",
              //           ],
              //         },
              //       },
              //     },
              //   },
              // },
            },
          },
        },
      },
      // {
      //   compositeActionType: "domainAction",
      //   compositeActionStepLabel: "insert municipalities",
      //   domainAction: {
      //     actionType: "instanceAction",
      //     actionName: "createInstance",
      //     applicationSection: "data",
      //     deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //     objects: [
      //       {
      //         parentName: "Test2",
      //         parentUuid: "34b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //         applicationSection: "data",
      //         instances: {
      //           transformerType: "contextReference",
      //           interpolation: "runtime",
      //           referencePath: ["Municipality", "municipalities"],
      //         },
      //       },
      //     ],
      //   },
      // },
      // {
      //   compositeActionType: "domainAction",
      //   compositeActionStepLabel: "update fountains",
      //   domainAction: {
      //     actionType: "instanceAction",
      //     actionName: "updateInstance",
      //     applicationSection: "data",
      //     deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //     objects: [
      //       {
      //         parentName: "Test",
      //         parentUuid: "14b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
      //         applicationSection: "data",
      //         instances: {
      //           transformerType: "contextReference",
      //           interpolation: "runtime",
      //           referencePath: ["Municipality", "updatedTest"],
      //         },
      //       },
      //     ],
      //   },
      // },
    ];

    console.log("################################ resolvedCompositeActionDefinition", JSON.stringify(resolvedCompositeActionDefinition, null, 2));
    // console.log("################################ expectedResult", JSON.stringify(expectedResult, null, 2));
    expect(resolvedCompositeActionDefinition).toEqual(expectedResult);

    console.log("resolve basic transformer constantUuid END");
  });
});
