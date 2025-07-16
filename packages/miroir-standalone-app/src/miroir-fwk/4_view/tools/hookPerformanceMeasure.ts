import {
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolution,
  getQueryRunnerParamsForDeploymentEntityState,
  jzodTypeCheck,
  measurePerformance,
  rootLessListKeyMap,
  unfoldJzodSchemaOnce,
} from "miroir-core";
import { useJzodElementEditorHooks } from "../components/JzodElementEditorHooks";

// Create measured versions of key functions used in this component
export const measuredJzodTypeCheck = measurePerformance("jzodTypeCheck", jzodTypeCheck, 5);
export const measuredRootLessListKeyMap = measurePerformance(
  "rootLessListKeyMap",
  rootLessListKeyMap,
  5
);
export const measuredGetApplicationSection = measurePerformance(
  "getApplicationSection",
  getApplicationSection,
  10
);
export const measuredGetQueryRunnerParamsForDeploymentEntityState = measurePerformance(
  "getQueryRunnerParamsForDeploymentEntityState",
  getQueryRunnerParamsForDeploymentEntityState,
  5
);

// Measure unfoldJzodSchemaOnce using our new higher-order function
export const measuredUnfoldJzodSchemaOnce = measurePerformance(
  'unfoldJzodSchemaOnce',
  unfoldJzodSchemaOnce,
  10
);

// Example of how to measure other core functions with performance tracking
export const measuredGetDefaultValueForJzodSchemaWithResolution = measurePerformance(
  'getDefaultValueForJzodSchemaWithResolution',
  getDefaultValueForJzodSchemaWithResolution,
  5
);

export const measuredUseJzodElementEditorHooks = measurePerformance(
  'useJzodElementEditorHooks',
  useJzodElementEditorHooks,
  500
);

