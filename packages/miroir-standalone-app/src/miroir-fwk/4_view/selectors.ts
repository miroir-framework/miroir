import { EntityState } from "@reduxjs/toolkit";
import { EntityDefinition, Instance, MiroirReport, selectReportInstances } from "miroir-core";
import { selectInstancesForEntity, selectInstancesFromDomainSelector } from "miroir-redux";
import { useSelector } from "react-redux";

//#########################################################################################
export function useLocalCacheEntities():EntityDefinition[] {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity('Entity'));
  return miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
}

//#########################################################################################
export function useLocalCacheReports():MiroirReport[] {
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirReports:MiroirReport[] = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];
  return miroirReports;
}

//#########################################################################################
export function useLocalCacheInstancesForReport(reportName:string):Instance[] {
  // const instanceState:EntityState<Instance> = useSelector(selectInstancesForEntity(entityName))
  // const instanceState:EntityState<Instance> = useSelector(selectInstancesFromDomainSelector(selectReportInstances('BookList')))
  // const instances:Instance[] = instanceState?.entities?Object.values(instanceState.entities):[];
  const instances:Instance[] = useSelector(selectInstancesFromDomainSelector(selectReportInstances(reportName)));
  return instances;
}
