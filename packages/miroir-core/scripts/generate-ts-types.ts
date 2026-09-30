import fs from 'fs/promises';
import path from "path";

import type { MlElement } from "../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  mlToZodTextAndZodSchema,
  type MlZodTextAndZodSchemaRecord,
} from "../src/1_core/mls/mlJzodAdapter";
import { mlToTs, mlToZodTextAndZodSchemaForTsGeneration } from "../src/1_core/mls/mlJzodTsAdapter";

import { entityApplicationForAdmin, entityDeployment } from "miroir-app-admin";

// Leftover Bundle EntityVersion (Entity counterpart not exported from admin package with this UUID).
import entityDefinitionBundleV1 from "../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json";
// import miroirTransformersMlSchemas from "../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json";


import {
  domainEndpointVersionV1,
  entityApplicationEvolutionTrace,
  entityApplicationEvolutionTraceEvent,
  entityCommit,
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityMlSchema,
  entityMenu,
  entityMiroirTest,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityTest,
  entityTransformerDefinition,
  instanceEndpointVersionV1,
  mlSchemaMlMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  modelEndpointVersionV1,
  persistenceEndpointVersionV1,
  queryEndpointVersionV1,
  storeManagementEndpoint,
  transformerMlSchema,
  undoRedoEndpointVersionV1,
} from "miroir-app-miroir";
// import entityDefinitionTransformerTest from "../src/0_interfaces/1_core/bootstrapMlSchemas/fixtures/entityDefinitionTransformerTest.json" assert { type: "json" };
// import entityDefinitionUnitTest from "../src/0_interfaces/1_core/bootstrapMlSchemas/fixtures/entityDefinitionUnitTest.json" assert { type: "json" };
import {
  entityDefinitionRoot,
  getMiroirFundamentalMlSchema,
} from "../src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.js";
import {
  getExtendedSchemas,
  getExtendedSchemasWithCarryOn,
  miroirFundamentalMlSchemaUuid,
} from "../src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchemaHelpers.js";
import { miroirTransformersForBuildPlusRuntime } from '../src/2_domain/Transformers';

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
/** Resolve mlSchema from Entity (preferred) or legacy EntityVersion (#217 Phase 4). */
function presentModelMLSchema(e: any /*Entity | EntityVersion*/): any /*MlObject*/ {
  if (!e?.mlSchema) {
    throw new Error(`Present-model source ${e?.name ?? e?.uuid ?? "<unknown>"} has no mlSchema`);
  }
  if (
    e.mlSchema.extend &&
    (Array.isArray(e.mlSchema.extend) ||
      e.mlSchema.extend.type !== "schemaReference" ||
      e.mlSchema.extend.definition.relativePath !== "entityDefinitionRoot")
  ) {
    throw new Error(
      "Only extension of the entityDefinitionRoot schema is allowed for the mlSchema of an Entity",
    );
  }
  const extendedMLSchema: any /*MlObject*/ | undefined= e.mlSchema.extend ? entityDefinitionRoot as any /*MlObject*/ : undefined;
  return {
    type: "object",
    definition: {
      ...(extendedMLSchema ? extendedMLSchema.definition : {}),
      ...e.mlSchema.definition,
    }
  }
}

/** @deprecated Prefer {@link presentModelMLSchema} with Entity assets. */
function entityDefinitionMLSchema(e:any /*EntityVersion*/): any /*MlObject*/ {
  return presentModelMLSchema(e);
}
// ################################################################################################
async function fileExists(filePath: string): Promise<boolean> {
  try {
      await fs.access(filePath);
      return true;
  } catch {
      return false;
  }
}

async function writeFile(mlElement:any, targetFileName: any, mlSchemaVariableName: any, newFileContents: any) {
  const contents =
    typeof newFileContents === "string"
      ? newFileContents
      : await newFileContents;
  if (targetFileName && await fileExists(targetFileName)) {
    const oldFileContents = await fs.readFile(targetFileName, "utf8");
    if (contents != oldFileContents) {
      await fs.writeFile(targetFileName, contents, "utf8");
      console.log("writeFile", targetFileName, "generated!");
    } else {
      console.log(
        "writeFile entityDefinitionReport old contents equal new contents, no file generation needed."
      );
    }
  } else {
    await fs.writeFile(targetFileName, contents, "utf8");
  }
  
}

// ################################################################################################
async function generateTsTypeFileFromMl(
  mlElement: any,
  targetFileName: any,
  mlSchemaVariableName: any,
  context: any,
  extendedTsTypesText?: string
) {
  // console.log("generateTsTypeFileFromMl called!", JSON.stringify(context, null, 2));
  const generateTypeAnotationsForSchema: string[] =
    mlElement.type == "schemaReference"
      ? Object.keys(mlElement.context).filter(
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
  // console.log("generateTsTypeFileFromMlSchemaInParallel generateTypeAnotationsForSchema:", generateTypeAnotationsForSchema);


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################

const headerForZodImports = `// Auto-generated file, do not edit directly.
// use \`npm run devBuild\` to regenerate.
// generated by packages/miroir-core/scripts/generate-ts-types.ts
// generated on ${new Date().toISOString()}
import { ZodType, ZodTypeAny, z } from "zod";

// ################################################################################################
export type CoreTransformerForBuildPlusRuntime =
    | string
    | number
    | boolean
    | CoreTransformerForBuildPlusRuntime[]
    | (
      {
        [P in string]: CoreTransformerForBuildPlusRuntime;
      }
       & {
        [P in "transformerType" | "interpolation"]?: never;
      }
    )
  | CoreTransformerForBuildPlusRuntime_ifThenElse
  | CoreTransformerForBuildPlusRuntime_boolExpr
  | CoreTransformerForBuildPlusRuntime_case
  | CoreTransformerForBuildPlusRuntime_returnValue
  | CoreTransformerForBuildPlusRuntime_constantAsExtractor
  | CoreTransformerForBuildPlusRuntime_aggregate
  | CoreTransformerForBuildPlusRuntime_dataflowObject
  | CoreTransformerForBuildPlusRuntime_createObject
  | CoreTransformerForBuildPlusRuntime_pickFromList
  | CoreTransformerForBuildPlusRuntime_indexListBy
  | CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject
  | CoreTransformerForBuildPlusRuntime_mapList
  | CoreTransformerForBuildPlusRuntime_mustacheStringTemplate
  | CoreTransformerForBuildPlusRuntime_plus
  | CoreTransformerForBuildPlusRuntime_generateUuid
  | CoreTransformerForBuildPlusRuntime_mergeIntoObject
  | CoreTransformerForBuildPlusRuntime_accessDynamicPath
  | CoreTransformerForBuildPlusRuntime_getObjectEntries
  | CoreTransformerForBuildPlusRuntime_getObjectValues
  | CoreTransformerForBuildPlusRuntime_createObjectFromPairs
  | CoreTransformerForBuildPlusRuntime_getFromParameters
  | CoreTransformerForBuildPlusRuntime_getFromContext
  | CoreTransformerForBuildPlusRuntime_getUniqueValues
  | CoreTransformerForBuildPlusRuntime_concatLists
  | CoreTransformerForBuildPlusRuntime_filterList
  | CoreTransformerForBuildPlusRuntime_find
  | CoreTransformerForBuildPlusRuntime_sortList
  | CoreTransformerForBuildPlusRuntime_pivot
  | CoreTransformerForBuildPlusRuntime_unpivot
  | CoreTransformerForBuildPlusRuntime_listLength
  | CoreTransformerForBuildPlusRuntime_object_fromEntries
  | CoreTransformerForBuildPlusRuntime_stringOp
  | CoreTransformerForBuildPlusRuntime_currentTimestamp
  | CoreTransformerForBuildPlusRuntime_currentDate
  | CoreTransformerForBuildPlusRuntime_numericOp
  | CoreTransformerForBuildPlusRuntime_InnerReference
  | CoreTransformerForBuildPlusRuntime_dataflowSequence
;

export const coreTransformerForBuildPlusRuntime: z.ZodType<CoreTransformerForBuildPlusRuntime> = z.lazy(() => {
  // Define the record schema without transformerType
  const recordWithoutTransformerType = z.record(
    z.string(),
    coreTransformerForBuildPlusRuntime
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
    z.array(coreTransformerForBuildPlusRuntime),
    recordWithoutTransformerType,
    coreTransformerForBuildPlusRuntime_case,
    coreTransformerForBuildPlusRuntime_returnValue,
    coreTransformerForBuildPlusRuntime_constantAsExtractor,
    coreTransformerForBuildPlusRuntime_aggregate,
    coreTransformerForBuildPlusRuntime_dataflowObject,
    coreTransformerForBuildPlusRuntime_createObject,
    coreTransformerForBuildPlusRuntime_pickFromList,
    coreTransformerForBuildPlusRuntime_indexListBy,
    coreTransformerForBuildPlusRuntime_ifThenElse,
    coreTransformerForBuildPlusRuntime_boolExpr,
    coreTransformerForBuildPlusRuntime_listReducerToSpreadObject,
    coreTransformerForBuildPlusRuntime_mapList,
    coreTransformerForBuildPlusRuntime_mustacheStringTemplate,
    coreTransformerForBuildPlusRuntime_plus,
    coreTransformerForBuildPlusRuntime_generateUuid,
    coreTransformerForBuildPlusRuntime_mergeIntoObject,
    coreTransformerForBuildPlusRuntime_accessDynamicPath,
    coreTransformerForBuildPlusRuntime_getObjectEntries,
    coreTransformerForBuildPlusRuntime_getObjectValues,
    coreTransformerForBuildPlusRuntime_createObjectFromPairs,
    coreTransformerForBuildPlusRuntime_getFromParameters,
    coreTransformerForBuildPlusRuntime_getFromContext,
    coreTransformerForBuildPlusRuntime_getUniqueValues,
    coreTransformerForBuildPlusRuntime_concatLists,
    coreTransformerForBuildPlusRuntime_filterList,
    coreTransformerForBuildPlusRuntime_find,
    coreTransformerForBuildPlusRuntime_sortList,
    coreTransformerForBuildPlusRuntime_pivot,
    coreTransformerForBuildPlusRuntime_unpivot,
    coreTransformerForBuildPlusRuntime_listLength,
    coreTransformerForBuildPlusRuntime_object_fromEntries,
    coreTransformerForBuildPlusRuntime_stringOp,
    coreTransformerForBuildPlusRuntime_currentTimestamp,
    coreTransformerForBuildPlusRuntime_currentDate,
    coreTransformerForBuildPlusRuntime_numericOp,
    coreTransformerForBuildPlusRuntime_InnerReference,
    coreTransformerForBuildPlusRuntime_dataflowSequence,
  ]);
});

`;
  const generateTypesStart = Date.now();
  const newFileContentsNotFormated = mlToTs(
    mlSchemaVariableName,
    mlElement,
    context,
    true, // exportPrefix
    headerForZodImports,// true, // headerForZodImports
    generateTypeAnotationsForSchema,
    extendedTsTypesText,
  );
  let newFileContents =
    typeof newFileContentsNotFormated === "string"
      ? newFileContentsNotFormated
      : await newFileContentsNotFormated;
  // #217 Phase 12: fold deprecated aliases into the same write to avoid a read/write race
  // that can truncate miroirFundamentalType.ts down to only the alias block.
  const phase12AliasBlock = `

// ################################################################################################
// #217 Phase 12 — deprecated vocabulary aliases (EntityVersion → EntityVersion)
/** @deprecated Use EntityVersion */
// export type EntityVersion = EntityVersion;
/** @deprecated Use entityVersion */
// export const entityVersion = entityVersion;
`;
  if (
    targetFileName.includes("miroirFundamentalType") &&
    !newFileContents.includes("export type EntityVersion = EntityVersion")
  ) {
    newFileContents = newFileContents + phase12AliasBlock;
  }
  // #232 — jzod-ts emits unquoted hyphenated object keys; quote them for valid TS/Zod.
  newFileContents = newFileContents.replace(/modelVersion:/g, '"modelVersion":');
  console.log(
    "generateTsTypeFileFromMlSchemaInParallel generateTypes took",
    Date.now() - generateTypesStart,
    "ms"
  );
  console.log("generateTsTypeFileFromMlSchemaInParallel writing file:", targetFileName, newFileContents.length);
  await writeFile(mlElement, targetFileName, mlSchemaVariableName, newFileContents);
  console.log("generateTsTypeFileFromMlSchemaInParallel file written OK:", targetFileName);
}

// ################################################################################################
async function generateSchemas(generateFundamentalMlSchema = true) {
    const generateSchemasStartTime = Date.now();
    let _t_getMiroirFundamental = 0;
    let _t_writeMlSchema = 0;
    let _t_generateTsFile = 0;
    console.log("miroir-core generateSchemas start!");
    const targetDirectory = "./src/0_interfaces/1_core/preprocessor-generated";
    // const targetFileName = "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType2.ts";
    // const miroirFundamentalMlSchemaFilePath = path.join(targetDirectory, "miroirFundamentalMlSchema2.ts");
    const targetFileName = "./src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts";
    const miroirFundamentalMlSchemaFilePath = path.join(targetDirectory, "miroirFundamentalMlSchema.ts");
    const extendedSchemaVariableName = "extendedSchemasType";
    const mlSchemaVariableName = "miroirFundamentalType";
    // const start = Date.now();
    let miroirFundamentalMlSchema: any; // TODO: not really a MlElement!!
    try {
      miroirFundamentalMlSchema = getMiroirFundamentalMlSchema(
        entityDefinitionBundleV1,
        entityCommit,
        modelEndpointVersionV1,
        storeManagementEndpoint,
        instanceEndpointVersionV1,
        undoRedoEndpointVersionV1,
        localCacheEndpointVersionV1,
        domainEndpointVersionV1,
        queryEndpointVersionV1,
        persistenceEndpointVersionV1,
        mlSchemaMlMiroirBootstrapSchema,
        transformerMlSchema,
        [],//[transformerMenuV1],
        entityApplicationForAdmin,
        entitySelfApplication,
        entitySelfApplicationVersion,
        entitySelfApplicationModelBranch,
        entityDeployment,
        entityEntity,
        entityEntityVersion,
        entityMlSchema,
        entityMenu,
        entityQueryVersion,
        entityReport,
        entityRunner,
        entityTest,
        // entityDefinitionTransformerTest,
        // entityDefinitionUnitTest,
        entityMiroirTest,
        entityTransformerDefinition,
        entityEndpointVersion,
        entityApplicationEvolutionTrace,
        entityApplicationEvolutionTraceEvent,
      );
      // console.log("miroir-core generateSchemas miroirFundamentalMlSchema:", miroirFundamentalMlSchema);
      _t_getMiroirFundamental = Date.now() - generateSchemasStartTime;
      console.log(
        "miroir-core generateSchemas getMiroirFundamentalMlSchema took",
        _t_getMiroirFundamental,
        "ms"
      );
      const filteredMiroirFundamentalMlSchemaContext = Object.fromEntries(
        Object.entries(miroirFundamentalMlSchema.definition.context).filter(
          ([key, value]) =>
            ![
              "transformerForBuild",
              // "transformerForRuntime",
              "coreTransformerForBuildPlusRuntime",
              "transformerForBuildPlusRuntime",
            ].includes(key)
        )
      ) as MlElement;
      // console.log(
      //   "miroir-core generateSchemas filteredMiroirFundamentalMlSchemaContext:",
      //   JSON.stringify(Object.keys(filteredMiroirFundamentalMlSchemaContext), null, 2)
      // );
      const writeFundamentalMlSchemaStartTime = Date.now();
      const miroirFundamentalMlSchemaJson =
        "export const miroirFundamentalMlSchema = " +
        JSON.stringify(miroirFundamentalMlSchema, undefined, 2);
      console.log(
        "generateSchemas miroirFundamentalMlSchemaFilePath",
        miroirFundamentalMlSchemaFilePath
      );
      if (
        miroirFundamentalMlSchemaFilePath &&
        (await fileExists(miroirFundamentalMlSchemaFilePath))
      ) {
        const oldFileContents = fs.readFile(miroirFundamentalMlSchemaFilePath).toString();
        if (miroirFundamentalMlSchemaJson != oldFileContents) {
          // TODO: do deep equal
          // console.log(
          //   "generateSchemas miroirFundamentalMlSchemaFileName miroirFundamentalMlSchemaJson",
          //   miroirFundamentalMlSchemaJson
          // );
          fs.writeFile(miroirFundamentalMlSchemaFilePath, miroirFundamentalMlSchemaJson);
        } else {
          console.log(
            "generateSchemas miroirFundamentalMlSchemaFileName old contents equal new contents, no file generation needed."
          );
        }
      } else {
        fs.writeFile(miroirFundamentalMlSchemaFilePath, miroirFundamentalMlSchemaJson);
      }
      // }
      _t_writeMlSchema = Date.now() - writeFundamentalMlSchemaStartTime;
      console.log(
        "miroir-core generateSchemas writeFundamentalMlSchema took",
        _t_writeMlSchema,
        "ms"
      );

      if (miroirFundamentalMlSchema.definition?.type !== "schemaReference") {
        throw new Error("miroir-core miroirFundamentalMlSchema is not a schemaReference");
      }
      if (!miroirFundamentalMlSchema.definition.context) {
        throw new Error("miroir-core miroirFundamentalMlSchema.context is undefined");
      }
      const preExtendedSchemas: string[] = getExtendedSchemas(mlSchemaMlMiroirBootstrapSchema.definition.context);
      const mlElementTemplateExtendedSchemas: string[] = getExtendedSchemasWithCarryOn(
        mlSchemaMlMiroirBootstrapSchema,
        miroirFundamentalMlSchemaUuid
      );

      const extendedSchemas = preExtendedSchemas.concat(mlElementTemplateExtendedSchemas);

      const extendedMlSchemaContext: [string, MlElement][] = Object.entries(
        // miroirFundamentalMlSchema.definition.context
        filteredMiroirFundamentalMlSchemaContext
      ).filter((e) => extendedSchemas.includes(e[0])) as any;
      // const exendedMlSchemaContext = Object.fromEntries(Object.entries(miroirFundamentalMlSchema.definition.context));
      // console.log("miroir-core generateSchemas exendedMlSchemaContext:", exendedMlSchemaContext);
      const extendedZodSchema = {
        type: "schemaReference" as const,
        context: Object.fromEntries(extendedMlSchemaContext),
        definition: {
          relativePath: "transformerForBuildPlusRuntime_Abstract",
        },
      };
      console.log(
        "miroir-core generateSchemas filteredMiroirFundamentalMlSchema:",
        JSON.stringify(Object.keys(filteredMiroirFundamentalMlSchemaContext), null, 2)
      );
      console.log(
        "miroir-core generateSchemas extendedZodSchema 1:",
        JSON.stringify(Object.keys(extendedZodSchema.context), null, 2)
      );
      // console.log("miroir-core generateSchemas extendedZodSchema:", JSON.stringify(extendedZodSchema, null, 2));

      const extendedZodTextAndZodSchemaRecord: MlZodTextAndZodSchemaRecord = {};
      extendedMlSchemaContext.forEach((e) => {
        if (!e[1]) {
          throw new Error(`miroir-core generateSchemas e[1] is undefined for ${e[0]}`);
        }
        extendedZodTextAndZodSchemaRecord[e[0]] = mlToZodTextAndZodSchema(
          e[1],
          () => extendedZodTextAndZodSchemaRecord,
          () => extendedZodTextAndZodSchemaRecord
        );
      });

      console.log(
        "miroir-core generateSchemas extendedZodTextAndZodSchemaRecord:",
        JSON.stringify(Object.keys(extendedZodTextAndZodSchemaRecord), null, 2)
      );

      const extendedZodTextAndZodSchemaRecordForTsGenerationContext: MlZodTextAndZodSchemaRecord = {};
      extendedMlSchemaContext.forEach((e) => {
        extendedZodTextAndZodSchemaRecordForTsGenerationContext[e[0]] =
          mlToZodTextAndZodSchemaForTsGeneration(
            e[1],
            extendedZodTextAndZodSchemaRecordForTsGenerationContext
          );
      });

      // console.log("miroir-core generateSchemas extendedZodSchemaAndDescriptionForTsGenerationContext:", JSON.stringify(extendedZodSchemaAndDescriptionForTsGenerationContext, null, 2));
      const generateTypeAnotationsForSchema = Object.keys(extendedZodSchema.context).filter(
        (e) =>
          ![
            // "mlObject",
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

      console.log("miroir-core calling mlToTs.");
      const extendedMlSchemasTsTypes = mlToTs(
        extendedSchemaVariableName,
        extendedZodSchema,
        extendedZodTextAndZodSchemaRecord,
        true, // exportPrefix
        false, // headerForZodImports
        generateTypeAnotationsForSchema,
      );

      console.log("miroir-core generateSchemas extendedTypes generated.");
      const nonExtendedMlSchemaContext: MlZodTextAndZodSchemaRecord = Object.fromEntries(
        // Object.entries(miroirFundamentalMlSchema.definition.context).filter(
        Object.entries(filteredMiroirFundamentalMlSchemaContext).filter(
          (e) => !extendedSchemas.includes(e[0])
        )
      ) as any;
      const nonExtendedZodSchema = {
        type: "schemaReference" as const,
        context: nonExtendedMlSchemaContext,
        definition: {
          relativePath: "mlElement",
        },
      };

      const startGenerateZodSchemaFileFromZodSchema = Date.now();
      // console.log("miroir-core generateSchemas main miroirFundamentalMlSchema started");
      await generateTsTypeFileFromMl(
        nonExtendedZodSchema,
        targetFileName,
        mlSchemaVariableName,
        extendedZodTextAndZodSchemaRecordForTsGenerationContext,
        // Object.fromEntries(extendedMlSchemaContext),
        extendedMlSchemasTsTypes
      );
      _t_generateTsFile = Date.now() - startGenerateZodSchemaFileFromZodSchema;
      console.log(
        "miroir-core GENERATED Zod schema file: ",
        targetFileName,
        "took",
        _t_generateTsFile,
        "ms"
      );
      // const oldTransformer = (miroirFundamentalMlSchema as any).definition.context.transformerForBuild_getUniqueValues;
      const newTransformer = miroirTransformersForBuildPlusRuntime.transformer_menu_addItem;
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
      console.error("miroir-core could not generate TS files from ML schemas", error);
    }
    const _t_total = Date.now() - generateSchemasStartTime;
    const _t_other = _t_total - _t_getMiroirFundamental - _t_writeMlSchema - _t_generateTsFile;
    const pct = (ms: number) => _t_total > 0 ? `${Math.round(ms * 100 / _t_total)}%` : '-%';
    console.log(
      `miroir-core generateSchemas SUMMARY (total ${_t_total}ms):\n` +
      `  getMiroirFundamentalMlSchema: ${_t_getMiroirFundamental}ms (${pct(_t_getMiroirFundamental)})\n` +
      `  writeFundamentalMlSchema:     ${_t_writeMlSchema}ms (${pct(_t_writeMlSchema)})\n` +
      `  generateTsTypeFile:             ${_t_generateTsFile}ms (${pct(_t_generateTsFile)})\n` +
      `  other:                          ${_t_other}ms (${pct(_t_other)})`
    );
}
