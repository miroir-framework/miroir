/**
 * Issue #435: the header of the Component Test Sandbox, for a UI test run in the app.
 *
 * - It shows the name of the case being run; after the run, the name of the last case.
 * - Its slider shows the ViewParams `componentTestStepDelayMs`; the runner reads that delay
 *   before each step (`stepDelayMs` of the registration).
 * - Releasing the slider saves the new delay in ViewParams (an `updateInstance` of the
 *   ViewParams instance).
 *
 * Harness: the #303 Slice 6 one (`renderPerformanceRunControls.303.phase6`), with the default
 * ViewParams instance loaded in the admin deployment of the `LocalCache`. `registerComponentTests`
 * is wrapped in a `vi.fn` only to read its host; the DomainController records the actions it gets.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestSandboxHeader.435
 * ```
 */
import React from "react";
import { configure as configureDom, getConfig as getDomConfig } from "@testing-library/dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
import { LocalCache, LocalCacheProvider, MiroirContextReactProvider, PersistenceReduxSaga } from "miroir-react";
import {
  defaultMiroirMetaModel,
  entityEntity,
  entityEntityVersion,
  entityMlSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  miroirTest_ui_mlElementEditor_enum,
  selfApplicationMiroir,
} from "miroir-app-miroir";
import { adminSelfApplication, defaultAdminViewParams, entityViewParams } from "miroir-app-admin";

vi.mock("../../../../src/miroir-fwk/4-tests/componentTests/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../src/miroir-fwk/4-tests/componentTests/index")>();
  return {
    ...actual,
    registerComponentTests: vi.fn(actual.registerComponentTests),
  };
});

import * as componentTestsEntry from "../../../../src/miroir-fwk/4-tests/componentTests/index";
import type { TestResultData } from "../../../../src/miroir-fwk/4_view/components/Buttons/testResultReport";
import { MiroirTestDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay";
import { ReportPageContextProvider } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportPageContext";

// ################################################################################################
const enumInstance = miroirTest_ui_mlElementEditor_enum as unknown as MiroirTestDefinition;
const RUN_TEST_TIMEOUT = 300_000;
const savedStepDelayMs = 100;

/** Every `reactComponentTest` leaf label under `node`, at any depth, in order. */
function reactComponentLeafLabels(node: any): string[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite" || node.miroirTestType === "reactComponentTestSuite") {
    return (node.miroirTests ?? []).flatMap(reactComponentLeafLabels);
  }
  return node.miroirTestType === "reactComponentTest" ? [node.miroirTestLabel] : [];
}
const enumLeafLabels = reactComponentLeafLabels(enumInstance.definition);

// ################################################################################################
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
  for (const action of [
    {
      application: selfApplicationMiroir.uuid,
      objects: [
        { parentName: entityEntity.name, parentUuid: entityEntity.uuid, applicationSection: "model", instances: defaultMiroirMetaModel.entities },
        { parentName: entityEntityVersion.name, parentUuid: entityEntityVersion.uuid, applicationSection: "model", instances: defaultMiroirMetaModel.entityVersions },
        { parentName: entityMlSchema.name, parentUuid: entityMlSchema.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.mlSchemas },
        { parentName: entityMenu.name, parentUuid: entityMenu.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.menus },
        { parentName: entitySelfApplicationVersion.name, parentUuid: entitySelfApplicationVersion.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.applicationVersions },
        { parentName: entityReport.name, parentUuid: entityReport.uuid, applicationSection: "data", instances: defaultMiroirMetaModel.reports },
      ],
    },
    {
      application: adminSelfApplication.uuid,
      objects: [
        {
          parentName: entityViewParams.name,
          parentUuid: entityViewParams.uuid,
          applicationSection: "data",
          instances: [{ ...defaultAdminViewParams, componentTestStepDelayMs: savedStepDelayMs }],
        },
      ],
    },
  ]) {
    const loadResult = localCache.handleLocalCacheAction(
      { actionType: "loadNewInstancesInLocalCache", endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89", payload: action } as any,
      defaultSelfApplicationDeploymentMap,
    );
    if (loadResult.status !== "ok") {
      throw new Error(`harness: loading instances failed: ${JSON.stringify(loadResult)}`);
    }
  }
  // only the Miroir load is rolled back, as in the #303 harness: a rollback of the admin
  // application drops the ViewParams instance just loaded
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

/** The actions the slider sends, recorded. */
const handledActions: any[] = [];
const domainController = {
  handleActionFromUI: async (action: any) => {
    handledActions.push(action);
    return { status: "ok" };
  },
} as unknown as DomainControllerInterface;

function renderDisplay(onTestComplete: (key: string, results: TestResultData[]) => void) {
  function HarnessProviders(props: { children: React.ReactNode }) {
    const [harness] = React.useState(buildAppHarness);
    return (
      <LocalCacheProvider store={harness.localCache.getInnerStore()}>
        <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={domainController}>
          <ReportPageContextProvider>{props.children}</ReportPageContextProvider>
        </MiroirContextReactProvider>
      </LocalCacheProvider>
    );
  }
  return render(
    <HarnessProviders>
      <MiroirTestDisplay
        miroirTest={enumInstance}
        testLabel={enumInstance.name}
        gridType="ag-grid"
        useSnackBar={false}
        onTestComplete={onTestComplete}
      />
    </HarnessProviders>,
  );
}

afterEach(() => {
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

// ################################################################################################
describe("Component Test Sandbox header (#435)", () => {
  it(
    "shows the running case's name and the saved step delay, which the runner reads; releasing the slider saves a new delay",
    async () => {
      let results: TestResultData[] | undefined;
      renderDisplay((_key, structuredResults) => {
        results = structuredResults;
      });

      const savedDomConfig = { ...getDomConfig() };
      try {
        fireEvent.click(screen.getByRole("button", { name: `Run ${enumInstance.name} Unit Tests` }));
        await waitFor(() => expect(results, "onTestComplete was called").toBeDefined(), {
          timeout: 250_000,
          interval: 200,
        });
      } finally {
        configureDom(savedDomConfig);
      }

      expect(results!.filter((row) => row.testResult === "ok")).toHaveLength(enumLeafLabels.length);

      const host = vi.mocked(componentTestsEntry.registerComponentTests).mock.calls[0][0];
      expect(host.stepDelayMs?.()).toBe(savedStepDelayMs);

      const testName = screen.getByTestId("component-test-sandbox-test-name");
      expect(testName.textContent).toContain(enumLeafLabels[enumLeafLabels.length - 1]);

      const slider = screen.getByRole("slider", { name: "Component test step delay" });
      expect(slider).toHaveValue(String(savedStepDelayMs));
      fireEvent.change(slider, { target: { value: "700" } });
      expect(screen.getByText("700 ms")).toBeInTheDocument();
      // the running case reads the moved value at once
      expect(host.stepDelayMs?.()).toBe(700);
      expect(handledActions).toHaveLength(0);

      fireEvent.pointerUp(slider);
      await waitFor(() => expect(handledActions).toHaveLength(1));
      expect(handledActions[0]).toMatchObject({
        actionType: "updateInstance",
        payload: {
          application: adminSelfApplication.uuid,
          objects: [{ uuid: defaultAdminViewParams.uuid, componentTestStepDelayMs: 700 }],
        },
      });
    },
    RUN_TEST_TIMEOUT,
  );
});
