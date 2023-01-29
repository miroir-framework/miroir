import { ConfigurationService } from './3_controllers/ConfigurationService'
import packageJson from '../package.json'

export function miroirCoreStartup() {
  ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}
