/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 * #220 — Freeze-adjacent vocabulary uses EntityVersion only.
 * #227 — QueryVersion tracer (first non-Entity model element).
 * #227 — ReportVersion (second non-Entity model element).
 * #227 — MenuVersion (third non-Entity model element).
 * #227 — EndpointVersion (fourth non-Entity model element).
 * #227 — RunnerVersion (fifth non-Entity model element).
 */

import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationSection,
  ApplicationVersion,
  Entity,
  EntityVersion,
  EndpointDefinition,
  MetaModel,
  MenuDefinition,
  Query,
  Report,
  RootReport,
  Runner,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { noValue } from "../Instance.js";
import {
  getEntityVersionWriteSection,
  getQueryVersionWriteSection,
  getReportVersionWriteSection,
  getMenuVersionWriteSection,
  getEndpointVersionWriteSection,
  getRunnerVersionWriteSection,
} from "../Model.js";
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
/** Historical QueryVersion Entity UUID (#227). */
export const QUERY_VERSION_ENTITY_UUID = "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c";
/** ApplicationVersionCrossQueryVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID =
  "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d";
/** Historical ReportVersion Entity UUID (#227). */
export const REPORT_VERSION_ENTITY_UUID = "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7";
/** ApplicationVersionCrossReportVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID =
  "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8";
/** Historical MenuVersion Entity UUID (#227). */
export const MENU_VERSION_ENTITY_UUID = "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7";
/** ApplicationVersionCrossMenuVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_MENU_VERSION_UUID =
  "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8";
/** Historical EndpointVersion Entity UUID (#227). */
export const ENDPOINT_VERSION_ENTITY_UUID = "c2d3e4f5-a6b7-4789-a0b1-d2e3f4a5b6c7";
/** ApplicationVersionCrossEndpointVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID =
  "d3e4f5a6-b7c8-4890-b1c2-e3f4a5b6c7d8";
/** Historical RunnerVersion Entity UUID (#227). */
export const RUNNER_VERSION_ENTITY_UUID = "e5f6a7b8-c9d0-4012-a3b4-c5d6e7f8a9b0";
/** ApplicationVersionCrossRunnerVersion Entity UUID (#227). */
export const APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID =
  "f6a7b8c9-d0e1-4123-a4b5-c6d7e8f9a0b1";

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
 * #227 — section for persisting freeze-minted QueryVersion snapshots.
 */
export function resolveFreezeQueryVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getQueryVersionWriteSection(applicationUuid);
}

/**
 * #227 — section for persisting freeze-minted ReportVersion snapshots.
 */
export function resolveFreezeReportVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getReportVersionWriteSection(applicationUuid);
}

/**
 * #227 — section for persisting freeze-minted MenuVersion snapshots.
 */
export function resolveFreezeMenuVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getMenuVersionWriteSection(applicationUuid);
}

/**
 * #227 — section for persisting freeze-minted EndpointVersion snapshots.
 */
export function resolveFreezeEndpointVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getEndpointVersionWriteSection(applicationUuid);
}

/**
 * #227 — section for persisting freeze-minted RunnerVersion snapshots.
 */
export function resolveFreezeRunnerVersionApplicationSection(
  applicationUuid: string,
): ApplicationSection {
  return getRunnerVersionWriteSection(applicationUuid);
}

/** Live Query instance shape in MetaModel.storedQueries. */
export type StoredQueryForFreeze = {
  uuid: string;
  name: string;
  definition: Query;
  description?: string;
  defaultLabel?: string;
  parentUuid?: string;
  parentName?: string;
};

/** Historical Query snapshot minted at freeze. */
export type QueryVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "QueryVersion";
  name: string;
  queryUuid: string;
  definition: Query;
  description?: string;
  defaultLabel?: string;
};

/**
 * Deep-copy present-model Queries into new immutable QueryVersion instances.
 * Each output has a **new** UUID; `queryUuid` references the live Query.
 */
export function snapshotQueriesAsHistoricalQueryVersions(
  queries: StoredQueryForFreeze[],
  options?: SnapshotOptions,
): QueryVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return queries.map((query) => {
    if (query.definition === undefined || query.definition === null) {
      throw new Error(
        `Cannot snapshot Query ${query.uuid} (${query.name}): definition is missing`,
      );
    }

    const snapshot: QueryVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: QUERY_VERSION_ENTITY_UUID,
      parentName: "QueryVersion",
      name: query.name,
      queryUuid: query.uuid,
      definition: structuredClone(query.definition),
      ...(query.description !== undefined ? { description: query.description } : {}),
      ...(query.defaultLabel !== undefined ? { defaultLabel: query.defaultLabel } : {}),
    };

    return snapshot;
  });
}

/** Live Report instance shape in MetaModel.reports. */
export type StoredReportForFreeze = {
  uuid: string;
  name: string;
  definition: RootReport;
  defaultLabel?: string;
  type?: Report["type"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical Report snapshot minted at freeze. */
export type ReportVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "ReportVersion";
  name: string;
  reportUuid: string;
  definition: RootReport;
  defaultLabel?: string;
  type?: Report["type"];
};

/**
 * Deep-copy present-model Reports into new immutable ReportVersion instances.
 * Each output has a **new** UUID; `reportUuid` references the live Report.
 */
export function snapshotReportsAsHistoricalReportVersions(
  reports: StoredReportForFreeze[],
  options?: SnapshotOptions,
): ReportVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return reports.map((report) => {
    if (report.definition === undefined || report.definition === null) {
      throw new Error(
        `Cannot snapshot Report ${report.uuid} (${report.name}): definition is missing`,
      );
    }

    const snapshot: ReportVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: REPORT_VERSION_ENTITY_UUID,
      parentName: "ReportVersion",
      name: report.name,
      reportUuid: report.uuid,
      definition: structuredClone(report.definition),
      ...(report.defaultLabel !== undefined ? { defaultLabel: report.defaultLabel } : {}),
      ...(report.type !== undefined ? { type: report.type } : {}),
    };

    return snapshot;
  });
}

/** Live Menu instance shape in MetaModel.menus. */
export type StoredMenuForFreeze = {
  uuid: string;
  name: string;
  definition: MenuDefinition;
  defaultLabel?: string;
  description?: string;
  parentUuid?: string;
  parentName?: string;
};

/** Historical Menu snapshot minted at freeze. */
export type MenuVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "MenuVersion";
  name: string;
  menuUuid: string;
  definition: MenuDefinition;
  defaultLabel?: string;
  description?: string;
};

/**
 * Deep-copy present-model Menus into new immutable MenuVersion instances.
 * Each output has a **new** UUID; `menuUuid` references the live Menu.
 */
export function snapshotMenusAsHistoricalMenuVersions(
  menus: StoredMenuForFreeze[],
  options?: SnapshotOptions,
): MenuVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return menus.map((menu) => {
    if (menu.definition === undefined || menu.definition === null) {
      throw new Error(
        `Cannot snapshot Menu ${menu.uuid} (${menu.name}): definition is missing`,
      );
    }

    const snapshot: MenuVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: MENU_VERSION_ENTITY_UUID,
      parentName: "MenuVersion",
      name: menu.name,
      menuUuid: menu.uuid,
      definition: structuredClone(menu.definition),
      ...(menu.defaultLabel !== undefined ? { defaultLabel: menu.defaultLabel } : {}),
      ...(menu.description !== undefined ? { description: menu.description } : {}),
    };

    return snapshot;
  });
}

/** Live Endpoint instance shape in MetaModel.endpoints. */
export type StoredEndpointForFreeze = {
  uuid: string;
  name: string;
  version: string;
  application: string;
  definition: EndpointDefinition["definition"];
  description?: string;
  transactionalEndpoint?: boolean;
  parentUuid?: string;
  parentName?: string;
};

/** Historical Endpoint snapshot minted at freeze. */
export type EndpointVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "EndpointVersion";
  name: string;
  endpointUuid: string;
  version: string;
  application: string;
  definition: EndpointDefinition["definition"];
  description?: string;
  transactionalEndpoint?: boolean;
};

/**
 * Deep-copy present-model Endpoints into new immutable EndpointVersion instances.
 * Each output has a **new** UUID; `endpointUuid` references the live Endpoint.
 */
export function snapshotEndpointsAsHistoricalEndpointVersions(
  endpoints: StoredEndpointForFreeze[],
  options?: SnapshotOptions,
): EndpointVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return endpoints.map((endpoint) => {
    if (endpoint.definition === undefined || endpoint.definition === null) {
      throw new Error(
        `Cannot snapshot Endpoint ${endpoint.uuid} (${endpoint.name}): definition is missing`,
      );
    }

    const snapshot: EndpointVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: ENDPOINT_VERSION_ENTITY_UUID,
      parentName: "EndpointVersion",
      name: endpoint.name,
      endpointUuid: endpoint.uuid,
      version: endpoint.version,
      application: endpoint.application,
      definition: structuredClone(endpoint.definition),
      ...(endpoint.description !== undefined ? { description: endpoint.description } : {}),
      ...(endpoint.transactionalEndpoint !== undefined
        ? { transactionalEndpoint: endpoint.transactionalEndpoint }
        : {}),
    };

    return snapshot;
  });
}

/** Live Runner instance shape in MetaModel.runners. */
export type StoredRunnerForFreeze = {
  uuid: string;
  name: string;
  application: string;
  defaultLabel: string;
  description?: string;
  definition: Runner["definition"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical Runner snapshot minted at freeze. */
export type RunnerVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "RunnerVersion";
  name: string;
  runnerUuid: string;
  application: string;
  defaultLabel: string;
  description?: string;
  definition: Runner["definition"];
};

/**
 * Deep-copy present-model Runners into new immutable RunnerVersion instances.
 * Each output has a **new** UUID; `runnerUuid` references the live Runner.
 */
export function snapshotRunnersAsHistoricalRunnerVersions(
  runners: StoredRunnerForFreeze[],
  options?: SnapshotOptions,
): RunnerVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return runners.map((runner) => {
    if (runner.definition === undefined || runner.definition === null) {
      throw new Error(
        `Cannot snapshot Runner ${runner.uuid} (${runner.name}): definition is missing`,
      );
    }

    const snapshot: RunnerVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: RUNNER_VERSION_ENTITY_UUID,
      parentName: "RunnerVersion",
      name: runner.name,
      runnerUuid: runner.uuid,
      application: runner.application,
      defaultLabel: runner.defaultLabel,
      definition: structuredClone(runner.definition),
      ...(runner.description !== undefined ? { description: runner.description } : {}),
    };

    return snapshot;
  });
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

/** Cross row linking an Application Version to a historical QueryVersion. */
export type ApplicationVersionCrossQueryVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  queryVersion: string;
};

/** Cross row linking an Application Version to a historical ReportVersion. */
export type ApplicationVersionCrossReportVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  reportVersion: string;
};

/** Cross row linking an Application Version to a historical MenuVersion. */
export type ApplicationVersionCrossMenuVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  menuVersion: string;
};

/** Cross row linking an Application Version to a historical EndpointVersion. */
export type ApplicationVersionCrossEndpointVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  endpointVersion: string;
};

/** Cross row linking an Application Version to a historical RunnerVersion. */
export type ApplicationVersionCrossRunnerVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  runnerVersion: string;
};

export type FreezeApplicationVersionPlan = {
  selfApplicationVersion: ApplicationVersion;
  entityVersions: EntityVersion[];
  crossEntityVersions: ApplicationVersionCrossEntityVersionRow[];
  /** Persist section for EntityVersion rows (Miroir data / Library model). */
  entityVersionApplicationSection: ApplicationSection;
  queryVersions: QueryVersionSnapshot[];
  crossQueryVersions: ApplicationVersionCrossQueryVersionRow[];
  /** Persist section for QueryVersion rows (#227). */
  queryVersionApplicationSection: ApplicationSection;
  reportVersions: ReportVersionSnapshot[];
  crossReportVersions: ApplicationVersionCrossReportVersionRow[];
  /** Persist section for ReportVersion rows (#227). */
  reportVersionApplicationSection: ApplicationSection;
  menuVersions: MenuVersionSnapshot[];
  crossMenuVersions: ApplicationVersionCrossMenuVersionRow[];
  /** Persist section for MenuVersion rows (#227). */
  menuVersionApplicationSection: ApplicationSection;
  endpointVersions: EndpointVersionSnapshot[];
  crossEndpointVersions: ApplicationVersionCrossEndpointVersionRow[];
  /** Persist section for EndpointVersion rows (#227). */
  endpointVersionApplicationSection: ApplicationSection;
  runnerVersions: RunnerVersionSnapshot[];
  crossRunnerVersions: ApplicationVersionCrossRunnerVersionRow[];
  /** Persist section for RunnerVersion rows (#227). */
  runnerVersionApplicationSection: ApplicationSection;
};

export type BuildFreezeApplicationVersionPlanInput = {
  selfApplicationUuid: string;
  branchUuid: string;
  versionName: string;
  entities: Entity[];
  /** Present-model Queries to snapshot (#227). Defaults to empty. */
  storedQueries?: StoredQueryForFreeze[];
  /** Present-model Reports to snapshot (#227). Defaults to empty. */
  reports?: StoredReportForFreeze[];
  /** Present-model Menus to snapshot (#227). Defaults to empty. */
  menus?: StoredMenuForFreeze[];
  /** Present-model Endpoints to snapshot (#227). Defaults to empty. */
  endpoints?: StoredEndpointForFreeze[];
  /** Present-model Runners to snapshot (#227). Defaults to empty. */
  runners?: StoredRunnerForFreeze[];
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
  const queryVersions = snapshotQueriesAsHistoricalQueryVersions(input.storedQueries ?? [], {
    newUuid: mintUuid,
  });
  const reportVersions = snapshotReportsAsHistoricalReportVersions(input.reports ?? [], {
    newUuid: mintUuid,
  });
  const menuVersions = snapshotMenusAsHistoricalMenuVersions(input.menus ?? [], {
    newUuid: mintUuid,
  });
  const endpointVersions = snapshotEndpointsAsHistoricalEndpointVersions(input.endpoints ?? [], {
    newUuid: mintUuid,
  });
  const runnerVersions = snapshotRunnersAsHistoricalRunnerVersions(input.runners ?? [], {
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

  const crossQueryVersions: ApplicationVersionCrossQueryVersionRow[] = queryVersions.map(
    (qv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
      parentName: "ApplicationVersionCrossQueryVersion",
      applicationVersion: selfApplicationVersionUuid,
      queryVersion: qv.uuid,
    }),
  );

  const crossReportVersions: ApplicationVersionCrossReportVersionRow[] = reportVersions.map(
    (rv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
      parentName: "ApplicationVersionCrossReportVersion",
      applicationVersion: selfApplicationVersionUuid,
      reportVersion: rv.uuid,
    }),
  );

  const crossMenuVersions: ApplicationVersionCrossMenuVersionRow[] = menuVersions.map(
    (mv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
      parentName: "ApplicationVersionCrossMenuVersion",
      applicationVersion: selfApplicationVersionUuid,
      menuVersion: mv.uuid,
    }),
  );

  const crossEndpointVersions: ApplicationVersionCrossEndpointVersionRow[] =
    endpointVersions.map((ev) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
      parentName: "ApplicationVersionCrossEndpointVersion",
      applicationVersion: selfApplicationVersionUuid,
      endpointVersion: ev.uuid,
    }));

  const crossRunnerVersions: ApplicationVersionCrossRunnerVersionRow[] = runnerVersions.map(
    (rv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
      parentName: "ApplicationVersionCrossRunnerVersion",
      applicationVersion: selfApplicationVersionUuid,
      runnerVersion: rv.uuid,
    }),
  );

  return {
    selfApplicationVersion,
    entityVersions,
    crossEntityVersions,
    entityVersionApplicationSection: resolveFreezeEntityVersionApplicationSection(
      input.selfApplicationUuid,
    ),
    queryVersions,
    crossQueryVersions,
    queryVersionApplicationSection: resolveFreezeQueryVersionApplicationSection(
      input.selfApplicationUuid,
    ),
    reportVersions,
    crossReportVersions,
    reportVersionApplicationSection: resolveFreezeReportVersionApplicationSection(
      input.selfApplicationUuid,
    ),
    menuVersions,
    crossMenuVersions,
    menuVersionApplicationSection: resolveFreezeMenuVersionApplicationSection(
      input.selfApplicationUuid,
    ),
    endpointVersions,
    crossEndpointVersions,
    endpointVersionApplicationSection: resolveFreezeEndpointVersionApplicationSection(
      input.selfApplicationUuid,
    ),
    runnerVersions,
    crossRunnerVersions,
    runnerVersionApplicationSection: resolveFreezeRunnerVersionApplicationSection(
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
  storedQueries?: StoredQueryForFreeze[];
  reports?: StoredReportForFreeze[];
  menus?: StoredMenuForFreeze[];
  endpoints?: StoredEndpointForFreeze[];
  runners?: StoredRunnerForFreeze[];
  applicationVersions: ApplicationVersion[];
  entityVersions: EntityVersion[];
  applicationVersionCrossEntityVersion: Array<{
    applicationVersion: string;
    entityVersion: string;
  }>;
  applicationVersionCrossQueryVersion?: MetaModel["applicationVersionCrossQueryVersion"];
  queryVersions?: MetaModel["queryVersions"];
  applicationVersionCrossReportVersion?: MetaModel["applicationVersionCrossReportVersion"];
  reportVersions?: MetaModel["reportVersions"];
  applicationVersionCrossMenuVersion?: MetaModel["applicationVersionCrossMenuVersion"];
  menuVersions?: MetaModel["menuVersions"];
  applicationVersionCrossEndpointVersion?: MetaModel["applicationVersionCrossEndpointVersion"];
  endpointVersions?: MetaModel["endpointVersions"];
  applicationVersionCrossRunnerVersion?: MetaModel["applicationVersionCrossRunnerVersion"];
  runnerVersions?: MetaModel["runnerVersions"];
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
    storedQueries: metaModel.storedQueries,
    reports: metaModel.reports,
    menus: metaModel.menus,
    endpoints: metaModel.endpoints,
    runners: metaModel.runners,
    existingApplicationVersions: metaModel.applicationVersions,
    freezeProducedVersionUuids,
    previousEntityVersions,
    newUuid: options?.newUuid,
  });
}
