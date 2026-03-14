import { describe, it, expect } from "vitest";

import { EntityInstance } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement";
import {
  resolveInstanceParentUuid,
  getEntityPrimaryKeyAttribute,
  getEntityPrimaryKeyAttributes,
  getInstancePrimaryKeyValue,
  entityHasUuidPrimaryKey,
  entityHasCompositePrimaryKey,
  serializeCompositeKeyValue,
  parseCompositeKeyValue,
  getForeignKeyValue,
  instanceMatchesForeignKey,
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

// ##############################################################################################
describe("composite PK helpers", () => {
  const singlePkEntityDef = { idAttribute: "code" } as any;
  const compositePkEntityDef = { idAttribute: ["table_schema", "table_name", "column_name"] } as any;
  const defaultPkEntityDef = {} as any; // no idAttribute → defaults to "uuid"

  // ###########################################################################################
  describe("getEntityPrimaryKeyAttribute", () => {
    it("returns single string for single-attribute PK", () => {
      expect(getEntityPrimaryKeyAttribute(singlePkEntityDef)).toBe("code");
    });
    it("returns string[] for composite PK", () => {
      expect(getEntityPrimaryKeyAttribute(compositePkEntityDef)).toEqual(["table_schema", "table_name", "column_name"]);
    });
    it("returns 'uuid' when idAttribute is not set", () => {
      expect(getEntityPrimaryKeyAttribute(defaultPkEntityDef)).toBe("uuid");
    });
  });

  // ###########################################################################################
  describe("getEntityPrimaryKeyAttributes", () => {
    it("wraps single-attribute PK in an array", () => {
      expect(getEntityPrimaryKeyAttributes(singlePkEntityDef)).toEqual(["code"]);
    });
    it("returns array as-is for composite PK", () => {
      expect(getEntityPrimaryKeyAttributes(compositePkEntityDef)).toEqual(["table_schema", "table_name", "column_name"]);
    });
  });

  // ###########################################################################################
  describe("entityHasCompositePrimaryKey / entityHasUuidPrimaryKey", () => {
    it("detects composite PK", () => {
      expect(entityHasCompositePrimaryKey(compositePkEntityDef)).toBe(true);
      expect(entityHasCompositePrimaryKey(singlePkEntityDef)).toBe(false);
      expect(entityHasCompositePrimaryKey(defaultPkEntityDef)).toBe(false);
    });
    it("detects uuid PK", () => {
      expect(entityHasUuidPrimaryKey(defaultPkEntityDef)).toBe(true);
      expect(entityHasUuidPrimaryKey(singlePkEntityDef)).toBe(false);
    });
  });

  // ###########################################################################################
  describe("serializeCompositeKeyValue / parseCompositeKeyValue round-trip", () => {
    it("single-attribute: returns plain string value", () => {
      const instance = { code: 42 } as any;
      const serialized = serializeCompositeKeyValue(["code"], instance);
      expect(serialized).toBe("42");
      const parsed = parseCompositeKeyValue(["code"], serialized);
      expect(parsed).toEqual({ code: "42" });
    });

    it("composite: joins with | separator", () => {
      const instance = { table_schema: "public", table_name: "users", column_name: "id" } as any;
      const serialized = serializeCompositeKeyValue(["table_schema", "table_name", "column_name"], instance);
      expect(serialized).toBe("public|users|id");
      const parsed = parseCompositeKeyValue(["table_schema", "table_name", "column_name"], serialized);
      expect(parsed).toEqual({ table_schema: "public", table_name: "users", column_name: "id" });
    });

    it("escapes | in values", () => {
      const instance = { a: "val|ue", b: "normal" } as any;
      const serialized = serializeCompositeKeyValue(["a", "b"], instance);
      expect(serialized).toContain("\\|");
      const parsed = parseCompositeKeyValue(["a", "b"], serialized);
      expect(parsed).toEqual({ a: "val|ue", b: "normal" });
    });

    it("escapes backslash in values", () => {
      const instance = { a: "val\\ue", b: "ok" } as any;
      const serialized = serializeCompositeKeyValue(["a", "b"], instance);
      const parsed = parseCompositeKeyValue(["a", "b"], serialized);
      expect(parsed).toEqual({ a: "val\\ue", b: "ok" });
    });

    it("handles empty string values", () => {
      const instance = { a: "", b: "x" } as any;
      const serialized = serializeCompositeKeyValue(["a", "b"], instance);
      expect(serialized).toBe("|x");
      const parsed = parseCompositeKeyValue(["a", "b"], serialized);
      expect(parsed).toEqual({ a: "", b: "x" });
    });
  });

  // ###########################################################################################
  describe("getInstancePrimaryKeyValue", () => {
    it("returns uuid for default PK", () => {
      const instance = { uuid: "abc-123" } as any;
      expect(getInstancePrimaryKeyValue(defaultPkEntityDef, instance)).toBe("abc-123");
    });

    it("returns serialized composite key", () => {
      const instance = { table_schema: "public", table_name: "users", column_name: "id" } as any;
      expect(getInstancePrimaryKeyValue(compositePkEntityDef, instance)).toBe("public|users|id");
    });
  });
});

// ##############################################################################################
describe("FK join helpers", () => {
  // ###########################################################################################
  describe("getForeignKeyValue", () => {
    it("returns single attribute value for string FK", () => {
      const ref = { publisherUuid: "pub-123", name: "My Book" };
      expect(getForeignKeyValue("publisherUuid", ref)).toBe("pub-123");
    });

    it("returns serialized composite key for array FK", () => {
      const ref = { fk_schema: "public", fk_table: "users", fk_col: "id" };
      const result = getForeignKeyValue(["fk_schema", "fk_table", "fk_col"], ref);
      expect(result).toBe("public|users|id");
    });

    it("returns undefined when any FK attribute is null/undefined (single)", () => {
      const ref = { other: "val" };
      expect(getForeignKeyValue("missing", ref)).toBeUndefined();
    });

    it("returns undefined when any FK attribute is null/undefined (composite)", () => {
      const ref = { fk_schema: "public", fk_col: "id" }; // missing fk_table
      expect(getForeignKeyValue(["fk_schema", "fk_table", "fk_col"], ref)).toBeUndefined();
    });
  });

  // ###########################################################################################
  describe("instanceMatchesForeignKey", () => {
    it("matches single attribute FK", () => {
      const instance = { publisherUuid: "pub-123", name: "Book" };
      expect(instanceMatchesForeignKey("publisherUuid", instance, "pub-123")).toBe(true);
      expect(instanceMatchesForeignKey("publisherUuid", instance, "pub-999")).toBe(false);
    });

    it("matches composite FK", () => {
      const instance = { fk_schema: "public", fk_table: "users", fk_col: "id", name: "col" };
      expect(instanceMatchesForeignKey(["fk_schema", "fk_table", "fk_col"], instance, "public|users|id")).toBe(true);
      expect(instanceMatchesForeignKey(["fk_schema", "fk_table", "fk_col"], instance, "public|users|name")).toBe(false);
    });
  });
});
