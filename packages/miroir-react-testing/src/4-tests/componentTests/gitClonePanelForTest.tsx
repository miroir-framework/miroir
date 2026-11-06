import React, { Suspense, useMemo } from "react";

import {
  Action2Error,
  type Action2ReturnType,
  type GitActionType,
  type GitClonedDeploymentSummary,
} from "@miroir-framework/core";
import { LazyGitClonePanel, type RunGitAction } from "@miroir-framework/react";

// ################################################################################################
// The clone panel of the Git page for the declarative component tests (#683): the real panel, on a
// server given as the results of `gitAction_clone`, `gitAction_installClonedDeployment` and
// `gitAction_setCredential`.
// ################################################################################################

export interface GitClonePanelForTestProps {
  /** The deployments the cloned repository holds. Empty: the clone is refused with `noDeploymentFound`. */
  deployments?: GitClonedDeploymentSummary[];
  /** Folders that already exist: a clone into one is refused with `folderNotEmpty`. */
  existingFolders?: string[];
  /** The remote asks for this token: the clone is refused with `authenticationRequired` without it. */
  remoteToken?: string;
}

const REMOTE_HOST = "git.example.com";

function refusal(reason: string, message: string, context: Record<string, unknown> = {}): Action2ReturnType {
  return new Action2Error("InvalidAction", message, undefined, undefined, { reason, ...context });
}

function ok(returnedDomainElement: unknown): Action2ReturnType {
  return { status: "ok", returnedDomainElement: returnedDomainElement as any };
}

export function GitClonePanelForTest(props: GitClonePanelForTestProps) {
  const runGitAction: RunGitAction = useMemo(() => {
    const folders = new Set(props.existingFolders ?? []);
    const deployments = props.deployments ?? [];
    const installed = new Set<string>();
    let credentialSaved = false;
    return async (actionType: GitActionType, payload: Record<string, unknown> = {}) => {
      switch (actionType) {
        case "gitAction_clone": {
          const folderName = String(payload.folderName ?? "");
          if (!/^https?:\/\//.test(String(payload.url ?? ""))) {
            return refusal("unsupportedRemoteProtocol", "Only http and https remotes are supported");
          }
          if (folders.has(folderName)) {
            return refusal("folderNotEmpty", `${folderName} already exists`, { folderName });
          }
          const token = (payload.credential as { token?: string } | undefined)?.token;
          if (props.remoteToken !== undefined && !credentialSaved && token !== props.remoteToken) {
            return new Action2Error("ExternalServiceUnauthorized", "The remote refused the credentials", undefined, undefined, {
              reason: "authenticationRequired",
              host: REMOTE_HOST,
            });
          }
          folders.add(folderName);
          if (deployments.length === 0) {
            return refusal("noDeploymentFound", "no deployment", { folderName });
          }
          return ok({
            folderName,
            root: `/repo/${folderName}`,
            branches: { current: "main", head: "1".repeat(40), local: ["main"], remote: ["origin/main"], tags: [] },
            deployments,
            skipped: [],
          });
        }
        case "gitAction_installClonedDeployment": {
          const wanted = payload.deploymentUuid as string | undefined;
          const deployment = deployments.find((entry) => entry.deploymentUuid === wanted) ?? (wanted ? undefined : deployments[0]);
          if (!deployment) {
            return refusal("unknownClonedDeployment", `no deployment ${wanted}`);
          }
          if (deployment.alreadyInstalled || installed.has(deployment.deploymentUuid)) {
            return refusal("applicationAlreadyDeployed", "already installed");
          }
          installed.add(deployment.deploymentUuid);
          return ok({
            application: deployment.selfApplication,
            deploymentUuid: deployment.deploymentUuid,
            name: deployment.name,
            directories: deployment.directories,
          });
        }
        case "gitAction_setCredential":
          credentialSaved = true;
          return ok({ name: `git.${String(payload.host)}`, scope: "process" });
        default:
          return refusal("gitFailure", `No fixture for ${actionType}`);
      }
    };
  }, [props.deployments, props.existingFolders, props.remoteToken]);
  return (
    <Suspense fallback={<span>Loading the clone panel...</span>}>
      <LazyGitClonePanel runGitAction={runGitAction} applicationHref={(application) => `?page=git&application=${application}`} />
    </Suspense>
  );
}
