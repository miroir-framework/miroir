import {
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolution,
  getQueryRunnerParamsForDeploymentEntityState,
  jzodTypeCheck,
  measurePerformance,
  rootLessListKeyMap,
  unfoldJzodSchemaOnce,
} from "miroir-core";
import { useJzodElementEditorHooks } from "../components/ValueObjectEditor/JzodElementEditorHooks";

// Create measured versions of key functions used in this component
export const measuredJzodTypeCheck = measurePerformance("jzodTypeCheck", jzodTypeCheck, 100);
export const measuredRootLessListKeyMap = measurePerformance(
  "rootLessListKeyMap",
  rootLessListKeyMap,
  100
);
export const measuredGetApplicationSection = measurePerformance(
  "getApplicationSection",
  getApplicationSection,
  100
);
export const measuredGetQueryRunnerParamsForDeploymentEntityState = measurePerformance(
  "getQueryRunnerParamsForDeploymentEntityState",
  getQueryRunnerParamsForDeploymentEntityState,
  100
);

// Measure unfoldJzodSchemaOnce using our new higher-order function
export const measuredUnfoldJzodSchemaOnce = measurePerformance(
  'unfoldJzodSchemaOnce',
  unfoldJzodSchemaOnce,
  100
);

// Example of how to measure other core functions with performance tracking
export const measuredGetDefaultValueForJzodSchemaWithResolution = measurePerformance(
  'getDefaultValueForJzodSchemaWithResolution',
  getDefaultValueForJzodSchemaWithResolution,
  100
);

export const measuredUseJzodElementEditorHooks = measurePerformance(
  'useJzodElementEditorHooks',
  useJzodElementEditorHooks,
  500
);

