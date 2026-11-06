/**
 * #679 (D10): maps a repository path to the deployment section, Entity and instance it stores. The
 * filesystem store keeps an instance at `<section directory>/<entity uuid>/<primary key>.json`.
 */
import type { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

/** Repository-relative folder of each filesystem section of a deployment, with `/` separators. */
export type GitSectionPaths = Partial<Record<ApplicationSection, string>>;

export type GitPathInstance = {
  section: ApplicationSection;
  entityUuid: string;
  instanceKey: string;
};

function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

/**
 * The section, Entity uuid and instance key a repository path stores, or undefined for a path that is
 * not an instance file of one of the sections. With nested sections, the deepest one wins.
 */
export function gitPathToInstance(
  path: string,
  sectionPaths: GitSectionPaths,
): GitPathInstance | undefined {
  const normalized = trimSlashes(path.replace(/\\/g, "/"));
  const candidates = Object.entries(sectionPaths)
    .filter((entry): entry is [ApplicationSection, string] => typeof entry[1] === "string")
    .map(([section, folder]) => [section, trimSlashes(folder)] as const)
    .filter(([, folder]) => folder === "" || normalized.startsWith(folder + "/"))
    .sort((a, b) => b[1].length - a[1].length);
  const match = candidates[0];
  if (!match) {
    return undefined;
  }
  const [section, folder] = match;
  const rest = folder === "" ? normalized : normalized.slice(folder.length + 1);
  const parts = rest.split("/");
  if (parts.length !== 2 || !parts[1].endsWith(".json") || parts[1].length <= ".json".length) {
    return undefined;
  }
  return {
    section,
    entityUuid: parts[0],
    instanceKey: parts[1].slice(0, -".json".length),
  };
}

/** True when `path` is one of the section folders or inside one. */
export function gitPathIsInSections(path: string, sectionPaths: GitSectionPaths): boolean {
  const normalized = trimSlashes(path.replace(/\\/g, "/"));
  return Object.values(sectionPaths).some((folder) => {
    if (typeof folder !== "string") {
      return false;
    }
    const trimmed = trimSlashes(folder);
    return trimmed === "" || normalized === trimmed || normalized.startsWith(trimmed + "/");
  });
}
