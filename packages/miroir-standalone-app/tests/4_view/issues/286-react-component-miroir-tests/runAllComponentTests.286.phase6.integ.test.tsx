/**
 * Issue #286 Slice 6: "Run All Unit Tests" of `MiroirTestListDisplay` runs the component tests in
 * its own sandbox when its "Include component tests" checkbox is on, and skips them when it is off
 * (analysis §5.6).
 *
 * Harness: the Slice 4 one. `MiroirContextReactProvider` and `LocalCacheProvider` over a real
 * `LocalCache` seeded with the Miroir meta-model. No launch mocks, no Postgres, no `--profile`.
 * The list is narrowed to the 7 per-editor component test instances (#292, e.g.
 * `JzodEnumEditor_ComponentTestSuite`) and the small transformer suite `resolveConditionalSchema`
 * (5 `transformerTest` leaves). Results are read from the list's `onTestComplete`.
 * `registerComponentTests` (the entry of the component test chunk) is wrapped in a `vi.fn` to count
 * its calls. The expected component leaves of each instance come from its JSON.
 *
 * Re-run only after a GREEN, never while a suite has "not migrated" stubs.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import React from "react";
import { configure as configureDom, getConfig as getDomConfig } from "@testing-library/dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../../../src/miroir-fwk/4-tests/componentTests/index", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../../../src/miroir-fwk/4-tests/componentTests/index")
  >();
  return {
    ...actual,
    registerComponentTests: vi.fn(actual.registerComponentTests),
  };
});

import * as componentTestsEntry from "../../../../src/miroir-fwk/4-tests/componentTests/index";
import {
  RunAllMiroirTestsButton,
  type MiroirTestSuiteResultsMap,
} from "../../../../src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton";
import type { TestResultData } from "../../../../src/miroir-fwk/4_view/components/Buttons/testResultReport";
import { MiroirTestListDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

// ################################################################################################
const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);
/** Transformer suite run next to the component suite: 5 `transformerTest` leaves. */
const TRANSFORMER_SUITE_UUID = "10bd8532-8d3e-40ca-a029-b43a38d11ea0";
const TRANSFORMER_SUITE_NAME = "resolveConditionalSchema";
const TRANSFORMER_SUITE_LEAF_COUNT = 5;
/** Longer than the `waitFor` of `runAll`, so a slow run fails on the wait, with its message. */
const RUN_ALL_TEST_TIMEOUT = 300_000;

function loadMiroirTestInstance(uuid: string): MiroirTestDefinition {
  for (const fileName of readdirSync(MIROIR_TEST_DATA_FOLDER)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }
    const instance = JSON.parse(readFileSync(join(MIROIR_TEST_DATA_FOLDER, fileName), "utf-8"));
    if (instance?.uuid === uuid) {
      return instance;
    }
  }
  throw new Error(`MiroirTest ${uuid} not found in ${MIROIR_TEST_DATA_FOLDER}`);
}

/** Every `reactComponentTest` leaf label under `node`, at any depth. */
function reactComponentLeafLabels(node: any): string[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite" || node.miroirTestType === "reactComponentTestSuite") {
    return (node.miroirTests ?? []).flatMap(reactComponentLeafLabels);
  }
  return node.miroirTestType === "reactComponentTest" ? [node.miroirTestLabel] : [];
}

/** The uuids of the 7 per-editor component test instances (#292, analysis §5.6). */
const COMPONENT_TEST_SUITE_INSTANCE_UUIDS = [
  "761d4ed2-1a5c-4901-a9d9-897dbec0b27f", // JzodEnumEditor_ComponentTestSuite
  "1b71d68b-7dc9-468c-a251-4fa7889f20f4", // JzodArrayEditor_ComponentTestSuite
  "3995a071-b8ae-48d3-a488-6d1fc828b725", // JzodLiteralEditor_ComponentTestSuite
  "da353085-c62b-4aa6-bd54-8813d303dfe5", // JzodObjectEditor_ComponentTestSuite
  "590693b6-2125-43fc-89d7-1330ae8318db", // JzodSimpleTypeEditor_ComponentTestSuite
  "de517cd6-31a8-46d2-ac09-3a5162b630a7", // JzodUnionEditor_ComponentTestSuite
  "ec601bcc-a27d-450d-9c37-bdd6a12a1575", // JzodAnyEditor_ComponentTestSuite
];
/** The 7 per-editor component test instances (#292). */
const componentTestSuiteInstanceList = COMPONENT_TEST_SUITE_INSTANCE_UUIDS.map(loadMiroirTestInstance);
const transformerSuiteInstance = loadMiroirTestInstance(TRANSFORMER_SUITE_UUID);
const narrowedMiroirTests = [...componentTestSuiteInstanceList, transformerSuiteInstance];

/** Instance name to its component leaf labels, from its JSON. */
const componentLeafLabelsByInstance: Record<string, string[]> = Object.fromEntries(
  componentTestSuiteInstanceList.map((instance) => [instance.name, reactComponentLeafLabels(instance.definition)]),
);
const COMPONENT_LEAF_COUNT = 68;

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
  return { miroirContext, localCache };
}

type AppHarness = ReturnType<typeof buildAppHarness>;

function HarnessProviders(props: { harness: AppHarness; children: React.ReactNode }) {
  return (
    <LocalCacheProvider store={props.harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider
        miroirContext={props.harness.miroirContext}
        domainController={{} as DomainControllerInterface}
      >
        <ReportPageContextProvider>{props.children}</ReportPageContextProvider>
      </MiroirContextReactProvider>
    </LocalCacheProvider>
  );
}

function renderList(onTestComplete: (results: MiroirTestSuiteResultsMap) => void) {
  return render(
    <HarnessProviders harness={buildAppHarness()}>
      <MiroirTestListDisplay
        miroirTests={narrowedMiroirTests}
        gridType="ag-grid"
        useSnackBar={false}
        onTestComplete={onTestComplete}
      />
    </HarnessProviders>,
  );
}

const includeComponentTestsName = /include component tests/i;

/** Clicks "Run All Unit Tests" and waits for `onTestComplete`. Restores the dom config after. */
async function runAll(getResults: () => MiroirTestSuiteResultsMap | undefined): Promise<MiroirTestSuiteResultsMap> {
  const savedDomConfig = { ...getDomConfig() };
  try {
    fireEvent.click(screen.getByRole("button", { name: "Run All Unit Tests" }));
    await waitFor(() => expect(getResults(), "onTestComplete was called").toBeDefined(), {
      timeout: 250_000,
      interval: 200,
    });
  } finally {
    configureDom(savedDomConfig);
  }
  return getResults()!;
}

/** Results of one suite, `testName` reduced to the leaf label (the last path element). */
function leafResults(results: TestResultData[] | undefined): TestResultData[] {
  return (results ?? []).map((result) => ({
    ...result,
    testName: result.testPath[result.testPath.length - 1],
  }));
}

function describeNotOk(results: TestResultData[]): string {
  return results
    .filter((result) => result.testResult !== "ok")
    .map((result) => `${result.testName}: ${result.testResult} ${JSON.stringify(result.fullAssertionsResults)}`)
    .join(" | ");
}

// ################################################################################################
beforeEach(() => {
  vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
});

afterEach(() => {
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

describe("Run All Unit Tests with the Include component tests checkbox", () => {
  it("the unit Run all button has the checkbox, checked by default; the integration Run all button has none", () => {
    renderList(() => {});
    expect(screen.getByRole("button", { name: "Run All Unit Tests" })).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: includeComponentTestsName });
    expect(checkbox).toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: includeComponentTestsName })).toHaveLength(1);

    // The narrowed list has no launchable integration suite, so the integration button is
    // rendered on its own, in the same providers.
    const { container } = render(
      <HarnessProviders harness={buildAppHarness()}>
        <RunAllMiroirTestsButton
          miroirTests={narrowedMiroirTests}
          useSnackBar={false}
          runMode="integration"
          label="Run All Integration Tests"
        />
      </HarnessProviders>,
    );
    expect(container.querySelector('button')).not.toBeNull();
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it("checkbox on: Run all records one ok per component case and the transformer suite's results, and registers the component tests once", async () => {
    let results: MiroirTestSuiteResultsMap | undefined;
    renderList((resultsMap) => {
      results = resultsMap;
    });
    const resultsMap = await runAll(() => results);

    expect(Object.values(componentLeafLabelsByInstance).flat()).toHaveLength(COMPONENT_LEAF_COUNT);
    for (const [instanceName, componentLeafLabels] of Object.entries(componentLeafLabelsByInstance)) {
      const component = leafResults(resultsMap[instanceName]);
      expect(component.map((result) => result.testName).sort(), instanceName).toEqual([...componentLeafLabels].sort());
      expect(
        component.filter((result) => result.testResult === "ok"),
        `${instanceName}: ${describeNotOk(component)}`,
      ).toHaveLength(componentLeafLabels.length);
    }

    const transformer = leafResults(resultsMap[TRANSFORMER_SUITE_NAME]);
    expect(transformer).toHaveLength(TRANSFORMER_SUITE_LEAF_COUNT);
    expect(transformer.filter((result) => result.testResult === "ok"), describeNotOk(transformer)).toHaveLength(
      TRANSFORMER_SUITE_LEAF_COUNT,
    );

    expect(vi.mocked(componentTestsEntry.registerComponentTests)).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("component-test-sandbox-panel")).toBeVisible();
    // PR #290 review: the end of the run releases the run lock and enables the close button.
    expect(componentTestsEntry.isComponentTestRunActive()).toBe(false);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /close component test sandbox/i })).toBeEnabled(),
    );
   }, RUN_ALL_TEST_TIMEOUT);

  it("checkbox off: the component leaves are recorded as skipped, the component tests are not registered, and the transformer suite still runs", async () => {
    let results: MiroirTestSuiteResultsMap | undefined;
    renderList((resultsMap) => {
      results = resultsMap;
    });
    const checkbox = screen.getByRole("checkbox", { name: includeComponentTestsName });
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const resultsMap = await runAll(() => results);

    for (const [instanceName, componentLeafLabels] of Object.entries(componentLeafLabelsByInstance)) {
      const component = leafResults(resultsMap[instanceName]);
      expect(component.map((result) => result.testName).sort(), instanceName).toEqual([...componentLeafLabels].sort());
      expect(component.every((result) => result.testResult === "skipped"), instanceName).toBe(true);
      // Skipped by the exclusion, not for lack of a registered runner.
      const componentJson = JSON.stringify(component);
      expect(componentJson).toContain("reactComponentTest leaves are excluded from this run");
      expect(componentJson).not.toContain("requires a registered component test runner");
    }

    const transformer = leafResults(resultsMap[TRANSFORMER_SUITE_NAME]);
    expect(transformer.filter((result) => result.testResult === "ok"), describeNotOk(transformer)).toHaveLength(
      TRANSFORMER_SUITE_LEAF_COUNT,
    );

    expect(vi.mocked(componentTestsEntry.registerComponentTests)).not.toHaveBeenCalled();
    expect(screen.getByTestId("component-test-sandbox-panel")).not.toBeVisible();
   }, RUN_ALL_TEST_TIMEOUT);
});
