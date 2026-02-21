import packageJson from '../package.json';
import { ConfigurationService } from './3_controllers/ConfigurationService.js';

export function miroirCoreStartup() {
  ConfigurationService.configurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
}
