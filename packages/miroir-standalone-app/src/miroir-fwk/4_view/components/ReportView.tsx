import { useMemo, useEffect } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  DeploymentEntityState,
  Domain2QueryReturnType,
  ExtractorRunnerParamsForJzodSchema,
  getQueryRunnerParamsForDeploymentEntityState,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryByQuery2GetParamJzodSchema,
  QueryRunnerMapForJzodSchema,
  RecordOfJzodObject,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  RootReport,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid
} from "miroir-core";



import { useDeploymentEntityStateJzodSchemaSelector, useDeploymentEntityStateQuerySelector } from '../ReduxHooks.js';
import { ReportSectionView } from './ReportSectionView.js';
import { useDocumentOutlineContext } from './RootComponent.js';

import {
  getMemoizedDeploymentEntityStateJzodSchemaSelectorMap,
  getMemoizedDeploymentEntityStateSelectorMap,
} from "miroir-localcache-redux";
import { packageName, ReportUrlParamKeys } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { useRenderTracker } from '../tools/renderCountTracker.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportView")
).then((logger: LoggerInterface) => {log = logger});


export interface ReportViewProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid,
  pageParams: Params<ReportUrlParamKeys>,
  reportDefinition: RootReport,
}

/**
 * It role is to gather the data that must be displayed by the potentially many sections of the report.
 * 
 * @param props 
 * @returns 
 */
export const ReportView = (props: ReportViewProps) => {
  // Track render counts with centralized tracker
  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}-${props.pageParams.reportUuid}-${props.pageParams.instanceUuid}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportView", currentNavigationKey);

  // Get outline context and update data when query results change
  const outlineContext = useDocumentOutlineContext();

  const paramsAsdomainElements: Domain2QueryReturnType<Record<string,any>> = props.pageParams;
  // log.info("########################## ReportView rendering", count, "props", props);
  log.info("########################## ReportView rendering", "navigationCount", navigationCount, "totalCount", totalCount);

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

  // fetching report definition
  const deploymentEntityStateFetchQueryTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer = useMemo(
    () =>
      props.reportDefinition.extractorTemplates &&
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? {
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
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
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: "",
            pageParams: paramsAsdomainElements,
            queryParams: {},
            contextResults: {},
            extractorTemplates: {},
          },
    [props.pageParams, props.reportDefinition]
  );

  // log.info("deploymentEntityStateFetchQueryTemplateParams",deploymentEntityStateFetchQueryTemplateParams)

  // log.info("################################################################ resolving query Template");

  const resolvedTemplateQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(
    () =>
      resolveQueryTemplateWithExtractorCombinerTransformer(
        deploymentEntityStateFetchQueryTemplate
      ),
    [deploymentEntityStateFetchQueryTemplate]
  );

  // log.info("resolvedQuery", resolvedTemplateQuery);
  // log.info("################################################################ resolved query Template DONE");

  // fetching report data
  const usedQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(
    () =>
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid
        ? props.reportDefinition.extractors
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.pageParams.deploymentUuid,
              pageParams: props.pageParams,
              queryParams: {},
              contextResults: {},
              extractors: props.reportDefinition.extractors,
              combiners: props.reportDefinition.combiners,
              runtimeTransformers: props.reportDefinition.runtimeTransformers,
            }
          : resolvedTemplateQuery
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
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

  // log.info("deploymentEntityStateQueryTemplateResults",deploymentEntityStateQueryTemplateResults)

  // log.info("################################################################ Fecth NON-Template report data", usedQuery);

  const deploymentEntityStateQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useDeploymentEntityStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    deploymentEntityStateFetchQueryParams
  );

  // log.info("deploymentEntityStateQueryResults", deploymentEntityStateQueryResults);


  const jzodSchemaSelectorMap: QueryRunnerMapForJzodSchema<DeploymentEntityState> = useMemo(
    () => getMemoizedDeploymentEntityStateJzodSchemaSelectorMap(),
    []
  );

  // log.info("################################################################ Fecth NON-Template report schema");

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
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: "DUMMY",
                pageParams: paramsAsdomainElements,
                queryParams: {},
                contextResults: {},
                // extractorTemplates: {},
                extractors: {},
              } as BoxedQueryWithExtractorCombinerTransformer,
            },
    }),
    [jzodSchemaSelectorMap, props.pageParams, props.reportDefinition]
  );
  const fetchedDataJzodSchema: RecordOfJzodObject | undefined = useDeploymentEntityStateJzodSchemaSelector(
    jzodSchemaSelectorMap.extractFetchQueryJzodSchema,
    fetchedDataJzodSchemaParams
  ) as RecordOfJzodObject | undefined; // TODO: use correct return type

  // log.info(
  //   "ReportView found",
  //   "fetchedDataJzodSchema",
  //   fetchedDataJzodSchema,
  //   "fetchedDataJzodSchemaParams",
  //   fetchedDataJzodSchemaParams,
  //   "props.reportSection?.extractorTemplates",
  //   props.reportDefinition?.extractorTemplates,
  //   "props.reportSection?.combinerTemplates",
  //   props.reportDefinition?.combinerTemplates,
  //   "props.reportSection?.runtimeTransformers",
  //   props.reportDefinition?.runtimeTransformers,
  //   "deploymentEntityStateQueryResults",
  //   deploymentEntityStateQueryResults,
  // );
  // log.info("ReportView props.reportSection", props.reportDefinition);

  const outlineElement = useMemo(() => {
    if (
      deploymentEntityStateQueryResults &&
      deploymentEntityStateQueryResults.elementType !== "failure"
    ) {
      if (Object.keys(deploymentEntityStateQueryResults).length > 0) {
        // throw new Error(
        //   "ReportView: No data found for the given query parameters: " +
        //     JSON.stringify(deploymentEntityStateQueryResults)
        // );
        const reportRootAttribute = (deploymentEntityStateQueryResults as any)[
          Object.keys(deploymentEntityStateQueryResults)[0]
        ];
    
        const outlineElement = {
          [reportRootAttribute.name ?? Object.keys(deploymentEntityStateQueryResults)[0]]:
            reportRootAttribute,
        }
        // outlineContext.setOutlineData(outlineElement);
        return outlineElement;
      }
      // outlineContext.setOutlineData(deploymentEntityStateQueryResults);
    }
  }, [deploymentEntityStateQueryResults]);
  // Update outline data when query results change
  useEffect(() => {
    if (outlineElement) {
      outlineContext.setOutlineData(outlineElement);
    }
  }, [outlineElement, outlineContext]);

  if (props.applicationSection) {
    return (
      <>
        {
          deploymentEntityStateQueryResults.elementType == "failure" ? (
            <div>found query failure! {JSON.stringify(deploymentEntityStateQueryResults, null, 2)}</div>
          ) : (
            <>
              {props.deploymentUuid ? (
                <div>
                  <div>ReportView renders: {navigationCount} (total: {totalCount})</div>
                  <ReportSectionView
                    queryResults={deploymentEntityStateQueryResults}
                    fetchedDataJzodSchema={fetchedDataJzodSchema}
                    reportSection={props.reportDefinition?.section}
                    rootReport={props.reportDefinition}
                    applicationSection={props.applicationSection}
                    deploymentUuid={props.deploymentUuid}
                    paramsAsdomainElements={paramsAsdomainElements}
                    // Pass outline state down from context
                    isOutlineOpen={outlineContext.isOutlineOpen}
                    onToggleOutline={outlineContext.onToggleOutline}
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
