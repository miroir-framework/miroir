import entityEntityDefinition from "../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

import { Uuid } from '../../0_interfaces/1_core/EntityDefinition';
import {
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodElement,
  type TransformerForBuild_resolveConditionalSchema,
  type TransformerForBuildPlusRuntime_resolveConditionalSchema,
  type TransformerForRuntime_resolveConditionalSchema
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { RelativePath, resolveRelativePath } from '../../tools';
import { cleanLevel } from "../constants";
import { getEntityInstancesUuidIndexNonHook } from "../../2_domain/ReduxDeploymentsStateQueryExecutor";
import type { ResolveBuildTransformersTo, Step } from "../../2_domain/Transformers";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { transformer_extended_apply_wrapper } from "../../2_domain/TransformersForRuntime";
import { transformer } from "zod";

// Error value types for resolveConditionalSchema
export type ResolveConditionalSchemaError =
  | { error: 'NO_REDUX_DEPLOYMENTS_STATE' }
  | { error: 'NO_DEPLOYMENT_UUID' }
  | { error: 'INVALID_PARENT_UUID_CONFIG', details: string }
  | { error: 'PARENT_NOT_FOUND', details: string };

export type ResolveConditionalSchemaResult = JzodElement | ResolveConditionalSchemaError;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "resolveConditionalSchema")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function resolveConditionalSchemaTransformer(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer:
    | TransformerForBuild_resolveConditionalSchema
    | TransformerForRuntime_resolveConditionalSchema
    | TransformerForBuildPlusRuntime_resolveConditionalSchema,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: MiroirModelEnvironment & Record<string, any>,
  contextResults?: Record<string, any>
): ResolveConditionalSchemaResult {
  return resolveConditionalSchema(
    step,
    transformerPath,
    transformer.schema,
    transformer.valueObject, // Use rootObject from contextResults or an empty object
    transformer.valuePath || [], // Use currentValuePath from contextResults or an
    queryParams, // modelEnvironment
    contextResults, 
    transformer?.reduxDeploymentsState, // Use reduxDeploymentsState from contextResults
    transformer?.deploymentUuid, // Use deploymentUuid from contextResults
    transformer.context
  );
}
// ################################################################################################
export function resolveConditionalSchema(
  step: Step,
  transformerPath: string[],
  jzodSchema: JzodElement,
  rootObject: any, // Changed from currentDefaultValue to rootObject
  currentValuePath: string[],
  modelEnvironment: MiroirModelEnvironment & Record<string, any>, // includes queryParams
  contextResults?: Record<string, any>,
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  deploymentUuid: Uuid | undefined = undefined,
  context: 'defaultValue' | 'typeCheck' = 'typeCheck' // New parameter for context
): ResolveConditionalSchemaResult {
  let effectiveSchema: JzodElement = jzodSchema;
  // log.info(
  //   "resolveConditionalSchema called with jzodSchema",
  //   jzodSchema,
  //  //   JSON.stringify(jzodSchema, null, 2),
  //   "rootObject",
  //   rootObject,
  //   "currentValuePath",
  //   currentValuePath,
  //   "reduxDeploymentsState",
  //   reduxDeploymentsState,
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "contextResults",
  //   contextResults,
  //   "modelEnvironment",
  //   Object.keys(modelEnvironment),
  //   // JSON.stringify(modelEnvironment, null, 2),
  //   // modelEnvironment.currentModel,
  //   // modelEnvironment.currentModel?.entityDefinitions.length,
  //   "context",
  //   context
  // );
  if (jzodSchema?.tag && jzodSchema.tag.value && !jzodSchema.tag.value.isTemplate && jzodSchema.tag.value.conditionalMMLS) {
    // If the schema has a conditionalMMLS, we use it as the effective schema
    const conditionalConfig = jzodSchema.tag.value.conditionalMMLS;
    // the runtime path is given by the parentUuid, to be found in the reduxDeploymentsState
    if (conditionalConfig.parentUuid && typeof conditionalConfig.parentUuid === "object") {
      if (!modelEnvironment.currentModel || modelEnvironment.currentModel.entityDefinitions.length === 0) {
        return { error: 'NO_REDUX_DEPLOYMENTS_STATE' };
      }

      if (!deploymentUuid) {
        return { error: 'NO_DEPLOYMENT_UUID' };
      }
      // Support both legacy single path and new dual path configurations
      let pathToUse: string;
      // Type assertion to handle dual path configuration extensions
      const extendedParentUuid = conditionalConfig.parentUuid as any;
      if (extendedParentUuid.defaultValuePath && extendedParentUuid.typeCheckPath) {
        // New dual path configuration
        pathToUse = context === 'defaultValue' 
          ? extendedParentUuid.defaultValuePath 
          : extendedParentUuid.typeCheckPath;
      } else if (extendedParentUuid.path) {
        // Legacy single path configuration (backward compatibility)
        pathToUse = extendedParentUuid.path;
      } else {
        return {
          error: 'INVALID_PARENT_UUID_CONFIG',
          details: JSON.stringify(conditionalConfig.parentUuid, null, 2)
        };
      }
      log.info(
        "resolveConditionalSchema using pathToUse",
        pathToUse,
        "currentValuePath",
        currentValuePath,
        "on rootObject",
        rootObject, 
      );
      const parentUuid = resolveRelativePath(
        rootObject,
        currentValuePath,
        pathToUse.split(".") as RelativePath
      );

      log.info("resolveConditionalSchema resolved parentUuid", parentUuid);
      // Check if parentUuid is invalid or an error
      if (
        parentUuid === undefined ||
        parentUuid === null ||
        (typeof parentUuid === "object" && "error" in parentUuid)
      ) {
        return {
          error: 'INVALID_PARENT_UUID_CONFIG',
          details: `parentUuid resolution failed: ${JSON.stringify(parentUuid, null, 2)}`
        };
      }

      let parentUuidStr: Uuid;
      if (typeof parentUuid === "object" && "transformerType" in parentUuid) {
        parentUuidStr = transformer_extended_apply_wrapper(
          step,
          transformerPath,
          "resolveConditionalSchema - parentUuid",
          parentUuid,
          // currentValuePath,
          modelEnvironment,
          contextResults,
          "value", // resolveBuildTransformersTo
        ) as Uuid;
      }
      else {
        parentUuidStr = parentUuid as Uuid;
      }

      log.info("resolveConditionalSchema found parentUuid", parentUuid, "parentUuidStr", parentUuidStr);
      const currentDeploymentEntityDefinitions: EntityDefinition[] = modelEnvironment.currentModel?.entityDefinitions || [];
      log.info(
        "resolveConditionalSchema currentDeploymentEntityDefinitions",
        currentDeploymentEntityDefinitions
      );
      const parentEntityDefinition = (
        currentDeploymentEntityDefinitions.find(e => e.entityUuid === parentUuidStr) as EntityDefinition
      );
      log.info(
        "resolveConditionalSchema parentEntityDefinition",
        parentEntityDefinition
      );
      if (!parentEntityDefinition) {
        return {
          error: 'PARENT_NOT_FOUND',
          details: `No entity definition found for parentUuid ${parentUuidStr} in deployment ${deploymentUuid}`
        };
      }
      effectiveSchema = parentEntityDefinition.jzodSchema;
    }
    log.info(
      "resolveConditionalSchema return effectiveSchema",
      JSON.stringify(effectiveSchema, null, 2),
    );
  }
  return effectiveSchema;
}
