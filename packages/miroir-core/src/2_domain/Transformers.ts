import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";


import transformer_count_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
import transformer_listPickElement_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/64685ad7-1324-4080-9c41-504fcc1972c9.json';
import transformer_mapperListToList_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/3ec73049-5e54-40aa-bc86-4c4906d00baa.json';
import transformer_unique_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';

export const transformer_count: TransformerDefinition = transformer_count_json as TransformerDefinition;
export const transformer_listPickElement: TransformerDefinition = transformer_listPickElement_json as TransformerDefinition;
export const transformer_mapperListToList: TransformerDefinition = transformer_mapperListToList_json as TransformerDefinition;
export const transformer_unique: TransformerDefinition = transformer_unique_json as TransformerDefinition;

const miroirTransformers: Record<string,TransformerDefinition> = {
  transformer_count,
  transformer_listPickElement,
  transformer_mapperListToList,
  transformer_unique,
};

export const miroirTransformersForRuntime: Record<string,JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(transformer, "runtime"),
  ])
);

export const miroirTransformersForBuild: Record<string,JzodElement> = Object.fromEntries(
  Object.entries(miroirTransformers).map(([key, transformer]) => [
    key,
    transformerInterfaceFromDefinition(transformer, "build"),
  ])
);
