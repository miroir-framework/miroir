import type { MiroirActivity } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { MiroirEvent } from "../3_controllers/MiroirEventService";
import { formatRunLogPrefix, type RunLogDir } from "./LoggerContext";

export type RunExportActivity = {
  activityId: string;
  activityType: MiroirActivity["activityType"];
  actionType: string;
  actionLabel?: string;
  status: MiroirActivity["status"];
  runId?: string;
  spanId?: string;
  error?: string;
};

export type RunExportLog = {
  timestamp: number;
  level: string;
  loggerName: string;
  message: string;
};

export type RunExportEvent = {
  activityId: string;
  activityType: MiroirActivity["activityType"];
  status: MiroirActivity["status"];
  runId?: string;
  spanId?: string;
  logs: RunExportLog[];
};

export type RunExportBundle = {
  runId: string;
  timestamp: string;
  activities: RunExportActivity[];
  events: RunExportEvent[];
};

export function activitySpanDirection(status: MiroirActivity["status"]): RunLogDir {
  return status === "running" ? ">" : "<";
}

/** Same tokens as the CLI prefix: `#runId.spanDir#`. */
export function formatActivityRunToken(
  activity: Pick<MiroirActivity, "runId" | "spanId" | "status">,
): string {
  return formatRunLogPrefix(activity.runId, activity.spanId, activitySpanDirection(activity.status));
}

export function suggestedRunExportFilename(runId: string, failed = false): string {
  return failed ? `miroir-run-${runId}-error.json` : `miroir-run-${runId}.json`;
}

export function suggestedFailedRunExportFilename(runId: string): string {
  return suggestedRunExportFilename(runId, true);
}

export function uniqueRunIds(activities: Iterable<Pick<MiroirActivity, "runId">>): string[] {
  return [...new Set([...activities].map((activity) => activity.runId).filter((id): id is string => Boolean(id)))];
}

export function failedLeafActivityForRun(
  activities: Iterable<MiroirActivity>,
  runId: string,
): MiroirActivity | undefined {
  return [...activities].find(
    (activity) =>
      activity.activityType === "test" &&
      activity.runId === runId &&
      (activity.status === "error" || activity.testResult === "error"),
  );
}

export async function exportFailedRunIfNeeded(params: {
  runId: string | undefined;
  activities: Iterable<MiroirActivity>;
  events?: Iterable<MiroirEvent>;
  onFailedRunExport?: (bundle: RunExportBundle) => void | Promise<void>;
}): Promise<void> {
  if (!params.runId || !params.onFailedRunExport) {
    return;
  }
  if (!failedLeafActivityForRun(params.activities, params.runId)) {
    return;
  }
  await params.onFailedRunExport(
    buildRunExportBundle({
      runId: params.runId,
      activities: params.activities,
      events: params.events,
    }),
  );
}

export function collectActivitiesForRun(
  activities: Iterable<MiroirActivity>,
  runId: string,
): MiroirActivity[] {
  return [...activities].filter((activity) => activity.runId === runId);
}

export function buildRunExportBundle(params: {
  runId: string;
  activities: Iterable<MiroirActivity>;
  events?: Iterable<MiroirEvent>;
  timestamp?: string;
}): RunExportBundle {
  const activities = collectActivitiesForRun(params.activities, params.runId);
  const activityIds = new Set(activities.map((activity) => activity.activityId));
  const events = [...(params.events ?? [])]
    .filter(
      (event) =>
        event.activity.runId === params.runId || activityIds.has(event.activity.activityId),
    )
    .map((event) => ({
      activityId: event.activity.activityId,
      activityType: event.activity.activityType,
      status: event.activity.status,
      runId: event.activity.runId,
      spanId: event.activity.spanId,
      logs: event.eventLogs.map((log) => ({
        timestamp: log.timestamp,
        level: log.level,
        loggerName: log.loggerName,
        message: log.message,
      })),
    }));
  return {
    runId: params.runId,
    timestamp: params.timestamp ?? new Date().toISOString(),
    activities: activities.map((activity) => ({
      activityId: activity.activityId,
      activityType: activity.activityType,
      actionType: activity.actionType,
      actionLabel: activity.actionLabel,
      status: activity.status,
      runId: activity.runId,
      spanId: activity.spanId,
      error: activity.error,
    })),
    events,
  };
}
