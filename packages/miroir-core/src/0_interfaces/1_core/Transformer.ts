import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import type { Step, ResolveBuildTransformersTo } from "../../2_domain/Transformers";
import type { Domain2QueryReturnType } from "../2_domain/DomainElement";
import type { ReduxDeploymentsState } from "../2_domain/ReduxDeploymentsStateInterface";
import type { Uuid } from "./EntityDefinition";
import type {
  MlSchema,
  MetaModel,
  TransformerForBuild,
  TransformerForBuildPlusRuntime,
} from "./preprocessor-generated/miroirFundamentalType";

export interface MiroirModelEnvironment {
  miroirFundamentalJzodSchema: MlSchema,
  miroirMetaModel?: MetaModel,
  endpointsByUuid: Record<Uuid, any>,
  currentModel?: MetaModel,
  deploymentUuid?: Uuid,
};

// ################################################################################################
export type ITransformerHandler<
  T extends
    | TransformerForBuild
    // | TransformerForRuntime,
    | TransformerForBuildPlusRuntime,
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
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
  application?: Uuid,
  applicationDeploymentMap?: ApplicationDeploymentMap,
  deploymentUuid?: Uuid,
) => Domain2QueryReturnType<any>;

// ################################################################################################
// export const defaultTransformerInput: string = "__defaultInput__";
export const defaultTransformerInput: string = "defaultInput";
