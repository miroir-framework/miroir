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
  selectEntityUuidFromJzodAttribute
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
// export function useEntityInstanceUuidIndexFromDomainState(params:EntityInstanceUuidIndexSelectorParams): EntityInstancesUuidIndex | undefined {
export function useEntityInstanceUuidIndexFromDomainState(params:MiroirSelectorParams): EntityInstancesUuidIndex | undefined {
  // const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  // const selectorParams:DomainEntityInstancesSelectorParams = useMemo(
  const selectorParams:MiroirSelectorParams = useMemo(
    () => ({...params}),
    // [params?.definition?.applicationSection,params?.deploymentUuid,params?.entityUuid]
    [params]
  );

  return useSelector((reduxState: ReduxStateWithUndoRedo) =>
    // selectEntityInstanceUuidIndexFromLocalCache2(state, selectorParams)
    applyDomainStateSelector<EntityInstancesUuidIndex | undefined>(selectEntityInstanceUuidIndexFromDomainState)(reduxState,selectorParams)
  )
}

// ################################################################################################
// export function useEntityInstanceUuidIndexFromLocalCache(params:EntityInstanceUuidIndexSelectorParams): EntityInstancesUuidIndex | undefined {
export function useEntityInstanceUuidIndexFromLocalCache(params:MiroirSelectorParams): EntityInstancesUuidIndex | undefined {
  // const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  // const selectorParams:DomainEntityInstancesSelectorParams = useMemo(
  const selectorParams:MiroirSelectorParams = useMemo(
    () => ({...params}),
    // [params?.applicationSection,params?.deploymentUuid,params?.entityUuid]
    [params]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
}


// // ################################################################################################
// export const queryEntityInstanceUuidIndexFromLocalCache = (
//   state: ReduxStateWithUndoRedo,
//   params: EntityInstanceListQueryParams
// ): EntityInstancesUuidIndex => {
//   const selectedInstances: EntityInstancesUuidIndex | undefined = selectEntityInstanceUuidIndexFromLocalCache(state,params.localCacheSelectorParams)
//   // const result = selectedInstances;
//   console.log('queryEntityInstanceUuidIndexFromLocalCache','params',params,'selectedInstances',selectedInstances,'state',state);
//   const result: EntityInstancesUuidIndex = useMemo(()=>Object.fromEntries(
//     Object.entries(selectedInstances ?? {}).filter(
//       (i: [string, EntityInstance]) =>
//         (i[1] as any)[params.query?.rootObjectAttribute ?? "dummy"] == params.query?.rootObjectUuid
//     )
//   ), [selectedInstances]);
//   console.log('queryEntityInstanceUuidIndexFromLocalCache','params',params,'result',result);
//   return result;
// };

// ################################################################################################
// export function useEntityInstanceListQueryFromLocalCache(selectorParams:EntityInstanceListQueryParams): EntityInstancesUuidIndex {
export function useEntityInstanceListQueryFromLocalCache(selectorParams:MiroirSelectorParams): EntityInstancesUuidIndex {

  const selectedInstances: EntityInstancesUuidIndex | undefined = useSelector((reduxState: ReduxStateWithUndoRedo) =>
    // selectEntityInstanceUuidIndexFromLocalCache(state, params.localCacheSelectorParams)
    // applyDomainStateSelector(selectEntityInstanceUuidIndexFromDomainState)(reduxState,selectorParams.type== "EntityInstanceListQueryParams"?selectorParams.definition.localCacheSelectorParams:undefined)
    applyDomainStateSelector(selectEntityInstanceUuidIndexFromDomainState)(reduxState,selectorParams)
  );
  console.log('useEntityInstanceListQueryFromLocalCache','params',selectorParams,'selectedInstances',selectedInstances);
  const result: EntityInstancesUuidIndex = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(selectedInstances ?? {}).filter(
          (i: [string, EntityInstance]) =>
            (i[1] as any)[
              selectorParams.type == "EntityInstanceListQueryParams"
                ? selectorParams.definition.query?.rootObjectAttribute ?? "dummy"
                : "dummy"
            ] === (selectorParams.type == "EntityInstanceListQueryParams"?selectorParams.definition.query?.rootObjectUuid:undefined)
        )
      ),
    [selectedInstances]
  );

  console.log("useEntityInstanceListQueryFromLocalCache", "selectedInstances", selectedInstances, "result", result);
  
  return result;
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
