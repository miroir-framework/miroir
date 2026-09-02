// @vitest-environment node
import "@testing-library/jest-dom";
import * as vitest from "vitest";
import { expect } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  getTestbedUuidsForTestSuite,
  miroirCoreStartup,
  parseMiroirRunnerTestCliConfig,
  runMiroirTests,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirTestSuite,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { env } from "process";
import { loglevelnext } from "../src/loglevelnextImporter.js";
import {
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
  UI_INTEGRATION_RUNNER_UUID_INDEX,
  buildUiIntegrationOrchestratorCreateSessionParams,
} from "../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
import { miroirAppStartup } from "../src/startup.js";
import {
  loadRunnerOrActionMiroirTestSuite,
  runMiroirRunnerTestsFromCLI,
} from "./helpers/runMiroirRunnerTestsFromCLI.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";

const pageLabel = "miroir-runner-tests.integ";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const config = parseMiroirRunnerTestCliConfig(process.env, process.argv.slice(2));
const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
const loggerOptions = logConfig as any as LoggerOptions;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
await MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
log.info("miroir-runner-tests.integ started", JSON.stringify(config, null, 2));
if (config.filter?.testList) {
  log.info(
    "miroir-runner-tests.integ filter active",
    JSON.stringify(config.filter.testList),
  );
}

function createSessionParamsForSuite(suiteKey: string, suite: MiroirTestSuite) {
  const registryEntry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey];
  if (!registryEntry) {
    throw new Error(`Unknown runner/action suite key: ${suiteKey}`);
  }
  const runTarget = getTestbedUuidsForTestSuite({ suite });
  return buildUiIntegrationOrchestratorCreateSessionParams(
    registryEntry,
    {
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
    },
    pageLabel,
    runTarget,
    suite.testParams,
    UI_INTEGRATION_RUNNER_UUID_INDEX,
  );
}

if (config.suiteKeys.length > 0) {
  const primarySuiteKey = config.suiteKeys[0];
  const primarySuite = loadRunnerOrActionMiroirTestSuite(primarySuiteKey);
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  const testSession = orchestrator.createSession(
    createSessionParamsForSuite(primarySuiteKey, primarySuite),
  );

  await runMiroirRunnerTestsFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    testSession,
  );
}
