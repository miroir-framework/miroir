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
// JzodArrayEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodArrayEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container`, `log` `env.log`, React `act` the act-free
// `env.act`, `waitAfterUserInteraction()` its act-free equivalent on `env.container`, and the
// `screen.debug` calls are deleted.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

const arrayValues = ["value1", "value2", "value3"];

/** Values of the text boxes of the array items, in DOM order. */
function arrayItemTextBoxValues(env: ComponentTestEnvironment): string[] {
  return env.view
    .getAllByRole("textbox")
    .filter((input: HTMLElement) =>
      (input as HTMLInputElement).name.startsWith(formikFieldName("testField.")),
    )
    .map((cell) => (cell as HTMLInputElement).value);
}

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
    "renders array input with label when label prop is provided": {
      tests: async (env: ComponentTestEnvironment) => {
        // There should be only one label (the old comment says there may be two, one for the
        // array and one for the first item).
        env.expect(env.view.getAllByText(/Test Label/).length).toBe(1);
      },
    },
    "renders all array values, in the right order": {
      tests: async (env: ComponentTestEnvironment) => {
        env.expect(arrayItemTextBoxValues(env)).toEqual(arrayValues);
      },
    },
    "form state is changed when selection changes": {
      tests: async (env: ComponentTestEnvironment) => {
        const cell = env.view
          .getAllByRole("textbox")
          .filter((input: HTMLElement) =>
            (input as HTMLInputElement).name.startsWith(testSectionName + ".testField."),
          )[1] as HTMLInputElement;
        await env.act(() => {
          env.fireEvent.change(cell, { target: { value: "new value" } });
        });
        await waitAfterUserInteraction(env.container);

        env.expect(cell).toContainHTML("new value");
      },
    },
    "changing order of array items when button ROOT.testField.1.up is clicked": {
      tests: async (env: ComponentTestEnvironment) => {
        const upButton = env.view.getAllByRole(formikFieldName("testField.button.up"))[1];
        await env.act(() => {
          env.fireEvent.click(upButton); // Click the up button for the second item
        });
        env.expect(arrayItemTextBoxValues(env)).toEqual(["value2", "value1", "value3"]);
      },
    },
    "changing order of array items when button ROOT.testField.2.up is clicked": {
      tests: async (env: ComponentTestEnvironment) => {
        const upButtons = env.view.getAllByRole(formikFieldName("testField.button.up"));
        await env.act(() => {
          env.fireEvent.click(upButtons[2]); // Click the up button for the third item
        });
        env.expect(arrayItemTextBoxValues(env)).toEqual(["value1", "value3", "value2"]);
      },
    },
    "changing order of array items when button ROOT.testField.0.down is clicked": {
      tests: async (env: ComponentTestEnvironment) => {
        const downButtons = env.view.getAllByRole(formikFieldName("testField.button.down"));
        await env.act(() => {
          env.fireEvent.click(downButtons[0]); // Click the down button for the first item
        });
        env.expect(arrayItemTextBoxValues(env)).toEqual(["value2", "value1", "value3"]);
      },
    },
    "changing order of heteronomous object array items from union when button ROOT.testField.0.down is clicked":
      {
        props: {
          label: "Test Label",
          name: "testField",
          listKey: "ROOT.testField",
          rootLessListKey: "testField",
          rootLessListKeyArray: ["testField"],
          rawJzodSchema: {
            type: "array",
            definition: {
              type: "union",
              discriminator: "objectType",
              definition: [
                {
                  type: "object",
                  definition: {
                    objectType: { type: "literal", definition: "A" },
                    a: { type: "string" },
                  },
                },
                {
                  type: "object",
                  definition: {
                    objectType: { type: "literal", definition: "B" },
                    b: { type: "number" },
                  },
                },
              ],
            },
          },
          initialFormState: [
            { objectType: "A", a: "value1" },
            { objectType: "B", b: 2 },
            { objectType: "A", a: "value3" },
          ],
        },
        tests: async (env: ComponentTestEnvironment) => {
          const testName = env.expect.getState().currentTestName;
          const formValuesBeforeTest = extractValuesFromRenderedElements(
            env.expect,
            undefined,
            env.container,
            formikFieldName("testField"),
            "before up button click",
          );
          const beforeTestResult = formValuesToJSON(formValuesBeforeTest);
          env.log.info(testName, "beforeTestResult", beforeTestResult);
          env.expect(beforeTestResult, "before up button click").toEqual([
            { objectType: "A", a: "value1" },
            { objectType: "B", b: 2 },
            { objectType: "A", a: "value3" },
          ]);

          env.log.info(testName, "clicking down button for first item");
          const downButtons = env.view.getAllByRole(formikFieldName("testField.button.down"));
          await env.act(() => {
            env.fireEvent.click(downButtons[0]); // Click the down button for the first item
          });
          // Wait for progressive rendering after the button click
          await waitAfterUserInteraction(env.container);
          env.log.info(testName, "clicked up button for first item done");
          const formValues = extractValuesFromRenderedElements(
            env.expect,
            undefined,
            env.container,
            formikFieldName("testField"),
            "after up button click",
          );
          const testResult = formValuesToJSON(formValues);
          env.log.info(testName, "testResult", testResult);
          env.expect(testResult, "after up button click").toEqual([
            { objectType: "B", b: 2 },
            { objectType: "A", a: "value1" },
            { objectType: "A", a: "value3" },
          ]);
        },
      },
    "renders all array values of a plain 2-items tuple with a string and a number, in the right order":
      {
        props: {
          label: "Test Label",
          name: "testField",
          listKey: "ROOT.testField",
          rootLessListKey: "testField",
          rootLessListKeyArray: ["testField"],
          rawJzodSchema: {
            type: "tuple",
            definition: [{ type: "string" }, { type: "number" }],
          },
          initialFormState: ["value1", 2],
        },
        tests: async (env: ComponentTestEnvironment) => {
          const formValues: Record<string, any> = extractValuesFromRenderedElements(
            env.expect,
            undefined,
            env.container,
            formikFieldName("testField"),
            "initial",
          );
          const testResult = formValuesToJSON(formValues);
          env.expect(testResult).toEqual(["value1", 2]);
        },
      },
    "renders all array values of a tuple inside an array, in the right order": {
      props: {
        label: "Test Label",
        name: "testField",
        listKey: "ROOT.testField",
        rootLessListKey: "testField",
        rootLessListKeyArray: ["testField"],
        rawJzodSchema: {
          type: "array",
          definition: { type: "tuple", definition: [{ type: "string" }, { type: "number" }] },
        },
        initialFormState: [
          ["value1", 1],
          ["value2", 2],
          ["value3", 3],
        ],
      },
      tests: async (env: ComponentTestEnvironment) => {
        const formValues: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "initial",
        );
        const testResult = formValuesToJSON(formValues);
        env.expect(testResult).toEqual([
          ["value1", 1],
          ["value2", 2],
          ["value3", 3],
        ]);
      },
    },
    "add an element to a string array when button ROOT.testField.add is clicked": {
      tests: async (env: ComponentTestEnvironment) => {
        const addButton = env.view.getByRole("button", { name: "testField.add" });
        await env.act(() => {
          env.fireEvent.click(addButton);
        });
        // Wait for progressive rendering after the button click
        await waitAfterUserInteraction(env.container);
        const formValues: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "after add button click",
        );
        const testResult = formValuesToJSON(formValues);
        env.expect(testResult).toEqual([...arrayValues, ""]);
      },
    },
    "add an element to an object array when button ROOT.testField.add is clicked": {
      props: {
        label: "Test Label",
        name: "testField",
        listKey: "ROOT.testField",
        rootLessListKey: "testField",
        rootLessListKeyArray: ["testField"],
        rawJzodSchema: {
          type: "array",
          definition: {
            type: "object",
            definition: {
              a: { type: "string", optional: true },
              b: { type: "object", definition: { c: { type: "number" } } },
              d: { type: "boolean" },
            },
          },
        },
        initialFormState: [
          {
            a: "value1",
            b: { c: 1 },
            d: true,
          },
          {
            a: "value2",
            b: { c: 2 },
            d: false,
          },
        ],
      },
      tests: async (env: ComponentTestEnvironment) => {
        const addButton = env.view.getByRole("button", { name: "testField.add" });
        await env.act(() => {
          env.fireEvent.click(addButton);
        });
        // Wait for progressive rendering after the button click
        await waitAfterUserInteraction(env.container);
        const formValues: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "after add button click",
        );
        const testResult = formValuesToJSON(formValues);
        env.expect(testResult).toEqual([
          {
            a: "value1",
            b: { c: 1 },
            d: true,
          },
          {
            a: "value2",
            b: { c: 2 },
            d: false,
          },
          {
            b: { c: 0 }, // default value for number
            d: false, // default value for boolean
          },
        ]);
      },
    },
    "duplicate an element in a string array when duplicate button for item 1 is clicked": {
      tests: async (env: ComponentTestEnvironment) => {
        const duplicateButton = env.view.getByRole("button", {
          name: formikFieldName("testField.1-duplicateArrayItem"),
        });
        env.expect(duplicateButton).toBeTruthy();
        await env.act(() => {
          env.fireEvent.click(duplicateButton);
        });
        await waitAfterUserInteraction(env.container);
        const formValues: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "after duplicate button click",
        );
        const testResult = formValuesToJSON(formValues);
        env.expect(testResult).toEqual(["value1", "value2", "value2", "value3"]);
      },
    },
  },
};
