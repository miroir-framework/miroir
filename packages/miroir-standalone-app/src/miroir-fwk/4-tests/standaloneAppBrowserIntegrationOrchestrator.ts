import type {
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  IntegrationTestSessionFactoryCreateParams,
  IntegTestHostOptions,
  MiroirTestIntegrationOrchestrator,
  RealServerTransformerIntegrationSessionOptions,
  TestSessionForIntegOptions,
} from "miroir-core";
import {
  createDefaultMiroirTestIntegrationOrchestrator,
  isRealServerTransformerSessionOptions,
} from "miroir-core";

import {
  RunnerTestSession,
} from "../../../tests/helpers/RunnerTestSession.js";
import {
  IntegrationTestSession,
} from "./IntegrationTestSession.js";
import {
  RealServerTransformerTestSession,
} from "./RealServerTransformerTestSession.js";

function resolveBootstrapHostOptions(
  context: IntegrationTestOrchestratorContext,
  sessionOptions: IntegTestHostOptions = {},
): IntegTestHostOptions {
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
  hostBootstrap: IntegTestHostOptions,
): IntegTestHostOptions["hostExecutionEnvironment"] {
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
  createSession(params: IntegrationTestSessionFactoryCreateParams) {
    const { kind, context } = params;
    if (kind === "transformer") {
      const { sessionSpecificOptions } = params;
      if (isRealServerTransformerSessionOptions(sessionSpecificOptions)) {
        const hostBootstrap = resolveBootstrapHostOptions(context, sessionSpecificOptions);
        const resolvedOptions: RealServerTransformerIntegrationSessionOptions & {
          miroirConfig: NonNullable<RealServerTransformerIntegrationSessionOptions["miroirConfig"]>;
        } = {
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
        };
        return new RealServerTransformerTestSession({
          ...resolvedOptions,
          hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
          platformEnsureMode: hostBootstrap.platformEnsureMode ?? "skip",
        });
      }
      const options = sessionSpecificOptions;
      if (!options?.testApplicationStore || !options.adminStore) {
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
    const { runnerRegistry, sessionSpecificOptions } = params;
    if (!context.miroirActivityTracker || !context.miroirEventService) {
      throw new Error(
        "Browser integration orchestrator: runner session requires miroirActivityTracker and miroirEventService",
      );
    }
    if (!sessionSpecificOptions?.runTarget) {
      throw new Error("Browser integration orchestrator: runner session requires runTarget");
    }
    if (Object.keys(runnerRegistry).length === 0 && !sessionSpecificOptions.libraryPlayfieldSeed) {
      throw new Error(
        "Browser integration orchestrator: runner session requires runnerRegistry or libraryPlayfieldSeed",
      );
    }
    const runnerOptions = sessionSpecificOptions;
    const hostBootstrap = resolveBootstrapHostOptions(context, runnerOptions);
    return new RunnerTestSession({
      ...runnerOptions,
      miroirConfig: context.miroirConfig,
      miroirActivityTracker: context.miroirActivityTracker,
      miroirEventService: context.miroirEventService,
      runnerRegistry,
      customFetch:
        typeof window !== "undefined" && typeof window.fetch === "function"
          ? (window.fetch.bind(window) as typeof fetch)
          : undefined,
      ...hostBootstrap,
      hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
    });
  },
};

export function createStandaloneAppBrowserIntegrationOrchestrator(): MiroirTestIntegrationOrchestrator {
  return createDefaultMiroirTestIntegrationOrchestrator(browserSessionFactory);
}
