import type { MiroirTestForReactComponent } from "../1_core/preprocessor-generated/miroirFundamentalType";

export type TestSuiteListFilter = string[] | { [x: string]: TestSuiteListFilter };

export type MiroirTestRunFilter = {
  testList?: TestSuiteListFilter;
  match?: RegExp;
};

/** `componentTestRef` of a `reactComponentTest` leaf: a registered TypeScript test body (#286). */
export type ReactComponentTestRef = { suite: string; case: string };

export type ReactComponentTestRunnerResult =
  | { status: "ok" }
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
};

/**
 * Runs one `reactComponentTest` leaf. miroir-core cannot render React components, so the app
 * registers this runner through `ConfigurationService.registerReactComponentTestRunner` (#286).
 *
 * `suite` is set for a leaf of a `reactComponentTestSuite` node (#292), and absent for a legacy
 * `componentTestRef` leaf under a plain `miroirTestSuite`.
 */
export type ReactComponentTestRunner = (params: {
  testNamePath: string[];
  leaf: MiroirTestForReactComponent;
  suite?: ReactComponentTestSuiteContext;
}) => Promise<ReactComponentTestRunnerResult>;
