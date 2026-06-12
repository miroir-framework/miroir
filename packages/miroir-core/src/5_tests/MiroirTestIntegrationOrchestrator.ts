import type {
  Deployment,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";

export type RunnerTestContext = {
  pageLabel: string;
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  internalMiroirConfig: MiroirConfigClient;
  adminDeployment: Deployment;
  testDeploymentStorageConfiguration: StoreUnitConfiguration;
  testParams: Record<string, unknown>;
  runtimeContext: Record<string, unknown>;
};

export type MiroirTestExecutionEnvironment = {
  /** Transformer integration (direct Postgres). */
  integrationStore?: unknown; // TODO: BAD! stores should only be accessed through the domainController
  /** Runner integration (full stack). */
  runnerTestContext?: RunnerTestContext;
};

export interface MiroirTestIntegrationPort {
  initSession(): Promise<MiroirTestExecutionEnvironment>;
  beforeEach(): Promise<void>;
  teardown(): Promise<void>;
}

// ################################################################################################
export class MiroirTestIntegrationOrchestrator {
  private environment: MiroirTestExecutionEnvironment | undefined;

  constructor(private readonly port: MiroirTestIntegrationPort) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    this.environment = await this.port.initSession();
    return this.environment;
  }

  getEnvironment(): MiroirTestExecutionEnvironment {
    if (!this.environment) {
      throw new Error("MiroirTestIntegrationOrchestrator: initSession must be called first");
    }
    return this.environment;
  }

  async beforeEach(): Promise<void> {
    await this.port.beforeEach();
  }

  async teardown(): Promise<void> {
    await this.port.teardown();
    this.environment = undefined;
  }
}
