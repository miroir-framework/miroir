/// <reference types="vite/client" />

import * as vitest from "vitest";

import {
  buildModelValidationPlanFromMetaModel,
  defaultMiroirModelEnvironment,
  registerModelValidationSuites,
} from "miroir-core";

import {
  defaultMiroirMetaModel,
  defaultMiroirMetaModelEntityNameToAttributeName,
} from "../src/Model";

registerModelValidationSuites({
  vitest,
  plan: buildModelValidationPlanFromMetaModel(
    defaultMiroirMetaModel,
    defaultMiroirMetaModelEntityNameToAttributeName,
  ),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-test-app_deployment-miroir",
  logFoundEntities: defaultMiroirMetaModel.entities.map((entity) => entity.name),
});
