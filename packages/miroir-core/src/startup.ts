import packageJson from '../package.json';
import { ConfigurationService } from './3_controllers/ConfigurationService.js';
import { registerMiroirActionImplementation } from './3_controllers/ActionImplementations.js';
import { handleAction_runMiroirTestAction } from './5_tests/RunMiroirTestAction.js';

export function miroirCoreStartup() {
  ConfigurationService.configurationService.registerPackageConfiguration({packageName:packageJson.name,packageVersion:packageJson.version})
  // #575: implemented in 5_tests, which layer 3 does not import
  registerMiroirActionImplementation("handleAction_runMiroirTestAction", handleAction_runMiroirTestAction);
}
