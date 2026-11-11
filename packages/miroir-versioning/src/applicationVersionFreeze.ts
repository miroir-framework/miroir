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
  ENTITY_PRESENT_MODEL_DEFINITION_FIELDS,
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
  type EntityPresentModelDefinitionField,
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
/** SelfApplicationVersion Entity UUID. */
const APPLICATION_VERSION_ENTITY_UUID = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
/** ApplicationVersionCrossEntityVersion Entity UUID. */
const APPLICATION_VERSION_CROSS_ENTITY_VERSION_UUID =
  "8bec933d-6287-4de7-8a88-5c24216de9f4";

export interface SnapshotOptions {
  /** UUID generator override for testing determinism. */
  newUuid?: () => string;
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
  description?: string;
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
  description?: string;
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
      ...(report.description !== undefined ? { description: report.description } : {}),
    };

    return snapshot;
  });
}

/** Live Menu instance shape in MetaModel.menus. */
export type StoredMenuForFreeze = {
  uuid: string;
  name: string;
  definition: Menu["definition"];
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
  definition: Menu["definition"];
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

/** Live Theme instance shape in MetaModel.themes. */
export type StoredThemeForFreeze = {
  uuid: string;
  name: string;
  defaultLabel?: string;
  description?: string;
  definition: StoredMiroirTheme["definition"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical Theme snapshot minted at freeze. */
export type ThemeVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "ThemeVersion";
  name: string;
  themeUuid: string;
  defaultLabel?: string;
  description?: string;
  definition: StoredMiroirTheme["definition"];
};

/**
 * Deep-copy present-model Themes into new immutable ThemeVersion instances.
 * Each output has a **new** UUID; `themeUuid` references the live Theme.
 */
export function snapshotThemesAsHistoricalThemeVersions(
  themes: StoredThemeForFreeze[],
  options?: SnapshotOptions,
): ThemeVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return themes.map((theme) => {
    if (theme.definition === undefined || theme.definition === null) {
      throw new Error(
        `Cannot snapshot Theme ${theme.uuid} (${theme.name}): definition is missing`,
      );
    }

    const snapshot: ThemeVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: THEME_VERSION_ENTITY_UUID,
      parentName: "ThemeVersion",
      name: theme.name,
      themeUuid: theme.uuid,
      definition: structuredClone(theme.definition),
      ...(theme.defaultLabel !== undefined ? { defaultLabel: theme.defaultLabel } : {}),
      ...(theme.description !== undefined ? { description: theme.description } : {}),
    };

    return snapshot;
  });
}

/** Body stored on TransformerDefinitionVersion.definition at freeze. */
export type TransformerDefinitionVersionBody = {
  classification?: string;
  runnableAsSql?: boolean;
  transformerInterface: TransformerDefinition["transformerInterface"];
  transformerImplementation: TransformerDefinition["transformerImplementation"];
};

/** Live TransformerDefinition instance shape in MetaModel.transformerDefinitions. */
export type StoredTransformerDefinitionForFreeze = {
  uuid: string;
  name: string;
  defaultLabel: string;
  description?: string;
  classification?: string;
  runnableAsSql?: boolean;
  transformerInterface: TransformerDefinition["transformerInterface"];
  transformerImplementation: TransformerDefinition["transformerImplementation"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical TransformerDefinition snapshot minted at freeze. */
export type TransformerDefinitionVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "TransformerDefinitionVersion";
  name: string;
  transformerUuid: string;
  defaultLabel: string;
  description?: string;
  definition: TransformerDefinitionVersionBody;
};

function buildTransformerDefinitionVersionBody(
  transformer: StoredTransformerDefinitionForFreeze,
): TransformerDefinitionVersionBody {
  if (
    transformer.transformerImplementation === undefined ||
    transformer.transformerImplementation === null
  ) {
    throw new Error(
      `Cannot snapshot TransformerDefinition ${transformer.uuid} (${transformer.name}): transformerImplementation is missing`,
    );
  }
  if (transformer.transformerInterface === undefined || transformer.transformerInterface === null) {
    throw new Error(
      `Cannot snapshot TransformerDefinition ${transformer.uuid} (${transformer.name}): transformerInterface is missing`,
    );
  }

  return {
    transformerInterface: structuredClone(transformer.transformerInterface),
    transformerImplementation: structuredClone(transformer.transformerImplementation),
    ...(transformer.classification !== undefined
      ? { classification: transformer.classification }
      : {}),
    ...(transformer.runnableAsSql !== undefined ? { runnableAsSql: transformer.runnableAsSql } : {}),
  };
}

/**
 * Deep-copy present-model TransformerDefinitions into new immutable TransformerDefinitionVersion instances.
 * Each output has a **new** UUID; `transformerUuid` references the live TransformerDefinition.
 */
export function snapshotTransformerDefinitionsAsHistoricalTransformerDefinitionVersions(
  transformerDefinitions: StoredTransformerDefinitionForFreeze[],
  options?: SnapshotOptions,
): TransformerDefinitionVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return transformerDefinitions.map((transformer) => {
    const snapshot: TransformerDefinitionVersionSnapshot = {
      uuid: mintUuid(),
      parentUuid: TRANSFORMER_DEFINITION_VERSION_ENTITY_UUID,
      parentName: "TransformerDefinitionVersion",
      name: transformer.name,
      transformerUuid: transformer.uuid,
      defaultLabel: transformer.defaultLabel,
      definition: buildTransformerDefinitionVersionBody(transformer),
      ...(transformer.description !== undefined ? { description: transformer.description } : {}),
    };

    return snapshot;
  });
}

/** Live MlSchema instance shape in MetaModel.mlSchemas. */
export type StoredMlSchemaForFreeze = {
  uuid: string;
  name: string;
  defaultLabel?: string;
  description?: string;
  definition?: MlSchema["definition"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical MlSchema snapshot minted at freeze (#230). */
export type MlSchemaVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "MlSchemaVersion";
  name: string;
  mlSchemaUuid: string;
  defaultLabel?: string;
  description?: string;
  definition?: MlSchema["definition"];
};

/**
 * Deep-copy present-model MlSchemas into new immutable MlSchemaVersion instances.
 * Each output has a **new** UUID; `mlSchemaUuid` references the live MlSchema.
 * An MlSchema without a definition is snapshotted without one: the live row allows it.
 */
export function snapshotMlSchemasAsHistoricalMlSchemaVersions(
  mlSchemas: StoredMlSchemaForFreeze[],
  options?: SnapshotOptions,
): MlSchemaVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return mlSchemas.map((mlSchema) => ({
    uuid: mintUuid(),
    parentUuid: ML_SCHEMA_VERSION_ENTITY_UUID,
    parentName: "MlSchemaVersion",
    name: mlSchema.name,
    mlSchemaUuid: mlSchema.uuid,
    ...(mlSchema.definition !== undefined
      ? { definition: structuredClone(mlSchema.definition) }
      : {}),
    ...(mlSchema.defaultLabel !== undefined ? { defaultLabel: mlSchema.defaultLabel } : {}),
    ...(mlSchema.description !== undefined ? { description: mlSchema.description } : {}),
  }));
}

/** Live MiroirTest instance shape in MetaModel.tests. */
export type StoredMiroirTestForFreeze = {
  uuid: string;
  name?: string;
  description?: string;
  skip?: boolean;
  tags?: MiroirTestDefinition["tags"];
  issue?: string;
  definition: MiroirTestDefinition["definition"];
  parentUuid?: string;
  parentName?: string;
};

/** Historical MiroirTest snapshot minted at freeze (#230). */
export type MiroirTestVersionSnapshot = {
  uuid: string;
  parentUuid: string;
  parentName: "MiroirTestVersion";
  name?: string;
  miroirTestUuid: string;
  description?: string;
  skip?: boolean;
  tags?: string[];
  issue?: string;
  definition: MiroirTestDefinition["definition"];
};

/**
 * Deep-copy present-model MiroirTests into new immutable MiroirTestVersion instances.
 * Each output has a **new** UUID; `miroirTestUuid` references the live MiroirTest.
 */
export function snapshotMiroirTestsAsHistoricalMiroirTestVersions(
  tests: StoredMiroirTestForFreeze[],
  options?: SnapshotOptions,
): MiroirTestVersionSnapshot[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return tests.map((test) => {
    if (test.definition === undefined || test.definition === null) {
      throw new Error(
        `Cannot snapshot MiroirTest ${test.uuid} (${test.name ?? "unnamed"}): definition is missing`,
      );
    }

    return {
      uuid: mintUuid(),
      parentUuid: MIROIR_TEST_VERSION_ENTITY_UUID,
      parentName: "MiroirTestVersion",
      miroirTestUuid: test.uuid,
      definition: structuredClone(test.definition),
      ...(test.name !== undefined ? { name: test.name } : {}),
      ...(test.description !== undefined ? { description: test.description } : {}),
      ...(test.skip !== undefined ? { skip: test.skip } : {}),
      ...(test.tags !== undefined ? { tags: [...test.tags] } : {}),
      ...(test.issue !== undefined ? { issue: test.issue } : {}),
    };
  });
}

/**
 * A live Blob, TestConfiguration or Test instance (#706). These are read from the store at freeze
 * time: the MetaModel has no collection for them.
 */
export type StoredInstanceForFreeze = {
  uuid: string;
  parentUuid?: string;
  parentName?: string;
  parentDefinitionVersionUuid?: string;
  conceptLevel?: string;
  [attribute: string]: unknown;
};

/** Historical snapshot minted at freeze for a Blob, TestConfiguration or Test (#706). */
export type InstanceVersionSnapshot<P extends string, K extends string> = {
  uuid: string;
  parentUuid: string;
  parentName: P;
} & { [key in K]: string } & Record<string, unknown>;

export type BlobVersionSnapshot = InstanceVersionSnapshot<"BlobVersion", "blobUuid">;
export type TestConfigurationVersionSnapshot = InstanceVersionSnapshot<
  "TestConfigurationVersion",
  "testConfigurationUuid"
>;
export type TestVersionSnapshot = InstanceVersionSnapshot<"TestVersion", "testUuid">;

/**
 * Deep-copy live instances into new version rows: every attribute except the identity ones
 * (`uuid`, `parentUuid`, `parentName`, `parentDefinitionVersionUuid`, `conceptLevel`), plus
 * `liveUuidAttribute` pointing at the live instance. Each output has a **new** UUID.
 */
function snapshotInstancesAsVersions<P extends string, K extends string>(
  instances: StoredInstanceForFreeze[],
  versionEntityUuid: string,
  versionEntityName: P,
  liveUuidAttribute: K,
  options?: SnapshotOptions,
): InstanceVersionSnapshot<P, K>[] {
  const mintUuid = options?.newUuid ?? uuidv4;

  return instances.map((instance) => {
    const {
      uuid,
      parentUuid: _parentUuid,
      parentName: _parentName,
      parentDefinitionVersionUuid: _parentDefinitionVersionUuid,
      conceptLevel: _conceptLevel,
      ...attributes
    } = instance;
    return {
      ...structuredClone(attributes),
      uuid: mintUuid(),
      parentUuid: versionEntityUuid,
      parentName: versionEntityName,
      [liveUuidAttribute]: uuid,
    } as InstanceVersionSnapshot<P, K>;
  });
}

/** Deep-copy live Blobs into new BlobVersion instances; `blobUuid` references the live Blob (#706). */
export function snapshotBlobsAsHistoricalBlobVersions(
  blobs: StoredInstanceForFreeze[],
  options?: SnapshotOptions,
): BlobVersionSnapshot[] {
  return snapshotInstancesAsVersions(blobs, BLOB_VERSION_ENTITY_UUID, "BlobVersion", "blobUuid", options);
}

/**
 * Deep-copy live TestConfigurations into new TestConfigurationVersion instances;
 * `testConfigurationUuid` references the live TestConfiguration (#706).
 */
export function snapshotTestConfigurationsAsHistoricalTestConfigurationVersions(
  testConfigurations: StoredInstanceForFreeze[],
  options?: SnapshotOptions,
): TestConfigurationVersionSnapshot[] {
  return snapshotInstancesAsVersions(
    testConfigurations,
    TEST_CONFIGURATION_VERSION_ENTITY_UUID,
    "TestConfigurationVersion",
    "testConfigurationUuid",
    options,
  );
}

/** Deep-copy live Tests into new TestVersion instances; `testUuid` references the live Test (#706). */
export function snapshotTestsAsHistoricalTestVersions(
  testInstances: StoredInstanceForFreeze[],
  options?: SnapshotOptions,
): TestVersionSnapshot[] {
  return snapshotInstancesAsVersions(testInstances, TEST_VERSION_ENTITY_UUID, "TestVersion", "testUuid", options);
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
  storedQueries?: StoredQueryForFreeze[];
  /** Present-model Reports to snapshot (#227). Defaults to empty. */
  reports?: StoredReportForFreeze[];
  /** Present-model Menus to snapshot (#227). Defaults to empty. */
  menus?: StoredMenuForFreeze[];
  /** Present-model Endpoints to snapshot (#227). Defaults to empty. */
  endpoints?: StoredEndpointForFreeze[];
  /** Present-model Runners to snapshot (#227). Defaults to empty. */
  runners?: StoredRunnerForFreeze[];
  /** Present-model Themes to snapshot (#227). Defaults to empty. */
  themes?: StoredThemeForFreeze[];
  /** Present-model TransformerDefinitions to snapshot (#227). Defaults to empty. */
  transformerDefinitions?: StoredTransformerDefinitionForFreeze[];
  /** Present-model MlSchemas to snapshot (#230). Defaults to empty. */
  mlSchemas?: StoredMlSchemaForFreeze[];
  /** Present-model MiroirTests to snapshot (#230). Defaults to empty. */
  tests?: StoredMiroirTestForFreeze[];
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

function canonicalizeJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeJsonValue(item));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const child = canonicalizeJsonValue(record[key]);
      if (child !== undefined) {
        normalized[key] = child;
      }
    }
    return normalized;
  }
  return value;
}

/** Deep equality for JSON-like present-model fields (Postgres JSONB key order / null omission). */
function stableJsonEqual(a: unknown, b: unknown): boolean {
  return (
    JSON.stringify(canonicalizeJsonValue(a)) === JSON.stringify(canonicalizeJsonValue(b))
  );
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
  storedQueries?: StoredQueryForFreeze[];
  reports?: StoredReportForFreeze[];
  menus?: StoredMenuForFreeze[];
  endpoints?: StoredEndpointForFreeze[];
  runners?: StoredRunnerForFreeze[];
  themes?: StoredThemeForFreeze[];
  transformerDefinitions?: StoredTransformerDefinitionForFreeze[];
  mlSchemas?: StoredMlSchemaForFreeze[];
  tests?: StoredMiroirTestForFreeze[];
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
