/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 * #220 — Freeze-adjacent vocabulary uses EntityVersion only.
 */

import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationSection,
  ApplicationVersion,
  Entity,
  EntityVersion,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { noValue } from "../Instance.js";
import { getEntityVersionWriteSection } from "../Model.js";
import {
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
  type EntityPresentModelDefinitionField,
} from "./applicationVersioning.js";

/** Runner form defaults often leave branch as the `noValue` sentinel UUID. */
function normalizeOptionalBranchUuid(branch: string | undefined): string | undefined {
  if (!branch || branch === noValue.uuid) {
    return undefined;
  }
  return branch;
}

// ---------------------------------------------------------------------------
// Phase 0: Action type constant
// ---------------------------------------------------------------------------

/** Model Endpoint actionType for user-triggered freeze (ADR D1-a). */
export const FREEZE_APPLICATION_VERSION_ACTION_TYPE = "freezeApplicationVersion" as const;

export type FreezeApplicationVersionActionType =
  typeof FREEZE_APPLICATION_VERSION_ACTION_TYPE;

// ---------------------------------------------------------------------------
// Phase 1: Versioning gate
// ---------------------------------------------------------------------------

/**
 * Reject freeze / version-history Actions for unversioned applications.
 * Throws when `versioningEnabled` is not strictly `true`.
 */
export function assertApplicationVersioningEnabled(
  selfApplication: { versioningEnabled?: boolean | undefined },
): void {
  if (selfApplication.versioningEnabled !== true) {
    throw new Error(
      `Application does not have versioning enabled (versioningEnabled: ${String(selfApplication.versioningEnabled)})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Entity snapshot → historical EntityVersions
// ---------------------------------------------------------------------------

/** EntityVersion entity UUID (bootstrap metamodel identity). */
const ENTITY_VERSION_ENTITY_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
/** SelfApplicationVersion Entity UUID. */
const APPLICATION_VERSION_ENTITY_UUID = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
/** ApplicationVersionCrossEntityVersion Entity UUID. */
const APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID =
  "8bec933d-6287-4de7-8a88-5c24216de9f4";

export interface SnapshotOptions {
  /** UUID generator override for testing determinism. */
  newUuid?: () => string;
}

/**
 * #222 / #216 — section for persisting freeze-minted EntityVersion snapshots.
 * Miroir → `"data"`; Library / other MetaModel apps → `"model"`.
 */
export function resolveFreezeEntityVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getEntityVersionWriteSection(applicationUuid);
}

/**
 * Deep-copy present-model Entity fields into new immutable EntityVersion instances.
 * Each output has a **new** UUID; `entityUuid` references the live Entity.
 *
 * Throws if any Entity lacks `mlSchema` (incomplete present model).
 *
 * Do **not** use UUID-reuse compat helpers (e.g. presentEntityAsRedundant…) for freeze —
 * those reuse the live Entity uuid and are unsafe for historical minting (#220 / #216).
 */
export function snapshotEntitiesAsHistoricalEntityVersions(
  entities: Entity[],
  options?: SnapshotOptions,
): EntityVersion[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return entities.map((entity) => {
    if (!entity.mlSchema) {
      throw new Error(
        `Cannot snapshot Entity ${entity.uuid} (${entity.name}): mlSchema is missing`,
      );
    }

    const snapshot: EntityVersion = {
      uuid: mintUuid(),
      parentUuid: ENTITY_VERSION_ENTITY_UUID,
      parentName: "EntityVersion",
      name: entity.name,
      entityUuid: entity.uuid,
      conceptLevel: entity.conceptLevel ?? "Model",
      mlSchema: structuredClone(entity.mlSchema),
      ...(entity.defaultInstanceDetailsReportUuid !== undefined
        ? { defaultInstanceDetailsReportUuid: entity.defaultInstanceDetailsReportUuid }
        : {}),
      ...(entity.viewAttributes !== undefined
        ? { viewAttributes: structuredClone(entity.viewAttributes) }
        : {}),
      ...(entity.icon !== undefined ? { icon: structuredClone(entity.icon) } : {}),
      ...(entity.display !== undefined ? { display: structuredClone(entity.display) } : {}),
      ...(entity.cache !== undefined ? { cache: structuredClone(entity.cache) } : {}),
      ...(entity.idAttribute !== undefined
        ? { idAttribute: structuredClone(entity.idAttribute) }
        : {}),
      ...(entity.externalDataSource !== undefined
        ? { externalDataSource: structuredClone(entity.externalDataSource) }
        : {}),
    };

    return snapshot;
  });
}

// ---------------------------------------------------------------------------
// Phase 2: Freeze plan builder (pure; no persistence)
// ---------------------------------------------------------------------------

/** Cross row linking an Application Version to a historical EntityVersion. */
export type ApplicationVersionCrossEntityVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  entityVersion: string;
};

export type FreezeApplicationVersionPlan = {
  selfApplicationVersion: ApplicationVersion;
  entityVersions: EntityVersion[];
  crossEntityVersions: ApplicationVersionCrossEntityVersionRow[];
  /** Persist section for EntityVersion rows (Miroir data / Library model). */
  entityVersionApplicationSection: ApplicationSection;
};

export type BuildFreezeApplicationVersionPlanInput = {
  selfApplicationUuid: string;
  branchUuid: string;
  versionName: string;
  entities: Entity[];
  /** Existing SAVs for this app+branch — used for duplicate label detection and tip resolution. */
  existingApplicationVersions?: ApplicationVersion[];
  /**
   * Explicit previous SAV uuid. When omitted, auto-resolves via
   * {@link resolvePreviousApplicationVersion} using `freezeProducedVersionUuids`.
   */
  previousVersionUuid?: string;
  /**
   * SAV uuids known to be freeze-produced (have Entity-covering Cross).
   * Used when auto-resolving `previousVersion` (Phase 3).
   */
  freezeProducedVersionUuids?: ReadonlySet<string> | readonly string[];
  /**
   * Previous freeze EntityVersion snapshots (Option A diff → `modelCUDMigration`).
   * Omit on first freeze.
   */
  previousEntityVersions?: EntityVersion[];
  description?: string;
  newUuid?: () => string;
};

// ---------------------------------------------------------------------------
// Phase 4: Entity-set diff → rough migration evaluation (Option A)
// ---------------------------------------------------------------------------

export type ModelCudMigrationCandidate =
  | { kind: "createEntity"; entityUuid: string; name: string }
  | { kind: "dropEntity"; entityUuid: string; name: string }
  | {
      kind: "renameEntity";
      entityUuid: string;
      /** Name in previous snapshot. */
      name: string;
      /** Name in next snapshot. */
      targetName: string;
    }
  | {
      kind: "alterEntityAttribute";
      entityUuid: string;
      name: string;
      differingFields: EntityPresentModelDefinitionField[];
    };

function stableJsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function indexEntityVersionsByLiveUuid(
  versions: EntityVersion[],
): Map<string, EntityVersion> {
  const map = new Map<string, EntityVersion>();
  for (const ev of versions) {
    map.set(ev.entityUuid, ev);
  }
  return map;
}

/**
 * Option A: rough migration candidates from consecutive EntityVersion snapshots,
 * keyed by live `entityUuid`. Rename vs drop+create is uuid-based only (no fuzzy match).
 *
 * Order: creates → drops → per shared entity (rename then alter), each group sorted by entityUuid.
 */
export function diffEntityVersionSnapshots(
  previous: EntityVersion[],
  next: EntityVersion[],
): ModelCudMigrationCandidate[] {
  const prevByUuid = indexEntityVersionsByLiveUuid(previous);
  const nextByUuid = indexEntityVersionsByLiveUuid(next);
  const candidates: ModelCudMigrationCandidate[] = [];

  const created = [...nextByUuid.keys()]
    .filter((uuid) => !prevByUuid.has(uuid))
    .sort();
  for (const entityUuid of created) {
    const ev = nextByUuid.get(entityUuid)!;
    candidates.push({ kind: "createEntity", entityUuid, name: ev.name });
  }

  const dropped = [...prevByUuid.keys()]
    .filter((uuid) => !nextByUuid.has(uuid))
    .sort();
  for (const entityUuid of dropped) {
    const ev = prevByUuid.get(entityUuid)!;
    candidates.push({ kind: "dropEntity", entityUuid, name: ev.name });
  }

  const shared = [...prevByUuid.keys()]
    .filter((uuid) => nextByUuid.has(uuid))
    .sort();
  for (const entityUuid of shared) {
    const prevEv = prevByUuid.get(entityUuid)!;
    const nextEv = nextByUuid.get(entityUuid)!;

    if (prevEv.name !== nextEv.name) {
      candidates.push({
        kind: "renameEntity",
        entityUuid,
        name: prevEv.name,
        targetName: nextEv.name,
      });
    }

    const differingFields = ENTITY_PRESENT_MODEL_DEFINITION_FIELDS.filter(
      (field) => !stableJsonEqual(prevEv[field], nextEv[field]),
    );
    if (differingFields.length > 0) {
      candidates.push({
        kind: "alterEntityAttribute",
        entityUuid,
        name: nextEv.name,
        differingFields: [...differingFields],
      });
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Phase 3 / 7: Linear tip resolution (`previousVersion`)
// ---------------------------------------------------------------------------

/**
 * #216 ADR D6 / Phase 7 — SAV names that are never freeze tips.
 * Fixture `"Initial"` and legacy commit placeholder labels are ignored for tip
 * resolution even when `freezeProducedVersionUuids` is omitted.
 */
export const APPLICATION_VERSION_PLACEHOLDER_NAMES: ReadonlySet<string> = new Set([
  "Initial",
  "TODO: No label was given to this version.",
]);

export function isApplicationVersionPlaceholder(sav: { name: string }): boolean {
  return APPLICATION_VERSION_PLACEHOLDER_NAMES.has(sav.name);
}

export type ResolvePreviousApplicationVersionOptions = {
  selfApplicationUuid: string;
  branchUuid: string;
  /**
   * SAV uuids produced by freeze (have Entity-covering Cross rows).
   * When provided, only those SAVs are eligible as tip.
   * When omitted, all non-placeholder SAVs for app+branch are eligible
   * (#216 Phase 7: `"Initial"` / commit TODO labels always excluded).
   */
  freezeProducedVersionUuids?: ReadonlySet<string> | readonly string[];
};

/**
 * Resolve the linear tip (chain head) for an application+branch.
 *
 * Tip = SAV for app+branch that is not referenced as `previousVersion` by any
 * other eligible SAV. Placeholders (`"Initial"`, commit TODO labels) are never
 * tips. When `freezeProducedVersionUuids` is provided, only those SAVs are
 * considered. Throws if multiple chain heads remain.
 */
export function resolvePreviousApplicationVersion(
  versions: ApplicationVersion[],
  options: ResolvePreviousApplicationVersionOptions,
): ApplicationVersion | undefined {
  const freezeSet =
    options.freezeProducedVersionUuids === undefined
      ? undefined
      : options.freezeProducedVersionUuids instanceof Set
        ? options.freezeProducedVersionUuids
        : new Set(options.freezeProducedVersionUuids);

  // Explicit empty freeze set → no tip (placeholders ignored).
  if (freezeSet !== undefined && freezeSet.size === 0) {
    return undefined;
  }

  const scoped = versions.filter(
    (sav) =>
      sav.selfApplication === options.selfApplicationUuid &&
      sav.branch === options.branchUuid &&
      !isApplicationVersionPlaceholder(sav) &&
      (freezeSet === undefined || freezeSet.has(sav.uuid)),
  );
  if (scoped.length === 0) {
    return undefined;
  }

  const referencedAsPrevious = new Set(
    scoped
      .map((sav) => sav.previousVersion)
      .filter((uuid): uuid is string => typeof uuid === "string" && uuid.length > 0),
  );
  const heads = scoped.filter((sav) => !referencedAsPrevious.has(sav.uuid));

  if (heads.length === 0) {
    return undefined;
  }
  if (heads.length === 1) {
    return heads[0];
  }
  throw new Error(
    `Multiple Application Version chain heads for application ${options.selfApplicationUuid} branch ${options.branchUuid}: ${heads.map((h) => h.name).join(", ")}`,
  );
}

/**
 * Pure plan for a freeze: new SAV + historical EntityVersions + Cross rows.
 * Does not call the versioning gate — use {@link planFreezeApplicationVersion} for Action entry.
 */
export function buildFreezeApplicationVersionPlan(
  input: BuildFreezeApplicationVersionPlanInput,
): FreezeApplicationVersionPlan {
  const mintUuid = input.newUuid ?? uuidv4;
  const existing = input.existingApplicationVersions ?? [];
  const duplicate = existing.find(
    (sav) =>
      sav.selfApplication === input.selfApplicationUuid &&
      sav.branch === input.branchUuid &&
      sav.name === input.versionName,
  );
  if (duplicate) {
    throw new Error(
      `Application Version label "${input.versionName}" already exists for this application and branch`,
    );
  }

  const previousVersionUuid =
    input.previousVersionUuid !== undefined
      ? input.previousVersionUuid
      : resolvePreviousApplicationVersion(existing, {
          selfApplicationUuid: input.selfApplicationUuid,
          branchUuid: input.branchUuid,
          freezeProducedVersionUuids: input.freezeProducedVersionUuids,
        })?.uuid;

  const selfApplicationVersionUuid = mintUuid();
  const entityVersions = snapshotEntitiesAsHistoricalEntityVersions(input.entities, {
    newUuid: mintUuid,
  });

  const modelCUDMigration =
    input.previousEntityVersions !== undefined
      ? diffEntityVersionSnapshots(input.previousEntityVersions, entityVersions)
      : [];

  const selfApplicationVersion: ApplicationVersion = {
    uuid: selfApplicationVersionUuid,
    parentUuid: APPLICATION_VERSION_ENTITY_UUID,
    parentName: "ApplicationVersion",
    name: input.versionName,
    selfApplication: input.selfApplicationUuid,
    branch: input.branchUuid,
    modelStructureMigration: [],
    modelCUDMigration,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(previousVersionUuid !== undefined ? { previousVersion: previousVersionUuid } : {}),
  };

  const crossEntityVersions: ApplicationVersionCrossEntityVersionRow[] = entityVersions.map(
    (ev) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID,
      parentName: "ApplicationVersionCrossEntityVersion",
      applicationVersion: selfApplicationVersionUuid,
      entityVersion: ev.uuid,
    }),
  );

  return {
    selfApplicationVersion,
    entityVersions,
    crossEntityVersions,
    entityVersionApplicationSection: resolveFreezeEntityVersionApplicationSection(
      input.selfApplicationUuid,
    ),
  };
}

export type PlanFreezeApplicationVersionInput = BuildFreezeApplicationVersionPlanInput & {
  selfApplication: { versioningEnabled?: boolean | undefined };
};

/**
 * Action-facing entry: enforce `versioningEnabled`, then build the freeze plan.
 */
export function planFreezeApplicationVersion(
  input: PlanFreezeApplicationVersionInput,
): FreezeApplicationVersionPlan {
  assertApplicationVersioningEnabled(input.selfApplication);
  return buildFreezeApplicationVersionPlan(input);
}

// ---------------------------------------------------------------------------
// Phase 5: Action payload → plan from MetaModel (persistence = Phase 6)
// ---------------------------------------------------------------------------

/** Payload shape for Model Endpoint `freezeApplicationVersion`. */
export type FreezeApplicationVersionActionPayload = {
  application: string;
  versionName: string;
  description?: string;
  branch?: string;
};

/** MetaModel fields needed to plan a freeze without LocalCache. */
export type FreezeMetaModelSlice = {
  applications: Array<{ uuid: string; versioningEnabled?: boolean | undefined }>;
  entities: Entity[];
  applicationVersions: ApplicationVersion[];
  entityVersions: EntityVersion[];
  applicationVersionCrossEntityVersion: Array<{
    applicationVersion: string;
    entityVersion: string;
  }>;
};

/**
 * Resolve SelfApplication + Entities + tip context from MetaModel, then plan.
 * DomainController calls this for `freezeApplicationVersion`; Phase 6 persists the plan.
 */
export function planFreezeApplicationVersionFromMetaModel(
  payload: FreezeApplicationVersionActionPayload,
  metaModel: FreezeMetaModelSlice,
  options?: SnapshotOptions,
): FreezeApplicationVersionPlan {
  const selfApplication = metaModel.applications.find((a) => a.uuid === payload.application);
  if (!selfApplication) {
    throw new Error(
      `freezeApplicationVersion: SelfApplication ${payload.application} not found in current model`,
    );
  }

  const freezeProducedVersionUuids = metaModel.applicationVersions
    .filter(
      (sav) =>
        sav.selfApplication === payload.application &&
        metaModel.applicationVersionCrossEntityVersion.some(
          (c) => c.applicationVersion === sav.uuid,
        ),
    )
    .map((sav) => sav.uuid);

  let branchUuid = normalizeOptionalBranchUuid(payload.branch);
  if (!branchUuid) {
    const freezeSet = new Set(freezeProducedVersionUuids);
    const freezeSavs = metaModel.applicationVersions.filter((sav) => freezeSet.has(sav.uuid));
    const referenced = new Set(
      freezeSavs
        .map((s) => s.previousVersion)
        .filter((u): u is string => typeof u === "string" && u.length > 0),
    );
    const heads = freezeSavs.filter((s) => !referenced.has(s.uuid));
    if (heads.length === 1) {
      branchUuid = normalizeOptionalBranchUuid(heads[0].branch);
    } else if (heads.length > 1) {
      throw new Error(
        "freezeApplicationVersion requires payload.branch when multiple freeze tips exist",
      );
    }
  }
  // First freeze (or tip without branch): reuse branch from any existing SAV for
  // this application (e.g. Library "Initial" → master), so Runner form "no value"
  // still works when an ApplicationModelBranch already exists.
  if (!branchUuid) {
    const existingWithBranch = metaModel.applicationVersions.find(
      (sav) =>
        sav.selfApplication === payload.application &&
        !!normalizeOptionalBranchUuid(sav.branch),
    );
    branchUuid = normalizeOptionalBranchUuid(existingWithBranch?.branch);
  }
  if (!branchUuid) {
    throw new Error(
      "freezeApplicationVersion requires payload.branch on first freeze (no previous freeze tip)",
    );
  }

  const tip = resolvePreviousApplicationVersion(metaModel.applicationVersions, {
    selfApplicationUuid: payload.application,
    branchUuid,
    freezeProducedVersionUuids,
  });

  let previousEntityVersions: EntityVersion[] | undefined;
  if (tip) {
    const evUuids = new Set(
      metaModel.applicationVersionCrossEntityVersion
        .filter((c) => c.applicationVersion === tip.uuid)
        .map((c) => c.entityVersion),
    );
    previousEntityVersions = metaModel.entityVersions.filter((ev) => evUuids.has(ev.uuid));
  }

  return planFreezeApplicationVersion({
    selfApplication,
    selfApplicationUuid: payload.application,
    branchUuid,
    versionName: payload.versionName,
    description: payload.description,
    entities: metaModel.entities,
    existingApplicationVersions: metaModel.applicationVersions,
    freezeProducedVersionUuids,
    previousEntityVersions,
    newUuid: options?.newUuid,
  });
}
