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
  type JzodElementEditorProps_Test,
} from "../componentTestTools.js";

// ################################################################################################
// JzodObjectEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodObjectEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container` (the root of every
// `extractValuesFromRenderedElements` call), React `act` the act-free `env.act`, `fireEvent`
// `env.fireEvent`, `waitAfterUserInteraction()` its act-free equivalent on `env.container`, and
// the `screen.debug` calls are deleted.
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

/** The record schema of the `record …` cases. */
const recordOfObjectSchema: JzodElementEditorProps_Test["rawJzodSchema"] = {
  type: "record",
  definition: {
    type: "object",
    definition: { a: { type: "string" }, b: { type: "number" } },
  },
};

/** The form values under `testField`, as JSON. */
function testFieldValues(env: ComponentTestEnvironment, step: string): Record<string, any> {
  return extractValuesFromRenderedElements(
    env.expect,
    undefined,
    env.container,
    formikFieldName("testField"),
    step,
  );
}

export const jzodObjectEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  // Not used by any case (each case gives its props), required by ComponentTestSuite.
  suiteProps: {
    ...testFieldProps,
    rawJzodSchema: {
      type: "object",
      definition: { a: { type: "string" }, b: { type: "number" } },
    },
    initialFormState: {
      a: "test string",
      b: 42,
    },
  },
  cases: {
    "object renders as json-like input fields with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "object",
          definition: { a: { type: "string" }, b: { type: "number" } },
        },
        initialFormState: {
          a: "test string",
          b: 42,
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values = testFieldValues(env, "after delete button click");
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({ a: "test string", b: 42 });
      },
    },
    "object with bigint attribute renders as json-like input fields with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "object",
          definition: { e: { type: "bigint" } },
        },
        initialFormState: {
          e: 123n,
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values = testFieldValues(env, "initial");
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({ e: "123" });
      },
    },
    "object can be updated through displayed input fields": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "object",
          definition: { a: { type: "string" }, b: { type: "number" } },
        },
        initialFormState: {
          a: "test string",
          b: 42,
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const inputs = env.view.getAllByTestId("miroirInput");
        const inputA = inputs.find(
          (input: HTMLElement) =>
            (input as HTMLInputElement).name === formikFieldName("testField.a"),
        ) as HTMLInputElement;
        const inputB = inputs.find(
          (input: HTMLElement) =>
            (input as HTMLInputElement).name === formikFieldName("testField.b"),
        ) as HTMLInputElement;
        env.expect(inputA).toHaveValue("test string");
        env.expect(inputB).toHaveValue(42);

        await env.act(() => {
          env.fireEvent.change(inputA, { target: { value: "new string value" } });
          env.fireEvent.change(inputB, { target: { value: 100 } });
        });
        await waitAfterUserInteraction(env.container);
        const values: Record<string, any> = testFieldValues(env, "after change");
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({
          a: "new string value",
          b: 100,
        });
      },
    },
    "object with optional attributes can receive a value for an optional attribute by clicking on the add button for the attribute":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: {
            type: "object",
            definition: {
              a: { type: "string", optional: true },
              b: { type: "number" },
              c: { type: "boolean", optional: true },
            },
          },
          initialFormState: {
            b: 42,
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const addButton = env.view.getByRole("button", {
            name: formikFieldName("testField.addObjectOptionalAttribute.a"),
          });
          await env.act(() => {
            env.fireEvent.click(addButton);
          });
          // Wait for progressive rendering after the button click
          await waitAfterUserInteraction(env.container);

          const screenValues: Record<string, any> = testFieldValues(env, "after add button click");
          const testResult = formValuesToJSON(screenValues);
          env.expect(testResult).toEqual({
            a: "",
            b: 42,
          });
        },
      },
    "object with 2 optional attributes can have the only attribute value deleted by clicking on the delete button":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: {
            type: "object",
            definition: {
              a: { type: "string", optional: true },
              b: { type: "number", optional: true },
            },
          },
          initialFormState: {
            a: "test string",
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const deleteButton = env.view.getByRole("button", {
            name: formikFieldName("testField.a-removeOptionalAttributeOrRecordEntry"),
          });
          await env.act(() => {
            env.fireEvent.click(deleteButton);
          });
          // Wait for progressive rendering after the delete button click
          await waitAfterUserInteraction(env.container);

          const screenValues = testFieldValues(env, "after delete button click");
          const testResult = formValuesToJSON(screenValues);
          env.expect(testResult).toEqual({});
        },
      },
    "object with 3 optional attributes can have the value for the second attribute deleted by clicking on the delete button":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: {
            type: "object",
            definition: {
              a: { type: "string", optional: true },
              b: { type: "number", optional: true },
              c: { type: "boolean", optional: true },
            },
          },
          initialFormState: {
            a: "test string",
            b: 42,
            c: true,
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const deleteButton = env.view.getByRole("button", {
            name: formikFieldName("testField.b-removeOptionalAttributeOrRecordEntry"),
          });
          await env.act(() => {
            env.fireEvent.click(deleteButton);
          });
          // Wait for progressive rendering after the delete button click
          await waitAfterUserInteraction(env.container);

          const screenValues = testFieldValues(env, "after delete button click");
          const testResult = formValuesToJSON(screenValues);
          env.expect(testResult).toEqual({
            a: "test string",
            c: true,
          });
        },
      },
    "record renders as json-like input fields with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: recordOfObjectSchema,
        initialFormState: {
          firstRecord: {
            a: "test string",
            b: 42,
          },
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = testFieldValues(env, "initial");
        env.expect(values).toEqual({
          "firstRecord.a": "test string",
          "firstRecord.b": 42,
        });
      },
    },
    "record can receive a new record attribute with the proper default value when clicking on the add button":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: recordOfObjectSchema,
          initialFormState: {
            firstRecord: {
              a: "test string",
              b: 42,
            },
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const addButton = env.view.getByRole("button", {
            name: formikFieldName("testField.addRecordAttribute"),
          });
          await env.act(() => {
            env.fireEvent.click(addButton);
          });
          await waitAfterUserInteraction(env.container);
          const values = testFieldValues(env, "after add button click");
          const testResult = formValuesToJSON(values);
          env.expect(testResult).toEqual({
            firstRecord: {
              a: "test string",
              b: 42,
            },
            newRecordEntry: {
              a: "",
              b: 0, // default value for number
            },
          });
        },
      },
    "record can rename a record attribute keeping the existing value when clicking on the attribute input field":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: recordOfObjectSchema,
          initialFormState: {
            firstRecord: {
              a: "test string",
              b: 42,
            },
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const input = env.view.getByRole("textbox", {
            name: formikFieldName("testField.firstRecord-NAME"),
          }) as HTMLInputElement;
          env.expect(input).toBeInTheDocument();
          env.expect(input).toHaveValue("firstRecord");
          await env.act(() => {
            env.fireEvent.change(input, { target: { value: "renamedRecord" } });
          });
          await env.act(() => {
            env.fireEvent.blur(input); // Simulate blur to trigger validation and state update
          });
          await waitAfterUserInteraction(env.container);
          env.expect(input).toHaveValue("renamedRecord");
          const values = testFieldValues(env, "after rename");
          const testResult = formValuesToJSON(values);
          env.expect(testResult).toEqual({
            renamedRecord: {
              a: "test string",
              b: 42,
            },
          });
        },
      },
    "record with 1 entry can have the entry deleted when clicking on the delete button": {
      props: {
        ...testFieldProps,
        rawJzodSchema: recordOfObjectSchema,
        initialFormState: {
          firstRecord: {
            a: "test string",
            b: 42,
          },
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const deleteButton = env.view.getByRole("button", {
          name: formikFieldName("testField.firstRecord-removeOptionalAttributeOrRecordEntry"),
        });
        env.expect(deleteButton).toBeInTheDocument();
        await env.act(() => {
          env.fireEvent.click(deleteButton);
        });
        const values = testFieldValues(env, "after delete button click");
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({});
      },
    },
    "record with 3 items can have the second record item deleted when clicking on the second delete button":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: recordOfObjectSchema,
          initialFormState: {
            firstRecord: {
              a: "test string",
              b: 42,
            },
            secondRecord: {
              a: "test string2",
              b: 423,
            },
            thirdRecord: {
              a: "test string3",
              b: 432,
            },
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const deleteButton = env.view.getByRole("button", {
            name: formikFieldName("testField.secondRecord-removeOptionalAttributeOrRecordEntry"),
          });
          env.expect(deleteButton).toBeInTheDocument();
          await env.act(() => {
            env.fireEvent.click(deleteButton);
          });
          const values = testFieldValues(env, "after delete button click");
          const testResult = formValuesToJSON(values);
          env.expect(testResult).toEqual({
            firstRecord: {
              a: "test string",
              b: 42,
            },
            thirdRecord: {
              a: "test string3",
              b: 432,
            },
          });
        },
      },
    "record with 1 object entry can have the entry duplicated when clicking the duplicate button": {
      props: {
        ...testFieldProps,
        rawJzodSchema: recordOfObjectSchema,
        initialFormState: {
          firstRecord: {
            a: "test string",
            b: 42,
          },
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const duplicateButton = env.view.getByRole("button", {
          name: formikFieldName("testField.firstRecord-duplicateRecordEntry"),
        });
        env.expect(duplicateButton).toBeInTheDocument();
        await env.act(() => {
          env.fireEvent.click(duplicateButton);
        });
        await waitAfterUserInteraction(env.container);
        const values = testFieldValues(env, "after duplicate button click");
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({
          firstRecord: { a: "test string", b: 42 },
          firstRecord_copy: { a: "test string", b: 42 },
        });
      },
    },
    "record with 2 object entries can have the first entry duplicated without colliding with an existing _copy key":
      {
        props: {
          ...testFieldProps,
          rawJzodSchema: recordOfObjectSchema,
          initialFormState: {
            firstRecord: {
              a: "test string",
              b: 42,
            },
            firstRecord_copy: {
              a: "already a copy",
              b: 99,
            },
          },
        },
        tests: async (env: ComponentTestEnvironment) => {
          const duplicateButton = env.view.getByRole("button", {
            name: formikFieldName("testField.firstRecord-duplicateRecordEntry"),
          });
          env.expect(duplicateButton).toBeInTheDocument();
          await env.act(() => {
            env.fireEvent.click(duplicateButton);
          });
          await waitAfterUserInteraction(env.container);
          const values = testFieldValues(env, "after duplicate button click");
          const testResult = formValuesToJSON(values);
          env.expect(testResult).toEqual({
            firstRecord: { a: "test string", b: 42 },
            firstRecord_copy: { a: "already a copy", b: 99 },
            firstRecord_copy1: { a: "test string", b: 42 },
          });
        },
      },
    "createObject definition record entry name can be renamed": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "coreTransformerForBuildPlusRuntime",
          },
        },
        initialFormState: {
          interpolation: "runtime",
          transformerType: "createObject",
          definition: {
            newRecordEntry: {
              interpolation: "runtime",
              transformerType: "returnValue",
              value: 0,
            },
          },
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const input = env.view.getByRole("textbox", {
          name: formikFieldName("testField.definition.newRecordEntry-NAME"),
        }) as HTMLInputElement;
        env.expect(input).toBeInTheDocument();
        env.expect(input).toHaveValue("newRecordEntry");
        await env.act(() => {
          env.fireEvent.change(input, { target: { value: "firstName" } });
        });
        await env.act(() => {
          env.fireEvent.blur(input);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(input).toHaveValue("firstName");
        const values = testFieldValues(env, "after rename createObject record entry");
        const testResult = formValuesToJSON(values);
        // Outer transformerType / interpolation are comboboxes; extractValues
        // omits them. The record key itself is what this test cares about.
        env.expect(testResult.definition).toEqual({
          firstName: {
            interpolation: "runtime",
            transformerType: "returnValue",
            value: 0,
          },
        });
      },
    },
  },
};
