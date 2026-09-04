import { describe, expect, it } from "vitest";

import { composeIntegTestbedResetParams } from "../../src/5_tests/composeIntegTestbedResetParams.js";
import type { InitApplicationParameters } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "composeIntegTestbedResetParams" ||
  RUN_TEST === "composeIntegTestbedResetParams.unit.test";

const init: InitApplicationParameters = {
  dataStoreType: "app",
  selfApplication: { uuid: "app-uuid", name: "App" } as InitApplicationParameters["selfApplication"],
  applicationModelBranch: { uuid: "branch" } as InitApplicationParameters["applicationModelBranch"],
  applicationVersion: { uuid: "version" } as InitApplicationParameters["applicationVersion"],
};

(shouldRun ? describe : describe.skip)("composeIntegTestbedResetParams", () => {
  it("merges playfield seed and init without mutating inputs", () => {
    const playfieldSeed = {
      testbedModel: { applicationUuid: "lib", applicationName: "Library" },
      testbedEntitiesAndInstances: [{ entity: { uuid: "e1" }, instances: [] }],
    };
    const composed = composeIntegTestbedResetParams(playfieldSeed, init);
    expect(composed.testbedInitApplicationParameters).toBe(init);
    expect(composed.testbedModel).toBe(playfieldSeed.testbedModel);
    expect(composed.testbedEntitiesAndInstances).toBe(playfieldSeed.testbedEntitiesAndInstances);
  });
});
