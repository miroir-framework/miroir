/// <reference types="vite/client" />

import * as vitest from "vitest";

import {
  modelValidationSuite,
  defaultMiroirModelEnvironment,
  runModelValidationSuite,
  type Entity,
} from "@miroir-framework/core";

import { defaultMiroirMetaModel } from "../src/Model";

runModelValidationSuite({
  vitest,
  plan: modelValidationSuite(defaultMiroirMetaModel),
  modelEnv: defaultMiroirModelEnvironment,
  npmWorkspacePackage: "miroir-app-miroir",
  logFoundEntities: defaultMiroirMetaModel.entities.map((entity: Entity) => entity.name),
});
