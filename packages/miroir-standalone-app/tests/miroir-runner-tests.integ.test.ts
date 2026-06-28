import "@testing-library/jest-dom";
import * as vitest from "vitest";
import { expect } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  miroirCoreStartup,
  runMiroirTests,
  resolveRunnerTestRunTarget,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirTestSuite,
  parseMiroirRunnerTestCliConfig,
} from "miroir-core";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { env } from "process";
import { loglevelnext } from "../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../src/startup.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";
import { runMiroirRunnerTestsFromCLI } from "./helpers/runMiroirRunnerTestsFromCLI.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";

const pageLabel = "miroir-runner-tests.integ";

let log: LoggerInterface = console as unknown as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel),
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const config = parseMiroirRunnerTestCliConfig(process.env, process.argv.slice(2));
const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
const loggerOptions = logConfig as LoggerOptions;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
log.info("miroir-runner-tests.integ started", JSON.stringify(config, null, 2));
if (config.filter?.testList) {
  log.info(
    "miroir-runner-tests.integ filter active",
    JSON.stringify(config.filter.testList),
  );
}

if (config.suiteKeys.length > 0) {
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  const runnerLibrarySuite = miroirTest_runner_library.definition as MiroirTestSuite;
  const runTarget = resolveRunnerTestRunTarget({ suite: runnerLibrarySuite });
  const testSession = orchestrator.createSession("runner", {
    miroirConfig,
    miroirActivityTracker,
    miroirEventService,
  }, {
    pageLabel,
    runTarget,
    suiteTestParams: runnerLibrarySuite.testParams,
  });

  await runMiroirRunnerTestsFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
