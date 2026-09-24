import { ConfigurationService } from "miroir-core";

import {
  createReactComponentTestRunner,
  type ComponentTestSandboxHost,
} from "./runReactComponentTest.js";

// ################################################################################################
// Entry point of the component test chunk (#286, analysis §5.3 and §5.9).
//
// The app reaches this module through one dynamic `import()` in `ComponentTestSandboxProvider`,
// so that `@testing-library/dom`, `@testing-library/user-event`, the registry, and the case
// bodies stay out of the main bundle. Nothing else in `src/` may import it statically.
// ################################################################################################

export type { ComponentTestSandboxHost } from "./runReactComponentTest.js";

export interface ComponentTestRegistration {
  /** Unmounts the last case, destroys the open suite wrappers, and unregisters the runner. */
  close: () => void;
}

/**
 * Creates a component test runner over the sandbox element and registers it in
 * `ConfigurationService`, so that the `reactComponentTest` leaves of the next MiroirTest run use it.
 */
export function registerComponentTests(host: ComponentTestSandboxHost): ComponentTestRegistration {
  const runner = createReactComponentTestRunner(host);
  ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
  return {
    close: () => {
      try {
        runner.close();
      } finally {
        if (ConfigurationService.configurationService.reactComponentTestRunner === runner) {
          ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
        }
      }
    },
  };
}
