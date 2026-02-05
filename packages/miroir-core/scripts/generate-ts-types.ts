import path from "path";
import fs from 'fs/promises';
import equal from "fast-deep-equal";

import {
  jzodToZodTextAndZodSchema,
  ZodTextAndZodSchemaRecord,
} from "@miroir-framework/jzod";

import {
  JzodElement,
  jzodToZodTextAndZodSchemaForTsGeneration,
  jzodToTsCode,
} from "@miroir-framework/jzod-ts";

import entityDefinitionBundleV1 from "../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
import entityDefinitionCommit from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json";
import modelEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json";
import storeManagementEndpoint from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json";
import instanceEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json";
import undoRedoEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json";
import localCacheEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json";
import domainEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json";
import queryEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json";
import persistenceEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json";
import testEndpointVersionV1 from "../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json";
import jzodSchemajzodMiroirBootstrapSchema from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json";
import miroirTransformersJzodSchemas from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json";
import { entityDefinitionAdminApplication, entityDefinitionDeployment } from "miroir-deployment-admin";
import entityDefinitionSelfApplicationV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json";
import entityDefinitionSelfApplicationVersionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json";
import entityDefinitionEntity from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
import entityDefinitionEntityDefinitionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionJzodSchemaV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json";
import entityDefinitionMenu from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json";
import entityDefinitionQueryVersionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json";
import entityDefinitionReportV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json";
import entityDefinitionRunner from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/daa38a5f-f1b5-4d4f-94b7-54e97fe6782e.json";
import entityDefinitionTest from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json";
import entityDefinitionTransformerTest from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/405bb1fc-a20f-4def-9d3a-206f72350633.json";
import entityDefinitionTransformerDefinition from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json";
import entityDefinitionEndpointDefinition from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json";
import transformerMenuV1 from "../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json";
import entityDefinitionSelfApplicationDeploymentConfiguration from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json";


import {
  getMiroirFundamentalJzodSchema,
} from "../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.js";
import { miroirTransformersForBuild, mlsTransformers } from "../src/2_domain/Transformers";
import {
  miroirFundamentalJzodSchemaUuid,
  getExtendedSchemas,
  getExtendedSchemasWithCarryOn,
} from "../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers";

async function build() {
    try {
        console.log('Starting build process...');
        const startBuild = Date.now();
        // Compile TypeScript files
        console.log('TypeScript compilation completed.');
        await generateSchemas();
        console.log('Build process completed successfully in', Date.now() - startBuild, 'ms');
    } catch (error) {
        console.error('Build process failed:', error);
        process.exit(1);
    }
}

build();

// ################################################################################################
async function fileExists(filePath: string): Promise<boolean> {
  try {
      await fs.access(filePath);
      return true;
  } catch {
      return false;
  }
}

async function writeFile(jzodElement:any, targetFileName: any, jzodSchemaVariableName: any, newFileContents: any) {
  if (targetFileName && await fileExists(targetFileName)) {
    const oldFileContents = await fs.readFile(targetFileName).toString();
    if (newFileContents != oldFileContents) {
      await fs.writeFile(targetFileName, newFileContents);
      console.log("writeFile", targetFileName, "generated!");
    } else {
      console.log(
        "writeFile entityDefinitionReport old contents equal new contents, no file generation needed."
      );
    }
  } else {
    await fs.writeFile(targetFileName, newFileContents);
  }
  
}

// ################################################################################################
async function generateTsTypeFileFromJzod(
  jzodElement: any,
  targetFileName: any,
  jzodSchemaVariableName: any,
  context: any,
  extendedTsTypesText?: string
) {
  // log.info("generateTsTypeFileFromJzodSchemaInParallel called!");
  const generateTypeAnotationsForSchema: string[] =
    jzodElement.type == "schemaReference"
      ? Object.keys(jzodElement.context).filter(
          (e) =>
            ![
              "entityInstance",
              "entityAttributeUntypedCore",
              "entityAttributeCore",
              "entityArrayAttribute",
              "entityForeignKeyAttribute",
            ].includes(e)
        )
      : [];
  // console.log("generateTsTypeFileFromJzodSchemaInParallel generateTypeAnotationsForSchema:", generateTypeAnotationsForSchema);

  const headerForZodImports = `// Auto-generated file, do not edit directly.
// use \`npm run devBuild\` to regenerate.
// generated by packages/miroir-core/scripts/generate-ts-types.ts
// generated on ${new Date().toISOString()}
import { ZodType, ZodTypeAny, z } from "zod";
export type TransformerForBuild =
    | string
    | number
    | boolean
    | TransformerForBuild[]
    | (
      {
        [P in string]: TransformerForBuild;
      }
       & {
        [P in "transformerType" | "interpolation"]?: never;
      }
    )
  | TransformerForBuild_menu_addItem
  | TransformerForBuild_ifThenElse
  | TransformerForBuild_case
  | TransformerForBuild_returnValue
  | TransformerForBuild_constantAsExtractor
  | TransformerForBuild_aggregate
  | TransformerForBuild_dataflowObject
  | TransformerForBuild_createObject
  | TransformerForBuild_pickFromList
  | TransformerForBuild_indexListBy
  | TransformerForBuild_listReducerToSpreadObject
  | TransformerForBuild_mapList
  | TransformerForBuild_mustacheStringTemplate
  | TransformerForBuild_plus
  | TransformerForBuild_generateUuid
  | TransformerForBuild_mergeIntoObject
  | TransformerForBuild_accessDynamicPath
  | TransformerForBuild_getObjectEntries
  | TransformerForBuild_getObjectValues
  | TransformerForBuild_createObjectFromPairs
  | TransformerForBuild_getFromParameters
  | TransformerForBuild_getUniqueValues
  // | TransformerForBuild_constantBigint
  | TransformerForBuild_InnerReference
  | TransformerForBuild_dataflowSequence
  // MLS
  | ${Object.keys(mlsTransformers)
    .map((e) => `${e.replace("transformer_", "TransformerForBuild_")}`)
    .join("\n  | ")}
;

export const transformerForBuild: z.ZodType<TransformerForBuild> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    transformerForBuild
  ).refine(
    // obj => !('transformerType' in obj || 'interpolation' in obj),
    obj => !('transformerType' in obj),
    {
      message: "Object must not contain 'transformerType' key",
      path: ['transformerType']
    }
  );
  
  // Define the transformer types with specific transformerType values
  
  // Combine all possible types
  return z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(transformerForBuild),
    recordWithoutTransformerType,
    transformerForBuild_menu_addItem,
    transformerForBuild_ifThenElse,
    transformerForBuild_case,
    transformerForBuild_returnValue,
    transformerForBuild_constantAsExtractor,
    transformerForBuild_aggregate,
    transformerForBuild_dataflowObject,
    transformerForBuild_createObject,
    transformerForBuild_pickFromList,
    transformerForBuild_indexListBy,
    transformerForBuild_listReducerToSpreadObject,
    transformerForBuild_mapList,
    transformerForBuild_mustacheStringTemplate,
    transformerForBuild_plus,
    transformerForBuild_generateUuid,
    transformerForBuild_mergeIntoObject,
    transformerForBuild_accessDynamicPath,
    transformerForBuild_getObjectEntries,
    transformerForBuild_getObjectValues,
    transformerForBuild_createObjectFromPairs,
    transformerForBuild_getFromParameters,
    transformerForBuild_getUniqueValues,
    // transformerForBuild_constantBigint,
    transformerForBuild_InnerReference,
    transformerForBuild_dataflowSequence,
    // MLS
    ${Object.keys(mlsTransformers)
      .map((e) => `${e.replace("transformer_", "transformerForBuild_")}`)
      .join(",\n   ")}
  ]);
});

export type TransformerForBuildPlusRuntime =
    | string
    | number
    | boolean
    | TransformerForBuildPlusRuntime[]
    | (
      {
        [P in string]: TransformerForBuildPlusRuntime;
      }
       & {
        [P in "transformerType" | "interpolation"]?: never;
      }
    )
  // | TransformerForBuild
  | TransformerForBuildPlusRuntime_menu_addItem
  | TransformerForBuildPlusRuntime_ifThenElse
  | TransformerForBuildPlusRuntime_case
  | TransformerForBuildPlusRuntime_returnValue
  | TransformerForBuildPlusRuntime_constantAsExtractor
  | TransformerForBuildPlusRuntime_aggregate
  | TransformerForBuildPlusRuntime_dataflowObject
  | TransformerForBuildPlusRuntime_createObject
  | TransformerForBuildPlusRuntime_pickFromList
  | TransformerForBuildPlusRuntime_indexListBy
  | TransformerForBuildPlusRuntime_listReducerToSpreadObject
  | TransformerForBuildPlusRuntime_mapList
  | TransformerForBuildPlusRuntime_mustacheStringTemplate
  | TransformerForBuildPlusRuntime_plus
  | TransformerForBuildPlusRuntime_generateUuid
  | TransformerForBuildPlusRuntime_mergeIntoObject
  | TransformerForBuildPlusRuntime_accessDynamicPath
  | TransformerForBuildPlusRuntime_getObjectEntries
  | TransformerForBuildPlusRuntime_getObjectValues
  | TransformerForBuildPlusRuntime_createObjectFromPairs
  | TransformerForBuildPlusRuntime_getFromParameters
  | TransformerForBuildPlusRuntime_getFromContext
  | TransformerForBuildPlusRuntime_getUniqueValues
  // | TransformerForBuildPlusRuntime_constantBigint
  | TransformerForBuildPlusRuntime_InnerReference
  | TransformerForBuildPlusRuntime_dataflowSequence
  // MLS
  | ${Object.keys(mlsTransformers)
    .map((e) => `${e.replace("transformer_", "TransformerForBuildPlusRuntime_")}`)
    .join("\n  | ")}
;

export const transformerForBuildPlusRuntime: z.ZodType<TransformerForBuildPlusRuntime> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    transformerForBuildPlusRuntime
  ).refine(
    // obj => !('transformerType' in obj || 'interpolation' in obj),
    obj => !('transformerType' in obj),
    {
      message: "Object must not contain 'transformerType'",
      path: ['transformerType']
    }
  );
  
  // Define the transformer types with specific transformerType values
  
  // Combine all possible types
  return z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(transformerForBuildPlusRuntime),
    recordWithoutTransformerType,
    // transformerForBuild,
    transformerForBuildPlusRuntime_menu_addItem,
    transformerForBuildPlusRuntime_case,
    transformerForBuildPlusRuntime_returnValue,
    transformerForBuildPlusRuntime_constantAsExtractor,
    transformerForBuildPlusRuntime_aggregate,
    transformerForBuildPlusRuntime_dataflowObject,
    transformerForBuildPlusRuntime_createObject,
    transformerForBuildPlusRuntime_pickFromList,
    transformerForBuildPlusRuntime_indexListBy,
    transformerForBuildPlusRuntime_listReducerToSpreadObject,
    transformerForBuildPlusRuntime_mapList,
    transformerForBuildPlusRuntime_mustacheStringTemplate,
    transformerForBuildPlusRuntime_plus,
    transformerForBuildPlusRuntime_generateUuid,
    transformerForBuildPlusRuntime_mergeIntoObject,
    transformerForBuildPlusRuntime_accessDynamicPath,
    transformerForBuildPlusRuntime_getObjectEntries,
    transformerForBuildPlusRuntime_getObjectValues,
    transformerForBuildPlusRuntime_createObjectFromPairs,
    transformerForBuildPlusRuntime_getFromParameters,
    transformerForBuildPlusRuntime_getFromContext,
    transformerForBuildPlusRuntime_getUniqueValues,
    // transformerForBuildPlusRuntime_constantBigint,
    transformerForBuildPlusRuntime_InnerReference,
    transformerForBuildPlusRuntime_dataflowSequence,
    // MLS
    ${Object.keys(mlsTransformers)
      .map((e) => `${e.replace("transformer_", "transformerForBuildPlusRuntime_")}`)
      .join(",\n   ")}
  ]);
});


`;
  const generateTypesStart = Date.now();
  const newFileContentsNotFormated = jzodToTsCode(
    jzodSchemaVariableName,
    jzodElement,
    context,
    true, // exportPrefix
    headerForZodImports,// true, // headerForZodImports
    generateTypeAnotationsForSchema,
    extendedTsTypesText,
  );
  const newFileContents = newFileContentsNotFormated;
  console.log(
    "generateTsTypeFileFromJzodSchemaInParallel generateTypes took",
    Date.now() - generateTypesStart,
    "ms"
  );
  console.log("generateTsTypeFileFromJzodSchemaInParallel writing file:", targetFileName, (await newFileContents).length);
  writeFile(jzodElement, targetFileName, jzodSchemaVariableName, newFileContents);
  console.log("generateTsTypeFileFromJzodSchemaInParallel file written OK:", targetFileName);
}

// ################################################################################################
async function generateSchemas(generateFundamentalJzodSchema = true) {
    const generateSchemasStartTime = Date.now();
    console.log("miroir-core generateSchemas start!");
    const targetDirectory = "./src/0_interfaces/1_core/preprocessor-generated";
    // const targetFileName = "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType2.ts";
    // const miroirFundamentalJzodSchemaFilePath = path.join(targetDirectory, "miroirFundamentalJzodSchema2.ts");
    const targetFileName = "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts";
    const miroirFundamentalJzodSchemaFilePath = path.join(targetDirectory, "miroirFundamentalJzodSchema.ts");
    const extendedSchemaVariableName = "extendedSchemasType";
    const jzodSchemaVariableName = "miroirFundamentalType";
    // const start = Date.now();
    let miroirFundamentalJzodSchema: any; // TODO: not really a JzodElement!!
    try {
      miroirFundamentalJzodSchema = getMiroirFundamentalJzodSchema(
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
        [],//[transformerMenuV1],
        entityDefinitionAdminApplication,
        entityDefinitionSelfApplicationV1,
        entityDefinitionSelfApplicationVersionV1,
        entityDefinitionDeployment,
        entityDefinitionEntity,
        entityDefinitionEntityDefinitionV1,
        entityDefinitionJzodSchemaV1,
        entityDefinitionMenu,
        entityDefinitionQueryVersionV1,
        entityDefinitionReportV1,
        entityDefinitionRunner,
        entityDefinitionSelfApplicationDeploymentConfiguration,
        entityDefinitionTest,
        entityDefinitionTransformerTest,
        entityDefinitionTransformerDefinition,
        entityDefinitionEndpointDefinition,
      );
      // console.log("miroir-core generateSchemas miroirFundamentalJzodSchema:", miroirFundamentalJzodSchema);
      console.log(
        "miroir-core generateSchemas getMiroirFundamentalJzodSchema took",
        Date.now() - generateSchemasStartTime,
        "ms"
      );
      const filteredMiroirFundamentalJzodSchemaContext = Object.fromEntries(
        Object.entries(miroirFundamentalJzodSchema.definition.context).filter(
          ([key, value]) =>
            ![
              "transformerForBuild",
              // "transformerForRuntime",
              "transformerForBuildPlusRuntime",
            ].includes(key)
        )
      ) as JzodElement;
      console.log(
        "miroir-core generateSchemas filteredMiroirFundamentalJzodSchemaContext:",
        JSON.stringify(Object.keys(filteredMiroirFundamentalJzodSchemaContext), null, 2)
      );
      const writeFundamentalJzodSchemaStartTime = Date.now();
      const miroirFundamentalJzodSchemaJson =
        "export const miroirFundamentalJzodSchema = " +
        JSON.stringify(miroirFundamentalJzodSchema, undefined, 2);
      console.log(
        "generateSchemas miroirFundamentalJzodSchemaFilePath",
        miroirFundamentalJzodSchemaFilePath
      );
      if (
        miroirFundamentalJzodSchemaFilePath &&
        (await fileExists(miroirFundamentalJzodSchemaFilePath))
      ) {
        const oldFileContents = fs.readFile(miroirFundamentalJzodSchemaFilePath).toString();
        if (miroirFundamentalJzodSchemaJson != oldFileContents) {
          // TODO: do deep equal
          // console.log(
          //   "generateSchemas miroirFundamentalJzodSchemaFileName miroirFundamentalJzodSchemaJson",
          //   miroirFundamentalJzodSchemaJson
          // );
          fs.writeFile(miroirFundamentalJzodSchemaFilePath, miroirFundamentalJzodSchemaJson);
        } else {
          console.log(
            "generateSchemas miroirFundamentalJzodSchemaFileName old contents equal new contents, no file generation needed."
          );
        }
      } else {
        fs.writeFile(miroirFundamentalJzodSchemaFilePath, miroirFundamentalJzodSchemaJson);
      }
      // }
      console.log(
        "miroir-core generateSchemas writeFundamentalJzodSchema took",
        Date.now() - writeFundamentalJzodSchemaStartTime,
        "ms"
      );

      if (miroirFundamentalJzodSchema.definition?.type !== "schemaReference") {
        throw new Error("miroir-core miroirFundamentalJzodSchema is not a schemaReference");
      }
      if (!miroirFundamentalJzodSchema.definition.context) {
        throw new Error("miroir-core miroirFundamentalJzodSchema.context is undefined");
      }
      const preExtendedSchemas: string[] = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema.definition.context);
      const mlElementTemplateExtendedSchemas: string[] = getExtendedSchemasWithCarryOn(
        jzodSchemajzodMiroirBootstrapSchema,
        miroirFundamentalJzodSchemaUuid
      );

      const extendedSchemas = preExtendedSchemas.concat(mlElementTemplateExtendedSchemas);

      const extendedJzodSchemaContext: [string, JzodElement][] = Object.entries(
        // miroirFundamentalJzodSchema.definition.context
        filteredMiroirFundamentalJzodSchemaContext
      ).filter((e) => extendedSchemas.includes(e[0])) as any;
      // const exendedJzodSchemaContext = Object.fromEntries(Object.entries(miroirFundamentalJzodSchema.definition.context));
      // console.log("miroir-core generateSchemas exendedJzodSchemaContext:", exendedJzodSchemaContext);
      const extendedZodSchema = {
        type: "schemaReference",
        context: Object.fromEntries(extendedJzodSchemaContext),
        definition: {
          relativePath: "transformerForBuildPlusRuntime_Abstract",
        },
      };
      console.log(
        "miroir-core generateSchemas filteredMiroirFundamentalJzodSchema:",
        JSON.stringify(Object.keys(filteredMiroirFundamentalJzodSchemaContext), null, 2)
      );
      console.log(
        "miroir-core generateSchemas extendedZodSchema 1:",
        JSON.stringify(Object.keys(extendedZodSchema.context), null, 2)
      );
      // console.log("miroir-core generateSchemas extendedZodSchema:", JSON.stringify(extendedZodSchema, null, 2));

      const extendedZodTextAndZodSchemaRecord: ZodTextAndZodSchemaRecord = {};
      extendedJzodSchemaContext.forEach((e) => {
        extendedZodTextAndZodSchemaRecord[e[0]] = jzodToZodTextAndZodSchema(
          e[1],
          () => extendedZodTextAndZodSchemaRecord,
          () => extendedZodTextAndZodSchemaRecord
        );
      });

      console.log(
        "miroir-core generateSchemas extendedZodTextAndZodSchemaRecord:",
        JSON.stringify(Object.keys(extendedZodTextAndZodSchemaRecord), null, 2)
      );

      const extendedZodTextAndZodSchemaRecordForTsGenerationContext: ZodTextAndZodSchemaRecord = {};
      extendedJzodSchemaContext.forEach((e) => {
        extendedZodTextAndZodSchemaRecordForTsGenerationContext[e[0]] =
          jzodToZodTextAndZodSchemaForTsGeneration(
            e[1],
            extendedZodTextAndZodSchemaRecordForTsGenerationContext
          );
      });

      // console.log("miroir-core generateSchemas extendedZodSchemaAndDescriptionForTsGenerationContext:", JSON.stringify(extendedZodSchemaAndDescriptionForTsGenerationContext, null, 2));
      const generateTypeAnotationsForSchema = Object.keys(extendedZodSchema.context).filter(
        (e) =>
          ![
            // "jzodObject",
            "entityInstance",
            "entityAttributeUntypedCore",
            "entityAttributeCore",
            "entityArrayAttribute",
            "entityForeignKeyAttribute",
          ].includes(e)
      );
      // console.log("generateSchemas generateTypeAnotationsForSchema:", generateTypeAnotationsForSchema);
      console.log(
        "miroir-core generateSchemas extendedZodSchema 2:",
        JSON.stringify(Object.keys(extendedZodSchema.context), null, 2)
      );

      console.log("miroir-core calling jzodToTsCode.");
      const extendedJzodSchemasTsTypes = jzodToTsCode(
        extendedSchemaVariableName,
        extendedZodSchema,
        extendedZodTextAndZodSchemaRecord,
        true, // exportPrefix
        false, // headerForZodImports
        generateTypeAnotationsForSchema,
      );

      console.log("miroir-core generateSchemas extendedTypes generated.");
      const nonExtendedJzodSchemaContext: ZodTextAndZodSchemaRecord = Object.fromEntries(
        // Object.entries(miroirFundamentalJzodSchema.definition.context).filter(
        Object.entries(filteredMiroirFundamentalJzodSchemaContext).filter(
          (e) => !extendedSchemas.includes(e[0])
        )
      ) as any;
      const nonExtendedZodSchema = {
        type: "schemaReference",
        context: nonExtendedJzodSchemaContext,
        definition: {
          relativePath: "jzodElement",
        },
      };

      const startGenerateZodSchemaFileFromZodSchema = Date.now();
      // console.log("miroir-core generateSchemas main miroirFundamentalJzodSchema started");
      await generateTsTypeFileFromJzod(
        nonExtendedZodSchema,
        targetFileName,
        jzodSchemaVariableName,
        extendedZodTextAndZodSchemaRecordForTsGenerationContext,
        // Object.fromEntries(extendedJzodSchemaContext),
        extendedJzodSchemasTsTypes
      );
      console.log(
        "miroir-core GENERATED Zod schema file: ",
        targetFileName,
        "took",
        Date.now() - startGenerateZodSchemaFileFromZodSchema,
        "ms"
      );
      // const oldTransformer = (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_getUniqueValues;
      const newTransformer = miroirTransformersForBuild.transformer_menu_addItem;
      // console.log(
      //   "old transformer", 
      //   JSON.stringify(oldTransformer, null, 2)
      // )
      console.log(
        "new transformer", 
        JSON.stringify(newTransformer, null, 2)
      )

      // console.log(
      //   "comparison",
      //   "equal",
      //   Object.is(oldTransformer, newTransformer),
      //   "deepEqual",
      //   equal(oldTransformer, newTransformer),
      // );
    
    } catch (error) {
      console.error("miroir-core could not generate TS files from Jzod schemas", error);
    }
    console.log("miroir-core generateSchemas took", Date.now() - generateSchemasStartTime, "ms");
}
