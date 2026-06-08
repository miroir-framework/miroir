import React from "react";

import type { UnitTestResultData } from "../Buttons/RunUnitTestSuiteButton.js";

export type UnitTestResultDataAndSelect = UnitTestResultData & {
  selected: boolean;
};

export interface UnitTestResultsProps {
  unitTestResultsData: UnitTestResultDataAndSelect[];
  testLabel?: string;
}

export const UnitTestResults: React.FC<UnitTestResultsProps> = ({
  unitTestResultsData,
  testLabel = "UnitTest",
}) => {
  if (!unitTestResultsData.length) {
    return null;
  }

  return (
    <div style={{ marginTop: "12px", width: "100%" }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#333" }}>
        {testLabel} results
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ backgroundColor: "#e3f2fd", textAlign: "left" }}>
            <th style={{ padding: "8px", borderBottom: "1px solid #b3d9ff" }}>Status</th>
            <th style={{ padding: "8px", borderBottom: "1px solid #b3d9ff" }}>Test</th>
            <th style={{ padding: "8px", borderBottom: "1px solid #b3d9ff" }}>Assertions</th>
          </tr>
        </thead>
        <tbody>
          {unitTestResultsData.map((result) => (
            <tr key={result.testName} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{result.status}</td>
              <td style={{ padding: "8px" }}>{result.testName}</td>
              <td style={{ padding: "8px", color: result.testResult === "error" ? "#c62828" : "#333" }}>
                {result.assertions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
