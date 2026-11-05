/**
 * #679 (#683): the deployments a cloned repository holds, found in its files the way package assets
 * store them: `<package>/assets/deployment/<uuid>.json` rows of the Deployment Entity, whose section
 * directories (relative to the deployment root folder, as `<package>/assets/<prefix>_model`) are
 * rewritten to point inside the clone.
 */

/** The Deployment Entity: its rows are the deployments of an application. */
export const DEPLOYMENT_ENTITY_UUID = "7959d814-400c-4e80-988f-a00fe582ab98";
/** The AdminApplication Entity: the row that registers an application in Admin. */
export const ADMIN_APPLICATION_ENTITY_UUID = "25d935e7-9e93-42c2-aade-0472b883492b";
/** The SelfApplication Entity: the application's own row, in its model section. */
export const SELF_APPLICATION_ENTITY_UUID = "a659d350-dd97-4da9-91de-524fa01745dc";

/** A section of a deployment configuration, as stored in a Deployment row. */
export type ClonedSectionConfiguration = { emulatedServerType: string; directory?: string } & Record<string, unknown>;

export type ClonedDeployment = {
  deploymentUuid: string;
  selfApplication: string;
  /** The application's name, from its SelfApplication row. */
  name: string;
  /** The repository-relative file of the Deployment row. */
  deploymentFile: string;
  /** The Deployment row as the repository stores it. */
  deployment: Record<string, unknown>;
  /** The AdminApplication row next to it, when the repository has one. */
  adminApplication?: Record<string, unknown>;
  /**
   * The non-admin sections, their `directory` relative to the deployment root folder: `<folder>/<path in
   * the repository>`.
   */
  sections: Record<string, ClonedSectionConfiguration>;
};

/** A deployment row of the repository that cannot be opened from the clone, and why. */
export type SkippedClonedDeployment = { deploymentFile: string; reason: string };

export type ClonedDeploymentScan = { deployments: ClonedDeployment[]; skipped: SkippedClonedDeployment[] };

const DEPLOYMENT_FILE = /^(?:(.*)\/)?assets\/deployment\/([^/]+)\.json$/;
/** The uuids of a cloned row name files of the Admin store: nothing but a uuid is accepted. */
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
/** A folder name of a section directory. */
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
/** The sections a cloned deployment may open; `admin` is the process' own. */
const CLONED_SECTIONS = new Set(["model", "data", "modelVersion", "devData"]);

/** A path of plain folder names, with `/` separators: no `..`, no `.`, no backslash, not absolute. */
function isPlainRelativePath(path: string): boolean {
  const segments = path.split("/");
  return segments.every((segment) => SEGMENT_PATTERN.test(segment) && segment !== "." && segment !== "..");
}

function dirname(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash < 0 ? "" : path.slice(0, slash);
}

function join(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split("/"))
    .filter((segment) => segment !== "" && segment !== ".")
    .join("/");
}

function parseJson(text: string | undefined): Record<string, unknown> | undefined {
  if (text === undefined) {
    return undefined;
  }
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The repository folder a section directory names. The directory is relative to the deployment root
 * folder of the machine the repository was made on: `<package>/assets/...` when the repository is the
 * package itself or holds it, `<package>/...` under `packages/` in a monorepo.
 */
function sectionFolder(directory: string, packageFolder: string, folders: Set<string>): string | undefined {
  const segments = directory.split("/").filter((segment) => segment !== "" && segment !== ".");
  // `../<package>/assets/...`: a deployment written for a root one folder down
  while (segments[0] === "..") {
    segments.shift();
  }
  if (segments.length === 0 || !segments.every((segment) => SEGMENT_PATTERN.test(segment) && segment !== "..")) {
    return undefined;
  }
  const candidates = [
    // `<package>/<rest>`: the rest, inside the package folder (never the package folder itself)
    segments.length > 1 ? join(packageFolder, segments.slice(1).join("/")) : "",
    join(dirname(packageFolder), segments.join("/")),
    segments.join("/"),
  ];
  return candidates.find((candidate) => candidate !== "" && folders.has(candidate));
}

/** Every folder holding a file of `files`, at any depth. */
function foldersOf(files: string[]): Set<string> {
  const folders = new Set<string>();
  for (const file of files) {
    let folder = dirname(file);
    while (folder !== "" && !folders.has(folder)) {
      folders.add(folder);
      folder = dirname(folder);
    }
  }
  return folders;
}

/**
 * The deployments of `files` (repository-relative, `/` separators) that can be opened from the clone at
 * `cloneFolder` (relative to the deployment root folder): every filesystem section found in the
 * repository, and the SelfApplication row in the model section. Git keeps no empty folder, so a data
 * section absent from the repository is placed next to the model section.
 */
export async function findClonedDeployments(
  files: string[],
  readFile: (path: string) => Promise<string | undefined>,
  cloneFolder: string,
): Promise<ClonedDeploymentScan> {
  const folders = foldersOf(files);
  const fileSet = new Set(files);
  const deployments: ClonedDeployment[] = [];
  const skipped: SkippedClonedDeployment[] = [];
  for (const deploymentFile of files.filter((file) => DEPLOYMENT_FILE.test(file)).sort()) {
    const row = parseJson(await readFile(deploymentFile));
    if (row?.parentUuid !== DEPLOYMENT_ENTITY_UUID) {
      continue; // the AdminApplication row, or another file
    }
    const skip = (reason: string) => skipped.push({ deploymentFile, reason });
    const deploymentUuid = row.uuid;
    const selfApplication = row.selfApplication;
    const configuration = row.configuration as Record<string, ClonedSectionConfiguration> | undefined;
    if (typeof deploymentUuid !== "string" || typeof selfApplication !== "string" || !configuration) {
      skip("The Deployment row has no uuid, selfApplication or configuration");
      continue;
    }
    if (!UUID_PATTERN.test(deploymentUuid) || !UUID_PATTERN.test(selfApplication)) {
      skip("The uuid or selfApplication of the Deployment row is not a uuid");
      continue;
    }
    const packageFolder = dirname(dirname(dirname(deploymentFile)));
    const sections: Record<string, ClonedSectionConfiguration> = {};
    const missing: string[] = [];
    for (const [section, sectionConfiguration] of Object.entries(configuration)) {
      if (!CLONED_SECTIONS.has(section)) {
        continue; // `admin`: the clone uses the Admin store of the process; no other section is opened
      }
      if (sectionConfiguration?.emulatedServerType !== "filesystem" || typeof sectionConfiguration.directory !== "string") {
        missing.push(`${section} (${sectionConfiguration?.emulatedServerType ?? "no"} store)`);
        continue;
      }
      const found = sectionFolder(sectionConfiguration.directory, packageFolder, folders);
      if (found) {
        sections[section] = { ...sectionConfiguration, directory: join(cloneFolder, found) };
      } else {
        sections[section] = sectionConfiguration; // placed below, next to the model section
        missing.push(section);
      }
    }
    if (!sections.model || missing.includes("model")) {
      skip("The model section of the deployment is not a folder of the repository");
      continue;
    }
    const modelInRepository = sections.model.directory!.slice(join(cloneFolder).length).replace(/^\//, "");
    const unplaceable: string[] = [];
    for (const section of missing.filter((name) => sections[name] && name !== "model")) {
      const last = (sections[section].directory ?? "").split("/").filter(Boolean).pop() ?? "";
      // a file of the repository where the folder would go: the store could not use it
      if (!SEGMENT_PATTERN.test(last) || last === "." || last === ".." || fileSet.has(join(dirname(modelInRepository), last))) {
        unplaceable.push(section);
        continue;
      }
      sections[section] = { ...sections[section], directory: join(cloneFolder, dirname(modelInRepository), last) };
    }
    const unopenable = [...missing.filter((name) => !sections[name]), ...unplaceable];
    if (unopenable.length > 0) {
      skip(`Sections that are not files of the repository: ${unopenable.join(", ")}`);
      continue;
    }
    // every store folder of the deployment is a plain folder of the clone
    const inClone = (directory: string | undefined) =>
      typeof directory === "string" &&
      directory.startsWith(`${join(cloneFolder)}/`) &&
      isPlainRelativePath(directory.slice(join(cloneFolder).length + 1));
    if (!Object.values(sections).every((section) => inClone(section.directory))) {
      skip("A section folder of the deployment is not a plain folder of the clone");
      continue;
    }
    const selfApplicationFile = join(modelInRepository, SELF_APPLICATION_ENTITY_UUID, `${selfApplication}.json`);
    const selfApplicationRow = fileSet.has(selfApplicationFile) ? parseJson(await readFile(selfApplicationFile)) : undefined;
    if (!selfApplicationRow) {
      skip(`The model section has no SelfApplication row ${selfApplication}`);
      continue;
    }
    const adminApplication = parseJson(await readFile(join(dirname(deploymentFile), `${selfApplication}.json`)));
    deployments.push({
      deploymentUuid,
      selfApplication,
      name: typeof selfApplicationRow.name === "string" ? selfApplicationRow.name : selfApplication,
      deploymentFile,
      deployment: row,
      ...(adminApplication?.parentUuid === ADMIN_APPLICATION_ENTITY_UUID ? { adminApplication } : {}),
      sections,
    });
  }
  return { deployments, skipped };
}
