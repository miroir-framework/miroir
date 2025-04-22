import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";


import transformer_constant_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/2b4c25e0-6b0f-4f7d-aa68-1fdc079aead3.json';
import transformer_constantArray_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/97d772e5-b8df-4b1f-99ca-307bcdb4f79b.json';
import transformer_contextReference_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/dab2932a-8eb3-4620-9f90-0d8d4fcc441a.json';
import transformer_count_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
import transformer_dataflowObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/fc7ce040-1653-4cad-842e-99fb0792e728.json';
import transformer_freeObjectTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e99fec79-162b-49ac-97d6-c058d162d1d8.json';
import transformer_listPickElement_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/64685ad7-1324-4080-9c41-504fcc1972c9.json';
import transformer_listReducerToIndexObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8ddb7e2e-a3d3-4622-81d2-0c3e98bca3ea.json';
import transformer_listReducerToSpreadObject_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/0894ed4f-ca11-4b04-878d-471d1d780fac.json';
import transformer_mapperListToList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json';
import transformer_objectFullTemplate_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/16d866c4-bc81-4773-89a4-a47ac7f6549d.json';
import transformer_objectAlter_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/774b1087-d4bb-41a0-824c-5ac16571c66a.json';
import transformer_objectDynamicAccess_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/d1f9e7ce-4b38-4602-a8cf-9658d63619ed.json';
import transformer_objectEntries_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/b726ac6a-f65e-403a-bba0-e11f0982fc41.json';
import transformer_objectValues_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/8b03069a-f812-4334-a530-e7f8fd684744.json';
import transformer_parameterReference_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/af5029f2-b42e-4541-8e50-4e2f2d8fcfab.json';
import transformer_unique_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';

export const transformer_constant: TransformerDefinition = transformer_constant_json as TransformerDefinition;
export const transformer_constantArray: TransformerDefinition = transformer_constantArray_json as TransformerDefinition;
export const transformer_contextReference: TransformerDefinition = transformer_contextReference_json as TransformerDefinition;
export const transformer_count: TransformerDefinition = transformer_count_json as TransformerDefinition;
export const transformer_dataflowObject: TransformerDefinition = transformer_dataflowObject_json as TransformerDefinition;
export const transformer_freeObjectTemplate: TransformerDefinition = transformer_freeObjectTemplate_json as TransformerDefinition;
export const transformer_listPickElement: TransformerDefinition = transformer_listPickElement_json as TransformerDefinition;
export const transformer_listReducerToIndexObject: TransformerDefinition = transformer_listReducerToIndexObject_json as TransformerDefinition;
export const transformer_listReducerToSpreadObject: TransformerDefinition = transformer_listReducerToSpreadObject_json as TransformerDefinition;
export const transformer_mapperListToList: TransformerDefinition = transformer_mapperListToList_json as TransformerDefinition;
export const transformer_objectAlter: TransformerDefinition = transformer_objectAlter_json as TransformerDefinition;
export const transformer_objectDynamicAccess: TransformerDefinition = transformer_objectDynamicAccess_json as TransformerDefinition;
export const transformer_objectEntries: TransformerDefinition = transformer_objectEntries_json as TransformerDefinition;
export const transformer_objectValues: TransformerDefinition = transformer_objectValues_json as TransformerDefinition;
export const transformer_object_fullTemplate: TransformerDefinition = transformer_objectFullTemplate_json as TransformerDefinition;
export const transformer_parameterReference: TransformerDefinition = transformer_parameterReference_json as TransformerDefinition;
export const transformer_unique: TransformerDefinition = transformer_unique_json as TransformerDefinition;

const miroirTransformers: Record<string,TransformerDefinition> = {
  transformer_constant,
  transformer_constantArray,
  transformer_contextReference,
  transformer_count,
  transformer_dataflowObject,
  transformer_freeObjectTemplate,
  transformer_listPickElement,
  transformer_listReducerToIndexObject,
  transformer_listReducerToSpreadObject,
  transformer_mapperListToList,
  transformer_objectAlter,
  transformer_objectDynamicAccess,
  transformer_objectEntries,
  transformer_objectValues,
  transformer_object_fullTemplate,
  transformer_parameterReference,
  transformer_unique,
};

const runtimeReferenceMap: Record<string, string> = {
  transformer: "transformerForRuntime",
  transformer_InnerReference: "transformerForRuntime_InnerReference",
  transformer_freeObjectTemplate: "transformerForRuntime_freeObjectTemplate",
  transformer_contextReference: "transformerForRuntime_contextReference",
  transformer_objectDynamicAccess: "transformerForRuntime_objectDynamicAccess",
  transformer_mustacheStringTemplate: "transformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED",
};

const buildReferenceMap: Record<string, string> = {
  transformer: "transformerForBuild",
  transformer_InnerReference: "transformerForBuild_InnerReference",
  transformer_freeObjectTemplate: "transformerForBuild_freeObjectTemplate",
  transformer_contextReference: "transformerForRuntime_contextReference",
  transformer_objectDynamicAccess: "transformerForBuild_objectDynamicAccess",
  transformer_mustacheStringTemplate: "transformer_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

export const miroirTransformersForRuntime: Record<string,JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(transformer, "runtime", runtimeReferenceMap),
  ])
);

export const miroirTransformersForBuild: Record<string,JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(transformer, "build", buildReferenceMap),
  ])
);
