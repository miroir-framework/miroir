// Test utility for ViewParamsUpdateQueue
// This file demonstrates how to use the queue and can be used for testing

import { ViewParamsUpdateQueue, ViewParamsUpdateQueueConfig } from './ViewParamsUpdateQueue.js';
import { defaultAdminViewParams, DomainControllerInterface } from 'miroir-core';

export class ViewParamsUpdateQueueTestUtils {
  
  /**
   * Creates a test instance of the queue with a shorter delay for testing
   */
  static createTestQueue(
    domainController: DomainControllerInterface,
    deploymentUuid: string,
    viewParamsInstanceUuid: string,
    delayMs: number = 5000 // 5 seconds for testing
  ): ViewParamsUpdateQueue {
    const config: ViewParamsUpdateQueueConfig = {
      delayMs,
      deploymentUuid,
      viewParamsInstanceUuid
    };
    
    return ViewParamsUpdateQueue.getInstance(config, domainController);
  }

  /**
   * Simulates user changing sidebar width multiple times quickly
   */
  static simulateRapidSidebarChanges(queue: ViewParamsUpdateQueue): void {
    // Simulate user dragging sidebar quickly
    queue.queueUpdate({ currentValue: defaultAdminViewParams, updates: {sidebarWidth: 250} });
    setTimeout(() => queue.queueUpdate({ currentValue: defaultAdminViewParams, updates: {sidebarWidth: 275 }}), 100);
    setTimeout(() => queue.queueUpdate({ currentValue: defaultAdminViewParams, updates: {sidebarWidth: 300 }}), 200);
    setTimeout(() => queue.queueUpdate({ currentValue: defaultAdminViewParams, updates: {sidebarWidth: 280 }}), 300);
    
    console.log('Simulated rapid sidebar width changes. Only the final value (280) should be saved after the delay.');
  }

  /**
   * Demonstrates immediate flush functionality
   */
  static async testImmediateFlush(queue: ViewParamsUpdateQueue): Promise<void> {
    queue.queueUpdate({ currentValue: defaultAdminViewParams, updates: {sidebarWidth: 350} });
    console.log('Queued sidebar width update, flushing immediately...');
    await queue.flushImmediately();
    console.log('Update flushed immediately.');
  }

  /**
   * Demonstrates immediate processing via queueUpdate parameter
   */
  static testImmediateProcessing(queue: ViewParamsUpdateQueue): void {
    console.log('Testing immediate processing with queueUpdate...');
    queue.queueUpdate(
      { currentValue: defaultAdminViewParams, updates: {gridType: 'glide-data-grid'} },
      true // Force immediate processing
    );
    console.log('Grid type update queued with immediate processing.');
  }

  /**
   * Shows queue status
   */
  static logQueueStatus(queue: ViewParamsUpdateQueue): void {
    console.log('Queue has pending updates:', queue.hasPendingUpdates());
    console.log('Pending updates:', queue.getPendingUpdates());
  }
}

// Usage example:
/*
// In your component:
const queue = ViewParamsUpdateQueueTestUtils.createTestQueue(
  domainController,
  'your-deployment-uuid',
  'your-viewparams-instance-uuid',
  5000 // 5 second delay for testing
);

// Test rapid changes (delayed processing)
ViewParamsUpdateQueueTestUtils.simulateRapidSidebarChanges(queue);

// Test immediate processing
ViewParamsUpdateQueueTestUtils.testImmediateProcessing(queue);

// Check status
ViewParamsUpdateQueueTestUtils.logQueueStatus(queue);

// Test immediate flush
await ViewParamsUpdateQueueTestUtils.testImmediateFlush(queue);
*/
