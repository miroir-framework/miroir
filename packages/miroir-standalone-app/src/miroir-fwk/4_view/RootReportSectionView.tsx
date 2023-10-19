import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationSection,
  DomainFetchQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelQueryParams,
  FetchedData,
  RecordOfJzodElement,
  RootReportSection,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  selectFetchQueryJzodSchemaFromDomainState,
  selectFetchedDataFromDomainState
} from "miroir-core";
import { ReduxStateWithUndoRedo, applyDomainStateSelector, selectorFetchedDataFromDomainState } from "miroir-redux";



import { ReportSectionView } from './ReportSectionView';
import { useCurrentModel } from './ReduxHooks';
import { JzodElement } from '@miroir-framework/jzod-ts';

export interface ReportSectionEntityInstanceProps {
  fetchedData: Record<string,any>,
  reportSection: RootReportSection | undefined,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid,
}

let count = 0
// ###############################################################################################################
export const RootReportSectionView = (props: ReportSectionEntityInstanceProps) => {
  count++;
  
  // const errorLog = useErrorLogService();

  console.log("########################## RootReportSectionView", count, "ReportSection", props.reportSection);

  // const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];
  console.log(
    "RootReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "fetchData",
    props.reportSection?.fetchData
  );

  const fetchedDataEntriesParams: DomainFetchQueryParams = useMemo(() => ({
    type: "DomainManyQueries",
    deploymentUuid: props.deploymentUuid,
    applicationSection: props.applicationSection,
    select: props.reportSection?.fetchData?.select ?? {},
    combine: props.reportSection?.fetchData?.combine ?? { a: "", b: "" }
}
),[props.deploymentUuid, props.applicationSection, props.reportSection?.fetchData]);


  // const selectorFetchedDataFromDomainState = useMemo(()=>applyDomainStateSelector(selectFetchedDataFromDomainState), []);
  const fetchedData: FetchedData | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    selectorFetchedDataFromDomainState(state, fetchedDataEntriesParams)
  );

  const initFetchedData = useMemo(()=>({
  }),[])
  const pageParams = useMemo(()=>({
    applicationSection: props.applicationSection,
    deploymentUuid: props.deploymentUuid,
    instanceUuid: props.instanceUuid,
  }),[props])

  const fetchedDataJzodSchemaParams: DomainModelGetFetchParamJzodSchemaQueryParams = useMemo(()=>({
      type: "getFetchParamsJzodSchema",
      fetchedData: initFetchedData,
      pageParams: pageParams,
      fetchParams: fetchedDataEntriesParams,
  }),[initFetchedData, pageParams,fetchedDataEntriesParams])

  const selectorFetchQueryJzodSchemaFromDomainState = useMemo(()=>applyDomainStateSelector(selectFetchQueryJzodSchemaFromDomainState), []);
  const fetchedDataJzodSchema: RecordOfJzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    selectorFetchQueryJzodSchemaFromDomainState(state, fetchedDataJzodSchemaParams)
  );

  console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "fetchedDataJzodSchema", fetchedDataJzodSchema);
  console.log('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <div>RootReportSectionView rendered {count}</div>
        <ReportSectionView
          fetchedData={fetchedData}
          reportSection={props.reportSection?.section}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
        />
      </div>
    );
  } else {
    return (
      <>
        RootReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
