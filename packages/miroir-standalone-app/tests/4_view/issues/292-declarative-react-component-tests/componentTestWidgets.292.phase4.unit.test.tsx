/**
 * Issue #292 Slice 4: the step kinds, widgets, and parameters that the Array and Object suites
 * need (analysis §5.4, T6, T7): `clickArrayButton` (up, down, add, duplicate, delete),
 * `clickObjectButton` (addOptionalAttribute, addRecordEntry, remove, duplicate),
 * `renameRecordEntry`, `expectElement` `values` and `containsHtml`, the refinement
 * `fieldNamePrefix`, and `expectRenderedValues` `field` and `path`.
 *
 * Each test calls the runner of `createReactComponentTestRunner` over its own sandbox element with
 * one `reactComponentTest` leaf and a fixture `reactComponentTestSuite` context, as the MiroirTest
 * walk does. The fixtures render the real `JzodElementEditor` of the component registry: a string
 * array, a record of objects, an object with optional attributes, and an object with a
 * `definition` attribute.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestWidgets.292.phase4
 * ```
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  MiroirTestForReactComponent,
  ReactComponentTestStep,
  ReactComponentTestSuiteContext,
} from "miroir-core";

import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";

const caseLabel = "Fixture: case";

const testFieldProps = {
  label: "Test Label",
  name: "testField",
  listKey: "ROOT.testField",
  rootLessListKey: "testField",
  rootLessListKeyArray: ["testField"],
};

function fixtureSuite(name: string, componentProps: Record<string, any>): ReactComponentTestSuiteContext {
  return {
    suitePath: [`${name}_ComponentTestSuite`, name],
    component: "JzodElementEditor",
    componentProps: { ...testFieldProps, ...componentProps },
    caseLabels: [caseLabel],
  };
}

const stringArraySuite = fixtureSuite("StringArray", {
  rawJzodSchema: { type: "array", definition: { type: "string" } },
  initialFormState: ["value1", "value2", "value3"],
});

const recordSuite = fixtureSuite("Record", {
  rawJzodSchema: {
    type: "record",
    definition: { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
  },
  initialFormState: { firstRecord: { a: "test string", b: 42 } },
});

const optionalAttributesSuite = fixtureSuite("OptionalAttributes", {
  rawJzodSchema: {
    type: "object",
    definition: {
      a: { type: "string", optional: true },
      b: { type: "number", optional: true },
      c: { type: "boolean", optional: true },
    },
  },
  initialFormState: { a: "test string", b: 42 },
});

const definitionObjectSuite = fixtureSuite("DefinitionObject", {
  rawJzodSchema: {
    type: "object",
    definition: {
      definition: { type: "object", definition: { x: { type: "string" } } },
      y: { type: "number" },
    },
  },
  initialFormState: { definition: { x: "inner" }, y: 1 },
});

/** The item textboxes of the string array, in DOM order (the old `arrayItemTextBoxValues`). */
const arrayItems = { byRole: "textbox", fieldNamePrefix: "testField." };

let sandboxElement: HTMLElement;
let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

beforeEach(() => {
  sandboxElement = document.createElement("div");
  document.body.appendChild(sandboxElement);
});

afterEach(() => {
  runner?.close();
  runner = undefined;
  sandboxElement.remove();
});

async function run(suite: ReactComponentTestSuiteContext, steps: ReactComponentTestStep[]): Promise<any> {
  runner = createReactComponentTestRunner({ sandboxElement });
  const leaf: MiroirTestForReactComponent = {
    miroirTestType: "reactComponentTest",
    miroirTestLabel: caseLabel,
    steps,
  };
  return runner({ testNamePath: [...suite.suitePath, caseLabel], leaf, suite });
}

// ################################################################################################
describe("componentTestWidgets.292.phase4: array buttons", () => {
  it("values reads the item textboxes in DOM order, before and after clickArrayButton up", async () => {
    const result = await run(stringArraySuite, [
      { step: "expectElement", label: "initial", target: arrayItems, values: ["value1", "value2", "value3"] },
      { step: "clickArrayButton", field: "testField", action: "up", index: 1 },
      { step: "expectElement", label: "after up", target: arrayItems, values: ["value2", "value1", "value3"] },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("clickArrayButton down, then expectRenderedValues with field gives an array", async () => {
    const result = await run(stringArraySuite, [
      { step: "clickArrayButton", field: "testField", action: "down", index: 0 },
      {
        step: "expectRenderedValues",
        label: "after down",
        field: "testField",
        expectedValue: ["value2", "value1", "value3"],
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("clickArrayButton add, duplicate, and delete change the values as the old cases did", async () => {
    const result = await run(stringArraySuite, [
      { step: "clickArrayButton", field: "testField", action: "add" },
      {
        step: "expectRenderedValues",
        label: "after add",
        field: "testField",
        expectedValue: ["value1", "value2", "value3", ""],
      },
      { step: "clickArrayButton", field: "testField", action: "duplicate", index: 1 },
      {
        step: "expectRenderedValues",
        label: "after duplicate",
        field: "testField",
        expectedValue: ["value1", "value2", "value2", "value3", ""],
      },
      { step: "clickArrayButton", field: "testField", action: "delete", index: 0 },
      {
        step: "expectRenderedValues",
        label: "after delete",
        field: "testField",
        expectedValue: ["value2", "value2", "value3", ""],
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("the arrayButton widget and fieldNamePrefix with index resolve the elements of the old queries, and containsHtml reads the changed cell", async () => {
    const result = await run(stringArraySuite, [
      {
        step: "expectElement",
        target: { widget: "arrayButton", field: "testField", action: "duplicate", index: 1 },
        attribute: { name: "aria-label", value: "TESTSECTION.testField.1-duplicateArrayItem" },
      },
      { step: "expectElement", target: { widget: "arrayButton", field: "testField", action: "up" }, count: 3 },
      { step: "change", target: { ...arrayItems, index: 1 }, value: "new value", saveAs: "cell" },
      { step: "expectElement", target: { ref: "cell" }, containsHtml: "new value" },
    ]);
    expect(result).toEqual({ status: "ok" });
  });
});

// ################################################################################################
describe("componentTestWidgets.292.phase4: object buttons and record entry names", () => {
  it("clickObjectButton addOptionalAttribute and remove change the object", async () => {
    const result = await run(optionalAttributesSuite, [
      { step: "clickObjectButton", field: "testField", action: "remove", attribute: "b" },
      { step: "expectRenderedValues", label: "after remove", field: "testField", expectedValue: { a: "test string" } },
      { step: "clickObjectButton", field: "testField", action: "addOptionalAttribute", attribute: "c" },
      {
        step: "expectRenderedValues",
        label: "after add",
        field: "testField",
        expectedValue: { a: "test string", c: false },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("clickObjectButton addRecordEntry and duplicate change the record", async () => {
    const result = await run(recordSuite, [
      { step: "clickObjectButton", field: "testField", action: "duplicate", attribute: "firstRecord" },
      { step: "clickObjectButton", field: "testField", action: "addRecordEntry" },
      {
        step: "expectRenderedValues",
        label: "after duplicate and add",
        field: "testField",
        expectedValue: {
          firstRecord: { a: "test string", b: 42 },
          firstRecord_copy: { a: "test string", b: 42 },
          newRecordEntry: { a: "", b: 0 },
        },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("renameRecordEntry renames and keeps the value, and a ref saved before the rename reads the new name", async () => {
    const result = await run(recordSuite, [
      {
        step: "expectElement",
        target: { widget: "recordEntryName", field: "testField", entry: "firstRecord" },
        value: "firstRecord",
        saveAs: "name",
      },
      { step: "renameRecordEntry", field: "testField", entry: "firstRecord", newName: "renamedRecord" },
      { step: "expectElement", target: { ref: "name" }, value: "renamedRecord" },
      {
        step: "expectRenderedValues",
        label: "after rename",
        field: "testField",
        expectedValue: { renamedRecord: { a: "test string", b: 42 } },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("expectRenderedValues path selects a sub-object", async () => {
    const result = await run(definitionObjectSuite, [
      {
        step: "expectRenderedValues",
        label: "initial",
        field: "testField",
        path: ["definition"],
        expectedValue: { x: "inner" },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("a missing object button gives a step <n> (clickObjectButton) error", async () => {
    const result = await run(recordSuite, [
      { step: "expectRenderedValues", label: "initial", field: "testField", expectedValue: { firstRecord: { a: "test string", b: 42 } } },
      { step: "clickObjectButton", field: "testField", action: "remove", attribute: "noSuchEntry" },
    ]);
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/^step 2 \(clickObjectButton\): no element matches target/);
  });
});
