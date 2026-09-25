/**
 * Issue #286 Slice 8: `env.fireEvent` of the act-free driver fires the React-handled events the
 * way `@testing-library/react`'s `fireEvent` does, without importing it.
 *
 * React listens to `focusout` / `focusin` for `onBlur` / `onFocus`, to `mouseover` / `mouseout`
 * (and the pointer equivalents) for `onMouseEnter` / `onMouseLeave`, and builds `onSelect` from
 * `keyup` on a focused input. `@testing-library/react` wraps `@testing-library/dom`'s `fireEvent`
 * to fire those native events too. The old JzodElementEditor suites used that wrapper, so a
 * `fireEvent.blur` there ran the editor's `onBlur` (the record key rename commits on blur).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestFireEvent.286.phase8
 * ```
 */
import { fireEvent as domFireEvent, getConfig, configure } from "@testing-library/dom";
import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { MiroirLoggerFactory } from "miroir-core";

import {
  configureComponentTestDom,
  createComponentTestEnvironment,
  mountComponent,
  nextMacrotask,
  type MountedComponent,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestEnvironment.js";

const log = MiroirLoggerFactory.getPreStartLogger("componentTestFireEvent.286.phase8");

let savedDomConfig: ReturnType<typeof getConfig>;
let savedActEnvironment: unknown;
let mounted: MountedComponent | undefined;
let container: HTMLElement;

beforeAll(() => {
  savedActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  savedDomConfig = { ...getConfig() };
  configureComponentTestDom();
});

afterAll(() => {
  configure(savedDomConfig);
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = savedActEnvironment;
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  container?.remove();
});

function mountWithHandlers(calls: string[]): {
  env: ReturnType<typeof createComponentTestEnvironment>;
  input: HTMLInputElement;
  box: HTMLElement;
} {
  container = document.createElement("div");
  document.body.appendChild(container);
  mounted = mountComponent(
    <div>
      <input
        aria-label="field"
        defaultValue="some text"
        onBlur={() => calls.push("blur")}
        onFocus={() => calls.push("focus")}
        onSelect={() => calls.push("select")}
      />
      <div
        data-testid="box"
        onMouseEnter={() => calls.push("mouseEnter")}
        onMouseLeave={() => calls.push("mouseLeave")}
        onPointerEnter={() => calls.push("pointerEnter")}
        onPointerLeave={() => calls.push("pointerLeave")}
      />
    </div>,
    container,
  );
  const env = createComponentTestEnvironment({
    testName: "componentTestFireEvent.286.phase8",
    container,
    sandboxElement: container,
    portalElement: container,
    log,
  });
  return {
    env,
    input: env.view.getByRole("textbox", { name: "field" }) as HTMLInputElement,
    box: env.view.getByTestId("box"),
  };
}

describe("componentTestFireEvent.286.phase8", () => {
  it("fireEvent.blur and fireEvent.focus run the React onBlur and onFocus handlers", async () => {
    const calls: string[] = [];
    const { env, input } = mountWithHandlers(calls);
    await env.act(() => {
      env.fireEvent.focus(input);
    });
    await env.act(() => {
      env.fireEvent.blur(input);
    });
    expect(calls).toEqual(["focus", "blur"]);
  });

  it("fireEvent.mouseEnter / mouseLeave / pointerEnter / pointerLeave run the React handlers", async () => {
    const calls: string[] = [];
    const { env, box } = mountWithHandlers(calls);
    await env.act(() => {
      env.fireEvent.mouseEnter(box);
      env.fireEvent.mouseLeave(box);
      env.fireEvent.pointerEnter(box);
      env.fireEvent.pointerLeave(box);
    });
    expect(calls).toEqual(["mouseEnter", "mouseLeave", "pointerEnter", "pointerLeave"]);
  });

  it("fireEvent.select runs the React onSelect handler", async () => {
    const calls: string[] = [];
    const { env, input } = mountWithHandlers(calls);
    await env.act(() => {
      env.fireEvent.select(input);
    });
    expect(calls).toContain("select");
  });

  it("keeps every @testing-library/dom event helper and the callable form", async () => {
    const calls: string[] = [];
    const { env, input } = mountWithHandlers(calls);
    expect(Object.keys(env.fireEvent).sort()).toEqual(Object.keys(domFireEvent).sort());
    await env.act(() => {
      env.fireEvent(input, new FocusEvent("focusout", { bubbles: true }));
    });
    await nextMacrotask();
    expect(calls).toEqual(["blur"]);
  });
});
