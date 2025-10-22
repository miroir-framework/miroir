import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  Domain2QueryReturnType,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid,
  type Report
} from "miroir-core";



import { useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';

import {
  getMemoizedReduxDeploymentsStateSelectorMap
} from "miroir-localcache-redux";
import { packageName, ReportUrlParamKeys } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportHooks"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface ReportViewProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid, // TODO: remove, this is specific to entity instance views
  pageParams: Params<ReportUrlParamKeys>,
  // reportDefinition: RootReport,
  reportDefinition: Report,
  storedQueryData?: any,
  // reportDefinition: Query,
  showPerformanceDisplay?: boolean;
}

// ###############################################################################################################
export function useQueryTemplateResults(
  props: ReportViewProps,
  queryOrQueryTemplate?:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
): Domain2QueryReturnType<{
  reportData: Domain2QueryReturnType<Record<string, any>>;
  resolvedQuery: BoxedQueryWithExtractorCombinerTransformer;
}> {
  // getting deployment entity state selector map
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);
  const isQueryTemplate = queryOrQueryTemplate
    ? !(queryOrQueryTemplate as BoxedQueryWithExtractorCombinerTransformer).extractors
    : true;
  log.info(
    "################################################################### useQueryTemplateResults isQueryTemplate",
    isQueryTemplate,
    queryOrQueryTemplate
  );
  const queryTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer | undefined =
    queryOrQueryTemplate && isQueryTemplate
      ? (queryOrQueryTemplate as BoxedQueryTemplateWithExtractorCombinerTransformer)
      : undefined;
  log.info("useQueryTemplateResults queryTemplate", queryTemplate);
  const query: BoxedQueryWithExtractorCombinerTransformer | undefined =
    queryOrQueryTemplate && !isQueryTemplate
      ? (queryOrQueryTemplate as BoxedQueryWithExtractorCombinerTransformer)
      : undefined;
  log.info("useQueryTemplateResults  query", query);
  // fetching report definition

  const resolvedTemplateQuery: BoxedQueryWithExtractorCombinerTransformer | undefined = useMemo(
    () =>
      queryTemplate
        ? resolveQueryTemplateWithExtractorCombinerTransformer(
            // deploymentEntityStateFetchQueryTemplate,
            queryTemplate,
            defaultMiroirModelEnvironment // TODO: use correct model environment
          )
        : undefined,
    // [deploymentEntityStateFetchQueryTemplate]
    [queryTemplate]
  );

  log.info("useQueryTemplateResults resolvedQuery", resolvedTemplateQuery);
  // log.info(
  //   "################################################################ useQueryTemplateResults resolved query Template DONE"
  // );
  // fetching report data
  const reportDataQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(
    () =>
      props.pageParams.deploymentUuid &&
      props.pageParams.applicationSection &&
      props.pageParams.reportUuid &&
      (query || resolvedTemplateQuery)
        ? ((resolvedTemplateQuery ?? query) as BoxedQueryWithExtractorCombinerTransformer)
        : // ?? {
          //     queryType: "boxedQueryWithExtractorCombinerTransformer",
          //     deploymentUuid: props.pageParams.deploymentUuid,
          //     pageParams: props.pageParams,
          //     queryParams: {},
          //     contextResults: {},
          //     extractors: props.reportDefinition.extractors,
          //     combiners: props.reportDefinition.combiners,
          //     runtimeTransformers: props.reportDefinition.runtimeTransformers,
          //   }
          // : resolvedTemplateQuery
          {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            deploymentUuid: "",
            pageParams: props.pageParams,
            queryParams: {},
            contextResults: {},
            extractors: {},
          },
    [props.reportDefinition, props.pageParams, resolvedTemplateQuery]
  );

  log.info("useQueryTemplateResults reportDataQuery", reportDataQuery);
  const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> =
    useMemo(
      () =>
        getQueryRunnerParamsForReduxDeploymentsState(
          reportDataQuery,
          deploymentEntityStateSelectorMap
        ),
      [deploymentEntityStateSelectorMap, reportDataQuery]
    );

  log.info(
    "useQueryTemplateResults deploymentEntityStateFetchQueryParams",
    deploymentEntityStateFetchQueryParams
  );

  log.info("reportDataQuery", reportDataQuery);
  const reportData: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> =
    useReduxDeploymentsStateQuerySelector(
      deploymentEntityStateSelectorMap.runQuery,
      deploymentEntityStateFetchQueryParams
    );
  log.info("useQueryTemplateResults reportData", reportData);
  // return [reportData, reportDataQuery];
  return {reportData, resolvedQuery: reportDataQuery};
};
