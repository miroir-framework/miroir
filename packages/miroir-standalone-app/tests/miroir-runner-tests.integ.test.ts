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
import { RUNNER_LIBRARY_RUNNER_REGISTRY } from "miroir-test-app_deployment-library";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { env } from "process";
import { loglevelnext } from "../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../src/startup.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";
import {
  loadRunnerOrActionMiroirTestSuite,
  runMiroirRunnerTestsFromCLI,
} from "./helpers/runMiroirRunnerTestsFromCLI.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";
import {
  domainControllerDataCrudLibraryPlayfieldSeed,
  isDomainControllerDataCrudSuite,
} from "./helpers/libraryPlayfieldSeeds.js";

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

function sessionOptionsForSuite(suiteKey: string, suite: MiroirTestSuite) {
  const runTarget = resolveRunnerTestRunTarget({ suite });
  if (isDomainControllerDataCrudSuite(suiteKey)) {
    return {
      pageLabel,
      runTarget,
      suiteTestParams: suite.testParams,
      runnerRegistry: {},
      libraryPlayfieldSeed: domainControllerDataCrudLibraryPlayfieldSeed,
    };
  }
  return {
    pageLabel,
    runTarget,
    suiteTestParams: suite.testParams,
    runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
  };
}

if (config.suiteKeys.length > 0) {
  const primarySuiteKey = config.suiteKeys[0];
  const primarySuite = loadRunnerOrActionMiroirTestSuite(primarySuiteKey);
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  const testSession = orchestrator.createSession(
    "runner",
    {
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
    },
    sessionOptionsForSuite(primarySuiteKey, primarySuite),
  );

  await runMiroirRunnerTestsFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
