/**
 * Global performance monitoring configuration
 * These settings can be adjusted at startup or runtime
 */

export interface PerformanceConfig {
  enabled: boolean;
  renderThresholdMs: number;
  persistMetricsAcrossNavigation: boolean;
}

// Default configuration
const defaultConfig: PerformanceConfig = {
  enabled: true, // Available in both development and production
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
        console.warn('Failed to parse saved performance config:', e);
      }
    }
  }
  
  console.info('Performance tracking initialized:', performanceConfig);
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
  
  console.info('Performance config updated:', performanceConfig);
}

/**
 * Reset performance configuration to defaults
 */
export function resetPerformanceConfig(): void {
  performanceConfig = { ...defaultConfig };
  
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('miroir-performance-config');
  }
  
  console.info('Performance config reset to defaults:', performanceConfig);
}