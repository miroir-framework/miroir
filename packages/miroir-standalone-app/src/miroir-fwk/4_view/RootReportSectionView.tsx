import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  DeploymentEntityStateQuerySelectorMap,
  DeploymentEntityStateQuerySelectorParams,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainStateJzodSchemaSelectorMap,
  DomainStateJzodSchemaSelectorParams,
  DomainStateQuerySelectorMap,
  DomainStateQuerySelectorParams,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  RecordOfJzodObject,
  RootReportSection,
  Uuid,
  getDeploymentEntityStateSelectorParams,
  getLoggerName,
  getSelectorParams,
  selectFetchQueryJzodSchemaFromDomainStateNew
} from "miroir-core";



import { useDeploymentEntityStateQuerySelector, useDomainStateJzodSchemaSelector, useDomainStateQuerySelector } from './ReduxHooks';
import { ReportSectionView } from './ReportSectionView';
import { ReportUrlParamKeys } from './routes/ReportPage';

import { getMemoizedDeploymentEntityStateSelectorMap, getMemoizedJzodSchemaSelectorMap, getMemoizedSelectorMap } from 'miroir-localcache-redux';
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
  
  const deploymentEntityStateSelectorMap: DeploymentEntityStateQuerySelectorMap<MiroirSelectorQueryParams> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const deploymentEntityStateFetchQueryParams: DeploymentEntityStateQuerySelectorParams<DomainManyQueriesWithDeploymentUuid> = useMemo(
    () =>
      props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
        ? getDeploymentEntityStateSelectorParams<DomainManyQueriesWithDeploymentUuid>(
            {
              queryType: "DomainManyQueries",
              deploymentUuid: props.pageParams.deploymentUuid,
              // applicationSection: props.applicationSection,
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              fetchQuery: props.rootReportSection.fetchQuery,
            },
            deploymentEntityStateSelectorMap
          )
        : // dummy query
          getDeploymentEntityStateSelectorParams<DomainManyQueriesWithDeploymentUuid>(
            {
              queryType: "DomainManyQueries",
              deploymentUuid: "",
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              fetchQuery: { select: {} },
            },
            deploymentEntityStateSelectorMap
          ),
    [deploymentEntityStateSelectorMap, props.pageParams, props.rootReportSection]
  );
  // // log.info(
  // //   "-------------------------------------------------- props.reportSection",
  // //   props.reportSection,
  // //   "props.reportSection?.fetchQuery",
  // //   props.reportSection?.fetchQuery,
  // // )

  const deploymentEntityStateQueryResults: DomainElementObject = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.selectByDomainManyQueriesFromDeploymentEntityState,
    deploymentEntityStateFetchQueryParams
  );

  log.info("deploymentEntityStateQueryResults",deploymentEntityStateQueryResults)

  // const queryResults: DomainElementObject = useDomainStateQuerySelector(
  //   selectorMap.selectByDomainManyQueriesFromDomainState,
  //   domainFetchQueryParams
  // );

  // log.info(
  //   "-------------------------------------------------- props.reportSection",
  //   "domainElementObject",
  //   domainElementObject,
  //   // "fetchedDataJzodSchema",
  //   // fetchedDataJzodSchema
  // );

  const jzodSchemaSelectorMap: DomainStateJzodSchemaSelectorMap = useMemo(
    () => getMemoizedJzodSchemaSelectorMap(),
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
          fetchParams: deploymentEntityStateFetchQueryParams.query,
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
    "props.deploymentEntityStateQueryResults",
    deploymentEntityStateQueryResults,
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
    if (deploymentEntityStateQueryResults.elementType == "object") {
      const queryFailures = Object.entries(deploymentEntityStateQueryResults.elementValue).filter((e) => e[1].elementType == "failure")
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
          queryResults={deploymentEntityStateQueryResults}
          fetchedDataJzodSchema={fetchedDataJzodSchema}
          reportSection={props.rootReportSection?.section}
          rootReportSection={props.rootReportSection}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          paramsAsdomainElements={paramsAsdomainElements}
          selectorMap={deploymentEntityStateSelectorMap}
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
