import { useEffect, useMemo, useState } from "react";

import { buildIntegrationTestRunInspectorModel } from "../../../4-tests/buildIntegrationTestRunInspectorModel.js";
import {
  getLastUiIntegrationTestRunResult,
  subscribeLastUiIntegrationTestRunResult,
} from "../../../4-tests/uiIntegrationTestRunState.js";
import { applyUiIntegrationTestRunResultToPreferences } from "../../../4-tests/uiIntegrationTestRunPreferences.js";

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  marginBottom: "6px",
};

const detailStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#37474f",
  lineHeight: 1.5,
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: "bold",
  textTransform: "uppercase",
  padding: "1px 6px",
  borderRadius: "999px",
  marginRight: "6px",
};

export function UiIntegrationTestRunInspectorSummary() {
  const [lastRun, setLastRun] = useState(() => getLastUiIntegrationTestRunResult());

  useEffect(
    () =>
      subscribeLastUiIntegrationTestRunResult(() => {
        const result = getLastUiIntegrationTestRunResult();
        setLastRun(result);
        if (result) {
          applyUiIntegrationTestRunResultToPreferences(result);
        }
      }),
    [],
  );

  const inspectorModel = useMemo(() => {
    if (!lastRun) {
      return undefined;
    }
    return buildIntegrationTestRunInspectorModel(lastRun);
  }, [lastRun]);

  if (!lastRun || !inspectorModel) {
    return null;
  }

  const { sessionDescriptor, assertionSummary } = inspectorModel;
  const resultColor = lastRun.success ? "#2e7d32" : "#c62828";

  return (
    <div
      id="integration-test-inspector"
      style={{
        marginTop: "12px",
        padding: "10px 12px",
        backgroundColor: "#fafafa",
        border: "1px solid #cfd8dc",
        borderRadius: "6px",
        ...detailStyle,
      }}
    >
      <div style={sectionTitleStyle}>Integration Test Inspector</div>

      <div>Suite: {inspectorModel.suiteKey}</div>
      <div>
        Profile: {inspectorModel.profileName}
        <span style={{ color: "#607d8b" }}> — {inspectorModel.profileDescription}</span>
      </div>
      <div>
        Session: {inspectorModel.sessionKind}
        <span style={{ ...chipStyle, backgroundColor: "#e3f2fd", color: "#1565c0" }}>
          playfield {sessionDescriptor.playfield}
        </span>
        <span style={{ ...chipStyle, backgroundColor: "#fff3e0", color: "#ef6c00" }}>
          host {inspectorModel.hostMode}
        </span>
      </div>
      <div>
        Bootstrap phases: {sessionDescriptor.bootstrapPhases.join(" → ")}
      </div>
      <div>
        Embedded capable: {sessionDescriptor.embeddedCapable ? "yes" : "no"}
      </div>
      <div>Run target mode: {inspectorModel.runTargetMode}</div>
      <div>
        Run target: {inspectorModel.runTarget.applicationName} (
        {inspectorModel.runTarget.applicationUuid})
      </div>
      <div>Deployment: {inspectorModel.runTarget.deploymentUuid}</div>
      {inspectorModel.paramBankKeys.length > 0 && (
        <div>Param bank keys: {inspectorModel.paramBankKeys.join(", ")}</div>
      )}
      <div style={{ marginTop: "6px" }}>
        Assertions: {assertionSummary.passed}/{assertionSummary.total} passed
        {assertionSummary.failed > 0 ? `, ${assertionSummary.failed} failed` : ""}
        {assertionSummary.skipped > 0 ? `, ${assertionSummary.skipped} skipped` : ""}
      </div>
      {assertionSummary.recentFailures.length > 0 && (
        <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
          {assertionSummary.recentFailures.map((failure) => (
            <li key={failure.testLabel} style={{ color: "#c62828" }}>
              {failure.testLabel}
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: "4px", color: resultColor }}>
        Result: {lastRun.success ? "passed" : "failed"}
      </div>
    </div>
  );
}
