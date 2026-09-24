import type { JzodElement } from "miroir-core";

import {
  waitAfterUserInteraction,
  type ComponentTestEnvironment,
  type ComponentTestSuite,
} from "../componentTestEnvironment.js";
import { getJzodElementEditorForTest, type JzodElementEditorProps_Test } from "../componentTestTools.js";

// ################################################################################################
// JzodLiteralEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodLiteralEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, React `act` the act-free `env.act`, `fireEvent` `env.fireEvent`,
// `waitAfterUserInteraction()` its act-free equivalent on `env.container`, and the `console.log`
// call became `env.log.info`.
// The old cases set `rawJzodSchema` through `jzodElementEditorProps`, a function of the case props
// (or of the suite props when the case has none). Here each case's `props` gives the same result.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

const literalSchema: JzodElement = {
  type: "literal",
  definition: "test-value",
};

function withLiteralSchema(props: JzodElementEditorProps_Test): JzodElementEditorProps_Test {
  return {
    ...props,
    rawJzodSchema: literalSchema,
  } as JzodElementEditorProps_Test;
}

export const jzodLiteralEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  suiteProps: {
    name: "testField",
    listKey: "root.testField",
    rootLessListKey: "testField",
    rootLessListKeyArray: ["testField"],
    initialFormState: "test-value",
    label: "Test Label",
  } as JzodElementEditorProps_Test,
  cases: {
    "renders Literal input with label when label prop is provided": {
      props: withLiteralSchema,
      tests: async (env: ComponentTestEnvironment) => {
        // There should be only one label, actually there are two, one for the literal and one for the input
        env.expect(env.view.getAllByText(/Test Label/).length).toBe(1);
        env.expect(env.view.getByRole("textbox")).toBeInTheDocument();
      },
    },
    "renders Literal input without label when label prop is not provided": {
      props: withLiteralSchema({
        name: "testField",
        listKey: "root.testField",
        rootLessListKey: "testField",
        rootLessListKeyArray: ["testField"],
        initialFormState: "test-value",
        // label: "Test Label", // no label
      } as JzodElementEditorProps_Test),
      tests: async (env: ComponentTestEnvironment) => {
        env.expect(env.view.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
        env.expect(env.view.getByRole("textbox")).toBeInTheDocument();
      },
    },
    "setting new value": {
      props: withLiteralSchema,
      tests: async (env: ComponentTestEnvironment) => {
        env.expect(env.view.getByDisplayValue("test-value")).toBeInTheDocument();
        const input = env.view.getByDisplayValue("test-value");
        await env.act(() => {
          env.log.info("##################### ACTION");
          // Testing Library does not refuse to edit a disabled textbox, so the change is simulated.
          env.fireEvent.change(input, { target: { value: "new value" } });
        });
        await waitAfterUserInteraction(env.container);
        // value has not changed, because it is a literal
        env.expect(env.view.getByDisplayValue(/test-value/)).toBeInTheDocument();
      },
    },
  },
};
