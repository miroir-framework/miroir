/// <reference types="vite/client" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as vitest from "vitest";

import {
  buildModelValidationPlanFromGroups,
  defaultMiroirModelEnvironment,
  runModelValidationSuite,
} from "@miroir-framework/core";
import { buildModelValidationGroupsFromFilesystem } from "@miroir-framework/core/model-validation-fs";

import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";

// ================================================================================================
// Model + data validation groups (filesystem-driven)
// ================================================================================================

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");

const modelTestsToRun = buildModelValidationGroupsFromFilesystem({
  modelPath: join(assetsDir, "postgres_model"),
  dataPath: join(assetsDir, "postgres_data"),
  miroirMetaModel: defaultMiroirMetaModel,
});

runModelValidationSuite({
  vitest,
  plan: buildModelValidationPlanFromGroups(modelTestsToRun),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-example-postgres",
});
