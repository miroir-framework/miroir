/**
 * #216 Phase 0 — lock freeze contracts & fixtures (characterization).
 *
 * Documents the Action type name, versioning fixtures, Cross schema shape,
 * and why freeze must not reuse presentEntityAsRedundantEntityDefinition UUIDs.
 */
import { describe, expect, it } from "vitest";

import {
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE,
  presentEntityAsRedundantEntityDefinition,
} from "../../src/1_core/entityPresentModel.js";
import { ApplicationVersionCrossEntityVersionSchema } from "../../src/0_interfaces/1_core/Model.js";
import { FREEZE_APPLICATION_VERSION_ACTION_TYPE } from "../../src/1_core/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

describe("216 Phase 0 — freeze contracts", () => {
  it("locks versioned / unversioned SelfApplication fixtures", () => {
    expect(VERSIONED_APPLICATION_FIXTURE).toEqual({ versioningEnabled: true });
    expect(UNVERSIONED_APPLICATION_FIXTURE).toEqual({ versioningEnabled: false });
  });

  it("locks freeze Action type string for Model Endpoint", () => {
    expect(FREEZE_APPLICATION_VERSION_ACTION_TYPE).toBe("freezeApplicationVersion");
  });

  it("ApplicationVersionCrossEntityVersionSchema requires applicationVersion + entityVersion", () => {
    const valid = {
      uuid: "11111111-1111-4111-8111-111111111111",
      parentUuid: "8bec933d-6287-4de7-8a88-5c24216de9f4",
      applicationVersion: "22222222-2222-4222-8222-222222222222",
      entityVersion: "33333333-3333-4333-8333-333333333333",
    };
    expect(ApplicationVersionCrossEntityVersionSchema.parse(valid)).toMatchObject({
      applicationVersion: valid.applicationVersion,
      entityVersion: valid.entityVersion,
    });

    expect(() =>
      ApplicationVersionCrossEntityVersionSchema.parse({
        uuid: valid.uuid,
        parentUuid: valid.parentUuid,
        applicationVersion: valid.applicationVersion,
        // entityVersion missing
      }),
    ).toThrow();

    expect(() =>
      ApplicationVersionCrossEntityVersionSchema.parse({
        uuid: valid.uuid,
        parentUuid: valid.parentUuid,
        entityVersion: valid.entityVersion,
        // applicationVersion missing
      }),
    ).toThrow();
  });
});

describe("216 Phase 0 — snapshot UUID misuse guard", () => {
  it("presentEntityAsRedundantEntityDefinition reuses live Entity uuid (unsafe for freeze)", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      name: "FreezeGuardEntity",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };

    const projected = presentEntityAsRedundantEntityDefinition(entity, []);

    // Characterization: synthesizes with uuid === Entity.uuid.
    // Freeze (Phase 1+) must mint a *new* EntityVersion uuid instead.
    expect(projected.uuid).toBe(entity.uuid);
    expect(projected.entityUuid).toBe(entity.uuid);
    expect(projected.parentName).toBe("EntityVersion");
  });
});
