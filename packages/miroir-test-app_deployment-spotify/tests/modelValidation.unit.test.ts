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

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

const miroirMetaModelForSpotifyValidation: MetaModel = defaultMiroirMetaModel;

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");

const modelTestsToRun = buildModelValidationGroupsFromFilesystem({
  modelPath: join(assetsDir, "spotify_model"),
  dataPath: join(assetsDir, "spotify_data"),
  miroirMetaModel: miroirMetaModelForSpotifyValidation,
});

runModelValidationSuite({
  vitest,
  plan: buildModelValidationPlanFromGroups(modelTestsToRun),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-test-app_deployment-spotify",
});
