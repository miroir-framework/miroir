import {
  configure,
  fireEvent,
  queries,
  waitFor,
  within,
  type BoundFunctions,
} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import type React from "react";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import {
  createThrowingExpect,
  type ApplicationDeploymentMap,
  type LoggerInterface,
  type ThrowingExpect,
} from "miroir-core";

// ################################################################################################
// Act-free component test driver (#286, analysis §5.3).
//
// Used by the component test vitest entry and, later, by the app sandbox. It never calls React
// `act`, which throws in production builds of React, and it does not import
// `@testing-library/react`: `@testing-library/dom` gives the queries, `fireEvent` and `waitFor`,
// `@testing-library/user-event` the typing, and `mountComponent` renders with `createRoot` inside
// `flushSync`.
// ################################################################################################

/** The object passed to each component test body. */
export interface ComponentTestEnvironment {
  /** Throwing `expect` (miroir-core `createThrowingExpect`), vitest's `(actual, message)` signature. */
  expect: ThrowingExpect;
  /**
   * Testing Library queries bound to the sandbox element, which holds only the portal element
   * and the current case's container: the queries see the rendered component and its portals,
   * and nothing else of the page.
   */
  view: BoundFunctions<typeof queries>;
  /** The current case's render target, a child of `sandboxElement`. */
  container: HTMLElement;
  /** `componentTestFireEvent`: `@testing-library/dom`'s `fireEvent` plus the React additions. */
  fireEvent: typeof fireEvent;
  userEvent: typeof userEvent;
  /** Awaits `callback`, then one macrotask so that React commits pending updates. No React `act`. */
  act: (callback: () => unknown) => Promise<void>;
  waitFor: typeof waitFor;
  sandboxElement: HTMLElement;
  portalElement: HTMLElement;
  log: LoggerInterface;
}

export interface ComponentTestCase<Props extends Record<string, any>> {
  /** Case props, or a function of the suite props. Defaults to the suite props. */
  props?: Props | ((suiteProps: Props) => Props);
  tests: (env: ComponentTestEnvironment) => Promise<void>;
}

export interface ComponentTestSuite<Props extends Record<string, any>> {
  component: React.FC<Props>;
  suiteProps: Props;
  /** Deployment map of the suite's wrapper. Defaults to `defaultSelfApplicationDeploymentMap`. */
  applicationDeploymentMap?: ApplicationDeploymentMap;
  /** Case label to case, in execution order. */
  cases: Record<string, ComponentTestCase<Props>>;
}

export type ComponentTestRegistry = Record<string, ComponentTestSuite<any>>;

// ################################################################################################
/**
 * Configures `@testing-library/dom` for the act-free driver: the same timeout in vitest and in
 * the app, and event / async wrappers that do not go through React `act` (they replace the ones
 * `@testing-library/react` installs when it is imported, as `tests/setup.ts` does).
 */
export function configureComponentTestDom(): void {
  configure({
    asyncUtilTimeout: 5000,
    testIdAttribute: "data-testid",
    eventWrapper: (callback) => callback(),
    asyncWrapper: (callback) => callback(),
  });
}

export function nextMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function componentTestAct(callback: () => unknown): Promise<void> {
  await callback();
  await nextMacrotask();
}

// ################################################################################################
/**
 * `@testing-library/dom`'s `fireEvent`, with the React-specific additions of
 * `@testing-library/react`'s `fireEvent` (#286 Slice 8), without importing it and without `act`.
 * React runs `onBlur` / `onFocus` from native `focusout` / `focusin`, `onMouseEnter` /
 * `onMouseLeave` (and the pointer equivalents) from `mouseover` / `mouseout`, and builds `onSelect`
 * from a `keyup` on a focused input, so those events are fired as well.
 */
export const componentTestFireEvent: typeof fireEvent = (() => {
  const reactFireEvent = ((...args: Parameters<typeof fireEvent>) =>
    fireEvent(...args)) as typeof fireEvent;
  for (const key of Object.keys(fireEvent) as (keyof typeof fireEvent)[]) {
    (reactFireEvent as any)[key] = (...args: any[]) => (fireEvent as any)[key](...args);
  }
  reactFireEvent.mouseEnter = (...args) => {
    fireEvent.mouseEnter(...args);
    return fireEvent.mouseOver(...args);
  };
  reactFireEvent.mouseLeave = (...args) => {
    fireEvent.mouseLeave(...args);
    return fireEvent.mouseOut(...args);
  };
  reactFireEvent.pointerEnter = (...args) => {
    fireEvent.pointerEnter(...args);
    return fireEvent.pointerOver(...args);
  };
  reactFireEvent.pointerLeave = (...args) => {
    fireEvent.pointerLeave(...args);
    return fireEvent.pointerOut(...args);
  };
  reactFireEvent.select = (node, init) => {
    fireEvent.select(node, init);
    (node as HTMLElement).focus?.();
    return fireEvent.keyUp(node, init);
  };
  reactFireEvent.blur = (...args) => {
    fireEvent.focusOut(...args);
    return fireEvent.blur(...args);
  };
  reactFireEvent.focus = (...args) => {
    fireEvent.focusIn(...args);
    return fireEvent.focus(...args);
  };
  return reactFireEvent;
})();

// ################################################################################################
export interface MountedComponent {
  unmount: () => void;
}

/** Renders `element` into `target` with its own React root, synchronously, without `act`. */
export function mountComponent(element: ReactElement, target: HTMLElement): MountedComponent {
  const root = createRoot(target);
  flushSync(() => {
    root.render(element);
  });
  return {
    unmount: () => root.unmount(),
  };
}

// ################################################################################################
const progressiveRenderingPlaceholder = /Loading .+\.\.\./;

/**
 * Act-free equivalent of the tests-side `waitForProgressiveRendering`: waits until `root` shows no
 * progressive-reveal placeholder, then one macrotask. Under vitest progressive reveal is disabled,
 * so the wait ends at the first check.
 */
export async function waitForProgressiveRendering(root: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      const loadingMessages = within(root).queryAllByText(progressiveRenderingPlaceholder);
      if (loadingMessages.length > 0) {
        throw new Error(`Still loading: ${loadingMessages.length} loading messages found`);
      }
    },
    { container: root, timeout: 15000, interval: 150 },
  );
  await nextMacrotask();
}

/** Act-free equivalent of the tests-side `waitAfterUserInteraction`. */
export async function waitAfterUserInteraction(root: HTMLElement): Promise<void> {
  await waitForProgressiveRendering(root);
  await sleep(300);
}

// ################################################################################################
export function createComponentTestEnvironment(params: {
  testName: string;
  container: HTMLElement;
  sandboxElement: HTMLElement;
  portalElement: HTMLElement;
  log: LoggerInterface;
}): ComponentTestEnvironment {
  return {
    expect: createThrowingExpect(params.testName),
    view: within(params.sandboxElement),
    container: params.container,
    fireEvent: componentTestFireEvent,
    userEvent,
    act: componentTestAct,
    waitFor,
    sandboxElement: params.sandboxElement,
    portalElement: params.portalElement,
    log: params.log,
  };
}
