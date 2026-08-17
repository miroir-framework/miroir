
import {
  JzodElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
// NOTE: removed circular dependency import of transformer_extended_apply_wrapper
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getDefaultValueForJzodSchema");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// NOTE: The main functions have been moved to TransformersForRuntime.ts to avoid circular dependency
// This file now re-exports them for backward compatibility
// ################################################################################################

// Re-export the functions from TransformersForRuntime to maintain backward compatibility
export {
  defaultValueForMLSchemaTransformer,
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
} from "../../2_domain/TransformersForRuntime";

// Error value types for resolveConditionalSchema
export type ResolveConditionalSchemaError =
  | { error: 'NO_REDUX_DEPLOYMENTS_STATE' }
  | { error: 'NO_DEPLOYMENT_UUID' }
  | { error: 'INVALID_PARENT_UUID_CONFIG', details: string };

export type ResolveConditionalSchemaResult = JzodElement | ResolveConditionalSchemaError;

