import { useEffect, useState } from "react";

import {
  detectUiIntegrationRuntime,
  isUiIntegrationProfileLaunchableInBrowser,
  listUiIntegrationProfileCatalogForPicker,
  type IntegrationTestProfileCatalogEntry,
  type UiIntegrationProfileTransport,
} from "../../../4-tests/integrationTestProfileCatalog.js";
import {
  getUiIntegrationTestRunPreferences,
  setUiIntegrationTestRunPreferences,
  subscribeUiIntegrationTestRunPreferences,
} from "../../../4-tests/uiIntegrationTestRunPreferences.js";
import type { UiIntegrationTestRunTargetMode } from "../../../4-tests/uiIntegrationTestLauncherTypes.js";

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  alignItems: "center",
  marginTop: "8px",
  marginBottom: "4px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "#4527a0",
};

const selectStyle: React.CSSProperties = {
  minWidth: "220px",
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid #b39ddb",
  fontSize: "13px",
};

const fieldsetStyle: React.CSSProperties = {
  border: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const legendStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "#4527a0",
  marginRight: "4px",
};

function transportHint(transport: UiIntegrationProfileTransport): string {
  switch (transport) {
    case "browserEmulatedIndexedDb":
      return "browser IndexedDB";
    case "electronEmulated":
      return "Electron emulated";
    case "realServer":
      return "requires miroir-server / bundled assets";
    case "cliEmulatedOnly":
      return "CLI only";
  }
}

function profileOptionLabel(entry: IntegrationTestProfileCatalogEntry): string {
  const launchable = isUiIntegrationProfileLaunchableInBrowser(entry.name);
  const suffix = launchable ? "" : ` [${transportHint(entry.uiTransport)}]`;
  return `${entry.name} — ${entry.description}${suffix}`;
}

export function UiIntegrationTestRunControls() {
  const [preferences, setPreferences] = useState(() => getUiIntegrationTestRunPreferences());

  useEffect(
    () =>
      subscribeUiIntegrationTestRunPreferences(() => {
        setPreferences(getUiIntegrationTestRunPreferences());
      }),
    [],
  );

  const runtime = detectUiIntegrationRuntime();
  const profileEntries = listUiIntegrationProfileCatalogForPicker(runtime);
  const selectedProfile = profileEntries.find((entry) => entry.name === preferences.profileName);
  const selectedProfileLaunchable = isUiIntegrationProfileLaunchableInBrowser(
    preferences.profileName,
  );

  const onProfileChange = (profileName: string) => {
    setUiIntegrationTestRunPreferences({ profileName });
  };

  const onRunTargetModeChange = (runTargetMode: UiIntegrationTestRunTargetMode) => {
    setUiIntegrationTestRunPreferences({ runTargetMode });
  };

  return (
    <div
      id="integration-test-run-controls"
      style={{
        marginTop: "8px",
        padding: "10px 12px",
        backgroundColor: "#f3e5f5",
        border: "1px solid #ce93d8",
        borderRadius: "6px",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "13px", color: "#4527a0", marginBottom: "6px" }}>
        Integration run settings
      </div>

      <div style={controlRowStyle}>
        <label style={labelStyle} htmlFor="integration-test-profile-select">
          Profile
        </label>
        {/*
          Do not set option.disabled for non-launchable profiles — native <select>
          ignores clicks on disabled options (no onChange), so the picker looked stuck.
          Selection is allowed; Run Integration Tests stays gated via isUiIntegrationProfileLaunchableInBrowser.
        */}
        <select
          id="integration-test-profile-select"
          style={selectStyle}
          value={preferences.profileName}
          onChange={(event) => onProfileChange(event.target.value)}
        >
          {profileEntries.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {profileOptionLabel(entry)}
            </option>
          ))}
        </select>
      </div>

      {!selectedProfileLaunchable && selectedProfile && (
        <div style={{ fontSize: "12px", color: "#c62828", marginTop: "4px" }}>
          {selectedProfile.uiTransport === "realServer"
            ? "Selected profile is not launchable yet — real-server requires miroir-server and a bundled browser config. Run Integration Tests stays disabled."
            : selectedProfile.uiTransport === "electronEmulated" && runtime === "webApp"
              ? "SQL/filesystem/Mongo emulated profiles are Electron-only — use emulatedServer-indexedDb in the browser, or realServer-sql."
              : "Profile not launchable in this runtime yet. Run Integration Tests stays disabled."}
        </div>
      )}

      <div style={controlRowStyle}>
        <fieldset style={fieldsetStyle}>
          <legend style={legendStyle}>Run target (D2)</legend>
          <label style={{ fontSize: "13px" }}>
            <input
              type="radio"
              name="integration-run-target-mode"
              value="ephemeral"
              checked={preferences.runTargetMode === "ephemeral"}
              onChange={() => onRunTargetModeChange("ephemeral")}
            />{" "}
            Ephemeral run (fresh UUID v4)
          </label>
          <label style={{ fontSize: "13px" }}>
            <input
              type="radio"
              name="integration-run-target-mode"
              value="pinned"
              checked={preferences.runTargetMode === "pinned"}
              onChange={() => onRunTargetModeChange("pinned")}
            />{" "}
            Pinned suite targets (JSON)
          </label>
        </fieldset>
      </div>
    </div>
  );
}

export function isSelectedIntegrationProfileBrowserLaunchable(): boolean {
  return isUiIntegrationProfileLaunchableInBrowser(getUiIntegrationTestRunPreferences().profileName);
}
