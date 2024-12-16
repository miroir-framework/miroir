import { ConfigurationService } from './3_controllers/ConfigurationService.js'
import packageJson from '../package.json' assert { type: "json" };

export function miroirCoreStartup() {
  ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}
