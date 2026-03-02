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
  noValue,
  selfApplicationDeploymentMiroir,
  type JzodElement,
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
import { adminSelfApplication, entityApplicationForAdmin } from "miroir-test-app_deployment-admin";
import { TypedValueObjectEditorWithFormik } from "../components/Reports/TypedValueObjectEditorWithFormik.js";
import { Formik, type FormikProps } from "formik";
import { TypedValueObjectEditor } from "../components/Reports/TypedValueObjectEditor.js";

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

  const formikPath = "modelDiagramPage";
  const inputSelector_applicationUuid = context.toolsPageState?.applicationSelector ?? selfApplicationDeploymentMiroir.uuid;
  const applicationSelectorPanelSchema: JzodElement = {
    type: "object",
    definition: {
      [formikPath]: {
        type: "object",
        tag: {
          value: {
            defaultLabel: "Application Selector",
            display: {
              // unfoldSubLevels: 1,
              objectWithoutHeader: true,
              objectOrArrayWithoutFrame: true,
              objectAttributesNoIndent: true,
            },
          },
        },
        definition: {
          application: {
            type: "uuid",
            tag: {
              value: {
                defaultLabel: "Application",
                foreignKeyParams: {
                  targetApplicationUuid: adminSelfApplication.uuid,
                  targetEntity: entityApplicationForAdmin.uuid,
                  targetEntityOrderInstancesBy: "name",
                },
                initializeTo: {
                  initializeToType: "value",
                  value: noValue.uuid,
                },
              },
            },
          },
        },
      },
    },
  };
  const initialFormValues = {
    [formikPath]: {
      // mode: "instance",
      application: inputSelector_applicationUuid
    },
    transformerEditor_input: {},
    selectedEntityInstance: undefined,
    entityInstances: [],
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialFormValues as any}
      onSubmit={async () => {
        // No-op for search page
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {(formikContext: FormikProps<any>) => {
        const application =
          formikContext.values[formikPath].application ??
          context.toolsPageState.applicationSelector ??
          context.application;
        const deploymentUuid =
          currentApplicationDeploymentMap[formikContext.values[formikPath].application] ??
          selfApplicationDeploymentMiroir.uuid;
          
        const currentModel: MetaModel = useCurrentModel(
          application,
          currentApplicationDeploymentMap,
        );
        const applicationName = currentModel.applicationName || "Application";
        // const entityDefinitions = defaultMiroirMetaModel.entityDefinitions ?? [];
        const entityDefinitions = currentModel.entityDefinitions ?? [];

        return (
          <PageContainer padding={2}>
            <DebugHelper
              componentName="ModelDiagramPage"
              elements={[
                // { label: "ModelDiagramPage miroirTheme", data: miroirTheme },
                // { label: `ModelDiagramPage application ${application}`, data: currentModel.entityDefinitions },
                // {
                //   label: `ModelDiagramPage defaultMiroirMetaModel ${formikContext.values[formikPath].application}`,
                //   data: defaultMiroirMetaModel.entityDefinitions,
                //   useCodeBlock: false,
                // },
                // { label: "ModelDiagramPage currentModel", data: currentModel },
                { label: "ModelDiagramPage entity definitions", data: currentModel.entityDefinitions },
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
              <TypedValueObjectEditor
                labelElement={<span>select Application</span>}
                formValueMLSchema={applicationSelectorPanelSchema}
                formikValuePathAsString={"modelDiagramPage"}
                application={inputSelector_applicationUuid}
                applicationDeploymentMap={currentApplicationDeploymentMap}
                deploymentUuid={deploymentUuid}
                applicationSection={"data"}
                formLabel={"Application Selector jzod"}
                valueObjectEditMode="create" // Readonly viewer mode, not relevant here
                displaySubmitButton="noDisplay"
                maxRenderDepth={3}
              />
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
                UML class diagram showing entities, their attributes, and foreign-key relationships
                for the current application model.
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
      }}
    </Formik>
  );
};

export default ModelDiagramPage;
