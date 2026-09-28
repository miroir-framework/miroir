import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-app-admin";

import {
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalMlSchema,
  resolveFundamentalSchemaForDeployment,
} from "miroir-core";

import { defaultMiroirMetaModel } from "miroir-app-miroir";
describe("defaultMiroirModelEnvironment (Phase 1)", () => {
  it("miroirFundamentalMlSchema equals getMiroirFundamentalSchemaForDeployment output", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalMlSchema).toBe(
      getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
  });
});

describe("defaultMetaModelEnvironment (Phase 1)", () => {
  it("miroirFundamentalMlSchema equals getMiroirFundamentalSchemaForDeployment output", () => {
    expect(defaultMetaModelEnvironment.miroirFundamentalMlSchema).toBe(
      getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel),
    );
  });
});

describe("default environments use static schema (199)", () => {
  it("defaultMiroirModelEnvironment.miroirFundamentalMlSchema is miroirFundamentalMlSchema", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalMlSchema).toBe(
      miroirFundamentalMlSchema,
    );
  });

  it("defaultMetaModelEnvironment.miroirFundamentalMlSchema is miroirFundamentalMlSchema", () => {
    expect(defaultMetaModelEnvironment.miroirFundamentalMlSchema).toBe(
      miroirFundamentalMlSchema,
    );
  });

  it("default environment schema access completes in under 10ms", () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      void defaultMiroirModelEnvironment.miroirFundamentalMlSchema;
      void defaultMetaModelEnvironment.miroirFundamentalMlSchema;
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
    ).toBe(defaultMiroirModelEnvironment.miroirFundamentalMlSchema);
  });
});
