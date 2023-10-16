import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationSection,
  FetchedData,
  MiroirSelectQuery,
  DomainFetchQueryParams,
  LocalCacheQueryParams,
  RootReportSection,
  SelectObjectListQuery,
  Uuid,
  selectFetchedDataFromDomainState,
  selectFetchedDataJzodSchemaFromDomainState
} from "miroir-core";
import { ReduxStateWithUndoRedo, applyDomainStateSelector } from "miroir-redux";



import { ReportSectionView } from './ReportSectionView';
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


  const initFetchedData = useMemo(()=>({
    // applicationSection: props.applicationSection,
    // deploymentUuid: props.deploymentUuid,
    // instanceUuid: props.instanceUuid,
  }),[])
  const pageParams = useMemo(()=>({
    applicationSection: props.applicationSection,
    deploymentUuid: props.deploymentUuid,
    instanceUuid: props.instanceUuid,
  }),[props])

  const fetchedData: FetchedData | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectFetchedDataFromDomainState)(state, pageParams, initFetchedData, fetchedDataEntriesParams)
  );

  const fetchedDataJzodSchema: JzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    applyDomainStateSelector(selectFetchedDataJzodSchemaFromDomainState)(state, pageParams, initFetchedData, fetchedDataEntriesParams)
  );
  
  console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData);
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
