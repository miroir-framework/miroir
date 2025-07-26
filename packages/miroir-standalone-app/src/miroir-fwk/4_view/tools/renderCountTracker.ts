/**
 * Centralized render count tracker for React components
 * Tracks both total renders and renders since last navigation change
 */

export interface RenderCounts {
  navigationCount: number;
  totalCount: number;
}

interface ComponentRenderData {
  totalRenderCount: number;
  navigationRenderCount: number;
  lastNavigationKey: string;
}

class RenderCountTracker {
  private componentData = new Map<string, ComponentRenderData>();

  /**
   * Track render for a component with navigation-based reset
   * @param componentName - Unique name for the component
   * @param navigationKey - Key that represents current navigation state
   * @returns Current render counts
   */
  trackRender(componentName: string, navigationKey: string): RenderCounts {
    let data = this.componentData.get(componentName);
    
    if (!data) {
      data = {
        totalRenderCount: 0,
        navigationRenderCount: 0,
        lastNavigationKey: navigationKey,
      };
      this.componentData.set(componentName, data);
    }

    // Increment total count
    data.totalRenderCount++;

    // Check if navigation changed
    if (navigationKey !== data.lastNavigationKey) {
      data.lastNavigationKey = navigationKey;
      data.navigationRenderCount = 1; // Reset to 1 for current render
    } else {
      data.navigationRenderCount++;
    }

    return {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
  }

  /**
   * Get current render counts for a component without incrementing
   */
  getCounts(componentName: string): RenderCounts | null {
    const data = this.componentData.get(componentName);
    if (!data) return null;
    
    return {
      navigationCount: data.navigationRenderCount,
      totalCount: data.totalRenderCount,
    };
  }

  /**
   * Reset all render counts (useful for testing or debugging)
   */
  resetAll(): void {
    this.componentData.clear();
  }

  /**
   * Reset render counts for a specific component
   */
  resetComponent(componentName: string): void {
    this.componentData.delete(componentName);
  }

  /**
   * Get all component render data (for debugging)
   */
  getAllCounts(): Record<string, RenderCounts> {
    const result: Record<string, RenderCounts> = {};
    
    for (const [componentName, data] of this.componentData.entries()) {
      result[componentName] = {
        navigationCount: data.navigationRenderCount,
        totalCount: data.totalRenderCount,
      };
    }
    
    return result;
  }
}

// Singleton instance
export const renderCountTracker = new RenderCountTracker();

/**
 * React hook for tracking component renders
 * @param componentName - Unique name for the component
 * @param navigationKey - Key that represents current navigation state
 * @returns Current render counts
 */
export const useRenderTracker = (componentName: string, navigationKey: string): RenderCounts => {
  return renderCountTracker.trackRender(componentName, navigationKey);
};
