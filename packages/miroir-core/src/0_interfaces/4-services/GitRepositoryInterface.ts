/**
 * #679: the port between Miroir and a Git implementation. Core (the `gitAction_*` library
 * implementations) depends on these types only; `@miroir-framework/git-isomorphic` implements them,
 * and a host registers it with `ConfigurationService.registerGitRepositoryFactory`, as a loader
 * that imports the package on first use.
 *
 * Paths given to and returned by a repository are relative to its root, with `/` separators.
 * Directories given to the factory are absolute.
 */

/** One changed file, as the changes panel shows it. Unchanged files are not listed. */
export type GitFileStatus = {
  path: string;
  /** Compared with HEAD: absent from HEAD, removed from the work tree (or the index), or changed. */
  change: "added" | "modified" | "deleted";
  /** The index differs from HEAD for this file. */
  staged: boolean;
  /** The work tree differs from the index for this file. */
  unstaged: boolean;
};

export type GitPerson = { name: string; email: string };

export type GitCommitSummary = {
  oid: string;
  parents: string[];
  message: string;
  author: GitPerson & { timestamp: number };
  /** Branches (`main`, `origin/main`), tags (`tag: v1`) and `HEAD` pointing at this commit. */
  refs: string[];
};

export type GitFileDiff = {
  path: string;
  /** The text at `from` (HEAD by default); absent when the file does not exist there. */
  before?: string;
  /** The text in the work tree, or at `to`; absent when the file does not exist there. */
  after?: string;
};

export type GitBranches = {
  /** Undefined when HEAD is detached. */
  current?: string;
  /** The commit HEAD points at; undefined in a repository with no commit. */
  head?: string;
  local: string[];
  remote: string[];
  tags: string[];
};

/** A repository opened on its root folder. */
export interface GitRepositoryInterface {
  /** Absolute path of the work tree root. */
  readonly root: string;
  /** Changed files under `filepaths` (repository-relative folders or files), every file when absent. */
  status(filepaths?: string[]): Promise<GitFileStatus[]>;
  /** Commits reachable from `ref` (HEAD by default), newest first. Empty for a repository with no commit. */
  log(options?: { ref?: string; depth?: number }): Promise<GitCommitSummary[]>;
  /** The paths a commit changed compared with its first parent (every path for a root commit). */
  commitFiles(oid: string): Promise<string[]>;
  /** Before and after text of one file, by default HEAD against the work tree. */
  diff(path: string, options?: { from?: string; to?: string }): Promise<GitFileDiff>;
  branches(): Promise<GitBranches>;
  /** The text of a file in the work tree, or at `ref`; undefined when absent. */
  readFile(path: string, ref?: string): Promise<string | undefined>;
  /** True when `.gitignore` rules exclude `path` (a file or folder) from the repository. */
  isIgnored(path: string): Promise<boolean>;
  /** The paths whose index entry differs from HEAD (every indexed path in a repository with no commit). */
  stagedPaths(): Promise<string[]>;
  /**
   * Puts the work tree state of each file in the index: its content, or its removal when it is absent.
   * Throws `outsideWorkTree` for a file reached through a symbolic link out of the work tree.
   */
  stage(paths: string[]): Promise<void>;
  /** Puts the HEAD state of each path back in the index, leaving the work tree as it is. */
  unstage(paths: string[]): Promise<void>;
  /** Commits the index on the current branch (or the detached HEAD); returns the new commit's oid. */
  commit(message: string, author: GitPerson): Promise<string>;
  /** A value of the repository's own configuration (`.git/config`), such as `user.name`. */
  getConfig(key: string): Promise<string | undefined>;
  setConfig(key: string, value: string): Promise<void>;
  /** Creates a local branch at `startPoint` (HEAD by default), without checking it out. */
  createBranch(name: string, startPoint?: string): Promise<void>;
  deleteBranch(name: string): Promise<void>;
  /** True when the branch's commit is HEAD's commit or one of its ancestors: deleting it loses no commit. */
  branchIsMergedIntoHead(name: string): Promise<boolean>;
  /**
   * Checks out a local branch, or a tag or commit as a detached HEAD. When uncommitted changes would be
   * overwritten, nothing changes and the conflicting paths are returned.
   */
  checkout(ref: string): Promise<GitCheckoutOutcome>;
}

export type GitCheckoutOutcome = { conflicts: string[] };

/** Errors a repository throws with a `code` the actions map to a reason. */
export type GitRepositoryErrorCode = "branchExists" | "unknownRevision" | "invalidRefName" | "outsideWorkTree";

export class GitRepositoryError extends Error {
  constructor(
    public readonly code: GitRepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GitRepositoryError";
  }
}

export interface GitRepositoryFactory {
  /** The root of the work tree enclosing `directory`, or undefined when there is none. */
  findRoot(directory: string): Promise<string | undefined>;
  open(root: string): Promise<GitRepositoryInterface>;
  /** Creates an empty repository (default branch `main`) in `directory`. */
  init(directory: string): Promise<GitRepositoryInterface>;
  /** Resolves `relative` against `base`, as the host's filesystem does. */
  resolvePath(base: string, relative: string): string;
  /** `path` relative to `root` with `/` separators, or undefined when `path` is not inside `root`. */
  relativePath(root: string, path: string): string | undefined;
  /** The deepest folder containing every path of `paths` (the parent folder for a single path). */
  commonDirectory(paths: string[]): string;
}

/** Imports the implementation on first call. */
export type GitRepositoryFactoryLoader = () => Promise<GitRepositoryFactory>;

/**
 * The `errorContext.reason` values of `gitAction_*` errors: the UI switches on these, never on
 * library messages.
 */
export type GitActionErrorReason =
  | "notARepository"
  | "notFilesystemDeployment"
  | "unknownDeployment"
  | "gitUnavailable"
  | "outsideDeploymentRoot"
  | "sharedFolder"
  | "pathOutsideApplication"
  | "sectionsInSeveralRepositories"
  | "openMiroirTransaction"
  | "otherStagedChanges"
  | "nothingStaged"
  | "authorUnknown"
  | "invalidPayload"
  | "branchExists"
  | "unknownRevision"
  | "currentBranch"
  | "branchNotMerged"
  | "checkoutConflict"
  | "gitFailure";
