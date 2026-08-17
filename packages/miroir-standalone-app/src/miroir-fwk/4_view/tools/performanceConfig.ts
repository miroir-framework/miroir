/**
 * Global performance monitoring configuration
 * These settings can be adjusted at startup or runtime
 */

import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "performanceConfig");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => { log = logger; });

export interface PerformanceConfig {
  enabled: boolean;
  renderThresholdMs: number;
  persistMetricsAcrossNavigation: boolean;
}

// Default configuration — tracking off until AppBar timer enables it
const defaultConfig: PerformanceConfig = {
  enabled: false,
  renderThresholdMs: 1.0, // Only track renders above this threshold (ms)
  persistMetricsAcrossNavigation: true, // Keep metrics across page changes
};

// Global performance configuration
let performanceConfig: PerformanceConfig = { ...defaultConfig };

/**
 * Initialize performance configuration from environment variables or localStorage
 * Call this at application startup
 */
export function initializePerformanceConfig(): void {
  // Check for environment variable override
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_PERFORMANCE_TRACKING === 'false') {
      performanceConfig.enabled = false;
    }
    if (process.env.VITE_PERFORMANCE_THRESHOLD_MS) {
      performanceConfig.renderThresholdMs = parseFloat(process.env.VITE_PERFORMANCE_THRESHOLD_MS);
    }
  }
  
  // Check for localStorage override (allows runtime configuration)
  if (typeof localStorage !== 'undefined') {
    const savedConfig = localStorage.getItem('miroir-performance-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        performanceConfig = { ...performanceConfig, ...parsed };
      } catch (e) {
        log.warn('Failed to parse saved performance config:', e);
      }
    }
  }

  // Align enabled with AppBar timer session flag (source of truth for collection gate)
  if (typeof sessionStorage !== 'undefined') {
    const savedDisplay = sessionStorage.getItem('showPerformanceDisplay');
    if (savedDisplay !== null) {
      try {
        performanceConfig.enabled = JSON.parse(savedDisplay) === true;
      } catch {
        // keep prior value
      }
    }
  }
  
  log.debug('Performance tracking initialized:', performanceConfig);
}

/**
 * Get current performance configuration
 */
export function getPerformanceConfig(): PerformanceConfig {
  return { ...performanceConfig };
}

/**
 * Update performance configuration and optionally persist to localStorage
 */
export function updatePerformanceConfig(updates: Partial<PerformanceConfig>, persist: boolean = true): void {
  performanceConfig = { ...performanceConfig, ...updates };
  
  if (persist && typeof localStorage !== 'undefined') {
    localStorage.setItem('miroir-performance-config', JSON.stringify(performanceConfig));
  }
  
  log.debug('Performance config updated:', performanceConfig);
}

/**
 * Reset performance configuration to defaults
 */
export function resetPerformanceConfig(): void {
  performanceConfig = { ...defaultConfig };
  
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('miroir-performance-config');
  }
  
  log.debug('Performance config reset to defaults:', performanceConfig);
}