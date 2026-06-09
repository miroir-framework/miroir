import { extractDoubleBracePatterns } from "../1_core/mustache";
import {
  entityHasCompositePrimaryKey,
  entityHasUuidPrimaryKey,
  getEntityPrimaryKeyAttribute,
  getEntityPrimaryKeyAttributes,
  getForeignKeyValue,
  getInstancePrimaryKeyValue,
  instanceMatchesForeignKey,
  parseCompositeKeyValue,
  resolveInstanceParentUuid,
  serializeCompositeKeyValue,
} from "../1_core/EntityPrimaryKey";
import {
  JzodSchemaReferencesList,
  JzodSchemaReferencesSet,
  jzodTransitiveDependencySet,
} from "../1_core/jzod/JzodSchemaReferences";
import { jzodToCopilotKitParameter } from "../1_core/jzod/JzodToCopilotKitParameter";
import { mergePositionBased } from "../1_core/jzod/JzodToJzod_CarryOn";
import { jzodToJzod_Summary } from "../1_core/jzod/JzodToJzod_Summary";
import { jzodToJsonSchema } from "../1_core/jzod/JzodToJsonSchema";
import { alterObjectAtPath } from "../tools";

export type FunctionCallRef = {
  module: string;
  export: string;
};

export type WhitelistedFunction = (...args: unknown[]) => unknown;

/**
 * Whitelist of module/export pairs allowed for UI and in-memory functionCallTest execution.
 * Only registered exports can be invoked — arbitrary module paths are rejected.
 */
const FUNCTION_CALL_REGISTRY: Record<string, Record<string, WhitelistedFunction>> = {
  "miroir-core/1_core/mustache": {
    extractDoubleBracePatterns: extractDoubleBracePatterns as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/JzodToJsonSchema": {
    jzodToJsonSchema: jzodToJsonSchema as WhitelistedFunction,
  },
  "miroir-core/tools": {
    alterObjectAtPath: alterObjectAtPath as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/JzodToCopilotKitParameter": {
    jzodToCopilotKitParameter: jzodToCopilotKitParameter as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/JzodToJzod_CarryOn": {
    mergePositionBased: mergePositionBased as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/JzodSchemaReferences": {
    JzodSchemaReferencesList: JzodSchemaReferencesList as WhitelistedFunction,
    JzodSchemaReferencesSet: JzodSchemaReferencesSet as WhitelistedFunction,
    jzodTransitiveDependencySet: jzodTransitiveDependencySet as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/JzodToJzod_Summary": {
    jzodToJzod_Summary: jzodToJzod_Summary as WhitelistedFunction,
  },
  "miroir-core/1_core/EntityPrimaryKey": {
    resolveInstanceParentUuid: resolveInstanceParentUuid as WhitelistedFunction,
    getEntityPrimaryKeyAttribute: getEntityPrimaryKeyAttribute as WhitelistedFunction,
    getEntityPrimaryKeyAttributes: getEntityPrimaryKeyAttributes as WhitelistedFunction,
    entityHasCompositePrimaryKey: entityHasCompositePrimaryKey as WhitelistedFunction,
    entityHasUuidPrimaryKey: entityHasUuidPrimaryKey as WhitelistedFunction,
    serializeCompositeKeyValue: serializeCompositeKeyValue as WhitelistedFunction,
    parseCompositeKeyValue: parseCompositeKeyValue as WhitelistedFunction,
    getInstancePrimaryKeyValue: getInstancePrimaryKeyValue as WhitelistedFunction,
    getForeignKeyValue: getForeignKeyValue as WhitelistedFunction,
    instanceMatchesForeignKey: instanceMatchesForeignKey as WhitelistedFunction,
  },
};

export function resolveFunctionCallTarget(ref: FunctionCallRef): WhitelistedFunction {
  const moduleExports = FUNCTION_CALL_REGISTRY[ref.module];
  if (!moduleExports) {
    throw new Error(`functionRef module not whitelisted: ${ref.module}`);
  }
  const fn = moduleExports[ref.export];
  if (!fn) {
    throw new Error(`functionRef export not whitelisted: ${ref.module}/${ref.export}`);
  }
  return fn;
}

export function listWhitelistedFunctionRefs(): FunctionCallRef[] {
  return Object.entries(FUNCTION_CALL_REGISTRY).flatMap(([module, exports]) =>
    Object.keys(exports).map((exportName) => ({ module, export: exportName })),
  );
}
