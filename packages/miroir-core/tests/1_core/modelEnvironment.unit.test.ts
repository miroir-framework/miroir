import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";

import {
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalJzodSchema,
  resolveFundamentalSchemaForDeployment,
} from "miroir-core";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
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

describe("default environments use static schema (199)", () => {
  it("defaultMiroirModelEnvironment.miroirFundamentalJzodSchema is miroirFundamentalJzodSchema", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema).toBe(
      miroirFundamentalJzodSchema,
    );
  });

  it("defaultMetaModelEnvironment.miroirFundamentalJzodSchema is miroirFundamentalJzodSchema", () => {
    expect(defaultMetaModelEnvironment.miroirFundamentalJzodSchema).toBe(
      miroirFundamentalJzodSchema,
    );
  });

  it("default environment schema access completes in under 10ms", () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      void defaultMiroirModelEnvironment.miroirFundamentalJzodSchema;
      void defaultMetaModelEnvironment.miroirFundamentalJzodSchema;
    }
    expect(Date.now() - start).toBeLessThan(10);
  });

  it("static resolve matches default environment schema reference", () => {
    expect(
      resolveFundamentalSchemaForDeployment(
        deployment_Miroir.uuid,
        defaultMiroirMetaModel,
        "static",
      ),
    ).toBe(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema);
  });
});
