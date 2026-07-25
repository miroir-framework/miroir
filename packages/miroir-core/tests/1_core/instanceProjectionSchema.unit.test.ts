import { describe, expect, it } from "vitest";

import {
  extractorByPrimaryKey,
  extractorInstancesByEntity,
  restPersistenceAction,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const PARENT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const APP = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const INSTANCE = "cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("214 Phase 1 — projection schema contract", () => {
  it("accepts attributes on extractorInstancesByEntity", () => {
    const parsed = extractorInstancesByEntity.safeParse({
      parentUuid: PARENT,
      extractorOrCombinerType: "extractorInstancesByEntity",
      attributes: ["name", "defaultLabel"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.attributes).toEqual(["name", "defaultLabel"]);
    }
  });

  it("accepts extractorInstancesByEntity without attributes (non-regression)", () => {
    const parsed = extractorInstancesByEntity.safeParse({
      parentUuid: PARENT,
      extractorOrCombinerType: "extractorInstancesByEntity",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts attributes on extractorByPrimaryKey", () => {
    const parsed = extractorByPrimaryKey.safeParse({
      parentUuid: PARENT,
      extractorOrCombinerType: "extractorByPrimaryKey",
      instanceUuid: INSTANCE,
      attributes: ["name"],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts attributes on RestPersistenceAction_read", () => {
    const parsed = restPersistenceAction.safeParse({
      actionType: "RestPersistenceAction_read",
      endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
      payload: {
        application: APP,
        section: "data",
        parentUuid: PARENT,
        attributes: ["name", "defaultLabel"],
      },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.actionType === "RestPersistenceAction_read") {
      expect(parsed.data.payload.attributes).toEqual(["name", "defaultLabel"]);
    }
  });

  it("accepts RestPersistenceAction_read without attributes (non-regression)", () => {
    const parsed = restPersistenceAction.safeParse({
      actionType: "RestPersistenceAction_read",
      endpoint: "a93598b3-19b6-42e8-828c-f02042d212d4",
      payload: {
        application: APP,
        section: "data",
        parentUuid: PARENT,
      },
    });
    expect(parsed.success).toBe(true);
  });
});
