import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";

import {
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  getSchemaForDeployment,
} from "miroir-core";

describe("defaultMiroirModelEnvironment (Phase 1)", () => {
  it("miroirFundamentalJzodSchema equals getSchemaForDeployment output", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema).toBe(
      getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
  });
});
