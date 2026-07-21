import {
  getReduxDeploymentsStateIndex,
  type ApplicationSection,
  type Uuid,
} from "miroir-core";
import { entitySelfApplicationVersion,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
 } from "miroir-test-app_deployment-miroir";

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
    current[getReduxDeploymentsStateIndex(deploymentUuid, section as ApplicationSection, entityUuid)] = emptyCollection();
  }
  return {
    loading: {},
    current,
    status: { initialLoadDone: true },
  };
}
