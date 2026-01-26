import { describe, expect, it } from 'vitest';
// import describe  from 'jest';
// import it from 'jest';
// import expect from 'jest';

import {
  EntityDefinition,
  JzodElement,
  MlSchema
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import { localizeJzodSchemaReferenceContext } from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";



import entityDefinitionAdminApplication from "../../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json";
import entityDefinitionMenu from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json';
import entityDefinitionJzodSchema from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionSelfApplicationVersion from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionEntity from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionTransformerTest from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/405bb1fc-a20f-4def-9d3a-206f72350633.json";
import entityDefinitionSelfApplication from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionReport from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionCommit from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json';
import entityDefinitionSelfApplicationDeploymentConfiguration from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionEntityDefinition from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEndpoint from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json';



import modelEndpointV1 from '../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json';

import jzodSchemajzodMiroirBootstrapSchema from "../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import transformerJzodSchema from "../../../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json";



import entityDefinitionBundleV1 from "../../../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
// import entityDefinitionCommit from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json";
import queryEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json";
import domainEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json";
import undoRedoEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json";
import localCacheEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json";
import testEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json";
import persistenceEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json";
import storeManagementEndpoint from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json";
import instanceEndpointVersionV1 from "../../../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json";
// import jzodSchemajzodMiroirBootstrapSchema from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
// import entityDefinitionEntity from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
// import entityDefinitionMenu  from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json";
import entityDefinitionQueryVersionV1 from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json";
import entityDefinitionTransformerDefinition from "../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json";
import entityDefinitionTest from '../../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json';


// import entityDefinitionDeployment from "../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import entityDefinitionDeployment from "../../../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import transformerMenuV1 from "../../../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json";

import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as MlSchema;
import { defaultMiroirMetaModel } from '../../../src/1_core/Model';

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################


function testLocalizeReferenceContext(
  testId: string,
  miroirFundamentalJzodSchema: MlSchema,
  // testSchema: JzodReference,
  testSchema: JzodElement,
  expectedResult: JzodElement,
){
  console.log("######################################### running test", testId, "...")
  const testResult = localizeJzodSchemaReferenceContext(
    miroirFundamentalJzodSchema,
    testSchema,
    defaultMiroirMetaModel,
    defaultMiroirMetaModel,
    (testSchema as any)["context"]??{},
  )
    expect(testResult).toEqual(expectedResult);
}

interface testFormat {
  // testId: string,
  // testSchema: JzodElement,
  miroirFundamentalJzodSchema: MlSchema,
  testSchema: JzodElement,
  // testValueObject: any,
  expectedResult: JzodElement,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
describe(
  'localizeReferenceContext',
  () => {

    // ###########################################################################################
    it(
      'miroir entity definition object format',
      () => {
        console.log(expect.getState().currentTestName, "called getMiroirFundamentalJzodSchema");
    
        const tests: { [k: string]: testFormat } = {
          // plain literal!
          test010: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "literal",
              definition: "myLiteral",
            },
            expectedResult: {
              type: "literal",
              definition: "myLiteral",
            },
          },
          //plain object
          test020: {
            miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
            testSchema: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
                b: {
                  type: "number",
                }
              }
            },
            expectedResult: {
              type: "object",
              definition: {
                a: {
                  type: "string",
                },
                b: {
                  type: "number",
                }
              }
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
                          definition: { relativePath: "myObject"}
                        }
                      ]
                    }
                  }
                }
              },
              definition: { relativePath: "myObject" }
            },
          },
          // // schemaReference: object, recursive, 2-level valueObject
        };

        for (const test of Object.entries(tests)) {
          testLocalizeReferenceContext(test[0], test[1].miroirFundamentalJzodSchema, test[1].testSchema, test[1].expectedResult)
          
        }
      }
    )
  }
)
