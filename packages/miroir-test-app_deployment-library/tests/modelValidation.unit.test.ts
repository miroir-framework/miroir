/// <reference types="vite/client" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as vitest from "vitest";

import type {
  Entity,
  EntityDefinition,
  JzodElement,
  MetaModel,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  buildModelValidationGroupsFromFilesystem,
  buildModelValidationPlanFromGroups,
  defaultMiroirModelEnvironment,
  getMiroirFundamentalSchemaForDeployment,
  jzodTypeCheck,
  runModelValidationSuite,
  resolveFundamentalSchemaForDeployment,
} from "miroir-core";

// Feature 198 — runner_library MiroirTest instance
import runnerLibraryTestJSON from "../assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/b7e4a901-2c3d-4f5a-b6c7-8d9e0f1a2b3c.json";

// Deployment info for model environment
import deployment_Library_DO_NO_USE from "../assets/deployment/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

// Library model (built from static assets)
import { defaultLibraryAppModel } from "../src/Library";

import {
  defaultMiroirMetaModel,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionStoreBasedConfiguration,
  entitySelfApplicationDeploymentConfiguration,
  entityStoreBasedConfiguration,
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

/**
 * `defaultMiroirMetaModel` omits a few meta-entities that library assets still store
 * (StoreBasedConfiguration, Deployment / SelfApplicationDeploymentConfiguration).
 * Merge them so filesystem discovery covers the previous hardcoded suite.
 */
const miroirMetaModelForLibraryValidation: MetaModel = {
  ...defaultMiroirMetaModel,
  entities: [
    ...defaultMiroirMetaModel.entities,
    entityStoreBasedConfiguration as Entity,
    entitySelfApplicationDeploymentConfiguration as Entity,
  ],
  entityDefinitions: [
    ...defaultMiroirMetaModel.entityDefinitions,
    entityDefinitionStoreBasedConfiguration as EntityDefinition,
    entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
  ],
};

// ================================================================================================
// Model + data validation groups (filesystem-driven)
// ================================================================================================

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");

const modelTestsToRun = buildModelValidationGroupsFromFilesystem({
  modelPath: join(assetsDir, "library_model"),
  dataPath: join(assetsDir, "library_data"),
  miroirMetaModel: miroirMetaModelForLibraryValidation,
  // Validated separately below with an extended fundamental schema (Feature 198).
  excludeEntityNames: ["MiroirTest"],
});

runModelValidationSuite({
  vitest,
  plan: buildModelValidationPlanFromGroups(modelTestsToRun),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-test-app_deployment-library",
});

// // ================================================================================================
// // Feature 198 — app-action validation against extended domainAction
// // ================================================================================================

// describe("extended schema requirement (199)", () => {
//   it("Library app-action tests still require extended schema (not static)", () => {
//     const staticSchema = resolveFundamentalSchemaForDeployment(
//       deployment_Library_DO_NO_USE.uuid,
//       defaultLibraryAppModel,
//       "static",
//     );
//     const extendedSchema = resolveFundamentalSchemaForDeployment(
//       deployment_Library_DO_NO_USE.uuid,
//       defaultLibraryAppModel,
//       "extended",
//     );

//     expect(staticSchema).not.toBe(extendedSchema);

//     const extendedDomainAction = (extendedSchema as any).definition.context.domainAction;
//     const lendBranch = extendedDomainAction.definition.find(
//       (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
//     );
//     expect(lendBranch).toBeDefined();

//     const staticDomainAction = (staticSchema as any).definition.context.domainAction;
//     const staticLendBranch = staticDomainAction.definition.find(
//       (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
//     );
//     expect(staticLendBranch).toBeUndefined();
//   }, 120_000);
// });

// function buildExtendedLibraryModelEnvironment(): MiroirModelEnvironment {
//   return {
//     ...libraryModelEnvironment,
//     miroirFundamentalJzodSchema: resolveFundamentalSchemaForDeployment(
//       deployment_Library_DO_NO_USE.uuid,
//       defaultLibraryAppModel,
//       "extended",
//     ),
//   };
// }

// describe("extended schema required — opt out of frozen mode (199)", () => {
//   const previousSchemaMode = process.env.MIROIR_SCHEMA_MODE;

//   beforeAll(() => {
//     process.env.MIROIR_SCHEMA_MODE = "runtime";
//   });

//   afterAll(() => {
//     if (previousSchemaMode === undefined) {
//       delete process.env.MIROIR_SCHEMA_MODE;
//     } else {
//       process.env.MIROIR_SCHEMA_MODE = previousSchemaMode;
//     }
//   });

//   describe("App-action validation (Feature 198)", () => {
//     const extendedLibraryModelEnvironment = buildExtendedLibraryModelEnvironment();

//     const domainActionSchema: JzodElement = {
//       type: "schemaReference",
//       definition: {
//         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
//         relativePath: "domainAction",
//       },
//     };
//     const actionTemplateSchema: JzodElement = {
//       type: "schemaReference",
//       definition: {
//         absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
//         relativePath: "actionTemplate",
//       },
//     };

//     it("lendDocument action validates against domainAction", () => {
//       const lendDocumentAction = {
//         actionType: "lendDocument",
//         endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
//         payload: {
//           user: "04c371ed-702d-4dd9-a06d-8a04eda5d24f",
//           book: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
//           startDate: "2024-01-01T00:00:00.000Z",
//         },
//       };

//       const result = jzodTypeCheck(
//         domainActionSchema,
//         lendDocumentAction,
//         [],
//         [],
//         extendedLibraryModelEnvironment,
//         {},
//       );

//       expect(result.status).toBe("ok");
//     });

//     it("template-form lendDocument validates against actionTemplate", () => {
//       const templateFormAction = {
//         // Keep discriminator literal so union branch selection remains deterministic.
//         actionType: "lendDocument",
//         endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
//         payload: {
//           user: { transformerType: "getFromParameters", interpolation: "build", referenceName: "user1Uuid" },
//           book: { transformerType: "getFromParameters", interpolation: "build", referenceName: "book1Uuid" },
//           startDate: { transformerType: "getFromParameters", interpolation: "build", referenceName: "lendStartDate" },
//         },
//       };

//       const result = jzodTypeCheck(
//         actionTemplateSchema,
//         templateFormAction,
//         [],
//         [],
//         extendedLibraryModelEnvironment,
//         {},
//       );

//       expect(result.status).toBe("ok");
//     });

//     it("runner_library MiroirTest validates against miroirTestDefinition schema", () => {
//       // The runner_library MiroirTest entity has definition.miroirTestType === "miroirTestSuite",
//       // whose miroirTests[] items are miroirTestForRunner entries that carry
//       // preRunnerCompositeActions typed as actionTemplate[].
//       // Those actions include lendDocument with transformer-form payload fields
//       // (getFromParameters). Validation succeeds only when:
//       //   (a) the extended actionTemplate (from extendedLibraryModelEnvironment) includes the
//       //       lendDocument carry-on branch, AND
//       //   (b) the Lending endpoint definition has canBeTemplate: true on user/book/startDate.
//       const miroirTestDefinitionSchema: JzodElement = {
//         type: "schemaReference",
//         definition: {
//           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
//           relativePath: "miroirTestDefinition",
//         },
//       };
//       const result = jzodTypeCheck(
//         miroirTestDefinitionSchema,
//         runnerLibraryTestJSON,
//         [],
//         [],
//         extendedLibraryModelEnvironment,
//         {},
//       );
//       expect(result.status).toBe("ok");
//     });
//   });
// });
