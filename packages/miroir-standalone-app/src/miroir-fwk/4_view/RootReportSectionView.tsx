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

  const paramsAsdomainElements: DomainElementObject = useMemo(
    () => ({
      elementType: "object",
      elementValue: Object.fromEntries(
        Object.entries(params).map((e) => [e[0], { elementType: "string", elementValue: e[1] ?? "" }])
      ),
    }),
    [params]
  );
  log.info("########################## RootReportSectionView", count, "ReportSection", JSON.stringify(props.reportSection, null, 2));

  log.info(
    "deploymentUuid",
    props.deploymentUuid,
    props.applicationSection,
    "paramsAsdomainElements",
    paramsAsdomainElements,
    "fetchQuery",
    props.reportSection.fetchQuery
  );
  
  const selectorMap: DomainStateSelectorMap<MiroirSelectorQueryParams> = useMemo(
    () => getSelectorMap(),
    []
  )

  // const domainFetchQueryParams: DomainStateSelectorParams<DomainManyQueriesWithDeploymentUuid> = useMemo(() => getSelectorParams(
  const domainFetchQueryParams: DomainStateSelectorParams<DomainManyQueriesWithDeploymentUuid> = useMemo(
    () =>
      getSelectorParams<DomainManyQueriesWithDeploymentUuid>(
        {
          queryType: "DomainManyQueries",
          deploymentUuid: props.deploymentUuid,
          // applicationSection: props.applicationSection,
          pageParams: paramsAsdomainElements,
          queryParams: { elementType: "object", elementValue: {} },
          contextResults: { elementType: "object", elementValue: {} },
          fetchQuery: props.reportSection.fetchQuery,
        },
        selectorMap
      ),
    [selectorMap, props.deploymentUuid, props.applicationSection, props.reportSection?.fetchQuery]
  );

  log.info(
    "-------------------------------------------------- props.reportSection",
    props.reportSection,
    "props.reportSection?.fetchQuery",
    props.reportSection?.fetchQuery,
  )

  const domainElementObject: DomainElementObject = useDomainStateSelectorNew(
    selectorMap.selectByDomainManyQueriesFromDomainState,
    domainFetchQueryParams
  );

  log.info(
    "-------------------------------------------------- props.reportSection",
    "domainElementObject",
    domainElementObject,
    // "fetchedDataJzodSchema",
    // fetchedDataJzodSchema
  );

  const jzodSchemaSelectorMap: DomainStateJzodSchemaSelectorMap = useMemo(
    () => getJzodSchemaSelectorMap(),
    []
  )

  const fetchedDataJzodSchemaParams: DomainStateJzodSchemaSelectorParams<DomainModelGetFetchParamJzodSchemaQueryParams> =
    useMemo(
      () => ({
        selectorMap: jzodSchemaSelectorMap,
        query: {
          queryType: "getFetchParamsJzodSchema",
          pageParams: {
            elementType: "object",
            elementValue: {
              applicationSection: { elementType: "string", elementValue: props.applicationSection ?? "data" },
              deploymentUuid: { elementType: "string", elementValue: props.deploymentUuid ?? "" },
              instanceUuid: { elementType: "string", elementValue: props.instanceUuid ?? "" },
            },
          },
          queryParams: { elementType: "object", elementValue: {} },
          contextResults: { elementType: "object", elementValue: {} },
          fetchParams: domainFetchQueryParams.query,
        },
      }),
      [jzodSchemaSelectorMap]
    )
  ;

  // const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDomainStateSelectorNew(
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDomainStateJzodSchemaSelector(
    selectFetchQueryJzodSchemaFromDomainStateNew,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info(
    "RootReportSectionView props.reportSection?.fetchQuery",
    props.reportSection?.fetchQuery,
    "domainElementObject",
    domainElementObject,
    "fetchedDataJzodSchema",
    fetchedDataJzodSchema
  );
  log.info('RootReportSectionView props.reportSection',props.reportSection);

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
    if (domainElementObject.elementType == "object") {
      const queryFailures = Object.entries(domainElementObject.elementValue).filter((e) => e[1].elementType == "failure")
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
          domainElementObject={domainElementObject}
          fetchedDataJzodSchema={fetchedDataJzodSchema}
          reportSection={props.reportSection?.section}
          applicationSection={props.applicationSection}
          deploymentUuid={props.deploymentUuid}
          paramsAsdomainElements={paramsAsdomainElements}
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
