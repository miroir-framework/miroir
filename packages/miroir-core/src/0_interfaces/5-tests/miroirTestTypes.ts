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
 * Runs one `reactComponentTest` leaf. miroir-core cannot render React components, so the app
 * registers this runner through `ConfigurationService.registerReactComponentTestRunner` (#286).
 */
export type ReactComponentTestRunner = (params: {
  componentTestRef: ReactComponentTestRef;
  testNamePath: string[];
}) => Promise<ReactComponentTestRunnerResult>;
