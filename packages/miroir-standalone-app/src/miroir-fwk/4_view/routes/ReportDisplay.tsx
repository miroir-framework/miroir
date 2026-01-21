import {
  useMemo
} from "react";
import { Params } from "react-router-dom";

import {
  ApplicationSection,
  defaultReport,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type Query,
  type SelfApplicationDeploymentConfiguration,
  type Uuid
} from "miroir-core";
import {
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider.js";

import { ErrorBoundary } from "react-error-boundary";
import {
  deployments,
  packageName,
  ReportUrlParamKeys
} from "../../../constants.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { ErrorFallbackComponent } from "../components/ErrorFallbackComponent.js";
import { PerformanceDisplayContainer } from "../components/PerformanceDisplayContainer.js";
import { useQueryTemplateResults } from "../components/Reports/ReportHooks.js";
import { ReportViewWithEditor } from "../components/Reports/ReportViewWithEditor.js";
import { ThemedBox, ThemedOnScreenHelper, ThemedSpan } from "../components/Themes/index.js";
import { cleanLevel } from "../constants.js";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import { ThemedOnScreenDebug } from "../components/Themes/BasicComponents.js";
import { lab } from "d3";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportDisplay"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});




// ################################################################################################
// ReportDisplay Component
// ################################################################################################
export const ReportDisplay: React.FC<{
  pageParams: Params<ReportUrlParamKeys>;
  // context: ReturnType<typeof useMiroirContextService>;
  // theme: ReturnType<typeof useMiroirTheme>;
}> = ({ pageParams }) => {
  const context = useMiroirContextService();
  const theme = useMiroirTheme();

  // Use application from pageParams if available, otherwise fall back to context
  const application = pageParams.application ?? context.application;

  const currentApplicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const currentModel: MetaModel = useCurrentModel(application, currentApplicationDeploymentMap);


  // const availableReports: Report[] = useMemo(() => {
  //   return currentModel.reports || [];
  // }, [currentModel]);
  
  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined =
    deployments.find((d) => d.uuid == pageParams.deploymentUuid); // TODO; inject real existing deployments, not use a fixed list

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      pageParams.applicationSection &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[
          displayedDeploymentDefinition?.uuid
        ][pageParams.applicationSection as ApplicationSection]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    pageParams.applicationSection,
  ]);
  
  const currentMiroirReport: Report =
    availableReports?.find((r: Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;

  const availableStoredQueries = currentModel.storedQueries || [];
  const currentReportQueries: Uuid[] = (currentMiroirReport.definition.runStoredQueries ?? [])
    ?.filter((sq) => !!sq.storedQuery)
    .map((sq) => sq.storedQuery) as Uuid[];

  // log.info(
  //   "currentMiroirReport",
  //   currentMiroirReport,
  //   "currentReportQueries",
  //   currentReportQueries,
  //   "availableStoredQueries",
  //   availableStoredQueries
  // );
  const currentStoredQueries: { definition: Query }[] = availableStoredQueries.filter(
    (q: any /* StoredQuery*/) => currentReportQueries.includes(q.uuid)
  ) as any;
  // log.info("currentStoredQueries", currentStoredQueries);

  const currentStoredQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = useMemo(
    () =>
      pageParams.deploymentUuid &&
      pageParams.applicationSection &&
      pageParams.reportUuid &&
      currentStoredQueries.length > 0
        ? {
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            // label: currentStoredQueries[0].label,
            application: application,
            applicationDeploymentMap: currentApplicationDeploymentMap,
            deploymentUuid: pageParams.deploymentUuid,
            pageParams: pageParams,
            queryParams: {},
            contextResults: {},
            extractorTemplates: currentStoredQueries[0].definition.extractorTemplates,
            combinerTemplates: currentStoredQueries[0].definition.combinerTemplates,
            runtimeTransformers: currentStoredQueries[0].definition.runtimeTransformers,
          }
        : undefined,
    [application, currentStoredQueries, pageParams]
  );

  const currentStoredQueryResults: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useQueryTemplateResults(
    {
      applicationSection: pageParams.applicationSection as ApplicationSection,
      deploymentUuid: pageParams.deploymentUuid!,
      instanceUuid: pageParams.instanceUuid,
      pageParams: pageParams,
      reportDefinition: currentMiroirReport,
    },
    currentApplicationDeploymentMap,
    currentStoredQuery
  );

  if (currentStoredQueryResults instanceof Domain2ElementFailed) {
    // should never happen
    throw new Error(
      "ReportView: failed to get report data: " + JSON.stringify(currentStoredQueryResults, null, 2)
    );
  }
  const { reportData: currentStoredQueryData, resolvedQuery: currentResolvedStoredQuery } =
    currentStoredQueryResults;
  // log.info("currentStoredQueryData", currentStoredQueryData);

  return (
    <>
      <ThemedOnScreenDebug label="ReportDisplay pageParams" data={pageParams} />
      {/* <ThemedOnScreenDebug
        label="ReportDisplay currentModel"
        data={currentModel}
        initiallyUnfolded={false}
      /> */}
      {/* <ThemedOnScreenDebug
        label="ReportDisplay availableReports"
        data={availableReports.map(r=>({uuid:r.uuid, name:r.name}))}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
      <ThemedOnScreenDebug
        label="ReportDisplay currentMiroirReport"
        data={currentMiroirReport}
        initiallyUnfolded={false}
      /> */}
      <ThemedOnScreenDebug
        label="ReportDisplay currentStoredQueryResults"
        data={currentStoredQueryResults}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
      <ThemedBox style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {
        !pageParams.deploymentUuid ||
        !pageParams.applicationSection ||
        !pageParams.reportUuid ||
        // !pageParams.instanceUuid ||
        !currentMiroirReport ||
        !currentStoredQueryData ? (
          <>
            <ThemedSpan style={{ color: theme.currentTheme.colors.error }}>
              ReportDisplay: no report to display,
              reportUuid={pageParams.reportUuid},
              instanceUuid={pageParams.instanceUuid},
              deploymentUuid={pageParams.deploymentUuid},
              application={pageParams.application},
              applicationSection={pageParams.applicationSection}, 
            </ThemedSpan>
          </>
        ) : (
          <>
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallbackComponent
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  context={{
                    origin: "ReportDisplay",
                    objectType: "root_editor",
                    rootLessListKey: "ROOT",
                    currentValue: pageParams,
                    // currentValue: JSON.stringify(pageParams, null, 2),
                    formikValues: undefined,
                    // rawJzodSchema: zoomedInDisplaySchema,
                    // localResolvedElementJzodSchemaBasedOnValue:
                    //   jzodTypeCheckResult?.status == "ok"
                    //     ? jzodTypeCheckResult.resolvedSchema
                    //     : undefined,
                  }}
                />
              )}
            >
              <ReportViewWithEditor
                applicationSection={pageParams.applicationSection as ApplicationSection}
                application={application}
                applicationDeploymentMap={currentApplicationDeploymentMap}
                deploymentUuid={pageParams.deploymentUuid}
                instanceUuid={pageParams.instanceUuid}
                pageParams={pageParams}
                storedQueryData={currentStoredQueryData}
                reportDefinition={currentMiroirReport}
              />
              {context.showPerformanceDisplay && <PerformanceDisplayContainer />}
            </ErrorBoundary>
          </>
        )}
      </ThemedBox>
    </>
  );
};
