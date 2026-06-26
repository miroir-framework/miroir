import type { MiroirConfigClient } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirEventService } from "../3_controllers/MiroirEventService";
import {
  describeIntegrationTestSession,
  type IntegrationTestBootstrapPhase,
  type IntegrationTestHostMode,
  type IntegrationTestSessionDescriptor,
  type IntegrationTestSessionKind,
} from "./IntegrationTestBootstrap.js";
import type { LibraryPlayfieldEnsureMode } from "./LibraryPlayfield.js";
import type { MiroirPlatformEnsureMode } from "./MiroirPlatformPlayfield.js";
import type { MiroirTestExecutionEnvironment, RunnerTestSessionInterface } from "./MiroirTestTools.js";
import type { ApplicationDeploymentMap } from "../1_core/Deployment.js";

export type IntegrationTestOrchestratorContext = {
  miroirConfig: MiroirConfigClient;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  /**
   * Gap B / Gap A: when the host already deployed the library playfield, pass `requireExisting`
   * so bootstrap skips create. Defaults to `createIfAbsent` in session bootstrap wiring.
   */
  playfieldMode?: LibraryPlayfieldEnsureMode;
  /** Gap A: isolated CLI run (default) vs embedded live UI host. */
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
  /** When set, overrides session `applicationDeploymentMap` for embedded host runs. */
  hostApplicationDeploymentMap?: ApplicationDeploymentMap;
};

export type IntegrationTestSessionFactoryCreateParams = {
  kind: IntegrationTestSessionKind;
  context: IntegrationTestOrchestratorContext;
  sessionSpecificOptions?: unknown;
};

export interface IntegrationTestSessionFactory {
  createSession(params: IntegrationTestSessionFactoryCreateParams): RunnerTestSessionInterface;
}

export interface MiroirTestIntegrationOrchestrator {
  createSession(
    kind: IntegrationTestSessionKind,
    context: IntegrationTestOrchestratorContext,
    sessionSpecificOptions?: unknown,
  ): RunnerTestSessionInterface;

  describeSession(kind: IntegrationTestSessionKind): IntegrationTestSessionDescriptor;
}

export function createDefaultMiroirTestIntegrationOrchestrator(
  factory: IntegrationTestSessionFactory,
): MiroirTestIntegrationOrchestrator {
  return {
    createSession(kind, context, sessionSpecificOptions) {
      return factory.createSession({ kind, context, sessionSpecificOptions });
    },
    describeSession(kind) {
      return describeIntegrationTestSession(kind);
    },
  };
}

export function createUnconfiguredMiroirTestIntegrationOrchestrator(): MiroirTestIntegrationOrchestrator {
  return {
    createSession() {
      throw new Error(
        "MiroirTestIntegrationOrchestrator.createSession: IntegrationTestSessionFactory not registered",
      );
    },
    describeSession(kind) {
      return describeIntegrationTestSession(kind);
    },
  };
}
