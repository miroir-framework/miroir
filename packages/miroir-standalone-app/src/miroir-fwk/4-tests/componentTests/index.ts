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

export const componentTestRunInProgressMessage =
  "A component test run is already in progress in another test display: wait for it to finish, then run again.";

export interface ComponentTestRegistration {
  /**
   * Ends the run: destroys the open suite wrappers (the last case stays mounted) and releases the
   * run lock. Idempotent.
   */
  endRun: () => void;
  /** Unmounts the last case, destroys the open suite wrappers, unregisters the runner, and releases the run lock. */
  close: () => void;
}

// `ConfigurationService` holds one component test runner for the whole app, and each test display
// has its own sandbox: one run at a time, from its registration to its `endRun()` or `close()`.
let activeRun: ComponentTestRegistration | undefined;

/** True while a registered component test run has not ended. */
export function isComponentTestRunActive(): boolean {
  return activeRun !== undefined;
}

/**
 * Creates a component test runner over the sandbox element and registers it in
 * `ConfigurationService`, so that the `reactComponentTest` leaves of the next MiroirTest run use it.
 * Throws `componentTestRunInProgressMessage` while another run is active.
 */
export function registerComponentTests(host: ComponentTestSandboxHost): ComponentTestRegistration {
  if (activeRun) {
    throw new Error(componentTestRunInProgressMessage);
  }
  const runner = createReactComponentTestRunner(host);
  ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
  const releaseLock = () => {
    if (activeRun === registration) {
      activeRun = undefined;
    }
  };
  const registration: ComponentTestRegistration = {
    endRun: () => {
      try {
        runner.endRun();
      } finally {
        releaseLock();
      }
    },
    close: () => {
      try {
        runner.close();
      } finally {
        releaseLock();
        if (ConfigurationService.configurationService.reactComponentTestRunner === runner) {
          ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
        }
      }
    },
  };
  activeRun = registration;
  return registration;
}
