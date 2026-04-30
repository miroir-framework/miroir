import { useMemo, useRef } from 'react';
import { Params } from 'react-router-dom';

import {
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  entityRunner,
  entityTransformerDefinition,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MiroirLoggerFactory,
  noValue,
  ReduxDeploymentsState,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
  Uuid,
  type ApplicationDeploymentMap,
  type MetaModel,
  type Query,
  type Report,
  type Runner
} from "miroir-core";
import {
  deployment_Admin,
  adminSelfApplication,
  entityDeployment,
} from "miroir-test-app_deployment-admin";


import { useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';

import type { RunStoredQuery, TransformerDefinition } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import { packageName, ReportUrlParamKeys } from '../../../../constants.js';
import {
  getMemoizedReduxDeploymentsStateSelectorMap
} from "miroir-react";
import { cleanLevel } from '../../constants.js';

// Entity constants

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportHooks"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface ReportViewProps {
  applicationSection: ApplicationSection,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentUuid: Uuid,
  instanceUuid?: Uuid, // TODO: remove, this is specific to entity instance views
  pageParams: Params<ReportUrlParamKeys>,
  reportDefinition: Report,
  storedQueryData?: any,
  showPerformanceDisplay?: boolean;
}

// ###############################################################################################################
export const useStoredQueriesResults = (
    runStoredQueries: RunStoredQuery[] | undefined,
    currentModel: MetaModel,
    pageParams: Params<ReportUrlParamKeys>,
    application: Uuid,
    currentApplicationDeploymentMap: ApplicationDeploymentMap,
  ): Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > => {
    const availableStoredQueries = currentModel.storedQueries || [];
    log.info("ReportDisplay useStoredQueriesResults", { availableStoredQueries });
    const currentReportQueries: Uuid[] = (runStoredQueries ?? [])
      ?.filter((sq) => !!sq.storedQuery)
      .map((sq) => sq.storedQuery) as Uuid[];

    // log.info(
    //  "useStoredQueriesResults",
    //   "currentReportQueries",
    //   currentReportQueries,
    //   "availableStoredQueries",
    //   availableStoredQueries
    // );
    const currentStoredQueries: { definition: Query }[] = availableStoredQueries.filter(
      (q: any /* StoredQuery*/) => currentReportQueries.includes(q.uuid),
    ) as any;
    // log.info("currentStoredQueries", currentStoredQueries);

    const currentStoredQuery:
      | BoxedQueryWithExtractorCombinerTransformer
      | BoxedQueryTemplateWithExtractorCombinerTransformer
      | undefined = useMemo(() => {
      const result:
        | BoxedQueryWithExtractorCombinerTransformer
        | BoxedQueryTemplateWithExtractorCombinerTransformer
        | undefined =
        pageParams.deploymentUuid &&
        pageParams.applicationSection &&
        pageParams.reportUuid &&
        currentStoredQueries.length > 0
          ? {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
              application: application,
              pageParams: pageParams,
              queryParams: {},
              contextResults: {},
              extractorTemplates: currentStoredQueries[0].definition.extractorTemplates,
              combinerTemplates: currentStoredQueries[0].definition.combinerTemplates,
              runtimeTransformers: currentStoredQueries[0].definition.runtimeTransformers,
            }
          : undefined;
      log.info("ReportDisplay currentStoredQuery", result);
      return result;
    }, [application, currentStoredQueries, pageParams]);

    const currentStoredQueryResults: Domain2QueryReturnType<
      Domain2QueryReturnType<Record<string, any>>
    > = useQueryTemplateResults(pageParams, currentApplicationDeploymentMap, currentStoredQuery);
    return currentStoredQueryResults;
  };
// ###############################################################################################################
export function useQueryTemplateResults(
  pageParams: Record<string, any>,
  applicationDeploymentMap: ApplicationDeploymentMap,
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
  const queryTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer | undefined =
    queryOrQueryTemplate && isQueryTemplate
      ? (queryOrQueryTemplate as BoxedQueryTemplateWithExtractorCombinerTransformer)
      : undefined;
  // log.info("useQueryTemplateResults queryTemplate", queryTemplate);
  const query: BoxedQueryWithExtractorCombinerTransformer | undefined =
    queryOrQueryTemplate && !isQueryTemplate
      ? (queryOrQueryTemplate as BoxedQueryWithExtractorCombinerTransformer)
      : undefined;
  // log.info("useQueryTemplateResults  query", query);
  // log.info(
  //   "################################################################### useQueryTemplateResults isQueryTemplate",
  //   isQueryTemplate,
  //   "queryOrQueryTemplate",
  //   queryOrQueryTemplate,
  //   "queryTemplate",
  //   queryTemplate,
  //   "query",
  //   query,
  // );

  // fetching report definition
  const resolvedTemplateQuery: BoxedQueryWithExtractorCombinerTransformer | undefined = useMemo(
    () => {
      const result = queryTemplate
        ? resolveQueryTemplateWithExtractorCombinerTransformer(
            queryTemplate,
            defaultMiroirModelEnvironment // TODO: use correct model environment
          )
        : undefined;
      log.info("useQueryTemplateResults resolvedTemplateQuery", result);
      return result;
    },
    [queryTemplate]
  );

  // log.info(
  //   "################################################################### useQueryTemplateResults",
  //   '"' + (queryOrQueryTemplate as any)?.label + '"',
  //   "queryOrQueryTemplate",
  //   queryOrQueryTemplate,
  //   "isQueryTemplate",
  //   isQueryTemplate,
  //   "query",
  //   query,
  //   "queryTemplate",
  //   queryTemplate,
  //   "resolvedTemplateQuery",
  //   resolvedTemplateQuery
  // );
  // log.info(
  //   "################################################################ useQueryTemplateResults resolved query Template DONE"
  // );
  // fetching report data
  const reportDataQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(() => {
    const result: BoxedQueryWithExtractorCombinerTransformer =
      query || resolvedTemplateQuery
        ? ((query ?? resolvedTemplateQuery) as BoxedQueryWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            pageParams,
          };
    log.info("useQueryTemplateResults reportDataQuery", { result });
    return result;
  }, [pageParams, query, resolvedTemplateQuery]);

  // log.info("useQueryTemplateResults reportDataQuery", reportDataQuery);
  const deploymentEntityStateFetchQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> =
    useMemo(
      () =>
        getQueryRunnerParamsForReduxDeploymentsState(
          reportDataQuery,
          deploymentEntityStateSelectorMap
        ),
      [deploymentEntityStateSelectorMap, reportDataQuery]
    );

  const reportData: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> =
    useReduxDeploymentsStateQuerySelector(
      deploymentEntityStateSelectorMap.runQuery,
      deploymentEntityStateFetchQueryParams,
      applicationDeploymentMap
    );
  // log.info("useQueryTemplateResults reportData from stored Query", reportData);
  return {reportData, resolvedQuery: reportDataQuery};
};


// ################################################################################################
export function useDeploymentUuidFromApplicationUuid2(
  applicationUuid: Uuid | undefined,
  applicationDeploymentMap: ApplicationDeploymentMap
): Uuid {
  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined =
    applicationUuid && applicationUuid !== noValue.uuid
      ? ({
          queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
          application: adminSelfApplication.uuid,
          applicationDeploymentMap,
          deploymentUuid: deployment_Admin.uuid,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractorTemplates: {
            deployments: {
              label: "deployments of the application",
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: entityDeployment.uuid,
              parentName: entityDeployment.name,
              applicationSection: "data",
              filter: {
                attributeName: "selfApplication",
                value: applicationUuid,
              },
            },
          },
        } as BoxedQueryTemplateWithExtractorCombinerTransformer)
      : {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: "",
          extractors: {},
        };

  const deploymentUuidQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap, deploymentUuidQuery);

  if (deploymentUuidQueryResults instanceof Domain2ElementFailed) {
    // should never happen
    throw new Error(
      "Runner_DropEntity: failed to get report data: " +
        JSON.stringify(deploymentUuidQueryResults, null, 2)
    );
  }
  const { reportData: deploymentUuidQueryResultsData, resolvedQuery } = deploymentUuidQueryResults;

  const deploymentUuidFromApplicationUuid: Uuid =
    deploymentUuidQueryResultsData?.deployments &&
    deploymentUuidQueryResultsData?.deployments.length == 1
      ? deploymentUuidQueryResultsData?.deployments[0].uuid
      : "NOT_FOUND";

  return deploymentUuidFromApplicationUuid;
}

// ################################################################################################
export function useDeploymentUuidFromApplicationUuid(
  applicationUuid: Uuid | undefined,
  applicationDeploymentMap: ApplicationDeploymentMap
): Uuid {
  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      applicationUuid && applicationUuid !== noValue.uuid
        ? ({
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: deployment_Admin.uuid,
            application: adminSelfApplication.uuid,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractorTemplates: {
              deployments: {
                label: "deployments of the application",
                extractorOrCombinerType: "extractorInstancesByEntity",
                parentUuid: entityDeployment.uuid,
                parentName: entityDeployment.name,
                applicationSection: "data",
                filter: {
                  attributeName: "selfApplication",
                  value: applicationUuid,
                },
              },
            },
          } as BoxedQueryTemplateWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            deploymentUuid: "",
            extractors: {},
          },
    [applicationUuid]
  );

  const deploymentUuidQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap,deploymentUuidQuery);

  if (deploymentUuidQueryResults instanceof Domain2ElementFailed) {
    // should never happen
    throw new Error(
      "Runner_DropEntity: failed to get report data: " +
        JSON.stringify(deploymentUuidQueryResults, null, 2)
    );
  }
  const { reportData: deploymentUuidQueryResultsData, resolvedQuery } = deploymentUuidQueryResults;

  const deploymentUuidFromApplicationUuid: Uuid = useMemo(() => {
    return deploymentUuidQueryResultsData?.deployments &&
      deploymentUuidQueryResultsData?.deployments.length == 1
      ? deploymentUuidQueryResultsData?.deployments[0].uuid
      : "NOT_FOUND";
  }, [deploymentUuidQueryResultsData]);

  return deploymentUuidFromApplicationUuid;
}

// ################################################################################################
export function useTransformer(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentUuid: Uuid,
  transformerUuid: Uuid | undefined
): Domain2ElementFailed | TransformerDefinition | undefined {
  const transformerDefinitionApplicationSection = getApplicationSection(
    application,
    entityTransformerDefinition.uuid
  );

  const transformerQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      // formikContext.values[runnerName]?.application !== noValue.uuid &&
      deploymentUuid && deploymentUuid !== noValue.uuid
        ? ({
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            application,
            applicationDeploymentMap,
            deploymentUuid: deploymentUuid,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractorTemplates: {
              transformers: {
                label: "transformers of the given application",
                extractorOrCombinerType: "extractorInstancesByEntity",
                parentUuid: entityTransformerDefinition.uuid,
                parentName: entityTransformerDefinition.name,
                applicationSection: transformerDefinitionApplicationSection,
                filter: {
                  attributeName: "uuid",
                  value: transformerUuid
                  // value: {
                  //   transformerType: "mustacheStringTemplate",
                  //   interpolation: "build",
                  //   definition: `{{transformerEditor_transformer_selector.transformerUuid}}`,
                  // },
                },
              },
            },
          } as BoxedQueryTemplateWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            applicationDeploymentMap: {},
            deploymentUuid: "",
            extractors: {},
          },
    [deploymentUuid, transformerDefinitionApplicationSection]
  );

  const transformerQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap, transformerQuery);

  if (transformerQueryResults instanceof Domain2ElementFailed) {
    return transformerQueryResults;
  }
  const currentFetchedTransformerDefinition: TransformerDefinition | undefined = useMemo(() => {
    return transformerQueryResults?.reportData?.transformers &&
      transformerQueryResults?.reportData?.transformers.length == 1
      ? transformerQueryResults?.reportData?.transformers[0]
      : undefined;
  }, [transformerQueryResults]);

  return currentFetchedTransformerDefinition;
}

// ################################################################################################
export function useRunner(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  runnerUuid: Uuid | undefined
): Domain2QueryReturnType<Runner | undefined>  {
  const runnerApplicationSection = getApplicationSection(
    application,
    entityRunner.uuid
  );

  const runnerQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      application && application !== noValue.uuid
        ? ({
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application,
            extractors: {
              runners: {
                label: "runners of the given application",
                extractorOrCombinerType: "extractorByPrimaryKey",
                parentUuid: entityRunner.uuid,
                parentName: entityRunner.name,
                applicationSection: runnerApplicationSection,
                instanceUuid: runnerUuid
              },
            },
          } as BoxedQueryWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            extractors: {},
          },
    [application, runnerApplicationSection, runnerUuid]
  );

  log.info("useRunner runnerQuery", runnerQuery);
  const runnerQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap, runnerQuery);

  log.info("useRunner runnerQueryResults", runnerQueryResults);
  if (runnerQueryResults instanceof Domain2ElementFailed) {
    return runnerQueryResults;
  }
  const currentFetchedRunner: Runner | undefined = useMemo(() => {
    return runnerQueryResults?.reportData?.runners;
  }, [runnerQueryResults]);

  return currentFetchedRunner;
}