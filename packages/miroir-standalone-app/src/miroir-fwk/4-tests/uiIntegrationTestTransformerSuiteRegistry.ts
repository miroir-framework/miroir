import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";
import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";

export type UiIntegrationTransformerSuiteEntry = {
  suiteDefinition: MiroirTestSuite;
};

export const UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY: Record<
  string,
  UiIntegrationTransformerSuiteEntry
> = {
  miroirCoreTransformers: {
    suiteDefinition: (miroirTest_miroirCoreTransformers as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
};

export function listUiIntegrationTransformerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY).sort();
}

export function resolveUiIntegrationTransformerSuite(
  suiteKey: string,
): UiIntegrationTransformerSuiteEntry {
  const entry = UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY[suiteKey];
  if (!entry) {
    throw new Error(
      `Unknown UI integration transformer suite: ${suiteKey}. ` +
        `Valid keys: ${listUiIntegrationTransformerSuiteKeys().join(", ")}`,
    );
  }
  return entry;
}
