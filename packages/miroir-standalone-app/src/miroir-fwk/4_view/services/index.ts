/**
 * Services Index - Exports all service-related functionality
 */

export { 
  fetchMiroirAndAppConfigurations, 
  useConfigurationService,
  type ConfigurationServiceOptions 
} from './ConfigurationService.js';

export { 
  usePageConfiguration,
  type UsePageConfigurationOptions,
  type UsePageConfigurationResult 
} from './usePageConfiguration.js';
