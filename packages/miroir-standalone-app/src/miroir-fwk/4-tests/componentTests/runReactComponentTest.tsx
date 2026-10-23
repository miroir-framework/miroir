import type React from "react";

import {
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirLoggerFactory,
  type LoggerInterface,
  type ReactComponentTestRunner,
  type ReactComponentTestRunnerResult,
  type ReactComponentTestSuiteContext,
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../../4_view/constants.js";
import {
  ComponentTestModeContext,
  componentTestSandboxMode,
} from "../../4_view/tools/ComponentTestModeContext.js";
import { PortalContainerProvider } from "../../4_view/tools/PortalContainerContext.js";
import { TransformerTypesDisplayContext } from "../../4_view/components/TransformerEditor/TransformerTypesDisplay.js";
import {
  applyComponentTestDomConfig,
  configureComponentTestDom,
  createComponentTestEnvironment,
  mountComponent,
  waitForProgressiveRendering,
  type ComponentTestCaseControls,
  type MountedComponent,
} from "./componentTestEnvironment.js";
import {
  componentRegistration,
  componentRegistry as defaultComponentRegistry,
  type ComponentRegistry,
} from "./componentRegistry.js";
import { reviveComponentProps } from "./componentTestTargets.js";
import { buildComponentTestWrapper, type ComponentTestWrapper } from "./componentTestTools.js";
import { formatMeasurementTable } from "./measureRendering.js";
import {
  ComponentTestStepError,
  runComponentTestSteps,
  type ComponentTestRunControls,
} from "./runComponentTestSteps.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runReactComponentTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ComponentTestSandboxHost extends ComponentTestRunControls {
  /** Element that receives the portal element and one container per case. Never a render target. */
  sandboxElement: HTMLElement;
  /** Target of the components' portals. Created as a child of `sandboxElement` when absent. */
  portalElement?: HTMLElement;
  /** Components of the `reactComponentTestSuite` nodes (#292). Defaults to `componentRegistry`. */
  componentRegistry?: ComponentRegistry;
  /** Replaces the `iterations` of every `measureRendering` step of the run (#303 T7). */
  iterationsOverride?: number;
  /**
   * #453: the value the TransformerEditor's "Show transformer types" switch starts with in every
   * case, read when a case is rendered. A toggle in a case changes only that case.
   */
  showTransformerTypes?: () => boolean;
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
 *    The wrapper turns render tracking on (`trackRenders`) when the suite contains a
 *    `measureRendering` step (#303 T3).
 * 3. It unmounts the previous case, creates a fresh container under `sandboxElement`, and mounts
 *    the wrapped component into it.
 * 4. It runs the steps (`runComponentTestSteps`) with a fresh `ComponentTestEnvironment`, a thrown
 *    error becoming an `error` result (with the expected and actual values of a failed
 *    `expectRenderedValues`). The environment's `remount` / `rerender` act on the case's React
 *    root (#303 T4); the measurements of `measureRendering` steps (iterations replaced by
 *    `host.iterationsOverride` when set) go in the `ok` result and in the log, as a table.
 * 5. After the suite's last case (the last of `suite.caseLabels`), it destroys the suite
 *    wrapper's `MiroirEventService`; `endRun()` does the same for
 *    any wrapper still open when the run ends (a filtered run need not reach the suite's last
 *    case), and so does `close()`, which also puts back the `@testing-library/dom` configuration
 *    found when the runner was created.
 *
 * The component is rendered inside `ComponentTestModeContext` set to the sandbox mode, so that in
 * the app it renders the same DOM as under vitest, and inside `PortalContainerProvider` set to
 * the portal element, so that its option lists and MUI popups render inside the sandbox. With
 * the host's `showTransformerTypes`, it is also inside `TransformerTypesDisplayContext` (#453). The
 * last case stays mounted until `close()`, with its wrapper's `MiroirEventService` destroyed.
 */
export function createReactComponentTestRunner(
  host: ComponentTestSandboxHost,
): ClosableReactComponentTestRunner {
  const restoreDomConfig = configureComponentTestDom();
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
  /** The mounted case: its container, its React root, and its element for given props. */
  let currentCase:
    | {
        container: HTMLElement;
        mounted: MountedComponent | undefined;
        element: (props: Record<string, any>) => React.ReactElement;
        props: Record<string, any>;
      }
    | undefined;

  const unmountCurrentCase = () => {
    if (!currentCase) {
      return;
    }
    const { mounted, container } = currentCase;
    currentCase = undefined;
    try {
      mounted?.unmount();
    } finally {
      container.remove();
    }
  };

  /** `remount` / `rerender` of the mounted case (#303 T4). */
  const caseControls: ComponentTestCaseControls = {
    remount: async () => {
      if (!currentCase) {
        throw new Error("no mounted case to remount");
      }
      const mountedCase = currentCase;
      mountedCase.mounted?.unmount();
      mountedCase.mounted = undefined;
      mountedCase.mounted = mountComponent(mountedCase.element(mountedCase.props), mountedCase.container);
      await waitForProgressiveRendering(mountedCase.container);
    },
    rerender: async (propsOverride) => {
      if (!currentCase?.mounted) {
        throw new Error("no mounted case to rerender");
      }
      const props = { ...currentCase.props, ...reviveComponentProps(propsOverride ?? {}) };
      currentCase.mounted.render(currentCase.element(props));
      await waitForProgressiveRendering(currentCase.container);
    },
  };

  const destroySuiteWrapper = (key: string) => {
    const wrapper = suiteWrappers.get(key);
    if (!wrapper) {
      return;
    }
    suiteWrappers.delete(key);
    wrapper.miroirEventService.destroy();
  };

  /** #453: the switch value of the host when the case is rendered; none without a host value. */
  const transformerTypesDisplaySetting = () =>
    host.showTransformerTypes ? { initial: host.showTransformerTypes() } : undefined;

  /** Mounts `component` with `props` in a fresh case container, the previous case being unmounted. */
  const mountCase = async (
    wrapper: ComponentTestWrapper,
    Component: React.FC<any>,
    props: Record<string, any>,
  ): Promise<HTMLElement> => {
    unmountCurrentCase();
    applyComponentTestDomConfig();
    const container = sandboxElement.ownerDocument.createElement("div");
    container.setAttribute("data-testid", "component-test-container");
    sandboxElement.appendChild(container);

    const { Wrapper } = wrapper;
    const element = (elementProps: Record<string, any>) => (
      <ComponentTestModeContext.Provider value={componentTestSandboxMode}>
        <TransformerTypesDisplayContext.Provider value={transformerTypesDisplaySetting()}>
          <Wrapper>
            <PortalContainerProvider portalElement={portalElement}>
              <Component {...elementProps} />
            </PortalContainerProvider>
          </Wrapper>
        </TransformerTypesDisplayContext.Provider>
      </ComponentTestModeContext.Provider>
    );
    currentCase = { container, mounted: undefined, element, props };
    currentCase.mounted = mountComponent(element(props), container);
    await waitForProgressiveRendering(container);
    return container;
  };

  const suiteWrapper = (key: string, suite: ReactComponentTestSuiteContext) => {
    let wrapper = suiteWrappers.get(key);
    if (!wrapper) {
      // no suite sets a deployment map (analysis T13)
      wrapper = buildComponentTestWrapper({
        applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        // #303 T3: render tracking only for a suite that measures renders (other suites: same DOM)
        trackRenders: !!suite.stepKinds?.includes("measureRendering"),
        // #406: each case starts from the same TransformerEditor state, the app's is left untouched
        isolateToolsPageState: true,
        // #502: actions on the test local cache, and the suite's own instances
        wireLocalCacheCompositeAction: suite.wireLocalCacheCompositeAction,
        localCacheInstances: suite.localCacheInstances,
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
    const registryEntry = Object.prototype.hasOwnProperty.call(componentRegistry, suite.component)
      ? componentRegistry[suite.component]
      : undefined;
    if (!registryEntry) {
      return {
        status: "error",
        message: `component "${suite.component}" of suite "${suite.suitePath.join(" > ")}" is not in the component registry`,
      };
    }
    const { component: Component, fieldNamePrefix } = componentRegistration(registryEntry);
    // one wrapper per reactComponentTestSuite node, keyed by its path (T4)
    const wrapperKey = JSON.stringify(suite.suitePath);
    const testName = MiroirActivityTracker.testPathName(testNamePath);
    host.onCaseStart?.(testName);
    try {
      const container = await mountCase(
        suiteWrapper(wrapperKey, suite),
        Component,
        reviveComponentProps({ ...suite.componentProps, ...(leaf.componentProps ?? {}) }),
      );
      const { measurements } = await runComponentTestSteps(
        createComponentTestEnvironment({
          testName,
          container,
          sandboxElement,
          portalElement,
          log,
          caseControls,
          fieldNamePrefix,
        }),
        leaf.steps,
        {
          iterationsOverride: host.iterationsOverride,
          stepDelayMs: host.stepDelayMs,
          waitWhilePaused: host.waitWhilePaused,
        },
      );
      if (measurements.length === 0) {
        return { status: "ok" };
      }
      log.info(`render measurements of ${testName}\n${formatMeasurementTable(measurements)}`);
      return { status: "ok", measurements };
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
      try {
        endRun();
      } finally {
        restoreDomConfig();
      }
    }
  };

  return Object.assign(runner, { endRun, close });
}
