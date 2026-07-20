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
import { jzodObjectFlatten } from "../1_core/jzod/jzodObjectFlatten";
import {
  buildAnyObjectEntry,
  buildAnySubnodeKeyMap,
  jzodUnionResolvedTypeForArray,
  jzodUnionResolvedTypeForObject,
  selectUnionBranchFromDiscriminator,
  unionArrayChoices,
  unionObjectChoices,
} from "../1_core/jzod/jzodTypeCheck";
import { jzodUnion_recursivelyUnfold } from "../1_core/jzod/jzodUnion_RecursivelyUnfold";
import { localizeJzodSchemaReferenceContext } from "../1_core/jzod/JzodUnfoldSchemaOnce";
import { resolveQueryTemplateWithExtractorCombinerTransformer } from "../2_domain/Templates";
import { mergeIfUnique, pushIfUnique } from "../1_core/tools";
import { getModelUpdate } from "../1_core/model/ModelUpdate";
import { ansiColumnsToJzodSchema } from "../1_core/ansiColumnsToJzodSchema";
import {
  domainStateToReduxDeploymentsState,
  resolvePathOnObject,
  resolveRelativePath,
  safeResolvePathOnObject,
  stringTuple,
} from "../tools";
import { getAttributeTypesFromJzodSchema } from "../1_core/jzod/getAttributeTypesFromJzodSchema";
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
    stringTuple: stringTuple as WhitelistedFunction,
    domainStateToReduxDeploymentsState: domainStateToReduxDeploymentsState as WhitelistedFunction,
    safeResolvePathOnObject: safeResolvePathOnObject as WhitelistedFunction,
    resolvePathOnObject: resolvePathOnObject as WhitelistedFunction,
    resolveRelativePath: resolveRelativePath as WhitelistedFunction,
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
  "miroir-core/1_core/jzod/jzodObjectFlatten": {
    jzodObjectFlatten: jzodObjectFlatten as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/jzodTypeCheck": {
    buildAnyObjectEntry: buildAnyObjectEntry as WhitelistedFunction,
    buildAnySubnodeKeyMap: buildAnySubnodeKeyMap as WhitelistedFunction,
    selectUnionBranchFromDiscriminator: selectUnionBranchFromDiscriminator as WhitelistedFunction,
    unionObjectChoices: unionObjectChoices as WhitelistedFunction,
    unionArrayChoices: unionArrayChoices as WhitelistedFunction,
    jzodUnionResolvedTypeForObject: jzodUnionResolvedTypeForObject as WhitelistedFunction,
    jzodUnionResolvedTypeForArray: jzodUnionResolvedTypeForArray as WhitelistedFunction,
  },
  "miroir-core/1_core/jzod/jzodUnion_RecursivelyUnfold": {
    jzodUnion_recursivelyUnfold: jzodUnion_recursivelyUnfold as WhitelistedFunction,
  },
  // "miroir-core/1_core/jzod/jzodReferencesGraphConnectedComponents": {
  //   jzodReferencesGraphConnectedComponents:
  //     jzodReferencesGraphConnectedComponents as WhitelistedFunction,
  // },
  "miroir-core/1_core/jzod/JzodUnfoldSchemaOnce": {
    localizeJzodSchemaReferenceContext: localizeJzodSchemaReferenceContext as WhitelistedFunction,
  },
  "miroir-core/1_core/tools": {
    pushIfUnique: pushIfUnique as WhitelistedFunction,
    mergeIfUnique: mergeIfUnique as WhitelistedFunction,
    pushIfUniqueReturning: ((array, item) => {
      pushIfUnique(array as never[], item as never);
      return array;
    }) as WhitelistedFunction,
    mergeIfUniqueReturning: ((array, items) => {
      mergeIfUnique(array as never[], items as never[]);
      return array;
    }) as WhitelistedFunction,
  },
  "miroir-core/1_core/model/ModelUpdate": {
    getModelUpdate: getModelUpdate as WhitelistedFunction,
  },
  "miroir-core/1_core/ansiColumnsToJzodSchema": {
    ansiColumnsToJzodSchema: ansiColumnsToJzodSchema as WhitelistedFunction,
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
  "miroir-core/1_core/jzod/getAttributeTypesFromJzodSchema": {
    getAttributeTypesFromJzodSchema: getAttributeTypesFromJzodSchema as WhitelistedFunction,
  },
  // Backward-compatible alias for existing MiroirTest assets that still reference the postgres path.
  "miroir-store-postgres/1_core/mlSchema": {
    getAttributeTypesFromJzodSchema: getAttributeTypesFromJzodSchema as WhitelistedFunction,
  },
  "miroir-core/2_domain/Templates": {
    resolveQueryTemplateWithExtractorCombinerTransformer:
      resolveQueryTemplateWithExtractorCombinerTransformer as WhitelistedFunction,
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
