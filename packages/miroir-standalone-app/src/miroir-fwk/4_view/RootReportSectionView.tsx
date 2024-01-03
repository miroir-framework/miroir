import { useMemo } from 'react';
import { Params, useParams } from 'react-router-dom';

import {
  ApplicationSection,
  DomainManyQueriesParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  FetchedData,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  RootReportSection,
  Uuid,
  getLoggerName,
  selectFetchQueryJzodSchemaFromDomainState,
  selectByDomainManyQueriesFromDomainState
} from "miroir-core";



import { useDomainStateSelector } from './ReduxHooks';
import { ReportSectionView } from './ReportSectionView';
import { ReportUrlParamKeys } from './routes/ReportPage';

import { packageName } from '../../constants';
import { cleanLevel } from './constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"RootReportSectionView");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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

  log.log("########################## RootReportSectionView", count, "ReportSection", props.reportSection);

  // const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];
  log.log(
    "RootReportSectionView",
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "fetchData",
    props.reportSection?.fetchData
  );

  const domainFetchQueryParams: DomainManyQueriesParams = useMemo(() => (
    {
      queryType: "DomainManyQueries",
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection,
      pageParams: params,
      select: props.reportSection?.fetchData?.select ?? {},
      combine: props.reportSection?.fetchData?.combine ?? { queryType: "combineQuery", a:"", b: "" }
    }
  ), [props.deploymentUuid, props.applicationSection, props.reportSection?.fetchData]);

  const fetchedData: FetchedData | undefined = useDomainStateSelector(selectByDomainManyQueriesFromDomainState, domainFetchQueryParams);

  const fetchedDataJzodSchemaParams: DomainModelGetFetchParamJzodSchemaQueryParams = useMemo(()=>({
    queryType: "getFetchParamsJzodSchema",
    fetchedData: {},
    pageParams: {
      applicationSection: props.applicationSection,
      deploymentUuid: props.deploymentUuid,
      instanceUuid: props.instanceUuid,
    },
    fetchParams: domainFetchQueryParams,
  }),[domainFetchQueryParams])

  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDomainStateSelector(selectFetchQueryJzodSchemaFromDomainState, fetchedDataJzodSchemaParams);

  log.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData, "fetchedDataJzodSchema", fetchedDataJzodSchema);
  // log.log("RootReportSectionView props.reportSection?.fetchData",props.reportSection?.fetchData,"fetchedData", fetchedData);
  log.log('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <div>RootReportSectionView rendered {count}</div>
        <ReportSectionView
          fetchedData={fetchedData}
          fetchedDataJzodSchema={fetchedDataJzodSchema}
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
