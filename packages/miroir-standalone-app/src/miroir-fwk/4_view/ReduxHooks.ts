import { useMemo } from "react";

import { useSelector } from "react-redux";

import { JzodAttribute } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  MiroirApplicationModel,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentMiroir,
  entityEntityDefinition,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  LocalCacheInputSelectorParams,
  ReduxStateWithUndoRedo,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeployment
} from "miroir-redux";

export type EntityInstanceUuidIndexSelectorParams = LocalCacheInputSelectorParams;
export type EntityInstanceQueryParams = {localCacheSelectorParams: LocalCacheInputSelectorParams, query: SelectObjectListQuery};

// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined):MiroirApplicationModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({
      deploymentUuid,
    } as LocalCacheInputSelectorParams),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  ) as MiroirApplicationModel
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:EntityInstanceUuidIndexSelectorParams) {
  // const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({...params}),
    [params?.applicationSection,params?.deploymentUuid,params?.entityUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
}


// ################################################################################################
export const queryEntityInstanceUuidIndexFromLocalCache = (
  state: ReduxStateWithUndoRedo,
  params: EntityInstanceQueryParams
): EntityInstancesUuidIndex | undefined => {
  const selectedInstances = selectEntityInstanceUuidIndexFromLocalCache(state,params.localCacheSelectorParams)
  // const result = selectedInstances;
  const result = Object.fromEntries(
    Object.entries(selectedInstances ?? {}).filter(
      (i: [string, EntityInstance]) =>
        (i[1] as any)[params.query?.rootObjectAttribute ?? "dummy"] == params.query?.rootObjectUuid
    )
  );
  // console.log('selectEntityInstanceUuidIndexFromLocalCache','params',params,'localEntityIndex',localEntityIndex,'state',state,'result',result);
  return result;
};

// ################################################################################################
export function useEntityInstanceQueryFromLocalCache(params:EntityInstanceQueryParams) {
  // const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams: EntityInstanceQueryParams = useMemo(
    () => ({ ...params }),
    [
      params?.localCacheSelectorParams?.applicationSection,
      params?.localCacheSelectorParams?.deploymentUuid,
      params?.localCacheSelectorParams?.entityUuid,
      params?.query?.rootObjectAttribute,
      params?.query?.rootObjectUuid,
    ]
  );

  const selectedInstances = useSelector((state: ReduxStateWithUndoRedo) =>
    queryEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  );

  return selectedInstances;
}

//#########################################################################################
function entityInstancesUuidIndexToEntityInstanceArraySelector(
  state: EntityInstancesUuidIndex
) {
  return Object.values(state);
}

//#########################################################################################
export function useLocalCacheEntityDefinitions(): EntityDefinition[] {
  const miroirEntitiesState = useSelector((state: ReduxStateWithUndoRedo) =>
  selectInstanceArrayForDeploymentSectionEntity(
      state, 
      {
        deploymentUuid:applicationDeploymentMiroir.uuid,
        applicationSection: "model",
        entityUuid: entityEntityDefinition.uuid
      }
    )
  );
  return miroirEntitiesState as EntityDefinition[];
}

//#########################################################################################
export function useLocalCacheSectionEntityDefinitions(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): EntityDefinition[] {
  const miroirEntitiesState = useSelector((state: ReduxStateWithUndoRedo) =>
  selectInstanceArrayForDeploymentSectionEntity(
      state, 
      {
        deploymentUuid,
        applicationSection: section,
        entityUuid: entityEntityDefinition.uuid
      }
    )
  );
  return miroirEntitiesState as EntityDefinition[];
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  jzodSchema: JzodAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(jzodSchema)
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(
      state,
      {
        deploymentUuid,
        applicationSection,
        entityUuid,
      }
    )
  );
  console.log('useLocalCacheInstancesForJzodAttribute',deploymentUuid,applicationSection,jzodSchema,entityUuid,miroirEntities);
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}
