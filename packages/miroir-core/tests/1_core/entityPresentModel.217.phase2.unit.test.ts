import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  EntityPresentModelResolutionError,
  entityHasCompletePresentModel,
  resolveCurrentEntityModel,
} from "../../src/1_core/entityPresentModel.js";
import {
  getEntityPrimaryKeyAttribute,
  // getResolvedEntityPrimaryKeyAttribute,
} from "../../src/1_core/EntityPrimaryKey.js";

function entityVersion(
  overrides: Partial<EntityVersion> &
    Pick<EntityVersion, "uuid" | "name" | "entityUuid" | "mlSchema">,
): EntityVersion {
  return {
    parentUuid: "e432ecc7-9415-4fd8-b040-c6fbaea17e9a",
    parentName: "EntityVersion",
    ...overrides,
  };
}

const bookEntityComplete = defaultLibraryAppModel.entities.find(
  (e) => e.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (d) => d.entityUuid === bookEntityComplete.uuid,
)!;

/** Synthetic legacy Entity without definition-bearing fields (pre-Phase-3 shape). */
const bookEntityLegacyIncomplete: Entity = {
  uuid: bookEntityComplete.uuid,
  name: bookEntityComplete.name,
  parentUuid: bookEntityComplete.parentUuid,
  parentName: bookEntityComplete.parentName,
  parentDefinitionVersionUuid: bookEntityComplete.parentDefinitionVersionUuid,
  conceptLevel: bookEntityComplete.conceptLevel,
  description: bookEntityComplete.description,
};

describe("resolveCurrentEntityModel", () => {
  it("returns the Entity when it already carries mlSchema (complete)", () => {
    const resolved = resolveCurrentEntityModel(bookEntityComplete, [bookDefinition]);
    expect(resolved).toBe(bookEntityComplete);
    expect(entityHasCompletePresentModel(resolved)).toBe(true);
  });

  it("enriches an incomplete legacy Entity from its single EntityVersion", () => {
    const resolved = resolveCurrentEntityModel(bookEntityLegacyIncomplete, [bookDefinition]);
    expect(resolved).not.toBe(bookEntityLegacyIncomplete);
    expect(resolved.uuid).toBe(bookEntityLegacyIncomplete.uuid);
    expect(resolved.name).toBe(bookEntityLegacyIncomplete.name);
    expect(resolved.mlSchema).toEqual(bookDefinition.mlSchema);
    expect(resolved.viewAttributes).toEqual(bookDefinition.viewAttributes);
    expect(resolved.idAttribute).toEqual(bookDefinition.idAttribute);
    expect(resolved.cache).toEqual(bookDefinition.cache);
    expect(resolved.defaultInstanceDetailsReportUuid).toBe(
      bookDefinition.defaultInstanceDetailsReportUuid,
    );
  });

  it("prefers Entity-owned definition fields when enriching incomplete Entities", () => {
    const incomplete: Entity = {
      ...bookEntityLegacyIncomplete,
      viewAttributes: ["customOnly"],
    };
    const resolved = resolveCurrentEntityModel(incomplete, [bookDefinition]);
    expect(resolved.viewAttributes).toEqual(["customOnly"]);
    expect(resolved.mlSchema).toEqual(bookDefinition.mlSchema);
  });

  it("throws when complete Entity and EntityVersion definition fields diverge", () => {
    const complete: Entity = {
      ...bookEntityComplete,
      viewAttributes: ["diverged"],
    };
    expect(() => resolveCurrentEntityModel(complete, [bookDefinition])).toThrow(
      EntityPresentModelResolutionError,
    );
    try {
      resolveCurrentEntityModel(complete, [bookDefinition]);
    } catch (error) {
      expect(error).toBeInstanceOf(EntityPresentModelResolutionError);
      expect((error as EntityPresentModelResolutionError).code).toBe("inconsistent");
    }
  });

  it("can prefer Entity when onInconsistency is preferEntity", () => {
    const complete: Entity = {
      ...bookEntityComplete,
      viewAttributes: ["diverged"],
    };
    const resolved = resolveCurrentEntityModel(complete, [bookDefinition], {
      onInconsistency: "preferEntity",
    });
    expect(resolved).toBe(complete);
    expect(resolved.viewAttributes).toEqual(["diverged"]);
  });

  it("throws on ambiguous EntityDefinitions for the same Entity", () => {
    const second = entityVersion({
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "BookAlt",
      entityUuid: bookEntityLegacyIncomplete.uuid,
      mlSchema: { type: "object", definition: {} },
    });
    expect(() =>
      resolveCurrentEntityModel(bookEntityLegacyIncomplete, [bookDefinition, second]),
    ).toThrow(EntityPresentModelResolutionError);
    try {
      resolveCurrentEntityModel(bookEntityLegacyIncomplete, [bookDefinition, second]);
    } catch (error) {
      expect((error as EntityPresentModelResolutionError).code).toBe("ambiguous");
    }
  });

  it("throws when incomplete Entity has no matching EntityVersion", () => {
    expect(() => resolveCurrentEntityModel(bookEntityLegacyIncomplete, [])).toThrow(
      EntityPresentModelResolutionError,
    );
    try {
      resolveCurrentEntityModel(bookEntityLegacyIncomplete, []);
    } catch (error) {
      expect((error as EntityPresentModelResolutionError).code).toBe("missingDefinition");
    }
  });
});

describe("PK helpers — Entity-first via resolver", () => {
  it("reads idAttribute from Entity or EntityVersion sources", () => {
    expect(getEntityPrimaryKeyAttribute({ idAttribute: "code" })).toBe("code");
    expect(getEntityPrimaryKeyAttribute({ idAttribute: ["a", "b"] })).toEqual(["a", "b"]);
    expect(getEntityPrimaryKeyAttribute({})).toBe("uuid");
  });

  // it("resolves PK through present-model enrichment for legacy Entities", () => {
  //   const withNonUuidPk = entityVersion({
  //     ...bookDefinition,
  //     idAttribute: "isbn",
  //   });
  //   expect(
  //     getResolvedEntityPrimaryKeyAttribute(bookEntityLegacyIncomplete, [withNonUuidPk]),
  //   ).toBe("isbn");
  // });

  it("resolves PK from a complete Entity without needing EntityVersion fields beyond join", () => {
    const complete: Entity = {
      ...bookEntityComplete,
      idAttribute: ["region", "code"],
    };
    expect(getResolvedEntityPrimaryKeyAttribute(complete, [])).toEqual(["region", "code"]);
  });
});
