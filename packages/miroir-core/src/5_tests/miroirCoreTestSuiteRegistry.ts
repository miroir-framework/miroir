import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

export type MiroirTestSuiteLoader = () => Promise<{ default: MiroirTestSuite }>;

/** @deprecated Use `listCliUnitSuiteKeys(loadApplicationMiroirTestCatalog())`. Last hardcoded snapshot. */
export const MIROIR_TEST_SUITE_REGISTRY_NAMES = [
  "adminTransformers",
  "alterObject",
  "ansiColumnsToJzodSchema",
  "buildAnyKeyMap",
  "defaultValueForMLSchema",
  "EntityPrimaryKey",
  "getAttributeTypesFromJzodSchema",
  "jzodObjectFlatten",
  "JzodSchemaReferencesList",
  "JzodSchemaReferencesSet",
  "jzodToCopilotKitParameter",
  "jzodToJsonSchema",
  "jzodToJzod_Summary",
  "jzodTransitiveDependencySet",
  "jzodTypeCheck",
  "jzodUnion_RecursiveUnfold",
  "jzodUnionResolvedTypeForArray",
  "jzodUnionResolvedTypeForObject",
  "localizeJzodSchemaReferenceContext",
  "menu",
  "mergePositionBased",
  "metaModelTransformers",
  "miroirCoreTransformers",
  "modelUpdates",
  "mustache",
  "pilot_transformer_plus",
  "queries_library",
  "resolveConditionalSchema",
  "resolveQueryTemplates",
  "resolveSchemaReferenceInContext",
  "selectUnionBranchFromDiscriminator",
  "tools",
  "transformerInterfaceCheck",
  "transformerResultSchema",
  "unfoldSchemaOnce",
  "unionArrayChoices",
  "unionObjectChoices",
  "virtualAttributes",
] as const;

export type MiroirTestSuiteKey = (typeof MIROIR_TEST_SUITE_REGISTRY_NAMES)[number];

export const MIROIR_TEST_SUITE_REGISTRY: Record<string, MiroirTestSuiteLoader> = await import(
  "miroir-test-app_deployment-miroir",
).then((deployment) => {
  return MIROIR_TEST_SUITE_REGISTRY_NAMES.reduce(
    (acc, name) => {
      acc[name] = async () => {
        return { default: deployment[`miroirTest_${name}`].definition as MiroirTestSuite };
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

  const deployment = await import("miroir-test-app_deployment-miroir");
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
