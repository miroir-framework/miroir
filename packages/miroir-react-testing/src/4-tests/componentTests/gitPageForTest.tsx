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
import { LazyGitPageView, type RunGitAction } from "@miroir-framework/react";

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
}

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
    let log: GitLogResult = structuredClone(props.log ?? emptyLog);
    const branches = (): GitBranches => status?.branches ?? log.branches;
    const setBranches = (next: GitBranches) => {
      if (status) {
        status = { ...status, branches: next };
      }
      log = { ...log, branches: next };
    };
    let commitCount = 0;
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
              paths.includes(file.path) && file.inApplication ? { ...file, staged: staging, unstaged: !staging } : file,
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
  ]);
  return (
    <Suspense fallback={<span>Loading the Git page...</span>}>
      <LazyGitPageView
        applicationName={props.applicationName ?? "Library"}
        gitEnabled={props.gitEnabled ?? true}
        runGitAction={runGitAction}
        entityNames={props.entityNames ?? {}}
      />
    </Suspense>
  );
}
