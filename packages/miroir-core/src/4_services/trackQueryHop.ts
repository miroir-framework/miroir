import type { TrackActionOptions } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";

/**
 * Enter/exit a catalog query hop (`saga.localCache`, `REST.POST /query`, …).
 * No-op (just runs `actionFn`) when no activity tracker has been started.
 */
export async function trackQueryHop<T>(
  block: string,
  actionFn: () => Promise<T>,
  options?: TrackActionOptions<T>,
): Promise<T> {
  const tracker = MiroirLoggerFactory.getStartedActivityTracker();
  if (!tracker) {
    return actionFn();
  }
  return tracker.trackAction("queryHop", block, actionFn, options);
}

/** Compact INFO exit extra: top-level array / index sizes on a query result. */
export function summarizeQueryHopResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }
  const returned =
    "returnedDomainElement" in result
      ? (result as { returnedDomainElement?: unknown }).returnedDomainElement
      : result;
  if (!returned || typeof returned !== "object") {
    return undefined;
  }
  if (Array.isArray(returned)) {
    return `count=${returned.length}`;
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(returned)) {
    if (Array.isArray(value)) {
      parts.push(`${key}=${value.length}`);
    } else if (value && typeof value === "object") {
      parts.push(`${key}=${Object.keys(value as object).length}`);
    }
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}
