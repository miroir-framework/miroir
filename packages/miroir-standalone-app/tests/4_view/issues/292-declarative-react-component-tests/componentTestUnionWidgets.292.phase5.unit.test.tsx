/**
 * Issue #292 Slice 5: the step kinds, widgets, and parameters that the Union and Any suites need
 * (analysis §5.4, T6, T7, T11): `toggleUnionTypeSelector`, `selectOption` (on a value select and
 * on the union type select), the widgets `unionTypeStar`, `unionTypeInput`, and `selectState` with
 * `select: "unionType"`, `expectElement` `parentContains` and `timeout`, and `expectRenderedValues`
 * `filter` and `timeout`.
 *
 * The widget tests call the runner of `createReactComponentTestRunner` over their own sandbox
 * element with one `reactComponentTest` leaf and a fixture `reactComponentTestSuite` context, as the
 * MiroirTest walk does, rendering the real `JzodElementEditor` of the component registry. The
 * `timeout` and `filter` tests need a value that changes after a delay, or inputs of each kind the
 * extractor filters: they mount small fixtures with the act-free `mountComponent` and run steps
 * through `runComponentTestSteps`, as `componentTestTargets.292.phase3` does.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestUnionWidgets.292.phase5
 * ```
 */
import React, { useEffect, useState } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  LoggerInterface,
  MiroirTestForReactComponent,
  ReactComponentTestStep,
  ReactComponentTestSuiteContext,
} from "miroir-core";

import {
  createComponentTestEnvironment,
  mountComponent,
  type ComponentTestEnvironment,
  type MountedComponent,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestEnvironment";
import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { runComponentTestSteps } from "../../../../src/miroir-fwk/4-tests/componentTests/runComponentTestSteps";

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

const stringOrNumberSuite = fixtureSuite("StringOrNumber", {
  rawJzodSchema: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
  initialFormState: 42,
});

const objectValueSuite = fixtureSuite("ObjectValue", {
  rawJzodSchema: {
    type: "union",
    definition: [
      { type: "string" },
      { type: "number" },
      { type: "object", definition: { a: { type: "string" }, b: { type: "number" } } },
    ],
  },
  initialFormState: { a: "hello", b: 1 },
});

const discriminatedSuite = fixtureSuite("Discriminated", {
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
  initialFormState: { testObjectType: "type1", type1Attribute: "test string" },
});

const star = { widget: "unionTypeStar", field: "testField" } as const;
const unionTypeInput = { widget: "unionTypeInput", field: "testField" } as const;
const unionTypeState = { widget: "selectState", field: "testField", select: "unionType" } as const;

const silentLog = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
} as unknown as LoggerInterface;

let sandboxElement: HTMLElement | undefined;
let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;
let mounted: MountedComponent | undefined;

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
  mounted?.unmount();
  mounted = undefined;
  sandboxElement?.remove();
  sandboxElement = undefined;
});

async function run(suite: ReactComponentTestSuiteContext, steps: ReactComponentTestStep[]): Promise<any> {
  runner = createReactComponentTestRunner({ sandboxElement: sandboxElement! });
  const leaf: MiroirTestForReactComponent = {
    miroirTestType: "reactComponentTest",
    miroirTestLabel: caseLabel,
    steps,
  };
  return runner({ testNamePath: [...suite.suitePath, caseLabel], leaf, suite });
}

/** Mounts `element` in the sandbox (container + portal element) and returns its environment. */
function mountFixture(element: React.ReactElement): ComponentTestEnvironment {
  const portalElement = document.createElement("div");
  const container = document.createElement("div");
  sandboxElement!.append(portalElement, container);
  mounted = mountComponent(element, container);
  return createComponentTestEnvironment({
    testName: "componentTestUnionWidgets.292.phase5",
    container,
    sandboxElement: sandboxElement!,
    portalElement,
    log: silentLog,
  });
}

/** The message of the error thrown by `runComponentTestSteps`, or `undefined` if none. */
async function stepsError(env: ComponentTestEnvironment, steps: ReactComponentTestStep[]): Promise<string | undefined> {
  try {
    await runComponentTestSteps(env, steps);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** An input named `TESTSECTION.testField` whose value becomes `later` 200 ms after mounting. */
const DelayedValue: React.FC<{ later: string }> = ({ later }) => {
  const [value, setValue] = useState("initial");
  useEffect(() => {
    const timer = setTimeout(() => setValue(later), 200);
    return () => clearTimeout(timer);
  }, [later]);
  return <input type="text" name="TESTSECTION.testField" value={value} readOnly />;
};

// ################################################################################################
describe("componentTestUnionWidgets.292.phase5: union type selector", () => {
  it("toggleUnionTypeSelector twice shows then hides the union type input", async () => {
    const result = await run(stringOrNumberSuite, [
      { step: "expectElement", target: star },
      { step: "expectElement", target: unionTypeInput, present: false },
      { step: "toggleUnionTypeSelector", field: "testField" },
      { step: "expectElement", target: unionTypeInput },
      { step: "toggleUnionTypeSelector", field: "testField" },
      { step: "expectElement", target: unionTypeInput, present: false },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("selectOption with select unionType switches a string|number value from number to string", async () => {
    const result = await run(stringOrNumberSuite, [
      { step: "toggleUnionTypeSelector", field: "testField" },
      { step: "expectElement", target: unionTypeState, attribute: { name: "data-test-selected-value", value: "number" } },
      { step: "selectOption", field: "testField", select: "unionType", option: "string" },
      { step: "expectElement", target: unionTypeInput, present: false, timeout: 3000 },
      {
        step: "expectRenderedValues",
        label: "after change to string",
        filter: [],
        timeout: 3000,
        expectedValue: { testField: "" },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("selectOption on a discriminator field switches type1 to type2", async () => {
    const discriminatorState = { widget: "selectState", field: "testField.testObjectType" } as const;
    const result = await run(discriminatedSuite, [
      { step: "expectElement", target: discriminatorState, attribute: { name: "data-test-selected-value", value: "type1" } },
      { step: "selectOption", field: "testField.testObjectType", option: "type2" },
      { step: "expectElement", target: discriminatorState, attribute: { name: "data-test-selected-value", value: "type2" } },
      { step: "expectElement", target: { byText: "type2Attribute", index: 0 }, timeout: 5000 },
      {
        step: "expectRenderedValues",
        label: "after change to type2",
        field: "testField",
        expectedValue: { testObjectType: "type2", type2Attribute: 0 },
      },
    ]);
    expect(result).toEqual({ status: "ok" });
  });

  it("parentContains passes for the star and the selector input, and fails for two unrelated elements", async () => {
    const ok = await run(objectValueSuite, [
      { step: "expectElement", target: star, saveAs: "star" },
      { step: "toggleUnionTypeSelector", field: "testField" },
      { step: "expectElement", target: unionTypeInput, timeout: 1000, saveAs: "selector" },
      { step: "expectElement", target: { ref: "star" }, parentContains: { ref: "selector" } },
    ]);
    expect(ok).toEqual({ status: "ok" });
    runner?.close();

    const failed = await run(objectValueSuite, [
      { step: "toggleUnionTypeSelector", field: "testField" },
      {
        step: "expectElement",
        label: "unrelated",
        target: { byRole: "textbox", fieldName: "testField.a" },
        parentContains: unionTypeInput,
      },
    ]);
    expect(failed.status).toBe("error");
    expect(failed.message).toMatch(/^step 2 \(expectElement "unrelated"\): /);
  });
});

// ################################################################################################
describe("componentTestUnionWidgets.292.phase5: expectRenderedValues timeout and filter", () => {
  it("timeout retries until the rendered values are equal, and gives a T10 message at timeout", async () => {
    const env = mountFixture(<DelayedValue later="final" />);
    expect(
      await stepsError(env, [{ step: "expectRenderedValues", label: "no retry", expectedValue: { testField: "final" } }]),
    ).toMatch(/^step 1 \(expectRenderedValues "no retry"\): /);
    await runComponentTestSteps(env, [
      { step: "expectRenderedValues", label: "retried", timeout: 2000, expectedValue: { testField: "final" } },
    ]);
    expect(
      await stepsError(env, [
        { step: "expectElement", target: { byDisplayValue: "final" } },
        { step: "expectRenderedValues", label: "never", timeout: 300, expectedValue: { testField: "other" } },
      ]),
    ).toMatch(/^step 2 \(expectRenderedValues "never"\): .*"other"/);
  });

  it("filter [] reads only the miroirInput elements and the checkboxes", async () => {
    const env = mountFixture(
      <div>
        <input type="text" name="TESTSECTION.plain" defaultValue="plain value" />
        <input type="text" data-testid="miroirInput" name="TESTSECTION.tested" defaultValue="tested value" />
        <input type="checkbox" name="TESTSECTION.flag" defaultChecked />
      </div>,
    );
    await runComponentTestSteps(env, [
      {
        step: "expectRenderedValues",
        label: "no filter",
        expectedValue: { plain: "plain value", tested: "tested value", flag: true },
      },
      {
        step: "expectRenderedValues",
        label: "empty filter",
        filter: [],
        expectedValue: { tested: "tested value", flag: true },
      },
    ]);
  });
});
