import type React from "react";

import { getMlElementEditorForTest } from "./componentTestTools.js";
import { SequenceEditorForTest } from "./sequenceEditorForTest.js";
import { TransformerBlocksForTest } from "./transformerBlocksForTest.js";
import { TransformerEditorForTest } from "./transformerEditorForTest.js";

// ################################################################################################
// Component registry of the declarative component tests (#292, analysis T13): the `component`
// name of a `reactComponentTestSuite` MiroirTest node to the React component it renders.
//
// An entry is the component, or the component with the `fieldNamePrefix` of its form fields
// (#406): the `field` / `fieldName` of the steps are relative to it. The default prefix is
// `TESTSECTION.`, the form root of `getMlElementEditorForTest`.
// ################################################################################################

export interface ComponentRegistration {
  component: React.FC<any>;
  fieldNamePrefix?: string;
}

export type ComponentRegistry = Record<string, React.FC<any> | ComponentRegistration>;

export function componentRegistration(entry: React.FC<any> | ComponentRegistration): ComponentRegistration {
  return typeof entry === "function" ? { component: entry } : entry;
}

export const componentRegistry: ComponentRegistry = {
  // Same page label as the former TypeScript suites, so that the rendered DOM is the same.
  MlElementEditor: getMlElementEditorForTest("MlElementEditor.test"),
  // its Formik form has no section root: fields are named from the form values root
  TransformerEditor: { component: TransformerEditorForTest, fieldNamePrefix: "" },
  // #498: the block view of a stored TransformerDefinition's body, without a form; #504: or of a Runner's sequence
  TransformerBlocks: TransformerBlocksForTest,
  // #505: its Formik form has no section root either
  SequenceEditor: { component: SequenceEditorForTest, fieldNamePrefix: "" },
};
