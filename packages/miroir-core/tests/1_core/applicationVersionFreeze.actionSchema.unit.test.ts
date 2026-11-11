/**
 * #216 Phase 5 — freezeApplicationVersion Action schema (Zod). #696: the planner gate is tested in
 * `@miroir-framework/versioning`.
 */
import { describe, expect, it } from "vitest";

import {
  domainAction,
  modelActionFreezeApplicationVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { FREEZE_APPLICATION_VERSION_ACTION_TYPE } from "../../src/1_core/versioning/versioningInterfaces.js";

const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";
const BOOK = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("216 Phase 5 — freezeApplicationVersion Action schema", () => {
  it("locks actionType constant", () => {
    expect(FREEZE_APPLICATION_VERSION_ACTION_TYPE).toBe("freezeApplicationVersion");
  });

  it("parses a valid freezeApplicationVersion ModelAction", () => {
    const action = {
      actionType: "freezeApplicationVersion" as const,
      endpoint: MODEL_ENDPOINT,
      payload: {
        application: APP_UUID,
        versionName: "V1",
        branch: BRANCH_UUID,
        description: "first freeze",
      },
    };
    expect(modelActionFreezeApplicationVersion.parse(action)).toMatchObject({
      actionType: "freezeApplicationVersion",
      payload: { versionName: "V1", application: APP_UUID },
    });
    expect(domainAction.parse(action).actionType).toBe("freezeApplicationVersion");
  });

  it("parses freezeApplicationVersion without optional description/branch", () => {
    const action = {
      actionType: "freezeApplicationVersion" as const,
      endpoint: MODEL_ENDPOINT,
      payload: {
        application: APP_UUID,
        versionName: "V1",
      },
    };
    expect(() => modelActionFreezeApplicationVersion.parse(action)).not.toThrow();
  });

  it("rejects missing versionName", () => {
    expect(() =>
      modelActionFreezeApplicationVersion.parse({
        actionType: "freezeApplicationVersion",
        endpoint: MODEL_ENDPOINT,
        payload: {
          application: APP_UUID,
        },
      }),
    ).toThrow();
  });

  it("rejects missing application", () => {
    expect(() =>
      modelActionFreezeApplicationVersion.parse({
        actionType: "freezeApplicationVersion",
        endpoint: MODEL_ENDPOINT,
        payload: {
          versionName: "V1",
        },
      }),
    ).toThrow();
  });

  it("rejects wrong endpoint", () => {
    expect(() =>
      modelActionFreezeApplicationVersion.parse({
        actionType: "freezeApplicationVersion",
        endpoint: "00000000-0000-4000-8000-000000000000",
        payload: {
          application: APP_UUID,
          versionName: "V1",
        },
      }),
    ).toThrow();
  });
});

