import type { ComponentTestEnvironment, ComponentTestSuite } from "../componentTestEnvironment.js";
import {
  formikFieldName,
  getJzodElementEditorForTest,
  type JzodElementEditorProps_Test,
} from "../componentTestTools.js";

// ################################################################################################
// JzodArrayEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodArrayEditorTests) with the analysis §5.3 rewrite rules.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

const arrayValues = ["value1", "value2", "value3"];

export const jzodArrayEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  suiteProps: {
    label: "Test Label",
    name: "testField",
    listKey: "ROOT.testField",
    rootLessListKey: "testField",
    rootLessListKeyArray: ["testField"],
    rawJzodSchema: {
      type: "array",
      definition: { type: "string" },
    },
    initialFormState: arrayValues,
  },
  cases: {
    "renders all array values, in the right order": {
      tests: async (env: ComponentTestEnvironment) => {
        const cells = env.view
          .getAllByRole("textbox")
          .filter((input: HTMLElement) =>
            (input as HTMLInputElement).name.startsWith(formikFieldName("testField.")),
          );
        const values = cells.map((cell) => (cell as HTMLInputElement).value);
        env.expect(values).toEqual(arrayValues);
      },
    },
  },
};
