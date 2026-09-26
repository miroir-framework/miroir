/**
 * Issue #292 Slice 3: the step kinds, targets, and refinements that the Literal and SimpleType
 * suites need (analysis §5.4, T6): `submit`, `expectElement` `count` and `checked`,
 * `byDisplayValue` with a number and a regex, `byText` and `byLabelText` with a regex, and the
 * refinements `fieldName` and `id`.
 *
 * Each test mounts a small fixture with the act-free `mountComponent` inside its own sandbox
 * element, and runs steps through `runComponentTestSteps` on a `ComponentTestEnvironment` bound to
 * that sandbox, as the component test runner does.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestTargets.292.phase3
 * ```
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { LoggerInterface, ReactComponentTestStep } from "miroir-core";

import {
  createComponentTestEnvironment,
  mountComponent,
  type ComponentTestEnvironment,
  type MountedComponent,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestEnvironment";
import { runComponentTestSteps } from "../../../../src/miroir-fwk/4-tests/componentTests/runComponentTestSteps";

const silentLog = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
} as unknown as LoggerInterface;

let sandboxElement: HTMLElement | undefined;
let mounted: MountedComponent | undefined;

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  sandboxElement?.remove();
  sandboxElement = undefined;
});

/** Mounts `element` in a fresh sandbox (container + portal element) and returns its environment. */
function mountFixture(element: React.ReactElement): ComponentTestEnvironment {
  sandboxElement = document.createElement("div");
  const portalElement = document.createElement("div");
  const container = document.createElement("div");
  sandboxElement.append(portalElement, container);
  document.body.appendChild(sandboxElement);
  mounted = mountComponent(element, container);
  return createComponentTestEnvironment({
    testName: "componentTestTargets.292.phase3",
    container,
    sandboxElement,
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

// ################################################################################################
describe("componentTestTargets.292.phase3", () => {
  it("count on a regex byText counts every match", async () => {
    const env = mountFixture(
      <div>
        <span>Test Label</span>
        <span>Another Test Label</span>
        <span>unrelated</span>
      </div>,
    );
    await runComponentTestSteps(env, [
      { step: "expectElement", target: { byText: { regex: "Test Label" } }, count: 2 },
      { step: "expectElement", target: { byText: { regex: "test label", flags: "i" } }, count: 2 },
    ]);
    expect(
      await stepsError(env, [{ step: "expectElement", label: "one label", target: { byText: { regex: "Test Label" } }, count: 1 }]),
    ).toMatch(/^step 1 \(expectElement "one label"\): /);
  });

  it("present:false on a regex byLabelText passes without label and fails with one", async () => {
    const env = mountFixture(
      <div>
        <input type="text" name="TESTSECTION.testField" defaultValue="test-value" />
      </div>,
    );
    await runComponentTestSteps(env, [
      { step: "expectElement", target: { byLabelText: { regex: "Test Label" } }, present: false },
      { step: "expectElement", target: { byRole: "textbox" } },
    ]);

    mounted?.unmount();
    sandboxElement?.remove();
    const labelled = mountFixture(
      <div>
        <label htmlFor="testField">Test Label</label>
        <input id="testField" type="text" defaultValue="test-value" />
      </div>,
    );
    expect(
      await stepsError(labelled, [{ step: "expectElement", target: { byLabelText: { regex: "Test Label" } }, present: false }]),
    ).toMatch(/^step 1 \(expectElement\): /);
  });

  it("byDisplayValue with a number and the id refinement picks the input with that id", async () => {
    const env = mountFixture(
      <div>
        <input type="number" id="other" defaultValue={42} />
        <input type="number" id="testField" name="TESTSECTION.testField" defaultValue={42} />
      </div>,
    );
    await runComponentTestSteps(env, [
      { step: "expectElement", target: { byDisplayValue: 42, id: "testField" }, value: 42, saveAs: "input" },
      { step: "change", target: { ref: "input" }, value: 100 },
      { step: "expectElement", target: { ref: "input" }, value: 100 },
      { step: "expectElement", target: { byDisplayValue: 42 }, count: 1 },
      { step: "expectElement", target: { byDisplayValue: { regex: "^10" } }, value: 100 },
    ]);
    expect(env.sandboxElement.querySelector<HTMLInputElement>("#testField")!.value).toBe("100");
    expect(env.sandboxElement.querySelector<HTMLInputElement>("#other")!.value).toBe("42");
  });

  it("fieldName refines byRole checkbox; checked true, click, checked false", async () => {
    const env = mountFixture(
      <div>
        <input type="checkbox" name="TESTSECTION.other" />
        <input type="checkbox" name="TESTSECTION.testField" defaultChecked />
      </div>,
    );
    await runComponentTestSteps(env, [
      { step: "expectElement", target: { byRole: "checkbox", fieldName: "testField" }, checked: true, saveAs: "checkbox" },
      { step: "expectElement", target: { byRole: "checkbox", fieldName: "other" }, checked: false },
      { step: "click", target: { ref: "checkbox" } },
      { step: "expectElement", target: { ref: "checkbox" }, checked: false },
    ]);
    expect(
      await stepsError(env, [{ step: "expectElement", target: { byRole: "checkbox", fieldName: "testField" }, checked: true }]),
    ).toMatch(/^step 1 \(expectElement\): /);
  });

  it("submit on byRole form calls the form's onSubmit", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const env = mountFixture(
      <form aria-label="fixture form" onSubmit={onSubmit}>
        <input type="text" name="TESTSECTION.testField" defaultValue="x" />
      </form>,
    );
    await runComponentTestSteps(env, [{ step: "submit", target: { byRole: "form" } }]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("a regex that matches nothing gives step <n> (expectElement): …", async () => {
    const env = mountFixture(
      <div>
        <span>Test Label</span>
      </div>,
    );
    const message = await stepsError(env, [
      { step: "expectElement", target: { byText: { regex: "Test Label" } } },
      { step: "expectElement", target: { byText: { regex: "No Such Label" } } },
    ]);
    expect(message).toMatch(/^step 2 \(expectElement\): no element matches target /);
  });
});
