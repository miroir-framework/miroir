import { useMemo } from "react";

import {
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  isMiroirTestSuiteInstance,
  noValue,
  type MiroirTestDefinition,
  type UiIntegrationRunnerSuiteRegistryMap,
  type UiIntegrationTransformerSuiteRegistryMap,
} from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { useCurrentModel } from "../4_view/ReduxHooks.js";

export function useSelectedApplicationMiroirTests(): MiroirTestDefinition[] {
  const context = useMiroirContextService();
  const selectedApplication =
    context.toolsPageState?.applicationSelector &&
    context.toolsPageState.applicationSelector !== noValue.uuid
      ? context.toolsPageState.applicationSelector
      : context.application;
  const currentModel = useCurrentModel(
    selectedApplication,
    context.applicationDeploymentMap ?? {},
  );
  return useMemo(
    () => (currentModel?.tests ?? []).filter(isMiroirTestSuiteInstance),
    [currentModel?.tests],
  );
}

export function useSelectedApplicationMiroirTestSuiteRegistries(fallbackInstances: MiroirTestDefinition[] = []): {
  runner: UiIntegrationRunnerSuiteRegistryMap;
  transformer: UiIntegrationTransformerSuiteRegistryMap;
  instances: MiroirTestDefinition[];
} {
  const selectedTests = useSelectedApplicationMiroirTests();
  const instances = selectedTests.length > 0 ? selectedTests : fallbackInstances;
  const registries = useMemo(
    () => buildUiIntegrationSuiteRegistriesFromMiroirTests(instances),
    [instances],
  );
  return {
    ...registries,
    instances,
  };
}
