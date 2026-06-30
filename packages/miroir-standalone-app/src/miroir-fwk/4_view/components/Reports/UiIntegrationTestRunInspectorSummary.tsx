import { useEffect, useState } from "react";

import {
  getLastUiIntegrationTestRunResult,
  subscribeLastUiIntegrationTestRunResult,
} from "../../../4-tests/uiIntegrationTestRunState.js";

export function UiIntegrationTestRunInspectorSummary() {
  const [lastRun, setLastRun] = useState(() => getLastUiIntegrationTestRunResult());

  useEffect(() => subscribeLastUiIntegrationTestRunResult(() => {
    setLastRun(getLastUiIntegrationTestRunResult());
  }), []);

  if (!lastRun) {
    return null;
  }

  return (
    <div
      id="integration-test-inspector"
      style={{
        marginTop: "12px",
        padding: "10px 12px",
        backgroundColor: "#fafafa",
        border: "1px solid #cfd8dc",
        borderRadius: "6px",
        fontSize: "13px",
        color: "#37474f",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Integration Test Inspector</div>
      <div>Suite: {lastRun.suiteKey}</div>
      <div>Profile: {lastRun.profileName}</div>
      <div>Session: {lastRun.sessionKind}</div>
      <div>Host mode: {lastRun.hostMode}</div>
      <div>Run target mode: {lastRun.runTargetMode}</div>
      <div>
        Run target: {lastRun.runTarget.applicationName} ({lastRun.runTarget.applicationUuid})
      </div>
      <div>Deployment: {lastRun.runTarget.deploymentUuid}</div>
      <div style={{ marginTop: "4px", color: lastRun.success ? "#2e7d32" : "#c62828" }}>
        Result: {lastRun.success ? "passed" : "failed"}
      </div>
    </div>
  );
}
