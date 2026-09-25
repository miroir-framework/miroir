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
// JzodAnyEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodAnyEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container` (the root of every
// `extractValuesFromRenderedElements` call), `userEvent` `env.userEvent`, React `act` the act-free
// `env.act`, `waitFor` `env.waitFor`, `fireEvent` `env.fireEvent`, and
// `waitAfterUserInteraction()` its act-free equivalent on `env.container`. The cases that open the
// `ThemedSelectWithPortal` union type selector pass `env.portalElement` to the value reader, where
// its option list is portaled (`PortalContainerContext`).
// The old suite had no suite props: every case gives its own props, kept here as they were.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

/** Props shared by every case of the old suite: label, name, list keys, and the `any` schema. */
const anyTestFieldProps: Omit<JzodElementEditorProps_Test, "initialFormState"> = {
  label: "Test Label",
  name: "testField",
  listKey: "ROOT.testField",
  rootLessListKey: "testField",
  rootLessListKeyArray: ["testField"],
  rawJzodSchema: { type: "any" },
};

/** The `data-testid` selector of the union type selector input of `testField`. */
const unionTypeInputSelector = `[data-testid="union-type-input-${formikFieldName("testField")}"]`;

/**
 * The type switch shared by the "can switch from … via selector" cases of the old suite: open the
 * union type selector with the star button, check the current type when the old case did, then
 * choose `targetType` in the portaled dropdown. The steps and waits are the old ones, in the same
 * order, and the old single `act` around the dropdown steps stays one `env.act`.
 */
async function switchAnyType(
  env: ComponentTestEnvironment,
  targetType: string,
  expectedInitialType?: string,
): Promise<void> {
  const starButton = env.view.getByTestId("union-type-star-" + formikFieldName("testField"));
  env.expect(starButton).toBeTruthy();

  // Click the star to open the selector
  await env.act(async () => {
    env.fireEvent.click(starButton);
  });

  const stateTracker = env.view.getByTestId(
    "themed-select-state-union-type-" + formikFieldName("testField"),
  );
  if (expectedInitialType !== undefined) {
    env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe(expectedInitialType);
  }

  const unionTypeInput = env.view.getByTestId(
    "union-type-input-" + formikFieldName("testField"),
  ) as HTMLInputElement;

  const user = env.userEvent.setup();

  await env.act(async () => {
    env.fireEvent.click(unionTypeInput);
    await env.waitFor(
      () => {
        env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
      },
      { timeout: 1000 },
    );

    await user.clear(unionTypeInput);
    await user.type(unionTypeInput, targetType);

    await env.waitFor(
      () => {
        env.expect(stateTracker.getAttribute("data-test-filter-text")).toBe(targetType);
        env.expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
      },
      { timeout: 1000 },
    );

    await user.keyboard("{Enter}");

    await env.waitFor(
      () => {
        env.expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
        env.expect(stateTracker.getAttribute("data-test-selected-value")).toBe(targetType);
      },
      { timeout: 2000 },
    );
  });
}

/**
 * Waits until the value read under `label` equals `expected`, as the old `waitFor` blocks did.
 * The union type selector options are portaled, so the portal element is searched too.
 */
async function waitForAnyValue(
  env: ComponentTestEnvironment,
  filter: ("select" | "input" | "option" | "cell" | "checkbox" | "combobox")[] | undefined,
  label: string,
  step: string,
  expected: any,
): Promise<void> {
  await env.waitFor(
    () => {
      const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
        env.expect,
        filter,
        env.container,
        label,
        step,
        false,
        env.portalElement,
      );
      const testResult = formValuesToJSON(valuesAfterChange);
      env.expect(testResult).toEqual(expected);
    },
    { timeout: 3000 },
  );
}

/** Values of `testField` after a button click, with the old step label. */
function testFieldValues(env: ComponentTestEnvironment, step: string): any {
  const formValues: Record<string, any> = extractValuesFromRenderedElements(
    env.expect,
    undefined,
    env.container,
    formikFieldName("testField"),
    step,
  );
  return formValuesToJSON(formValues);
}

export const jzodAnyEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  // Not used by any case (each case gives its props), required by ComponentTestSuite.
  suiteProps: { ...anyTestFieldProps, initialFormState: "hello" },
  cases: {
    "any type star button is visible for a string value": {
      props: { ...anyTestFieldProps, initialFormState: "hello" },
      tests: async (env: ComponentTestEnvironment) => {
        env.expect(env.view.getByTestId("union-type-star-" + formikFieldName("testField"))).toBeTruthy();
        // Selector is not rendered initially
        env.expect(env.container.querySelector(unionTypeInputSelector)).toBeNull();
      },
    },
    "any type star button toggle shows then hides selector": {
      props: { ...anyTestFieldProps, initialFormState: 42 },
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
    "any type can switch from number to string via selector": {
      props: { ...anyTestFieldProps, initialFormState: 42 },
      tests: async (env: ComponentTestEnvironment) => {
        await switchAnyType(env, "string", "number");
        // Verify the field now holds a string value
        await waitForAnyValue(env, [], testSectionName, "after change to string", { testField: "" });
      },
    },
    "any type star button for object value places star and selector in header": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello", b: 1 } },
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
    "any type with object value shows text input for string attribute": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello" } },
      tests: async (env: ComponentTestEnvironment) => {
        const input = (env.view.getAllByRole("textbox") as HTMLInputElement[]).find(
          (el) => el.name === formikFieldName("testField.a"),
        );
        env.expect(input).toBeTruthy();
        env.expect(input).toHaveValue("hello");
      },
    },
    "any type with object value shows text input for number attribute": {
      props: { ...anyTestFieldProps, initialFormState: { b: 1 } },
      tests: async (env: ComponentTestEnvironment) => {
        const input = (env.view.getAllByRole("textbox") as HTMLInputElement[]).find(
          (el) => el.name === formikFieldName("testField.b"),
        );
        env.expect(input).toBeTruthy();
        env.expect(input).toHaveValue(1);
      },
    },
    "any type can switch from number to object via selector": {
      props: { ...anyTestFieldProps, initialFormState: 42 },
      tests: async (env: ComponentTestEnvironment) => {
        await switchAnyType(env, "record", "number");
        await waitForAnyValue(env, undefined, formikFieldName("testField"), "after change to record", {
          a: "enter attributes here...",
        });
      },
    },
    "any type can switch from object to string via selector": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello", b: "world" } },
      tests: async (env: ComponentTestEnvironment) => {
        await switchAnyType(env, "string");
        await waitForAnyValue(env, [], testSectionName, "after change to string", { testField: "" });
      },
    },
    "any type can switch from object to array via selector": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello" } },
      tests: async (env: ComponentTestEnvironment) => {
        await switchAnyType(env, "array");
        await waitForAnyValue(env, undefined, formikFieldName("testField"), "after change to array", [
          "enter elements here...",
        ]);
      },
    },
    "any type can switch from array to string via selector": {
      props: { ...anyTestFieldProps, initialFormState: ["item1", "item2"] },
      tests: async (env: ComponentTestEnvironment) => {
        await switchAnyType(env, "string", "array");
        await waitForAnyValue(env, [], testSectionName, "after change to string", { testField: "" });
      },
    },
    "any-typed array can be added an item": {
      props: { ...anyTestFieldProps, initialFormState: ["item1", "item2"] },
      tests: async (env: ComponentTestEnvironment) => {
        const addButton = env.view.getByRole("button", { name: "testField.add" });
        await env.act(() => {
          env.fireEvent.click(addButton);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(testFieldValues(env, "after add button click")).toEqual(["item1", "item2", ""]);
      },
    },
    "any-typed array can have an item removed": {
      props: { ...anyTestFieldProps, initialFormState: ["item1", "item2", "item3"] },
      tests: async (env: ComponentTestEnvironment) => {
        const deleteButton = env.view.getByRole("button", {
          name: formikFieldName("testField.1-removeArrayItem"),
        });
        env.expect(deleteButton).toBeTruthy();
        await env.act(() => {
          env.fireEvent.click(deleteButton);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(testFieldValues(env, "after delete button click")).toEqual(["item1", "item3"]);
      },
    },
    "any-typed array can have an item duplicated": {
      props: { ...anyTestFieldProps, initialFormState: ["item1", "item2", "item3"] },
      tests: async (env: ComponentTestEnvironment) => {
        const duplicateButton = env.view.getByRole("button", {
          name: formikFieldName("testField.1-duplicateArrayItem"),
        });
        env.expect(duplicateButton).toBeTruthy();
        await env.act(() => {
          env.fireEvent.click(duplicateButton);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(testFieldValues(env, "after duplicate button click")).toEqual([
          "item1",
          "item2",
          "item2",
          "item3",
        ]);
      },
    },
    "any-typed object can be added an attribute (it is a record)": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello" } },
      tests: async (env: ComponentTestEnvironment) => {
        const addButton = env.view.getByRole("button", {
          name: formikFieldName("testField.addRecordAttribute"),
        });
        await env.act(() => {
          env.fireEvent.click(addButton);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(testFieldValues(env, "after add button click")).toEqual({
          newRecordEntry: "",
          a: "hello",
        });
      },
    },
    "any-typed array can have an attribute removed (it is a record)": {
      props: { ...anyTestFieldProps, initialFormState: { a: "hello", b: "world" } },
      tests: async (env: ComponentTestEnvironment) => {
        const deleteButton = env.view.getByRole("button", {
          name: formikFieldName("testField.a-removeOptionalAttributeOrRecordEntry"),
        });
        env.expect(deleteButton).toBeTruthy();
        await env.act(() => {
          env.fireEvent.click(deleteButton);
        });
        await waitAfterUserInteraction(env.container);
        env.expect(testFieldValues(env, "after delete button click")).toEqual({ b: "world" });
      },
    },
  },
};
