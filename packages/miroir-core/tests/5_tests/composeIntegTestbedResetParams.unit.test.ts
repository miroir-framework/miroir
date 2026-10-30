import { describe, expect, it } from "vitest";

import {
  composeIntegTestbedResetParams,
  remapIntegTestbedResetParamsForRunTarget,
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

(shouldRun ? describe : describe.skip)("remapIntegTestbedResetParamsForRunTarget (#588)", () => {
  const resetParams: IntegTestbedResetParams = {
    testbedModel: {
      applicationUuid: "app-uuid",
      applicationName: "App",
      entities: [{ uuid: "e1", parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", selfApplication: "app-uuid", name: "Book" }],
    } as unknown as IntegTestbedResetParams["testbedModel"],
    testbedEntitiesAndInstances: [
      {
        entity: { uuid: "e1", selfApplication: "app-uuid" },
        instances: [{ uuid: "i1", deployment: "deployment-uuid", createdAt: new Date(0) }],
      },
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
  const ephemeral = { applicationUuid: "ephemeral-app", applicationName: "App", deploymentUuid: "ephemeral-deployment" };

  it("returns the params unchanged on the canonical run target", () => {
    const pinned = { ...ephemeral, applicationUuid: "app-uuid", deploymentUuid: "deployment-uuid" };
    expect(remapIntegTestbedResetParamsForRunTarget(resetParams, "app-uuid", "deployment-uuid", pinned)).toBe(
      resetParams,
    );
  });

  it("gives the seeded SelfApplication, its branch and version the run target uuid", () => {
    const init = remapIntegTestbedResetParamsForRunTarget(resetParams, "app-uuid", "deployment-uuid", ephemeral)
      .testbedInitApplicationParameters;
    expect(init.selfApplication).toEqual({ uuid: "ephemeral-app", name: "App" });
    expect((init.applicationModelBranch as { selfApplication: string }).selfApplication).toBe("ephemeral-app");
    expect((init.applicationVersion as { selfApplication: string }).selfApplication).toBe("ephemeral-app");
  });

  it("moves the model and instances to the run target application and deployment", () => {
    const remapped = remapIntegTestbedResetParamsForRunTarget(resetParams, "app-uuid", "deployment-uuid", ephemeral);
    expect((remapped.testbedModel as { entities: { selfApplication: string }[] }).entities[0].selfApplication).toBe(
      "ephemeral-app",
    );
    expect(remapped.testbedEntitiesAndInstances).toEqual([
      {
        entity: { uuid: "e1", selfApplication: "ephemeral-app" },
        instances: [{ uuid: "i1", deployment: "ephemeral-deployment", createdAt: new Date(0) }],
      },
    ]);
  });

  it("does not mutate its input", () => {
    remapIntegTestbedResetParamsForRunTarget(resetParams, "app-uuid", "deployment-uuid", ephemeral);
    expect(resetParams.testbedInitApplicationParameters.selfApplication.uuid).toBe("app-uuid");
  });
});
