import { describe, expect, it } from "vitest";
import { DataTypes } from "sequelize";

import type { Entity } from "miroir-core";

import {
  fromMiroirPresentModelToSequelizeEntityDefinition,
  getBigintAttributes,
  reviveBigintAttributes,
} from "../src/utils.js";

// #48: ML bigint attributes map to int8 columns and come back from postgres as BigInt values
const counterEntity = {
  uuid: "8d2b6a4e-1c3f-4e5a-9b7d-2f6e8a0c4b13",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  name: "Counter",
  mlSchema: {
    type: "object",
    definition: {
      uuid: { type: "uuid" },
      parentUuid: { type: "uuid" },
      count: { type: "bigint" },
      previousCount: { type: "bigint", optional: true },
      label: { type: "string" },
    },
  },
} as unknown as Entity;

describe("bigint attributes", () => {
  it("maps a bigint attribute to a BIGINT column, not varchar", () => {
    const attributes = fromMiroirPresentModelToSequelizeEntityDefinition(counterEntity) as Record<string, any>;
    expect(attributes.count.type).toBe(DataTypes.BIGINT);
    expect(attributes.previousCount.type).toBe(DataTypes.BIGINT);
    expect(attributes.previousCount.allowNull).toBe(true);
  });

  it("lists the bigint attributes of an entity", () => {
    expect(getBigintAttributes(counterEntity)).toEqual(["count", "previousCount"]);
  });

  it("turns the int8 strings returned by pg into BigInt values with every digit", () => {
    const row = { uuid: "u", count: "9223372036854775807", previousCount: null, label: "123" };
    expect(reviveBigintAttributes(row, ["count", "previousCount"])).toEqual({
      uuid: "u",
      count: 9223372036854775807n,
      previousCount: null,
      label: "123",
    });
  });

  it("leaves a row without bigint attributes unchanged", () => {
    const row = { uuid: "u", count: 12n };
    expect(reviveBigintAttributes(row, [])).toBe(row);
    expect(reviveBigintAttributes(row, ["count"])).toBe(row);
  });
});
