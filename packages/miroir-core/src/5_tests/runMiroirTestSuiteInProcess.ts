import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type {
  MiroirTestExecutionOptions,
  RunMiroirTests,
  VitestNamespace,
} from "./MiroirTestTools.js";
import { runMiroirTestSuiteWalk } from "./miroirTestSuiteWalk.js";

export type InProcessExpectFn = VitestNamespace["expect"];

/** Minimal vitest surface for in-browser / in-process MiroirTest runs (expect only). */
export function createInProcessVitestStub(expectFn: InProcessExpectFn): VitestNamespace {
  return { expect: expectFn } as VitestNamespace;
}

export type RunMiroirTestSuiteInProcessParams = {
  runMiroirTests: RunMiroirTests;
  expect: InProcessExpectFn;
  testSuitePath: string[];
  miroirTestSuite: MiroirTestSuite;
  filter: MiroirTestRunFilter | undefined;
  modelEnvironment: MiroirModelEnvironment;
  miroirActivityTracker: MiroirActivityTrackerInterface;
  executionOptions?: MiroirTestExecutionOptions;
  /** Default true — matches CLI integ path activity tracking. */
  trackActionsBelow?: boolean;
  parentTrackingId?: string;
  parentSkip?: boolean;
  /** Invoked before each non-skipped leaf (runner integ playfield reset). */
  beforeEachLeaf?: () => Promise<void>;
};

export async function runMiroirTestSuiteInProcess(
  params: RunMiroirTestSuiteInProcessParams,
): Promise<void> {
  const localVitest = createInProcessVitestStub(params.expect);

  await runMiroirTestSuiteWalk({
    localVitest,
    testSuitePath: params.testSuitePath,
    miroirTestSuite: params.miroirTestSuite,
    filter: params.filter,
    modelEnvironment: params.modelEnvironment,
    miroirActivityTracker: params.miroirActivityTracker,
    parentTrackingId: params.parentTrackingId,
    trackActionsBelow: params.trackActionsBelow ?? true,
    runMiroirTests: params.runMiroirTests,
    executionOptions: params.executionOptions,
    parentSkip: params.parentSkip,
    inProcess: true,
    beforeEachLeaf: params.beforeEachLeaf,
  });
}
