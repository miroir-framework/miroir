import mustache from "mustache";
import { serializeError } from "serialize-error";
// import Mustache from "mustache";
import { v4 as uuidv4 } from "uuid";
import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  DomainElementInstanceArray,
  DomainElementString,
  DomainElementSuccess,
  EntityInstance,
  JzodElement,
  Transformer,
  Transformer_contextOrParameterReferenceTO_REMOVE,
  TransformerDefinition,
  CoreTransformerForBuildPlusRuntime,
  type CoreTransformerForBuildPlusRuntime_aggregate,
  type CoreTransformerForBuildPlusRuntime_createObjectFromPairs,
  type CoreTransformerForBuildPlusRuntime_mergeIntoObject,
  type CoreTransformerForBuildPlusRuntime_mapList,
  type CoreTransformerForBuildPlusRuntime_pickFromList,
  type CoreTransformerForBuildPlusRuntime_indexListBy,
  type CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject,
  type CoreTransformerForBuildPlusRuntime_getObjectEntries,
  type CoreTransformerForBuildPlusRuntime_getObjectValues,
  type CoreTransformerForBuildPlusRuntime_getUniqueValues,
  type CoreTransformerForBuildPlusRuntime_InnerReference,
  type CoreTransformerForBuildPlusRuntime_mustacheStringTemplate,
  type CoreTransformerForBuildPlusRuntime_accessDynamicPath,
  type CoreTransformerForBuildPlusRuntime_createObject,
  type CoreTransformerForBuildPlusRuntime_dataflowObject,
  type CoreTransformerForBuildPlusRuntime_ifThenElse,
  type CoreTransformerForBuildPlusRuntime_boolExpr,
  type CoreTransformerForBuildPlusRuntime_returnValue,
  type CoreTransformerForBuildPlusRuntime_getFromContext,
  type CoreTransformerForBuildPlusRuntime_generateUuid,
  type CoreTransformerForBuildPlusRuntime_constantAsExtractor,
  type CoreTransformerForBuildPlusRuntime_getFromParameters,
  type CoreTransformerForBuildPlusRuntime_defaultValueForMLSchema,
  type TransformerForBuildPlusRuntime_getActiveDeployment,
  type TransformerForBuildPlusRuntime_duplicateApplicationModel,
  type MetaModel,
  type Menu,
  type SelfApplication,
  type ReportLink,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  defaultTransformerInput,
  type ITransformerHandler,
  type MiroirModelEnvironment,
} from "../0_interfaces/1_core/Transformer";
import {
  Action2Error,
  TransformerFailure,
  type TransformerReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import {
  resolveJzodSchemaReferenceInContext,
  resolveSchemaReferenceInContextTransformer,
} from "../1_core/jzod/jzodResolveSchemaReferenceInContext";
import {
  jzodTypeCheckTransformer,
  resolveObjectExtendClauseAndDefinition,
} from "../1_core/jzod/jzodTypeCheck";
import { unfoldSchemaOnceTransformer } from "../1_core/jzod/JzodUnfoldSchemaOnce";
import {
  resolveConditionalSchema,
  resolveConditionalSchemaTransformer,
} from "../1_core/jzod/resolveConditionalSchema";
import { handleTransformer_menu_AddItem } from "../1_core/Menu";
import { ansiColumnsToJzodSchema } from "../1_core/ansiColumnsToJzodSchema";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { resolvePathOnObject, safeResolvePathOnObject } from "../tools";
import { cleanLevel } from "./constants";
import { getEntityInstancesIndexNonHook } from "./ReduxDeploymentsStateQueryExecutor";
import { getInstancePrimaryKeyValue } from "../1_core/EntityPrimaryKey";
// import { transformer_spreadSheetToJzodSchema } from "./Transformer_Spreadsheet";
import {
  mlsTransformers,
  // 
  transformer_spreadSheetToJzodSchema,
  // 
  transformer_ifThenElse,
  transformer_boolExpr,
  transformer_plus,
  transformer_case,
  transformer_returnValue,
  transformer_constantAsExtractor,
  transformer_getFromContext,
  transformer_aggregate,
  transformer_dataflowObject,
  transformer_createObject,
  transformer_pickFromList,
  transformer_indexListBy,
  transformer_listReducerToSpreadObject,
  transformer_mapList,
  transformer_menu_addItem,
  transformer_mustacheStringTemplate,
  transformer_generateUuid,
  transformer_createObjectFromPairs,
  transformer_mergeIntoObject,
  transformer_accessDynamicPath,
  transformer_getObjectEntries,
  transformer_getObjectValues,
  transformer_getFromParameters,
  transformer_getUniqueValues,
  transformer_concatLists,
  type ResolveBuildTransformersTo,
  type Step,
  transformer_getActiveDeployment,
  transformer_ansiColumnsToJzodSchema,
  transformer_defaultValueForMLSchema,
  transformer_duplicateApplicationModel,
} from "./Transformers";
import type { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { defaultAdminApplicationDeploymentMapNOTGOOD, type ApplicationDeploymentMap } from "../1_core/Deployment";

// Re-export types needed by other modules
export type { ResolveBuildTransformersTo, Step } from "./Transformers";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerForRuntime")
).then((logger: LoggerInterface) => {
  log = logger;
});

// TODO: keep this??
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// ################################################################################################
export const defaultTransformers = { // TODO: should it be exported? Should'nt it be only for local use?
  transformer_extended_apply,
  transformer_mustacheStringTemplate_apply,
  transformer_InnerReference_resolve,
  transformer_resolveReference,
  handleTransformer_mergeIntoObject,
  handleTransformer_createObjectFromPairs,
  transformer_object_indexListBy_apply,
  transformer_object_listReducerToSpreadObject_apply,
  transformerForBuild_list_listMapperToList_apply,
  transformer_dynamicObjectAccess_apply,
  // ##############################
  handleTransformer_menu_AddItem,
  // ##############################
  handleTransformer_getActiveDeployment,
  handleTransformer_duplicateApplicationModel,
};

// ################################################################################################
// Default value for Jzod Schema functions - moved here to avoid circular dependency
// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolution(
  step: Step,
  mlSchema: JzodElement,
  rootObject: any | undefined, // Optional parameter for backward compatibility
  rootLessListKey: string,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  forceOptional: boolean = false,
  application: Uuid | undefined = undefined,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined = undefined,
  deploymentUuid: Uuid | undefined = undefined,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any> = {},
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined,
  relativeReferenceJzodContext?: { [k: string]: JzodElement }
): any {
  let effectiveSchemaOrError = resolveConditionalSchema(
    step,
    [], // transformerPath
    mlSchema,
    rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
    currentValuePath,
    miroirEnvironment,
    transformerParams,
    contextResults,
    reduxDeploymentsState,
    "defaultValue" // Specify this is for default value generation
  );

  log.info(
    "getDefaultValueForJzodSchemaWithResolution called with",
    "step",
    step,
    "currentValuePath",
    currentValuePath.join("."),
    "transformerParams",
    transformerParams,
    "mlSchema",
    mlSchema,
    "rootObject",
    rootObject,
    // "reduxDeploymentsState",
    // reduxDeploymentsState,
    // "deploymentUuid",
    // deploymentUuid,
    "forceOptional",
    forceOptional,
    "effectiveSchemaOrError",
    effectiveSchemaOrError,
    "transformerParams",
    transformerParams,
    "contextResults",
    contextResults,
  );

  // if (Object.hasOwn(effectiveSchemaOrError, 'error')) {
  if (!effectiveSchemaOrError || Object.hasOwn(effectiveSchemaOrError, "error")) {
    log.error(
      "getDefaultValueForJzodSchemaWithResolution: resolveConditionalSchema returned error",
      effectiveSchemaOrError
    );
    return undefined; // or propagate error as needed
  }
  let effectiveSchema: JzodElement = effectiveSchemaOrError as JzodElement;

  if (effectiveSchema.optional && !forceOptional) {
    // log.info(
    //   "getDefaultValueForJzodSchemaWithResolution: effectiveSchema is optional and forceOptional is false",
    //   "currentValuePath", currentValuePath,
    //   "effectiveSchema", effectiveSchema
    // );
    return undefined;
  }

  // handle initializeTo tag
  if (
    effectiveSchema.tag &&
    effectiveSchema.tag.value &&
    effectiveSchema.tag.value.initializeTo?.initializeToType == "value" &&
    effectiveSchema.tag.value.initializeTo.value
  ) {
    const result = effectiveSchema.tag.value.initializeTo.value;
    log.info(
      "getDefaultValueForJzodSchemaWithResolutionWithResolution returning value from tag.value.initializeTo.value",
      "currentValuePath",
      currentValuePath,
      "result",
      Object.keys(result),
      result,
    );
    return result;
  }
  if (
    effectiveSchema.tag &&
    effectiveSchema.tag.value &&
    effectiveSchema.tag.value.initializeTo?.initializeToType == "transformer" &&
    effectiveSchema.tag.value.initializeTo.transformer
  ) {
    const result = transformer_extended_apply_wrapper(
      // TODO: transformer_extended_apply instead
      undefined, // activityTracker
      "runtime",
      [...currentValuePath, "initializeTo"],
      undefined, // label
      effectiveSchema.tag.value.initializeTo.transformer,
      miroirEnvironment,
      transformerParams, // parameters
      contextResults, // runtimeContext
      "value",
      reduxDeploymentsState,
    );
    return result;
  }


  switch (effectiveSchema.type) {
    case "object": {
      const resolvedObjectType = resolveObjectExtendClauseAndDefinition(
        effectiveSchema,
        miroirEnvironment,
        relativeReferenceJzodContext
      );
      let result: Record<string, any> = {};

      // TODO: do not call this when the object has a initializeTo tag!
      Object.entries(resolvedObjectType.definition)
        .filter((a) => forceOptional || !a[1].optional || a[1].tag?.value?.initializeTo)
        .forEach((a) => {
          const attributeName = a[0];
          const attributeValue = getDefaultValueForJzodSchemaWithResolution(
            step,
            a[1],
            rootObject,
            rootLessListKey,
            result,
            currentValuePath.concat([a[0]]),
            forceOptional,
            application,
            applicationDeploymentMap,
            deploymentUuid,
            miroirEnvironment,
            transformerParams,
            contextResults,
            reduxDeploymentsState,
            relativeReferenceJzodContext,
          );
          result[attributeName] = attributeValue;
        });
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution for object type",
      //   "effectiveSchema",
      //   effectiveSchema,
      //   "mlSchema",
      //   mlSchema,
      //   "resolvedObjectType",
      //   resolvedObjectType,
      //   "result",
      //   Object.keys(result),
      //   result
      // );
      return result;
    }
    case "string": {
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution called for string",
      //   "effectiveSchema", effectiveSchema, "return empty string"
      // );
      return "";
    }
    case "number":
    case "bigint": {
      return 0;
    }
    case "boolean": {
      return false;
    }
    case "date": {
      return new Date().toISOString();
    }
    case "any":
    // case "null": {
    case "undefined": {
      return undefined;
    }
    case "uuid": {
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolutionWithResolution called for UUID",
      //   "deploymentUuid", deploymentUuid,
      //   "effectiveSchema", effectiveSchema,
      // );
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.initializeTo?.initializeToType == "value" &&
        effectiveSchema.tag.value.initializeTo.value
      ) {
        const result = effectiveSchema.tag.value.initializeTo.value;
        return result;
      }
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.initializeTo?.initializeToType == "transformer" &&
        effectiveSchema.tag.value.initializeTo.transformer
      ) {
        const result = transformer_extended_apply_wrapper(
          //TODO: transformer_extended_apply instead
          undefined, // activityTracker
          "runtime",
          [...currentValuePath, "initializeTo"],
          undefined,
          effectiveSchema.tag.value.initializeTo.transformer,
          miroirEnvironment,
          transformerParams, // parameters
          contextResults, // runtimeContext
          "value",
          reduxDeploymentsState,
        );
        return result;
      }
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.foreignKeyParams &&
        effectiveSchema.tag.value.foreignKeyParams.targetEntity
      ) {
        if (!reduxDeploymentsState) {
          throw new Error(
            "getDefaultValueForJzodSchemaWithResolution called with UUID foreign key but no reduxDeploymentsState provided"
          );
        }
        if (!deploymentUuid) {
          throw new Error(
            "getDefaultValueForJzodSchemaWithResolution called with UUID foreign key but no deploymentUuid provided"
          );
        }
        if (!application) {
          throw new Error(
            "getDefaultValueForJzodSchemaWithResolution called with UUID foreign key but no application provided"
          );
        }
        if (!applicationDeploymentMap) {
          throw new Error(
            "getDefaultValueForJzodSchemaWithResolution called with UUID foreign key but no applicationDeploymentMap provided"
          );
        }
        const foreignKeyObjects: EntityInstance[] = getEntityInstancesIndexNonHook(
          reduxDeploymentsState,
          miroirEnvironment,
          application,
          applicationDeploymentMap,
          deploymentUuid,
          effectiveSchema.tag.value.foreignKeyParams.targetEntity,
          effectiveSchema.tag.value.foreignKeyParams.targetEntityOrderInstancesBy
        );

        const firstInstance = Object.values(foreignKeyObjects)[0];
        const targetEntityDef = miroirEnvironment.currentModel.entityDefinitions.find(
          ed => ed.entityUuid === effectiveSchema.tag?.value?.foreignKeyParams?.targetEntity
        );
        const result = firstInstance && targetEntityDef
          ? getInstancePrimaryKeyValue(targetEntityDef, firstInstance)
          : firstInstance?.uuid;
        return result;
      }
      const result = uuidv4();
      return result;
    }
    case "unknown":
    case "never":
    case "void": {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution can not generate value for schema type " +
          mlSchema.type
      );
    }
    case "literal": {
      return effectiveSchema.definition;
    }
    case "array": {
      return [];
    }
    case "map": {
      return new Map();
    }
    case "set": {
      return new Set();
    }
    case "record": {
      return {};
    }
    case "schemaReference": {
      // HACK: to avoid infinite loop, detect meta-reference "jzodElement"
      if (effectiveSchema.definition.relativePath == "jzodElement") {
        return { type: "any"}
      }
      const localContext = effectiveSchema.context
        ? { ...relativeReferenceJzodContext, ...effectiveSchema.context }
        : relativeReferenceJzodContext;
      
      const resolvedReference = resolveJzodSchemaReferenceInContext(
        effectiveSchema,
        localContext,
        miroirEnvironment
      );
      return getDefaultValueForJzodSchemaWithResolution(
        step,
        resolvedReference,
        rootObject,
        rootLessListKey,
        currentDefaultValue,
        currentValuePath,
        forceOptional,
        application,
        applicationDeploymentMap,
        deploymentUuid,
        miroirEnvironment,
        transformerParams,
        contextResults,
        reduxDeploymentsState,
        localContext,
      );
    }
    case "union": {
      if (effectiveSchema.definition.length == 0) {
        throw new Error(
          "getDefaultValueForJzodSchemaWithResolution union definition is empty for effectiveSchema=" +
            JSON.stringify(effectiveSchema, null, 2)
        );
      }
      if (mlSchema.tag?.value?.initializeTo?.initializeToType == "value") {
        return mlSchema.tag?.value?.initializeTo.value;
      } else {
        return getDefaultValueForJzodSchemaWithResolution(
          "runtime",
          effectiveSchema.definition[0],
          rootObject,
          rootLessListKey,
          currentDefaultValue,
          currentValuePath,
          forceOptional,
          application,
          applicationDeploymentMap,
          deploymentUuid,
          miroirEnvironment,
          transformerParams,
          contextResults,
          reduxDeploymentsState,
          relativeReferenceJzodContext,
        );
      }
    }
    case "enum": {
      if (effectiveSchema.tag?.value?.initializeTo?.initializeToType == "value") {
        return effectiveSchema.tag?.value?.initializeTo.value;
      } else {
        return effectiveSchema.definition[0];
        // throw new Error(
        //   "getDefaultValueForJzodSchemaWithResolution enum definition does not have 'tag.value.initalizeTo' for effectiveSchema=" +
        //     JSON.stringify(effectiveSchema, null, 2)
        // );
      }
    }
    case "function":
    case "lazy":
    case "intersection":
    case "promise":
    case "tuple": {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution does not handle type: " +
          effectiveSchema.type +
          " for effectiveSchema=" +
          JSON.stringify(effectiveSchema, null, 2)
      );
    }
    default: {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution reached default case for type, this is a bug: " +
          JSON.stringify(effectiveSchema, null, 2)
      );
    }
  }
}

// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolutionNonHook<T extends MiroirModelEnvironment>(
  step: Step,
  mlSchema: JzodElement,
  rootObject: any = undefined,
  rootLessListKey: string,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  forceOptional: boolean = false,
  application: Uuid | undefined,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined,
  deploymentUuid: Uuid | undefined,
  miroirEnvironment: T,
  transformerParams: Record<string, any> = {},
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined,
  relativeReferenceJzodContext?: { [k: string]: JzodElement }
): any {
  log.info(
    "getDefaultValueForJzodSchemaWithResolutionNonHook called with",
    "rootLessListKey",
    rootLessListKey,
    "deploymentUuid",
    deploymentUuid,
    "rootObject",
    rootObject,
    "mlSchema",
    mlSchema,
    "forceOptional",
    forceOptional,
    "transformerParams",
    transformerParams,
    "contextResults",
    contextResults,
    "currentDefaultValue",
    currentDefaultValue,
    "currentValuePath",
    currentValuePath,
    "reduxDeploymentsState",
    reduxDeploymentsState,
  );

  if (deploymentUuid == undefined || deploymentUuid.length < 8 || !reduxDeploymentsState) {
    return getDefaultValueForJzodSchemaWithResolution(
      step,
      mlSchema,
      rootObject,
      rootLessListKey,
      currentDefaultValue,
      currentValuePath,
      forceOptional,
      application,
      applicationDeploymentMap,
      undefined, // deploymentUuid
      miroirEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState,
      relativeReferenceJzodContext,
    );
  }

  return getDefaultValueForJzodSchemaWithResolution(
    step,
    mlSchema,
    rootObject,
    rootLessListKey,
    currentDefaultValue,
    currentValuePath,
    forceOptional,
    application,
    applicationDeploymentMap,
    deploymentUuid,
    miroirEnvironment,
    transformerParams,
    contextResults,
    reduxDeploymentsState,
    relativeReferenceJzodContext,
  );
}

// ################################################################################################
export function defaultValueForMLSchemaTransformer(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_defaultValueForMLSchema,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // somewhat redundant with modelEnvironment
  application?: Uuid,
  applicationDeploymentMap?: ApplicationDeploymentMap,
  deploymentUuid?: Uuid,
): any {
  const result = getDefaultValueForJzodSchemaWithResolutionNonHook(
    step,
    transformer.mlSchema,
    undefined, // rootObject
    "", // rootLessListKey
    undefined, // currentDefaultValue
    [], // currentValuePath
    false, // forceOptional
    application,
    applicationDeploymentMap,
    deploymentUuid, // deploymentUuid
    modelEnvironment, // miroirEnvironment
    transformerParams, 
    contextResults,
    reduxDeploymentsState,
    undefined // relativeReferenceJzodContext
  );
  log.info(
    "defaultValueForMLSchemaTransformer called with",
    "step",
    step,
    "label",
    label,
    "transformer",
    transformer,
    "resolveBuildTransformersTo",
    resolveBuildTransformersTo,
    "transformerParams",
    transformerParams,
    "contextResults",
    contextResults,
    "result",
    result
  );
  return result;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
const inMemoryTransformerImplementations: Record<string, ITransformerHandler<any>> = {
  handleTransformer_menu_AddItem: defaultTransformers.handleTransformer_menu_AddItem,
  // 
  handleTransformer_getActiveDeployment,
  handleTransformer_duplicateApplicationModel,
  //
  handleCountTransformer,
  handleListPickElementTransformer,
  handleUniqueTransformer,
  handleTransformer_ifThenElse,
  handleTransformer_boolExpr,
  handleTransformer_plus,
  handleTransformer_case,
  handleTransformer_constant,
  // handleTransformer_constantArray,
  handleTransformer_constantAsExtractor,
  handleTransformer_getFromContext,
  handleTransformer_dataflowObject,
  handleTransformer_FreeObjectTemplate,
  transformer_mustacheStringTemplate_apply:
    defaultTransformers.transformer_mustacheStringTemplate_apply,
  handleTransformer_generateUuid,
  handleTransformer_mergeIntoObject: defaultTransformers.handleTransformer_mergeIntoObject,
  transformer_dynamicObjectAccess_apply: defaultTransformers.transformer_dynamicObjectAccess_apply,
  handleTransformer_getObjectEntries,
  handleTransformer_getObjectValues,
  handleTransformer_createObjectFromPairs:
    defaultTransformers.handleTransformer_createObjectFromPairs,
  handleTransformer_getFromParameters,
  transformer_object_indexListBy_apply: defaultTransformers.transformer_object_indexListBy_apply,
  transformer_object_listReducerToSpreadObject_apply:
    defaultTransformers.transformer_object_listReducerToSpreadObject_apply,
  transformerForBuild_list_listMapperToList_apply:
    defaultTransformers.transformerForBuild_list_listMapperToList_apply,
  // MLS
  transformer_defaultValueForMLSchema: defaultValueForMLSchemaTransformer,
  transformer_resolveConditionalSchema: resolveConditionalSchemaTransformer,
  transformer_resolveSchemaReferenceInContext: resolveSchemaReferenceInContextTransformer,
  transformer_unfoldSchemaOnce: unfoldSchemaOnceTransformer,
  transformer_jzodTypeCheck: jzodTypeCheckTransformer,
  handleTransformer_ansiColumnsToJzodSchema,
  handleTransformer_concatLists,
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applicationTransformerDefinitions: Record<string, TransformerDefinition> = {
  transformer_menu_addItem: transformer_menu_addItem,
  // admin
  getActiveDeployment: transformer_getActiveDeployment,
  duplicateApplicationModel: transformer_duplicateApplicationModel,
  //
  spreadSheetToJzodSchema: transformer_spreadSheetToJzodSchema,
  aggregate: transformer_aggregate,
  ifThenElse: transformer_ifThenElse,
  boolExpr: transformer_boolExpr,
  "+": transformer_plus,
  case: transformer_case,
  returnValue: transformer_returnValue,
  constantAsExtractor: transformer_constantAsExtractor,
  getFromContext: transformer_getFromContext,
  dataflowObject: transformer_dataflowObject,
  createObject: transformer_createObject,
  pickFromList: transformer_pickFromList,
  indexListBy: transformer_indexListBy,
  listReducerToSpreadObject: transformer_listReducerToSpreadObject,
  mapList: transformer_mapList,
  mustacheStringTemplate: transformer_mustacheStringTemplate,
  generateUuid: transformer_generateUuid,
  mergeIntoObject: transformer_mergeIntoObject,
  accessDynamicPath: transformer_accessDynamicPath,
  getObjectEntries: transformer_getObjectEntries,
  getObjectValues: transformer_getObjectValues,
  createObjectFromPairs: transformer_createObjectFromPairs,
  getFromParameters: transformer_getFromParameters,
  getUniqueValues: transformer_getUniqueValues,
  ansiColumnsToJzodSchema: transformer_ansiColumnsToJzodSchema,
  concatLists: transformer_concatLists,
  defaultValueForMLSchema: transformer_defaultValueForMLSchema,
  // MLS
  ...Object.fromEntries(
    Object.entries(mlsTransformers).map(([key, value]) => [
      key.replace("transformer_", ""),
      value as TransformerDefinition,
    ])
  ),
};

// ################################################################################################
function handleTransformer_getActiveDeployment(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_getActiveDeployment,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
) {

  if (typeof transformer.application == "object") {
    const resolvedApplication = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "application"],
      label,
      transformer.application,
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      contextResults
    );
    if (resolvedApplication instanceof TransformerFailure) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath: [...transformerPath, "application"],
        failureOrigin: ["handleTransformer_getActiveDeployment"],
        failureMessage:
          "handleTransformer_getActiveDeployment failed to resolve application transformer",
        queryContext: JSON.stringify(transformer),
        queryParameters: queryParams as any,
      });
    }
    // log.info(
    //   "handleTransformer_getActiveDeployment called with",
    //   "step", step,
    //   "transformerPath", transformerPath,
    //   "label", label,
    //   "resolvedApplication", resolvedApplication,
    //   "transformer", transformer,
    //   "queryParams", queryParams,
    //   "contextResults", contextResults,
    // );
    return defaultAdminApplicationDeploymentMapNOTGOOD[resolvedApplication];
  } else {
    // log.info(
    //   "handleTransformer_getActiveDeployment called with",
    //   "step", step,
    //   "transformerPath", transformerPath,
    //   "label", label,
    //   "transformer.application", transformer.application,
    //   "transformer", transformer,
    //   "queryParams", queryParams,
    //   "contextResults", contextResults,
    // );
    return defaultAdminApplicationDeploymentMapNOTGOOD[transformer.application];
  }
}

// ################################################################################################
function handleTransformer_duplicateApplicationModel(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: TransformerForBuildPlusRuntime_duplicateApplicationModel,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
) {

  let newApplicationUuid: Uuid | undefined = undefined;
    log.info(
      "handleTransformer_duplicateApplicationModel called with",
      "step", step,
      "transformerPath", transformerPath,
      "label", label,
      // "resolvedApplication", resolvedApplication,
      "transformer", transformer,
      "queryParams", queryParams,
      "contextResults", contextResults,
    );
  if (typeof transformer.application == "object") {
    const resolvedApplication = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "application"],
      label,
      transformer.application,
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      contextResults
    );
    log.info(
      "handleTransformer_duplicateApplicationModel resolved application",
      "step", step,
      "transformerPath", transformerPath,
      "label", label,
      "resolvedApplication", resolvedApplication,
      "transformer", transformer,
      "queryParams", queryParams,
      "contextResults", contextResults,
    );
    if (resolvedApplication instanceof TransformerFailure) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath: [...transformerPath, "application"],
        failureOrigin: ["handleTransformer_getActiveDeployment"],
        failureMessage:
          "handleTransformer_getActiveDeployment failed to resolve application transformer",
        queryContext: JSON.stringify(transformer),
        queryParameters: queryParams as any,
      });
    }
    newApplicationUuid = resolvedApplication;
  } else {
    newApplicationUuid = transformer.application;
  }

  if (!newApplicationUuid) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: [...transformerPath, "application"],
      failureOrigin: ["handleTransformer_duplicateApplicationModel"],
      failureMessage:
        "handleTransformer_duplicateApplicationModel failed to resolve application UUID",
      // queryContext: JSON.stringify(transformer),
      innerError: newApplicationUuid as any,
      queryParameters: queryParams as any,
      queryContext: contextResults as any,
    });
  }

  const applicationBundle: MetaModel = "transformerType" in transformer.applicationBundle ?
    defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "applicationBundle"],
      label,
      transformer.applicationBundle as any,
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      contextResults
    ) : transformer.applicationBundle;

  const result: MetaModel = {
    ...applicationBundle,
    applicationUuid: newApplicationUuid,
    applications: applicationBundle.applications.map((app: SelfApplication) => ({
      ...app,
      uuid: newApplicationUuid,
      homePageUrl:
        typeof app.homePageUrl === "string"
          ? app.homePageUrl.replaceAll(
              applicationBundle.applicationUuid,
              newApplicationUuid as string,
            )
          : { ...app.homePageUrl, selfApplication: newApplicationUuid } as ReportLink,
    })),
    entities: applicationBundle.entities.map((entity) => ({
      ...entity,
      selfApplication: newApplicationUuid,
    })),
    endpoints: applicationBundle.endpoints.map((endpoint) => ({
      ...endpoint,
      application: newApplicationUuid,
    })),
    menus: applicationBundle.menus.map((menu) => ({
      ...menu,
      definition:
        menu.definition.menuType == "simpleMenu"
          ? {
              ...menu.definition,
              definition: menu.definition.definition.map(
                (item) =>
                  Object.fromEntries(
                    Object.entries(item).map(([key, value]) =>
                      typeof value === "string"
                        ? [
                            key,
                            value.replaceAll(
                              applicationBundle.applicationUuid,
                              newApplicationUuid as string,
                            ),
                          ]
                        : [key, value],
                    ),
                  ),
                // (
                // {
                // ...item,
                // selfApplication: newApplicationUuid,
                // }
                // )
              ),
            }
          : {
              ...menu.definition,
              definition: menu.definition.definition.map((e) => ({
                ...e,
                items: e.items.map(
                  (item: any) =>
                    Object.fromEntries(
                      Object.entries(item).map(([key, value]) =>
                        typeof value === "string"
                          ? [
                              key,
                              value.replaceAll(
                                applicationBundle.applicationUuid,
                                newApplicationUuid as string,
                              ),
                            ]
                          : [key, value],
                      ),
                    ),
                  //   ({
                  //   ...item,
                  //   selfApplication: newApplicationUuid,
                  // })
                ),
              })),
            },
    })) as any,
    reports: applicationBundle.reports.map((report) => ({
      ...report,
      selfApplication: newApplicationUuid,
    })),
    applicationVersions: applicationBundle.applicationVersions.map((av) => ({
      ...av,
      selfApplication: newApplicationUuid,
    })),
    runners: applicationBundle.runners.map((runner) => ({
      ...runner,
      selfApplication: newApplicationUuid,
    })),
  };
  return result;
}

// ################################################################################################
function resolveApplyTo(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer:
    // | TransformerForBuild_createObjectFromPairs
    | CoreTransformerForBuildPlusRuntime_createObjectFromPairs
    // | TransformerForBuild_mergeIntoObject
    | CoreTransformerForBuildPlusRuntime_mergeIntoObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
) {
  if (!transformer.applyTo) {
    return defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "applyTo"],
      label,
      {
        transformerType: step == "build" ? "getFromParameters" : "getFromContext",
        referenceName: defaultTransformerInput,
      },
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      contextResults
    );
  }
  switch (typeof transformer.applyTo) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "undefined": {
      return transformer.applyTo;
    }
    case "object": {
      if (
        Array.isArray(transformer.applyTo) ||
        !Object.hasOwn(transformer.applyTo, "transformerType")
      ) {
        return transformer.applyTo;
      }
      // if (transformer.applyTo.referenceType == "referencedExtractor") {
      //   // throw new Error("resolveApplyTo_legacy can not handle referencedExtractor");
      //   return new Domain2ElementFailed({
      //     queryFailure: "FailedTransformer",
      //     failureOrigin: ["resolveApplyTo_legacy"],
      //     failureMessage: "resolveApplyTo_legacy can not handle referencedExtractor",
      //     queryContext: JSON.stringify(transformer),
      //     queryParameters: queryParams as any,
      //   });
      // }

      // const transformerReference = transformer.applyTo.reference;

      const resolvedReference = defaultTransformers.transformer_extended_apply(
        step,
        [...transformerPath, "applyTo"],
        label,
        transformer.applyTo,
        resolveBuildTransformersTo,
        modelEnvironment,
        queryParams,
        contextResults
      );
      log.info(
        "resolveApplyTo resolved for transformer",
        transformer,
        "step",
        step,
        "label",
        label,
        "resolvedReference",
        resolvedReference,
        "contextResults",
        contextResults
      );
      return resolvedReference;
      break;
    }
    case "symbol":
    case "function":
    default: {
      // throw new Error("resolveApplyTo_legacy failed, unknown type for transformer.applyTo=" + transformer.applyTo);
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath: [...transformerPath, "applyTo"],
        failureOrigin: ["resolveApplyTo"],
        failureMessage:
          "resolveApplyTo failed, unknown type for transformer.applyTo=" + transformer.applyTo,
        queryContext: JSON.stringify(transformer),
        queryParameters: queryParams as any,
      });
      break;
    }
  }

  // if (transformer.applyTo.referenceType == "referencedExtractor") {
  //   throw new Error("resolveApplyTo can not handle referencedExtractor");
  // }

  // const transformerReference = transformer.applyTo.reference;

  // const resolvedReference =
  //   typeof transformerReference == "string"
  //     ? defaultTransformers.transformer_InnerReference_resolve(
  //         step,
  //         { transformerType: "getFromContext", referenceName: transformerReference }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
  //         resolveBuildTransformersTo,
  //         queryParams,
  //         contextResults
  //       )
  //     : defaultTransformers.transformer_extended_apply(
  //         step,
  //         objectName,
  //         transformerReference,
  //         resolveBuildTransformersTo,
  //         queryParams,
  //         contextResults,

  //       );
  // return resolvedReference;
}

// ################################################################################################
// TODO: identical to resolveApplyTo, should be merged?
export function resolveApplyTo_legacy(
  transformer:
    | CoreTransformerForBuildPlusRuntime_aggregate
    | CoreTransformerForBuildPlusRuntime_mapList
    | CoreTransformerForBuildPlusRuntime_pickFromList
    | CoreTransformerForBuildPlusRuntime_indexListBy
    | CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject
    | CoreTransformerForBuildPlusRuntime_getObjectEntries
    | CoreTransformerForBuildPlusRuntime_getObjectValues
    | CoreTransformerForBuildPlusRuntime_getUniqueValues,
  step: Step,
  transformerPath: string[],
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults: Record<string, any> | undefined,
  label: string | undefined,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
) {
  // log.info(
  //   "resolveApplyTo_legacy",
  //   "label",
  //   label,
  //   "called for transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "step",
  //   step,
  //   "resolveBuildTransformersTo",
  //   resolveBuildTransformersTo
  // );
  if (!transformer.applyTo) {
    return defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "applyTo"],
      label,
      {
        transformerType: step == "build" ? "getFromParameters" : "getFromContext",
        referenceName: defaultTransformerInput,
      },
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      contextResults,
      reduxDeploymentsState
    );
  }
  switch (typeof transformer.applyTo) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "undefined": {
      return transformer.applyTo;
    }
    case "object": {
      if (
        Array.isArray(transformer.applyTo) ||
        !Object.hasOwn(transformer.applyTo, "transformerType")
      ) {
        return transformer.applyTo;
      }
      // if (transformer.applyTo.referenceType == "referencedExtractor") {
      //   // throw new Error("resolveApplyTo_legacy can not handle referencedExtractor");
      //   return new TransformerFailure({
      //     queryFailure: "FailedTransformer",
      //     failureOrigin: ["resolveApplyTo_legacy"],
      //     failureMessage: "resolveApplyTo_legacy can not handle referencedExtractor",
      //     queryContext: JSON.stringify(transformer),
      //     queryParameters: queryParams as any,
      //   });
      // }

      // const transformerReference = transformer.applyTo.reference;

      const resolvedReference = defaultTransformers.transformer_extended_apply(
        step,
        [...transformerPath, "applyTo"],
        label,
        transformer.applyTo,
        resolveBuildTransformersTo,
        modelEnvironment,
        queryParams,
        contextResults,
        reduxDeploymentsState
      );
      // log.info(
      //   "resolveApplyTo_legacy resolved for transformer",
      //   transformer,
      //   "step",
      //   step,
      //   "label",
      //   label,
      //   "resolvedReference",
      //   resolvedReference
      // );
      return resolvedReference;
      break;
    }
    case "symbol":
    case "function":
    default: {
      // throw new Error("resolveApplyTo_legacy failed, unknown type for transformer.applyTo=" + transformer.applyTo);
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath: [...transformerPath, "applyTo"],
        failureOrigin: ["resolveApplyTo_legacy"],
        failureMessage:
          "resolveApplyTo failed, unknown type for transformer.applyTo=" + transformer.applyTo,
        queryContext: JSON.stringify(transformer),
        queryParameters: queryParams as any,
      });
      break;
    }
  }
}

// ################################################################################################
function transformerForBuild_list_listMapperToList_apply(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_mapList,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any[]> {
  const resolvedApplyTo = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults,
    label
  );
  // log.info(
  //   "transformerForBuild_list_listMapperToList_apply",
  //   "step",
  //   step,
  //   "extractorTransformer resolvedReference",
  //   resolvedApplyTo
  // );
  if (resolvedApplyTo instanceof TransformerFailure) {
    log.error(
      "transformerForBuild_list_listMapperToList_apply extractorTransformer can not apply to failed resolvedReference",
      resolvedApplyTo
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
      queryContext:
        "transformerForBuild_list_listMapperToList_apply can not apply to failed resolvedReference",
      innerError: resolvedApplyTo,
    });
  }
  const resultArray: any[] = [];

  if (Array.isArray(resolvedApplyTo)) {
    for (const element of resolvedApplyTo) {
      resultArray.push(
        defaultTransformers.transformer_extended_apply(
          step,
          transformerPath,
          (element as any).name ?? "No name for element",
          transformer.elementTransformer as any,
          resolveBuildTransformersTo,
          modelEnvironment,
          queryParams,
          {
            ...contextResults,
            [transformer.referenceToOuterObject ?? defaultTransformerInput]: element,
          }, // inefficient!
          reduxDeploymentsState
        )
      ); // TODO: constrain type of transformer
    }
  } else {
    // allow this?  or should it be an error?
    if (typeof resolvedApplyTo == "object") {
      for (const element of Object.entries(resolvedApplyTo)) {
        resultArray.push(
          defaultTransformers.transformer_extended_apply(
            step,
            transformerPath,
            element[0],
            transformer.elementTransformer as any,
            resolveBuildTransformersTo,
            modelEnvironment,
            queryParams,
            {
              ...contextResults,
              [transformer.referenceToOuterObject ?? defaultTransformerInput]: element[1],
            },
            reduxDeploymentsState
          )
        ); // TODO: constrain type of transformer
      }
    } else {
      log.error(
        "transformerForBuild_list_listMapperToList_apply extractorTransformer can not work on resolvedReference",
        resolvedApplyTo
      );
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath, //: [...transformerPath, transformer.transformerType],
        failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
        failureMessage:
          "resolved reference is not instanceUuidIndex or object " +
          JSON.stringify(resolvedApplyTo, null, 2),
      });
    }
  }
  const sortByAttribute = transformer.orderBy
    ? (a: any[]) =>
        a.sort((a, b) =>
          a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
            sensitivity: "base",
          })
        )
    : (a: any[]) => a;

  const sortedResultArray = sortByAttribute(resultArray);
  return sortedResultArray;
}

// ################################################################################################
function transformer_object_listReducerToSpreadObject_apply(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer:
    | CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  // log.info(
  //   "transformer_object_listReducerToSpreadObject_apply called for transformer",
  //   transformer,
  //   "queryParams",
  //   JSON.stringify(queryParams, null, 2),
  //   "contextResults",
  //   JSON.stringify(contextResults, null, 2)
  // );
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults,
    label
  );

  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext:
        "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      innerError: resolvedReference,
    });
  }

  const isListOfObjects =
    Array.isArray(resolvedReference) &&
    resolvedReference.every((entry) => typeof entry == "object" && !Array.isArray(entry));

  if (!isListOfObjects) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext:
        "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
      queryParameters: resolvedReference,
    });
  }
  // TODO: test if resolvedReference is a list of objects
  const result = Object.fromEntries(
    resolvedReference.flatMap((entry: Record<string, any>) => {
      return Object.entries(entry);
    })
  );

  return result;
}

// ################################################################################################
function transformer_object_indexListBy_apply(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_indexListBy,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  // log.info(
  //   "transformer_object_indexListBy_apply called for transformer",
  //   transformer,
  //   "queryParams",
  //   JSON.stringify(queryParams, null, 2),
  //   "contextResults",
  //   JSON.stringify(contextResults, null, 2)
  // );
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults,
    label
  );

  // TODO: test if resolvedReference is a list
  if (resolvedReference instanceof TransformerFailure) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_object_indexListBy_apply"],
      queryContext:
        "transformer_object_indexListBy_apply can not apply to failed resolvedReference",
      innerError: resolvedReference,
    });
  } else {
    log.info("transformer_object_indexListBy_apply found resolvedReference", resolvedReference);
  }
  if (!Array.isArray(resolvedReference)) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_object_indexListBy_apply"],
      queryContext:
        "transformer_object_indexListBy_apply can not apply to resolvedReference of wrong type",
      queryParameters: resolvedReference,
    });
  }
  const result = Object.fromEntries(
    resolvedReference.map((entry: Record<string, any>) => {
      return [entry[transformer.indexAttribute], entry];
    })
  );

  return result;
}

/**
 * valid for both actions and queries??
 * For dynamic attributes the actual type of the attribute is not known, until runtime.
 * Build-time consistency check of the action is not possible.
 * Any stuctural inconsitency in the action will be detected only at runtime and result in an error.
 *
 */
// ################################################################################################
function handleTransformer_createObjectFromPairs(
  step: Step,
  transformerPath: string[],
  objectName: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_createObjectFromPairs,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<DomainElementString | DomainElementInstanceArray> {
  // log.info(
  //   "transformer_createObjectFromPairs called with objectName=",
  //   objectName,
  //   // "transformerForBuild=",
  //   // // transformerForBuild,
  //   // JSON.stringify(transformerForBuild, null, 2)
  //   // // "innerEntry",
  //   // // JSON.stringify(innerEntry, null, 2)
  // );
  const resolvedApplyTo = transformer.applyTo?resolveApplyTo(
    step,
    transformerPath,
    objectName,
    transformer,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults
  ):{};

  if (resolvedApplyTo instanceof TransformerFailure) {
    log.error(
      "transformer_createObjectFromPairs can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_createObjectFromPairs"],
      queryContext: "transformer_createObjectFromPairs can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo,
    });
  }
  log.info(
    "transformer_createObjectFromPairs found resolvedApplyTo",
    JSON.stringify(resolvedApplyTo, null, 2)
  );
  const newContextResults = {
    ...contextResults,
    [transformer.referenceToOuterObject ?? defaultTransformerInput]: resolvedApplyTo,
  };

  const attributeEntries = transformer.definition.map(
    (
      innerEntry: {
        attributeKey: CoreTransformerForBuildPlusRuntime | string;
        attributeValue: CoreTransformerForBuildPlusRuntime;
      },
      index
    ): [
      {
        rawLeftValue: TransformerReturnType<DomainElementSuccess>;
        finalLeftValue: TransformerReturnType<DomainElementSuccess>;
      },
      {
        renderedRightValue: TransformerReturnType<DomainElementSuccess>;
        finalRightValue: TransformerReturnType<DomainElementSuccess>;
      }
    ] => {
      const rawLeftValue: TransformerReturnType<DomainElementSuccess> =
        typeof innerEntry.attributeKey == "object" &&
        Object.hasOwn(innerEntry.attributeKey, "transformerType")
          ? defaultTransformers.transformer_extended_apply(
              step,
              [...transformerPath, transformer.transformerType, "attributeKey" + index],
              objectName, // is this correct? or should it be undefined?
              innerEntry.attributeKey,
              resolveBuildTransformersTo,
              modelEnvironment,
              queryParams,
              newContextResults
            )
          : innerEntry.attributeKey;
      const leftValue: {
        rawLeftValue: TransformerReturnType<any>;
        finalLeftValue: TransformerReturnType<any>;
      } = {
        // const leftValue: { rawLeftValue: TransformerReturnType<DomainElementSuccess>; finalLeftValue: TransformerReturnType<DomainElementSuccess> } = {
        rawLeftValue,
        finalLeftValue:
          !(rawLeftValue instanceof Action2Error) &&
          typeof innerEntry.attributeKey == "object" &&
          (innerEntry.attributeKey as any).applyFunction
            ? (innerEntry.attributeKey as any).applyFunction(rawLeftValue)
            : rawLeftValue,
      };
      // log.info(
      //   "transformer_createObjectFromPairs innerEntry.attributeKey",
      //   innerEntry.attributeKey,
      //   "leftValue",
      //   leftValue
      // );

      const renderedRightValue: TransformerReturnType<DomainElementSuccess> =
        defaultTransformers.transformer_extended_apply(
          // TODO: use actionRuntimeTransformer_apply or merge the two functions
          step,
          [...transformerPath, transformer.transformerType, "attributeValue" + index],
          leftValue.finalLeftValue as any as string,
          innerEntry.attributeValue as any, // TODO: wrong type in the case of runtime transformer
          resolveBuildTransformersTo,
          modelEnvironment,
          queryParams,
          newContextResults,
          reduxDeploymentsState
        ); // TODO: check for failure!
      const rightValue: {
        renderedRightValue: TransformerReturnType<DomainElementSuccess>;
        finalRightValue: TransformerReturnType<DomainElementSuccess>;
      } = {
        renderedRightValue,
        finalRightValue:
          renderedRightValue.elementType != "failure" &&
          (innerEntry.attributeValue as any).applyFunction
            ? (innerEntry.attributeValue as any).applyFunction(renderedRightValue)
            : renderedRightValue,
      };
      // log.info(
      //   "transformer_createObjectFromPairs",
      //   step,
      //   "innerEntry",
      //   JSON.stringify(innerEntry, null, 2),
      //   // "innerEntry.attributeKey",
      //   // JSON.stringify(innerEntry.attributeKey, null, 2),
      //   "leftValue",
      //   JSON.stringify(leftValue, null, 2),
      //   "renderedRightValue",
      //   JSON.stringify(renderedRightValue, null, 2),
      //   "rightValue",
      //   JSON.stringify(rightValue, null, 2),
      //   "contextResults",
      //   JSON.stringify(contextResults, null, 2)
      // );
      return [leftValue, rightValue];
    }
  );

  const failureIndex = attributeEntries.findIndex(
    (e) =>
      e[0].finalLeftValue.elementType == "failure" || e[1].finalRightValue.elementType == "failure"
  );
  if (failureIndex == -1) {
    const fullObjectResult = Object.fromEntries(
      attributeEntries.map((e) => [e[0].finalLeftValue, e[1].finalRightValue])
    );
    // log.info("transformer_createObjectFromPairs for", transformerForBuild, "fullObjectResult", fullObjectResult);
    return fullObjectResult;
  } else {
    return new TransformerFailure({
      queryFailure: "ReferenceNotFound",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_createObjectFromPairs"],
      queryContext: "FullObjectTemplate error in " + objectName,
      innerError: attributeEntries[failureIndex] as any,
      // JSON.stringify(attributeEntries[failureIndex], null, 2),
    });
  }
}

// ################################################################################################
function handleTransformer_mergeIntoObject<T extends MiroirModelEnvironment>(
  step: Step,
  transformerPath: string[],
  objectName: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_mergeIntoObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedApplyTo = resolveApplyTo(
    step,
    transformerPath,
    objectName,
    transformer,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults
  );
  if (resolvedApplyTo instanceof TransformerFailure) {
    log.error(
      "transformer_mergeIntoObject can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["transformer_mergeIntoObject"],
      queryContext: "transformer_mergeIntoObject can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo,
    });
  }
  // TODO: test if resolvedReference is an object
  const overrideObject = defaultTransformers.transformer_extended_apply(
    step,
    transformerPath,
    "NO NAME",
    transformer.definition,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    {
      ...contextResults,
      [transformer.referenceToOuterObject ?? defaultTransformerInput]: resolvedApplyTo,
    },
    reduxDeploymentsState
  );

  if (overrideObject instanceof TransformerFailure) {
    log.error("transformer_mergeIntoObject can not apply to failed overrideObject", overrideObject);
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["transformer_mergeIntoObject"],
      queryContext: "transformer_mergeIntoObject can not apply to failed overrideObject",
      innerError: overrideObject,
    });
  }
  log.info(
    "transformer_mergeIntoObject",
    "step",
    step,
    "resolvedApplyTo",
    resolvedApplyTo,
    "overrideObject",
    overrideObject
  );
  // TODO: check for failures!
  return {
    ...resolvedApplyTo,
    ...overrideObject,
  };
}

/**
 * names for transformer functions are not satisfactory or consistent, this indicates that Transformer could
 * be a class somehow.
 */
// ################################################################################################
export function transformer_resolveReference(
  step: Step,
  transformerPath: string[] = [],
  transformerInnerReference: Transformer_contextOrParameterReferenceTO_REMOVE,
  paramOrContext: "param" | "context",
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  // ReferenceNotFound
  const bank: Record<string, any> =
    paramOrContext == "param" ? queryParams ?? {} : contextResults ?? {};
  const usedReference = transformerInnerReference.referenceName
    ? "referenceName"
    : (transformerInnerReference as any).referencePath
    ? "referencePath"
    : "no name";

  // log.info(
  //   "transformer_resolveReference called for",
  //   transformerInnerReference,
  //   // JSON.stringify(transformerInnerReference, null, 2),
  //   "bank",
  //   bank,
  //   // JSON.stringify(Object.keys(bank), null, 2)
  //   // JSON.stringify(bank, null, 2)
  // );
  if (!bank) {
    log.error(
      "transformer_resolveReference failed, no contextResults for step",
      step,
      "transformerInnerReference=",
      transformerInnerReference
    );
    return new TransformerFailure({
      queryFailure: "ReferenceNotFound",
      transformerPath: [...transformerPath, usedReference],
      failureOrigin: ["transformer_resolveReference"],
      queryReference: transformerInnerReference.referenceName,
      failureMessage: "no contextResults",
      queryContext: "no contextResults",
    });
  }

  // ReferenceNotFound
  if (transformerInnerReference.referenceName) {
    // ReferenceNotFound
    // if (!Object.hasOwn(bank, transformerInnerReference.referenceName)) {
    if (!bank[transformerInnerReference.referenceName]) {
      // log.error(
      //   "transformer_resolveReference failed, reference not found for step",
      //   step,
      //   "transformerInnerReference=",
      //   transformerInnerReference,
      //   "could not find",
      //   transformerInnerReference.referenceName,
      //   "in",
      //   bank
      // );
      return new TransformerFailure({
        queryFailure: "ReferenceNotFound",
        transformerPath: [...transformerPath, usedReference],
        failureOrigin: ["transformer_resolveReference"],
        queryReference: transformerInnerReference.referenceName,
        failureMessage: "no referenceName " + transformerInnerReference.referenceName + " in " + paramOrContext,
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
    // log.info(
    //   "transformer_resolveReference resolved for",
    //   JSON.stringify(transformerInnerReference, null, 2),
    //   "bank",
    //   JSON.stringify(Object.keys(bank), null, 2),
    //   "found result",
    //   JSON.stringify(bank[transformerInnerReference.referenceName], null, 2)
    // );
    return bank[transformerInnerReference.referenceName];
  }

  // ReferenceFoundButUndefined
  if (transformerInnerReference.referencePath) {
    try {
      const pathResult = transformerInnerReference.safe
        ? safeResolvePathOnObject(bank, transformerInnerReference.referencePath)
        : resolvePathOnObject(bank, transformerInnerReference.referencePath);
      // log.info(
      //   "transformer_resolveReference path resolved for",
      //   JSON.stringify(transformerInnerReference, null, 2),
      //   "found pathResult",
      //   pathResult
      // );
      return pathResult;
    } catch (error) {
      log.error(
        "transformer_resolveReference failed, reference not found for step",
        step,
        "transformerInnerReference=",
        transformerInnerReference,
        "could not find",
        transformerInnerReference.referencePath,
        "in",
        bank
      );
      return new TransformerFailure({
        queryFailure: "FailedTransformer_getFromContext",
        transformerPath: [...transformerPath, usedReference],
        failureOrigin: ["transformer_resolveReference"],
        queryReference: JSON.stringify(transformerInnerReference.referencePath),
        failureMessage:
          "no referencePath " +
          transformerInnerReference.referencePath.join(".") +
          " found in queryContext",
        // queryContext: JSON.stringify(Object.keys(bank)),
        // queryContext: JSON.stringify(bank),
        queryContext: bank as any,
      });
    }
  }
}

// // ################################################################################################
// // almost duplicate from QuerySelectors.ts
// // type defined in function of the types of queryParams and contextResults
// // getFromContext<A> -> A
// // getFromParameters<A> -> A
// // constantUuid -> Uuid
// // constantString -> string
export function transformer_InnerReference_resolve(
  step: Step,
  transformerPath: string[],
  transformerInnerReference:
    // | CoreTransformerForBuildPlusRuntime_constants // TODO add TransformerForRuntime_constants
    // | TransformerForBuild_InnerReference
    | CoreTransformerForBuildPlusRuntime_InnerReference,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  // TODO: copy / paste (almost?) from query parameter lookup!
  // log.info(
  //   "transformer_InnerReference_resolve called for transformerInnerReference=",
  //   transformerInnerReference,
  //   "queryParams=",
  //   Object.keys(queryParams),
  //   "contextResults=",
  //   Object.keys(contextResults ?? {})
  // );
  const localQueryParams = transformerParams ?? {};
  const localContextResults = contextResults ?? {};
  if (
    step == "build" &&
    ((transformerInnerReference as any).interpolation ?? "build") == "runtime"
  ) {
    log.warn(
      "transformer_InnerReference_resolve called for runtime interpolation in build step",
      transformerInnerReference
    );
    return transformerInnerReference;
  }

  let result: TransformerReturnType<any> = undefined;
  switch (transformerInnerReference.transformerType) {
    case "returnValue": {
      result = transformerInnerReference.value;
      break;
    }
    case "generateUuid": {
      result = uuidv4();
      break;
    }
    case "mustacheStringTemplate": {
      result = defaultTransformers.transformer_mustacheStringTemplate_apply(
        step,
        transformerPath,
        "NO NAME",
        transformerInnerReference,
        resolveBuildTransformersTo,
        modelEnvironment,
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "getFromContext": {
      if (step == "build") {
        // no resolution in case of build step
        result = transformerInnerReference;
        // return new TransformerFailure({
        //   queryFailure: "ReferenceNotFound",
        //   failureOrigin: ["transformer_InnerReference_resolve"],
        //   queryReference: transformerInnerReference.referenceName,
        //   failureMessage: "getFromContext not allowed in build step, all context references must be resolved at runtime",
        //   queryContext: "getFromContext not allowed in build step, all context references must be resolved at runtime",
        // });
      } else {
        result = transformer_resolveReference(
          step,
          transformerPath,
          transformerInnerReference as any, // TODO: fix type
          "context",
          localQueryParams,
          localContextResults
        );
      }
      break;
    }
    case "getFromParameters": {
      // RESOLVING EVERYTHING AT RUNTIME
      result = transformer_resolveReference(
        step,
        transformerPath,
        transformerInnerReference,
        "param",
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "accessDynamicPath": {
      result = defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        transformerPath,
        "none",
        transformerInnerReference as any, // TODO: fix type
        resolveBuildTransformersTo,
        modelEnvironment,
        localQueryParams,
        localContextResults
      );
      break;
    }
    default: {
      // throw new Error(
      //   "transformer_InnerReference_resolve failed, unknown transformerType for transformer=" +
      //     transformerInnerReference
      // );
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["transformer_InnerReference_resolve"],
        failureMessage:
          "transformer_InnerReference_resolve failed, unknown transformerType for transformer=" +
          transformerInnerReference,
        queryContext:
          "transformer_InnerReference_resolve failed, unknown transformerType for transformer=" +
          transformerInnerReference,
        queryParameters: transformerInnerReference as any,
      });
      break;
    }
  }
  // log.info(
  //   "transformer_InnerReference_resolve resolved for",
  //   "step",
  //   step,
  //   "transformerInnerReference=",
  //   JSON.stringify(transformerInnerReference, null, 2),
  //   "result",
  //   JSON.stringify(result, null, 2),
  // );
  return result;
}

// ################################################################################################
// string -> string
// or
// string, <A> -> A
export function transformer_mustacheStringTemplate_apply(
  step: Step,
  transformerPath: string[],
  objectName: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_mustacheStringTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  try {
    // log.info(
    //   "transformer_mustacheStringTemplate_apply called for transformer",
    //   transformer,
    //   "queryParams",
    //   queryParams,
    //   // JSON.stringify(Object.keys(queryParams), null, 2),
    //   "contextResults",
    //   contextResults
    //   // JSON.stringify(Object.keys(contextResults ?? {}), null, 2)
    // );
    const result = mustache.render(
      transformer.definition,
      ((transformer as any)["interpolation"] ?? "build") == "runtime" ? contextResults : queryParams
    );
    // log.info("transformer_mustacheStringTemplate_apply result:", result);
    return result;
  } catch (error: any) {
    log.error(
      "transformer_mustacheStringTemplate_apply error for",
      transformer,
      "queryParams",
      JSON.stringify(queryParams, null, 2),
      "contextResults",
      JSON.stringify(contextResults, null, 2),
      "error:",
      error
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer_mustache",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["transformer_mustacheStringTemplate_apply"],
      // queryReference: transformer,
      query: transformer as any,
      queryContext: "error in transformer_mustacheStringTemplate_apply, could not render template.",
      innerError: error,
    });
  }
}

// ################################################################################################
export function transformer_dynamicObjectAccess_apply(
  step: Step,
  transformerPath: string[],
  objectName: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_accessDynamicPath,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const result = (transformer.objectAccessPath.reduce as any)(
    // triggers "error TS2349: This expression is not callable" in tsc. Not in eslint, though!
    ((acc: any, currentPathElement: any): any => {
      switch (typeof currentPathElement) {
        case "string": {
          if (!acc) {
            return new TransformerFailure({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find key: " +
                JSON.stringify(currentPathElement, null, 2),
            });
          }
          const innerResult = acc[currentPathElement];
          // log.info(
          //   "innerTransformer_apply transformer_dynamicObjectAccess_apply (string) for",
          //   transformer,
          //   "path element",
          //   currentPathElement,
          //   "used as key",
          //   "to be applied on acc",
          //   acc,
          //   "result",
          //   innerResult
          // );
          return innerResult;
          break;
        }
        case "object": {
          if (Array.isArray(currentPathElement)) {
            // throw new Error("transformer_dynamicObjectAccess_apply can not handle arrays");
            return new TransformerFailure({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: transformer as any,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find key: " +
                JSON.stringify(currentPathElement, null, 2),
            });
          }
          if (!currentPathElement.transformerType) {
            // throw new Error("transformer_dynamicObjectAccess_apply can not handle objects without transformerType");
            return new TransformerFailure({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: transformer as any,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find attribute transformerType in: " +
                JSON.stringify(currentPathElement, null, 2),
            });
          }
          const key = defaultTransformers.transformer_extended_apply(
            step,
            transformerPath,
            "NO NAME",
            currentPathElement,
            resolveBuildTransformersTo,
            modelEnvironment,
            transformerParams,
            contextResults,
            reduxDeploymentsState
          );
          if (key instanceof TransformerFailure) {
            return new TransformerFailure({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find key: " +
                JSON.stringify(key, null, 2),
            });
          }
          const innerResult = acc ? acc[key] : key;
          // log.info(
          //   "innerTransformer_apply transformer_dynamicObjectAccess_apply (object) for",
          //   transformer,
          //   "path element",
          //   currentPathElement,
          //   "resolved key",
          //   key,
          //   "to be applied on acc",
          //   acc,
          //   "result",
          //   innerResult
          // );
          return innerResult;
        }
        case "number":
        case "bigint":
        case "boolean":
        case "symbol":
        case "undefined":
        case "function": {
          // throw new Error("transformer_dynamicObjectAccess_apply can not handle " + typeof currentPathElement);
          return new TransformerFailure({
            queryFailure: "FailedTransformer_dynamicObjectAccess",
            transformerPath, //: [...transformerPath, transformer.transformerType],
            failureOrigin: ["transformer_dynamicObjectAccess_apply"],
            query: transformer as any,
            queryContext:
              "error in transformer_dynamicObjectAccess_apply, could not find key: " +
              JSON.stringify(currentPathElement, null, 2),
            queryParameters: currentPathElement,
          });
        }
      }
    }) as (acc: any, current: any) => any,
    undefined // !?! this can not work, it must be the object to be accessed
  );
  return result;
}

// ################################################################################################
export function handleCountTransformer(
  step: Step,
  transformerPath: string[] = [],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_aggregate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    label
  );
  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "handleCountTransformer extractorTransformer count can not apply to failed resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleCountTransformer"],
      queryContext: "count can not apply to failed resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "innerTransformer_apply extractorTransformer count can not apply to resolvedReference of wrong type",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleCountTransformer"],
      queryContext:
        "count can not apply to resolvedReference of wrong type: " + typeof resolvedReference,
      queryParameters: resolvedReference,
    });
  }

  // Determine aggregate function: default to "count" for backward compat
  const aggFunction = transformer.function;
  // AGG-3: When function is explicitly specified, use function name as result key.
  // When no function specified (legacy), use "aggregate" as result key for backward compat.
  const resultKey = aggFunction ?? "aggregate";

  if (transformer.groupBy) {
    // Handle both single string and string array groupBy
    const groupByArray: string[] = Array.isArray(transformer.groupBy)
      ? transformer.groupBy
      : [transformer.groupBy];

    const groupByMap = new Map<string, { attributes: Record<string, any>; aggValue: AggAccumulator }>();

    for (const entry of resolvedReference) {
      const attributes: Record<string, any> = {};
      for (const attr of groupByArray) {
        attributes[attr] = (entry as any)[attr];
      }
      const compositeKey = JSON.stringify(attributes);

      if (groupByMap.has(compositeKey)) {
        const existing = groupByMap.get(compositeKey)!;
        accumulateAggValue(existing.aggValue, entry, aggFunction, transformer.attribute, transformer.distinct, transformer.attributeObject);
      } else {
        groupByMap.set(compositeKey, {
          attributes,
          aggValue: initAggValue(entry, aggFunction, transformer.attribute, transformer.distinct, transformer.attributeObject),
        });
      }
    }

    let result = Array.from(groupByMap.values())
      .map(({ attributes, aggValue }) => ({
        ...attributes,
        [resultKey]: finalizeAggValue(aggValue, aggFunction),
      }))
      .sort((a, b) => {
        for (const attr of groupByArray) {
          if (a[attr] < b[attr]) return -1;
          if (a[attr] > b[attr]) return 1;
        }
        return 0;
      });

    // AGG-2: having clause - filter groups after aggregation
    if (transformer.having) {
      result = result.filter((row) => {
        const havingResult = defaultTransformers.transformer_extended_apply(
          step,
          [...transformerPath, "having"],
          label,
          transformer.having,
          resolveBuildTransformersTo,
          modelEnvironment,
          transformerParams,
          { ...contextResults, aggregateValue: row[resultKey] },
        );
        if (havingResult instanceof TransformerFailure) {
          return false;
        }
        return !!havingResult;
      });
    }

    return result;
  } else {
    // Ungrouped aggregation
    const aggValue = resolvedReference.reduce(
      (acc: any, entry: any) => {
        accumulateAggValue(acc, entry, aggFunction, transformer.attribute, transformer.distinct, transformer.attributeObject);
        return acc;
      },
      initAggValueForEmpty(aggFunction, transformer.distinct),
    );

    let result = [{ [resultKey]: finalizeAggValue(aggValue, aggFunction) }];

    // AGG-2: having clause for ungrouped (rare but consistent)
    if (transformer.having) {
      result = result.filter((row) => {
        const havingResult = defaultTransformers.transformer_extended_apply(
          step,
          [...transformerPath, "having"],
          label,
          transformer.having,
          resolveBuildTransformersTo,
          modelEnvironment,
          transformerParams,
          { ...contextResults, aggregateValue: row[resultKey] },
        );
        if (havingResult instanceof TransformerFailure) {
          return false;
        }
        return !!havingResult;
      });
    }

    return result;
  }
}

// ################################################################################################
// Helper functions for aggregate computation
// ################################################################################################
// Returns true if val is null/undefined, or if val is a plain object where every value is null/undefined
function isNullOrAllNull(val: any): boolean {
  if (val == null) return true;
  if (typeof val === "object" && !Array.isArray(val)) {
    return Object.values(val).every((v) => v == null);
  }
  return false;
}

type AggAccumulator = {
  count: number;
  sum?: number;
  min?: number;
  max?: number;
  values?: any[];
  distinctSet?: Set<string>;
};

function initAggValueForEmpty(
  aggFunction: string | undefined,
  distinct: boolean | undefined,
): AggAccumulator {
  return {
    count: 0,
    sum: 0,
    values: [],
    distinctSet: distinct ? new Set() : undefined,
  };
}

function initAggValue(
  entry: any,
  aggFunction: string | undefined,
  attribute: string | undefined,
  distinct: boolean | undefined,
  attributeObject?: Record<string, string>,
): AggAccumulator {
  // When attributeObject is set, build an object for json_agg/json_agg_strict
  const val = attributeObject != null
    ? Object.fromEntries(Object.entries(attributeObject).map(([k, v]) => [k, entry[v]]))
    : attribute != null ? entry[attribute] : undefined;
  const acc: AggAccumulator = { count: 0, distinctSet: distinct ? new Set() : undefined };

  switch (aggFunction) {
    case "sum":
      acc.sum = typeof val === "number" ? val : 0;
      acc.count = 1;
      break;
    case "avg":
      acc.sum = typeof val === "number" ? val : 0;
      acc.count = 1;
      break;
    case "min":
      acc.min = typeof val === "number" ? val : undefined;
      acc.count = 1;
      break;
    case "max":
      acc.max = typeof val === "number" ? val : undefined;
      acc.count = 1;
      break;
    case "json_agg":
      acc.values = [val];
      acc.count = 1;
      break;
    case "json_agg_strict":
      acc.values = isNullOrAllNull(val) ? [] : [val];
      acc.count = 1;
      break;
    case "count":
      if (distinct && attribute != null) {
        acc.distinctSet!.add(JSON.stringify(val));
      }
      acc.count = 1;
      break;
    default:
      // Legacy "count" behavior (no function specified)
      acc.count = 1;
      break;
  }
  return acc;
}

function accumulateAggValue(
  acc: AggAccumulator,
  entry: any,
  aggFunction: string | undefined,
  attribute: string | undefined,
  distinct: boolean | undefined,
  attributeObject?: Record<string, string>,
): void {
  const val = attributeObject != null
    ? Object.fromEntries(Object.entries(attributeObject).map(([k, v]) => [k, entry[v]]))
    : attribute != null ? entry[attribute] : undefined;

  switch (aggFunction) {
    case "sum":
      acc.sum = (acc.sum ?? 0) + (typeof val === "number" ? val : 0);
      acc.count++;
      break;
    case "avg":
      acc.sum = (acc.sum ?? 0) + (typeof val === "number" ? val : 0);
      acc.count++;
      break;
    case "min":
      if (typeof val === "number") {
        acc.min = acc.min != null ? Math.min(acc.min, val) : val;
      }
      acc.count++;
      break;
    case "max":
      if (typeof val === "number") {
        acc.max = acc.max != null ? Math.max(acc.max, val) : val;
      }
      acc.count++;
      break;
    case "json_agg":
      acc.values = acc.values ?? [];
      acc.values.push(val);
      acc.count++;
      break;
    case "json_agg_strict":
      acc.values = acc.values ?? [];
      if (!isNullOrAllNull(val)) {
        acc.values.push(val);
      }
      acc.count++;
      break;
    case "count":
      if (distinct && attribute != null) {
        if (!acc.distinctSet) {
          acc.distinctSet = new Set();
        }
        acc.distinctSet.add(JSON.stringify(val));
      }
      acc.count++;
      break;
    default:
      // Legacy "count" behavior
      acc.count++;
      break;
  }
}

function finalizeAggValue(
  acc: AggAccumulator,
  aggFunction: string | undefined,
): any {
  switch (aggFunction) {
    case "sum":
      return acc.sum ?? 0;
    case "avg":
      return acc.count > 0 ? (acc.sum ?? 0) / acc.count : 0;
    case "min":
      return acc.min ?? 0;
    case "max":
      return acc.max ?? 0;
    case "json_agg":
    case "json_agg_strict":
      return acc.values ?? [];
    case "count":
      return acc.distinctSet ? acc.distinctSet.size : acc.count;
    default:
      // Legacy "count" behavior
      return acc.count;
  }
}
// ################################################################################################
export function handleUniqueTransformer(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_getUniqueValues,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    label
  );
  // log.info(
  //   "handleUniqueTransformer extractorTransformer getUniqueValues",
  //   label,
  //   "resolvedReference",
  //   resolvedReference
  // );

  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "handleUniqueTransformer extractorTransformer getUniqueValues can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleUniqueTransformer"],
      queryContext: "getUniqueValues can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "handleUniqueTransformer extractorTransformer getUniqueValues referencedExtractor can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleUniqueTransformer"],
      queryContext:
        "getUniqueValues can not apply to resolvedReference, wrong type: " +
        typeof resolvedReference,
      queryParameters: resolvedReference,
    });
  }

  const sortByAttribute = transformer.orderBy
    ? (a: any[]) =>
        a.sort((a, b) =>
          a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
            sensitivity: "base",
          })
        )
    : (a: any[]) => a;
  const result = new Set<string>();
  for (const entry of Object.entries(resolvedReference)) {
    result.add((entry[1] as any)[transformer.attribute]);
  }
  const resultDomainElement: TransformerReturnType<any> = sortByAttribute(
    [...result].map((e) => ({ [transformer.attribute]: e }))
  );
  // log.info(
  //   "handleUniqueTransformer extractorTransformer getUniqueValues",
  //   label,
  //   "result",
  //   resultDomainElement
  // );
  return resultDomainElement;
}

// ################################################################################################
export function handleListPickElementTransformer(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_pickFromList,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    label
  );
  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "handleListPickElementTransformer", step, "pickFromList can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      step,
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["innerTransformer_apply"],
      queryContext: "pickFromList can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "handleListPickElementTransformer extractorTransformer pickFromList can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["innerTransformer_apply"],
      queryContext:
        "pickFromList can not apply to resolvedReference, wrong type: " + typeof resolvedReference,
      queryParameters: resolvedReference,
    });
  }

  const orderByAttribute = transformer.orderBy ?? "";
  const sortByAttribute = transformer.orderBy
    ? (a: any[]) =>
        a.sort((a, b) =>
          a[orderByAttribute].localeCompare(b[orderByAttribute], "en", {
            sensitivity: "base",
          })
        )
    : (a: any[]) => a;

  try {
    const resolvedReferenceCopy = [...resolvedReference];
    const sortedResultArray = sortByAttribute(resolvedReferenceCopy);
    const accessIndex =
      transformer.index < 0 ? sortedResultArray.length - transformer.index : transformer.index;
    // if (transformer.index < 0 || sortedResultArray.length < transformer.index) {
    //   // return undefined;
    //   return new TransformerFailure({
    //     queryFailure: "FailedTransformer_pickFromList",
    //     failureOrigin: ["innerTransformer_apply"],
    //     queryContext: "pickFromList index out of bounds",
    //   });
    // } else {
    // POSTGERS SQL DOES NOT FAIL IF INDEX OUT OF BOUNDS, IT JUST RETURNS NO RESULT
    if (accessIndex < 0 || sortedResultArray.length <= accessIndex) {
      return undefined;
    }
    const result = sortedResultArray[transformer.index];
    // log.info(
    //   "handleListPickElementTransformer extractorTransformer pickFromList sorted resolvedReference",
    //   sortedResultArray,
    //   "index",
    //   transformer.index,
    //   "result",
    //   result,
    //   "transformer",
    //   JSON.stringify(transformer, null, 2)
    // );
    return result;
    // }
  } catch (error) {
    log.error("innerTransformer_apply extractorTransformer pickFromList failed", error);
    return new TransformerFailure({
      queryFailure: "FailedTransformer_pickFromList",
      failureOrigin: ["innerTransformer_apply"],
      queryContext: "pickFromList failed: " + error,
    });
  }
  // break;
}

// ################################################################################################
export function handleTransformer_FreeObjectTemplate(
  step: Step,
  transformerPath: string[] = [],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_createObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  log.info(
    "innerTransformer_apply createObject",
    JSON.stringify(transformer, null, 2),
    "step",
    step,
    "contextResults",
    JSON.stringify(Object.keys(contextResults ?? {}), null, 2)
    // JSON.stringify(contextResults, null, 2)
  );
  const result = Object.fromEntries(
    Object.entries(transformer.definition).map((objectTemplateEntry: [string, any]) => {
      return [
        objectTemplateEntry[0],
        defaultTransformers.transformer_extended_apply(
          step,
          [...transformerPath, objectTemplateEntry[0]],
          objectTemplateEntry[0],
          objectTemplateEntry[1],
          resolveBuildTransformersTo,
          modelEnvironment,
          transformerParams,
          contextResults,
          reduxDeploymentsState
        ),
      ];
    })
  );
  const hasFailures = Object.values(result).find((e) => e instanceof TransformerFailure);
  if (hasFailures) {
    log.error("handleTransformer_FreeObjectTemplate createObject hasFailures", hasFailures);
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleTransformer_FreeObjectTemplate"],
      queryContext: "createObject hasFailures",
      innerError: hasFailures,
    });
  }
  // log.info(
  //   "handleTransformer_FreeObjectTemplate createObject for",
  //   label,
  //   "step",
  //   step,
  //   "result",
  //   JSON.stringify(transformer, null, 2)
  // );
  return result;
}

// ################################################################################################
export function handleTransformer_getObjectEntries(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_getObjectEntries,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    queryParams,
    contextResults,
    label
  );
  // log.info("handleTransformer_getObjectEntries referencedExtractor=", resolvedReference);

  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "handleTransformer_getObjectEntries can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleTransformer_getObjectEntries"],
      queryContext: "handleTransformer_getObjectEntries can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (!(typeof resolvedReference == "object") || Array.isArray(resolvedReference)) {
    const failure: TransformerFailure = new TransformerFailure({
      queryFailure: "FailedTransformer_getObjectEntries",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureMessage:
        "handleTransformer_getObjectEntries called on something that is not an object: " +
        typeof resolvedReference,
      // queryParameters: JSON.stringify(resolvedReference, null, 2),
      queryParameters: resolvedReference,
    });
    log.error("handleTransformer_getObjectEntries resolvedReference", resolvedReference);
    return failure;
  }
  // log.info(
  //   "handleTransformer_getObjectEntries resolvedReference",
  //   resolvedReference
  // );
  return Object.entries(resolvedReference);
}

// ################################################################################################
export function handleTransformer_getObjectValues(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_getObjectValues,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    label
  );
  if (resolvedReference instanceof TransformerFailure) {
    log.error(
      "handleTransformer_getObjectValues can not apply to resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleTransformer_getObjectValues"],
      queryContext: "handleTransformer_getObjectValues failed ro resolve resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || Array.isArray(resolvedReference)) {
    log.error(
      "innerTransformer_apply extractorTransformer count referencedExtractor resolvedReference",
      resolvedReference
    );
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath, //: [...transformerPath, transformer.transformerType],
      failureOrigin: ["handleTransformer_getObjectValues"],
      queryContext:
        "handleTransformer_getObjectValues resolvedReference is not an object: " +
        typeof resolvedReference,
    });
  }
  // log.info(
  //   "handleTransformer_getObjectValues resolvedReference",
  //   resolvedReference
  // );
  return Object.values(resolvedReference);
}

// ################################################################################################
export function handleTransformer_dataflowObject(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_dataflowObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const resultObject: Record<string, any> = {};
  for (const [key, value] of Object.entries(transformer.definition)) {
    // const currentContext = label ? { ...contextResults, [label]: resultObject } : { ...contextResults, ...resultObject }
    const currentContext = { ...contextResults, ...resultObject };
    // log.info(
    //   "handleTransformer_dataflowObject labeled",
    //   label,
    //   "key",
    //   key,
    //   "step",
    //   step,
    //   "calling with context",
    //   JSON.stringify(Object.keys(currentContext ?? {}), null, 2)
    // );
    resultObject[key] = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, key],
      key,
      value,
      resolveBuildTransformersTo,
      modelEnvironment,
      queryParams,
      currentContext,
      reduxDeploymentsState
    );
  }
  // return resultObject
  return transformer.target?resultObject[transformer.target]:resultObject;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function handleTransformer_ifThenElse(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_ifThenElse,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  // Evaluate the boolean condition given by the 'if' attribute
  const conditionValue = defaultTransformers.transformer_extended_apply(
    step,
    [...transformerPath, "if"],
    transformer.label ? transformer.label + "_if" : "if",
    transformer["if"],
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    reduxDeploymentsState
  );

  // Helper: apply the branch transformer, or return true/false if omitted.
  // When 'then' is omitted, a truthy condition returns true.
  // When 'else' is omitted, a falsy condition returns false.
  const applyBranch = (
    branchTransformer: CoreTransformerForBuildPlusRuntime_ifThenElse["then"],
    branchDefault: boolean,
    branchName: "then" | "else"
  ): TransformerReturnType<any> => {
    if (branchTransformer === undefined) {
      return branchDefault;
    }
    return defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, branchName],
      transformer.label ? transformer.label + "_" + branchName : branchName,
      branchTransformer,
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState
    );
  };

  const condition = !!conditionValue;

  log.info(
    "handleTransformer_ifThenElse",
    "label",
    label,
    "condition result",
    condition ? "THEN" : "ELSE",
  );
  return condition
    ? applyBranch(transformer.then, true, "then")
    : applyBranch(transformer.else, false, "else");
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function handleTransformer_boolExpr(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_boolExpr,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only
): TransformerReturnType<any> {
  const leftValue = defaultTransformers.transformer_extended_apply(
    step,
    [...transformerPath, "left"],
    transformer.label ? transformer.label + "_left" : "left",
    transformer.left,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    reduxDeploymentsState
  );
  // Unary operators (isNull, isNotNull, !) do not use right operand.
  const op = transformer.operator;
  const isUnaryOperator = op === "isNull" || op === "isNotNull" || op === "!";
  const rightValue = !isUnaryOperator && transformer.right !== undefined
    ? defaultTransformers.transformer_extended_apply(
        step,
        [...transformerPath, "right"],
        transformer.label ? transformer.label + "_right" : "right",
        transformer.right,
        resolveBuildTransformersTo,
        modelEnvironment,
        transformerParams,
        contextResults,
        reduxDeploymentsState
      )
    : undefined;

  let condition: boolean;
  switch (op) {
    case "==":        condition = leftValue == rightValue;       break;
    case "!=":        condition = leftValue != rightValue;       break;
    case "<":         condition = leftValue < rightValue;        break;
    case "<=":        condition = leftValue <= rightValue;       break;
    case ">":         condition = leftValue > rightValue;        break;
    case ">=":        condition = leftValue >= rightValue;       break;
    case "&&":        condition = !!(leftValue && rightValue);   break;
    case "||":        condition = !!(leftValue || rightValue);   break;
    case "isNull":    condition = leftValue == null;             break; // covers null and undefined via JS loose equality
    case "isNotNull": condition = leftValue != null;             break; // covers null and undefined via JS loose equality
    case "!":         condition = !leftValue;                    break; // JS boolean NOT: falsy = null, undefined, 0, false, "", NaN
    default:          condition = false;                         break;
  }

  // log.info(
  //   "handleTransformer_boolExpr",
  //   "label",
  //   label,
  //   "operator",
  //   op,
  //   "leftValue",
  //   leftValue,
  //   "rightValue",
  //   rightValue,
  //   "result",
  //   condition,
  // );
  return condition;
}

// ################################################################################################
/**
 * handleTransformer_plus
 * Implements the + operator for numbers, bigints, and strings.
 * - Numbers: Addition (5 + 3 + 2 = 10)
 * - Bigints: Addition (represented as strings in JSON)
 * - Strings: Concatenation ("Hello" + " " + "World" = "Hello World")
 * 
 * Evaluates arguments left-to-right (from index 0 to length-1).
 * 
 * Error cases (for SQL compatibility):
 * - Empty args array returns TransformerFailure
 * - Single element returns that element
 * - Mixed types (number + string, number + bigint) return TransformerFailure
 * - null/undefined operands return TransformerFailure
 */
export function handleTransformer_plus(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: {
    label?: string;
    interpolation?: "build" | "runtime";
    transformerType: "+";
    args: CoreTransformerForBuildPlusRuntime[];
  },
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined
): TransformerReturnType<any> {
  // Check for empty array
  if (!transformer.args || transformer.args.length === 0) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleTransformer_plus"],
      failureMessage: "Cannot apply + to empty args array",
    });
  }

  // Evaluate all arguments left-to-right
  const evaluatedArgs: any[] = [];
  for (let i = 0; i < transformer.args.length; i++) {
    const argValue = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "args", i.toString()],
      transformer.label ? `${transformer.label}_arg${i}` : `arg${i}`,
      transformer.args[i],
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState
    );

    // Check if argument evaluation failed
    if (argValue instanceof TransformerFailure) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["handleTransformer_plus"],
        failureMessage: `Failed to resolve argument at index ${i}`,
        innerError: argValue,
      });
    }

    evaluatedArgs.push(argValue);
  }

  // Single element - return it directly
  if (evaluatedArgs.length === 1) {
    return evaluatedArgs[0];
  }

  // Apply + operation left-to-right
  let result = evaluatedArgs[0];
  let resultType = typeof result;
  let resultIsBigintSchema = (transformer.args[0] as any)?.mlSchema?.type === "bigint";

  for (let i = 1; i < evaluatedArgs.length; i++) {
    const nextValue = evaluatedArgs[i];
    const nextType = typeof nextValue;
    const nextIsBigintSchema = (transformer.args[i] as any)?.mlSchema?.type === "bigint";

    // Handle null/undefined
    if (result === null || result === undefined || nextValue === null || nextValue === undefined) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["handleTransformer_plus"],
        failureMessage: `Cannot apply + to null/undefined at index ${i}: result=${result}, next=${nextValue}`,
      });
    }

    // Bigint + Bigint (via mlSchema or native bigint type)
    if (resultIsBigintSchema && nextIsBigintSchema) {
      try {
        result = (BigInt(result) + BigInt(nextValue)).toString();
        resultType = "string"; // Bigints are stored as strings
      } catch (e) {
        return new TransformerFailure({
          queryFailure: "FailedTransformer",
          transformerPath,
          failureOrigin: ["handleTransformer_plus"],
          failureMessage: `Failed to perform bigint addition at index ${i}: ${e}`,
        });
      }
    }
    // Native Bigint + Bigint
    else if (resultType === "bigint" && nextType === "bigint") {
      result = (result + nextValue).toString();
      resultType = "string";
    }
    // Number + Number
    else if (resultType === "number" && nextType === "number") {
      result = result + nextValue;
    }
    // String + String (concatenation)
    else if (resultType === "string" && nextType === "string") {
      // If one has bigint schema and other doesn't, it's a type mismatch
      if (resultIsBigintSchema !== nextIsBigintSchema) {
        return new TransformerFailure({
          queryFailure: "FailedTransformer",
          transformerPath,
          failureOrigin: ["handleTransformer_plus"],
          failureMessage: `Type mismatch at index ${i}: cannot apply + between bigint and string.`,
        });
      }
      // Regular string concatenation
      result = result + nextValue;
    }
    // Type mismatch
    else {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["handleTransformer_plus"],
        failureMessage: `Type mismatch at index ${i}: cannot apply + to ${resultType} and ${nextType}. All operands must be of the same type (number, string, or bigint).`,
        queryContext: {
          result,
          nextValue,
        } as any
      });
    }

    // Update resultIsBigintSchema for next iteration
    resultIsBigintSchema = nextIsBigintSchema;
  }

  return result;
}

// ################################################################################################
/**
 * handleTransformer_case
 * Implements a CASE WHEN expression, matching a discriminator value against a list of when/then clauses.
 * Similar to SQL: CASE discriminator WHEN value1 THEN result1 WHEN value2 THEN result2 ELSE default END
 */
export function handleTransformer_case(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: {
    label?: string;
    interpolation?: "build" | "runtime";
    transformerType: "case";
    discriminator: CoreTransformerForBuildPlusRuntime;
    whens: Array<{
      when: CoreTransformerForBuildPlusRuntime;
      then: CoreTransformerForBuildPlusRuntime;
    }>;
    else?: CoreTransformerForBuildPlusRuntime;
  },
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined
): TransformerReturnType<any> {
  // Evaluate the discriminator value
  const discriminatorValue = defaultTransformers.transformer_extended_apply(
    step,
    [...transformerPath, "discriminator"],
    transformer.label ? transformer.label + "_discriminator" : "discriminator",
    transformer.discriminator,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    reduxDeploymentsState
  );

  // Iterate through when/then pairs to find a match
  for (let i = 0; i < transformer.whens.length; i++) {
    const whenClause = transformer.whens[i];
    const whenValue = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "whens", i.toString(), "when"],
      transformer.label ? transformer.label + `_when_${i}` : `when_${i}`,
      whenClause.when,
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState
    );

    // If discriminator matches when value, return the then result
    if (discriminatorValue == whenValue) {
      return defaultTransformers.transformer_extended_apply(
        step,
        [...transformerPath, "whens", i.toString(), "then"],
        transformer.label ? transformer.label + `_then_${i}` : `then_${i}`,
        whenClause.then,
        resolveBuildTransformersTo,
        modelEnvironment,
        transformerParams,
        contextResults,
        reduxDeploymentsState
      );
    }
  }

  // No match found, return else if provided, otherwise undefined
  if (transformer.else) {
    return defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "else"],
      transformer.label ? transformer.label + "_else" : "else",
      transformer.else,
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState
    );
  }

  return undefined;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function handleTransformer_constant(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_returnValue,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  if (transformer.interpolation == "runtime" && step == "build") {
    log.warn(
      "handleTransformer_constant with runtime interpolation called during build",
      transformer.label??transformer.transformerType
    );
    // return transformer.value;
  }
  switch (typeof transformer.value) {
    case "undefined":
    case "string":
    case "number":
    case "bigint":
    case "boolean": {
      return transformer.value;
    }
    case "object": {
      return transformer.value;
      // if (Array.isArray(transformer.value)) {
      //   return transformer.value
      // } else {
      //   // TODO: questionable, should "runtime" transformers only return arrays of objects, not objects directly?
      //   // This is likely done to get an identical result to the postgres implementation, where all runtime transformer executions return arrays (of objects or other types).
      //   return [transformer.value];
      // }
    }
    case "symbol":
    case "function": {
      return new TransformerFailure({
        queryFailure: "FailedTransformer_constant",
        transformerPath, //: [...transformerPath, transformer.transformerType],
        failureOrigin: ["handleTransformer_constant"],
        queryContext: "constantValue is not a string, number, bigint, boolean, or object",
      });
      break;
    }
    default: {
      return new TransformerFailure({
        queryFailure: "FailedTransformer_constant",
        transformerPath, //: [...transformerPath, transformer.transformerType],
        failureOrigin: ["handleTransformer_constant"],
        queryContext: "constantValue could not be handled",
      });
      break;
    }
  }
  // return transformer.value;
}

// ################################################################################################
export function handleTransformer_getFromContext(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_getFromContext,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformerPath,
    transformer,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults
  );
  const returnedValue: TransformerReturnType<any> =
    typeof transformer == "object" && (transformer as any).applyFunction
      ? (transformer as any).applyFunction(rawValue)
      : rawValue;
  return returnedValue;
}

// ################################################################################################
export function handleTransformer_getFromParameters(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_getFromParameters,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformerPath,
    transformer as any,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults
  );
  const returnedValue: TransformerReturnType<any> =
    typeof transformer == "object" && (transformer as any).applyFunction
      ? (transformer as any).applyFunction(rawValue)
      : rawValue;
  return returnedValue;
}

// ################################################################################################
export function handleTransformer_constantAsExtractor(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_constantAsExtractor,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  return transformer.value;
}

// ################################################################################################
export function handleTransformer_generateUuid(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: CoreTransformerForBuildPlusRuntime_generateUuid,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
): TransformerReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformerPath,
    transformer,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults
  );
  const returnedValue: TransformerReturnType<any> =
    typeof transformer == "object" && (transformer as any).applyFunction
      ? (transformer as any).applyFunction(rawValue)
      : rawValue;
  return returnedValue;
  // break;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object
export function innerTransformer_plainObject_apply(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
  deploymentUuid?: Uuid,
): TransformerReturnType<any> {
  // log.info(
  //   "innerTransformer_plainObject_apply called for object labeled",
  //   label,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   // "step==transformer.interpolation",
  //   // step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  const attributeEntries: [string, TransformerReturnType<DomainElementSuccess>][] = Object.entries(
    transformer
  ).map((objectTemplateEntry: [string, any]) => {
    // log.info("transformer_apply converting attribute",JSON.stringify(objectTemplateEntry, null, 2));
    return [
      objectTemplateEntry[0],
      defaultTransformers.transformer_extended_apply(
        step,
        [...transformerPath, objectTemplateEntry[0]],
        objectTemplateEntry[0],
        objectTemplateEntry[1],
        resolveBuildTransformersTo,
        modelEnvironment,
        transformerParams,
        contextResults,
        reduxDeploymentsState,
        deploymentUuid,
      ),
    ];
  });
  const failureIndex = attributeEntries.findIndex(
    (e) =>
      typeof e[1] == "object" &&
      e[1] != null &&
      !Array.isArray(e[1]) &&
      e[1].elementType == "failure"
  );
  if (failureIndex == -1) {
    const result = Object.fromEntries(attributeEntries.map((e) => [e[0], e[1]]));
    return result;
  } else {
    // log.info(
    //   "innerTransformer_plainObject_apply failed converting plain object",
    //   transformer,
    //   "with params",
    //   queryParams,
    //   "error in",
    //   label,
    //   "in",
    //   JSON.stringify(attributeEntries[failureIndex], null, 2)
    // );
    const errorToReturn = new TransformerFailure({
      queryFailure: "ReferenceNotFound",
      transformerPath: [...transformerPath, attributeEntries[failureIndex][0]],
      failureOrigin: ["innerTransformer_plainObject_apply"],
      innerError: attributeEntries[failureIndex][1] as any, // TODO: type!
      queryContext: "error in attribute: " + attributeEntries[failureIndex][0],
    });
    // log.info(
    //   "innerTransformer_plainObject_apply failed converting plain object, errorToReturn",
    //   JSON.stringify(errorToReturn, null, 2)
    // )
    return errorToReturn;
  }
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object
export function innerTransformer_array_apply(
  step: Step,
  transformerPath: string[] = [],
  objectName: string | undefined,
  transformer: any[],
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
  deploymentUuid?: Uuid,
): TransformerReturnType<any> {
  // log.info(
  //   "innerTransformer_array_apply called for object named",
  //   objectName,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   // "step==transformer.interpolation",
  //   // step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  const subObject = transformer.map((e, index) =>
    transformer_extended_apply(
      step,
      [...transformerPath, index.toString()],
      index.toString(),
      e,
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState,
      deploymentUuid,
    )
  );
  const failureIndex = subObject.findIndex(
    (e) => typeof e == "object" && e != null && !Array.isArray(e) && e.elementType == "failure"
  );
  if (failureIndex == -1) {
    return subObject;
  } else {
    // log.error(
    //   "innerTransformer_array_apply failed converting array",
    //   "for step=",
    //   step,
    //   "array=",
    //   JSON.stringify(transformer, null, 2),
    //   "at index",
    //   failureIndex,
    //   "with params",
    //   queryParams,
    //   "error in",
    //   JSON.stringify(subObject[failureIndex], null, 2)
    // );
    // log.error(
    //   "innerTransformer_array_apply failed converting array 2",
    // )

    const errorToReturn = new TransformerFailure({
      queryFailure: "ReferenceNotFound",
      transformerPath: [...transformerPath, failureIndex.toString()],
      failureOrigin: ["innerTransformer_array_apply"],
      innerError: subObject[failureIndex],
      queryContext:
        "failed to transform object attribute for array index " +
        failureIndex +
        // " failure " +
        // JSON.stringify(subObject[failureIndex]) +
        " in transformer " +
        transformer,
      // JSON.stringify(transformer[failureIndex]),
    });
    // log.error(
    //   "innerTransformer_array_apply failed converting array 3",
    // )
    // log.info(
    //   "innerTransformer_array_apply failed converting array, errorToReturn",
    //   JSON.stringify(errorToReturn, null, 2)
    // );
    // log.error(
    //   "innerTransformer_array_apply failed converting array 4",
    // )

    return errorToReturn;
  }
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object
export function transformer_extended_apply(
  step: Step,
  transformerPath: string[] = [],
  label: string | undefined,
  transformer:
    // | TransformerForBuild
    | CoreTransformerForBuildPlusRuntime
    | undefined,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
  deploymentUuid?: Uuid,
): TransformerReturnType<any> {
  const transformerLabel = label ?? (transformer as any)?.label ?? (transformer as any)?.transformerType ?? "unnamed_transformer";
  if ((transformer as any)?.transformerType == "returnValue") {
    log.info(
      "transformer_extended_apply called for label",
      label,
      "step:",
      step,
      "transformer.interpolation:",
      (transformer as any)?.interpolation ?? "build",
      " step==transformer.interpolation ",
      ((transformer as any)?.interpolation ?? "build") == step,
      typeof transformer,
      "transformer",
      JSON.stringify(transformer, null, 2),
      "queryParams elements",
      Object.keys(transformerParams ?? {}),
      // // JSON.stringify(Object.keys(queryParams??{}), null, 2),
      "contextResults elements",
      Object.keys(contextResults ?? {})
      // contextResults
      // // JSON.stringify(Object.keys(contextResults??{}), null, 2)
    );
  }
  let result: TransformerReturnType<any> = undefined as any;

  if (typeof transformer == "object" && transformer != null) {
    if (transformer instanceof Array) {
      result = innerTransformer_array_apply(
        step,
        transformerPath,
        label,
        transformer,
        resolveBuildTransformersTo,
        modelEnvironment,
        transformerParams,
        contextResults,
        reduxDeploymentsState,
        deploymentUuid,
      );
      // log.info(
      //   "transformer_extended_apply innerTransformer_array_apply result",
      //   JSON.stringify(result, null, 2)
      // );
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      const newResolveBuildTransformersTo: ResolveBuildTransformersTo =
        ((transformer as any)["interpolation"] ?? "build" == step) &&
        resolveBuildTransformersTo == "constantTransformer"
          ? "value" // HACK!
          : resolveBuildTransformersTo;
      if (transformer["transformerType"] != undefined) {
        if (step == "runtime" || ((transformer as any)["interpolation"] ?? "build") == "build") {
          // log.info("transformer_extended_apply interpreting transformer!");
          let preResult;
          const foundApplicationTransformer =
            applicationTransformerDefinitions[(transformer as any).transformerType];
          // log.info(
          //   "transformer_extended_apply foundApplicationTransformer",
          //   foundApplicationTransformer,
          //   "for transformer",
          //   JSON.stringify(transformer, null, 2),
          //   "applicationTransformerDefinitions",
          //   Object.keys(applicationTransformerDefinitions)
          // );
          if (!foundApplicationTransformer) {
            log.error(
              "transformer_extended_apply failed for",
              transformerLabel,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2)
            );
            preResult = new TransformerFailure({
              queryFailure: "TransformerNotFound",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_extended_apply"],
              queryContext: "transformer " + (transformer as any).transformerType + " does not exist",
              queryParameters: JSON.stringify(transformer),
            });
          }
          // log.info(
          //   "transformer_extended_apply foundApplicationTransformer",
          //   JSON.stringify(foundApplicationTransformer, null, 2)
          // );
          // log.info(
          //   "transformer_extended_apply foundApplicationTransformer.transformerImplementation",
          //   JSON.stringify(foundApplicationTransformer.transformerImplementation, null, 2)
          // );
          if (!foundApplicationTransformer.transformerImplementation) {
            log.error(
              "transformer_extended_apply failed for",
              label,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2)
            );
            preResult = new TransformerFailure({
              queryFailure: "FailedTransformer",
              transformerPath, //: [...transformerPath, transformer.transformerType],
              failureOrigin: ["transformer_extended_apply"],
              queryContext:
                "transformerImplementation for transformer" +
                JSON.stringify(transformer) +
                " not found",
              queryParameters: transformer as any,
            });
          }
          switch (
            foundApplicationTransformer.transformerImplementation.transformerImplementationType
          ) {
            case "libraryImplementation": {
              const transformerIndexName: string =
                foundApplicationTransformer?.transformerImplementation
                  ?.inMemoryImplementationFunctionName;
              const transformerFunction: ITransformerHandler<any> =
                inMemoryTransformerImplementations[transformerIndexName];
              if (
                !foundApplicationTransformer.transformerImplementation
                  .inMemoryImplementationFunctionName ||
                !inMemoryTransformerImplementations[
                  foundApplicationTransformer.transformerImplementation
                    .inMemoryImplementationFunctionName
                ]
              ) {
                log.error(
                  "transformer_extended_apply failed for",
                  transformerLabel,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2)
                );
                preResult = new TransformerFailure({
                  // queryFailure: "FailedTransformer",
                  queryFailure: "TransformerNotFound",
                  transformerPath, //: [...transformerPath, transformer.transformerType],
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext:
                    "transformerImplementation " +
                    (foundApplicationTransformer as any).transformerImplementation
                      .inMemoryImplementationFunctionName +
                    " not found",
                  queryParameters: transformer as any,
                });
              }
              // log.info("transformer_extended_apply calling transformerFunction");
              const result = transformerFunction(
                step,
                transformerPath,
                label,
                transformer,
                newResolveBuildTransformersTo,
                modelEnvironment,
                transformerParams,
                contextResults,
                reduxDeploymentsState,
                deploymentUuid,
              );
              // log.info(
              //   "transformer_extended_apply called transformerFunction",
              //   "result",
              //   JSON.stringify(result, null, 2)
              // );
              return result;
              // throw new Error(
              //   "transformer_extended_apply failed for " +
              //     label +
              //     " using to resolve build transformers for step: " +
              //     step +
              //     " transformer " +
              //     JSON.stringify(transformer, null, 2) +
              //     " transformerImplementation " +
              //     JSON.stringify(foundApplicationTransformer.transformerImplementation, null, 2)
              // );
              break;
            }
            case "transformer": {
              // TODO: clean up environment, only parameters to transformer should be passed
              // evaluate transformer parameters
              if (!foundApplicationTransformer.transformerInterface) {
                log.error(
                  "transformer_extended_apply failed for",
                  transformerLabel,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2)
                );
                preResult = new TransformerFailure({
                  queryFailure: "FailedTransformer",
                  transformerPath, //: [...transformerPath, transformer.transformerType],
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext:
                    "transformer " + (transformer as any).transformerType + " not found",
                  queryParameters: transformer as any,
                });
                return preResult;
              }
              // CALL BY-VALUE: evaluate parameters to transformer first
              const evaluatedParams = Object.fromEntries(
                Object.keys(
                  foundApplicationTransformer.transformerInterface.transformerParameterSchema
                    .transformerDefinition.definition
                ).map((param) => {
                  return [
                    param,
                    defaultTransformers.transformer_extended_apply(
                      step,
                      [...transformerPath, param],
                      label,
                      (transformer as any)[param],
                      resolveBuildTransformersTo,
                      modelEnvironment,
                      transformerParams,
                      contextResults,
                      reduxDeploymentsState,
                      deploymentUuid
                    ),
                  ];
                })
              );
              const errorsInParams = Object.entries(evaluatedParams).filter(
                (e) =>
                  typeof e[1] == "object" &&
                  e[1] != null &&
                  !Array.isArray(e[1]) &&
                  e[1] instanceof TransformerFailure
              );
              if (errorsInParams.length > 0) {
                log.error(
                  "transformer_extended_apply failed for",
                  transformerLabel,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2),
                  "errorsInParams",
                  JSON.stringify(errorsInParams, null, 2)
                );
                return new TransformerFailure({
                  queryFailure: "FailedTransformer",
                  transformerPath, //: [...transformerPath, transformer.transformerType],
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext:
                    "errors in parameters for transformer " +
                    (transformer as any).transformerType +
                    ": " +
                    errorsInParams.map((e) => e[0] + " -> " + JSON.stringify(e[1])).join(", "),
                  queryParameters: transformer as any,
                });
              }
              log.info(
                "transformer_extended_apply calling transformerImplementation for",
                label,
                transformerLabel,
                "with evaluatedParams",
                Object.keys(evaluatedParams),
                evaluatedParams
              );
              const newContextResults = { ...contextResults, ...evaluatedParams };
              preResult = transformer_extended_apply(
                "runtime", // evaluating the transformer with its params. If we're there, it means (full) evaluation must take place.
                [...transformerPath, "transformerImplementation"],
                label,
                foundApplicationTransformer.transformerImplementation.definition,
                newResolveBuildTransformersTo,
                modelEnvironment,
                transformerParams,
                newContextResults,
                reduxDeploymentsState,
                deploymentUuid
              );
              log.info(
                "transformer_extended_apply transformerImplementation returning for",
                transformerLabel,
                "step:",
                step,
                // "transformer.interpolation:",
                // (transformer as any)?.interpolation ?? "build",
                // ((transformer as any)?.interpolation ?? "build") == step,
                // typeof transformer,
                // "transformer",
                // JSON.stringify(transformer, null, 2),
                "context",
                newContextResults,
                "result",
                JSON.stringify(preResult, null, 2)
              );

              // }
              break;
            }
            default: {
              return new TransformerFailure({
                queryFailure: "FailedTransformer",
                transformerPath, //: [...transformerPath, transformer.transformerType],
                failureOrigin: ["transformer_extended_apply"],
                queryContext:
                  "transformerImplementation " +
                  (transformer as any).transformerImplementation +
                  " not found",
                queryParameters: transformer as any,
              });
              break;
            }
          }
          if (preResult instanceof TransformerFailure) {
            log.error(
              "transformer_extended_apply failed for",
              transformerLabel,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2),
              "result",
              JSON.stringify(preResult, null, 2)
            );
            return preResult;
          } else {
          //   log.info(
          //     "transformer_extended_apply transformerImplementation returning for",
          //     transformerLabel,
          //     "step:",
          //     step,
          //     // "transformer.interpolation:",
          //     // (transformer as any)?.interpolation ?? "build",
          //     // ((transformer as any)?.interpolation ?? "build") == step,
          //     // typeof transformer,
          //     // "transformer",
          //     // JSON.stringify(transformer, null, 2),
          //     "context",
          //     { ...contextResults, ...evaluatedParams },
          //     "result",
          //     JSON.stringify(preResult, null, 2)
          //   );

            if (
              ((transformer as any)["interpolation"] ?? "build" == "build") &&
              resolveBuildTransformersTo == "constantTransformer"
            ) {
              result = {
                transformerType: "returnValue",
                value: preResult,
              };
            } else {
              result = preResult;
            }
          }
        } else {
          // log.warn(
          //   "transformer_extended_apply called for",
          //   label,
          //   "treated as plain object for step:",
          //   step,
          //   "transformer",
          //   JSON.stringify(transformer, null, 2)
          // );
          // we have a transformerType but we're in the wrong step, treat as plain object in the case this is not a "returnValue" transformer
          if ((transformer as any).transformerType !== "returnValue") {
            result = innerTransformer_plainObject_apply(
              step,
              transformerPath,
              label,
              transformer,
              newResolveBuildTransformersTo,
              modelEnvironment,
              transformerParams,
              contextResults,
              reduxDeploymentsState,
              deploymentUuid,
            );
          } else {
            log.info(
              "transformer_extended_apply called for",
              label,
              "protects its returnValue for step:",
              step,
              "transformer",
              transformer,
            );
          }
          result = transformer;
          // log.info(
          //   "transformer_extended_apply called for",
          //   label,
          //   "innerTransformer_plainObject_apply result",
          //   JSON.stringify(result, null, 2),
          // );
        }
      } else {
        // log.info("transformer_extended_apply handles plain object with keys:", Object.keys(transformer));
        result = innerTransformer_plainObject_apply(
          step,
          transformerPath,
          label,
          transformer,
          newResolveBuildTransformersTo,
          modelEnvironment,
          transformerParams,
          contextResults,
          reduxDeploymentsState,
          deploymentUuid,
        );
        // log.info(
        //   "transformer_extended_apply called for",
        //   label,
        //   "innerTransformer_plainObject_apply result",
        //   JSON.stringify(result, null, 2),
        // );
      }
    }
    // log.info(
    //   "transformer_extended_apply returning for",
    //   label,
    //   "step:",
    //   step,
    //   // "transformer.interpolation:",
    //   // (transformer as any)?.interpolation ?? "build",
    //   // ((transformer as any)?.interpolation ?? "build") == step,
    //   // typeof transformer,
    //   // "transformer",
    //   // JSON.stringify(transformer, null, 2),
    //   "result",
    //   JSON.stringify(result, null, 2),
    // );
    return result;
  } else {
    // plain value
    return transformer;
  }

  // log.info(
  //   "transformer_extended_apply called for",
  //   label,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   ((transformer as any)?.interpolation??"build") == step,
  //   typeof transformer,
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "result",
  //   JSON.stringify(result, null, 2),
  //   // "queryParams elements",
  //   // Object.keys(queryParams??{}),
  //   // // JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   // "contextResults elements",
  //   // Object.keys(contextResults??{})
  //   // // JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  // return result
}

// // ################################################################################################

// ################################################################################################
export function transformer_extended_apply_wrapper(
  activityTracker: MiroirActivityTrackerInterface | undefined,
  step: Step,
  transformerPath: string[] = [],
  label: string | undefined,
  transformer:
    // | TransformerForBuild
    | CoreTransformerForBuildPlusRuntime,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>, // includes queryParams
  contextResults?: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo = "constantTransformer",
  reduxDeploymentsState?: ReduxDeploymentsState | undefined, // used by getDefaultValueForJzodSchemaWithResolution only, somewhat redundant with modelEnvironment
  deploymentUuid?: Uuid,
): TransformerReturnType<any> {
  log.info(
    "transformer_extended_apply_wrapper called for",
    "'" + label + "'",
    "step",
    step,
    "transformer",
    JSON.stringify(transformer, null, 2),
    "reduxDeploymentsState",
    reduxDeploymentsState,
    activityTracker ? "with activityTracker" : "without activityTracker",
    "isTransformerTrackingEnabled():",
    activityTracker?.isTransformerTrackingEnabled(),
    "contextResults:",
    // contextResults ? Object.keys(contextResults) : "no contextResults",
    contextResults ? contextResults : "no contextResults",
    "transformerParams:",
    // Object.keys(transformerParams)
    transformerParams
    // "eventTracker?.isTransformerTrackingEnabled()",
    // eventTracker?.isTransformerTrackingEnabled()
  );
  // if (activityTracker?.isTransformerTrackingEnabled()) {
  //   const transformerType = (transformer as any)?.transformerType || "unknown";
  //   trackingId = activityTracker.startTransformer(
  //     label || transformerType,
  //     transformerType,
  //     step,
  //     {
  //       transformerParams: Object.keys(transformerParams ?? {}),
  //       contextResults: Object.keys(contextResults ?? {}),
  //       resolveBuildTransformersTo
  //     }
  //   );
  // }

  try {
    const result = transformer_extended_apply(
      step,
      transformerPath,
      label,
      transformer,
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState,
      deploymentUuid,
    );
    // log.info(
    //   "transformer_extended_apply_wrapper called for",
    //   label,
    //   "transformer_extended_apply result",
    //   result
    //   // JSON.stringify(result, null, 2),
    // );
    // if (result instanceof TransformerFailure) {
    if (result instanceof TransformerFailure) {
      // End transformer tracking with error

      log.error(
        "transformer_extended_apply_wrapper failed for",
        label ?? (transformer as any)["transformerType"],
        "step",
        step,
        "transformer",
        JSON.stringify(transformer, null, 2),
        "result",
        JSON.stringify(result, null, 2)
      );
      // if (activityTracker?.isTransformerTrackingEnabled() && trackingId) {
      //   // eventTracker.endTransformer(trackingId, undefined, result.queryFailure || "Transformer failed");
      //   activityTracker.endTransformer(trackingId, result, result.queryFailure || "Transformer failed");
      // }
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath: [...transformerPath, (transformer as any).transformerType],
        failureOrigin: ["transformer_extended_apply"],
        innerError: result,
        queryContext: "failed to transform object attribute",
        queryParameters: transformer as any,
      });
    } else {
      // End transformer tracking with success
      // if (activityTracker?.isTransformerTrackingEnabled() && trackingId) {
      //   activityTracker.endTransformer(trackingId, result);
      // }

      // log.info(
      //   "transformer_extended_apply_wrapper called for",
      //   label,
      //   "transformer_extended_apply result",
      //   JSON.stringify(result, null, 2),
      // );
      return result;
    }
  } catch (e) {
    // End transformer tracking with error

    log.error(
      "transformer_extended_apply_wrapper failed for",
      label,
      "step",
      step,
      "transformer",
      JSON.stringify(transformer, null, 2),
      "error",
      e
    );
    // if (activityTracker?.isTransformerTrackingEnabled() && trackingId) {
    //   activityTracker.endTransformer(trackingId, undefined, e instanceof Error ? e.message : String(e));
    // }
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath: transformerPath,
      failureOrigin: ["transformer_extended_apply"],
      innerError: serializeError(e) as any,
      queryContext: "failed to transform object attribute",
    });
  }
}
// ################################################################################################
export function applyTransformerDEFUNCT(t: Transformer, o: any): any {
  switch (t.transformerType) {
    case "recordOfTransformers": {
      // build object from record of transformers
      const result = Object.fromEntries(
        Object.entries(t.definition).map((e) => [e[0], applyTransformerDEFUNCT(e[1], o)])
      );
      // log.info("applyTransformer",t, "parameter", o, "return", result)
      return result;
    }
    case "objectTransformer": {
      // access object attribute
      const result = o[t.attributeName];
      return result;
      break;
    }
    default:
      throw new Error(`Transformer ${JSON.stringify(t)} can not be applied`);
      break;
  }
}

// ################################################################################################
export function getInnermostTransformerError(error: TransformerFailure): TransformerFailure {
  if (error.innerError) {
    if (
      typeof error.innerError === "object" &&
      error.innerError !== null
      // "innerError" in error.innerError
    ) {
      if (error.innerError instanceof TransformerFailure) {
        return getInnermostTransformerError(error.innerError as TransformerFailure);
      }
      // // record of ResolvedJzodSchemaReturnTypeError, take the first one
      // const firstError = Object.values(error.innerError)[0];
      // return getInnermostTransformerError(firstError as TransformerFailure);
    }
    // if (Array.isArray(error.innerError)) {
    //   // If innerError is an array, recursively check each error in the array
    //   return error.innerError.reduce((innermost, current) => {
    //     if (typeof current === "object") {
    //       return getInnermostJzodError(current);
    //     }
    //     return innermost;
    //   }, error);
    // }
  }
  return error;
}

// ################################################################################################
export function handleTransformer_ansiColumnsToJzodSchema(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: any,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined
): TransformerReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    transformerPath,
    resolveBuildTransformersTo,
    modelEnvironment,
    transformerParams,
    contextResults,
    label
  );

  if (resolvedReference instanceof TransformerFailure) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleTransformer_ansiColumnsToJzodSchema"],
      queryContext: "handleTransformer_ansiColumnsToJzodSchema can not resolve applyTo",
      innerError: resolvedReference,
    });
  }

  if (!Array.isArray(resolvedReference)) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleTransformer_ansiColumnsToJzodSchema"],
      failureMessage:
        "handleTransformer_ansiColumnsToJzodSchema called on something that is not an array: " +
        typeof resolvedReference,
    });
  }

  try {
    return ansiColumnsToJzodSchema(resolvedReference as any);
  } catch (e: any) {
    return new TransformerFailure({
      queryFailure: "FailedTransformer",
      transformerPath,
      failureOrigin: ["handleTransformer_ansiColumnsToJzodSchema"],
      failureMessage: e?.message ?? String(e),
    });
  }
}

// ################################################################################################
export function handleTransformer_concatLists(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: {
    label?: string;
    interpolation?: "build" | "runtime";
    transformerType: "concatLists";
    lists: CoreTransformerForBuildPlusRuntime[];
  },
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined
): TransformerReturnType<any> {
  if (!transformer.lists || transformer.lists.length === 0) {
    return [];
  }

  const result: any[] = [];
  for (let i = 0; i < transformer.lists.length; i++) {
    const resolvedList = defaultTransformers.transformer_extended_apply(
      step,
      [...transformerPath, "lists", i.toString()],
      transformer.label ? `${transformer.label}_list${i}` : `list${i}`,
      transformer.lists[i],
      resolveBuildTransformersTo,
      modelEnvironment,
      transformerParams,
      contextResults,
      reduxDeploymentsState
    );

    if (resolvedList instanceof TransformerFailure) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["handleTransformer_concatLists"],
        failureMessage: `Failed to resolve list at index ${i}`,
        innerError: resolvedList,
      });
    }

    if (!Array.isArray(resolvedList)) {
      return new TransformerFailure({
        queryFailure: "FailedTransformer",
        transformerPath,
        failureOrigin: ["handleTransformer_concatLists"],
        failureMessage: `concatLists: element at index ${i} is not an array, got: ${typeof resolvedList}`,
      });
    }

    result.push(...resolvedList);
  }

  return result;
}
