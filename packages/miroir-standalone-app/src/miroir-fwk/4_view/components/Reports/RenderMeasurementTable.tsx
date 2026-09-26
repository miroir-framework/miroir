import React from "react";

import type { ComponentRenderMeasurement } from "miroir-core";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { ThemedLabel } from "../Themes/index.js";

// ################################################################################################
// Render measurements of a MiroirTest run (#303 D10): the `assertionMeasurements` of the leaves
// using a `measureRendering` step, one table per leaf (component, mode, count, min / median / max ms).
// Informative only: timings never make a test fail (D9).
// ################################################################################################

export const renderMeasurementHeaders = ["Component", "Mode", "Count", "Min ms", "Median ms", "Max ms"];

/** The measurements carried by the assertion results of one test result row. */
export function renderMeasurementsOfTestResult(testData: {
  fullAssertionsResults?: unknown;
}): ComponentRenderMeasurement[] {
  const assertions = testData.fullAssertionsResults;
  if (!assertions || typeof assertions !== "object") {
    return [];
  }
  return Object.values(assertions as Record<string, { assertionMeasurements?: ComponentRenderMeasurement[] }>)
    .flatMap((assertion) => assertion?.assertionMeasurements ?? []);
}

function formatMs(value: number): string {
  return value.toFixed(2);
}

// ################################################################################################
export const RenderMeasurementTable: React.FC<{
  leafLabel: string;
  measurements: ComponentRenderMeasurement[];
}> = ({ leafLabel, measurements }) => {
  const { currentTheme } = useMiroirTheme();
  const cellStyle: React.CSSProperties = {
    padding: `2px ${currentTheme.spacing.sm}`,
    borderBottom: `1px solid ${currentTheme.colors.border}`,
    textAlign: "left",
    whiteSpace: "nowrap",
  };
  const numberCellStyle: React.CSSProperties = { ...cellStyle, textAlign: "right" };
  return (
    <table
      aria-label={`Render measurements: ${leafLabel}`}
      style={{
        borderCollapse: "collapse",
        fontFamily: currentTheme.typography.fontFamily,
        fontSize: "12px",
        color: currentTheme.colors.text,
        backgroundColor: currentTheme.colors.surface,
        marginBottom: currentTheme.spacing.sm,
      }}
    >
      <thead>
        <tr>
          {renderMeasurementHeaders.map((header, index) => (
            <th key={header} style={{ ...(index >= 2 ? numberCellStyle : cellStyle), fontWeight: "bold" }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {measurements.map((measurement) => (
          <tr key={`${measurement.mode}/${measurement.componentId}`}>
            <td style={cellStyle}>{measurement.componentId}</td>
            <td style={cellStyle}>{measurement.mode}</td>
            <td style={numberCellStyle}>{measurement.count}</td>
            <td style={numberCellStyle}>{formatMs(measurement.minMs)}</td>
            <td style={numberCellStyle}>{formatMs(measurement.medianMs)}</td>
            <td style={numberCellStyle}>{formatMs(measurement.maxMs)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ################################################################################################
/** One table per result row carrying measurements; nothing when no row carries any. */
export const RenderMeasurementsPanel: React.FC<{
  testResultsData: { testName: string; testPath: string[]; fullAssertionsResults?: unknown }[];
}> = ({ testResultsData }) => {
  const rows = testResultsData
    .map((testData) => ({
      testData,
      measurements: renderMeasurementsOfTestResult(testData),
    }))
    .filter((row) => row.measurements.length > 0);
  if (rows.length === 0) {
    return null;
  }
  return (
    <div data-testid="render-measurements-panel" style={{ marginTop: "12px" }}>
      <ThemedLabel>Render measurements (ms, informative: not a pass / fail criterion)</ThemedLabel>
      {rows.map(({ testData, measurements }) => {
        const leafLabel = testData.testPath[testData.testPath.length - 1] ?? testData.testName;
        return (
          <div key={testData.testName} style={{ marginTop: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{leafLabel}</div>
            <RenderMeasurementTable leafLabel={leafLabel} measurements={measurements} />
          </div>
        );
      })}
    </div>
  );
};
