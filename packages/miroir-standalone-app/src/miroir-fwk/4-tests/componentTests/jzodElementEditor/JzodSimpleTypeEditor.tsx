import {
  waitAfterUserInteraction,
  type ComponentTestEnvironment,
  type ComponentTestSuite,
} from "../componentTestEnvironment.js";
import {
  extractValuesFromRenderedElements,
  formikFieldName,
  formValuesToJSON,
  getJzodElementEditorForTest,
  testSectionName,
  type JzodElementEditorProps_Test,
} from "../componentTestTools.js";

// ################################################################################################
// JzodSimpleTypeEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodSimpleTypeEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container` (the root of every
// `extractValuesFromRenderedElements` call), React `act` the act-free `env.act`, `fireEvent`
// `env.fireEvent`, `waitAfterUserInteraction()` its act-free equivalent on `env.container`, and
// the `screen.debug` call is deleted.
// The old suite had no suite props: every case gives its own props, kept here as they were.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

/** Props shared by every case of the old suite: label, name, and list keys of `testField`. */
const testFieldProps = {
  label: "Test Label",
  name: "testField",
  listKey: "ROOT.testField",
  rootLessListKey: "testField",
  rootLessListKeyArray: ["testField"],
};

/** The textbox named `TESTSECTION.testField`. */
function testFieldTextBox(env: ComponentTestEnvironment): HTMLInputElement {
  return env.view
    .getAllByRole("textbox")
    .filter(
      (el: HTMLElement) => (el as HTMLInputElement).name === formikFieldName("testField"),
    )[0] as HTMLInputElement;
}

/** The input with id `testField` displaying 42. */
function numberInput42(env: ComponentTestEnvironment): HTMLInputElement {
  return env.view
    .getAllByDisplayValue(42)
    .filter((el: HTMLElement) => (el as HTMLInputElement).id === "testField")[0] as HTMLInputElement;
}

/** The form values under `testField`, as JSON in the test section. */
function testFieldValues(env: ComponentTestEnvironment, step: string): any {
  const values: Record<string, any> = extractValuesFromRenderedElements(
    env.expect,
    undefined,
    env.container,
    formikFieldName("testField"),
    step,
  );
  return formValuesToJSON(values, testSectionName);
}

export const jzodSimpleTypeEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  // Not used by any case (each case gives its props), required by ComponentTestSuite.
  suiteProps: {
    ...testFieldProps,
    rawJzodSchema: { type: "string" },
    initialFormState: "placeholder text",
  },
  cases: {
    "string renders input with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "string",
        },
        initialFormState: "placeholder text",
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("placeholder text");
      },
    },
    "string allows to modify input value with consistent update": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "string",
        },
        initialFormState: "placeholder text",
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("placeholder text");
        await env.act(() => {
          env.fireEvent.change(input, { target: { value: "new text" } });
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue("new text");
      },
    },
    "string allows to modify input value with consistent update then submit form": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "string",
        },
        initialFormState: "placeholder text",
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("placeholder text");
        await env.act(() => {
          env.fireEvent.change(input, { target: { value: "new text" } });
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue("new text");
        // Simulate form submission
        const submit = env.view.getByRole("form");
        await env.act(() => {
          env.fireEvent.submit(submit);
        });
      },
    },
    "number renders input with proper value": {
      // TODO: test for nullable / optional scenario
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "number",
        },
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = numberInput42(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue(42);
      },
    },
    "number allows to modify input value with consistent update": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "number",
        },
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = numberInput42(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue(42);
        await env.act(() => {
          env.fireEvent.change(input, { target: { value: 100 } });
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue(100);
      },
    },
    "uuid renders input with proper value": {
      // TODO: test for nullable / optional scenario
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "uuid",
        },
        initialFormState: "c8e2cc98-b0ec-426a-8be0-2d526039f85a",
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("c8e2cc98-b0ec-426a-8be0-2d526039f85a");
      },
    },
    "uuid allows to modify input value with consistent update": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "uuid",
        },
        initialFormState: "c8e2cc98-b0ec-426a-8be0-2d526039f85a",
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("c8e2cc98-b0ec-426a-8be0-2d526039f85a");
        await env.act(() => {
          env.fireEvent.change(input, {
            target: { value: "3c659c65-35f4-40e5-acf3-28115f35affa" },
          });
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue("3c659c65-35f4-40e5-acf3-28115f35affa");
      },
    },
    "boolean renders checkbox with proper value true": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "boolean",
        },
        initialFormState: true,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const testResult = testFieldValues(env, "initial");
        env.expect(testResult).toEqual({
          testField: true,
        });
      },
    },
    "boolean renders checkbox with proper value false": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "boolean",
        },
        initialFormState: false,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const testResult = testFieldValues(env, "initial");
        env.expect(testResult).toEqual({
          testField: false,
        });
      },
    },
    "boolean allows to modify checkbox value with consistent update": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "boolean",
        },
        initialFormState: true,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const checkbox = env.view
          .getAllByRole("checkbox")
          .filter(
            (el: HTMLElement) => (el as HTMLInputElement).name === formikFieldName("testField"),
          )[0] as HTMLInputElement;
        env.expect(checkbox).toBeInTheDocument();
        env.expect(checkbox).toBeChecked();
        await env.act(() => {
          env.fireEvent.click(checkbox);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(checkbox).not.toBeChecked();
        const testResult = testFieldValues(env, "after change");
        env.expect(testResult).toEqual({
          testField: false,
        });
      },
    },
    "bigint renders input with proper bigint value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "bigint",
        },
        initialFormState: BigInt("12345678901234567890"),
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("12345678901234567890");
      },
    },
    "bigint allows to modify input value with consistent update": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "bigint",
        },
        initialFormState: 12345678901234567890n,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = testFieldTextBox(env);
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("12345678901234567890");
        await env.act(() => {
          env.fireEvent.change(input, { target: { value: 98765432109876543210n } });
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue("98765432109876543210");
      },
    },
  },
};
