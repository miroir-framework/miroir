import React, { Suspense, useMemo } from "react";

import {
  Action2Error,
  type Action2ReturnType,
  type GitActionType,
  type GitBranches,
  type GitCommitFilesResult,
  type GitCommitSummary,
  type GitPerson,
  type GitDiffResult,
  type GitLogResult,
  type GitStatusResult,
} from "@miroir-framework/core";
import { LazyGitClonePanel, LazyGitPageView, type RunGitAction } from "@miroir-framework/react";

// ################################################################################################
// The Git page body for the declarative component tests (#679): the real view and its request
// hooks, on a repository given as the results of the Git actions. `noRepository` answers
// `gitAction_status` with the `notARepository` error until `gitAction_init` runs. Stage, unstage,
// commit, branch and checkout actions change that repository in memory, so the page shows their effect.
// ################################################################################################

export interface GitPageForTestProps {
  gitEnabled?: boolean;
  applicationName?: string;
  entityNames?: Record<string, string>;
  status?: GitStatusResult;
  log?: GitLogResult;
  /** By commit oid. */
  commitFiles?: Record<string, GitCommitFilesResult>;
  /** By path, then by `from..to` (`HEAD..` for HEAD against the work tree). */
  diffs?: Record<string, Record<string, GitDiffResult>>;
  /** The folder named by the `notARepository` error. */
  noRepository?: string;
  /** `gitAction_commit` without an author is refused with `authorUnknown`. */
  authorUnknown?: boolean;
  /** `gitAction_commit` and `gitAction_checkout` are refused with `openMiroirTransaction`. */
  openMiroirTransaction?: boolean;
  /** `gitAction_checkout` is refused with `checkoutConflict` on these paths. */
  checkoutConflicts?: string[];
  /** `gitAction_deleteBranch` of these branches is refused with `branchNotMerged` unless forced. */
  unmergedBranches?: string[];
  /** The repository has no remote: `remoteUrl` and `tracking` of `status` are dropped. */
  noRemote?: boolean;
  /** Commits of the remote branch the local one lacks: `gitAction_fetch` shows them, `gitAction_pull` takes them. */
  remoteBehind?: number;
  /** Local and remote have diverged: `gitAction_pull` is refused with `notFastForward`, push with `pushRejected`. */
  remoteDiverged?: boolean;
  /** The remote asks for this token: the remote actions are refused with `authenticationRequired` without it. */
  remoteToken?: string;
  /** `gitAction_setCredential` is refused with `secretsUnavailable` (no wrapping key). */
  secretsUnavailable?: boolean;
  /** #691: the tab the page opens on; the page keeps the tab it is then switched to. */
  view?: string;
  /** #691: the Setup tab holds the real Clone panel, on the same answers as the page. */
  withClonePanel?: boolean;
  /** #691: `gitAction_revert` succeeds, but reports that the local cache could not reload the application. */
  revertReloadFailure?: boolean;
}

type FixtureFile = GitStatusResult["files"][number];

/**
 * #691: what a revert does to a file whose work tree differs from the index, as the status gives it: the
 * fixture only knows the flags, so a file of the props without `revertOutcome` gets the usual one.
 */
function withRevertOutcome(file: FixtureFile): FixtureFile {
  if (!file.unstaged) {
    const { revertOutcome: _dropped, ...rest } = file;
    return rest;
  }
  if (file.revertOutcome || file.staged) {
    // with staged content too, the flags do not tell what a revert does: the props say it, as the server does
    return file;
  }
  // nothing staged: the index is HEAD
  const revertOutcome = file.change === "added" ? "deleted" : file.change === "deleted" ? "recreated" : "rewritten";
  return { ...file, revertOutcome };
}

/** The file after a revert, or undefined when it no longer differs from HEAD. */
function reverted(file: FixtureFile): FixtureFile | undefined {
  if (!file.staged) {
    return undefined;
  }
  const { revertOutcome: _dropped, ...rest } = file;
  return { ...rest, unstaged: false };
}

const REMOTE_HOST = "git.example.com";

function refusal(reason: string, message: string, context: Record<string, unknown> = {}): Action2ReturnType {
  return new Action2Error("InvalidAction", message, undefined, undefined, { reason, ...context });
}

function ok(returnedDomainElement: unknown): Action2ReturnType {
  return { status: "ok", returnedDomainElement: returnedDomainElement as any };
}

function missing(what: string): Action2ReturnType {
  return new Action2Error("InvalidAction", `No fixture for ${what}`, undefined, undefined, { reason: "gitFailure" });
}

export function GitPageForTest(props: GitPageForTestProps) {
  const runGitAction: RunGitAction = useMemo(() => {
    let initialized = props.noRepository === undefined;
    const emptyLog: GitLogResult = {
      root: props.noRepository ?? "",
      sectionPaths: {},
      branches: { local: [], remote: [], tags: [] },
      commits: [],
    };
    // the repository as the actions change it
    let status: GitStatusResult | undefined = props.status && structuredClone(props.status);
    if (status) {
      status = { ...status, files: status.files.map(withRevertOutcome) };
    }
    if (status && props.noRemote) {
      status = { ...status, remoteUrl: undefined, tracking: undefined };
    }
    let credentialSaved = false;
    let remoteCommits = props.remoteBehind ?? 0;
    let log: GitLogResult = structuredClone(props.log ?? emptyLog);
    const branches = (): GitBranches => status?.branches ?? log.branches;
    const setBranches = (next: GitBranches) => {
      if (status) {
        status = { ...status, branches: next };
      }
      log = { ...log, branches: next };
    };
    let commitCount = 0;
    /** The refusal of a remote action, if any: no remote, or no accepted token. */
    const remoteRefusal = (payload: Record<string, unknown>): Action2ReturnType | undefined => {
      if (!status?.remoteUrl) {
        return refusal("noRemote", "no remote");
      }
      const token = (payload.credential as { token?: string } | undefined)?.token;
      if (props.remoteToken !== undefined && !credentialSaved && token !== props.remoteToken) {
        return new Action2Error("ExternalServiceUnauthorized", "The remote refused the credentials", undefined, undefined, {
          reason: "authenticationRequired",
          host: REMOTE_HOST,
        });
      }
      return undefined;
    };
    const remoteResult = (extra: Record<string, unknown> = {}) => ok({
      branches: branches(),
      remote: "origin",
      url: status?.remoteUrl,
      tracking: status?.tracking,
      ...extra,
    });
    const setTracking = (ahead: number, behind: number) => {
      if (status && branches().current) {
        status = { ...status, tracking: { upstream: `origin/${branches().current}`, ahead, behind } };
      }
    };
    return async (actionType: GitActionType, payload: Record<string, unknown> = {}) => {
      if (!initialized && actionType !== "gitAction_init") {
        return new Action2Error("InvalidAction", "not a repository", undefined, undefined, {
          reason: "notARepository",
          directory: props.noRepository,
        });
      }
      switch (actionType) {
        case "gitAction_init":
          initialized = true;
          return ok({ root: props.noRepository, sectionPaths: props.status?.sectionPaths ?? {} });
        case "gitAction_status":
          return status ? ok(status) : missing("gitAction_status");
        case "gitAction_log":
          return ok(log);
        case "gitAction_stage":
        case "gitAction_unstage": {
          if (!status) {
            return missing(actionType);
          }
          const staging = actionType === "gitAction_stage";
          const paths = payload.all === true ? status.files.map((file) => file.path) : ((payload.paths as string[]) ?? []);
          status = {
            ...status,
            files: status.files.map((file) =>
              paths.includes(file.path) && file.inApplication
                ? withRevertOutcome({ ...file, staged: staging, unstaged: !staging, revertOutcome: undefined })
                : file,
            ),
          };
          return ok(status);
        }
        case "gitAction_commit": {
          if (props.openMiroirTransaction) {
            return refusal("openMiroirTransaction", "Miroir changes are not saved yet");
          }
          const author = payload.author as GitPerson | undefined;
          if (props.authorUnknown && !author) {
            return refusal("authorUnknown", "no author");
          }
          const committed = status?.files.filter((file) => file.staged) ?? [];
          commitCount += 1;
          const oid = String(commitCount).padStart(40, "c");
          const commit: GitCommitSummary = {
            oid,
            parents: log.commits[0] ? [log.commits[0].oid] : [],
            message: `${String(payload.message)}\n`,
            author: { ...(author ?? { name: "Miroir Test", email: "t@example.com" }), timestamp: 1710000000 },
            refs: ["HEAD", ...(branches().current ? [branches().current!] : [])],
          };
          log = {
            ...log,
            commits: [commit, ...log.commits.map((entry) => ({ ...entry, refs: entry.refs.filter((ref) => ref !== "HEAD" && ref !== branches().current) }))],
          };
          if (status) {
            status = { ...status, files: status.files.filter((file) => !file.staged || file.unstaged) };
          }
          setBranches({ ...branches(), head: oid });
          return ok({ oid, author: author ?? { name: "Miroir Test", email: "t@example.com" }, files: committed.map((file) => file.path) });
        }
        case "gitAction_revert": {
          if (!status) {
            return missing(actionType);
          }
          if (props.openMiroirTransaction) {
            return refusal("openMiroirTransaction", "Miroir changes are not saved yet");
          }
          const named = (payload.paths as string[] | undefined) ?? [];
          const chosen = status.files.filter(
            (file) => file.unstaged && file.inApplication && (payload.all === true || named.includes(file.path)),
          );
          if (chosen.length === 0) {
            return refusal("nothingToRevert", "None of these files has unstaged edits to revert");
          }
          const chosenPaths = new Set(chosen.map((file) => file.path));
          status = {
            ...status,
            files: status.files.flatMap((file) => {
              if (!chosenPaths.has(file.path)) {
                return [file];
              }
              const after = reverted(file);
              return after ? [after] : [];
            }),
          };
          return ok({
            files: chosen.map((file) => ({ path: file.path, outcome: file.revertOutcome })),
            touchedDeployments: [],
            ...(props.revertReloadFailure
              ? { reloadFailures: [{ application: "library", errorMessage: "the Library could not be read" }] }
              : {}),
          });
        }
        case "gitAction_createBranch": {
          const name = String(payload.name);
          if (branches().local.includes(name)) {
            return refusal("branchExists", `A branch named ${name} already exists`);
          }
          setBranches({ ...branches(), local: [...branches().local, name].sort() });
          return ok({ branches: branches() });
        }
        case "gitAction_deleteBranch": {
          const name = String(payload.name);
          if (props.unmergedBranches?.includes(name) && payload.force !== true) {
            return refusal("branchNotMerged", `${name} has commits of its own`, { name });
          }
          setBranches({ ...branches(), local: branches().local.filter((branch) => branch !== name) });
          return ok({ branches: branches() });
        }
        case "gitAction_checkout": {
          if (props.openMiroirTransaction) {
            return refusal("openMiroirTransaction", "Miroir changes are not saved yet");
          }
          if (props.checkoutConflicts?.length) {
            return refusal("checkoutConflict", "would be overwritten", { paths: props.checkoutConflicts });
          }
          const ref = String(payload.ref);
          const isBranch = branches().local.includes(ref);
          setBranches({
            ...branches(),
            current: isBranch ? ref : undefined,
            head: isBranch ? branches().head : (log.commits.find((commit) => commit.oid === ref)?.oid ?? ref),
          });
          return ok({ branches: branches(), touchedDeployments: [] });
        }
        case "gitAction_setRemote": {
          const url = String(payload.url ?? "");
          if (!/^https?:\/\//.test(url)) {
            return refusal("unsupportedRemoteProtocol", `Only http and https remotes are supported, not ${url}`);
          }
          if (status) {
            status = { ...status, remoteUrl: url };
          }
          return remoteResult();
        }
        case "gitAction_fetch": {
          const refused = remoteRefusal(payload);
          if (refused) {
            return refused;
          }
          setTracking(status?.tracking?.ahead ?? 0, remoteCommits);
          return remoteResult();
        }
        case "gitAction_pull": {
          const refused = remoteRefusal(payload);
          if (refused) {
            return refused;
          }
          if (props.remoteDiverged) {
            return refusal("notFastForward", "diverged");
          }
          const pulled: GitCommitSummary[] = Array.from({ length: remoteCommits }, (_, index) => ({
            oid: String(index + 1).padStart(40, "p"),
            parents: [],
            message: `Remote commit ${index + 1}\n`,
            author: { name: "Other Machine", email: "other@example.com", timestamp: 1720000000 + index },
            refs: [],
          })).reverse();
          const upToDate = remoteCommits === 0;
          log = { ...log, commits: [...pulled, ...log.commits] };
          remoteCommits = 0;
          setTracking(status?.tracking?.ahead ?? 0, 0);
          return remoteResult({ upToDate, touchedDeployments: [] });
        }
        case "gitAction_push": {
          const refused = remoteRefusal(payload);
          if (refused) {
            return refused;
          }
          if (props.remoteDiverged) {
            return refusal("pushRejected", "the remote has commits the branch does not have");
          }
          setTracking(0, remoteCommits);
          return remoteResult();
        }
        case "gitAction_setCredential": {
          if (props.secretsUnavailable) {
            return refusal("secretsUnavailable", "gitAction_setCredential: a wrapping key is required to save the credential");
          }
          credentialSaved = true;
          return ok({ name: `git.${String(payload.host)}`, scope: "process" });
        }
        case "gitAction_commitFiles": {
          const files = props.commitFiles?.[String(payload.oid)];
          return files ? ok(files) : missing(`the files of ${payload.oid}`);
        }
        case "gitAction_diff": {
          const key = `${payload.from ?? "HEAD"}..${payload.to ?? ""}`;
          const diff = props.diffs?.[String(payload.path)]?.[key];
          return diff ? ok(diff) : missing(`the diff ${key} of ${payload.path}`);
        }
        default:
          return missing(actionType);
      }
    };
  }, [
    props.noRepository,
    props.status,
    props.log,
    props.commitFiles,
    props.diffs,
    props.authorUnknown,
    props.openMiroirTransaction,
    props.checkoutConflicts,
    props.unmergedBranches,
    props.noRemote,
    props.remoteBehind,
    props.remoteDiverged,
    props.remoteToken,
    props.secretsUnavailable,
    props.revertReloadFailure,
  ]);
  return (
    <Suspense fallback={<span>Loading the Git page...</span>}>
      <LazyGitPageView
        applicationName={props.applicationName ?? "Library"}
        gitEnabled={props.gitEnabled ?? true}
        runGitAction={runGitAction}
        entityNames={props.entityNames ?? {}}
        view={props.view}
        setupExtras={
          props.withClonePanel ? (
            <Suspense fallback={<span>Loading the clone panel...</span>}>
              <LazyGitClonePanel runGitAction={runGitAction} />
            </Suspense>
          ) : undefined
        }
      />
    </Suspense>
  );
}
