// import { diff } from "util";
// import * as Diff from "diff";
import { diffString, diff } from 'json-diff';
import type { EntityDefinition, ModelAction } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import type { Uuid } from '../0_interfaces/1_core/EntityDefinition';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportPage"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

/**
 * 
 * @param entityDefinitionBefore 
 * @param entityDefinitionAfter 
 * @returns 
 */
export function getModelUpdate(
  application: Uuid,
  entityDefinitionBefore: EntityDefinition,
  entityDefinitionAfter: EntityDefinition
): ModelAction | null {
  if (entityDefinitionBefore.uuid !== entityDefinitionAfter.uuid) {
    throw new Error("EntityDefinitions must have the same UUID to compute a ModelUpdate.");
  }
  const changes = diff(entityDefinitionBefore, entityDefinitionAfter);
  // log.info("Computed diff changes:", changes);
  if (!changes) {
    return null;
  }

  // Analyze changes to mlSchema.definition
  const jzodSchemaChanges = changes?.mlSchema?.definition;
  if (!jzodSchemaChanges) {
    throw new Error("getModelUpdate: Only mlSchema.definition changes are currently supported.");
  }

  // Extract added and removed columns and check for structural changes
  const addColumns: { name: string; definition: any }[] = [];
  const removeColumns: string[] = [];
  let hasStructuralChanges = false;

  for (const [key, value] of Object.entries(jzodSchemaChanges)) {
    if (key.endsWith("__added")) {
      const columnName = key.replace("__added", "");
      addColumns.push({
        name: columnName,
        definition: value,
      });
      hasStructuralChanges = true;
    } else if (key.endsWith("__deleted")) {
      const columnName = key.replace("__deleted", "");
      removeColumns.push(columnName);
      hasStructuralChanges = true;
    } else {
      // Check if the change is only in the tag (metadata)
      const attributeChanges = value as any;
      if (attributeChanges && typeof attributeChanges === 'object') {
        // If there are changes other than just 'tag', it's a structural change
        const changeKeys = Object.keys(attributeChanges);
        const hasNonTagChanges = changeKeys.some(k => k !== 'tag' && k !== 'tag__added' && k !== 'tag__deleted');
        if (hasNonTagChanges) {
          hasStructuralChanges = true;
        }
      }
    }
  }

  // If only tag changes (metadata), return null as no structural change occurred
  if (!hasStructuralChanges) {
    return null;
  }

  // Build the ModelAction
  const modelAction: ModelAction = {
    actionType: "alterEntityAttribute",    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: {
      application: application,
      // deploymentUuid: entityDefinitionBefore.parentUuid,
      entityName: entityDefinitionBefore.name,
      entityUuid: entityDefinitionBefore.entityUuid,
      entityDefinitionUuid: entityDefinitionBefore.uuid,
      addColumns: addColumns.length > 0 ? addColumns : undefined,
      removeColumns: removeColumns.length > 0 ? removeColumns : undefined,
    },
  };

  return modelAction;
}