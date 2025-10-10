import type { Step, ResolveBuildTransformersTo } from "../../2_domain/Transformers";
import type { Domain2QueryReturnType } from "../2_domain/DomainElement";
import type { Uuid } from "./EntityDefinition";
import type { JzodSchema, MetaModel, TransformerForBuild, TransformerForRuntime } from "./preprocessor-generated/miroirFundamentalType";

export interface MiroirModelEnvironment {
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  deploymentUuid?: Uuid,
};

// ################################################################################################
export type ITransformerHandler<
  T extends
    | TransformerForBuild
    | TransformerForRuntime,
  // U extends MiroirModelEnvironment
    // | TransformerForRuntime_innerFullObjectTemplate
> = (
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: T,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
) => Domain2QueryReturnType<any>;

// ################################################################################################
// export const defaultTransformerInput: string = "__defaultInput__";
export const defaultTransformerInput: string = "defaultInput";
