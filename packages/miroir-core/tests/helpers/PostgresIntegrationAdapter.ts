import type {
  MiroirTestExecutionEnvironment,
  MiroirTestIntegrationPort,
} from "../../src/4_services/MiroirTestIntegrationOrchestrator";
import {
  initMiroirTestIntegrationStore,
  type MiroirTestIntegrationStoreOptions,
} from "./miroirTestIntegrationStore";

export class PostgresIntegrationAdapter implements MiroirTestIntegrationPort {
  private environment: MiroirTestExecutionEnvironment | undefined;

  constructor(private readonly options: MiroirTestIntegrationStoreOptions = {}) {}

  async initSession(): Promise<MiroirTestExecutionEnvironment> {
    const store = await initMiroirTestIntegrationStore(this.options);
    this.environment = { integrationStore: store.sqlDbDataStore };
    return this.environment;
  }

  async beforeEach(): Promise<void> {}

  async teardown(): Promise<void> {
    this.environment = undefined;
  }
}
