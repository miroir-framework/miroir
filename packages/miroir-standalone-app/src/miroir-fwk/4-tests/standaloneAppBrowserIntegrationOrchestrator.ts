import type {
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  MiroirTestIntegrationOrchestrator,
} from "miroir-core";
import { createDefaultMiroirTestIntegrationOrchestrator } from "miroir-core";

import type { AppStackBootstrapHostOptions } from "../../../tests/helpers/appStackIntegrationBootstrap.js";
import {
  RunnerTestSession,
  type RunnerTestSessionOptions,
} from "../../../tests/helpers/RunnerTestSession.js";

function resolveBootstrapHostOptions(
  context: IntegrationTestOrchestratorContext,
  sessionOptions: AppStackBootstrapHostOptions = {},
): AppStackBootstrapHostOptions {
  return {
    hostMode: sessionOptions.hostMode ?? context.hostMode,
    hostExecutionEnvironment:
      sessionOptions.hostExecutionEnvironment ?? context.hostExecutionEnvironment,
    skipBootstrapPhases: sessionOptions.skipBootstrapPhases ?? context.skipBootstrapPhases,
    platformEnsureMode: sessionOptions.platformEnsureMode ?? context.platformEnsureMode,
  };
}

function resolveHostExecutionEnvironment(
  context: IntegrationTestOrchestratorContext,
  hostBootstrap: AppStackBootstrapHostOptions,
): AppStackBootstrapHostOptions["hostExecutionEnvironment"] {
  if (context.hostApplicationDeploymentMap === undefined) {
    return hostBootstrap.hostExecutionEnvironment;
  }
  return {
    ...hostBootstrap.hostExecutionEnvironment,
    applicationDeploymentMap: context.hostApplicationDeploymentMap,
  };
}

const browserRunnerSessionFactory: IntegrationTestSessionFactory = {
  createSession({ kind, context, sessionSpecificOptions }) {
    if (kind !== "runner") {
      throw new Error(
        `Browser integration orchestrator supports runner sessions only (got "${kind}")`,
      );
    }
    if (!context.miroirActivityTracker || !context.miroirEventService) {
      throw new Error(
        "Browser integration orchestrator: runner session requires miroirActivityTracker and miroirEventService",
      );
    }
    const runnerOptions = (sessionSpecificOptions ?? {}) as Partial<
      Pick<RunnerTestSessionOptions, "pageLabel" | "runTarget" | "suiteTestParams" | "runnerRegistry">
    > &
      Partial<AppStackBootstrapHostOptions>;
    if (!runnerOptions.runTarget) {
      throw new Error("Browser integration orchestrator: runner session requires runTarget");
    }
    if (!runnerOptions.runnerRegistry) {
      throw new Error("Browser integration orchestrator: runner session requires runnerRegistry");
    }
    const hostBootstrap = resolveBootstrapHostOptions(context, runnerOptions);
    return new RunnerTestSession({
      miroirConfig: context.miroirConfig,
      miroirActivityTracker: context.miroirActivityTracker,
      miroirEventService: context.miroirEventService,
      runTarget: runnerOptions.runTarget,
      suiteTestParams: runnerOptions.suiteTestParams,
      runnerRegistry: runnerOptions.runnerRegistry,
      // Browser: use the native fetch. A Node polyfill (cross-fetch) fails in the
      // browser before issuing a request, so the client never reaches the server.
      customFetch:
        typeof window !== "undefined" && typeof window.fetch === "function"
          ? (window.fetch.bind(window) as typeof fetch)
          : undefined,
      ...runnerOptions,
      ...hostBootstrap,
      hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
    });
  },
};

export function createStandaloneAppBrowserIntegrationOrchestrator(): MiroirTestIntegrationOrchestrator {
  return createDefaultMiroirTestIntegrationOrchestrator(browserRunnerSessionFactory);
}
