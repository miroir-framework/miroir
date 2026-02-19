/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import type {
  EntityDefinition,
  JzodElement,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  entityDefinitionRunner,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionStoreBasedConfiguration,
  entityDefinitionTest,
  entityDefinitionTransformerDefinition,
  entityDefinitionTransformerTest,
  jzodTypeCheck,
} from "miroir-core";

// ================================================================================================
// Eagerly load all instances via import.meta.glob
// ================================================================================================

// Model: Entities (parentUuid = entityEntity = 16dbfe28)
const entityInstances = import.meta.glob(
  "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: EntityDefinitions (parentUuid = entityEntityDefinition = 54b9c72f)
const entityDefinitionInstances = import.meta.glob(
  "../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Reports (parentUuid = entityReport = 3f2baa83)
const reportInstances = import.meta.glob(
  "../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: EndpointVersions (parentUuid = entityEndpointVersion = 3d8da4d4)
const endpointInstances = import.meta.glob(
  "../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Menus (parentUuid = entityMenu = dde4c883)
const menuInstances = import.meta.glob(
  "../assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: JzodSchemas (parentUuid = entityJzodSchema = 5e81e1b9)
const jzodSchemaInstances = import.meta.glob(
  "../assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: QueryVersions (parentUuid = entityQueryVersion = e4320b9e)
const queryInstances = import.meta.glob(
  "../assets/miroir_data/e4320b9e-ab45-4abe-85d8-359604b3c62f/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: StoreBasedConfigurations (parentUuid = entityStoreBasedConfiguration = 7990c0c9)
const storeBasedConfigurationInstances = import.meta.glob(
  "../assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: SelfApplications (parentUuid = entitySelfApplication = a659d350)
const selfApplicationInstances = import.meta.glob(
  "../assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: SelfApplicationDeploymentConfigurations (parentUuid = 35c5608a)
const selfApplicationDeploymentInstances = import.meta.glob(
  "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: SelfApplicationModelBranches (parentUuid = entitySelfApplicationModelBranch = cdb0aec6)
const selfApplicationModelBranchInstances = import.meta.glob(
  "../assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: SelfApplicationVersions (parentUuid = c3f0facf)
const applicationVersionInstances = import.meta.glob(
  "../assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Runners (parentUuid = entityRunner = e54d7dc1)
const runnerInstances = import.meta.glob(
  "../assets/miroir_data/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: TransformerDefinitions (parentUuid = entityTransformerDefinition = a557419d)
const transformerDefinitionInstances = import.meta.glob(
  "../assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Tests (parentUuid = entityTest = c37625c7)
const testInstances = import.meta.glob(
  "../assets/miroir_data/c37625c7-0b35-4d6a-811d-8181eb978301/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: TransformerTests (parentUuid = entityTransformerTest = 681be9ca)
const transformerTestInstances = import.meta.glob(
  "../assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// ================================================================================================
// Helpers
// ================================================================================================

function buildInstanceLabel(instance: any, fallbackPath: string): string {
  const uuid: string = instance.uuid ?? fallbackPath;
  return instance.name ? `${instance.name} (${uuid})` : uuid;
}

function describeEntityGroup(
  groupName: string,
  jzodSchema: JzodElement,
  instances: Record<string, { default: any }>,
  modelEnv: MiroirModelEnvironment,
): void {
  describe(groupName, () => {
    for (const [path, module] of Object.entries(instances)) {
      const instance = module.default;
      const label = buildInstanceLabel(instance, path);
      it(label, () => {
        const result = jzodTypeCheck(
          jzodSchema,
          instance,
          [], // currentValuePath
          [], // currentTypePath
          modelEnv,
          {}, // relativeReferenceJzodContext
        );
        expect(
          result.status,
          `jzodTypeCheck failed for instance ${label}: ${JSON.stringify(result)}`,
        ).toBe("ok");
      });
    }
  });
}

// ================================================================================================
// Test suites — Model instances (validated against the Miroir meta-model)
// ================================================================================================

describeEntityGroup(
  "Entity",
  (entityDefinitionEntity as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  entityInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "EntityDefinition",
  (entityDefinitionEntityDefinition as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  entityDefinitionInstances,
  defaultMiroirModelEnvironment,
);

// ================================================================================================
// Test suites — Data instances (validated against the Miroir meta-model)
// ================================================================================================

describeEntityGroup(
  "Report",
  (entityDefinitionReport as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  reportInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "EndpointVersion",
  (entityDefinitionEndpoint as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  endpointInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "Menu",
  (entityDefinitionMenu as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  menuInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "JzodSchema",
  (entityDefinitionJzodSchema as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  jzodSchemaInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "QueryVersion",
  (entityDefinitionQueryVersionV1 as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  queryInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "StoreBasedConfiguration",
  (entityDefinitionStoreBasedConfiguration as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  storeBasedConfigurationInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "SelfApplication",
  (entityDefinitionSelfApplication as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  selfApplicationInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "SelfApplicationDeploymentConfiguration",
  (entityDefinitionSelfApplicationDeploymentConfiguration as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  selfApplicationDeploymentInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "SelfApplicationModelBranch",
  (entityDefinitionSelfApplicationModelBranch as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  selfApplicationModelBranchInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "SelfApplicationVersion",
  (entityDefinitionSelfApplicationVersion as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  applicationVersionInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "Runner",
  (entityDefinitionRunner as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  runnerInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "TransformerDefinition",
  (entityDefinitionTransformerDefinition as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  transformerDefinitionInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "Test",
  (entityDefinitionTest as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  testInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "TransformerTest",
  (entityDefinitionTransformerTest as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  transformerTestInstances,
  defaultMiroirModelEnvironment,
);
