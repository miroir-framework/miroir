/**
 * #487: the batches of MiroirTests that Run all and the self-test run, outside any React component.
 * Results are kept per suite as `TestResultData[]`, the shape the result display reads.
 */
import {
  defaultMetaModelEnvironment,
  MiroirLoggerFactory,
  runMiroirTests,
  TestFramework,
  type LoggerInterface,
  type MiroirActivityTrackerInterface,
  type MiroirTestDefinition,
} from "miroir-core";

import { packageName } from "../../constants.js";
import { generateTestReport, type TestResultData } from "../4_view/components/Buttons/testResultReport.js";
import { getMiroirTestSuiteKey, sortMiroirTestInstances } from "../4_view/components/Reports/miroirTestSuiteKey.js";
import { cleanLevel } from "../4_view/constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "miroirTestBatch");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestSuiteResultsMap = Record<string, TestResultData[]>;

/**
 * Runs `miroirTests` in unit mode, one suite after the other, in suite order. With
 * `includeComponentTests` false, `reactComponentTest` leaves are recorded as skipped; with it true,
 * the leaves of `runOnDemand` suites are (#303), and the caller prepares the component test sandbox.
 */
export async function runUnitMiroirTestBatch(params: {
  miroirTests: MiroirTestDefinition[];
  tracker: MiroirActivityTrackerInterface;
  includeComponentTests: boolean;
  onSuiteDone?: (suiteKey: string, results: TestResultData[]) => void;
}): Promise<MiroirTestSuiteResultsMap> {
  const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};
  for (const instance of sortMiroirTestInstances(params.miroirTests)) {
    const suiteKey = getMiroirTestSuiteKey(instance);
    params.tracker.resetResults();

    await runMiroirTests._runMiroirTestSuite(
      TestFramework as any,
      [],
      instance.definition,
      undefined,
      defaultMetaModelEnvironment,
      params.tracker,
      undefined,
      true,
      runMiroirTests,
      params.includeComponentTests
        ? { executionMode: "unit", skipRunOnDemandSuites: true }
        : { executionMode: "unit", excludeMiroirTestTypes: ["reactComponentTest"] },
    );

    resultsBySuiteKey[suiteKey] = generateTestReport(suiteKey, params.tracker.getTestAssertionsResults([]), () => {});
    log.info(`MiroirTest results for ${suiteKey}:`, resultsBySuiteKey[suiteKey]);
    params.onSuiteDone?.(suiteKey, resultsBySuiteKey[suiteKey]);
  }
  return resultsBySuiteKey;
}
