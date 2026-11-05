/**
 * #679: the Git page of one application: its changes against HEAD, staged and committed from here, its
 * history, its branches, the files of a commit and the diff of one file. Every Git action goes through
 * `runGitAction`, so the page shows the same thing over a real server and over test fixtures; after a
 * checkout, the DomainController reloads the deployments whose files changed.
 */
import { Alert, Box, Button, Checkbox, Chip, Tab, Tabs, Typography } from "@mui/material";
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
  type GitActionType,
  type GitCheckoutResult,
  type GitRevertOutcome,
  type GitRevertResult,
  type GitStatusResult,
} from "@miroir-framework/core";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { useGitCommand } from "./useGitCommand.js";
import { useGitRequest, type GitRequestError, type GitRequestState, type RunGitAction } from "./useGitRequest.js";
import {
  emptyGitCommitDraft,
  GitBranchList,
  GitCommandError,
  GitCommitForm,
  GitDetachedBanner,
  type GitCommitDraft,
} from "./GitWritePanels.js";
import { GitHeader } from "./GitHeader.js";
import { GitHistoryStrip } from "./GitHistoryStrip.js";
import { GitRemotePanel } from "./GitRemotePanel.js";

export interface GitPageViewProps {
  applicationName: string;
  /** `processCapabilities.git` of the process: without it the page shows nothing else. */
  gitEnabled: boolean;
  runGitAction: RunGitAction;
  /** Entity names by uuid, to name the instance files. */
  entityNames: Record<string, string>;
  /**
   * #691: the activity shown, `changes` (the default, also for an unknown value), `branches` or `setup`.
   * Without `onViewChange` the page keeps the tab it is switched to itself.
   */
  view?: string;
  onViewChange?: (view: GitPageViewName) => void;
  /** #691: more Setup content, such as the Clone panel, whose actions run on Admin. */
  setupExtras?: React.ReactNode;
}

export const GIT_PAGE_VIEWS = ["changes", "branches", "setup"] as const;
export type GitPageViewName = (typeof GIT_PAGE_VIEWS)[number];

/** The activity named by a `view` URL parameter: Changes for a missing or unknown one. */
export function gitPageView(view: string | undefined): GitPageViewName {
  return (GIT_PAGE_VIEWS as readonly string[]).includes(view ?? "") ? (view as GitPageViewName) : "changes";
}

const viewLabels: Record<GitPageViewName, string> = { changes: "Changes", branches: "Branches", setup: "Setup" };

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
  /** #691: the change selected on the Changes tab, and the commit (and file) selected in the history. */
  const [selectedChange, setSelectedChange] = useState<string | undefined>(undefined);
  const [selectedCommit, setSelectedCommit] = useState<{ commit: GitCommitSummary; path?: string } | undefined>(
    undefined,
  );
  const [historyUnfolded, setHistoryUnfolded] = useState(false);
  const [initError, setInitError] = useState<string | undefined>(undefined);
  const [ownView, setOwnView] = useState<GitPageViewName>(() => gitPageView(props.view));
  const view = props.onViewChange ? gitPageView(props.view) : ownView;
  // #691: the Setup extras (the Clone panel) stay mounted once opened, hidden on the other tabs: a clone's
  // result, with its Install buttons, must survive a tab change. Derived during render, no effect needed.
  const [setupOpened, setSetupOpened] = useState(view === "setup");
  if (view === "setup" && !setupOpened) {
    setSetupOpened(true);
  }
  const changeView = props.onViewChange ?? setOwnView;
  const run = props.gitEnabled ? props.runGitAction : undefined;
  const status = useGitRequest<GitStatusResult>(props.runGitAction, "gitAction_status", run && {}, generation);
  const log = useGitRequest<GitLogResult>(props.runGitAction, "gitAction_log", run && {}, generation);

  const [checkoutError, setCheckoutError] = useState<GitRequestError | undefined>(undefined);
  const [stageError, setStageError] = useState<GitRequestError | undefined>(undefined);
  /** #691: the files a revert waits for confirmation on. */
  const [revertRequest, setRevertRequest] = useState<
    { files: GitStatusResult["files"] } | undefined
  >(undefined);
  const [revertError, setRevertError] = useState<GitRequestError | undefined>(undefined);
  const [commitDraft, setCommitDraft] = useState<GitCommitDraft>(emptyGitCommitDraft);
  const changeCommitDraft = useCallback(
    (change: Partial<GitCommitDraft>) => setCommitDraft((current) => ({ ...current, ...change })),
    [],
  );
  /** The branch left by the last checkout, offered as the way back from a detached HEAD. */
  const [previousBranch, setPreviousBranch] = useState<string | undefined>(undefined);

  const refresh = useCallback(() => {
    setSelectedChange(undefined);
    setSelectedCommit(undefined);
    // the files a confirmation listed may have changed
    setRevertRequest(undefined);
    setGeneration((current) => current + 1);
  }, []);
  // a staging change keeps the selected file; any other change may remove it
  const onCommandSuccess = useCallback(
    (actionType: GitActionType) =>
      actionType === "gitAction_stage" || actionType === "gitAction_unstage"
        ? setGeneration((current) => current + 1)
        : refresh(),
    [refresh],
  );
  const { busy, command } = useGitCommand(props.runGitAction, onCommandSuccess);
  const stage = useCallback(
    async (payload: Record<string, unknown>, staging: boolean) => {
      const result = await command(staging ? "gitAction_stage" : "gitAction_unstage", payload);
      setStageError(result.status === "error" ? result.error : undefined);
    },
    [command],
  );
  const currentBranch = status.status === "ok" ? status.value.branches.current : undefined;
  const [reloadWarning, setReloadWarning] = useState<string | undefined>(undefined);
  const [remoteNotice, setRemoteNotice] = useState<string | undefined>(undefined);
  const showReloadFailures = useCallback(
    (failures: { application: string; errorMessage?: string }[]) =>
      setReloadWarning(
        failures.length > 0
          ? `The files changed, but Miroir could not reload them: ${failures.map((failure) => failure.errorMessage ?? failure.application).join("; ")}`
          : undefined,
      ),
    [],
  );
  const revert = useCallback(
    async (request: { files: GitStatusResult["files"] }) => {
      setRevertRequest(undefined);
      // the files the confirmation listed, even for "Revert all": a file changed since is not reverted unseen
      const result = await command<GitRevertResult>("gitAction_revert", {
        paths: request.files.map((file) => file.path),
      });
      if (result.status === "ok") {
        setRevertError(undefined);
        showReloadFailures(result.value.reloadFailures ?? []);
        return;
      }
      if (result.status !== "error") {
        return;
      }
      setRevertError(result.error);
      // a revert that failed halfway changed some files: show them as they are now, and any reload failure
      const context = result.error.errorContext;
      if (Array.isArray(context?.touchedDeployments)) {
        showReloadFailures(
          Array.isArray(context.reloadFailures)
            ? (context.reloadFailures as { application: string; errorMessage?: string }[])
            : [],
        );
        refresh();
        return;
      }
      showReloadFailures([]);
    },
    [command, refresh, showReloadFailures],
  );
  const checkout = useCallback(
    async (ref: string) => {
      const result = await command<GitCheckoutResult>("gitAction_checkout", { ref });
      setCheckoutError(result.status === "error" ? result.error : undefined);
      showReloadFailures(result.status === "ok" ? (result.value.reloadFailures ?? []) : []);
      if (result.status === "ok" && currentBranch) {
        setPreviousBranch(currentBranch);
      }
    },
    [command, currentBranch, showReloadFailures],
  );
  // a checkout waits for the status, which tells which branch it leaves
  const statusStale = status.status === "ok" && status.stale === true;
  const checkoutBusy = busy || status.status !== "ok" || statusStale;
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
      <GitHeader
        applicationName={props.applicationName}
        status={status.status === "ok" ? status.value : undefined}
        onRefresh={refresh}
        busy={checkoutBusy}
        command={command}
        onReloadFailures={showReloadFailures}
        notice={remoteNotice}
        onNotice={setRemoteNotice}
        onOpenSetup={() => changeView("setup")}
      />
      {status.status !== "ok" && !notARepository && <Loading state={status} />}
      {!notARepository && status.status === "ok" && (
        <GitDetachedBanner
          branches={status.value.branches}
          backTo={backToBranch(status.value.branches, previousBranch)}
          busy={checkoutBusy}
          onCheckout={checkout}
        />
      )}
      <GitCommandError error={checkoutError} testId="git-checkout-error" />
      {reloadWarning && (
        <Alert severity="warning" data-testid="git-reload-warning">
          {reloadWarning}
        </Alert>
      )}
      <Tabs value={view} onChange={(_event, value: GitPageViewName) => changeView(value)}>
        {GIT_PAGE_VIEWS.map((name) => (
          <Tab key={name} value={name} label={viewLabels[name]} data-testid={`git-tab-${name}`} />
        ))}
      </Tabs>
      {view !== "setup" && notARepository && (
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
      )}
      {view === "changes" && !notARepository && (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Panel
            title="Changes"
            testId="git-changes"
            actions={
              status.status === "ok" &&
              status.value.files.some((file) => file.inApplication && file.unstaged) && (
                <>
                  <Button size="small" data-testid="git-stage-all" disabled={busy} onClick={() => stage({ all: true }, true)}>
                    Stage all
                  </Button>
                  <Button
                    size="small"
                    color="warning"
                    data-testid="git-revert-all"
                    disabled={busy}
                    onClick={() =>
                      setRevertRequest({
                        files: status.value.files.filter((file) => file.inApplication && file.unstaged),
                      })
                    }
                  >
                    Revert all
                  </Button>
                </>
              )
            }
          >
            {status.status === "ok" && (
              <>
                <ChangeList
                  files={status.value.files}
                  entityNames={props.entityNames}
                  selected={selectedChange}
                  onSelect={setSelectedChange}
                  busy={busy}
                  onToggleStaged={(file) => stage({ paths: [file.path] }, file.unstaged)}
                  onRevert={(file) => setRevertRequest({ files: [file] })}
                />
                {revertRequest && (
                  <GitRevertConfirm
                    files={revertRequest.files}
                    entityNames={props.entityNames}
                    busy={busy}
                    onApply={() => revert(revertRequest)}
                    onCancel={() => setRevertRequest(undefined)}
                  />
                )}
                <GitCommandError error={revertError} testId="git-revert-error" />
                <GitCommandError error={stageError} testId="git-stage-error" />
                <GitCommitForm
                  status={status.value}
                  busy={busy || statusStale}
                  command={command}
                  draft={commitDraft}
                  onDraftChange={changeCommitDraft}
                />
              </>
            )}
          </Panel>
          {selectedChange && (
            <DiffPanel
              runGitAction={props.runGitAction}
              selection={{ kind: "change", path: selectedChange }}
              generation={generation}
              entityNames={props.entityNames}
            />
          )}
        </Box>
      )}
      {view === "branches" && !notARepository && (
        <Panel title="Branches" testId="git-branches" flex="0 0 auto">
          {status.status === "ok" && (
            <GitBranchList branches={status.value.branches} busy={checkoutBusy} command={command} onCheckout={checkout} />
          )}
        </Panel>
      )}
      {view === "setup" && !notARepository && status.status === "ok" && (
        <Panel title="Remote" testId="git-remote" flex="0 0 auto">
          <GitRemotePanel status={status.value} busy={checkoutBusy} command={command} />
        </Panel>
      )}
      {setupOpened && props.setupExtras && (
        <Box data-testid="git-setup-extras" sx={{ display: view === "setup" ? "block" : "none" }}>
          {props.setupExtras}
        </Box>
      )}
      {!notARepository && (
        <GitHistoryStrip
          commits={log.status === "ok" ? log.value.commits : undefined}
          unfolded={historyUnfolded}
          onToggle={() => setHistoryUnfolded((unfolded) => !unfolded)}
        />
      )}
      {!notARepository && historyUnfolded && (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Panel title="History" testId="git-history">
            {log.status === "ok" ? (
              <CommitList
                commits={log.value.commits}
                selected={selectedCommit?.commit.oid}
                onSelect={(commit) => setSelectedCommit({ commit })}
              />
            ) : (
              <Loading state={log} />
            )}
          </Panel>
          {selectedCommit && (
            <CommitFilesPanel
              runGitAction={props.runGitAction}
              commit={selectedCommit.commit}
              generation={generation}
              entityNames={props.entityNames}
              selected={selectedCommit.path}
              onSelect={(path) => setSelectedCommit({ ...selectedCommit, path })}
              busy={checkoutBusy}
              onCheckout={checkout}
            />
          )}
          {selectedCommit?.path && (
            <DiffPanel
              runGitAction={props.runGitAction}
              selection={{ kind: "commit", commit: selectedCommit.commit, path: selectedCommit.path }}
              generation={generation}
              entityNames={props.entityNames}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

/** Where "back to" leads from a detached HEAD: the branch left, else `main`, else the first branch. */
function backToBranch(branches: GitStatusResult["branches"], previousBranch: string | undefined): string | undefined {
  if (previousBranch && branches.local.includes(previousBranch)) {
    return previousBranch;
  }
  return branches.local.includes("main") ? "main" : branches.local[0];
}

// ################################################################################################
function Panel(props: {
  title: string;
  testId: string;
  actions?: React.ReactNode;
  /**
   * The CSS `flex` of the panel: in a row, the diff takes more room than a list; alone in the page column, a
   * panel takes the height of its content (`0 0 auto`).
   */
  flex?: string;
  children: React.ReactNode;
}) {
  const miroirTheme = useMiroirTheme();
  return (
    <Box
      data-testid={props.testId}
      sx={{
        flex: props.flex ?? "1 1 360px",
        minWidth: 0,
        border: `1px solid ${miroirTheme.currentTheme.colors.border ?? "#ccc"}`,
        borderRadius: 1,
        p: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
          {props.title}
        </Typography>
        {props.actions}
      </Box>
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
  busy: boolean;
  /** Stages a file with unstaged changes, unstages the others. */
  onToggleStaged: (file: GitStatusResult["files"][number]) => void;
  /** #691: asks to revert the unstaged edits of a file. */
  onRevert: (file: GitStatusResult["files"][number]) => void;
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
          <Checkbox
            size="small"
            sx={{ p: 0.25 }}
            checked={file.staged}
            indeterminate={file.staged && file.unstaged}
            disabled={props.busy || !file.inApplication}
            onClick={(event) => event.stopPropagation()}
            onChange={() => props.onToggleStaged(file)}
            slotProps={{
              input: {
                "aria-label": file.unstaged ? `stage ${file.path}` : `unstage ${file.path}`,
                ...({ "data-testid": `git-stage-${file.path}` } as Record<string, string>),
              },
            }}
          />
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
          {file.unstaged && file.inApplication && (
            <Button
              size="small"
              color="warning"
              sx={{ ml: "auto" }}
              data-testid={`git-revert-${file.path}`}
              disabled={props.busy}
              onClick={(event) => {
                event.stopPropagation();
                props.onRevert(file);
              }}
            >
              Revert
            </Button>
          )}
        </Row>
      ))}
    </Box>
  );
}

const revertOutcomeLabels: Record<GitRevertOutcome, string> = {
  rewritten: "rewritten",
  recreated: "re-created",
  deleted: "deleted",
};

/** #691: the confirmation of a revert, naming each file with what happens to it. */
function GitRevertConfirm(props: {
  files: GitStatusResult["files"];
  entityNames: Record<string, string>;
  busy: boolean;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <Alert
      severity="warning"
      data-testid="git-revert-confirm"
      sx={{ mt: 1 }}
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" color="warning" data-testid="git-revert-apply" disabled={props.busy} onClick={props.onApply}>
            Revert
          </Button>
          <Button size="small" data-testid="git-revert-cancel" onClick={props.onCancel}>
            Cancel
          </Button>
        </Box>
      }
    >
      <Typography variant="body2">The edits not staged are lost; staged content is kept.</Typography>
      {props.files.map((file) => (
        <Box key={file.path} sx={{ display: "flex", gap: 1 }}>
          <Typography variant="body2" noWrap>
            {gitFileLabel(file, props.entityNames)}:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }} data-testid={`git-revert-outcome-${file.path}`}>
            {file.revertOutcome ? revertOutcomeLabels[file.revertOutcome] : "made equal to the index"}
          </Typography>
        </Box>
      ))}
    </Alert>
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
  busy: boolean;
  onCheckout: (ref: string) => void;
}) {
  const payload = useMemo(() => ({ oid: props.commit.oid }), [props.commit.oid]);
  const files = useGitRequest<GitCommitFilesResult>(props.runGitAction, "gitAction_commitFiles", payload, props.generation);
  return (
    <Panel
      title={`Files of ${props.commit.oid.slice(0, 7)}: ${props.commit.message.split("\n")[0]}`}
      testId="git-commit-files"
      actions={
        <Button
          size="small"
          data-testid="git-checkout-commit"
          disabled={props.busy}
          onClick={() => props.onCheckout(props.commit.oid)}
        >
          Check out this commit
        </Button>
      }
    >
      {files.status === "ok" ? (
        files.value.files.map((file) =>
          file.inApplication ? (
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
          ) : (
            // the diff of a file outside the application's sections is not shown
            <Box key={file.path} data-testid={`git-commit-file-${file.path}`} sx={{ px: 0.5, py: 0.25, opacity: 0.6 }}>
              <Typography variant="body2" noWrap>
                {file.path} (outside this application)
              </Typography>
            </Box>
          ),
        )
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
    <Panel
      title={diff.status === "ok" ? `Diff: ${gitFileLabel(diff.value, props.entityNames)}` : "Diff"}
      testId="git-diff"
      flex="2 1 480px"
    >
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
