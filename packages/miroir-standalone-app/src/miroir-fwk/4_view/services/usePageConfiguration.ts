/**
 * Page Configuration Hook - Provides automatic configuration loading for pages
 * 
 * This hook integrates the ConfigurationService with the page lifecycle,
 * providing automatic configuration loading when pages are mounted or when
 * manually triggered by user actions.
 */

import { useCallback, useEffect, useRef } from 'react';
import { MiroirConfigClient } from 'miroir-core';
import {
  useDomainControllerService,
  useMiroirContextService,
  useSnackbar,
} from '../MiroirContextReactProvider.js';
import { fetchMiroirAndAppConfigurations } from './ConfigurationService.js';

export interface UsePageConfigurationOptions {
  /**
   * Whether to automatically fetch configurations when the page mounts
   * @default false
   */
  autoFetchOnMount?: boolean;
  
  /**
   * Custom success message to display when configurations are fetched
   * @default "Configurations loaded successfully"
   */
  successMessage?: string;
  
  /**
   * Custom action name for logging/tracking purposes
   * @default "fetch configurations"
   */
  actionName?: string;
}

export interface UsePageConfigurationResult {
  /**
   * Function to manually trigger configuration fetching
   */
  fetchConfigurations: () => Promise<void>;
  
  /**
   * Whether configuration fetching is currently in progress
   */
  isFetching: boolean;
}

/**
 * Hook for managing page-level configuration loading
 * 
 * This hook provides:
 * - Automatic configuration loading on mount (optional)
 * - Manual configuration fetching function
 * - Integration with the snackbar notification system
 * - Proper error handling and loading states
 * 
 * @param options Configuration options for the hook
 * @returns Object containing fetch function and loading state
 */
export function usePageConfiguration(
  options: UsePageConfigurationOptions = {}
): UsePageConfigurationResult {
  const {
    autoFetchOnMount = false,
    successMessage = "Configurations loaded successfully",
    actionName = "fetch configurations",
  } = options;

  const domainController = useDomainControllerService();
  const context = useMiroirContextService();
  const { handleAsyncAction } = useSnackbar();
  const hasFetchedRef = useRef(false);

  // Get the miroir configuration
  const miroirConfig = context.miroirContext.getMiroirConfig() as MiroirConfigClient;

  /**
   * Fetches configurations using the handleAsyncAction wrapper
   * This provides automatic error handling and snackbar notifications
   */
  const fetchConfigurations = useCallback(async (): Promise<void> => {
    return handleAsyncAction(
      async () => {
        await fetchMiroirAndAppConfigurations({
          domainController,
          miroirConfig,
        });
      },
      successMessage,
      actionName
    );
  }, [domainController, miroirConfig, successMessage, actionName, handleAsyncAction]);

  /**
   * Auto-fetch configurations on mount if enabled
   * Uses a ref to prevent multiple fetches in React's strict mode
   */
  useEffect(() => {
    if (autoFetchOnMount && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConfigurations().catch((error) => {
        console.error('Failed to auto-fetch configurations on mount:', error);
        // Reset the ref so it can be retried
        hasFetchedRef.current = false;
      });
    }
  }, [autoFetchOnMount, fetchConfigurations]);

  return {
    fetchConfigurations,
    // We don't currently track fetching state, but this provides a future extension point
    isFetching: false,
  };
}
