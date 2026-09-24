import {
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirLoggerFactory,
  type LoggerInterface,
  type ReactComponentTestRunner,
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../../4_view/constants.js";
import {
  ComponentTestModeContext,
  componentTestSandboxMode,
} from "../../4_view/tools/ComponentTestModeContext.js";
import {
  configureComponentTestDom,
  createComponentTestEnvironment,
  mountComponent,
  waitForProgressiveRendering,
  type ComponentTestRegistry,
} from "./componentTestEnvironment.js";
import { componentTestRegistry } from "./componentTestRegistry.js";
import { buildComponentTestWrapper, type ComponentTestWrapper } from "./componentTestTools.js";

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
  /** Defaults to `componentTestRegistry`. */
  registry?: ComponentTestRegistry;
}

/** The runner, and `close()`, which unmounts the current case and destroys the open wrappers. */
export type ClosableReactComponentTestRunner = ReactComponentTestRunner & { close: () => void };

// ################################################################################################
/**
 * The `ReactComponentTestRunner` of `reactComponentTest` leaves (#286, analysis §5.6):
 *
 * 1. looks up the suite and case in the registry, an unknown reference being an `error` result;
 * 2. builds one wrapper (providers over its own `LocalCache`) per suite, on the suite's first
 *    case, and reuses it for the later cases;
 * 3. unmounts the previous case, creates a fresh container under `sandboxElement`, and mounts the
 *    wrapped component into it;
 * 4. runs the case body with a fresh `ComponentTestEnvironment`, a thrown error becoming an
 *    `error` result;
 * 5. after the suite's last case (in registry order), destroys the suite wrapper's
 *    `MiroirEventService`; `close()` does the same for any wrapper still open.
 *
 * The component is rendered inside `ComponentTestModeContext` set to the sandbox mode, so that in
 * the app it renders the same DOM as under vitest. The last case stays mounted until `close()`.
 */
export function createReactComponentTestRunner(
  host: ComponentTestSandboxHost,
): ClosableReactComponentTestRunner {
  configureComponentTestDom();
  const registry = host.registry ?? componentTestRegistry;
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

  const destroySuiteWrapper = (suiteName: string) => {
    const wrapper = suiteWrappers.get(suiteName);
    if (!wrapper) {
      return;
    }
    suiteWrappers.delete(suiteName);
    wrapper.miroirEventService.destroy();
  };

  const runner: ReactComponentTestRunner = async ({ componentTestRef, testNamePath }) => {
    const suite = registry[componentTestRef.suite];
    if (!suite) {
      return {
        status: "error",
        message: `component test suite "${componentTestRef.suite}" is not in the component test registry`,
      };
    }
    const testCase = suite.cases[componentTestRef.case];
    if (!testCase) {
      return {
        status: "error",
        message: `component test case "${componentTestRef.case}" is not in suite "${componentTestRef.suite}" of the component test registry`,
      };
    }

    const testName = MiroirActivityTracker.testPathName(testNamePath);
    try {
      let wrapper = suiteWrappers.get(componentTestRef.suite);
      if (!wrapper) {
        wrapper = buildComponentTestWrapper({
          applicationDeploymentMap: suite.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
        });
        suiteWrappers.set(componentTestRef.suite, wrapper);
      }

      unmountCurrentCase();
      const container = sandboxElement.ownerDocument.createElement("div");
      container.setAttribute("data-testid", "component-test-container");
      sandboxElement.appendChild(container);

      const props =
        typeof testCase.props === "function"
          ? testCase.props(suite.suiteProps)
          : testCase.props ?? suite.suiteProps;
      const { Wrapper } = wrapper;
      const Component = suite.component;
      currentCase = { container, unmount: () => undefined };
      currentCase.unmount = mountComponent(
        <ComponentTestModeContext.Provider value={componentTestSandboxMode}>
          <Wrapper>
            <Component {...props} />
          </Wrapper>
        </ComponentTestModeContext.Provider>,
        container,
      ).unmount;
      await waitForProgressiveRendering(container);

      await testCase.tests(
        createComponentTestEnvironment({
          testName,
          container,
          sandboxElement,
          portalElement,
          log,
        }),
      );
      return { status: "ok" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.info("component test failed", testName, message);
      return { status: "error", message };
    } finally {
      const caseLabels = Object.keys(suite.cases);
      if (componentTestRef.case === caseLabels[caseLabels.length - 1]) {
        destroySuiteWrapper(componentTestRef.suite);
      }
    }
  };

  const close = () => {
    try {
      unmountCurrentCase();
    } finally {
      if (ownsPortalElement) {
        portalElement.remove();
      }
      for (const suiteName of [...suiteWrappers.keys()]) {
        destroySuiteWrapper(suiteName);
      }
    }
  };

  return Object.assign(runner, { close });
}
