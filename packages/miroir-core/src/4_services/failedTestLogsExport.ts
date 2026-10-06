import type { MiroirActivity } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { MiroirEvent } from "../3_controllers/MiroirEventService";
import type { RunExportActivity } from "./runLogExport";

// #490: "Export failed test logs" of the MiroirTest run panel. One JSON file, one entry per failed
// test of the last run, with its assertions and the log lines captured while it ran.

/** Activities and events of one test run, copied when the run ends (the event service drops old events). */
export type TestRunLogSnapshot = {
  activities: MiroirActivity[];
  events: MiroirEvent[];
};

/** The fields of a test report row (standalone-app `TestResultData`) the export reads. */
export type FailedTestLogsExportTestResult = {
  testPath: string[];
  testResult: "ok" | "error" | "skipped";
  failedAssertions?: string[];
  fullAssertionsResults?: unknown;
};

export type FailedTestLogLine = {
  timestamp: number;
  time: string;
  level: string;
  loggerName: string;
  activityId: string;
  activityType: MiroirActivity["activityType"];
  activityLabel?: string;
  message: string;
  args: string[];
};

export type FailedTestLogEntry = {
  testPath: string[];
  testResult: FailedTestLogsExportTestResult["testResult"];
  failedAssertions: string[];
  assertions: unknown;
  /** Undefined when no test activity of the run matches the test path. */
  runId?: string;
  error?: string;
  activities: RunExportActivity[];
  logs: FailedTestLogLine[];
};

export type FailedTestLogsExport = {
  suiteKey: string;
  runMode?: string;
  exportedAt: string;
  testCount: number;
  failedTestCount: number;
  failedTests: FailedTestLogEntry[];
};

const MAX_LOG_ARG_LENGTH = 20_000;

export function isFailedTestResult(result: FailedTestLogsExportTestResult): boolean {
  return result.testResult === "error" || (result.failedAssertions?.length ?? 0) > 0;
}

export function hasFailedTestResults(results: readonly FailedTestLogsExportTestResult[]): boolean {
  return results.some(isFailedTestResult);
}

/** Copies the activities started at or after `since`, and their events. */
export function snapshotTestRunLogs(params: {
  activities: Iterable<MiroirActivity>;
  events: Iterable<MiroirEvent>;
  since: number;
}): TestRunLogSnapshot {
  const activities = [...params.activities].filter((activity) => activity.startTime >= params.since);
  const activityIds = new Set(activities.map((activity) => activity.activityId));
  const events = [...params.events].filter((event) => activityIds.has(event.activity.activityId));
  return { activities, events };
}

export function suggestedFailedTestLogsFilename(suiteKey: string, exportedAt: string): string {
  const safeSuiteKey = suiteKey.replace(/[^A-Za-z0-9._-]+/g, "_");
  const safeTime = exportedAt.replace(/[:.]/g, "-");
  return `miroir-failed-tests-${safeSuiteKey}-${safeTime}.json`;
}

/** Test suite labels from the root down to the test activity, then the test name. */
function testActivityPath(
  activity: MiroirActivity,
  activityIndex: Map<string, MiroirActivity>,
): string[] {
  const path = [activity.actionLabel ?? ""];
  let parent = activity.parentId ? activityIndex.get(activity.parentId) : undefined;
  while (parent) {
    if (parent.activityType === "testSuite") {
      path.unshift(parent.actionLabel ?? "");
    }
    parent = parent.parentId ? activityIndex.get(parent.parentId) : undefined;
  }
  return path;
}

function commonSuffixLength(a: readonly string[], b: readonly string[]): number {
  let length = 0;
  while (
    length < a.length &&
    length < b.length &&
    a[a.length - 1 - length] === b[b.length - 1 - length]
  ) {
    length++;
  }
  return length;
}

/**
 * The test activity whose path shares the longest suffix with `testPath` (the report path starts
 * with the suite key, which is not always a test suite label). Ties go to the latest start.
 */
function findTestActivity(
  testPath: readonly string[],
  testActivities: readonly MiroirActivity[],
  activityIndex: Map<string, MiroirActivity>,
): MiroirActivity | undefined {
  let best: { activity: MiroirActivity; score: number } | undefined;
  for (const activity of testActivities) {
    const score = commonSuffixLength(testPath, testActivityPath(activity, activityIndex));
    if (score === 0) {
      continue;
    }
    if (!best || score > best.score || (score === best.score && activity.startTime >= best.activity.startTime)) {
      best = { activity, score };
    }
  }
  return best?.activity;
}

function descendantActivities(
  root: MiroirActivity,
  activityIndex: Map<string, MiroirActivity>,
): MiroirActivity[] {
  const result: MiroirActivity[] = [];
  const pending = [root];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const activity = pending.shift()!;
    if (seen.has(activity.activityId)) {
      continue;
    }
    seen.add(activity.activityId);
    result.push(activity);
    for (const childId of activity.children) {
      const child = activityIndex.get(childId);
      if (child) {
        pending.push(child);
      }
    }
  }
  return result;
}

export function formatLogArg(arg: unknown): string {
  let text: string;
  if (typeof arg === "string") {
    text = arg;
  } else if (arg instanceof Error) {
    text = arg.stack ?? `${arg.name}: ${arg.message}`;
  } else {
    const seen = new WeakSet<object>();
    try {
      text =
        JSON.stringify(arg, (_key, value) => {
          if (typeof value === "bigint") {
            return value.toString();
          }
          if (typeof value === "function") {
            return `[function ${value.name || "anonymous"}]`;
          }
          if (value instanceof Error) {
            return value.stack ?? `${value.name}: ${value.message}`;
          }
          if (value !== null && typeof value === "object") {
            if (seen.has(value)) {
              return "[circular]";
            }
            seen.add(value);
          }
          return value;
        }) ?? String(arg);
    } catch {
      text = String(arg);
    }
  }
  return text.length > MAX_LOG_ARG_LENGTH
    ? `${text.slice(0, MAX_LOG_ARG_LENGTH)}… [${text.length - MAX_LOG_ARG_LENGTH} more characters]`
    : text;
}

function toRunExportActivity(activity: MiroirActivity): RunExportActivity {
  return {
    activityId: activity.activityId,
    activityType: activity.activityType,
    actionType: activity.actionType,
    actionLabel: activity.actionLabel,
    status: activity.status,
    runId: activity.runId,
    spanId: activity.spanId,
    error: activity.error,
  };
}

export function buildFailedTestLogsExport(params: {
  suiteKey: string;
  runMode?: string;
  testResults: readonly FailedTestLogsExportTestResult[];
  runLogs?: TestRunLogSnapshot;
  exportedAt?: string;
}): FailedTestLogsExport {
  const activities = params.runLogs?.activities ?? [];
  const activityIndex = new Map(activities.map((activity) => [activity.activityId, activity]));
  const testActivities = activities.filter((activity) => activity.activityType === "test");
  const eventsByActivityId = new Map(
    (params.runLogs?.events ?? []).map((event) => [event.activity.activityId, event]),
  );

  const failedTests = params.testResults.filter(isFailedTestResult).map((result): FailedTestLogEntry => {
    const testActivity = findTestActivity(result.testPath, testActivities, activityIndex);
    const testTree = testActivity ? descendantActivities(testActivity, activityIndex) : [];
    const logs = testTree
      .flatMap((activity) =>
        (eventsByActivityId.get(activity.activityId)?.eventLogs ?? []).map(
          (log): FailedTestLogLine => ({
            timestamp: log.timestamp,
            time: new Date(log.timestamp).toISOString(),
            level: log.level,
            loggerName: log.loggerName,
            activityId: activity.activityId,
            activityType: activity.activityType,
            activityLabel: activity.actionLabel,
            message: log.message,
            args: (log.args ?? []).map(formatLogArg),
          }),
        ),
      )
      .sort((a, b) => a.timestamp - b.timestamp);
    return {
      testPath: result.testPath,
      testResult: result.testResult,
      failedAssertions: result.failedAssertions ?? [],
      assertions: result.fullAssertionsResults,
      runId: testActivity?.runId,
      error: testActivity?.error,
      activities: testTree.map(toRunExportActivity),
      logs,
    };
  });

  return {
    suiteKey: params.suiteKey,
    ...(params.runMode ? { runMode: params.runMode } : {}),
    exportedAt: params.exportedAt ?? new Date().toISOString(),
    testCount: params.testResults.length,
    failedTestCount: failedTests.length,
    failedTests,
  };
}
