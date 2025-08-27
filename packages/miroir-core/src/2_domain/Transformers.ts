import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";


import transformer_menu_addItem_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json';
import transformer_constant_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json';
import transformer_constantArray_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/97d772e5-b8df-4b1f-99ca-307bcdb4f79b.json';
import transformer_constantBoolean_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8a2a482e-4897-42c1-90d2-3e4fce9355f4.json';
import transformer_constantBigint_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/690251e7-3e9f-4930-b253-822d5187b621.json';
import transformer_constantNumber_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/45d7a6a6-847a-447f-a8dd-9ee2056e70e3.json';
import transformer_constantObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/df3bc349-6a68-4c54-b244-3a30bb61e4ed.json';
import transformer_constantString_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/156aa812-094d-4210-986d-53e3935024fb.json';
import transformer_constantUuid_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/cc56cae6-beff-4692-930c-5b8696d1537c.json';
import transformer_constantAsExtractor_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/6b2426ee-b740-4785-a15d-9c48a385f2c2.json';
import transformer_contextReference_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/dab2932a-8eb3-4620-9f90-0d8d4fcc441a.json';
import transformer_count_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
import transformer_dataflowObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/fc7ce040-1653-4cad-842e-99fb0792e728.json';
import transformer_freeObjectTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e99fec79-162b-49ac-97d6-c058d162d1d8.json';
import transformer_listPickElement_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/64685ad7-1324-4080-9c41-504fcc1972c9.json';
import transformer_listReducerToIndexObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8ddb7e2e-a3d3-4622-81d2-0c3e98bca3ea.json';
import transformer_listReducerToSpreadObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/0894ed4f-ca11-4b04-878d-471d1d780fac.json';
import transformer_mapperListToList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json';
import transformer_mustacheStringTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/b1d69881-c9c4-4eb7-a60b-7af68163d559.json';
import transformer_newUuid_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/9986b805-3580-4974-b849-3d40db4fba51.json';
import transformer_objectFullTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/16d866c4-bc81-4773-89a4-a47ac7f6549d.json';
import transformer_objectAlter_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/774b1087-d4bb-41a0-824c-5ac16571c66a.json';
import transformer_objectDynamicAccess_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d1f9e7ce-4b38-4602-a8cf-9658d63619ed.json';
import transformer_objectEntries_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/b726ac6a-f65e-403a-bba0-e11f0982fc41.json';
import transformer_objectValues_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8b03069a-f812-4334-a530-e7f8fd684744.json';
import transformer_parameterReference_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/af5029f2-b42e-4541-8e50-4e2f2d8fcfab.json';
import transformer_unique_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';
// MLS
import transformer_defaultValueForMLSchema_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3026a4f6-9f4b-4f1a-97bb-ecda4df35309.json';
import transformer_resolveConditionalSchema_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/70f5e617-2aa3-4dc4-b897-4cc3cffa3405.json';
import transformer_resolveSchemaReferenceInContext_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a8f8e3c6-9876-4e2d-8b4f-123456789abc.json';
import transformer_unfoldSchemaOnce_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d5c9f2e3-8741-4b9a-a1d2-4e5f6789abcd.json';
import transformer_jzodTypeCheck_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a3f7b5c2-1e8d-4a9b-9c7e-6f2d3e8a1b5c.json';

// ################################################################################################
export type ActionTemplate = any;
export type Step = "build" | "runtime";
export type ResolveBuildTransformersTo = "value" | "constantTransformer";


export const transformer_menu_addItem: TransformerDefinition = transformer_menu_addItem_json as TransformerDefinition;
// 
export const transformer_constant: TransformerDefinition = transformer_constant_json as TransformerDefinition;
export const transformer_constantArray: TransformerDefinition = transformer_constantArray_json as TransformerDefinition;
export const transformer_constantBoolean: TransformerDefinition = transformer_constantBoolean_json as TransformerDefinition;
export const transformer_constantBigint: TransformerDefinition = transformer_constantBigint_json as TransformerDefinition;
export const transformer_constantNumber: TransformerDefinition = transformer_constantNumber_json as TransformerDefinition;
export const transformer_constantObject: TransformerDefinition = transformer_constantObject_json as TransformerDefinition;
export const transformer_constantString: TransformerDefinition = transformer_constantString_json as TransformerDefinition;
export const transformer_constantUuid: TransformerDefinition = transformer_constantUuid_json as TransformerDefinition;
export const transformer_constantAsExtractor: TransformerDefinition = transformer_constantAsExtractor_json as TransformerDefinition;
export const transformer_contextReference: TransformerDefinition = transformer_contextReference_json as TransformerDefinition;
export const transformer_count: TransformerDefinition = transformer_count_json as TransformerDefinition;
export const transformer_dataflowObject: TransformerDefinition = transformer_dataflowObject_json as TransformerDefinition;
export const transformer_freeObjectTemplate: TransformerDefinition = transformer_freeObjectTemplate_json as TransformerDefinition;
export const transformer_listPickElement: TransformerDefinition = transformer_listPickElement_json as TransformerDefinition;
export const transformer_listReducerToIndexObject: TransformerDefinition = transformer_listReducerToIndexObject_json as TransformerDefinition;
export const transformer_listReducerToSpreadObject: TransformerDefinition = transformer_listReducerToSpreadObject_json as TransformerDefinition;
export const transformer_mapperListToList: TransformerDefinition = transformer_mapperListToList_json as TransformerDefinition;
export const transformer_mustacheStringTemplate: TransformerDefinition = transformer_mustacheStringTemplate_json as TransformerDefinition;
export const transformer_newUuid: TransformerDefinition = transformer_newUuid_json as TransformerDefinition;
export const transformer_objectAlter: TransformerDefinition = transformer_objectAlter_json as TransformerDefinition;
export const transformer_objectDynamicAccess: TransformerDefinition = transformer_objectDynamicAccess_json as TransformerDefinition;
export const transformer_objectEntries: TransformerDefinition = transformer_objectEntries_json as TransformerDefinition;
export const transformer_objectValues: TransformerDefinition = transformer_objectValues_json as TransformerDefinition;
export const transformer_object_fullTemplate: TransformerDefinition = transformer_objectFullTemplate_json as TransformerDefinition;
export const transformer_parameterReference: TransformerDefinition = transformer_parameterReference_json as TransformerDefinition;
export const transformer_unique: TransformerDefinition = transformer_unique_json as TransformerDefinition;
// MLS
export const transformer_defaultValueForMLSchema: TransformerDefinition = transformer_defaultValueForMLSchema_json as TransformerDefinition;
export const transformer_resolveConditionalSchema: TransformerDefinition = transformer_resolveConditionalSchema_json as TransformerDefinition;
export const transformer_resolveSchemaReferenceInContext: TransformerDefinition = transformer_resolveSchemaReferenceInContext_json as TransformerDefinition;
export const transformer_unfoldSchemaOnce: TransformerDefinition = transformer_unfoldSchemaOnce_json as TransformerDefinition;
export const transformer_jzodTypeCheck: TransformerDefinition = transformer_jzodTypeCheck_json as TransformerDefinition;

export const mmlsTransformers: Record<string,TransformerDefinition> = {
  transformer_defaultValueForMLSchema,
  transformer_resolveConditionalSchema,
  transformer_resolveSchemaReferenceInContext,
  transformer_unfoldSchemaOnce,
  transformer_jzodTypeCheck,
};

export const miroirCoreTransformers: Record<string,TransformerDefinition> = {
  transformer_constant,
  transformer_constantArray,
  transformer_constantBoolean,
  transformer_constantNumber,
  transformer_constantObject,
  transformer_constantString,
  transformer_constantUuid,
  transformer_constantAsExtractor,
  transformer_contextReference,
  transformer_count,
  transformer_dataflowObject,
  transformer_freeObjectTemplate,
  transformer_listPickElement,
  transformer_listReducerToIndexObject,
  transformer_listReducerToSpreadObject,
  transformer_mapperListToList,
  transformer_mustacheStringTemplate,
  transformer_newUuid,
  transformer_objectAlter,
  transformer_objectDynamicAccess,
  transformer_objectEntries,
  transformer_objectValues,
  transformer_object_fullTemplate,
  transformer_parameterReference,
  transformer_unique,
  transformer_constantBigint,
  // MLS
  ...mmlsTransformers,
};
export const miroirTransformers: Record<string,TransformerDefinition> = {
  transformer_menu_addItem,
  ...miroirCoreTransformers,
  ...mmlsTransformers,
};
export const transformerForBuildNames = Object.keys(miroirTransformers)
  .filter((e) => e != "transformer_contextReference")
  .map((e) => e.replace("transformer_", "transformerForBuild_"));

export const transformerForRuntimeNames = Object.keys(miroirTransformers)
.filter((e) => e != "transformer_parameterReference")
.map((e) =>
  e.replace("transformer_", "transformerForRuntime_")
);

export const transformerForBuildPlusRuntimeNames = Object.keys(miroirTransformers)
.filter((e) => e != "transformer_parameterReference")
.map((e) =>
  e.replace("transformer_", "transformerForBuildPlusRuntime_")
);


const runtimeReferenceMap: Record<string, string> = {
  transformer: "transformerForRuntime",
  transformer_InnerReference: "transformerForRuntime_InnerReference",
  transformer_freeObjectTemplate: "transformerForRuntime_freeObjectTemplate",
  transformer_contextReference: "transformerForRuntime_contextReference",
  transformer_objectDynamicAccess: "transformerForRuntime_objectDynamicAccess",
  transformer_mustacheStringTemplate: "transformerForRuntime_mustacheStringTemplate",
};

const buildReferenceMap: Record<string, string> = {
  transformer: "transformerForBuild",
  transformer_InnerReference: "transformerForBuild_InnerReference",
  transformer_freeObjectTemplate: "transformerForBuild_freeObjectTemplate",
  transformer_contextReference: "transformerForBuild_parameterReference",
  transformer_objectDynamicAccess: "transformerForBuild_objectDynamicAccess",
  transformer_mustacheStringTemplate: "transformerForBuild_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
  // transformer_freeObjectTemplate: "transformerForBuildPlusRuntime_freeObjectTemplate",
  // transformer_contextReference: "transformerForBuildPlusRuntime_contextReference",
  // transformer_objectDynamicAccess: "transformerForBuildPlusRuntime_objectDynamicAccess",
  // transformer_mustacheStringTemplate: "transformerForBuild_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

const buildPlusRuntimeReferenceMap: Record<string, string> = {
  transformer: "transformerForBuildPlusRuntime",
  transformer_InnerReference: "transformerForBuildPlusRuntime_InnerReference", // TODO: ensure that all transfrormer definitions use a reference for inner references: mapperListToList, transformer_objectAlter
  transformer_freeObjectTemplate: "transformerForBuildPlusRuntime_freeObjectTemplate",
  transformer_contextReference: "transformerForBuildPlusRuntime_contextReference",
  transformer_objectDynamicAccess: "transformerForBuildPlusRuntime_objectDynamicAccess",
  transformer_mustacheStringTemplate: "transformerForBuildPlusRuntime_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

export const miroirTransformersForRuntime: Record<string, JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(
      transformer,
      "runtime",
      runtimeReferenceMap,
      ["transformer_contextReference", "transformer_parameterReference"].includes(key)
    ),
  ])
);

export const miroirTransformersForBuildPlusRuntime: Record<string, JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(
      transformer,
      "buildPlusRuntime",
      buildPlusRuntimeReferenceMap,
      ["transformer_contextReference", "transformer_parameterReference"].includes(key)
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
      key == "transformer_parameterReference"
    ),
  ])
);



