/**
 * Syncs the AppBar LocalCache monitor toggle with collection + UI registry.
 * When turning off, clears the session registry (no walks / no retained snapshot).
 */

import {
  isLocalCacheMonitorEnabled,
  updateLocalCacheMonitorConfig,
} from "./localCacheMonitorConfig.js";
import { localCacheMonitorRegistry } from "./localCacheMonitorRegistry.js";

/**
 * Apply the global LocalCache-monitor gate.
 * When turning off, clears the UI registry snapshot.
 */
export function applyLocalCacheMonitorGate(enabled: boolean): void {
  updateLocalCacheMonitorConfig({ enabled });
  if (!enabled) {
    localCacheMonitorRegistry.resetAll();
  }
}

export { isLocalCacheMonitorEnabled };
