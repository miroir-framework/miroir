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
  GitPerson,
} from "../4-services/GitRepositoryInterface";

export const GIT_ENDPOINT_UUID = "a7f243cb-9345-425a-918d-4e433a94f4bf";

export const GIT_ACTION_TYPES = [
  "gitAction_status",
  "gitAction_log",
  "gitAction_commitFiles",
  "gitAction_diff",
  "gitAction_init",
  "gitAction_stage",
  "gitAction_unstage",
  "gitAction_commit",
  "gitAction_createBranch",
  "gitAction_deleteBranch",
  "gitAction_checkout",
  "gitAction_setRemote",
  "gitAction_fetch",
  "gitAction_pull",
  "gitAction_push",
  "gitAction_setCredential",
  "gitAction_clone",
  "gitAction_installClonedDeployment",
] as const;

export type GitActionType = (typeof GIT_ACTION_TYPES)[number];

/**
 * The Git actions that leave the deployment's files as they are: after them, the server keeps the model
 * environments it built (`gitAction_init` only adds a `.git` folder, the others only change `.git`).
 */
export const GIT_ACTIONS_KEEPING_FILES: readonly GitActionType[] = [
  "gitAction_status",
  "gitAction_log",
  "gitAction_commitFiles",
  "gitAction_diff",
  "gitAction_init",
  "gitAction_stage",
  "gitAction_unstage",
  "gitAction_commit",
  "gitAction_createBranch",
  "gitAction_deleteBranch",
  "gitAction_setRemote",
  "gitAction_fetch",
  "gitAction_push",
  "gitAction_setCredential",
  // a clone writes a new folder, which no deployment uses yet
  "gitAction_clone",
  // writes rows in Admin and opens a store; the deployment's files stay as they are
  "gitAction_installClonedDeployment",
];

/**
 * The Git actions refused while the client's local cache holds Miroir changes not yet on disk (D7): a
 * commit would miss them, a checkout would discard them.
 */
export const GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES: readonly GitActionType[] = [
  "gitAction_commit",
  "gitAction_checkout",
  "gitAction_pull",
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
/** `paths` are repository-relative files of the application's sections; `all` takes every changed one. */
export type GitStageAction = GitActionOf<"gitAction_stage", { paths?: string[]; all?: boolean }>;
export type GitUnstageAction = GitActionOf<"gitAction_unstage", { paths?: string[]; all?: boolean }>;
export type GitCommitAction = GitActionOf<
  "gitAction_commit",
  {
    message: string;
    /** Used instead of the logged-in user or the repository's `user.name` / `user.email`. */
    author?: GitPerson;
    /** With `author`: also write it as the repository's `user.name` / `user.email`. */
    rememberAuthor?: boolean;
    /** Also commit files outside the application's sections that are already staged. */
    includeOtherStagedChanges?: boolean;
  }
>;
export type GitCreateBranchAction = GitActionOf<"gitAction_createBranch", { name: string; startPoint?: string }>;
/** `force`: also delete a branch whose commits no other ref keeps (`branchNotMerged` otherwise). */
export type GitDeleteBranchAction = GitActionOf<"gitAction_deleteBranch", { name: string; force?: boolean }>;
/** `ref`: a local branch, or a tag, remote branch or commit oid (checked out as a detached HEAD). */
export type GitCheckoutAction = GitActionOf<"gitAction_checkout", { ref: string }>;
/** Sets the URL of `remote` (`origin` by default); only `http(s)` URLs are accepted. */
export type GitSetRemoteAction = GitActionOf<"gitAction_setRemote", { url: string; remote?: string }>;
/**
 * A username and token typed for one remote action: used for it, never stored. Without one, the action uses
 * the `git.<host>` secret of the logged-in user, or of the process.
 */
export type GitPayloadCredential = { username: string; token: string };
/** `remote`: by default the one of the current branch's upstream, else `origin`. */
export type GitFetchAction = GitActionOf<"gitAction_fetch", { remote?: string; credential?: GitPayloadCredential }>;
/** Fetches the current branch's upstream, then fast-forwards the branch to it. */
export type GitPullAction = GitActionOf<"gitAction_pull", { credential?: GitPayloadCredential }>;
/** Pushes the current branch to its upstream, else to `origin`, which then becomes its upstream. */
export type GitPushAction = GitActionOf<"gitAction_push", { credential?: GitPayloadCredential }>;
/** Saves a username and token for `host` as the Admin secret `git.<host>` (the user's, or the process'). */
export type GitSetCredentialAction = GitActionOf<
  "gitAction_setCredential",
  { host: string; username: string; token: string }
>;

/**
 * Clones `url` (`http(s)` only) into `<deployment root folder>/<folderName>`, a folder that must not exist
 * or be empty, and lists the deployments the repository holds. `application` is the Admin application.
 */
export type GitCloneAction = GitActionOf<
  "gitAction_clone",
  { url: string; folderName: string; branch?: string; credential?: GitPayloadCredential }
>;
/**
 * Registers a deployment of a cloned folder in Admin, its directories pointing inside the clone, and opens
 * it. `deploymentUuid` may be left out when the folder holds a single deployment.
 */
export type GitInstallClonedDeploymentAction = GitActionOf<
  "gitAction_installClonedDeployment",
  { folderName: string; deploymentUuid?: string }
>;

export type GitAction =
  | GitStatusAction
  | GitLogAction
  | GitCommitFilesAction
  | GitDiffAction
  | GitInitAction
  | GitStageAction
  | GitUnstageAction
  | GitCommitAction
  | GitCreateBranchAction
  | GitDeleteBranchAction
  | GitCheckoutAction
  | GitSetRemoteAction
  | GitFetchAction
  | GitPullAction
  | GitPushAction
  | GitSetCredentialAction
  | GitCloneAction
  | GitInstallClonedDeploymentAction;

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

/** The current branch against its upstream, from the remote-tracking refs of the last fetch. */
export type GitTracking = { upstream: string; ahead: number; behind: number };

export type GitStatusResult = GitRepositoryDescription & {
  branches: GitBranches;
  /** Absent with no current branch or no upstream. */
  tracking?: GitTracking;
  /** The remote Fetch, Pull and Push use: the one of the current branch's upstream, else `origin`. */
  remote?: string;
  /** The URL of `remote`, when the repository has it. */
  remoteUrl?: string;
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

/** The status after the change: what the changes panel shows next. */
export type GitStageResult = GitStatusResult;

export type GitCommitResult = {
  oid: string;
  author: GitPerson;
  /** The paths the commit changed. */
  files: string[];
};

export type GitBranchResult = { branches: GitBranches };

/** A deployment whose files the action may have changed: the client reloads it (`rollback`). */
export type GitTouchedDeployment = { application: Uuid; deploymentUuid: Uuid };

export type GitCheckoutResult = GitBranchResult & {
  touchedDeployments: GitTouchedDeployment[];
  /**
   * Set by the DomainController that ran or forwarded the checkout, for each touched application its local
   * cache could not reload: the files changed, the cache still shows the previous state.
   */
  reloadFailures?: { application: Uuid; errorMessage?: string }[];
};

export type GitRemoteResult = GitBranchResult & {
  remote: string;
  url: string;
  tracking?: GitTracking;
};

export type GitPullResult = GitRemoteResult & {
  /** The branch already had every commit of its upstream: no file changed. */
  upToDate: boolean;
  touchedDeployments: GitTouchedDeployment[];
  reloadFailures?: { application: Uuid; errorMessage?: string }[];
};

/** The saved secret's name and scope; never its value. */
export type GitSetCredentialResult = { name: string; scope: "user" | "process" };

/** A deployment a cloned repository holds, as `gitAction_clone` lists it. */
export type GitClonedDeploymentSummary = {
  deploymentUuid: Uuid;
  selfApplication: Uuid;
  /** The application's name, from its SelfApplication row. */
  name: string;
  /** The repository-relative file of the Deployment row. */
  deploymentFile: string;
  /** The section folders the installed deployment uses, relative to the deployment root folder. */
  directories: Record<string, string>;
  /** The application already has a deployment here: installing this one is refused. */
  alreadyInstalled: boolean;
};

export type GitCloneResult = {
  /** The clone, relative to the deployment root folder. */
  folderName: string;
  /** Absolute path of the clone (on the machine that ran the action). */
  root: string;
  branches: GitBranches;
  deployments: GitClonedDeploymentSummary[];
  /** Deployment rows of the repository that cannot be opened from the clone, and why. */
  skipped: { deploymentFile: string; reason: string }[];
};

export type GitInstallClonedDeploymentResult = {
  application: Uuid;
  deploymentUuid: Uuid;
  name: string;
  directories: Record<string, string>;
  /**
   * Set by the DomainController that ran or forwarded the install, when its local cache could not load the
   * new application: the deployment is registered and open, the cache does not show it yet.
   */
  reloadFailures?: { application: Uuid; errorMessage?: string }[];
};

export function isGitAction(action: unknown): action is GitAction {
  const actionType = (action as { actionType?: unknown } | undefined)?.actionType;
  return typeof actionType === "string" && (GIT_ACTION_TYPES as readonly string[]).includes(actionType);
}
