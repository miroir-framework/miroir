import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElementObject,
  DomainElementObjectOrFailed,
  ExtractorRunnerParamsForJzodSchema,
  getLoggerName,
  getQueryRunnerParamsForDeploymentEntityState,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryByQuery2GetParamJzodSchema,
  QueryRunnerMapForJzodSchema,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  RecordOfJzodObject,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  RootReport,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid
} from "miroir-core";



import { useDeploymentEntityStateJzodSchemaSelector, useDeploymentEntityStateQuerySelector } from '../ReduxHooks.js';
import { ReportUrlParamKeys } from '../routes/ReportPage.js';
import { ReportSectionView } from './ReportSectionView.js';

import { getMemoizedDeploymentEntityStateJzodSchemaSelectorMap, getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
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

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateSelectorMap(),
    []
  );

  const deploymentEntityStateFetchQueryTemplate: QueryTemplateWithExtractorCombinerTransformer = useMemo(
    () =>
      props.reportDefinition.extractorTemplates &&
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? {
            queryType: "queryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: props.pageParams.deploymentUuid,
            pageParams: props.pageParams,
            queryParams: {},
            contextResults: {},
            extractorTemplates: props.reportDefinition.extractorTemplates,
            combinerTemplates: props.reportDefinition.combinerTemplates,
            runtimeTransformers: props.reportDefinition.runtimeTransformers,
          }
        : // dummy query
          {
            queryType: "queryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: "",
            pageParams: paramsAsdomainElements,
            queryParams: {},
            contextResults: {},
            extractorTemplates: {},
          },
    [props.pageParams, props.reportDefinition]
  );

  // log.info("deploymentEntityStateFetchQueryTemplateParams",deploymentEntityStateFetchQueryTemplateParams)

  log.info("################################################################ resolving query Template");

  const resolvedTemplateQuery: QueryWithExtractorCombinerTransformer = useMemo(
    () =>
      resolveQueryTemplateWithExtractorCombinerTransformer(
        deploymentEntityStateFetchQueryTemplate
      ),
    [deploymentEntityStateFetchQueryTemplate]
  );

  log.info("resolvedQuery", resolvedTemplateQuery);
  log.info("################################################################ resolved query Template DONE");

  const usedQuery: QueryWithExtractorCombinerTransformer = useMemo(
    () =>
    props.pageParams.deploymentUuid && props.pageParams.applicationSection && props.pageParams.reportUuid
      ? props.reportDefinition.extractors
        ? {
            queryType: "queryWithExtractorCombinerTransformer",
            deploymentUuid: props.pageParams.deploymentUuid,
            pageParams: props.pageParams,
            queryParams: {},
            contextResults: {},
            extractors: props.reportDefinition.extractors,
            // extractorTemplates: props.reportDefinition.extractorTemplates,
            combiners: props.reportDefinition.combiners,
            runtimeTransformers: props.reportDefinition.runtimeTransformers,
          }
        : resolvedTemplateQuery
      : {
          queryType: "queryWithExtractorCombinerTransformer",
          deploymentUuid: "",
          pageParams: paramsAsdomainElements,
          queryParams: {},
          contextResults: {},
          extractors: {},
        },
    [props.reportDefinition, props.pageParams, resolvedTemplateQuery]
  );
  resolvedTemplateQuery;
  const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<
    DeploymentEntityState
  > = useMemo(
    () =>
    getQueryRunnerParamsForDeploymentEntityState(
        usedQuery,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, usedQuery]
  );
  // // log.info(
  // //   "-------------------------------------------------- props.reportSection",
  // //   props.reportSection,
  // //   "props.reportSection?.extractors",
  // //   props.reportSection?.extractors,
  // // )
  // log.info("################################################################ Fecth Template report data")

  // log.info("deploymentEntityStateQueryTemplateResults",deploymentEntityStateQueryTemplateResults)

  log.info("################################################################ Fecth NON-Template report data", usedQuery);

  const deploymentEntityStateQueryResults: DomainElementObjectOrFailed = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    deploymentEntityStateFetchQueryParams
  );

  log.info("deploymentEntityStateQueryResults", deploymentEntityStateQueryResults);

  // log.info(
  //   "-------------------------------------------------- props.reportSection",
  //   "domainElementObject",
  //   domainElementObject,
  //   // "fetchedDataJzodSchema",
  //   // fetchedDataJzodSchema
  // );

  // const jzodSchemaSelectorTemplateMap: QueryTemplateRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
  //   () => getMemoizedDeploymentEntityStateJzodSchemaSelectorTemplateMap(),
  //   []
  // )
  const jzodSchemaSelectorMap: QueryRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(),
    []
  );

  // log.info("################################################################ Fecth Template report schema")


  log.info("################################################################ Fecth NON-Template report schema");

  const fetchedDataJzodSchemaParams: ExtractorRunnerParamsForJzodSchema<
    QueryByQuery2GetParamJzodSchema,
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
            queryType: "queryByTemplateGetParamJzodSchema",
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
              queryType: "queryByTemplateGetParamJzodSchema",
              deploymentUuid: "DUMMY",
              pageParams: {
                applicationSection: "data",
                deploymentUuid: "",
                instanceUuid: "",
              },
              queryParams: {},
              contextResults: {},
              fetchParams: {
                queryType: "queryWithExtractorCombinerTransformer",
                deploymentUuid: "DUMMY",
                pageParams: paramsAsdomainElements,
                queryParams: {},
                contextResults: {},
                // extractorTemplates: {},
                extractors: {},
              } as QueryWithExtractorCombinerTransformer,
            },
    }),
    [jzodSchemaSelectorMap, props.pageParams, props.reportDefinition]
  );
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDeploymentEntityStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  log.info(
    "ReportView found",
    "fetchedDataJzodSchema",
    fetchedDataJzodSchema,
    "fetchedDataJzodSchemaParams",
    fetchedDataJzodSchemaParams,
    "props.reportSection?.extractorTemplates",
    props.reportDefinition?.extractorTemplates,
    "props.reportSection?.combinerTemplates",
    props.reportDefinition?.combinerTemplates,
    "props.reportSection?.runtimeTransformers",
    props.reportDefinition?.runtimeTransformers,
    "deploymentEntityStateQueryResults",
    deploymentEntityStateQueryResults,
  );
  log.info("ReportView props.reportSection", props.reportDefinition);

  if (props.applicationSection) {
    {
      /* <div>
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
    </div> */
    }
    return (
      <>
        {
          deploymentEntityStateQueryResults.elementType == "failure" ? (
            <div>found query failure! {JSON.stringify(deploymentEntityStateQueryResults, null, 2)}</div>
          ) : (
            <>
              {props.deploymentUuid ? (
                <div>
                  <div>ReportView rendered {count}</div>
                  <ReportSectionView
                    queryResults={deploymentEntityStateQueryResults}
                    fetchedDataJzodSchema={fetchedDataJzodSchema}
                    reportSection={props.reportDefinition?.section}
                    rootReport={props.reportDefinition}
                    applicationSection={props.applicationSection}
                    deploymentUuid={props.deploymentUuid}
                    paramsAsdomainElements={paramsAsdomainElements}
                  />
                </div>
              ) : (
                <div style={{ color: "red" }}>no deployment found!</div>
              )}
            </>
          )
        }
      </>
    );
  } else {
    return <>RootReport Invalid props! {JSON.stringify(props)}</>;
  }
};
