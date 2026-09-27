// #318 shared runner entry (opt-in: `testMiroir ... --shared`, used by run-nonreg.py --runner shared).
// Same setup as miroir-runner-tests.integ.test.ts (the legacy default entry), but each suite
// runs in its own describe with its own session, so several suites share one vitest launch.
// @vitest-environment node
import "@testing-library/jest-dom";
import * as vitest from "vitest";
import { expect } from "vitest";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
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
  listCliRunnerIntegrationSuiteKeysFromFolders,
  resolveCliSuiteKeysFromCatalog,
  loadApplicationRunnerUuidIndexFromFolders,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { miroirAppStartup } from "../src/startup.js";
import { runMiroirRunnerSuitesSharedFromCLI } from "./helpers/runMiroirRunnerSuitesSharedFromCLI.js";
import { createRunnerSuiteSessionParams } from "./helpers/runnerSuiteSessionParams.js";
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";
import { loadTestConfigFiles } from "./utils/fileTools.js";

const applicationRunnerUuidIndex = loadApplicationRunnerUuidIndexFromFolders();

// Same pageLabel as the legacy entry: sessions must behave identically.
const pageLabel = "miroir-runner-tests.integ";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("tests", "5-tests", pageLabel);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const runnerSuiteKeys = listCliRunnerIntegrationSuiteKeysFromFolders();
const parsedConfig = parseMiroirRunnerTestCliConfig(
  process.env,
  process.argv.slice(2),
  runnerSuiteKeys,
);
const config = {
  ...parsedConfig,
  suiteKeys: resolveCliSuiteKeysFromCatalog(
    parsedConfig.suiteKeys,
    runnerSuiteKeys,
    undefined,
    parsedConfig.tags,
  ),
};
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
log.info("miroir-runner-tests-shared.integ started", JSON.stringify(config, null, 2));
if (config.filter?.testList) {
  log.info(
    "miroir-runner-tests-shared.integ filter active",
    JSON.stringify(config.filter.testList),
  );
}

function createSessionParamsForSuite(suiteKey: string, suite: MiroirTestSuite) {
  return createRunnerSuiteSessionParams(
    suiteKey,
    suite,
    {
      miroirConfig,
      miroirActivityTracker,
      miroirEventService,
    },
    pageLabel,
    applicationRunnerUuidIndex,
  );
}

if (config.suiteKeys.length > 0) {
  const orchestrator = createStandaloneAppIntegrationOrchestrator();
  await runMiroirRunnerSuitesSharedFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    (suiteKey, suite) => orchestrator.createSession(createSessionParamsForSuite(suiteKey, suite)),
  );
}
