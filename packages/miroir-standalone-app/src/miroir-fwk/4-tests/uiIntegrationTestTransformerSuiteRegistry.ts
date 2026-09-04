import { inferIntegrationSessionKind, type MiroirTestDefinition, type MiroirTestSuite } from "miroir-core";
import { miroirTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";

export type UiIntegrationTransformerSuiteEntry = {
  suiteDefinition: MiroirTestSuite;
};

/**
 * @deprecated Last hardcoded snapshot. UI/CLI discover transformer suites from
 * the selected application / application folders.
 */
export const UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY_LEGACY: Record<
  string,
  UiIntegrationTransformerSuiteEntry
> = {
  miroirCoreTransformers: {
    suiteDefinition: (miroirTest_miroirCoreTransformers as MiroirTestDefinition)
      .definition as MiroirTestSuite,
  },
};

/** @deprecated Alias of {@link UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY_LEGACY}. */
export const UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY =
  UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY_LEGACY;

export function listUiIntegrationTransformerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY).sort();
}

export function resolveUiIntegrationTransformerSuite(
  suiteKey: string,
  suiteDefinition?: MiroirTestSuite,
): UiIntegrationTransformerSuiteEntry {
  if (suiteDefinition && inferIntegrationSessionKind(suiteDefinition) === "transformer") {
    return { suiteDefinition };
  }
  const entry = UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY[suiteKey];
  if (!entry) {
    throw new Error(
      `Unknown UI integration transformer suite: ${suiteKey}. ` +
        `Valid keys: ${listUiIntegrationTransformerSuiteKeys().join(", ")}`,
    );
  }
  return entry;
}
