import { useMemo } from 'react';
import { Params, useParams } from 'react-router-dom';

import {
  ApplicationSection,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainElement,
  LoggerInterface,
  MiroirLoggerFactory,
  RecordOfJzodObject,
  RootReportSection,
  Uuid,
  getLoggerName,
  selectByDomainManyQueriesFromDomainState,
  selectFetchQueryJzodSchemaFromDomainState,
  DomainElementObject
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
  // domainElement: Record<string,any>,
  reportSection: RootReportSection,
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

  log.info("########################## RootReportSectionView", count, "ReportSection", props.reportSection);

  // const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];
  log.info(
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "fetchQuery",
    props.reportSection.fetchQuery
  );

  const domainFetchQueryParams: DomainManyQueriesWithDeploymentUuid = useMemo(() => (
    {
      queryType: "DomainManyQueries",
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection,
      pageParams: params,
      queryParams: {},
      contextResults: { elementType: "object", elementValue: {} },
      fetchQuery: props.reportSection.fetchQuery
    }
  ), [props.deploymentUuid, props.applicationSection, props.reportSection?.fetchQuery]);

  const domainElementObject: DomainElementObject = useDomainStateSelector(selectByDomainManyQueriesFromDomainState, domainFetchQueryParams);

  const fetchedDataJzodSchemaParams: DomainModelGetFetchParamJzodSchemaQueryParams = useMemo(()=>({
    queryType: "getFetchParamsJzodSchema",
    pageParams: {
      applicationSection: props.applicationSection,
      deploymentUuid: props.deploymentUuid,
      instanceUuid: props.instanceUuid,
    },
    queryParams: {},
    contextResults: { elementType: "object", elementValue: {} },
    fetchParams: domainFetchQueryParams,
  }),[domainFetchQueryParams])

  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDomainStateSelector(selectFetchQueryJzodSchemaFromDomainState, fetchedDataJzodSchemaParams);

  log.info(
    "RootReportSectionView props.reportSection?.fetchQuery",
    props.reportSection?.fetchQuery,
    "domainElement",
    domainElementObject,
    "fetchedDataJzodSchema",
    fetchedDataJzodSchema
  );
  log.info('RootReportSectionView props.reportSection',props.reportSection);

  if (props.applicationSection) {
    return (
      <div>
        <div>RootReportSectionView rendered {count}</div>
        <ReportSectionView
          domainElementObject={domainElementObject}
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
