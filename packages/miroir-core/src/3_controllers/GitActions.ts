/**
 * #679: the `gitAction_*` library implementations. They run in the process that owns the
 * deployment's files (the server, Electron main, or the in-process server of emulatedServer tests),
 * against `GitRepositoryInterface` only: the implementation is loaded through
 * `ConfigurationService.getGitRepositoryFactory`, on the first Git action.
 */
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import type { AuthPrincipal } from "../1_core/authentication/AuthenticationPolicy";
import type { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error, type Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES,
  type GitAction,
  type GitBranchResult,
  type GitCheckoutResult,
  type GitCommitAction,
  type GitCommitFilesResult,
  type GitCommitResult,
  type GitDiffResult,
  type GitInitResult,
  type GitLogResult,
  type GitPathDescription,
  type GitRepositoryDescription,
  type GitStatusResult,
  type GitTouchedDeployment,
} from "../0_interfaces/3_controllers/GitAction";
import type {
  GitActionErrorReason,
  GitPerson,
  GitRepositoryErrorCode,
  GitRepositoryFactory,
  GitRepositoryInterface,
} from "../0_interfaces/4-services/GitRepositoryInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { gitPathIsInSections, gitPathToInstance, type GitSectionPaths } from "../2_domain/GitPathNaming";
import { metaModelEntities } from "../1_core/Model";

/** The sections whose folders belong to an application; Admin is shared by every application. */
const APPLICATION_SECTIONS: ApplicationSection[] = ["model", "data", "modelVersion", "devData"];

/** Files whose instance name is read for the changes panel; the rest are listed by path only. */
const NAMED_FILES_LIMIT = 500;

export type GitActionContext = {
  factory: Promise<GitRepositoryFactory> | undefined;
  manager: PersistenceStoreControllerManagerInterface | undefined;
  applicationDeploymentMap: ApplicationDeploymentMap;
  principal?: AuthPrincipal;
};

export function gitActionError(
  reason: GitActionErrorReason,
  message: string,
  context: Record<string, unknown> = {},
): Action2Error {
  return new Action2Error("InvalidAction", message, undefined, undefined, { reason, ...context });
}

function ok(returnedDomainElement: unknown): Action2ReturnType {
  return { status: "ok", returnedDomainElement: returnedDomainElement as any };
}

type ResolvedDeployment = {
  factory: GitRepositoryFactory;
  /** Absolute folder of each filesystem section. */
  sectionDirectories: Partial<Record<ApplicationSection, string>>;
  rootDirectory: string;
  /** Absolute section folders of the other open deployments. */
  otherDirectories: string[];
};

async function resolveDeployment(
  action: GitAction,
  context: GitActionContext,
): Promise<ResolvedDeployment | Action2Error> {
  if (!context.factory) {
    return gitActionError("gitUnavailable", "No Git implementation is registered in this process");
  }
  let factory: GitRepositoryFactory;
  try {
    factory = await context.factory;
  } catch (error) {
    return gitActionError("gitUnavailable", `The Git implementation failed to load: ${String(error)}`);
  }
  const application = action.payload?.application;
  const deploymentUuid = application ? context.applicationDeploymentMap[application] : undefined;
  const configuration = deploymentUuid
    ? context.manager?.getPersistenceStoreConfiguration?.(deploymentUuid)
    : undefined;
  if (!deploymentUuid || !configuration) {
    return gitActionError(
      "unknownDeployment",
      `No open deployment for application ${application}`,
      { application, deploymentUuid },
    );
  }
  const rootDirectory = context.manager?.filesystemDeploymentRootDirectory;
  const sectionDirectories = rootDirectory
    ? filesystemSectionDirectories(configuration, rootDirectory, factory, APPLICATION_SECTIONS)
    : {};
  if (Object.keys(sectionDirectories).length === 0 || !rootDirectory) {
    return gitActionError(
      "notFilesystemDeployment",
      `The deployment of application ${application} has no filesystem section`,
      { application, deploymentUuid },
    );
  }
  // the folders of every other open deployment, Admin included: a repository created for this one
  // must not hold them
  const otherDirectories = (context.manager?.getPersistenceStoreControllers?.() ?? [])
    .filter((other) => other !== deploymentUuid)
    .flatMap((other) =>
      Object.values(
        filesystemSectionDirectories(context.manager?.getPersistenceStoreConfiguration?.(other), rootDirectory, factory, [
          ...APPLICATION_SECTIONS,
          "admin",
        ]),
      ),
    );
  return { factory, sectionDirectories, rootDirectory, otherDirectories };
}

/** Absolute folder of each filesystem section of a deployment configuration. */
function filesystemSectionDirectories(
  configuration: unknown,
  rootDirectory: string,
  factory: GitRepositoryFactory,
  sections: readonly string[],
): Partial<Record<ApplicationSection, string>> {
  const result: Partial<Record<ApplicationSection, string>> = {};
  for (const section of sections as ApplicationSection[]) {
    const sectionConfiguration = (configuration as Record<string, unknown> | undefined)?.[section] as
      | { emulatedServerType?: string; directory?: string }
      | undefined;
    if (sectionConfiguration?.emulatedServerType === "filesystem" && sectionConfiguration.directory) {
      result[section] = factory.resolvePath(rootDirectory, sectionConfiguration.directory);
    }
  }
  return result;
}

/**
 * #679: a path a client names (`gitAction_diff`) is repository-relative, inside the application's
 * section folders, and never in `.git`: no absolute path, no `..`, no other file of the host.
 */
export function isApplicationRepositoryPath(path: string, sectionPaths: GitSectionPaths): boolean {
  if (typeof path !== "string" || path === "" || path.includes("\\") || path.includes("\0")) {
    return false;
  }
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    return false;
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return false;
  }
  if (segments.some((segment) => segment.toLowerCase() === ".git")) {
    return false;
  }
  return gitPathIsInSections(path, sectionPaths);
}

type OpenedRepository = {
  repository: GitRepositoryInterface;
  description: GitRepositoryDescription;
};

async function openRepository(
  action: GitAction,
  resolved: ResolvedDeployment,
): Promise<OpenedRepository | Action2Error> {
  const { factory, sectionDirectories } = resolved;
  const directory = factory.commonDirectory(Object.values(sectionDirectories) as string[]);
  const anchor = sectionDirectories.model ?? Object.values(sectionDirectories)[0]!;
  const root = await factory.findRoot(anchor);
  if (!root) {
    return gitActionError(
      "notARepository",
      `The deployment of application ${action.payload.application} is not in a Git repository`,
      { directory },
    );
  }
  // every section must be in that one repository: a section in another one would drop out of every result
  const otherRepositories: Record<string, string | undefined> = {};
  for (const [section, sectionDirectory] of Object.entries(sectionDirectories)) {
    const sectionRoot = await factory.findRoot(sectionDirectory as string);
    if (sectionRoot !== root) {
      otherRepositories[section] = sectionRoot;
    }
  }
  if (Object.keys(otherRepositories).length > 0) {
    return gitActionError(
      "sectionsInSeveralRepositories",
      `The sections of application ${action.payload.application} are not all in the Git repository ${root}`,
      { directory, root, otherRepositories },
    );
  }
  const repository = await factory.open(root);
  const sectionPaths: GitSectionPaths = {};
  for (const [section, sectionDirectory] of Object.entries(sectionDirectories)) {
    const relative = factory.relativePath(root, sectionDirectory as string);
    if (relative !== undefined) {
      sectionPaths[section as ApplicationSection] = relative;
    }
  }
  // an enclosing repository that ignores every section (a deployment under a gitignored folder) does not
  // version the deployment
  const tracked = await Promise.all(
    Object.values(sectionPaths).map(async (folder) => folder === "" || !(await repository.isIgnored(folder!))),
  );
  if (!tracked.includes(true)) {
    return gitActionError(
      "notARepository",
      `The deployment of application ${action.payload.application} is ignored by the enclosing Git repository ${root}`,
      { directory, enclosingRoot: root },
    );
  }
  return { repository, description: { root, sectionPaths } };
}

async function describePath(
  repository: GitRepositoryInterface,
  path: string,
  sectionPaths: GitSectionPaths,
  readName: boolean,
  ref?: string,
): Promise<GitPathDescription> {
  const inApplication = gitPathIsInSections(path, sectionPaths);
  const instance = gitPathToInstance(path, sectionPaths);
  if (!instance) {
    return { inApplication };
  }
  let instanceName: string | undefined;
  if (readName) {
    const text = (await repository.readFile(path, ref)) ?? (ref ? undefined : await repository.readFile(path, "HEAD"));
    try {
      const parsed = text ? JSON.parse(text) : undefined;
      const candidate = parsed?.name ?? parsed?.defaultLabel;
      instanceName = typeof candidate === "string" ? candidate : undefined;
    } catch {
      instanceName = undefined;
    }
  }
  return { ...instance, instanceName, inApplication };
}

function sectionFilters(sectionPaths: GitSectionPaths): string[] {
  const folders = Object.values(sectionPaths).filter((folder): folder is string => typeof folder === "string");
  return folders.includes("") ? ["."] : folders;
}

async function status(opened: OpenedRepository, includeOtherChanges: boolean): Promise<GitStatusResult> {
  const { repository, description } = opened;
  const files = await repository.status(includeOtherChanges ? undefined : sectionFilters(description.sectionPaths));
  const described = await Promise.all(
    files.map(async (file, index) => ({
      ...file,
      ...(await describePath(repository, file.path, description.sectionPaths, index < NAMED_FILES_LIMIT)),
    })),
  );
  return { ...description, branches: await repository.branches(), files: described };
}

/**
 * #679 D7: the refusal of a commit or checkout while the local cache holds Miroir changes not yet on disk.
 * A commit looks at the changes of its application; a checkout at every change, since it can rewrite the
 * files of any deployment in the repository.
 */
export function openMiroirTransactionError(
  action: GitAction,
  transaction: readonly { payload?: { application?: string } }[],
): Action2Error | undefined {
  if (!GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES.includes(action.actionType)) {
    return undefined;
  }
  const pending =
    action.actionType === "gitAction_checkout"
      ? transaction
      : transaction.filter((change) => change.payload?.application === action.payload?.application);
  if (pending.length === 0) {
    return undefined;
  }
  return gitActionError(
    "openMiroirTransaction",
    "Miroir changes are not saved yet: commit them in Miroir first",
    {
      pendingChanges: pending.length,
      applications: [...new Set(pending.map((change) => change.payload?.application))],
    },
  );
}

const REPOSITORY_ERROR_REASONS: Record<GitRepositoryErrorCode, GitActionErrorReason> = {
  branchExists: "branchExists",
  unknownRevision: "unknownRevision",
  invalidRefName: "invalidPayload",
  outsideWorkTree: "pathOutsideApplication",
};

function repositoryErrorReason(error: unknown): GitActionErrorReason | undefined {
  // matched by name, not instanceof: the implementation may come with its own copy of core
  const candidate = error as { name?: unknown; code?: unknown } | undefined;
  return candidate?.name === "GitRepositoryError" && typeof candidate.code === "string"
    ? REPOSITORY_ERROR_REASONS[candidate.code as GitRepositoryErrorCode]
    : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * The paths a stage or unstage action works on: the payload's, each a changed file (never a folder) of the
 * application's sections, or with `all` every changed file of the sections; of those, the ones `pick` keeps.
 */
async function pathsToStage(
  opened: OpenedRepository,
  payload: { paths?: unknown; all?: unknown },
  pick: (file: { staged: boolean; unstaged: boolean }) => boolean,
): Promise<string[] | Action2Error> {
  if (payload.all === true) {
    const files = await opened.repository.status(sectionFilters(opened.description.sectionPaths));
    return files.filter(pick).map((file) => file.path);
  }
  const paths = payload.paths;
  if (!Array.isArray(paths) || paths.length === 0) {
    return gitActionError("invalidPayload", "Name the paths to change, or set all");
  }
  const refused = paths.filter(
    (path) => !isApplicationRepositoryPath(path as string, opened.description.sectionPaths),
  );
  if (refused.length > 0) {
    return gitActionError("pathOutsideApplication", "A path is not a file of the application's sections", {
      paths: refused,
    });
  }
  // a folder, or an unchanged file, has no status row of its own
  const files = await opened.repository.status(paths as string[]);
  const changed = new Set(files.map((file) => file.path));
  const unknown = (paths as string[]).filter((path) => !changed.has(path));
  if (unknown.length > 0) {
    return gitActionError("invalidPayload", "A path is not a changed file of the application", { paths: unknown });
  }
  return files.filter(pick).map((file) => file.path);
}

/** The commit's author: the payload's, else the logged-in user, else the repository's configuration. */
async function commitAuthor(
  action: GitCommitAction,
  repository: GitRepositoryInterface,
  principal: AuthPrincipal | undefined,
): Promise<GitPerson | undefined> {
  const explicitName = nonEmptyString(action.payload.author?.name);
  if (explicitName) {
    return { name: explicitName, email: nonEmptyString(action.payload.author?.email) ?? "" };
  }
  if (principal?.username) {
    // MiroirUser has no email attribute
    return { name: principal.username, email: "" };
  }
  const configuredName = nonEmptyString(await repository.getConfig("user.name"));
  if (!configuredName) {
    return undefined;
  }
  return { name: configuredName, email: nonEmptyString(await repository.getConfig("user.email")) ?? "" };
}

async function commit(
  action: GitCommitAction,
  opened: OpenedRepository,
  principal: AuthPrincipal | undefined,
): Promise<Action2ReturnType> {
  const { repository, description } = opened;
  const message = nonEmptyString(action.payload.message);
  if (!message) {
    return gitActionError("invalidPayload", "A commit needs a message");
  }
  const staged = await repository.stagedPaths();
  if (staged.length === 0) {
    return gitActionError("nothingStaged", "No change is staged");
  }
  const others = staged.filter((path) => !gitPathIsInSections(path, description.sectionPaths));
  if (others.length > 0 && action.payload.includeOtherStagedChanges !== true) {
    return gitActionError(
      "otherStagedChanges",
      "Files outside the application's sections are staged; include them, or unstage them first",
      { paths: others },
    );
  }
  const author = await commitAuthor(action, repository, principal);
  if (!author) {
    return gitActionError("authorUnknown", "Give the commit's author: no user is logged in and the repository has no user.name");
  }
  if (action.payload.rememberAuthor === true && nonEmptyString(action.payload.author?.name)) {
    await repository.setConfig("user.name", author.name);
    await repository.setConfig("user.email", author.email);
  }
  const oid = await repository.commit(message, author);
  return ok({ oid, author, files: staged } satisfies GitCommitResult);
}

/** The deployments of the map with a section folder inside the repository: a checkout may rewrite them. */
function touchedDeployments(
  root: string,
  resolved: ResolvedDeployment,
  context: GitActionContext,
): GitTouchedDeployment[] {
  return Object.entries(context.applicationDeploymentMap)
    .filter(([, deploymentUuid]) =>
      Object.values(
        filesystemSectionDirectories(
          context.manager?.getPersistenceStoreConfiguration?.(deploymentUuid),
          resolved.rootDirectory,
          resolved.factory,
          [...APPLICATION_SECTIONS, "admin"],
        ),
      ).some((directory) => resolved.factory.relativePath(root, directory as string) !== undefined),
    )
    .map(([application, deploymentUuid]) => ({ application, deploymentUuid }));
}

/** The tail of the Git actions running on each repository, by root folder. */
const repositoryLocks = new Map<string, Promise<unknown>>();

/**
 * Runs Git actions on one repository one after the other: a checkout's check for staged changes and the
 * checkout itself must not interleave with a stage from another client. Covers this process, which is the
 * one that owns the files.
 */
async function withRepositoryLock<T>(key: string, run: () => Promise<T>): Promise<T> {
  const next = (repositoryLocks.get(key) ?? Promise.resolve()).then(run, run);
  const settled = next.catch(() => undefined);
  repositoryLocks.set(key, settled);
  try {
    return await next;
  } finally {
    if (repositoryLocks.get(key) === settled) {
      repositoryLocks.delete(key);
    }
  }
}

/**
 * After files changed under them, the filesystem stores of the touched deployments read the Entities of
 * their model again: an Entity the checkout brought with a non-uuid `idAttribute` is then saved by it.
 */
async function rebootTouchedStores(touched: GitTouchedDeployment[], context: GitActionContext): Promise<void> {
  for (const { deploymentUuid } of touched) {
    try {
      await context.manager?.getPersistenceStoreController?.(deploymentUuid)?.bootFromPersistedState(metaModelEntities);
    } catch {
      // the DomainController's reload reports a deployment that cannot be read
    }
  }
}

/** Runs one Git action in the process that owns the deployment's files. */
export async function runGitAction(action: GitAction, context: GitActionContext): Promise<Action2ReturnType> {
  const resolved = await resolveDeployment(action, context);
  if (resolved instanceof Action2Error) {
    return resolved;
  }
  const sectionDirectories = Object.values(resolved.sectionDirectories) as string[];
  const anchor = resolved.sectionDirectories.model ?? sectionDirectories[0];
  const lockKey =
    (await resolved.factory.findRoot(anchor).catch(() => undefined)) ??
    resolved.factory.commonDirectory(sectionDirectories);
  return withRepositoryLock(lockKey, () => runOnDeployment(action, resolved, context));
}

async function runOnDeployment(
  action: GitAction,
  resolved: ResolvedDeployment,
  context: GitActionContext,
): Promise<Action2ReturnType> {
  try {
    if (action.actionType === "gitAction_init") {
      const directory = resolved.factory.commonDirectory(Object.values(resolved.sectionDirectories) as string[]);
      const inRoot = resolved.factory.relativePath(resolved.rootDirectory, directory);
      if (inRoot === undefined || inRoot === "") {
        return gitActionError(
          "outsideDeploymentRoot",
          `A repository in ${directory} would not be in a folder of its own under the deployment root ${resolved.rootDirectory}`,
          { directory },
        );
      }
      const shared = resolved.otherDirectories.filter(
        (other) => resolved.factory.relativePath(directory, other) !== undefined,
      );
      if (shared.length > 0) {
        return gitActionError(
          "sharedFolder",
          "The folder holding this application's sections also holds other deployments; move them apart first",
          { directory, otherFolders: shared },
        );
      }
      // a deployment ignored by an enclosing repository gets its own nested repository; any other refusal
      // (sections in several repositories) stands
      const existing = await openRepository(action, resolved);
      if (existing instanceof Action2Error && existing.errorContext?.reason !== "notARepository") {
        return existing;
      }
      if (existing instanceof Action2Error) {
        await resolved.factory.init(directory);
      }
      const opened = await openRepository(action, resolved);
      if (opened instanceof Action2Error) {
        return opened;
      }
      return ok(opened.description satisfies GitInitResult);
    }
    const opened = await openRepository(action, resolved);
    if (opened instanceof Action2Error) {
      return opened;
    }
    const { repository, description } = opened;
    switch (action.actionType) {
      case "gitAction_status":
        return ok(await status(opened, action.payload.includeOtherChanges === true));
      case "gitAction_log": {
        const result: GitLogResult = {
          ...description,
          branches: await repository.branches(),
          commits: await repository.log({ ref: action.payload.ref, depth: action.payload.depth ?? 200 }),
        };
        return ok(result);
      }
      case "gitAction_commitFiles": {
        const paths = await repository.commitFiles(action.payload.oid);
        const result: GitCommitFilesResult = {
          oid: action.payload.oid,
          files: await Promise.all(
            paths.map(async (path, index) => ({
              path,
              ...(await describePath(
                repository,
                path,
                description.sectionPaths,
                index < NAMED_FILES_LIMIT,
                action.payload.oid,
              )),
            })),
          ),
        };
        return ok(result);
      }
      case "gitAction_diff": {
        if (!isApplicationRepositoryPath(action.payload.path, description.sectionPaths)) {
          return gitActionError("pathOutsideApplication", "The path is not a file of the application's sections", {
            path: action.payload.path,
          });
        }
        const diff = await repository.diff(action.payload.path, {
          from: action.payload.from,
          to: action.payload.to,
        });
        const result: GitDiffResult = {
          ...diff,
          ...(await describePath(repository, action.payload.path, description.sectionPaths, true)),
        };
        return ok(result);
      }
      case "gitAction_stage":
      case "gitAction_unstage": {
        const staging = action.actionType === "gitAction_stage";
        const paths = await pathsToStage(opened, action.payload, (file) => (staging ? file.unstaged : file.staged));
        if (paths instanceof Action2Error) {
          return paths;
        }
        if (paths.length > 0) {
          await (staging ? repository.stage(paths) : repository.unstage(paths));
        }
        return ok(await status(opened, false));
      }
      case "gitAction_commit":
        return await commit(action, opened, context.principal);
      case "gitAction_createBranch": {
        const name = nonEmptyString(action.payload.name);
        if (!name) {
          return gitActionError("invalidPayload", "A branch needs a name");
        }
        await repository.createBranch(name, nonEmptyString(action.payload.startPoint));
        return ok({ branches: await repository.branches() } satisfies GitBranchResult);
      }
      case "gitAction_deleteBranch": {
        const name = nonEmptyString(action.payload.name);
        if (!name) {
          return gitActionError("invalidPayload", "Name the branch to delete");
        }
        const branches = await repository.branches();
        if (branches.current === name) {
          return gitActionError("currentBranch", `${name} is the current branch: check out another one first`, {
            name,
          });
        }
        if (!branches.local.includes(name)) {
          return gitActionError("unknownRevision", `There is no branch ${name}`, { name });
        }
        // isomorphic-git keeps no reflog: the commits of a deleted branch nothing else reaches are lost
        if (action.payload.force !== true && !(await repository.branchIsMergedIntoHead(name))) {
          return gitActionError(
            "branchNotMerged",
            `${name} has commits the current branch does not have: deleting it loses them`,
            { name },
          );
        }
        await repository.deleteBranch(name);
        return ok({ branches: await repository.branches() } satisfies GitBranchResult);
      }
      case "gitAction_checkout": {
        const ref = nonEmptyString(action.payload.ref);
        if (!ref) {
          return gitActionError("invalidPayload", "Name the branch, tag or commit to check out");
        }
        // isomorphic-git compares the target with the index only: a staged change would be overwritten
        const staged = await repository.stagedPaths();
        if (staged.length > 0) {
          return gitActionError(
            "checkoutConflict",
            "Staged changes would be lost by the checkout: commit or unstage them first",
            { paths: staged },
          );
        }
        const { conflicts } = await repository.checkout(ref);
        if (conflicts.length > 0) {
          return gitActionError(
            "checkoutConflict",
            "Uncommitted changes would be overwritten by the checkout: commit or discard them first",
            { paths: conflicts },
          );
        }
        const touched = touchedDeployments(description.root, resolved, context);
        await rebootTouchedStores(touched, context);
        const result: GitCheckoutResult = { branches: await repository.branches(), touchedDeployments: touched };
        return ok(result);
      }
      default:
        return new Action2Error(
          "InvalidAction",
          `Unknown Git action ${(action as { actionType?: string }).actionType}`,
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return gitActionError(repositoryErrorReason(error) ?? "gitFailure", message, {
      actionType: action.actionType,
    });
  }
}
