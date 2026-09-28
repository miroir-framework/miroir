import { ConfigurationService } from "miroir-core";

import {
  createReactComponentTestRunner,
  type ComponentTestSandboxHost,
} from "./runReactComponentTest.js";
import { createReportTestRunner, type ReportTestSandboxHost } from "./runReportTest.js";

// ################################################################################################
// Entry point of the component test chunk (#286, analysis §5.3 and §5.9).
//
// The app reaches this module through one dynamic `import()` in `ComponentTestSandboxProvider`,
// so that `@testing-library/dom`, `@testing-library/user-event`, the component registry, and the
// step interpreter stay out of the main bundle. Nothing else in `src/` may import it statically.
// ################################################################################################

export type { ComponentTestSandboxHost } from "./runReactComponentTest.js";
export type { ReportTestSandboxHost } from "./runReportTest.js";

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

/**
 * Creates a report test runner over the sandbox element and registers it in
 * `ConfigurationService`, so that the `reportTest` leaves of the next integration run mount their
 * Reports there (#330). Each case is unmounted when its steps end, so `endRun()` and `close()` both
 * unregister the runner (idempotent). Throws `componentTestRunInProgressMessage` while another run
 * is active.
 */
export function registerReportTests(host: ReportTestSandboxHost): ComponentTestRegistration {
  if (activeRun) {
    throw new Error(componentTestRunInProgressMessage);
  }
  const runner = createReportTestRunner(host);
  ConfigurationService.configurationService.registerReportTestRunner(runner);
  let closed = false;
  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      runner.close();
    } finally {
      if (activeRun === registration) {
        activeRun = undefined;
      }
      if (ConfigurationService.configurationService.reportTestRunner === runner) {
        ConfigurationService.configurationService.registerReportTestRunner(undefined);
      }
    }
  };
  const registration: ComponentTestRegistration = { endRun: close, close };
  activeRun = registration;
  return registration;
}
