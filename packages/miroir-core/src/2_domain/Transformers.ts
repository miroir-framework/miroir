import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";


import {
  transformer_spreadSheetToJzodSchema_json,
  transformer_menu_addItem_json,
  transformer_ifThenElse_json,
  transformer_boolExpr_json,
  transformer_plus_json,
  transformer_case_json,
  transformer_returnValue_json,
  transformer_constantAsExtractor_json,
  transformer_getFromContext_json,
  transformer_aggregate_json,
  transformer_dataflowObject_json,
  transformer_createObject_json,
  transformer_pickFromList_json,
  transformer_indexListBy_json,
  transformer_listReducerToSpreadObject_json,
  transformer_mapList_json,
  transformer_mustacheStringTemplate_json,
  transformer_generateUuid_json,
  transformer_objectFullTemplate_json,
  transformer_mergeIntoObject_json,
  transformer_accessDynamicPath_json,
  transformer_getObjectEntries_json,
  transformer_getObjectValues_json,
  transformer_getFromParameters_json,
  transformer_getUniqueValues_json,
  transformer_defaultValueForMLSchema_json,
  transformer_resolveConditionalSchema_json,
  transformer_resolveSchemaReferenceInContext_json,
  transformer_unfoldSchemaOnce_json,
  transformer_jzodTypeCheck_json,
  transformer_getActiveDeployment_json,
} from "miroir-test-app_deployment-miroir";

// ################################################################################################
export type ActionTemplate = any;
export type Step = "build" | "runtime";
export type ResolveBuildTransformersTo = "value" | "constantTransformer";


export const transformer_spreadSheetToJzodSchema: TransformerDefinition = transformer_spreadSheetToJzodSchema_json as TransformerDefinition;
export const transformer_menu_addItem: TransformerDefinition = transformer_menu_addItem_json as TransformerDefinition;
// 
export const transformer_ifThenElse: TransformerDefinition = transformer_ifThenElse_json as TransformerDefinition;
export const transformer_boolExpr: TransformerDefinition = transformer_boolExpr_json as TransformerDefinition;
export const transformer_plus: TransformerDefinition = transformer_plus_json as TransformerDefinition;
export const transformer_case: TransformerDefinition = transformer_case_json as TransformerDefinition;
export const transformer_returnValue: TransformerDefinition = transformer_returnValue_json as TransformerDefinition;
export const transformer_constantAsExtractor: TransformerDefinition = transformer_constantAsExtractor_json as TransformerDefinition;
export const transformer_getFromContext: TransformerDefinition = transformer_getFromContext_json as TransformerDefinition;
export const transformer_aggregate: TransformerDefinition = transformer_aggregate_json as TransformerDefinition;
export const transformer_dataflowObject: TransformerDefinition = transformer_dataflowObject_json as TransformerDefinition;
export const transformer_createObject: TransformerDefinition = transformer_createObject_json as TransformerDefinition;
export const transformer_pickFromList: TransformerDefinition = transformer_pickFromList_json as TransformerDefinition;
export const transformer_indexListBy: TransformerDefinition = transformer_indexListBy_json as TransformerDefinition;
export const transformer_listReducerToSpreadObject: TransformerDefinition = transformer_listReducerToSpreadObject_json as TransformerDefinition;
export const transformer_mapList: TransformerDefinition = transformer_mapList_json as TransformerDefinition;
export const transformer_mustacheStringTemplate: TransformerDefinition = transformer_mustacheStringTemplate_json as TransformerDefinition;
export const transformer_generateUuid: TransformerDefinition = transformer_generateUuid_json as TransformerDefinition;
export const transformer_mergeIntoObject: TransformerDefinition = transformer_mergeIntoObject_json as TransformerDefinition;
export const transformer_accessDynamicPath: TransformerDefinition = transformer_accessDynamicPath_json as TransformerDefinition;
export const transformer_getObjectEntries: TransformerDefinition = transformer_getObjectEntries_json as TransformerDefinition;
export const transformer_getObjectValues: TransformerDefinition = transformer_getObjectValues_json as TransformerDefinition;
export const transformer_createObjectFromPairs: TransformerDefinition = transformer_objectFullTemplate_json as TransformerDefinition;
export const transformer_getFromParameters: TransformerDefinition = transformer_getFromParameters_json as TransformerDefinition;
export const transformer_getUniqueValues: TransformerDefinition = transformer_getUniqueValues_json as TransformerDefinition;
// MLS
export const transformer_defaultValueForMLSchema: TransformerDefinition = transformer_defaultValueForMLSchema_json as TransformerDefinition;
export const transformer_resolveConditionalSchema: TransformerDefinition = transformer_resolveConditionalSchema_json as TransformerDefinition;
export const transformer_resolveSchemaReferenceInContext: TransformerDefinition = transformer_resolveSchemaReferenceInContext_json as TransformerDefinition;
export const transformer_unfoldSchemaOnce: TransformerDefinition = transformer_unfoldSchemaOnce_json as TransformerDefinition;
export const transformer_jzodTypeCheck: TransformerDefinition = transformer_jzodTypeCheck_json as TransformerDefinition;
// admin
export const transformer_getActiveDeployment: TransformerDefinition = transformer_getActiveDeployment_json as TransformerDefinition;

export const adminTransformers: Record<string,TransformerDefinition> = {
  transformer_getActiveDeployment,
};

export const spreadsheetTransformers: Record<string,TransformerDefinition> = {
  transformer_spreadSheetToJzodSchema,
};

export const mlsTransformers: Record<string,TransformerDefinition> = {
  transformer_defaultValueForMLSchema,
  transformer_resolveConditionalSchema,
  transformer_resolveSchemaReferenceInContext,
  transformer_unfoldSchemaOnce,
  transformer_jzodTypeCheck,
};

export const miroirCoreTransformers: Record<string,TransformerDefinition> = {
  transformer_accessDynamicPath,
  transformer_aggregate,
  transformer_constantAsExtractor,
  transformer_createObject,
  transformer_createObjectFromPairs,
  transformer_dataflowObject,
  transformer_getFromContext,
  transformer_getFromParameters,
  transformer_getObjectEntries,
  transformer_getObjectValues,
  transformer_getUniqueValues,
  transformer_indexListBy,
  transformer_listReducerToSpreadObject,
  transformer_ifThenElse,
  transformer_boolExpr,
  transformer_plus,
  transformer_case,
  transformer_pickFromList,
  transformer_returnValue,
  transformer_mapList,
  transformer_mustacheStringTemplate,
  transformer_generateUuid,
  transformer_mergeIntoObject,
  // transformer_constantBigint,
  // MLS
  ...mlsTransformers,
};
export const miroirTransformers: Record<string,TransformerDefinition> = {
  transformer_menu_addItem,
  ...adminTransformers,
  ...spreadsheetTransformers,
  ...miroirCoreTransformers,
  ...mlsTransformers,
};
export const transformerForBuildNames = Object.keys(miroirTransformers)
  .filter((e) => e != "transformer_getFromContext")
  .map((e) => e.replace("transformer_", "transformerForBuild_"));

// export const transformerForRuntimeNames = Object.keys(miroirTransformers)
// .filter((e) => e != "transformer_getFromParameters")
// .map((e) =>
//   e.replace("transformer_", "transformerForRuntime_")
// );

export const transformerForBuildPlusRuntimeNames = Object.keys(miroirTransformers)
.map((e) =>
  e.replace("transformer_", "transformerForBuildPlusRuntime_")
);


// const runtimeReferenceMap: Record<string, string> = {
//   // transformer: "transformerForRuntime",
//   // transformer_InnerReference: "transformerForRuntime_InnerReference",
//   transformer_returnValue: "transformerForRuntime_returnValue",
//   transformer_createObject: "transformerForRuntime_createObject",
//   transformer_getFromContext: "transformerForRuntime_getFromContext",
//   transformer_accessDynamicPath: "transformerForRuntime_accessDynamicPath",
//   transformer_mustacheStringTemplate: "transformerForRuntime_mustacheStringTemplate",
// };

const buildReferenceMap: Record<string, string> = {
  transformer: "transformerForBuild",
  // transformer_InnerReference: "transformerForBuild_InnerReference",
  transformer_returnValue: "transformerForBuild_returnValue",
  transformer_createObject: "transformerForBuild_createObject",
  transformer_getFromContext: "transformerForBuild_getFromParameters",
  transformer_accessDynamicPath: "transformerForBuild_accessDynamicPath",
  transformer_mustacheStringTemplate: "transformerForBuild_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
  // transformer_createObject: "transformerForBuildPlusRuntime_createObject",
  // transformer_getFromContext: "transformerForBuildPlusRuntime_getFromContext",
  // transformer_accessDynamicPath: "transformerForBuildPlusRuntime_accessDynamicPath",
  // transformer_mustacheStringTemplate: "transformerForBuild_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

const buildPlusRuntimeReferenceMap: Record<string, string> = {
  transformer: "transformerForBuildPlusRuntime",
  // transformer_InnerReference: "transformerForBuildPlusRuntime_InnerReference", // TODO: ensure that all transfrormer definitions use a reference for inner references: mapList, transformer_mergeIntoObject
  transformer_returnValue: "transformerForBuildPlusRuntime_returnValue",
  transformer_createObject: "transformerForBuildPlusRuntime_createObject",
  transformer_getFromContext: "transformerForBuildPlusRuntime_getFromContext",
  transformer_accessDynamicPath: "transformerForBuildPlusRuntime_accessDynamicPath",
  transformer_mustacheStringTemplate: "transformerForBuildPlusRuntime_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

// export const miroirTransformersForRuntime: Record<string, JzodElement> = Object.fromEntries(
//   Object.entries(miroirTransformers).map(([key, transformer]) => [
//     key,
//     transformerInterfaceFromDefinition(
//       transformer,
//       "runtime",
//       runtimeReferenceMap,
//       ["transformer_getFromContext", "transformer_getFromParameters"].includes(key)
//     ),
//   ])
// );

export const miroirTransformersForBuildPlusRuntime: Record<string, JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(
      transformer,
      "buildPlusRuntime",
      buildPlusRuntimeReferenceMap,
      true, // ["transformer_getFromContext", "transformer_getFromParameters"].includes(key)
    ),
  ])
);

export const miroirTransformersForBuild: Record<string, JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(
      transformer,
      "build",
      buildReferenceMap,
      key == "transformer_getFromParameters"
    ),
  ])
);



