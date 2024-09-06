import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElementObject,
  ExtractorTemplateForRecordOfExtractors,
  DomainModelGetFetchParamJzodSchemaExtractor,
  ExtractorRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  LoggerInterface,
  MiroirLoggerFactory,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams,
  RecordOfJzodObject,
  RootReportSection,
  Uuid,
  getDeploymentEntityStateSelectorParams,
  getLoggerName,
  DomainElementObjectOrFailed
} from "miroir-core";



import { useDeploymentEntityStateJzodSchemaSelector, useDeploymentEntityStateQuerySelector } from '../ReduxHooks.js';
import { ReportSectionView } from './ReportSectionView.js';
import { ReportUrlParamKeys } from '../routes/ReportPage.js';

import { getMemoizedDeploymentEntityStateJzodSchemaSelectorMap, getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

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
  // log.info("########################## RootReportSectionView rendering", count, "props", JSON.stringify(props, null, 2));
  log.info("########################## RootReportSectionView rendering", count, "props", props);

  // log.info(
  //   "deploymentUuid",
  //   props.deploymentUuid,
  //   props.applicationSection,
  //   "paramsAsdomainElements",
  //   paramsAsdomainElements,
  //   "extractors",
  //   props.reportSection.extractors
  // );
  
  const deploymentEntityStateSelectorMap: SyncExtractorTemplateRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const deploymentEntityStateFetchQueryParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, DeploymentEntityState> = useMemo(
    () =>
      props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
        ? getDeploymentEntityStateSelectorParams<ExtractorTemplateForRecordOfExtractors>(
            {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: props.pageParams.deploymentUuid,
              // applicationSection: props.applicationSection,
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              extractors: props.rootReportSection.extractors,
              // combiners: props.rootReportSection.combiners,
              // runtimeTransformers: {...props.rootReportSection.combiners,...props.rootReportSection.runtimeTransformers},
              combiners: props.rootReportSection.combiners,
              runtimeTransformers: props.rootReportSection.runtimeTransformers,
            },
            deploymentEntityStateSelectorMap
          )
        : // dummy query
          getDeploymentEntityStateSelectorParams<ExtractorTemplateForRecordOfExtractors>(
            {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: "",
              pageParams: paramsAsdomainElements,
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              extractors: { },
            },
            deploymentEntityStateSelectorMap
          ),
    [deploymentEntityStateSelectorMap, props.pageParams, props.rootReportSection]
  );
  // // log.info(
  // //   "-------------------------------------------------- props.reportSection",
  // //   props.reportSection,
  // //   "props.reportSection?.extractors",
  // //   props.reportSection?.extractors,
  // // )

  const deploymentEntityStateQueryResults: DomainElementObjectOrFailed = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.extractWithManyExtractors,
    deploymentEntityStateFetchQueryParams
  );

  log.info("deploymentEntityStateQueryResults",deploymentEntityStateQueryResults)

  // log.info(
  //   "-------------------------------------------------- props.reportSection",
  //   "domainElementObject",
  //   domainElementObject,
  //   // "fetchedDataJzodSchema",
  //   // fetchedDataJzodSchema
  // );

  const jzodSchemaSelectorMap: ExtractorRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(),
    []
  )

  const fetchedDataJzodSchemaParams: ExtractorRunnerParamsForJzodSchema<
    DomainModelGetFetchParamJzodSchemaExtractor,
    DeploymentEntityState
  > = useMemo(
    () => ({
      extractorRunnerMap: jzodSchemaSelectorMap,
      query:
        props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
          ? {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: {
                elementType: "object",
                elementValue: {
                  applicationSection: { elementType: "string", elementValue: props.pageParams.applicationSection },
                  deploymentUuid: { elementType: "string", elementValue: props.pageParams.deploymentUuid },
                  instanceUuid: { elementType: "string", elementValue: props.pageParams.instanceUuid ?? "" },
                },
              },
              queryParams: { elementType: "object", elementValue: {} },
              contextResults: { elementType: "object", elementValue: {} },
              // fetchParams: deploymentEntityStateFetchQueryParams.query,
              fetchParams: deploymentEntityStateFetchQueryParams.extractor,
            }
          : // dummy query
            {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: "DUMMY",
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
                queryType: "extractorTemplateForRecordOfExtractors",
                deploymentUuid: "DUMMY",
                pageParams: paramsAsdomainElements,
                queryParams: { elementType: "object", elementValue: {} },
                contextResults: { elementType: "object", elementValue: {} },
                extractors: { },
              },
            },
    }),
    [jzodSchemaSelectorMap, props.pageParams, props.rootReportSection]
  )
  ;

  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDeploymentEntityStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info(
    "RootReportSectionView found",
    "fetchedDataJzodSchema",
    fetchedDataJzodSchema,
    "fetchedDataJzodSchemaParams",
    fetchedDataJzodSchemaParams,
    "props.reportSection?.extractors",
    props.rootReportSection?.extractors,
    "props.reportSection?.extractors",
    props.rootReportSection?.extractors,
    "props.reportSection?.combiners",
    props.rootReportSection?.combiners,
    "props.reportSection?.runtimeTransformers",
    props.rootReportSection?.runtimeTransformers,
    "props.deploymentEntityStateQueryResults",
    deploymentEntityStateQueryResults,
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
      const queryFailures = Object.entries(deploymentEntityStateQueryResults.elementValue).filter(
        (e) => e[1].elementType == "failure"
      );
      if (queryFailures.length > 0) {
        return (
          <div>
            found query failures! {JSON.stringify(queryFailures, null, 2)}
          </div>
        )        
      }
    }
    return (
      <>
      {
        deploymentEntityStateQueryResults.elementType == "failure"?
          <div>
            found query failure! {JSON.stringify(deploymentEntityStateQueryResults, null, 2)}
          </div>
        :
        <>
          {
            props.deploymentUuid?
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
                  extractorRunnerMap={deploymentEntityStateSelectorMap}
                />
              </div>
            :
            <div style={{color:"red"}}>no deployment found!</div>
          }
        </>
      }
      </>
    );
  } else {
    return (
      <>
        RootReportSection Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
