import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  EntityVersion
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  getEntityPrimaryKeyAttribute,
} from "../../../../src/1_core/EntityPrimaryKey.js";

// function entityVersion(
//   overrides: Partial<EntityVersion> &
//     Pick<EntityVersion, "uuid" | "name" | "entityUuid" | "mlSchema">,
// ): EntityVersion {
//   return {
//     parentUuid: "e432ecc7-9415-4fd8-b040-c6fbaea17e9a",
//     parentName: "EntityVersion",
//     ...overrides,
//   };
// }

const bookEntityComplete = defaultLibraryAppModel.entities.find(
  (e) => e.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;

describe("PK helpers — Entity-first via resolver", () => {
  it("book Entity carries present-model mlSchema", () => {
    expect(bookEntityComplete.mlSchema).toBeTruthy();
  });

  it("reads idAttribute from Entity or EntityVersion sources", () => {
    expect(getEntityPrimaryKeyAttribute({ idAttribute: "code" })).toBe("code");
    expect(getEntityPrimaryKeyAttribute({ idAttribute: ["a", "b"] })).toEqual(["a", "b"]);
    expect(getEntityPrimaryKeyAttribute({})).toBe("uuid");
  });


});
