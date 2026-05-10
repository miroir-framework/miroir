import { MiroirConfigClient, MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import path from "path";
import { cleanLevel } from "../3_controllers/constants";
import { packageName } from "../../src/constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FileTools")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export async function loadTestSingleConfigFile(fileName:string): Promise<MiroirConfigClient> {
  try {
    const pwd = process.env["PWD"]??""
    const ext = fileName.split('.').pop();
    if(ext !== "json") {
      throw new Error(`Config file ${fileName} must have .json extension`);
    }
    const configFilePath = fileName[0] === "/" ? fileName : path.join(pwd, fileName);
    log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile fileName", fileName, "configFilePath", configFilePath);
    // log.info("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFilePath", configFilePath);
    const configFileContents = await import(configFilePath);
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
    // log.info("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles started", JSON.stringify(env, null, 2));
    let miroirConfig:MiroirConfigClient
    if (env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
      miroirConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_TEST_CONFIG_FILENAME??"");
      // log.info("@@@@@@@@@@@@@@@@@@ config file contents:", miroirConfig)
    } else {
      throw new Error("Environment variable VITE_MIROIR_TEST_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    
    let logConfig:any
    if (env.VITE_MIROIR_LOG_CONFIG_FILENAME) {
      logConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_LOG_CONFIG_FILENAME ?? "specificLoggersConfig_warn");
      // log.info("@@@@@@@@@@@@@@@@@@ log config file contents:", miroirConfig)
    
      // MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
      //   loglevelnext,
      //   defaultLevels[logConfig.defaultLevel],
      //   logConfig.defaultTemplate,
      //   logConfig.specificLoggerOptions
      // );
      
      
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
