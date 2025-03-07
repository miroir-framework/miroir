import { jzodToTsCode } from "@miroir-framework/jzod-ts";
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from "path";

// import { getMiroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema"
import { getMiroirFundamentalJzodSchema } from "../0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.js"

import entityDefinitionBundleV1 from "../assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json" assert { type: "json" };
import entityDefinitionCommit from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json" assert { type: "json" };
import modelEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json" assert { type: "json" };
import storeManagementEndpoint from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json" assert { type: "json" };
import instanceEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json" assert { type: "json" };
import undoRedoEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json" assert { type: "json" };
import localCacheEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json" assert { type: "json" };
import domainEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json" assert { type: "json" };
import queryEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json" assert { type: "json" };
import persistenceEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json" assert { type: "json" };
import testEndpointVersionV1 from "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json" assert { type: "json" };
import jzodSchemajzodMiroirBootstrapSchema from "../assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json" assert { type: "json" };
import miroirTransformersJzodSchemas from "../assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json" assert { type: "json" };
import entityDefinitionAdminApplication from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json" assert { type: "json" };
import entityDefinitionSelfApplicationV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json" assert { type: "json" };
import entityDefinitionSelfApplicationVersionV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json" assert { type: "json" };
import entityDefinitionDeployment from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json" assert { type: "json" };
import entityDefinitionEntity from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json" assert { type: "json" };
import entityDefinitionEntityDefinitionV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json" assert { type: "json" };
import entityDefinitionJzodSchemaV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json" assert { type: "json" };
import entityDefinitionMenu  from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json" assert { type: "json" };
import entityDefinitionQueryVersionV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json" assert { type: "json" };
import entityDefinitionReportV1 from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json" assert { type: "json" };
import entityDefinitionTest from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json" assert { type: "json" };
import entityDefinitionTransformerDefinition from "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json" assert { type: "json" };
import transformerMenuV1 from "../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json" assert { type: "json" };
import entityDefinitionSelfApplication from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json' assert { type: "json" };
import entityDefinitionSelfApplicationDeploymentConfiguration from '../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json' assert { type: "json" };



const miroirFundamentalJzodSchema = 
  getMiroirFundamentalJzodSchema(
    entityDefinitionBundleV1,
    entityDefinitionCommit,
    modelEndpointVersionV1,
    storeManagementEndpoint,
    instanceEndpointVersionV1,
    undoRedoEndpointVersionV1,
    localCacheEndpointVersionV1,
    domainEndpointVersionV1,
    queryEndpointVersionV1,
    persistenceEndpointVersionV1,
    testEndpointVersionV1,
    jzodSchemajzodMiroirBootstrapSchema,
    miroirTransformersJzodSchemas,
    [transformerMenuV1],
    entityDefinitionAdminApplication,
    entityDefinitionSelfApplicationV1,
    entityDefinitionSelfApplicationVersionV1,
    entityDefinitionDeployment,
    entityDefinitionEntity,
    entityDefinitionEntityDefinitionV1,
    entityDefinitionJzodSchemaV1,
    entityDefinitionMenu ,
    entityDefinitionQueryVersionV1,
    entityDefinitionReportV1,
    entityDefinitionSelfApplicationDeploymentConfiguration,
    entityDefinitionTest,
    entityDefinitionTransformerDefinition,
  )
;

console.log("generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchema:", miroirFundamentalJzodSchema);


// ################################################################################################
export async function generateZodSchemaFileFromJzodSchema(
  jzodElement: any,
  targetFileName: string,
  jzodSchemaVariableName:string,
) {
  // log.info("generateZodSchemaFileFromJzodSchema called!");
 
  const generateTypeAnotationsForSchema =
    // jzodElement.type == "schemaReference" ? Object.keys(jzodElement.context) : [];
    jzodElement.type == "schemaReference"
      ? Object.keys(jzodElement.context).filter(
          (e) =>
            ![
              // "jzodObject",
              "entityInstance",
              "entityAttributeUntypedCore",
              "entityAttributeCore",
              "entityArrayAttribute",
              "entityForeignKeyAttribute",
            ].includes(e)
        )
      : [];

  // console.log("generateZodSchemaFileFromJzodSchema generateTypeAnotationsForSchema:", generateTypeAnotationsForSchema);
  const newFileContentsNotFormated = jzodToTsCode(
    jzodElement,
    true,
    jzodSchemaVariableName,
    generateTypeAnotationsForSchema,
  );
  const newFileContents = newFileContentsNotFormated;

  console.log("generateZodSchemaFileFromJzodSchema targetFileName:", targetFileName);
  if (targetFileName && existsSync(targetFileName)) {
    const oldFileContents = readFileSync(targetFileName).toString()
    if (newFileContents != oldFileContents)  {
      // console.log("generateZodSchemaFileFromJzodSchema newFileContents",newFileContents);
      writeFileSync(targetFileName,newFileContents);
    } else {
      console.log("generateZodSchemaFileFromJzodSchema entityDefinitionReport old contents equal new contents, no file generation needed.");
    }
  } else {
    writeFileSync(targetFileName,newFileContents);
  }
}

// ################################################################################################
const jzodSchemaConversion
= [
  {
    jzodElement: miroirFundamentalJzodSchema.definition,
    targetDirectory: "./src/0_interfaces/1_core/preprocessor-generated",
    targetFileName: "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
    jzodSchemaVariableName: "miroirFundamentalType",
  },
];


// console.log("####### JZodElement to convert",JSON.stringify(ModelEntityUpdateCreateMetaModelInstanceSchema, null, 2));
// const convertedZodSchema = zodToJzod(ModelEntityUpdateCreateMetaModelInstanceSchema,"ModelEntityUpdateCreateMetaModelInstanceSchema");
// console.log("####### convertedZodSchema",JSON.stringify(convertedZodSchema, null, 2));
async function generateSchemas() {
  try {
    const miroirFundamentalJzodSchemaFilePath = path.join(
      jzodSchemaConversion[0].targetDirectory,
      "miroirFundamentalJzodSchema.ts"
    );
    const miroirFundamentalJzodSchemaJson =
      "export const miroirFundamentalJzodSchema = " + JSON.stringify(miroirFundamentalJzodSchema, undefined, 2);
    console.log(
      "generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFilePath",
      miroirFundamentalJzodSchemaFilePath
    );
    if (miroirFundamentalJzodSchemaFilePath && existsSync(miroirFundamentalJzodSchemaFilePath)) {
      const oldFileContents = readFileSync(miroirFundamentalJzodSchemaFilePath).toString();
      if (miroirFundamentalJzodSchemaJson != oldFileContents) {
        // TODO: do deep equal
        // console.log(
        //   "generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFileName miroirFundamentalJzodSchemaJson",
        //   miroirFundamentalJzodSchemaJson
        // );
        writeFileSync(miroirFundamentalJzodSchemaFilePath, miroirFundamentalJzodSchemaJson);
      } else {
        console.log(
          "generateZodSchemaFileFromJzodSchema miroirFundamentalJzodSchemaFileName old contents equal new contents, no file generation needed."
        );
      }
    } else {
      writeFileSync(miroirFundamentalJzodSchemaFilePath, miroirFundamentalJzodSchemaJson);
    }

    for (const schema of jzodSchemaConversion) {
      await generateZodSchemaFileFromJzodSchema(schema.jzodElement,schema.targetFileName,schema.jzodSchemaVariableName)
      console.info("GENERATED",schema.targetFileName);
    }


  } catch (error) {
    console.error("could not generate TS files from Jzod schemas", error);
  }
}

generateSchemas();