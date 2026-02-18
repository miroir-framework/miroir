import { describe, expect, it } from "vitest";

import type {
  EntityDefinition,
  JzodElement,
  MiroirModelEnvironment,
  MlSchema,
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  entityDefinitionRunner,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionStoreBasedConfiguration,
  jzodTypeCheck,
  miroirFundamentalJzodSchema,
} from "miroir-core";

// Library-specific entity definitions (imported directly from assets)
import entityDefinitionAuthor from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json" assert {
  type: "json",
};
import entityDefinitionBook from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json" assert {
  type: "json",
};
import entityDefinitionCountry from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json" assert {
  type: "json",
};
import entityDefinitionPublisher from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json" assert {
  type: "json",
};
import entityDefinitionUser from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/8a4b9e9f-ae19-489f-977f-f3062107e066.json" assert {
  type: "json",
};
import entityDefinitionLendingHistoryItem from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/ce054a0c-5c45-4e2b-a1a9-07e3e5dc8505.json" assert {
  type: "json",
};

// Deployment info for model environment
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json" assert {
  type: "json",
};

// Library model (built from static assets)
import { defaultLibraryAppModelDEFUNCT } from "../src/Library";

// ================================================================================================
// Model environments
// ================================================================================================

/**
 * Library model environment: used when validating library data instances (Author, Book, etc.)
 * so that currentModel reflects the library application model.
 */
const libraryModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {},
  deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  currentModel: defaultLibraryAppModelDEFUNCT,
};

// ================================================================================================
// Eagerly load all instances via import.meta.glob
// ================================================================================================

// Model: Entities (parentUuid = entityEntity = 16dbfe28)
const entityInstances = import.meta.glob(
  "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: EntityDefinitions (parentUuid = entityEntityDefinition = 54b9c72f)
const entityDefinitionInstances = import.meta.glob(
  "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: Reports (parentUuid = entityReport = 3f2baa83)
const reportInstances = import.meta.glob(
  "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: EndpointVersions (parentUuid = entityEndpointVersion = 3d8da4d4)
const endpointInstances = import.meta.glob(
  "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: Menus (parentUuid = entityMenu = dde4c883)
const menuInstances = import.meta.glob(
  "../assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: QueryVersions (parentUuid = entityQueryVersion = e4320b9e)
const queryInstances = import.meta.glob(
  "../assets/library_model/e4320b9e-ab45-4abe-85d8-359604b3c62f/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: Runners (parentUuid = entityRunner = e54d7dc1)
const runnerInstances = import.meta.glob(
  "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: ApplicationVersions (parentUuid = entitySelfApplicationVersion = c3f0facf)
const applicationVersionInstances = import.meta.glob(
  "../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: SelfApplications (parentUuid = entitySelfApplication = a659d350)
const selfApplicationInstances = import.meta.glob(
  "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: SelfApplicationDeploymentConfigurations (parentUuid = entitySelfApplicationDeploymentConfiguration = 35c5608a)
const selfApplicationDeploymentInstances = import.meta.glob(
  "../assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: SelfApplicationModelBranches (parentUuid = entitySelfApplicationModelBranch = cdb0aec6)
const selfApplicationModelBranchInstances = import.meta.glob(
  "../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: StoreBasedConfigurations (parentUuid = entityStoreBasedConfiguration = 7990c0c9)
const storeBasedConfigurationInstances = import.meta.glob(
  "../assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Authors (parentUuid = entityAuthor = d7a144ff)
const authorInstances = import.meta.glob(
  "../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Books (parentUuid = entityBook = e8ba151b)
const bookInstances = import.meta.glob(
  "../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Countries (parentUuid = entityCountry = d3139a6d)
const countryInstances = import.meta.glob(
  "../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Publishers (parentUuid = entityPublisher = a027c379)
const publisherInstances = import.meta.glob(
  "../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Users (parentUuid = entityUser = ca794e28)
const userInstances = import.meta.glob(
  "../assets/library_data/ca794e28-b2dc-45b3-8137-00151557eea8/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: LendingHistoryItems (parentUuid = entityLendingHistoryItem = e81078f3)
const lendingHistoryItemInstances = import.meta.glob(
  "../assets/library_data/e81078f3-2de7-4301-bd79-d3a156aec149/*.json",
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
  "QueryVersion",
  (entityDefinitionQueryVersionV1 as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  queryInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "Runner",
  (entityDefinitionRunner as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  runnerInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "ApplicationVersion",
  (entityDefinitionSelfApplicationVersion as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  applicationVersionInstances,
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
  "StoreBasedConfiguration",
  (entityDefinitionStoreBasedConfiguration as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  storeBasedConfigurationInstances,
  defaultMiroirModelEnvironment,
);

// ================================================================================================
// Test suites — Data instances (validated against the library model)
// ================================================================================================

describeEntityGroup(
  "Author",
  (entityDefinitionAuthor as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  authorInstances,
  libraryModelEnvironment,
);

describeEntityGroup(
  "Book",
  (entityDefinitionBook as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  bookInstances,
  libraryModelEnvironment,
);

describeEntityGroup(
  "Country",
  (entityDefinitionCountry as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  countryInstances,
  libraryModelEnvironment,
);

describeEntityGroup(
  "Publisher",
  (entityDefinitionPublisher as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  publisherInstances,
  libraryModelEnvironment,
);

describeEntityGroup(
  "User",
  (entityDefinitionUser as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  userInstances,
  libraryModelEnvironment,
);

describeEntityGroup(
  "LendingHistoryItem",
  (entityDefinitionLendingHistoryItem as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  lendingHistoryItemInstances,
  libraryModelEnvironment,
);
