/**
 * #258 slice 1 — init params trace folder catalog → beforeEachTest → resetIntegTestbed.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as miroirCore from "miroir-core";
import { indexApplicationMiroirTestsByKey } from "miroir-core";
import { loadApplicationMiroirTestCatalog } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

import { appForTestTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";
import { libraryTestbedInitParams } from "../../src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.js";
import { beforeEachTest } from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";
import {
  composeUiIntegrationTestbedResetParams,
  uiIntegrationRunnerSuiteEntryFromDefinition,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

const applicationMiroirTestCatalogByKey = indexApplicationMiroirTestsByKey(
  loadApplicationMiroirTestCatalog(),
);

function runnerSuiteEntryFromFolders(suiteKey: string) {
  const catalogEntry = applicationMiroirTestCatalogByKey[suiteKey];
  if (!catalogEntry) {
    throw new Error(`Missing application MiroirTest suite "${suiteKey}"`);
  }
  const entry = uiIntegrationRunnerSuiteEntryFromDefinition(
    catalogEntry.suiteKey,
    catalogEntry.suiteDefinition,
  );
  if (!entry) {
    throw new Error(`Suite "${suiteKey}" is not a UI runner/action suite`);
  }
  return entry;
}

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
    const entry = runnerSuiteEntryFromFolders("runner_lend_document");
    const composed = composeUiIntegrationTestbedResetParams(entry);
    expect(composed?.testbedInitApplicationParameters).toBe(libraryTestbedInitParams);
  });

  it("composeUiIntegrationTestbedResetParams preserves appForTest registry init by reference", () => {
    const entry = runnerSuiteEntryFromFolders("runner_freeze_application_version");
    const composed = composeUiIntegrationTestbedResetParams(entry);
    expect(composed?.testbedInitApplicationParameters).toBe(appForTestTestbedInitParams);
  });

  it("beforeEachTest forwards integTestbedResetParams.testbedInitApplicationParameters to resetIntegTestbed", async () => {
    const resetIntegTestbedMock = vi
      .spyOn(miroirCore, "resetIntegTestbed")
      .mockResolvedValue(undefined);
    const entry = runnerSuiteEntryFromFolders("runner_lend_document");
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
