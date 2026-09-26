/**
 * Issue #286, PR #290 review fixes: one component test run at a time, and the suite wrappers are
 * released when the run ends.
 *
 * - `registerComponentTests` refuses a second registration while a run is active, with
 *   `componentTestRunInProgressMessage`, and keeps the first runner registered.
 * - `endRun()` releases the lock; `close()` releases it too (the display is unmounted mid-run).
 * - `runner.endRun()` destroys the `MiroirEventService` of every suite wrapper still open (a
 *   filtered run that does not reach the suite's last case) and keeps the last case mounted;
 *   `close()` then unmounts it without destroying the wrapper twice.
 *
 * The component registry is a one-component fake (a `<div>`), and the leaves have no steps, so no
 * editor is rendered (#292 M1: step leaves of a `reactComponentTestSuite`).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestRunLock.286.review
 * ```
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConfigurationService,
  MiroirEventService,
  type MiroirTestForReactComponent,
  type ReactComponentTestSuiteContext,
} from "miroir-core";

import {
  componentTestRunInProgressMessage,
  registerComponentTests,
  type ComponentTestRegistration,
} from "../../../../src/miroir-fwk/4-tests/componentTests/index";
import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";

const fakeComponentRegistry = {
  FakeComponent: (props: { text: string }) => <div data-testid="fake-component">{props.text}</div>,
};

/** The context of a two-case `reactComponentTestSuite` rendering `FakeComponent`. */
const fakeSuite: ReactComponentTestSuiteContext = {
  suitePath: ["FakeSuite_ComponentTestSuite", "FakeSuite"],
  component: "FakeComponent",
  componentProps: { text: "fake" },
  caseLabels: ["FakeSuite: first", "FakeSuite: last"],
};

function newSandbox(): HTMLElement {
  const element = document.createElement("div");
  document.body.appendChild(element);
  return element;
}

const caseContainers = (sandbox: HTMLElement) =>
  sandbox.querySelectorAll('[data-testid="component-test-container"]');

let registrations: ComponentTestRegistration[] = [];
let sandboxes: HTMLElement[] = [];
let destroySpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  registrations = [];
  sandboxes = [newSandbox(), newSandbox()];
  destroySpy = vi.spyOn(MiroirEventService.prototype, "destroy");
});

afterEach(() => {
  for (const registration of registrations) {
    registration.close();
  }
  for (const sandbox of sandboxes) {
    sandbox.remove();
  }
  destroySpy.mockRestore();
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

describe("component test run lock", () => {
  it("a second registration during an active run is refused with the message, and the first runner stays registered", () => {
    const first = registerComponentTests({ sandboxElement: sandboxes[0], componentRegistry: fakeComponentRegistry });
    registrations.push(first);
    const firstRunner = ConfigurationService.configurationService.reactComponentTestRunner;

    expect(() =>
      registrations.push(registerComponentTests({ sandboxElement: sandboxes[1], componentRegistry: fakeComponentRegistry })),
    ).toThrow(componentTestRunInProgressMessage);
    expect(ConfigurationService.configurationService.reactComponentTestRunner).toBe(firstRunner);
    // The refused registration added nothing to the second sandbox.
    expect(sandboxes[1].childElementCount).toBe(0);
  });

  it("endRun() releases the lock: the next registration succeeds", () => {
    const first = registerComponentTests({ sandboxElement: sandboxes[0], componentRegistry: fakeComponentRegistry });
    registrations.push(first);
    first.endRun();

    const second = registerComponentTests({ sandboxElement: sandboxes[1], componentRegistry: fakeComponentRegistry });
    registrations.push(second);
    expect(ConfigurationService.configurationService.reactComponentTestRunner).not.toBeUndefined();
  });

  it("close() during a run releases the lock", () => {
    const first = registerComponentTests({ sandboxElement: sandboxes[0], componentRegistry: fakeComponentRegistry });
    first.close();

    const second = registerComponentTests({ sandboxElement: sandboxes[1], componentRegistry: fakeComponentRegistry });
    registrations.push(second);
    expect(ConfigurationService.configurationService.reactComponentTestRunner).not.toBeUndefined();
  });
});

/** A `reactComponentTest` leaf of `fakeSuite`, with no steps (#292 M1). */
function fakeLeaf(caseLabel: string): MiroirTestForReactComponent {
  return {
    miroirTestType: "reactComponentTest",
    miroirTestLabel: `FakeSuite: ${caseLabel}`,
    steps: [],
  };
}

describe("runner.endRun()", () => {
  it("after a filtered run, destroys the open suite wrapper once and keeps the last case mounted; close() unmounts it", async () => {
    const runner = createReactComponentTestRunner({ sandboxElement: sandboxes[0], componentRegistry: fakeComponentRegistry });

    // Filtered run: only the suite's first case, so the "after the last case" release never fires.
    const result = await runner({
      testNamePath: [...fakeSuite.suitePath, "FakeSuite: first"],
      leaf: fakeLeaf("first"),
      suite: fakeSuite,
    });
    expect(result).toEqual({ status: "ok" });
    expect(destroySpy).toHaveBeenCalledTimes(0);

    runner.endRun();
    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(caseContainers(sandboxes[0])).toHaveLength(1);
    expect(sandboxes[0].querySelector('[data-testid="fake-component"]')?.textContent).toBe("fake");

    runner.close();
    expect(caseContainers(sandboxes[0])).toHaveLength(0);
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it("the next run after endRun() builds a new wrapper", async () => {
    const runner = createReactComponentTestRunner({ sandboxElement: sandboxes[0], componentRegistry: fakeComponentRegistry });
    await runner({
      testNamePath: [...fakeSuite.suitePath, "FakeSuite: first"],
      leaf: fakeLeaf("first"),
      suite: fakeSuite,
    });
    runner.endRun();
    const result = await runner({
      testNamePath: [...fakeSuite.suitePath, "FakeSuite: first"],
      leaf: fakeLeaf("first"),
      suite: fakeSuite,
    });
    expect(result).toEqual({ status: "ok" });
    runner.endRun();
    expect(destroySpy).toHaveBeenCalledTimes(2);
    runner.close();
  });
});
