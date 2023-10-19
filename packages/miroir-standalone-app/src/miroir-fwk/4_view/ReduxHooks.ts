import { useMemo } from "react";

import { useSelector } from "react-redux";

import { JzodAttribute } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  DomainState,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  LocalCacheEntityInstancesSelectorParams,
  LocalCacheQueryParams,
  MiroirApplicationModel,
  MiroirSelectorQueryParams,
  Uuid,
  applicationDeploymentMiroir,
  entityEntityDefinition,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDomainStateSelector,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeployment
} from "miroir-redux";

export type EntityInstanceUuidIndexSelectorParams = LocalCacheEntityInstancesSelectorParams;

// ################################################################################################
export function useDomainStateSelector<T = any>(
  domainStateSelector:(
    domainState: DomainState,
    query: MiroirSelectorQueryParams
  ) => T,
  query:MiroirSelectorQueryParams
): T {
  const innerSelector = useMemo(()=>applyDomainStateSelector(domainStateSelector), []);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, query)
  );
  return result
}
// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined):MiroirApplicationModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      type: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid,
      }
    } as LocalCacheQueryParams),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  ) as MiroirApplicationModel
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:LocalCacheQueryParams): EntityInstancesUuidIndex | undefined {
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({...params}),
    [params]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
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
        type: "LocalCacheEntityInstancesSelectorParams",
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
        type: "LocalCacheEntityInstancesSelectorParams",
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
        type: "LocalCacheEntityInstancesSelectorParams",
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

