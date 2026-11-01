import {
  getMiroirFundamentalSchemaForDeployment,
  type Entity,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type Report,
  type SelfApplication,
} from "miroir-core";

import {
  entityAgentRunMeasurement as entityAgentRunMeasurementMiroir,
  entityBundleSizeMeasurement as entityBundleSizeMeasurementMiroir,
  entityPageLoadMeasurement as entityPageLoadMeasurementMiroir,
} from "miroir-app-miroir";

// #647: the measurement Entities are Miroir's (devData section); their recording helpers live in
// miroir-app-miroir/scripts/devData and are not exported, so the seeds below use loose row types.
type BundleSizeMeasurement = EntityInstance & Record<string, any>;
type AgentRunMeasurement = EntityInstance & Record<string, any>;

import selfApplicationMetaJson from "../assets/meta_model/a659d350-dd97-4da9-91de-524fa01745dc/9ff432a9-89a1-460b-a263-1672d084a9e0.json" with { type: "json" };
import menuDefaultMetaJson from "../assets/meta_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/c95bfb70-62bd-4f40-ac2b-04857124f133.json" with { type: "json" };
import reportBundleSizeMeasurementDetailsJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/85077493-0fea-4969-96c8-b994272de284.json" with { type: "json" };
import reportPageLoadHistoryJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/02dd2ead-7b8d-4160-99c9-9f4e9a1c051b.json" with { type: "json" };
import reportPageLoadMeasurementDetailsJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/193c3dea-792d-471a-88a0-546e4b5e81cf.json" with { type: "json" };
import reportAgentRunHistoryJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7a695632-338e-4c33-8b39-dba7f6d4c988.json" with { type: "json" };
import reportAgentRunMeasurementDetailsJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/49a3c09a-c7cd-4438-9730-c691c70741af.json" with { type: "json" };
import reportBundleSizeHistoryJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/e8c6faa5-a117-4afd-b7ae-4a40c6111f95.json" with { type: "json" };
import selfApplicationModelBranchMetaMasterBranchJson from "../assets/meta_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/4408382d-daee-41d0-a53d-80a44c0f79e6.json" with { type: "json" };

export const selfApplicationMeta = selfApplicationMetaJson as SelfApplication;
export const selfApplicationModelBranchMetaMasterBranch = selfApplicationModelBranchMetaMasterBranchJson;
export const menuDefaultMeta = menuDefaultMetaJson as Menu;
export const entityBundleSizeMeasurement = entityBundleSizeMeasurementMiroir as Entity;
export const entityPageLoadMeasurement = entityPageLoadMeasurementMiroir as Entity;
export const reportBundleSizeHistory = reportBundleSizeHistoryJson as Report;
export const reportBundleSizeMeasurementDetails = reportBundleSizeMeasurementDetailsJson as Report;
export const reportPageLoadHistory = reportPageLoadHistoryJson as Report;
export const reportPageLoadMeasurementDetails = reportPageLoadMeasurementDetailsJson as Report;
export const entityAgentRunMeasurement = entityAgentRunMeasurementMiroir as Entity;
export const reportAgentRunHistory = reportAgentRunHistoryJson as Report;
export const reportAgentRunMeasurementDetails = reportAgentRunMeasurementDetailsJson as Report;

/** Init-only ApplicationVersion for unversioned Meta (not shipped as a model asset). */
export const metaInitApplicationVersion: EntityInstance = {
  uuid: "a43fee5b-3430-4540-85c6-70131104727b",
  parentName: "ApplicationVersion",
  parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  name: "Initial",
  previousVersion: "",
  modelStructureMigration: [],
  modelCUDMigration: [],
  selfApplication: selfApplicationMeta.uuid,
  branch: selfApplicationModelBranchMetaMasterBranch.uuid,
  description: "Synthetic init-only ApplicationVersion for unversioned Meta",
} as EntityInstance;

export const defaultMetaAppModel: MetaModel = {
  applicationUuid: selfApplicationMeta.uuid,
  applicationName: selfApplicationMeta.name,
  applications: [selfApplicationMeta],
  entities: [entityBundleSizeMeasurement, entityPageLoadMeasurement, entityAgentRunMeasurement],
  entityVersions: [],
  endpoints: [],
  menus: [menuDefaultMeta],
  reports: [
    reportBundleSizeHistory,
    reportBundleSizeMeasurementDetails,
    reportPageLoadHistory,
    reportPageLoadMeasurementDetails,
    reportAgentRunHistory,
    reportAgentRunMeasurementDetails,
  ],
  runners: [],
  tests: [],
  themes: [],
  transformerDefinitions: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applicationVersionCrossRunnerVersion: [],
  runnerVersions: [],
  applicationVersionCrossThemeVersion: [],
  themeVersions: [],
  applicationVersionCrossTransformerDefinitionVersion: [],
  transformerDefinitionVersions: [],
  storedQueries: [],
  mlSchemas: [],
  applicationVersions: [],
};

/**
 * Fixed BundleSizeMeasurement instances for the report MiroirTests (#473): two web page records and
 * one Electron record, so the tests do not depend on the real history, which grows with every record.
 */
const bundleSizeMeasurementSeedRecords: BundleSizeMeasurement[] = [
  {
    uuid: "ad25f423-a99b-4ede-9fd3-1a705fc0b193",
    parentName: "BundleSizeMeasurement",
    parentUuid: entityBundleSizeMeasurement.uuid,
    application: "miroir-standalone-app",
    measuredAt: "2026-09-01T10:00:00.000Z",
    eagerGzipBytes: 2709170,
    baseline: 2709170,
    reason: "seed: first web page record",
  },
  {
    uuid: "b00d5241-b4bd-4396-b7ce-ea38a941f858",
    parentName: "BundleSizeMeasurement",
    parentUuid: entityBundleSizeMeasurement.uuid,
    application: "miroir-standalone-app",
    measuredAt: "2026-10-01T10:00:00.000Z",
    eagerGzipBytes: 747000,
    baseline: 747000,
    previousBaseline: 2709170,
    baselineChange: -1962170,
    reason: "seed: lazy routes",
  },
  {
    uuid: "5b3866cd-ecfa-47a0-bbb1-054ed5214c0f",
    parentName: "BundleSizeMeasurement",
    parentUuid: entityBundleSizeMeasurement.uuid,
    application: "miroir-standalone-app-electron",
    measuredAt: "2026-09-15T10:00:00.000Z",
    eagerGzipBytes: 942479,
    baseline: 942479,
    reason: "seed: Electron record",
  },
];
export const bundleSizeMeasurementSeed: EntityInstance[] = bundleSizeMeasurementSeedRecords;

/**
 * Fixed AgentRunMeasurement instances for the report MiroirTests (#550): two overdue-loans runs in two
 * arms and one invalid lending-limit run.
 */
function agentRunSeedRecord(
  uuid: string,
  arm: string,
  feature: string,
  costUsd: number,
  extra: Partial<AgentRunMeasurement> = {},
): AgentRunMeasurement {
  return {
    uuid,
    parentName: "AgentRunMeasurement",
    parentUuid: entityAgentRunMeasurement.uuid,
    runId: `seed-${feature}-${arm}`,
    arm,
    feature,
    runIndex: 0,
    pilot: true,
    startedAt: "2026-10-24T12:00:00.000Z",
    model: "claude-sonnet-5-5",
    effort: "medium",
    turns: 30,
    stopReason: "success",
    durationMs: 300000,
    inputTokens: 100,
    outputTokens: 10000,
    cacheReadTokens: 1000000,
    cacheCreationTokens: 50000,
    costUsd,
    acceptancePassed: true,
    valid: true,
    taskHash: "seed",
    ...extra,
  };
}
const agentRunSeedRecords: AgentRunMeasurement[] = [
  agentRunSeedRecord("3b5358a8-2407-491b-a3b4-1a64788776ab", "miroir-mcp", "overdue-loans", 1.25),
  agentRunSeedRecord("24d23f7b-5d45-4453-8c02-5c0b2fdbf92f", "conventional", "overdue-loans", 2.5),
  agentRunSeedRecord("2a6fe1c2-5b55-4f62-9688-fbcc406b6fcc", "miroir-files", "lending-limit", 0.75, {
    valid: false,
    invalidReason: "seed: tool Bash",
    acceptancePassed: false,
  }),
];
export const agentRunMeasurementSeed: EntityInstance[] = agentRunSeedRecords;

/** TestConfiguration of the Meta report MiroirTests: the Meta model and the fixed measurements and agent runs above. */
export const testConfiguration_metaBundleSizeSeed = {
  uuid: "8b8dfbd9-66e9-4afb-87e3-90aa07ccd11b",
  testbedModel: defaultMetaAppModel,
  testbedEntitiesAndInstances: [
    { entity: entityBundleSizeMeasurement, instances: bundleSizeMeasurementSeed },
    { entity: entityAgentRunMeasurement, instances: agentRunMeasurementSeed },
  ],
};

/**
 * Fixed PageLoadMeasurement instances for the page load Report MiroirTests (#580, #583): four page
 * loads, so that each (build mode, client) graph of the history can be checked to show its own rows
 * only. A: production web page, with its initial load, first report display and first model page
 * display; B: production web page, initial load; C: development web page, initial load and first
 * report display; D: production Electron, initial load.
 */
type PageLoadSeedLoad = {
  pageLoad: string;
  buildMode: "production" | "development";
  client: "webApp" | "electron";
};
const pageLoadA: PageLoadSeedLoad = { pageLoad: "4278911b-c1cc-46be-8207-e58682e06694", buildMode: "production", client: "webApp" };
const pageLoadB: PageLoadSeedLoad = { pageLoad: "a25f8fc9-8794-40e4-8dcd-910364bc0ba5", buildMode: "production", client: "webApp" };
const pageLoadC: PageLoadSeedLoad = { pageLoad: "bfd14b1d-758d-4fde-85ca-8bb1e7258efa", buildMode: "development", client: "webApp" };
const pageLoadD: PageLoadSeedLoad = { pageLoad: "6ae5219c-6ae3-4ea7-af71-efc9a23076a1", buildMode: "production", client: "electron" };

function pageLoadSeedRecord(
  load: PageLoadSeedLoad,
  uuid: string,
  step: string,
  page: string,
  measuredAt: string,
  durationMs: number,
  chunks: { file: string; startMs: number; durationMs: number; transferBytes: number; encodedBytes: number }[],
  milestones?: Record<string, number>,
): EntityInstance {
  return {
    uuid,
    parentName: "PageLoadMeasurement",
    parentUuid: entityPageLoadMeasurement.uuid,
    pageLoad: load.pageLoad,
    measuredAt,
    step,
    page,
    url: `/?page=${page}`,
    durationMs,
    settled: true,
    ...(milestones ? { milestones } : {}),
    chunkCount: chunks.length,
    chunkTransferBytes: chunks.reduce((sum, chunk) => sum + chunk.transferBytes, 0),
    chunkEncodedBytes: chunks.reduce((sum, chunk) => sum + chunk.encodedBytes, 0),
    chunks,
    dataRequestCount: 4,
    dataTransferBytes: 81000,
    environment: "dev",
    client: load.client,
    buildMode: load.buildMode,
  } as EntityInstance;
}

const seedInitialLoadMilestones = {
  responseEnd: 12,
  entryScript: 260,
  configReady: 300,
  platformReady: 900,
  firstRender: 910,
  configurationsLoaded: 2100,
};

export const pageLoadMeasurementSeed: EntityInstance[] = [
  pageLoadSeedRecord(
    pageLoadA,
    "8a7af0c0-caca-4d40-8a6c-83ac95992411",
    "initialLoad",
    "home",
    "2026-10-27T10:00:00.000Z",
    2350,
    [{ file: "/assets/index-seed.js", startMs: 15, durationMs: 210, transferBytes: 820000, encodedBytes: 819000 }],
    seedInitialLoadMilestones,
  ),
  pageLoadSeedRecord(pageLoadA, "691c8330-7349-467b-9d28-6e06b7e707ec", "route:report", "report", "2026-10-27T10:00:05.000Z", 780, [
    { file: "/assets/ReportDisplay-seed.js", startMs: 4, durationMs: 95, transferBytes: 150000, encodedBytes: 149000 },
  ]),
  pageLoadSeedRecord(pageLoadA, "36b38f70-b4e9-46cb-85f8-119d77210eb5", "route:model", "model", "2026-10-27T10:00:09.000Z", 1210, [
    { file: "/assets/ModelDiagramPage-seed.js", startMs: 6, durationMs: 120, transferBytes: 210000, encodedBytes: 209000 },
  ]),
  pageLoadSeedRecord(
    pageLoadB,
    "3cf48f43-3baf-4096-838a-dce386ea9051",
    "initialLoad",
    "home",
    "2026-10-28T10:00:00.000Z",
    2280,
    [{ file: "/assets/index-seed.js", startMs: 14, durationMs: 0, transferBytes: 0, encodedBytes: 819000 }],
    seedInitialLoadMilestones,
  ),
  pageLoadSeedRecord(
    pageLoadC,
    "8b3e6131-12fe-4b24-9a87-c30e7c0b7d6f",
    "initialLoad",
    "home",
    "2026-10-28T11:00:00.000Z",
    9400,
    [{ file: "/index.tsx", startMs: 20, durationMs: 40, transferBytes: 3000, encodedBytes: 2800 }],
    seedInitialLoadMilestones,
  ),
  pageLoadSeedRecord(pageLoadC, "f9a62339-da42-442c-b4d4-5c34fb3010eb", "route:report", "report", "2026-10-28T11:00:12.000Z", 3100, [
    { file: "/miroir-fwk/4_view/routes/ReportPage.tsx", startMs: 3, durationMs: 30, transferBytes: 9000, encodedBytes: 8800 },
  ]),
  pageLoadSeedRecord(
    pageLoadD,
    "337b2ac5-df5f-42f7-bfe9-b43852008d2b",
    "initialLoad",
    "home",
    "2026-10-28T12:00:00.000Z",
    1900,
    [{ file: "/assets/index-seed.js", startMs: 10, durationMs: 60, transferBytes: 0, encodedBytes: 819000 }],
    seedInitialLoadMilestones,
  ),
];

/** TestConfiguration of the Meta page load Report MiroirTests: the Meta model and the fixed steps above. */
export const testConfiguration_metaPageLoadSeed = {
  uuid: "a8dd8a49-97de-426c-beb7-c32d0f1beb26",
  testbedModel: defaultMetaAppModel,
  testbedEntitiesAndInstances: [{ entity: entityPageLoadMeasurement, instances: pageLoadMeasurementSeed }],
};

export function getDefaultMetaModelEnvironment(
  defaultMiroirMetaModelParam: MetaModel,
  metaDeploymentUuid: string,
): MiroirModelEnvironment {
  if (typeof metaDeploymentUuid !== "string" || metaDeploymentUuid.length === 0) {
    throw new Error(
      `getDefaultMetaModelEnvironment: metaDeploymentUuid must be a deployment uuid string, got ${typeof metaDeploymentUuid}`,
    );
  }

  return {
    miroirFundamentalMlSchema: getMiroirFundamentalSchemaForDeployment(metaDeploymentUuid, defaultMetaAppModel),
    miroirMetaModel: defaultMiroirMetaModelParam,
    endpointsByUuid: {},
    deploymentUuid: metaDeploymentUuid,
    currentModel: defaultMetaAppModel,
  };
}
