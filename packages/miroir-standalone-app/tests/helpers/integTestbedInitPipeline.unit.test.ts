/**
 * #258 slice 1 — init params trace registry → beforeEachTest → resetIntegTestbed.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as miroirCore from "miroir-core";

import {
  composeUiIntegrationTestbedResetParams,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";
import { appForTestTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";
import { libraryTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";
import { beforeEachTest } from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "integTestbedInitPipeline" ||
  RUN_TEST === "integTestbedInitPipeline.unit.test";

(shouldRun ? describe : describe.skip)("integ testbed init pipeline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("composeUiIntegrationTestbedResetParams preserves Library registry init by reference", () => {
    const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document;
    const composed = composeUiIntegrationTestbedResetParams(entry);
    expect(composed?.testbedInitApplicationParameters).toBe(libraryTestbedInitParams);
  });

  it("composeUiIntegrationTestbedResetParams preserves appForTest registry init by reference", () => {
    const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_freeze_application_version;
    const composed = composeUiIntegrationTestbedResetParams(entry);
    expect(composed?.testbedInitApplicationParameters).toBe(appForTestTestbedInitParams);
  });

  it("beforeEachTest forwards integTestbedResetParams.testbedInitApplicationParameters to resetIntegTestbed", async () => {
    const resetIntegTestbedMock = vi
      .spyOn(miroirCore, "resetIntegTestbed")
      .mockResolvedValue(undefined);
    const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY.runner_lend_document;
    const composed = composeUiIntegrationTestbedResetParams(entry);
    expect(composed).toBeDefined();

    await beforeEachTest({} as never, {} as never, undefined, {
      integTestbedResetParams: composed,
    });

    expect(resetIntegTestbedMock).toHaveBeenCalledTimes(1);
    expect(resetIntegTestbedMock.mock.calls[0][0].testbedInitApplicationParameters).toBe(
      libraryTestbedInitParams,
    );
  });
});
