import { describe } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpectStatic } from "vitest";

import "@testing-library/jest-dom";
import { Container } from "react-dom";

import {
  EntityVersion,
  JzodElement,
  JzodObject,
  JzodUnion,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditor";
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  extractValuesFromRenderedElements,
  formikFieldName,
  formValuesToJSON,
  getJzodElementEditorForTest,
  JzodElementEditorProps_Test,
  LocalEditorPropsRoot,
  prepareAndRunTestSuites,
  ReactComponentTest,
  ReactComponentTestSuitePrep,
  ReactComponentTestSuites,
  testSectionName,
  waitAfterUserInteraction,
} from "./JzodElementEditorTestTools";
import { defaultSelfApplicationDeploymentMap } from "miroir-core";
import { book1, entityBook } from "miroir-test-app_deployment-library";

import {
  entityDefinitionEntityDefinition,
  entityDefinitionTest,
  queryEndpointVersionV1,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
} from "miroir-test-app_deployment-miroir";
// ################################################################################################
const pageLabel = "JzodElementEditor.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ARRAY
// ################################################################################################
// The JzodArrayEditor suite (getJzodArrayEditorTests) moved to
// src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodArrayEditor.tsx and runs through
// tests/4_view/miroir-component-tests.unit.test.tsx (#286).

// ################################################################################################
// ENUM
// ################################################################################################
// The JzodEnumEditor suite (getJzodEnumEditorTests) moved to
// src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodEnumEditor.tsx and runs through
// tests/4_view/miroir-component-tests.unit.test.tsx (#286).

// ################################################################################################
// LITERAL
// ################################################################################################
// The JzodLiteralEditor suite (getJzodLiteralEditorTests) moved to
// src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodLiteralEditor.tsx and runs through
// tests/4_view/miroir-component-tests.unit.test.tsx (#286).

// ################################################################################################
// OBJECT
// ################################################################################################
// The JzodObjectEditor suite (getJzodObjectEditorTests) moved to
// src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodObjectEditor.tsx and runs through
// tests/4_view/miroir-component-tests.unit.test.tsx (#286).

// ################################################################################################
// SIMPLE TYPES
// ################################################################################################
// The JzodSimpleTypeEditor suite (getJzodSimpleTypeEditorTests) moved to
// src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodSimpleTypeEditor.tsx and runs through
// tests/4_view/miroir-component-tests.unit.test.tsx (#286).

// ################################################################################################
// UNION
// ################################################################################################
export interface LocalUnionEditorProps extends LocalEditorPropsRoot {
  rawJzodSchema: JzodUnion | undefined;
}

export type JzodUnionEditorTest = ReactComponentTest<JzodElementEditorProps_Test>;
export type JzodUnionEditorTestSuites = ReactComponentTestSuites<JzodElementEditorProps_Test>;

export function getJzodUnionEditorTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): JzodUnionEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodUnionEditor: {
      suiteRenderComponent: componentUnderTest,
      tests: {
        "union between simple types renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: 42,
          },

          tests: async (expect: ExpectStatic, container: Container) => {
            // const input = screen.getByRole("textbox");
            // expect(input).toBeInTheDocument();
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              [],
              container,
              testSectionName, //formikFieldName("testField"),
              "initial form state",
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({ testField: 42 });
          },
        },
        "union between simple type and object for value of simple type renders input with proper value":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
              rawJzodSchema: {
                type: "union",
                definition: [
                  { type: "string" },
                  { type: "number" },
                  { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
                ],
              },
              initialFormState: 42,
            },
            tests: async (expect: ExpectStatic, container: Container) => {
              const values: Record<string, any> = extractValuesFromRenderedElements(
                expect,
                [],
                container,
                testSectionName,
                "initial form state",
              );
              const testResult = formValuesToJSON(values);
              expect(testResult).toEqual({ testField: 42 });
            },
          },
        "union between simple type and object for value object renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [
                { type: "string" },
                { type: "number" },
                { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
              ],
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              [],
              container,
              formikFieldName("testField"),
              "initial form state",
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({ a: "test string", b: 42 });
          },
        },
        "union between 2 object types with a discriminator for value object renders input following the proper value type":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
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
            tests: async (expect: ExpectStatic, container: Container) => {
              const values: Record<string, any> = extractValuesFromRenderedElements(
                expect,
                undefined,
                container,
                formikFieldName("testField"),
                "initial form state",
              );
              // const initialFormState = formValuesToJSON(values, testSectionName);
              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              const initialFormState = formValuesToJSON(values);
              console.log("Initial form state:", initialFormState);
              expect(initialFormState).toEqual({
                type1Attribute: "test string",
                testObjectType: "type1",
              });
              expect(values).toEqual({ type1Attribute: "test string", testObjectType: "type1" });

              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              // Find the discriminator select element and state tracker
              const user = userEvent.setup();
              const select = screen.getByDisplayValue("type1") as HTMLSelectElement;
              const stateTracker = screen.getByTestId(
                "themed-select-state-" + formikFieldName("testField.testObjectType"),
              );

              expect(select.value).toBe("type1"); // initial value
              expect(
                stateTracker.getAttribute("data-test-selected-value"),
                "data-test-selected-value",
              ).toBe("type1");
              expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe(
                "false",
              );

              // Change the discriminator from "type1" to "type2"
              await act(async () => {
                // Click to open the dropdown
                fireEvent.click(select);

                // Wait for dropdown to open
                await waitFor(
                  () => {
                    expect(
                      stateTracker.getAttribute("data-test-is-open"),
                      "data-test-is-open",
                    ).toBe("true");
                  },
                  { timeout: 1000 },
                );

                // Type "type2" to filter to the desired option
                await user.clear(select);
                await user.type(select, "type2");

                // Wait for filtering to complete
                await waitFor(
                  () => {
                    expect(
                      stateTracker.getAttribute("data-test-filter-text"),
                      "data-test-filter-text",
                    ).toBe("type2");
                    expect(
                      stateTracker.getAttribute("data-test-filtered-options-count"),
                      "data-test-filtered-options-count",
                    ).toBe("1");
                  },
                  { timeout: 1000 },
                );

                // Press Enter to select the option
                await user.keyboard("{Enter}");

                // Wait for selection to complete and dropdown to close
                await waitFor(
                  () => {
                    expect(
                      stateTracker.getAttribute("data-test-is-open"),
                      "data-test-is-open",
                    ).toBe("false");
                    expect(
                      stateTracker.getAttribute("data-test-selected-value"),
                      "data-test-selected-value",
                    ).toBe("type2");
                  },
                  { timeout: 2000 },
                );
              });

              // Verify that the form now shows type2 fields
              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              await waitFor(
                () => {
                  expect(screen.getAllByText("type2Attribute").length > 0).toBeTruthy();
                },
                { timeout: 5000 },
              );

              // Get final values after union form re-rendering
              const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                expect,
                undefined,
                container,
                formikFieldName("testField"),
                "after change to type2",
              );
              const testResultAfterChange = formValuesToJSON(valuesAfterChange);
              expect(testResultAfterChange).toEqual({
                testObjectType: "type2",
                type2Attribute: 0, // default value for number
              });
            },
          },
        "non-discriminated union can switch type from number to string via union type selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // Verify the star button is present but selector is initially hidden
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField"),
            );
            expect(starButton).toBeTruthy();
            expect(
              container.querySelector(
                `[data-testid="union-type-input-${formikFieldName("testField")}"]`,
              ),
            ).toBeNull();

            // Click the star to open the selector
            await act(async () => {
              fireEvent.click(starButton);
            });

            // Verify the union type selector is now present and shows the current type "number"
            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField"),
            );
            expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField"),
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              // Click to open the dropdown
              fireEvent.click(unionTypeInput);

              // Wait for dropdown to open
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 },
              );

              // Type "string" to filter to the desired option
              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "string");

              // Wait for filtering to complete
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("string");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 },
              );

              // Press Enter to select the option
              await user.keyboard("{Enter}");

              // Wait for selection to complete and dropdown to close
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("string");
                },
                { timeout: 2000 },
              );
            });

            // Verify the selector is closed after selection and value reset to default string
            await waitFor(
              () => {
                expect(
                  container.querySelector(
                    `[data-testid="union-type-input-${formikFieldName("testField")}"]`,
                  ),
                ).toBeNull();
              },
              { timeout: 3000 },
            );

            // Verify value was reset to default string
            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  [],
                  container,
                  testSectionName, //formikFieldName("testField"),
                  "after change to string",
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual({ testField: "" });
              },
              { timeout: 3000 },
            );
          },
        },
        "non-discriminated union can switch type from number to object via union type selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [
                { type: "string" },
                { type: "number" },
                { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
              ],
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // Verify the star button is present but selector is initially hidden
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField"),
            );
            expect(starButton).toBeTruthy();
            expect(
              container.querySelector(
                `[data-testid="union-type-input-${formikFieldName("testField")}"]`,
              ),
            ).toBeNull();

            // Click the star to open the selector
            await act(async () => {
              fireEvent.click(starButton);
            });

            // Verify the union type selector shows the current type "number"
            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField"),
            );
            expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField"),
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              // Click to open the dropdown
              fireEvent.click(unionTypeInput);

              // Wait for dropdown to open
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 },
              );

              // Type "object" to filter to the desired option
              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "object");

              // Wait for filtering to complete
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("object");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 },
              );

              // Press Enter to select the option
              await user.keyboard("{Enter}");

              // Wait for selection to complete
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("object");
                },
                { timeout: 2000 },
              );
            });

            // Verify value was reset to default object
            await waitFor(
              () => {
                expect(screen.getAllByText("a").length > 0).toBeTruthy();
              },
              { timeout: 5000 },
            );

            // Verify selector is closed after selection
            await waitFor(
              () => {
                expect(
                  container.querySelector(
                    `[data-testid="union-type-input-${formikFieldName("testField")}"]`,
                  ),
                ).toBeNull();
              },
              { timeout: 3000 },
            );

            const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after change to object",
            );
            const testResultAfterChange = formValuesToJSON(valuesAfterChange);
            expect(testResultAfterChange).toEqual({
              a: "",
              b: 0,
            });
          },
        },
        "union type star button is visible but selector is initially hidden": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // Star is visible
            expect(screen.getByTestId("union-type-star-" + formikFieldName("testField"))).toBeTruthy();
            // Selector is not rendered initially
            expect(
              container.querySelector(`[data-testid="union-type-input-${formikFieldName("testField")}"]`),
            ).toBeNull();
          },
        },
        "union type star button toggle shows then hides selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId("union-type-star-" + formikFieldName("testField"));

            // Click star: selector appears
            await act(async () => {
              fireEvent.click(starButton);
            });
            await waitFor(() => {
              expect(
                container.querySelector(`[data-testid="union-type-input-${formikFieldName("testField")}"]`),
              ).not.toBeNull();
            }, { timeout: 1000 });

            // Click star again: selector disappears
            await act(async () => {
              fireEvent.click(starButton);
            });
            await waitFor(() => {
              expect(
                container.querySelector(`[data-testid="union-type-input-${formikFieldName("testField")}"]`),
              ).toBeNull();
            }, { timeout: 1000 });
          },
        },
        "union type selector for object value places star and selector above the value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [
                { type: "string" },
                { type: "number" },
                { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
              ],
            },
            initialFormState: { a: "hello", b: 1 },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId("union-type-star-" + formikFieldName("testField"));

            // Open selector
            await act(async () => {
              fireEvent.click(starButton);
            });
            const selectorInput = await waitFor(() => {
              const el = container.querySelector(
                `[data-testid="union-type-input-${formikFieldName("testField")}"]`,
              );
              expect(el).not.toBeNull();
              return el!;
            }, { timeout: 1000 });

            // Star and selector are in the same flex row (star's parent contains the selector input)
            const starParent = starButton.parentElement!;
            expect(starParent.contains(selectorInput)).toBe(true);
          },
        },
      },
    },
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// BOOK
// ################################################################################################
export interface LocalBookEditorProps extends LocalEditorPropsRoot {
  // rawJzodSchema: EntityVersion | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodBookEditorTest = ReactComponentTest<JzodElementEditorProps_Test>;
export type JzodBookEditorTestSuites = ReactComponentTestSuites<JzodElementEditorProps_Test>;

export function getJzodBookEditorTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): JzodBookEditorTestSuites {
  return {
    JzodBookEditor: {
      suiteRenderComponent: componentUnderTest,
      tests: {
        "Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: entityBook.mlSchema as JzodObject,
            // rawJzodSchema: {
            //   type: "object",
            //   definition: {a:{ type: "string" }, b:{ type: "number" }},
            // },
            initialFormState: book1,
            // initialFormState: {
            //   a: "test string",
            //   b: 42,
            // },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // Pretty-print the entire rendered DOM
            // console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit

            // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "initial form state"
            );
            console.log("Extracted initial values:", values);
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "Et dans l'éternité je ne m'ennuierai pas",
              author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
              publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
              conceptLevel: "Data",
              year: 2014,
            });
            // expect(values).toEqual(book1);

            // const inputs = Array.from(document.querySelectorAll('input'));
            // console.log("=== INPUTS ===", inputs.map((input: HTMLElement) => ({
            //   name: (input as HTMLInputElement).name,
            //   value: (input as HTMLInputElement).value,
            // })));
            // const values: Record<string, any> = {};
            // inputs.forEach((input: HTMLElement) => {
            //   const index = (input as HTMLInputElement).name.replace(/^testField\./, "");
            //   values[index] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            // });
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     const inputs = screen.getAllByRole("textbox");
        //     const inputA = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "testField.a"
        //     ) as HTMLInputElement;
        //     const inputB = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "testField.b"
        //     ) as HTMLInputElement;
        //     expect(inputA).toHaveValue("test string");
        //     expect(inputB).toHaveValue(42);

        //     await act(() => {
        //       fireEvent.change(inputA, { target: { value: "new string value" } });
        //       fireEvent.change(inputB, { target: { value: 100 } });
        //     });

        //     expect(inputA).toHaveValue("new string value");
        //     expect(inputB).toHaveValue(100);
        //   },
        // }
      },
    },
  };
}
// ################################################################################################
// ENTITY DEFINITION
// ################################################################################################
export interface LocalEntityDefinitionEditorProps extends LocalEditorPropsRoot {
  // rawJzodSchema: EntityVersion | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodEntityDefinitionEditorTest = ReactComponentTest<JzodElementEditorProps_Test>;
export type JzodEntityDefinitionEditorTestSuites =
  ReactComponentTestSuites<JzodElementEditorProps_Test>;

export function getJzodEntityDefinitionEditorTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): JzodEntityDefinitionEditorTestSuites {
  return {
    JzodEntityDefinitionEditor: {
      suiteRenderComponent: componentUnderTest,
      tests: {
        "entity definition for Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: (entityDefinitionEntityDefinition as EntityVersion).mlSchema,
            initialFormState: entityBook,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              testSectionName, //formikFieldName("testField"),
              "initial form state"
            );
            // console.log("Extracted initial values:", formValues);
            const testResult = formValuesToJSON(formValues, "testField");
            console.log("Test result:", testResult);
            expect(testResult).toEqual({
              ...entityBook,
              defaultInstanceDetailsReportUuid: "Detailed information about a Book",
              // -   "defaultInstanceDetailsReportUuid": "c3503412-3d8a-43ef-a168-aa36e975e606",
              // +   "defaultInstanceDetailsReportUuid": "Detailed information about a Book",
            });
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     const inputs = screen.getAllByRole("textbox");
        //     const inputA = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "testField.a"
        //     ) as HTMLInputElement;
        //     const inputB = inputs.find(
        //       (input: HTMLElement) => (input as HTMLInputElement).name === "testField.b"
        //     ) as HTMLInputElement;
        //     expect(inputA).toHaveValue("test string");
        //     expect(inputB).toHaveValue(42);

        //     await act(() => {
        //       fireEvent.change(inputA, { target: { value: "new string value" } });
        //       fireEvent.change(inputB, { target: { value: 100 } });
        //     });

        //     expect(inputA).toHaveValue("new string value");
        //     expect(inputB).toHaveValue(100);
        //   },
        // }
      },
    },
  };
}

// ################################################################################################
// ANY EDITOR
// ################################################################################################
export function getJzodAnyEditorTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): ReactComponentTestSuites<JzodElementEditorProps_Test> {
  return {
    JzodAnyEditor: {
      suiteRenderComponent: componentUnderTest,
      tests: {
        "any type star button is visible for a string value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: "hello",
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            expect(
              screen.getByTestId("union-type-star-" + formikFieldName("testField"))
            ).toBeTruthy();
            // Selector is not rendered initially
            expect(
              container.querySelector(
                `[data-testid="union-type-input-${formikFieldName("testField")}"]`
              )
            ).toBeNull();
          },
        },
        "any type star button toggle shows then hides selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );

            // Click star: selector appears
            await act(async () => {
              fireEvent.click(starButton);
            });
            await waitFor(
              () => {
                expect(
                  container.querySelector(
                    `[data-testid="union-type-input-${formikFieldName("testField")}"]`
                  )
                ).not.toBeNull();
              },
              { timeout: 1000 }
            );

            // Click star again: selector disappears
            await act(async () => {
              fireEvent.click(starButton);
            });
            await waitFor(
              () => {
                expect(
                  container.querySelector(
                    `[data-testid="union-type-input-${formikFieldName("testField")}"]`
                  )
                ).toBeNull();
              },
              { timeout: 1000 }
            );
          },
        },
        "any type can switch from number to string via selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );
            expect(starButton).toBeTruthy();

            // Click the star to open the selector
            await act(async () => {
              fireEvent.click(starButton);
            });

            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField")
            );
            expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField")
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              fireEvent.click(unionTypeInput);
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 }
              );

              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "string");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("string");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 }
              );

              await user.keyboard("{Enter}");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("string");
                },
                { timeout: 2000 }
              );
            });

            // Verify the field now holds a string value
            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  [],
                  container,
                  testSectionName,
                  "after change to string"
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual({ testField: "" });
              },
              { timeout: 3000 }
            );
          },
        },
        "any type star button for object value places star and selector in header": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello", b: 1 },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );

            // Open selector
            await act(async () => {
              fireEvent.click(starButton);
            });
            const selectorInput = await waitFor(
              () => {
                const el = container.querySelector(
                  `[data-testid="union-type-input-${formikFieldName("testField")}"]`
                );
                expect(el).not.toBeNull();
                return el!;
              },
              { timeout: 1000 }
            );

            // Star and selector are in the same flex row (star's parent contains the selector input)
            const starParent = starButton.parentElement!;
            expect(starParent.contains(selectorInput)).toBe(true);
          },
        },
        "any type with object value shows text input for string attribute": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello" },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = (screen.getAllByRole("textbox") as HTMLInputElement[]).find(
              (el) => el.name === formikFieldName("testField.a")
            );
            expect(input).toBeTruthy();
            expect(input).toHaveValue("hello");
          },
        },
        "any type with object value shows text input for number attribute": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { b: 1 },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = (screen.getAllByRole("textbox") as HTMLInputElement[]).find(
              (el) => el.name === formikFieldName("testField.b")
            );
            expect(input).toBeTruthy();
            expect(input).toHaveValue(1);
          },
        },
        "any type can switch from number to object via selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );
            expect(starButton).toBeTruthy();

            await act(async () => {
              fireEvent.click(starButton);
            });

            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField")
            );
            expect(stateTracker.getAttribute("data-test-selected-value")).toBe("number");

            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField")
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              fireEvent.click(unionTypeInput);
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 }
              );

              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "record");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("record");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 }
              );

              await user.keyboard("{Enter}");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("record");
                },
                { timeout: 2000 }
              );
            });

            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  undefined,
                  container,
                  formikFieldName("testField"),
                  "after change to record"
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual({ a: "enter attributes here..." });
              },
              { timeout: 3000 }
            );
          },
        },
        "any type can switch from object to string via selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello", b: "world" },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );
            expect(starButton).toBeTruthy();

            await act(async () => {
              fireEvent.click(starButton);
            });

            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField")
            );
            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField")
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              fireEvent.click(unionTypeInput);
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 }
              );

              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "string");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("string");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 }
              );

              await user.keyboard("{Enter}");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("string");
                },
                { timeout: 2000 }
              );
            });

            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  [],
                  container,
                  testSectionName,
                  "after change to string"
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual({ testField: "" });
              },
              { timeout: 3000 }
            );
          },
        },
        "any type can switch from object to array via selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello" },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );
            expect(starButton).toBeTruthy();

            await act(async () => {
              fireEvent.click(starButton);
            });

            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField")
            );
            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField")
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              fireEvent.click(unionTypeInput);
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 }
              );

              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "array");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("array");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 }
              );

              await user.keyboard("{Enter}");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("array");
                },
                { timeout: 2000 }
              );
            });

            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  undefined,
                  container,
                  formikFieldName("testField"),
                  "after change to array"
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual(["enter elements here..."]);
              },
              { timeout: 3000 }
            );
          },
        },
        "any type can switch from array to string via selector": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: ["item1", "item2"],
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const starButton = screen.getByTestId(
              "union-type-star-" + formikFieldName("testField")
            );
            expect(starButton).toBeTruthy();

            await act(async () => {
              fireEvent.click(starButton);
            });

            const stateTracker = screen.getByTestId(
              "themed-select-state-union-type-" + formikFieldName("testField")
            );
            expect(stateTracker.getAttribute("data-test-selected-value")).toBe("array");

            const unionTypeInput = screen.getByTestId(
              "union-type-input-" + formikFieldName("testField")
            ) as HTMLInputElement;

            const user = userEvent.setup();

            await act(async () => {
              fireEvent.click(unionTypeInput);
              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("true");
                },
                { timeout: 1000 }
              );

              await user.clear(unionTypeInput);
              await user.type(unionTypeInput, "string");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-filter-text")).toBe("string");
                  expect(stateTracker.getAttribute("data-test-filtered-options-count")).toBe("1");
                },
                { timeout: 1000 }
              );

              await user.keyboard("{Enter}");

              await waitFor(
                () => {
                  expect(stateTracker.getAttribute("data-test-is-open")).toBe("false");
                  expect(stateTracker.getAttribute("data-test-selected-value")).toBe("string");
                },
                { timeout: 2000 }
              );
            });

            await waitFor(
              () => {
                const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
                  expect,
                  [],
                  container,
                  testSectionName,
                  "after change to string"
                );
                const testResult = formValuesToJSON(valuesAfterChange);
                expect(testResult).toEqual({ testField: "" });
              },
              { timeout: 3000 }
            );
          },
        },
        "any-typed array can be added an item": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: ["item1", "item2"],
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const addButton = screen.getByRole("button", { name: "testField.add" });
            await act(() => {
              fireEvent.click(addButton);
            });
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after add button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(["item1", "item2", ""]);
          },
        },
        "any-typed array can have an item removed": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: ["item1", "item2", "item3"],
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const deleteButton = screen.getByRole("button", {
              name: formikFieldName("testField.1-removeArrayItem"),
            });
            expect(deleteButton).toBeTruthy();
            await act(() => {
              fireEvent.click(deleteButton);
            });
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after delete button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(["item1", "item3"]);
          },
        },
        "any-typed array can have an item duplicated": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: ["item1", "item2", "item3"],
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const duplicateButton = screen.getByRole("button", {
              name: formikFieldName("testField.1-duplicateArrayItem"),
            });
            expect(duplicateButton).toBeTruthy();
            await act(() => {
              fireEvent.click(duplicateButton);
            });
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after duplicate button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(["item1", "item2", "item2", "item3"]);
          },
        },
        "any-typed object can be added an attribute (it is a record)": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello" },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const addButton = screen.getByRole("button", {
              name: formikFieldName("testField.addRecordAttribute"),
            });
            await act(() => {
              fireEvent.click(addButton);
            });
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after add button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual({ newRecordEntry: "", a: "hello" });
          },
        },
        "any-typed array can have an attribute removed (it is a record)": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: { type: "any" },
            initialFormState: { a: "hello", b: "world" },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const deleteButton = screen.getByRole("button", {
              name: formikFieldName("testField.a-removeOptionalAttributeOrRecordEntry"),
            });
            expect(deleteButton).toBeTruthy();
            await act(() => {
              fireEvent.click(deleteButton);
            });
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              formikFieldName("testField"),
              "after delete button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual({ b: "world" });
          },
        },
      },
    },
  };
}

// ################################################################################################
// PERFORMANCE TESTS
// ################################################################################################
// export interface LocalEntityDefinitionEditorProps extends LocalEditorPropsRoot{
//   // rawJzodSchema: EntityVersion | undefined;
//   rawJzodSchema: JzodObject | undefined;
// }

// export type JzodEntityDefinitionEditorTest = JzodEditorTest<LocalEntityDefinitionEditorProps>;
// export type JzodEntityDefinitionEditorTestSuites = JzodEditorTestSuites<LocalEntityDefinitionEditorProps>;

export function getJzodEditorPerformanceTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): JzodSimpleTypeEditorTestSuites {
  return {
    JzodEditorPerformanceTests: {
      suiteRenderComponent: componentUnderTest,
      // performanceTests: true,
      tests: {
        "performance string renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
              // definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: "placeholder text",
          },

          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen
              .getAllByRole("textbox")
              .filter(
                (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
              )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
          },
        },

        // "performance: entity definition for Book is displayed as json-like input fields with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: (entityDefinitionEntityDefinition as EntityVersion).mlSchema,
        //     initialFormState: entityBook
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     const formValues: Record<string, any> = extractValuesFromRenderedElements(expect,              undefined,
        //  container, "testField", "initial form state");
        //     // console.log("Extracted initial values:", values);
        //     const testResult = formValuesToJSON(formValues);
        //     expect(testResult).toEqual(entityBook);
        //   },
        // },
      },
    },
  };
}

// ################################################################################################
// ENDPOINT
// ################################################################################################
export interface LocalEndpointEditorProps extends LocalEditorPropsRoot {
  // rawJzodSchema: EntityVersion | undefined;
  rawJzodSchema: JzodElement | undefined;
}

export type JzodEndpointEditorTest = ReactComponentTest<JzodElementEditorProps_Test>;
export type JzodEndpointEditorTestSuites = ReactComponentTestSuites<JzodElementEditorProps_Test>;

export function getJzodEndpointEditorTests(
  componentUnderTest: React.FC<JzodElementEditorProps_Test>
): JzodEndpointEditorTestSuites {
  return {
    JzodEndpointEditor: {
      suiteRenderComponent: componentUnderTest,
      tests: {
        // "Application Endpoint schema renders": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: entityDefinitionEndpoint.mlSchema,
        //     initialFormState: applicationEndpointV1
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // console.log("=== FULL RENDERED DOM ===");
        //     // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
        //     const startTime = performance.now();
        //     const values: Record<string, any> = extractValuesFromRenderedElements(expect,              undefined,
        //  container, "testField", "initial form state");
        //     const endTime = performance.now();
        //     console.log(`extracting values completed in ${endTime - startTime} ms`);
        //     const formatToValuesStartTime = performance.now();
        //     const testResult = formValuesToJSON(values);
        //     const formatToValuesEndTime = performance.now();
        //     console.log(`formValuesToJSON completed in ${formatToValuesEndTime - formatToValuesStartTime} ms`);
        //     expect(testResult).toEqual(applicationEndpointV1);

        //     // Basic test to ensure the component renders without crashing
        //     expect(container).toBeInTheDocument();

        //     // Check that the form is rendered (look for any input)
        //     const inputs = container.querySelectorAll('input');
        //     expect(inputs.length).toBeGreaterThan(0);

        //     // Check that the component has the expected structure
        //     const testElement = container.querySelector('[id*="testField"]');
        //     expect(testElement).toBeInTheDocument();
        //   },
        // },
        // "Query Endpoint schema renders": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: entityDefinitionEndpoint.mlSchema,
        //     initialFormState: queryEndpointVersionV1
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // console.log("=== FULL RENDERED DOM ===");
        //     // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
        //     const startTime = performance.now();
        //     const values: Record<string, any> = extractValuesFromRenderedElements(expect,              undefined,
        //  container, "testField", "initial form state");
        //     const endTime = performance.now();
        //     console.log(`extracting values completed in ${endTime - startTime} ms`);
        //     const formatToValuesStartTime = performance.now();
        //     const testResult = formValuesToJSON(values);
        //     const formatToValuesEndTime = performance.now();
        //     console.log(`formValuesToJSON completed in ${formatToValuesEndTime - formatToValuesStartTime} ms`);
        //     expect(testResult).toEqual(queryEndpointVersionV1);

        //     // Basic test to ensure the component renders without crashing
        //     expect(container).toBeInTheDocument();

        //     // Check that the form is rendered (look for any input)
        //     const inputs = container.querySelectorAll('input');
        //     expect(inputs.length).toBeGreaterThan(0);

        //     // Check that the component has the expected structure
        //     const testElement = container.querySelector('[id*="testField"]');
        //     expect(testElement).toBeInTheDocument();
        //   },
        // },
        "createEntityAndReportFromSpreadsheetAndUpdateMenu Test schema renders": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: entityDefinitionTest.mlSchema as JzodElement,
            initialFormState: test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const startTime = performance.now();
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              undefined,
              container,
              "testField",
              "initial form state"
            );
            const endTime = performance.now();
            console.log(`extracting values completed in ${endTime - startTime} ms`);
            const formatToValuesStartTime = performance.now();
            const testResult = formValuesToJSON(values);
            const formatToValuesEndTime = performance.now();
            console.log(
              `formValuesToJSON completed in ${formatToValuesEndTime - formatToValuesStartTime} ms`
            );
            expect(testResult).toEqual(queryEndpointVersionV1);

            // Basic test to ensure the component renders without crashing
            expect(container).toBeInTheDocument();

            // Check that the form is rendered (look for any input)
            const inputs = container.querySelectorAll("input");
            expect(inputs.length).toBeGreaterThan(0);

            // Check that the component has the expected structure
            const testElement = container.querySelector('[id*="testField"]');
            expect(testElement).toBeInTheDocument();
          },
        },
      },
    },
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
const editor = JzodElementEditor as any as React.FC<JzodElementEditorProps_Test>;

const jzodElementEditorTests: Record<
  string,
  ReactComponentTestSuitePrep<any>
> = {
  JzodUnionEditor: {
    editor: getJzodElementEditorForTest(pageLabel),
    getJzodEditorTests: getJzodUnionEditorTests,
  },
  JzodAnyEditor: {
    editor: getJzodElementEditorForTest(pageLabel),
    getJzodEditorTests: getJzodAnyEditorTests,
  },
  // // // ################# PERFORMANCE
  // // JzodEditorPerformanceTests: {
  // //   editor: JzodElementEditor,
  // //   getJzodEditorTests: getJzodEditorPerformanceTests,
  // //   performanceTests: true,
  // //   // modes: '*',
  // //   // modes: ['jzodElementEditor', 'component'],
  // //   modes: 'jzodElementEditor',
  // // },
  // // ################# INSTANCES
  // // JzodBookEditor: {
  // //   editor: getJzodElementEditorForTest(pageLabel),
  // //   getJzodEditorTests: getJzodBookEditorTests,
  // //   performanceTests: true,
  // //   // modes: '*',
  // //   // modes: ['jzodElementEditor', 'component'],
  // //   modes: "jzodElementEditor",
  // // },
  // // // // ################# MODEL
  // // JzodEntityDefinitionEditor: {
  // //   editor: getJzodElementEditorForTest(pageLabel),
  // //   getJzodEditorTests: getJzodEntityDefinitionEditorTests,
  // //   // modes: '*',
  // //   // modes: ['jzodElementEditor', 'component'],
  // //   modes: "jzodElementEditor",
  // // },
  // // // ################# ENDPOINTS
  // // JzodEndpointEditor: {
  // //   editor: JzodElementEditor,
  // //   getJzodEditorTests: getJzodEndpointEditorTests,
  // //   performanceTests: true,
  // //   // modes: '*',
  // //   // modes: ['jzodElementEditor', 'component'],
  // //   modes: 'jzodElementEditor',
  // // },
};

// ##############################################################################################
describe("JzodElementEditor", () => {
  prepareAndRunTestSuites(pageLabel, jzodElementEditorTests, defaultSelfApplicationDeploymentMap);
});
