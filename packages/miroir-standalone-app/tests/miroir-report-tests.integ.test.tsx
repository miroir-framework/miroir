// #330 Report MiroirTests entry: the suites whose leaves mount a Report (`reportTestSuite`).
// Same sessions as miroir-runner-tests-shared.integ.test.ts (one session per suite, in its own
// describe), in the default DOM environment instead of `node`: the report test runner renders the
// Report. `testMiroir` routes here when every selected suite is a Report suite.
import "@testing-library/jest-dom";
import * as vitest from "vitest";

import {
  MiroirLoggerFactory,
  parseMiroirRunnerTestCliConfig,
  runMiroirTests,
  type LoggerInterface,
} from "miroir-core";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  resolveCliSuiteKeysFromCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { startReportTestEntry } from "./helpers/reportTestEntry.js";
import { runMiroirRunnerSuitesSharedFromCLI } from "./helpers/runMiroirRunnerSuitesSharedFromCLI.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("tests", "5-tests", "miroir-report-tests.integ.test");
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

const { miroirActivityTracker, createSession } = await startReportTestEntry();
log.info("miroir-report-tests.integ started", JSON.stringify(config, null, 2));

if (config.suiteKeys.length > 0) {
  await runMiroirRunnerSuitesSharedFromCLI(
    runMiroirTests,
    vitest,
    config,
    miroirActivityTracker,
    createSession,
  );
}
