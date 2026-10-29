/**
 * Module-level LocalCache monitor gate config (#211).
 * Separate from performanceConfig / showPerformanceDisplay (Phase 0 Q4).
 */

export interface LocalCacheMonitorConfig {
  enabled: boolean;
}

const defaultConfig: LocalCacheMonitorConfig = {
  enabled: false,
};

let localCacheMonitorConfig: LocalCacheMonitorConfig = { ...defaultConfig };

export const LOCAL_CACHE_MONITOR_SESSION_KEY = "showLocalCacheMonitor";

export function getLocalCacheMonitorConfig(): LocalCacheMonitorConfig {
  return { ...localCacheMonitorConfig };
}

export function isLocalCacheMonitorEnabled(): boolean {
  return localCacheMonitorConfig.enabled;
}

export function updateLocalCacheMonitorConfig(
  updates: Partial<LocalCacheMonitorConfig>
): void {
  localCacheMonitorConfig = { ...localCacheMonitorConfig, ...updates };
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(
      LOCAL_CACHE_MONITOR_SESSION_KEY,
      JSON.stringify(localCacheMonitorConfig.enabled)
    );
  }
}

export function resetLocalCacheMonitorConfig(): void {
  localCacheMonitorConfig = { ...defaultConfig };
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(LOCAL_CACHE_MONITOR_SESSION_KEY);
  }
}
