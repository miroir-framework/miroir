import crossFetch from "cross-fetch";

import type {
  ApplicationDeploymentMap,
  IntegrationTestOrchestratorContext,
  IntegrationTestSessionFactory,
  IntegrationTestSessionFactoryCreateParams,
  LibraryPlayfieldEnsureMode,
  MiroirTestIntegrationOrchestrator,
  RealServerTransformerIntegrationSessionOptions,
  Runner,
  RunnerIntegrationSessionOptions,
} from "miroir-core";
import {
  createDefaultMiroirTestIntegrationOrchestrator,
  isRealServerTransformerSessionOptions,
} from "miroir-core";

import type { IntegTestHostOptions } from "miroir-core";
import { RealServerTransformerTestSession } from "../../src/miroir-fwk/4-tests/RealServerTransformerTestSession.js";
import {
  AppStackIntegrationTestSession,
  IntegrationTestSession,
} from "./IntegrationTestSession.js";
import { DomainControllerIntegrationTestSession } from "./DomainControllerIntegrationTestSession.js";
import { startEphemeralMcpHttpServer } from "miroir-mcp";
import { RunnerTestSession } from "./RunnerTestSession.js";

function resolveLibraryPlayfieldEnsureMode(
  sessionSpecificMode: LibraryPlayfieldEnsureMode | undefined,
  context: IntegrationTestOrchestratorContext,
): LibraryPlayfieldEnsureMode | undefined {
  return sessionSpecificMode ?? context.playfieldMode;
}

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

function resolveApplicationDeploymentMap(
  context: IntegrationTestOrchestratorContext,
  sessionMap: ApplicationDeploymentMap,
): ApplicationDeploymentMap {
  return context.hostApplicationDeploymentMap ?? sessionMap;
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

/**
 * Shared bootstrap for runnerTest and actionTest MiroirTest integ sessions (both use RunnerTestSession).
 */
function createRunnerOrActionSession(
  context: IntegrationTestOrchestratorContext,
  sessionSpecificOptions: RunnerIntegrationSessionOptions,
  resolvedRunner?: Runner,
) {
  if (!context.miroirActivityTracker || !context.miroirEventService) {
    throw new Error(
      "StandaloneAppIntegrationOrchestrator: runner/action session requires miroirActivityTracker and miroirEventService in context",
    );
  }
  if (!sessionSpecificOptions.runTarget) {
    throw new Error(
      "StandaloneAppIntegrationOrchestrator: runner/action session requires runTarget in sessionSpecificOptions",
    );
  }
  const hostBootstrap = resolveBootstrapHostOptions(context, sessionSpecificOptions);
  return new RunnerTestSession({
    ...sessionSpecificOptions,
    miroirConfig: context.miroirConfig,
    miroirActivityTracker: context.miroirActivityTracker,
    miroirEventService: context.miroirEventService,
    customFetch: crossFetch as unknown as typeof fetch,
    ...hostBootstrap,
    ...(resolvedRunner !== undefined ? { resolvedRunner } : {}),
    hostExecutionEnvironment: resolveHostExecutionEnvironment(context, hostBootstrap),
    startMcpHttpServer: startEphemeralMcpHttpServer,
  });
}

/**
 * 
 * @param params - The parameters for the session.
 * @returns The session.  
 */
function createStandaloneAppSession(params: IntegrationTestSessionFactoryCreateParams) {
  const { kind, context } = params;
  switch (kind) {
    case "transformer": {
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
      const { sessionSpecificOptions } = params;
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
      const { sessionSpecificOptions } = params;
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
      const { resolvedRunner, sessionSpecificOptions } = params;
      if (!sessionSpecificOptions?.runTarget) {
        throw new Error(
          "StandaloneAppIntegrationOrchestrator: runner session requires runTarget in sessionSpecificOptions",
        );
      }
      return createRunnerOrActionSession(context, sessionSpecificOptions, resolvedRunner);
    }
    case "action": {
      const { sessionSpecificOptions } = params;
      return createRunnerOrActionSession(context, sessionSpecificOptions);
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
