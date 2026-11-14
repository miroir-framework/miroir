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
const INSTANCE_ENDPOINT_UUID = "ed520de4-55a9-4550-ac50-b1b713b72a89";

/**
 * Set by the REST server on a write it received through its persistence endpoint: that write comes from
 * another DomainController's persistence layer, which records it. A symbol-keyed property: object spreads
 * keep it, JSON drops it, so it is never sent or stored.
 */
const RECORDED_BY_SENDER = Symbol.for("miroir.evolutionTrace.recordedBySender");

/** `action`, marked as recorded by the DomainController that sent it. */
export function markRecordedBySender<T extends object>(action: T): T {
  return { ...action, [RECORDED_BY_SENDER]: true };
}

/** Whether the DomainController that sent `action` records it already. */
export function isRecordedBySender(action: unknown): boolean {
  return !!action && typeof action === "object" && (action as Record<symbol, unknown>)[RECORDED_BY_SENDER] === true;
}

/** How a record holds an instance write: its type, the instance endpoint, and the payload fields a replay needs. */
export function recordedInstanceWrite(action: {
  actionType: string;
  payload: { application: string; applicationSection?: string; section?: string; parentUuid?: string; objects?: any[] };
}) {
  const objects = action.payload.objects ?? [];
  return {
    actionType: action.actionType,
    endpoint: INSTANCE_ENDPOINT_UUID,
    payload: {
      application: action.payload.application,
      applicationSection: action.payload.applicationSection ?? action.payload.section,
      parentUuid: action.payload.parentUuid ?? objects[0]?.parentUuid,
      objects,
    },
  };
}

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

/**
 * The warning logged when an application loads with `evolutionTraces` set but unversioned, which turns
 * the traces off; `undefined` otherwise.
 */
export function evolutionTracesIgnoredWarning(
  selfApplication: (EvolutionTraceSwitchInput & { name?: string }) | undefined,
): string | undefined {
  if (!selfApplication) {
    return undefined;
  }
  const flag = selfApplication.evolutionTraces === true || selfApplication.evolutionTraces === "true";
  if (!flag || resolveVersioningMode(selfApplication) !== "unversioned") {
    return undefined;
  }
  return `application ${selfApplication.name ?? ""} has evolutionTraces on but is unversioned: its traces are off`;
}

/**
 * #708 (D6): whether an application has its `modelVersion` section fetched when it loads: always when
 * versioned-internal, and for a versioned-git application only when its traces are on.
 */
export function fetchesModelVersion(selfApplication: EvolutionTraceSwitchInput | undefined): boolean {
  const mode = resolveVersioningMode(selfApplication ?? {});
  return mode === "versioned-internal" || (mode === "versioned-git" && isEvolutionTraceOn(selfApplication));
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
