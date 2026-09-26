import type {
  MiroirTestForReactComponent,
  MiroirTestLeaf,
  ReactComponentTestStep,
  TestAssertionResult,
} from "../1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Any leaf reached by the MiroirTest walk: a `MiroirTestLeaf` of a plain `miroirTestSuite`, or a
 * `reactComponentTest` leaf of a `reactComponentTestSuite`. The schema accepts a
 * `reactComponentTest` leaf only in a `reactComponentTestSuite` (#294), so it is not a
 * `MiroirTestLeaf`.
 */
export type MiroirTestAnyLeaf = MiroirTestLeaf | MiroirTestForReactComponent;

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
