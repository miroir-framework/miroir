import {
  getApplicationSection,
  getDefaultValueForMlSchemaWithResolution,
  getQueryRunnerParamsForReduxDeploymentsState,
  mlsTypeCheck,
  measurePerformance,
  // rootLessListKeyMapDEFUNCT,
  unfoldMlSchemaOnce,
} from "miroir-core";
import { useMlElementEditorHooks } from "../components/ValueObjectEditor/MlElementEditorHooks";

// Create measured versions of key functions used in this component
export const measuredMlsTypeCheck = measurePerformance("mlsTypeCheck", mlsTypeCheck, 100);
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
export const measuredUnfoldMlSchemaOnce = measurePerformance(
  'unfoldMlSchemaOnce',
  unfoldMlSchemaOnce,
  100
);

// Example of how to measure other core functions with performance tracking
export const measuredGetDefaultValueForMlSchemaWithResolution = measurePerformance(
  'getDefaultValueForMlSchemaWithResolution',
  getDefaultValueForMlSchemaWithResolution,
  100
);

export const measuredUseMlElementEditorHooks = measurePerformance(
  'useMlElementEditorHooks',
  useMlElementEditorHooks,
  500
);

