import { existsSync } from "node:fs";
import { MiroirConfigClient, MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import path from "path";
import { cleanLevel } from "../3_controllers/constants";
import { packageName } from "../../src/constants";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileTools")
).then((logger: LoggerInterface) => {log = logger});

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
export async function loadTestSingleConfigFile(fileName:string): Promise<MiroirConfigClient> {
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
  
    const miroirConfig:MiroirConfigClient = configFileContents as MiroirConfigClient;
  
    log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile miroirConfig", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve(miroirConfig);
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFile error", error);
    throw error;
  }

}
// ################################################################################################
export async function loadTestConfigFiles(env:any) {
  try {
    let miroirConfig:MiroirConfigClient
    if (env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
      miroirConfig = applyPortableFilesystemDeploymentRoot(
        await loadTestSingleConfigFile(env.VITE_MIROIR_TEST_CONFIG_FILENAME??""),
        env,
      );
    } else {
      throw new Error("Environment variable VITE_MIROIR_TEST_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    
    let logConfig:any
    if (env.VITE_MIROIR_LOG_CONFIG_FILENAME) {
      logConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_LOG_CONFIG_FILENAME ?? "specificLoggersConfig_warn");
    } else {
      throw new Error("Environment variable VITE_MIROIR_LOG_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    log.info("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles config file contents:", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve({miroirConfig,logConfig})
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles error", error);
    throw error;    
  }
}
