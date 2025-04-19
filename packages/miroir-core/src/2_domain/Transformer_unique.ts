import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerForRuntimeInterfaceFromDefinition } from "./Transformer_tools";

import transformer_unique_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/a93aec8f-3f8b-4129-a907-e7321c1e7171.json';
export const transformer_unique: TransformerDefinition = transformer_unique_json as TransformerDefinition;

export const transformerForRuntimeInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "runtime");
export const transformerForBuildInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "build");