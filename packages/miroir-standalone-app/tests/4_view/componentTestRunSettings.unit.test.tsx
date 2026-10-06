/**
 * The settings of a component test run, next to its Run button: "Show transformer types" and
 * "Show test sandbox", saved in the app's ViewParams (`componentTestShowTransformerTypes`,
 * `componentTestShowSandbox`, absent: off).
 *
 * - A run takes them when it starts: every case starts with the "Show transformer types" value,
 *   and the sandbox panel is off-screen (the cases still render, the user does not see them)
 *   unless "Show test sandbox" is on. "Show test sandbox" also acts on an open panel at once.
 * - During a run, "Show transformer types" is disabled, its value fixed for the run, and a banner
 *   asks the user to stay on the window (a page that loses focus or goes to the background renders
 *   late, which made cases fail).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestRunSettings
 * ```
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfigurationService } from "miroir-core";
import { LocalCacheProvider, MiroirContextReactProvider } from "miroir-react";
import { defaultAdminViewParams } from "miroir-app-admin";

vi.mock("../../src/miroir-fwk/4-tests/componentTests/index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/miroir-fwk/4-tests/componentTests/index")>();
  return {
    ...actual,
    registerComponentTests: vi.fn(actual.registerComponentTests),
  };
});

import * as componentTestsEntry from "../../src/miroir-fwk/4-tests/componentTests/index";
import {
  ComponentTestSandboxProvider,
  useComponentTestSandbox,
} from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox";
import {
  ComponentTestRunSettings,
  useComponentTestRunPreparation,
} from "../../src/miroir-fwk/4_view/components/Reports/ComponentTestRunSettings";
import { buildAdminViewParamsHarness, loadViewParams } from "../helpers/adminViewParamsHarness";

const TEST_TIMEOUT = 60_000;
const typesSwitch = () => screen.getByRole("checkbox", { name: "Show transformer types in component test runs" });
const sandboxSwitch = () => screen.getByRole("checkbox", { name: "Show test sandbox" });
const panel = () => screen.getByTestId("component-test-sandbox-panel");
const banner = () => screen.queryByText(/please stay on this window/i);

/** Run buttons stand-in: starts and ends a run as the Run buttons do, with the settings. */
const RunProbe: React.FC = () => {
  const { prepareComponentTests, finishComponentTests } = useComponentTestRunPreparation();
  return (
    <>
      <button type="button" onClick={() => void prepareComponentTests?.()}>
        start run
      </button>
      <button type="button" onClick={() => finishComponentTests?.()}>
        end run
      </button>
    </>
  );
};

function renderApp(viewParams: Record<string, unknown>) {
  const harness = buildAdminViewParamsHarness(viewParams);
  const rendered = render(
    <LocalCacheProvider store={harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={harness.domainController}>
        <ComponentTestSandboxProvider>
          <ComponentTestRunSettings />
          <RunProbe />
        </ComponentTestSandboxProvider>
      </MiroirContextReactProvider>
    </LocalCacheProvider>,
  );
  return { harness, ...rendered };
}

const lastHost = () => {
  const calls = vi.mocked(componentTestsEntry.registerComponentTests).mock.calls;
  return calls[calls.length - 1][0];
};

describe("component test run settings", () => {
  afterEach(() => {
    vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
    ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
  });

  it(
    "the switches show the ViewParams values, off when absent, and a change saves it",
    async () => {
      const { harness, unmount } = renderApp({});
      expect(typesSwitch()).not.toBeChecked();
      expect(sandboxSwitch()).not.toBeChecked();

      loadViewParams(harness.localCache, { componentTestShowTransformerTypes: true });
      await waitFor(() => expect(typesSwitch()).toBeChecked());

      fireEvent.click(sandboxSwitch());
      await waitFor(() => expect(harness.handledActions).toHaveLength(1));
      expect(harness.handledActions[0]).toMatchObject({
        actionType: "updateInstance",
        payload: { objects: [{ uuid: defaultAdminViewParams.uuid, componentTestShowSandbox: true }] },
      });
      unmount();
    },
    TEST_TIMEOUT,
  );

  it(
    "a run takes the switch values: the cases get Show transformer types, the panel is off-screen unless Show test sandbox",
    async () => {
      const { unmount } = renderApp({ componentTestShowTransformerTypes: true, componentTestShowSandbox: false });
      fireEvent.click(screen.getByRole("button", { name: "start run" }));
      await waitFor(() => expect(componentTestsEntry.registerComponentTests).toHaveBeenCalled());
      expect(lastHost().showTransformerTypes?.()).toBe(true);
      // rendered, so that the cases run, but out of the user's sight
      await waitFor(() => expect(panel()).toHaveAttribute("data-sandbox-shown", "false"));
      expect(panel()).toBeVisible();

      fireEvent.click(sandboxSwitch());
      await waitFor(() => expect(panel()).toHaveAttribute("data-sandbox-shown", "true"));
      fireEvent.click(screen.getByRole("button", { name: "end run" }));
      unmount();
    },
    TEST_TIMEOUT,
  );

  it(
    "during a run, Show transformer types is disabled and a banner asks to stay on the window; both end with the run",
    async () => {
      const { unmount } = renderApp({});
      expect(typesSwitch()).toBeEnabled();
      expect(banner()).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "start run" }));
      await waitFor(() => expect(typesSwitch()).toBeDisabled());
      expect(banner()).not.toBeNull();
      expect(lastHost().showTransformerTypes?.()).toBe(false);

      fireEvent.click(screen.getByRole("button", { name: "end run" }));
      await waitFor(() => expect(typesSwitch()).toBeEnabled());
      expect(banner()).toBeNull();
      unmount();
    },
    TEST_TIMEOUT,
  );
});

describe("component test run settings: Report suites and the hidden sandbox (PR #496 review)", () => {
  afterEach(() => {
    vi.mocked(componentTestsEntry.registerComponentTests).mockClear();
    ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
  });

  it(
    "without the transformer types setting, only Show test sandbox is shown (Report suites)",
    () => {
      const harness = buildAdminViewParamsHarness({});
      const { unmount } = render(
        <LocalCacheProvider store={harness.localCache.getInnerStore()}>
          <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={harness.domainController}>
            <ComponentTestSandboxProvider>
              <ComponentTestRunSettings showTransformerTypesSetting={false} />
            </ComponentTestSandboxProvider>
          </MiroirContextReactProvider>
        </LocalCacheProvider>,
      );
      expect(sandboxSwitch()).toBeInTheDocument();
      expect(screen.queryByRole("checkbox", { name: "Show transformer types in component test runs" })).toBeNull();
      unmount();
    },
    TEST_TIMEOUT,
  );

  it(
    "a hidden sandbox is not inert during a run; after it, it is inert and holds no focus",
    async () => {
      const { unmount } = renderApp({ componentTestShowSandbox: false });
      fireEvent.click(screen.getByRole("button", { name: "start run" }));
      await waitFor(() => expect(typesSwitch()).toBeDisabled());
      expect(panel()).not.toHaveAttribute("inert");

      // a step focused an input of the case, as `type` does
      const caseInput = document.createElement("input");
      screen.getByTestId("component-test-sandbox").appendChild(caseInput);
      caseInput.focus();
      expect(document.activeElement).toBe(caseInput);

      fireEvent.click(screen.getByRole("button", { name: "end run" }));
      await waitFor(() => expect(panel()).toHaveAttribute("inert"));
      expect(panel().contains(document.activeElement)).toBe(false);
      unmount();
    },
    TEST_TIMEOUT,
  );

  it(
    "a shown sandbox is not inert after the run",
    async () => {
      const { unmount } = renderApp({ componentTestShowSandbox: true });
      fireEvent.click(screen.getByRole("button", { name: "start run" }));
      await waitFor(() => expect(typesSwitch()).toBeDisabled());
      fireEvent.click(screen.getByRole("button", { name: "end run" }));
      await waitFor(() => expect(typesSwitch()).toBeEnabled());
      expect(panel()).toHaveAttribute("data-sandbox-shown", "true");
      expect(panel()).not.toHaveAttribute("inert");
      unmount();
    },
    TEST_TIMEOUT,
  );
});

/** A display without the sandbox provider has nothing to prepare. */
it("without a sandbox, the run preparation is empty", () => {
  let preparation: ReturnType<typeof useComponentTestRunPreparation> | undefined;
  let sandbox: ReturnType<typeof useComponentTestSandbox>;
  const Probe: React.FC = () => {
    preparation = useComponentTestRunPreparation();
    sandbox = useComponentTestSandbox();
    return null;
  };
  const harness = buildAdminViewParamsHarness({});
  const { unmount } = render(
    <LocalCacheProvider store={harness.localCache.getInnerStore()}>
      <MiroirContextReactProvider miroirContext={harness.miroirContext} domainController={harness.domainController}>
        <Probe />
      </MiroirContextReactProvider>
    </LocalCacheProvider>,
  );
  expect(sandbox).toBeUndefined();
  expect(preparation).toEqual({});
  unmount();
});
