import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerForRuntimeInterfaceFromDefinition } from "./Transformer_tools";


import transformer_count_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
export const transformer_count: TransformerDefinition = transformer_count_json as TransformerDefinition;

export const transformerForRuntimeInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "runtime");
export const transformerForBuildInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "build");

import transformer_mapperListToList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json';
export const transformer_mapperListToList: TransformerDefinition = transformer_mapperListToList_json as TransformerDefinition;


export const transformerForRuntimeInterface_mapperListToList: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_mapperListToList, "runtime");
export const transformerForBuildInterface_mapperListToList: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_mapperListToList, "build");

import transformer_unique_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';
export const transformer_unique: TransformerDefinition = transformer_unique_json as TransformerDefinition;

export const transformerForRuntimeInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "runtime");
export const transformerForBuildInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "build");