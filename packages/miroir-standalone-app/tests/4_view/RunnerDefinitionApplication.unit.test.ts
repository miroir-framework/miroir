import { describe, expect, it } from "vitest";

import { resolveRunnerDefinitionApplication } from "../../src/miroir-fwk/4_view/components/Runners/runnerDefinitionApplication.js";
import { runnerFreezeApplicationVersion } from "miroir-test-app_deployment-miroir";

const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_LEND_RUNNER = "cc853632-f158-43fa-b9ed-437c9c25f539";

describe("resolveRunnerDefinitionApplication", () => {
  it("uses page application for app-model runners (Library home)", () => {
    expect(resolveRunnerDefinitionApplication(LIBRARY_APP, LIBRARY_LEND_RUNNER)).toBe(
      LIBRARY_APP,
    );
  });

  it("uses Miroir for Miroir-data runners even when page application is Library", () => {
    expect(
      resolveRunnerDefinitionApplication(LIBRARY_APP, runnerFreezeApplicationVersion.uuid),
    ).toBe(MIROIR_APP);
  });

  it("uses page application when it is already Miroir", () => {
    expect(
      resolveRunnerDefinitionApplication(MIROIR_APP, runnerFreezeApplicationVersion.uuid),
    ).toBe(MIROIR_APP);
  });

  it("defaults to Miroir when page application is omitted", () => {
    expect(resolveRunnerDefinitionApplication()).toBe(MIROIR_APP);
  });
});
