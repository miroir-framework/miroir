/// <reference types="vite/client" />

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type {
  EntityDefinition,
  JzodElement,
  MiroirModelEnvironment,
  MlSchema,
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  getMiroirFundamentalSchemaForDeployment,
  jzodTypeCheck,
  resolveFundamentalSchemaForDeployment,
} from "miroir-core";

// Feature 198 — runner_library MiroirTest instance
import runnerLibraryTestJSON from "../assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c.json";

// Library-specific entity definitions (imported directly from assets)
import entityDefinitionAuthor from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionBook from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionCountry from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";
import entityDefinitionPublisher from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionUser from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/8a4b9e9f-ae19-489f-977f-f3062107e066.json";
import entityDefinitionLendingHistoryItem from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/ce054a0c-5c45-4e2b-a1a9-07e3e5dc8505.json";

// Deployment info for model environment
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

// Library model (built from static assets)
import { defaultLibraryAppModel } from "../src/Library";

import {
  defaultMiroirMetaModel,
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
} from "miroir-test-app_deployment-miroir";
// ================================================================================================
// Model environments
// ================================================================================================

/**
 * Library model environment: used when validating library data instances (Author, Book, etc.)
 * so that currentModel reflects the library application model.
 */
const libraryModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
    deployment_Library_DO_NO_USE.uuid,
    defaultLibraryAppModel,
  ),
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {},
  deploymentUuid: deployment_Library_DO_NO_USE.uuid,
  currentModel: defaultLibraryAppModel,
};

// console.log(
//   "libraryModelEnvironment.miroirFundamentalJzodSchema.definition.context.domainAction",
//   JSON.stringify((libraryModelEnvironment.miroirFundamentalJzodSchema as any).definition?.context?.domainAction, null, 2),
// );
// console.log(
//   "libraryModelEnvironment.miroirFundamentalJzodSchema.definition.context.miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction",
//   JSON.stringify((libraryModelEnvironment.miroirFundamentalJzodSchema as any).definition?.context?.miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction, null, 2),
// );

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
          // `jzodTypeCheck failed for instance ${label}: ${JSON.stringify(result)}`,
          `jzodTypeCheck failed for instance ${label}`,
        ).toBe("ok");
      });
    }
  });
}

// ================================================================================================
// Test suites — Model instances (validated against the Miroir meta-model)
// ================================================================================================
const modelTestsToRun: Array<{
  groupName: string;
  jzodSchema: JzodElement;
  instances: Record<string, { default: any }>;
  filterByName?: string[];
}> = [
  {
    "groupName": "Entity",
    "jzodSchema": (entityDefinitionEntity as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": entityInstances,
  },
  {
    "groupName": "EntityDefinition",
    "jzodSchema": (entityDefinitionEntityDefinition as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": entityDefinitionInstances,
  },
  {
    "groupName": "Report",
    "jzodSchema": (entityDefinitionReport as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": reportInstances,
    // "filterByName": ["SelfApplicationDetails"],
  },
  {
    "groupName": "EndpointVersion",
    "jzodSchema": (entityDefinitionEndpoint as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": endpointInstances,
    // "filterByName": ["TestEndpoint", "PersistenceEndpoint", "MenuEndpoint", "ApplicationEndpoint"],
    // "filterByName": ["InstanceEndpoint"],
  },
  {
    "groupName": "Menu",
    "jzodSchema": (entityDefinitionMenu as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": menuInstances,
  },
  // {
  //   "groupName": "JzodSchema",
  //   "jzodSchema": (entityDefinitionJzodSchema as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  //   "instances": jzodSchemaInstances,
  //   // "filterByName": ["transformerJzodSchema"],
  // },
  {
    "groupName": "QueryVersion",
    "jzodSchema": (entityDefinitionQueryVersionV1 as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": queryInstances,
    // "filterByName": ["BundleProducer"],
  },
  {
    "groupName": "StoreBasedConfiguration",
    "jzodSchema": (entityDefinitionStoreBasedConfiguration as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": storeBasedConfigurationInstances,
  },
  {
    "groupName": "SelfApplication",
    "jzodSchema": (entityDefinitionSelfApplication as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": selfApplicationInstances,
  },
  {
    "groupName": "SelfApplicationDeploymentConfiguration",
    "jzodSchema": (entityDefinitionSelfApplicationDeploymentConfiguration as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": selfApplicationDeploymentInstances,
  },
  {
    "groupName": "SelfApplicationModelBranch",
    "jzodSchema": (entityDefinitionSelfApplicationModelBranch as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": selfApplicationModelBranchInstances,
  },
  {
    "groupName": "SelfApplicationVersion",
    "jzodSchema": (entityDefinitionSelfApplicationVersion as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": applicationVersionInstances,
  },
  {
    "groupName": "Runner",
    "jzodSchema": (entityDefinitionRunner as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": runnerInstances,
    // filterByName: ["dropApplication", "dropEntity", "deployApplication", "createEntity"],
    // filterByName: ["dropEntity"],
    // filterByName: ["deployApplication"],
  },
  // {
  //   "groupName": "TransformerDefinition",
  //   "jzodSchema": (entityDefinitionTransformerDefinition as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  //   "instances": transformerDefinitionInstances,
  //   // filterByName: ["getActiveDeployment"],
  // },
  // {
  //   "groupName": "Test",
  //   "jzodSchema": (entityDefinitionTest as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  //   "instances": testInstances,
  // },
  // {
  //   "groupName": "TransformerTest",
  //   "jzodSchema": (entityDefinitionTransformerTest as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  //   "instances": transformerTestInstances,
  //   // filterByName: ["unfoldSchemaOnce"],
  // }
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  {
    "groupName": "Author",
    "jzodSchema": (entityDefinitionAuthor as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": authorInstances,
  },
  {
    "groupName": "Book",
    "jzodSchema": (entityDefinitionBook as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": bookInstances,
  },
  {
    "groupName": "Country",
    "jzodSchema": (entityDefinitionCountry as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": countryInstances,
  },
  {
    "groupName": "Publisher",
    "jzodSchema": (entityDefinitionPublisher as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": publisherInstances,
  },
  {
    "groupName": "User",
    "jzodSchema": (entityDefinitionUser as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": userInstances,
  },
  {
    "groupName": "LendingHistoryItem",
    "jzodSchema": (entityDefinitionLendingHistoryItem as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
    "instances": lendingHistoryItemInstances,
  },
]

modelTestsToRun.forEach(({ groupName, jzodSchema, instances, filterByName }) => {
  const filteredInstances = Object.fromEntries(Object.entries(instances).filter(e => {
    const instance = e[1].default;
    if (!instance.name) return true;
    if (!filterByName) return true;
    return filterByName.some(name => instance.name.includes(name));
  }));
  describeEntityGroup(
    groupName,
    jzodSchema,
    filteredInstances,
    defaultMiroirModelEnvironment,
  );
});

// ================================================================================================
// Feature 198 — app-action validation against extended domainAction
// ================================================================================================

describe("extended schema requirement (199)", () => {
  it("Library app-action tests still require extended schema (not static)", () => {
    const staticSchema = resolveFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel,
      "static",
    );
    const extendedSchema = resolveFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel,
      "extended",
    );

    expect(staticSchema).not.toBe(extendedSchema);

    const extendedDomainAction = (extendedSchema as any).definition.context.domainAction;
    const lendBranch = extendedDomainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();

    const staticDomainAction = (staticSchema as any).definition.context.domainAction;
    const staticLendBranch = staticDomainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(staticLendBranch).toBeUndefined();
  }, 120_000);
});

function buildExtendedLibraryModelEnvironment(): MiroirModelEnvironment {
  return {
    ...libraryModelEnvironment,
    miroirFundamentalJzodSchema: resolveFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel,
      "extended",
    ),
  };
}

describe("extended schema required — opt out of frozen mode (199)", () => {
  const previousSchemaMode = process.env.MIROIR_SCHEMA_MODE;

  beforeAll(() => {
    process.env.MIROIR_SCHEMA_MODE = "runtime";
  });

  afterAll(() => {
    if (previousSchemaMode === undefined) {
      delete process.env.MIROIR_SCHEMA_MODE;
    } else {
      process.env.MIROIR_SCHEMA_MODE = previousSchemaMode;
    }
  });

  describe("App-action validation (Feature 198)", () => {
    const extendedLibraryModelEnvironment = buildExtendedLibraryModelEnvironment();

    const domainActionSchema: JzodElement = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "domainAction",
      },
    };
    const actionTemplateSchema: JzodElement = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "actionTemplate",
      },
    };

    it("lendDocument action validates against domainAction", () => {
      const lendDocumentAction = {
        actionType: "lendDocument",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: {
          user: "04c371ed-702d-4dd9-a06d-8a04eda5d24f",
          book: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
          startDate: "2024-01-01T00:00:00.000Z",
        },
      };

      const result = jzodTypeCheck(
        domainActionSchema,
        lendDocumentAction,
        [],
        [],
        extendedLibraryModelEnvironment,
        {},
      );

      expect(result.status).toBe("ok");
    });

    it("template-form lendDocument validates against actionTemplate", () => {
      const templateFormAction = {
        // Keep discriminator literal so union branch selection remains deterministic.
        actionType: "lendDocument",
        endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
        payload: {
          user: { transformerType: "getFromParameters", interpolation: "build", referenceName: "user1Uuid" },
          book: { transformerType: "getFromParameters", interpolation: "build", referenceName: "book1Uuid" },
          startDate: { transformerType: "getFromParameters", interpolation: "build", referenceName: "lendStartDate" },
        },
      };

      const result = jzodTypeCheck(
        actionTemplateSchema,
        templateFormAction,
        [],
        [],
        extendedLibraryModelEnvironment,
        {},
      );

      expect(result.status).toBe("ok");
    });

    it("runner_library MiroirTest validates against miroirTestDefinition schema", () => {
      // The runner_library MiroirTest entity has definition.miroirTestType === "miroirTestSuite",
      // whose miroirTests[] items are miroirTestForRunner entries that carry
      // preRunnerCompositeActions typed as actionTemplate[].
      // Those actions include lendDocument with transformer-form payload fields
      // (getFromParameters). Validation succeeds only when:
      //   (a) the extended actionTemplate (from extendedLibraryModelEnvironment) includes the
      //       lendDocument carry-on branch, AND
      //   (b) the Lending endpoint definition has canBeTemplate: true on user/book/startDate.
      const miroirTestDefinitionSchema: JzodElement = {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "miroirTestDefinition",
        },
      };
      const result = jzodTypeCheck(
        miroirTestDefinitionSchema,
        runnerLibraryTestJSON,
        [],
        [],
        extendedLibraryModelEnvironment,
        {},
      );
      expect(result.status).toBe("ok");
    });
  });
});

