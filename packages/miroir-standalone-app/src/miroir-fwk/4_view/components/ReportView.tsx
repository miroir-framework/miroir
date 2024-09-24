import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElementObject,
  ExtractorTemplateForRecordOfExtractors,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  ExtractorTemplateRunnerMapForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  LoggerInterface,
  MiroirLoggerFactory,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams,
  RecordOfJzodObject,
  RootReport,
  Uuid,
  getDeploymentEntityStateSelectorTemplateParams,
  getLoggerName,
  DomainElementObjectOrFailed,
  getDeploymentEntityStateSelectorParams,
  ExtractorForRecordOfExtractors,
  SyncExtractorRunnerParams,
  SyncExtractorRunnerMap,
  ExtractorRunnerParamsForJzodSchema,
  DomainModelGetFetchParamJzodSchemaForExtractor,
  ExtractorRunnerMapForJzodSchema,
  resolveQueryTemplate,
  resolveExtractorTemplateForRecordOfExtractors
} from "miroir-core";



import { useDeploymentEntityStateJzodSchemaSelector, useDeploymentEntityStateJzodSchemaSelectorForTemplate, useDeploymentEntityStateQuerySelector, useDeploymentEntityStateQueryTemplateSelector } from '../ReduxHooks.js';
import { ReportSectionView } from './ReportSectionView.js';
import { ReportUrlParamKeys } from '../routes/ReportPage.js';

import { getMemoizedDeploymentEntityStateJzodSchemaSelectorMap, getMemoizedDeploymentEntityStateJzodSchemaSelectorTemplateMap, getMemoizedDeploymentEntityStateSelectorForTemplateMap, getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportView");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface ReportViewProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid,
  pageParams: Params<ReportUrlParamKeys>,
  reportDefinition: RootReport,
}

let count = 0
// ###############################################################################################################
/**
 * It role is to gather the data that must be displayed by the potentially many sections of the report.
 * 
 * @param props 
 * @returns 
 */
export const ReportView = (props: ReportViewProps) => {
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
  // log.info("########################## ReportView rendering", count, "props", JSON.stringify(props, null, 2));
  log.info("########################## ReportView rendering", count, "props", props);

  // log.info(
  //   "deploymentUuid",
  //   props.deploymentUuid,
  //   props.applicationSection,
  //   "paramsAsdomainElements",
  //   paramsAsdomainElements,
  //   "extractors",
  //   props.reportSection.extractors
  // );
  
  const deploymentEntityStateSelectorTemplateMap: SyncExtractorTemplateRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorForTemplateMap(),
    []
  )
  const deploymentEntityStateSelectorMap: SyncExtractorRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  )

  const deploymentEntityStateFetchQueryTemplateParams: SyncExtractorTemplateRunnerParams<
    ExtractorTemplateForRecordOfExtractors,
    DeploymentEntityState
  > = useMemo(
    () =>
      props.reportDefinition.extractorTemplates &&
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? getDeploymentEntityStateSelectorTemplateParams<ExtractorTemplateForRecordOfExtractors>(
            {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractorTemplates: props.reportDefinition.extractorTemplates,
              combinerTemplates: props.reportDefinition.combinerTemplates,
              runtimeTransformers: props.reportDefinition.runtimeTransformers,
            },
            deploymentEntityStateSelectorTemplateMap
          )
        : // dummy query
          getDeploymentEntityStateSelectorTemplateParams<ExtractorTemplateForRecordOfExtractors>(
            {
              queryType: "extractorTemplateForRecordOfExtractors",
              deploymentUuid: "",
              pageParams: paramsAsdomainElements,
              queryParams: {},
              contextResults: {},
              extractorTemplates: {},
            },
            deploymentEntityStateSelectorTemplateMap
          ),
    [deploymentEntityStateSelectorTemplateMap, props.pageParams, props.reportDefinition]
  );

  log.info("deploymentEntityStateFetchQueryTemplateParams",deploymentEntityStateFetchQueryTemplateParams)

  log.info("################################################################ resolving query Template")

  const resolvedQuery = useMemo(
    () =>
      resolveExtractorTemplateForRecordOfExtractors(
        deploymentEntityStateFetchQueryTemplateParams.extractorTemplate,
      ),
    [deploymentEntityStateFetchQueryTemplateParams]
  );

  log.info("resolvedQuery",resolvedQuery)
  log.info("################################################################ resolved query Template DONE")

  const deploymentEntityStateFetchQueryParams: SyncExtractorRunnerParams<
    ExtractorForRecordOfExtractors,
    DeploymentEntityState
  > = useMemo(
    () =>
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
      ?
        props.reportDefinition.extractors
        ? getDeploymentEntityStateSelectorParams<ExtractorForRecordOfExtractors>(
            {
              queryType: "extractorForRecordOfExtractors",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: props.reportDefinition.extractors,
              // extractorTemplates: props.reportDefinition.extractorTemplates,
              combiners: props.reportDefinition.combiners,
              runtimeTransformers: props.reportDefinition.runtimeTransformers,
            },
            deploymentEntityStateSelectorMap
          )
        : // dummy query
          getDeploymentEntityStateSelectorParams<ExtractorForRecordOfExtractors>(
            {
              queryType: "extractorForRecordOfExtractors",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: resolvedQuery.extractors,
              // extractorTemplates: props.reportDefinition.extractorTemplates,
              combiners: resolvedQuery.combiners,
              runtimeTransformers: resolvedQuery.runtimeTransformers,
            },
            // {
            //   queryType: "extractorForRecordOfExtractors",
            //   deploymentUuid: "",
            //   pageParams: paramsAsdomainElements,
            //   queryParams: {},
            //   contextResults: {},
            //   extractors: {},
            // },
            deploymentEntityStateSelectorMap
          )
          :
          getDeploymentEntityStateSelectorParams<ExtractorForRecordOfExtractors>(
            {
              queryType: "extractorForRecordOfExtractors",
              deploymentUuid: "",
              pageParams: paramsAsdomainElements,
              queryParams: {},
              contextResults: {},
              extractors: {},
            },
            deploymentEntityStateSelectorMap
          ),
    [deploymentEntityStateSelectorMap, props.pageParams, props.reportDefinition]
  );
  // // log.info(
  // //   "-------------------------------------------------- props.reportSection",
  // //   props.reportSection,
  // //   "props.reportSection?.extractors",
  // //   props.reportSection?.extractors,
  // // )
  log.info("################################################################ Fecth Template report data")

  const deploymentEntityStateQueryTemplateResults: DomainElementObjectOrFailed = useDeploymentEntityStateQueryTemplateSelector(
    deploymentEntityStateSelectorTemplateMap.extractWithManyExtractorTemplates,
    deploymentEntityStateFetchQueryTemplateParams
  );

  log.info("deploymentEntityStateQueryTemplateResults",deploymentEntityStateQueryTemplateResults)

  log.info("################################################################ Fecth NON-Template report data")

  const deploymentEntityStateQueryResults: DomainElementObjectOrFailed = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.extractWithManyExtractors,
    deploymentEntityStateFetchQueryParams
  );

  log.info("deploymentEntityStateQueryResults",deploymentEntityStateQueryTemplateResults)

  // log.info(
  //   "-------------------------------------------------- props.reportSection",
  //   "domainElementObject",
  //   domainElementObject,
  //   // "fetchedDataJzodSchema",
  //   // fetchedDataJzodSchema
  // );

  const jzodSchemaSelectorTemplateMap: ExtractorTemplateRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateJzodSchemaSelectorTemplateMap(),
    []
  )
  const jzodSchemaSelectorMap: ExtractorRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(),
    []
  )

  log.info("################################################################ Fecth Template report schema")

  const fetchedDataJzodSchemaParamsForTemplate: ExtractorTemplateRunnerParamsForJzodSchema<
    DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
    DeploymentEntityState
  > = useMemo(
    () => ({
      extractorRunnerMap: jzodSchemaSelectorTemplateMap,
      query:
        props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid && props.reportDefinition.extractorTemplates
          ? {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: {
                applicationSection: props.pageParams.applicationSection ,
                deploymentUuid: props.pageParams.deploymentUuid,
                instanceUuid: props.pageParams.instanceUuid ?? "",
              // elementType: "object",
                // elementValue: {
                //   applicationSection: { elementType: "string", elementValue: props.pageParams.applicationSection },
                //   deploymentUuid: { elementType: "string", elementValue: props.pageParams.deploymentUuid },
                //   instanceUuid: { elementType: "string", elementValue: props.pageParams.instanceUuid ?? "" },
                // },
              },
              queryParams: {},
              contextResults: {},
              // fetchParams: deploymentEntityStateFetchQueryParams.query,
              fetchParams: deploymentEntityStateFetchQueryTemplateParams.extractorTemplate,
              // fetchParams: deploymentEntityStateFetchQueryParams.extractor,
            }
          : // dummy query
            {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: "DUMMY",
              pageParams: {
                // elementType: "object",
                // elementValue: {
                applicationSection: "data" ,
                deploymentUuid: "",
                instanceUuid: "",
                  // applicationSection: { elementType: "string", elementValue: "data" },
                  // deploymentUuid: { elementType: "string", elementValue: "" },
                  // instanceUuid: { elementType: "string", elementValue: "" },
                // },
              },
              queryParams: {},
              contextResults: {},
              fetchParams: {
                queryType: "extractorTemplateForRecordOfExtractors",
                deploymentUuid: "DUMMY",
                pageParams: paramsAsdomainElements,
                queryParams: {},
                contextResults: {},
                extractorTemplates: {},
              },
            },
    }),
    [jzodSchemaSelectorTemplateMap, props.pageParams, props.reportDefinition]
  )
  ;

  const fetchedDataJzodSchemaForTemplate: RecordOfJzodObject | undefined = useDeploymentEntityStateJzodSchemaSelectorForTemplate(
    jzodSchemaSelectorTemplateMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParamsForTemplate
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info("################################################################ Fecth NON-Template report schema")

  const fetchedDataJzodSchemaParams: ExtractorRunnerParamsForJzodSchema<
    DomainModelGetFetchParamJzodSchemaForExtractor,
    DeploymentEntityState
  > = useMemo(
    () => ({
      extractorRunnerMap: jzodSchemaSelectorMap,
      query:
        props.pageParams.deploymentUuid &&
        props.pageParams.applicationSection &&
        props.pageParams.reportUuid &&
        props.reportDefinition.extractors
          ? {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: {
                applicationSection: props.pageParams.applicationSection,
                deploymentUuid: props.pageParams.deploymentUuid,
                instanceUuid: props.pageParams.instanceUuid ?? "",
              },
              queryParams: {},
              contextResults: {},
              fetchParams: deploymentEntityStateFetchQueryParams.extractor,
            }
          : // dummy query
            {
              queryType: "getFetchParamsJzodSchema",
              deploymentUuid: "DUMMY",
              pageParams: {
                applicationSection: "data",
                deploymentUuid: "",
                instanceUuid: "",
              },
              queryParams: {},
              contextResults: {},
              fetchParams: {
                queryType: "extractorForRecordOfExtractors",
                deploymentUuid: "DUMMY",
                pageParams: paramsAsdomainElements,
                queryParams: {},
                contextResults: {},
                // extractorTemplates: {},
                extractors: {},
              } as ExtractorForRecordOfExtractors,
            },
    }),
    [jzodSchemaSelectorTemplateMap, props.pageParams, props.reportDefinition]
  );
  ;

  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDeploymentEntityStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info(
    "ReportView found",
    "fetchedDataJzodSchema",
    fetchedDataJzodSchemaForTemplate,
    "fetchedDataJzodSchemaParams",
    fetchedDataJzodSchemaParamsForTemplate,
    "props.reportSection?.extractorTemplates",
    props.reportDefinition?.extractorTemplates,
    "props.reportSection?.combinerTemplates",
    props.reportDefinition?.combinerTemplates,
    "props.reportSection?.runtimeTransformers",
    props.reportDefinition?.runtimeTransformers,
    "props.deploymentEntityStateQueryResults",
    deploymentEntityStateQueryTemplateResults,
  );
  log.info('ReportView props.reportSection',props.reportDefinition);

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
    // if (deploymentEntityStateQueryResults.elementType == "object") {
    //   const queryFailures = Object.entries(deploymentEntityStateQueryResults.elementValue).filter(
    //     (e) => e[1].elementType == "failure"
    //   );
    //   if (queryFailures.length > 0) {
    //     return (
    //       <div>
    //         found query failures! {JSON.stringify(queryFailures, null, 2)}
    //       </div>
    //     )        
    //   }
    // }
    return (
      <>
      {
        deploymentEntityStateQueryTemplateResults.elementType == "failure" ||
        deploymentEntityStateQueryResults.elementType == "failure"
        ?
          <div>
            found query failure! {JSON.stringify(deploymentEntityStateQueryTemplateResults, null, 2)}
          </div>
        :
        <>
          {
            props.deploymentUuid?
              <div>
                <div>ReportView rendered {count}</div>
                {/* {
                  props.reportDefinition.extractors? */}
                  <ReportSectionView
                    queryResults={deploymentEntityStateQueryResults}
                    fetchedDataJzodSchema={fetchedDataJzodSchema}
                    reportSection={props.reportDefinition?.section}
                    rootReport={props.reportDefinition}
                    applicationSection={props.applicationSection}
                    deploymentUuid={props.deploymentUuid}
                    paramsAsdomainElements={paramsAsdomainElements}
                    extractorTemplateRunnerMap={deploymentEntityStateSelectorTemplateMap}
                  />
                  {/* :
                  <ReportSectionView
                    queryResults={deploymentEntityStateQueryTemplateResults}
                    fetchedDataJzodSchema={fetchedDataJzodSchemaForTemplate}
                    reportSection={props.reportDefinition?.section}
                    rootReport={props.reportDefinition}
                    applicationSection={props.applicationSection}
                    deploymentUuid={props.deploymentUuid}
                    paramsAsdomainElements={paramsAsdomainElements}
                    extractorTemplateRunnerMap={deploymentEntityStateSelectorTemplateMap}
                  />
                } */}
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
        RootReport Invalid props! {JSON.stringify(props)}
      </>
    )
  }
};
