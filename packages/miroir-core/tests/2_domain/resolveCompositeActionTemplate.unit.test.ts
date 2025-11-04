// import { describe, expect, it } from 'vitest';

import { v4 as uuidv4 } from 'uuid';
import { JzodObject } from "@miroir-framework/jzod-ts";
import {
  CompositeAction,
  CompositeActionTemplate,
  EntityInstance,
  MetaModel,
  testCompositeAction,
  TestCompositeAction,
  TestCompositeActionSuite,
  testCompositeActionTemplate,
  TestCompositeActionTemplate,
  TestCompositeActionTemplateSuite
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { resolveCompositeActionTemplate } from "../../src/2_domain/ResolveCompositeActionTemplate";

import entityEntity from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json' assert { type: "json" };
import entityEntityDefinition from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json' assert { type: "json" };
import entityMenu from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json' assert { type: "json" };
import entityReport from '../../src/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json' assert { type: "json" };

import { MetaEntity, Uuid } from "../../src/0_interfaces/1_core/EntityDefinition";
import { resolveTestCompositeActionTemplate, resolveTestCompositeActionTemplateSuite } from "../../src/2_domain/TestSuiteTemplate";
import { defaultMiroirMetaModel } from "../../src/1_core/Model";
import { EntityDefinitionEntityDefinition } from '../../src/0_interfaces/1_core/writtenByHandSchema.js';
import { defaultMiroirModelEnvironment } from '../../dist';
// import { act } from 'react';

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

// ################################################################################################
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
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "createEntity_newEntityName",
            },
            uuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "createEntity_newEntityDefinitionUuid",
            },
            parentName: "EntityDefinition",
            parentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: "{{entityEntityDefinition.uuid}}",
            },
            entityUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: "{{createEntity_newEntity.uuid}}",
            },
            conceptLevel: "Model",
            defaultInstanceDetailsReportUuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "createEntity_newEntityDetailsReportUuid",
            },
            jzodSchema: {
              // transformerType: "getFromParameters",
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
            actionType: "createEntity",
            actionLabel: "createEntity",
            deploymentUuid: {
              transformerType: "getFromParameters",
              interpolation: "build",
              referenceName: "currentDeploymentUuid",
            },
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
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
                    referenceName: "newEntityDefinition",
                  },
                },
              ],
            }
          },
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
      defaultMiroirModelEnvironment,
      actionEffectiveParamsCreateEntity,
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
            actionType: "createEntity",
            actionLabel: "createEntity",
            deploymentUuid: currentDeploymentUuid,
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
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
            }
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






describe('resolveTestCompositeActionTemplateSuite', () => {
  it('should resolve a simple TestCompositeActionTemplateSuite', () => {
    const currentApplicationName = "Test";
    const currentApplicationUuid = uuidv4();
    const currentDeploymentUuid = uuidv4();

    const newEntityUuid = uuidv4();

    const newEntity: MetaEntity = {
      uuid: uuidv4(),
      parentUuid: entityEntity.uuid,
      selfApplication: currentApplicationUuid,
      description: "newEntityDescription",
      name: "newEntityName",
    };

    const newEntityDefinition: EntityDefinitionEntityDefinition ={
      name: "newEntityName",
      uuid: uuidv4(),
      parentName: "EntityDefinition",
      parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      entityUuid: newEntity.uuid,
      conceptLevel: "Model",
      defaultInstanceDetailsReportUuid: uuidv4(),
      jzodSchema: {
        type: "object",
        definition: {
          a: { type: "string" },
          b: { type: "number" },
        },
      },
    } as any;

    const compositeActionTemplateSuite: TestCompositeActionTemplateSuite = {
      testType: "testCompositeActionTemplateSuite",
      testLabel: 'Test Suite Label',
      testCompositeActions: {
        action1: {
          testType: "testCompositeActionTemplate",
          testLabel: 'Action 1',
          compositeActionTemplate: { 
            actionType: 'compositeAction',
            actionName: "sequence",
            actionLabel: "simpleAction1",
            definition: [
              {
                actionType: "createEntity",
                actionLabel: "createEntity",
                deploymentUuid: {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referenceName: "currentDeploymentUuid",
                },
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  entities: [
                    {
                      // entity: newEntity,
                      entity: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        referenceName: "createEntity_newEntity",
                      },
                      entityDefinition: newEntityDefinition as any,
                      // entityDefinition: {
                      //   transformerType: "getFromParameters",
                      //   referenceName: "newEntityDefinition",
                      // },
                    },
                  ],
                }
              },

            ]

          },
          testCompositeActionAssertions: []
        }
      }
    };
    const actionParamValues = {
      currentDeploymentUuid,
      createEntity_newEntity: newEntity
    };

    const result = resolveTestCompositeActionTemplateSuite(
      compositeActionTemplateSuite,
      defaultMiroirModelEnvironment,
      actionParamValues,
    );

    const expectedResult: TestCompositeActionSuite = {
      testLabel: "Test Suite Label",
      testType: "testCompositeActionSuite",
      testCompositeActions: {
        action1: {
          testLabel: "Action 1",
          testType: "testCompositeAction",
          testCompositeActionAssertions: [],
          compositeAction: {
            actionType: "compositeAction",
            actionName: "sequence",
            actionLabel: "simpleAction1",
            definition: [
              {
                actionType: "createEntity",
                actionLabel: "createEntity",
                deploymentUuid: currentDeploymentUuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                payload: {
                  entities: [
                    {
                      entity: {
                        uuid: newEntity.uuid,
                        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                        selfApplication: newEntity.selfApplication,
                        description: "newEntityDescription",
                        name: "newEntityName",
                      },
                      entityDefinition: {
                        name: "newEntityName",
                        uuid: newEntityDefinition.uuid,
                        parentName: "EntityDefinition",
                        parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
                        entityUuid: newEntity.uuid,
                        conceptLevel: "Model",
                        defaultInstanceDetailsReportUuid: (newEntityDefinition as any).defaultInstanceDetailsReportUuid,
                        jzodSchema: {
                          type: "object",
                          definition: {
                            a: {
                              type: "string",
                            },
                            b: {
                              type: "number",
                            },
                          },
                        },
                      },
                    },
                  ],
                }
              },
            ],
          },
        },
      },
    };
    console.log(
      "################################",
      expect.getState().currentTestName,
      "result",
      JSON.stringify(result, null, 2)
    );
    // expect(result, expect.getState().currentTestName).toEqual(expectedResult);
    expect(result.resolvedTestCompositeActionDefinition).toEqual(expectedResult);

    // expect(result.resolvedTestCompositeActionDefinition.testType).toBe('testCompositeActionSuite');
    // expect(result.resolvedTestCompositeActionDefinition.testLabel).toBe('Test Suite Label');
    // expect(result.resolvedTestCompositeActionDefinition.testCompositeActions.action1.testLabel).toBe('Action 1');
    // expect(result.resolvedTestCompositeActionDefinition.testCompositeActions.action1.compositeAction.actionType).toBe('simpleAction1');
  });

  // it('should resolve beforeAll, beforeEach, afterEach, and afterAll actions', () => {
  //   const compositeActionTemplateSuite: TestCompositeActionTemplateSuite = {
  //     testLabel: 'Test Suite Label',
  //     beforeAll: { actionType: 'beforeAllAction' },
  //     beforeEach: { actionType: 'beforeEachAction' },
  //     afterEach: { actionType: 'afterEachAction' },
  //     afterAll: { actionType: 'afterAllAction' },
  //     testCompositeActions: {
  //       action1: {
  //         testLabel: 'Action 1',
  //         compositeActionTemplate: { actionType: 'simpleAction1' },
  //         testCompositeActionAssertions: []
  //       }
  //     }
  //   };
  //   const actionParamValues = {};
  //   const currentModel: MetaModel = {};

  //   const result = resolveTestCompositeActionTemplateSuite(compositeActionTemplateSuite, actionParamValues, currentModel);

  //   expect(result.resolvedTestCompositeActionDefinition.beforeAll.actionType).toBe('beforeAllAction');
  //   expect(result.resolvedTestCompositeActionDefinition.beforeEach.actionType).toBe('beforeEachAction');
  //   expect(result.resolvedTestCompositeActionDefinition.afterEach.actionType).toBe('afterEachAction');
  //   expect(result.resolvedTestCompositeActionDefinition.afterAll.actionType).toBe('afterAllAction');
  // });
});