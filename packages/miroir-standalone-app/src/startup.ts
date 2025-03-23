import { ConfigurationService } from 'miroir-core'
import packageJson from '../package.json';

export function miroirAppStartup() {
  ConfigurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}