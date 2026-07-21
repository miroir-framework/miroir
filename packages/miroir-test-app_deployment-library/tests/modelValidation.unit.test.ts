/// <reference types="vite/client" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as vitest from "vitest";

import type {
  MetaModel
} from "miroir-core";
import {
  buildModelValidationPlanFromGroups,
  defaultMiroirModelEnvironment,
  runModelValidationSuite
} from "miroir-core";
import { buildModelValidationGroupsFromFilesystem } from "miroir-core/model-validation-fs";

// Feature 198 — runner_library MiroirTest instance

// Deployment info for model environment

// Library model (built from static assets)

import {
  defaultMiroirMetaModel
} from "miroir-test-app_deployment-miroir";

// ================================================================================================
// Model environments
// ================================================================================================

/**
 * Library model environment: used when validating library data instances (Author, Book, etc.)
 * so that currentModel reflects the library application model.
 */
// const libraryModelEnvironment: MiroirModelEnvironment = {
//   miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
//     deployment_Library_DO_NO_USE.uuid,
//     defaultLibraryAppModel,
//   ),
//   miroirMetaModel: defaultMiroirMetaModel,
//   endpointsByUuid: {},
//   deploymentUuid: deployment_Library_DO_NO_USE.uuid,
//   currentModel: defaultLibraryAppModel,
// };

/**
 * `defaultMiroirMetaModel` omits a few meta-entities that library assets still store
 * (StoreBasedConfiguration, Deployment / SelfApplicationDeploymentConfiguration).
 * Merge them so filesystem discovery covers the previous hardcoded suite.
 */
const miroirMetaModelForLibraryValidation: MetaModel = defaultMiroirMetaModel
// {
//   ...defaultMiroirMetaModel,
//   entities: [
//     ...defaultMiroirMetaModel.entities,
//     entityStoreBasedConfiguration as Entity,
//     entitySelfApplicationDeploymentConfiguration as Entity,
//   ],
//   entityDefinitions: [
//     ...defaultMiroirMetaModel.entityDefinitions,
//     entityDefinitionStoreBasedConfiguration as EntityDefinition,
//     entityDefinitionSelfApplicationDeploymentConfiguration as EntityDefinition,
//   ],
// };

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
