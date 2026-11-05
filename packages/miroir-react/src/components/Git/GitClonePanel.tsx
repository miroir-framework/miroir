/**
 * #683: clone a Git repository from the Git page, then install the Miroir deployment it holds. The clone
 * goes to a folder under the deployment root folder of the server; one deployment found is installed at
 * once, several are listed to pick from. A remote asking for a token opens the credential form.
 */
import { Alert, Box, Button, Link, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

import type {
  GitCloneResult,
  GitClonedDeploymentSummary,
  GitInstallClonedDeploymentResult,
} from "@miroir-framework/core";

import { GitCredentialForm, savedCredentialNotice, type GitTypedCredential } from "./GitCredentialForm.js";
import { GitCommandError } from "./GitWritePanels.js";
import { useGitCommand } from "./useGitCommand.js";
import type { GitRequestError, RunGitAction } from "./useGitRequest.js";

const noRefresh = () => undefined;

/** The folder a clone of `url` gets by default: the repository's name. */
export function defaultCloneFolder(url: string): string {
  const last = url.trim().replace(/\/+$/, "").split("/").pop() ?? "";
  return last.replace(/\.git$/, "").replace(/[^A-Za-z0-9._-]/g, "-");
}

export function GitClonePanel(props: {
  /** Runs a Git action on the Admin application: clone and install register deployments in Admin. */
  runGitAction: RunGitAction;
  /** The link to the page of an installed application. */
  applicationHref?: (application: string) => string;
}) {
  const { busy, command } = useGitCommand(props.runGitAction, noRefresh);
  const [url, setUrl] = useState("");
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState<GitRequestError | undefined>(undefined);
  const [asking, setAsking] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [cloned, setCloned] = useState<GitCloneResult | undefined>(undefined);
  const [installed, setInstalled] = useState<GitInstallClonedDeploymentResult[]>([]);
  const folder = folderName.trim() || defaultCloneFolder(url);

  const install = async (clone: GitCloneResult, deployment: GitClonedDeploymentSummary) => {
    const state = await command<GitInstallClonedDeploymentResult>("gitAction_installClonedDeployment", {
      folderName: clone.folderName,
      deploymentUuid: deployment.deploymentUuid,
    });
    if (state.status === "ok") {
      setInstalled((previous) => [...previous, state.value]);
      setError(undefined);
      return;
    }
    if (state.status === "error") {
      setError(state.error);
    }
  };

  /** Saves a typed token that the remote accepted, when asked to. */
  const saveCredential = async (host: string | undefined, credential: GitTypedCredential | undefined) => {
    if (!credential?.save || !host) {
      return;
    }
    const saved = await command<{ name: string }>("gitAction_setCredential", {
      host,
      username: credential.username,
      token: credential.token,
    });
    setNotice(savedCredentialNotice(host, saved));
  };

  const runClone = async (credential?: GitTypedCredential) => {
    setNotice(undefined);
    const host = asking;
    const state = await command<GitCloneResult>("gitAction_clone", {
      url: url.trim(),
      folderName: folder,
      ...(credential ? { credential: { username: credential.username, token: credential.token } } : {}),
    });
    if (state.status === "error") {
      if (state.error.reason === "authenticationRequired") {
        const host = String(state.error.errorContext?.host ?? "");
        setAsking(host);
        setError(credential ? { ...state.error, errorMessage: `The remote refused this token for ${host}.` } : undefined);
        return;
      }
      setAsking(undefined);
      setError(state.error);
      if (state.error.reason === "noDeploymentFound") {
        await saveCredential(host, credential); // the remote took the token: the clone is there
      }
      return;
    }
    if (state.status !== "ok") {
      return;
    }
    setAsking(undefined);
    setError(undefined);
    setCloned(state.value);
    setInstalled([]);
    await saveCredential(host, credential);
    const installable = state.value.deployments.filter((deployment) => !deployment.alreadyInstalled);
    if (state.value.deployments.length === 1 && installable.length === 1) {
      await install(state.value, installable[0]);
    }
  };

  const installedUuids = new Set(installed.map((entry) => entry.deploymentUuid));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} data-testid="git-clone-panel">
      <Typography variant="body2">
        Clone a repository holding a Miroir application, then install it. The clone goes to a folder under the
        deployment root folder of the server.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Repository URL"
          placeholder="https://github.com/owner/repository.git"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          slotProps={{ htmlInput: { "data-testid": "git-clone-url" } }}
        />
        <TextField
          size="small"
          label="Folder"
          placeholder={defaultCloneFolder(url) || "folder name"}
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          slotProps={{ htmlInput: { "data-testid": "git-clone-folder" } }}
        />
        <Button
          size="small"
          variant="contained"
          data-testid="git-clone"
          disabled={busy || asking !== undefined || url.trim() === "" || folder === ""}
          onClick={() => runClone()}
        >
          Clone
        </Button>
      </Box>
      {asking !== undefined && (
        <GitCredentialForm
          host={asking}
          actionLabel="Clone"
          busy={busy}
          onSubmit={(credential) => runClone(credential)}
          onCancel={() => {
            setAsking(undefined);
            setError(undefined);
          }}
        />
      )}
      <GitCommandError error={error} testId="git-clone-error" />
      {notice && (
        <Alert severity={notice.startsWith("Saved") ? "success" : "warning"} data-testid="git-credential-notice">
          {notice}
        </Alert>
      )}
      {cloned && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }} data-testid="git-cloned-deployments">
          <Typography variant="body2">
            Cloned in {cloned.folderName} ({cloned.branches.current ?? "detached HEAD"}).
            {cloned.deployments.length > 1 ? " Pick the deployment to install:" : ""}
          </Typography>
          {cloned.deployments.map((deployment) => {
            const done = installed.find((entry) => entry.deploymentUuid === deployment.deploymentUuid);
            return (
              <Box
                key={deployment.deploymentUuid}
                sx={{ display: "flex", gap: 1, alignItems: "center" }}
                data-testid="git-cloned-deployment"
                data-deployment={deployment.deploymentUuid}
              >
                <Typography variant="body2" sx={{ minWidth: 160 }}>
                  {deployment.name}
                </Typography>
                {done ? (
                  <Typography variant="body2" data-testid="git-installed">
                    installed
                    {props.applicationHref && (
                      <>
                        {": "}
                        <Link href={props.applicationHref(done.application)}>open its Git page</Link>
                      </>
                    )}
                  </Typography>
                ) : deployment.alreadyInstalled ? (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    already installed here
                  </Typography>
                ) : (
                  <Button
                    size="small"
                    data-testid="git-install"
                    disabled={busy || installedUuids.has(deployment.deploymentUuid)}
                    onClick={() => install(cloned, deployment)}
                  >
                    Install
                  </Button>
                )}
              </Box>
            );
          })}
          {cloned.skipped.map((skipped) => (
            <Typography key={skipped.deploymentFile} variant="body2" sx={{ opacity: 0.7 }}>
              {skipped.deploymentFile}: {skipped.reason}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
