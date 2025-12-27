import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";


import transformer_spreadSheetToJzodSchema_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e44300e8-ed02-40fb-a9ee-d83d08cb1f25.json';
import transformer_menu_addItem_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json';
// 
import transformer_ifThenElse_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ded1479-1331-4f96-8723-9a797ba3924b.json';
import transformer_returnValue_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json';
import transformer_constantAsExtractor_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/6b2426ee-b740-4785-a15d-9c48a385f2c2.json';
import transformer_getFromContext_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/dab2932a-8eb3-4620-9f90-0d8d4fcc441a.json';
import transformer_aggregate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
import transformer_dataflowObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/fc7ce040-1653-4cad-842e-99fb0792e728.json';
import transformer_createObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e99fec79-162b-49ac-97d6-c058d162d1d8.json';
import transformer_pickFromList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/64685ad7-1324-4080-9c41-504fcc1972c9.json';
import transformer_indexListBy_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8ddb7e2e-a3d3-4622-81d2-0c3e98bca3ea.json';
import transformer_listReducerToSpreadObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/0894ed4f-ca11-4b04-878d-471d1d780fac.json';
import transformer_mapList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json';
import transformer_mustacheStringTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/b1d69881-c9c4-4eb7-a60b-7af68163d559.json';
import transformer_generateUuid_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/9986b805-3580-4974-b849-3d40db4fba51.json';
import transformer_objectFullTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/16d866c4-bc81-4773-89a4-a47ac7f6549d.json';
import transformer_mergeIntoObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/774b1087-d4bb-41a0-824c-5ac16571c66a.json';
import transformer_accessDynamicPath_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d1f9e7ce-4b38-4602-a8cf-9658d63619ed.json';
import transformer_getObjectEntries_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/b726ac6a-f65e-403a-bba0-e11f0982fc41.json';
import transformer_getObjectValues_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8b03069a-f812-4334-a530-e7f8fd684744.json';
import transformer_getFromParameters_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/af5029f2-b42e-4541-8e50-4e2f2d8fcfab.json';
import transformer_getUniqueValues_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';
// MLS
import transformer_defaultValueForMLSchema_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3026a4f6-9f4b-4f1a-97bb-ecda4df35309.json';
import transformer_resolveConditionalSchema_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/70f5e617-2aa3-4dc4-b897-4cc3cffa3405.json';
import transformer_resolveSchemaReferenceInContext_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a8f8e3c6-9876-4e2d-8b4f-123456789abc.json';
import transformer_unfoldSchemaOnce_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d5c9f2e3-8741-4b9a-a1d2-4e5f6789abcd.json';
import transformer_jzodTypeCheck_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a3f7b5c2-1e8d-4a9b-9c7e-6f2d3e8a1b5c.json';
import transformer_getActiveDeployment_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d554c31b-638b-4774-95e3-b2e307035a82.json';

// ################################################################################################
export type ActionTemplate = any;
export type Step = "build" | "runtime";
export type ResolveBuildTransformersTo = "value" | "constantTransformer";


export const transformer_spreadSheetToJzodSchema: TransformerDefinition = transformer_spreadSheetToJzodSchema_json as TransformerDefinition;
export const transformer_menu_addItem: TransformerDefinition = transformer_menu_addItem_json as TransformerDefinition;
// 
export const transformer_ifThenElse: TransformerDefinition = transformer_ifThenElse_json as TransformerDefinition;
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



