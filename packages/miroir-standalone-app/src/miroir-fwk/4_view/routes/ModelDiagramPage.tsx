/**
 * ModelDiagramPage – displays a UML-like class diagram of the current
 * application's model (entities and their relationships).
 *
 * Accessible via the AppBar "Model" button at route /model.
 */

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  LoggerInterface,
  MiroirLoggerFactory,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  selfApplicationDeploymentMiroir,
  type MetaModel,
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { MermaidClassDiagram } from "miroir-diagram-class";
import { cleanLevel } from "../constants.js";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import { useMiroirContextService } from "miroir-react";
import { useCurrentModel, useCurrentModelEnvironment } from "../ReduxHooks.js";
import { DebugHelper } from "miroir-react";
import { usePageConfiguration } from "../services/usePageConfiguration.js";
import { adminSelfApplication } from "miroir-test-app_deployment-admin";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ModelDiagramPage"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export const ModelDiagramPage: React.FC<any> = () => {
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "ModelDiagramPage configurations loaded successfully",
    actionName: "model diagram page configuration fetch"
  });

  const miroirTheme = useMiroirTheme();
  const context = useMiroirContextService();
  const currentApplicationDeploymentMap =
    context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  // const application = context.toolsPageState.applicationSelector ?? context.application;
  const application = selfApplicationDeploymentMiroir.uuid;
  // const application = adminSelfApplication.uuid;
  
  // const currentModel: MetaModel = useMiroir(
  const currentModel: MetaModel = useCurrentModel(
    application,
    defaultSelfApplicationDeploymentMap,
  );
  // const currentModel: MetaModel = useCurrentModel(
  //   application,
  //   currentApplicationDeploymentMap,
  // );

  // const reportSection = application == selfApplicationMiroir.uuid ? "data" : "model"

  // const { availableReports, entities, entityDefinitions } = useMemo(() => {
  //   return context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
  //     context.deploymentUuidToReportsEntitiesDefinitionsMapping[currentApplicationDeploymentMap[application]]
  //     ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[
  //         currentApplicationDeploymentMap[application]
  //       ]["data"]
  //     : { availableReports: [], entities: [], entityDefinitions: [] };
  // }, [
  //   currentApplicationDeploymentMap,
  //   application,
  //   currentApplicationDeploymentMap[application],
  //   context.deploymentUuidToReportsEntitiesDefinitionsMapping,
  //   // pageParams.applicationSection,
  // ]);

  // const entityDefinitions = useMemo(
  //   () => currentModel.entityDefinitions ?? [],
  //   [currentModel.entityDefinitions],
  // );
  const entityDefinitions = defaultMiroirMetaModel.entityDefinitions ?? [];
  const applicationName = currentModel.applicationName || "Application";

  return (
    <PageContainer padding={2}>
      <DebugHelper
        componentName="ModelDiagramPage"
        elements={[
          { label: "ModelDiagramPage miroirTheme", data: miroirTheme },
          // { label: `ModelDiagramPage application ${application}`, data: currentModel.entityDefinitions },
          {
            label: `ModelDiagramPage defaultMiroirMetaModel ${application}`,
            data: defaultMiroirMetaModel.entityDefinitions,
            useCodeBlock: false,
          },
          { label: "ModelDiagramPage currentModel", data: currentModel },
        ]}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "100%",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: miroirTheme.currentTheme.colors.text,
            fontWeight: 600,
          }}
        >
          {applicationName} – Model Diagram
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: miroirTheme.currentTheme.colors.text,
            opacity: 0.7,
          }}
        >
          UML class diagram showing entities, their attributes, and foreign-key relationships for
          the current application model.
          {entityDefinitions.length > 0 && ` (${entityDefinitions.length} entities)`}
        </Typography>

        <MermaidClassDiagram
          entityDefinitions={entityDefinitions}
          options={{
            title: `${applicationName} Model`,
            direction: entityDefinitions.length > 10 ? "TB" : "LR", // Top-Bottom if many entities, else Left-Right
          }}
          height="calc(100vh - 220px)"
        />
      </Box>
    </PageContainer>
  );
};

export default ModelDiagramPage;
