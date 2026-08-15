import { afterEach, describe, expect, it } from "vitest";
import type { MiroirActivity } from "../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { MiroirEvent } from "../../src/3_controllers/MiroirEventService";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import {
  activitySpanDirection,
  buildRunExportBundle,
  exportFailedRunIfNeeded,
  formatActivityRunToken,
  suggestedFailedRunExportFilename,
  uniqueRunIds,
} from "../../src/4_services/runLogExport";

function activity(partial: Partial<MiroirActivity> & Pick<MiroirActivity, "activityId">): MiroirActivity {
  return {
    activityType: "action",
    actionType: "runBoxedQueryAction",
    startTime: 1,
    status: "completed",
    depth: 0,
    children: [],
    ...partial,
  } as MiroirActivity;
}

describe("activity run tokens for the UI timeline", () => {
  it("uses > while running and < when finished — same prefix shape as CLI", () => {
    expect(activitySpanDirection("running")).toBe(">");
    expect(activitySpanDirection("completed")).toBe("<");
    expect(activitySpanDirection("error")).toBe("<");
    expect(
      formatActivityRunToken({ runId: "K7X2NQ", spanId: "s12", status: "running" }),
    ).toBe("#K7X2NQ.s12>#");
    expect(
      formatActivityRunToken({ runId: "K7X2NQ", spanId: "s12", status: "completed" }),
    ).toBe("#K7X2NQ.s12<#");
    expect(
      formatActivityRunToken({ runId: "K7X2NQ", spanId: "s12", status: "error" }),
    ).toBe("#K7X2NQ.s12<#");
  });
});

describe("failed-leaf run export bundle", () => {
  it("suggestedFailedRunExportFilename is greppable by runId", () => {
    expect(suggestedFailedRunExportFilename("K7X2NQ")).toBe("miroir-run-K7X2NQ-error.json");
  });

  it("buildRunExportBundle keeps only that run's activities and attached logs", () => {
    const inRun = activity({
      activityId: "a1",
      runId: "K7X2NQ",
      spanId: "s1",
      actionLabel: "DC.handleBoxedQuery",
      status: "error",
      error: "boom",
    });
    const otherRun = activity({
      activityId: "a2",
      runId: "ZZZZZZ",
      spanId: "s1",
    });
    const event: MiroirEvent = {
      activity: inRun,
      eventLogs: [
        {
          logId: "l1",
          timestamp: 10,
          level: "info",
          loggerName: "3_miroir-core_DomainController",
          message: "→ DC.handleBoxedQuery",
          args: [],
          event: { activity: inRun, eventLogs: [], logCounts: { trace: 0, debug: 0, info: 1, warn: 0, error: 0, total: 1 } },
        } as any,
      ],
      logCounts: { trace: 0, debug: 0, info: 1, warn: 0, error: 0, total: 1 },
    };
    const otherEvent: MiroirEvent = {
      activity: otherRun,
      eventLogs: [],
      logCounts: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, total: 0 },
    };

    const bundle = buildRunExportBundle({
      runId: "K7X2NQ",
      activities: [inRun, otherRun],
      events: [event, otherEvent],
      timestamp: "2026-08-15T00:00:00.000Z",
    });

    expect(bundle.runId).toBe("K7X2NQ");
    expect(bundle.timestamp).toBe("2026-08-15T00:00:00.000Z");
    expect(bundle.activities).toHaveLength(1);
    expect(bundle.activities[0]).toMatchObject({
      activityId: "a1",
      spanId: "s1",
      status: "error",
      error: "boom",
    });
    expect(bundle.events).toHaveLength(1);
    expect(bundle.events[0].logs).toEqual([
      {
        timestamp: 10,
        level: "info",
        loggerName: "3_miroir-core_DomainController",
        message: "→ DC.handleBoxedQuery",
      },
    ]);
  });

  it("uniqueRunIds lists each run once", () => {
    expect(
      uniqueRunIds([
        activity({ activityId: "a1", runId: "K7X2NQ" }),
        activity({ activityId: "a2", runId: "K7X2NQ" }),
        activity({ activityId: "a3", runId: "ABCDEF" }),
        activity({ activityId: "a4" }),
      ]),
    ).toEqual(["K7X2NQ", "ABCDEF"]);
  });

  it("exportFailedRunIfNeeded writes only when the test leaf failed", async () => {
    const failed = activity({
      activityId: "t1",
      activityType: "test",
      actionType: "test",
      test: "Refresh all Instances",
      runId: "K7X2NQ",
      status: "error",
      testResult: "error",
    });
    const ok = activity({
      activityId: "t2",
      activityType: "test",
      actionType: "test",
      test: "ok leaf",
      runId: "ABCDEF",
      status: "completed",
      testResult: "ok",
    });
    const exported: string[] = [];
    await exportFailedRunIfNeeded({
      runId: "K7X2NQ",
      activities: [failed, ok],
      onFailedRunExport: (bundle) => {
        exported.push(bundle.runId);
      },
    });
    await exportFailedRunIfNeeded({
      runId: "ABCDEF",
      activities: [failed, ok],
      onFailedRunExport: (bundle) => {
        exported.push(bundle.runId);
      },
    });
    expect(exported).toEqual(["K7X2NQ"]);
  });
});

describe("MiroirEventService.exportRun", () => {
  let service: MiroirEventService | undefined;

  afterEach(() => {
    service?.destroy();
    service = undefined;
  });

  it("includes the failed leaf activities and attached logs for that runId", async () => {
    const tracker = new MiroirActivityTracker();
    service = new MiroirEventService(tracker);
    try {
      await tracker.trackTest("Refresh all Instances", undefined, async () => {
        await tracker.trackAction("runBoxedQueryAction", "DC.handleBoxedQuery", async () => {
          service!.pushLogToEvent("info", "DomainController", "inside hop", []);
        });
        throw new Error("assertion failed");
      });
    } catch {
      // expected
    }
    const leaf = [...tracker.getActivityIndex().values()].find(
      (item) => item.activityType === "test",
    );
    expect(leaf?.runId).toBeDefined();
    const parsed = JSON.parse(service.exportRun(leaf!.runId!));
    expect(parsed.runId).toBe(leaf!.runId);
    expect(parsed.activities.some((item: { activityType: string }) => item.activityType === "test")).toBe(
      true,
    );
    expect(
      parsed.events.some((event: { logs: { message: string }[] }) =>
        event.logs.some((log) => log.message === "inside hop"),
      ),
    ).toBe(true);
  });
});
