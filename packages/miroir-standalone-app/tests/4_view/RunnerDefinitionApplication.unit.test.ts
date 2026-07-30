import { describe, expect, it } from "vitest";

import { resolveRunnerDefinitionApplication } from "../../src/miroir-fwk/4_view/components/Runners/runnerDefinitionApplication.js";

const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";

describe("resolveRunnerDefinitionApplication (#225 Versioning runner load)", () => {
  it("always resolves to Miroir even when the page application is Library", () => {
    expect(resolveRunnerDefinitionApplication(LIBRARY_APP)).toBe(MIROIR_APP);
  });

  it("resolves to Miroir when page application is already Miroir", () => {
    expect(resolveRunnerDefinitionApplication(MIROIR_APP)).toBe(MIROIR_APP);
  });

  it("resolves to Miroir when page application is omitted", () => {
    expect(resolveRunnerDefinitionApplication()).toBe(MIROIR_APP);
  });
});
