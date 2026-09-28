/// <reference types="vite/client" />

import * as vitest from "vitest";

import {
  modelValidationSuite,
  defaultMiroirModelEnvironment,
  runModelValidationSuite,
  type Entity,
} from "miroir-core";

import {
  defaultMiroirMetaModel,
  defaultMiroirMetaModelEntityNameToAttributeName,
} from "../src/Model";

runModelValidationSuite({
  vitest,
  plan: modelValidationSuite(
    defaultMiroirMetaModel,
    defaultMiroirMetaModelEntityNameToAttributeName,
  ),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-app-miroir",
  logFoundEntities: defaultMiroirMetaModel.entities.map((entity: Entity) => entity.name),
});
