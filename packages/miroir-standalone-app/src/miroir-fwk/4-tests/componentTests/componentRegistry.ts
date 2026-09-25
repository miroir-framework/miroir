import type React from "react";

import { getJzodElementEditorForTest } from "./componentTestTools.js";

// ################################################################################################
// Component registry of the declarative component tests (#292, analysis T13): the `component`
// name of a `reactComponentTestSuite` MiroirTest node to the React component it renders.
// ################################################################################################

export type ComponentRegistry = Record<string, React.FC<any>>;

export const componentRegistry: ComponentRegistry = {
  // Same page label as the former TypeScript suites, so that the rendered DOM is the same.
  JzodElementEditor: getJzodElementEditorForTest("JzodElementEditor.test"),
};
