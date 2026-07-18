/**
 * Render insight registry — gated render-count tracking for UI performance mode.
 * When `enabled` is false, trackRender is a no-op (near-zero footprint).
 */

export interface RenderCounts {
  navigationCount: number;
  totalCount: number;
}

export const NOOP_RENDER_COUNTS: RenderCounts = Object.freeze({
  navigationCount: 0,
  totalCount: 0,
});

export interface TrackRenderArgs {
  componentId: string;
  navigationKey: string;
  enabled: boolean;
}

interface ComponentRenderData {
  totalRenderCount: number;
  navigationRenderCount: number;
  lastNavigationKey: string;
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

    const { componentId, navigationKey } = args;
    let data = this.componentData.get(componentId);

    if (!data) {
      data = {
        totalRenderCount: 0,
        navigationRenderCount: 0,
        lastNavigationKey: navigationKey,
      };
      this.componentData.set(componentId, data);
    }

    data.totalRenderCount++;

    if (navigationKey !== data.lastNavigationKey) {
      data.lastNavigationKey = navigationKey;
      data.navigationRenderCount = 1;
    } else {
      data.navigationRenderCount++;
    }

    return {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
  }

  size(): number {
    return this.componentData.size;
  }

  getCounts(componentId: string): RenderCounts | null {
    const data = this.componentData.get(componentId);
    if (!data) return null;
    return {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
  }

  getAllCounts(): Record<string, RenderCounts> {
    const result: Record<string, RenderCounts> = {};
    for (const [componentId, data] of this.componentData.entries()) {
      result[componentId] = {
        navigationCount: data.navigationRenderCount,
        totalCount: data.totalRenderCount,
      };
    }
    return result;
  }

  resetAll(): void {
    this.componentData.clear();
  }

  resetComponent(componentId: string): void {
    this.componentData.delete(componentId);
  }
}

/** Shared singleton used by hooks. */
export const renderInsightRegistry = new RenderInsightRegistry();
