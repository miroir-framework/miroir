import { useEffect, useState } from "react";

import {
  listIntegrationTestProfileCatalogEntries,
  type IntegrationTestProfileCatalogEntry,
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

function profileOptionLabel(entry: IntegrationTestProfileCatalogEntry): string {
  if (entry.browserAvailable) {
    return `${entry.name} — ${entry.description}`;
  }
  return `${entry.name} — ${entry.description} (CLI only — config not bundled in browser)`;
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

  const profileEntries = listIntegrationTestProfileCatalogEntries();
  const selectedProfile = profileEntries.find((entry) => entry.name === preferences.profileName);
  const selectedProfileAvailable = selectedProfile?.browserAvailable ?? false;

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
        <select
          id="integration-test-profile-select"
          style={selectStyle}
          value={preferences.profileName}
          onChange={(event) => onProfileChange(event.target.value)}
        >
          {profileEntries.map((entry) => (
            <option key={entry.name} value={entry.name} disabled={!entry.browserAvailable}>
              {profileOptionLabel(entry)}
            </option>
          ))}
        </select>
      </div>

      {!selectedProfileAvailable && (
        <div style={{ fontSize: "12px", color: "#c62828", marginTop: "4px" }}>
          Selected profile is not bundled for in-browser runs — choose emulatedServer-sql or run via
          CLI.
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

export function isSelectedIntegrationProfileBrowserAvailable(): boolean {
  const { profileName } = getUiIntegrationTestRunPreferences();
  const entry = listIntegrationTestProfileCatalogEntries().find(
    (catalogEntry) => catalogEntry.name === profileName,
  );
  return entry?.browserAvailable ?? false;
}
