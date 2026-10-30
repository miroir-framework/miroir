import { describe, expect, it } from "vitest";

import {
  composeIntegTestbedResetParams,
  rebindIntegTestbedResetParamsToApplication,
  type IntegTestbedResetParams,
} from "../../src/5_tests/composeIntegTestbedResetParams.js";
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

(shouldRun ? describe : describe.skip)("rebindIntegTestbedResetParamsToApplication (#588)", () => {
  const resetParams: IntegTestbedResetParams = {
    testbedModel: {
      entities: [{ uuid: "e1", selfApplication: "app-uuid", name: "Book" }],
    } as unknown as IntegTestbedResetParams["testbedModel"],
    testbedEntitiesAndInstances: [
      { entity: { uuid: "e1", selfApplication: "app-uuid" }, instances: [{ uuid: "i1", name: "app-uuid-like" }] },
    ] as unknown as IntegTestbedResetParams["testbedEntitiesAndInstances"],
    testbedInitApplicationParameters: {
      dataStoreType: "app",
      selfApplication: { uuid: "app-uuid", name: "App" } as InitApplicationParameters["selfApplication"],
      applicationModelBranch: {
        uuid: "branch",
        selfApplication: "app-uuid",
      } as InitApplicationParameters["applicationModelBranch"],
      applicationVersion: {
        uuid: "version",
        selfApplication: "app-uuid",
      } as InitApplicationParameters["applicationVersion"],
    },
  };

  it("returns the params unchanged when they already target the application", () => {
    expect(rebindIntegTestbedResetParamsToApplication(resetParams, "app-uuid")).toBe(resetParams);
  });

  it("gives the seeded SelfApplication, its branch, version and Entities the run target uuid", () => {
    const rebound = rebindIntegTestbedResetParamsToApplication(resetParams, "ephemeral-uuid");
    const init = rebound.testbedInitApplicationParameters;
    expect(init.selfApplication.uuid).toBe("ephemeral-uuid");
    expect(init.selfApplication.name).toBe("App");
    expect((init.applicationModelBranch as { selfApplication: string }).selfApplication).toBe("ephemeral-uuid");
    expect((init.applicationVersion as { selfApplication: string }).selfApplication).toBe("ephemeral-uuid");
    expect(rebound.testbedModel).toEqual({
      entities: [{ uuid: "e1", selfApplication: "ephemeral-uuid", name: "Book" }],
    });
    expect(rebound.testbedEntitiesAndInstances).toEqual([
      { entity: { uuid: "e1", selfApplication: "ephemeral-uuid" }, instances: [{ uuid: "i1", name: "app-uuid-like" }] },
    ]);
  });

  it("does not mutate its input", () => {
    rebindIntegTestbedResetParamsToApplication(resetParams, "ephemeral-uuid");
    expect(resetParams.testbedInitApplicationParameters.selfApplication.uuid).toBe("app-uuid");
  });
});
