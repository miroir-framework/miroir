import { describe, it } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { ExpectStatic } from "vitest";

import '@testing-library/jest-dom';
import { Container } from "react-dom";

import {
  book1,
  EntityDefinition,
  entityDefinitionBook,
  entityDefinitionEntityDefinition,
  entityDefinitionTest,
  JzodArray,
  JzodAttributePlainDateWithValidations,
  JzodAttributePlainNumberWithValidations,
  JzodAttributePlainStringWithValidations,
  JzodElement,
  JzodEnum,
  JzodObject,
  JzodPlainAttribute,
  JzodRecord,
  JzodTuple,
  JzodUnion,
  LoggerInterface,
  MiroirLoggerFactory,
  queryEndpointVersionV1,
  test_createEntityAndReportFromSpreadsheetAndUpdateMenu
} from "miroir-core";



import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditor";
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  allTestModes,
  extractValuesFromRenderedElements,
  formValuesToJSON,
  getJzodEditorTestSuites,
  JzodEditorTest,
  JzodEditorTestSuites,
  JzodElementEditorProps_Test,
  JzodElementEditorTestSuite,
  LocalEditorPropsRoot,
  LocalLiteralEditorProps,
  ModesType,
  runJzodEditorTest,
  TestMode,
  waitAfterUserInteraction
} from "./JzodElementEditorTestTools";

// ################################################################################################
const pageLabel = "JzodElementEditor.test";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

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
// export interface LocalArrayEditorProps extends LocalEditorPropsRoot{
//   rawJzodSchema: JzodArray | JzodTuple | undefined;
// }

export type JzodArrayEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodArrayEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodArrayEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodArrayEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodArrayEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
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
      tests: {
        // TODO: there seems to be 2 labels displayed!
        "renders array input with label when label prop is provided": {
          tests: async (expect: ExpectStatic, container: Container) => {
            screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            expect(screen.getAllByText(/Test Label/).length).toBe(1); // There should be only one label, actually there are two, one for the array and one for the first item
          },
        },
        "renders all array values, in the right order": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual(arrayValues);
          },
        },
        "form state is changed when selection changes": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const cell = screen.getAllByRole("textbox").filter((input: HTMLElement) =>
              (input as HTMLInputElement).name.startsWith("testField.")
            )[1] as HTMLInputElement;
            await act(() => {
              fireEvent.change(cell, { target: { value: "new value" } });
            });
            await waitAfterUserInteraction();

            expect(cell).toContainHTML("new value");
          },
        },
        "changing order of array items when button ROOT.testField.1.up is clicked": {
          tests: async (expect, container) => {
            const upButtons = screen.getAllByRole("ROOT.testField.button.up");
            await act(() => {
              fireEvent.click(upButtons[1]); // Click the up button for the third item
            });
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual(["value2", "value1", "value3" ]);
          },
        },
        "changing order of array items when button ROOT.testField.2.up is clicked": {
          tests: async (expect, container) => {
            const upButtons = screen.getAllByRole("ROOT.testField.button.up");
            await act(() => {
              fireEvent.click(upButtons[2]); // Click the up button for the third item
            });
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual(["value1", "value3", "value2"]);
          },
        },
        "changing order of array items when button ROOT.testField.0.down is clicked": {
          tests: async (expect, container) => {
            const upButtons = screen.getAllByRole("ROOT.testField.button.down");
            await act(() => {
              fireEvent.click(upButtons[0]); // Click the up button for the third item
            });
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(values).toEqual([ "value2", "value1", "value3"]);
          },
        },
        "changing order of heteronomous object array items from union when button ROOT.testField.0.down is clicked": {
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
                  { type: "object", definition: { objectType: { type: "literal", definition:"A"}, a: { type: "string" } } },
                  { type: "object", definition: { objectType: { type: "literal", definition:"B"}, b: { type: "number" } } },
                ],
              },
            },
            initialFormState: [{ objectType: "A", a: "value1" }, { objectType: "B", b: 2 }, { objectType: "A", a: "value3" }],
          },
          tests: async (expect, container) => {
            const formValuesBeforeTest = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "before up button click"
            );
            const beforeTestResult = formValuesToJSON(formValuesBeforeTest);
            log.info(expect.getState().currentTestName, "beforeTestResult", beforeTestResult);
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            expect(beforeTestResult, "before up button click").toEqual([{ objectType: "A", a: "value1" }, { objectType: "B", b: 2 }, { objectType: "A", a: "value3" }]);

            screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            log.info(expect.getState().currentTestName, "clicking down button for first item");
            const downButtons = screen.getAllByRole("ROOT.testField.button.down");
            await act(() => {
              fireEvent.click(downButtons[0]); // Click the down button for the first item
            });
            // Wait for progressive rendering after the button click
            await waitAfterUserInteraction();
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            log.info(expect.getState().currentTestName, "clicked up button for first item done");
            const formValues = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after up button click"
            );
            const testResult = formValuesToJSON(formValues);
            log.info(expect.getState().currentTestName, "testResult", testResult);
            expect(testResult, "after up button click").toEqual([{ objectType: "B", b: 2 }, { objectType: "A", a: "value1" }, { objectType: "A", a: "value3" }]);
          },
        },
        "renders all array values of a plain 2-items tuple with a string and a number, in the right order": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "tuple", definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: ["value1", 2],
          },
          tests: async (expect, container) => {
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "initial"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(["value1", 2]);
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
            initialFormState: [["value1", 1], ["value2", 2], ["value3", 3]],
          },
          tests: async (expect, container) => {
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "initial"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual([["value1", 1], ["value2", 2], ["value3", 3]]);
          },
        },
        "add an element to a string array when button ROOT.testField.add is clicked": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const addButton = screen.getByRole("button", { name: "testField.add" });
            await act(() => {
              fireEvent.click(addButton);
            });
            // Wait for progressive rendering after the button click
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after add button click"
            );
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual([...arrayValues, ""]);
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
                  // e: { type: "bigint" },
                },
              },
            },
            initialFormState: [
              {
                a: "value1",
                b: { c: 1 },
                d: true,
                // e: 123n,
              },
              {
                a: "value2",
                b: { c: 2 },
                d: false,
                // e: 456n,
              },
            ],
          },
          tests: async (expect, container) => {
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const addButton = screen.getByRole("button", { name: "testField.add" });
            await act(() => {
              fireEvent.click(addButton);
            });
            // Wait for progressive rendering after the button click
            await waitAfterUserInteraction();
            const formValues: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after add button click"
            );
            // console.log("Extracted initial values:", values);
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual([
              {
                a: "value1",
                b: { c: 1 },
                d: true,
                // e: "123",
              },
              {
                a: "value2",
                b: { c: 2 },
                d: false,
                // e: "456",
              },
              {
                b: { c: 0 }, // default value for number
                d: false, // default value for boolean
                // e: "0", // default value for bigint
              },
            ]);
          },
        },
      },
    },
  };
};


// ################################################################################################
// ENUM
// ################################################################################################
// export interface LocalEnumEditorProps extends LocalEditorPropsRoot {
//   rawJzodSchema: JzodEnum | undefined;
// }

export type JzodEnumEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodEnumEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodEnumEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEnumEditorTestSuites {
  const enumValues = ["value1", "value2", "value3"];
  return {
    JzodEnumEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
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
      tests: {
        // TODO: there seems to be 2 labels displayed!
        "renders enum input with label when label prop is provided": {
          tests: async (expect: ExpectStatic, container: Container) => {
            // expect(screen.getByText(/Test Label/)).toBeInTheDocument();
            expect(screen.getAllByText(/Test Label/).length).toBe(1); // There should be only one label, actually there are two, one for the enum and one for the select
          },
        },
        "renders input without label when label prop is not provided": {
          props: {
            // label: "Test Label", // no label
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
          tests: async (expect, container) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            // expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "renders select with correct value": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial");
            console.log("########### ENUM VALUES", values);
            // console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit

            expect(values).toEqual({
              "testField": "value2",
            });
          },
        },
        "renders all enum options": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const combobox = screen.getByRole("combobox");
            const valuesInitial: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial", false);
            expect(valuesInitial).toEqual({
              "testField": "value2",
            });
            await act(() => {
              fireEvent.click(combobox);
            });
            // Wait for progressive rendering after the button click
            await waitAfterUserInteraction();
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const valuesAfterClick: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "after click", true);
            // Merge initial values with values after click to preserve the selected value and get the options
            const valuesListDisplayed = { ...valuesAfterClick };
            // Preserve the original selected value from before the dropdown opened
            if (valuesInitial.testField && !valuesAfterClick.testField) {
              valuesListDisplayed.testField = valuesInitial.testField;
            }
            expect(valuesListDisplayed).toEqual({
              "testField": "value2",
              "testField.options": ["value1", "value2", "value3"],
            });
          },
        },
        "form state is changed when selection changes": {
          tests: async (expect: ExpectStatic, container: Container) => {
            const select = screen.getByRole("combobox") as HTMLSelectElement;
            expect(select.value).toBe("value2"); // initial value
            
            await act(() => {
              fireEvent.change(select, { target: { value: "value3" } });
            });
            await waitAfterUserInteraction();
            
            const valuesFinal: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after selection change"
            );
            expect(valuesFinal).toEqual({
              "testField": "value3",
            });
          },
        },
      },
    },
  };
};

// ################################################################################################
// LITERAL
// ################################################################################################

export type JzodLiteralEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodLiteralEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

// ################################################################################################
export function getJzodLiteralEditorTests(
  jzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodLiteralEditorTestSuites {
  return {
    "JzodLiteralEditor": {
      suiteRenderComponent: {
        renderAsJzodElementEditor: jzodElementEditor
      },
      suiteProps: {
        name: "testField",
        listKey: "root.testField",
        rootLessListKey: "testField",
        rootLessListKeyArray: ["testField"],
        initialFormState: "test-value",
        label: "Test Label",
      } as JzodElementEditorProps_Test,
      // } as LocalLiteralEditorProps,
      tests: {
        "renders Literal input with label when label prop is provided": {
          jzodElementEditorProps: (props: JzodElementEditorProps_Test) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: async (expect, container) => {
            // expect(screen.getByText(/Test Label/)).toBeInTheDocument();
            expect(screen.getAllByText(/Test Label/).length).toBe(1); // There should be only one label, actually there are two, one for the literal and one for the input
            expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
          // tests: {
          //   testAsComponent: async (expect) => {
          //     expect(screen.getByText(/Test Label/)).toBeInTheDocument();
          //     // expect(screen.getByRole("textbox")).toHaveAttribute("name", "testField"); // TODO: this is implementation detail, should be removed
          //   },
          //   testAsJzodElementEditor: async (expect) => {
          //     expect(screen.getByText(/Test Label/)).toBeInTheDocument();
          //   },
          // },
        },
        "renders Literal input without label when label prop is not provided": {
          props: {
            name: "testField",
            listKey: "root.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            initialFormState: "test-value",
            // label: "Test Label", // no label
          } as JzodElementEditorProps_Test,
          // jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
          jzodElementEditorProps: (props: JzodElementEditorProps_Test) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: async (expect, container) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "setting new value": {
          // jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
          jzodElementEditorProps: (props: JzodElementEditorProps_Test) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
            tests: async (expect, container) => {
              expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
              const input = screen.getByDisplayValue("test-value");
              await act(() => {
                console.log("##################### ACTION", );
                fireEvent.change(input, { target: { value: "new value" } }) // React testing library does not throw error on editing disabled textbox, so we simulate it
              });
              await waitAfterUserInteraction();
              expect(screen.getByDisplayValue(/test-value/)).toBeInTheDocument(); // value has not changed, because it is a literal
            }
        },
      }
    }
  };
};

// ################################################################################################
// OBJECT
// ################################################################################################
export interface LocalObjectEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodObject | JzodRecord | undefined;
}

export type JzodObjectEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodObjectEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodObjectEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodObjectEditorTestSuites {
  return {
    JzodObjectEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        "object renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: { a: { type: "string" }, b: { type: "number" } },
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            // screen.logTestingPlaygroundURL();
            // const inputs = Array.from(container.querySelector("input")).filter((input: HTMLElement) =>
            //   (input as HTMLInputElement).name.startsWith("testField.")
            // );
            // const inputs = container.querySelectorAll("input[name^='testField.']") as NodeListOf<HTMLInputElement>;
            // const values: Record<string, any> = {};
            // inputs.forEach((input: HTMLElement) => {
            //   const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
            //   values[name] =
            //     (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            // });
            const values = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after delete button click"
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({ a: "test string", b: 42 });
          },
        },
        "object with bigint attribute renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: { e: { type: "bigint" } },
            },
            initialFormState: {
              e: 123n,
              // e: 123,
              // e: "123",
            },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const values = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "initial"
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({ e: "123" });
          },
        },
        "object can be updated through displayed input fields": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: { a: { type: "string" }, b: { type: "number" } },
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const inputs = screen.getAllByTestId("miroirInput");
            // console.log("########### OBJECT INPUTS", inputs.map(e => e.outerHTML));
            const inputA = inputs.find(
              (input: HTMLElement) => (input as HTMLInputElement).name === "testField.a"
            ) as HTMLInputElement;
            const inputB = inputs.find(
              (input: HTMLElement) => (input as HTMLInputElement).name === "testField.b"
            ) as HTMLInputElement;
            expect(inputA).toHaveValue("test string");
            expect(inputB).toHaveValue(42);

            await act(() => {
              fireEvent.change(inputA, { target: { value: "new string value" } });
              fireEvent.change(inputB, { target: { value: 100 } });
            });
            await waitAfterUserInteraction();
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after change"
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              a: "new string value",
              b: 100,
            });
          },
        },
        "object with optional attributes can receive a value for an optional attribute by clicking on the add button for the attribute":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
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
            tests: async (expect: ExpectStatic, container: Container) => {
              const addButton = screen.getByRole("button", {
                name: "testField.addObjectOptionalAttribute.a",
              });
              await act(() => {
                fireEvent.click(addButton);
              });
              // Wait for progressive rendering after the button click
              await waitAfterUserInteraction();
              
              // expect(screen.getByLabelText("AAAAAAAAAAAAAAAAAAAA")).toBeInTheDocument();
              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              const screenValues: Record<string, any> = extractValuesFromRenderedElements(
                expect,
                container,
                "testField",
                "after add button click"
              );
              const testResult = formValuesToJSON(screenValues);
              expect(testResult).toEqual({
                a: "",
                b: 42,
              });
            },
          },
        "object with 2 optional attributes can have the only attribute value deleted by clicking on the delete button":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
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
            tests: async (expect, container) => {
              const deleteButton = screen.getByRole("button", {
                name: "testField.a-removeOptionalAttributeOrRecordEntry",
              });
              await act(() => {
                fireEvent.click(deleteButton);
              });
              // Wait for progressive rendering after the delete button click
              await waitAfterUserInteraction();
              
              const screenValues = extractValuesFromRenderedElements(
                expect,
                container,
                "testField",
                "after delete button click"
              );
              const testResult = formValuesToJSON(screenValues);
              expect(testResult).toEqual({});
            },
          },
        "object with 3 optional attributes can have the value for the second attribute deleted by clicking on the delete button":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
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
            tests: async (expect, container) => {
              const deleteButton = screen.getByRole("button", {
                name: "testField.b-removeOptionalAttributeOrRecordEntry",
              });
              await act(() => {
                fireEvent.click(deleteButton);
              });
              // Wait for progressive rendering after the delete button click
              await waitAfterUserInteraction();
              
              const screenValues = extractValuesFromRenderedElements(
                expect,
                container,
                "testField",
                "after delete button click"
              );
              const testResult = formValuesToJSON(screenValues);
              expect(testResult).toEqual({
                a: "test string",
                c: true,
              });
            },
          },
        "record renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "record",
              definition: {
                type: "object",
                definition: { a: { type: "string" }, b: { type: "number" } },
              },
            },
            initialFormState: {
              firstRecord: {
                a: "test string",
                b: 42,
              },
            },
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            const values: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "initial"
            );
            expect(values).toEqual({
              // "firstRecordName": "firstRecord",
              "firstRecord.a": "test string",
              "firstRecord.b": 42,
            });
          },
        },
        "record can receive a new record attribute with the proper default value when clicking on the add button":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
              rawJzodSchema: {
                type: "record",
                definition: {
                  type: "object",
                  definition: { a: { type: "string" }, b: { type: "number" } },
                },
              },
              initialFormState: {
                firstRecord: {
                  a: "test string",
                  b: 42,
                },
              },
            },
            tests: async (expect, container) => {
              const addButton = screen.getByRole("button", {
                name: "testField.addRecordAttribute",
              });
              await act(() => {
                fireEvent.click(addButton);
              });
              await waitAfterUserInteraction();
              const values = extractValuesFromRenderedElements(
                expect,
                container,
                "testField",
                "after add button click"
              );
              const testResult = formValuesToJSON(values);
              expect(testResult).toEqual({
                firstRecord: {
                  a: "test string",
                  b: 42,
                },
                newRecordEntry: {
                  a: "",
                  b: 0, // default value for number
                },
              });
              // expect(values).toEqual({
              //   "newRecordEntry.a": "",
              //   "newRecordEntry.b": 0,
              //   "firstRecord.a": "test string",
              //   "firstRecord.b": 42,
              // });
            },
          },
        "record can rename a record attribute keeping the existing value when clicking on the attribute input field":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
              rawJzodSchema: {
                type: "record",
                definition: {
                  type: "object",
                  definition: { a: { type: "string" }, b: { type: "number" } },
                },
              },
              initialFormState: {
                firstRecord: {
                  a: "test string",
                  b: 42,
                },
              },
            },
            tests: async (expect, container) => {
              // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
              // console.log("=== FULL RENDERED DOM ===");
              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              const input = screen.getByRole("textbox", {
                name: "meta-testField.firstRecord-NAME",
              }) as HTMLInputElement;
              expect(input).toBeInTheDocument();
              expect(input).toHaveValue("firstRecord");
              await act(() => {
                fireEvent.change(input, { target: { value: "renamedRecord" } });
              });
              await act(() => {
                fireEvent.blur(input); // Simulate blur to trigger validation and state update
              });
              await waitAfterUserInteraction();
              expect(input).toHaveValue("renamedRecord");
              const values = extractValuesFromRenderedElements(expect, container, "testField", "after rename");
              const testResult = formValuesToJSON(values);
              expect(testResult).toEqual({
                renamedRecord: {
                  a: "test string",
                  b: 42,
                },
              });
            },
          },
        "record with 1 entry can have the entry deleted when clicking on the delete button": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "record",
              definition: {
                type: "object",
                definition: { a: { type: "string" }, b: { type: "number" } },
              },
            },
            initialFormState: {
              firstRecord: {
                a: "test string",
                b: 42,
              },
            },
          },
          tests: async (expect, container) => {
            const deleteButton = screen.getByRole("button", {
              name: "testField.firstRecord-removeOptionalAttributeOrRecordEntry",
            });
            expect(deleteButton).toBeInTheDocument();
            await act(() => {
              fireEvent.click(deleteButton);
            });
            const values = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after delete button click"
            );
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({});
          },
        },
        "record with 3 items can have the second record item deleted when clicking on the second delete button":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLessListKey: "testField",
              rootLessListKeyArray: ["testField"],
              rawJzodSchema: {
                type: "record",
                definition: {
                  type: "object",
                  definition: { a: { type: "string" }, b: { type: "number" } },
                },
              },
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
            tests: async (expect, container) => {
              // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
              // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
              const deleteButton = screen.getByRole("button", {
                name: "testField.secondRecord-removeOptionalAttributeOrRecordEntry",
              });
              expect(deleteButton).toBeInTheDocument();
              await act(() => {
                fireEvent.click(deleteButton);
              });
              const values = extractValuesFromRenderedElements(
                expect,
                container,
                "testField",
                "after delete button click"
              );
              const testResult = formValuesToJSON(values);
              expect(testResult).toEqual({
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
      },
    },
  };
};


// ################################################################################################
// SIMPLE TYPES
// ################################################################################################
export type JzodSimpleTypes =
  | JzodPlainAttribute
  | JzodAttributePlainDateWithValidations
  | JzodAttributePlainNumberWithValidations
  | JzodAttributePlainStringWithValidations;
export interface LocalSimpleTypeEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodSimpleTypes | undefined;
}

export type JzodSimpleTypeEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodSimpleTypeEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodSimpleTypeEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodSimpleTypeEditorTestSuites {
  // const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodSimpleTypeEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        "string renders input with proper value": {
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
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
          },
        },
        "string allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
            },
            initialFormState: "placeholder text",
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
            await act(() => {
              fireEvent.change(input, { target: { value: "new text" } });
            });
            await waitAfterUserInteraction();
            expect(input).toHaveValue("new text");
          },
        },
        "string allows to modify input value with consistent update then submit form": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
            },
            initialFormState: "placeholder text",
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
            await act(() => {
              fireEvent.change(input, { target: { value: "new text" } });
            });
            await waitAfterUserInteraction();
            expect(input).toHaveValue("new text");
            // Simulate form submission
            const submit = screen.getByRole("form");
            await act(() => {
              fireEvent.submit(submit);
            });
          },
        },
        "number renders input with proper value": { // TODO: test for nullable / optional scenario
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "number",
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAA/)).toBeInTheDocument();
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const input = screen.getAllByDisplayValue(42).filter(
              (el: HTMLElement) => (el as HTMLInputElement).id === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
          },
        },
        "number allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "number",
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByDisplayValue(42).filter(
              (el: HTMLElement) => (el as HTMLInputElement).id === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
            await act(() => {
              fireEvent.change(input, { target: { value: 100 } });
            });
            await waitAfterUserInteraction();
            expect(input).toHaveValue(100);
          },
        },
        "uuid renders input with proper value": { // TODO: test for nullable / optional scenario
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "c8e2cc98-b0ec-426a-8be0-2d526039f85a",
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("c8e2cc98-b0ec-426a-8be0-2d526039f85a");
          },
        },
        "uuid allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "c8e2cc98-b0ec-426a-8be0-2d526039f85a",
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("c8e2cc98-b0ec-426a-8be0-2d526039f85a");
            await act(() => {
              fireEvent.change(input, { target: { value: "3c659c65-35f4-40e5-acf3-28115f35affa" } });
            });
            await waitAfterUserInteraction();
            expect(input).toHaveValue("3c659c65-35f4-40e5-acf3-28115f35affa");
          },
        },
        "boolean renders checkbox with proper value true": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: true,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial");
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              "testField": true,
            });
          },
        },
        "boolean renders checkbox with proper value false": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: false,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial");
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              "testField": false,
            });
            expect(values).toEqual({
              "testField": false,
            });
          },
        },
        "boolean allows to modify checkbox value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: true,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const checkbox = screen.getAllByRole("checkbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toBeChecked();
            await act(() => {
              fireEvent.click(checkbox);
            });
            await waitAfterUserInteraction();
            expect(checkbox).not.toBeChecked();
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "after change");
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({  
              "testField": false,
            });
          },
        },
        "bigint renders input with proper bigint value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: BigInt("12345678901234567890"),
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("12345678901234567890");
          },
        },
        // "bigint renders input with proper bigint value as number": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "bigint",
        //     },
        //     initialFormState: 1234n, // string representation of bigint
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     const input = screen.getAllByRole("textbox").filter(
        //       (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
        //     )[0] as HTMLInputElement;
        //     expect(input).toBeInTheDocument();
        //     expect(input).toHaveValue("1234");
        //   },
        // },
        "bigint allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: 12345678901234567890n,
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const input = screen.getAllByRole("textbox").filter(
              (el: HTMLElement) => (el as HTMLInputElement).name === "testField"
            )[0] as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("12345678901234567890");
            await act(() => {
              fireEvent.change(input, { target: { value: 98765432109876543210n } });
            });
            await waitAfterUserInteraction();
            expect(input).toHaveValue("98765432109876543210");
          },
        },
      },
    },
  };
};

// ################################################################################################
// UNION
// ################################################################################################
export interface LocalUnionEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodUnion | undefined;
}

export type JzodUnionEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodUnionEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodUnionEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodUnionEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodUnionEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        // "union between simple types renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [{ type: "string" }, { type: "number" }],
        //     },
        //     initialFormState: 42,
        //   },

        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // const input = screen.getByRole("textbox");
        //     // expect(input).toBeInTheDocument();
        //     // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
        //     const values: Record<string, any> = extractValuesFromRenderedElements(
        //       expect,
        //       container,
        //       "testField",
        //       "initial form state"
        //     );
        //     const testResult = formValuesToJSON(values);
        //     expect(testResult).toEqual({"testField": 42});
        //   },
        // },
        // "union between simple type and object for value of simple type renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [
        //         { type: "string" },
        //         { type: "number" },
        //         { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
        //       ],
        //     },
        //     initialFormState: 42,
        //   },

        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // const input = screen.getByRole("textbox");
        //     // expect(input).toBeInTheDocument();
        //     const values: Record<string, any> = extractValuesFromRenderedElements(
        //       expect,
        //       container,
        //       "testField",
        //       "initial form state"
        //     );
        //     const testResult = formValuesToJSON(values);
        //     expect(testResult).toEqual({testField: 42});
        //   },
        // },
        // "union between simple type and object for value object renders input with proper value": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "union",
        //       definition: [
        //         { type: "string" },
        //         { type: "number" },
        //         { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
        //       ],
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },

        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // const inputs = screen.getAllByRole("textbox");
        //     // const values: Record<string, any> = {};
        //     // inputs.forEach((input: HTMLElement) => {
        //     //   const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
        //     //   values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
        //     // });
        //     const values: Record<string, any> = extractValuesFromRenderedElements(
        //       expect,
        //       container,
        //       "testField",
        //       "initial form state"
        //     );
        //     const testResult = formValuesToJSON(values);
        //     expect(testResult).toEqual({ a: "test string", b: 42 });
        //   },
        // },
        "union between 2 object types with a discriminator for value object renders input following the proper value type": {
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
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type1" }, type1Attribute: { type: "string" } } },
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type2" }, type2Attribute: { type: "number" } } },
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
              container,
              "testField",
              "initial form state"
            );
            expect(values).toEqual({ type1Attribute: "test string", "testObjectType": "type1" });
            
            // Find the discriminator select element and state tracker
            const user = userEvent.setup();
            const select = screen.getByDisplayValue("type1") as HTMLSelectElement;
            const stateTracker = screen.getByTestId("themed-select-state-testObjectType");
            
            expect(select.value).toBe("type1"); // initial value
            expect(stateTracker.getAttribute("data-test-selected-value"), "data-test-selected-value").toBe("type1");
            expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("false");
            
            // Change the discriminator from "type1" to "type2"
            await act(async () => {
              // Click to open the dropdown
              fireEvent.click(select);
              
              // Wait for dropdown to open
              await waitFor(() => {
                expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("true");
              }, { timeout: 1000 });
              
              // Type "type2" to filter to the desired option
              await user.clear(select);
              await user.type(select, "type2");
              
              // Wait for filtering to complete
              await waitFor(() => {
                expect(stateTracker.getAttribute("data-test-filter-text"), "data-test-filter-text").toBe("type2");
                expect(stateTracker.getAttribute("data-test-filtered-options-count"), "data-test-filtered-options-count").toBe("1");
              }, { timeout: 1000 });
              
              // Press Enter to select the option
              await user.keyboard('{Enter}');
              
              // Wait for selection to complete and dropdown to close
              await waitFor(() => {
                expect(stateTracker.getAttribute("data-test-is-open"), "data-test-is-open").toBe("false");
                expect(stateTracker.getAttribute("data-test-selected-value"), "data-test-selected-value").toBe("type2");
              }, { timeout: 2000 });
            });
            
            // Verify that the form now shows type2 fields
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            await waitFor(() => {
              expect(screen.getAllByText("type2Attribute").length > 0).toBeTruthy();
            }, { timeout: 5000 });

            // Get final values after union form re-rendering
            const valuesAfterChange: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              container,
              "testField",
              "after change to type2"
            );
            const testResultAfterChange = formValuesToJSON(valuesAfterChange);
            expect(testResultAfterChange).toEqual({
              "testObjectType": "type2",
              "type2Attribute": 0, // default value for number
            });
          },
        },
      },
    },
  };
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// BOOK
// ################################################################################################
export interface LocalBookEditorProps extends LocalEditorPropsRoot{
  // rawJzodSchema: EntityDefinition | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodBookEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodBookEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodBookEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodBookEditorTestSuites {
  return {
    JzodBookEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        "Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: entityDefinitionBook.jzodSchema,
            // rawJzodSchema: {
            //   type: "object",
            //   definition: {a:{ type: "string" }, b:{ type: "number" }},
            // },
            initialFormState: book1
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
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
            // console.log("Extracted initial values:", values);
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
              parentName: "Book",
              parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
              name: "Et dans l'éternité je ne m'ennuierai pas",
              author: "Paul Veyne",
              publisher: "Folio",
              conceptLevel: "Data",
              "year": 2014,
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
};
// ################################################################################################
// ENTITY DEFINITION
// ################################################################################################
export interface LocalEntityDefinitionEditorProps extends LocalEditorPropsRoot{
  // rawJzodSchema: EntityDefinition | undefined;
  rawJzodSchema: JzodObject | undefined;
}

export type JzodEntityDefinitionEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodEntityDefinitionEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodEntityDefinitionEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEntityDefinitionEditorTestSuites {
  return {
    JzodEntityDefinitionEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        "entity definition for Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLessListKey: "testField",
            rootLessListKeyArray: ["testField"],
            rawJzodSchema: (entityDefinitionEntityDefinition as EntityDefinition).jzodSchema,
            initialFormState: entityDefinitionBook
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            const formValues: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
            // console.log("Extracted initial values:", formValues);
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual({
              ...entityDefinitionBook,
              "defaultInstanceDetailsReportUuid": "Detailed information about a Book"
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
};

// ################################################################################################
// PERFORMANCE TESTS
// ################################################################################################
// export interface LocalEntityDefinitionEditorProps extends LocalEditorPropsRoot{
//   // rawJzodSchema: EntityDefinition | undefined;
//   rawJzodSchema: JzodObject | undefined;
// }

// export type JzodEntityDefinitionEditorTest = JzodEditorTest<LocalEntityDefinitionEditorProps>;
// export type JzodEntityDefinitionEditorTestSuites = JzodEditorTestSuites<LocalEntityDefinitionEditorProps>;

export function getJzodEditorPerformanceTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodSimpleTypeEditorTestSuites {
  return {
    JzodEditorPerformanceTests: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
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
            const input = screen.getAllByRole("textbox").filter(
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
        //     rawJzodSchema: (entityDefinitionEntityDefinition as EntityDefinition).jzodSchema,
        //     initialFormState: entityDefinitionBook
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     const formValues: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
        //     // console.log("Extracted initial values:", values);
        //     const testResult = formValuesToJSON(formValues);
        //     expect(testResult).toEqual(entityDefinitionBook);
        //   },
        // },
      },
    },
  };
};

// ################################################################################################
// ENDPOINT
// ################################################################################################
export interface LocalEndpointEditorProps extends LocalEditorPropsRoot{
  // rawJzodSchema: EntityDefinition | undefined;
  rawJzodSchema: JzodElement | undefined;
}

export type JzodEndpointEditorTest = JzodEditorTest<JzodElementEditorProps_Test>;
export type JzodEndpointEditorTestSuites = JzodEditorTestSuites<JzodElementEditorProps_Test>;

export function getJzodEndpointEditorTests(
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEndpointEditorTestSuites {
  return {
    JzodEndpointEditor: {
      suiteRenderComponent: {
        renderAsJzodElementEditor,
      },
      tests: {
        // "Application Endpoint schema renders": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLessListKey: "testField",
        //     rootLessListKeyArray: ["testField"],
        //     rawJzodSchema: entityDefinitionEndpoint.jzodSchema,
        //     initialFormState: applicationEndpointV1
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // console.log("=== FULL RENDERED DOM ===");
        //     // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
        //     const startTime = performance.now();
        //     const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
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
        //     rawJzodSchema: entityDefinitionEndpoint.jzodSchema,
        //     initialFormState: queryEndpointVersionV1
        //   },
        //   tests: async (expect: ExpectStatic, container: Container) => {
        //     // console.log("=== FULL RENDERED DOM ===");
        //     // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
        //     const startTime = performance.now();
        //     const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
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
            rawJzodSchema: entityDefinitionTest.jzodSchema,
            initialFormState: test_createEntityAndReportFromSpreadsheetAndUpdateMenu
          },
          tests: async (expect: ExpectStatic, container: Container) => {
            console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const startTime = performance.now();
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, container, "testField", "initial form state");
            const endTime = performance.now();
            console.log(`extracting values completed in ${endTime - startTime} ms`);
            const formatToValuesStartTime = performance.now();
            const testResult = formValuesToJSON(values);
            const formatToValuesEndTime = performance.now();
            console.log(`formValuesToJSON completed in ${formatToValuesEndTime - formatToValuesStartTime} ms`);
            expect(testResult).toEqual(queryEndpointVersionV1);

            // Basic test to ensure the component renders without crashing
            expect(container).toBeInTheDocument();
            
            // Check that the form is rendered (look for any input)
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
            
            // Check that the component has the expected structure
            const testElement = container.querySelector('[id*="testField"]');
            expect(testElement).toBeInTheDocument();
          },
        },
      },
    },
  };
};

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
  JzodElementEditorTestSuite<any> & { modes?: ModesType }
> = {
  JzodArrayEditor: { 
    editor, 
    getJzodEditorTests: getJzodArrayEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodEnumEditor: {
    editor,
    getJzodEditorTests: getJzodEnumEditorTests,
    // modes: '*',
    modes: "jzodElementEditor",
    // modes: "component",
  },
  JzodLiteralEditor: { 
    editor, 
    getJzodEditorTests: getJzodLiteralEditorTests,
    // modes: "*",
    // modes: ['jzodElementEditor', 'component'],
    modes: "jzodElementEditor",
    // modes: "component",
  },
  JzodObjectEditor: { 
    editor, 
    getJzodEditorTests: getJzodObjectEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodSimpleTypeEditor: { 
    editor, 
    getJzodEditorTests: getJzodSimpleTypeEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodUnionEditor: { 
    editor, 
    getJzodEditorTests: getJzodUnionEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  // // ################# PERFORMANCE
  // JzodEditorPerformanceTests: {
  //   editor: JzodElementEditor,
  //   getJzodEditorTests: getJzodEditorPerformanceTests,
  //   performanceTests: true,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  // ################# INSTANCES
  JzodBookEditor: { 
    editor, 
    getJzodEditorTests: getJzodBookEditorTests,
    performanceTests: true,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  // // ################# MODEL
  JzodEntityDefinitionEditor: { 
    editor, 
    getJzodEditorTests: getJzodEntityDefinitionEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  // // ################# ENDPOINTS
  // JzodEndpointEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodEndpointEditorTests,
  //   performanceTests: true,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
};

// ##############################################################################################
describe("JzodElementEditor", () => {
  Object.entries(jzodElementEditorTests).forEach(([editorName, testSuite]) => {
    const suites: JzodEditorTestSuites<LocalEditorPropsRoot> = getJzodEditorTestSuites(
      pageLabel,
      testSuite.editor,
      testSuite.getJzodEditorTests,
      testSuite.performanceTests
    );
    let modes: TestMode[];
    if (testSuite.modes === undefined) {
      modes = allTestModes;
    } else if (Array.isArray(testSuite.modes)) {
      modes = testSuite.modes;
    } else if (testSuite.modes === '*') {
      // If the mode is '*', we run all test modes
      modes = allTestModes;
    } else {
      modes = [testSuite.modes];
    }

    console.log(`Running tests for ${editorName} with ${Object.keys(suites).length} suites and modes: ${modes.join(', ')}`);
    // console.log(`Test suites: ${JSON.stringify(suites, null, 2)}`);
    // Run all testcases for the first mode, then all for the second, etc.
    modes.forEach((mode: TestMode) => {
      console.log(`Running tests for ${editorName} in mode: ${mode}`);
      Object.entries(suites[editorName].tests).forEach(([testName, testCase]) => {
        console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
        it(`${editorName} - ${mode} - ${testName}`, async () => {
          console.log(`Running test: ${editorName} - ${mode} - ${testName}`);
          await runJzodEditorTest(testCase, suites[editorName], testName, mode);
          console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
        });
        console.log(`Completed test: ${editorName} - ${mode} - ${testName}`);
      });
      console.log(`Completed all tests for ${editorName} in mode: ${mode}`);
    });
  });
});