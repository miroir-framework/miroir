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

  /**
   * Track a render when enabled. When disabled, returns NOOP_RENDER_COUNTS
   * without touching the map.
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
    this.componentData.clear();
  }

  resetComponent(pathKey: string): void {
    this.componentData.delete(pathKey);
  }
}

/** Shared singleton used by hooks. */
export const renderInsightRegistry = new RenderInsightRegistry();
