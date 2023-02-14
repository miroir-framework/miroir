import { EntityState } from "@reduxjs/toolkit";
import { EntityDefinition, MiroirReport } from "miroir-core";
import { selectInstancesForEntity } from "miroir-redux";
import { useSelector } from "react-redux";

//#########################################################################################
export function useLocalStoreEntities():EntityDefinition[] {
  const miroirEntitiesState:EntityState<EntityDefinition> = useSelector(selectInstancesForEntity('Entity'));
  return miroirEntitiesState?.entities?Object.values(miroirEntitiesState.entities):[];
}

//#########################################################################################
export function useLocalStoreReports():MiroirReport[] {
  const miroirReportsState:EntityState<MiroirReport> = useSelector(selectInstancesForEntity('Report'))
  const miroirReports:MiroirReport[] = miroirReportsState?.entities?Object.values(miroirReportsState.entities):[];
  return miroirReports;
}
