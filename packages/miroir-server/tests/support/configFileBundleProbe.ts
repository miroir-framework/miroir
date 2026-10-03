// Entry of the #323 bundle probe: reads the server config file the way server.ts does, after ncc
// bundles it, and prints the path it read.
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { resolveServerConfigFilePath } from "../../src/serverConfigFile.js";

let configFilePath = "../config/miroirConfig.server.json";
let configFileGiven = false;
const configIndex = process.argv.indexOf("--config");
if (configIndex >= 0) {
  configFilePath = process.argv[configIndex + 1];
  configFileGiven = true;
}
const configFile = resolveServerConfigFilePath({
  configFilePath,
  configFileGiven,
  cwd: process.cwd(),
  serverModuleDir: path.dirname(fileURLToPath(import.meta.url)),
});
const config = JSON.parse(readFileSync(configFile, "utf8"));
process.stdout.write(`probe-config:${configFile}:${config.marker}\n`);
