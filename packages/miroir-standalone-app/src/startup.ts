import { ConfigurationService } from 'miroir-core'
const packageJson = require('../package.json')

export function miroirAppStartup() {
  ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}


  // miroirAppStartup();
  // miroirCoreStartup();
