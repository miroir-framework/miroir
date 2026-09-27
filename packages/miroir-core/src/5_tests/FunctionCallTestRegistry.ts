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
} from "../1_core/Entity/EntityPrimaryKey";
import {
  MlSchemaReferencesList,
  MlSchemaReferencesSet,
  mlsTransitiveDependencySet,
} from "../1_core/mls/MlSchemaReferences";
import { mlsToCopilotKitParameter } from "../1_core/mls/MlsToCopilotKitParameter";
import { mergePositionBased } from "../1_core/mls/MlsToMls_CarryOn";
import { mlsToMls_Summary } from "../1_core/mls/MlsToMls_Summary";
import { mlsToJsonSchema } from "../1_core/mls/MlsToJsonSchema";
import { deriveEnvironmentDeployments } from "../1_core/environment/Environment";
import { mlObjectFlatten } from "../1_core/mls/mlObjectFlatten";
import {
  buildAnyObjectEntry,
  buildAnySubnodeKeyMap,
  mlUnionResolvedTypeForArray,
  mlUnionResolvedTypeForObject,
  selectUnionBranchFromDiscriminator,
  unionArrayChoices,
  unionObjectChoices,
} from "../1_core/mls/mlsTypeCheck";
import { mlUnion_recursivelyUnfold } from "../1_core/mls/mlUnion_RecursivelyUnfold";
import { localizeMlSchemaReferenceContext } from "../1_core/mls/MlsUnfoldSchemaOnce";
import { resolveQueryTemplateWithExtractorCombinerTransformer } from "../2_domain/Templates";
import { resolveTransformerResultSchema } from "../2_domain/Transformer_ResultSchema";
import {
  checkTransformerInterfaceCompatibility,
  checkTransformerInterfaceCompatibilityWithInference,
  findInvalidStockTransformerInputOutputs,
  getTransformerDefinitionInputOutput,
  inputOutputTypesCompatible,
} from "../2_domain/TransformerInterfaceCheck";
import {
  checkTransformerMlSchemaCompatibility,
  formatMlSchemaTypeLabel,
  getDeclaredInputMlSchema,
  liftInputOutputTypeToMlSchema,
} from "../2_domain/TransformerMlSchemaCheck";
import {
  inferElementTransformerOutputType,
  inferTransformerOutputTypeFromSchema,
} from "../2_domain/TransformerInterfaceInference";
import { mergeIfUnique, pushIfUnique } from "../1_core/tools";
import { getModelUpdate } from "../1_core/model/ModelUpdate";
import { ansiColumnsToMlSchema } from "../1_core/postgres/ansiColumnsToMlSchema";
import {
  domainStateToReduxDeploymentsState,
  resolvePathOnObject,
  resolveRelativePath,
  safeResolvePathOnObject,
  stringTuple,
} from "../tools";
import { getAttributeTypesFromMlSchema } from "../1_core/mls/getAttributeTypesFromMlSchema";
import { alterObjectAtPath } from "../tools";
import { evaluateVirtualAttributesOnInstance, stripVirtualAttributesFromInstance } from "../2_domain/VirtualAttributes";

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
  "miroir-core/1_core/mls/MlsToJsonSchema": {
    mlsToJsonSchema: mlsToJsonSchema as WhitelistedFunction,
  },
  "miroir-core/1_core/environment/Environment": {
    deriveEnvironmentDeployments: deriveEnvironmentDeployments as WhitelistedFunction,
  },
  "miroir-core/tools": {
    alterObjectAtPath: alterObjectAtPath as WhitelistedFunction,
    stringTuple: stringTuple as WhitelistedFunction,
    domainStateToReduxDeploymentsState: domainStateToReduxDeploymentsState as WhitelistedFunction,
    safeResolvePathOnObject: safeResolvePathOnObject as WhitelistedFunction,
    resolvePathOnObject: resolvePathOnObject as WhitelistedFunction,
    resolveRelativePath: resolveRelativePath as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/MlsToCopilotKitParameter": {
    mlsToCopilotKitParameter: mlsToCopilotKitParameter as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/MlsToMls_CarryOn": {
    mergePositionBased: mergePositionBased as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/MlSchemaReferences": {
    MlSchemaReferencesList: MlSchemaReferencesList as WhitelistedFunction,
    MlSchemaReferencesSet: MlSchemaReferencesSet as WhitelistedFunction,
    mlsTransitiveDependencySet: mlsTransitiveDependencySet as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/MlsToMls_Summary": {
    mlsToMls_Summary: mlsToMls_Summary as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/mlObjectFlatten": {
    mlObjectFlatten: mlObjectFlatten as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/mlsTypeCheck": {
    buildAnyObjectEntry: buildAnyObjectEntry as WhitelistedFunction,
    buildAnySubnodeKeyMap: buildAnySubnodeKeyMap as WhitelistedFunction,
    selectUnionBranchFromDiscriminator: selectUnionBranchFromDiscriminator as WhitelistedFunction,
    unionObjectChoices: unionObjectChoices as WhitelistedFunction,
    unionArrayChoices: unionArrayChoices as WhitelistedFunction,
    mlUnionResolvedTypeForObject: mlUnionResolvedTypeForObject as WhitelistedFunction,
    mlUnionResolvedTypeForArray: mlUnionResolvedTypeForArray as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/mlUnion_RecursivelyUnfold": {
    mlUnion_recursivelyUnfold: mlUnion_recursivelyUnfold as WhitelistedFunction,
  },
  // "miroir-core/1_core/mls/mlReferencesGraphConnectedComponents": {
  //   mlReferencesGraphConnectedComponents:
  //     mlReferencesGraphConnectedComponents as WhitelistedFunction,
  // },
  "miroir-core/1_core/mls/MlsUnfoldSchemaOnce": {
    localizeMlSchemaReferenceContext: localizeMlSchemaReferenceContext as WhitelistedFunction,
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
  "miroir-core/1_core/ansiColumnsToMlSchema": {
    ansiColumnsToMlSchema: ansiColumnsToMlSchema as WhitelistedFunction,
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
  "miroir-core/1_core/mls/getAttributeTypesFromMlSchema": {
    getAttributeTypesFromMlSchema: getAttributeTypesFromMlSchema as WhitelistedFunction,
  },
  // Backward-compatible alias for existing MiroirTest assets that still reference the postgres path.
  "miroir-store-postgres/1_core/mlSchema": {
    getAttributeTypesFromMlSchema: getAttributeTypesFromMlSchema as WhitelistedFunction,
  },
  "miroir-core/2_domain/Templates": {
    resolveQueryTemplateWithExtractorCombinerTransformer:
      resolveQueryTemplateWithExtractorCombinerTransformer as WhitelistedFunction,
  },
  "miroir-core/2_domain/Transformer_ResultSchema": {
    resolveTransformerResultSchema: resolveTransformerResultSchema as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerInterfaceCheck": {
    inputOutputTypesCompatible: inputOutputTypesCompatible as WhitelistedFunction,
    checkTransformerInterfaceCompatibility:
      checkTransformerInterfaceCompatibility as WhitelistedFunction,
    checkTransformerInterfaceCompatibilityWithInference:
      checkTransformerInterfaceCompatibilityWithInference as WhitelistedFunction,
    getTransformerDefinitionInputOutput:
      getTransformerDefinitionInputOutput as WhitelistedFunction,
    findInvalidStockTransformerInputOutputs:
      findInvalidStockTransformerInputOutputs as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerMlSchemaCheck": {
    checkTransformerMlSchemaCompatibility:
      checkTransformerMlSchemaCompatibility as WhitelistedFunction,
    getDeclaredInputMlSchema: getDeclaredInputMlSchema as WhitelistedFunction,
    liftInputOutputTypeToMlSchema: liftInputOutputTypeToMlSchema as WhitelistedFunction,
    formatMlSchemaTypeLabel: formatMlSchemaTypeLabel as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerInterfaceInference": {
    inferTransformerOutputTypeFromSchema:
      inferTransformerOutputTypeFromSchema as WhitelistedFunction,
    inferElementTransformerOutputType:
      inferElementTransformerOutputType as WhitelistedFunction,
  },
  "miroir-core/2_domain/VirtualAttributes": {
    evaluateVirtualAttributesOnInstance:
      evaluateVirtualAttributesOnInstance as WhitelistedFunction,
    stripVirtualAttributesFromInstance:
      stripVirtualAttributesFromInstance as WhitelistedFunction,
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
