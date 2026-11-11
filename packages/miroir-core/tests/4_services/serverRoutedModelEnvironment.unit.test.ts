/**
 * #696: the model environment the server hands a server-routed freeze. Miroir's model is bundled in
 * `ServerModelEnvironments`, which would miss its saved changes: the server passes nothing, and the
 * DomainController plans against its local cache, loaded from the stores.
 * ```bash
 * RUN_TEST=serverRoutedModelEnvironment npm run testByFile -w @miroir-framework/core -- serverRoutedModelEnvironment
 * ```
 */
import { describe, expect, it } from "vitest";

import type { PersistenceStoreControllerManagerInterface } from "../../src/0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import { serverRoutedModelEnvironment } from "../../src/4_services/RestServer";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("serverRoutedModelEnvironment");

const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const OTHER_APPLICATION = "eef01001-0001-4000-8000-000000000001";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

/** No store is open: any read of one fails the test. */
const noStores = {
  getPersistenceStoreController: () => undefined,
} as unknown as PersistenceStoreControllerManagerInterface;

function freeze(application: string) {
  return {
    actionType: "freezeApplicationVersion",
    endpoint: MODEL_ENDPOINT,
    payload: { application, versionName: "v" },
  };
}

describe.runIf(runThis)("serverRoutedModelEnvironment", () => {
  it("passes no environment for a freeze of Miroir, whose stored model the local cache holds", async () => {
    expect(
      await serverRoutedModelEnvironment(freeze(MIROIR_APPLICATION), noStores, { [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT }),
    ).toBeUndefined();
  });

  it("passes no environment for an application without an open store", async () => {
    expect(await serverRoutedModelEnvironment(freeze(OTHER_APPLICATION), noStores, {})).toBeUndefined();
  });

  it("passes no environment for an action that is not a server-routed model action", async () => {
    expect(
      await serverRoutedModelEnvironment(
        { actionType: "gitAction_status", endpoint: "x", payload: { application: OTHER_APPLICATION } },
        noStores,
        {},
      ),
    ).toBeUndefined();
  });
});
