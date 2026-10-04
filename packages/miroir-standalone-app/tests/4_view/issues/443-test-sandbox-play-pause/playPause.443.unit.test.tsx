/**
 * Issue #443: the play / pause button of the Component Test Sandbox.
 *
 * - `runComponentTestSteps` awaits `waitWhilePaused()` before each step, after the step delay.
 * - The pause gate of the sandbox holds that wait until `resume()`.
 * - The header button shows "Pause" during a run, "Play" once paused, and is disabled without a run.
 *
 * The runner fixture is the counter button of `stepDelay.435`, mounted with the act-free
 * `mountComponent`. The header renders without `stepDelayMsRef`, so without the slider and its
 * Redux store.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- playPause.443
 * ```
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { LoggerInterface, ReactComponentTestStep } from "miroir-core";

import {
  createComponentTestEnvironment,
  mountComponent,
  type ComponentTestEnvironment,
  type MountedComponent,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestEnvironment";
import { runComponentTestSteps } from "../../../../src/miroir-fwk/4-tests/componentTests/runComponentTestSteps";
import {
  ComponentTestSandbox,
  createComponentTestPauseGate,
} from "../../../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox";

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
    testName: "playPause.443",
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

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

// ################################################################################################
describe("pause gate (#443)", () => {
  it("resolves at once when not paused, and holds until resume when paused", async () => {
    const gate = createComponentTestPauseGate();
    expect(gate.isPaused()).toBe(false);
    await gate.waitWhilePaused();

    gate.pause();
    gate.pause(); // a second pause keeps the same hold
    expect(gate.isPaused()).toBe(true);
    let released = false;
    const wait = gate.waitWhilePaused().then(() => {
      released = true;
    });
    await tick();
    expect(released).toBe(false);

    gate.resume();
    await wait;
    expect(released).toBe(true);
    expect(gate.isPaused()).toBe(false);
  });
});

// ################################################################################################
describe("runner pause (#443)", () => {
  it("holds the run before the next step while paused, and goes on after resume", async () => {
    const env = mountCounter();
    const gate = createComponentTestPauseGate();
    let waits = 0;
    const run = runComponentTestSteps(env, steps, {
      waitWhilePaused: () => {
        waits += 1;
        // paused after the first step has run
        if (waits === 2) {
          gate.pause();
        }
        return gate.waitWhilePaused();
      },
    });

    await vi.waitFor(() => expect(waits).toBe(2), { timeout: 2000 });
    // held: the second click does not happen
    await tick();
    await tick();
    expect(waits).toBe(2);
    expect(sandboxElement!.textContent).toBe("count 1");

    gate.resume();
    await run;
    expect(waits).toBe(3);
    expect(sandboxElement!.textContent).toBe("count 2");
  });

  it("waits the step delay before the pause check", async () => {
    const env = mountCounter();
    const calls: string[] = [];
    await runComponentTestSteps(env, steps.slice(0, 1), {
      stepDelayMs: () => {
        calls.push("delay");
        return 10;
      },
      waitWhilePaused: async () => {
        calls.push("pause");
      },
    });
    expect(calls).toEqual(["delay", "pause"]);
  });
});

// ################################################################################################
describe("Component Test Sandbox play / pause button (#443)", () => {
  function renderHeader(props: { running: boolean; paused: boolean; onPausedChange: (paused: boolean) => void }) {
    const sandboxRef = React.createRef<HTMLDivElement>();
    return render(<ComponentTestSandbox open onClose={() => {}} sandboxRef={sandboxRef} {...props} />);
  }

  it("shows Pause during a run and asks to pause", () => {
    const onPausedChange = vi.fn();
    renderHeader({ running: true, paused: false, onPausedChange });
    const button = screen.getByRole("button", { name: "Pause component test run" });
    expect(button).toBeEnabled();
    expect(button.textContent).toContain("Pause");
    fireEvent.click(button);
    expect(onPausedChange).toHaveBeenCalledWith(true);
  });

  it("shows Play once paused and asks to resume", () => {
    const onPausedChange = vi.fn();
    renderHeader({ running: true, paused: true, onPausedChange });
    const button = screen.getByRole("button", { name: "Resume component test run" });
    expect(button.textContent).toContain("Play");
    fireEvent.click(button);
    expect(onPausedChange).toHaveBeenCalledWith(false);
  });

  it("is disabled without a run", () => {
    renderHeader({ running: false, paused: false, onPausedChange: vi.fn() });
    expect(screen.getByRole("button", { name: "Pause component test run" })).toBeDisabled();
  });
});
