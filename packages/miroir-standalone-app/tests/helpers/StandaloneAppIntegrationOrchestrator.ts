import type {
  ApplicationDeploymentMap,
  DomainControllerSessionProfile,
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  IntegrationTestSessionKind,
  LibraryPlayfieldEnsureMode,
  MiroirTestIntegrationOrchestrator,
} from "miroir-core";
import { createDefaultMiroirTestIntegrationOrchestrator } from "miroir-core";

import type { AppStackBootstrapHostOptions } from "./appStackIntegrationBootstrap.js";
import {
  AppStackIntegrationTestSession,
  IntegrationTestSession,
  type AppStackSessionOptions,
  type TestSessionForIntegOptions,
} from "./IntegrationTestSession.js";
import {
  DomainControllerIntegrationTestSession,
  type DomainControllerIntegrationTestSessionOptions,
} from "./DomainControllerIntegrationTestSession.js";
import { RunnerTestSession, type RunnerTestSessionOptions } from "./RunnerTestSession.js";

export type DomainControllerOrchestratorSessionOptions =
  DomainControllerIntegrationTestSessionOptions & {
    profile: DomainControllerSessionProfile;
  };

function resolveLibraryPlayfieldEnsureMode(
  sessionSpecificMode: LibraryPlayfieldEnsureMode | undefined,
  context: IntegrationTestOrchestratorContext,
): LibraryPlayfieldEnsureMode | undefined {
  return sessionSpecificMode ?? context.playfieldMode;
}

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

function resolveApplicationDeploymentMap(
  context: IntegrationTestOrchestratorContext,
  sessionMap: ApplicationDeploymentMap,
): ApplicationDeploymentMap {
  return context.hostApplicationDeploymentMap ?? sessionMap;
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

function createStandaloneAppSession(
  kind: IntegrationTestSessionKind,
  context: IntegrationTestOrchestratorContext,
  sessionSpecificOptions?: unknown,
) {
  switch (kind) {
    case "transformer":
      return new IntegrationTestSession(sessionSpecificOptions as TestSessionForIntegOptions);
    case "appStackPsc": {
      const appStackOptions = sessionSpecificOptions as AppStackSessionOptions;
      return new AppStackIntegrationTestSession(context.miroirConfig, {
        ...appStackOptions,
        applicationDeploymentMap: resolveApplicationDeploymentMap(
          context,
          appStackOptions.applicationDeploymentMap,
        ),
        libraryPlayfieldEnsureMode: resolveLibraryPlayfieldEnsureMode(
          appStackOptions.libraryPlayfieldEnsureMode,
          context,
        ),
        ...resolveBootstrapHostOptions(context, appStackOptions),
      });
    }
    case "domainController": {
      const { profile, ...sessionOptions } =
        sessionSpecificOptions as DomainControllerOrchestratorSessionOptions;
      return new DomainControllerIntegrationTestSession(
        context.miroirConfig,
        {
          ...sessionOptions,
          applicationDeploymentMap: resolveApplicationDeploymentMap(
            context,
            sessionOptions.applicationDeploymentMap,
          ),
          libraryPlayfieldEnsureMode: resolveLibraryPlayfieldEnsureMode(
            sessionOptions.libraryPlayfieldEnsureMode,
            context,
          ),
          ...resolveBootstrapHostOptions(context, sessionOptions),
        },
        profile,
      );
    }
    case "runner": {
      if (!context.miroirActivityTracker || !context.miroirEventService) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires miroirActivityTracker and miroirEventService in context",
        );
      }
      const runnerOptions = (sessionSpecificOptions ?? {}) as Partial<
        Pick<RunnerTestSessionOptions, "pageLabel" | "runTarget" | "suiteTestParams" | "runnerRegistry">
      >;
      if (!runnerOptions.runTarget) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires runTarget in sessionSpecificOptions",
        );
      }
      if (!runnerOptions.runnerRegistry) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires runnerRegistry in sessionSpecificOptions",
        );
      }
      const hostBootstrap = resolveBootstrapHostOptions(context, runnerOptions);
      return new RunnerTestSession({
        miroirConfig: context.miroirConfig,
        miroirActivityTracker: context.miroirActivityTracker,
        miroirEventService: context.miroirEventService,
        runTarget: runnerOptions.runTarget,
        suiteTestParams: runnerOptions.suiteTestParams,
        runnerRegistry: runnerOptions.runnerRegistry,
        ...runnerOptions,
        ...hostBootstrap,
        hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
      });
    }
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unsupported integration test session kind: ${exhaustive}`);
    }
  }
}

const standaloneAppIntegrationSessionFactory: IntegrationTestSessionFactory = {
  createSession({ kind, context, sessionSpecificOptions }) {
    return createStandaloneAppSession(kind, context, sessionSpecificOptions);
  },
};

export function createStandaloneAppIntegrationOrchestrator(): MiroirTestIntegrationOrchestrator {
  return createDefaultMiroirTestIntegrationOrchestrator(standaloneAppIntegrationSessionFactory);
}
