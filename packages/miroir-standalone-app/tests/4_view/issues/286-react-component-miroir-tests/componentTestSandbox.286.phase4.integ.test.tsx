/**
 * Issue #286 Slice 4: the Array component suite runs in the app sandbox of `MiroirTestDisplay`
 * (analysis §5.6).
 *
 * Harness: `MiroirContextReactProvider` and `LocalCacheProvider` over a real `LocalCache` seeded
 * with the Miroir meta-model, as the component test wrapper seeds its own. No launch mocks, no
 * Postgres, no `--profile`. Results are read from `onTestComplete` and from the activity tracker,
 * not from grid cells. The `@testing-library/dom` configuration is saved before each run and
 * restored after it, because the component test driver replaces RTL's `act` wrappers.
 *
 * `buildComponentTestWrapper` is wrapped in a `vi.fn` (the module is mocked with its own
 * implementation), and `MiroirEventService.prototype.destroy` is spied on.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { configure as configureDom, getConfig as getDomConfig } from "@testing-library/dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type MiroirTestDefinition,
} from "miroir-core";
import {
  LocalCache,
  LocalCacheProvider,
  MiroirContextReactProvider,
  PersistenceReduxSaga,
} from "miroir-react";
import {
  defaultMiroirMetaModel,
  entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

vi.mock(
  "../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools")
    >();
    return {
      ...actual,
      buildComponentTestWrapper: vi.fn(actual.buildComponentTestWrapper),
    };
  },
);

import * as componentTestTools from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestTools";
import {
  componentTestLeafLabel,
  componentTestManifest,
  componentTestSuiteInstanceName,
  componentTestSuiteInstanceUuid,
} from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestManifest";
import { componentTestRegistry } from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestRegistry";
import type { MiroirTestResultData } from "../../../../src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton";
import { MiroirTestDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

// ################################################################################################
const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);

function loadComponentTestSuiteInstance(): MiroirTestDefinition {
  for (const fileName of readdirSync(MIROIR_TEST_DATA_FOLDER)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }
    const instance = JSON.parse(readFileSync(join(MIROIR_TEST_DATA_FOLDER, fileName), "utf-8"));
    if (instance?.uuid === componentTestSuiteInstanceUuid) {
      return instance;
    }
  }
  throw new Error(`suite ${componentTestSuiteInstanceName} not found in ${MIROIR_TEST_DATA_FOLDER}`);
}

const componentTestSuiteInstance = loadComponentTestSuiteInstance();
const arraySuite = "JzodArrayEditor";
const arrayLeafLabels = componentTestManifest[arraySuite].map((caseLabel) =>
  componentTestLeafLabel(arraySuite, caseLabel),
);
/** Limits the run to the Array sub-suite, so that later slices do not change the counts. */
const arraySuiteTestFilter = {
  testList: { [componentTestSuiteInstanceName]: { [arraySuite]: arrayLeafLabels } },
};

// ################################################################################################
/** The app side of the harness: its own tracker, event service, context, and `LocalCache`. */
function buildAppHarness() {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, undefined as any);
  const persistenceSaga = new PersistenceReduxSaga({
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
    ),
    remotePersistenceStoreRestClient: undefined as any,
  });
  const localCache: LocalCacheInterface = new LocalCache(persistenceSaga);
  const loadResult = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: selfApplicationMiroir.uuid,
        objects: [
          { parentName: entityEntity.name, parentUuid: entityEntity.uuid, applicationSection: "model", instances: defaultMiroirMetaModel.entities },
          { parentName: entityEntityVersion.name, parentUuid: entityEntityVersion.uuid, applicationSection: "model", instances: defaultMiroirMetaModel.entityVersions },
          { parentName: entityJzodSchema.name, parentUuid: entityJzodSchema.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.jzodSchemas },
          { parentName: entityMenu.name, parentUuid: entityMenu.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.menus },
          { parentName: entitySelfApplicationVersion.name, parentUuid: entitySelfApplicationVersion.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.applicationVersions },
          { parentName: entityReport.name, parentUuid: entityReport.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.reports },
        ],
      },
    } as any,
    defaultSelfApplicationDeploymentMap,
  );
  if (loadResult.status !== "ok") {
    throw new Error(`harness: loading the Miroir meta-model failed: ${JSON.stringify(loadResult)}`);
  }
  localCache.handleLocalCacheAction(
    {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: selfApplicationMiroir.uuid },
    } as any,
    defaultSelfApplicationDeploymentMap,
  );
  return { miroirActivityTracker, miroirContext, localCache };
}

type AppHarness = ReturnType<typeof buildAppHarness>;

function renderDisplay(harness: AppHarness, onTestComplete: (results: MiroirTestResultData[]) => void) {
  return render(
    <LocalCacheProvider store={harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider
        miroirContext={harness.miroirContext}
        domainController={{} as DomainControllerInterface}
      >
        <ReportPageContextProvider>
          <MiroirTestDisplay
            miroirTest={componentTestSuiteInstance}
            testLabel={componentTestSuiteInstanceName}
            gridType="ag-grid"
            useSnackBar={false}
            testFilter={arraySuiteTestFilter}
            onTestComplete={(_key: string, results: MiroirTestResultData[]) => onTestComplete(results)}
          />
        </ReportPageContextProvider>
      </MiroirContextReactProvider>
    </LocalCacheProvider>,
  );
}

/** Clicks the unit Run button and waits for `onTestComplete`. Restores the dom config after. */
async function runArraySuite(harness: AppHarness): Promise<MiroirTestResultData[]> {
  let results: MiroirTestResultData[] | undefined;
  renderDisplay(harness, (structuredResults) => {
    results = structuredResults;
  });
  const savedDomConfig = { ...getDomConfig() };
  try {
    fireEvent.click(
      screen.getByRole("button", { name: `Run ${componentTestSuiteInstanceName} Unit Tests` }),
    );
    await waitFor(() => expect(results, "onTestComplete was called").toBeDefined(), {
      timeout: 170_000,
      interval: 200,
    });
  } finally {
    configureDom(savedDomConfig);
  }
  return results!;
}

/** The Array leaves' results, `testName` reduced to the leaf label (the last path element). */
function arrayResults(results: MiroirTestResultData[]): MiroirTestResultData[] {
  return results
    .filter((result) => result.testPath.includes(arraySuite))
    .map((result) => ({ ...result, testName: result.testPath[result.testPath.length - 1] }));
}

// ################################################################################################
let destroySpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  destroySpy = vi.spyOn(MiroirEventService.prototype, "destroy");
  vi.mocked(componentTestTools.buildComponentTestWrapper).mockClear();
});

afterEach(() => {
  destroySpy.mockRestore();
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

describe("Array component suite in the MiroirTestDisplay sandbox", () => {
  it("the unit Run button runs the 12 Array cases in a visible sandbox, leaves the app state unchanged, and the close button clears the sandbox", async () => {
    const harness = buildAppHarness();
    const testImplementationBefore = ConfigurationService.configurationService.testImplementation;
    const localCacheStateBefore = JSON.stringify(harness.localCache.getInnerStore().getState());

    const results = await runArraySuite(harness);

    // 12 ok results, from onTestComplete and from the tracker.
    const array = arrayResults(results);
    expect(array.map((result) => result.testName).sort()).toEqual([...arrayLeafLabels].sort());
    expect(
      array.filter((result) => result.testResult === "ok").map((result) => result.testName),
      array
        .filter((result) => result.testResult !== "ok")
        .map((result) => `${result.testName}: ${result.testResult} ${JSON.stringify(result.fullAssertionsResults)}`)
        .join(" | "),
    ).toHaveLength(12);
    expect(JSON.stringify(harness.miroirActivityTracker.getTestAssertionsResults([]))).not.toContain(
      '"error"',
    );

    // The sandbox panel is shown.
    const panel = screen.getByTestId("component-test-sandbox-panel");
    expect(panel).toBeVisible();

    // The app's testImplementation and LocalCache are unchanged.
    expect(ConfigurationService.configurationService.testImplementation).toBe(testImplementationBefore);
    expect(JSON.stringify(harness.localCache.getInnerStore().getState())).toEqual(localCacheStateBefore);

    // One wrapper for the suite, destroyed once after the suite's last case.
    expect(vi.mocked(componentTestTools.buildComponentTestWrapper)).toHaveBeenCalledTimes(1);
    expect(destroySpy).toHaveBeenCalledTimes(1);

    // The last case stays mounted in the sandbox.
    const sandbox = within(panel).getByTestId("component-test-sandbox");
    const caseContainers = sandbox.querySelectorAll('[data-testid="component-test-container"]');
    expect(caseContainers).toHaveLength(1);
    expect(caseContainers[0].querySelector('input[name^="TESTSECTION.testField."]')).not.toBeNull();

    // The close button unmounts it and hides the panel.
    fireEvent.click(within(panel).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(panel).not.toBeVisible());
    expect(sandbox.querySelectorAll('[data-testid="component-test-container"]')).toHaveLength(0);
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it("a failing case records an error with the matcher's message, and the cases after it still run", async () => {
    const failingCase = componentTestManifest[arraySuite][1];
    const originalCase = componentTestRegistry[arraySuite].cases[failingCase];
    componentTestRegistry[arraySuite].cases[failingCase] = {
      tests: async (env) => {
        const detached = env.container.ownerDocument.createElement("div");
        env.expect(detached).toBeInTheDocument();
      },
    };
    try {
      const harness = buildAppHarness();
      const results = await runArraySuite(harness);

      const array = arrayResults(results);
      expect(array.filter((result) => result.testResult === "ok")).toHaveLength(11);
      const errors = array.filter((result) => result.testResult === "error");
      expect(errors.map((result) => result.testName)).toEqual([
        componentTestLeafLabel(arraySuite, failingCase),
      ]);
      expect(JSON.stringify(harness.miroirActivityTracker.getTestAssertionsResults([]))).toContain(
        "to be in the document",
      );
      // The cases after the failing one ran.
      const laterLabels = arrayLeafLabels.slice(2);
      expect(
        array
          .filter((result) => laterLabels.includes(result.testName))
          .every((result) => result.testResult === "ok"),
      ).toBe(true);
    } finally {
      componentTestRegistry[arraySuite].cases[failingCase] = originalCase;
    }
  });
});
