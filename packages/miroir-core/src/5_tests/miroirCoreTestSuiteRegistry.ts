// Suite names only: nothing here imports "miroir-app-miroir", whose namespace, once read whole,
// keeps every MiroirTest definition in the browser bundle (#337).
/** @deprecated Use `listCliUnitSuiteKeys(loadApplicationMiroirTestCatalog())`. Last hardcoded snapshot. */
export const MIROIR_TEST_SUITE_REGISTRY_NAMES = [
  "tr.admin.duplicateApplicationModel",
  "fn.tools.alterObjectAtPath",
  "fn.ansiColumnsToMlSchema",
  "fn.mlsTypeCheck.buildAnyKeyMap",
  "tr.defaultValueForMlSchema",
  "fn.entityPrimaryKey",
  "fn.postgres.attributeTypesFromMlSchema",
  "fn.mlObjectFlatten",
  "fn.mlSchemaReferences.list",
  "fn.mlSchemaReferences.set",
  "fn.mlsToCopilotKitParameter",
  "fn.mlsToJsonSchema",
  "fn.mlsToMls.summary",
  "fn.mlSchemaReferences.transitiveDependencySet",
  "tr.mlsTypeCheck",
  "fn.mlUnion.recursivelyUnfold",
  "fn.mlsTypeCheck.unionResolvedTypeForArray",
  "fn.mlsTypeCheck.unionResolvedTypeForObject",
  "fn.mlsUnfoldSchemaOnce.localizeReferenceContext",
  "tr.menuBuild",
  "fn.mlsToMls.mergePositionBased",
  "tr.metaModel.extractAttributes",
  "tr.core",
  "fn.modelUpdate",
  "fn.mustache.extractDoubleBracePatterns",
  "tr.resolveConditionalSchema.build",
  "query.library.instances",
  "tr.resolveConditionalSchema",
  "fn.templates.resolveQueryTemplates",
  "tr.resolveSchemaReferenceInContext",
  "fn.mlsTypeCheck.selectUnionBranchFromDiscriminator",
  "fn.tools.pathsAndMerges",
  "fn.transformer.interfaceCheck",
  "fn.transformer.resultSchema",
  "tr.unfoldSchemaOnce",
  "fn.mlsTypeCheck.unionArrayChoices",
  "fn.mlsTypeCheck.unionObjectChoices",
  "query.virtualAttributes",
] as const;

export type MiroirTestSuiteKey = (typeof MIROIR_TEST_SUITE_REGISTRY_NAMES)[number];

export function listMiroirTestSuiteKeys(): string[] {
  return ([...MIROIR_TEST_SUITE_REGISTRY_NAMES] as string[]).sort();
}
