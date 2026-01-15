import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "performanceMetrics"),
).then((logger: LoggerInterface) => {
  log = logger;
});

// Performance tracking for functions
export interface PerformanceMetrics {
  totalTime: number;
  callCount: number;
  lastDuration: number;
  maxDuration: number;
  minDuration: number;
}

export const performanceMetrics: Record<string, PerformanceMetrics> = {}

/**
 * Higher-order function that wraps any function with performance measurement
 * @param funcName The name to identify this function in the metrics
 * @param func The function to measure
 * @param logFrequency How often to log measurements (every N calls)
 * @returns A wrapped function with the same signature as the original
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  funcName: string, 
  func: T, 
  logFrequency: number = 10,
  listKey?: string,
  mlSchema?: any
): T {
  // Initialize metrics for this function if needed
  if (!performanceMetrics[funcName]) {
    performanceMetrics[funcName] = {
      totalTime: 0,
      callCount: 0,
      lastDuration: 0,
      maxDuration: 0,
      minDuration: Infinity
    };
  }
  
  // Create the wrapper function with the same signature
  const wrappedFunc = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const startTime = performance.now();
    const result = func.apply(this, args);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const metrics = performanceMetrics[funcName];
    metrics.totalTime += duration;
    metrics.callCount++;
    metrics.lastDuration = duration;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    
    if (metrics.callCount % logFrequency === 0) {
      log.info(
        `${funcName} performance - Call #${metrics.callCount},`,
        `List Key: ${listKey || "N/A"}`,
        `Duration: ${duration.toFixed(2)}ms,`,
        `Total: ${metrics.totalTime.toFixed(2)}ms,`,
        `Avg: ${(metrics.totalTime / metrics.callCount).toFixed(2)}ms,`,
        `Min: ${metrics.minDuration.toFixed(2)}ms,`,
        `Max: ${metrics.maxDuration.toFixed(2)}ms`,
        `Jzod Schema:`, mlSchema ?? "N/A",
      );
    }
    
    return result;
  };
  
  return wrappedFunc as T;
}
