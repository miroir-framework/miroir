/**
 * Issue #292 Slice 2: the declarative step interpreter of the component test runner (analysis
 * §5.3, §5.4, T4, T9, T10, T11).
 *
 * Each test calls the runner of `createReactComponentTestRunner` over its own sandbox element with
 * a `reactComponentTest` leaf that has `steps`, and a `reactComponentTestSuite` context, as the
 * MiroirTest walk does. The Enum fixture renders the real `JzodElementEditor` of the component
 * registry. The props and wrapper-lifetime tests use a fake component registry.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestSteps.292.phase2
 * ```
 */
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MiroirEventService,
  type MiroirTestForReactComponent,
  type ReactComponentTestStep,
  type ReactComponentTestSuiteContext,
} from "miroir-core";

import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";

const enumCaseLabel = "FixtureEnum: case";

const enumSuite: ReactComponentTestSuiteContext = {
  suitePath: ["Fixture_ComponentTestSuite", "FixtureEnum"],
  component: "JzodElementEditor",
  componentProps: {
    label: "Test Label",
    name: "testField",
    listKey: "ROOT.testField",
    rootLessListKey: "testField",
    rootLessListKeyArray: ["testField"],
    rawJzodSchema: { type: "enum", definition: ["value1", "value2", "value3"] },
    initialFormState: "value2",
  },
  caseLabels: [enumCaseLabel],
};

function stepLeaf(
  steps: ReactComponentTestStep[],
  extra: Partial<MiroirTestForReactComponent> = {},
  label: string = enumCaseLabel,
): MiroirTestForReactComponent {
  return { miroirTestType: "reactComponentTest", miroirTestLabel: label, steps, ...extra };
}

/** Analysis §5.4, Enum case 2 "renders all enum options". */
const enumCase2Steps: ReactComponentTestStep[] = [
  { step: "expectRenderedValues", label: "initial", expectedValue: { testField: "value2" } },
  { step: "openSelect", field: "testField" },
  {
    step: "expectRenderedValues",
    label: "after click",
    detectOptions: true,
    expectedValue: { testField: "value2", $options: { testField: ["value1", "value2", "value3"] } },
  },
];

/**
 * A fake component that renders its props, a bigint prop being written `<digits>n` (converted
 * before `JSON.stringify`, which would call a `BigInt.prototype.toJSON` defined elsewhere).
 */
const PropsProbe: React.FC<Record<string, any>> = (props) => (
  <div
    data-testid="props-probe"
    data-props={JSON.stringify(
      Object.fromEntries(
        Object.entries(props).map(([key, value]) => [key, typeof value === "bigint" ? `${value}n` : value]),
      ),
    )}
  />
);
const fakeComponentRegistry = { PropsProbe };

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

function newRunner(componentRegistry?: Record<string, React.FC<any>>) {
  runner = createReactComponentTestRunner(
    componentRegistry ? { sandboxElement, componentRegistry } : { sandboxElement },
  );
  return runner;
}

// ################################################################################################
describe("componentTestSteps.292.phase2: Enum fixture on the real JzodElementEditor", () => {
  it("the steps of the Enum case 2 give ok", async () => {
    const result = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf(enumCase2Steps),
      suite: enumSuite,
    });
    expect(result).toEqual({ status: "ok" });
  });

  it("a wrong expectedValue at step 3 gives an error naming the step, with expected and actual", async () => {
    const steps: ReactComponentTestStep[] = [
      enumCase2Steps[0],
      enumCase2Steps[1],
      {
        step: "expectRenderedValues",
        label: "after click",
        detectOptions: true,
        expectedValue: { testField: "value9" },
      },
    ];
    const result: any = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf(steps),
      suite: enumSuite,
    });
    expect(result.status).toBe("error");
    expect(result.message.startsWith('step 3 (expectRenderedValues "after click"): ')).toBe(true);
    expect(result.expected).toEqual({ testField: "value9" });
    expect(result.actual).toEqual({
      testField: "value2",
      $options: { testField: ["value1", "value2", "value3"] },
    });
  });

  it("$options holds the open option list by field, and is absent while the list is closed", async () => {
    const result = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf([
        // toEqual fails on an extra $options key: absent while closed
        { step: "expectRenderedValues", label: "initial", expectedValue: { testField: "value2" } },
        { step: "openSelect", field: "testField" },
        // detectOptions false: $options is built from the rendered option list anyway
        {
          step: "expectRenderedValues",
          label: "after selection change",
          expectedValue: { testField: "value2", $options: { testField: ["value1", "value2", "value3"] } },
        },
      ]),
      suite: enumSuite,
    });
    expect(result).toEqual({ status: "ok" });
  });

  it("an unknown component gives an error that names it", async () => {
    const result: any = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf(enumCase2Steps),
      suite: { ...enumSuite, component: "NoSuchComponent" },
    });
    expect(result.status).toBe("error");
    expect(result.message).toContain('"NoSuchComponent"');
  });

  it("an implemented kind whose target matches nothing gives a step 1 (click) error", async () => {
    const result: any = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf([{ step: "click", target: { byTestId: "no-such-test-id" } }]),
      suite: enumSuite,
    });
    expect(result.status).toBe("error");
    expect(result.message.startsWith("step 1 (click): ")).toBe(true);
  });

  it("a kind outside the schema gives step 1 (fly): unknown step kind", async () => {
    const result: any = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      // #292 Slice 5 implements the last kinds of the schema: a kind that bypassed the schema
      // stands in for the "not implemented" kind of Slices 2-4
      leaf: stepLeaf([{ step: "fly" } as any]),
      suite: enumSuite,
    });
    expect(result).toEqual({ status: "error", message: "step 1 (fly): unknown step kind" });
  });

  it("saveAs then {ref} resolves a live element (both names), and an unknown ref fails", async () => {
    // #292 M2: the `custom` step that compared two saved elements by identity is gone. This case
    // instead checks that each saved name resolves, through {ref}, to a combobox-role element that
    // reacts to the interaction driven through the other name: {ref: "select"} opens the list, and
    // {ref: "combobox"} (saved afterwards by a widget target) is then found open.
    const ok = await newRunner()({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf([
        { step: "expectElement", target: { byRole: "combobox" }, saveAs: "select" },
        // clicking the saved element opens the list
        { step: "click", target: { ref: "select" } },
        {
          step: "waitForAttribute",
          target: { widget: "selectState", field: "testField" },
          attribute: "data-test-is-open",
          value: "true",
        },
        { step: "expectElement", target: { widget: "combobox", field: "testField" }, saveAs: "combobox" },
        { step: "expectElement", target: { ref: "select" }, attribute: { name: "role", value: "combobox" } },
        { step: "expectElement", target: { ref: "combobox" }, attribute: { name: "role", value: "combobox" } },
      ]),
      suite: enumSuite,
    });
    expect(ok).toEqual({ status: "ok" });

    const unknown: any = await runner!({
      testNamePath: [...enumSuite.suitePath, enumCaseLabel],
      leaf: stepLeaf([{ step: "click", target: { ref: "nope" } }]),
      suite: enumSuite,
    });
    expect(unknown.status).toBe("error");
    expect(unknown.message.startsWith("step 1 (click): ")).toBe(true);
    expect(unknown.message).toContain('"nope"');
  });
});

// ################################################################################################
describe("componentTestSteps.292.phase2: props and suite wrapper lifetime", () => {
  let destroySpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    destroySpy = vi.spyOn(MiroirEventService.prototype, "destroy");
  });
  afterEach(() => {
    destroySpy.mockRestore();
  });

  const probeSuite: ReactComponentTestSuiteContext = {
    suitePath: ["Probe_ComponentTestSuite", "Probe"],
    component: "PropsProbe",
    componentProps: { a: 1, b: 1 },
    caseLabels: ["Probe: first", "Probe: second"],
  };

  it("leaf componentProps override the suite's (shallow), and {$bigint} reaches the component as a bigint", async () => {
    const result = await newRunner(fakeComponentRegistry)({
      testNamePath: [...probeSuite.suitePath, "Probe: second"],
      leaf: stepLeaf(
        [
          {
            step: "expectElement",
            target: { byTestId: "props-probe" },
            attribute: { name: "data-props", value: JSON.stringify({ a: 1, b: 2, big: "5n" }) },
          },
        ],
        { componentProps: { b: 2, big: { $bigint: "5" } } },
        "Probe: second",
      ),
      suite: probeSuite,
    });
    expect(result).toEqual({ status: "ok" });
  });

  it("with 2 leaves in caseLabels, the suite wrapper is destroyed once, after the second", async () => {
    const run = newRunner(fakeComponentRegistry);
    const first = await run({
      testNamePath: [...probeSuite.suitePath, "Probe: first"],
      leaf: stepLeaf([], {}, "Probe: first"),
      suite: probeSuite,
    });
    expect(first).toEqual({ status: "ok" });
    expect(destroySpy).toHaveBeenCalledTimes(0);

    const second = await run({
      testNamePath: [...probeSuite.suitePath, "Probe: second"],
      leaf: stepLeaf([], {}, "Probe: second"),
      suite: probeSuite,
    });
    expect(second).toEqual({ status: "ok" });
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it("a leaf without steps gives an error (#292 M1)", async () => {
    const leaf: any = { miroirTestType: "reactComponentTest", miroirTestLabel: "Probe: first" };
    const result: any = await newRunner(fakeComponentRegistry)({
      testNamePath: [...probeSuite.suitePath, "Probe: first"],
      leaf,
      suite: probeSuite,
    });
    expect(result.status).toBe("error");
    expect(result.message).toContain('reactComponentTest "Probe: first" has no steps');
  });
});
