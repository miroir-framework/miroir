import { existsSync } from "node:fs";
import { MiroirConfigClient, MiroirLoggerFactory, type LoggerInterface, type LoggerOptions } from "miroir-core";
import path from "path";
import { cleanLevel } from "../3_controllers/constants";
import { packageName } from "../../src/constants";
import { DEFAULT_LOG_CONFIG_NAME } from "../../src/config/logConfigPresets.js";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileTools");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

function unwrapJsonModule<T>(moduleContents: T | { default: T }): T {
  if (
    moduleContents &&
    typeof moduleContents === "object" &&
    "default" in moduleContents &&
    (moduleContents as { default: T }).default
  ) {
    return (moduleContents as { default: T }).default;
  }
  return moduleContents as T;
}

/** Checked-in test configs often hardcode a developer machine path under `packages/`. */
function applyPortableFilesystemDeploymentRoot(
  miroirConfig: MiroirConfigClient,
  env: NodeJS.ProcessEnv,
): MiroirConfigClient {
  const client = (miroirConfig as { client?: { filesystemDeploymentRootDirectory?: string } }).client;
  if (!client?.filesystemDeploymentRootDirectory) {
    return miroirConfig;
  }

  const override = env.MIROIR_TEST_FILESYSTEM_ROOT;
  const configured = client.filesystemDeploymentRootDirectory;
  const portable = override ?? path.join(resolveRepoRoot(), "packages");
  if (override || !existsSync(configured)) {
    log.info(
      "@@@@@@@@@@@@@@@@@@ rewriting filesystemDeploymentRootDirectory",
      configured,
      "->",
      portable,
    );
    client.filesystemDeploymentRootDirectory = portable;
  }
  return miroirConfig;
}

// ################################################################################################
export async function loadTestSingleConfigFile<T>(fileName:string): Promise<T> {
  try {
    const ext = fileName.split('.').pop();
    if(ext !== "json") {
      throw new Error(`Config file ${fileName} must have .json extension`);
    }
    // Profile paths are repo-root relative. Prefer resolveRepoRoot over process.env.PWD:
    // npm -w + shell spawn reset PWD to the package dir and double the path.
    const configFilePath =
      fileName[0] === "/"
        ? fileName
        : path.join(resolveRepoRoot(), fileName.replace(/^\.\//, ""));
    log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile fileName", fileName, "configFilePath", configFilePath);
    const configFileContents = unwrapJsonModule(await import(configFilePath));
    log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFileContents", configFileContents);
  
    const miroirConfig:T = configFileContents as T;
    if (!miroirConfig) {
      throw new Error(`Config file ${fileName} returned undefined`);
    }
    log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile miroirConfig", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve(miroirConfig);
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFile error", error);
    throw error;
  }

}
const LOG_CONFIG_PRESET_DIR = "packages/miroir-standalone-app/config/logging";

/**
 * Resolve a log-config selection to a repo-root-relative JSON path.
 * Accepts a preset name ("catch-all", "scope-query"), a basename
 * ("scope-query.json"), or an explicit relative/absolute path.
 */
function resolveLogConfigPath(selection: string): string {
  const base = selection.replace(/\.json$/i, "");
  const presetPath = `${LOG_CONFIG_PRESET_DIR}/${base}.json`;
  // If it already names a directory, treat as explicit path; else prefer preset dir.
  if (!selection.includes("/") && !selection.includes("\\")) {
    return presetPath;
  }
  return selection;
}

// ################################################################################################
export async function loadTestConfigFiles(
  env: any,
): Promise<{ miroirConfig: MiroirConfigClient | undefined; logConfig: LoggerOptions | undefined }> {
  try {
    let miroirConfig: MiroirConfigClient | undefined = undefined;
    if (env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
      miroirConfig = applyPortableFilesystemDeploymentRoot(
        await loadTestSingleConfigFile<MiroirConfigClient>(
          env.VITE_MIROIR_TEST_CONFIG_FILENAME ?? "",
        ),
        env,
      );
    } else {
      throw new Error(
        "Environment variable VITE_MIROIR_TEST_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file",
      );
    }

    // Log config: default to the low-noise catch-all preset so nonreg / plain
    // test runs don't drown. Override explicitly via VITE_MIROIR_LOG_CONFIG_FILENAME
    // (preset name or path) when troubleshooting.
    const logSelection = env.VITE_MIROIR_LOG_CONFIG_FILENAME ?? DEFAULT_LOG_CONFIG_NAME;
    const logConfig = await loadTestSingleConfigFile<LoggerOptions>(
      resolveLogConfigPath(logSelection),
    );
    log.info(
      "@@@@@@@@@@@@@@@@@@ loadTestConfigFiles config file contents:",
      JSON.stringify(miroirConfig, null, 2),
    );
    return Promise.resolve({ miroirConfig, logConfig });
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles error", error);
    throw error;
  }
}
