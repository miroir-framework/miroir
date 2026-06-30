import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  miroirFundamentalJzodSchema,
} from "miroir-core";
import { currentModelEnvironment } from "../src/4_services/localCache/Model.js";

describe("currentModelEnvironment (zustand, Phase 1)", () => {
  it("getSchemaForDeployment returns static schema (Phase 1 contract)", () => {
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
    expect(typeof currentModelEnvironment).toBe("function");
  });
});
