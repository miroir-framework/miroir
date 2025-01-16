// import { describe, expect } from 'vitest';

import { v4 as uuidv4 } from 'uuid';
import { JzodObject } from "@miroir-framework/jzod-ts";
import {
  CompositeAction,
  CompositeActionTemplate,
  EntityInstance,
  MetaModel,
  testCompositeAction,
  TestCompositeAction,
  testCompositeActionTemplate,
  TestCompositeActionTemplate
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveCompositeActionTemplate } from "../../2_domain/ResolveCompositeActionTemplate.js";

import entityEntity from '../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json' assert { type: "json" };
import entityEntityDefinition from '../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json' assert { type: "json" };
import entityMenu from '../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json' assert { type: "json" };
import entityReport from '../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json' assert { type: "json" };

import { MetaEntity, Uuid } from "../../0_interfaces/1_core/EntityDefinition.js";
import { resolveTestCompositeActionTemplate } from "../../2_domain/TestSuiteTemplate.js";
import { defaultMiroirMetaModel } from "../../1_core/Model.js";
// import { act } from 'react';

// import {
//   entityEntity,
//   entityEntityDefinition,
//   entityMenu,
//   entityReport,
//   MetaEntity,
//   Uuid
// } from "../../index.js";
// const env:any = (import.meta as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", env);

// console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
const adminConfigurationDeploymentParis = {
  uuid: "f1b74341-129b-474c-affa-e910d6cba01d",
  parentName: "Deployment",
  parentUuid: "7959d814-400c-4e80-988f-a00fe582ab98",
  name: "ParisApplicationSqlDeployment",
  defaultLabel: "ParisApplicationSqlDeployment",
  selfApplication: "70e02039-e283-4381-9575-8c52aed18a87",
  description: "The default Sql Deployment for SelfApplication Paris",
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

// describe("resolveCompositeActionTemplate.unit.test", () => {
//   // TODO: test failure cases!
//   // // ################################################################################################
//   // it("resolve action template for createEntity", async () => {
//   //   console.log("resolve basic transformer constantUuid START");

//   //   const instances:EntityInstance[] = [];

//   //   const actionHandlerCreateFountainEntity: CompositeActionTemplate = {
//   //     actionType: "compositeAction",
//   //     actionName: "sequence",
//   //     templates: {
//   //       newEntityDefinition: {
//   //         name: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "createEntity_newEntityName",
//   //         },
//   //         uuid: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "createEntity_newEntityDefinitionUuid",
//   //         },
//   //         parentName: "EntityDefinition",
//   //         parentUuid: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{entityEntityDefinition.uuid}}",
//   //         },
//   //         entityUuid: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{createEntity_newEntity.uuid}}",
//   //         },
//   //         conceptLevel: "Model",
//   //         defaultInstanceDetailsReportUuid: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "createEntity_newEntityDetailsReportUuid",
//   //         },
//   //         jzodSchema: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "jzodSchema",
//   //         },
//   //       },
//   //       // list of instances Report Definition
//   //       newEntityListReport: {
//   //         uuid: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "createEntity_newEntityListReportUuid",
//   //         },
//   //         selfApplication: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "currentApplicationUuid",
//   //         },
//   //         parentName: "Report",
//   //         parentUuid: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{entityReport.uuid}}",
//   //         },
//   //         conceptLevel: "Model",
//   //         name: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{createEntity_newEntityName}}List",
//   //         },
//   //         defaultLabel: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "List of {{createEntity_newEntityName}}s",
//   //         },
//   //         type: "list",
//   //         definition: {
//   //           extractors: {
//   //             instanceList: {
//   //               queryType: "extractorByEntityReturningObjectList",
//   //               parentName: {
//   //                 transformerType: "parameterReference",
//   //                 referenceName: "createEntity_newEntityName",
//   //               },
//   //               parentUuid: {
//   //                 transformerType: "mustacheStringTemplate",
//   //                 definition: "{{createEntity_newEntity.uuid}}",
//   //               },
//   //             },
//   //           },
//   //           section: {
//   //             type: "objectListReportSection",
//   //             definition: {
//   //               label: {
//   //                 transformerType: "mustacheStringTemplate",
//   //                 definition: "{{createEntity_newEntityName}}s",
//   //               },
//   //               parentUuid: {
//   //                 transformerType: "mustacheStringTemplate",
//   //                 definition: "{{createEntity_newEntity.uuid}}",
//   //               },
//   //               fetchedDataReference: "instanceList",
//   //             },
//   //           },
//   //         },
//   //       },
//   //       // Details of an instance Report Definition
//   //       newEntityDetailsReport: {
//   //         uuid: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "createEntity_newEntityDetailsReportUuid",
//   //         },
//   //         selfApplication: {
//   //           transformerType: "parameterReference",
//   //           referenceName: "currentApplicationUuid",
//   //         },
//   //         parentName: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{entityReport.name}}",
//   //         },
//   //         parentUuid: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{entityReport.uuid}}",
//   //         },
//   //         conceptLevel: "Model",
//   //         name: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "{{createEntity_newEntityName}}Details",
//   //         },
//   //         defaultLabel: {
//   //           transformerType: "mustacheStringTemplate",
//   //           definition: "Details of {{createEntity_newEntityName}}",
//   //         },
//   //         definition: {
//   //           extractorTemplates: {
//   //             elementToDisplay: {
//   //               extractorTemplateType: "extractorForObjectByDirectReference",
//   //               parentName: {
//   //                 transformerType: "parameterReference",
//   //                 referenceName: "createEntity_newEntityName",
//   //               },
//   //               parentUuid: {
//   //                 transformerType: "freeObjectTemplate",
//   //                 definition: {
//   //                   transformerType: "constantString",
//   //                   constantStringValue: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "{{createEntity_newEntity.uuid}}",
//   //                   },
//   //                 },
//   //               },
//   //               instanceUuid: {
//   //                 transformerType: "constantObject",
//   //                 constantObjectValue: {
//   //                   transformerType: "parameterReference",
//   //                   referenceName: "instanceUuid",
//   //                 },
//   //               },
//   //             },
//   //           },
//   //           section: {
//   //             type: "list",
//   //             definition: [
//   //               {
//   //                 type: "objectInstanceReportSection",
//   //                 definition: {
//   //                   label: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "My {{createEntity_newEntityName}}",
//   //                   },
//   //                   parentUuid: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "{{createEntity_newEntity.uuid}}",
//   //                   },
//   //                   fetchedDataReference: "elementToDisplay",
//   //                 },
//   //               },
//   //             ],
//   //           },
//   //         },
//   //       },
//   //     },
//   //     definition: [
//   //       // createEntity
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "createEntity",
//   //         domainAction: {
//   //           actionType: "modelAction",
//   //           actionName: "createEntity",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid",
//   //           },
//   //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //           entities: [
//   //             {
//   //               entity: {
//   //                 transformerType: "parameterReference",
//   //                 referenceName: "createEntity_newEntity",
//   //               },
//   //               entityDefinition: {
//   //                 transformerType: "parameterReference",
//   //                 referenceName: "newEntityDefinition",
//   //               },
//   //             },
//   //           ],
//   //         },
//   //       } as any,
//   //       // createReports
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "createReports",
//   //         domainAction: {
//   //           actionType: "transactionalInstanceAction",
//   //           instanceAction: {
//   //             actionType: "instanceAction",
//   //             actionName: "createInstance",
//   //             applicationSection: "model",
//   //             deploymentUuid: {
//   //               transformerType: "parameterReference",
//   //               referenceName: "currentDeploymentUuid",
//   //             },
//   //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //             objects: [
//   //               {
//   //                 parentName: {
//   //                   transformerType: "mustacheStringTemplate",
//   //                   definition: "{{newEntityListReport.parentName}}",
//   //                 },
//   //                 parentUuid: {
//   //                   transformerType: "mustacheStringTemplate",
//   //                   definition: "{{newEntityListReport.parentUuid}}",
//   //                 },
//   //                 applicationSection: "model",
//   //                 instances: [
//   //                   {
//   //                     transformerType: "parameterReference",
//   //                     referenceName: "newEntityListReport",
//   //                   },
//   //                   {
//   //                     transformerType: "parameterReference",
//   //                     referenceName: "newEntityDetailsReport",
//   //                   },
//   //                 ],
//   //               },
//   //             ],
//   //           },
//   //         },
//   //       },
//   //       // commit
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "commit",
//   //         domainAction: {
//   //           actionName: "commit",
//   //           actionType: "modelAction",
//   //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid",
//   //           },
//   //         },
//   //         // action: {
//   //         //   transformerType: "parameterReference",
//   //         //   referenceName: "commitAction",
//   //         // },
//   //       },
//   //       // instances for new Entity, put in "menuUpdateQueryResult"
//   //       {
//   //         compositeActionType: "runBoxedQueryTemplateAction",
          
//   //         nameGivenToResult: "menuUpdateQueryResult",
//   //         queryTemplate: {
//   //           actionType: "runBoxedQueryTemplateAction",
//   //           actionName: "runQuery",
//   //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//   //           applicationSection: "model",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid"
//   //           },
//   //           query: {
//   //             queryType: "boxedQueryWithExtractorCombinerTransformer",
//   //             deploymentUuid: {
//   //               transformerType: "parameterReference",
//   //               referenceName: "currentDeploymentUuid",
//   //             },
//   //             // runAsSql: true,
//   //             pageParams: {},
//   //             queryParams: {},
//   //             contextResults: {},
//   //             extractorTemplates: {
//   //               menuList: {
//   //                 extractorTemplateType: "extractorTemplateForObjectListByEntity",
//   //                 applicationSection: "model",
//   //                 parentName: "Menu",
//   //                 parentUuid: {
//   //                   transformerType: "freeObjectTemplate",
//   //                   definition: {
//   //                     transformerType: {
//   //                       transformerType: "constantString",
//   //                       constantStringValue: "constantUuid"
//   //                     },
//   //                     constantUuidValue: {
//   //                       transformerType: "mustacheStringTemplate",
//   //                       definition: "{{entityMenu.uuid}}",
//   //                     },
//   //                   },
//   //                 },
//   //               },
//   //             },
//   //             runtimeTransformers: {
//   //               // menuList: {
//   //               //   transformerType: "objectValues",
//   //               //   interpolation: "runtime",
//   //               //   referencedExtractor: "menuUuidIndex",
//   //               // },
//   //               menu: {
//   //                 transformerType: "listPickElement",
//   //                 interpolation: "runtime",
//   //                 referencedExtractor: "menuList",
//   //                 index: 1
//   //               },
//   //               menuItem: {
//   //                 transformerType: "freeObjectTemplate",
//   //                 definition: {
//   //                   reportUuid: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "{{createEntity_newEntityListReportUuid}}",
//   //                   },
//   //                   label: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "List of {{createEntity_newEntityName}}"
//   //                   },
//   //                   section: "data",
//   //                   selfApplication: {
//   //                     transformerType: "mustacheStringTemplate",
//   //                     definition: "{{adminConfigurationDeploymentParis.uuid}}",
//   //                   }, // TODO: replace with selfApplication uuid, this is a deployment at the moment
//   //                   icon: "local_drink"
//   //                 }
//   //               },
//   //               updatedMenu:{
//   //                 transformerType: "transformer_menu_addItem",
//   //                 interpolation: "runtime",
//   //                 transformerDefinition: {
//   //                   menuItemReference: {
//   //                       transformerType: "contextReference",
//   //                       interpolation: "runtime",
//   //                       referenceName: "menuItem"
//   //                   },
//   //                   menuReference: {
//   //                     transformerType: "contextReference",
//   //                     interpolation: "runtime",
//   //                     referenceName: "menu"
//   //                   },
//   //                   menuSectionItemInsertionIndex: -1,
//   //                 }
//   //               }
//   //             },
//   //           }
//   //         }
//   //       },
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "updateMenu",
//   //         domainAction: {
//   //           actionType: "transactionalInstanceAction",
//   //           instanceAction: {
//   //             actionType: "instanceAction",
//   //             actionName: "updateInstance",
//   //             applicationSection: "model",
//   //             deploymentUuid: {
//   //               transformerType: "parameterReference",
//   //               referenceName: "currentDeploymentUuid",
//   //             },
//   //             endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //             objects: [
//   //               {
//   //                 parentName: entityMenu.name,
//   //                 parentUuid: entityMenu.uuid,
//   //                 applicationSection: "model",
//   //                 instances: [
//   //                   {
//   //                     transformerType: "objectDynamicAccess",
//   //                     interpolation: "runtime",
//   //                     objectAccessPath: [
//   //                       {
//   //                         transformerType: "contextReference",
//   //                         interpolation: "runtime",
//   //                         referenceName: "menuUpdateQueryResult",
//   //                       },
//   //                       "updatedMenu"
//   //                     ],
//   //                   },
//   //                 ]
//   //               }
//   //             ],
//   //           }
//   //         }
//   //       },
//   //       // commit
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "commit",
//   //         domainAction: {
//   //           actionName: "commit",
//   //           actionType: "modelAction",
//   //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid",
//   //           },
//   //         },
//   //       },
//   //       // insert imported instances
//   //       {
//   //         compositeActionType: "domainAction",
//   //         domainAction: {
//   //           actionType: "instanceAction",
//   //           actionName: "createInstance",
//   //           applicationSection: "data",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid",
//   //           },
//   //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //           objects: [
//   //             {
//   //               parentName: {
//   //                 transformerType: "mustacheStringTemplate",
//   //                 definition: "{{createEntity_newEntity.name}}",
//   //               },
//   //               parentUuid: {
//   //                 transformerType: "mustacheStringTemplate",
//   //                 definition: "{{createEntity_newEntity.uuid}}",
//   //               },
//   //               applicationSection: "data",
//   //               instances: instances,
//   //             },
//   //           ],
//   //         },
//   //       },
//   //       // rollback / refresh
//   //       {
//   //         compositeActionType: "domainAction",
//   //         compositeActionStepLabel: "rollback",
//   //         domainAction: {
//   //           actionName: "rollback",
//   //           actionType: "modelAction",
//   //           endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //           deploymentUuid: {
//   //             transformerType: "parameterReference",
//   //             referenceName: "currentDeploymentUuid",
//   //           },
//   //         },
//   //       },
//   //     ],
//   //   };
//   //   const jzodSchema:JzodObject = {
//   //     type: "object",
//   //     definition: {
//   //       uuid: {
//   //         type: "string",
//   //         validations: [{ type: "uuid" }],
//   //         tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
//   //       },
//   //       parentName: {
//   //         type: "string",
//   //         optional: true,
//   //         tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
//   //       },
//   //       parentUuid: {
//   //         type: "string",
//   //         validations: [{ type: "uuid" }],
//   //         tag: { id: 1, defaultLabel: "parentUuid", editable: false } as any,
//   //       },
//   //     },
//   //   };

//   //   const newEntityUuid = "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//   //   const currentApplicationUuid = "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//   //   const createEntity_newEntityDescription = "newEntityDescription";
//   //   const createEntity_newEntityName = "newEntityName";

//   //   const newEntity: MetaEntity = {
//   //     uuid: newEntityUuid,
//   //     parentUuid: entityEntity.uuid,
//   //     selfApplication: currentApplicationUuid,
//   //     description: createEntity_newEntityDescription,
//   //     name: createEntity_newEntityName,
//   //   }

//   //   const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ = {
//   //     currentApplicationName: "Paris",
//   //     currentApplicationUuid,
//   //     currentDeploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //     createEntity_newEntityName,
//   //     createEntity_newEntityDescription,
//   //     createEntity_newEntityUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //     createEntity_newEntityDefinitionUuid: "d4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //     createEntity_newEntityDetailsReportUuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //     createEntity_newEntityListReportUuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //     createEntity_newEntity: newEntity,
//   //     adminConfigurationDeploymentParis: {},
//   //     //TODO: tag params, should be passed as context instead?
//   //     jzodSchema,
//   //     entityEntityDefinition,
//   //     entityReport,
//   //     entityMenu,
//   //   }

//   //   const {
//   //     resolvedCompositeActionDefinition,
//   //     resolvedCompositeActionTemplates,
//   //   } = resolveCompositeActionTemplate(
//   //     actionHandlerCreateFountainEntity,
//   //     actionEffectiveParamsCreateEntity,
//   //     {} as MetaModel
//   //   // ): CompositeAction {
//   //   );

//   //   const expectedResult = [
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "createEntity",
//   //       domainAction: {
//   //         actionType: "modelAction",
//   //         actionName: "createEntity",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //         entities: [
//   //           {
//   //             entity: {
//   //               uuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
//   //               selfApplication: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               description: "newEntityDescription",
//   //               name: "newEntityName",
//   //             },
//   //             entityDefinition: {
//   //               name: "newEntityName",
//   //               uuid: "d4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               parentName: "EntityDefinition",
//   //               parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
//   //               entityUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               conceptLevel: "Model",
//   //               defaultInstanceDetailsReportUuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               jzodSchema: {
//   //                 type: "object",
//   //                 definition: {
//   //                   uuid: {
//   //                     type: "string",
//   //                     validations: [
//   //                       {
//   //                         type: "uuid",
//   //                       },
//   //                     ],
//   //                     tag: {
//   //                       id: 1,
//   //                       defaultLabel: "Uuid",
//   //                       editable: false,
//   //                     },
//   //                   },
//   //                   parentName: {
//   //                     type: "string",
//   //                     optional: true,
//   //                     tag: {
//   //                       id: 1,
//   //                       defaultLabel: "Uuid",
//   //                       editable: false,
//   //                     },
//   //                   },
//   //                   parentUuid: {
//   //                     type: "string",
//   //                     validations: [
//   //                       {
//   //                         type: "uuid",
//   //                       },
//   //                     ],
//   //                     tag: {
//   //                       id: 1,
//   //                       defaultLabel: "parentUuid",
//   //                       editable: false,
//   //                     },
//   //                   },
//   //                 },
//   //               },
//   //             },
//   //           },
//   //         ],
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "createReports",
//   //       domainAction: {
//   //         actionType: "transactionalInstanceAction",
//   //         instanceAction: {
//   //           actionType: "instanceAction",
//   //           actionName: "createInstance",
//   //           applicationSection: "model",
//   //           deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //           objects: [
//   //             {
//   //               parentName: "Report",
//   //               parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
//   //               applicationSection: "model",
//   //               instances: [
//   //                 {
//   //                   uuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                   selfApplication: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                   parentName: "Report",
//   //                   parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
//   //                   conceptLevel: "Model",
//   //                   name: "newEntityNameList",
//   //                   defaultLabel: "List of newEntityNames",
//   //                   type: "list",
//   //                   definition: {
//   //                     extractors: {
//   //                       instanceList: {
//   //                         queryType: "extractorByEntityReturningObjectList",
//   //                         parentName: "newEntityName",
//   //                         parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                       },
//   //                     },
//   //                     section: {
//   //                       type: "objectListReportSection",
//   //                       definition: {
//   //                         label: "newEntityNames",
//   //                         parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                         fetchedDataReference: "instanceList",
//   //                       },
//   //                     },
//   //                   },
//   //                 },
//   //                 {
//   //                   uuid: "e4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                   selfApplication: "a4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                   parentName: "Report",
//   //                   parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
//   //                   conceptLevel: "Model",
//   //                   name: "newEntityNameDetails",
//   //                   defaultLabel: "Details of newEntityName",
//   //                   definition: {
//   //                     extractorTemplates: {
//   //                       elementToDisplay: {
//   //                         extractorTemplateType: "extractorForObjectByDirectReference",
//   //                         parentName: "newEntityName",
//   //                         parentUuid: {
//   //                           transformerType: "constantString",
//   //                           constantStringValue: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                         },
//   //                         instanceUuid: {
//   //                           transformerType: "parameterReference",
//   //                           referenceName: "instanceUuid",
//   //                         },
//   //                       },
//   //                     },
//   //                     section: {
//   //                       type: "list",
//   //                       definition: [
//   //                         {
//   //                           type: "objectInstanceReportSection",
//   //                           definition: {
//   //                             label: "My newEntityName",
//   //                             parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //                             fetchedDataReference: "elementToDisplay",
//   //                           },
//   //                         },
//   //                       ],
//   //                     },
//   //                   },
//   //                 },
//   //               ],
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "commit",
//   //       domainAction: {
//   //         actionName: "commit",
//   //         actionType: "modelAction",
//   //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "runBoxedQueryTemplateAction",
//   //       nameGivenToResult: "menuUpdateQueryResult",
//   //       queryTemplate: {
//   //         actionType: "runBoxedQueryTemplateAction",
//   //         actionName: "runQuery",
//   //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//   //         applicationSection: "model",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //         query: {
//   //           queryType: "boxedQueryWithExtractorCombinerTransformer",
//   //           deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //           pageParams: {},
//   //           queryParams: {},
//   //           contextResults: {},
//   //           extractorTemplates: {
//   //             menuList: {
//   //               extractorTemplateType: "extractorTemplateForObjectListByEntity",
//   //               applicationSection: "model",
//   //               parentName: "Menu",
//   //               parentUuid: {
//   //                 transformerType: "constantUuid",
//   //                 constantUuidValue: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
//   //               },
//   //             },
//   //           },
//   //           runtimeTransformers: {
//   //             menu: {
//   //               transformerType: "listPickElement",
//   //               interpolation: "runtime",
//   //               referencedExtractor: "menuList",
//   //               index: 1,
//   //             },
//   //             menuItem: {
//   //               reportUuid: "f4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //               label: "List of newEntityName",
//   //               section: "data",
//   //               selfApplication: "",
//   //               icon: "local_drink",
//   //             },
//   //             updatedMenu: {
//   //               transformerType: "transformer_menu_addItem",
//   //               interpolation: "runtime",
//   //               transformerDefinition: {
//   //                 menuItemReference: {
//   //                   transformerType: "contextReference",
//   //                   interpolation: "runtime",
//   //                   referenceName: "menuItem",
//   //                 },
//   //                 menuReference: {
//   //                   transformerType: "contextReference",
//   //                   interpolation: "runtime",
//   //                   referenceName: "menu",
//   //                 },
//   //                 menuSectionItemInsertionIndex: -1,
//   //               },
//   //             },
//   //           },
//   //         },
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "updateMenu",
//   //       domainAction: {
//   //         actionType: "transactionalInstanceAction",
//   //         instanceAction: {
//   //           actionType: "instanceAction",
//   //           actionName: "updateInstance",
//   //           applicationSection: "model",
//   //           deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //           objects: [
//   //             {
//   //               parentName: "Menu",
//   //               parentUuid: "dde4c883-ae6d-47c3-b6df-26bc6e3c1842",
//   //               applicationSection: "model",
//   //               instances: [
//   //                 {
//   //                   transformerType: "objectDynamicAccess",
//   //                   interpolation: "runtime",
//   //                   objectAccessPath: [
//   //                     {
//   //                       transformerType: "contextReference",
//   //                       interpolation: "runtime",
//   //                       referenceName: "menuUpdateQueryResult",
//   //                     },
//   //                     "updatedMenu",
//   //                   ],
//   //                 },
//   //               ],
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "commit",
//   //       domainAction: {
//   //         actionName: "commit",
//   //         actionType: "modelAction",
//   //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       domainAction: {
//   //         actionType: "instanceAction",
//   //         actionName: "createInstance",
//   //         applicationSection: "data",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
//   //         objects: [
//   //           {
//   //             parentName: "newEntityName",
//   //             parentUuid: "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //             applicationSection: "data",
//   //             instances: [],
//   //           },
//   //         ],
//   //       },
//   //     },
//   //     {
//   //       compositeActionType: "domainAction",
//   //       compositeActionStepLabel: "rollback",
//   //       domainAction: {
//   //         actionName: "rollback",
//   //         actionType: "modelAction",
//   //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
//   //         deploymentUuid: "b4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//   //       },
//   //     },
//   //   ];

//   //   console.log("################################ resolvedCompositeActionDefinition", JSON.stringify(resolvedCompositeActionDefinition, null, 2));
//   //   console.log("################################ expectedResult", JSON.stringify(expectedResult, null, 2));
//   //   expect(resolvedCompositeActionDefinition).toEqual(expectedResult);

//   //   console.log("resolve basic transformer constantUuid END");
//   // });

//   // ################################################################################################
//   it("resolve action template for insertMunicipalities", async () => {
//     console.log("resolve basic transformer constantUuid START");

//     const instances:EntityInstance[] = [];

//     const jzodSchema:JzodObject = {
//       type: "object",
//       definition: {
//         uuid: {
//           type: "string",
//           validations: [{ type: "uuid" }],
//           tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
//         },
//         parentName: {
//           type: "string",
//           optional: true,
//           tag: { id: 1, defaultLabel: "Uuid", editable: false } as any,
//         },
//         parentUuid: {
//           type: "string",
//           validations: [{ type: "uuid" }],
//           tag: { id: 1, defaultLabel: "parentUuid", editable: false } as any,
//         },
//       },
//     };

//     const splittedEntityUuid: Uuid = "14b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const splittedEntityName: string = "Test"
//     const splittedEntityAttribute: string = "TestAttribute";
//     const splittedEntityDefinitionUuid: Uuid = "24b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const newEntityUuid: Uuid = "34b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const newEntityName: string = "Test2"

//     // const newEntityUuid = "c4b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const currentApplicationUuid = "44b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const createEntity_newEntityDescription = "newEntityDescription";
//     const createEntity_newEntityName = "newEntityName";

//     const newEntityDescription = "Municipalities";
//     const currentDeploymentUuid = "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const splitEntity_newEntityListReportUuid: string = "64b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const splitEntity_newEntityDetailsReportUuid: string = "74b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b";
//     const menuUuid: string = "8d168e5a-2a21-4d2d-a443-032c6d15eb22";

//     const newEntity: MetaEntity = {
//       uuid: newEntityUuid,
//       parentUuid: entityEntity.uuid,
//       selfApplication: currentApplicationUuid,
//       description: createEntity_newEntityDescription,
//       name: createEntity_newEntityName,
//     }

//     const pageParams = {
//       deploymentUuid: currentDeploymentUuid,
//       applicationSection: "data",
//     };

//     const actionInsertMunicipalitiesParams: Record<string, any> = {
//       currentApplicationUuid: currentApplicationUuid,
//       currentDeploymentUuid: currentDeploymentUuid,
//       splittedEntityUuid,
//       splittedEntityName,
//       splittedEntityAttribute,
//       splitEntity_newEntityName: newEntityName,
//       splitEntity_newEntityUuid: newEntityUuid,
//       splitEntity_newEntityListReportUuid:splitEntity_newEntityListReportUuid
//     };

//     const actionInsertMunicipalities: CompositeActionTemplate = {
//       actionType: "compositeAction",
//       actionLabel: "insertMunicipalities",
//       actionName: "sequence",
//       definition: [
//         // update splitted entity instances with foreign key of instances of new entity
//         {
//           compositeActionType: "runBoxedQueryTemplateAction",
//           compositeActionStepLabel: "calculateEntityInstances",
//           nameGivenToResult: newEntityName,
//           queryTemplate: {
//             actionType: "runBoxedQueryTemplateAction",
//             actionName: "runQuery",
//             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//             applicationSection: "data",
//             // applicationSection: "model", // TODO: give only selfApplication section in individual queries?
//             deploymentUuid: {
//               transformerType: "parameterReference",
//               referenceName: "currentDeploymentUuid"
//             },
//             query: {
//               queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
//               deploymentUuid: {
//                 transformerType: "parameterReference",
//                 referenceName: "currentDeploymentUuid",
//               },
//               pageParams,
//               queryParams: { },
//               contextResults: { },
//               extractorTemplates: {},
//               runtimeTransformers: {
//                 uniqueSplittedEntityInstancesSplitAttributeValues: {
//                   transformerType: "freeObjectTemplate",
//                   definition: {
//                     transformerType: "unique",
//                     interpolation: "runtime",
//                     referencedExtractor: splittedEntityName + "UuidIndex",
//                     attribute: {
//                       transformerType: "parameterReference",
//                       referenceName: "splittedEntityAttribute",
//                     } as any,
//                   }
//                 },
//               },
//             }
//           }
//         },
//       ]
//     };

//     const {
//       resolvedCompositeActionDefinition,
//       resolvedCompositeActionTemplates,
//     } = resolveCompositeActionTemplate(
//       actionInsertMunicipalities,
//       actionInsertMunicipalitiesParams,
//       {} as MetaModel
//     );

//     const expectedResult: CompositeAction = {
//       actionLabel: "insertMunicipalities",
//       actionName: "sequence",
//       actionType: "compositeAction",
//       deploymentUuid: undefined,
//       templates: {},
//       definition: [
//         {
//           compositeActionType: "runBoxedQueryTemplateAction",
//           compositeActionStepLabel: "calculateEntityInstances",
//           nameGivenToResult: "Test2",
//           queryTemplate: {
//             actionType: "runBoxedQueryTemplateAction",
//             actionName: "runQuery",
//             endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
//             applicationSection: "data",
//             deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//             query: {
//               queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
//               deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//               pageParams: {
//                 deploymentUuid: "54b3b3b3-7b3b-4b3b-8b3b-3b3b3b3b3b3b",
//                 applicationSection: "data",
//               },
//               queryParams: {},
//               contextResults: {},
//               extractorTemplates: {},
//               runtimeTransformers: {
//                 uniqueSplittedEntityInstancesSplitAttributeValues: {
//                   transformerType: "unique",
//                   interpolation: "runtime",
//                   referencedExtractor: "TestUuidIndex",
//                   attribute: "TestAttribute",
//                 },
//               },
//             },
//           },
//         },
//       ],
//     };

//     console.log("################################ resolvedCompositeActionDefinition", JSON.stringify(resolvedCompositeActionDefinition, null, 2));
//     // console.log("################################ expectedResult", JSON.stringify(expectedResult, null, 2));
//     expect(resolvedCompositeActionDefinition).toEqual(expectedResult);

//     console.log("resolve basic transformer constantUuid END");
//   });
// });

describe('resolveTestCompositeActionTemplate', () => {
  it("should resolve a simple createEntity TestCompositeActionTemplate, with templates and definition", () => {
    const testCompositeActionTemplate: TestCompositeActionTemplate = {
      testLabel: "Test Label",
      testType: "testCompositeActionTemplate",
      // compositeActionTemplate: { actionType: 'simpleAction' },
      testCompositeActionAssertions: [],
      compositeActionTemplate: {
        actionType: "compositeAction",
        actionName: "sequence",
        actionLabel: "testCompositeAction",
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
              // transformerType: "parameterReference",
              // referenceName: "jzodSchema",
              type: "object",
              definition: {
                a: { type: "string" },
                b: { type: "number" },
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
        ],
      },
    };
    const actionParamValues = {};
    const currentApplicationName = "Test";
    const currentApplicationUuid = uuidv4();
    const currentDeploymentUuid = uuidv4();
    const newEntity: MetaEntity = {
      uuid: uuidv4(),
      parentUuid: entityEntity.uuid,
      selfApplication: currentApplicationUuid,
      description: "newEntityDescription",
      name: "newEntityName",
    };

    const actionEffectiveParamsCreateEntity /** parsed by actionHandlerCreateEntity.interface.actionJzodObjectSchema */ =
      {
        currentApplicationName,
        currentApplicationUuid,
        currentDeploymentUuid,
        createEntity_newEntityName: newEntity.name,
        createEntity_newEntityDescription: newEntity.description,
        createEntity_newEntityUuid: newEntity.uuid,
        createEntity_newEntityDefinitionUuid: uuidv4(),
        createEntity_newEntityDetailsReportUuid: uuidv4(),
        createEntity_newEntityListReportUuid: uuidv4(),
        adminConfigurationDeploymentParis,
        //TODO: tag params, should be passed as context instead?
        // jzodSchema,
        entityEntityDefinition,
        entityReport,
        createEntity_newEntity: newEntity,
        entityMenu,
      };
    // const currentModel: MetaModel = {};

    const result = resolveTestCompositeActionTemplate(
      testCompositeActionTemplate,
      actionEffectiveParamsCreateEntity,
      defaultMiroirMetaModel
    );

    console.log(
      "################################",
      expect.getState().currentTestName,
      "result",
      JSON.stringify(result, null, 2)
    );
    const expectedResult: TestCompositeAction = {
      testLabel: "Test Label",
      testType: "testCompositeAction",
      afterTestCleanupAction: undefined,
      beforeTestSetupAction: undefined,
      testCompositeActionAssertions: [],
      compositeAction: {
        actionType: "compositeAction",
        actionName: "sequence",
        actionLabel: "testCompositeAction",
        deploymentUuid: undefined,
        // templates: (testCompositeActionTemplate.compositeActionTemplate as any).templates,
        definition: [
          {
            compositeActionType: "domainAction",
            compositeActionStepLabel: "createEntity",
            domainAction: {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid: currentDeploymentUuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {
                  entity: {
                    uuid: actionEffectiveParamsCreateEntity.createEntity_newEntityUuid,
                    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    selfApplication: currentApplicationUuid,
                    description: "newEntityDescription",
                    name: "newEntityName",
                  },
                  entityDefinition: {
                    name: "newEntityName",
                    uuid: actionEffectiveParamsCreateEntity.createEntity_newEntityDefinitionUuid,
                    parentName: "EntityDefinition",
                    parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                    entityUuid: actionEffectiveParamsCreateEntity.createEntity_newEntityUuid,
                    conceptLevel: "Model",
                    defaultInstanceDetailsReportUuid:
                      actionEffectiveParamsCreateEntity.createEntity_newEntityDetailsReportUuid,
                    jzodSchema: {
                      type: "object",
                      definition: {
                        a: { type: "string" },
                        b: { type: "number" },
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };
    expect(result.resolvedTestCompositeActionDefinition).toEqual(expectedResult);
  });

  // it('should resolve before and after actions', () => {
  //   const compositeActionTemplate: TestCompositeActionTemplate = {
  //     testLabel: 'Test Label',
  //     beforeTestSetupAction: { actionType: 'setupAction' },
  //     afterTestCleanupAction: { actionType: 'cleanupAction' },
  //     compositeActionTemplate: { actionType: 'simpleAction' },
  //     testCompositeActionAssertions: []
  //   };
  //   const actionParamValues = {};
  //   const currentModel: MetaModel = {};

  //   const result = resolveTestCompositeActionTemplate(compositeActionTemplate, actionParamValues, currentModel);

  //   expect(result.resolvedTestCompositeActionDefinition.beforeTestSetupAction.actionType).toBe('setupAction');
  //   expect(result.resolvedTestCompositeActionDefinition.afterTestCleanupAction.actionType).toBe('cleanupAction');
  // });
});






// describe('resolveTestCompositeActionTemplateSuite', () => {
//   it('should resolve a simple TestCompositeActionTemplateSuite', () => {
//     const compositeActionTemplateSuite: TestCompositeActionTemplateSuite = {
//       testLabel: 'Test Suite Label',
//       testCompositeActions: {
//         action1: {
//           testLabel: 'Action 1',
//           compositeActionTemplate: { actionType: 'simpleAction1' },
//           testCompositeActionAssertions: []
//         }
//       }
//     };
//     const actionParamValues = {};
//     const currentModel: MetaModel = {};

//     const result = resolveTestCompositeActionTemplateSuite(compositeActionTemplateSuite, actionParamValues, currentModel);

//     expect(result.resolvedTestCompositeActionDefinition.testType).toBe('testCompositeActionSuite');
//     expect(result.resolvedTestCompositeActionDefinition.testLabel).toBe('Test Suite Label');
//     expect(result.resolvedTestCompositeActionDefinition.testCompositeActions.action1.testLabel).toBe('Action 1');
//     expect(result.resolvedTestCompositeActionDefinition.testCompositeActions.action1.compositeAction.actionType).toBe('simpleAction1');
//   });

//   it('should resolve beforeAll, beforeEach, afterEach, and afterAll actions', () => {
//     const compositeActionTemplateSuite: TestCompositeActionTemplateSuite = {
//       testLabel: 'Test Suite Label',
//       beforeAll: { actionType: 'beforeAllAction' },
//       beforeEach: { actionType: 'beforeEachAction' },
//       afterEach: { actionType: 'afterEachAction' },
//       afterAll: { actionType: 'afterAllAction' },
//       testCompositeActions: {
//         action1: {
//           testLabel: 'Action 1',
//           compositeActionTemplate: { actionType: 'simpleAction1' },
//           testCompositeActionAssertions: []
//         }
//       }
//     };
//     const actionParamValues = {};
//     const currentModel: MetaModel = {};

//     const result = resolveTestCompositeActionTemplateSuite(compositeActionTemplateSuite, actionParamValues, currentModel);

//     expect(result.resolvedTestCompositeActionDefinition.beforeAll.actionType).toBe('beforeAllAction');
//     expect(result.resolvedTestCompositeActionDefinition.beforeEach.actionType).toBe('beforeEachAction');
//     expect(result.resolvedTestCompositeActionDefinition.afterEach.actionType).toBe('afterEachAction');
//     expect(result.resolvedTestCompositeActionDefinition.afterAll.actionType).toBe('afterAllAction');
//   });
// });