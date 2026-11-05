import React, { Suspense, useMemo } from "react";

import {
  Action2Error,
  type Action2ReturnType,
  type GitActionType,
  type GitCommitFilesResult,
  type GitDiffResult,
  type GitLogResult,
  type GitStatusResult,
} from "@miroir-framework/core";
import { LazyGitPageView, type RunGitAction } from "@miroir-framework/react";

// ################################################################################################
// The Git page body for the declarative component tests (#679): the real view and its request
// hooks, on a repository given as the results of the Git actions. `noRepository` answers
// `gitAction_status` with the `notARepository` error until `gitAction_init` runs.
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
          return props.status ? ok(props.status) : missing("gitAction_status");
        case "gitAction_log":
          return ok(props.log ?? emptyLog);
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
  }, [props.noRepository, props.status, props.log, props.commitFiles, props.diffs]);
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
