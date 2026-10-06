import React, { useCallback, useMemo } from "react";

import type { UiIntegrationReportTestSession } from "../../../4-tests/uiIntegrationTestLauncherTypes.js";
import { useAdminViewParams } from "../useAdminViewParams.js";
import {
  useComponentTestSandbox,
  type ComponentTestRunOptions,
  type ComponentTestSandboxContextValue,
} from "./ComponentTestSandbox.js";

// ################################################################################################
// The settings of a component test run, next to the Run buttons, saved in the app's ViewParams:
// - "Show transformer types" (`componentTestShowTransformerTypes`): the value the TransformerEditor's
//   switch starts with in every case of a run. Disabled during a run: the run keeps the value it
//   started with.
// - "Show test sandbox" (`componentTestShowSandbox`): the sandbox panel is shown; otherwise the
//   cases render off-screen. It also acts on an open panel at once.
// `useComponentTestRunPreparation()` gives the Run buttons the sandbox's run start and end, the
// start taking these settings.
// ################################################################################################

export interface ComponentTestRunSettingsValue {
  showTransformerTypes: boolean;
  showSandbox: boolean;
  saveShowTransformerTypes: (showTransformerTypes: boolean) => void;
  saveShowSandbox: (showSandbox: boolean) => void;
}

/** The two settings, from the app's ViewParams (absent: false), and their saves. */
export function useComponentTestRunSettings(): ComponentTestRunSettingsValue {
  const { viewParamsData, saveViewParams } = useAdminViewParams();
  const saveShowTransformerTypes = useCallback(
    (componentTestShowTransformerTypes: boolean) => saveViewParams({ componentTestShowTransformerTypes }),
    [saveViewParams],
  );
  const saveShowSandbox = useCallback(
    (componentTestShowSandbox: boolean) => saveViewParams({ componentTestShowSandbox }),
    [saveViewParams],
  );
  return {
    showTransformerTypes: viewParamsData?.componentTestShowTransformerTypes === true,
    showSandbox: viewParamsData?.componentTestShowSandbox === true,
    saveShowTransformerTypes,
    saveShowSandbox,
  };
}

const settingLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "13px",
  color: "#4527a0",
  marginRight: "8px",
  whiteSpace: "nowrap",
};

/** The two switches. "Show transformer types" is disabled while a run is in progress. */
export const ComponentTestRunSettings: React.FC = () => {
  const sandbox = useComponentTestSandbox();
  const { showTransformerTypes, showSandbox, saveShowTransformerTypes, saveShowSandbox } =
    useComponentTestRunSettings();
  const running = sandbox?.running ?? false;
  return (
    <>
      <label
        style={{ ...settingLabelStyle, opacity: running ? 0.5 : 1 }}
        title={running ? "Fixed for the component test run in progress" : "The value the TransformerEditor's switch starts with in every case of a run"}
      >
        <input
          type="checkbox"
          aria-label="Show transformer types in component test runs"
          checked={showTransformerTypes}
          disabled={running}
          onChange={(event) => saveShowTransformerTypes(event.target.checked)}
        />
        Show transformer types
      </label>
      <label style={settingLabelStyle} title="Show the component test sandbox; otherwise the cases run off-screen">
        <input
          type="checkbox"
          aria-label="Show test sandbox"
          checked={showSandbox}
          onChange={(event) => {
            saveShowSandbox(event.target.checked);
            sandbox?.setSandboxShown(event.target.checked);
          }}
        />
        Show test sandbox
      </label>
    </>
  );
};

/** The sandbox's run start and end for the Run buttons, the start taking the run settings; empty without a sandbox. */
export function useComponentTestRunPreparation(): Partial<
  Pick<ComponentTestSandboxContextValue, "prepareComponentTests" | "finishComponentTests" | "prepareReportTests">
> {
  const sandbox = useComponentTestSandbox();
  const { showTransformerTypes, showSandbox } = useComponentTestRunSettings();
  return useMemo(() => {
    if (!sandbox) {
      return {};
    }
    return {
      prepareComponentTests: (options?: ComponentTestRunOptions) =>
        sandbox.prepareComponentTests({ ...options, showTransformerTypes, showSandbox }),
      finishComponentTests: sandbox.finishComponentTests,
      prepareReportTests: (session: UiIntegrationReportTestSession) => {
        sandbox.setSandboxShown(showSandbox);
        return sandbox.prepareReportTests(session);
      },
    };
  }, [sandbox, showTransformerTypes, showSandbox]);
}
