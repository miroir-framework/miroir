/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import type {
  Entity,
  EntityDefinition,
  JzodElement,
  MetaModel,
  MiroirModelEnvironment,
  MlSchema,
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionMenu,
  entityDefinitionReport,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionStoreBasedConfiguration,
  jzodTypeCheck,
  miroirFundamentalJzodSchema,
} from "miroir-core";

// Admin-specific entity definitions (from admin model assets)
import entityDefinitionAdminApplication from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json" assert {
  type: "json",
};
import entityDefinitionDeploymentAdmin from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json" assert {
  type: "json",
};
import entityDefinitionViewParamsAdmin from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/4cb43523-350f-49bd-813e-ab7d5cef78b2.json" assert {
  type: "json",
};
// entityUuid: ff3d211b (entity named "ApplicationVersion")
import entityDefinitionApplicationVersionAdmin from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/53edf3b4-c8ff-4de5-9f28-2d1ecda2a02a.json" assert {
  type: "json",
};
// entityUuid: 9f9170da (entity named "bundle")
import entityDefinitionBundleAdmin from "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9f68d5aa-8def-421b-a9bc-52ed22a63e7e.json" assert {
  type: "json",
};

// Admin model entities (for MetaModel construction)
import entityApplicationForAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json" assert {
  type: "json",
};
import entityDeploymentAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json" assert {
  type: "json",
};
import entityBundleAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/9f9170da-538d-425c-8cb7-551640623eed.json" assert {
  type: "json",
};
import entityViewParamsAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/b9765b7c-b614-4126-a0e2-634463f99937.json" assert {
  type: "json",
};
import entityApplicationVersionAdmin from "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/ff3d211b-7eb6-473a-afbf-503bb70a5c26.json" assert {
  type: "json",
};

// Admin app self-application and deployment (for environment setup)
import adminSelfApplication from "../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json" assert {
  type: "json",
};
import deployment_Admin from "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json" assert {
  type: "json",
};

// ================================================================================================
// Admin MetaModel (for validating admin data instances)
// ================================================================================================

const adminMetaModel: MetaModel = {
  applicationUuid: adminSelfApplication.uuid,
  applicationName: adminSelfApplication.name,
  entities: [
    entityApplicationForAdmin,
    entityDeploymentAdmin,
    entityBundleAdmin,
    entityViewParamsAdmin,
    entityApplicationVersionAdmin,
  ] as unknown as Entity[],
  entityDefinitions: [
    entityDefinitionAdminApplication,
    entityDefinitionDeploymentAdmin,
    entityDefinitionViewParamsAdmin,
    entityDefinitionApplicationVersionAdmin,
    entityDefinitionBundleAdmin,
  ] as unknown as EntityDefinition[],
  endpoints: [],
  jzodSchemas: [],
  menus: [],
  applicationVersions: [],
  reports: [],
  runners: [],
  storedQueries: [],
  applicationVersionCrossEntityDefinition: [],
};

// ================================================================================================
// Model environments
// ================================================================================================

/**
 * Admin model environment: used when validating admin data instances (AdminApplication, Deployment, etc.)
 * so that currentModel reflects the admin application model.
 */
const adminModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {},
  deploymentUuid: deployment_Admin.uuid,
  currentModel: adminMetaModel,
};

// ================================================================================================
// Eagerly load all instances via import.meta.glob
// ================================================================================================

// Model: Entities (parentUuid = entityEntity = 16dbfe28)
const entityInstances = import.meta.glob(
  "../assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: EntityDefinitions (parentUuid = entityEntityDefinition = 54b9c72f)
const entityDefinitionInstances = import.meta.glob(
  "../assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: Reports (parentUuid = entityReport = 3f2baa83)
const reportInstances = import.meta.glob(
  "../assets/admin_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: Menus (parentUuid = entityMenu = dde4c883)
const menuInstances = import.meta.glob(
  "../assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: StoreBasedConfigurations (parentUuid = entityStoreBasedConfiguration = 7990c0c9)
const storeBasedConfigurationInstances = import.meta.glob(
  "../assets/admin_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: SelfApplications (parentUuid = entitySelfApplication = a659d350)
const selfApplicationInstances = import.meta.glob(
  "../assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: ApplicationVersions (parentUuid = entitySelfApplicationVersion = c3f0facf)
const applicationVersionInstances = import.meta.glob(
  "../assets/admin_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Model: SelfApplicationModelBranches (parentUuid = entitySelfApplicationModelBranch = cdb0aec6)
const selfApplicationModelBranchInstances = import.meta.glob(
  "../assets/admin_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: AdminApplications (parentUuid = entityApplicationForAdmin = 25d935e7)
const adminApplicationInstances = import.meta.glob(
  "../assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Deployments (parentUuid = entityDeployment = 7959d814)
const deploymentInstances = import.meta.glob(
  "../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: Bundles (parentUuid = entityBundle = 9f9170da)
const bundleInstances = import.meta.glob(
  "../assets/admin_data/9f9170da-538d-425c-8cb7-551640623eed/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: ViewParams (parentUuid = entityViewParams = b9765b7c)
const viewParamsInstances = import.meta.glob(
  "../assets/admin_data/b9765b7c-b614-4126-a0e2-634463f99937/*.json",
  { eager: true },
) as Record<string, { default: any }>;

// Data: ApplicationVersions / Imports (parentUuid = entityApplicationVersion = ff3d211b)
const applicationVersionDataInstances = import.meta.glob(
  "../assets/admin_data/ff3d211b-7eb6-473a-afbf-503bb70a5c26/*.json",
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
  "Menu",
  (entityDefinitionMenu as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  menuInstances,
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
  "ApplicationVersion",
  (entityDefinitionSelfApplicationVersion as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  applicationVersionInstances,
  defaultMiroirModelEnvironment,
);

describeEntityGroup(
  "SelfApplicationModelBranch",
  (entityDefinitionSelfApplicationModelBranch as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  selfApplicationModelBranchInstances,
  defaultMiroirModelEnvironment,
);

// ================================================================================================
// Test suites — Data instances (validated against the admin model)
// ================================================================================================

describeEntityGroup(
  "AdminApplication",
  (entityDefinitionAdminApplication as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  adminApplicationInstances,
  adminModelEnvironment,
);

describeEntityGroup(
  "Deployment",
  (entityDefinitionDeploymentAdmin as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  deploymentInstances,
  adminModelEnvironment,
);

describeEntityGroup(
  "bundle",
  (entityDefinitionBundleAdmin as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  bundleInstances,
  adminModelEnvironment,
);

describeEntityGroup(
  "ViewParams",
  (entityDefinitionViewParamsAdmin as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  viewParamsInstances,
  adminModelEnvironment,
);

describeEntityGroup(
  "ApplicationVersionData",
  (entityDefinitionApplicationVersionAdmin as unknown as EntityDefinition).mlSchema as unknown as JzodElement,
  applicationVersionDataInstances,
  adminModelEnvironment,
);
