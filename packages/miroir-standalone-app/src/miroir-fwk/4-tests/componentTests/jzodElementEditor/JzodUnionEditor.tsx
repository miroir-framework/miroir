import { type JzodUnion } from "miroir-core";

import { type ComponentTestEnvironment, type ComponentTestSuite } from "../componentTestEnvironment.js";
import {
  extractValuesFromRenderedElements,
  formikFieldName,
  formValuesToJSON,
  getJzodElementEditorForTest,
  testSectionName,
  type JzodElementEditorProps_Test,
} from "../componentTestTools.js";

// ################################################################################################
// JzodUnionEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodUnionEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container` (the root of every
// `extractValuesFromRenderedElements` call), `userEvent` `env.userEvent`, React `act` the act-free
// `env.act`, `waitFor` `env.waitFor`, `fireEvent` `env.fireEvent`, the `console.log` call
// `env.log.info`, and the `screen.debug` calls are deleted. The cases that open a
// `ThemedSelectWithPortal` dropdown pass `env.portalElement` to the value reader, where its option
// list is portaled (`PortalContainerContext`).
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

/** Union of string and number. */
const stringOrNumberSchema: JzodUnion = {
  type: "union",
  definition: [{ type: "string" }, { type: "number" }],
};

/** Union of string, number, and an object `{ a: string, b: number }`. */
const stringNumberOrObjectSchema: JzodUnion = {
  type: "union",
  definition: [
    { type: "string" },
    { type: "number" },
    { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
  ],
};

/** The `data-testid` selector of the union type selector input of `testField`. */
const unionTypeInputSelector = `[data-testid="union-type-input-${formikFieldName("testField")}"]`;

export const jzodUnionEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  // Not used by any case (each case gives its props), required by ComponentTestSuite.
  suiteProps: {
    ...testFieldProps,
    rawJzodSchema: stringOrNumberSchema,
    initialFormState: 42,
  },
  cases: {
    "union between simple types renders input with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringOrNumberSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          [],
          env.container,
          testSectionName, //formikFieldName("testField"),
          "initial form state",
        );
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({ testField: 42 });
      },
    },
    "union between simple type and object for value of simple type renders input with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringNumberOrObjectSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          [],
          env.container,
          testSectionName,
          "initial form state",
        );
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({ testField: 42 });
      },
    },
    "union between simple type and object for value object renders input with proper value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringNumberOrObjectSchema,
        initialFormState: {
          a: "test string",
          b: 42,
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          [],
          env.container,
          formikFieldName("testField"),
          "initial form state",
        );
        const testResult = formValuesToJSON(values);
        env.expect(testResult).toEqual({ a: "test string", b: 42 });
      },
    },
    "union between 2 object types with a discriminator for value object renders input following the proper value type": {
      props: {
        ...testFieldProps,
        rawJzodSchema: {
          type: "union",
          discriminator: "testObjectType",
          definition: [
            {
              type: "object",
              definition: {
                testObjectType: { type: "literal", definition: "type1" },
                type1Attribute: { type: "string" },
              },
            },
            {
              type: "object",
              definition: {
                testObjectType: { type: "literal", definition: "type2" },
                type2Attribute: { type: "number" },
              },
            },
          ],
        },
        initialFormState: {
          testObjectType: "type1",
          type1Attribute: "test string",
        },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "initial form state",
          false,
          env.portalElement,
        );
        const initialFormState = formValuesToJSON(values);
        env.log.info("Initial form state:", initialFormState);
        env.expect(initialFormState).toEqual({
          type1Attribute: "test string",
          testObjectType: "type1",
        });
        env.expect(values).toEqual({ type1Attribute: "test string", testObjectType: "type1" });

        // Find the discriminator select element and state tracker
        const user = env.userEvent.setup();
        const select = env.view.getByDisplayValue("type1") as HTMLSelectElement;
        const stateTracker = env.view.getByTestId(
          "themed-select-state-" + formikFieldName("testField.testObjectType"),
        );

        env.expect(select.value).toBe("type1"); // initial value
        env.expect(stateTracker.getAttribute("data-test-selected-value"), "data-test-selected-value").toBe(
          "type1",
        );
        env.expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("false");

        // Change the discriminator from "type1" to "type2"
        await env.act(async () => {
          // Click to open the dropdown
          env.fireEvent.click(select);

          // Wait for dropdown to open
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("true");
            },
            { timeout: 1000 },
          );

          // Type "type2" to filter to the desired option
          await user.clear(select);
          await user.type(select, "type2");

          // Wait for filtering to complete
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-filter-text"), "data-test-filter-text").toBe(
                "type2",
              );
              env.expect(
                stateTracker.getAttribute("data-test-filtered-options-count"),
                "data-test-filtered-options-count",
              ).toBe("1");
            },
            { timeout: 1000 },
          );

          // Press Enter to select the option
          await user.keyboard("{Enter}");

          // Wait for selection to complete and dropdown to close
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("false");
              env.expect(
                stateTracker.getAttribute("data-test-selected-value"),
                "data-test-selected-value",
              ).toBe("type2");
            },
            { timeout: 2000 },
          );
        });

        // Verify that the form now shows type2 fields
        await env.waitFor(
          () => {
            env.expect(env.view.getAllByText("type2Attribute").length > 0).toBeTruthy();
          },
          { timeout: 5000 },
        );

        // Get final values after union form re-rendering
        const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "after change to type2",
          false,
          env.portalElement,
        );
        const testResultAfterChange = formValuesToJSON(valuesAfterChange);
        env.expect(testResultAfterChange).toEqual({
          testObjectType: "type2",
          type2Attribute: 0, // default value for number
        });
      },
    },
    "non-discriminated union can switch type from number to string via union type selector": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringOrNumberSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        // Verify the star button is present but selector is initially hidden
        const starButton = env.view.getByTestId("union-type-star-" + formikFieldName("testField"));
        env.expect(starButton).toBeTruthy();
        env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();

        // Click the star to open the selector
        await env.act(async () => {
          env.fireEvent.click(starButton);
        });

        // Verify the union type selector is now present and shows the current type "number"
        const stateTracker = env.view.getByTestId(
          "themed-select-state-union-type-" + formikFieldName("testField"),
        );
        env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

        const unionTypeInput = env.view.getByTestId(
          "union-type-input-" + formikFieldName("testField"),
        ) as HTMLInputElement;

        const user = env.userEvent.setup();

        await env.act(async () => {
          // Click to open the dropdown
          env.fireEvent.click(unionTypeInput);

          // Wait for dropdown to open
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
            },
            { timeout: 1000 },
          );

          // Type "string" to filter to the desired option
          await user.clear(unionTypeInput);
          await user.type(unionTypeInput, "string");

          // Wait for filtering to complete
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-filter-text")).toBe("string");
              env.expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
            },
            { timeout: 1000 },
          );

          // Press Enter to select the option
          await user.keyboard("{Enter}");

          // Wait for selection to complete and dropdown to close
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
              env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe("string");
            },
            { timeout: 2000 },
          );
        });

        // Verify the selector is closed after selection and value reset to default string
        await env.waitFor(
          () => {
            env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();
          },
          { timeout: 3000 },
        );

        // Verify value was reset to default string
        await env.waitFor(
          () => {
            const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
              env.expect,
              [],
              env.container,
              testSectionName, //formikFieldName("testField"),
              "after change to string",
              false,
              env.portalElement,
            );
            const testResult = formValuesToJSON(valuesAfterChange);
            env.expect(testResult).toEqual({ testField: "" });
          },
          { timeout: 3000 },
        );
      },
    },
    "non-discriminated union can switch type from number to object via union type selector": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringNumberOrObjectSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        // Verify the star button is present but selector is initially hidden
        const starButton = env.view.getByTestId("union-type-star-" + formikFieldName("testField"));
        env.expect(starButton).toBeTruthy();
        env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();

        // Click the star to open the selector
        await env.act(async () => {
          env.fireEvent.click(starButton);
        });

        // Verify the union type selector shows the current type "number"
        const stateTracker = env.view.getByTestId(
          "themed-select-state-union-type-" + formikFieldName("testField"),
        );
        env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

        const unionTypeInput = env.view.getByTestId(
          "union-type-input-" + formikFieldName("testField"),
        ) as HTMLInputElement;

        const user = env.userEvent.setup();

        await env.act(async () => {
          // Click to open the dropdown
          env.fireEvent.click(unionTypeInput);

          // Wait for dropdown to open
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
            },
            { timeout: 1000 },
          );

          // Type "object" to filter to the desired option
          await user.clear(unionTypeInput);
          await user.type(unionTypeInput, "object");

          // Wait for filtering to complete
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-filter-text")).toBe("object");
              env.expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
            },
            { timeout: 1000 },
          );

          // Press Enter to select the option
          await user.keyboard("{Enter}");

          // Wait for selection to complete
          await env.waitFor(
            () => {
              env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
              env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe("object");
            },
            { timeout: 2000 },
          );
        });

        // Verify value was reset to default object
        await env.waitFor(
          () => {
            env.expect(env.view.getAllByText("a").length > 0).toBeTruthy();
          },
          { timeout: 5000 },
        );

        // Verify selector is closed after selection
        await env.waitFor(
          () => {
            env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();
          },
          { timeout: 3000 },
        );

        const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          formikFieldName("testField"),
          "after change to object",
          false,
          env.portalElement,
        );
        const testResultAfterChange = formValuesToJSON(valuesAfterChange);
        env.expect(testResultAfterChange).toEqual({
          a: "",
          b: 0,
        });
      },
    },
    "union type star button is visible but selector is initially hidden": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringOrNumberSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        // Star is visible
        env.expect(env.view.getByTestId("union-type-star-" + formikFieldName("testField"))).toBeTruthy();
        // Selector is not rendered initially
        env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();
      },
    },
    "union type star button toggle shows then hides selector": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringOrNumberSchema,
        initialFormState: 42,
      },
      tests: async (env: ComponentTestEnvironment) => {
        const starButton = env.view.getByTestId("union-type-star-" + formikFieldName("testField"));

        // Click star: selector appears
        await env.act(async () => {
          env.fireEvent.click(starButton);
        });
        await env.waitFor(
          () => {
            env.expect(env.container.querySelector(unionTypeInputSelector)).not.toBeNull();
          },
          { timeout: 1000 },
        );

        // Click star again: selector disappears
        await env.act(async () => {
          env.fireEvent.click(starButton);
        });
        await env.waitFor(
          () => {
            env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();
          },
          { timeout: 1000 },
        );
      },
    },
    "union type selector for object value places star and selector above the value": {
      props: {
        ...testFieldProps,
        rawJzodSchema: stringNumberOrObjectSchema,
        initialFormState: { a: "hello", b: 1 },
      },
      tests: async (env: ComponentTestEnvironment) => {
        const starButton = env.view.getByTestId("union-type-star-" + formikFieldName("testField"));

        // Open selector
        await env.act(async () => {
          env.fireEvent.click(starButton);
        });
        const selectorInput = await env.waitFor(
          () => {
            const el = env.container.querySelector(unionTypeInputSelector);
            env.expect(el).not.toBeNull();
            return el!;
          },
          { timeout: 1000 },
        );

        // Star and selector are in the same flex row (star's parent contains the selector input)
        const starParent = starButton.parentElement!;
        env.expect(starParent.contains(selectorInput)).toBe(true);
      },
    },
  },
};
