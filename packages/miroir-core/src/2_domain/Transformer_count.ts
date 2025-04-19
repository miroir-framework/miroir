import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerForRuntimeInterfaceFromDefinition } from "./Transformer_tools";


/**
 * TODO:
 * there are two operations to get the proper type:
 * 1. allow replacing the applyTo attribute with a transformer -> transformerForRuntime_count
 * 2. allow producing a build transformer from the runtime transformer -> transformerForBuild_count
 */
import transformer_count_json from '../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/4ee5c863-5ade-4706-92bd-1fc2d89c3766.json';
export const transformer_count: TransformerDefinition = transformer_count_json as TransformerDefinition;

export const transformerForRuntimeInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "runtime");
export const transformerForBuildInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "build");