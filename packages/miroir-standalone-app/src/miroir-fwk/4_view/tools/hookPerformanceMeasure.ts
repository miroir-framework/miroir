import {
  getApplicationSection,
  getDefaultValueForMlSchemaWithResolution,
  getQueryRunnerParamsForReduxDeploymentsState,
  mlsTypeCheck,
  measurePerformance,
  // rootLessListKeyMapDEFUNCT,
  unfoldMlSchemaOnce,
} from "miroir-core";
import { useJzodElementEditorHooks } from "../components/ValueObjectEditor/JzodElementEditorHooks";

// Create measured versions of key functions used in this component
export const measuredJzodTypeCheck = measurePerformance("mlsTypeCheck", mlsTypeCheck, 100);
// export const measuredRootLessListKeyMap = measurePerformance(
//   "rootLessListKeyMapDEFUNCT",
//   rootLessListKeyMapDEFUNCT,
//   100
// );
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

// Measure unfoldMlSchemaOnce using our new higher-order function
export const measuredUnfoldJzodSchemaOnce = measurePerformance(
  'unfoldMlSchemaOnce',
  unfoldMlSchemaOnce,
  100
);

// Example of how to measure other core functions with performance tracking
export const measuredGetDefaultValueForJzodSchemaWithResolution = measurePerformance(
  'getDefaultValueForMlSchemaWithResolution',
  getDefaultValueForMlSchemaWithResolution,
  100
);

export const measuredUseJzodElementEditorHooks = measurePerformance(
  'useJzodElementEditorHooks',
  useJzodElementEditorHooks,
  500
);

