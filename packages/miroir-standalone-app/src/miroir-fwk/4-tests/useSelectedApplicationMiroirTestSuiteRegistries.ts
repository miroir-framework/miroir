import { useContext, useMemo, useSyncExternalStore } from "react";
import { ReactReduxContext } from "react-redux";

import {
  buildRunnerUuidIndex,
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  isMiroirTestSuiteInstance,
  noValue,
  type ApplicationDeploymentMap,
  type LocalCacheExtractor,
  type MetaModel,
  type MiroirTestDefinition,
  type Runner,
  type UiIntegrationRunnerSuiteRegistryMap,
  type UiIntegrationTransformerSuiteRegistryMap,
} from "miroir-core";
import {
  selectModelForDeploymentFromReduxState,
  useMiroirContextService,
} from "miroir-react";

const emptySubscribe = () => () => {};

function useSelectedApplicationCurrentModel(): MetaModel | undefined {
  const context = useMiroirContextService();
  const selectedApplication =
    context.toolsPageState?.applicationSelector &&
    context.toolsPageState.applicationSelector !== noValue.uuid
      ? context.toolsPageState.applicationSelector
      : context.application;
  const applicationDeploymentMap: ApplicationDeploymentMap =
    context.applicationDeploymentMap ?? {};

  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState, []);
  const foreignKeyParams: LocalCacheExtractor = useMemo(
    () => ({
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        application: selectedApplication,
        applicationDeploymentMap,
        deploymentUuid: applicationDeploymentMap[selectedApplication ?? ""],
      },
    }),
    [selectedApplication, applicationDeploymentMap],
  );

  const state = useSyncExternalStore(
    store ? store.subscribe.bind(store) : emptySubscribe,
    () => store?.getState(),
    () => store?.getState(),
  );

  return useMemo(() => {
    if (!store || state === undefined) {
      return undefined;
    }
    return localSelectModelForDeployment(state, applicationDeploymentMap, foreignKeyParams);
  }, [store, state, localSelectModelForDeployment, applicationDeploymentMap, foreignKeyParams]);
}

export function useSelectedApplicationMiroirTests(): MiroirTestDefinition[] {
  const currentModel = useSelectedApplicationCurrentModel();
  return useMemo(
    () => (currentModel?.tests ?? []).filter(isMiroirTestSuiteInstance),
    [currentModel?.tests],
  );
}

/** Selected-app Runners when Redux is mounted; empty index when the store is absent (RTL). */
export function useSelectedApplicationRunnerUuidIndex(): Record<string, Runner> {
  const currentModel = useSelectedApplicationCurrentModel();
  return useMemo(
    () => buildRunnerUuidIndex((currentModel?.runners ?? []) as Runner[]),
    [currentModel?.runners],
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
