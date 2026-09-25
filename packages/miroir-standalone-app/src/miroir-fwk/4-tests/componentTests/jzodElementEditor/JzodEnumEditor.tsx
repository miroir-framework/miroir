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
// JzodEnumEditor component tests (#286), ported from tests/4_view/JzodElementEditor.test.tsx
// (getJzodEnumEditorTests) with the analysis §5.3 rewrite rules: `screen` becomes `env.view`,
// `expect` `env.expect`, `container` `env.container`, `userEvent` `env.userEvent`, React `act` the
// act-free `env.act`, and the `screen.debug` and `console.log` calls are deleted (the values are
// logged with `env.log`). The option list of `ThemedSelectWithPortal` is portaled into
// `env.portalElement` (`PortalContainerContext`), so the value reader gets it as its 7th argument.
// ################################################################################################

// Same page label as the old vitest file, so that the rendered DOM is the same.
const pageLabel = "JzodElementEditor.test";

const enumValues = ["value1", "value2", "value3"];

/** Clicks the combobox and waits until its state tracker says the dropdown is open. */
async function openDropdown(env: ComponentTestEnvironment, select: HTMLElement, stateTracker: HTMLElement) {
  await env.act(async () => {
    env.fireEvent.click(select);
    await env.waitFor(
      () => {
        env.expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("true");
      },
      { timeout: 1000 },
    );
  });
}

export const jzodEnumEditorComponentTests: ComponentTestSuite<JzodElementEditorProps_Test> = {
  component: getJzodElementEditorForTest(pageLabel),
  suiteProps: {
    label: "Test Label",
    name: "testField",
    listKey: "ROOT.testField",
    rootLessListKey: "testField",
    rootLessListKeyArray: ["testField"],
    rawJzodSchema: {
      type: "enum",
      definition: enumValues,
    },
    initialFormState: "value2",
  },
  cases: {
    "renders select with correct value": {
      tests: async (env: ComponentTestEnvironment) => {
        const values: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          testSectionName,
          "initial",
          false,
          env.portalElement,
        );
        env.log.info("ENUM VALUES", values);

        const testResult = formValuesToJSON(values);

        env.expect(testResult).toEqual({
          testField: "value2",
        });
      },
    },
    "renders all enum options": {
      tests: async (env: ComponentTestEnvironment) => {
        const select = env.view.getByRole("combobox");
        const valuesInitial: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          testSectionName,
          "initial",
          false,
          env.portalElement,
        );
        env.expect(valuesInitial).toEqual({
          testField: "value2",
        });
        const stateTracker = env.view.getByTestId("themed-select-state-" + formikFieldName("testField"));

        await openDropdown(env, select, stateTracker);

        const valuesAfterClick: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          testSectionName,
          "after click",
          true,
          env.portalElement,
        );
        env.log.info("ENUM VALUES AFTER CLICK", valuesAfterClick);
        // Merge initial values with values after click to preserve the selected value and get the options
        const valuesListDisplayed = { ...valuesAfterClick };
        // Preserve the original selected value from before the dropdown opened
        if (valuesInitial.testField && !valuesAfterClick.testField) {
          valuesListDisplayed.testField = valuesInitial.testField;
        }
        env.expect(valuesListDisplayed).toEqual({
          testField: "value2",
          [formikFieldName("options")]: ["value1", "value2", "value3"],
        });
      },
    },
    "form state is changed when selection changes": {
      tests: async (env: ComponentTestEnvironment) => {
        const select = env.view.getByRole("combobox") as HTMLSelectElement;
        env.expect(select.value).toBe("value2"); // initial value

        const user = env.userEvent.setup();
        const stateTracker = env.view.getByTestId("themed-select-state-" + formikFieldName("testField"));

        await openDropdown(env, select, stateTracker);
        await env.act(async () => {
          // Type "value3" to filter to the desired option
          await user.clear(select);
          await user.type(select, "value3");
        });

        // Wait for filtering to complete
        await env.waitFor(
          () => {
            env.expect(stateTracker.getAttribute("data-test-filter-text"), "data-test-filter-text").toBe(
              "value3",
            );
          },
          { timeout: 1000 },
        );

        const valuesFinal: Record<string, any> = extractValuesFromRenderedElements(
          env.expect,
          undefined,
          env.container,
          testSectionName,
          "after selection change",
          false,
          env.portalElement,
        );
        env.expect(valuesFinal).toEqual({
          testField: "value3",
          [formikFieldName("options")]: ["value3"],
        });
      },
    },
  },
};
