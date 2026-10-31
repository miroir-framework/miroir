/**
 * #580: the load timing writer records finished steps as PageLoadMeasurement instances of the Meta
 * app, through the real DomainController, on the emulated filesystem server of `test-filesystem`
 * (copies in .miroir/test-filesystem/, seeded from the package assets).
 * #633: the configuration fetch, now in miroir-react, marks `configurationsLoaded` through the sink the
 * host registers (the app's index.tsx registers its browser recorder).
 *
 * Not reachable through MiroirTest: the writer is a client module the browser recorder calls, not a
 * model element.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- loadTimingWriter
 * ```
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "process";
import { beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type MiroirConfigClient,
  type MiroirConfigForClientStub,
} from "miroir-core";
import { bootEnvironment } from "miroir-env";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { ENTITY_PAGE_LOAD_MEASUREMENT_UUID, META_DEPLOYMENT_UUID } from "../../../src/loadTimings/loadTimingConstants.js";
import type { LoadTimingStep } from "../../../src/loadTimings/loadTimingTypes.js";
import { loadTimingWriter } from "../../../src/loadTimings/loadTimingWriter.js";
import { loglevelnext } from "../../../src/loglevelnextImporter.js";
import { fetchMiroirAndAppConfigurations, setLoadTimingMarkSink } from "miroir-react";
import { setupMiroirTest } from "../../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { miroirAppStartup } from "../../../src/startup.js";
import { openTestEnvironment } from "../../helpers/testEnvironment.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
  defaultLevel: "WARN",
  specificLoggerOptions: {},
} as any);

const TEST_PAGE_LOAD = "b1f0c5a2-8f43-4c1e-9c43-2a3f4f8e7d10";

function step(name: string, durationMs: number): LoadTimingStep {
  return {
    pageLoad: TEST_PAGE_LOAD,
    measuredAt: "2026-10-27T10:00:00.000Z",
    step: name,
    page: name === "initialLoad" ? "home" : name.slice("route:".length),
    url: "/?page=home",
    durationMs,
    settled: true,
    chunkCount: 1,
    chunkTransferBytes: 1200,
    chunkEncodedBytes: 1100,
    chunks: [{ file: "/assets/HomePage-abc.js", startMs: 950, durationMs: 40, transferBytes: 1200, encodedBytes: 1100 }],
    dataRequestCount: 0,
    dataTransferBytes: 0,
    client: "webApp",
    buildMode: "production",
  };
}

async function bootPlatform(): Promise<{
  domainController: DomainControllerInterface;
  miroirConfig: MiroirConfigClient;
}> {
  const testEnvironment = openTestEnvironment("test-filesystem");
  const wired = await setupMiroirTest(testEnvironment.miroirConfig, miroirActivityTracker, miroirEventService);
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  const loaded = await fetchMiroirAndAppConfigurations({
    domainController: wired.domainControllerForClient,
    miroirConfig: testEnvironment.miroirConfig,
  });
  expect(loaded?.status, "the configurations load").not.toBe("error");
  return { domainController: wired.domainControllerForClient, miroirConfig: testEnvironment.miroirConfig };
}

function metaEntityFolder(miroirConfig: MiroirConfigClient): string {
  const storage = (miroirConfig.client as MiroirConfigForClientStub).deploymentStorageConfig[META_DEPLOYMENT_UUID];
  const data = storage.data as { directory: string };
  return path.resolve((miroirConfig.client as MiroirConfigForClientStub).filesystemDeploymentRootDirectory, data.directory, ENTITY_PAGE_LOAD_MEASUREMENT_UUID);
}

describe("load timing writer (#580)", () => {
  let domainController: DomainControllerInterface;
  let miroirConfig: MiroirConfigClient;
  const marks: string[] = [];

  beforeAll(async () => {
    setLoadTimingMarkSink((name) => marks.push(name));
    try {
      ({ domainController, miroirConfig } = await bootPlatform());
    } finally {
      setLoadTimingMarkSink(undefined);
    }
  });

  it("the miroir-react configuration fetch marks configurationsLoaded through the registered sink (#633)", () => {
    expect(marks).toContain("configurationsLoaded");
  });

  it("writes every step as a PageLoadMeasurement instance of the Meta deployment", async () => {
    // The seed copies the package assets, which may hold a developer's own (gitignored) rows:
    // only the rows of this test's page load count.
    const result = await loadTimingWriter(domainController)([step("initialLoad", 1840), step("route:report", 620)]);
    expect(result).toEqual({ ok: true });

    const folder = metaEntityFolder(miroirConfig);
    const written = readdirSync(folder)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(readFileSync(path.join(folder, file), "utf-8")))
      .filter((instance) => instance.pageLoad === TEST_PAGE_LOAD);
    expect(written.map((instance) => [instance.step, instance.durationMs, instance.chunks[0].file]).sort()).toEqual([
      ["initialLoad", 1840, "/assets/HomePage-abc.js"],
      ["route:report", 620, "/assets/HomePage-abc.js"],
    ]);
  });

  it("writes into the test copy, not the package assets", () => {
    expect(metaEntityFolder(miroirConfig)).toContain(path.join(".miroir", "test-filesystem"));
    expect(existsSync(metaEntityFolder(miroirConfig))).toBe(true);
  });
});
