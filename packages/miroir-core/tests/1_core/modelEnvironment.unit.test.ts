import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";

import {
  defaultMetaModelEnvironment,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  getMiroirFundamentalSchemaForDeployment,
} from "miroir-core";

describe("defaultMiroirModelEnvironment (Phase 1)", () => {
  it("miroirFundamentalJzodSchema equals getMiroirFundamentalSchemaForDeployment output", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema).toBe(
      getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
  });
});

describe("defaultMetaModelEnvironment (Phase 1)", () => {
  it("miroirFundamentalJzodSchema equals getMiroirFundamentalSchemaForDeployment output", () => {
    expect(defaultMetaModelEnvironment.miroirFundamentalJzodSchema).toBe(
      getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
  });
});
