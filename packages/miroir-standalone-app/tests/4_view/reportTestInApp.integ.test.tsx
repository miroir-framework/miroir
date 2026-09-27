/**
 * Report tests (#330): a Report MiroirTest runs from its display on the Miroir Tests page. "Run …
 * Integration Tests" registers the report test runner over the display's sandbox for the run's
 * session, the Report of the leaf mounts in the sandbox panel, and the app's Miroir Reports reach
 * the session (the wizard is a Miroir Report the session does not bootstrap).
 *
 * The browser launcher environment is replaced by the Node one, on the profile of the launch; the
 * app's domain controller only serves the Miroir Reports of `miroir_data`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem reportTestInApp.integ
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expect as vitestExpect } from "vitest";

import {
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  indexApplicationMiroirTestsByKey,
  MiroirActivityTracker,
  MiroirEventService,
  miroirCoreStartup,
  type DomainControllerInterface,
  type EntityInstance,
} from "miroir-core";
import { loadApplicationMiroirTestCatalog } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { MiroirContextReactProvider } from "miroir-react";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { entityReport, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import { resetIntegTestRunCoordinatorForTests } from "../../src/miroir-fwk/4-tests/integTestRunCoordinator.js";
import {
  resetUiIntegrationTestRunPreferencesForTests,
  setUiIntegrationTestRunPreferences,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js";
import {
  getLastUiIntegrationTestRunResult,
  resetLastUiIntegrationTestRunResultForTests,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunState.js";
import { MiroirTestDisplay } from "../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.js";
import { ReportPageContextProvider } from "../../src/miroir-fwk/4_view/components/Reports/ReportPageContext.js";
import { miroirAppStartup } from "../../src/startup.js";

vi.mock("../../src/miroir-fwk/4-tests/useSelectedApplicationMiroirTestSuiteRegistries.js", async () => {
  const { loadApplicationRunnerUuidIndexFromFolders } = await import(
    "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js"
  );
  const index = loadApplicationRunnerUuidIndexFromFolders();
  return {
    useSelectedApplicationRunnerUuidIndex: () => index,
    useSelectedApplicationMiroirTests: () => [],
    useSelectedApplicationMiroirTestSuiteRegistries: (fallback: unknown[] = []) => ({
      runner: {},
      transformer: {},
      instances: fallback,
    }),
  };
});

vi.mock("../../src/miroir-fwk/4_view/components/Reports/TestExecutionPanel.js", () => ({
  TestExecutionPanel: () => null,
}));

vi.mock("../../src/miroir-fwk/4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js", async () => {
  const { createNodeUiIntegrationTestLauncherEnvironment } = await import(
    "../helpers/runUiIntegrationTestSuiteInNode.js"
  );
  const { expect } = await import("vitest");
  const { resolveLaunchProfileName } = await import("../helpers/launchProfileName.js");
  return {
    loadBrowserUiIntegrationTestLauncherEnvironment: async () => {
      const nodeEnv = createNodeUiIntegrationTestLauncherEnvironment(expect);
      return {
        ...nodeEnv,
        loadConfigForProfile: async () => nodeEnv.loadConfigForProfile(resolveLaunchProfileName()),
      };
    },
  };
});

const suiteKey = "report.connectExternalServiceWizard";
const leafLabel = "the application picker lists Library, not Miroir or Admin";

const miroirReportsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data",
  entityReport.uuid,
);

/** A domain controller serving what the app's local cache holds of the Miroir Reports. */
function appDomainController(): DomainControllerInterface {
  const reports: EntityInstance[] = readdirSync(miroirReportsFolder)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => JSON.parse(readFileSync(join(miroirReportsFolder, fileName), "utf-8")));
  const domainState = {
    [defaultSelfApplicationDeploymentMap[selfApplicationMiroir.uuid]]: {
      data: {
        [entityReport.uuid]: Object.fromEntries(reports.map((report) => [report.uuid, report])),
      },
    },
  };
  return { getDomainState: () => domainState } as unknown as DomainControllerInterface;
}

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
const miroirContext = {
  miroirActivityTracker,
  miroirEventService,
  extendMiroirConfigWithExtraDeploymentConfiguration: () => undefined,
};

beforeAll(() => {
  miroirAppStartup();
  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
  miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({
    expect: vitestExpect as never,
  });
  // as in the browser: the Report runs outside act(), awaiting its own idle
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

beforeEach(() => {
  resetIntegTestRunCoordinatorForTests();
  resetUiIntegrationTestRunPreferencesForTests();
  resetLastUiIntegrationTestRunResultForTests();
});

describe("Report MiroirTests from the Miroir Tests page (#330)", () => {
  it("Run Integration Tests drives the wizard in the display's sandbox, then releases it", async () => {
    // the default run target of the page, which a Report suite overrides: its Report names Library
    setUiIntegrationTestRunPreferences({ runTargetMode: "ephemeral" });
    const catalogEntry = indexApplicationMiroirTestsByKey(loadApplicationMiroirTestCatalog())[suiteKey];
    expect(catalogEntry?.uiRunnerKind).toBe("reportTest");

    render(
      <MiroirContextReactProvider miroirContext={miroirContext} domainController={appDomainController()}>
        <ReportPageContextProvider>
          <MiroirTestDisplay
            miroirTest={catalogEntry!.instance}
            testLabel={suiteKey}
            gridType="glide-data-grid"
            useSnackBar={false}
            testFilter={{ testList: { [suiteKey]: { ConnectExternalServiceWizard: [leafLabel] } } }}
          />
        </ReportPageContextProvider>
      </MiroirContextReactProvider>,
    );

    const sandboxPanel = screen.getByTestId("component-test-sandbox-panel");
    expect(sandboxPanel).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: `Run ${suiteKey} Integration Tests` }));

    // the wizard mounts in the sandbox panel, which is shown while the run holds its close button
    await waitFor(
      () => {
        expect(sandboxPanel).toBeVisible();
        expect(screen.getByRole("button", { name: "Close component test sandbox" })).toBeDisabled();
        expect(screen.getByTestId("component-test-sandbox")).toHaveTextContent(/Application/);
      },
      { timeout: 120_000 },
    );

    await waitFor(
      () => {
        const lastRun = getLastUiIntegrationTestRunResult();
        expect(lastRun?.suiteKey).toBe(suiteKey);
        expect(lastRun?.runTargetMode).toBe("pinned");
        expect(lastRun?.success).toBe(true);
      },
      { timeout: 180_000 },
    );
    expect(JSON.stringify(getLastUiIntegrationTestRunResult()?.testSuiteResults)).toContain(leafLabel);

    // released: the runner is unregistered and the panel can be closed
    expect(ConfigurationService.configurationService.reportTestRunner).toBeUndefined();
    expect(screen.getByRole("button", { name: "Close component test sandbox" })).toBeEnabled();
  }, 240_000);
});
