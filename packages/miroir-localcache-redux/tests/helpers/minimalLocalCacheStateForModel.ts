import {
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration,
  getReduxDeploymentsStateIndex,
  type Uuid,
} from "miroir-core";

import type { LocalCacheSliceState } from "../../src/4_services/localCache/localCacheReduxSliceInterface.js";

function emptyCollection() {
  return { entities: {}, ids: [] as string[] };
}

/**
 * Minimal `state.current` keys so `currentModel` / `currentModelEnvironment` can run
 * without throwing (empty entity collections).
 */
export function buildMinimalLocalCacheStateForDeployment(
  deploymentUuid: Uuid,
  modelSection: "data" | "model",
): LocalCacheSliceState {
  const current: LocalCacheSliceState["current"] = {};
  const indexes: Array<[string, Uuid]> = [
    [modelSection, entitySelfApplicationVersion.uuid],
    [modelSection, entityStoreBasedConfiguration.uuid],
    [modelSection, entityEndpointVersion.uuid],
    ["model", entityEntity.uuid],
    ["model", entityEntityDefinition.uuid],
    [modelSection, entityJzodSchema.uuid],
    [modelSection, entityMenu.uuid],
    [modelSection, entityReport.uuid],
    [modelSection, entityQueryVersion.uuid],
    ["model", entitySelfApplicationVersion.uuid],
  ];
  for (const [section, entityUuid] of indexes) {
    current[getReduxDeploymentsStateIndex(deploymentUuid, section, entityUuid)] = emptyCollection();
  }
  return {
    loading: {},
    current,
    status: { initialLoadDone: true },
  };
}
