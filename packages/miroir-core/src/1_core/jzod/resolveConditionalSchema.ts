
import { get } from 'http';
import { entityEntityDefinition } from '../..';
import { Uuid } from '../../0_interfaces/1_core/EntityDefinition';
import {
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { RelativePath, resolveRelativePath } from '../../tools';
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "resolveConditionalSchema")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export function resolveConditionalSchema(
  jzodSchema: JzodElement,
  rootObject: any, // Changed from currentDefaultValue to rootObject
  currentValuePath: string[],
  getEntityInstancesUuidIndex: ((
    deploymentUuid: Uuid,
    entityUuid: Uuid,
    sortBy?: string
  ) => EntityInstancesUuidIndex) | undefined = undefined,
  deploymentUuid: Uuid | undefined = undefined,
  context: 'defaultValue' | 'typeCheck' = 'typeCheck' // New parameter for context
) {
  let effectiveSchema: JzodElement = jzodSchema;
  if (jzodSchema.tag && jzodSchema.tag.value && jzodSchema.tag.value.conditionalMMLS) {
    // If the schema has a conditionalMMLS, we use it as the effective schema
    const conditionalConfig = jzodSchema.tag.value.conditionalMMLS;
    
    // Check for dual path configuration (Solution 2)
    if (conditionalConfig.parentUuid && typeof conditionalConfig.parentUuid === "object") {
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
        throw new Error(
          "resolveConditionalSchema called with conditionalMMLS.parentUuid that has neither path nor defaultValuePath/typeCheckPath: " +
            JSON.stringify(conditionalConfig.parentUuid, null, 2)
        );
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
      
      log.info("getDefaultValueForJzodSchemaWithResolution resolved parentUuid", parentUuid);
      if (!getEntityInstancesUuidIndex) {
        throw new Error(
          "resolveConditionalSchema called with conditionalMMLS.parentUuid but no getEntityInstancesUuidIndex function provided"
        );
      }
      if (!deploymentUuid) {
        throw new Error(
          "resolveConditionalSchema called with conditionalMMLS.parentUuid but no deploymentUuid provided"
        );
      }
      const currentDeploymentEntityDefinitions: EntityDefinition[] =
        getEntityInstancesUuidIndex(deploymentUuid, entityEntityDefinition.uuid) as any;
      log.info(
        "getDefaultValueForJzodSchemaWithResolution currentDeploymentEntityDefinitions",
        currentDeploymentEntityDefinitions
      );
      const parentEntityDefinition = (
        currentDeploymentEntityDefinitions.find(e => e.entityUuid === parentUuid) as EntityDefinition
      ).jzodSchema;
      log.info(
        "getDefaultValueForJzodSchemaWithResolution parentEntityDefinition",
        parentEntityDefinition
      );
      effectiveSchema = parentEntityDefinition;
    }
    log.info(
      "resolveConditionalSchema return effectiveSchema",
      effectiveSchema,
    );
  }
  return effectiveSchema;
}
