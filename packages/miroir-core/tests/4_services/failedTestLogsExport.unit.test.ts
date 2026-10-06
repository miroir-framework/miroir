import { afterEach, describe, expect, it } from "vitest";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import {
  buildFailedTestLogsExport,
  formatLogArg,
  hasFailedTestResults,
  snapshotTestRunLogs,
  suggestedFailedTestLogsFilename,
  type FailedTestLogsExportTestResult,
} from "../../src/4_services/failedTestLogsExport";

describe("#490 failed test logs export", () => {
  let service: MiroirEventService | undefined;

  afterEach(() => {
    service?.destroy();
    service = undefined;
  });

  /** Runs suite "editor" with tests "passes" and "fails" (twice: a former run, then the last one). */
  async function runSuite(tracker: MiroirActivityTracker, eventService: MiroirEventService, run: string) {
    await tracker.trackTestSuite("editor", "editor", undefined, async () => {
      await tracker.trackTest("passes", undefined, async () => {
        eventService.pushLogToEvent("info", "passingLogger", `${run}: all good`);
      });
      await tracker
        .trackTest("fails", undefined, async () => {
          eventService.pushLogToEvent("debug", "failingLogger", `${run}: before the action`);
          await tracker.trackAction("runBoxedQueryAction", "DC.handleBoxedQuery", async () => {
            eventService.pushLogToEvent("error", "queryLogger", `${run}: query failed`, {
              reason: "no such entity",
            });
          });
          await tracker.trackTestAssertion("value is 1", undefined, async () => {
            eventService.pushLogToEvent("warn", "assertionLogger", `${run}: expected 1, got 2`);
          });
          throw new Error("expected 1, got 2");
        })
        .catch(() => undefined);
    });
  }

  const testResults: FailedTestLogsExportTestResult[] = [
    { testPath: ["ui.editor", "editor", "passes"], testResult: "ok" },
    {
      testPath: ["ui.editor", "editor", "fails"],
      testResult: "error",
      failedAssertions: ["value is 1"],
      fullAssertionsResults: { "value is 1": { assertionResult: "error" } },
    },
    { testPath: ["ui.editor", "editor", "skipped"], testResult: "skipped" },
  ];

  it("keeps one entry per failed test of the last run, with its logs and those of its actions and assertions", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    service = eventService;

    await runSuite(tracker, eventService, "former run");
    await new Promise((resolve) => setTimeout(resolve, 2));
    const lastRunStart = Date.now();
    await runSuite(tracker, eventService, "last run");

    const runLogs = snapshotTestRunLogs({
      activities: tracker.getAllActivities(),
      events: eventService.getAllEvents(),
      since: lastRunStart,
    });
    const exported = buildFailedTestLogsExport({
      suiteKey: "ui.editor",
      runMode: "unit",
      testResults,
      runLogs,
      exportedAt: "2026-10-06T12:00:00.000Z",
    });

    expect(exported).toMatchObject({
      suiteKey: "ui.editor",
      runMode: "unit",
      exportedAt: "2026-10-06T12:00:00.000Z",
      testCount: 3,
      failedTestCount: 1,
    });
    expect(exported.failedTests).toHaveLength(1);
    const [failed] = exported.failedTests;
    expect(failed.testPath).toEqual(["ui.editor", "editor", "fails"]);
    expect(failed.failedAssertions).toEqual(["value is 1"]);
    expect(failed.assertions).toEqual({ "value is 1": { assertionResult: "error" } });
    expect(failed.error).toBe("expected 1, got 2");
    expect(failed.runId).toBeTruthy();
    expect(failed.logs.map((log) => [log.level, log.loggerName, log.message])).toEqual([
      ["debug", "failingLogger", "last run: before the action"],
      ["error", "queryLogger", "last run: query failed"],
      ["warn", "assertionLogger", "last run: expected 1, got 2"],
    ]);
    expect(failed.logs[1]).toMatchObject({
      activityType: "action",
      activityLabel: "DC.handleBoxedQuery",
      args: ['{"reason":"no such entity"}'],
    });
    expect(failed.activities.map((activity) => activity.activityType)).toEqual([
      "test",
      "action",
      "testAssertion",
    ]);
  });

  it("lists failed tests without logs when no run logs were captured", () => {
    const exported = buildFailedTestLogsExport({ suiteKey: "ui.editor", testResults });
    expect(exported.failedTests).toHaveLength(1);
    expect(exported.failedTests[0]).toMatchObject({ logs: [], activities: [], runId: undefined });
  });

  it("counts a test with a failed assertion as failed", () => {
    expect(hasFailedTestResults([{ testPath: ["a"], testResult: "ok" }])).toBe(false);
    expect(
      hasFailedTestResults([{ testPath: ["a"], testResult: "ok", failedAssertions: ["x"] }]),
    ).toBe(true);
  });

  it("formats log arguments as bounded text, circular references included", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;
    expect(formatLogArg("plain")).toBe("plain");
    expect(formatLogArg(circular)).toBe('{"name":"loop","self":"[circular]"}');
    expect(formatLogArg("x".repeat(20_005))).toMatch(/… \[5 more characters\]$/);
  });

  it("names the file after the suite key and the export time", () => {
    expect(suggestedFailedTestLogsFilename("ui.transformerEditor", "2026-10-06T12:00:00.000Z")).toBe(
      "miroir-failed-tests-ui.transformerEditor-2026-10-06T12-00-00-000Z.json",
    );
  });
});
