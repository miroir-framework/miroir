import type {
  DomainControllerSessionProfile,
  IntegrationTestSessionFactory,
  IntegrationTestSessionKind,
  IntegrationTestOrchestratorContext,
  LibraryPlayfieldEnsureMode,
  MiroirTestIntegrationOrchestrator,
} from "miroir-core";
import { createDefaultMiroirTestIntegrationOrchestrator } from "miroir-core";

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
        libraryPlayfieldEnsureMode: resolveLibraryPlayfieldEnsureMode(
          appStackOptions.libraryPlayfieldEnsureMode,
          context,
        ),
      });
    }
    case "domainController": {
      const { profile, ...sessionOptions } =
        sessionSpecificOptions as DomainControllerOrchestratorSessionOptions;
      return new DomainControllerIntegrationTestSession(
        context.miroirConfig,
        {
          ...sessionOptions,
          libraryPlayfieldEnsureMode: resolveLibraryPlayfieldEnsureMode(
            sessionOptions.libraryPlayfieldEnsureMode,
            context,
          ),
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
        Pick<RunnerTestSessionOptions, "pageLabel">
      >;
      return new RunnerTestSession({
        miroirConfig: context.miroirConfig,
        miroirActivityTracker: context.miroirActivityTracker,
        miroirEventService: context.miroirEventService,
        ...runnerOptions,
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
