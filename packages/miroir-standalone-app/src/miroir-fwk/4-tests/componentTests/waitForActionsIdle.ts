import type { MiroirActivityTrackerInterface, MiroirEventTrackingData } from "miroir-core";

// ################################################################################################
// Waits for the actions an interaction step started (#330, analysis T5).
//
// Every DomainController entry point runs inside `MiroirActivityTracker.trackAction`, which
// records an `action` activity that stays `running` until the action settles. After an
// interaction, the waiter waits until no action started since the case began is running, lets
// React render what they changed, and repeats while that rendering started new actions.
// ################################################################################################

/** Default of `actionTimeoutMs` (`reportTestSuite`). */
export const defaultReportTestActionTimeoutMs = 10000;

const pollIntervalMs = 10;

export interface ActionsIdleWaiterOptions {
  /** Actions started before this time (`Date.now()`) are ignored; default: the waiter's creation. */
  since?: number;
  /** How long one wait may last before it fails, naming the actions still running. */
  timeoutMs: number;
  /** Lets React render the effects of the settled actions (they may start new ones). */
  settle: () => Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeAction(activity: MiroirEventTrackingData): string {
  return activity.actionLabel === undefined
    ? activity.actionType
    : `${activity.actionType} "${activity.actionLabel}"`;
}

/**
 * A waiter for the actions started in `tracker` since `options.since`, to call after each
 * interaction of one case. It resolves at once when no action started since its last call.
 * Otherwise it waits until none is running, then calls `settle`, until a settle starts no new
 * action. It rejects after `timeoutMs`, naming the `actionType` and `actionLabel` of the actions
 * still running.
 */
export function createActionsIdleWaiter(
  tracker: MiroirActivityTrackerInterface,
  options: ActionsIdleWaiterOptions,
): () => Promise<void> {
  const since = options.since ?? Date.now();
  let settledActionCount = 0;
  const actionsSinceStart = () => tracker.getFilteredActivities({ trackingType: "action", since });

  return async () => {
    const deadline = Date.now() + options.timeoutMs;
    for (;;) {
      let actions = actionsSinceStart();
      if (actions.length === settledActionCount && actions.every((action) => action.status !== "running")) {
        return;
      }
      for (;;) {
        const running = actions.filter((action) => action.status === "running");
        if (running.length === 0) {
          break;
        }
        if (Date.now() >= deadline) {
          throw new Error(
            `actions still running after ${options.timeoutMs} ms: ${running.map(describeAction).join(", ")}`,
          );
        }
        await sleep(pollIntervalMs);
        actions = actionsSinceStart();
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `actions kept starting for ${options.timeoutMs} ms, the last ones: ${actions.slice(settledActionCount).map(describeAction).join(", ")}`,
        );
      }
      settledActionCount = actions.length;
      await options.settle();
    }
  };
}
