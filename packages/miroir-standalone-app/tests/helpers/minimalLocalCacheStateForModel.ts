import {
  getReduxDeploymentsStateIndex,
  type ApplicationSection,
  type Entity,
  type Uuid,
} from "miroir-core";
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
} from "miroir-test-app_deployment-miroir";
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

export function mutateEntityDescriptionInLocalCacheState(
  slice: LocalCacheSliceState,
  deploymentUuid: Uuid,
  modelSection: "data" | "model",
  entityUuid: string,
  description: string,
): LocalCacheSliceState {
  const index = getReduxDeploymentsStateIndex(
    deploymentUuid,
    modelSection,
    entityEntity.uuid,
  );
  const collection = slice.current[index];
  const existing = collection?.entities?.[entityUuid];
  if (!existing) {
    return slice;
  }
  return {
    ...slice,
    current: {
      ...slice.current,
      [index]: {
        ...collection,
        entities: {
          ...collection.entities,
          [entityUuid]: {
            ...existing,
            description,
          } as Entity,
        },
      },
    },
  };
}

export function addEntityInstanceToLocalCacheState(
  slice: LocalCacheSliceState,
  deploymentUuid: Uuid,
  entityInstance: { uuid: string },
): LocalCacheSliceState {
  const index = getReduxDeploymentsStateIndex(deploymentUuid, "model", entityEntity.uuid);
  const collection = slice.current[index] ?? emptyCollection();
  return {
    ...slice,
    current: {
      ...slice.current,
      [index]: {
        entities: {
          ...collection.entities,
          [entityInstance.uuid]: entityInstance,
        },
        ids: collection.ids.includes(entityInstance.uuid)
          ? collection.ids
          : [...collection.ids, entityInstance.uuid],
      },
    },
  };
}

export function mutateEntityDefinitionInLocalCacheState(
  slice: LocalCacheSliceState,
  deploymentUuid: Uuid,
  entityDefinitionUuid: string,
  patch: Record<string, unknown>,
): LocalCacheSliceState {
  const index = getReduxDeploymentsStateIndex(
    deploymentUuid,
    "model",
    entityEntityDefinition.uuid,
  );
  const collection = slice.current[index];
  const existing = collection?.entities?.[entityDefinitionUuid];
  if (!existing) {
    return slice;
  }
  return {
    ...slice,
    current: {
      ...slice.current,
      [index]: {
        ...collection,
        entities: {
          ...collection.entities,
          [entityDefinitionUuid]: {
            ...existing,
            ...patch,
          },
        },
      },
    },
  };
}
