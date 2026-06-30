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
  type ApplicationSection,
  type Uuid,
} from "miroir-core";

import type { LocalCacheSliceState } from "miroir-react";

function emptyCollection() {
  return { entities: {}, ids: [] as string[] };
}

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
    current[getReduxDeploymentsStateIndex(deploymentUuid, section as ApplicationSection, entityUuid)] = emptyCollection();
  }
  return {
    loading: {},
    current,
    status: { initialLoadDone: true },
  };
}

export function addEndpointToLocalCacheState(
  slice: LocalCacheSliceState,
  deploymentUuid: Uuid,
  modelSection: "data" | "model",
  endpoint: { uuid: string },
): LocalCacheSliceState {
  const index = getReduxDeploymentsStateIndex(
    deploymentUuid,
    modelSection,
    entityEndpointVersion.uuid,
  );
  return {
    ...slice,
    current: {
      ...slice.current,
      [index]: {
        entities: { [endpoint.uuid]: endpoint },
        ids: [endpoint.uuid],
      },
    },
  };
}
