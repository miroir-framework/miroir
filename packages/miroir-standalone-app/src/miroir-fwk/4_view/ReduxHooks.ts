import { useCallback } from "react";

import { EntityState } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

import { JzodAttribute } from "@miroir-framework/jzod";
import {
  ApplicationSection,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationVersion,
  Report,
  StoreBasedConfiguration,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  entityStoreBasedConfiguration,
  selectCurrentDeploymentModel,
  selectEntityInstances,
  selectEntityInstancesForReportSection,
  selectEntityInstancesFromJzodAttribute,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  LocalCacheSliceState,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateWithUndoRedo,
  applyEntityInstanceArraySelectorToDomainStateDeploymentSection,
  applyEntityInstanceArraySelectorToEntityInstancesUuidIndex,
  applyEntityInstancesArraySelectorToDomainStateDeployment,
  applyMetaModelSelectorToDomainState,
  selectInstanceArrayForDeploymentSectionEntity,
  selectInstanceUuidIndexForDeploymentSectionEntity
} from "miroir-redux";


//#########################################################################################
export function useLocalCacheSectionEntities(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): MetaEntity[] {
  const miroirEntitiesState = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceUuidIndexForDeploymentSectionEntity(state, {
      deploymentUuid,
      applicationSection: section,
      entityUuid: entityEntity.uuid,
    })
  );
  return Object.values(miroirEntitiesState) as MetaEntity[];
  // return miroirEntitiesState?.entities ? (Object.values(miroirEntitiesState.entities) as MetaEntity[]) : [];
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
function entityInstancesUuidIndexToEntityInstanceArraySelector(
  state: EntityInstancesUuidIndex
) {
  return Object.values(state);
}

// #########################################################################################
export function useLocalCacheDeploymentSectionReportsTOREFACTOR(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): Report[] {
  const miroirReportsState = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(
      state,
      {
        deploymentUuid:deploymentUuid,
        applicationSection: section,
        entityUuid: entityReport.uuid
      }
    )
  );
  // console.log("useLocalCacheDeploymentSectionReportsTOREFACTOR", 'deployment',deploymentUuid, 'section',section, 'entity', entityReport.uuid, "state", miroirReportsState);
  // return Object.values(miroirReportsState) as Report[];
  return miroirReportsState as Report[];
}

//#########################################################################################
export function useLocalCacheInstancesForEntityTOREFACTOR(
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  entityUuid: string | undefined
): EntityInstance[] {
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
  return miroirEntities as EntityInstance[];
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  jzodSchema: JzodAttribute | undefined
): EntityInstance[] {
  // return useSelector(applyEntityInstanceArraySelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstancesFromJzodAttribute(jzodSchema)));
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

//#########################################################################################
export function useLocalCacheEntityInstancesForListReportSection(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined,
  reportUuid: string | undefined
): EntityInstance[]{
  console.log('useLocalCacheEntityInstancesForListReportSection',deploymentUuid,section,reportUuid);
  // const reportDefinitions = useSelector(applyEntityInstanceSelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstancesFromJzodAttribute(jzodSchema)))
  
  return useSelector(applyEntityInstancesArraySelectorToDomainStateDeployment(deploymentUuid, selectEntityInstancesForReportSection(reportUuid,0)));
}

//#########################################################################################
export function useLocalCacheMetaModel(
  deploymentUuid: string | undefined,
) {
  console.log('useLocalCacheMetaModel',deploymentUuid);
  
  // return useSelector(applyMetaModelSelectorToDomainState(selectCurrentDeploymentModel(deploymentUuid)));
  return useCallback(
    () => useSelector(applyMetaModelSelectorToDomainState(selectCurrentDeploymentModel(deploymentUuid))),
    [deploymentUuid]
  );
}

// //#########################################################################################
// export function useLocalCacheInstancesForReport(
//   deploymentUuid: string,
//   section: ApplicationSection,
//   reportSectionListDefinition: ReportSectionListDefinition
// ): EntityInstance[] {
//   return useSelector(
//     applyEntityInstanceArraySelectorToDomainStateDeploymentSection(
//       deploymentUuid,
//       section,
//       selectReportSectionInstances(reportSectionListDefinition)
//     )
//   );
// }

