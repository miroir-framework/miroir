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
import {
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
} from "miroir-test-app_deployment-miroir";
import { env } from "process";
import { loglevelnext } from "../src/loglevelnextImporter.js";
import { UI_INTEGRATION_RUNNER_SUITE_REGISTRY } from "../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
import { miroirAppStartup } from "../src/startup.js";
import {
  domainControllerIntegTestNames
} from "./helpers/libraryPlayfieldSeeds.js";
import {
  loadRunnerOrActionMiroirTestSuite,
  runMiroirRunnerTestsFromCLI,
} from "./helpers/runMiroirRunnerTestsFromCLI.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";

const pageLabel = "miroir-runner-tests.integ";

function isMiroirEntityRunnerSuite(suiteKey: string): boolean {
  return (
    suiteKey === miroirTest_runner_create_entity.name || suiteKey === miroirTest_runner_drop_entity.name
  );
}

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

function sessionParamsForSuite(suiteKey: string, suite: MiroirTestSuite) {
  const registryEntry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey];
  const runTarget = getTestbedUuidsForTestSuite({
    suite,
    defaultApplicationName: isMiroirEntityRunnerSuite(suiteKey)
      ? "testApplication_CreateEntity"
      : "Library",
  });
  if (domainControllerIntegTestNames.includes(suiteKey)) {
    const playfieldSeed = registryEntry?.libraryPlayfieldSeed;
    if (!playfieldSeed) {
      throw new Error(`Playfield seed not found for suite key: ${suiteKey}`);
    }
    return {
      resolvedRunner: registryEntry.resolvedRunner,
      sessionSpecificOptions: {
        pageLabel,
        runTarget,
        suiteTestParams: suite.testParams,
        libraryPlayfieldSeed: playfieldSeed,
      },
    };
  }
  if (suiteKey === miroirTest_runner_freeze_application_version.name) {
    return {
      resolvedRunner: registryEntry.resolvedRunner,
      sessionSpecificOptions: {
        pageLabel,
        runTarget,
        suiteTestParams: suite.testParams,
        libraryPlayfieldSeed: registryEntry?.libraryPlayfieldSeed,
      },
    };
  }
  if (isMiroirEntityRunnerSuite(suiteKey)) {
    return {
      resolvedRunner: registryEntry.resolvedRunner,
      sessionSpecificOptions: {
        pageLabel,
        runTarget,
        suiteTestParams: suite.testParams,
        skipRunTargetPlayfieldReset: true,
      },
    };
  }
  return {
    resolvedRunner: registryEntry.resolvedRunner,
    sessionSpecificOptions: {
      pageLabel,
      runTarget,
      suiteTestParams: suite.testParams,
    },
  };
}

if (config.suiteKeys.length > 0) {
  const primarySuiteKey = config.suiteKeys[0];
  const primarySuite = loadRunnerOrActionMiroirTestSuite(primarySuiteKey);
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  const sessionParams = sessionParamsForSuite(primarySuiteKey, primarySuite);
  const testSession = orchestrator.createSession({
    kind: "runner",
    context: {
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
    },
    resolvedRunner: sessionParams.resolvedRunner!,
    sessionSpecificOptions: sessionParams.sessionSpecificOptions,
  });

  await runMiroirRunnerTestsFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    testSession,
    (suiteKey) => UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey]?.resolvedRunner,
  );
}
