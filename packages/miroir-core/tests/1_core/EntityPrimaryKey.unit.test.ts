import { describe, it, expect } from "vitest";

import { EntityInstance } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement";
import {
  resolveInstanceParentUuid,
  getEntityPrimaryKeyAttribute,
  getInstancePrimaryKeyValue,
  entityHasUuidPrimaryKey,
} from "../../src/1_core/EntityPrimaryKey";

// ##############################################################################################
describe("resolveInstanceParentUuid", () => {
  const parentUuidValue = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const payloadParentUuidValue = "11111111-2222-3333-4444-555555555555";

  // ###########################################################################################
  it("returns instance.parentUuid when present", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000001",
      parentUuid: parentUuidValue,
      parentName: "SomeEntity",
    };
    const result = resolveInstanceParentUuid(instance, payloadParentUuidValue);
    expect(result).toBe(parentUuidValue);
  });

  // ###########################################################################################
  it("falls back to payloadParentUuid when instance.parentUuid is absent", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000002",
      // no parentUuid
    };
    const result = resolveInstanceParentUuid(instance, payloadParentUuidValue);
    expect(result).toBe(payloadParentUuidValue);
  });

  // ###########################################################################################
  it("falls back to payloadParentUuid when instance.parentUuid is undefined", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000003",
      parentUuid: undefined,
    };
    const result = resolveInstanceParentUuid(instance, payloadParentUuidValue);
    expect(result).toBe(payloadParentUuidValue);
  });

  // ###########################################################################################
  it("returns Action2Error when both parentUuid sources are absent", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000004",
    };
    const result = resolveInstanceParentUuid(instance, undefined);
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorType).toBe("FailedToResolveParentUuid");
  });

  // ###########################################################################################
  it("returns Action2Error when both sources are empty string", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000005",
      parentUuid: "",
    };
    const result = resolveInstanceParentUuid(instance, "");
    expect(result).toBeInstanceOf(Action2Error);
  });

  // ###########################################################################################
  it("prefers instance.parentUuid over payloadParentUuid", () => {
    const instance: EntityInstance = {
      uuid: "00000000-0000-0000-0000-000000000006",
      parentUuid: parentUuidValue,
    };
    const result = resolveInstanceParentUuid(instance, payloadParentUuidValue);
    expect(result).toBe(parentUuidValue);
  });

  // ###########################################################################################
  it("works with instance cast from a plain object without parentUuid", () => {
    const instance = { uuid: "00000000-0000-0000-0000-000000000007", name: "plain" } as any as EntityInstance;
    const result = resolveInstanceParentUuid(instance, payloadParentUuidValue);
    expect(result).toBe(payloadParentUuidValue);
  });
});
