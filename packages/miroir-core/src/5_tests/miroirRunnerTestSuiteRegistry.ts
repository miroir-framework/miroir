// import type { MiroirTestSuite } from "miroir-core";

import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import { miroirTest_runner_library } from "miroir-test-app_deployment-library";

export type DeployedMiroirTestExport = MiroirTestSuite;
// export type DeployedMiroirTestExport = {
//   definition: MiroirTestSuite;
// };

export type MiroirRunnerTestSuiteLoader = () => Promise<{ default: DeployedMiroirTestExport }>;

// const MIROIR_RUNNER_TEST_SUITE_REGISTRY = miroirTest_runner_library as DeployedMiroirTestExport;
// // export const MIROIR_RUNNER_TEST_SUITE_REGISTRY: Record<string, MiroirRunnerTestSuiteLoader> = {
// //   runner_library: async () => {
// //     // const deployment = await import("miroir-test-app_deployment-library");
// //     return { default: miroirTest_runner_library as DeployedMiroirTestExport };
// //   },
// // };

// export function listMiroirRunnerTestSuiteKeys(): string[] {
//   return Object.keys(MIROIR_RUNNER_TEST_SUITE_REGISTRY);
// }

// export async function loadMiroirRunnerTestSuiteExport(suiteKey: string): Promise<DeployedMiroirTestExport> {
//   const loader = MIROIR_RUNNER_TEST_SUITE_REGISTRY;
//   // const loader = MIROIR_RUNNER_TEST_SUITE_REGISTRY[suiteKey];
//   if (!loader) {
//     throw new Error(`Unknown runner MiroirTest suite key: ${suiteKey}`);
//   }
//   // const module = await loader();
//   // return module.default;
//   return MIROIR_RUNNER_TEST_SUITE_REGISTRY
// }
