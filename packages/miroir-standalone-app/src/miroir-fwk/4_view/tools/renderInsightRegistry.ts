/**
 * Render insight registry — gated render-count tracking for UI performance mode.
 * When `enabled` is false, trackRender is a no-op (near-zero footprint).
 *
 * Path identity: componentId + optional formikPath (siblings sharing a name
 * are distinguished by formik path, not reportSectionPath).
 *
 * Optional `durationMs` records timing when enabled (counts always update;
 * threshold applies at display time only).
 */

export interface RenderCounts {
  navigationCount: number;
  totalCount: number;
  /** Present when this track (or a prior one) recorded durationMs. */
  lastRenderTime?: number;
}

export const NOOP_RENDER_COUNTS: RenderCounts = Object.freeze({
  navigationCount: 0,
  totalCount: 0,
});

export interface TrackRenderArgs {
  componentId: string;
  navigationKey: string;
  enabled: boolean;
  /** Formik value path — preferred sibling identity for attribute-level nodes. */
  formikPath?: string;
  /** Optional render duration in ms (recorded only when enabled). */
  durationMs?: number;
}

export interface RenderInsightNode extends RenderCounts {
  pathKey: string;
  componentId: string;
  formikPath?: string;
  /** Depth from formik path segments (0 when no formikPath). */
  depth: number;
  lastRenderTime?: number;
  totalRenderTime?: number;
  minRenderTime?: number;
  maxRenderTime?: number;
  averageRenderTime?: number;
}

interface ComponentRenderData {
  componentId: string;
  formikPath?: string;
  depth: number;
  totalRenderCount: number;
  navigationRenderCount: number;
  lastNavigationKey: string;
  timingSampleCount: number;
  lastRenderTime: number;
  totalRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
}

/** Build stable map key: `Component` or `Component@formik.path`. */
export function buildPathKey(componentId: string, formikPath?: string): string {
  if (formikPath === undefined || formikPath === "") {
    return componentId;
  }
  return `${componentId}@${formikPath}`;
}

/** Depth = number of non-empty formik path segments; 0 when absent. */
export function formikPathDepth(formikPath?: string): number {
  if (formikPath === undefined || formikPath === "") {
    return 0;
  }
  return formikPath.split(".").filter((s) => s.length > 0).length;
}

export class RenderInsightRegistry {
  private componentData = new Map<string, ComponentRenderData>();
  private listeners = new Set<() => void>();
  private pendingTracks: TrackRenderArgs[] = [];
  private flushIdleId: number | null = null;
  private flushTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Subscribe to registry mutations (used by useSyncExternalStore). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Queue a track for idle/async flush (tests / non-UI batching).
   * Prefer {@link trackRender} from React render paths that display chips —
   * idle flush leaves counts at 0 until a later re-render, which progressive
   * reveal often never schedules.
   * No-op when `enabled` is false.
   */
  scheduleTrackRender(args: TrackRenderArgs): void {
    if (!args.enabled) {
      return;
    }
    this.pendingTracks.push(args);
    if (this.flushIdleId != null || this.flushTimeoutId != null) {
      return;
    }
    const flush = () => {
      this.flushIdleId = null;
      this.flushTimeoutId = null;
      const batch = this.pendingTracks;
      this.pendingTracks = [];
      if (batch.length === 0) {
        return;
      }
      for (const item of batch) {
        this.trackRender(item);
      }
      // Intentionally no notifySubscribers() here: components that both
      // schedule and subscribe would re-render → re-schedule → infinite loop.
      // RenderInsightSummary polls; inline chips refresh on the next natural render.
    };
    if (typeof requestIdleCallback !== "undefined") {
      this.flushIdleId = requestIdleCallback(flush, { timeout: 120 });
    } else {
      this.flushTimeoutId = setTimeout(flush, 0);
    }
  }

  /** Flush pending scheduled tracks synchronously (tests / teardown). */
  flushScheduledTracks(): void {
    if (this.flushIdleId != null && typeof cancelIdleCallback !== "undefined") {
      cancelIdleCallback(this.flushIdleId);
      this.flushIdleId = null;
    }
    if (this.flushTimeoutId != null) {
      clearTimeout(this.flushTimeoutId);
      this.flushTimeoutId = null;
    }
    if (this.pendingTracks.length === 0) {
      return;
    }
    const batch = this.pendingTracks;
    this.pendingTracks = [];
    for (const item of batch) {
      this.trackRender(item);
    }
  }

  /**
   * Track a render when enabled. When disabled, returns NOOP_RENDER_COUNTS
   * without touching the map.
   *
   * Call from React render paths that display insight chips so returned
   * counts match this render. Use {@link scheduleTrackRender} only when
   * display can lag (e.g. polled summary-only tooling).
   */
  trackRender(args: TrackRenderArgs): RenderCounts {
    if (!args.enabled) {
      return NOOP_RENDER_COUNTS;
    }

    const { componentId, navigationKey, formikPath, durationMs } = args;
    const pathKey = buildPathKey(componentId, formikPath);
    let data = this.componentData.get(pathKey);

    if (!data) {
      data = {
        componentId,
        formikPath: formikPath || undefined,
        depth: formikPathDepth(formikPath),
        totalRenderCount: 0,
        navigationRenderCount: 0,
        lastNavigationKey: navigationKey,
        timingSampleCount: 0,
        lastRenderTime: 0,
        totalRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
      };
      this.componentData.set(pathKey, data);
    }

    data.totalRenderCount++;

    if (navigationKey !== data.lastNavigationKey) {
      data.lastNavigationKey = navigationKey;
      data.navigationRenderCount = 1;
    } else {
      data.navigationRenderCount++;
    }

    if (typeof durationMs === "number" && Number.isFinite(durationMs)) {
      data.timingSampleCount++;
      data.lastRenderTime = durationMs;
      data.totalRenderTime += durationMs;
      data.minRenderTime = Math.min(data.minRenderTime, durationMs);
      data.maxRenderTime = Math.max(data.maxRenderTime, durationMs);
    }

    const counts: RenderCounts = {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
    if (data.timingSampleCount > 0) {
      counts.lastRenderTime = data.lastRenderTime;
    }
    return counts;
  }

  size(): number {
    return this.componentData.size;
  }

  getCounts(pathKey: string): RenderCounts | null {
    const data = this.componentData.get(pathKey);
    if (!data) return null;
    const counts: RenderCounts = {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
    if (data.timingSampleCount > 0) {
      counts.lastRenderTime = data.lastRenderTime;
    }
    return counts;
  }

  getAllCounts(): Record<string, RenderCounts> {
    const result: Record<string, RenderCounts> = {};
    for (const [pathKey, data] of this.componentData.entries()) {
      result[pathKey] = {
        navigationCount: data.navigationRenderCount,
        totalCount: data.totalRenderCount,
      };
    }
    return result;
  }

  /** Snapshot of all nodes with path metadata (for depth/aggregate UI). */
  getSnapshot(): RenderInsightNode[] {
    const nodes: RenderInsightNode[] = [];
    for (const [pathKey, data] of this.componentData.entries()) {
      const node: RenderInsightNode = {
        pathKey,
        componentId: data.componentId,
        formikPath: data.formikPath,
        depth: data.depth,
        navigationCount: data.navigationRenderCount,
        totalCount: data.totalRenderCount,
      };
      if (data.timingSampleCount > 0) {
        node.lastRenderTime = data.lastRenderTime;
        node.totalRenderTime = data.totalRenderTime;
        node.minRenderTime = data.minRenderTime;
        node.maxRenderTime = data.maxRenderTime;
        node.averageRenderTime = data.totalRenderTime / data.timingSampleCount;
      }
      nodes.push(node);
    }
    return nodes;
  }

  resetAll(): void {
    this.flushScheduledTracks();
    this.componentData.clear();
    this.notifySubscribers();
  }

  resetComponent(pathKey: string): void {
    this.componentData.delete(pathKey);
    this.notifySubscribers();
  }
}

/** Shared singleton used by hooks. */
export const renderInsightRegistry = new RenderInsightRegistry();
