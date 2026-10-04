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
  type EntityInstance,
  type FakeOutboundFetch,
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
import { entityReport, selfApplicationMiroir } from "miroir-app-miroir";

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
  type ComponentTestRunControls,
} from "./runComponentTestSteps.js";
import { createActionsIdleWaiter, defaultReportTestActionTimeoutMs } from "./waitForActionsIdle.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "runReportTest");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export interface ReportTestSandboxHost extends ComponentTestRunControls {
  /** Element that receives the portal element and one container per case. Never a render target. */
  sandboxElement: HTMLElement;
  /** Target of the Report's portals. Created as a child of `sandboxElement` when absent. */
  portalElement?: HTMLElement;
  /** Tracker and event service of the integration session (those of its DomainController). */
  miroirActivityTracker: MiroirActivityTrackerInterface;
  miroirEventService: MiroirEventService;
  /**
   * The Miroir Reports of the app (all of `miroir_data`). The session bootstraps its Miroir store
   * with a few Reports only (`miroirModelInitializeDataInstances`): before each leaf, the runner
   * creates those the session lacks, or a Report test of a Miroir Report such as the
   * ConnectExternalServiceWizard would display the default Report.
   */
  miroirReports?: () => readonly EntityInstance[];
}

// ################################################################################################
/** Creates in the session's Miroir deployment the Reports of `miroirReports` it lacks. */
async function seedMissingMiroirReports(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  miroirReports: readonly EntityInstance[],
): Promise<void> {
  const rollback = await domainController.handleAction(
    {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationMiroir.uuid },
    },
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
  if (rollback?.status !== "ok") {
    throw new Error(`could not load the Miroir Reports of the session: ${JSON.stringify(rollback)}`);
  }
  const sessionReports =
    domainController.getDomainState()[applicationDeploymentMap[selfApplicationMiroir.uuid]]?.data?.[
      entityReport.uuid
    ] ?? {};
  const missingReports = miroirReports.filter(
    (report) => report.uuid !== undefined && !sessionReports[report.uuid],
  );
  if (missingReports.length === 0) {
    return;
  }
  const creation = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationMiroir.uuid,
        applicationSection: "data",
        objects: [...missingReports],
      },
    },
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
  if (creation?.status !== "ok") {
    throw new Error(`could not create the Miroir Reports of the session: ${JSON.stringify(creation)}`);
  }
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

/** Result message of a leaf whose suite declares `fakeHttpResponses`, on a real server (T9). */
export const REPORT_TEST_FAKE_HTTP_NEEDS_EMULATED_SERVER =
  "fake HTTP responses need an emulated server: on a real server the requests go out from the server process";

/** Result message of such a leaf in a session that reuses controllers it did not build (#339). */
export const REPORT_TEST_FAKE_HTTP_NEEDS_SESSION_CONTROLLERS =
  "fake HTTP responses need a session that builds its own DomainControllers: this one reuses the app's";

function undeclaredRequestsMessage(fakeFetch: FakeOutboundFetch): string {
  return `no fake HTTP response declared for ${fakeFetch.undeclaredRequests.join(", ")}`;
}

/** Throws the error of a failed action or assertion step, with its compared values if any. */
function throwOnError(outcome: ReportTestRunnerResult): void {
  if (outcome.status === "ok") {
    return;
  }
  if (outcome.status === "skipped") {
    throw new Error(outcome.message);
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
 *    `runReportTestExpectActionResultStep`). After each interaction step, it waits for the actions
 *    the step started (T5). The UI steps reference those results and the test parameters with
 *    `getFromContext`, resolved when each step starts (#333).
 * 4. When the suite declares `fakeHttpResponses`, the outbound fetch answers them during the leaf
 *    (T9); a request with no declared answer fails the leaf, naming its method and URL. On a real
 *    server the leaf is skipped.
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

  const failure = (testName: string, error: unknown, fakeFetch?: FakeOutboundFetch): ReportTestRunnerResult => {
    const stepMessage = error instanceof Error ? error.message : String(error);
    // an undeclared request is the cause of the step failure that follows it
    const message = fakeFetch?.undeclaredRequests.length
      ? `${undeclaredRequestsMessage(fakeFetch)}, then ${stepMessage}`
      : stepMessage;
    log.info("report test failed", testName, message);
    if (error instanceof ComponentTestStepError && error.hasComparedValues) {
      return { status: "error", message, expected: error.expected, actual: error.actual };
    }
    return { status: "error", message };
  };

  // ##############################################################################################
  const runner: ReportTestRunner = async ({ testNamePath, leaf, suite, executionEnvironment }) => {
    const testName = MiroirActivityTracker.testPathName(testNamePath);
    host.onCaseStart?.(testName);
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
    // the fake answers the requests of the session's DomainControllers (client and emulated server)
    // only, not those of the app around the sandbox; on a real server, they go out from the server
    if (suite.fakeHttpResponses && !internalMiroirConfig.client.emulateServer) {
      return { status: "skipped", message: REPORT_TEST_FAKE_HTTP_NEEDS_EMULATED_SERVER };
    }
    // the session's external service environment answers with the suite's fake HTTP responses
    if (suite.fakeHttpResponses && !executionEnvironment.fakeOutboundHttp) {
      return { status: "skipped", message: REPORT_TEST_FAKE_HTTP_NEEDS_SESSION_CONTROLLERS };
    }
    const fakeFetch = suite.fakeHttpResponses
      ? executionEnvironment.fakeOutboundHttp?.answerWith(suite.fakeHttpResponses)
      : undefined;
    try {
      if (host.miroirReports) {
        // the session resets its Miroir model before each leaf, back to the bootstrap Reports
        await seedMissingMiroirReports(domainController, applicationDeploymentMap, host.miroirReports());
      }
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
            testingApplicationDeploymentMap={applicationDeploymentMap}
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
        // the fields of a Report are named from its own form values, without a test section
        createComponentTestEnvironment({ testName, container, sandboxElement, portalElement, log, fieldNamePrefix: "" }),
        leaf.steps,
        {
          extraStepHandlers: actionStepHandlers(actionContext),
          afterInteraction,
          // UI steps read the test parameters and the results kept so far, as the action steps do (#333)
          storedValues: () => ({ ...actionContext.testParams, ...actionContext.results }),
          stepDelayMs: host.stepDelayMs,
          waitWhilePaused: host.waitWhilePaused,
        },
      );
      if (fakeFetch?.undeclaredRequests.length) {
        return { status: "error", message: undeclaredRequestsMessage(fakeFetch) };
      }
      return { status: "ok" };
    } catch (error) {
      return failure(testName, error, fakeFetch);
    } finally {
      unmountCurrentCase();
      fakeFetch?.release();
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
