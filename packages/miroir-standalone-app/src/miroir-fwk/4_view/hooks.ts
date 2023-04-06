import { EntityState } from "@reduxjs/toolkit";
import {
  EntityDefinition,
  entityDefinitionEntityDefinition,
  entityModelVersion,
  entityReport,
  entityStoreBasedConfiguration,
  EntityInstance,
  MiroirModelVersion,
  MiroirReport,
  selectEntityInstances,
  selectReportInstances,
  StoreBasedConfiguration,
} from "miroir-core";
import {
  ReduxStateChanges,
  selectCurrentTransaction,
  selectInstancesForEntity,
  selectInstancesFromDomainSelector,
} from "miroir-redux";
import { useSelector } from "react-redux";

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}

//#########################################################################################
export function useLocalCacheEntities(): EntityDefinition[] {
  const miroirEntitiesState: EntityState<EntityDefinition> = useSelector(
    selectInstancesForEntity(entityDefinitionEntityDefinition.uuid)
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
export function useLocalCacheModelVersion(): MiroirModelVersion[] {
  const miroirModelVersionState: EntityState<MiroirModelVersion> = useSelector(
    selectInstancesForEntity(entityModelVersion.uuid)
  );
  const miroirModelVersions: MiroirModelVersion[] = miroirModelVersionState?.entities
    ? Object.values(miroirModelVersionState.entities)
    : [];
  return miroirModelVersions;
}

//#########################################################################################
export function useLocalCacheInstancesForReport(reportName: string): EntityInstance[] {
  return useSelector(selectInstancesFromDomainSelector(selectReportInstances(reportName)));
}

//#########################################################################################
export function useLocalCacheInstancesForEntity(parentUuid: string): EntityInstance[] {
  return useSelector(selectInstancesFromDomainSelector(selectEntityInstances(parentUuid)));
}
