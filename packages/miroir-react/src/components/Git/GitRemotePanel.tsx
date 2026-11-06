/**
 * #679, #691: the remote of the repository, on the Setup tab: set the URL of `origin`, or change the URL
 * of the remote shown. Fetch, Pull and Push are in the page header (`GitHeader`).
 */
import { Box, Button, TextField } from "@mui/material";
import React, { useState } from "react";

import type { GitRemoteResult, GitStatusResult } from "@miroir-framework/core";

import { GitCommandError } from "./GitWritePanels.js";
import type { GitCommand } from "./useGitCommand.js";
import type { GitRequestError } from "./useGitRequest.js";

export function GitRemotePanel(props: { status: GitStatusResult; busy: boolean; command: GitCommand }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<GitRequestError | undefined>(undefined);
  const { remote, remoteUrl } = props.status;

  const setRemote = async () => {
    const state = await props.command<GitRemoteResult>("gitAction_setRemote", {
      url: url.trim(),
      // the remote shown: changing the URL of an `upstream` remote does not add an `origin`
      ...(remote ? { remote } : {}),
    });
    if (state.status === "ok") {
      setUrl("");
    }
    setError(state.status === "error" ? state.error : undefined);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
      <GitCommandError error={error} testId="git-set-remote-error" />
    </Box>
  );
}
