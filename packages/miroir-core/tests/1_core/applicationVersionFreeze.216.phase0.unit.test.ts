/**
 * #216 Phase 0 — lock freeze contracts & fixtures (characterization).
 * #220 — UUID-reuse helper removed; freeze must mint new UUIDs only.
 * #222 — freeze module lives under versioning/; Miroir EV section is data.
 * #232 — version-history entities always resolve to model-version via getApplicationSection.
 *
 * Documents the Action type name, versioning fixtures, Cross schema shape,
 * and that freeze must not reintroduce UUID-reuse / dual-write helpers.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  UNVERSIONED_APPLICATION_FIXTURE,
  VERSIONED_APPLICATION_FIXTURE,
} from "../../src/1_core/versioning/applicationVersioning.js";
import { ApplicationVersionCrossEntityVersionSchema } from "../../src/0_interfaces/1_core/Model.js";
import {
  FREEZE_APPLICATION_VERSION_ACTION_TYPE,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import { getApplicationSection } from "../../src/1_core/Model.js";
import {
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

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

  it("#220 UUID-reuse compat module is deleted (do not reintroduce for freeze)", () => {
    expect(
      existsSync(
        join(REPO_ROOT, "packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts"),
      ),
    ).toBe(false);
  });

  it("#232 EntityVersion section: model-version for any application via getApplicationSection", () => {
    const EV = entityEntityVersion.uuid as string;
    expect(getApplicationSection(selfApplicationMiroir.uuid as string, EV)).toBe("model-version");
    expect(getApplicationSection(selfApplicationLibrary.uuid as string, EV)).toBe("model-version");
  });
});
