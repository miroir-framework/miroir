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
import type {
  GitAction,
  GitCommitFilesResult,
  GitDiffResult,
  GitInitResult,
  GitLogResult,
  GitPathDescription,
  GitRepositoryDescription,
  GitStatusResult,
} from "../0_interfaces/3_controllers/GitAction";
import type {
  GitActionErrorReason,
  GitRepositoryFactory,
  GitRepositoryInterface,
} from "../0_interfaces/4-services/GitRepositoryInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { gitPathIsInSections, gitPathToInstance, type GitSectionPaths } from "../2_domain/GitPathNaming";

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

/** Runs one Git action in the process that owns the deployment's files. */
export async function runGitAction(action: GitAction, context: GitActionContext): Promise<Action2ReturnType> {
  const resolved = await resolveDeployment(action, context);
  if (resolved instanceof Action2Error) {
    return resolved;
  }
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
      // a deployment ignored by an enclosing repository gets its own nested repository
      if ((await openRepository(action, resolved)) instanceof Action2Error) {
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
      default:
        return new Action2Error(
          "InvalidAction",
          `Unknown Git action ${(action as { actionType?: string }).actionType}`,
        );
    }
  } catch (error) {
    return gitActionError("gitFailure", error instanceof Error ? error.message : String(error), {
      actionType: action.actionType,
    });
  }
}
