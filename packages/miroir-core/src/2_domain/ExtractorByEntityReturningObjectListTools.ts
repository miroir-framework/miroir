import {
  type EntityInstance,
  type ExtractorByEntityReturningObjectList,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory.js";
import { cleanLevel } from "./constants.js";
import { packageName } from "../constants.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ExtractorByEntityReturningObjectListTools")
).then((logger: LoggerInterface) => { log = logger; });

// ################################################################################################
/**
 * A filter specification for filtering entity instances.
 * This is extracted from ExtractorByEntityReturningObjectList type.
 */
export type ExtractorFilter = {
  attributeName: string;
  not?: boolean | undefined;
  undefined?: boolean | undefined;
  value?: any | undefined;
};

// ################################################################################################
/**
 * An orderBy specification for sorting entity instances.
 * This is extracted from ExtractorByEntityReturningObjectList type.
 */
export type ExtractorOrderBy = {
  attributeName: string;
  direction?: ("ASC" | "DESC" | "asc" | "desc") | undefined;
};

// ################################################################################################
/**
 * Tests if a single entity instance matches the given filter.
 * 
 * @param instance - The entity instance to test
 * @param filter - The filter specification
 * @returns true if the instance matches the filter, false otherwise
 */
export const instanceMatchesFilter = (
  instance: EntityInstance,
  filter: ExtractorFilter
): boolean => {
  const attributeValue = (instance as any)[filter.attributeName];

  // Handle "undefined" check (filter for instances where attribute is undefined)
  if (filter.undefined) {
    const result = attributeValue === undefined;
    return filter.not ? !result : result;
  }

  // Handle string matching with regex (case-insensitive)
  if (typeof attributeValue === "string") {
    const matchResult = attributeValue.match(new RegExp(filter.value ?? "", "i")) != null;
    return filter.not ? !matchResult : matchResult;
  }

  // Handle number matching with equality
  if (typeof attributeValue === "number") {
    const matchResult = attributeValue == filter.value;
    return filter.not ? !matchResult : matchResult;
  }

  // For other types, return false (or !false if "not" is set)
  return filter.not ? true : false;
};

// ################################################################################################
/**
 * Applies a filter to an array of entity instances.
 * 
 * @param instances - Array of entity instances to filter
 * @param filter - The filter specification (optional)
 * @returns Filtered array of entity instances
 */
export const applyFilter = (
  instances: EntityInstance[],
  filter: ExtractorFilter | undefined
): EntityInstance[] => {
  if (!filter) {
    return instances;
  }

  log.debug("applyFilter applying filter", filter);

  const filteredInstances = instances.filter((instance: EntityInstance) => 
    instanceMatchesFilter(instance, filter)
  );

  log.debug("applyFilter filtered result count:", filteredInstances.length);
  return filteredInstances;
};

// ################################################################################################
/**
 * Applies ordering to an array of entity instances.
 * 
 * @param instances - Array of entity instances to sort
 * @param orderBy - The orderBy specification (optional)
 * @returns Sorted array of entity instances
 */
export const applyOrderBy = (
  instances: EntityInstance[],
  orderBy: ExtractorOrderBy | undefined
): EntityInstance[] => {
  if (!orderBy) {
    return instances;
  }

  const orderByAttribute = orderBy.attributeName;
  const orderDirection = (orderBy.direction ?? "asc").toLowerCase();
  const isAscending = orderDirection === "asc";

  return [...instances].sort((a: EntityInstance, b: EntityInstance) => {
    const aValue = (a as any)[orderByAttribute];
    const bValue = (b as any)[orderByAttribute];

    if (aValue < bValue) {
      return isAscending ? -1 : 1;
    } else if (aValue > bValue) {
      return isAscending ? 1 : -1;
    } else {
      return 0;
    }
  });
};

// ################################################################################################
/**
 * Applies both filter and orderBy from an ExtractorByEntityReturningObjectList to an array of instances.
 * This is the main entry point for use in extractors.
 * 
 * @param instances - Array of entity instances to filter and sort
 * @param extractor - The extractor specification containing filter and orderBy
 * @returns Filtered and sorted array of entity instances
 */
export const applyExtractorFilterAndOrderBy = (
  instances: EntityInstance[],
  extractor: Pick<ExtractorByEntityReturningObjectList, 'filter' | 'orderBy'>
): EntityInstance[] => {
  const filteredInstances = applyFilter(instances, extractor.filter);
  const orderedInstances = applyOrderBy(filteredInstances, extractor.orderBy);
  return orderedInstances;
};
