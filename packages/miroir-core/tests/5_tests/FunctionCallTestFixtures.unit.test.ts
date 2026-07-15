import { describe, expect, it } from "vitest";

import {
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  miroirFundamentalJzodSchema,
} from "miroir-core";
import {
  resolveFunctionCallEnvironment,
  resolveFunctionCallFixture,
} from "../../src/5_tests/FunctionCallTestFixtures";

describe("FunctionCallTestFixtures (199 — frozen schema policy)", () => {
  it("defaultMetaModelEnvironment factory returns static schema", () => {
    const environment = resolveFunctionCallEnvironment("defaultMetaModelEnvironment");
    expect(environment).toBeDefined();
    expect(environment!.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    expect(environment!.miroirFundamentalJzodSchema).toBe(
      defaultMetaModelEnvironment.miroirFundamentalJzodSchema,
    );
  });

  it("defaultMiroirModelEnvironment factory returns static schema", () => {
    const environment = resolveFunctionCallEnvironment("defaultMiroirModelEnvironment");
    expect(environment).toBeDefined();
    expect(environment!.miroirFundamentalJzodSchema).toBe(miroirFundamentalJzodSchema);
    expect(environment!.miroirFundamentalJzodSchema).toBe(
      defaultMiroirModelEnvironment.miroirFundamentalJzodSchema,
    );
  });

  it("miroirFundamentalJzodSchema fixture returns static schema", () => {
    const fixture = resolveFunctionCallFixture("miroirFundamentalJzodSchema");
    expect(fixture).toBe(miroirFundamentalJzodSchema);
  });
});
