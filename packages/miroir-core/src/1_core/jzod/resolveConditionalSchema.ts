import entityEntityDefinition from "../../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";

import { Uuid } from '../../0_interfaces/1_core/EntityDefinition';
import {
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodElement,
  type TransformerForBuild_resolveConditionalSchema,
  type TransformerForBuildPlusRuntime_resolveConditionalSchema,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { RelativePath, resolveRelativePath } from '../../tools';
import { cleanLevel } from "../constants";
import { getEntityInstancesUuidIndexNonHook } from "../../2_domain/ReduxDeploymentsStateQueryExecutor";
import type { ResolveBuildTransformersTo, Step } from "../../2_domain/Transformers";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { transformer_extended_apply, transformer_extended_apply_wrapper } from "../../2_domain/TransformersForRuntime";
import { transformer } from "zod";
import type { MiroirActivityTrackerInterface } from "../../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { ApplicationDeploymentMap } from "../Deployment";
import { jzodElement } from "@miroir-framework/jzod-ts";

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
  // activityTracker: MiroirActivityTrackerInterface | undefined,
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer:
    | TransformerForBuild_resolveConditionalSchema
    | TransformerForBuildPlusRuntime_resolveConditionalSchema,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined,
  // application?: Uuid,
  // applicationDeploymentMap?: ApplicationDeploymentMap,
  // deploymentUuid?: Uuid,
): ResolveConditionalSchemaResult {
  return resolveConditionalSchema(
    // activityTracker,
    step,
    transformerPath,
    transformer.schema,
    transformer.valueObject, // Use rootObject from contextResults or an empty object
    transformer.valuePath || [], // Use currentValuePath from contextResults or an
    modelEnvironment,
    queryParams,
    contextResults, 
    contextResults?.reduxDeploymentsState, //transformer?.reduxDeploymentsState, // Use reduxDeploymentsState from contextResults
    // application,
    // applicationDeploymentMap,
    // transformer?.deploymentUuid, // Use deploymentUuid from contextResults
    transformer.context
  );
}
// ################################################################################################
export function resolveConditionalSchema(
  // activityTracker: MiroirActivityTrackerInterface | undefined,
  step: Step,
  transformerPath: string[],
  mlSchema: JzodElement,
  rootObject: any, // Changed from currentDefaultValue to rootObject
  currentValuePath: string[],
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>, // includes queryParams
  contextResults?: Record<string, any>,
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  // application: Uuid | undefined = undefined,
  // applicationDeploymentMap: ApplicationDeploymentMap | undefined = undefined,
  // deploymentUuid: Uuid | undefined = undefined,
  context: 'defaultValue' | 'typeCheck' = 'typeCheck' // New parameter for context
): ResolveConditionalSchemaResult {
  let effectiveSchema: JzodElement = mlSchema;
  // log.info(
  //   "resolveConditionalSchema called with mlSchema",
  //   mlSchema,
  //  //   JSON.stringify(mlSchema, null, 2),
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
  if (mlSchema?.tag && mlSchema.tag.value && !mlSchema.tag.value.isTemplate && mlSchema.tag.value.ifThenElseMMLS) {
    // If the schema has a ifThenElseMMLS, we use it as the effective schema
    const ifThenElseConfig = mlSchema.tag.value.ifThenElseMMLS;
    // the runtime path is given by the parentUuid, to be found in the reduxDeploymentsState
    if (ifThenElseConfig.parentUuid && typeof ifThenElseConfig.parentUuid === "object") {
      if (!modelEnvironment.currentModel || modelEnvironment.currentModel.entityDefinitions.length === 0) {
        return { error: 'NO_REDUX_DEPLOYMENTS_STATE' };
      }

      // const currentDeploymentUuid = deploymentUuid || (applicationDeploymentMap && applicationDeploymentMap[application || '']);
      // if (!currentDeploymentUuid) {
      //   return { error: 'NO_DEPLOYMENT_UUID' };
      // }
      // Support both legacy single path and new dual path configurations
      let pathToUse: string;
      // Type assertion to handle dual path configuration extensions
      const extendedParentUuid = ifThenElseConfig.parentUuid as any;
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
          details: JSON.stringify(ifThenElseConfig.parentUuid, null, 2)
        };
      }
      // log.info(
      //   "resolveConditionalSchema using pathToUse",
      //   pathToUse,
      //   "currentValuePath",
      //   currentValuePath,
      //   "on rootObject",
      //   rootObject, 
      // );
      const parentUuid = resolveRelativePath(
        rootObject,
        currentValuePath,
        pathToUse.split(".") as RelativePath
      );

      // log.info("resolveConditionalSchema resolved parentUuid", parentUuid);
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
        parentUuidStr = transformer_extended_apply(
          // activityTracker,
          step,
          transformerPath,
          "resolveConditionalSchema - parentUuid",
          parentUuid,
          "value", // resolveBuildTransformersTo
          modelEnvironment,
          queryParams,
          contextResults,
          reduxDeploymentsState
        ) as Uuid;
      }
      else {
        parentUuidStr = parentUuid as Uuid;
      }

      // log.info("resolveConditionalSchema found parentUuid", parentUuid, "parentUuidStr", parentUuidStr);
      const currentDeploymentEntityDefinitions: EntityDefinition[] = modelEnvironment.currentModel?.entityDefinitions || [];
      // log.info(
      //   "resolveConditionalSchema currentDeploymentEntityDefinitions",
      //   currentDeploymentEntityDefinitions
      // );
      const parentEntityDefinition = (
        currentDeploymentEntityDefinitions.find(e => e.entityUuid === parentUuidStr) as EntityDefinition
      );
      // log.info(
      //   "resolveConditionalSchema parentEntityDefinition",
      //   parentEntityDefinition
      // );
      if (!parentEntityDefinition) {
        return {
          error: 'PARENT_NOT_FOUND',
          details: `No entity definition found for parentUuid ${parentUuidStr} in deployment ${modelEnvironment.deploymentUuid}`
        };
      }
      effectiveSchema = parentEntityDefinition.mlSchema;
    }
    if (ifThenElseConfig.mmlsReference) {
      effectiveSchema  = {
        type: 'schemaReference',
        definition: ifThenElseConfig.mmlsReference
      };
    }
    // log.info(
    //   "resolveConditionalSchema return effectiveSchema",
    //   JSON.stringify(effectiveSchema, null, 2),
    // );
  }
  return effectiveSchema;
}
