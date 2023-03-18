import { EntityState } from "@reduxjs/toolkit";
import { EntityDefinition, entityEntity, entityReport, Instance, MiroirReport, selectEntityInstances, selectReportInstances } from "miroir-core";
import { ReduxStateChanges, selectCurrentTransaction, selectInstancesForEntity, selectInstancesFromDomainSelector } from "miroir-redux";
import { useSelector } from "react-redux";

//#########################################################################################
export function useLocalCacheTransactions():ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result:ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result?result:[];
}

//#########################################################################################
export function useLocalCacheEntities():EntityDefinition[] {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity(entityEntity.uuid));
  return miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
}

//#########################################################################################
export function useLocalCacheReports():MiroirReport[] {
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity(entityReport.uuid))
  const miroirReports:MiroirReport[] = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheInstancesForReport(reportName:string):Instance[] {
  return useSelector(selectInstancesFromDomainSelector(selectReportInstances(reportName)));
}

//#########################################################################################
export function useLocalCacheInstancesForEntity(entityUuid:string):Instance[] {
  return useSelector(selectInstancesFromDomainSelector(selectEntityInstances(entityUuid)));
}
