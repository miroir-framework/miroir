/**
 * #679: the Git page's remote controls: the URL of `origin`, how far the current branch is from its
 * upstream, Fetch, Pull and Push. A remote asking for a token opens the credential form, which retries the
 * action with the typed token and, when asked, saves it as the Admin secret `git.<host>`.
 */
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

import type { GitPullResult, GitRemoteResult, GitStatusResult } from "@miroir-framework/core";

import { GitCommandError } from "./GitWritePanels.js";
import type { GitCommand } from "./useGitCommand.js";
import type { GitRequestError, GitRequestState } from "./useGitRequest.js";

type RemoteActionType = "gitAction_fetch" | "gitAction_pull" | "gitAction_push";

const actionLabels: Record<RemoteActionType, string> = {
  gitAction_fetch: "Fetch",
  gitAction_pull: "Pull",
  gitAction_push: "Push",
};

function needsCredential(error: GitRequestError): boolean {
  return error.reason === "authenticationRequired";
}

export function GitRemotePanel(props: {
  status: GitStatusResult;
  busy: boolean;
  command: GitCommand;
  /** Called with the applications a pull changed but the local cache could not reload. */
  onReloadFailures: (failures: { application: string; errorMessage?: string }[]) => void;
  /**
   * What became of a typed credential, kept by the page: a successful action refreshes the status, which
   * unmounts this panel while it reloads.
   */
  notice: string | undefined;
  onNotice: (notice: string | undefined) => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<GitRequestError | undefined>(undefined);
  /** The action waiting for a credential, and the host asking for it. */
  const [asking, setAsking] = useState<{ actionType: RemoteActionType; host: string } | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [save, setSave] = useState(true);
  const { remoteUrl, tracking, branches } = props.status;

  const settle = (state: GitRequestState<GitRemoteResult | GitPullResult>) => {
    if (state.status === "ok") {
      setError(undefined);
      props.onReloadFailures((state.value as GitPullResult).reloadFailures ?? []);
      return;
    }
    if (state.status === "error") {
      setError(state.error);
    }
  };

  const runRemote = async (actionType: RemoteActionType) => {
    props.onNotice(undefined);
    const state = await props.command<GitRemoteResult | GitPullResult>(actionType);
    if (state.status === "error" && needsCredential(state.error)) {
      setAsking({ actionType, host: String(state.error.errorContext?.host ?? "") });
      setError(undefined);
      return;
    }
    settle(state);
  };

  const retryWithCredential = async () => {
    if (!asking) {
      return;
    }
    const credential = { username: username.trim(), token };
    const state = await props.command<GitRemoteResult | GitPullResult>(asking.actionType, { credential });
    if (state.status === "error" && needsCredential(state.error)) {
      setError({ ...state.error, errorMessage: `The remote refused this token for ${asking.host}.` });
      return;
    }
    // any other outcome closes the form; the token is saved only after the action succeeded with it
    const host = asking.host;
    setAsking(undefined);
    setToken("");
    settle(state);
    if (state.status !== "ok") {
      return;
    }
    if (!save) {
      return;
    }
    const saved = await props.command<{ name: string }>("gitAction_setCredential", {
      host,
      username: credential.username,
      token: credential.token,
    });
    props.onNotice(
      saved.status === "ok"
        ? `Saved as the secret ${saved.value.name}: the next actions on ${host} use it.`
        : `The token worked but was not saved: ${saved.status === "error" ? (saved.error.errorMessage ?? saved.error.reason) : ""}`,
    );
  };

  const setRemote = async () => {
    const state = await props.command<GitRemoteResult>("gitAction_setRemote", { url: url.trim() });
    if (state.status === "ok") {
      setUrl("");
    }
    setError(state.status === "error" ? state.error : undefined);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {remoteUrl ? (
        <Typography variant="body2" sx={{ wordBreak: "break-all" }} data-testid="git-remote-url-text">
          origin: {remoteUrl}
        </Typography>
      ) : (
        <Typography variant="body2" data-testid="git-no-remote">
          This repository has no remote. Give the HTTPS URL of a repository to fetch from and push to.
        </Typography>
      )}
      {tracking ? (
        <Box
          sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}
          data-testid="git-tracking"
          data-ahead={String(tracking.ahead)}
          data-behind={String(tracking.behind)}
        >
          <Typography variant="body2">{branches.current} follows {tracking.upstream}:</Typography>
          <Chip size="small" label={`${tracking.ahead} to push`} />
          <Chip size="small" label={`${tracking.behind} to pull`} />
        </Box>
      ) : (
        remoteUrl &&
        branches.current && (
          <Typography variant="body2" sx={{ opacity: 0.7 }} data-testid="git-no-upstream">
            {branches.current} follows no remote branch yet: Push publishes it.
          </Typography>
        )
      )}
      {remoteUrl && (
        <Box sx={{ display: "flex", gap: 1 }}>
          {(Object.keys(actionLabels) as RemoteActionType[]).map((actionType) => (
            <Button
              key={actionType}
              size="small"
              variant={actionType === "gitAction_fetch" ? "outlined" : "contained"}
              data-testid={`git-${actionLabels[actionType].toLowerCase()}`}
              disabled={props.busy || asking !== undefined}
              onClick={() => runRemote(actionType)}
            >
              {actionLabels[actionType]}
            </Button>
          ))}
        </Box>
      )}
      {asking && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} data-testid="git-credential-form">
          <Typography variant="body2">
            {asking.host} asks for a username and a token (a personal access token, not your password).
          </Typography>
          <TextField
            size="small"
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            slotProps={{ htmlInput: { "data-testid": "git-credential-username", autoComplete: "username" } }}
          />
          <TextField
            size="small"
            label="Token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            slotProps={{ htmlInput: { "data-testid": "git-credential-token", autoComplete: "off" } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={save}
                onChange={(event) => setSave(event.target.checked)}
                slotProps={{ input: { "data-testid": "git-credential-save" } as React.InputHTMLAttributes<HTMLInputElement> }}
              />
            }
            label={`Save it as a Miroir secret for ${asking.host}`}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              data-testid="git-credential-retry"
              disabled={props.busy || username.trim() === "" || token === ""}
              onClick={retryWithCredential}
            >
              {actionLabels[asking.actionType]}
            </Button>
            <Button
              size="small"
              data-testid="git-credential-cancel"
              onClick={() => {
                setAsking(undefined);
                setToken("");
                setError(undefined);
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
      <GitCommandError error={error} testId="git-remote-error" />
      {props.notice && (
        <Alert severity={props.notice.startsWith("Saved") ? "success" : "warning"} data-testid="git-credential-notice">
          {props.notice}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          size="small"
          label={remoteUrl ? "Change the URL" : "Remote URL"}
          placeholder="https://github.com/owner/repository.git"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          slotProps={{ htmlInput: { "data-testid": "git-remote-url" } }}
        />
        <Button size="small" data-testid="git-set-remote" disabled={props.busy || url.trim() === ""} onClick={setRemote}>
          Set
        </Button>
      </Box>
    </Box>
  );
}
