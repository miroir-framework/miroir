import React from "react";
import {
  buildFailedTestLogsExport,
  hasFailedTestResults,
  suggestedFailedTestLogsFilename,
  type FailedTestLogsExportTestResult,
  type TestRunLogSnapshot,
} from "miroir-core";

export interface ExportFailedTestLogsButtonProps {
  testLabel: string;
  testResultsData: readonly FailedTestLogsExportTestResult[];
  runLogs?: TestRunLogSnapshot;
  runMode?: string;
}

function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** #490: downloads one JSON file with the assertions and logs of each failed test of the last run. */
export const ExportFailedTestLogsButton: React.FC<ExportFailedTestLogsButtonProps> = ({
  testLabel,
  testResultsData,
  runLogs,
  runMode,
}) => {
  if (!hasFailedTestResults(testResultsData)) {
    return null;
  }

  const exportFailedTestLogs = () => {
    const exported = buildFailedTestLogsExport({
      suiteKey: testLabel,
      runMode,
      testResults: testResultsData,
      runLogs,
    });
    downloadJson(exported, suggestedFailedTestLogsFilename(testLabel, exported.exportedAt));
  };

  return (
    <button
      type="button"
      data-testid="export-failed-test-logs"
      onClick={exportFailedTestLogs}
      title={
        runLogs
          ? "Download the assertions and logs of the failed tests of the last run (JSON)"
          : "Download the assertions of the failed tests of the last run (JSON); no logs were captured"
      }
      style={{
        padding: "4px 8px",
        fontSize: "12px",
        border: "1px solid #f44336",
        borderRadius: "4px",
        backgroundColor: "white",
        color: "#c62828",
        cursor: "pointer",
      }}
    >
      Export failed test logs
    </button>
  );
};
