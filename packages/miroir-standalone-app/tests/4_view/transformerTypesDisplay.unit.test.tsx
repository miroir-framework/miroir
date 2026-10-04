/**
 * The TransformerEditor's "Show transformer types" switch keeps its value across the cases of a
 * Component Test Sandbox run (#453 D2).
 *
 * - Runner: with a host giving `showTransformerTypes` / `saveShowTransformerTypes`, each case of
 *   the real TransformerEditor starts with the host's value, and a toggle in a case is saved
 *   through the host, so the next case starts with it.
 * - Sandbox: the host it registers reads the app's ViewParams `showTransformerTypes`; a save from
 *   a case is the host value at once and an `updateInstance` of the ViewParams instance.
 * - Editor switch: a toggle shows at once; a later ViewParams change made elsewhere replaces it.
 * - Primitive literals: an `applyTo: "a"` has no title row, its badge follows its label.
 * - Badge labels (D18): an entity type shows the entity name, an unknown entity uuid its first
 *   8 characters.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- transformerTypesDisplay
 * ```
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkTransformerInterfaceRecursively,
  ConfigurationService,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  MiroirContext,
  MiroirEventService,
  PersistenceStoreControllerManager,
  type DomainControllerInterface,
  type LocalCacheInterface,
  type MiroirTestForReactComponent,
  type ReactComponentTestStep,
  type ReactComponentTestSuiteContext,
} from "miroir-core";
import { LocalCache, LocalCacheProvider, MiroirContextReactProvider, PersistenceReduxSaga } from "miroir-react";
import { adminSelfApplication, defaultAdminViewParams, entityViewParams } from "miroir-app-admin";

vi.mock("../../src/miroir-fwk/4-tests/componentTests/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/miroir-fwk/4-tests/componentTests/index")>();
  return {
    ...actual,
    registerComponentTests: vi.fn(actual.registerComponentTests),
  };
});

import * as componentTestsEntry from "../../src/miroir-fwk/4-tests/componentTests/index";
import { createReactComponentTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import {
  ComponentTestSandboxProvider,
  useComponentTestSandbox,
} from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox";
import { transformerTypeBadges } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor";
import { useShowTransformerTypes } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerTypesDisplay";
import type { TransformerTypeBadge } from "../../src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorInterface";

const RUN_TEST_TIMEOUT = 120_000;
const switchTarget = { byTestId: "transformer-editor-show-types-switch" };
const rootBadgeTarget = { byTestId: "transformer-type-badge-transformer" };

const transformerEditorSuite: ReactComponentTestSuiteContext = {
  suitePath: ["transformerTypesDisplay", "TransformerEditor"],
  component: "TransformerEditor",
  componentProps: {
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    entityUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  },
  caseLabels: ["first case", "second case"],
};

function leaf(label: string, steps: ReactComponentTestStep[]): MiroirTestForReactComponent {
  return { miroirTestType: "reactComponentTest", miroirTestLabel: label, steps };
}

// ################################################################################################
describe("transformerTypesDisplay: the switch value through the runner's host", () => {
  let sandboxElement: HTMLElement;
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });
  beforeEach(() => {
    sandboxElement = document.createElement("div");
    document.body.appendChild(sandboxElement);
  });
  afterEach(() => {
    runner?.close();
    runner = undefined;
    sandboxElement.remove();
  });

  it(
    "a case starts with the host value, and a toggle in a case is the value of the next one",
    async () => {
      let hostValue = true;
      const saved: boolean[] = [];
      runner = createReactComponentTestRunner({
        sandboxElement,
        showTransformerTypes: () => hostValue,
        saveShowTransformerTypes: (value) => {
          hostValue = value;
          saved.push(value);
        },
      });

      const first = await runner({
        testNamePath: [...transformerEditorSuite.suitePath, "first case"],
        leaf: leaf("first case", [
          { step: "expectElement", label: "starts on", target: switchTarget, checked: true },
          { step: "expectElement", label: "root badge shown", target: rootBadgeTarget, timeout: 2000 },
          { step: "click", label: "switch off", target: switchTarget },
          { step: "expectElement", label: "off", target: switchTarget, checked: false },
          { step: "expectElement", label: "root badge gone", target: rootBadgeTarget, present: false },
        ]),
        suite: transformerEditorSuite,
      });
      expect(first).toEqual({ status: "ok" });
      expect(saved).toEqual([false]);

      const second = await runner({
        testNamePath: [...transformerEditorSuite.suitePath, "second case"],
        leaf: leaf("second case", [
          { step: "expectElement", label: "starts off", target: switchTarget, checked: false },
          { step: "expectElement", label: "no root badge", target: rootBadgeTarget, present: false },
        ]),
        suite: transformerEditorSuite,
      });
      expect(second).toEqual({ status: "ok" });
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
describe("transformerTypesDisplay: badge labels (D18)", () => {
  const bookUuid = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
  const walk = checkTransformerInterfaceRecursively(
    {
      transformerType: "mapList",
      interpolation: "runtime",
      elementTransformer: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "defaultInput" },
    },
    { type: "array", payload: bookUuid },
    { entityMlSchemas: { [bookUuid]: { type: "object", definition: { uuid: { type: "uuid" } } } } },
  );
  const badgeAt = (badges: TransformerTypeBadge[], path: string[]) =>
    badges.find((badge) => badge.path.join(".") === path.join("."));

  it("an entity type shows the entity name, its uuid stays in the tooltip", () => {
    const badges = transformerTypeBadges(walk, [{ uuid: bookUuid, name: "Book" }]);
    expect(badgeAt(badges, ["transformer"])).toMatchObject({ givenLabel: "array<Book>" });
    expect(badgeAt(badges, ["transformer", "elementTransformer"])).toMatchObject({ givenLabel: "Book" });
    expect(badgeAt(badges, ["transformer"])?.title).toContain(bookUuid);
  });

  it("an unknown entity uuid shows its first 8 characters", () => {
    const badges = transformerTypeBadges(walk, []);
    expect(badgeAt(badges, ["transformer"])).toMatchObject({ givenLabel: "array<e8ba151b>" });
    expect(badgeAt(badges, ["transformer", "elementTransformer"])).toMatchObject({ givenLabel: "e8ba151b" });
  });
});

// ################################################################################################
describe("transformerTypesDisplay: badges of primitive literals", () => {
  let sandboxElement: HTMLElement;
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });
  beforeEach(() => {
    sandboxElement = document.createElement("div");
    document.body.appendChild(sandboxElement);
  });
  afterEach(() => {
    runner?.close();
    runner = undefined;
    sandboxElement.remove();
  });

  it(
    "a primitive literal applyTo shows its badge after its label, an object node once on its title row",
    async () => {
      runner = createReactComponentTestRunner({ sandboxElement });
      const badge = (path: string[], outputLabel: string): TransformerTypeBadge => ({
        path,
        outputLabel,
        status: "unknown",
        title: `value ${outputLabel}`,
      });
      const suite: ReactComponentTestSuiteContext = {
        suitePath: ["transformerTypesDisplay", "MlElementEditor"],
        component: "MlElementEditor",
        componentProps: {
          name: "testField",
          listKey: "ROOT.testField",
          rootLessListKey: "testField",
          rootLessListKeyArray: ["testField"],
          rawMlSchema: {
            type: "object",
            definition: { transformerType: { type: "string" }, applyTo: { type: "string" } },
          },
          initialFormState: { transformerType: "aggregate", applyTo: "a" },
          transformerTypeBadges: [badge(["testField", "applyTo"], "string"), badge(["testField"], "number")],
        },
        caseLabels: ["badges"],
      };
      const result = await runner({
        testNamePath: [...suite.suitePath, "badges"],
        leaf: leaf("badges", [
          {
            step: "expectElement",
            label: "the literal's badge",
            target: { byTestId: "transformer-type-badge-testField.applyTo" },
            attribute: { name: "data-transformer-type-output", value: "string" },
            count: 1,
            timeout: 2000,
          },
          {
            step: "expectElement",
            label: "the object's badge, once",
            target: { byTestId: "transformer-type-badge-testField" },
            count: 1,
          },
        ]),
        suite,
      });
      expect(result).toEqual({ status: "ok" });
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
/** Puts the Admin ViewParams with `showTransformerTypes` in the local cache, as a save landing. */
function loadViewParams(localCache: LocalCacheInterface, showTransformerTypes: boolean) {
  // no rollback: a rollback of the admin application drops the ViewParams instance just loaded
  const loadResult = localCache.handleLocalCacheAction(
    {
      actionType: "loadNewInstancesInLocalCache",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: adminSelfApplication.uuid,
        objects: [
          {
            parentName: entityViewParams.name,
            parentUuid: entityViewParams.uuid,
            applicationSection: "data",
            instances: [{ ...defaultAdminViewParams, showTransformerTypes }],
          },
        ],
      },
    } as any,
    defaultSelfApplicationDeploymentMap,
  );
  if (loadResult.status !== "ok") {
    throw new Error(`harness: loading ViewParams failed: ${JSON.stringify(loadResult)}`);
  }
}

function buildAppHarness(showTransformerTypes: boolean) {
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
  loadViewParams(localCache, showTransformerTypes);
  return { miroirContext, localCache };
}

const handledActions: any[] = [];
const domainController = {
  handleActionFromUI: async (action: any) => {
    handledActions.push(action);
    return { status: "ok" };
  },
} as unknown as DomainControllerInterface;

const PrepareButton: React.FC = () => {
  const sandbox = useComponentTestSandbox();
  return (
    <button type="button" onClick={() => void sandbox?.prepareComponentTests()}>
      prepare
    </button>
  );
};

describe("transformerTypesDisplay: the sandbox host and the app's ViewParams", () => {
  afterEach(() => {
    vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
    ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
    handledActions.length = 0;
  });

  it(
    "the host reads ViewParams showTransformerTypes, and a save from a case is the host value at once and a ViewParams update",
    async () => {
      const harness = buildAppHarness(true);
      const { unmount } = render(
        <LocalCacheProvider store={harness.localCache.getInnerStore()}>
          <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={domainController}>
            <ComponentTestSandboxProvider>
              <PrepareButton />
            </ComponentTestSandboxProvider>
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "prepare" }));
      await waitFor(() => expect(componentTestsEntry.registerComponentTests).toHaveBeenCalled());
      const host = vi.mocked(componentTestsEntry.registerComponentTests).mock.calls[0][0];
      await waitFor(() => expect(host.showTransformerTypes?.()).toBe(true));

      host.saveShowTransformerTypes?.(false);
      expect(host.showTransformerTypes?.()).toBe(false);
      await waitFor(() => expect(handledActions).toHaveLength(1));
      expect(handledActions[0]).toMatchObject({
        actionType: "updateInstance",
        payload: {
          application: adminSelfApplication.uuid,
          objects: [{ uuid: defaultAdminViewParams.uuid, showTransformerTypes: false }],
        },
      });
      unmount();
    },
    RUN_TEST_TIMEOUT,
  );
});

// ################################################################################################
const SwitchProbe: React.FC = () => {
  const [showTransformerTypes, setShowTransformerTypes] = useShowTransformerTypes();
  return (
    <button type="button" onClick={() => setShowTransformerTypes(!showTransformerTypes)}>
      {showTransformerTypes ? "types on" : "types off"}
    </button>
  );
};

describe("transformerTypesDisplay: the editor's switch and the app's ViewParams", () => {
  afterEach(() => {
    handledActions.length = 0;
  });

  it(
    "a toggle shows at once, and a later ViewParams change made elsewhere replaces it",
    async () => {
      const harness = buildAppHarness(false);
      const { unmount } = render(
        <LocalCacheProvider store={harness.localCache.getInnerStore()}>
          <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={domainController}>
            <SwitchProbe />
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
      await waitFor(() => screen.getByRole("button", { name: "types off" }));
      fireEvent.click(screen.getByRole("button", { name: "types off" }));
      await waitFor(() => screen.getByRole("button", { name: "types on" }));
      await waitFor(() => expect(handledActions).toHaveLength(1));

      loadViewParams(harness.localCache, true); // the save lands
      await waitFor(() => screen.getByRole("button", { name: "types on" }));
      loadViewParams(harness.localCache, false); // changed in the ViewParams report
      await waitFor(() => screen.getByRole("button", { name: "types off" }));
      unmount();
    },
    RUN_TEST_TIMEOUT,
  );
});
