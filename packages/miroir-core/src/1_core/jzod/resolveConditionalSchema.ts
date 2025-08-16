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
import type { MiroirModelEnvironment } from "../../2_domain/TransformersForRuntime";

// Error value types for resolveConditionalSchema
export type ResolveConditionalSchemaError =
  | { error: 'NO_REDUX_DEPLOYMENTS_STATE' }
  | { error: 'NO_DEPLOYMENT_UUID' }
  | { error: 'INVALID_PARENT_UUID_CONFIG', details: string };

export type ResolveConditionalSchemaResult = JzodElement | ResolveConditionalSchemaError;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "resolveConditionalSchema")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function resolveConditionalSchemaTransformer(
  step: Step,
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
    transformer.schema,
    transformer.valueObject, // Use rootObject from contextResults or an empty object
    transformer.valuePath || [], // Use currentValuePath from contextResults or an
    queryParams, // modelEnvironment 
    transformer?.reduxDeploymentsState, // Use reduxDeploymentsState from contextResults
    transformer?.deploymentUuid, // Use deploymentUuid from contextResults
    transformer.context
  );
}
// ################################################################################################
export function resolveConditionalSchema(
  // step: Step,
  // label: string | undefined,
  // transformer: T,
  // resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  // contextResults?: Record<string, any>

  // 
  jzodSchema: JzodElement,
  rootObject: any, // Changed from currentDefaultValue to rootObject
  currentValuePath: string[],
  modelEnvironment: MiroirModelEnvironment,
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  deploymentUuid: Uuid | undefined = undefined,
  context: 'defaultValue' | 'typeCheck' = 'typeCheck' // New parameter for context
): ResolveConditionalSchemaResult {
  let effectiveSchema: JzodElement = jzodSchema;
  log.info(
    "resolveConditionalSchema called with jzodSchema",
    JSON.stringify(jzodSchema, null, 2),
    "rootObject",
    rootObject,
    "currentValuePath",
    currentValuePath,
    "reduxDeploymentsState",
    reduxDeploymentsState,
    "deploymentUuid",
    deploymentUuid,
    "context",
    context
  );
  if (jzodSchema.tag && jzodSchema.tag.value && jzodSchema.tag.value.conditionalMMLS) {
    // If the schema has a conditionalMMLS, we use it as the effective schema
    const conditionalConfig = jzodSchema.tag.value.conditionalMMLS;
    // the runtime path is given by the parentUuid, to be found in the reduxDeploymentsState
    if (conditionalConfig.parentUuid && typeof conditionalConfig.parentUuid === "object") {
      if (!reduxDeploymentsState) {
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

      // Check if parentUuid is invalid or an error
      if (
        parentUuid === undefined ||
        parentUuid === null ||
        (typeof parentUuid === "object" && parentUuid.error)
      ) {
        return {
          error: 'INVALID_PARENT_UUID_CONFIG',
          details: `parentUuid resolution failed: ${JSON.stringify(parentUuid, null, 2)}`
        };
      }

      log.info("resolveConditionalSchema resolved parentUuid", parentUuid);
      const currentDeploymentEntityDefinitions: EntityDefinition[] =
        getEntityInstancesUuidIndexNonHook(
          reduxDeploymentsState,
          modelEnvironment,
          deploymentUuid,
          entityEntityDefinition.uuid,
        ) as EntityDefinition[];
      log.info(
        "resolveConditionalSchema currentDeploymentEntityDefinitions",
        currentDeploymentEntityDefinitions
      );
      const parentEntityDefinition = (
        currentDeploymentEntityDefinitions.find(e => e.entityUuid === parentUuid) as EntityDefinition
      ).jzodSchema;
      log.info(
        "resolveConditionalSchema parentEntityDefinition",
        parentEntityDefinition
      );
      effectiveSchema = parentEntityDefinition;
    }
    log.info(
      "resolveConditionalSchema return effectiveSchema",
      JSON.stringify(effectiveSchema, null, 2),
    );
  }
  return effectiveSchema;
}
