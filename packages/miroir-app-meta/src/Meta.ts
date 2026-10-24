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

import type { AgentRunMeasurement } from "./agentRunHistory";
import type { BundleSizeMeasurement } from "./bundleSizeHistory";

import selfApplicationMetaJson from "../assets/meta_model/a659d350-dd97-4da9-91de-524fa01745dc/9ff432a9-89a1-460b-a263-1672d084a9e0.json" with { type: "json" };
import menuDefaultMetaJson from "../assets/meta_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/c95bfb70-62bd-4f40-ac2b-04857124f133.json" with { type: "json" };
import entityAgentRunMeasurementJson from "../assets/meta_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/954de789-6350-4f54-a809-5f2b8b91d067.json" with { type: "json" };
import entityBundleSizeMeasurementJson from "../assets/meta_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b.json" with { type: "json" };
import reportBundleSizeMeasurementDetailsJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/85077493-0fea-4969-96c8-b994272de284.json" with { type: "json" };
import reportAgentRunHistoryJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7a695632-338e-4c33-8b39-dba7f6d4c988.json" with { type: "json" };
import reportAgentRunMeasurementDetailsJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/49a3c09a-c7cd-4438-9730-c691c70741af.json" with { type: "json" };
import reportBundleSizeHistoryJson from "../assets/meta_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/e8c6faa5-a117-4afd-b7ae-4a40c6111f95.json" with { type: "json" };
import selfApplicationModelBranchMetaMasterBranchJson from "../assets/meta_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/4408382d-daee-41d0-a53d-80a44c0f79e6.json" with { type: "json" };

export const selfApplicationMeta = selfApplicationMetaJson as SelfApplication;
export const selfApplicationModelBranchMetaMasterBranch = selfApplicationModelBranchMetaMasterBranchJson;
export const menuDefaultMeta = menuDefaultMetaJson as Menu;
export const entityBundleSizeMeasurement = entityBundleSizeMeasurementJson as Entity;
export const entityAgentRunMeasurement = entityAgentRunMeasurementJson as Entity;
export const reportBundleSizeHistory = reportBundleSizeHistoryJson as Report;
export const reportBundleSizeMeasurementDetails = reportBundleSizeMeasurementDetailsJson as Report;
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
  entities: [entityBundleSizeMeasurement, entityAgentRunMeasurement],
  entityVersions: [],
  endpoints: [],
  menus: [menuDefaultMeta],
  reports: [
    reportBundleSizeHistory,
    reportBundleSizeMeasurementDetails,
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
