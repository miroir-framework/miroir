import type {
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  MiroirTestIntegrationOrchestrator,
} from "miroir-core";
import { createDefaultMiroirTestIntegrationOrchestrator } from "miroir-core";

import {
  RunnerTestSession,
  type RunnerTestSessionOptions,
} from "../../../tests/helpers/RunnerTestSession.js";
import type { AppStackBootstrapHostOptions } from "./appStackBootstrapHostOptions.js";
import {
  IntegrationTestSession,
  type TestSessionForIntegOptions,
} from "./IntegrationTestSession.js";
import {
  isRealServerTransformerSessionOptions,
  RealServerTransformerTestSession,
} from "./RealServerTransformerTestSession.js";

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

function assertBrowserSafeTransformerOptions(options: TestSessionForIntegOptions): void {
  const appType = options.testApplicationStore.emulatedServerType;
  const adminType = options.adminStore.emulatedServerType;
  if (appType === "filesystem" || adminType === "filesystem") {
    throw new Error(
      "Browser transformer session cannot use filesystem stores (no node:path). Use indexedDb + bundled admin.",
    );
  }
  if (appType === "sql" || adminType === "sql") {
    throw new Error(
      "Browser transformer session cannot use SQL stores in webApp. Use indexedDb + bundled admin, or Electron/Node.",
    );
  }
  if (appType === "mongodb" || adminType === "mongodb") {
    throw new Error(
      "Browser transformer session cannot use MongoDB stores in webApp. Use indexedDb + bundled admin, or Electron/Node.",
    );
  }
}

const browserSessionFactory: IntegrationTestSessionFactory = {
  createSession({ kind, context, sessionSpecificOptions }) {
    if (kind === "transformer") {
      if (isRealServerTransformerSessionOptions(sessionSpecificOptions)) {
        const hostBootstrap = resolveBootstrapHostOptions(context, sessionSpecificOptions);
        return new RealServerTransformerTestSession({
          ...sessionSpecificOptions,
          miroirConfig: sessionSpecificOptions.miroirConfig ?? context.miroirConfig,
          miroirActivityTracker:
            sessionSpecificOptions.miroirActivityTracker ?? context.miroirActivityTracker,
          miroirEventService:
            sessionSpecificOptions.miroirEventService ?? context.miroirEventService,
          customFetch:
            sessionSpecificOptions.customFetch ??
            (typeof window !== "undefined" && typeof window.fetch === "function"
              ? (window.fetch.bind(window) as typeof fetch)
              : undefined),
          ...hostBootstrap,
          hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
          platformEnsureMode: hostBootstrap.platformEnsureMode ?? "skip",
        });
      }
      const options = (sessionSpecificOptions ?? {}) as TestSessionForIntegOptions;
      if (!options.testApplicationStore || !options.adminStore) {
        throw new Error(
          "Browser integration orchestrator: transformer session requires testApplicationStore and adminStore (or transport: realServer)",
        );
      }
      assertBrowserSafeTransformerOptions(options);
      return new IntegrationTestSession(options);
    }

    if (kind !== "runner") {
      throw new Error(
        `Browser integration orchestrator supports runner and transformer sessions only (got "${kind}")`,
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
  return createDefaultMiroirTestIntegrationOrchestrator(browserSessionFactory);
}
