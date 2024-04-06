import { useMemo } from 'react';
import { Params, useParams } from 'react-router-dom';

import {
  ApplicationSection,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainStateJzodSchemaSelectorMap,
  DomainStateJzodSchemaSelectorParams,
  DomainStateSelectorMap,
  DomainStateSelectorNew,
  DomainStateSelectorParams,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  RecordOfJzodObject,
  RootReportSection,
  Uuid,
  getJzodSchemaSelectorMap,
  getLoggerName,
  getSelectorMap,
  getSelectorParams,
  selectFetchQueryJzodSchemaFromDomainStateNew
} from "miroir-core";



import { useDomainStateJzodSchemaSelector, useDomainStateSelectorNew } from './ReduxHooks';
import { ReportSectionView } from './ReportSectionView';
import { ReportUrlParamKeys } from './routes/ReportPage';

import { packageName } from '../../constants';
import { cleanLevel } from './constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"RootReportSectionView");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface RootReportSectionEntityInstanceProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid,
  pageParams: Params<ReportUrlParamKeys>,
  rootReportSection: RootReportSection,
}

let count = 0
// ###############################################################################################################
/**
 * It role is to gather the data that must be displayed by the potentially many sections of the report.
 * 
 * @param props 
 * @returns 
 */
export const RootReportSectionView = (props: RootReportSectionEntityInstanceProps) => {
  count++;

  const paramsAsdomainElements: DomainElementObject = useMemo(
  () => ({
  elementType: "object",
  elementValue: Object.fromEntries(
  Object.entries(props.pageParams).map((e) => [e[0], { elementType: "string", elementValue: e[1] ?? "" }])
  ),
  }),
  [props.pageParams]
  );
  log.info("########################## RootReportSectionView", count, "ReportSection", JSON.stringify(props.rootReportSection, null, 2));

  // log.info(
  //   "deploymentUuid",
  //   props.deploymentUuid,
  //   props.applicationSection,
  //   "paramsAsdomainElements",
  //   paramsAsdomainElements,
  //   "fetchQuery",
  //   props.reportSection.fetchQuery
  // );
  
  const selectorMap: DomainStateSelectorMap<MiroirSelectorQueryParams> = useMemo(
  () => getSelectorMap(),
  []
  )

  const domainFetchQueryParams: DomainStateSelectorParams<DomainManyQueriesWithDeploymentUuid> = useMemo(
    () =>
      props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
        ? getSelectorParams<DomainManyQueriesWithDeploymentUuid>(
            {
              queryType: "DomainManyQueries",
              deploymentUuid: props.pageParams.deploymentUuid,
              // applicationSection: props.applicationSection,
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              fetchQuery: props.rootReportSection.fetchQuery,
            },
            selectorMap
          )
        : // dummy query
          getSelectorParams<DomainManyQueriesWithDeploymentUuid>(
            {
              queryType: "DomainManyQueries",
              deploymentUuid: "",
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              fetchQuery: { select: {} },
            },
            selectorMap
          ),
    [selectorMap, props.pageParams, props.rootReportSection]
  );

  // // log.info(
  // //   "-------------------------------------------------- props.reportSection",
  // //   props.reportSection,
  // //   "props.reportSection?.fetchQuery",
  // //   props.reportSection?.fetchQuery,
  // // )

  const queryResults: DomainElementObject = useDomainStateSelectorNew(
  selectorMap.selectByDomainManyQueriesFromDomainState,
  domainFetchQueryParams
  );

  // log.info(
  //   "-------------------------------------------------- props.reportSection",
  //   "domainElementObject",
  //   domainElementObject,
  //   // "fetchedDataJzodSchema",
  //   // fetchedDataJzodSchema
  // );

  const jzodSchemaSelectorMap: DomainStateJzodSchemaSelectorMap = useMemo(
    () => getJzodSchemaSelectorMap(),
    []
  )

  const fetchedDataJzodSchemaParams: DomainStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams> =
    useMemo(
      () => ({
        selectorMap: jzodSchemaSelectorMap,
        query: props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
        ? {
          queryType: "getFetchParamsJzodSchema",
          pageParams: {
            elementType: "object",
            elementValue: {
              applicationSection: { elementType: "string", elementValue: props.pageParams.applicationSection},
              deploymentUuid: { elementType: "string", elementValue: props.pageParams.deploymentUuid },
              instanceUuid: { elementType: "string", elementValue: props.pageParams.instanceUuid ?? "" },
            },
          },
          queryParams: { elementType: "object", elementValue: {} },
          contextResults: { elementType: "object", elementValue: {} },
          fetchParams: domainFetchQueryParams.query,
        }
        : // dummy query
        {
          queryType: "getFetchParamsJzodSchema",
          pageParams: {
            elementType: "object",
            elementValue: {
              applicationSection: { elementType: "string", elementValue: "data" },
              deploymentUuid: { elementType: "string", elementValue: "" },
              instanceUuid: { elementType: "string", elementValue: "" },
            },
          },
          queryParams: { elementType: "object", elementValue: {} },
          contextResults: { elementType: "object", elementValue: {} },
          fetchParams: {
            queryType: "DomainManyQueries",
            deploymentUuid: "",
            pageParams: paramsAsdomainElements,
            queryParams: { elementType: "object", elementValue: {} },
            contextResults: { elementType: "object", elementValue: {} },
            fetchQuery: { select: {} },
          },
        },
      }),
      [jzodSchemaSelectorMap, props.pageParams, props.rootReportSection]
    )
  ;

  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDomainStateJzodSchemaSelector(
    selectFetchQueryJzodSchemaFromDomainStateNew,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info(
    "RootReportSectionView props.reportSection?.fetchQuery",
    props.rootReportSection?.fetchQuery,
    "props.queryResults",
    queryResults,
    "fetchedDataJzodSchema",
    fetchedDataJzodSchema
  );
  log.info('RootReportSectionView props.reportSection',props.rootReportSection);

  if (props.applicationSection) {
    {/* <div>
      <div>
        deploymentUuid:
        {props.deploymentUuid}
      </div>
      <div>
        section: 
        {props.applicationSection}
      </div>
      <div>
        application:
        {props.applicationSection}
      </div>
    </div> */}
    if (queryResults.elementType == "object") {
      const queryFailures = Object.entries(queryResults.elementValue).filter((e) => e[1].elementType == "failure")
      if (queryFailures.length > 0) {
        return (
          <div>
            found query failures! {JSON.stringify(queryFailures, null, 2)}
          </div>
        )        
      }
    }
    return (
      <div>
        <div>RootReportSectionView rendered {count}</div>
        <ReportSectionView
          queryResults={queryResults}
          fetchedDataJzodSchema={fetchedDataJzodSchema}
          reportSection={props.rootReportSection?.section}
          rootReportSection={props.rootReportSection}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          paramsAsdomainElements={paramsAsdomainElements}
          selectorMap={selectorMap}
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
