import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";
import * as vitest from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  miroirCoreStartup,
  type EntityInstance,
  type LoggerOptions,
  type MiroirTestSuite,
  type RunnerTestSessionInterface,
} from "miroir-core";
import { loadApplicationRunnerUuidIndexFromFolders } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { entityReport } from "miroir-test-app_deployment-miroir";
import { env } from "process";

import { createReportTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReportTest.js";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../src/startup.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import { createRunnerSuiteSessionParams } from "./runnerSuiteSessionParams.js";
import { createStandaloneAppIntegrationOrchestrator } from "./StandaloneAppIntegrationOrchestrator.js";

// Same pageLabel as the runner entries: sessions must behave identically.
const pageLabel = "miroir-runner-tests.integ";

const miroirReportsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data",
  entityReport.uuid,
);

/** The Miroir Reports of the app's Miroir deployment, read from `miroir_data`. */
function readMiroirReports(): EntityInstance[] {
  return readdirSync(miroirReportsFolder)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => JSON.parse(readFileSync(join(miroirReportsFolder, fileName), "utf-8")));
}

export interface ReportTestEntry {
  miroirConfig: Awaited<ReturnType<typeof loadTestConfigFiles>>["miroirConfig"];
  miroirActivityTracker: MiroirActivityTracker;
  /** A new integration session for `suite`, as the runner entries create it. */
  createSession: (suiteKey: string, suite: MiroirTestSuite) => RunnerTestSessionInterface;
}

// ################################################################################################
/**
 * #330 setup of a vitest file running Report MiroirTests, in a DOM environment: starts the
 * registered loggers and the app, core and store startups, registers vitest's `expect` as the test
 * implementation, and registers the report test runner for the file (`beforeAll`, removed in
 * `afterAll`) on a sandbox element of the document. Call it at the top level of the file, after
 * registering the file's own loggers.
 */
export async function startReportTestEntry(): Promise<ReportTestEntry> {
  const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  await MiroirLoggerFactory.startRegisteredLoggers(
    miroirActivityTracker,
    miroirEventService,
    loglevelnext,
    logConfig as any as LoggerOptions,
  );

  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  // The sandbox element is never a render container, so RTL cleanup() does not detach it.
  const sandboxElement = document.createElement("div");
  sandboxElement.setAttribute("data-testid", "report-test-sandbox");
  document.body.appendChild(sandboxElement);

  let reportTestRunner: ReturnType<typeof createReportTestRunner> | undefined;
  vitest.beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    reportTestRunner = createReportTestRunner({
      sandboxElement,
      miroirActivityTracker,
      miroirEventService,
      miroirReports: readMiroirReports,
    });
    ConfigurationService.configurationService.registerReportTestRunner(reportTestRunner);
  });
  vitest.afterAll(() => {
    try {
      reportTestRunner?.close();
    } finally {
      ConfigurationService.configurationService.registerReportTestRunner(undefined);
      sandboxElement.remove();
    }
  });

  const applicationRunnerUuidIndex = loadApplicationRunnerUuidIndexFromFolders();
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  return {
    miroirConfig,
    miroirActivityTracker,
    createSession: (suiteKey, suite) =>
      orchestrator.createSession(
        createRunnerSuiteSessionParams(
          suiteKey,
          suite,
          { miroirConfig, miroirActivityTracker, miroirEventService },
          pageLabel,
          applicationRunnerUuidIndex,
        ),
      ),
  };
}
