/**
 * #647 D17: seeds of the devData Report MiroirTests (report.bundleSizeHistory, report.pageLoadHistory,
 * report.agentRunHistory). The Reports are Miroir's; the tests open them on the devData section of a
 * Library testbed, seeded with the fixed rows below, so they do not depend on the real history, which
 * grows with every record.
 */
import type { Entity, EntityInstance } from "miroir-core";
import {
  entityAgentRunMeasurement as entityAgentRunMeasurementJson,
  entityBundleSizeMeasurement as entityBundleSizeMeasurementJson,
  entityPageLoadMeasurement as entityPageLoadMeasurementJson,
} from "miroir-app-miroir";
import { defaultLibraryAppModel } from "miroir-example-library";

const entityBundleSizeMeasurement = entityBundleSizeMeasurementJson as Entity;
const entityPageLoadMeasurement = entityPageLoadMeasurementJson as Entity;
const entityAgentRunMeasurement = entityAgentRunMeasurementJson as Entity;

// The row types live in miroir-app-miroir/scripts/devData, which the package does not export.
type BundleSizeMeasurement = EntityInstance & Record<string, any>;
type AgentRunMeasurement = EntityInstance & Record<string, any>;

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

/**
 * TestConfiguration of the bundle size and agent run Report MiroirTests: Library's model, and the fixed
 * measurements and agent runs above, seeded in Library's devData section (#647 D15).
 */
export const testConfiguration_devDataBundleSizeSeed = {
  uuid: "8b8dfbd9-66e9-4afb-87e3-90aa07ccd11b",
  testbedModel: defaultLibraryAppModel,
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

/** TestConfiguration of the page load Report MiroirTests: Library's model, and the fixed steps above in its devData section. */
export const testConfiguration_devDataPageLoadSeed = {
  uuid: "a8dd8a49-97de-426c-beb7-c32d0f1beb26",
  testbedModel: defaultLibraryAppModel,
  testbedEntitiesAndInstances: [{ entity: entityPageLoadMeasurement, instances: pageLoadMeasurementSeed }],
};
