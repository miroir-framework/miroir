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
 * PR #290 review fixes: the Close button is disabled during a run; a filtered run (not reaching
 * the suite's last case) still destroys the suite wrapper when the run ends; a second display's
 * Run during an active run is refused with `componentTestRunInProgressMessage`, and the first
 * run's cases all render in the first display's sandbox.
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
import { componentTestRunInProgressMessage } from "../../../../src/miroir-fwk/4-tests/componentTests/index";
import { componentTestSuiteInstances } from "../../../../src/miroir-fwk/4-tests/componentTests/componentTestManifest";
import type { MiroirTestResultData } from "../../../../src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton";
import { MiroirTestDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

// ################################################################################################
const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);

const arraySuite = "JzodArrayEditor";
/** #292: the Array cases have their own MiroirTest instance, `JzodArrayEditor_ComponentTestSuite`. */
const { uuid: componentTestSuiteInstanceUuid, name: componentTestSuiteInstanceName } =
  componentTestSuiteInstances[arraySuite];

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
/** #292 Slice 4: the Array leaves are declarative; their labels come from the instance JSON. */
const arrayLeafLabels: string[] = (componentTestSuiteInstance.definition.miroirTests[0] as any).miroirTests.map(
  (leaf: { miroirTestLabel: string }) => leaf.miroirTestLabel,
);
/**
 * Names the Array leaves of the Array instance. The instance has one child, the Array sub-suite
 * (#292), so the filter names no empty sibling.
 */
const arraySuiteTestFilter = {
  testList: {
    [componentTestSuiteInstanceName]: { [arraySuite]: arrayLeafLabels },
  },
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

/**
 * Renders one `MiroirTestDisplay` per `onTestComplete`, over one `LocalCache`. Each display has its
 * own `MiroirContextReactProvider`: under a single provider, the shared `isActionRunning` flag of
 * `handleAsyncAction` shows every Run button as loading (disabled) during a run, which hides the
 * run lock; that flag is one boolean, cleared by whichever async action ends first.
 */
function renderDisplays(
  harness: AppHarness,
  onTestCompletes: ((results: MiroirTestResultData[]) => void)[],
  testFilter: typeof arraySuiteTestFilter = arraySuiteTestFilter,
  miroirTest: MiroirTestDefinition = componentTestSuiteInstance,
) {
  return render(
    <LocalCacheProvider store={harness.localCache.getInnerStore()}>
      {onTestCompletes.map((onTestComplete, index) => (
        <MiroirContextReactProvider
          key={index}
          miroirContext={harness.miroirContext}
          domainController={{} as DomainControllerInterface}
        >
          <ReportPageContextProvider>
            <MiroirTestDisplay
              miroirTest={miroirTest}
              testLabel={componentTestSuiteInstanceName}
              gridType="ag-grid"
              useSnackBar={false}
              testFilter={testFilter}
              onTestComplete={(_key: string, results: MiroirTestResultData[]) => onTestComplete(results)}
            />
          </ReportPageContextProvider>
        </MiroirContextReactProvider>
      ))}
    </LocalCacheProvider>,
  );
}

const runButtonName = `Run ${componentTestSuiteInstanceName} Unit Tests`;

/** Clicks the unit Run button and waits for `onTestComplete`. Restores the dom config after. */
async function runArraySuite(
  harness: AppHarness,
  testFilter: typeof arraySuiteTestFilter = arraySuiteTestFilter,
  miroirTest: MiroirTestDefinition = componentTestSuiteInstance,
): Promise<MiroirTestResultData[]> {
  let results: MiroirTestResultData[] | undefined;
  renderDisplays(
    harness,
    [
      (structuredResults) => {
        results = structuredResults;
      },
    ],
    testFilter,
    miroirTest,
  );
  const savedDomConfig = { ...getDomConfig() };
  try {
    fireEvent.click(screen.getByRole("button", { name: runButtonName }));
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

  it("a failing case records an error with the step's message, and the cases after it still run", async () => {
    // #292 Slice 4: leaf 2 of a copy of the Array instance gets a present:true expectElement on a
    // target that matches nothing, instead of replacing a registry case.
    const failingInstance: MiroirTestDefinition = JSON.parse(JSON.stringify(componentTestSuiteInstance));
    const failingLeaf = (failingInstance.definition.miroirTests[0] as any).miroirTests[1];
    failingLeaf.steps = [
      { step: "expectElement", target: { byTestId: "no-such-element-292" }, present: true },
    ];
    const harness = buildAppHarness();
    const results = await runArraySuite(harness, arraySuiteTestFilter, failingInstance);

    const array = arrayResults(results);
    expect(array.filter((result) => result.testResult === "ok")).toHaveLength(11);
    const errors = array.filter((result) => result.testResult === "error");
    expect(errors.map((result) => result.testName)).toEqual([failingLeaf.miroirTestLabel]);
    expect(JSON.stringify(harness.miroirActivityTracker.getTestAssertionsResults([]))).toContain(
      "step 1 (expectElement): no element matches target",
    );
    // The cases after the failing one ran.
    const laterLabels = arrayLeafLabels.slice(2);
    expect(
      array
        .filter((result) => laterLabels.includes(result.testName))
        .every((result) => result.testResult === "ok"),
    ).toBe(true);
  });

  it("the close button is disabled while a run is active, and enabled again when it ends", async () => {
    const harness = buildAppHarness();
    let results: MiroirTestResultData[] | undefined;
    renderDisplays(harness, [
      (structuredResults) => {
        results = structuredResults;
      },
    ]);
    const panel = screen.getByTestId("component-test-sandbox-panel");
    const closeButton = within(panel).getByRole("button", { name: /close/i, hidden: true });
    const savedDomConfig = { ...getDomConfig() };
    try {
      fireEvent.click(screen.getByRole("button", { name: runButtonName }));
      await waitFor(() => expect(panel).toBeVisible(), { timeout: 30_000 });
      expect(closeButton).toBeDisabled();
      // A click during the run changes nothing.
      fireEvent.click(closeButton);
      expect(panel).toBeVisible();
      await waitFor(() => expect(results, "onTestComplete was called").toBeDefined(), {
        timeout: 170_000,
        interval: 200,
      });
    } finally {
      configureDom(savedDomConfig);
    }
    await waitFor(() => expect(closeButton).toBeEnabled());
    expect(arrayResults(results!).filter((result) => result.testResult === "ok")).toHaveLength(12);
    fireEvent.click(closeButton);
    await waitFor(() => expect(panel).not.toBeVisible());
  });

  it("a filtered run that does not reach the suite's last case destroys the suite wrapper when the run ends, and keeps its last case mounted", async () => {
    const filteredLabels = arrayLeafLabels.slice(0, 2);
    const filteredTestFilter = {
      testList: {
        [componentTestSuiteInstanceName]: { [arraySuite]: filteredLabels },
      },
    };
    const harness = buildAppHarness();
    const results = await runArraySuite(harness, filteredTestFilter);

    const array = arrayResults(results);
    expect(
      array.filter((result) => result.testResult === "ok").map((result) => result.testName).sort(),
    ).toEqual([...filteredLabels].sort());
    expect(vi.mocked(componentTestTools.buildComponentTestWrapper)).toHaveBeenCalledTimes(1);
    // The run end (right after onTestComplete) destroys the wrapper's MiroirEventService.
    await waitFor(() => expect(destroySpy).toHaveBeenCalledTimes(1));

    const panel = screen.getByTestId("component-test-sandbox-panel");
    const sandbox = within(panel).getByTestId("component-test-sandbox");
    const caseContainers = sandbox.querySelectorAll('[data-testid="component-test-container"]');
    expect(caseContainers).toHaveLength(1);
    expect(caseContainers[0].querySelector('input[name^="TESTSECTION.testField"]')).not.toBeNull();

    await waitFor(() => expect(within(panel).getByRole("button", { name: /close/i })).toBeEnabled());
    fireEvent.click(within(panel).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(panel).not.toBeVisible());
    expect(sandbox.querySelectorAll('[data-testid="component-test-container"]')).toHaveLength(0);
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });

  it("a second display's Run during an active run is refused with a message, and the first run's cases all render in the first sandbox", async () => {
    const harness = buildAppHarness();
    let firstResults: MiroirTestResultData[] | undefined;
    let secondResults: MiroirTestResultData[] | undefined;
    renderDisplays(harness, [
      (structuredResults) => {
        firstResults = structuredResults;
      },
      (structuredResults) => {
        secondResults = structuredResults;
      },
    ]);
    const [firstPanel, secondPanel] = screen.getAllByTestId("component-test-sandbox-panel");
    const [firstRunButton, secondRunButton] = screen.getAllByRole("button", { name: runButtonName });
    const firstSandbox = within(firstPanel).getByTestId("component-test-sandbox");
    const secondSandbox = within(secondPanel).getByTestId("component-test-sandbox");

    // For each case start, the sandbox that receives the new case container.
    const containerParents: string[] = [];
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement && node.getAttribute("data-testid") === "component-test-container") {
            containerParents.push(
              mutation.target === firstSandbox ? "first" : mutation.target === secondSandbox ? "second" : "other",
            );
          }
        }
      }
    });
    observer.observe(firstSandbox, { childList: true });
    observer.observe(secondSandbox, { childList: true });

    const savedDomConfig = { ...getDomConfig() };
    try {
      fireEvent.click(firstRunButton);
      // The first run is active once its first case is mounted.
      await waitFor(() => expect(containerParents.length).toBeGreaterThan(0), { timeout: 30_000 });
      fireEvent.click(secondRunButton);
      await waitFor(
        () => expect(document.body.textContent).toContain(componentTestRunInProgressMessage),
        { timeout: 30_000 },
      );
      await waitFor(() => expect(firstResults, "first onTestComplete was called").toBeDefined(), {
        timeout: 170_000,
        interval: 200,
      });
    } finally {
      configureDom(savedDomConfig);
      observer.disconnect();
    }

    expect(arrayResults(firstResults!).filter((result) => result.testResult === "ok")).toHaveLength(12);
    expect(secondResults, "the refused run did not complete").toBeUndefined();
    expect(containerParents).toEqual(arrayLeafLabels.map(() => "first"));
    expect(secondPanel).not.toBeVisible();
    expect(secondSandbox.querySelectorAll('[data-testid="component-test-container"]')).toHaveLength(0);
    expect(firstSandbox.querySelectorAll('[data-testid="component-test-container"]')).toHaveLength(1);
    // The first run's end releases its Close button.
    await waitFor(() => expect(within(firstPanel).getByRole("button", { name: /close/i })).toBeEnabled());
  });
});
