/**
 * #679: the Git page of one application: its changes against HEAD, its history, the files of a commit
 * and the diff of one file. Read-only in this slice, apart from creating a repository. Every read goes
 * through `runGitAction`, so the page shows the same thing over a real server and over test fixtures.
 */
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";

import {
  gitLineDiff,
  type GitCommitFilesResult,
  type GitCommitSummary,
  type GitDiffLine,
  type GitDiffResult,
  type GitFileStatus,
  type GitLogResult,
  type GitPathDescription,
  type GitStatusResult,
} from "@miroir-framework/core";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { useGitRequest, type GitRequestError, type GitRequestState, type RunGitAction } from "./useGitRequest.js";

export interface GitPageViewProps {
  applicationName: string;
  /** `processCapabilities.git` of the process: without it the page shows nothing else. */
  gitEnabled: boolean;
  runGitAction: RunGitAction;
  /** Entity names by uuid, to name the instance files. */
  entityNames: Record<string, string>;
}

type Selection =
  | { kind: "change"; path: string }
  | { kind: "commit"; commit: GitCommitSummary; path?: string };

/** Unchanged lines shown around a change; longer unchanged runs are folded. */
const DIFF_CONTEXT_LINES = 3;

export function gitFileLabel(file: GitPathDescription & { path: string }, entityNames: Record<string, string>): string {
  if (!file.entityUuid) {
    return file.path;
  }
  const entity = entityNames[file.entityUuid] ?? file.entityUuid;
  return `${entity} · ${file.instanceName ?? file.instanceKey}`;
}

const changeLetter: Record<GitFileStatus["change"], string> = { added: "A", modified: "M", deleted: "D" };

function errorText(error: GitRequestError): string {
  return error.errorMessage ?? error.errorType ?? "The Git action failed";
}

function Loading(props: { state: GitRequestState<unknown> }) {
  if (props.state.status === "loading") {
    return <Typography variant="body2">Loading...</Typography>;
  }
  if (props.state.status === "error") {
    return <Alert severity="error">{errorText(props.state.error)}</Alert>;
  }
  return null;
}

// ################################################################################################
export function GitPageView(props: GitPageViewProps): React.JSX.Element {
  const miroirTheme = useMiroirTheme();
  const [generation, setGeneration] = useState(0);
  const [selection, setSelection] = useState<Selection | undefined>(undefined);
  const [initError, setInitError] = useState<string | undefined>(undefined);
  const run = props.gitEnabled ? props.runGitAction : undefined;
  const status = useGitRequest<GitStatusResult>(props.runGitAction, "gitAction_status", run && {}, generation);
  const log = useGitRequest<GitLogResult>(props.runGitAction, "gitAction_log", run && {}, generation);

  const refresh = useCallback(() => {
    setSelection(undefined);
    setGeneration((current) => current + 1);
  }, []);
  const initRepository = useCallback(async () => {
    const result = await props.runGitAction("gitAction_init");
    const failed = (result as { status?: string })?.status !== "ok";
    setInitError(failed ? String((result as { errorMessage?: string }).errorMessage ?? "init failed") : undefined);
    refresh();
  }, [props.runGitAction, refresh]);

  if (!props.gitEnabled) {
    return (
      <Alert severity="info" data-testid="git-unavailable">
        Git is off in this Miroir process. Start it with the <code>git</code> feature on to use the Git page.
      </Alert>
    );
  }
  const textColor = miroirTheme.currentTheme.colors.text;
  const notARepository = status.status === "error" && status.error.reason === "notARepository";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, color: textColor }} data-testid="git-page">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {props.applicationName}: Git
        </Typography>
        {status.status === "ok" && (
          <Chip
            size="small"
            label={status.value.branches.current ?? `detached at ${status.value.branches.head?.slice(0, 7) ?? "?"}`}
            data-testid="git-current-branch"
          />
        )}
        <Button size="small" onClick={refresh}>
          Refresh
        </Button>
      </Box>
      {status.status === "ok" && (
        <Typography variant="body2" sx={{ opacity: 0.7 }} data-testid="git-root">
          Repository: {status.value.root}
        </Typography>
      )}
      {notARepository ? (
        <Box data-testid="git-no-repository">
          <Typography variant="body1">The files of this application are not in a Git repository.</Typography>
          {typeof status.error.errorContext?.directory === "string" && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Folder: {status.error.errorContext.directory}
            </Typography>
          )}
          <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={initRepository}>
            Create a Git repository
          </Button>
          {initError && <Alert severity="error">{initError}</Alert>}
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
            <Panel title="Changes" testId="git-changes">
              {status.status === "ok" ? (
                <ChangeList
                  files={status.value.files}
                  entityNames={props.entityNames}
                  selected={selection?.kind === "change" ? selection.path : undefined}
                  onSelect={(path) => setSelection({ kind: "change", path })}
                />
              ) : (
                <Loading state={status} />
              )}
            </Panel>
            <Panel title="History" testId="git-history">
              {log.status === "ok" ? (
                <CommitList
                  commits={log.value.commits}
                  selected={selection?.kind === "commit" ? selection.commit.oid : undefined}
                  onSelect={(commit) => setSelection({ kind: "commit", commit })}
                />
              ) : (
                <Loading state={log} />
              )}
            </Panel>
          </Box>
          {selection?.kind === "commit" && (
            <CommitFilesPanel
              runGitAction={props.runGitAction}
              commit={selection.commit}
              generation={generation}
              entityNames={props.entityNames}
              selected={selection.path}
              onSelect={(path) => setSelection({ ...selection, path })}
            />
          )}
          {selection && (selection.kind === "change" || selection.path) && (
            <DiffPanel
              runGitAction={props.runGitAction}
              selection={selection}
              generation={generation}
              entityNames={props.entityNames}
            />
          )}
        </>
      )}
    </Box>
  );
}

// ################################################################################################
function Panel(props: { title: string; testId: string; children: React.ReactNode }) {
  const miroirTheme = useMiroirTheme();
  return (
    <Box
      data-testid={props.testId}
      sx={{
        flex: "1 1 360px",
        minWidth: 0,
        border: `1px solid ${miroirTheme.currentTheme.colors.border ?? "#ccc"}`,
        borderRadius: 1,
        p: 1,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {props.title}
      </Typography>
      {props.children}
    </Box>
  );
}

function Row(props: { selected: boolean; onClick: () => void; testId: string; children: React.ReactNode }) {
  const miroirTheme = useMiroirTheme();
  return (
    <Box
      role="button"
      tabIndex={0}
      data-testid={props.testId}
      onClick={props.onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          props.onClick();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 0.5,
        py: 0.25,
        cursor: "pointer",
        borderRadius: 0.5,
        backgroundColor: props.selected ? miroirTheme.currentTheme.colors.selected ?? "rgba(0,0,0,0.08)" : undefined,
        "&:hover": { backgroundColor: miroirTheme.currentTheme.colors.hover ?? "rgba(0,0,0,0.04)" },
      }}
    >
      {props.children}
    </Box>
  );
}

function ChangeList(props: {
  files: GitStatusResult["files"];
  entityNames: Record<string, string>;
  selected?: string;
  onSelect: (path: string) => void;
}) {
  if (props.files.length === 0) {
    return <Typography variant="body2">No change since the last commit.</Typography>;
  }
  return (
    <Box>
      {props.files.map((file) => (
        <Row
          key={file.path}
          testId={`git-change-${file.path}`}
          selected={props.selected === file.path}
          onClick={() => props.onSelect(file.path)}
        >
          <Chip size="small" label={changeLetter[file.change]} title={file.change} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {gitFileLabel(file, props.entityNames)}
            </Typography>
            {file.entityUuid && (
              <Typography variant="caption" noWrap sx={{ opacity: 0.6, display: "block" }}>
                {file.path}
              </Typography>
            )}
          </Box>
          {file.staged && <Chip size="small" variant="outlined" label="staged" />}
        </Row>
      ))}
    </Box>
  );
}

function CommitList(props: {
  commits: GitCommitSummary[];
  selected?: string;
  onSelect: (commit: GitCommitSummary) => void;
}) {
  if (props.commits.length === 0) {
    return <Typography variant="body2">No commit yet.</Typography>;
  }
  return (
    <Box>
      {props.commits.map((commit) => (
        <Row
          key={commit.oid}
          testId={`git-commit-${commit.oid}`}
          selected={props.selected === commit.oid}
          onClick={() => props.onSelect(commit)}
        >
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {commit.oid.slice(0, 7)}
          </Typography>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap>
              {commit.message.split("\n")[0]}
            </Typography>
            <Typography variant="caption" noWrap sx={{ opacity: 0.6, display: "block" }}>
              {commit.author.name}, {new Date(commit.author.timestamp * 1000).toLocaleString()}
            </Typography>
          </Box>
          {commit.refs.map((ref) => (
            <Chip key={ref} size="small" variant="outlined" label={ref} />
          ))}
        </Row>
      ))}
    </Box>
  );
}

function CommitFilesPanel(props: {
  runGitAction: RunGitAction;
  commit: GitCommitSummary;
  generation: number;
  entityNames: Record<string, string>;
  selected?: string;
  onSelect: (path: string) => void;
}) {
  const payload = useMemo(() => ({ oid: props.commit.oid }), [props.commit.oid]);
  const files = useGitRequest<GitCommitFilesResult>(props.runGitAction, "gitAction_commitFiles", payload, props.generation);
  return (
    <Panel title={`Files of ${props.commit.oid.slice(0, 7)}: ${props.commit.message.split("\n")[0]}`} testId="git-commit-files">
      {files.status === "ok" ? (
        files.value.files.map((file) => (
          <Row
            key={file.path}
            testId={`git-commit-file-${file.path}`}
            selected={props.selected === file.path}
            onClick={() => props.onSelect(file.path)}
          >
            <Typography variant="body2" noWrap>
              {gitFileLabel(file, props.entityNames)}
            </Typography>
          </Row>
        ))
      ) : (
        <Loading state={files} />
      )}
    </Panel>
  );
}

/** The diff payload of a selection: HEAD against the work tree, or a commit against its first parent. */
function diffPayload(selection: Selection): { path: string; from?: string; to?: string } | undefined {
  if (selection.kind === "change") {
    return { path: selection.path };
  }
  if (!selection.path) {
    return undefined;
  }
  const parent = selection.commit.parents[0];
  // a root commit: its own text on both sides, shown as added
  return { path: selection.path, from: parent ?? selection.commit.oid, to: selection.commit.oid };
}

function DiffPanel(props: {
  runGitAction: RunGitAction;
  selection: Selection;
  generation: number;
  entityNames: Record<string, string>;
}) {
  const payload = diffPayload(props.selection);
  const diff = useGitRequest<GitDiffResult>(props.runGitAction, "gitAction_diff", payload, props.generation);
  const rootCommit = props.selection.kind === "commit" && props.selection.commit.parents.length === 0;
  const lines = useMemo(
    () => (diff.status === "ok" ? gitLineDiff(rootCommit ? undefined : diff.value.before, diff.value.after) : []),
    [diff, rootCommit],
  );
  return (
    <Panel title={diff.status === "ok" ? `Diff: ${gitFileLabel(diff.value, props.entityNames)}` : "Diff"} testId="git-diff">
      {diff.status === "ok" ? <DiffLines lines={lines} /> : <Loading state={diff} />}
    </Panel>
  );
}

type FoldedLine = GitDiffLine | { kind: "folded"; count: number };

/** Folds the unchanged runs that are more than `DIFF_CONTEXT_LINES` away from a change. */
export function foldDiffLines(lines: GitDiffLine[], context = DIFF_CONTEXT_LINES): FoldedLine[] {
  const nearChange = lines.map(() => false);
  lines.forEach((line, index) => {
    if (line.kind !== "same") {
      for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k++) {
        nearChange[k] = true;
      }
    }
  });
  const result: FoldedLine[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (nearChange[index]) {
      result.push(lines[index]);
      continue;
    }
    const last = result[result.length - 1];
    if (last?.kind === "folded") {
      last.count++;
    } else {
      result.push({ kind: "folded", count: 1 });
    }
  }
  return result;
}

function DiffLines(props: { lines: GitDiffLine[] }) {
  const miroirTheme = useMiroirTheme();
  const colors = miroirTheme.currentTheme.colors;
  if (!props.lines.some((line) => line.kind !== "same")) {
    return <Typography variant="body2">No difference.</Typography>;
  }
  return (
    <Box component="pre" sx={{ fontFamily: "monospace", fontSize: "0.8rem", m: 0, overflowX: "auto" }}>
      {foldDiffLines(props.lines).map((line, index) =>
        line.kind === "folded" ? (
          <Box key={index} sx={{ opacity: 0.5 }}>
            {`  ... ${line.count} unchanged line${line.count === 1 ? "" : "s"}`}
          </Box>
        ) : (
          <Box
            key={index}
            data-diff={line.kind}
            sx={{
              backgroundColor:
                line.kind === "added"
                  ? colors.successLight ?? "rgba(0,160,0,0.15)"
                  : line.kind === "removed"
                    ? colors.errorLight ?? "rgba(200,0,0,0.15)"
                    : undefined,
            }}
          >
            {`${line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "} ${line.text}`}
          </Box>
        ),
      )}
    </Box>
  );
}
