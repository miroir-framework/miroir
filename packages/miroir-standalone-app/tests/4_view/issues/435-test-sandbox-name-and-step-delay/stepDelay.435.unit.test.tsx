/**
 * Issue #435: `runComponentTestSteps` waits `stepDelayMs()` before each step, reading the value
 * when the step starts, so that the sandbox's slider acts on the running case.
 *
 * The fixture is a counter button mounted with the act-free `mountComponent`, as in
 * `componentTestTargets.292.phase3`. Only a lower bound of the elapsed time is asserted: a timer
 * never fires early.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- stepDelay.435
 * ```
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

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

const Counter: React.FC = () => {
  const [count, setCount] = React.useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {`count ${count}`}
    </button>
  );
};

function mountCounter(): ComponentTestEnvironment {
  sandboxElement = document.createElement("div");
  const portalElement = document.createElement("div");
  const container = document.createElement("div");
  sandboxElement.append(portalElement, container);
  document.body.appendChild(sandboxElement);
  mounted = mountComponent(<Counter />, container);
  return createComponentTestEnvironment({
    testName: "stepDelay.435",
    container,
    sandboxElement,
    portalElement,
    log: silentLog,
  });
}

const steps: ReactComponentTestStep[] = [
  { step: "click", target: { byRole: "button" } },
  { step: "click", target: { byRole: "button" } },
  { step: "expectElement", target: { byText: "count 2" } },
];

// ################################################################################################
describe("step delay (#435)", () => {
  it("reads the delay before each step and waits it, a changed value acting on the next step", async () => {
    const env = mountCounter();
    let delayMs = 40;
    /** The button text when each delay is read, and the delay returned. */
    const reads: { text: string; delayMs: number }[] = [];
    const start = performance.now();

    await runComponentTestSteps(env, steps, {
      stepDelayMs: () => {
        reads.push({ text: sandboxElement!.textContent ?? "", delayMs });
        // the slider moves during the case: the next steps get the new value
        delayMs = 80;
        return reads[reads.length - 1].delayMs;
      },
    });

    expect(reads).toEqual([
      { text: "count 0", delayMs: 40 },
      { text: "count 1", delayMs: 80 },
      { text: "count 2", delayMs: 80 },
    ]);
    expect(performance.now() - start).toBeGreaterThanOrEqual(40 + 80 + 80 - 5);
  });

  it("does not wait without stepDelayMs", async () => {
    const env = mountCounter();
    await runComponentTestSteps(env, steps);
    expect(sandboxElement!.textContent).toBe("count 2");
  });
});
