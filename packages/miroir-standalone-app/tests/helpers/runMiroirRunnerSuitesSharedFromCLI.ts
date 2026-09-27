import {
  MiroirActivityTracker,
  MiroirLoggerFactory,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  type MiroirTestCliConfig,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace,
  resolveSuiteTestbedReset,
  withTestbedResetPolicy,
} from "miroir-core";

import { loadRunnerOrActionMiroirTestSuite } from "./runMiroirRunnerTestsFromCLI.js";
import { timedTestPhase } from "./testTimingPhase.js";
import { onFailedRunExport } from "./writeFailedRunExport.js";

/**
 * An execution environment whose fields are read from `holder.value` at access time. Tests are
 * registered while collecting, before the suite's session exists; its `beforeAll` fills the
 * holder, and test bodies only read the environment when they run.
 */
function lateBoundExecutionEnvironment(holder: {
  value?: MiroirTestExecutionEnvironment;
}): MiroirTestExecutionEnvironment {
  const current = (): Record<PropertyKey, unknown> => {
    if (!holder.value) {
      throw new Error("shared runner: suite session not initialised (beforeAll did not run)");
    }
    return holder.value as unknown as Record<PropertyKey, unknown>;
  };
  return new Proxy({} as MiroirTestExecutionEnvironment, {
    get: (_target, key) => current()[key],
    has: (_target, key) => key in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Object.getOwnPropertyDescriptor(current(), key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

function withSuiteTestParams(
  environment: MiroirTestExecutionEnvironment,
  suite: MiroirTestSuite,
): MiroirTestExecutionEnvironment {
  const runnerTestContext = environment.runnerTestContext;
  if (!runnerTestContext || !suite.testParams) {
    return environment;
  }
  return {
    ...environment,
    runnerTestContext: {
      ...runnerTestContext,
      testParams: { ...runnerTestContext.testParams, ...suite.testParams },
    },
  };
}

// ################################################################################################
/**
 * #318 shared runner: several runner/action suites in one vitest launch. Unlike
 * runMiroirRunnerTestsFromCLI (legacy, one session built from the first suite), each suite
 * gets its own `describe` and its own session: init in `beforeAll`, the usual per-leaf
 * `beforeEach`, teardown in `afterAll`. Sessions never overlap.
 */
export async function runMiroirRunnerSuitesSharedFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  createSession: (suiteKey: string, suite: MiroirTestSuite) => RunnerTestSessionInterface,
): Promise<void> {
  for (const suiteKey of config.suiteKeys) {
    const suite = loadRunnerOrActionMiroirTestSuite(suiteKey);
    const holder: { value?: MiroirTestExecutionEnvironment } = {};
    const executionOptions: MiroirTestExecutionOptions = {
      executionMode: "integration",
      executionEnvironment: lateBoundExecutionEnvironment(holder),
      onFailedRunExport,
    };

    vitest.describe(suiteKey, async () => {
      let session: RunnerTestSessionInterface | undefined;

      vitest.beforeAll(async () => {
        session = createSession(suiteKey, suite);
        const environment = await timedTestPhase(`session.init ${suiteKey}`, () =>
          session!.initSession(),
        );
        holder.value = withSuiteTestParams(environment, suite);
      });

      // #318: a suite marked `testbedReset: "perSuite"` resets once, before its first test.
      const resetTestbed = withTestbedResetPolicy(resolveSuiteTestbedReset(suite), () =>
        session!.beforeEach(),
      );
      vitest.beforeEach(async () => {
        await resetTestbed();
      });

      vitest.afterAll(async () => {
        await session?.teardown();
        holder.value = undefined;
        await displayMiroirTestResults(suite, suiteKey, suiteKey, miroirActivityTracker);
        // A legacy launch starts every suite with an empty event log. Events accumulate for the
        // whole process, and each tracked test sorts all of them (failed-run export), so a
        // shared launch clears them between suites to stay linear.
        MiroirLoggerFactory.getStartedEventService()?.clear();
      });

      await runMiroirTests._runMiroirTestSuite(
        vitest,
        [suiteKey],
        suite,
        config.filter,
        defaultMetaModelEnvironment,
        miroirActivityTracker,
        undefined,
        true,
        runMiroirTests,
        executionOptions,
      );
    });
  }
}
