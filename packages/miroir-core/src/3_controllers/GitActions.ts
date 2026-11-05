/**
 * #679: the `gitAction_*` library implementations. They run in the process that owns the
 * deployment's files (the server, Electron main, or the in-process server of emulatedServer tests),
 * against `GitRepositoryInterface` only: the implementation is loaded through
 * `ConfigurationService.getGitRepositoryFactory`, on the first Git action.
 */
import { adminSelfApplication } from "miroir-app-admin";

import { defaultSelfApplicationDeploymentMap, type ApplicationDeploymentMap } from "../1_core/Deployment";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type { AuthPrincipal } from "../1_core/authentication/AuthenticationPolicy";
import type {
  ApplicationSection,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error, type Action2ReturnType } from "../0_interfaces/2_domain/DomainElement";
import {
  GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES,
  type GitAction,
  type GitBranchResult,
  type GitCloneAction,
  type GitCloneResult,
  type GitInstallClonedDeploymentAction,
  type GitInstallClonedDeploymentResult,
  type GitCheckoutResult,
  type GitCommitAction,
  type GitCommitFilesResult,
  type GitCommitResult,
  type GitDiffResult,
  type GitInitResult,
  type GitLogResult,
  type GitPathDescription,
  type GitPayloadCredential,
  type GitPullResult,
  type GitRemoteResult,
  type GitRepositoryDescription,
  type GitSetCredentialAction,
  type GitSetCredentialResult,
  type GitStatusResult,
  type GitTouchedDeployment,
  type GitTracking,
} from "../0_interfaces/3_controllers/GitAction";
import type {
  GitActionErrorReason,
  GitBranches,
  GitCredential,
  GitPerson,
  GitRepositoryErrorCode,
  GitRepositoryFactory,
  GitRepositoryInterface,
} from "../0_interfaces/4-services/GitRepositoryInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { gitPathIsInSections, gitPathToInstance, type GitSectionPaths } from "../2_domain/GitPathNaming";
import { metaModelEntities } from "../1_core/Model";
import { findClonedDeployments, type ClonedDeployment } from "../2_domain/GitClonedDeployments";

/** The sections whose folders belong to an application; Admin is shared by every application. */
const APPLICATION_SECTIONS: ApplicationSection[] = ["model", "data", "modelVersion", "devData"];

/** Files whose instance name is read for the changes panel; the rest are listed by path only. */
const NAMED_FILES_LIMIT = 500;

/** The remote every action uses when the payload names none. */
const DEFAULT_REMOTE = "origin";

/**
 * The `git.<host>` Admin secrets of the logged-in user (or of the process), reached through the
 * DomainController: the actions hold no secret store, the Git implementation sees only `onAuth` (D16).
 */
export type GitCredentialStore = {
  /** The secret's value, or undefined when there is none. */
  resolve: (name: string) => string | undefined;
  /** False without a wrapping key: nothing can be saved. */
  canSave: () => boolean;
  /** Saves the secret as a MiroirSecret row; returns its scope. */
  save: (name: string, value: string) => Promise<"user" | "process">;
};

export type GitActionContext = {
  factory: Promise<GitRepositoryFactory> | undefined;
  manager: PersistenceStoreControllerManagerInterface | undefined;
  applicationDeploymentMap: ApplicationDeploymentMap;
  principal?: AuthPrincipal;
  credentials?: GitCredentialStore;
  /** Registers and opens a deployment of a cloned folder (`gitAction_installClonedDeployment`). */
  deployments?: GitDeploymentInstaller;
};

/** A deployment of a clone, as the DomainController registers it in Admin and opens it. */
export type GitDeploymentInstallRequest = {
  selfApplication: Uuid;
  deploymentUuid: Uuid;
  /** The application's name, from its SelfApplication row. */
  name: string;
  /** The Admin section of the process, and the clone's sections. */
  configuration: StoreUnitConfiguration;
  /** The labels of the repository's own rows, when it has them. */
  adminApplication?: Record<string, unknown>;
  deployment: Record<string, unknown>;
};

/**
 * #683: what the DomainController gives the clone actions, which write no Admin row themselves: the same
 * Deployment creation path as the install runner, without creating the stores (the clone holds them).
 */
export type GitDeploymentInstaller = {
  /**
   * The Admin rows already there for the application or the deployment, read from the Admin store: a
   * create would replace them.
   */
  registered(selfApplication: Uuid, deploymentUuid: Uuid): Promise<{ application: boolean; deployment: boolean }>;
  install(request: GitDeploymentInstallRequest): Promise<Action2ReturnType>;
};

/** The name of the Admin secret holding the credential for a remote host (`host[:port]`). */
export function gitCredentialSecretName(host: string): string {
  return `git.${host}`;
}

/**
 * A remote URL as results show it: without the username and token a URL configured outside Miroir may hold
 * (`https://user:token@host/...`), which would otherwise reach the client and the page.
 */
export function displayedRemoteUrl(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.username && !parsed.password) {
      return url;
    }
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    // not a URL (an SCP-like SSH remote): `user@host:path` names no secret
    return url;
  }
}

/**
 * #679 D21: the remotes Git actions talk to are `http(s)` URLs: the implementation has no SSH transport.
 * Returns the parsed URL, or the refusal.
 */
export function checkRemoteUrl(url: unknown): URL | Action2Error {
  let parsed: URL | undefined;
  try {
    parsed = typeof url === "string" ? new URL(url) : undefined;
  } catch {
    parsed = undefined;
  }
  if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
    return gitActionError(
      "unsupportedRemoteProtocol",
      `Only http and https remotes are supported, not ${String(url)}: use the repository's HTTPS URL`,
      { url },
    );
  }
  return parsed;
}

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

async function loadFactory(context: GitActionContext): Promise<GitRepositoryFactory | Action2Error> {
  if (!context.factory) {
    return gitActionError("gitUnavailable", "No Git implementation is registered in this process");
  }
  try {
    return await context.factory;
  } catch (error) {
    return gitActionError("gitUnavailable", `The Git implementation failed to load: ${String(error)}`);
  }
}

async function resolveDeployment(
  action: GitAction,
  context: GitActionContext,
): Promise<ResolvedDeployment | Action2Error> {
  const factory = await loadFactory(context);
  if (factory instanceof Action2Error) {
    return factory;
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
  const branches = await repository.branches();
  const remote = await branchRemote(repository, branches);
  const url = await repository.remoteUrl(remote);
  return {
    ...description,
    branches,
    tracking: await tracking(repository, branches),
    ...(url ? { remote, remoteUrl: displayedRemoteUrl(url) } : {}),
    files: described,
  };
}

/** The remote the current branch's upstream is on, else `origin`: what Fetch, Pull and Push talk to. */
async function branchRemote(repository: GitRepositoryInterface, branches: GitBranches): Promise<string> {
  const upstream = branches.current ? await repository.upstream(branches.current) : undefined;
  return upstream ? splitUpstream(upstream).remote : DEFAULT_REMOTE;
}

/** The current branch against its upstream, as the last fetch left the remote-tracking branch. */
async function tracking(repository: GitRepositoryInterface, branches: GitBranches): Promise<GitTracking | undefined> {
  if (!branches.current) {
    return undefined;
  }
  const upstream = await repository.upstream(branches.current);
  if (!upstream) {
    return undefined;
  }
  try {
    return { upstream, ...(await repository.aheadBehind(branches.current, upstream)) };
  } catch {
    return undefined; // never fetched: no remote-tracking branch yet
  }
}

/**
 * #679 D7: the refusal of a commit, checkout or pull while the local cache holds Miroir changes not yet on
 * disk. A commit looks at the changes of its application; a checkout or a pull at every change, since it can
 * rewrite the files of any deployment in the repository.
 */
export function openMiroirTransactionError(
  action: GitAction,
  transaction: readonly { payload?: { application?: string } }[],
): Action2Error | undefined {
  if (!GIT_ACTIONS_NEEDING_SAVED_MIROIR_CHANGES.includes(action.actionType)) {
    return undefined;
  }
  // a checkout or a pull rewrites the files of every deployment in the repository, and the reload that
  // follows drops the unsaved changes of each of them, not only of the application named by the action
  const pending =
    action.actionType === "gitAction_checkout" || action.actionType === "gitAction_pull"
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
  authenticationRequired: "authenticationRequired",
  notFastForward: "notFastForward",
  pushRejected: "pushRejected",
  pushRefused: "pushRefused",
  remoteUnreachable: "remoteUnreachable",
  symbolicLink: "symbolicLink",
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

type Remote = {
  name: string;
  url: string;
  host: string;
  onAuth: () => GitCredential | undefined;
};

/**
 * The remote an action talks to, and how it authenticates: the payload's credential (used for this action
 * only), else the `git.<host>` secret.
 */
async function openRemote(
  repository: GitRepositoryInterface,
  name: string,
  credential: GitPayloadCredential | undefined,
  context: GitActionContext,
): Promise<Remote | Action2Error> {
  const url = await repository.remoteUrl(name);
  if (!url) {
    return gitActionError("noRemote", `The repository has no remote ${name}: set its URL first`, { remote: name });
  }
  return remoteOf(name, url, credential, context);
}

/** A remote at `url`, once its protocol is checked, and how it authenticates. */
function remoteOf(
  name: string,
  url: string,
  credential: GitPayloadCredential | undefined,
  context: GitActionContext,
): Remote | Action2Error {
  const parsed = checkRemoteUrl(url);
  if (parsed instanceof Action2Error) {
    return parsed;
  }
  const host = parsed.host;
  const onAuth = (): GitCredential | undefined => {
    if (nonEmptyString(credential?.username) && nonEmptyString(credential?.token)) {
      return { username: credential!.username, password: credential!.token };
    }
    const saved = context.credentials?.resolve(gitCredentialSecretName(host));
    try {
      const value = saved ? JSON.parse(saved) : undefined;
      return typeof value?.username === "string" && typeof value?.token === "string"
        ? { username: value.username, password: value.token }
        : undefined;
    } catch {
      return undefined;
    }
  };
  return { name, url, host, onAuth };
}

/** A refusal of the remote: `ExternalServiceUnauthorized` when it asks for credentials (D17). */
function remoteActionError(error: unknown, remote: Remote, actionType: string): Action2Error {
  const message = error instanceof Error ? error.message : String(error);
  const reason = repositoryErrorReason(error) ?? "gitFailure";
  if (reason === "authenticationRequired") {
    return new Action2Error("ExternalServiceUnauthorized", message, undefined, undefined, {
      reason,
      host: remote.host,
      remote: remote.name,
    });
  }
  return gitActionError(reason, message, { actionType, remote: remote.name, host: remote.host });
}

async function remoteResult(repository: GitRepositoryInterface, remote: Remote): Promise<GitRemoteResult> {
  const branches = await repository.branches();
  return {
    branches,
    remote: remote.name,
    url: displayedRemoteUrl(remote.url)!,
    tracking: await tracking(repository, branches),
  };
}

/** The remote and branch of the current branch's upstream (`origin/main`). */
function splitUpstream(upstream: string): { remote: string; branch: string } {
  const slash = upstream.indexOf("/");
  return { remote: upstream.slice(0, slash), branch: upstream.slice(slash + 1) };
}

/** A host as a URL gives it: a name or address, and an optional port. */
const HOST_PATTERN = /^[A-Za-z0-9.-]+(:[0-9]{1,5})?$|^\[[0-9A-Fa-f:.]+\](:[0-9]{1,5})?$/;

async function setCredential(action: GitSetCredentialAction, context: GitActionContext): Promise<Action2ReturnType> {
  const host = nonEmptyString(action.payload.host);
  const username = nonEmptyString(action.payload.username);
  const token = nonEmptyString(action.payload.token);
  if (!host || !HOST_PATTERN.test(host) || !username || !token) {
    return gitActionError("invalidPayload", "A credential needs a host (name[:port]), a username and a token");
  }
  if (!context.credentials?.canSave()) {
    return gitActionError(
      "secretsUnavailable",
      "gitAction_setCredential: a wrapping key is required to save the credential",
    );
  }
  // the name a remote URL's host gives: lower case, no default https port
  const name = gitCredentialSecretName(new URL(`https://${host}`).host);
  const scope = await context.credentials.save(name, JSON.stringify({ username, token }));
  return ok({ name, scope } satisfies GitSetCredentialResult);
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
  if (action.actionType === "gitAction_setCredential") {
    // a credential belongs to a host, not to a repository: no deployment is opened
    try {
      return await setCredential(action, context);
    } catch (error) {
      return gitActionError("secretsUnavailable", error instanceof Error ? error.message : String(error));
    }
  }
  if (action.actionType === "gitAction_clone" || action.actionType === "gitAction_installClonedDeployment") {
    // a clone makes a folder no deployment uses yet: there is no deployment to resolve
    try {
      return action.actionType === "gitAction_clone"
        ? await clone(action, context)
        : await installClonedDeployment(action, context);
    } catch (error) {
      return gitActionError(repositoryErrorReason(error) ?? "gitFailure", error instanceof Error ? error.message : String(error));
    }
  }
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
      case "gitAction_setRemote": {
        const parsed = checkRemoteUrl(action.payload.url);
        if (parsed instanceof Action2Error) {
          return parsed;
        }
        if (parsed.username || parsed.password) {
          // .git/config is a plain file: a token in the URL would be stored there in clear
          return gitActionError(
            "invalidPayload",
            "Give the remote URL without a username or token: Miroir asks for them when the remote needs them",
          );
        }
        const name = nonEmptyString(action.payload.remote) ?? DEFAULT_REMOTE;
        await repository.setRemote(name, action.payload.url);
        const remote = await openRemote(repository, name, undefined, context);
        return remote instanceof Action2Error ? remote : ok(await remoteResult(repository, remote));
      }
      case "gitAction_fetch": {
        const remote = await openRemote(
          repository,
          nonEmptyString(action.payload.remote) ?? (await branchRemote(repository, await repository.branches())),
          action.payload.credential,
          context,
        );
        if (remote instanceof Action2Error) {
          return remote;
        }
        try {
          await repository.fetch({ remote: remote.name, url: remote.url, onAuth: remote.onAuth });
        } catch (error) {
          return remoteActionError(error, remote, action.actionType);
        }
        return ok(await remoteResult(repository, remote));
      }
      case "gitAction_pull": {
        const branches = await repository.branches();
        if (!branches.current) {
          return gitActionError("detachedHead", "HEAD is detached: check out a branch to pull into it");
        }
        const upstream = await repository.upstream(branches.current);
        if (!upstream) {
          return gitActionError("noUpstream", `${branches.current} follows no remote branch: push it first`, {
            branch: branches.current,
          });
        }
        const remote = await openRemote(repository, splitUpstream(upstream).remote, action.payload.credential, context);
        if (remote instanceof Action2Error) {
          return remote;
        }
        // as for a checkout: isomorphic-git would overwrite a staged change
        const staged = await repository.stagedPaths();
        if (staged.length > 0) {
          return gitActionError(
            "checkoutConflict",
            "Staged changes would be lost by the pull: commit or unstage them first",
            { paths: staged },
          );
        }
        let outcome: Awaited<ReturnType<GitRepositoryInterface["fastForward"]>>;
        try {
          await repository.fetch({ remote: remote.name, url: remote.url, onAuth: remote.onAuth });
          outcome = await repository.fastForward(branches.current, upstream);
        } catch (error) {
          return remoteActionError(error, remote, action.actionType);
        }
        if (outcome.conflicts.length > 0) {
          return gitActionError(
            "checkoutConflict",
            "Uncommitted changes would be overwritten by the pull: commit or discard them first",
            { paths: outcome.conflicts },
          );
        }
        const touched = outcome.upToDate ? [] : touchedDeployments(description.root, resolved, context);
        await rebootTouchedStores(touched, context);
        const result: GitPullResult = {
          ...(await remoteResult(repository, remote)),
          upToDate: outcome.upToDate,
          touchedDeployments: touched,
        };
        return ok(result);
      }
      case "gitAction_push": {
        const branches = await repository.branches();
        if (!branches.current) {
          return gitActionError("detachedHead", "HEAD is detached: check out a branch to push it");
        }
        const remote = await openRemote(
          repository,
          await branchRemote(repository, branches),
          action.payload.credential,
          context,
        );
        if (remote instanceof Action2Error) {
          return remote;
        }
        try {
          await repository.push({ remote: remote.name, url: remote.url, branch: branches.current, onAuth: remote.onAuth });
        } catch (error) {
          return remoteActionError(error, remote, action.actionType);
        }
        return ok(await remoteResult(repository, remote));
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

// ################################################################################################
// #683: clone a repository into a folder of the deployment root, then install a deployment it holds
// ################################################################################################

/** A folder name of a clone's path: letters, digits, `.`, `-` and `_`. */
const FOLDER_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

type CloneTarget = { factory: GitRepositoryFactory; rootDirectory: string; folderName: string; directory: string };

/**
 * The folder of a clone: `folderName` is a path relative to the deployment root folder, with `/`
 * separators, that stays inside it (no `..`, no absolute path) and never goes through a `.git` folder.
 */
async function cloneTarget(folderName: unknown, context: GitActionContext): Promise<CloneTarget | Action2Error> {
  const factory = await loadFactory(context);
  if (factory instanceof Action2Error) {
    return factory;
  }
  const rootDirectory = context.manager?.filesystemDeploymentRootDirectory;
  if (!rootDirectory) {
    return gitActionError("notFilesystemDeployment", "This process has no deployment root folder to clone into");
  }
  const name = (typeof folderName === "string" ? folderName.trim() : "").replace(/\/+$/, "");
  const segments = name.split("/");
  if (
    name.startsWith("/") ||
    name.includes("\\") ||
    /^[A-Za-z]:/.test(name) ||
    segments.some((segment) => segment === "." || segment === "..")
  ) {
    return gitActionError(
      "outsideDeploymentRoot",
      `The clone must be a folder under the deployment root folder, not ${name}`,
      { folderName: name },
    );
  }
  if (
    name === "" ||
    segments.some((segment) => !FOLDER_SEGMENT_PATTERN.test(segment) || segment.toLowerCase() === ".git")
  ) {
    return gitActionError(
      "invalidFolderName",
      "Give the clone a folder name made of letters, digits, '.', '-' and '_' (with '/' between folders)",
      { folderName: name },
    );
  }
  const directory = factory.resolvePath(rootDirectory, name);
  // checked on the real paths too: a symbolic link under the root must not lead the clone out of it
  const [realRoot, realDirectory] = [await factory.realPath(rootDirectory), await factory.realPath(directory)];
  const realRelative = factory.relativePath(realRoot, realDirectory);
  if (factory.relativePath(rootDirectory, directory) !== name || realRelative === undefined || realRelative === "") {
    return gitActionError("outsideDeploymentRoot", `${name} is not a folder of the deployment root folder`, {
      folderName: name,
    });
  }
  // a clone inside the folder of an open deployment would mix its files with that deployment's
  const enclosing = (context.manager?.getPersistenceStoreControllers?.() ?? []).flatMap((deploymentUuid) =>
    Object.values(
      filesystemSectionDirectories(
        context.manager?.getPersistenceStoreConfiguration?.(deploymentUuid),
        rootDirectory,
        factory,
        [...APPLICATION_SECTIONS, "admin"],
      ),
    ).filter((sectionDirectory) => factory.relativePath(sectionDirectory, directory) !== undefined),
  );
  if (enclosing.length > 0) {
    return gitActionError("sharedFolder", `${name} is inside the folder of an open deployment`, {
      folderName: name,
      otherFolders: enclosing,
    });
  }
  return { factory, rootDirectory, folderName: name, directory };
}

async function scanClone(repository: GitRepositoryInterface, folderName: string) {
  return findClonedDeployments(
    await repository.listFiles(),
    (path) => repository.readFile(path, "HEAD"),
    folderName,
  );
}

function alreadyInstalled(deployment: ClonedDeployment, context: GitActionContext): boolean {
  return (
    context.applicationDeploymentMap[deployment.selfApplication] !== undefined ||
    (context.manager?.getPersistenceStoreControllers?.() ?? []).includes(deployment.deploymentUuid)
  );
}

function directoriesOf(deployment: ClonedDeployment): Record<string, string> {
  return Object.fromEntries(
    Object.entries(deployment.sections).map(([section, configuration]) => [section, String(configuration.directory)]),
  );
}

async function clone(action: GitCloneAction, context: GitActionContext): Promise<Action2ReturnType> {
  const target = await cloneTarget(action.payload.folderName, context);
  if (target instanceof Action2Error) {
    return target;
  }
  const url = nonEmptyString(action.payload.url);
  const parsed = checkRemoteUrl(url);
  if (parsed instanceof Action2Error) {
    return parsed;
  }
  if (parsed.username || parsed.password) {
    // the URL becomes origin's, in .git/config, a plain file
    return gitActionError(
      "invalidPayload",
      "Give the repository URL without a username or token: Miroir asks for them when the remote needs them",
    );
  }
  const remote = remoteOf(DEFAULT_REMOTE, url!, action.payload.credential, context);
  if (remote instanceof Action2Error) {
    return remote;
  }
  // one key for `Foo` and `foo`, which a case-insensitive filesystem holds in one folder
  return withRepositoryLock(target.directory.toLowerCase(), async () => {
    const state = await target.factory.directoryState(target.directory);
    // the folder this clone made, removed on a failure; an empty folder given is only emptied again
    const created = state === "missing" && (await target.factory.createDirectory(target.directory));
    if (state === "notEmpty" || state === "notAFolder" || (state === "missing" && !created)) {
      return gitActionError(
        "folderNotEmpty",
        `${target.folderName} already exists in the deployment root folder: give the clone another name`,
        { folderName: target.folderName },
      );
    }
    let repository: GitRepositoryInterface;
    try {
      repository = await target.factory.clone(target.directory, {
        remote: remote.name,
        url: remote.url,
        onAuth: remote.onAuth,
        branch: nonEmptyString(action.payload.branch),
      });
    } catch (error) {
      // a refused or broken clone leaves no folder behind: the next attempt can use the same name
      await target.factory.removeDirectory(target.directory, { contentsOnly: !created });
      if (repositoryErrorReason(error) === "symbolicLink") {
        return gitActionError("symbolicLink", error instanceof Error ? error.message : String(error), {
          folderName: target.folderName,
        });
      }
      return remoteActionError(error, remote, action.actionType);
    }
    const scan = await scanClone(repository, target.folderName);
    if (scan.deployments.length === 0) {
      // the clone stays: the designer may look at it, or delete it, outside Miroir
      return gitActionError(
        "noDeploymentFound",
        `The repository holds no Miroir deployment of the filesystem store: it is cloned in ${target.folderName}, and nothing was installed`,
        { folderName: target.folderName, root: repository.root, skipped: scan.skipped },
      );
    }
    const result: GitCloneResult = {
      folderName: target.folderName,
      root: repository.root,
      branches: await repository.branches(),
      deployments: scan.deployments.map((deployment) => ({
        deploymentUuid: deployment.deploymentUuid,
        selfApplication: deployment.selfApplication,
        name: deployment.name,
        deploymentFile: deployment.deploymentFile,
        directories: directoriesOf(deployment),
        alreadyInstalled: alreadyInstalled(deployment, context),
      })),
      skipped: scan.skipped,
    };
    return ok(result);
  });
}

async function installClonedDeployment(
  action: GitInstallClonedDeploymentAction,
  context: GitActionContext,
): Promise<Action2ReturnType> {
  const target = await cloneTarget(action.payload.folderName, context);
  if (target instanceof Action2Error) {
    return target;
  }
  return withRepositoryLock(target.directory.toLowerCase(), async () => {
    const root = await target.factory.findRoot(target.directory);
    if (!root || target.factory.relativePath(root, target.directory) !== "") {
      return gitActionError("notARepository", `${target.folderName} is not a cloned repository`, {
        directory: target.directory,
      });
    }
    // the deployment is read from the clone again: a client gives no directory of its own
    const repository = await target.factory.open(root);
    const links = await repository.symbolicLinks();
    if (links.length > 0) {
      // a checkout since the clone may have brought some: the stores would follow them
      return gitActionError("symbolicLink", `${target.folderName} holds symbolic links: ${links.slice(0, 5).join(", ")}`, {
        folderName: target.folderName,
      });
    }
    const scan = await scanClone(repository, target.folderName);
    const wanted = nonEmptyString(action.payload.deploymentUuid);
    const candidates = wanted
      ? scan.deployments.filter((deployment) => deployment.deploymentUuid === wanted)
      : scan.deployments;
    if (scan.deployments.length === 0) {
      return gitActionError("noDeploymentFound", `${target.folderName} holds no Miroir deployment`, {
        folderName: target.folderName,
        skipped: scan.skipped,
      });
    }
    if (candidates.length === 0) {
      return gitActionError("unknownClonedDeployment", `${target.folderName} holds no deployment ${wanted}`, {
        folderName: target.folderName,
        deployments: scan.deployments.map((deployment) => deployment.deploymentUuid),
      });
    }
    if (candidates.length > 1) {
      return gitActionError(
        "severalDeploymentsFound",
        `${target.folderName} holds ${candidates.length} deployments: say which one to install`,
        {
          folderName: target.folderName,
          deployments: candidates.map(({ deploymentUuid, name }) => ({ deploymentUuid, name })),
        },
      );
    }
    const deployment = candidates[0];
    if (alreadyInstalled(deployment, context)) {
      return gitActionError(
        "applicationAlreadyDeployed",
        `${deployment.name} already has a deployment here: drop it before installing the one of the clone`,
        { application: deployment.selfApplication, deploymentUuid: deployment.deploymentUuid },
      );
    }
    const adminDeploymentUuid =
      context.applicationDeploymentMap[adminSelfApplication.uuid] ??
      defaultSelfApplicationDeploymentMap[adminSelfApplication.uuid];
    const adminSection = context.manager?.getPersistenceStoreConfiguration?.(adminDeploymentUuid)?.admin;
    if (!adminSection) {
      return gitActionError("unknownDeployment", "The Admin deployment of this process is not open", {
        deploymentUuid: adminDeploymentUuid,
      });
    }
    if (!context.deployments) {
      return gitActionError("gitUnavailable", "This process cannot install deployments");
    }
    // the work tree may differ from HEAD: a store folder must not be a file
    for (const [section, directory] of Object.entries(directoriesOf(deployment))) {
      if ((await target.factory.directoryState(target.factory.resolvePath(target.rootDirectory, directory))) === "notAFolder") {
        return gitActionError("invalidPayload", `The ${section} folder of the deployment, ${directory}, is a file`, {
          folderName: target.folderName,
          section,
        });
      }
    }
    // the client's map can miss an application Admin registers: Admin itself is asked
    const registered = await context.deployments.registered(deployment.selfApplication, deployment.deploymentUuid);
    if (registered.application || registered.deployment) {
      return gitActionError(
        "applicationAlreadyDeployed",
        registered.deployment
          ? `Admin already has a deployment ${deployment.deploymentUuid}: drop it before installing the one of the clone`
          : `${deployment.name} is already registered in Admin: drop it before installing the one of the clone`,
        { application: deployment.selfApplication, deploymentUuid: deployment.deploymentUuid },
      );
    }
    const installed = await context.deployments.install({
      selfApplication: deployment.selfApplication,
      deploymentUuid: deployment.deploymentUuid,
      name: deployment.name,
      configuration: { ...deployment.sections, admin: adminSection } as StoreUnitConfiguration,
      adminApplication: deployment.adminApplication,
      deployment: deployment.deployment,
    });
    if (installed instanceof Action2Error || installed?.status !== "ok") {
      return installed;
    }
    const result: GitInstallClonedDeploymentResult = {
      application: deployment.selfApplication,
      deploymentUuid: deployment.deploymentUuid,
      name: deployment.name,
      directories: directoriesOf(deployment),
    };
    return ok(result);
  });
}
