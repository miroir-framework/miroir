import { ConfigurationService } from './3_controllers/ConfigurationService.js'
const packageJson = require('../package.json');

export function miroirCoreStartup() {
  ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}
