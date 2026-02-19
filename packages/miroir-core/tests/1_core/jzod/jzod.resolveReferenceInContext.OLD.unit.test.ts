import { describe, it, expect } from 'vitest';
import {
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  JzodReference,
  mlSchema,
  MlSchema,
  Menu,
  MetaModel,
  Report,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirModel } from "../../../src/0_interfaces/1_core/Model";

import { unfoldJzodSchemaOnce} from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";

import {
  // Entities
  entitySelfApplication,
  entitySelfApplicationDeploymentConfiguration,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityApplicationVersionCrossEntityDeployment,
  entityCommit,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entityStoreBasedConfiguration,
  entityQueryVersion,
  // Entity Definitions
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionApplicationVersionCrossEntityDeployment,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionCommit,
  entityDefinitionEndpoint,
  entityDefinitionEntityDefinition,
  entityDefinitionEntity,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionReport,
  entityDefinitionStoreBasedConfiguration,
  entityDefinitionQuery,
  // Reports
  reportApplicationList,
  reportApplicationDeploymentConfigurationList,
  reportApplicationModelBranchList,
  reportApplicationVersionList,
  reportCommitList,
  reportConfigurationList,
  reportJzodSchemaList,
  reportEndpointVersionList,
  reportEntityList,
  reportEntityDefinitionList,
  reportReportList,
  reportMenuList,
  // Query
  queryVersionBundleProducerV1,
  // Endpoints
  applicationEndpointV1,
  deploymentEndpointV1,
  instanceEndpointV1,
  modelEndpointV1,
  // ApplicationVersionCrossEntityDefinition instances
  applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
  // Other data
  selfApplicationVersionInitialMiroirVersion,
  jzodSchemajzodMiroirBootstrapSchema,
  transformerJzodSchema,
  menuDefaultMiroir,
  // V1-suffixed aliases
  modelEndpointVersionV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  domainEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  testEndpointVersionV1,
  entityDefinitionSelfApplicationV1,
  entityDefinitionSelfApplicationVersionV1,
  entityDefinitionEntityDefinitionV1,
  entityDefinitionJzodSchemaV1,
  entityDefinitionQueryVersionV1,
  entityDefinitionReportV1,
  entityDefinitionTest,
  entityDefinitionTransformerTest,
  entityDefinitionTransformerDefinition,
  // TransformerDefinition data
  transformerMenuV1,
} from "miroir-test-app_deployment-miroir";

import { entityDefinitionAdminApplication } from "miroir-test-app_deployment-admin";

import entityDefinitionBundleV1 from "../../../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
// import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import entityDefinitionDeployment from "../../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";

import { getMiroirFundamentalJzodSchema} from "../../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema"
import { resolveJzodSchemaReferenceInContext } from '../../../src/1_core/jzod/jzodResolveSchemaReferenceInContext';
import { defaultMiroirModelEnvironment } from '../../../src/1_core/Model';
import { miroirFundamentalJzodSchema} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";

const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as MlSchema;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################

function testResolveReferenceInContext(
  testId: string,
  miroirFundamentalJzodSchema: MlSchema,
  testSchema: JzodReference,
  // testValueObject: any,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  const testResult = resolveJzodSchemaReferenceInContext(
    testSchema,
    testSchema.context,
    defaultMiroirModelEnvironment,
  )
    expect(testResult).toEqual(expectedResult);
}

interface testFormat {
  // testId: string,
  // testSchema: JzodElement,
  miroirFundamentalJzodSchema: MlSchema,
  testSchema: JzodReference,
  // testValueObject: any,
  expectedResult: JzodElement,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'resolveReferenceInContext',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {
        // const miroirFundamentalJzodSchema: MlSchema = getMiroirFundamentalJzodSchema(
        // const miroirFundamentalJzodSchema: any = getMiroirFundamentalJzodSchema(
        //   entityDefinitionBundleV1 as EntityDefinition,
        //   entityDefinitionCommit as EntityDefinition,
        //   modelEndpointV1,
        //   storeManagementEndpoint,
        //   instanceEndpointVersionV1,
        //   undoRedoEndpointVersionV1,
        //   localCacheEndpointVersionV1,
        //   domainEndpointVersionV1,
        //   queryEndpointVersionV1,
        //   persistenceEndpointVersionV1,
        //   testEndpointVersionV1,
        //   jzodSchemajzodMiroirBootstrapSchema as MlSchema,
        //   transformerJzodSchema as MlSchema,
        //   [transformerMenuV1],
        //   entityDefinitionAdminApplication as EntityDefinition,
        //   entityDefinitionSelfApplication as EntityDefinition,
        //   entityDefinitionSelfApplicationVersion as EntityDefinition,
        //   entityDefinitionDeployment as EntityDefinition,
        //   entityDefinitionEntity as EntityDefinition,
        //   entityDefinitionEntityDefinition as EntityDefinition,
        //   entityDefinitionJzodSchema as EntityDefinition,
        //   entityDefinitionMenu  as EntityDefinition,
        //   entityDefinitionQueryVersionV1 as EntityDefinition,
        //   entityDefinitionReport as EntityDefinition,
        //   entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
        //   entityDefinitionTest as EntityDefinition,
        //   entityDefinitionTransformerTest as EntityDefinition,
        //   entityDefinitionTransformerDefinition as EntityDefinition,
        //   entityDefinitionEndpoint as EntityDefinition,
        //   // jzodSchemajzodMiroirBootstrapSchema as any,
        // );
        console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");
            
        
        const tests: { [k: string]: testFormat } = {
          // schemaReference (plain, simpleType, non-recursive)
          test030: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                a: {
                  type: "string"
                }
              },
              definition: {
                "relativePath": "a"
              }
            },
            expectedResult: {
              type: "string"
            },
          },
          // schemaReference: object, recursive, 1-level valueObject
          test040: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                "myObject": {
                  type: "object",
                  definition: {
                    a: {
                      type: "union",
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject" }
            },
            expectedResult: { // context is omitted, has dangling "myObject" reference
              "type": "object",
              "definition": {
                "a": {
                  "type": "union",
                  "definition": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "schemaReference",
                      "definition": {
                        "relativePath": "myObject"
                      }
                    }
                  ]
                }
              }
            },
          },
          // schemaReference: object, recursive, 2 members
          test050: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                "myObject": {
                  type: "object",
                  definition: {
                    a: {
                      type: "union",
                      discriminator: "type",
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    },
                    b: {
                      type: "union",
                      discriminator: "type",
                      definition: [
                        {
                          type: "number",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject" }
            },
            expectedResult: { // context is omitted, has dangling "myObject" reference
              type: "object",
              definition: {
                a: {
                  type: "union",
                  discriminator: "type",
                  definition: [
                    {
                      type: "string",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject"}
                    },
                  ]
                },
                b: {
                  type: "union",
                  discriminator: "type",
                  definition: [
                    {
                      type: "number",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject"}
                    }
                  ]
                }
              }
            },
          },
          // schemaReference: 2-entries context, object, mutually-recursive
          test060: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "schemaReference",
              context: {
                "myObject1": {
                  type: "object",
                  definition: {
                    a: {
                      type: "union",
                      definition: [
                        {
                          type: "string",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject2"}
                        }
                      ]
                    }
                  }
                },
                "myObject2": {
                  type: "object",
                  definition: {
                    b: {
                      type: "union",
                      definition: [
                        {
                          type: "number",
                        },
                        {
                          type: "schemaReference",
                          definition: { relativePath: "myObject1"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject2" }
            },
            expectedResult: { // non-referenced contexted entry is omitted, shall be taken in global contest for resolution
              type: "object",
              definition: {
                b: {
                  type: "union",
                  definition: [
                    {
                      type: "number",
                    },
                    {
                      type: "schemaReference",
                      definition: { relativePath: "myObject1"}
                    }
                  ]
                }
              }
            },
          },
        };

        for (const test of Object.entries(tests)) {
          testResolveReferenceInContext(
            test[0], test[1].miroirFundamentalJzodSchema, test[1].testSchema, test[1].expectedResult)
          
        }
      }
    )
  },
  // 10_000 // timeout (ms)
)
