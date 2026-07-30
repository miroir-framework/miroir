import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENTITY_PARENT_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const MENU_ENTITY_UUID = "dde4c883-ae6d-47c3-b6df-26bc6e3c1842";

export type AdminJsonInstance = {
  uuid?: string;
  name?: string;
  parentUuid?: string;
  parentName?: string;
  [key: string]: unknown;
};

export function getAdminAssetsDir(fromImportMetaUrl: string = import.meta.url): string {
  return join(dirname(fileURLToPath(fromImportMetaUrl)), "../../assets");
}

export function getAdminModelDir(assetsDir: string = getAdminAssetsDir()): string {
  return join(assetsDir, "admin_model");
}

export function getAdminDataDir(assetsDir: string = getAdminAssetsDir()): string {
  return join(assetsDir, "admin_data");
}

function listJsonFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => join(dir, name));
  } catch {
    return [];
  }
}

export function readJsonInstance(path: string): AdminJsonInstance {
  return JSON.parse(readFileSync(path, "utf8")) as AdminJsonInstance;
}

/**
 * Entity definitions stored under admin_model/<Entity parentUuid>/*.json
 */
export function listAdminEntityDefinitions(
  modelDir: string = getAdminModelDir()
): AdminJsonInstance[] {
  const entityDir = join(modelDir, ENTITY_PARENT_UUID);
  return listJsonFiles(entityDir).map(readJsonInstance);
}

export function listAdminEntityNames(modelDir: string = getAdminModelDir()): string[] {
  return listAdminEntityDefinitions(modelDir)
    .map((e) => e.name)
    .filter((n): n is string => typeof n === "string")
    .sort();
}

export function findAdminEntityByName(
  name: string,
  modelDir: string = getAdminModelDir()
): AdminJsonInstance | undefined {
  return listAdminEntityDefinitions(modelDir).find((e) => e.name === name);
}

/**
 * Parent folders under admin_data (each folder name is an entity uuid).
 */
export function listAdminDataParentUuids(dataDir: string = getAdminDataDir()): string[] {
  try {
    return readdirSync(dataDir)
      .filter((name) => {
        const full = join(dataDir, name);
        return statSync(full).isDirectory();
      })
      .sort();
  } catch {
    return [];
  }
}

export function listAdminDataInstanceFiles(
  entityUuid: string,
  dataDir: string = getAdminDataDir()
): string[] {
  return listJsonFiles(join(dataDir, entityUuid));
}

export function adminModelHasInstanceFolder(
  entityUuid: string,
  modelDir: string = getAdminModelDir()
): boolean {
  try {
    return statSync(join(modelDir, entityUuid)).isDirectory();
  } catch {
    return false;
  }
}

export const ADMIN_CATALOGUE_SMOKE = {
  entityNames: ["AdminApplication", "Deployment"] as const,
  /** Framework entity uuids whose instance folders live in admin_model */
  modelInstanceFolders: {
    Report: REPORT_ENTITY_UUID,
    Menu: MENU_ENTITY_UUID,
  },
} as const;
