/**
 * #679: the Git page (`?page=git[&application=X]`), reached from the AppBar when the process has the
 * `git` capability. The application is chosen as on the model page; the page body is `GitPageView`,
 * whose Git actions run on the server through the DomainController. Above it, the clone panel (#683)
 * installs an application from a remote repository.
 */
import { Alert, Box, Typography } from "@mui/material";
import { Formik } from "formik";
import React, { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  GIT_ENDPOINT_UUID,
  noValue,
  type ApplicationDeploymentMap,
  type GitActionType,
  type MlElement,
  type Uuid,
} from "@miroir-framework/core";
import { adminSelfApplication, deployment_Miroir, entityApplicationForAdmin } from "@miroir-framework/core/admin";
import { selfApplicationMiroir } from "@miroir-framework/core/meta-model";

import { GitClonePanel } from "../components/Git/GitClonePanel.js";
import { GitSpacing } from "../components/Git/GitSpacing.js";
import { GitPageView, type GitPageViewName } from "../components/Git/GitPageView.js";
import type { RunGitAction } from "../components/Git/useGitRequest.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { TypedValueObjectEditor } from "../components/Reports/TypedValueObjectEditor.js";
import { useDomainControllerService, useMiroirContextService } from "../contexts/MiroirContextReactProvider.js";
import { useCurrentModel } from "../ReduxHooks.js";
import { usePageConfiguration } from "../services/usePageConfiguration.js";
import { defaultToolApplication } from "./applicationDefaults.js";

const formikPath = "gitPage";

const applicationSelectorSchema: MlElement = {
  type: "object",
  tag: {
    value: {
      defaultLabel: "Application Selector",
      display: { objectWithoutHeader: true, objectOrArrayWithoutFrame: true, objectAttributesNoIndent: true },
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
          initializeTo: { initializeToType: "value", value: noValue.uuid },
        },
      },
    },
  },
};

// ################################################################################################
export function GitPage(): React.JSX.Element {
  usePageConfiguration({ autoFetchOnMount: true, actionName: "git page configuration fetch" });
  const context = useMiroirContextService();
  const [searchParams, setSearchParams] = useSearchParams();
  // #691: a tab change writes the tab and the application shown, keeping `page` and every other parameter,
  // so that a copied link opens the same view
  const onViewChange = useCallback(
    (application: Uuid, view: GitPageViewName) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("application", application);
          next.set("view", view);
          return next;
        },
        // a tab change is no page of the browser history
        { replace: true },
      ),
    [setSearchParams],
  );
  const applicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const gitEnabled = context.processCapabilities.git === true;
  const initialApplication = defaultToolApplication(
    searchParams.get("application") ?? undefined,
    context.toolsPageState?.applicationSelector,
    context.application,
  );
  return (
    <Formik
      enableReinitialize={true}
      initialValues={{ [formikPath]: { application: initialApplication } } as any}
      onSubmit={async () => undefined}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {(formik) => {
        const application: Uuid = formik.values[formikPath]?.application ?? initialApplication;
        return (
          <PageContainer padding={2}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TypedValueObjectEditor
                labelElement={<span>select Application</span>}
                formValueMLSchema={applicationSelectorSchema}
                formikValuePathAsString={formikPath}
                application={initialApplication}
                applicationDeploymentMap={applicationDeploymentMap}
                deploymentUuid={applicationDeploymentMap[application] ?? deployment_Miroir.uuid}
                applicationSection={"data"}
                formLabel={"Application Selector"}
                valueObjectEditMode="create"
                displaySubmitButton="noDisplay"
                maxRenderDepth={3}
              />
              <GitSpacing>
                {application && application !== noValue.uuid ? (
                  <GitPageForApplication
                    key={application}
                    application={application}
                    applicationDeploymentMap={applicationDeploymentMap}
                    view={searchParams.get("view") ?? undefined}
                    onViewChange={(view) => onViewChange(application, view)}
                  />
                ) : // #691: before an application is chosen, cloning one is all the page offers
                gitEnabled ? (
                  <GitCloneSection />
                ) : (
                  <GitUnavailable />
                )}
              </GitSpacing>
            </Box>
          </PageContainer>
        );
      }}
    </Formik>
  );
}

/** The notice `GitPageView` shows with `git` off, for the page with no application chosen. */
function GitUnavailable() {
  return (
    <Alert severity="info" data-testid="git-unavailable">
      Git is off in this Miroir process. Start it with the <code>git</code> feature on to use the Git page.
    </Alert>
  );
}

/** #683: the clone panel, whose actions register deployments in Admin. */
function GitCloneSection() {
  const domainController = useDomainControllerService();
  const context = useMiroirContextService();
  const applicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const runGitAction: RunGitAction = useCallback(
    (actionType: GitActionType, payload: Record<string, unknown> = {}) =>
      domainController.handleAction(
        {
          actionType,
          endpoint: GIT_ENDPOINT_UUID,
          payload: { ...payload, application: adminSelfApplication.uuid },
        } as any,
        { ...defaultSelfApplicationDeploymentMap, ...applicationDeploymentMap },
      ),
    [domainController, applicationDeploymentMap],
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="subtitle1">Clone an application from Git</Typography>
      <GitClonePanel
        runGitAction={runGitAction}
        applicationHref={(application) => `?page=git&application=${encodeURIComponent(application)}`}
      />
    </Box>
  );
}

function GitPageForApplication(props: {
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  view: string | undefined;
  onViewChange: (view: GitPageViewName) => void;
}) {
  const context = useMiroirContextService();
  const domainController = useDomainControllerService();
  const model = useCurrentModel(props.application, props.applicationDeploymentMap);
  const miroirModel = useCurrentModel(selfApplicationMiroir.uuid, props.applicationDeploymentMap);
  const entityNames = useMemo(
    () =>
      Object.fromEntries(
        [...(miroirModel.entities ?? []), ...(model.entities ?? [])].map((entity) => [entity.uuid, entity.name]),
      ),
    [model.entities, miroirModel.entities],
  );
  const runGitAction: RunGitAction = useCallback(
    (actionType: GitActionType, payload: Record<string, unknown> = {}) =>
      domainController.handleAction(
        {
          actionType,
          endpoint: GIT_ENDPOINT_UUID,
          payload: { ...payload, application: props.application },
        } as any,
        props.applicationDeploymentMap,
      ),
    [domainController, props.application, props.applicationDeploymentMap],
  );
  return (
    <GitPageView
      applicationName={model.applicationName || props.application}
      gitEnabled={context.processCapabilities.git === true}
      runGitAction={runGitAction}
      entityNames={entityNames}
      view={props.view}
      onViewChange={props.onViewChange}
      setupExtras={<GitCloneSection />}
    />
  );
}

export default GitPage;
