import { describe, expect, it } from "vitest";

import {
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  miroirFundamentalMlSchema,
} from "miroir-core";
import {
  resolveFunctionCallEnvironment,
  resolveFunctionCallFixture,
} from "../../src/5_tests/FunctionCallTestFixtures";

describe("FunctionCallTestFixtures (199 — frozen schema policy)", () => {
  it("defaultMetaModelEnvironment factory returns static schema", () => {
    const environment = resolveFunctionCallEnvironment("defaultMetaModelEnvironment");
    expect(environment).toBeDefined();
    expect(environment!.miroirFundamentalMlSchema).toBe(miroirFundamentalMlSchema);
    expect(environment!.miroirFundamentalMlSchema).toBe(
      defaultMetaModelEnvironment.miroirFundamentalMlSchema,
    );
  });

  it("defaultMiroirModelEnvironment factory returns static schema", () => {
    const environment = resolveFunctionCallEnvironment("defaultMiroirModelEnvironment");
    expect(environment).toBeDefined();
    expect(environment!.miroirFundamentalMlSchema).toBe(miroirFundamentalMlSchema);
    expect(environment!.miroirFundamentalMlSchema).toBe(
      defaultMiroirModelEnvironment.miroirFundamentalMlSchema,
    );
  });

  it("miroirFundamentalMlSchema fixture returns static schema", () => {
    const fixture = resolveFunctionCallFixture("miroirFundamentalMlSchema");
    expect(fixture).toBe(miroirFundamentalMlSchema);
  });
});
