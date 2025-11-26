import {
  useMemo
} from "react";
import { Params } from "react-router-dom";

import {
  ApplicationSection,
  defaultReport,
  Domain2ElementFailed,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type Query,
  type Uuid
} from "miroir-core";
import {
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider.js";

import { ErrorBoundary } from "react-error-boundary";
import {
  packageName,
  ReportUrlParamKeys
} from "../../../constants.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { ErrorFallbackComponent } from "../components/ErrorFallbackComponent.js";
import { PerformanceDisplayContainer } from "../components/PerformanceDisplayContainer.js";
import { useQueryTemplateResults } from "../components/Reports/ReportHooks.js";
import { ReportViewWithEditor } from "../components/Reports/ReportViewWithEditor.js";
import { ThemedBox, ThemedSpan } from "../components/Themes/index.js";
import { cleanLevel } from "../constants.js";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";

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

  const currentModel: MetaModel = useCurrentModel(pageParams.deploymentUuid);


  const availableReports: Report[] = useMemo(() => {
    return currentModel.reports || [];
  }, [currentModel]);

  const currentMiroirReport: Report =
    availableReports?.find((r: Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;
  const availableStoredQueries = currentModel.storedQueries || [];
  const currentReportQueries: Uuid[] = (currentMiroirReport.definition.runStoredQueries ?? [])
    ?.filter((sq) => !!sq.storedQuery)
    .map((sq) => sq.storedQuery) as Uuid[];

  log.info(
    "currentMiroirReport",
    currentMiroirReport,
    "currentReportQueries",
    currentReportQueries,
    "availableStoredQueries",
    availableStoredQueries
  );
  const currentStoredQueries: { definition: Query }[] = availableStoredQueries.filter(
    (q: any /* StoredQuery*/) => currentReportQueries.includes(q.uuid)
  ) as any;
  log.info("currentStoredQueries", currentStoredQueries);

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
            deploymentUuid: pageParams.deploymentUuid,
            pageParams: pageParams,
            queryParams: {},
            contextResults: {},
            extractorTemplates: currentStoredQueries[0].definition.extractorTemplates,
            combinerTemplates: currentStoredQueries[0].definition.combinerTemplates,
            runtimeTransformers: currentStoredQueries[0].definition.runtimeTransformers,
          }
        : undefined,
    [currentStoredQueries, pageParams]
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
  log.info("currentStoredQueryData", currentStoredQueryData);

  return (
    <>
      {/* <ThemedOnScreenHelper label="ReportDisplay pageParams" data={pageParams} /> */}
      {/* <ThemedOnScreenHelper label="ReportDisplay currentModel" data={currentModel} /> */}
      {/* <ThemedOnScreenHelper label="ReportDisplay availableReports" data={availableReports} /> */}
      {/* <ThemedOnScreenHelper label="ReportDisplay currentMiroirReport" data={currentMiroirReport} /> */}
      <ThemedBox style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {!pageParams.deploymentUuid ||
        !pageParams.applicationSection ||
        !pageParams.reportUuid ||
        // !pageParams.instanceUuid ||
        !currentMiroirReport ||
        !currentStoredQueryData ? (
          <>
            <ThemedSpan style={{ color: theme.currentTheme.colors.error }}>
              ReportDisplay: no report to display, deploymentUuid={pageParams.deploymentUuid},
              applicationSection=
              {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}
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
