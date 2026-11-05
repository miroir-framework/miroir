/**
 * #679: the Git page controls that change the repository: the commit form under the changes, the branch
 * list, and the messages of the refusals the page explains (Miroir changes not saved, checkout conflict).
 */
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, TextField, Typography } from "@mui/material";
import React, { useState } from "react";

import type { GitBranches, GitCommitResult, GitStatusResult } from "@miroir-framework/core";

import type { GitCommand } from "./useGitCommand.js";
import type { GitRequestError } from "./useGitRequest.js";

/** The text of a refused Git action, worded for the reasons the designer can act on. */
export function gitCommandErrorText(error: GitRequestError): string {
  const paths = Array.isArray(error.errorContext?.paths) ? (error.errorContext.paths as string[]) : [];
  switch (error.reason) {
    case "openMiroirTransaction":
      return "Commit the Miroir changes first: some edits are not saved to the files yet.";
    case "checkoutConflict":
      return `Uncommitted changes would be overwritten by the checkout: commit or discard them first (${paths.join(", ")}).`;
    case "otherStagedChanges":
      return `Files outside this application are staged too: ${paths.join(", ")}.`;
    case "branchNotMerged":
      return `${String(error.errorContext?.name ?? "This branch")} has commits the current branch does not have: deleting it loses them.`;
    default:
      return error.errorMessage ?? error.errorType ?? "The Git action failed";
  }
}

export function GitCommandError(props: { error: GitRequestError | undefined; testId: string }) {
  if (!props.error) {
    return null;
  }
  return (
    <Alert severity="warning" data-testid={props.testId} data-reason={props.error.reason}>
      {gitCommandErrorText(props.error)}
    </Alert>
  );
}

// ################################################################################################
export function GitCommitForm(props: { status: GitStatusResult; busy: boolean; command: GitCommand }) {
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  // off by default: the repository's user.name / user.email also apply to commits made outside Miroir
  const [rememberAuthor, setRememberAuthor] = useState(false);
  const [error, setError] = useState<GitRequestError | undefined>(undefined);
  const [askAuthor, setAskAuthor] = useState(false);
  const stagedCount = props.status.files.filter((file) => file.staged).length;

  const commit = async (includeOtherStagedChanges: boolean) => {
    const author = askAuthor && authorName.trim() !== "" ? { name: authorName, email: authorEmail } : undefined;
    const result = await props.command<GitCommitResult>("gitAction_commit", {
      message,
      ...(author ? { author, rememberAuthor } : {}),
      ...(includeOtherStagedChanges ? { includeOtherStagedChanges: true } : {}),
    });
    if (result.status === "ok") {
      setMessage("");
      setError(undefined);
      setAskAuthor(false);
      return;
    }
    if (result.status === "error") {
      setError(result.error);
      if (result.error.reason === "authorUnknown") {
        setAskAuthor(true);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }} data-testid="git-commit-form">
      <TextField
        size="small"
        label="Commit message"
        multiline
        minRows={1}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        slotProps={{ htmlInput: { "data-testid": "git-commit-message" } }}
      />
      {askAuthor && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }} data-testid="git-commit-author">
          <TextField
            size="small"
            label="Author name"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            slotProps={{ htmlInput: { "data-testid": "git-author-name" } }}
          />
          <TextField
            size="small"
            label="Author email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            slotProps={{ htmlInput: { "data-testid": "git-author-email" } }}
          />
          <FormControlLabel
            control={
              <Checkbox size="small" checked={rememberAuthor} onChange={(event) => setRememberAuthor(event.target.checked)} />
            }
            label="Remember for this repository"
          />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button
          variant="contained"
          size="small"
          data-testid="git-commit"
          disabled={props.busy || stagedCount === 0 || message.trim() === ""}
          onClick={() => commit(false)}
        >
          Commit {stagedCount} file{stagedCount === 1 ? "" : "s"}
        </Button>
        {error?.reason === "otherStagedChanges" && (
          <Button size="small" data-testid="git-commit-include-others" disabled={props.busy} onClick={() => commit(true)}>
            Commit them too
          </Button>
        )}
      </Box>
      {error?.reason !== "authorUnknown" && <GitCommandError error={error} testId="git-commit-error" />}
      {error?.reason === "authorUnknown" && (
        <Typography variant="body2" data-testid="git-commit-error" data-reason="authorUnknown">
          Who is the author of this commit? No user is logged in and the repository has no author set.
        </Typography>
      )}
    </Box>
  );
}

// ################################################################################################
export function GitBranchList(props: {
  branches: GitBranches;
  busy: boolean;
  command: GitCommand;
  onCheckout: (ref: string) => void;
}) {
  const [newBranch, setNewBranch] = useState("");
  const [error, setError] = useState<GitRequestError | undefined>(undefined);
  const run = async (actionType: "gitAction_createBranch" | "gitAction_deleteBranch", name: string, force = false) => {
    const result = await props.command(actionType, force ? { name, force: true } : { name });
    setError(result.status === "error" ? result.error : undefined);
    if (result.status === "ok" && actionType === "gitAction_createBranch") {
      setNewBranch("");
    }
  };
  const { current, local, remote, tags } = props.branches;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {local.map((branch) => (
        <Box key={branch} sx={{ display: "flex", alignItems: "center", gap: 1 }} data-testid={`git-branch-${branch}`}>
          <Typography variant="body2" sx={{ fontWeight: branch === current ? 600 : undefined }}>
            {branch}
          </Typography>
          {branch === current ? (
            <Chip size="small" label="current" />
          ) : (
            <>
              <Button
                size="small"
                data-testid={`git-checkout-${branch}`}
                disabled={props.busy}
                onClick={() => props.onCheckout(branch)}
              >
                Check out
              </Button>
              <Button
                size="small"
                color="error"
                data-testid={`git-delete-branch-${branch}`}
                disabled={props.busy}
                onClick={() => run("gitAction_deleteBranch", branch)}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      ))}
      {[...remote, ...tags].map((ref) => (
        <Box key={ref} sx={{ display: "flex", alignItems: "center", gap: 1 }} data-testid={`git-ref-${ref}`}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {tags.includes(ref) ? `${ref} (tag)` : ref}
          </Typography>
          <Button size="small" data-testid={`git-checkout-${ref}`} disabled={props.busy} onClick={() => props.onCheckout(ref)}>
            Check out
          </Button>
        </Box>
      ))}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
        <TextField
          size="small"
          label="New branch"
          value={newBranch}
          onChange={(event) => setNewBranch(event.target.value)}
          slotProps={{ htmlInput: { "data-testid": "git-new-branch-name" } }}
        />
        <Button
          size="small"
          data-testid="git-create-branch"
          disabled={props.busy || newBranch.trim() === ""}
          onClick={() => run("gitAction_createBranch", newBranch)}
        >
          Create
        </Button>
      </Box>
      <GitCommandError error={error} testId="git-branch-error" />
      {error?.reason === "branchNotMerged" && typeof error.errorContext?.name === "string" && (
        <Button
          size="small"
          color="error"
          data-testid="git-delete-branch-anyway"
          disabled={props.busy}
          onClick={() => run("gitAction_deleteBranch", error.errorContext!.name as string, true)}
        >
          Delete {error.errorContext.name} anyway
        </Button>
      )}
    </Box>
  );
}

/** The banner of a detached HEAD, with the way back to a branch. */
export function GitDetachedBanner(props: {
  branches: GitBranches;
  backTo: string | undefined;
  busy: boolean;
  onCheckout: (ref: string) => void;
}) {
  if (props.branches.current !== undefined || props.branches.head === undefined) {
    return null;
  }
  return (
    <Alert
      severity="info"
      data-testid="git-detached"
      action={
        props.backTo ? (
          <Button size="small" data-testid="git-back-to-branch" disabled={props.busy} onClick={() => props.onCheckout(props.backTo!)}>
            Back to {props.backTo}
          </Button>
        ) : undefined
      }
    >
      HEAD is detached at {props.branches.head.slice(0, 7)}: the files show that commit, and a commit made now belongs to
      no branch.
    </Alert>
  );
}
