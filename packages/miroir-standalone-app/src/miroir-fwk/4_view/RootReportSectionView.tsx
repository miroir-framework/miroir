import { useMemo } from 'react';

import {
  ApplicationSection,
  DomainFetchQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  FetchedData,
  RecordOfJzodElement,
  RootReportSection,
  Uuid,
  selectFetchQueryJzodSchemaFromDomainState,
  selectFetchedDataFromDomainState
} from "miroir-core";



import { useDomainStateSelector } from './ReduxHooks';
import { ReportSectionView } from './ReportSectionView';
import { Params, useParams } from 'react-router-dom';
import { ReportUrlParamKeys } from './routes/ReportPage';

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
  const params:Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();

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

  const fetchedDataEntriesParams: DomainFetchQueryParams = useMemo(() => (
    {
      type: "DomainManyQueries",
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection,
      pageParams: params,
      select: props.reportSection?.fetchData?.select ?? {},
      combine: props.reportSection?.fetchData?.combine ?? { a: "", b: "" }
    }
  ), [props.deploymentUuid, props.applicationSection, props.reportSection?.fetchData]);

  const fetchedData: FetchedData | undefined = useDomainStateSelector(selectFetchedDataFromDomainState, fetchedDataEntriesParams);

  // const fetchedDataJzodSchemaParams: DomainModelGetFetchParamJzodSchemaQueryParams = useMemo(()=>({
  //     type: "getFetchParamsJzodSchema",
  //     fetchedData: {},
  //     pageParams: {
  //       applicationSection: props.applicationSection,
  //       deploymentUuid: props.deploymentUuid,
  //       instanceUuid: props.instanceUuid,
  //     },
  //     fetchParams: fetchedDataEntriesParams,
  // }),[fetchedDataEntriesParams])

  // const fetchedDataJzodSchema: RecordOfJzodElement | undefined = useDomainStateSelector(selectFetchQueryJzodSchemaFromDomainState, fetchedDataJzodSchemaParams);

  // console.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "fetchedDataJzodSchema", fetchedDataJzodSchema);
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
