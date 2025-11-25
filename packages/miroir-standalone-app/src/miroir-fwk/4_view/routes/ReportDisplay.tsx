import {
  useEffect,
  useMemo
} from "react";
import { Params, useParams } from "react-router-dom";

import {
  ApplicationSection,
  Domain2ElementFailed,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  SelfApplicationDeploymentConfiguration,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type Query,
  type Uuid
} from "miroir-core";
import {
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider.js";

import {
  deployments,
  packageName,
  ReportUrlParamKeys,
} from "../../../constants.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { PerformanceDisplayContainer } from "../components/PerformanceDisplayContainer.js";
import { useQueryTemplateResults } from "../components/Reports/ReportHooks.js";
import { ReportViewWithEditor } from "../components/Reports/ReportViewWithEditor.js";
import { ThemedBox, ThemedSpan } from "../components/Themes/index.js";
import { cleanLevel } from "../constants.js";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import { usePageConfiguration } from "../services/index.js";
import { useRenderTracker } from "../tools/renderCountTracker.js";
import { RenderPerformanceMetrics } from "../tools/renderPerformanceMeasure.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportDisplay"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});



const defaultReport: Report = {
  uuid: "c0ba7e3d-3740-45a9-b183-20c3382b6419",
  parentName: "Report",
  parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  conceptLevel: "Model",
  name: "DummyDefaultReport",
  defaultLabel: "No report to display!",
  type: "list",
  definition: {
    extractorTemplates: {},
    section: {
      type: "objectListReportSection",
      definition: {
        parentName: "Test",
        parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
      },
    },
  },
};


export const ReportDisplay: React.FC<{
  pageParams: Params<ReportUrlParamKeys>;
  context: ReturnType<typeof useMiroirContextService>;
  theme: ReturnType<typeof useMiroirTheme>;
}> = ({ pageParams, context, theme }) => {

  const currentModel: MetaModel = useCurrentModel(pageParams.deploymentUuid);

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
    <ThemedBox style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
      {pageParams.deploymentUuid &&
      pageParams.applicationSection &&
      pageParams.reportUuid &&
      pageParams.reportUuid != "undefined" ? (
        <>
          {/* {pageParams.useReportViewWithEditor  === "true" ? ( */}
          <>
            <ReportViewWithEditor
              applicationSection={pageParams.applicationSection as ApplicationSection}
              deploymentUuid={pageParams.deploymentUuid}
              instanceUuid={pageParams.instanceUuid}
              pageParams={pageParams}
              storedQueryData={currentStoredQueryData}
              reportDefinition={currentMiroirReport}
            />
            {context.showPerformanceDisplay && <PerformanceDisplayContainer />}
          </>
        </>
      ) : (
        <ThemedSpan style={{ color: theme.currentTheme.colors.error }}>
          ReportDisplay: no report to display, deploymentUuid={pageParams.deploymentUuid},
          applicationSection=
          {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}
        </ThemedSpan>
      )}
    </ThemedBox>
  );
};
