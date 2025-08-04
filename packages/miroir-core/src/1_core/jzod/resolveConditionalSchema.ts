
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
  currentDefaultValue: any,
  currentValuePath: string[],
  getEntityInstancesUuidIndex: (
    deploymentUuid: Uuid,
    entityUuid: Uuid,
    sortBy?: string
  ) => EntityInstancesUuidIndex,
  deploymentUuid: string
) {
  let effectiveSchema: JzodElement = jzodSchema;
  if (jzodSchema.tag && jzodSchema.tag.value && jzodSchema.tag.value.conditionalMMLS) {
    // If the schema has a conditionalMMLS, we use it as the effective schema
    if (
      !jzodSchema.tag.value.conditionalMMLS.parentUuid ||
      typeof jzodSchema.tag.value.conditionalMMLS.parentUuid !== "object"
    ) {
      throw new Error(
        "getDefaultValueForJzodSchemaWithResolution called with jzodSchema.tag.value.conditionalMMLS.parentUuid that is not an object or is null: " +
          JSON.stringify(jzodSchema.tag.value.conditionalMMLS.parentUuid, null, 2)
      );
    }
    const parentUuid = resolveRelativePath(
      currentDefaultValue,
      currentValuePath,
      jzodSchema.tag.value.conditionalMMLS.parentUuid.path.split(".") as RelativePath
    );
    log.info("getDefaultValueForJzodSchemaWithResolution resolved parentUuid", parentUuid);
    // const parentEntityMMLSchema = getEntityInstancesUuidIndex(
    const currentDeploymentEntityDefinitions: EntityInstancesUuidIndex =
      getEntityInstancesUuidIndex(deploymentUuid, entityEntityDefinition.uuid);
    log.info(
      "getDefaultValueForJzodSchemaWithResolution currentDeploymentEntityDefinitions",
      currentDeploymentEntityDefinitions
    );
    const parentEntityDefinition = (
      currentDeploymentEntityDefinitions[parentUuid] as EntityDefinition
    ).jzodSchema;
    log.info(
      "getDefaultValueForJzodSchemaWithResolution parentEntityDefinition",
      parentEntityDefinition
    );
    effectiveSchema = parentEntityDefinition;
  }
  return effectiveSchema;
}
