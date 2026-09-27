// Issue #322: getAllEvents() must not re-sort the whole event list on every tracked test / log line.
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MiroirActivity } from "../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService, type MiroirEvent } from "../../src/3_controllers/MiroirEventService";
import { exportFailedRunIfNeeded } from "../../src/4_services/runLogExport";

function activity(activityId: string, startTime: number): MiroirActivity {
  return {
    activityId,
    activityType: "action",
    actionType: "runBoxedQueryAction",
    startTime,
    status: "completed",
    depth: 0,
    children: [],
  } as MiroirActivity;
}

const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("MiroirEventService.getAllEvents (#322)", () => {
  let tracker: MiroirActivityTracker | undefined;
  let service: MiroirEventService | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    service?.destroy();
    tracker?.destroy();
    service = undefined;
    tracker = undefined;
  });

  function newService(): MiroirEventService {
    tracker = new MiroirActivityTracker();
    service = new MiroirEventService(tracker);
    return service;
  }

  it("returns events newest first, and reflects added and cleared events", () => {
    const s = newService();
    s.pushEventFromActivity(activity("a1", 10));
    s.pushEventFromActivity(activity("a2", 30));
    expect(s.getAllEvents().map((e) => e.activity.activityId)).toEqual(["a2", "a1"]);

    s.pushEventFromActivity(activity("a3", 20));
    expect(s.getAllEvents().map((e) => e.activity.activityId)).toEqual(["a2", "a3", "a1"]);

    s.clear();
    expect(s.getAllEvents()).toEqual([]);
  });

  it("returns a fresh array each call, so a caller cannot corrupt the service's list", () => {
    const s = newService();
    s.pushEventFromActivity(activity("a1", 10));
    s.pushEventFromActivity(activity("a2", 30));
    const first = s.getAllEvents();
    first.pop();
    const second = s.getAllEvents();
    expect(second).not.toBe(first);
    expect(second.map((e) => e.activity.activityId)).toEqual(["a2", "a1"]);
  });

  it("does not re-sort when only logs or statuses changed since the last call", async () => {
    const s = newService();
    s.pushEventFromActivity(activity("a1", 10));
    await tracker!.trackAction("runBoxedQueryAction", "hop", async () => {
      s.getAllEvents();
      const sortSpy = vi.spyOn(Array.prototype, "sort");
      for (let i = 0; i < 20; i++) {
        s.pushLogToEvent("info", "DomainController", `line ${i}`);
      }
      s.pushEventFromActivity({ ...activity("a1", 10), status: "error" });
      await flushTimers();
      const events = s.getAllEvents();
      expect(sortSpy).not.toHaveBeenCalled();
      expect(events.find((e) => e.activity.activityId === "a1")?.activity.status).toBe("error");
    });
  });

  it("coalesces subscriber notifications for a burst of log lines", async () => {
    const s = newService();
    const received: MiroirEvent[][] = [];
    s.subscribe((events) => received.push(events));
    expect(received).toHaveLength(1); // immediate call on subscribe

    await tracker!.trackAction("runBoxedQueryAction", "hop", async () => {
      for (let i = 0; i < 50; i++) {
        s.pushLogToEvent("info", "DomainController", `line ${i}`);
      }
      await flushTimers();
    });
    await flushTimers();

    // one notification for the burst inside the action, at most one more for the action's end
    expect(received.length).toBeLessThanOrEqual(3);
    const last = received[received.length - 1];
    expect(last).toHaveLength(1);
    expect(last[0].eventLogs).toHaveLength(50);
    expect(last).not.toBe(received[0]);
  });
});

describe("exportFailedRunIfNeeded event collection (#322)", () => {
  it("does not collect events when the run has no failed test leaf", async () => {
    const collectEvents = vi.fn(() => [] as MiroirEvent[]);
    await exportFailedRunIfNeeded({
      runId: "K7X2NQ",
      activities: [
        { ...activity("t1", 1), activityType: "test", runId: "K7X2NQ", testResult: "ok" } as MiroirActivity,
      ],
      events: collectEvents,
      onFailedRunExport: () => undefined,
    });
    expect(collectEvents).not.toHaveBeenCalled();
  });

  it("collects events once when a failed run is exported", async () => {
    const collectEvents = vi.fn(() => [] as MiroirEvent[]);
    const exported: string[] = [];
    await exportFailedRunIfNeeded({
      runId: "K7X2NQ",
      activities: [
        {
          ...activity("t1", 1),
          activityType: "test",
          runId: "K7X2NQ",
          status: "error",
          testResult: "error",
        } as MiroirActivity,
      ],
      events: collectEvents,
      onFailedRunExport: (bundle) => {
        exported.push(bundle.runId);
      },
    });
    expect(collectEvents).toHaveBeenCalledTimes(1);
    expect(exported).toEqual(["K7X2NQ"]);
  });
});
