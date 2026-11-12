/**
 * #708: which writes make an evolution trace record, and whether an application's traces are on.
 * The DomainController that runs a commit collects the model Actions it replayed, keeps those these
 * rules record, and sends one record per application whose traces are on (`appendEvolutionTraceRecord`).
 * The package `@miroir-framework/versioning` stores the records; core only decides what goes in them.
 */
import { entitySelfApplication, selfApplicationMiroir } from "miroir-app-miroir";

import type { ApplicationSection } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection, versionHistoryEntityUuids } from "../Model.js";
import { resolveVersioningMode, type VersioningModeInput } from "./versioningMode.js";
import {
  APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE,
  type AppendEvolutionTraceRecordPayload,
} from "./versioningInterfaces.js";

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";

/** The model Actions a record holds. */
const RECORDED_MODEL_ACTION_TYPES: ReadonlySet<string> = new Set([
  "createEntity",
  "alterEntityAttribute",
  "renameEntity",
  "dropEntity",
]);

/** The instance writes a record holds, when they write a model element. */
const RECORDED_INSTANCE_ACTION_TYPES: ReadonlySet<string> = new Set([
  "createInstance",
  "updateInstance",
  "deleteInstance",
]);

/** The SelfApplication row the switch is read from, as SelfApplication rows store it. */
export type EvolutionTraceSwitchInput = VersioningModeInput & { evolutionTraces?: boolean | string };

/**
 * Whether an application's traces are on: `evolutionTraces` set on its SelfApplication row, and the
 * application versioned. On an unversioned application the flag reads as off.
 */
export function isEvolutionTraceOn(selfApplication: EvolutionTraceSwitchInput | undefined): boolean {
  if (!selfApplication) {
    return false;
  }
  const flag = selfApplication.evolutionTraces === true || selfApplication.evolutionTraces === "true";
  return flag && resolveVersioningMode(selfApplication) !== "unversioned";
}

/** The uuid of the SelfApplication Entity, and the section of an application that holds its row. */
export function selfApplicationRowLocation(application: string): { section: ApplicationSection; entityUuid: string } {
  return {
    section: getApplicationSection(application, entitySelfApplication.uuid),
    entityUuid: entitySelfApplication.uuid,
  };
}

/** The sections whose instance writes change a model: `model`, and Miroir's `data`, which holds its model elements. */
function isModelSection(application: string, section: string | undefined): boolean {
  return section === "model" || (application === selfApplicationMiroir.uuid && section === "data");
}

type RecordableAction = {
  actionType?: string;
  payload?: {
    application?: string;
    applicationSection?: string;
    section?: string;
    parentUuid?: string;
    entity?: { uuid?: string };
    entityUuid?: string;
    entities?: Array<{ entity?: { uuid?: string }; uuid?: string }>;
    objects?: Array<{ parentUuid?: string }>;
  };
};

function writesVersionHistory(entityUuids: Array<string | undefined>): boolean {
  return entityUuids.some((uuid) => uuid !== undefined && versionHistoryEntityUuids.has(uuid));
}

/**
 * Whether a model Action or an instance write goes into a record. Writes to `modelVersion`, `data`
 * (except Miroir's), `devData` and the admin application make none, nor do writes of the version-history
 * Entities themselves (the freeze and the record writer create them on demand).
 */
export function isRecordedModelChange(action: RecordableAction): boolean {
  const application = action.payload?.application;
  if (!action.actionType || !application) {
    return false;
  }
  if (RECORDED_MODEL_ACTION_TYPES.has(action.actionType)) {
    const payload = action.payload ?? {};
    const entityUuids = [
      payload.entity?.uuid,
      payload.entityUuid,
      ...(payload.entities ?? []).map((entry) => entry.entity?.uuid ?? entry.uuid),
    ];
    return !writesVersionHistory(entityUuids);
  }
  if (RECORDED_INSTANCE_ACTION_TYPES.has(action.actionType)) {
    const section = action.payload?.applicationSection ?? action.payload?.section;
    if (!isModelSection(application, section)) {
      return false;
    }
    const parents = [action.payload?.parentUuid, ...(action.payload?.objects ?? []).map((object) => object.parentUuid)];
    return !writesVersionHistory(parents);
  }
  return false;
}

/** The `appendEvolutionTraceRecord` action for a payload. */
export function appendEvolutionTraceRecordAction(payload: AppendEvolutionTraceRecordPayload) {
  return {
    actionType: APPEND_EVOLUTION_TRACE_RECORD_ACTION_TYPE,
    actionLabel: `appendEvolutionTraceRecord_${payload.kind}`,
    endpoint: MODEL_ENDPOINT_UUID,
    payload,
  };
}
