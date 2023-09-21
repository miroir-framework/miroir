import { useMemo } from "react";

import { useSelector } from "react-redux";

import { JzodAttribute } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  DomainEntityInstancesSelectorParams,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  MiroirApplicationModel,
  MiroirSelectorParams,
  SelectObjectListQuery,
  Uuid,
  applicationDeploymentMiroir,
  entityEntityDefinition,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityUuidFromJzodAttribute,
  selectRelatedEntityInstancesUuidIndexFromDomainState
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDomainStateSelector,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeployment
} from "miroir-redux";

export type EntityInstanceUuidIndexSelectorParams = DomainEntityInstancesSelectorParams;
export type EntityInstanceListQueryParams = {localCacheSelectorParams: DomainEntityInstancesSelectorParams, query: SelectObjectListQuery};

// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined):MiroirApplicationModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams:MiroirSelectorParams = useMemo(
    () => ({
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid,
      }
    } as MiroirSelectorParams),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  ) as MiroirApplicationModel
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromDomainState(params:MiroirSelectorParams): EntityInstancesUuidIndex | undefined {
  const selectorParams:MiroirSelectorParams = useMemo(
    () => ({...params}),
    [params]
  );

  return useSelector((reduxState: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector<EntityInstancesUuidIndex | undefined>(selectEntityInstanceUuidIndexFromDomainState)(reduxState,selectorParams)
  )
}

// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:MiroirSelectorParams): EntityInstancesUuidIndex | undefined {
  const selectorParams:MiroirSelectorParams = useMemo(
    () => ({...params}),
    [params]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
}

// ################################################################################################
export function useEntityInstanceListQueryFromLocalCache(selectorParams:MiroirSelectorParams): EntityInstancesUuidIndex {

  const result: EntityInstancesUuidIndex | undefined = useSelector((reduxState: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectRelatedEntityInstancesUuidIndexFromDomainState)(reduxState,selectorParams)
  );
  
  return result??{};
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
        type: "DomainEntityInstancesSelectorParams",
        definition: {
          deploymentUuid:applicationDeploymentMiroir.uuid,
          applicationSection: "model",
          entityUuid: entityEntityDefinition.uuid
        }
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
        type: "DomainEntityInstancesSelectorParams",
        definition: {
          deploymentUuid,
          applicationSection: section,
          entityUuid: entityEntityDefinition.uuid
        }
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
        type: "DomainEntityInstancesSelectorParams",
        definition: {
          deploymentUuid,
          applicationSection,
          entityUuid,
        }
      }
    )
  );
  console.log('useLocalCacheInstancesForJzodAttribute',deploymentUuid,applicationSection,jzodSchema,entityUuid,miroirEntities);
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}
