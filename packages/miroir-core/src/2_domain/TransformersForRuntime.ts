import mustache from 'mustache';
import { serializeError } from 'serialize-error';
// import Mustache from "mustache";
import { v4 as uuidv4 } from 'uuid';
import { Uuid } from '../0_interfaces/1_core/EntityDefinition';
import {
  DomainElementInstanceArray,
  DomainElementString,
  DomainElementSuccess,
  EntityInstance,
  ExtendedTransformerForRuntime,
  JzodElement,
  Transformer,
  Transformer_contextOrParameterReferenceTO_REMOVE,
  TransformerDefinition,
  TransformerForBuild,
  TransformerForBuild_constant,
  TransformerForBuild_constantArray,
  TransformerForBuild_constantAsExtractor,
  TransformerForBuild_count,
  TransformerForBuild_dataflowObject,
  TransformerForBuild_freeObjectTemplate,
  TransformerForBuild_InnerReference,
  TransformerForBuild_listPickElement,
  TransformerForBuild_listReducerToIndexObject,
  TransformerForBuild_listReducerToSpreadObject,
  TransformerForBuild_mapperListToList,
  TransformerForBuild_mustacheStringTemplate,
  TransformerForBuild_newUuid,
  TransformerForBuild_object_fullTemplate,
  TransformerForBuild_objectAlter,
  TransformerForBuild_objectDynamicAccess,
  TransformerForBuild_objectEntries,
  TransformerForBuild_objectValues,
  TransformerForBuild_parameterReference,
  TransformerForBuild_unique,
  TransformerForBuildPlusRuntime,
  TransformerForRuntime,
  TransformerForRuntime_constant,
  TransformerForRuntime_constantArray,
  TransformerForRuntime_constants,
  TransformerForRuntime_contextReference,
  TransformerForRuntime_count,
  TransformerForRuntime_dataflowObject,
  TransformerForRuntime_defaultValueForMLSchema,
  TransformerForRuntime_freeObjectTemplate,
  // TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_InnerReference,
  TransformerForRuntime_listPickElement,
  TransformerForRuntime_listReducerToIndexObject,
  TransformerForRuntime_listReducerToSpreadObject,
  TransformerForRuntime_mapperListToList,
  TransformerForRuntime_mustacheStringTemplate,
  TransformerForRuntime_newUuid,
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_objectAlter,
  TransformerForRuntime_objectDynamicAccess,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_unique
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { ITransformerHandler, MiroirModelEnvironment } from '../0_interfaces/1_core/Transformer';
import { Action2Error, Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { ReduxDeploymentsState } from '../0_interfaces/2_domain/ReduxDeploymentsStateInterface';
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { resolveJzodSchemaReferenceInContext, resolveSchemaReferenceInContextTransformer } from "../1_core/jzod/jzodResolveSchemaReferenceInContext";
import { jzodTypeCheckTransformer, resolveObjectExtendClauseAndDefinition } from "../1_core/jzod/jzodTypeCheck";
import { unfoldSchemaOnceTransformer } from '../1_core/jzod/JzodUnfoldSchemaOnce';
import { resolveConditionalSchema, resolveConditionalSchemaTransformer } from '../1_core/jzod/resolveConditionalSchema';
import { handleTransformer_menu_AddItem } from "../1_core/Menu";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { resolvePathOnObject } from "../tools";
import { cleanLevel } from "./constants";
import { getEntityInstancesUuidIndexNonHook } from './ReduxDeploymentsStateQueryExecutor';
import { transformer_spreadSheetToJzodSchema } from "./Transformer_Spreadsheet";
import {
  mmlsTransformers,
  transformer_constant,
  transformer_constantArray,
  transformer_constantAsExtractor,
  transformer_constantBigint,
  transformer_constantBoolean,
  transformer_constantNumber,
  transformer_constantObject,
  transformer_constantString,
  transformer_constantUuid,
  transformer_contextReference,
  transformer_count,
  transformer_dataflowObject,
  transformer_freeObjectTemplate,
  transformer_listPickElement,
  transformer_listReducerToIndexObject,
  transformer_listReducerToSpreadObject,
  transformer_mapperListToList,
  transformer_menu_addItem,
  transformer_mustacheStringTemplate,
  transformer_newUuid,
  transformer_object_fullTemplate,
  transformer_objectAlter,
  transformer_objectDynamicAccess,
  transformer_objectEntries,
  transformer_objectValues,
  transformer_parameterReference,
  transformer_unique,
  type ResolveBuildTransformersTo,
  type Step,
} from "./Transformers";

// Re-export types needed by other modules
export type { ResolveBuildTransformersTo, Step } from "./Transformers";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Transformer")
).then((logger: LoggerInterface) => {log = logger});

// TODO: keep this??
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};



// ################################################################################################
export const defaultTransformers = {
  transformer_extended_apply,
  transformer_mustacheStringTemplate_apply,
  transformer_InnerReference_resolve,
  handleTransformer_objectAlter,
  handleTransformer_object_fullTemplate,
  transformer_object_listReducerToIndexObject_apply,
  transformer_object_listReducerToSpreadObject_apply,
  transformerForBuild_list_listMapperToList_apply,
  transformer_dynamicObjectAccess_apply,
  // ##############################
  handleTransformer_menu_AddItem: handleTransformer_menu_AddItem,
}

// ################################################################################################
// Default value for Jzod Schema functions - moved here to avoid circular dependency
// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolution<T extends MiroirModelEnvironment>(
  jzodSchema: JzodElement,
  rootObject: any | undefined, // Optional parameter for backward compatibility
  rootLessListKey: string,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  forceOptional: boolean = false,
  deploymentUuid: Uuid | undefined = undefined,
  miroirEnvironment: T,
  // miroirFundamentalJzodSchema: JzodSchema,
  // currentModel?: MetaModel,
  // miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
): any {


  let effectiveSchemaOrError = resolveConditionalSchema(
    jzodSchema,
    rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
    currentValuePath,
    miroirEnvironment,
    reduxDeploymentsState,
    // getEntityInstancesUuidIndex,
    deploymentUuid,
    'defaultValue' // Specify this is for default value generation
  );

  log.info(
    "getDefaultValueForJzodSchemaWithResolution called with",
    "jzodSchema", jzodSchema,
    "rootObject", rootObject,
    "currentValuePath", currentValuePath,
    "reduxDeploymentsState", reduxDeploymentsState,
    "deploymentUuid", deploymentUuid,
    // "relativeReferenceJzodContext", relativeReferenceJzodContext
    "effectiveSchemaOrError", effectiveSchemaOrError,
  );
  
  if ('error' in effectiveSchemaOrError) {
    log.error(
      "getDefaultValueForJzodSchemaWithResolution: resolveConditionalSchema returned error",
      effectiveSchemaOrError
    );
    return undefined; // or propagate error as needed
  }
  let effectiveSchema: JzodElement = effectiveSchemaOrError;

  if (effectiveSchema.optional && !forceOptional) {
    log.info(
      "getDefaultValueForJzodSchemaWithResolution: effectiveSchema is optional and forceOptional is false",
      "currentValuePath", currentValuePath,
      "effectiveSchema", effectiveSchema
    );
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
      "getDefaultValueForJzodSchemaWithResolutionWithResolution returning UUID from tag.value.initializeTo.value",
      "currentValuePath",
      currentValuePath,
      "result",
      result
    );
    return result;
  }
  if (
    effectiveSchema.tag &&
    effectiveSchema.tag.value &&
    effectiveSchema.tag.value.initializeTo?.initializeToType == "transformer" &&
    effectiveSchema.tag.value.initializeTo.transformer
  ) {
    log.info(
      "getDefaultValueForJzodSchemaWithResolution calling transformer_extended_apply_wrapper",
      "deploymentUuid",
      deploymentUuid,
      "rootObject",
      rootObject,
      "jzodSchema.tag.value.initializeTo.transformer",
      effectiveSchema.tag.value.initializeTo.transformer
    );
    const result = transformer_extended_apply_wrapper(
      "build",
      undefined,
      effectiveSchema.tag.value.initializeTo.transformer,
      {
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
        ...miroirEnvironment,
        deploymentUuid,
        rootObject
      }, // parameters
      {}, // runtimeContext
      "value"
    );
    log.info(
      "getDefaultValueForJzodSchemaWithResolutionWithResolution returning",
      "currentValuePath",
      currentValuePath,
      "result",
      result
    );
    return result;
  }
  
  log.info(
    "getDefaultValueForJzodSchemaWithResolution called with",
    "currentValuePath",
    currentValuePath,
    "effectiveSchema",
    effectiveSchema,
    "currentDefaultValue",
    currentDefaultValue,
    "forceOptional",
    forceOptional,
    "deploymentUuid",
    deploymentUuid,
  );

  switch (effectiveSchema.type) {
    case "object": {
      const resolvedObjectType = resolveObjectExtendClauseAndDefinition(
        effectiveSchema,
        miroirEnvironment,
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
        relativeReferenceJzodContext
      );
      let result: Record<string, any> = {};

      Object.entries(resolvedObjectType.definition)
        .filter((a) => !a[1].optional)
        .forEach((a) => {
          const attributeName = a[0];
          const attributeValue = getDefaultValueForJzodSchemaWithResolution(
            a[1],
            rootObject,
            rootLessListKey,
            result,
            currentValuePath.concat([a[0]]),
            reduxDeploymentsState,
            forceOptional,
            deploymentUuid,
            miroirEnvironment,
            // miroirFundamentalJzodSchema,
            // currentModel,
            // miroirMetaModel,
            relativeReferenceJzodContext,
          );
          result[attributeName] = attributeValue;
        });
      return result;
    }
    case "string": {
      log.info(
        "getDefaultValueForJzodSchemaWithResolution called for string",
        "effectiveSchema", effectiveSchema, "return empty string"
      );
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
      return new Date();
    }
    case "any":
    case "undefined":
    case "null": {
      return undefined;
    }
    case "uuid": {
      log.info(
        "getDefaultValueForJzodSchemaWithResolutionWithResolution called for UUID",
        "deploymentUuid", deploymentUuid,
        "effectiveSchema", effectiveSchema,
      );
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.initializeTo?.initializeToType == "value" &&
        effectiveSchema.tag.value.initializeTo.value
      ) {
        const result = effectiveSchema.tag.value.initializeTo.value;
        log.info(
          "getDefaultValueForJzodSchemaWithResolutionWithResolution returning UUID from tag.value.initializeTo.value",
          "currentValuePath", currentValuePath,
          "result", result
        );
        return result;
      }
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.initializeTo?.initializeToType == "transformer" &&
        effectiveSchema.tag.value.initializeTo.transformer
      ) {
        log.info(
          "getDefaultValueForJzodSchemaWithResolution calling transformer_extended_apply_wrapper for UUID",
          "deploymentUuid", deploymentUuid,
          "jzodSchema.tag.value.initializeTo.transformer",
          effectiveSchema.tag.value.initializeTo.transformer
        );
        const result = transformer_extended_apply_wrapper(
          "build",
          undefined,
          effectiveSchema.tag.value.initializeTo.transformer,
          {
            ...miroirEnvironment,
            deploymentUuid
          }, // parameters
          {}, // runtimeContext
          "value"
        );
        log.info(
          "getDefaultValueForJzodSchemaWithResolutionWithResolution returning UUID from transformer",
          "currentValuePath", currentValuePath,
          "result", result
        );
        return result;
      }
      if (
        effectiveSchema.tag &&
        effectiveSchema.tag.value &&
        effectiveSchema.tag.value.selectorParams &&
        effectiveSchema.tag.value.selectorParams.targetEntity
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
        const foreignKeyObjects: EntityInstance[] = getEntityInstancesUuidIndexNonHook(
          reduxDeploymentsState,
          miroirEnvironment,
          deploymentUuid,
          effectiveSchema.tag.value.selectorParams.targetEntity,
          effectiveSchema.tag.value.selectorParams.targetEntityOrderInstancesBy
        );

        const result = Object.values(foreignKeyObjects)[0]?.uuid;
        log.info(
          "getDefaultValueForJzodSchemaWithResolution returning default UUID value from foreign key",
          "currentValuePath",
          currentValuePath,
          "result",
          result
        );
        return result;
      }
      const result = uuidv4();
      log.info(
        "getDefaultValueForJzodSchemaWithResolution returning random UUID value",
        "currentValuePath", currentValuePath,
        "result", result,
      );
      return result;
    }
    case "unknown":
    case "never":
    case "void": {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution can not generate value for schema type " +
          jzodSchema.type
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
      const localContext = effectiveSchema.context?{...relativeReferenceJzodContext, ...effectiveSchema.context}:relativeReferenceJzodContext

      const resolvedReference = resolveJzodSchemaReferenceInContext(
        effectiveSchema,
        localContext,
        miroirEnvironment,
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
      );
      return getDefaultValueForJzodSchemaWithResolution(
        resolvedReference,
        rootObject,
        rootLessListKey,
        currentDefaultValue,
        currentValuePath,
        reduxDeploymentsState,
        forceOptional,
        deploymentUuid,
        miroirEnvironment,
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
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
      if (jzodSchema.tag?.value?.initializeTo?.initializeToType == "value") {
        return jzodSchema.tag?.value?.initializeTo.value;
      } else {
        return getDefaultValueForJzodSchemaWithResolution(
          effectiveSchema.definition[0],
          rootObject,
          rootLessListKey,
          currentDefaultValue,
          currentValuePath,
          reduxDeploymentsState,
          forceOptional,
          deploymentUuid,
          miroirEnvironment,
          // miroirFundamentalJzodSchema,
          // currentModel,
          // miroirMetaModel,
          relativeReferenceJzodContext,
        );
      }
    }
    case "enum": {
      if (effectiveSchema.tag?.value?.initializeTo?.initializeToType == "value") {
        return effectiveSchema.tag?.value?.initializeTo.value;
      } else {
        throw new Error(
          "getDefaultValueForJzodSchemaWithResolution enum definition does not have 'tag.value.initalizeTo' for effectiveSchema=" +
            JSON.stringify(effectiveSchema, null, 2)
        );
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

export function getDefaultValueForJzodSchemaWithResolutionNonHook<T extends MiroirModelEnvironment>(
  jzodSchema: JzodElement,
  rootObject: any = undefined, 
  rootLessListKey: string,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  forceOptional: boolean = false,
  deploymentUuid: Uuid | undefined,
  miroirEnvironment: T,
  // miroirFundamentalJzodSchema: JzodSchema,
  // currentModel?: MetaModel,
  // miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
): any {
  log.info(
    "getDefaultValueForJzodSchemaWithResolutionNonHook called with",
    "rootLessListKey",
    rootLessListKey,
    "deploymentUuid",
    deploymentUuid,
    "rootObject",
    rootObject,
    "jzodSchema",
    jzodSchema,
    "forceOptional",
    forceOptional,
    "currentDefaultValue",
    currentDefaultValue,
    "currentValuePath",
    currentValuePath,
    "reduxDeploymentsState", reduxDeploymentsState,
  );

  if (deploymentUuid == undefined || deploymentUuid.length < 8 || !reduxDeploymentsState) {
    return getDefaultValueForJzodSchemaWithResolution(
      jzodSchema,
      rootObject,
      rootLessListKey,
      currentDefaultValue,
      currentValuePath,
      undefined,
      forceOptional,
      undefined,
      miroirEnvironment,
      // miroirFundamentalJzodSchema,
      // currentModel,
      // miroirMetaModel,
      relativeReferenceJzodContext,
    );
  }

  return getDefaultValueForJzodSchemaWithResolution(
    jzodSchema,
    rootObject,
    rootLessListKey,
    currentDefaultValue,
    currentValuePath,
    reduxDeploymentsState,
    forceOptional,
    deploymentUuid,
    miroirEnvironment,
    // miroirFundamentalJzodSchema,
    // currentModel,
    // miroirMetaModel,
    relativeReferenceJzodContext,
  );
}

export function defaultValueForMLSchemaTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForRuntime_defaultValueForMLSchema,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): any {
  const result = getDefaultValueForJzodSchemaWithResolutionNonHook(
    transformer.mlSchema,
    undefined, // rootObject
    "", // rootLessListKey
    undefined, // currentDefaultValue
    [], // currentValuePath
    undefined, // reduxDeploymentsState
    false, // forceOptional
    undefined, // deploymentUuid
    transformerParams, // miroirEnvironment
    undefined, // relativeReferenceJzodContext
    // miroirFundamentalJzodSchema as JzodSchema,
  );
  log.info(
    "defaultValueForMLSchemaTransformer called with",
    "step", step,
    "label", label,
    "transformer", transformer,
    "resolveBuildTransformersTo", resolveBuildTransformersTo,
    "transformerParams", transformerParams,
    "contextResults", contextResults,
    "result", result
  );
  return result;
}

const inMemoryTransformerImplementations: Record<string, ITransformerHandler<any, MiroirModelEnvironment>> = {
  handleTransformer_menu_AddItem: defaultTransformers.handleTransformer_menu_AddItem,
  // 
  handleCountTransformer,
  handleListPickElementTransformer,
  handleUniqueTransformer,
  handleTransformer_constant,
  handleTransformer_constantArray,
  handleTransformer_constantAsExtractor,
  handleTransformer_contextReference,
  handleTransformer_dataflowObject,
  handleTransformer_FreeObjectTemplate,
  transformer_mustacheStringTemplate_apply: defaultTransformers.transformer_mustacheStringTemplate_apply,
  handleTransformer_newUuid,
  handleTransformer_objectAlter: defaultTransformers.handleTransformer_objectAlter,
  transformer_dynamicObjectAccess_apply: defaultTransformers.transformer_dynamicObjectAccess_apply,
  handleTransformer_objectEntries,
  handleTransformer_objectValues,
  handleTransformer_object_fullTemplate: defaultTransformers.handleTransformer_object_fullTemplate,
  handleTransformer_parameterReference,
  transformer_object_listReducerToIndexObject_apply: defaultTransformers.transformer_object_listReducerToIndexObject_apply,
  transformer_object_listReducerToSpreadObject_apply: defaultTransformers.transformer_object_listReducerToSpreadObject_apply,
  transformerForBuild_list_listMapperToList_apply:
    defaultTransformers.transformerForBuild_list_listMapperToList_apply,
  // MLS
  "transformer_defaultValueForMLSchema": defaultValueForMLSchemaTransformer,
  "transformer_resolveConditionalSchema": resolveConditionalSchemaTransformer,
  "transformer_resolveSchemaReferenceInContext": resolveSchemaReferenceInContextTransformer,
  "transformer_unfoldSchemaOnce": unfoldSchemaOnceTransformer,
  "transformer_jzodTypeCheck": jzodTypeCheckTransformer,
};

// transformer_defaultValueForMLSchema
// transformer_defaultValueForMLSchema
export const applicationTransformerDefinitions: Record<string, TransformerDefinition> = {
  transformer_menu_addItem: transformer_menu_addItem,
  //
  spreadSheetToJzodSchema: transformer_spreadSheetToJzodSchema,
  count: transformer_count,
  constant: transformer_constant,
  constantBoolean: transformer_constantBoolean,
  constantBigint: transformer_constantBigint,
  constantNumber: transformer_constantNumber,
  constantObject: transformer_constantObject,
  constantString: transformer_constantString,
  constantUuid: transformer_constantUuid,
  constantAsExtractor: transformer_constantAsExtractor,
  constantArray: transformer_constantArray,
  contextReference: transformer_contextReference,
  dataflowObject: transformer_dataflowObject,
  freeObjectTemplate: transformer_freeObjectTemplate,
  listPickElement: transformer_listPickElement,
  listReducerToIndexObject: transformer_listReducerToIndexObject,
  listReducerToSpreadObject: transformer_listReducerToSpreadObject,
  mapperListToList: transformer_mapperListToList,
  mustacheStringTemplate: transformer_mustacheStringTemplate,
  newUuid: transformer_newUuid,
  objectAlter: transformer_objectAlter,
  objectDynamicAccess: transformer_objectDynamicAccess,
  objectEntries: transformer_objectEntries,
  objectValues: transformer_objectValues,
  object_fullTemplate: transformer_object_fullTemplate,
  parameterReference: transformer_parameterReference,
  unique: transformer_unique,
  // MLS
  ...Object.fromEntries(
    Object.entries(mmlsTransformers).map(([key, value]) => [
      key.replace("transformer_", ""),
      value as TransformerDefinition,
    ])
  ),
};

// ################################################################################################
function resolveApplyTo<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
    | TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate
    | TransformerForBuild_objectAlter
    | TransformerForRuntime_objectAlter,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>
) {
  switch (typeof transformer.applyTo) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
    case 'undefined': {
      return transformer.applyTo;
    }
    case 'object': {
      if (Array.isArray(transformer.applyTo) || !Object.hasOwn(transformer.applyTo, "referenceType")) {
        return transformer.applyTo;
      }
      if (transformer.applyTo.referenceType == "referencedExtractor") {
        // throw new Error("resolveApplyTo_legacy can not handle referencedExtractor");
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["resolveApplyTo_legacy"],
          failureMessage: "resolveApplyTo_legacy can not handle referencedExtractor",
          queryContext: JSON.stringify(transformer),
          queryParameters: queryParams as any,
        });
      }
    
      const transformerReference = transformer.applyTo.reference;
    
      const resolvedReference =
        typeof transformerReference == "string"
          ? defaultTransformers.transformer_InnerReference_resolve(
              step,
              {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: transformerReference,
              }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              resolveBuildTransformersTo,
              queryParams,
              contextResults
            )
          : defaultTransformers.transformer_extended_apply(
              step,
              label,
              transformerReference,
              resolveBuildTransformersTo,
              queryParams,
              contextResults
            );
            // log.info("resolveApplyTo_legacy resolvedReference", resolvedReference);
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
    case 'symbol':
    case 'function':
    default: {
      // throw new Error("resolveApplyTo_legacy failed, unknown type for transformer.applyTo=" + transformer.applyTo);
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["resolveApplyTo"],
        failureMessage: "resolveApplyTo failed, unknown type for transformer.applyTo=" + transformer.applyTo,
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
  //         { transformerType: "contextReference", referenceName: transformerReference }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
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
export function resolveApplyTo_legacy<T extends MiroirModelEnvironment>(
  transformer: 
  | TransformerForBuild_count
  | TransformerForBuild_mapperListToList
  | TransformerForBuild_listPickElement
  | TransformerForBuild_listReducerToSpreadObject
  | TransformerForBuild_listReducerToIndexObject
  | TransformerForBuild_objectEntries
  | TransformerForBuild_objectValues
  | TransformerForBuild_unique
  | TransformerForRuntime_count
  | TransformerForRuntime_mapperListToList 
  | TransformerForRuntime_listPickElement
  | TransformerForRuntime_listReducerToIndexObject
  // | TransformerForRuntime_mapper_listToObject 
  | TransformerForRuntime_listReducerToSpreadObject
  | TransformerForRuntime_objectEntries
  | TransformerForRuntime_objectValues
  | TransformerForRuntime_unique
  ,
  step: Step,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults: Record<string, any> | undefined,
  label: string | undefined
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
  switch (typeof transformer.applyTo) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
    case 'undefined': {
      return transformer.applyTo;
    }
    case 'object': {
      if (Array.isArray(transformer.applyTo) || !Object.hasOwn(transformer.applyTo, "referenceType")) {
        return transformer.applyTo;
      }
      if (transformer.applyTo.referenceType == "referencedExtractor") {
        // throw new Error("resolveApplyTo_legacy can not handle referencedExtractor");
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["resolveApplyTo_legacy"],
          failureMessage: "resolveApplyTo_legacy can not handle referencedExtractor",
          queryContext: JSON.stringify(transformer),
          queryParameters: queryParams as any,
        });
      }
    
      const transformerReference = transformer.applyTo.reference;
    
      const resolvedReference =
        typeof transformerReference == "string"
          ? defaultTransformers.transformer_InnerReference_resolve(
              step,
              {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: transformerReference,
              }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              resolveBuildTransformersTo,
              queryParams,
              contextResults
            )
          : defaultTransformers.transformer_extended_apply(
              step,
              label,
              transformerReference,
              resolveBuildTransformersTo,
              queryParams,
              contextResults
            );
            // log.info("resolveApplyTo_legacy resolvedReference", resolvedReference);
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
    case 'symbol':
    case 'function':
    default: {
      // throw new Error("resolveApplyTo_legacy failed, unknown type for transformer.applyTo=" + transformer.applyTo);
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["resolveApplyTo"],
        failureMessage: "resolveApplyTo failed, unknown type for transformer.applyTo=" + transformer.applyTo,
        queryContext: JSON.stringify(transformer),
        queryParameters: queryParams as any,
      });
      break;
    }
  }
}

// ################################################################################################
function transformerForBuild_list_listMapperToList_apply<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForRuntime_mapperListToList | TransformerForBuild_mapperListToList,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any[]> {
  const resolvedApplyTo = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);
  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformerForBuild_list_listMapperToList_apply extractorTransformer can not apply to failed resolvedReference",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
      queryContext: "transformerForBuild_list_listMapperToList_apply can not apply to failed resolvedReference",
      innerError: resolvedApplyTo
    });
  }
  // log.info(
  //   "transformerForBuild_list_listMapperToList_apply",
  //   "step",
  //   step,
  //   "extractorTransformer resolvedReference",
  //   resolvedApplyTo
  // );
  const resultArray:any[] = [];

  if (Array.isArray(resolvedApplyTo)) {
    for (const element of resolvedApplyTo) {
      resultArray.push(
        defaultTransformers.transformer_extended_apply(
          step,
          (element as any).name ?? "No name for element",
          transformer.elementTransformer as any,
          resolveBuildTransformersTo,
          queryParams,
          {
            ...contextResults,
            [transformer.referenceToOuterObject]: element,
          } // inefficient!
        )
      ); // TODO: constrain type of transformer
    }
  } else { // allow this?  or should it be an error?
    if (typeof resolvedApplyTo == "object") {
      for (const element of Object.entries(resolvedApplyTo)) {
        resultArray.push(
          defaultTransformers.transformer_extended_apply(step, element[0], transformer.elementTransformer as any, resolveBuildTransformersTo, queryParams, {
              ...contextResults,
              [transformer.referenceToOuterObject]: element[1],
          })
        ); // TODO: constrain type of transformer
      }
    } else {
      log.error("transformerForBuild_list_listMapperToList_apply extractorTransformer can not work on resolvedReference", resolvedApplyTo);
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
        failureMessage:
          "resolved reference is not instanceUuidIndex or object " + JSON.stringify(resolvedApplyTo, null, 2),
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
function transformer_object_listReducerToSpreadObject_apply<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild_listReducerToSpreadObject | TransformerForRuntime_listReducerToSpreadObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // log.info(
  //   "transformer_object_listReducerToSpreadObject_apply called for transformer",
  //   transformer,
  //   "queryParams",
  //   JSON.stringify(queryParams, null, 2),
  //   "contextResults",
  //   JSON.stringify(contextResults, null, 2)
  // );
  const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);

  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext: "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      innerError: resolvedReference
    });
  }

  const isListOfObjects = Array.isArray(resolvedReference) && resolvedReference.every((entry) => typeof entry == "object" && !Array.isArray(entry));

  if (!isListOfObjects) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext: "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
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
function transformer_object_listReducerToIndexObject_apply<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
    | TransformerForBuild_listReducerToIndexObject
    | TransformerForRuntime_listReducerToIndexObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // log.info(
  //   "transformer_object_listReducerToIndexObject_apply called for transformer",
  //   transformer,
  //   "queryParams",
  //   JSON.stringify(queryParams, null, 2),
  //   "contextResults",
  //   JSON.stringify(contextResults, null, 2)
  // );
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    queryParams,
    contextResults,
    label
  );

  // TODO: test if resolvedReference is a list
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
function handleTransformer_object_fullTemplate<T extends MiroirModelEnvironment>(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<DomainElementString | DomainElementInstanceArray> {
  // log.info(
  //   "transformer_object_fullTemplate called with objectName=",
  //   objectName,
  //   // "transformerForBuild=",
  //   // // transformerForBuild,
  //   // JSON.stringify(transformerForBuild, null, 2)
  //   // // "innerEntry",
  //   // // JSON.stringify(innerEntry, null, 2)
  // );
  const resolvedApplyTo = resolveApplyTo(
    step,
    objectName,
    transformer,
    resolveBuildTransformersTo,
    queryParams,
    contextResults
  );

  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformer_object_fullTemplate can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_fullTemplate"],
      queryContext: "transformer_object_fullTemplate can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo
    });
  }
  log.info(
    "transformer_object_fullTemplate found resolvedApplyTo",
    JSON.stringify(resolvedApplyTo, null, 2)
  );
  const newContextResults = {
    ...contextResults,
    [transformer.referenceToOuterObject]: resolvedApplyTo,
  }
  const attributeEntries = transformer.definition.map(
    (innerEntry: {
      attributeKey: TransformerForBuild | TransformerForRuntime | string;
      attributeValue: TransformerForBuild | TransformerForRuntime;
    }): [
      { rawLeftValue: Domain2QueryReturnType<DomainElementSuccess>; finalLeftValue: Domain2QueryReturnType<DomainElementSuccess> },
      { renderedRightValue: Domain2QueryReturnType<DomainElementSuccess>; finalRightValue: Domain2QueryReturnType<DomainElementSuccess> }
    ] => {
      const rawLeftValue: Domain2QueryReturnType<DomainElementSuccess> = typeof innerEntry.attributeKey == "object" && Object.hasOwn(innerEntry.attributeKey,"transformerType")
        ? defaultTransformers.transformer_extended_apply(
            step,
            objectName, // is this correct? or should it be undefined?
            innerEntry.attributeKey,
            resolveBuildTransformersTo,
            queryParams,
            newContextResults
          )
        : innerEntry.attributeKey;
      const leftValue: { rawLeftValue: Domain2QueryReturnType<any>; finalLeftValue: Domain2QueryReturnType<any> } = {
      // const leftValue: { rawLeftValue: Domain2QueryReturnType<DomainElementSuccess>; finalLeftValue: Domain2QueryReturnType<DomainElementSuccess> } = {
        rawLeftValue,
        finalLeftValue:
          !(rawLeftValue instanceof Action2Error) &&
          typeof innerEntry.attributeKey == "object" &&
          (innerEntry.attributeKey as any).applyFunction
            ? (innerEntry.attributeKey as any).applyFunction(rawLeftValue)
            : rawLeftValue,
      };
      // log.info(
      //   "transformer_object_fullTemplate innerEntry.attributeKey",
      //   innerEntry.attributeKey,
      //   "leftValue",
      //   leftValue
      // );

      const renderedRightValue: Domain2QueryReturnType<DomainElementSuccess> = defaultTransformers.transformer_extended_apply(
        // TODO: use actionRuntimeTransformer_apply or merge the two functions
        step,
        leftValue.finalLeftValue as any as string,
        innerEntry.attributeValue as any, // TODO: wrong type in the case of runtime transformer
        resolveBuildTransformersTo,
        queryParams,
        newContextResults
      ); // TODO: check for failure!
      const rightValue: { renderedRightValue: Domain2QueryReturnType<DomainElementSuccess>; finalRightValue: Domain2QueryReturnType<DomainElementSuccess> } = {
        renderedRightValue,
        finalRightValue:
          renderedRightValue.elementType != "failure" && (innerEntry.attributeValue as any).applyFunction
            ? (innerEntry.attributeValue as any).applyFunction(renderedRightValue)
            : renderedRightValue,
      };
      // log.info(
      //   "transformer_object_fullTemplate",
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
    (e) => e[0].finalLeftValue.elementType == "failure" || e[1].finalRightValue.elementType == "failure"
  );
  if (failureIndex == -1) {
    const fullObjectResult = Object.fromEntries(
      attributeEntries.map((e) => [e[0].finalLeftValue, e[1].finalRightValue])
    );
    // log.info("transformer_object_fullTemplate for", transformerForBuild, "fullObjectResult", fullObjectResult);
    return fullObjectResult;
  } else {
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["transformer_object_fullTemplate"],
      queryContext: "FullObjectTemplate error in " +
        objectName,
        innerError: attributeEntries[failureIndex] as any,
        // JSON.stringify(attributeEntries[failureIndex], null, 2),
    });
  }
}

// ################################################################################################
function handleTransformer_objectAlter<T extends MiroirModelEnvironment>(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_objectAlter | TransformerForRuntime_objectAlter,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const resolvedApplyTo = resolveApplyTo(step, objectName, transformer, resolveBuildTransformersTo, queryParams, contextResults);
  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformer_objectAlter can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_objectAlter"],
      queryContext: "transformer_objectAlter can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo
    });
  }
  // TODO: test if resolvedReference is an object
  const overrideObject = defaultTransformers.transformer_extended_apply(
    step,
    "NO NAME",
    transformer.definition,
    resolveBuildTransformersTo,
    queryParams,
    {
      ...contextResults,
      [transformer.referenceToOuterObject]: resolvedApplyTo,
    }
  );

  if (overrideObject instanceof Domain2ElementFailed) {
    log.error(
      "transformer_objectAlter can not apply to failed overrideObject",
      overrideObject
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_objectAlter"],
      queryContext: "transformer_objectAlter can not apply to failed overrideObject",
      innerError: overrideObject
    });
  }
  log.info(
    "transformer_objectAlter resolvedApplyTo",
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
  transformerInnerReference:
    | Transformer_contextOrParameterReferenceTO_REMOVE
    | TransformerForBuild_parameterReference,
  paramOrContext: "param" | "context",
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // ReferenceNotFound
  const bank: Record<string, any> =
    paramOrContext == "param" ? queryParams ?? {} : contextResults ?? {};
  // log.info(
  //   "transformer_resolveReference called for",
  //   JSON.stringify(transformerInnerReference, null, 2),
  //   "bank",
  //   JSON.stringify(Object.keys(bank), null, 2)
  //   // JSON.stringify(bank, null, 2)
  // );
  if (!bank) {
    log.error(
      "transformer_resolveReference failed, no contextResults for step",
      step,
      "transformerInnerReference=",
      transformerInnerReference
    );
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
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
      return new Domain2ElementFailed({
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["transformer_resolveReference"],
        queryReference: transformerInnerReference.referenceName,
        failureMessage: "no referenceName " + transformerInnerReference.referenceName,
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
      const pathResult = resolvePathOnObject(bank, transformerInnerReference.referencePath);
      // log.info(
      //   "transformer_resolveReference resolved for",
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
      return new Domain2ElementFailed({
        // queryFailure: "ReferenceNotFound",
        queryFailure: "FailedTransformer_contextReference",
        failureOrigin: ["transformer_resolveReference"],
        queryReference: JSON.stringify(transformerInnerReference.referencePath),
        failureMessage:
          "no referencePath " + transformerInnerReference.referencePath + " found in queryContext",
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
  }
}


// ################################################################################################
// almost duplicate from QuerySelectors.ts
// type defined in function of the types of queryParams and contextResults
// contextReference<A> -> A
// parameterReference<A> -> A
// constantUuid -> Uuid
// constantString -> string
export function transformer_InnerReference_resolve<T extends MiroirModelEnvironment>(
  step: Step,
  transformerInnerReference:
    | TransformerForRuntime_constants
    | TransformerForBuild_InnerReference
    | TransformerForRuntime_InnerReference,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
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
  if (step == "build" && (transformerInnerReference as any).interpolation == "runtime") {
    log.warn(
      "transformer_InnerReference_resolve called for runtime interpolation in build step",
      transformerInnerReference
    );
    return transformerInnerReference;
  }

  let result: Domain2QueryReturnType<any> = undefined;
  switch (transformerInnerReference.transformerType) {
    case "constant":
    case "constantUuid":
    case "constantObject":
    case "constantString": {
      result = transformerInnerReference.value;
      break;
    }
    case "newUuid": {
      result = uuidv4();
      break;
    }
    case "mustacheStringTemplate": {
      result = defaultTransformers.transformer_mustacheStringTemplate_apply(
        step,
        "NO NAME",
        transformerInnerReference,
        resolveBuildTransformersTo,
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "contextReference": {
      if (step == "build") {
        // no resolution in case of build step
        result = transformerInnerReference;
        // return new Domain2ElementFailed({
        //   queryFailure: "ReferenceNotFound",
        //   failureOrigin: ["transformer_InnerReference_resolve"],
        //   queryReference: transformerInnerReference.referenceName,
        //   failureMessage: "contextReference not allowed in build step, all context references must be resolved at runtime",
        //   queryContext: "contextReference not allowed in build step, all context references must be resolved at runtime",
        // });
      } else {
        result = transformer_resolveReference(
          step,
          transformerInnerReference,
          "context",
          localQueryParams,
          localContextResults
        );
      }
      break;
    }
    case "parameterReference": {
      // RESOLVING EVERYTHING AT RUNTIME
      result = transformer_resolveReference(
        step,
        transformerInnerReference,
        "param",
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "objectDynamicAccess": {
      result = defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        "none",
        transformerInnerReference,
        resolveBuildTransformersTo,
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
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
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
};

// ################################################################################################
// string -> string
// or
// string, <A> -> A
export function transformer_mustacheStringTemplate_apply(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_mustacheStringTemplate | TransformerForRuntime_mustacheStringTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  try {
    // log.info(
    //   "transformer_mustacheStringTemplate_apply called for transformer",
    //   transformer,
    //   "queryParams",
    //   JSON.stringify(queryParams, null, 2),
    //   "contextResults",
    //   JSON.stringify(contextResults, null, 2)
    // );
    const result = mustache.render(transformer.definition, (transformer as any)["interpolation"] == "runtime"?contextResults: queryParams);
    return result;
  } catch (error: any) {
    // log.error(
    //   "transformer_mustacheStringTemplate_apply error for",
    //   transformer,
    //   "queryParams",
    //   JSON.stringify(queryParams, null, 2),
    //   "contextResults",
    //   JSON.stringify(contextResults, null, 2),
    //   "error:",
    //   error
    // );
    return new Domain2ElementFailed({
      queryFailure: "FailedTransformer_mustache",
      failureOrigin: ["transformer_mustacheStringTemplate_apply"],
      // queryReference: transformer,
      query: transformer as any,
      queryContext: "error in transformer_mustacheStringTemplate_apply, could not render template.",
      innerError: error,
    });
  }
}

// ################################################################################################
export function transformer_dynamicObjectAccess_apply<T extends MiroirModelEnvironment>(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForRuntime_objectDynamicAccess | TransformerForBuild_objectDynamicAccess,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const result = (transformer.objectAccessPath.reduce as any)( // triggers "error TS2349: This expression is not callable" in tsc. Not in eslint, though!
    ((acc: any, currentPathElement: any): any => {
      switch (typeof currentPathElement) {
        case "string": {
          if (!acc) {
            return new Domain2ElementFailed({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext: "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(currentPathElement, null, 2),
            });
          }
          const innerResult = acc[currentPathElement]
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
            return new Domain2ElementFailed({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: transformer as any,
              queryContext: "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(currentPathElement, null, 2),
            });
          }
          if (!currentPathElement.transformerType) {
            // throw new Error("transformer_dynamicObjectAccess_apply can not handle objects without transformerType");
            return new Domain2ElementFailed({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: transformer as any,
              queryContext: "error in transformer_dynamicObjectAccess_apply, could not find attribute transformerType in: " + JSON.stringify(currentPathElement, null, 2),
            });
          }
          const key = defaultTransformers.transformer_extended_apply(
            step,
            "NO NAME",
            currentPathElement,
            resolveBuildTransformersTo,
            transformerParams,
            contextResults
          );
          if (key instanceof Domain2ElementFailed) {
            return new Domain2ElementFailed({
              queryFailure: "FailedTransformer_dynamicObjectAccess",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(key, null, 2),
            });
          }
          const innerResult = acc?acc[key]:key;
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
          return new Domain2ElementFailed({
            queryFailure: "FailedTransformer_dynamicObjectAccess",
            failureOrigin: ["transformer_dynamicObjectAccess_apply"],
            query: transformer as any,
            queryContext: "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(currentPathElement, null, 2),
            queryParameters: currentPathElement,
          });
        }
      }
    }) as (acc: any, current: any) => any,
    undefined
  );
  return result;

}

// ################################################################################################
export function handleCountTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_count
  | TransformerForRuntime_count,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults,
    label
  );
  // log.info(
  //   "handleCountTransformer extractorTransformer count resolvedReference=",
  //   resolvedReference
  // );
  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "handleCountTransformer extractorTransformer count can not apply to failed resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleCountTransformer"],
      queryContext: "count can not apply to failed resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    // if ( typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "innerTransformer_apply extractorTransformer count can not apply to resolvedReference of wrong type",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleCountTransformer"],
      queryContext:
        "count can not apply to resolvedReference of wrong type: " + typeof resolvedReference,
      queryParameters: resolvedReference,
    });
  }

  // log.info(
  //   "handleCountTransformer extractorTransformer count resolvedReference",
  //   resolvedReference.length
  // );
  // const sortByAttribute = transformer.orderBy
  //   ? (a: any[]) =>
  //       a.sort((a, b) =>
  //         a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
  //           sensitivity: "base",
  //         })
  //       )
  //   : (a: any[]) => a;

  if (transformer.groupBy) {
    const result = new Map<string, number>();
    for (const entry of resolvedReference) {
      const key = (entry as any)[transformer.groupBy];
      if (result.has(key)) {
        result.set(key, (result.get(key) ?? 0) + 1);
      } else {
        result.set(key, 1);
      }
    }
    return [Object.fromEntries(result.entries())];
  } else {
    // log.info(
    //   "handleCountTransformer extractorTransformer count without groupBy resolvedReference",
    //   resolvedReference.length
    // );
    return [{ count: resolvedReference.length }];
  }
  // break;
}
// ################################################################################################
export function handleUniqueTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_unique
  | TransformerForRuntime_unique,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults,
    label
  );
  // log.info(
  //   "handleUniqueTransformer extractorTransformer unique",
  //   label,
  //   "resolvedReference",
  //   resolvedReference
  // );

  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "handleUniqueTransformer extractorTransformer unique can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleUniqueTransformer"],
      queryContext: "unique can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "handleUniqueTransformer extractorTransformer unique referencedExtractor can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleUniqueTransformer"],
      queryContext:
        "unique can not apply to resolvedReference, wrong type: " + typeof resolvedReference,
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
  const resultDomainElement: Domain2QueryReturnType<any> = sortByAttribute(
    [...result].map((e) => ({ [transformer.attribute]: e }))
  );
  // log.info(
  //   "handleUniqueTransformer extractorTransformer unique",
  //   label,
  //   "result",
  //   resultDomainElement
  // );
  return resultDomainElement;
}

// ################################################################################################
export function handleListPickElementTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_listPickElement
  | TransformerForRuntime_listPickElement,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults,
    label
  );
  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "handleListPickElementTransformer extractorTransformer listPickElement can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["innerTransformer_apply"],
      queryContext: "listPickElement can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
    log.error(
      "handleListPickElementTransformer extractorTransformer listPickElement can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["innerTransformer_apply"],
      queryContext:
        "listPickElement can not apply to resolvedReference, wrong type: " +
        typeof resolvedReference,
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

  // try {
  const sortedResultArray = sortByAttribute(resolvedReference);
  if (transformer.index < 0 || sortedResultArray.length < transformer.index) {
    return undefined;
    // return new Domain2ElementFailed({
    //   queryFailure: "FailedTransformer_listPickElement",
    //   failureOrigin: ["innerTransformer_apply"],
    //   queryContext: "listPickElement index out of bounds",
    // });
  } else {
    const result = sortedResultArray[transformer.index];
    // log.info(
    //   "handleListPickElementTransformer extractorTransformer listPickElement sorted resolvedReference",
    //   sortedResultArray,
    //   "index",
    //   transformer.index,
    //   "result",
    //   result,
    //   "transformer",
    //   JSON.stringify(transformer, null, 2)
    // );
    return result;
  }
  // } catch (error) {
  //   log.error(
  //     "innerTransformer_apply extractorTransformer listPickElement failed",
  //     error
  //   )
  //   return new Domain2ElementFailed({
  //     queryFailure: "FailedTransformer_listPickElement",
  //     failureOrigin: ["innerTransformer_apply"],
  //     queryContext: "listPickElement failed: " + error,
  //   });
  // }
  // break;
}

// ################################################################################################
export function handleTransformer_FreeObjectTemplate<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_freeObjectTemplate
  | TransformerForRuntime_freeObjectTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // log.info("innerTransformer_apply freeObjectTemplate", JSON.stringify(transformer, null, 2));
  const result = Object.fromEntries(
    Object.entries(transformer.definition).map((objectTemplateEntry: [string, any]) => {
      return [
        objectTemplateEntry[0],
        defaultTransformers.transformer_extended_apply(
          step,
          objectTemplateEntry[0],
          objectTemplateEntry[1],
          resolveBuildTransformersTo,
          transformerParams,
          contextResults
        ),
      ];
    })
  );
  const hasFailures = Object.values(result).find((e) => e instanceof Domain2ElementFailed);
  if (hasFailures) {
    log.error("handleTransformer_FreeObjectTemplate freeObjectTemplate hasFailures", hasFailures);
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleTransformer_FreeObjectTemplate"],
      queryContext: "freeObjectTemplate hasFailures",
      innerError: hasFailures,
    });
  }
  // log.info(
  //   "handleTransformer_FreeObjectTemplate freeObjectTemplate for",
  //   label,
  //   "step",
  //   step,
  //   "result",
  //   JSON.stringify(transformer, null, 2)
  // );
  return result;
}

// ################################################################################################
export function handleTransformer_objectEntries<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_objectEntries
  | TransformerForRuntime_objectEntries,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults,
    label
  );
  // log.info("handleTransformer_objectEntries referencedExtractor=", resolvedReference);

  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "handleTransformer_objectEntries can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleTransformer_objectEntries"],
      queryContext: "handleTransformer_objectEntries can not apply to resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (!(typeof resolvedReference == "object") || Array.isArray(resolvedReference)) {
    const failure: Domain2ElementFailed = new Domain2ElementFailed({
      queryFailure: "FailedTransformer_objectEntries",
      failureMessage:
        "handleTransformer_objectEntries called on something that is not an object: " +
        typeof resolvedReference,
      // queryParameters: JSON.stringify(resolvedReference, null, 2),
      queryParameters: resolvedReference,
    });
    log.error(
      "handleTransformer_objectEntries resolvedReference",
      resolvedReference
    );
    return failure;
  }
  // log.info(
  //   "handleTransformer_objectEntries resolvedReference",
  //   resolvedReference
  // );
  return Object.entries(resolvedReference);
}

// ################################################################################################
export function handleTransformer_objectValues<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_objectValues
  | TransformerForRuntime_objectValues,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const resolvedReference = resolveApplyTo_legacy(
    transformer,
    step,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults,
    label
  );
  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "handleTransformer_objectValues can not apply to resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleTransformer_objectValues"],
      queryContext: "handleTransformer_objectValues failed ro resolve resolvedReference",
      innerError: resolvedReference,
    });
  }

  if (typeof resolvedReference != "object" || Array.isArray(resolvedReference)) {
    log.error(
      "innerTransformer_apply extractorTransformer count referencedExtractor resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["handleTransformer_objectValues"],
      queryContext:
        "handleTransformer_objectValues resolvedReference is not an object: " + typeof resolvedReference,
    });
  }
  // log.info(
  //   "handleTransformer_objectValues resolvedReference",
  //   resolvedReference
  // );
  return Object.values(resolvedReference);
}

// ################################################################################################
export function handleTransformer_dataflowObject<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_dataflowObject
  | TransformerForRuntime_dataflowObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
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
      key,
      value,
      resolveBuildTransformersTo,
      transformerParams,
      currentContext
    );
  }
  // return resultObject
  return resultObject[transformer.target];
}

// ################################################################################################
export function handleTransformer_constantArray(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_constantArray
  | TransformerForRuntime_constantArray,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  if (Array.isArray(transformer.value)) {
    return transformer.value;
  } else {
    return transformer.value; // TODO: fail! is it relevant?
    // return JSON.stringify(transformer.value)
    // return new Domain2ElementFailed({
    //   queryFailure: "FailedTransformer_constantArray",
    //   failureOrigin: ["innerTransformer_apply"],
    //   queryContext: "constantArrayValue is not an array",
    // });
  }
}

// ################################################################################################
export function handleTransformer_constant(
  step: Step,
  label: string | undefined,
  transformer:
  | TransformerForBuild_constant
  | TransformerForRuntime_constant,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  switch (typeof transformer.value) {
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
    case "undefined":
    case "function": {
      return new Domain2ElementFailed({
        queryFailure: "FailedTransformer_constant",
        failureOrigin: ["handleTransformer_constant"],
        queryContext: "constantValue is not a string, number, bigint, boolean, or object",
      });
      break;
    }
    default: {
      return new Domain2ElementFailed({
        queryFailure: "FailedTransformer_constant",
        failureOrigin: ["handleTransformer_constant"],
        queryContext: "constantValue could not be handled",
      });
      break;
    }
  }
  // return transformer.value;
}

// ################################################################################################
export function handleTransformer_contextReference<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForRuntime_contextReference,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformer,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults
  );
  const returnedValue: Domain2QueryReturnType<any> =
    typeof transformer == "object" && (transformer as any).applyFunction
      ? (transformer as any).applyFunction(rawValue)
      : rawValue;
  return returnedValue;
}

// ################################################################################################
export function handleTransformer_parameterReference<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild_parameterReference,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformer,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults
  );
  const returnedValue: Domain2QueryReturnType<any> =
    typeof transformer == "object" && (transformer as any).applyFunction
      ? (transformer as any).applyFunction(rawValue)
      : rawValue;
  return returnedValue;
}

// ################################################################################################
export function handleTransformer_constantAsExtractor(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild_constantAsExtractor,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  return transformer.value;
}

// ################################################################################################
export function handleTransformer_newUuid<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild_newUuid | TransformerForRuntime_newUuid,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  transformerParams: T,
  // queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    step,
    transformer,
    resolveBuildTransformersTo,
    transformerParams,
    contextResults
  );
  const returnedValue: Domain2QueryReturnType<any> =
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
export function innerTransformer_plainObject_apply<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  transformerParams: T,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
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
  const attributeEntries: [string, Domain2QueryReturnType<DomainElementSuccess>][] = Object.entries(transformer).map(
    (objectTemplateEntry: [string, any]) => {
      // log.info("transformer_apply converting attribute",JSON.stringify(objectTemplateEntry, null, 2));
      return [
        objectTemplateEntry[0],
        defaultTransformers.transformer_extended_apply(
          step,
          objectTemplateEntry[0],
          objectTemplateEntry[1],
          resolveBuildTransformersTo,
          transformerParams,
          contextResults
        ),
      ];
    }
  );
  const failureIndex = attributeEntries.findIndex(
    (e) =>
      typeof e[1] == "object" &&
      e[1] != null &&
      !Array.isArray(e[1]) &&
      e[1].elementType == "failure"
  );
  if (failureIndex == -1) {
    const result = Object.fromEntries(
      attributeEntries.map((e) => [e[0], e[1]])
    )
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
    const errorToReturn = new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["innerTransformer_plainObject_apply"],
      innerError: attributeEntries[failureIndex][1] as any, // TODO: type!
      queryContext: "error in attribute: " + attributeEntries[failureIndex][0]
    })
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
export function innerTransformer_array_apply<T extends MiroirModelEnvironment>(
  step: Step,
  objectName: string | undefined,
  transformer: any[],
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  transformerParams: T,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
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
    transformer_extended_apply(step, index.toString(), e, resolveBuildTransformersTo, transformerParams, contextResults)
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

    const errorToReturn = new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["innerTransformer_array_apply"],
      innerError: subObject[failureIndex],
      queryContext:
        "failed to transform object attribute for array index " +
        failureIndex +
        // " failure " +
        // JSON.stringify(subObject[failureIndex]) +
        " in transformer " +
        transformer
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
export function transformer_extended_apply<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  // transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime | undefined,
  transformer:
    | TransformerForBuild
    | TransformerForRuntime
    | ExtendedTransformerForRuntime
    | TransformerForBuildPlusRuntime
    | undefined,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  // queryParams: Record<string, any>,
  transformerParams: T,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // ): Domain2QueryReturnType<DomainElementSuccess> {
  log.info(
    "transformer_extended_apply called for label",
    label,
    "step:",
    step,
    "transformer.interpolation:",
    (transformer as any)?.interpolation ?? "build",
    ((transformer as any)?.interpolation ?? "build") == step,
    typeof transformer,
    "transformer",
    JSON.stringify(transformer, null, 2),
    "queryParams elements",
    Object.keys(transformerParams ?? {})
    // // JSON.stringify(Object.keys(queryParams??{}), null, 2),
    // "contextResults elements",
    // Object.keys(contextResults??{})
    // // JSON.stringify(Object.keys(contextResults??{}), null, 2)
  );
  let result: Domain2QueryReturnType<any> = undefined as any;

  if (typeof transformer == "object" && transformer != null) {
    if (transformer instanceof Array) {
      result = innerTransformer_array_apply(
        step,
        label,
        transformer,
        resolveBuildTransformersTo,
        transformerParams,
        contextResults
      );
      // log.info(
      //   "transformer_extended_apply innerTransformer_array_apply result",
      //   JSON.stringify(result, null, 2)
      // );
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      const newResolveBuildTransformersTo: ResolveBuildTransformersTo =
        (transformer as any)["interpolation"] == "build" &&
        resolveBuildTransformersTo == "constantTransformer"
          ? "value" // HACK!
          : resolveBuildTransformersTo;
      if (transformer["transformerType"] != undefined) {
        if (step == "runtime" || (transformer as any)["interpolation"] == "build") {
          // log.info("transformer_extended_apply interpreting transformer!");
          let preResult;
          const foundApplicationTransformer =
            applicationTransformerDefinitions[(transformer as any).transformerType];
          log.info(
            "transformer_extended_apply foundApplicationTransformer",
            foundApplicationTransformer,
            "for transformer",
            JSON.stringify(transformer, null, 2),
            "applicationTransformerDefinitions",
            Object.keys(applicationTransformerDefinitions)
          );
          if (!foundApplicationTransformer) {
            log.error(
              "transformer_extended_apply failed for",
              label,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2)
            );
            preResult = new Domain2ElementFailed({
              // queryFailure: "QueryNotExecutable",
              queryFailure: "TransformerNotFound",
              failureOrigin: ["transformer_extended_apply"],
              queryContext: "transformer " + (transformer as any).transformerType + " not found",
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
            preResult = new Domain2ElementFailed({
              queryFailure: "QueryNotExecutable",
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
              const transformerFunction: ITransformerHandler<any, MiroirModelEnvironment> =
                inMemoryTransformerImplementations[transformerIndexName];
              log.info(
                "transformer_extended_apply libraryImplementation for",
                "foundApplicationTransformer",
                JSON.stringify(foundApplicationTransformer, null, 2),
                "inMemoryTransformerImplementations",
                Object.keys(inMemoryTransformerImplementations),
                Object.hasOwn(inMemoryTransformerImplementations, transformerIndexName),
                // "transformerIndexName",
                // Object.keys(inMemoryTransformerImplementations).findIndex(
                //   (e) => e == transformerIndexName),
                JSON.stringify(
                  Object.entries(inMemoryTransformerImplementations).find(
                    (e) => e[0] == transformerIndexName
                  ),
                  null,
                  2
                ),
                typeof inMemoryTransformerImplementations,
                Array.isArray(inMemoryTransformerImplementations),
                "transformerIndexName",
                transformerIndexName,
                "transformerFunction",
                transformerFunction == undefined ? "undefined" : "defined",
                transformerFunction.toString()
                // JSON.stringify(transformerFunction, null, 2)
                // foundApplicationTransformer?.transformerImplementation?.inMemoryImplementationFunctionName,
                // JSON.stringify(inMemoryTransformerImplementations[
                //   foundApplicationTransformer.transformerImplementation
                //     .inMemoryImplementationFunctionName
                // ], null, 2)
              );
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
                  label,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2)
                );
                preResult = new Domain2ElementFailed({
                  // queryFailure: "QueryNotExecutable",
                  queryFailure: "TransformerNotFound",
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext:
                    "transformerImplementation " +
                    (foundApplicationTransformer as any).transformerImplementation
                      .inMemoryImplementationFunctionName +
                    " not found",
                  queryParameters: transformer as any,
                });
              }
              // return inMemoryTransformerImplementations[
              //   foundApplicationTransformer.transformerImplementation
              //     .inMemoryImplementationFunctionName
              // ](
              log.info("transformer_extended_apply calling transformerFunction");
              const result = transformerFunction(
                step,
                label,
                transformer,
                newResolveBuildTransformersTo,
                transformerParams,
                contextResults
              );
              log.info(
                "transformer_extended_apply called transformerFunction",
                "result",
                JSON.stringify(result, null, 2)
              );
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
              // if (foundApplicationTransformer.transformerImplementation.transformerImplementationType == "transformer") {
              // TODO: clean up environment, only parameters to transformer should be passed
              // evaluate transformer parameters
              if (!foundApplicationTransformer.transformerInterface) {
                log.error(
                  "transformer_extended_apply failed for",
                  label,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2)
                );
                preResult = new Domain2ElementFailed({
                  queryFailure: "QueryNotExecutable",
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext:
                    "transformer " + (transformer as any).transformerType + " not found",
                  queryParameters: transformer as any,
                });
              } else {
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
                        label,
                        (transformer as any)[param],
                        resolveBuildTransformersTo,
                        transformerParams,
                        contextResults
                      ),
                    ];
                  })
                );
                preResult = transformer_extended_apply(
                  step,
                  label,
                  foundApplicationTransformer.transformerImplementation.definition,
                  newResolveBuildTransformersTo,
                  transformerParams,
                  { ...contextResults, ...evaluatedParams }
                  // {...contextResults, ...(transformer as any)} // inner definitions do not have parameter references, only context references
                );
              }
              // }
              break;
            }
            default: {
              return new Domain2ElementFailed({
                // queryFailure: "QueryNotExecutable",
                queryFailure: "FailedTransformer",
                failureOrigin: ["transformer_extended_apply"],
                queryContext:
                  "transformerImplementation " +
                  (transformer as any).transformerImplementation +
                  " not found",
                queryParameters: transformer as any,
              });
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
          }
          if (preResult instanceof Domain2ElementFailed) {
            log.error(
              "transformer_extended_apply failed for",
              label,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2),
              "result",
              JSON.stringify(preResult, null, 2)
            );
            return preResult;
          } else {
            if (
              (transformer as any)["interpolation"] == "build" &&
              resolveBuildTransformersTo == "constantTransformer"
            ) {
              const value = preResult;
              result = {
                transformerType: "constant",
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

          result = innerTransformer_plainObject_apply(
            step,
            label,
            transformer,
            newResolveBuildTransformersTo,
            transformerParams,
            contextResults
          );
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
          label,
          transformer,
          newResolveBuildTransformersTo,
          transformerParams,
          contextResults
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
    //   "transformer_extended_apply called for",
    //   label,
    //   // "step:",
    //   // step,
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
export function transformer_extended_apply_wrapper<T extends MiroirModelEnvironment>(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime | TransformerForBuildPlusRuntime,
  // queryParams: Record<string, any>,
  transformerParams: T,
  contextResults?: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo = "constantTransformer",
): Domain2QueryReturnType<any> {
  try {
    const result = transformer_extended_apply(
      step,
      label,
      transformer,
      resolveBuildTransformersTo,
      transformerParams,
      contextResults,
    );
    // log.info(
    //   "transformer_extended_apply_wrapper called for",
    //   label,
    //   "transformer_extended_apply result",
    //   JSON.stringify(result, null, 2),
    // );  
    if (result instanceof Domain2ElementFailed) {
      log.error(
        "transformer_extended_apply_wrapper failed for",
        label??(transformer as any)["transformerType"],
        "step",
        step,
        "transformer",
        JSON.stringify(transformer, null, 2),
        "result",
        JSON.stringify(result, null, 2)
      );
      return new Domain2ElementFailed({
        // queryFailure: "QueryNotExecutable",
        queryFailure: "FailedTransformer",
        // queryFailure: result.queryFailure,
        failureOrigin: ["transformer_extended_apply"],
        innerError: result,
        queryContext: "failed to transform object attribute",
        // queryParameters: JSON.stringify(transformer),
        queryParameters: transformer as any,
      });
    } else {
      // log.info(
      //   "transformer_extended_apply_wrapper called for",
      //   label,
      //   "transformer_extended_apply result",
      //   JSON.stringify(result, null, 2),
      // );
      return result;
    }
  } catch (e) {
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
    return new Domain2ElementFailed({
      // queryFailure: "QueryNotExecutable",
      queryFailure: "FailedTransformer",
      failureOrigin: ["transformer_extended_apply"],
      // innerError: e as any,
      innerError: serializeError(e) as any,
      queryContext: "failed to transform object attribute",
    });
  }
}
// ################################################################################################
export function applyTransformer(t: Transformer, o: any):any {
  switch (t.transformerType) {
    case "recordOfTransformers": { // build object from record of transformers
      const result =  Object.fromEntries(Object.entries(t.definition).map(e=>[e[0],applyTransformer(e[1],o)]))
      // log.info("applyTransformer",t, "parameter", o, "return", result)
      return result
    }
    case "objectTransformer": { // access object attribute
      const result = o[t.attributeName]
      return result;
      break;
    }
    default:
      throw new Error(`Transformer ${JSON.stringify(t)} can not be applied`);
      break;
  }
}

