/// <reference types="vite/client" />

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as vitest from "vitest";

import type { MetaModel } from "miroir-core";
import {
  buildModelValidationPlanFromGroups,
  defaultMiroirModelEnvironment,
  runModelValidationSuite,
} from "miroir-core";
import { buildModelValidationGroupsFromFilesystem } from "miroir-core/model-validation-fs";

import { defaultMiroirMetaModel } from "miroir-app-miroir";

const miroirMetaModelForMetaValidation: MetaModel = defaultMiroirMetaModel;

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");

const modelTestsToRun = buildModelValidationGroupsFromFilesystem({
  modelPath: join(assetsDir, "meta_model"),
  dataPath: join(assetsDir, "meta_data"),
  miroirMetaModel: miroirMetaModelForMetaValidation,
});

runModelValidationSuite({
  vitest,
  plan: buildModelValidationPlanFromGroups(modelTestsToRun),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-app-meta",
});
