import React from "react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { FailedTestLogsExport, MiroirActivity, MiroirEvent } from "miroir-core";

import { ExportFailedTestLogsButton } from "../../../../src/miroir-fwk/4_view/components/Reports/ExportFailedTestLogsButton.js";

const okResult = { testPath: ["ui.editor", "editor", "passes"], testResult: "ok" as const };
const failedResult = {
  testPath: ["ui.editor", "editor", "fails"],
  testResult: "error" as const,
  failedAssertions: ["value is 1"],
  fullAssertionsResults: { "value is 1": { assertionResult: "error" } },
};

const suiteActivity = {
  activityId: "suite",
  activityType: "testSuite",
  actionType: "testSuite",
  actionLabel: "editor",
  startTime: 1,
  status: "completed",
  depth: 0,
  children: ["test"],
} as MiroirActivity;
const testActivity = {
  activityId: "test",
  parentId: "suite",
  activityType: "test",
  actionType: "test",
  actionLabel: "fails",
  runId: "K7X2NQ",
  startTime: 2,
  status: "error",
  error: "expected 1, got 2",
  depth: 1,
  children: [],
} as MiroirActivity;
const testEvent = {
  activity: testActivity,
  eventLogs: [
    { logId: "l1", timestamp: 3, level: "warn", loggerName: "assertionLogger", message: "expected 1, got 2", args: [] },
  ],
  logCounts: { trace: 0, debug: 0, info: 0, warn: 1, error: 0, total: 1 },
} as unknown as MiroirEvent;

const { createObjectURL, revokeObjectURL } = URL;

afterEach(() => {
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  vi.restoreAllMocks();
});

describe("#490 Export failed test logs button", () => {
  it("is hidden when the last run has no failed test", () => {
    render(<ExportFailedTestLogsButton testLabel="ui.editor" testResultsData={[okResult]} />);
    expect(screen.queryByRole("button", { name: "Export failed test logs" })).not.toBeInTheDocument();
  });

  it("downloads one JSON file with the failed tests of the last run and their logs", async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return "blob:failed-test-logs";
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    render(
      <ExportFailedTestLogsButton
        testLabel="ui.editor"
        runMode="unit"
        testResultsData={[okResult, failedResult]}
        runLogs={{ activities: [suiteActivity, testActivity], events: [testEvent] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Export failed test logs" }));

    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatch(/^miroir-failed-tests-ui\.editor-.*\.json$/);
    const exported: FailedTestLogsExport = JSON.parse(await blobs[0].text());
    expect(exported).toMatchObject({ suiteKey: "ui.editor", runMode: "unit", testCount: 2, failedTestCount: 1 });
    expect(exported.failedTests[0]).toMatchObject({
      testPath: ["ui.editor", "editor", "fails"],
      failedAssertions: ["value is 1"],
      runId: "K7X2NQ",
      error: "expected 1, got 2",
      logs: [{ level: "warn", loggerName: "assertionLogger", message: "expected 1, got 2" }],
    });
  });
});
