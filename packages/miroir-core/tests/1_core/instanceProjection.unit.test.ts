import { describe, expect, it } from "vitest";

import {
  parseAttributesProjectionParam,
  projectEntityInstance,
  projectEntityInstances,
  resolveProjectionIdentityFields,
} from "../../src/1_core/instanceProjection.js";

describe("instanceProjection", () => {
  const full = {
    uuid: "11111111-1111-1111-1111-111111111111",
    parentUuid: "22222222-2222-2222-2222-222222222222",
    parentName: "Blob",
    name: "logo",
    contents: "huge-binary-payload",
    defaultLabel: "Logo",
  };

  it("returns the same object when attributes are absent", () => {
    expect(projectEntityInstance(full, undefined)).toBe(full);
    expect(projectEntityInstance(full, null)).toBe(full);
    expect(projectEntityInstance(full, [])).toBe(full);
  });

  it("keeps only allow-listed attributes plus identity fields", () => {
    const projected = projectEntityInstance(full, ["name", "defaultLabel"]);
    expect(projected).toEqual({
      uuid: full.uuid,
      parentUuid: full.parentUuid,
      parentName: full.parentName,
      name: "logo",
      defaultLabel: "Logo",
    });
    expect(projected).not.toHaveProperty("contents");
  });

  it("retains non-uuid primary key attributes when EntityDefinition is supplied", () => {
    const coded = {
      code: "FR",
      parentUuid: "22222222-2222-2222-2222-222222222222",
      parentName: "Country",
      name: "France",
      population: 67000000,
    };
    const projected = projectEntityInstance(coded, ["name"], resolveProjectionIdentityFields({
      idAttribute: "code",
    } as any));
    expect(projected).toEqual({
      code: "FR",
      parentUuid: coded.parentUuid,
      parentName: "Country",
      name: "France",
    });
    expect(projected).not.toHaveProperty("population");
  });

  it("projects each instance in a collection", () => {
    const other = { ...full, uuid: "33333333-3333-3333-3333-333333333333", name: "other" };
    const result = projectEntityInstances([full, other], ["name"]);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty("contents");
    expect(result[1].name).toBe("other");
  });

  it("parseAttributesProjectionParam accepts comma string or array", () => {
    expect(parseAttributesProjectionParam("name,defaultLabel")).toEqual([
      "name",
      "defaultLabel",
    ]);
    expect(parseAttributesProjectionParam(["name", "defaultLabel"])).toEqual([
      "name",
      "defaultLabel",
    ]);
    expect(parseAttributesProjectionParam(undefined)).toBeUndefined();
  });
});
