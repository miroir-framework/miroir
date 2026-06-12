// import type {
//   MiroirTestExecutionEnvironment,
//   MiroirTestIntegrationPort,
// } from "../../src/5_tests/MiroirTestIntegrationOrchestrator";
// import {
//   initMiroirCoreTestIntegrationStore,
//   type MiroirTestIntegrationStoreOptions,
// } from "./initMiroirCoreTestIntegrationStore";

// export class PostgresIntegrationAdapter implements MiroirTestIntegrationPort {
//   private environment: MiroirTestExecutionEnvironment | undefined;

//   constructor(private readonly options: MiroirTestIntegrationStoreOptions = {}) {}

//   async initSession(): Promise<MiroirTestExecutionEnvironment> {
//     const store = await initMiroirCoreTestIntegrationStore(this.options);
//     this.environment = { integrationStore: store.sqlDbDataStore };
//     return this.environment;
//   }

//   async beforeEach(): Promise<void> {}

//   async teardown(): Promise<void> {
//     this.environment = undefined;
//   }
// }
