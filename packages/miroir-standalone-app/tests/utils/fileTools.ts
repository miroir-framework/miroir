import { MiroirConfigClient } from "miroir-core";
import path from "path";

// ################################################################################################
export async function loadTestSingleConfigFile( fileName:string): Promise<MiroirConfigClient> {
  try {
    const pwd = process.env["PWD"]??""
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile pwd", pwd, "fileName", fileName);
    // log.info("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
    // const configFilePath = path.join(pwd, "./packages/miroir-standalone-app/tests/" + fileName + ".json")
    const configFilePath = path.join(pwd, fileName + ".json")
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFilePath", configFilePath);
    const configFileContents = await import(configFilePath);
    // const configFileContents = JSON.parse(fs.readFileSync(new URL(configFilePath, import.meta.url)).toString());
    // const configFileContents = JSON.parse(fs.readFileSync(new URL(configFilePath)).toString());
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFileContents", configFileContents);
  
    const miroirConfig:MiroirConfigClient = configFileContents as MiroirConfigClient;
  
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile miroirConfig", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve(miroirConfig);
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFile error", error);
    throw error;
  }

}
// ################################################################################################
export async function loadTestConfigFiles(env:any) {
  try {
    console.log("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles started", JSON.stringify(env, null, 2));
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
      // console.info("@@@@@@@@@@@@@@@@@@ log config file contents:", miroirConfig)
    
      // MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
      //   loglevelnext,
      //   defaultLevels[logConfig.defaultLevel],
      //   logConfig.defaultTemplate,
      //   logConfig.specificLoggerOptions
      // );
      
      
    } else {
      throw new Error("Environment variable VITE_MIROIR_LOG_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    console.log("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles config file contents:", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve({miroirConfig,logConfig})
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles error", error);
    throw error;    
  }
}
