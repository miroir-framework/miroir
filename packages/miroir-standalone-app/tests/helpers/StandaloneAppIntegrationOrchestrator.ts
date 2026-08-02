import crossFetch from "cross-fetch";

import type {
  ApplicationDeploymentMap,
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  IntegrationTestSessionFactoryCreateParams,
  LibraryPlayfieldEnsureMode,
  MiroirTestIntegrationOrchestrator,
  RealServerTransformerIntegrationSessionOptions,
} from "miroir-core";
import {
  createDefaultMiroirTestIntegrationOrchestrator,
  isRealServerTransformerSessionOptions,
} from "miroir-core";

import type { AppStackBootstrapHostOptions } from "../../src/miroir-fwk/4-tests/appStackBootstrapHostOptions.js";
import { RealServerTransformerTestSession } from "../../src/miroir-fwk/4-tests/RealServerTransformerTestSession.js";
import {
  AppStackIntegrationTestSession,
  IntegrationTestSession,
} from "./IntegrationTestSession.js";
import { DomainControllerIntegrationTestSession } from "./DomainControllerIntegrationTestSession.js";
import { RunnerTestSession } from "./RunnerTestSession.js";

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

/**
 * 
 * @param params - The parameters for the session.
 * @returns The session.  
 */
function createStandaloneAppSession(params: IntegrationTestSessionFactoryCreateParams) {
  const { kind, context, sessionSpecificOptions } = params;
  switch (kind) {
    case "transformer": {
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
            sessionSpecificOptions.customFetch ?? (crossFetch as unknown as typeof fetch),
          ...hostBootstrap,
        };
        return new RealServerTransformerTestSession({
          ...resolvedOptions,
          hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
          platformEnsureMode: hostBootstrap.platformEnsureMode ?? "skip",
        });
      }
      if (!sessionSpecificOptions) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: transformer session requires sessionSpecificOptions (emulated stores or transport: realServer)",
        );
      }
      return new IntegrationTestSession(sessionSpecificOptions);
    }
    case "appStackPersistenceStoreController": {
      return new AppStackIntegrationTestSession(context.miroirConfig, {
        ...sessionSpecificOptions,
        applicationDeploymentMap: resolveApplicationDeploymentMap(
          context,
          sessionSpecificOptions.applicationDeploymentMap,
        ),
        libraryPlayfieldEnsureMode: resolveLibraryPlayfieldEnsureMode(
          sessionSpecificOptions.libraryPlayfieldEnsureMode,
          context,
        ),
        ...resolveBootstrapHostOptions(context, sessionSpecificOptions),
      });
    }
    case "domainController": {
      const { profile, ...sessionOptions } = sessionSpecificOptions;
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
      if (!sessionSpecificOptions?.runTarget) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires runTarget in sessionSpecificOptions",
        );
      }
      if (!sessionSpecificOptions.runnerRegistry) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires runnerRegistry in sessionSpecificOptions",
        );
      }
      const runnerOptions = sessionSpecificOptions;
      const hostBootstrap = resolveBootstrapHostOptions(context, runnerOptions);
      return new RunnerTestSession({
        ...runnerOptions,
        miroirConfig: context.miroirConfig,
        miroirActivityTracker: context.miroirActivityTracker,
        miroirEventService: context.miroirEventService,
        customFetch: crossFetch as unknown as typeof fetch,
        ...hostBootstrap,
        runnerRegistry: runnerOptions.runnerRegistry ?? {},
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
  createSession(params) {
    return createStandaloneAppSession(params);
  },
};

export function createStandaloneAppIntegrationOrchestrator(): MiroirTestIntegrationOrchestrator {
  return createDefaultMiroirTestIntegrationOrchestrator(standaloneAppIntegrationSessionFactory);
}
