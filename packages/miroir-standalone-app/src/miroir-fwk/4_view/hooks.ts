import { EntityState } from "@reduxjs/toolkit";
import {
  EntityDefinition,
  entityDefinitionEntityDefinition,
  entityApplicationVersion,
  entityReport,
  entityStoreBasedConfiguration,
  EntityInstance,
  MiroirApplicationVersion,
  MiroirReport,
  selectEntityInstances,
  selectReportInstances,
  StoreBasedConfiguration,
  entityEntity,
  MetaEntity,
  entityEntityDefinition,
} from "miroir-core";
import {
  ReduxStateChanges,
  selectCurrentTransaction,
  selectInstancesForEntity,
  selectInstancesForDeploymentEntity,
  selectInstancesFromDeploymentDomainSelector,
} from "miroir-redux";
import { useSelector } from "react-redux";

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}

//#########################################################################################
export function useLocalCacheEntities(): MetaEntity[] {
  const miroirEntitiesState: EntityState<MetaEntity> = useSelector(
    selectInstancesForEntity(entityEntity.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [];
}

//#########################################################################################
export function useLocalCacheDeploymentEntities(deploymentUuid:string): MetaEntity[] {
  const miroirEntitiesState: EntityState<MetaEntity> = useSelector(
    selectInstancesForDeploymentEntity(deploymentUuid, entityEntity.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [];
}

//#########################################################################################
export function useLocalCacheEntityDefinitions(): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForEntity(entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [];
}

//#########################################################################################
export function useLocalCacheDeploymentEntityDefinitions(deploymentUuid:string): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForDeploymentEntity(deploymentUuid, entityEntityDefinition.uuid)
  );
  return miroirEntitiesState?.entities ? Object.values(miroirEntitiesState.entities) : [];
}

//#########################################################################################
export function useLocalCacheReports(): MiroirReport[] {
  const miroirReportsState: EntityState<MiroirReport> = useSelector(selectInstancesForEntity(entityReport.uuid));
  const miroirReports: MiroirReport[] = miroirReportsState?.entities ? Object.values(miroirReportsState.entities) : [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheDeploymentReports(deploymentUuid:string): MiroirReport[] {
  const miroirReportsState: EntityState<MiroirReport> = useSelector(selectInstancesForDeploymentEntity(deploymentUuid,entityReport.uuid));
  const miroirReports: MiroirReport[] = miroirReportsState?.entities ? Object.values(miroirReportsState.entities) : [];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheStoreBasedConfiguration(): StoreBasedConfiguration[] {
  const miroirStoreBasedConfigurationState: EntityState<StoreBasedConfiguration> = useSelector(
    selectInstancesForEntity(entityStoreBasedConfiguration.uuid)
  );
  const miroirStoreBasedConfigurations: StoreBasedConfiguration[] = miroirStoreBasedConfigurationState?.entities
    ? Object.values(miroirStoreBasedConfigurationState.entities)
    : [];
  return miroirStoreBasedConfigurations;
}

//#########################################################################################
export function useLocalCacheModelVersion(): MiroirApplicationVersion[] {
  const miroirModelVersionState: EntityState<MiroirApplicationVersion> = useSelector(
    selectInstancesForEntity(entityApplicationVersion.uuid)
  );
  const miroirModelVersions: MiroirApplicationVersion[] = miroirModelVersionState?.entities
    ? Object.values(miroirModelVersionState.entities)
    : [];
  return miroirModelVersions;
}

//#########################################################################################
export function useLocalCacheInstancesForReport(deploymentUuid:string, reportName: string): EntityInstance[] {
  return useSelector(selectInstancesFromDeploymentDomainSelector(deploymentUuid)(selectReportInstances(reportName)));
}

// //#########################################################################################
// export function useLocalCacheInstancesForDeploymentReport(deploymentUuid:string,reportName: string): EntityInstance[] {
//   return useSelector(selectInstancesFromDeploymentDomainSelector(deploymentUuid)(selectReportInstances(reportName)));
// }

//#########################################################################################
export function useLocalCacheInstancesForEntity(deploymentUuid:string, entityUuid: string): EntityInstance[] {
  return useSelector(selectInstancesFromDeploymentDomainSelector(deploymentUuid)(selectEntityInstances(entityUuid)));
}
