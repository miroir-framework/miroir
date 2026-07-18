/**
 * Session-scoped maxDepth for render-insight chrome / summary aggregation.
 * Default 2; live on-page control persists via sessionStorage (§3.1 / Phase 2.4).
 */

export const DEFAULT_RENDER_INSIGHT_MAX_DEPTH = 2;
export const RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY = "renderInsightMaxDepth";

function clampMaxDepth(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

export function getRenderInsightMaxDepth(): number {
  if (typeof sessionStorage === "undefined") {
    return DEFAULT_RENDER_INSIGHT_MAX_DEPTH;
  }
  try {
    const raw = sessionStorage.getItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_RENDER_INSIGHT_MAX_DEPTH;
    }
    return clampMaxDepth(Number(raw));
  } catch {
    return DEFAULT_RENDER_INSIGHT_MAX_DEPTH;
  }
}

/** Live on-page update — same setting drives inline headers and summary list. */
export function setRenderInsightMaxDepth(maxDepth: number): void {
  const next = clampMaxDepth(maxDepth);
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY, String(next));
  } catch {
    // ignore quota / private mode
  }
}
