import { v4 as uuidv4 } from 'uuid';

import {
  ApplicationSection,
  DomainElementSuccess,
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchema,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import { resolveObjectExtendClauseAndDefinition } from "./jzodTypeCheck";
import { SyncBoxedExtractorOrQueryRunnerMap, SyncQueryRunner, SyncQueryRunnerParams } from '../../0_interfaces/2_domain/ExtractorRunnerInterface';
import { DeploymentEntityState } from '../../0_interfaces/2_domain/DeploymentStateInterface';
import { getQueryRunnerParamsForDeploymentEntityState } from '../../2_domain/DeploymentEntityStateQuerySelectors';
import { Uuid } from '../../0_interfaces/1_core/EntityDefinition';
import { getApplicationSection } from '../AdminApplication';
import { Domain2QueryReturnType } from '../../0_interfaces/2_domain/DomainElement';
import { getEntityInstancesUuidIndexNonHook } from '../../2_domain/DeploymentEntityStateQueryExecutor';
import { RelativePath, resolvePathOnObject, resolveRelativePath } from '../../tools';
import { entityEntity, entityEntityDefinition, transformer_extended_apply_wrapper } from '../..';
import { resolveConditionalSchema } from './resolveConditionalSchema';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getDefaultValueForJzodSchema")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function getDefaultValueForJzodSchemaWithResolution(
  jzodSchema: JzodElement,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  getEntityInstancesUuidIndex:(
    deploymentUuid: Uuid,
    entityUuid: Uuid,
    sortBy?: string
  ) => EntityInstancesUuidIndex,
  forceOptional: boolean = false,
  deploymentUuid: Uuid,
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

  let effectiveSchema: JzodElement = resolveConditionalSchema(
    jzodSchema,
    rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
    currentValuePath,
    getEntityInstancesUuidIndex,
    deploymentUuid,
    'defaultValue' // Specify this is for default value generation
  );

  //  = jzodSchema.tag && jzodSchema.tag.value?.conditionalMMLS? jzodSchema:jzodSchema as JzodElement;
  if (effectiveSchema.optional && !forceOptional) {
    return undefined;
  }
  // let result
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
            a[1],
            result,
            currentValuePath.concat([a[0]]),
            getEntityInstancesUuidIndex,
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
      if (effectiveSchema.tag && effectiveSchema.tag.value && effectiveSchema.tag.value.selectorParams && effectiveSchema.tag.value.selectorParams.targetEntity) {
        const foreignKeyObjects: EntityInstancesUuidIndex = getEntityInstancesUuidIndex(
          deploymentUuid,
          effectiveSchema.tag.value.selectorParams.targetEntity,
          effectiveSchema.tag.value.selectorParams.targetEntityOrderInstancesBy
        )
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
        resolvedReference,
        currentDefaultValue,
        currentValuePath,
        getEntityInstancesUuidIndex,
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
          effectiveSchema.definition[0],
          currentDefaultValue,
          currentValuePath,
          getEntityInstancesUuidIndex,
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
 * Non-hook version of getDefaultValueForJzodSchemaWithResolution that uses DeploymentEntityState directly
 * instead of relying on React hooks for data fetching
 */
export function getDefaultValueForJzodSchemaWithResolutionNonHook(
  jzodSchema: JzodElement,
  currentDefaultValue: any = undefined,
  currentValuePath: string[] = [],
  deploymentEntityState: DeploymentEntityState | undefined = undefined,
  forceOptional: boolean = false,
  deploymentUuid: Uuid | undefined,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: { [k: string]: JzodElement },
): any {
  log.info(
    "getDefaultValueForJzodSchemaWithResolutionNonHook called with",
    "deploymentUuid",
    deploymentUuid,
    "jzodSchema",
    jzodSchema,
    "forceOptional",
    forceOptional,
    "currentDefaultValue",
    currentDefaultValue,
    "currentValuePath",
    currentValuePath,
    "deploymentEntityState", deploymentEntityState,
  );
  // Create a function that uses the deployment entity state directly
  if (deploymentUuid == undefined || deploymentUuid.length < 8 || !deploymentEntityState) {
    return undefined;
    // throw new Error(
    //   "getDefaultValueForJzodSchemaWithResolutionNonHook called with invalid deploymentUuid or deploymentEntityState"
    // );
  }
  const getEntityInstancesUuidIndex = (
    deploymentUuid: Uuid,
    entityUuid: Uuid,
    sortBy?: string
  ): EntityInstancesUuidIndex => {
    log.info(
      "getEntityInstancesUuidIndex called with",
      "deploymentUuid",
      deploymentUuid,
      "entityUuid",
      entityUuid,
      "sortBy",
      sortBy
    );
    return getEntityInstancesUuidIndexNonHook(
      deploymentEntityState,
      deploymentUuid,
      entityUuid,
      sortBy
    );
  };

  // Call the original function with our new getter
  return getDefaultValueForJzodSchemaWithResolution(
    jzodSchema,
    currentDefaultValue,
    currentValuePath,
    getEntityInstancesUuidIndex,
    forceOptional,
    deploymentUuid,
    miroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    relativeReferenceJzodContext,
    undefined // rootObject not available in non-hook version
  );
}


