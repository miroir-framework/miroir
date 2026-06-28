import { describe, expect, it } from "vitest";

import { miroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  isRunnerTestRunTargetUuid,
  resolveRunnerTestRunTarget,
  type RunnerTestRunTarget,
} from "../../src/5_tests/RunnerTestRunTarget";

const PINNED_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const PINNED_DEPLOYMENT_UUID = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const OVERRIDE_APPLICATION_UUID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const OVERRIDE_DEPLOYMENT_UUID = "11111111-2222-4333-8444-555555555555";

function sequentialUuidFactory(): () => string {
  let counter = 0;
  return () => {
    const suffix = String(counter++).padStart(12, "0");
    return `00000000-0000-4000-8000-${suffix}`;
  };
}

describe("resolveRunnerTestRunTarget (R6-B)", () => {
  it("generates uuid v4 run target when suite has no runTarget and no override", () => {
    const generateUuid = sequentialUuidFactory();

    const resolved = resolveRunnerTestRunTarget({
      suite: { miroirTestLabel: "runner.library" },
      generateUuid,
    });

    expect(resolved.applicationName).toBe("Library");
    expect(resolved.applicationUuid).toBe("00000000-0000-4000-8000-000000000000");
    expect(resolved.deploymentUuid).toBe("00000000-0000-4000-8000-000000000001");
    expect(isRunnerTestRunTargetUuid(resolved.applicationUuid)).toBe(true);
    expect(isRunnerTestRunTargetUuid(resolved.deploymentUuid)).toBe(true);
  });

  it("uses suite runTarget when all fields are pinned", () => {
    const generateUuid = sequentialUuidFactory();

    const resolved = resolveRunnerTestRunTarget({
      suite: {
        miroirTestLabel: "runner.library",
        runTarget: {
          applicationUuid: PINNED_APPLICATION_UUID,
          applicationName: "Library",
          deploymentUuid: PINNED_DEPLOYMENT_UUID,
        },
      },
      generateUuid,
    });

    expect(resolved).toEqual({
      applicationUuid: PINNED_APPLICATION_UUID,
      applicationName: "Library",
      deploymentUuid: PINNED_DEPLOYMENT_UUID,
    } satisfies RunnerTestRunTarget);
  });

  it("caller override wins over suite runTarget", () => {
    const resolved = resolveRunnerTestRunTarget({
      suite: {
        miroirTestLabel: "runner.library",
        runTarget: {
          applicationUuid: PINNED_APPLICATION_UUID,
          applicationName: "Library",
          deploymentUuid: PINNED_DEPLOYMENT_UUID,
        },
      },
      callerOverride: {
        applicationUuid: OVERRIDE_APPLICATION_UUID,
        deploymentUuid: OVERRIDE_DEPLOYMENT_UUID,
        applicationName: "OverrideApp",
      },
    });

    expect(resolved).toEqual({
      applicationUuid: OVERRIDE_APPLICATION_UUID,
      applicationName: "OverrideApp",
      deploymentUuid: OVERRIDE_DEPLOYMENT_UUID,
    });
  });

  it("caller override alone supplies run target without suite pins", () => {
    const resolved = resolveRunnerTestRunTarget({
      suite: { miroirTestLabel: "runner.library" },
      callerOverride: {
        applicationUuid: OVERRIDE_APPLICATION_UUID,
        applicationName: "OverrideApp",
        deploymentUuid: OVERRIDE_DEPLOYMENT_UUID,
      },
      generateUuid: sequentialUuidFactory(),
    });

    expect(resolved).toEqual({
      applicationUuid: OVERRIDE_APPLICATION_UUID,
      applicationName: "OverrideApp",
      deploymentUuid: OVERRIDE_DEPLOYMENT_UUID,
    });
  });

  it("miroirTestSuite schema accepts optional runTarget", () => {
    const parsed = miroirTestSuite.parse({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "runner.library",
      runTarget: {
        applicationUuid: PINNED_APPLICATION_UUID,
        applicationName: "Library",
        deploymentUuid: PINNED_DEPLOYMENT_UUID,
      },
      miroirTests: [],
    });

    expect(parsed.runTarget).toEqual({
      applicationUuid: PINNED_APPLICATION_UUID,
      applicationName: "Library",
      deploymentUuid: PINNED_DEPLOYMENT_UUID,
    });
  });
});
