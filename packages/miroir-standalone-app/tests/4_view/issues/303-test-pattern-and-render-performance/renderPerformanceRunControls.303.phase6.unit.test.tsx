/**
 * Issue #303 Slice 6: Miroir Tests run controls for the render-performance suite (analysis D8,
 * D10, D11, T7).
 *
 * - `MiroirTestDisplay` shows a "Render iterations" number field next to the unit run button only
 *   for a suite containing a `measureRendering` step; empty means "the instance's `iterations`".
 * - A unit run with the field at 1 passes `iterationsOverride: 1` to the component test runner
 *   (`ComponentTestSandbox.prepareComponentTests`), and the result display shows one measurement
 *   table per leaf (component, mode, count, min, median, max) with count 1.
 * - "Run All Unit Tests" of `MiroirTestListDisplay` skips the leaves of `runOnDemand` suites
 *   (recorded as skipped, with the reason), and still runs the other suites (coordinator decision
 *   recorded in the Slice 6 Realization). Launching the performance suite on its own runs it (the
 *   second case).
 *
 * Harness: the #286 Slice 6 one (`runAllComponentTests.286.phase6`): `MiroirContextReactProvider`
 * and `LocalCacheProvider` over a real `LocalCache` seeded with the Miroir meta-model, the real
 * component test chunk and the real MiroirTest walk. No mocks: `registerComponentTests` is wrapped
 * in a `vi.fn` only to count its calls. Timings are never asserted (D9).
 *
 * vitest, not a MiroirTest: the subject is the app's React UI (as `RunAllMiroirTestsButton.unit.test.tsx`).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- renderPerformanceRunControls.303.phase6
 * ```
 */
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
  miroirTest_JzodEditorRenderPerformance_ComponentTestSuite,
  miroirTest_JzodEnumEditor_ComponentTestSuite,
  miroirTest_resolveConditionalSchema,
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
import type { MiroirTestSuiteResultsMap } from "../../../../src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton";
import type { TestResultData } from "../../../../src/miroir-fwk/4_view/components/Buttons/testResultReport";
import { MiroirTestDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay";
import { MiroirTestListDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";

// ################################################################################################
const perfInstance = miroirTest_JzodEditorRenderPerformance_ComponentTestSuite as unknown as MiroirTestDefinition;
const enumInstance = miroirTest_JzodEnumEditor_ComponentTestSuite as unknown as MiroirTestDefinition;
const transformerInstance = miroirTest_resolveConditionalSchema as unknown as MiroirTestDefinition;
const TRANSFORMER_SUITE_LEAF_COUNT = 5;
const RUN_TEST_TIMEOUT = 300_000;

const iterationsFieldName = "Render iterations";
const measurementHeaders = ["Component", "Mode", "Count", "Min ms", "Median ms", "Max ms"];

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
const perfLeafLabels = reactComponentLeafLabels(perfInstance.definition);

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

function HarnessProviders(props: { children: React.ReactNode }) {
  const [harness] = React.useState(buildAppHarness);
  return (
    <LocalCacheProvider store={harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={{} as DomainControllerInterface}>
        <ReportPageContextProvider>{props.children}</ReportPageContextProvider>
      </MiroirContextReactProvider>
    </LocalCacheProvider>
  );
}

function renderDisplay(instance: MiroirTestDefinition, onTestComplete?: (key: string, results: TestResultData[]) => void) {
  return render(
    <HarnessProviders>
      <MiroirTestDisplay
        miroirTest={instance}
        testLabel={instance.name}
        gridType="ag-grid"
        useSnackBar={false}
        onTestComplete={onTestComplete}
      />
    </HarnessProviders>,
  );
}

/** Clicks `buttonName`, waits for `getResults()`, and restores the dom config (the runner changes it). */
async function clickAndWait<T>(buttonName: string, getResults: () => T | undefined): Promise<T> {
  const savedDomConfig = { ...getDomConfig() };
  try {
    fireEvent.click(screen.getByRole("button", { name: buttonName }));
    await waitFor(() => expect(getResults(), "onTestComplete was called").toBeDefined(), {
      timeout: 250_000,
      interval: 200,
    });
  } finally {
    configureDom(savedDomConfig);
  }
  return getResults()!;
}

function describeNotOk(results: TestResultData[]): string {
  return results
    .filter((result) => result.testResult !== "ok")
    .map((result) => `${result.testPath.join(" > ")}: ${result.testResult} ${JSON.stringify(result.fullAssertionsResults)}`)
    .join(" | ");
}

// ################################################################################################
beforeEach(() => {
  vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
});

afterEach(() => {
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

describe("Miroir Tests render-performance run controls (#303 Slice 6)", () => {
  it("the iterations field is shown, empty, next to the unit run button only for a suite containing a measureRendering step", () => {
    const { unmount } = renderDisplay(enumInstance);
    expect(screen.getByRole("button", { name: `Run ${enumInstance.name} Unit Tests` })).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: iterationsFieldName })).toBeNull();
    unmount();

    renderDisplay(perfInstance);
    const runButton = screen.getByRole("button", { name: `Run ${perfInstance.name} Unit Tests` });
    const field = screen.getByRole("spinbutton", { name: iterationsFieldName });
    expect(field).toHaveValue(null);
    // Next to the run button: same parent row.
    expect(field.closest("[data-testid='unit-run-controls']")).toBe(runButton.closest("[data-testid='unit-run-controls']"));
    expect(field.closest("[data-testid='unit-run-controls']")).not.toBeNull();
  });

  it(
    "a run with the field at 1 shows, per leaf, a measurement table with count 1",
    async () => {
      let results: TestResultData[] | undefined;
      renderDisplay(perfInstance, (_key, structuredResults) => {
        results = structuredResults;
      });
      fireEvent.change(screen.getByRole("spinbutton", { name: iterationsFieldName }), { target: { value: "1" } });

      const resultRows = await clickAndWait(`Run ${perfInstance.name} Unit Tests`, () => results);

      expect(resultRows).toHaveLength(perfLeafLabels.length);
      expect(resultRows.filter((row) => row.testResult === "ok"), describeNotOk(resultRows)).toHaveLength(
        perfLeafLabels.length,
      );
      expect(vi.mocked(componentTestsEntry.registerComponentTests)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(componentTestsEntry.registerComponentTests).mock.calls[0][0]).toMatchObject({
        iterationsOverride: 1,
      });

      for (const leafLabel of perfLeafLabels) {
        const table = await screen.findByRole("table", { name: `Render measurements: ${leafLabel}` });
        const [headerRow, ...bodyRows] = within(table).getAllByRole("row");
        expect(within(headerRow).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(
          measurementHeaders,
        );
        expect(bodyRows.length, leafLabel).toBeGreaterThan(0);
        const modes = new Set<string>();
        for (const row of bodyRows) {
          const cells = within(row).getAllByRole("cell").map((cell) => cell.textContent ?? "");
          expect(cells, leafLabel).toHaveLength(measurementHeaders.length);
          modes.add(cells[1]);
          expect(cells[2], `${leafLabel} ${cells[0]} ${cells[1]} count`).toBe("1");
          const [min, median, max] = cells.slice(3).map(Number);
          expect(min <= median && median <= max, `${leafLabel} ${cells.join(" | ")}`).toBe(true);
        }
        expect([...modes].sort(), leafLabel).toEqual(["remount", "update"]);
        expect(within(table).getAllByRole("cell").map((cell) => cell.textContent)).toContain("JzodElementEditor");
      }
    },
    RUN_TEST_TIMEOUT,
  );

  it(
    "Run All Unit Tests skips the leaves of a runOnDemand suite, with the reason, and runs the other suites",
    async () => {
      let results: MiroirTestSuiteResultsMap | undefined;
      render(
        <HarnessProviders>
          <MiroirTestListDisplay
            miroirTests={[perfInstance, transformerInstance]}
            gridType="ag-grid"
            useSnackBar={false}
            onTestComplete={(resultsMap) => {
              results = resultsMap;
            }}
          />
        </HarnessProviders>,
      );

      const resultsMap = await clickAndWait("Run All Unit Tests", () => results);

      const perfRows = resultsMap[perfInstance.name] ?? [];
      expect(perfRows.map((row) => row.testPath[row.testPath.length - 1]).sort()).toEqual([...perfLeafLabels].sort());
      expect(perfRows.every((row) => row.testResult === "skipped"), describeNotOk(perfRows)).toBe(true);
      const perfJson = JSON.stringify(perfRows);
      expect(perfJson).toContain("runOnDemand suite: not run by Run all");
      expect(perfJson).not.toContain("requires a registered component test runner");

      const transformerRows = resultsMap[transformerInstance.name] ?? [];
      expect(transformerRows.filter((row) => row.testResult === "ok"), describeNotOk(transformerRows)).toHaveLength(
        TRANSFORMER_SUITE_LEAF_COUNT,
      );
      // Only on-demand component tests in the list: the sandbox is not prepared.
      expect(vi.mocked(componentTestsEntry.registerComponentTests)).not.toHaveBeenCalled();
    },
    RUN_TEST_TIMEOUT,
  );
});
