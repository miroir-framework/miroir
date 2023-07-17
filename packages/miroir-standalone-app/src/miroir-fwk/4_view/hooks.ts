import { EntityState } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import {
  applicationDeploymentMiroir,
  EntityDefinition,
  entityDefinitionEntityDefinition,
  entityApplicationVersion,
  entityReport,
  entityStoreBasedConfiguration,
  EntityInstance,
  MiroirApplicationVersion,
  Report,
  selectEntityInstances,
  selectReportSectionInstances,
  StoreBasedConfiguration,
  entityEntity,
  MetaEntity,
  entityEntityDefinition,
  ApplicationSection,
  ReportSectionListDefinition,
} from "miroir-core";
import {
  ReduxStateChanges,
  selectInstancesForSectionEntity,
  applySelectorToDomainStateSection,
  selectCurrentTransaction,
} from "miroir-redux";

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}


//#########################################################################################
export function useLocalCacheSectionEntities(deploymentUuid:string|undefined, section:ApplicationSection|undefined): MetaEntity[] {
  const miroirEntitiesState: EntityState<MetaEntity> = useSelector(
    selectInstancesForSectionEntity(deploymentUuid, section, entityEntity.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) as MetaEntity[] : [];
}

//#########################################################################################
export function useLocalCacheEntityDefinitions(): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid,'model',entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) as EntityDefinition[] : [];
}

//#########################################################################################
export function useLocalCacheSectionEntityDefinitions(deploymentUuid:string|undefined,section:ApplicationSection|undefined): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForSectionEntity(deploymentUuid, section, entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) as EntityDefinition[]: [];
}

//#########################################################################################
export function useLocalCacheReports(): Report[] {
  const miroirReportsState: EntityState<Report> = useSelector(selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid,'model',entityReport.uuid));
  const miroirReports: Report[] = miroirReportsState?.entities ? Object.values(miroirReportsState.entities) as Report[]: [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheDeploymentSectionReports(deploymentUuid:string|undefined,section:ApplicationSection|undefined): Report[] {
  const miroirReportsState: EntityState<Report> = useSelector(selectInstancesForSectionEntity(deploymentUuid,section,entityReport.uuid));
  console.log('useLocalCacheDeploymentSectionReports',deploymentUuid,section,'state',miroirReportsState);
  
  const miroirReports: Report[] = miroirReportsState?.entities ? Object.values(miroirReportsState.entities) as Report[] : [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheStoreBasedConfiguration(): StoreBasedConfiguration[] {
  const miroirStoreBasedConfigurationState: EntityState<StoreBasedConfiguration> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid,'data',entityStoreBasedConfiguration.uuid)
  );
  const miroirStoreBasedConfigurations: StoreBasedConfiguration[] = miroirStoreBasedConfigurationState?.entities
    ? Object.values(miroirStoreBasedConfigurationState.entities) as StoreBasedConfiguration[]
    : [];
  return miroirStoreBasedConfigurations;
}

//#########################################################################################
export function useLocalCacheModelVersion(): MiroirApplicationVersion[] {
  const miroirModelVersionState: EntityState<MiroirApplicationVersion> = useSelector(
    selectInstancesForSectionEntity(applicationDeploymentMiroir.uuid,'model',entityApplicationVersion.uuid)
  );
  const miroirModelVersions: MiroirApplicationVersion[] = miroirModelVersionState?.entities
    ? Object.values(miroirModelVersionState.entities) as MiroirApplicationVersion[]
    : [];
  return miroirModelVersions;
}

//#########################################################################################
export function useLocalCacheInstancesForReport(deploymentUuid:string, section: ApplicationSection, reportSectionListDefinition: ReportSectionListDefinition): EntityInstance[] {
  return useSelector(applySelectorToDomainStateSection(deploymentUuid,section,selectReportSectionInstances(reportSectionListDefinition)));
}

//#########################################################################################
export function useLocalCacheInstancesForEntity(deploymentUuid:string | undefined, section: ApplicationSection | undefined, entityUuid: string | undefined): EntityInstance[] {
  // console.log('useLocalCacheInstancesForEntity',deploymentUuid,section,entityUuid);
  return useSelector(applySelectorToDomainStateSection(deploymentUuid,section,selectEntityInstances(entityUuid)));
}
