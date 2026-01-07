import { useMemo } from 'react';
import { Params } from 'react-router-dom';

import {
  adminAdminApplication,
  adminConfigurationDeploymentAdmin,
  adminSelfApplication,
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  entityDeployment,
  EntityInstance,
  entityRunner,
  entityTransformerDefinition,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
  Uuid,
  type ApplicationDeploymentMap,
  type Report,
  type Runner
} from "miroir-core";



import { useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';

import type { TransformerDefinition } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import {
  getMemoizedReduxDeploymentsStateSelectorMap
} from "miroir-localcache-redux";
import { packageName, ReportUrlParamKeys } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { noValue } from '../ValueObjectEditor/JzodElementEditorInterface.js';

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
  // reportDefinition: RootReport,
  reportDefinition: Report,
  storedQueryData?: any,
  // reportDefinition: Query,
  showPerformanceDisplay?: boolean;
}

// ###############################################################################################################
export function useQueryTemplateResults(
  props: Record<string, any>,
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
  // log.info(
  //   "################################################################### useQueryTemplateResults isQueryTemplate",
  //   isQueryTemplate,
  //   queryOrQueryTemplate
  // );
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

  // log.info("useQueryTemplateResults resolvedQuery", resolvedTemplateQuery);
  // log.info(
  //   "################################################################ useQueryTemplateResults resolved query Template DONE"
  // );
  // fetching report data
  const reportDataQuery: BoxedQueryWithExtractorCombinerTransformer = useMemo(
    () =>
      (query || resolvedTemplateQuery)
        ? ((resolvedTemplateQuery ?? query) as BoxedQueryWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            deploymentUuid: "",
            pageParams: props.pageParams,
            queryParams: {},
            contextResults: {},
            extractors: {},
          },
    [props?.pageParams, resolvedTemplateQuery]
  );

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

  // log.info(
  //   "useQueryTemplateResults deploymentEntityStateFetchQueryParams",
  //   deploymentEntityStateFetchQueryParams
  // );

  // log.info("reportDataQuery", reportDataQuery);
  const reportData: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> =
    useReduxDeploymentsStateQuerySelector(
      deploymentEntityStateSelectorMap.runQuery,
      deploymentEntityStateFetchQueryParams,
      applicationDeploymentMap
    );
  // log.info("useQueryTemplateResults reportData", reportData);
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
          deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractorTemplates: {
            deployments: {
              label: "deployments of the application",
              // extractorOrCombinerType: "extractorByEntityReturningObjectList",
              extractorTemplateType: "extractorTemplateForObjectListByEntity",
              parentUuid: entityDeployment.uuid,
              parentName: entityDeployment.name,
              applicationSection: "data",
              filter: {
                attributeName: "adminApplication",
                value: applicationUuid,
              },
            },
          },
        } as BoxedQueryTemplateWithExtractorCombinerTransformer)
      : {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: "",
          deploymentUuid: "",
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractors: {},
        };

  const deploymentUuidQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap, deploymentUuidQuery);

  if (deploymentUuidQueryResults instanceof Domain2ElementFailed) {
    // should never happen
    throw new Error(
      "DeleteEntityRunner: failed to get report data: " +
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
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            application: adminSelfApplication.uuid,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractorTemplates: {
              deployments: {
                label: "deployments of the application",
                extractorTemplateType: "extractorTemplateForObjectListByEntity",
                parentUuid: entityDeployment.uuid,
                parentName: entityDeployment.name,
                applicationSection: "data",
                filter: {
                  attributeName: "adminApplication",
                  value: applicationUuid,
                },
              },
            },
          } as BoxedQueryTemplateWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            deploymentUuid: "",
            pageParams: {},
            queryParams: {},
            contextResults: {},
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
      "DeleteEntityRunner: failed to get report data: " +
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
    deploymentUuid,
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
                extractorTemplateType: "extractorTemplateForObjectListByEntity",
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
            pageParams: {},
            queryParams: {},
            contextResults: {},
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
  deploymentUuid: Uuid,
  runnerUuid: Uuid | undefined
): Domain2QueryReturnType<Runner | undefined>  {
  const runnerApplicationSection = getApplicationSection(
    deploymentUuid,
    entityRunner.uuid
  );

  const runnerQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
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
              runners: {
                label: "runners of the given application",
                extractorTemplateType: "extractorTemplateForObjectListByEntity",
                parentUuid: entityRunner.uuid,
                parentName: entityRunner.name,
                applicationSection: runnerApplicationSection,
                filter: {
                  attributeName: "uuid",
                  value: runnerUuid
                },
              },
            },
          } as BoxedQueryTemplateWithExtractorCombinerTransformer)
        : {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: "",
            applicationDeploymentMap: {},
            deploymentUuid: "",
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractors: {},
          },
    [deploymentUuid, runnerApplicationSection, runnerUuid]
  );

  const runnerQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults({} as any, applicationDeploymentMap, runnerQuery);

  if (runnerQueryResults instanceof Domain2ElementFailed) {
    return runnerQueryResults;
  }
  const currentFetchedRunner: Runner | undefined = useMemo(() => {
    return runnerQueryResults?.reportData?.runners &&
      runnerQueryResults?.reportData?.runners.length == 1
      ? runnerQueryResults?.reportData?.runners[0]
      : undefined;
  }, [runnerQueryResults]);

  return currentFetchedRunner;
}