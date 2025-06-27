import { describe, it } from "vitest";

import { act, fireEvent, screen } from "@testing-library/react";
import { ExpectStatic } from "vitest";

import '@testing-library/jest-dom';

import {
  JzodArray,
  JzodEnum,
  JzodPlainAttribute,
  LoggerInterface, MiroirLoggerFactory
} from "miroir-core";
import { JzodArrayEditor } from "../../src/miroir-fwk/4_view/components/JzodArrayEditor";
import { JzodElementEditor } from "../../src/miroir-fwk/4_view/components/JzodElementEditor";
import { JzodEnumEditor } from "../../src/miroir-fwk/4_view/components/JzodEnumEditor";
import { JzodLiteralEditor } from "../../src/miroir-fwk/4_view/components/JzodLiteralEditor";
import { cleanLevel, packageName } from "../3_controllers/constants";
import {
  extractValuesFromRenderedElements,
  formValuesToJSON,
  getJzodEditorTestSuites,
  JzodEditorTest,
  JzodEditorTestSuites,
  JzodElementEditorProps_Test,
  LocalEditorPropsRoot,
  LocalLiteralEditorProps,
  runJzodEditorTest
} from "./JzodElementEditorTestTools";


import {
  book1,
  EntityDefinition,
  entityDefinitionBook,
  entityDefinitionEntityDefinition,
  JzodAttributePlainDateWithValidations,
  JzodAttributePlainNumberWithValidations,
  JzodAttributePlainStringWithValidations,
  JzodObject,
  JzodRecord,
  JzodTuple,
  JzodUnion
} from "miroir-core";

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
export interface LocalArrayEditorProps extends LocalEditorPropsRoot{
  rawJzodSchema: JzodArray | JzodTuple | undefined;
}

export type JzodArrayEditorTest = JzodEditorTest<LocalArrayEditorProps>;
export type JzodArrayEditorTestSuites = JzodEditorTestSuites<LocalArrayEditorProps>;

export function getJzodArrayEditorTests(
  LocalEditor: React.FC<LocalArrayEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodArrayEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodArrayEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      suiteProps: {
        label: "Test Label",
        name: "testField",
        listKey: "ROOT.testField",
        rootLesslistKey: "testField",
        rootLesslistKeyArray: ["testField"],
        rawJzodSchema: {
          type: "array",
          definition: { type: "string" },
        },
        initialFormState: arrayValues,
      },
      tests: {
        "renders input with label when label prop is provided": {
          tests: async (expect: ExpectStatic) => {
            expect(screen.getByText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders all array values, in the right order": {
          tests: async (expect: ExpectStatic) => {
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
          tests: async (expect: ExpectStatic) => {
            const cell = screen.getAllByRole("textbox").filter((input: HTMLElement) =>
              (input as HTMLInputElement).name.startsWith("testField.")
            )[1] as HTMLInputElement;
            await act(() => {
              fireEvent.change(cell, { target: { value: "new value" } });
            });
            expect(cell).toContainHTML("new value");
          },
        },
        "changing order of array items when button ROOT.testField.2.up is clicked": {
          tests: async (expect) => {
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
        "renders all array values of a plain 2-items tuple with a string and a number, in the right order": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "tuple", definition: [{ type: "string" }, { type: "number" }],
            },
            // initialFormState: [["value1", 1], ["value2", 2], ["value3", 3]],
            initialFormState: ["value1", 2],
          },
          tests: async (expect) => {
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );

            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            expect(cells.length).toBe(2);
            expect(values.length).toBe(2);
            expect(values).toEqual(["value1", "2"]);
          },
        },
        "renders all array values of a tuple inside an array, in the right order": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "array",
              definition: { type: "tuple", definition: [{ type: "string" }, { type: "number" }] },
            },
            initialFormState: [["value1", 1], ["value2", 2], ["value3", 3]],
          },
          tests: async (expect) => {
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            const expectedValues = [["value1", "1"], ["value2", "2"], ["value3", "3"]]; // value of textbox is a string, even when type=number
            expect(values).toEqual(expectedValues.flat()); // Flatten the expected values for comparison
          },
        },
        "add an element to a string array when button ROOT.testField.add is clicked": {
          tests: async (expect: ExpectStatic) => {
            const addButton = screen.getByRole("button", { name: "testField.add" });
            await act(() => {
              fireEvent.click(addButton);
            });
            const cells = screen
              .getAllByRole("textbox")
              .filter((input: HTMLElement) =>
                (input as HTMLInputElement).name.startsWith("testField.")
              );
            const values = cells.map((cell) => (cell as HTMLInputElement).value);
            // expect(screen.getByLabelText(/Test LabelAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            expect(values).toEqual([...arrayValues, ""]); // New empty string added
          },
        },
        "add an element to an object array when button ROOT.testField.add is clicked": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  a: { type: "string", optional: true },
                  b: { type: "object", definition: { c: { type: "number" } } },
                  d: { type: "boolean" },
                  e: { type: "bigint" },
                },
              },
            },
            initialFormState: [
              { 
                a: "value1", 
                b: { c: 1 }, 
                d: true, 
                e: 123n
              },
              { 
                a: "value2",
                b: { c: 2 },
                d: false, 
                e: 456n
              },
            ],
          },
          tests: async (expect) => {
            screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const addButton = screen.getByRole("button", { name: "testField.add" });
            await act(() => {
              fireEvent.click(addButton);
            });
            const formValues: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "after add button click");
            // console.log("Extracted initial values:", values);
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(
              [
                {
                  a: "value1",
                  b: { c: 1 },
                  d: true,
                  e: "123",
                },
                {
                  a: "value2",
                  b: { c: 2 },
                  d: false,
                  e: "456",
                },
                {
                  b: { c: 0 }, // default value for number
                  d: false, // default value for boolean
                  e: "0", // default value for bigint
                }
              ]
            );
            expect(formValues).toEqual({
              "0.a": "value1",
              "0.b.c": 1,
              "0.d": true,
              "0.e": "123",
              // 
              "1.a": "value2",
              "1.b.c": 2,
              "1.d": false,
              "1.e": "456",
              // 
              "2.b.c": 0,
              "2.d": false,
              "2.e": "0",
            });
          },
        },
      },
    },
  };
};


// ################################################################################################
// ENUM
// ################################################################################################
export interface LocalEnumEditorProps extends LocalEditorPropsRoot {
  rawJzodSchema: JzodEnum | undefined;
}

export type JzodEnumEditorTest = JzodEditorTest<LocalEnumEditorProps>;
export type JzodEnumEditorTestSuites = JzodEditorTestSuites<LocalEnumEditorProps>;

export function getJzodEnumEditorTests(
  LocalEditor: React.FC<LocalEnumEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEnumEditorTestSuites {
  const enumValues = ["value1", "value2", "value3"];
  return {
    JzodEnumEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      suiteProps: {
        label: "Test Label",
        name: "testField",
        listKey: "ROOT.testField",
        rootLesslistKey: "testField",
        rootLesslistKeyArray: ["testField"],
        rawJzodSchema: {
          type: "enum",
          definition: enumValues,
        },
        initialFormState: "value2",
      },
      tests: {
        "renders input with label when label prop is provided": {
          tests: async (expect: ExpectStatic) => {
            expect(screen.getByLabelText(/Test Label/)).toBeInTheDocument();
          },
        },
        "renders input without label when label prop is not provided": {
          props: {
            // label: "Test Label", // no label
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "enum",
              definition: enumValues,
            },
            initialFormState: "value2",
          },
          tests: async (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            // expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "renders select with correct value": {
          tests: async (expect: ExpectStatic) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial");
            console.log("########### ENUM VALUES", values);
            console.log("=== FULL RENDERED DOM ===");
            screen.debug(undefined, Infinity); // Prints entire DOM with no size limit

            expect(values).toEqual({
              "testField": "value2",
            });
          },
        },
        "renders all enum options": {
          tests: async (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            const valuesInitial: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial");
            expect(valuesInitial).toEqual({
              "testField": "value2",
            });
            await act(() => {
              fireEvent.mouseDown(combobox);
            });
            const valuesListDisplayed: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "after mouseDown");
            expect(valuesListDisplayed).toEqual({
              "testField": ["value1", "value2", "value3"],
            });
          },
        },
        "form state is changed when selection changes": {
          tests: async (expect: ExpectStatic) => {
            const combobox = screen.getByRole("combobox");
            await act(() => {
              fireEvent.mouseDown(combobox);
            });
            await act(() => {
              fireEvent.click(screen.getByRole("option", { name: "testField.2" }));
            });
            const valuesInitial: Record<string, any> = extractValuesFromRenderedElements(
              expect,
              "testField",
              "after selection change"
            );
            expect(valuesInitial).toEqual({
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

export type JzodLiteralEditorTest = JzodEditorTest<LocalLiteralEditorProps>;
export type JzodLiteralEditorTestSuites = JzodEditorTestSuites<LocalLiteralEditorProps>;

// ################################################################################################
export function getJzodLiteralEditorTests(
  LocalEditor: React.FC<LocalLiteralEditorProps>,
  jzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodLiteralEditorTestSuites {
  return {
    "JzodLiteralEditor": {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor: jzodElementEditor
      },
      suiteProps: {
        name: "testField",
        listKey: "root.testField",
        rootLesslistKey: "testField",
        rootLesslistKeyArray: ["testField"],
        initialFormState: "test-value",
        label: "Test Label",
      } as LocalLiteralEditorProps,
      tests: {
        "renders input with label when label prop is provided": {
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: {
            testAsComponent: async (expect) => {
              expect(screen.getByText(/Test Label/)).toBeInTheDocument();
              // expect(screen.getByRole("textbox")).toHaveAttribute("name", "testField"); // TODO: this is implementation detail, should be removed
            },
            testAsJzodElementEditor: async (expect) => {
              expect(screen.getByText(/Test Label/)).toBeInTheDocument();
            },
          },
        },
        "renders input without label when label prop is not provided": {
          props: {
            name: "testField",
            listKey: "root.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            initialFormState: "test-value",
            // label: "Test Label", // no label
          },
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
          tests: async (expect) => {
            expect(screen.queryByLabelText(/Test Label/)).not.toBeInTheDocument();
            expect(screen.getByRole("textbox")).toBeInTheDocument();
          },
        },
        "setting new value": {
          jzodElementEditorProps: (props: LocalLiteralEditorProps) =>
            ({
              ...props,
              rawJzodSchema: {
                type: "literal",
                definition: "test-value",
              },
            } as JzodElementEditorProps_Test),
            tests: async (expect) => {
              expect(screen.getByDisplayValue("test-value")).toBeInTheDocument();
              const input = screen.getByDisplayValue("test-value");
              await act(() => {
                console.log("##################### ACTION", );
                fireEvent.change(input, { target: { value: "new value" } }) // React testing library does not throw error on editing disabled textbox, so we simulate it
              });
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

export type JzodObjectEditorTest = JzodEditorTest<LocalObjectEditorProps>;
export type JzodObjectEditorTestSuites = JzodEditorTestSuites<LocalObjectEditorProps>;

export function getJzodObjectEditorTests(
  LocalEditor: React.FC<LocalObjectEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodObjectEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodObjectEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "object renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: {a:{ type: "string" }, b:{ type: "number" }},
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
              values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            expect(values).toEqual({ a: "test string", b: "42" });
          },
        },
        "object with bigint attribute renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: { e:{ type: "bigint" } },
            },
            initialFormState: {
              e: 123n,
              // e: 123,
              // e: "123",
            },
          },
          tests: async (expect: ExpectStatic) => {
            let inputs: HTMLElement[] = [];
            try {
              inputs = screen.getAllByRole("textbox");
            } catch (e) {
              // No textbox found, leave inputs as empty array
            }
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
              values[name] = (input as HTMLInputElement).value || BigInt((input as HTMLInputElement).value);
            });
            expect(values).toEqual({ e: "123" });
          },
        },
        "object can be updated through displayed input fields": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "object",
              definition: {a:{ type: "string" }, b:{ type: "number" }},
            },
            initialFormState: {
              a: "test string",
              b: 42,
            },
          },
          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
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

            expect(inputA).toHaveValue("new string value");
            expect(inputB).toHaveValue(100);
          },
        },
        "object with optional attributes can receive a value for the first optional attribute (alphabetical order) by clicking on the add button":
          {
            props: {
              label: "Test Label",
              name: "testField",
              listKey: "ROOT.testField",
              rootLesslistKey: "testField",
              rootLesslistKeyArray: ["testField"],
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
            tests: async (expect: ExpectStatic) => {
              const addButton = screen.getByRole("button", {
                name: "testField.addObjectOptionalAttribute",
              });
              await act(() => {
                fireEvent.click(addButton);
              });
              // expect(screen.getByLabelText("AAAAAAAAAAAAAAAAAAAA")).toBeInTheDocument();
              const screenValues: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "after add button click");
              const testResult = formValuesToJSON(screenValues);
              expect(testResult).toEqual({
                a: "",
                b: 42,
              });
            },
          },
        "record renders as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "record",
              definition: {
                type: "object",
                definition: { a:{ type: "string" }, b:{ type: "number" } }},
            },
            initialFormState: {
              firstRecord: {
                a: "test string",
                b: 42,
              },
            },
          },
          tests: async (expect: ExpectStatic) => {
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial");
            expect(values).toEqual({
              // "firstRecordName": "firstRecord",
              "firstRecord.a": "test string",
              "firstRecord.b": 42,
            });
          },
        },
        "record can receive a new record attribute with the proper default value when clicking on the add button": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "record",
              definition: {
                type: "object",
                definition: { a:{ type: "string" }, b:{ type: "number" } }},
            },
            initialFormState: {
              firstRecord: {
                a: "test string",
                b: 42,
              },
            },
          },
          tests: async (expect) => {
            const addButton = screen.getByRole("button", { name: "testField.addRecordAttribute" });
            await act(() => {
              fireEvent.click(addButton);
            });
            const values = extractValuesFromRenderedElements(expect, "testField", "after add button click");
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
        "record can rename a record attribute keeping the existing value when clicking on the attribute input field": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "record",
              definition: {
                type: "object",
                definition: { a:{ type: "string" }, b:{ type: "number" } }},
            },
            initialFormState: {
              firstRecord: {
                a: "test string",
                b: 42,
              },
            },
          },
          tests: async (expect) => {
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            // console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
            const input = screen.getByRole("textbox", { name: "meta-testField.firstRecord-NAME" }) as HTMLInputElement;
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("firstRecord");
            await act(() => {
              fireEvent.change(input, { target: { value: "renamedRecord" } });
            });
            await act(() => {
              fireEvent.blur(input); // Simulate blur to trigger validation and state update
            });
            expect(input).toHaveValue("renamedRecord");
            const values = extractValuesFromRenderedElements(expect, "testField", "after rename");
            const testResult = formValuesToJSON(values);
            expect(testResult).toEqual({
              renamedRecord: {
                a: "test string",
                b: 42,
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

export type JzodSimpleTypeEditorTest = JzodEditorTest<LocalSimpleTypeEditorProps>;
export type JzodSimpleTypeEditorTestSuites = JzodEditorTestSuites<LocalSimpleTypeEditorProps>;

export function getJzodSimpleTypeEditorTests(
  LocalEditor: React.FC<LocalSimpleTypeEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodSimpleTypeEditorTestSuites {
  // const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodSimpleTypeEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "string renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
              // definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: "placeholder text",
          },

          tests: async (expect: ExpectStatic) => {
            // const input = screen.getByRole("textbox");
            // expect(input).toBeInTheDocument();
            // expect(input).toHaveValue("placeholder text");
          },
        },
        "string allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
            },
            initialFormState: "placeholder text",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
            await act(() => {
              fireEvent.change(input, { target: { value: "new text" } });
            });
            expect(input).toHaveValue("new text");
          },
        },
        "string allows to modify input value with consistent update then submit form": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "string",
            },
            initialFormState: "placeholder text",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("placeholder text");
            await act(() => {
              fireEvent.change(input, { target: { value: "new text" } });
            });
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
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "number",
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic) => {
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAA/)).toBeInTheDocument();
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
          },
        },
        "number allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "number",
            },
            initialFormState: 42,
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
            await act(() => {
              fireEvent.change(input, { target: { value: 100 } });
            });
            expect(input).toHaveValue(100);
          },
        },
        "uuid renders input with proper value": { // TODO: test for nullable / optional scenario
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "123e4567-e89b-12d3-a456-426614174000",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("123e4567-e89b-12d3-a456-426614174000");
          },
        },
        "uuid allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "uuid",
            },
            initialFormState: "123e4567-e89b-12d3-a456-426614174000",
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("123e4567-e89b-12d3-a456-426614174000");
            await act(() => {
              fireEvent.change(input, { target: { value: "new-uuid-value" } });
            });
            expect(input).toHaveValue("new-uuid-value");
          },
        },
        "boolean renders checkbox with proper value true": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: true,
          },
          tests: async (expect: ExpectStatic) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect);
            expect(values).toEqual({
              "testField": true,
            });
          },
        },
        "boolean renders checkbox with proper value false": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: false,
          },
          tests: async (expect: ExpectStatic) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect);
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
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "boolean",
            },
            initialFormState: true,
          },
          tests: async (expect: ExpectStatic) => {
            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).toBeChecked();
            await act(() => {
              fireEvent.click(checkbox);
            });
            const values: Record<string, any> = extractValuesFromRenderedElements(expect);
            expect(values).toEqual({
              "testField": false,
            });
          },
        },
        "bigint renders input with proper bigint value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: BigInt("12345678901234567890"),
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("12345678901234567890");
          },
        },
        "bigint renders input with proper bigint value as string": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: "12345678901234567890", // string representation of bigint
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("12345678901234567890");
          },
        },
        "bigint renders input with proper bigint value as number": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: 1234, // string representation of bigint
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("1234");
          },
        },
        "bigint allows to modify input value with consistent update": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "bigint",
            },
            initialFormState: 12345678901234567890n,
          },
          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue("12345678901234567890");
            await act(() => {
              fireEvent.change(input, { target: { value: 98765432109876543210n } });
            });
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

export type JzodUnionEditorTest = JzodEditorTest<LocalUnionEditorProps>;
export type JzodUnionEditorTestSuites = JzodEditorTestSuites<LocalUnionEditorProps>;

export function getJzodUnionEditorTests(
  LocalEditor: React.FC<LocalUnionEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodUnionEditorTestSuites {
  const arrayValues = ["value1", "value2", "value3"];
  return {
    JzodUnionEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "union between simple types renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              definition: [{ type: "string" }, { type: "number" }],
            },
            initialFormState: 42,
          },

          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
          },
        },
        "union between simple type and object for value of simple type renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
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

          tests: async (expect: ExpectStatic) => {
            const input = screen.getByRole("textbox");
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue(42);
          },
        },
        "union between simple type and object for value object renders input with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
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

          tests: async (expect: ExpectStatic) => {
            const inputs = screen.getAllByRole("textbox");
            const values: Record<string, any> = {};
            inputs.forEach((input: HTMLElement) => {
              const name = (input as HTMLInputElement).name.replace(/^testField\./, "");
              values[name] = (input as HTMLInputElement).value || Number((input as HTMLInputElement).value);
            });
            expect(values).toEqual({ a: "test string", b: "42" });
          },
        },
        "union between 2 object types with a discriminator for value object renders input following the proper value type": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: {
              type: "union",
              discriminator: "testObjectType",
              definition: [
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type1" }, a: { type: "string" } } },
                { type: "object", definition: { testObjectType: { type: "literal", definition: "type2" }, b: { type: "number" } } },
              ],
            },
            initialFormState: {
              testObjectType: "type1",
              a: "test string",
            },
          },
          tests: async (expect: ExpectStatic) => {
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial form state");
            console.log("Extracted initial values:", values);
            expect(values).toEqual({ a: "test string", "testObjectType": "type1" });
            const input = screen.getByDisplayValue("type1");
            console.log("Input for type1:", input.innerHTML);
            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ACTION");
            await act(() => {
              fireEvent.change(input, { target: { value: "type2" } });
            });
            // expect(screen.getByLabelText(/NOOOOOOOOOO/)).toBeInTheDocument();
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

export type JzodBookEditorTest = JzodEditorTest<LocalBookEditorProps>;
export type JzodBookEditorTestSuites = JzodEditorTestSuites<LocalBookEditorProps>;

export function getJzodBookEditorTests(
  LocalEditor: React.FC<LocalBookEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodBookEditorTestSuites {
  return {
    JzodBookEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
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
          tests: async (expect: ExpectStatic) => {
            // Pretty-print the entire rendered DOM
            // console.log("=== FULL RENDERED DOM ===");
            // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
  
            // expect(screen.getByText(/Test LabelAAAAAAAAAAAAAAAAAAAAAAAAAA/)).toBeInTheDocument();
            const values: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial form state");
            console.log("Extracted initial values:", values);

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
            expect(values).toEqual(book1);
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLesslistKey: "testField",
        //     rootLesslistKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic) => {
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

export type JzodEntityDefinitionEditorTest = JzodEditorTest<LocalEntityDefinitionEditorProps>;
export type JzodEntityDefinitionEditorTestSuites = JzodEditorTestSuites<LocalEntityDefinitionEditorProps>;

export function getJzodEntityDefinitionEditorTests(
  LocalEditor: React.FC<LocalEntityDefinitionEditorProps>,
  renderAsJzodElementEditor: React.FC<JzodElementEditorProps_Test>
): JzodEntityDefinitionEditorTestSuites {
  return {
    JzodEntityDefinitionEditor: {
      suiteRenderComponent: {
        renderAsComponent: LocalEditor,
        renderAsJzodElementEditor,
      },
      tests: {
        "entity definition for Book is displayed as json-like input fields with proper value": {
          props: {
            label: "Test Label",
            name: "testField",
            listKey: "ROOT.testField",
            rootLesslistKey: "testField",
            rootLesslistKeyArray: ["testField"],
            rawJzodSchema: (entityDefinitionEntityDefinition as EntityDefinition).jzodSchema,
            initialFormState: entityDefinitionBook
          },
          tests: async (expect: ExpectStatic) => {
            const formValues: Record<string, any> = extractValuesFromRenderedElements(expect, "testField", "initial form state");
            // console.log("Extracted initial values:", values);
            const testResult = formValuesToJSON(formValues);
            expect(testResult).toEqual(entityDefinitionBook);
          },
        },
        // "object can be updated through displayed input fields": {
        //   props: {
        //     label: "Test Label",
        //     name: "testField",
        //     listKey: "ROOT.testField",
        //     rootLesslistKey: "testField",
        //     rootLesslistKeyArray: ["testField"],
        //     rawJzodSchema: {
        //       type: "object",
        //       definition: {a:{ type: "string" }, b:{ type: "number" }},
        //     },
        //     initialFormState: {
        //       a: "test string",
        //       b: 42,
        //     },
        //   },
        //   tests: async (expect: ExpectStatic) => {
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export type TestMode = 'jzodElementEditor' | 'component';
export type TestModeStar = 'jzodElementEditor' | 'component' | '*';

const allTestModes: TestMode[] = ['jzodElementEditor', 'component'];

export interface JzodElementEditorTestSuite<LocalEditorProps extends Record<string, any>> {
  editor: React.FC<any>;
  getJzodEditorTests: (
    LocalEditor: React.FC<LocalEditorProps>,
    jzodElementEditor: React.FC<JzodElementEditorProps_Test>
  ) => JzodEditorTestSuites<LocalEditorProps>;
}

type ModesType = TestModeStar | TestMode[];

// ##############################################################################################
const jzodElementEditorTests: Record<
  string,
  JzodElementEditorTestSuite<any> & { modes?: ModesType }
> = {
  JzodArrayEditor: { 
    editor: JzodArrayEditor, 
    getJzodEditorTests: getJzodArrayEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodEnumEditor: {
    editor: JzodEnumEditor,
    getJzodEditorTests: getJzodEnumEditorTests,
    // modes: '*',
    modes: "jzodElementEditor",
    // modes: "component",
  },
  JzodLiteralEditor: { 
    editor: JzodLiteralEditor, 
    getJzodEditorTests: getJzodLiteralEditorTests,
    // modes: "*",
    // modes: ['jzodElementEditor', 'component'],
    modes: "jzodElementEditor",
    // modes: "component",
  },
  JzodObjectEditor: { 
    editor: JzodElementEditor, 
    getJzodEditorTests: getJzodObjectEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodSimpleTypeEditor: { 
    editor: JzodElementEditor, 
    getJzodEditorTests: getJzodSimpleTypeEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  JzodUnionEditor: { 
    editor: JzodElementEditor, 
    getJzodEditorTests: getJzodUnionEditorTests,
    // modes: '*',
    // modes: ['jzodElementEditor', 'component'],
    modes: 'jzodElementEditor',
  },
  // // ################# INSTANCES
  // JzodBookEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodBookEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
  // // ################# MODEL
  // JzodEntityDefinitionEditor: { 
  //   editor: JzodElementEditor, 
  //   getJzodEditorTests: getJzodEntityDefinitionEditorTests,
  //   // modes: '*',
  //   // modes: ['jzodElementEditor', 'component'],
  //   modes: 'jzodElementEditor',
  // },
};

// ##############################################################################################
describe("JzodElementEditor", () => {
  Object.entries(jzodElementEditorTests).forEach(([editorName, testSuite]) => {
    const suites = getJzodEditorTestSuites(
      pageLabel,
      testSuite.editor,
      testSuite.getJzodEditorTests
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
    console.log(`Test suites: ${JSON.stringify(suites, null, 2)}`);
    // Run all testcases for the first mode, then all for the second, etc.
    modes.forEach((mode: TestMode) => {
      Object.entries(suites[editorName].tests).forEach(([testName, testCase]) => {
        it(`${editorName} - ${mode} - ${testName}`, async () => {
          await runJzodEditorTest(testCase, suites[editorName], testName, mode);
        });
      });
    });
  });
});