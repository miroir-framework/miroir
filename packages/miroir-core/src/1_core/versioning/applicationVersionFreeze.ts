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
import { getEntityVersionWriteSection } from "../Model.js";

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
  /** Existing SAVs for this app+branch — used for duplicate label detection. */
  existingApplicationVersions?: ApplicationVersion[];
  /** Set on second+ freeze (Phase 3); omit for first freeze. */
  previousVersionUuid?: string;
  description?: string;
  newUuid?: () => string;
};

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

  const selfApplicationVersionUuid = mintUuid();
  const entityVersions = snapshotEntitiesAsHistoricalEntityVersions(input.entities, {
    newUuid: mintUuid,
  });

  const selfApplicationVersion: ApplicationVersion = {
    uuid: selfApplicationVersionUuid,
    parentUuid: APPLICATION_VERSION_ENTITY_UUID,
    parentName: "ApplicationVersion",
    name: input.versionName,
    selfApplication: input.selfApplicationUuid,
    branch: input.branchUuid,
    modelStructureMigration: [],
    modelCUDMigration: [],
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.previousVersionUuid !== undefined
      ? { previousVersion: input.previousVersionUuid }
      : {}),
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
