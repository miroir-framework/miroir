import {
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolution,
  getQueryRunnerParamsForReduxDeploymentsState,
  jzodTypeCheck,
  measurePerformance,
  rootLessListKeyMapDEFUNCT,
  unfoldJzodSchemaOnce,
} from "miroir-core";
import { useJzodElementEditorHooks } from "../components/ValueObjectEditor/JzodElementEditorHooks";

// Create measured versions of key functions used in this component
export const measuredJzodTypeCheck = measurePerformance("jzodTypeCheck", jzodTypeCheck, 100);
export const measuredRootLessListKeyMap = measurePerformance(
  "rootLessListKeyMapDEFUNCT",
  rootLessListKeyMapDEFUNCT,
  100
);
// export const measuredGetApplicationSection = measurePerformance(
//   "getApplicationSection",
//   getApplicationSection,
//   100
// );
export const measuredGetQueryRunnerParamsForReduxDeploymentsState = measurePerformance(
  "getQueryRunnerParamsForReduxDeploymentsState",
  getQueryRunnerParamsForReduxDeploymentsState,
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

