/**
 * #216 — Application Version freeze (Entities only, linear history, Option A diff).
 * #220 — Freeze-adjacent vocabulary uses EntityVersion only.
 * #227 — QueryVersion tracer (first non-Entity model element).
 * #227 — ReportVersion (second non-Entity model element).
 * #227 — MenuVersion (third non-Entity model element).
 * #227 — EndpointVersion (fourth non-Entity model element).
 * #227 — RunnerVersion (fifth non-Entity model element).
 * #227 — ThemeVersion (sixth non-Entity model element).
 * #227 — TransformerDefinitionVersion (ninth non-Entity model element).
 * #230 — MlSchemaVersion and MiroirTestVersion (full model snapshot).
 * #706 — BlobVersion, TestConfigurationVersion and TestVersion (rest of Miroir's data section).
 */

import { v4 as uuidv4 } from "uuid";

import { diffModelStates, modelCudMigrationCandidates } from "./modelStateDiff.js";

import {
  APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID,
  APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID,
  APPLICATION_VERSION_CROSS_MENU_VERSION_UUID,
  APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID,
  APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID,
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
  APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID,
  APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TEST_VERSION_UUID,
  APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
  APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
  BLOB_VERSION_ENTITY_UUID,
  ENDPOINT_VERSION_ENTITY_UUID,
  MENU_VERSION_ENTITY_UUID,
  MIROIR_TEST_VERSION_ENTITY_UUID,
  ML_SCHEMA_VERSION_ENTITY_UUID,
  QUERY_VERSION_ENTITY_UUID,
  REPORT_VERSION_ENTITY_UUID,
  RUNNER_VERSION_ENTITY_UUID,
  TEST_CONFIGURATION_VERSION_ENTITY_UUID,
  TEST_VERSION_ENTITY_UUID,
  THEME_VERSION_ENTITY_UUID,
  TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  assertApplicationVersioningEnabled,
  getApplicationSection,
  noValue,
  type ApplicationSection,
  type ApplicationVersion,
  type Entity,
  type EntityVersion,
  type EndpointDefinition,
  type MetaModel,
  type Menu,
  type MiroirTestDefinition,
  type MlSchema,
  type Query,
  type Report,
  type RootReport,
  type Runner,
  type StoredMiroirTheme,
  type TransformerDefinition,
  type FreezeApplicationVersionActionPayload,
} from "@miroir-framework/core";

/** Runner form defaults often leave branch as the `noValue` sentinel UUID. */
function normalizeOptionalBranchUuid(branch: string | undefined): string | undefined {
  if (!branch || branch === noValue.uuid) {
    return undefined;
  }
  return branch;
}

// ---------------------------------------------------------------------------
// Phase 1: Versioning gate — see versioningMode.ts (#234)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Phase 1: Entity snapshot → historical EntityVersions
// ---------------------------------------------------------------------------

/** EntityVersion entity UUID (bootstrap metamodel identity). */
const ENTITY_VERSION_ENTITY_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
/**
 * #9: the model collections a freeze snapshots, written on the version row (`frozenCollections`) so that a
 * collection with no row in the version reads as empty, not as one an older freeze did not snapshot.
 */
export const FROZEN_COLLECTIONS = [
  "entities",
  "storedQueries",
  "reports",
  "menus",
  "endpoints",
  "runners",
  "themes",
  "transformerDefinitions",
  "mlSchemas",
  "tests",
  "blobs",
  "testConfigurations",
] as const;

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
 * A live row of an element type the freeze snapshots (#708 part B, Q-B4): every attribute is kept in its
 * version row but the identity ones.
 */
export type StoredInstanceForFreeze = {
  uuid: string;
  parentUuid?: string;
  parentName?: string;
  parentDefinitionVersionUuid?: string;
  conceptLevel?: string;
  [attribute: string]: unknown;
};

/** The version row a freeze mints for a live row: its attributes, a new uuid, and the live row's uuid. */
export type InstanceVersionSnapshot<P extends string, K extends string> = {
  uuid: string;
  parentUuid: string;
  parentName: P;
} & { [key in K]: string } & Record<string, unknown>;

export type QueryVersionSnapshot = InstanceVersionSnapshot<"QueryVersion", "queryUuid">;
export type ReportVersionSnapshot = InstanceVersionSnapshot<"ReportVersion", "reportUuid">;
export type MenuVersionSnapshot = InstanceVersionSnapshot<"MenuVersion", "menuUuid">;
export type EndpointVersionSnapshot = InstanceVersionSnapshot<"EndpointVersion", "endpointUuid">;
export type RunnerVersionSnapshot = InstanceVersionSnapshot<"RunnerVersion", "runnerUuid">;
export type ThemeVersionSnapshot = InstanceVersionSnapshot<"ThemeVersion", "themeUuid">;
export type TransformerDefinitionVersionSnapshot = InstanceVersionSnapshot<
  "TransformerDefinitionVersion",
  "transformerUuid"
>;
export type MlSchemaVersionSnapshot = InstanceVersionSnapshot<"MlSchemaVersion", "mlSchemaUuid">;
export type MiroirTestVersionSnapshot = InstanceVersionSnapshot<"MiroirTestVersion", "miroirTestUuid">;
export type BlobVersionSnapshot = InstanceVersionSnapshot<"BlobVersion", "blobUuid">;
export type TestConfigurationVersionSnapshot = InstanceVersionSnapshot<
  "TestConfigurationVersion",
  "testConfigurationUuid"
>;
export type TestVersionSnapshot = InstanceVersionSnapshot<"TestVersion", "testUuid">;

/** The attributes of a live row that are not copied to its version row: the row's identity. */
export const FREEZE_IDENTITY_ATTRIBUTES: readonly string[] = [
  "uuid",
  "parentUuid",
  "parentName",
  "parentDefinitionVersionUuid",
  "conceptLevel",
];

/**
 * An element type the freeze snapshots: its version Entity, the attribute of a version row naming the live
 * row, and the attributes a live row must have to be snapshotted.
 */
export type VersionedElementType<P extends string = string, K extends string = string> = {
  label: string;
  versionEntityUuid: string;
  versionEntityName: P;
  liveUuidAttribute: K;
  required: readonly string[];
};

function versionedElementType<P extends string, K extends string>(
  type: VersionedElementType<P, K>,
): VersionedElementType<P, K> {
  return type;
}

export const queryVersionType = versionedElementType({ label: "Query", versionEntityUuid: QUERY_VERSION_ENTITY_UUID, versionEntityName: "QueryVersion", liveUuidAttribute: "queryUuid", required: ["definition"] });
export const reportVersionType = versionedElementType({ label: "Report", versionEntityUuid: REPORT_VERSION_ENTITY_UUID, versionEntityName: "ReportVersion", liveUuidAttribute: "reportUuid", required: ["definition"] });
export const menuVersionType = versionedElementType({ label: "Menu", versionEntityUuid: MENU_VERSION_ENTITY_UUID, versionEntityName: "MenuVersion", liveUuidAttribute: "menuUuid", required: ["definition"] });
export const endpointVersionType = versionedElementType({ label: "Endpoint", versionEntityUuid: ENDPOINT_VERSION_ENTITY_UUID, versionEntityName: "EndpointVersion", liveUuidAttribute: "endpointUuid", required: ["definition"] });
export const runnerVersionType = versionedElementType({ label: "Runner", versionEntityUuid: RUNNER_VERSION_ENTITY_UUID, versionEntityName: "RunnerVersion", liveUuidAttribute: "runnerUuid", required: ["definition"] });
export const themeVersionType = versionedElementType({ label: "Theme", versionEntityUuid: THEME_VERSION_ENTITY_UUID, versionEntityName: "ThemeVersion", liveUuidAttribute: "themeUuid", required: ["definition"] });
export const transformerDefinitionVersionType = versionedElementType({
  label: "TransformerDefinition",
  versionEntityUuid: TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
  versionEntityName: "TransformerDefinitionVersion",
  liveUuidAttribute: "transformerUuid",
  required: ["transformerImplementation", "transformerInterface"],
});
export const mlSchemaVersionType = versionedElementType({ label: "MlSchema", versionEntityUuid: ML_SCHEMA_VERSION_ENTITY_UUID, versionEntityName: "MlSchemaVersion", liveUuidAttribute: "mlSchemaUuid", required: [] });
export const miroirTestVersionType = versionedElementType({ label: "MiroirTest", versionEntityUuid: MIROIR_TEST_VERSION_ENTITY_UUID, versionEntityName: "MiroirTestVersion", liveUuidAttribute: "miroirTestUuid", required: ["definition"] });
export const blobVersionType = versionedElementType({ label: "Blob", versionEntityUuid: BLOB_VERSION_ENTITY_UUID, versionEntityName: "BlobVersion", liveUuidAttribute: "blobUuid", required: [] });
export const testConfigurationVersionType = versionedElementType({
  label: "TestConfiguration",
  versionEntityUuid: TEST_CONFIGURATION_VERSION_ENTITY_UUID,
  versionEntityName: "TestConfigurationVersion",
  liveUuidAttribute: "testConfigurationUuid",
  required: [],
});
export const testVersionType = versionedElementType({ label: "Test", versionEntityUuid: TEST_VERSION_ENTITY_UUID, versionEntityName: "TestVersion", liveUuidAttribute: "testUuid", required: [] });
export const entityVersionType = versionedElementType({ label: "Entity", versionEntityUuid: ENTITY_VERSION_ENTITY_UUID, versionEntityName: "EntityVersion", liveUuidAttribute: "entityUuid", required: ["mlSchema"] });

/**
 * Deep-copy live rows into new version rows: every attribute except the identity ones
 * ({@link FREEZE_IDENTITY_ATTRIBUTES}), plus the type's `liveUuidAttribute` naming the live row (#706,
 * #708 part B). Each output has a **new** UUID. Throws when a row lacks a `required` attribute.
 */
export function snapshotRowsAsVersions<P extends string, K extends string>(
  rows: readonly object[],
  type: VersionedElementType<P, K>,
  options?: SnapshotOptions,
): InstanceVersionSnapshot<P, K>[] {
  const mintUuid = options?.newUuid ?? uuidv4;
  return rows.map((row) => {
    const live = row as StoredInstanceForFreeze;
    const missing = type.required.find((attribute) => live[attribute] === undefined || live[attribute] === null);
    if (missing) {
      throw new Error(
        `Cannot snapshot ${type.label} ${live.uuid} (${String(live.name ?? "unnamed")}): ${missing} is missing`,
      );
    }
    const attributes = Object.fromEntries(
      Object.entries(live).filter(([attribute]) => !FREEZE_IDENTITY_ATTRIBUTES.includes(attribute)),
    );
    return {
      ...structuredClone(attributes),
      uuid: mintUuid(),
      parentUuid: type.versionEntityUuid,
      parentName: type.versionEntityName,
      [type.liveUuidAttribute]: live.uuid,
    } as InstanceVersionSnapshot<P, K>;
  });
}

export function snapshotQueriesAsHistoricalQueryVersions(queries: readonly object[], options?: SnapshotOptions): QueryVersionSnapshot[] {
  return snapshotRowsAsVersions(queries, queryVersionType, options);
}
export function snapshotReportsAsHistoricalReportVersions(reports: readonly object[], options?: SnapshotOptions): ReportVersionSnapshot[] {
  return snapshotRowsAsVersions(reports, reportVersionType, options);
}
export function snapshotMenusAsHistoricalMenuVersions(menus: readonly object[], options?: SnapshotOptions): MenuVersionSnapshot[] {
  return snapshotRowsAsVersions(menus, menuVersionType, options);
}
export function snapshotEndpointsAsHistoricalEndpointVersions(endpoints: readonly object[], options?: SnapshotOptions): EndpointVersionSnapshot[] {
  return snapshotRowsAsVersions(endpoints, endpointVersionType, options);
}
export function snapshotRunnersAsHistoricalRunnerVersions(runners: readonly object[], options?: SnapshotOptions): RunnerVersionSnapshot[] {
  return snapshotRowsAsVersions(runners, runnerVersionType, options);
}
export function snapshotThemesAsHistoricalThemeVersions(themes: readonly object[], options?: SnapshotOptions): ThemeVersionSnapshot[] {
  return snapshotRowsAsVersions(themes, themeVersionType, options);
}
export function snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
  transformerDefinitions: readonly object[],
  options?: SnapshotOptions,
): TransformerDefinitionVersionSnapshot[] {
  return snapshotRowsAsVersions(transformerDefinitions, transformerDefinitionVersionType, options);
}
export function snapshotMlSchemasAsHistoricalMlSchemaVersions(mlSchemas: readonly object[], options?: SnapshotOptions): MlSchemaVersionSnapshot[] {
  return snapshotRowsAsVersions(mlSchemas, mlSchemaVersionType, options);
}
export function snapshotMiroirTestsAsHistoricalMiroirTestVersions(tests: readonly object[], options?: SnapshotOptions): MiroirTestVersionSnapshot[] {
  return snapshotRowsAsVersions(tests, miroirTestVersionType, options);
}
export function snapshotBlobsAsHistoricalBlobVersions(blobs: readonly object[], options?: SnapshotOptions): BlobVersionSnapshot[] {
  return snapshotRowsAsVersions(blobs, blobVersionType, options);
}
export function snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(
  testConfigurations: readonly object[],
  options?: SnapshotOptions,
): TestConfigurationVersionSnapshot[] {
  return snapshotRowsAsVersions(testConfigurations, testConfigurationVersionType, options);
}
export function snapshotTestsAsHistoricalTestVersions(testInstances: readonly object[], options?: SnapshotOptions): TestVersionSnapshot[] {
  return snapshotRowsAsVersions(testInstances, testVersionType, options);
}

/**
 * Deep-copy present-model Entities into new immutable EntityVersion instances, as the other types are,
 * keeping `conceptLevel`, which EntityVersion holds. Each output has a **new** UUID; `entityUuid` references
 * the live Entity. Throws if any Entity lacks `mlSchema` (incomplete present model).
 *
 * Do **not** use UUID-reuse compat helpers (e.g. presentEntityAsRedundant…) for freeze —
 * those reuse the live Entity uuid and are unsafe for historical minting (#220 / #216).
 */
export function snapshotEntitiesAsHistoricalEntityVersions(
  entities: Entity[],
  options?: SnapshotOptions,
): EntityVersion[] {
  const versions = snapshotRowsAsVersions(entities, entityVersionType, options);
  return versions.map((version, index) => ({ ...version, conceptLevel: entities[index].conceptLevel ?? "Model" }) as EntityVersion);
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

/** Cross row linking an Application Version to a historical ThemeVersion. */
export type ApplicationVersionCrossThemeVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  themeVersion: string;
};

/** Cross row linking an Application Version to a historical TransformerDefinitionVersion. */
export type ApplicationVersionCrossTransformerDefinitionVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  transformerDefinitionVersion: string;
};

/** Cross row linking an Application Version to a historical MlSchemaVersion (#230). */
export type ApplicationVersionCrossMlSchemaVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  mlSchemaVersion: string;
};

/** Cross row linking an Application Version to a historical MiroirTestVersion (#230). */
export type ApplicationVersionCrossMiroirTestVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  miroirTestVersion: string;
};

/** Cross row linking an Application Version to a historical BlobVersion (#706). */
export type ApplicationVersionCrossBlobVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  blobVersion: string;
};

/** Cross row linking an Application Version to a historical TestConfigurationVersion (#706). */
export type ApplicationVersionCrossTestConfigurationVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  testConfigurationVersion: string;
};

/** Cross row linking an Application Version to a historical TestVersion (#706). */
export type ApplicationVersionCrossTestVersionRow = {
  uuid: string;
  parentUuid: string;
  parentName?: string;
  applicationVersion: string;
  testVersion: string;
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
  themeVersions: ThemeVersionSnapshot[];
  crossThemeVersions: ApplicationVersionCrossThemeVersionRow[];
  /** Persist section for ThemeVersion rows (#227). */
  themeVersionApplicationSection: ApplicationSection;
  transformerDefinitionVersions: TransformerDefinitionVersionSnapshot[];
  crossTransformerDefinitionVersions: ApplicationVersionCrossTransformerDefinitionVersionRow[];
  /** Persist section for TransformerDefinitionVersion rows (#227). */
  transformerDefinitionVersionApplicationSection: ApplicationSection;
  mlSchemaVersions: MlSchemaVersionSnapshot[];
  crossMlSchemaVersions: ApplicationVersionCrossMlSchemaVersionRow[];
  /** Persist section for MlSchemaVersion rows (#230). */
  mlSchemaVersionApplicationSection: ApplicationSection;
  miroirTestVersions: MiroirTestVersionSnapshot[];
  crossMiroirTestVersions: ApplicationVersionCrossMiroirTestVersionRow[];
  /** Persist section for MiroirTestVersion rows (#230). */
  miroirTestVersionApplicationSection: ApplicationSection;
  blobVersions: BlobVersionSnapshot[];
  crossBlobVersions: ApplicationVersionCrossBlobVersionRow[];
  testConfigurationVersions: TestConfigurationVersionSnapshot[];
  crossTestConfigurationVersions: ApplicationVersionCrossTestConfigurationVersionRow[];
  testVersions: TestVersionSnapshot[];
  crossTestVersions: ApplicationVersionCrossTestVersionRow[];
};

export type BuildFreezeApplicationVersionPlanInput = {
  selfApplicationUuid: string;
  branchUuid: string;
  versionName: string;
  entities: Entity[];
  /** Present-model Queries to snapshot (#227). Defaults to empty. */
  storedQueries?: MetaModel["storedQueries"];
  /** Present-model Reports to snapshot (#227). Defaults to empty. */
  reports?: MetaModel["reports"];
  /** Present-model Menus to snapshot (#227). Defaults to empty. */
  menus?: MetaModel["menus"];
  /** Present-model Endpoints to snapshot (#227). Defaults to empty. */
  endpoints?: MetaModel["endpoints"];
  /** Present-model Runners to snapshot (#227). Defaults to empty. */
  runners?: MetaModel["runners"];
  /** Present-model Themes to snapshot (#227). Defaults to empty. */
  themes?: MetaModel["themes"];
  /** Present-model TransformerDefinitions to snapshot (#227). Defaults to empty. */
  transformerDefinitions?: MetaModel["transformerDefinitions"];
  /** Present-model MlSchemas to snapshot (#230). Defaults to empty. */
  mlSchemas?: MetaModel["mlSchemas"];
  /** Present-model MiroirTests to snapshot (#230). Defaults to empty. */
  tests?: MetaModel["tests"];
  /** Live Blobs to snapshot (#706). Defaults to empty. */
  blobs?: StoredInstanceForFreeze[];
  /** Live TestConfigurations to snapshot (#706). Defaults to empty. */
  testConfigurations?: StoredInstanceForFreeze[];
  /** Live instances of the Test Entity (not MiroirTests, which are `tests`) to snapshot (#706). */
  testInstances?: StoredInstanceForFreeze[];
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

// Phase 4 (Entity-set diff, #216 Option A) is `modelCudMigrationCandidates` in modelStateDiff.ts (#708).

/** EntityVersions as the live Entities they were minted from, for {@link diffModelStates}. */
function liveEntitiesOfVersions(versions: EntityVersion[]): Entity[] {
  return versions.map((version) => ({ ...version, uuid: version.entityUuid }) as Entity);
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
  const themeVersions = snapshotThemesAsHistoricalThemeVersions(input.themes ?? [], {
    newUuid: mintUuid,
  });
  const transformerDefinitionVersions =
    snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
      input.transformerDefinitions ?? [],
      { newUuid: mintUuid },
    );
  const mlSchemaVersions = snapshotMlSchemasAsHistoricalMlSchemaVersions(input.mlSchemas ?? [], {
    newUuid: mintUuid,
  });
  const miroirTestVersions = snapshotMiroirTestsAsHistoricalMiroirTestVersions(input.tests ?? [], {
    newUuid: mintUuid,
  });
  const blobVersions = snapshotBlobsAsHistoricalBlobVersions(input.blobs ?? [], { newUuid: mintUuid });
  const testConfigurationVersions = snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(
    input.testConfigurations ?? [],
    { newUuid: mintUuid },
  );
  const testVersions = snapshotTestsAsHistoricalTestVersions(input.testInstances ?? [], {
    newUuid: mintUuid,
  });

  const modelCUDMigration =
    input.previousEntityVersions !== undefined
      ? modelCudMigrationCandidates(
          diffModelStates(
            { entities: liveEntitiesOfVersions(input.previousEntityVersions) },
            { entities: liveEntitiesOfVersions(entityVersions) },
          ),
        )
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
    frozenCollections: [...FROZEN_COLLECTIONS],
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

  const crossThemeVersions: ApplicationVersionCrossThemeVersionRow[] = themeVersions.map(
    (tv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
      parentName: "ApplicationVersionCrossThemeVersion",
      applicationVersion: selfApplicationVersionUuid,
      themeVersion: tv.uuid,
    }),
  );

  const crossTransformerDefinitionVersions: ApplicationVersionCrossTransformerDefinitionVersionRow[] =
    transformerDefinitionVersions.map((tdv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
      parentName: "ApplicationVersionCrossTransformerDefinitionVersion",
      applicationVersion: selfApplicationVersionUuid,
      transformerDefinitionVersion: tdv.uuid,
    }));

  const crossMlSchemaVersions: ApplicationVersionCrossMlSchemaVersionRow[] = mlSchemaVersions.map(
    (msv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID,
      parentName: "ApplicationVersionCrossMlSchemaVersion",
      applicationVersion: selfApplicationVersionUuid,
      mlSchemaVersion: msv.uuid,
    }),
  );

  const crossMiroirTestVersions: ApplicationVersionCrossMiroirTestVersionRow[] =
    miroirTestVersions.map((mtv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID,
      parentName: "ApplicationVersionCrossMiroirTestVersion",
      applicationVersion: selfApplicationVersionUuid,
      miroirTestVersion: mtv.uuid,
    }));

  const crossBlobVersions: ApplicationVersionCrossBlobVersionRow[] = blobVersions.map((bv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_BLOB_VERSION_UUID,
    parentName: "ApplicationVersionCrossBlobVersion",
    applicationVersion: selfApplicationVersionUuid,
    blobVersion: bv.uuid,
  }));

  const crossTestConfigurationVersions: ApplicationVersionCrossTestConfigurationVersionRow[] =
    testConfigurationVersions.map((tcv) => ({
      uuid: mintUuid(),
      parentUuid: APPLICATION_VERSION_CROSS_TEST_CONFIGURATION_VERSION_UUID,
      parentName: "ApplicationVersionCrossTestConfigurationVersion",
      applicationVersion: selfApplicationVersionUuid,
      testConfigurationVersion: tcv.uuid,
    }));

  const crossTestVersions: ApplicationVersionCrossTestVersionRow[] = testVersions.map((tv) => ({
    uuid: mintUuid(),
    parentUuid: APPLICATION_VERSION_CROSS_TEST_VERSION_UUID,
    parentName: "ApplicationVersionCrossTestVersion",
    applicationVersion: selfApplicationVersionUuid,
    testVersion: tv.uuid,
  }));

  return {
    selfApplicationVersion,
    entityVersions,
    crossEntityVersions,
    entityVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, ENTITY_VERSION_ENTITY_UUID,
    ),
    queryVersions,
    crossQueryVersions,
    queryVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, QUERY_VERSION_ENTITY_UUID,
    ),
    reportVersions,
    crossReportVersions,
    reportVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, REPORT_VERSION_ENTITY_UUID,
    ),
    menuVersions,
    crossMenuVersions,
    menuVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, MENU_VERSION_ENTITY_UUID,
    ),
    endpointVersions,
    crossEndpointVersions,
    endpointVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, ENDPOINT_VERSION_ENTITY_UUID,
    ),
    runnerVersions,
    crossRunnerVersions,
    runnerVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, RUNNER_VERSION_ENTITY_UUID,
    ),
    themeVersions,
    crossThemeVersions,
    themeVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, THEME_VERSION_ENTITY_UUID,
    ),
    transformerDefinitionVersions,
    crossTransformerDefinitionVersions,
    transformerDefinitionVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
    ),
    mlSchemaVersions,
    crossMlSchemaVersions,
    mlSchemaVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, ML_SCHEMA_VERSION_ENTITY_UUID,
    ),
    miroirTestVersions,
    crossMiroirTestVersions,
    miroirTestVersionApplicationSection: getApplicationSection(
      input.selfApplicationUuid, MIROIR_TEST_VERSION_ENTITY_UUID,
    ),
    blobVersions,
    crossBlobVersions,
    testConfigurationVersions,
    crossTestConfigurationVersions,
    testVersions,
    crossTestVersions,
  };
}

/** Miroir's own SelfApplication uuid: its Entities are the meta-model (#230). */
const MIROIR_SELF_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

/**
 * The Entities a freeze snapshots as EntityVersions (#230).
 *
 * For an ordinary application, its own Entities: the meta-model Entities (Entity, Report, …),
 * which can show up in its current model, are left out.
 * For Miroir itself, those meta-model Entities *are* its Entities, so all of them are kept,
 * apart from the version-history Entities (stored in `modelVersion`) and the devData Entities.
 */
export function selectEntitiesToFreeze(
  applicationUuid: string,
  entities: Entity[],
  metaModelEntityUuids: ReadonlySet<string>,
): Entity[] {
  if (applicationUuid === MIROIR_SELF_APPLICATION_UUID) {
    return entities.filter((entity) => {
      const section = getApplicationSection(applicationUuid, entity.uuid);
      return section !== "modelVersion" && section !== "devData";
    });
  }
  return entities.filter((entity) => !metaModelEntityUuids.has(entity.uuid));
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


/** MetaModel fields needed to plan a freeze without LocalCache. */
export type FreezeMetaModelSlice = {
  applications: Array<{ uuid: string; versioningEnabled?: boolean | undefined }>;
  entities: Entity[];
  storedQueries?: MetaModel["storedQueries"];
  reports?: MetaModel["reports"];
  menus?: MetaModel["menus"];
  endpoints?: MetaModel["endpoints"];
  runners?: MetaModel["runners"];
  themes?: MetaModel["themes"];
  transformerDefinitions?: MetaModel["transformerDefinitions"];
  mlSchemas?: MetaModel["mlSchemas"];
  tests?: MetaModel["tests"];
  /** Read from the store at freeze time (#706): the MetaModel has no collection for them. */
  blobs?: StoredInstanceForFreeze[];
  testConfigurations?: StoredInstanceForFreeze[];
  testInstances?: StoredInstanceForFreeze[];
  applicationVersions: ApplicationVersion[];
  entityVersions: EntityVersion[];
  applicationVersionCrossEntityVersion: MetaModel["applicationVersionCrossEntityVersion"];
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
  applicationVersionCrossThemeVersion?: MetaModel["applicationVersionCrossThemeVersion"];
  themeVersions?: MetaModel["themeVersions"];
  applicationVersionCrossTransformerDefinitionVersion?: MetaModel["applicationVersionCrossTransformerDefinitionVersion"];
  transformerDefinitionVersions?: MetaModel["transformerDefinitionVersions"];
  applicationVersionCrossMlSchemaVersion?: MetaModel["applicationVersionCrossMlSchemaVersion"];
  mlSchemaVersions?: MetaModel["mlSchemaVersions"];
  applicationVersionCrossMiroirTestVersion?: MetaModel["applicationVersionCrossMiroirTestVersion"];
  miroirTestVersions?: MetaModel["miroirTestVersions"];
};

function mergeInstancesByUuid<T extends { uuid: string }>(
  base: T[],
  extra: T[] | undefined,
): T[] {
  if (!extra?.length) {
    return base;
  }
  const merged = new Map(base.map((item) => [item.uuid, item]));
  for (const item of extra) {
    merged.set(item.uuid, item);
  }
  return [...merged.values()];
}

/** #232 — overlay modelVersion-persisted rows onto the in-memory slice used for freeze planning. */
export function mergeVersionHistoryIntoFreezeMetaModel(
  metaModel: FreezeMetaModelSlice,
  persisted: Partial<FreezeMetaModelSlice>,
): FreezeMetaModelSlice {
  return {
    ...metaModel,
    applicationVersions: mergeInstancesByUuid(
      metaModel.applicationVersions,
      persisted.applicationVersions,
    ),
    entityVersions: mergeInstancesByUuid(metaModel.entityVersions, persisted.entityVersions),
    applicationVersionCrossEntityVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossEntityVersion,
      persisted.applicationVersionCrossEntityVersion,
    ),
    applicationVersionCrossQueryVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossQueryVersion ?? [],
      persisted.applicationVersionCrossQueryVersion,
    ),
    queryVersions: mergeInstancesByUuid(metaModel.queryVersions ?? [], persisted.queryVersions),
    applicationVersionCrossReportVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossReportVersion ?? [],
      persisted.applicationVersionCrossReportVersion,
    ),
    reportVersions: mergeInstancesByUuid(metaModel.reportVersions ?? [], persisted.reportVersions),
    applicationVersionCrossMenuVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMenuVersion ?? [],
      persisted.applicationVersionCrossMenuVersion,
    ),
    menuVersions: mergeInstancesByUuid(metaModel.menuVersions ?? [], persisted.menuVersions),
    applicationVersionCrossEndpointVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossEndpointVersion ?? [],
      persisted.applicationVersionCrossEndpointVersion,
    ),
    endpointVersions: mergeInstancesByUuid(
      metaModel.endpointVersions ?? [],
      persisted.endpointVersions,
    ),
    applicationVersionCrossRunnerVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossRunnerVersion ?? [],
      persisted.applicationVersionCrossRunnerVersion,
    ),
    runnerVersions: mergeInstancesByUuid(metaModel.runnerVersions ?? [], persisted.runnerVersions),
    applicationVersionCrossThemeVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossThemeVersion ?? [],
      persisted.applicationVersionCrossThemeVersion,
    ),
    themeVersions: mergeInstancesByUuid(metaModel.themeVersions ?? [], persisted.themeVersions),
    applicationVersionCrossTransformerDefinitionVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossTransformerDefinitionVersion ?? [],
      persisted.applicationVersionCrossTransformerDefinitionVersion,
    ),
    transformerDefinitionVersions: mergeInstancesByUuid(
      metaModel.transformerDefinitionVersions ?? [],
      persisted.transformerDefinitionVersions,
    ),
    applicationVersionCrossMlSchemaVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMlSchemaVersion ?? [],
      persisted.applicationVersionCrossMlSchemaVersion,
    ),
    mlSchemaVersions: mergeInstancesByUuid(
      metaModel.mlSchemaVersions ?? [],
      persisted.mlSchemaVersions,
    ),
    applicationVersionCrossMiroirTestVersion: mergeInstancesByUuid(
      metaModel.applicationVersionCrossMiroirTestVersion ?? [],
      persisted.applicationVersionCrossMiroirTestVersion,
    ),
    miroirTestVersions: mergeInstancesByUuid(
      metaModel.miroirTestVersions ?? [],
      persisted.miroirTestVersions,
    ),
  };
}

export type ModelVersionInstanceLoader = (
  parentEntityUuid: string,
) => Promise<Array<{ uuid: string }>>;

/** #232 — read all version-history collections from the modelVersion section for freeze chaining. */
export async function loadVersionHistoryFreezeSlice(
  loadInstances: ModelVersionInstanceLoader,
): Promise<Partial<FreezeMetaModelSlice>> {
  const load = async <T extends { uuid: string }>(parentUuid: string) =>
    (await loadInstances(parentUuid)) as T[];

  return {
    applicationVersions: await load(APPLICATION_VERSION_ENTITY_UUID),
    entityVersions: await load(ENTITY_VERSION_ENTITY_UUID),
    applicationVersionCrossEntityVersion: await load(APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID),
    queryVersions: await load(QUERY_VERSION_ENTITY_UUID),
    applicationVersionCrossQueryVersion: await load(APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID),
    reportVersions: await load(REPORT_VERSION_ENTITY_UUID),
    applicationVersionCrossReportVersion: await load(APPLICATION_VERSION_CROSS_REPORT_VERSION_UUID),
    menuVersions: await load(MENU_VERSION_ENTITY_UUID),
    applicationVersionCrossMenuVersion: await load(APPLICATION_VERSION_CROSS_MENU_VERSION_UUID),
    endpointVersions: await load(ENDPOINT_VERSION_ENTITY_UUID),
    applicationVersionCrossEndpointVersion: await load(APPLICATION_VERSION_CROSS_ENDPOINT_VERSION_UUID),
    runnerVersions: await load(RUNNER_VERSION_ENTITY_UUID),
    applicationVersionCrossRunnerVersion: await load(APPLICATION_VERSION_CROSS_RUNNER_VERSION_UUID),
    themeVersions: await load(THEME_VERSION_ENTITY_UUID),
    applicationVersionCrossThemeVersion: await load(APPLICATION_VERSION_CROSS_THEME_VERSION_UUID),
    transformerDefinitionVersions: await load(TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID),
    applicationVersionCrossTransformerDefinitionVersion: await load(
      APPLICATION_VERSION_CROSS_TRANSFORMER_DEFINITION_VERSION_UUID,
    ),
    mlSchemaVersions: await load(ML_SCHEMA_VERSION_ENTITY_UUID),
    applicationVersionCrossMlSchemaVersion: await load(
      APPLICATION_VERSION_CROSS_ML_SCHEMA_VERSION_UUID,
    ),
    miroirTestVersions: await load(MIROIR_TEST_VERSION_ENTITY_UUID),
    applicationVersionCrossMiroirTestVersion: await load(
      APPLICATION_VERSION_CROSS_MIROIR_TEST_VERSION_UUID,
    ),
  };
}

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
    themes: metaModel.themes,
    transformerDefinitions: metaModel.transformerDefinitions,
    mlSchemas: metaModel.mlSchemas,
    tests: metaModel.tests,
    blobs: metaModel.blobs,
    testConfigurations: metaModel.testConfigurations,
    testInstances: metaModel.testInstances,
    existingApplicationVersions: metaModel.applicationVersions,
    freezeProducedVersionUuids,
    previousEntityVersions,
    newUuid: options?.newUuid,
  });
}
