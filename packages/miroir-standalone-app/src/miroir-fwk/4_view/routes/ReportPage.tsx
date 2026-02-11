import {
  useEffect
} from "react";
import { Params, useParams } from "react-router-dom";

import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory
} from "miroir-core";
import {
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider.js";

import {
  packageName,
  ReportUrlParamKeys
} from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { ThemedBox } from "../components/Themes/index.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";
import { useRenderTracker } from "../tools/renderCountTracker.js";
import { RenderPerformanceMetrics } from "../tools/renderPerformanceMeasure.js";
import { ReportDisplay } from "./ReportDisplay.js";
import { ThemedOnScreenDebug } from "../components/Themes/BasicComponents.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportPage"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ###############################################################################################################
export const ReportPage = () => {
  const pageParams: Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const context = useMiroirContextService();
  // const theme = useMiroirTheme();

  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: `Report page configurations loaded for ${pageParams.deploymentUuid}`,
    actionName: "report page configuration fetch",
  });

  // Track render counts with centralized tracker
  // Use deployment-level key to maintain consistency across all navigation within same deployment
  const currentNavigationKey = `${pageParams.deploymentUuid}-${pageParams.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportPage", currentNavigationKey);

  // Get outline context from RootComponent
  // const outlineContext = useDocumentOutlineContext();

  // log.info("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& ReportPage rendering", "navigationCount", navigationCount, "totalCount", totalCount, "params", pageParams);
  useEffect(() => {
    context.setDeploymentUuid(pageParams.deploymentUuid ? pageParams.deploymentUuid : "");
  }, [pageParams.deploymentUuid]);
  useEffect(() => {
    context.setApplicationSection((pageParams.applicationSection as ApplicationSection) ?? "data");
  }, [pageParams.applicationSection]);

  useEffect(() => {
    // Only reset metrics if we're navigating to a different deployment
    // Keep metrics when navigating between different reports/entities within the same deployment
    const currentDeploymentKey = `${pageParams.deploymentUuid}-${pageParams.applicationSection}`;

    // Store the current deployment key to compare with previous
    const previousDeploymentKey = sessionStorage.getItem("currentDeploymentKey");
    if (previousDeploymentKey && previousDeploymentKey !== currentDeploymentKey) {
      RenderPerformanceMetrics.resetMetrics();
      log.info("RenderPerformanceMetrics reset for new deployment/section");
    }
    sessionStorage.setItem("currentDeploymentKey", currentDeploymentKey);
  }, [pageParams.deploymentUuid, pageParams.applicationSection]);


  if (pageParams.applicationSection) {
    // log.info("ReportPage rendering", "navigationCount", navigationCount, "totalCount", totalCount, "params", pageParams);
    // log.info("ReportPage current metrics:", RenderPerformanceMetrics.renderMetrics);
    return (
        <PageContainer
          withSidebar={true}
          withDocumentOutline={true} // ReportPage has document outline
          customSx={{
            // ReportPage specific styling
            "& .miroir-table-container": {
              maxWidth: "100%",
              overflow: "hidden",
            },
          }}
        >
          <ThemedOnScreenDebug
            label={`ReportPage Params`}
            data={pageParams}
            initiallyUnfolded={true}
            useCodeBlock={true}
          />
          <ThemedBox>
            {context.showPerformanceDisplay && (
              <>
                <ThemedBox>
                  application={pageParams.application},
                  deploymentUuid={pageParams.deploymentUuid}, applicationSection=
                  {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}, instanceUuid=
                  {pageParams.instanceUuid}
                </ThemedBox>
                <span>
                  ReportPage renders: {navigationCount} (total: {totalCount})
                </span>
              </>
            )}
          </ThemedBox>
          <ReportDisplay
            pageParams={pageParams}
          ></ReportDisplay>
        </PageContainer>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(pageParams)}</>;
  }
};
