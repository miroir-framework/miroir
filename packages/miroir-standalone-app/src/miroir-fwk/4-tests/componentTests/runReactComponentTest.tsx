import type React from "react";

import {
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirLoggerFactory,
  type LoggerInterface,
  type ReactComponentTestRunner,
  type ReactComponentTestRunnerResult,
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../../4_view/constants.js";
import {
  ComponentTestModeContext,
  componentTestSandboxMode,
} from "../../4_view/tools/ComponentTestModeContext.js";
import { PortalContainerProvider } from "../../4_view/tools/PortalContainerContext.js";
import {
  configureComponentTestDom,
  createComponentTestEnvironment,
  mountComponent,
  waitForProgressiveRendering,
} from "./componentTestEnvironment.js";
import { componentRegistry as defaultComponentRegistry, type ComponentRegistry } from "./componentRegistry.js";
import { reviveComponentProps } from "./componentTestTargets.js";
import { buildComponentTestWrapper, type ComponentTestWrapper } from "./componentTestTools.js";
import { ComponentTestStepError, runComponentTestSteps } from "./runComponentTestSteps.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runReactComponentTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ComponentTestSandboxHost {
  /** Element that receives the portal element and one container per case. Never a render target. */
  sandboxElement: HTMLElement;
  /** Target of the components' portals. Created as a child of `sandboxElement` when absent. */
  portalElement?: HTMLElement;
  /** Components of the `reactComponentTestSuite` nodes (#292). Defaults to `componentRegistry`. */
  componentRegistry?: ComponentRegistry;
}

/**
 * The runner, `endRun()`, which destroys the open suite wrappers at the end of a run and keeps the
 * last case mounted, and `close()`, which unmounts the last case and destroys the open wrappers.
 */
export type ClosableReactComponentTestRunner = ReactComponentTestRunner & {
  endRun: () => void;
  close: () => void;
};

// ################################################################################################
/**
 * The `ReactComponentTestRunner` of `reactComponentTest` leaves (#286 analysis §5.6, #292 analysis
 * §5.3). Every leaf belongs to a `reactComponentTestSuite` and has declarative `steps` (#292 M1).
 *
 * 1. The component is `componentRegistry[suite.component]` and its props are the suite's
 *    `componentProps` shallow-merged under the leaf's, with `{"$bigint": …}` revived. A call
 *    without `suite`, a leaf without `steps`, or an unknown component is an `error` result.
 * 2. It builds one wrapper (providers over its own `LocalCache`) per suite, keyed by the
 *    `reactComponentTestSuite` path, on the suite's first case, and reuses it for the later cases.
 * 3. It unmounts the previous case, creates a fresh container under `sandboxElement`, and mounts
 *    the wrapped component into it.
 * 4. It runs the steps (`runComponentTestSteps`) with a fresh `ComponentTestEnvironment`, a thrown
 *    error becoming an `error` result (with the expected and actual values of a failed
 *    `expectRenderedValues`).
 * 5. After the suite's last case (the last of `suite.caseLabels`), it destroys the suite
 *    wrapper's `MiroirEventService`; `endRun()` does the same for
 *    any wrapper still open when the run ends (a filtered run need not reach the suite's last
 *    case), and so does `close()`.
 *
 * The component is rendered inside `ComponentTestModeContext` set to the sandbox mode, so that in
 * the app it renders the same DOM as under vitest, and inside `PortalContainerProvider` set to
 * the portal element, so that its option lists and MUI popups render inside the sandbox. The
 * last case stays mounted until `close()`, with its wrapper's `MiroirEventService` destroyed.
 */
export function createReactComponentTestRunner(
  host: ComponentTestSandboxHost,
): ClosableReactComponentTestRunner {
  configureComponentTestDom();
  const componentRegistry = host.componentRegistry ?? defaultComponentRegistry;
  const sandboxElement = host.sandboxElement;
  const ownsPortalElement = !host.portalElement;
  const portalElement =
    host.portalElement ??
    (() => {
      const element = sandboxElement.ownerDocument.createElement("div");
      element.setAttribute("data-testid", "component-test-portal");
      sandboxElement.appendChild(element);
      return element;
    })();

  const suiteWrappers = new Map<string, ComponentTestWrapper>();
  let currentCase: { unmount: () => void; container: HTMLElement } | undefined;

  const unmountCurrentCase = () => {
    if (!currentCase) {
      return;
    }
    const { unmount, container } = currentCase;
    currentCase = undefined;
    try {
      unmount();
    } finally {
      container.remove();
    }
  };

  const destroySuiteWrapper = (key: string) => {
    const wrapper = suiteWrappers.get(key);
    if (!wrapper) {
      return;
    }
    suiteWrappers.delete(key);
    wrapper.miroirEventService.destroy();
  };

  /** Mounts `component` with `props` in a fresh case container, the previous case being unmounted. */
  const mountCase = async (
    wrapper: ComponentTestWrapper,
    Component: React.FC<any>,
    props: Record<string, any>,
  ): Promise<HTMLElement> => {
    unmountCurrentCase();
    const container = sandboxElement.ownerDocument.createElement("div");
    container.setAttribute("data-testid", "component-test-container");
    sandboxElement.appendChild(container);

    const { Wrapper } = wrapper;
    currentCase = { container, unmount: () => undefined };
    currentCase.unmount = mountComponent(
      <ComponentTestModeContext.Provider value={componentTestSandboxMode}>
        <Wrapper>
          <PortalContainerProvider portalElement={portalElement}>
            <Component {...props} />
          </PortalContainerProvider>
        </Wrapper>
      </ComponentTestModeContext.Provider>,
      container,
    ).unmount;
    await waitForProgressiveRendering(container);
    return container;
  };

  const suiteWrapper = (key: string) => {
    let wrapper = suiteWrappers.get(key);
    if (!wrapper) {
      // no suite sets a deployment map (analysis T13)
      wrapper = buildComponentTestWrapper({
        applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
      });
      suiteWrappers.set(key, wrapper);
    }
    return wrapper;
  };

  const failure = (testName: string, error: unknown): ReactComponentTestRunnerResult => {
    const message = error instanceof Error ? error.message : String(error);
    log.info("component test failed", testName, message);
    if (error instanceof ComponentTestStepError && error.hasComparedValues) {
      return { status: "error", message, expected: error.expected, actual: error.actual };
    }
    return { status: "error", message };
  };

  // ##############################################################################################
  /** A leaf of a `reactComponentTestSuite`, with declarative `steps` (#292, analysis §5.3). */
  const runner: ReactComponentTestRunner = async ({ testNamePath, leaf, suite }) => {
    // `suite` and `steps` are required by the types; a caller or a JSON that bypasses them gets an error result.
    if (!suite) {
      return {
        status: "error",
        message: `reactComponentTest "${leaf.miroirTestLabel}" is not in a reactComponentTestSuite`,
      };
    }
    if (!Array.isArray(leaf.steps)) {
      return {
        status: "error",
        message: `reactComponentTest "${leaf.miroirTestLabel}" has no steps`,
      };
    }
    const Component = componentRegistry[suite.component];
    if (!Component) {
      return {
        status: "error",
        message: `component "${suite.component}" of suite "${suite.suitePath.join(" > ")}" is not in the component registry`,
      };
    }
    // one wrapper per reactComponentTestSuite node, keyed by its path (T4)
    const wrapperKey = JSON.stringify(suite.suitePath);
    const testName = MiroirActivityTracker.testPathName(testNamePath);
    try {
      const container = await mountCase(
        suiteWrapper(wrapperKey),
        Component,
        reviveComponentProps({ ...suite.componentProps, ...(leaf.componentProps ?? {}) }),
      );
      await runComponentTestSteps(
        createComponentTestEnvironment({ testName, container, sandboxElement, portalElement, log }),
        leaf.steps,
      );
      return { status: "ok" };
    } catch (error) {
      return failure(testName, error);
    } finally {
      if (leaf.miroirTestLabel === suite.caseLabels[suite.caseLabels.length - 1]) {
        destroySuiteWrapper(wrapperKey);
      }
    }
  };

  const endRun = () => {
    for (const key of [...suiteWrappers.keys()]) {
      destroySuiteWrapper(key);
    }
  };

  const close = () => {
    try {
      unmountCurrentCase();
    } finally {
      if (ownsPortalElement) {
        portalElement.remove();
      }
      endRun();
    }
  };

  return Object.assign(runner, { endRun, close });
}
