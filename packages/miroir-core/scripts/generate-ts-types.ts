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
import entityDefinitionAdminApplication from "../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json";
import entityDefinitionSelfApplicationV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json";
import entityDefinitionSelfApplicationVersionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json";
import entityDefinitionDeployment from "../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json";
import entityDefinitionEntity from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json";
import entityDefinitionEntityDefinitionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import entityDefinitionJzodSchemaV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json";
import entityDefinitionMenu from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json";
import entityDefinitionQueryVersionV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json";
import entityDefinitionReportV1 from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json";
import entityDefinitionTest from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json";
import entityDefinitionTransformerDefinition from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json";
import entityDefinitionEndpointDefinition from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json";
import transformerMenuV1 from "../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json";
import entityDefinitionSelfApplicationDeploymentConfiguration from "../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json";


import {
  getExtendedSchemas,
  getExtendedSchemasWithCarryOn,
  getMiroirFundamentalJzodSchema,
  miroirFundamentalJzodSchemaUuid,
} from "../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.js";
import { miroirTransformersForBuild } from "../src/2_domain/Transformers";

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
  const generateTypesStart = Date.now();
  const newFileContentsNotFormated = jzodToTsCode(
    jzodSchemaVariableName,
    jzodElement,
    context,
    true, // exportPrefix
    true, // headerForZodImports
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
    const targetFileName = "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts";
    const extendedSchemaVariableName = "extendedSchemasType";
    const jzodSchemaVariableName = "miroirFundamentalType";
    // const start = Date.now();
    const miroirFundamentalJzodSchemaFilePath = path.join(targetDirectory, "miroirFundamentalJzodSchema.ts");
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
        entityDefinitionSelfApplicationDeploymentConfiguration,
        entityDefinitionTest,
        entityDefinitionTransformerDefinition,
        entityDefinitionEndpointDefinition,
      );
      // console.log("miroir-core generateSchemas miroirFundamentalJzodSchema:", miroirFundamentalJzodSchema);
      console.log(
        "miroir-core generateSchemas getMiroirFundamentalJzodSchema took",
        Date.now() - generateSchemasStartTime,
        "ms"
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
      const preExtendedSchemas: string[] = getExtendedSchemas(jzodSchemajzodMiroirBootstrapSchema);
      const carryOnExtendedSchemas: string[] = getExtendedSchemasWithCarryOn(
        jzodSchemajzodMiroirBootstrapSchema,
        miroirFundamentalJzodSchemaUuid
      );

      const extendedSchemas = preExtendedSchemas.concat(carryOnExtendedSchemas);

      const extendedJzodSchemaContext: [string, JzodElement][] = Object.entries(
        miroirFundamentalJzodSchema.definition.context
      ).filter((e) => extendedSchemas.includes(e[0])) as any;
      // const exendedJzodSchemaContext = Object.fromEntries(Object.entries(miroirFundamentalJzodSchema.definition.context));
      // console.log("miroir-core generateSchemas exendedJzodSchemaContext:", exendedJzodSchemaContext);
      const extendedZodSchema = {
        type: "schemaReference",
        context: Object.fromEntries(extendedJzodSchemaContext),
        definition: {
          relativePath: "transformerForRuntime_Abstract",
        },
      };
      console.log(
        "miroir-core generateSchemas extendedZodSchema:",
        Object.keys(extendedZodSchema)
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
        Object.entries(miroirFundamentalJzodSchema.definition.context).filter(
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
      console.info(
        "miroir-core GENERATED Zod schema file: ",
        targetFileName,
        "took",
        Date.now() - startGenerateZodSchemaFileFromZodSchema,
        "ms"
      );
      // const oldTransformer = (miroirFundamentalJzodSchema as any).definition.context.transformerForBuild_unique;
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
