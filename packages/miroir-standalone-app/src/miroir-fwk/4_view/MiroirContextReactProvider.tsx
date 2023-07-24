import { createContext, useContext, useMemo, useState } from "react";

import { EntityState } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";

import {
  ApplicationSection,
  DomainControllerInterface,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirApplicationVersion,
  MiroirContext,
  MiroirContextInterface,
  Report,
  ReportSectionListDefinition,
  StoreBasedConfiguration,
  Uuid,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityReport,
  entityStoreBasedConfiguration,
  selectEntityInstances,
  selectEntityInstancesFromJzodAttribute,
  selectEntityInstancesForReportSection,
  selectReportSectionInstances,
  selectCurrentDeploymentModel,
  MiroirMetaModel,
} from "miroir-core";
import {
  ReduxStateChanges,
  applyEntityInstanceSelectorToDomainStateDeploymentSection,
  applyEntityInstanceArraySelectorToDomainStateDeploymentSection,
  selectCurrentTransaction,
  selectInstancesForSectionEntity,
  applyEntityInstancesArraySelectorToDomainStateDeployment,
  applyMetaModelSelectorToDomainState,
} from "miroir-redux";
import { JzodAttribute, JzodElement, JzodObject } from "@miroir-framework/jzod";

export interface MiroirReactContext {
  miroirContext: MiroirContextInterface;
  domainController: DomainControllerInterface;
  deploymentUuid: string;
  setDeploymentUuid: React.Dispatch<React.SetStateAction<string>>;
  reportUuid: Uuid | undefined;
  setReportUuid: React.Dispatch<React.SetStateAction<Uuid>>;
  applicationSection: ApplicationSection | undefined;
  setApplicationSection: React.Dispatch<React.SetStateAction<ApplicationSection | undefined>>;
  innerFormOutput: any;
  setInnerFormOutput: React.Dispatch<React.SetStateAction<any>>;
}

const miroirReactContext = createContext<MiroirReactContext>({} as MiroirReactContext);

// #############################################################################################
// export function MiroirContextReactProvider(props:any extends {miroirContext:MiroirContextInterface}) {
export function MiroirContextReactProvider(props: {
  miroirContext: MiroirContextInterface;
  domainController: DomainControllerInterface;
  children:
    | string
    | number
    | boolean
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | React.ReactFragment
    | React.ReactPortal;
}) {
  const [deploymentUuid, setDeploymentUuid] = useState("");
  const [reportUuid, setReportUuid] = useState("");
  const [applicationSection, setApplicationSection] = useState<ApplicationSection>("data");
  const [innerFormOutput, setInnerFormOutput] = useState<any>({});

  // const value = useMemo<MiroirReactContext>(()=>({
  const value = useMemo<MiroirReactContext>(
    () => ({
      miroirContext: props.miroirContext || new MiroirContext(),
      domainController: props.domainController,
      deploymentUuid,
      // setDeploymentUuid:(...args)=>{console.log('setDeploymentUuid',args); return setDeploymentUuid1(...args)},
      setDeploymentUuid,
      reportUuid,
      setReportUuid,
      applicationSection,
      setApplicationSection,
      innerFormOutput,
      setInnerFormOutput,
    }),
    [deploymentUuid, reportUuid, applicationSection, props.miroirContext, props.domainController]
  );
  return <miroirReactContext.Provider value={value}>{props.children}</miroirReactContext.Provider>;
}

// #############################################################################################
export function useMiroirContextInnerFormOutput() {
  return [useContext(miroirReactContext)?.innerFormOutput, useContext(miroirReactContext)?.setInnerFormOutput];
}

// #############################################################################################
export function useMiroirContextServiceHook() {
  return useContext(miroirReactContext);
}

// #############################################################################################
export const useErrorLogServiceHook = () => {
  return useContext(miroirReactContext)?.miroirContext.errorLogService.getErrorLog();
};

// #############################################################################################
export const useDomainControllerServiceHook = () => {
  return useContext(miroirReactContext)?.domainController;
};

//#########################################################################################
export function useLocalCacheTransactions(): ReduxStateChanges[] {
  // const result:EntityState<ReduxStateChanges[]> = useSelector(selectCurrentTransaction());
  const result: ReduxStateChanges[] = useSelector(selectCurrentTransaction());
  return result ? result : [];
}

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
): MiroirMetaModel{
  console.log('useLocalCacheMetaModel',deploymentUuid);
  // const reportDefinitions = useSelector(applyEntityInstanceSelectorToDomainStateDeploymentSection(deploymentUuid, section, selectEntityInstancesFromJzodAttribute(jzodSchema)))
  
  return useSelector(applyMetaModelSelectorToDomainState(selectCurrentDeploymentModel(deploymentUuid)));
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

