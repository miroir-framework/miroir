import { afterAll } from "vitest";
import * as vitest from "vitest";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import {
  miroirTestsDisplayResults,
  runMiroirTests,
  type MiroirTestRunFilter,
} from "../../src/5_tests/MiroirTestTools";

export type RunDeployedMiroirTestSuiteLoaderOptions = {
  filter?: MiroirTestRunFilter;
  /** When false, ignore RUN_TEST (file-pattern loaders). Default true. */
  honorRunTest?: boolean;
};

/**
 * Vitest entry loader for a single MiroirTest deployment export (replaces runDeployedUnitTestSuite).
 * Honors RUN_TEST filter; always wires MiroirEventService for nested suite tracking.
 */
export async function runDeployedMiroirTestSuiteLoader(
  suiteExport: MiroirTestSuite,
  testSuiteName: string,
  options: RunDeployedMiroirTestSuiteLoaderOptions = {},
): Promise<void> {
  const { filter, honorRunTest = true } = options;
  const RUN_TEST = process.env.RUN_TEST;
  const shouldSkip = honorRunTest && RUN_TEST !== undefined && RUN_TEST !== testSuiteName;

  const miroirActivityTracker = new MiroirActivityTracker();
  new MiroirEventService(miroirActivityTracker);
  const miroirTestSuite = suiteExport as MiroirTestSuite;
  // const miroirTestSuite = suiteExport.definition as MiroirTestSuite;

  afterAll(() => {
    if (!shouldSkip) {
      miroirTestsDisplayResults(
        miroirTestSuite,
        RUN_TEST ?? testSuiteName,
        miroirTestSuite.miroirTestLabel ?? testSuiteName,
        miroirActivityTracker,
      );
    }
  });

  if (shouldSkip) {
    vitest.test.skip(
      `${testSuiteName} skipped (set RUN_TEST=${testSuiteName} to run)`,
      () => {},
    );
    return;
  }

  await runMiroirTests._runMiroirTestSuite(
    vitest,
    [],
    miroirTestSuite,
    filter,
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runMiroirTests,
    { executionMode: "unit" },
  );
}
