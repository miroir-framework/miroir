/**
 * #487: the self-test verdict is `failed`, with an error or the failing tests, whenever
 * the run cannot vouch for the client: no MiroirTest matched the tags, the boot failed, a test
 * failed, or authentication is on. `runSelfTest` never throws.
 *
 * Run:
 *   npm run testByFile -w miroir-standalone-app -- selfTestVerdict.integ
 */
import { describe, expect, it } from "vitest";

import type { MiroirConfigClient, MiroirTestDefinition } from "miroir-core";
import { miroirTest_tr_menuBuild } from "miroir-app-miroir";
import { deployment_Admin } from "miroir-app-admin";

import { runUnitMiroirTestBatch } from "../../../src/miroir-fwk/4-tests/miroirTestBatch.js";
import {
  runSelfTest,
  SELF_TEST_NEEDS_AUTHENTICATION_OFF,
} from "../../../src/miroir-fwk/4-tests/selfTest/runSelfTest.js";
import { computeSelfTestResult } from "../../../src/miroir-fwk/4-tests/selfTest/selfTestResult.js";
import { bootSelfTestPlatform, miroirActivityTracker } from "./selfTestPlatform.js";

describe("self-test verdict (#487)", () => {
  it("fails when no MiroirTest carries the tags", async () => {
    const { domainController, miroirConfig } = await bootSelfTestPlatform({ enabled: true, tags: ["no-such-tag"] });
    const result = await runSelfTest({ domainController, miroirConfig, tracker: miroirActivityTracker });
    expect(result.verdict).toBe("failed");
    expect(result.counts?.tests).toBe(0);
    expect(result.error).toBe("no MiroirTest ran for tags no-such-tag");
  }, 300000);

  it("fails with the boot error when the configuration has no Admin deployment", async () => {
    const { domainController, miroirConfig } = await bootSelfTestPlatform();
    if (!miroirConfig.client.emulateServer) {
      throw new Error("the self-test platform emulates its server");
    }
    const { [deployment_Admin.uuid]: _admin, ...withoutAdmin } = miroirConfig.client.deploymentStorageConfig;
    const brokenConfig: MiroirConfigClient = {
      ...miroirConfig,
      client: { ...miroirConfig.client, deploymentStorageConfig: withoutAdmin },
    };
    const result = await runSelfTest({ domainController, miroirConfig: brokenConfig, tracker: miroirActivityTracker });
    expect(result.verdict).toBe("failed");
    expect(result.error).toContain("no configuration for Admin selfApplication Deployment");
    expect(result.counts).toBeUndefined();
  }, 300000);

  it("fails, naming the suite and the test, when a test fails", async () => {
    // The only fixture of the plan: tr.menuBuild with a wrong expected value. The miroir app has no
    // failing MiroirTest to import, and adding one to its assets would break its own runs.
    const failingMenuBuild = structuredClone(miroirTest_tr_menuBuild) as MiroirTestDefinition;
    (failingMenuBuild.definition as any).miroirTests[0].expectedValue = { wrong: true };

    const startedAt = new Date();
    const resultsBySuiteKey = await runUnitMiroirTestBatch({
      miroirTests: [failingMenuBuild],
      tracker: miroirActivityTracker,
      includeComponentTests: false,
    });
    const result = computeSelfTestResult(resultsBySuiteKey, {
      environment: "test-filesystem",
      tags: ["unit"],
      startedAt,
      endedAt: new Date(),
    });

    expect(result.verdict).toBe("failed");
    expect(result.counts).toMatchObject({ suites: 1, failed: 1 });
    expect(result.failures).toEqual([
      {
        suiteKey: "tr.menuBuild",
        testPath: ["tr.menuBuild", "menu can be built from parts"],
        failedAssertions: ["menu can be built from parts"],
      },
    ]);
  });

  it("fails without loading anything when authentication is on", async () => {
    const { domainController, miroirConfig } = await bootSelfTestPlatform();
    const result = await runSelfTest({
      domainController,
      miroirConfig,
      tracker: miroirActivityTracker,
      authenticationEnabled: true,
    });
    expect(result.verdict).toBe("failed");
    expect(result.error).toBe(SELF_TEST_NEEDS_AUTHENTICATION_OFF);
    expect(Object.keys(domainController.getLocalCache().getDomainState())).toEqual([]);
  }, 300000);
});
