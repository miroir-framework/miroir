import type {
  ApplicationSection,
  MiroirTestForReactComponent,
  MiroirTestForReport,
  MiroirTestLeaf,
  ReactComponentTestStep,
  TestAssertionResult,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirTestExecutionEnvironment } from "../../5_tests/MiroirTestTools";

/**
 * Any leaf reached by the MiroirTest walk: a `MiroirTestLeaf` of a plain `miroirTestSuite`, a
 * `reactComponentTest` leaf of a `reactComponentTestSuite`, or a `reportTest` leaf of a
 * `reportTestSuite`. The schema accepts those two leaf kinds only in their suite node (#294, #330),
 * so they are not `MiroirTestLeaf`s.
 */
export type MiroirTestAnyLeaf = MiroirTestLeaf | MiroirTestForReactComponent | MiroirTestForReport;

export type TestSuiteListFilter = string[] | { [x: string]: TestSuiteListFilter };

export type MiroirTestRunFilter = {
  testList?: TestSuiteListFilter;
  match?: RegExp;
};

/**
 * Render measurement of one component (formik paths folded) for one `measureRendering` mode
 * (#303 T5), as carried by `TestAssertionResult.assertionMeasurements`.
 */
export type ComponentRenderMeasurement = NonNullable<TestAssertionResult["assertionMeasurements"]>[number];

export type ReactComponentTestRunnerResult =
  | {
      status: "ok";
      /** Measurements of the leaf's `measureRendering` steps (#303), absent when it has none. */
      measurements?: ComponentRenderMeasurement[];
    }
  | { status: "error"; message: string; expected?: unknown; actual?: unknown };

/**
 * Context of a `reactComponentTestSuite` node, built by the MiroirTest walk and passed to the
 * runner with each of its leaves (#292, analysis T3).
 */
export type ReactComponentTestSuiteContext = {
  /** Path of the `reactComponentTestSuite` node (labels from the instance root). */
  suitePath: string[];
  /** Name of the component in the app's component registry. */
  component: string;
  /** Default props, shallow-merged under each leaf's `componentProps`. */
  componentProps: Record<string, any>;
  /** Labels of every leaf of the suite, in order (the runner releases its wrapper after the last). */
  caseLabels: string[];
  /**
   * Distinct step kinds used by the leaves of the suite, whatever the filter (#303): the runner
   * turns render tracking on for a suite containing a `measureRendering` step. Absent in contexts
   * built by hand (tests), read as "no step kind".
   */
  stepKinds?: ReactComponentTestStep["step"][];
  /** Set when the suite has `runOnDemand: true` (#303 T6): Run all skips its leaves. */
  runOnDemand?: true;
};

/**
 * Runs one `reactComponentTest` leaf. miroir-core cannot render React components, so the app
 * registers this runner through `ConfigurationService.registerReactComponentTestRunner` (#286).
 *
 * `suite` is the context of the leaf's `reactComponentTestSuite` node (#292). A leaf outside such a
 * node never reaches the runner (#292 M1).
 */
export type ReactComponentTestRunner = (params: {
  testNamePath: string[];
  leaf: MiroirTestForReactComponent;
  suite: ReactComponentTestSuiteContext;
}) => Promise<ReactComponentTestRunnerResult>;

/**
 * Context of a `reportTestSuite` node, built by the MiroirTest walk and passed to the report test
 * runner with each of its leaves (#330, analysis T2).
 */
export type ReportTestSuiteContext = {
  suiteKind: "reportTestSuite";
  /** Path of the `reportTestSuite` node (labels from the instance root). */
  suitePath: string[];
  /** The Report under test and where it is displayed. */
  report: {
    application: string;
    applicationSection: ApplicationSection;
    reportUuid: string;
    instanceUuid?: string;
  };
  /** How long an interaction step waits for the actions it started (T5); runner default when absent. */
  actionTimeoutMs?: number;
  /** Labels of every leaf of the suite, in order (the runner releases the suite after the last). */
  caseLabels: string[];
};

/** Context of the suite node holding a leaf, passed by the walk with the leaf (#292, #330). */
export type MiroirTestLeafSuiteContext = ReactComponentTestSuiteContext | ReportTestSuiteContext;

export function isReportTestSuiteContext(
  context: MiroirTestLeafSuiteContext | undefined,
): context is ReportTestSuiteContext {
  return (context as ReportTestSuiteContext | undefined)?.suiteKind === "reportTestSuite";
}

export type ReportTestRunnerResult =
  | { status: "ok" }
  | { status: "error"; message: string; expected?: unknown; actual?: unknown };

/**
 * Runs one `reportTest` leaf against the integration session of its run (#330). miroir-core cannot
 * render React components, so the app registers this runner through
 * `ConfigurationService.registerReportTestRunner`.
 */
export type ReportTestRunner = (params: {
  testNamePath: string[];
  leaf: MiroirTestForReport;
  suite: ReportTestSuiteContext;
  executionEnvironment: MiroirTestExecutionEnvironment;
}) => Promise<ReportTestRunnerResult>;
