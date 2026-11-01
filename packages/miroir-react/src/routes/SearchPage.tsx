import { Formik } from "formik";
import { useMemo } from "react";
import { Params, useParams } from "react-router-dom";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  defaultSelfApplicationDeploymentMap,
  type Uuid
} from "@miroir-framework/core";

import { packageName } from "../constants.js";
import type { ReportUrlParamKeys } from "../reportUrlParams.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { EntityInstanceSelectorPanel } from "../components/TransformerEditor/EntityInstanceSelectorPanel.js";
import { cleanLevel } from "../viewConstants.js";
import { usePageConfiguration } from "../services/usePageConfiguration.js";
import { formikPath_EntityInstanceSelectorPanel, useMiroirContextService } from "../contexts/MiroirContextReactProvider.js";
import { formikPath_TransformerEditorInputModeSelector } from "../components/TransformerEditor/TransformerEditorInterface.js";
import { deployment_Miroir } from "@miroir-framework/core/admin";
import { entityEntity } from "@miroir-framework/core/meta-model";
import { useCurrentModel } from "../ReduxHooks.js";
import { defaultToolApplication, defaultToolEntity } from "./applicationDefaults.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SearchPage");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Search Page - displays only the EntityInstanceSelectorPanel for browsing entities
// ################################################################################################
export function SearchPage() {
  // const deploymentUuid: Uuid = deployment_Miroir.uuid;
  const pageParams: Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: `Report page configurations loaded for ${pageParams.deploymentUuid}`,
    actionName: "report page configuration fetch",
  });

  const context = useMiroirContextService();
  const persistedState = context.toolsPageState.transformerEditor;
  const showAllInstances = persistedState?.showAllInstances || false;

  // #633 D4: the page's own selection, then the current application, then Miroir.
  const persistedApplicationUuid = useMemo(
    () =>
      defaultToolApplication(
        context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel]?.application,
        persistedState?.selectedApplicationUuid,
        context.application,
      ),
    [
      context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel]?.application,
      persistedState?.selectedApplicationUuid,
      context.application,
    ],
  );
  const applicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const deploymentUuid: Uuid = applicationDeploymentMap[persistedApplicationUuid] ?? deployment_Miroir.uuid;
  const currentModel = useCurrentModel(persistedApplicationUuid, applicationDeploymentMap);
  const initialEntityUuid: Uuid = defaultToolEntity(persistedApplicationUuid, currentModel.entities, entityEntity.uuid);

  const initialFormValues = useMemo(
    () => ({
      [formikPath_TransformerEditorInputModeSelector]: {
        mode: "instance",
        application: persistedApplicationUuid,
      },
      [formikPath_EntityInstanceSelectorPanel]: {
        application: persistedApplicationUuid,
      },
      transformerEditor_input: {},
      selectedEntityInstance: undefined,
      entityInstances: [],
    }),
    [persistedApplicationUuid],
  );

  return (
    <PageContainer>
      <Formik
        enableReinitialize={true}
        initialValues={initialFormValues as any}
        onSubmit={async () => {
          // No-op for search page
        }}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {/* {(formikContext: FormikProps<any>) => ( */}
        <EntityInstanceSelectorPanel
          deploymentUuid={deploymentUuid}
          applicationDeploymentMap={applicationDeploymentMap}
          initialApplicationUuid={persistedApplicationUuid}
          initialEntityUuid={initialEntityUuid}
          showAllInstances={showAllInstances}
        />
        {/* )} */}
      </Formik>
    </PageContainer>
  );
}
