import type { EntityVersion, ModelAction } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "./../constants";
import type { Uuid } from '../../0_interfaces/1_core/EntityVersion';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportPage");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

/**
 * #370: json-diff (with its `assert` polyfill) is not in the page's eager bundle. Node loads it
 * with this module; elsewhere `ensureJsonDiff()` loads it before `getModelUpdate` runs.
 */
type JsonDiff = (before: unknown, after: unknown) => any;
let jsonDiff: JsonDiff | undefined =
  typeof process !== "undefined" && process.versions?.node
    ? jsonDiffFromModule(await import("json-diff"))
    : undefined;

function jsonDiffFromModule(module: { diff?: JsonDiff; default?: { diff: JsonDiff } }): JsonDiff {
  return (module.diff ?? module.default?.diff) as JsonDiff;
}

export async function ensureJsonDiff(): Promise<void> {
  jsonDiff ??= jsonDiffFromModule(await import("json-diff"));
}

function diff(before: unknown, after: unknown) {
  if (!jsonDiff) throw new Error("json-diff not loaded: await ensureJsonDiff() first");
  return jsonDiff(before, after);
}

/**
 * 
 * @param entityDefinitionBefore 
 * @param entityDefinitionAfter 
 * @returns 
 */
export function getModelUpdate(
  application: Uuid,
  entityDefinitionBefore: EntityVersion,
  entityDefinitionAfter: EntityVersion
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
  const mlSchemaChanges = changes?.mlSchema?.definition;
  if (!mlSchemaChanges) {
    throw new Error("getModelUpdate: Only mlSchema.definition changes are currently supported.");
  }

  // Extract added and removed columns and check for structural changes
  const addColumns: { name: string; definition: any }[] = [];
  const removeColumns: string[] = [];
  let hasStructuralChanges = false;

  for (const [key, value] of Object.entries(mlSchemaChanges)) {
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
    actionType: "alterEntityAttribute",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: {
      application: application,
      // deploymentUuid: entityDefinitionBefore.parentUuid,
      entityName: entityDefinitionBefore.name,
      entityUuid: entityDefinitionBefore.entityUuid,
      addColumns: addColumns.length > 0 ? addColumns : undefined,
      removeColumns: removeColumns.length > 0 ? removeColumns : undefined,
    },
  };

  return modelAction;
}