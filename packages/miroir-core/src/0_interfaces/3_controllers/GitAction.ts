/**
 * #679: the `gitAction_*` Miroir actions, declared by the Git Endpoint
 * (`a7f243cb-9345-425a-918d-4e433a94f4bf`) and run by `DomainController.handleGitAction`.
 * Every action names the application whose deployment's repository it works on.
 */
import type { Uuid } from "../1_core/EntityVersion";
import type { ApplicationSection } from "../1_core/preprocessor-generated/miroirFundamentalType";
import type {
  GitBranches,
  GitCommitSummary,
  GitFileDiff,
  GitFileStatus,
} from "../4-services/GitRepositoryInterface";

export const GIT_ENDPOINT_UUID = "a7f243cb-9345-425a-918d-4e433a94f4bf";

export const GIT_ACTION_TYPES = [
  "gitAction_status",
  "gitAction_log",
  "gitAction_commitFiles",
  "gitAction_diff",
  "gitAction_init",
] as const;

export type GitActionType = (typeof GIT_ACTION_TYPES)[number];

/**
 * The Git actions that leave the deployment's files as they are: after them, the server keeps the model
 * environments it built (`gitAction_init` only adds a `.git` folder).
 */
export const GIT_ACTIONS_KEEPING_FILES: readonly GitActionType[] = [
  "gitAction_status",
  "gitAction_log",
  "gitAction_commitFiles",
  "gitAction_diff",
  "gitAction_init",
];

type GitActionOf<T extends GitActionType, P> = {
  actionType: T;
  actionLabel?: string;
  endpoint: typeof GIT_ENDPOINT_UUID;
  payload: { application: Uuid } & P;
};

export type GitStatusAction = GitActionOf<
  "gitAction_status",
  {
    /** Also list changed files outside the application's section folders (D2 toggle). */
    includeOtherChanges?: boolean;
  }
>;
export type GitLogAction = GitActionOf<"gitAction_log", { depth?: number; ref?: string }>;
export type GitCommitFilesAction = GitActionOf<"gitAction_commitFiles", { oid: string }>;
export type GitDiffAction = GitActionOf<"gitAction_diff", { path: string; from?: string; to?: string }>;
export type GitInitAction = GitActionOf<"gitAction_init", {}>;

export type GitAction =
  | GitStatusAction
  | GitLogAction
  | GitCommitFilesAction
  | GitDiffAction
  | GitInitAction;

/** The instance a changed path stores, when it is an instance file of the deployment (D10). */
export type GitPathDescription = {
  section?: ApplicationSection;
  entityUuid?: string;
  instanceKey?: string;
  /** The instance's `name` (or `defaultLabel`), read from the file. */
  instanceName?: string;
  /** False for a path outside the application's section folders. */
  inApplication: boolean;
};

export type GitRepositoryDescription = {
  /** Absolute path of the work tree root (on the machine that runs the action). */
  root: string;
  /** Repository-relative folder of each filesystem section of the deployment. */
  sectionPaths: Partial<Record<ApplicationSection, string>>;
};

export type GitStatusResult = GitRepositoryDescription & {
  branches: GitBranches;
  files: (GitFileStatus & GitPathDescription)[];
};

export type GitLogResult = GitRepositoryDescription & {
  branches: GitBranches;
  commits: GitCommitSummary[];
};

export type GitCommitFilesResult = {
  oid: string;
  files: ({ path: string } & GitPathDescription)[];
};

export type GitDiffResult = GitFileDiff & GitPathDescription;

export type GitInitResult = GitRepositoryDescription;

export function isGitAction(action: unknown): action is GitAction {
  const actionType = (action as { actionType?: unknown } | undefined)?.actionType;
  return typeof actionType === "string" && (GIT_ACTION_TYPES as readonly string[]).includes(actionType);
}
