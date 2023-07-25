import { useCallback } from "react";

import { EntityState } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

import { JzodAttribute } from "@miroir-framework/jzod";
import {
  ApplicationSection,
  EntityDefinition,
  EntityInstance,
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
  selectEntityInstancesFromJzodAttribute
} from "miroir-core";
import {
  applyEntityInstanceArraySelectorToDomainStateDeploymentSection,
  applyEntityInstancesArraySelectorToDomainStateDeployment,
  applyMetaModelSelectorToDomainState,
  selectInstancesForSectionEntity
} from "miroir-redux";


//#########################################################################################
export function useLocalCacheSectionEntities(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): MetaEntity[] {
  const miroirEntitiesState: EntityState<MetaEntity> = useSelector(
    selectInstancesForSectionEntity(deploymentUuid, section, entityEntity.uuid)
  );
  return miroirEntitiesState?.entities ? (Object.values(miroirEntitiesState.entities) as MetaEntity[]) : [];
}

//#########################################################################################
export function useLocalCacheEntityDefinitions(): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid, "model", entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? (Object.values(miroirEntitiesState.entities) as EntityDefinition[]) : [];
}

//#########################################################################################
export function useLocalCacheSectionEntityDefinitions(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForSectionEntity(deploymentUuid, section, entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? (Object.values(miroirEntitiesState.entities) as EntityDefinition[]) : [];
}

//#########################################################################################
export function useLocalCacheReports(): Report[] {
  const miroirReportsState: EntityState<Report> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid, "model", entityReport.uuid)
  );
  const miroirReports: Report[] = miroirReportsState?.entities
    ? (Object.values(miroirReportsState.entities) as Report[])
    : [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheDeploymentSectionReports(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): Report[] {
  const miroirReportsState: EntityState<Report> = useSelector(
    selectInstancesForSectionEntity(deploymentUuid, section, entityReport.uuid)
  );
  console.log("useLocalCacheDeploymentSectionReports", deploymentUuid, section, "state", miroirReportsState);

  const miroirReports: Report[] = miroirReportsState?.entities
    ? (Object.values(miroirReportsState.entities) as Report[])
    : [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheStoreBasedConfiguration(): StoreBasedConfiguration[] {
  const miroirStoreBasedConfigurationState: EntityState<StoreBasedConfiguration> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid, "data", entityStoreBasedConfiguration.uuid)
  );
  const miroirStoreBasedConfigurations: StoreBasedConfiguration[] = miroirStoreBasedConfigurationState?.entities
    ? (Object.values(miroirStoreBasedConfigurationState.entities) as StoreBasedConfiguration[])
    : [];
  return miroirStoreBasedConfigurations;
}

//#########################################################################################
export function useLocalCacheModelVersion(): MiroirApplicationVersion[] {
  const miroirModelVersionState: EntityState<MiroirApplicationVersion> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid, "model", entityApplicationVersion.uuid)
  );
  const miroirModelVersions: MiroirApplicationVersion[] = miroirModelVersionState?.entities
    ? (Object.values(miroirModelVersionState.entities) as MiroirApplicationVersion[])
    : [];
  return miroirModelVersions;
}

//#########################################################################################
export function useLocalCacheInstancesForEntity(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined,
  entityUuid: string | undefined
): EntityInstance[] {
  // console.log('useLocalCacheInstancesForEntity',deploymentUuid,section,entityUuid);
  return useSelector(applyEntityInstanceArraySelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstances(entityUuid)));
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined,
  jzodSchema: JzodAttribute | undefined
): EntityInstance[] {
  // console.log('useLocalCacheInstancesForEntity',deploymentUuid,section,entityUuid);
  return useSelector(applyEntityInstanceArraySelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstancesFromJzodAttribute(jzodSchema)));
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
  // section: ApplicationSection | undefined,
  // reportUuid: string | undefined
// ): MiroirMetaModel{
) {
  console.log('useLocalCacheMetaModel',deploymentUuid);
  // const reportDefinitions = useSelector(applyEntityInstanceSelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstancesFromJzodAttribute(jzodSchema)))
  
  // return useSelector(applyMetaModelSelectorToDomainState(selectCurrentDeploymentModel(deploymentUuid)));
  return useCallback(()=>useSelector(applyMetaModelSelectorToDomainState(selectCurrentDeploymentModel(deploymentUuid))),[deploymentUuid]);
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

