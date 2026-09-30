import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type MiroirTestSuiteLoader = () => Promise<{ default: MiroirTestSuite }>;

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

export const MIROIR_TEST_SUITE_REGISTRY: Record<string, MiroirTestSuiteLoader> = await import(
  "miroir-app-miroir",
).then((deployment) => {
  return MIROIR_TEST_SUITE_REGISTRY_NAMES.reduce(
    (acc, name) => {
      acc[name] = async () => {
        const instance = (deployment as unknown as Record<string, { definition: unknown }>)[
          `miroirTest_${name.replaceAll(".", "_")}`
        ];
        return { default: instance.definition as MiroirTestSuite };
      };
      return acc;
    },
    {} as Record<string, MiroirTestSuiteLoader>,
  );
});

export function listMiroirTestSuiteKeys(): string[] {
  return ([...MIROIR_TEST_SUITE_REGISTRY_NAMES] as string[]).sort();
}

/**
 * @deprecated Named-export fallback. CLI and Node tests should use
 * `loadMiroirCoreTestSuiteFromFolders` / `loadMiroirTestSuiteFromCatalog`.
 */
export async function loadMiroirCoreTestSuite(suiteKey: string): Promise<MiroirTestSuite> {
  const loader = MIROIR_TEST_SUITE_REGISTRY[suiteKey];
  if (loader) {
    const loaded = await loader();
    return loaded.default;
  }

  const deployment = await import("miroir-app-miroir");
  for (const [exportName, value] of Object.entries(deployment)) {
    if (!exportName.startsWith("miroirTest_")) {
      continue;
    }
    const instance = value as { name?: string; definition?: MiroirTestSuite };
    if (instance?.name === suiteKey && instance.definition) {
      return instance.definition;
    }
  }

  throw new Error(
    `Unknown MiroirTest suite key "${suiteKey}". Available: ${listMiroirTestSuiteKeys().join(", ")}`,
  );
}
