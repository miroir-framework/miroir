import { extractDoubleBracePatterns } from "../1_core/mustache";
import {
  checkEntityPrimaryKeyDeclaration,
  entityHasCompositePrimaryKey,
  entityHasNoPrimaryKey,
  entityHasUuidPrimaryKey,
  getEntityPrimaryKeyAttribute,
  getEntityPrimaryKeyAttributes,
  getForeignKeyValue,
  getInstanceCacheKeys,
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
import { deriveEnvironmentDeployments, resolveEnvironment } from "../1_core/environment/Environment";
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
import { referencePathAttributeNames, resolveTransformerResultSchema } from "../2_domain/Transformer_ResultSchema";
import {
  applicationCompositeTransformerDefinitions,
  transformerDefinitionRegistryConflicts,
  transformerDefinitionRegistryOf,
} from "../2_domain/TransformerDefinitionRegistry";
import {
  checkTransformerInterfaceCompatibility,
  checkTransformerInterfaceCompatibilityWithInference,
  checkTransformerInterfaceRecursively,
  findInvalidStockTransformerInputOutputs,
  formatInputOutputTypeLabel,
  getTransformerDefinitionInputOutput,
  inputOutputTypeOfValue,
  inputOutputTypesCompatible,
  transformerNodeTypeStatus,
  transformerTypesAcceptingInput,
} from "../2_domain/TransformerInterfaceCheck";
import {
  defaultTransformerNode,
  editedAttributes,
  elementParameterReadsOfDefaultInput,
  holdsOneDefault,
  insertTransformerNode,
  keepAttributesOnTypeChange,
  moveTransformerNode,
  reorderTransformerNode,
  parameterReadsOfDefaultInput,
  pipeCandidates,
  pipeTransformerNode,
  removeTransformerNode,
  transformerChildren,
  transformerInsertPositions,
  transformerSlots,
  unwrapTransformerNode,
  wrapCandidates,
  wrapTransformerNode,
} from "../2_domain/TransformerTreeEdit";
import { transformerBlockOutline, transformerBlockTree, transformerPaletteGroups } from "../2_domain/TransformerBlockModel";
import { transformerSubtreeRuns } from "../2_domain/TransformerSubtreeRun";
import { transformerDefinitionBodyEnvironment, transformerEnvironmentAt } from "../2_domain/TransformerEnvironmentBindings";
import { compositeActionEnvironmentAt, runnerEnvironment } from "../2_domain/CompositeActionScope";
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
 * A module the page should not load up front (#370): its whitelisted export names, and a loader
 * that imports the module the first time one of them is called.
 */
type LazyRegistryModule = {
  exports: string[];
  load: () => Promise<Record<string, unknown>>;
};

/**
 * Whitelist of module/export pairs allowed for UI and in-memory functionCallTest execution.
 * Only registered exports can be invoked — arbitrary module paths are rejected.
 */
const FUNCTION_CALL_REGISTRY: Record<
  string,
  Record<string, WhitelistedFunction> | LazyRegistryModule
> = {
  "miroir-core/1_core/mustache": {
    extractDoubleBracePatterns: extractDoubleBracePatterns as WhitelistedFunction,
  },
  "miroir-core/1_core/mls/MlsToJsonSchema": {
    mlsToJsonSchema: mlsToJsonSchema as WhitelistedFunction,
  },
  "miroir-core/1_core/environment/Environment": {
    deriveEnvironmentDeployments: deriveEnvironmentDeployments as WhitelistedFunction,
    resolveEnvironment: resolveEnvironment as WhitelistedFunction,
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
  // json-diff and its `assert` polyfill stay out of the page until a test calls getModelUpdate.
  "miroir-core/1_core/model/ModelUpdate": {
    exports: ["getModelUpdate"],
    load: async () => {
      const modelUpdate = await import("../1_core/model/ModelUpdate");
      await modelUpdate.ensureJsonDiff();
      return modelUpdate;
    },
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
    entityHasNoPrimaryKey: entityHasNoPrimaryKey as WhitelistedFunction,
    getInstanceCacheKeys: getInstanceCacheKeys as WhitelistedFunction,
    checkEntityPrimaryKeyDeclaration: checkEntityPrimaryKeyDeclaration as WhitelistedFunction,
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
    referencePathAttributeNames: referencePathAttributeNames as WhitelistedFunction,
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
    transformerTypesAcceptingInput: transformerTypesAcceptingInput as WhitelistedFunction,
    inputOutputTypeOfValue: inputOutputTypeOfValue as WhitelistedFunction,
    formatInputOutputTypeLabel: formatInputOutputTypeLabel as WhitelistedFunction,
    checkTransformerInterfaceRecursively:
      checkTransformerInterfaceRecursively as WhitelistedFunction,
    transformerNodeTypeStatus: transformerNodeTypeStatus as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerTreeEdit": {
    transformerSlots: transformerSlots as WhitelistedFunction,
    wrapCandidates: wrapCandidates as WhitelistedFunction,
    pipeCandidates: pipeCandidates as WhitelistedFunction,
    wrapTransformerNode: wrapTransformerNode as WhitelistedFunction,
    pipeTransformerNode: pipeTransformerNode as WhitelistedFunction,
    transformerChildren: transformerChildren as WhitelistedFunction,
    unwrapTransformerNode: unwrapTransformerNode as WhitelistedFunction,
    removeTransformerNode: removeTransformerNode as WhitelistedFunction,
    keepAttributesOnTypeChange: keepAttributesOnTypeChange as WhitelistedFunction,
    editedAttributes: editedAttributes as WhitelistedFunction,
    holdsOneDefault: holdsOneDefault as WhitelistedFunction,
    parameterReadsOfDefaultInput: parameterReadsOfDefaultInput as WhitelistedFunction,
    elementParameterReadsOfDefaultInput: elementParameterReadsOfDefaultInput as WhitelistedFunction,
    defaultTransformerNode: defaultTransformerNode as WhitelistedFunction,
    insertTransformerNode: insertTransformerNode as WhitelistedFunction,
    moveTransformerNode: moveTransformerNode as WhitelistedFunction,
    transformerInsertPositions: transformerInsertPositions as WhitelistedFunction,
    reorderTransformerNode: reorderTransformerNode as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerEnvironmentBindings": {
    transformerEnvironmentAt: transformerEnvironmentAt as WhitelistedFunction,
    transformerDefinitionBodyEnvironment: transformerDefinitionBodyEnvironment as WhitelistedFunction,
  },
  "miroir-core/2_domain/CompositeActionScope": {
    compositeActionEnvironmentAt: compositeActionEnvironmentAt as WhitelistedFunction,
    runnerEnvironment: runnerEnvironment as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerDefinitionRegistry": {
    applicationCompositeTransformerDefinitions: applicationCompositeTransformerDefinitions as WhitelistedFunction,
    transformerDefinitionRegistryConflicts: transformerDefinitionRegistryConflicts as WhitelistedFunction,
    transformerDefinitionRegistryOf: transformerDefinitionRegistryOf as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerSubtreeRun": {
    transformerSubtreeRuns: transformerSubtreeRuns as WhitelistedFunction,
  },
  "miroir-core/2_domain/TransformerBlockModel": {
    transformerBlockTree: transformerBlockTree as WhitelistedFunction,
    transformerBlockOutline: transformerBlockOutline as WhitelistedFunction,
    transformerPaletteGroups: transformerPaletteGroups as WhitelistedFunction,
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

function isLazyRegistryModule(
  entry: Record<string, WhitelistedFunction> | LazyRegistryModule,
): entry is LazyRegistryModule {
  return Array.isArray(entry.exports) && typeof entry.load === "function";
}

function registryExportNames(
  entry: Record<string, WhitelistedFunction> | LazyRegistryModule,
): string[] {
  return isLazyRegistryModule(entry) ? entry.exports : Object.keys(entry);
}

export async function resolveFunctionCallTarget(ref: FunctionCallRef): Promise<WhitelistedFunction> {
  const moduleEntry = FUNCTION_CALL_REGISTRY[ref.module];
  if (!moduleEntry) {
    throw new Error(`functionRef module not whitelisted: ${ref.module}`);
  }
  if (!registryExportNames(moduleEntry).includes(ref.export)) {
    throw new Error(`functionRef export not whitelisted: ${ref.module}/${ref.export}`);
  }
  if (!isLazyRegistryModule(moduleEntry)) {
    return moduleEntry[ref.export];
  }
  const loaded = (await moduleEntry.load())[ref.export];
  if (typeof loaded !== "function") {
    throw new Error(`functionRef export is not a function: ${ref.module}/${ref.export}`);
  }
  return loaded as WhitelistedFunction;
}

export function listWhitelistedFunctionRefs(): FunctionCallRef[] {
  return Object.entries(FUNCTION_CALL_REGISTRY).flatMap(([module, entry]) =>
    registryExportNames(entry).map((exportName) => ({ module, export: exportName })),
  );
}
