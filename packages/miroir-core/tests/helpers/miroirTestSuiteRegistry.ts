import type { DeployedMiroirTestExport } from "./runDeployedMiroirTestSuite";

export type MiroirTestSuiteLoader = () => Promise<{ default: DeployedMiroirTestExport }>;

/**
 * Maps CLI suite keys to dynamic import loaders.
 * Add entries as pilot / generated MiroirTest instances land (Phase 3+).
 */
export const MIROIR_TEST_SUITE_REGISTRY: Record<string, MiroirTestSuiteLoader> = {
  schema_pilot_empty: async () => {
    const deployment = await import("miroir-test-app_deployment-miroir");
    return { default: deployment.miroirTest_schema_pilot_empty as DeployedMiroirTestExport };
  },
  pilot_transformer_plus: async () => {
    const deployment = await import("miroir-test-app_deployment-miroir");
    return { default: deployment.miroirTest_pilot_transformer_plus as DeployedMiroirTestExport };
  },
  mustache: async () => {
    const deployment = await import("miroir-test-app_deployment-miroir");
    return { default: deployment.miroirTest_mustache as DeployedMiroirTestExport };
  },
  queries_library: async () => {
    const deployment = await import("miroir-test-app_deployment-miroir");
    return { default: deployment.miroirTest_queries_library as DeployedMiroirTestExport };
  },
};

export function listMiroirTestSuiteKeys(): string[] {
  return Object.keys(MIROIR_TEST_SUITE_REGISTRY).sort();
}

export async function loadMiroirTestSuiteExport(
  suiteKey: string,
): Promise<DeployedMiroirTestExport> {
  const loader = MIROIR_TEST_SUITE_REGISTRY[suiteKey];
  if (!loader) {
    throw new Error(
      `Unknown MiroirTest suite key "${suiteKey}". Available: ${listMiroirTestSuiteKeys().join(", ")}`,
    );
  }
  const loaded = await loader();
  return loaded.default;
}
