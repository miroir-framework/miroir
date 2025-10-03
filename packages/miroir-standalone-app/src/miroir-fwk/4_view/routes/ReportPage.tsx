import { useEffect, useMemo, useState, useRef, useCallback, createContext, useContext } from 'react';
import { Params, useParams } from 'react-router-dom';

import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  SelfApplicationDeploymentConfiguration,
  ApplicationSection,
  getReportsAndEntitiesDefinitionsForDeploymentUuid,
  JzodElement,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider.js";

import { adminConfigurationDeploymentParis, deployments, packageName, ReportUrlParamKeys } from "../../../constants.js";
import { useCurrentModel } from '../ReduxHooks.js';
import { ReportView } from '../components/Reports/ReportView.js';
import { PerformanceDisplayContainer } from '../components/PerformanceDisplayContainer.js';
import { cleanLevel } from '../constants.js';
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';
import { useRenderTracker } from '../tools/renderCountTracker.js';
import { PageContainer } from '../components/Page/PageContainer.js';
import { ThemedBox, ThemedSpan } from '../components/Themes/index.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { usePageConfiguration } from '../services/index.js';
import { useDocumentOutlineContext } from '../components/ValueObjectEditor/InstanceEditorOutlineContext.js';
import { ReportPageContextProvider } from '../components/Reports/ReportPageContext.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportPage"), "UI",
).then((logger: LoggerInterface) => {log = logger});

const miroirExpression: JzodElement = {
  type: "object",
  definition: {
    root: {
      type: "string"
    },
    attribute: {
      type: "string"
    },
  }
}

// export const deployments = [
//   adminConfigurationDeploymentMiroir,
//   adminConfigurationDeploymentLibrary,
//   adminConfigurationDeploymentAdmin,
//   // adminConfigurationDeploymentTest1,
//   // adminConfigurationDeploymentTest4,
//   adminConfigurationDeploymentParis,
// ] as any[]; //type for Admin SelfApplication Deployment Entity Definition


// ###############################################################################################################
export const ReportPage = () => {
  const pageParams: Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const context = useMiroirContextService();
  const theme = useMiroirTheme();
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: `Report page configurations loaded for ${pageParams.deploymentUuid}`,
    actionName: "report page configuration fetch"
  });
  
  // Track render counts with centralized tracker
  // Use deployment-level key to maintain consistency across all navigation within same deployment
  const currentNavigationKey = `${pageParams.deploymentUuid}-${pageParams.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportPage", currentNavigationKey);

  // Get outline context from RootComponent
  // const outlineContext = useDocumentOutlineContext();

  // log.info("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& ReportPage rendering", "navigationCount", navigationCount, "totalCount", totalCount, "params", pageParams);
  useEffect(() => context.setDeploymentUuid(pageParams.deploymentUuid ? pageParams.deploymentUuid : ""));
  useEffect(() => context.setApplicationSection((pageParams.applicationSection as ApplicationSection) ?? "data"));

  const errorLog = useErrorLogService();

  const adminAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const libraryAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentLibrary.uuid);

  // const test1AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest1.uuid);
  // const test4AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest4.uuid);
  const parisAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentParis.uuid);

  // log.info("ReportPage currentModel", currentModel);

  const defaultReport: Report = useMemo(
    () => (
      {
        uuid: "c0ba7e3d-3740-45a9-b183-20c3382b6419",
        parentName: "Report",
        parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
        conceptLevel: "Model",
        name: "DummyDefaultReport",
        defaultLabel: "No report to display!",
        type: "list",
        definition: {
          extractorTemplates: {},
          // extractorTemplates: {},
          section: {
            type: "objectListReportSection",
            definition: {
              parentName: "Test",
              parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
            },
          },
        },
      }
    ),
    []
  );

  const displayedDeploymentDefinition: SelfApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == pageParams.deploymentUuid
  );

  // log.info("displayedDeploymentDefinition", displayedDeploymentDefinition);

  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => (
      {
        [adminConfigurationDeploymentAdmin.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentAdmin.uuid,
          miroirMetaModel, 
          adminAppModel,
        ),
        [adminConfigurationDeploymentMiroir.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentMiroir.uuid,
          miroirMetaModel, 
          miroirMetaModel, 
        ),
        [adminConfigurationDeploymentLibrary.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentLibrary.uuid,
          miroirMetaModel, 
          libraryAppModel,
        ),
        // [adminConfigurationDeploymentTest1.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
        //   adminConfigurationDeploymentTest1.uuid,
        //   miroirMetaModel, 
        //   test1AppModel,
        // ),
        // [adminConfigurationDeploymentTest4.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
        //   adminConfigurationDeploymentTest4.uuid,
        //   miroirMetaModel, 
        //   test4AppModel,
        // ),
        [adminConfigurationDeploymentParis.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentParis.uuid,
          miroirMetaModel, 
          parisAppModel,
        ),
      }
    ),
    // [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel, parisAppModel]
    // [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel ]
    [miroirMetaModel, libraryAppModel, adminAppModel, parisAppModel ]
  );

  useEffect(() =>
    context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  );

  useEffect(() => {
    // Only reset metrics if we're navigating to a different deployment
    // Keep metrics when navigating between different reports/entities within the same deployment
    const currentDeploymentKey = `${pageParams.deploymentUuid}-${pageParams.applicationSection}`;
    
    // Store the current deployment key to compare with previous
    const previousDeploymentKey = sessionStorage.getItem('currentDeploymentKey');
    if (previousDeploymentKey && previousDeploymentKey !== currentDeploymentKey) {
      RenderPerformanceMetrics.resetMetrics();
      log.info("RenderPerformanceMetrics reset for new deployment/section");
    }
    sessionStorage.setItem('currentDeploymentKey', currentDeploymentKey);
  }, [
    pageParams.deploymentUuid,
    pageParams.applicationSection,
  ]);

  // log.info("context.deploymentUuidToReportsEntitiesDefinitionsMapping", context.deploymentUuidToReportsEntitiesDefinitionsMapping);

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      pageParams.applicationSection &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
          pageParams.applicationSection as ApplicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    pageParams.applicationSection,
  ]);
  // log.info("displayedDeploymentDefinition", displayedDeploymentDefinition);
  // log.info("ReportPage availableReports", availableReports);

  const currentMiroirReport: Report =
    availableReports?.find((r: Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;

  // log.info("currentMiroirReport", currentMiroirReport);

  if (pageParams.applicationSection) {
    // log.info("ReportPage rendering", "navigationCount", navigationCount, "totalCount", totalCount, "params", pageParams);
    // log.info("ReportPage current metrics:", RenderPerformanceMetrics.renderMetrics);
    return (
      <ReportPageContextProvider>
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
          <ThemedBox>
            {context.showPerformanceDisplay && (
              <>
                <ThemedBox>
                  deploymentUuid={pageParams.deploymentUuid}, applicationSection=
                  {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}, instanceUuid=
                  {pageParams.instanceUuid}
                </ThemedBox>
                <span>
                  ReportPage renders: {navigationCount} (total: {totalCount})
                </span>
              </>
            )}
            {(errorLog as any)?.errorLogs.length !== 0 && <h3>erreurs: {JSON.stringify(errorLog)}</h3>}
          </ThemedBox>
          <ThemedBox style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {pageParams.deploymentUuid &&
            pageParams.applicationSection &&
            pageParams.reportUuid &&
            pageParams.reportUuid != "undefined" ? (
              <>
                <ReportView
                  applicationSection={pageParams.applicationSection as ApplicationSection}
                  deploymentUuid={pageParams.deploymentUuid}
                  instanceUuid={pageParams.instanceUuid}
                  pageParams={pageParams}
                  reportDefinition={currentMiroirReport?.definition}
                />
                {context.showPerformanceDisplay && <PerformanceDisplayContainer />}
              </>
            ) : (
              <ThemedSpan
                style={{ color: theme.currentTheme.colors.error }}
              >
                ReportDisplay: no report to display, deploymentUuid={pageParams.deploymentUuid},
                applicationSection=
                {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}
              </ThemedSpan>
            )}
          </ThemedBox>
        </PageContainer>
      </ReportPageContextProvider>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(pageParams)}</>;
  }
};
