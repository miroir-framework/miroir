import { v4 as uuidv4 } from 'uuid';

import { DomainState } from '../../0_interfaces/2_domain/DomainControllerInterface';
import { Uuid } from '../../0_interfaces/1_core/EntityDefinition';
import {
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchema,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ReduxDeploymentsState } from '../../0_interfaces/2_domain/ReduxDeploymentsStateInterface';
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { getEntityInstancesUuidIndexNonHook } from '../../2_domain/ReduxDeploymentsStateQueryExecutor';
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import { resolveObjectExtendClauseAndDefinition } from "./jzodTypeCheck";
import { resolveConditionalSchema } from './resolveConditionalSchema';
import { transformer_extended_apply_wrapper } from '../../2_domain/TransformersForRuntime';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getDefaultValueForJzodSchema")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolution(
  rootLessListKey: string,
  jzodSchema: JzodElement,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  forceOptional: boolean = false,
  deploymentUuid: Uuid | undefined,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
  rootObject?: any, // Optional parameter for backward compatibility
): any {

  log.info(
    "getDefaultValueForJzodSchemaWithResolution called with",
    "currentValuePath",
    currentValuePath,
    "jzodSchema",
    jzodSchema,
    "currentDefaultValue",
    currentDefaultValue,
    "forceOptional",
    forceOptional,
    "deploymentUuid",
    deploymentUuid,
  );

  let effectiveSchemaOrError = resolveConditionalSchema(
    jzodSchema,
    rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
    currentValuePath,
    reduxDeploymentsState,
    // getEntityInstancesUuidIndex,
    deploymentUuid,
    'defaultValue' // Specify this is for default value generation
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
    return undefined;
  }
  // let result

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

  switch (effectiveSchema.type) {
    case "object": {
      const resolvedObjectType = resolveObjectExtendClauseAndDefinition(
        effectiveSchema,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution called with resolvedObjectType",
      //   resolvedObjectType
      // );
      let result: Record<string, any> = {};

      // Object.fromEntries(
      Object.entries(resolvedObjectType.definition)
        .filter((a) => !a[1].optional)
        .forEach((a) => {
          const attributeName = a[0];
          const attributeValue = getDefaultValueForJzodSchemaWithResolution(
            rootLessListKey,
            a[1],
            result,
            currentValuePath.concat([a[0]]),
            reduxDeploymentsState,
            forceOptional,
            deploymentUuid,
            // deploymentEntityStateSelectorMap,
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext,
            rootObject
          );
          result[attributeName] = attributeValue;
        });
      // );
      // log.info(
      //   "getDefaultValueForJzodSchemaWithResolution result",
      //   result
      // );
      return result;
    }
    case "string": {
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
      
      // return "00000000-0000-0000-0000-000000000000"; // default UUID value
      // TODO: handle case where UUID is optional (?)
      // TODO: handle case whet UUID is a foreign key reference
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
      // if (effectiveSchema.tag && effectiveSchema.tag.value && effectiveSchema.tag.value.targetEntity) {
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
          deploymentUuid,
          effectiveSchema.tag.value.selectorParams.targetEntity,
          effectiveSchema.tag.value.selectorParams.targetEntityOrderInstancesBy
          // sortBy
        );

        // const foreignKeyObjects: EntityInstancesUuidIndex = getEntityInstancesUuidIndex(
        //   deploymentUuid,
        //   effectiveSchema.tag.value.selectorParams.targetEntity,
        //   effectiveSchema.tag.value.selectorParams.targetEntityOrderInstancesBy
        // );
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
      break;
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
      const resolvedReference = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        effectiveSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      return getDefaultValueForJzodSchemaWithResolution(
        rootLessListKey,
        resolvedReference,
        currentDefaultValue,
        currentValuePath,
        reduxDeploymentsState,
        forceOptional,
        deploymentUuid,
        // applicationSection,
        // deploymentEntityStateSelectorMap,
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext,
        rootObject
      );
      // throw new Error(
      //   "getDefaultValueForJzodSchemaWithResolution does not support schema references, please resolve schema in advance: " +
      //     JSON.stringify(jzodSchema, null, 2)
      // );
    }
    case "union": {
      // throw new Error("getDefaultValueForJzodSchemaWithResolution does not handle type: " + effectiveSchema.type + " for effectiveSchema="  + JSON.stringify(effectiveSchema, null, 2));
      // just take the first choice for default value
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
          rootLessListKey,
          effectiveSchema.definition[0],
          currentDefaultValue,
          currentValuePath,
          reduxDeploymentsState,
          forceOptional,
          deploymentUuid,
          miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext,
          rootObject
        );
      }
      break;
    }
    case "enum": {
      if (effectiveSchema.tag?.value?.initializeTo?.initializeToType == "value") {
        return effectiveSchema.tag?.value?.initializeTo.value;
      // } else if (effectiveSchema.definition.length > 0) {
      //   return effectiveSchema.definition[0];
      } else {
        throw new Error(
          "getDefaultValueForJzodSchemaWithResolution enum definition does not have 'tag.value.initalizeTo' for effectiveSchema=" +
            JSON.stringify(effectiveSchema, null, 2)
        );
      }
      break;
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
      break;
    }
    default: {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution reached default case for type, this is a bug: " +
          JSON.stringify(effectiveSchema, null, 2)
      );
      break;
    }
  }
}


// ################################################################################################
/**
 * Non-hook version of getDefaultValueForJzodSchemaWithResolution that uses ReduxDeploymentsState directly
 * instead of relying on React hooks for data fetching
 */
export function getDefaultValueForJzodSchemaWithResolutionNonHook(
  rootLessListKey: string,
  jzodSchema: JzodElement,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  forceOptional: boolean = false,
  deploymentUuid: Uuid | undefined,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
  rootObject?: any,
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

  // Create a function that uses the deployment entity state directly
  if (deploymentUuid == undefined || deploymentUuid.length < 8 || !reduxDeploymentsState) {
    // return undefined;
    return getDefaultValueForJzodSchemaWithResolution(
      rootLessListKey,
      jzodSchema,
      currentDefaultValue,
      currentValuePath,
      undefined,
      forceOptional,
      undefined,
      miroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      relativeReferenceJzodContext,
      rootObject
    );
  }
  // const getEntityInstancesUuidIndex = (
  //   deploymentUuid: Uuid,
  //   entityUuid: Uuid,
  //   sortBy?: string
  // ): EntityInstancesUuidIndex => {
  //   log.info(
  //     "getEntityInstancesUuidIndex called with",
  //     "deploymentUuid",
  //     deploymentUuid,
  //     "entityUuid",
  //     entityUuid,
  //     "sortBy",
  //     sortBy
  //   );
  //   return getEntityInstancesUuidIndexNonHook(
  //     deploymentEntityState,
  //     deploymentUuid,
  //     entityUuid,
  //     sortBy
  //   );
  // };

  // Call the original function with our new getter
  return getDefaultValueForJzodSchemaWithResolution(
    rootLessListKey,
    jzodSchema,
    currentDefaultValue,
    currentValuePath,
    reduxDeploymentsState,
    forceOptional,
    deploymentUuid,
    miroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    relativeReferenceJzodContext,
    rootObject,
  );
}


