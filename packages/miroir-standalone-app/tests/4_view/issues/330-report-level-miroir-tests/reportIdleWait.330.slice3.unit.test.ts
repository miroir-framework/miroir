/**
 * Issue #330 Slice 3: after an interaction step, a Report test waits for the actions it started
 * (analysis T5), over a real `MiroirActivityTracker`.
 *
 * Not reachable through a MiroirTest: the timeout needs an action that never settles.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- reportIdleWait.330.slice3
 * ```
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MiroirActivityTracker } from "miroir-core";

import { createActionsIdleWaiter } from "../../../../src/miroir-fwk/4-tests/componentTests/waitForActionsIdle.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** An action tracked in `tracker` that settles when `finish` is called. */
function startAction(tracker: MiroirActivityTracker, actionType: string, actionLabel: string) {
  let finish!: () => void;
  const settled = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const tracked = tracker.trackAction(actionType, actionLabel, () => settled);
  return {
    finish: async () => {
      finish();
      await tracked;
    },
  };
}

/** Calls `wait`, recording whether it has resolved. */
function observe(wait: () => Promise<void>) {
  const state = { resolved: false };
  const promise = wait().then(() => {
    state.resolved = true;
  });
  return { state, promise };
}

describe("waiting for the actions of an interaction (#330 T5)", () => {
  let tracker: MiroirActivityTracker;
  let settleCount: number;
  const settle = async () => {
    settleCount++;
  };

  beforeEach(() => {
    tracker = new MiroirActivityTracker();
    settleCount = 0;
  });

  afterEach(() => {
    tracker.destroy();
  });

  it("resolves at once when the interaction started no action", async () => {
    const wait = createActionsIdleWaiter(tracker, { timeoutMs: 1000, settle });
    await wait();
    expect(settleCount).toBe(0);
  });

  it("resolves once the action settles, after letting React render its effects", async () => {
    const wait = createActionsIdleWaiter(tracker, { timeoutMs: 1000, settle });
    const save = startAction(tracker, "updateInstance", "save");
    const observed = observe(wait);
    await sleep(50);
    expect(observed.state.resolved).toBe(false);

    await save.finish();
    await observed.promise;
    expect(settleCount).toBe(1);
  });

  it("keeps waiting for an action started while the first one runs", async () => {
    const wait = createActionsIdleWaiter(tracker, { timeoutMs: 1000, settle });
    const first = startAction(tracker, "updateInstance", "save");
    const observed = observe(wait);
    const second = startAction(tracker, "commit", "commit the save");
    await first.finish();
    await sleep(50);
    expect(observed.state.resolved).toBe(false);

    await second.finish();
    await observed.promise;
  });

  it("waits for an action started while React renders the effects of the first one", async () => {
    let refresh: ReturnType<typeof startAction> | undefined;
    const wait = createActionsIdleWaiter(tracker, {
      timeoutMs: 1000,
      settle: async () => {
        settleCount++;
        if (settleCount === 1) {
          refresh = startAction(tracker, "runBoxedQueryAction", "refresh the Report");
          setTimeout(() => void refresh?.finish(), 50);
        }
      },
    });
    const save = startAction(tracker, "updateInstance", "save");
    const observed = observe(wait);
    await save.finish();
    await observed.promise;
    expect(settleCount).toBe(2);
    expect(tracker.getFilteredActivities({ trackingType: "action", status: "running" })).toEqual([]);
  });

  it("ignores the actions started before the case", async () => {
    startAction(tracker, "rollback", "refresh the local cache");
    await sleep(5);
    const wait = createActionsIdleWaiter(tracker, { timeoutMs: 100, settle });
    await wait();
    expect(settleCount).toBe(0);
  });

  it("fails after the timeout, naming the actions still running", async () => {
    const wait = createActionsIdleWaiter(tracker, { timeoutMs: 100, settle });
    startAction(tracker, "updateInstance", "save");
    await expect(wait()).rejects.toThrow('actions still running after 100 ms: updateInstance "save"');
  });
});
