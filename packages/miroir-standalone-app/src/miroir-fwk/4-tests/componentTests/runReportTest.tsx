import type React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  MiroirActivityTracker,
  MiroirContext,
  MiroirLoggerFactory,
  defaultMiroirModelEnvironment,
  runReportTestCompositeActionStep,
  runReportTestExpectActionResultStep,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerInterface,
  type MiroirActivityTrackerInterface,
  type MiroirEventService,
  type ReportTestActionContext,
  type ReportTestCompositeActionStep,
  type ReportTestExpectActionResultStep,
  type ReportTestRunner,
  type ReportTestRunnerResult,
  type ReportTestSuiteContext,
} from "miroir-core";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../../4_view/constants.js";
import { PageDispatcher } from "../../4_view/PageDispatcher.js";
import { markPageConfigurationsLoaded } from "../../4_view/services/usePageConfiguration.js";
import {
  ComponentTestModeContext,
  componentTestSandboxMode,
} from "../../4_view/tools/ComponentTestModeContext.js";
import { PortalContainerProvider } from "../../4_view/tools/PortalContainerContext.js";
import {
  applyComponentTestDomConfig,
  configureComponentTestDom,
  createComponentTestEnvironment,
  mountComponent,
  waitAfterUserInteraction,
  waitForProgressiveRendering,
  type MountedComponent,
} from "./componentTestEnvironment.js";
import { MiroirTestProviders } from "./componentTestTools.js";
import {
  ComponentTestStepError,
  StepValuesMismatch,
  runComponentTestSteps,
} from "./runComponentTestSteps.js";
import { createActionsIdleWaiter, defaultReportTestActionTimeoutMs } from "./waitForActionsIdle.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runReportTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ReportTestSandboxHost {
  /** Element that receives the portal element and one container per case. Never a render target. */
  sandboxElement: HTMLElement;
  /** Target of the Report's portals. Created as a child of `sandboxElement` when absent. */
  portalElement?: HTMLElement;
  /** Tracker and event service of the integration session (those of its DomainController). */
  miroirActivityTracker: MiroirActivityTrackerInterface;
  miroirEventService: MiroirEventService;
}

/** The runner and `close()`, which releases the portal element and the DOM configuration. */
export type ClosableReportTestRunner = ReportTestRunner & { close: () => void };

/**
 * The route of the Report under test (`PageDispatcher` query-param format), `instanceUuid` of the
 * leaf replacing the suite's.
 */
export function reportTestUrl(
  report: ReportTestSuiteContext["report"],
  deploymentUuid: string,
  instanceUuid: string | undefined,
): string {
  const searchParams = new URLSearchParams({
    page: "report",
    application: report.application,
    deploymentUuid,
    applicationSection: report.applicationSection,
    reportUuid: report.reportUuid,
  });
  const effectiveInstanceUuid = instanceUuid ?? report.instanceUuid;
  if (effectiveInstanceUuid !== undefined) {
    searchParams.set("instanceUuid", effectiveInstanceUuid);
  }
  return `/?${searchParams.toString()}`;
}

/**
 * Reloads the local cache of `applications` from their stores (rollback), so that the Report
 * reads what the testbed reset wrote there.
 */
async function refreshLocalCache(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  applications: string[],
): Promise<void> {
  for (const application of applications) {
    const result = await domainController.handleAction(
      {
        actionType: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: { application },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (result?.status !== "ok") {
      throw new Error(
        `could not refresh the local cache of application ${application}: ${JSON.stringify(result)}`,
      );
    }
  }
}

/** Throws the error of a failed action or assertion step, with its compared values if any. */
function throwOnError(outcome: ReportTestRunnerResult): void {
  if (outcome.status === "ok") {
    return;
  }
  if (outcome.expected !== undefined || outcome.actual !== undefined) {
    throw new StepValuesMismatch(outcome.message, outcome.expected, outcome.actual);
  }
  throw new Error(outcome.message);
}

/** The handlers of the action and assertion steps of one leaf, sharing its kept results. */
function actionStepHandlers(actionContext: ReportTestActionContext) {
  return {
    compositeAction: async (step: ReportTestCompositeActionStep | ReportTestExpectActionResultStep) =>
      throwOnError(
        await runReportTestCompositeActionStep(actionContext, step as ReportTestCompositeActionStep),
      ),
    expectActionResult: async (step: ReportTestCompositeActionStep | ReportTestExpectActionResultStep) =>
      throwOnError(
        await runReportTestExpectActionResultStep(actionContext, step as ReportTestExpectActionResultStep),
      ),
  };
}

// ################################################################################################
/**
 * The `ReportTestRunner` of `reportTest` leaves (#330, analysis T4).
 *
 * 1. It takes the DomainController, application deployment map and configuration of the
 *    integration session (`executionEnvironment.runnerTestContext`); a run without them is an
 *    `error` result.
 * 2. It refreshes the local cache of Miroir and of the Report's application from their stores,
 *    then mounts `PageDispatcher` in a `MemoryRouter` at the Report's route, under the providers
 *    of the app (`MiroirTestProviders`) built on the session's DomainController and local cache.
 * 3. It runs the leaf's steps (`runComponentTestSteps`), a thrown error becoming an `error`
 *    result. The action and assertion steps run through the session's DomainController and share
 *    the leaf's kept results (`runReportTestCompositeActionStep`,
 *    `runReportTestExpectActionResultStep`).
 *
 * Each case is unmounted when its steps end: a mounted Report would react to the testbed reset
 * of the next leaf (its queries then fail on the emptied store).
 */
export function createReportTestRunner(host: ReportTestSandboxHost): ClosableReportTestRunner {
  const restoreDomConfig = configureComponentTestDom();
  const sandboxElement = host.sandboxElement;
  const ownsPortalElement = !host.portalElement;
  const portalElement =
    host.portalElement ??
    (() => {
      const element = sandboxElement.ownerDocument.createElement("div");
      element.setAttribute("data-testid", "report-test-portal");
      sandboxElement.appendChild(element);
      return element;
    })();

  let currentCase: { container: HTMLElement; mounted: MountedComponent | undefined } | undefined;

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

  const mountCase = async (element: React.ReactElement): Promise<HTMLElement> => {
    unmountCurrentCase();
    applyComponentTestDomConfig();
    const container = sandboxElement.ownerDocument.createElement("div");
    container.setAttribute("data-testid", "report-test-container");
    sandboxElement.appendChild(container);
    currentCase = { container, mounted: undefined };
    currentCase.mounted = mountComponent(element, container);
    await waitForProgressiveRendering(container);
    return container;
  };

  const failure = (testName: string, error: unknown): ReportTestRunnerResult => {
    const message = error instanceof Error ? error.message : String(error);
    log.info("report test failed", testName, message);
    if (error instanceof ComponentTestStepError && error.hasComparedValues) {
      return { status: "error", message, expected: error.expected, actual: error.actual };
    }
    return { status: "error", message };
  };

  // ##############################################################################################
  const runner: ReportTestRunner = async ({ testNamePath, leaf, suite, executionEnvironment }) => {
    const testName = MiroirActivityTracker.testPathName(testNamePath);
    const sessionContext = executionEnvironment.runnerTestContext;
    if (!sessionContext) {
      return {
        status: "error",
        message: `reportTest "${leaf.miroirTestLabel}" needs an integration session (runnerTestContext)`,
      };
    }
    if (!Array.isArray(leaf.steps)) {
      return { status: "error", message: `reportTest "${leaf.miroirTestLabel}" has no steps` };
    }
    const { domainController, applicationDeploymentMap, internalMiroirConfig, testParams } =
      sessionContext;
    const deploymentUuid = applicationDeploymentMap[suite.report.application];
    if (!deploymentUuid) {
      return {
        status: "error",
        message: `application ${suite.report.application} of suite "${suite.suitePath.join(" > ")}" has no deployment in this session`,
      };
    }
    try {
      await refreshLocalCache(domainController, applicationDeploymentMap, [
        selfApplicationMiroir.uuid,
        suite.report.application,
      ]);
      const miroirContext = new MiroirContext(
        host.miroirActivityTracker,
        host.miroirEventService,
        internalMiroirConfig,
      );
      // the session opened the stores and loaded the local cache: the Report page must not reopen them
      markPageConfigurationsLoaded();
      const url = reportTestUrl(suite.report, deploymentUuid, leaf.instanceUuid);
      log.info("mounting report", testName, url);
      const caseStart = Date.now();
      const container = await mountCase(
        <ComponentTestModeContext.Provider value={componentTestSandboxMode}>
          <MiroirTestProviders
            localCache={domainController.getLocalCache()}
            miroirContext={miroirContext}
            domainController={domainController}
            testingApplication={suite.report.application}
            testingDeploymentUuid={deploymentUuid}
            offerReportsAndEntities
          >
            <PortalContainerProvider portalElement={portalElement}>
              <MemoryRouter initialEntries={[url]}>
                <Routes>
                  <Route path="*" element={<PageDispatcher />} />
                </Routes>
              </MemoryRouter>
            </PortalContainerProvider>
          </MiroirTestProviders>
        </ComponentTestModeContext.Provider>,
      );
      const actionContext: ReportTestActionContext = {
        domainController,
        applicationDeploymentMap,
        modelEnvironment: domainController.currentModelEnvironment(
          suite.report.application,
          applicationDeploymentMap,
        ),
        testParams,
        results: {},
        miroirActivityTracker: host.miroirActivityTracker,
      };
      // an interaction step ends when the actions started since the mount have settled (T5)
      const afterInteraction = createActionsIdleWaiter(host.miroirActivityTracker, {
        since: caseStart,
        timeoutMs: suite.actionTimeoutMs ?? defaultReportTestActionTimeoutMs,
        settle: () => waitAfterUserInteraction(container),
      });
      await runComponentTestSteps(
        createComponentTestEnvironment({ testName, container, sandboxElement, portalElement, log }),
        leaf.steps,
        { extraStepHandlers: actionStepHandlers(actionContext), afterInteraction },
      );
      return { status: "ok" };
    } catch (error) {
      return failure(testName, error);
    } finally {
      unmountCurrentCase();
    }
  };

  const close = () => {
    try {
      unmountCurrentCase();
    } finally {
      if (ownsPortalElement) {
        portalElement.remove();
      }
      restoreDomConfig();
    }
  };

  return Object.assign(runner, { close });
}
