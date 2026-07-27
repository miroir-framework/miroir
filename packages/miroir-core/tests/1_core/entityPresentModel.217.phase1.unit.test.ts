import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import {
  entity as entityZod,
  selfApplication as selfApplicationZod,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type {
  Entity,
  SelfApplication,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { ENTITY_PRESENT_MODEL_DEFINITION_FIELDS } from "../../src/1_core/entityPresentModel.js";

describe("217 Phase 1 — Entity schema accepts optional definition fields", () => {
  it("parses legacy Entity assets without definition fields", () => {
    for (const entityInstance of defaultLibraryAppModel.entities) {
      const parsed = entityZod.safeParse(entityInstance);
      expect(parsed.success, JSON.stringify(parsed)).toBe(true);
    }
  });

  it("parses an Entity carrying all present-model definition fields", () => {
    const base = defaultLibraryAppModel.entities[0];
    const entityVersion = defaultLibraryAppModel.entityVersions.find(
      (definition) => definition.entityUuid === base.uuid,
    )!;
    const enriched: Entity = {
      ...base,
      defaultInstanceDetailsReportUuid: entityVersion.defaultInstanceDetailsReportUuid,
      viewAttributes: entityVersion.viewAttributes,
      icon: entityVersion.icon,
      display: entityVersion.display,
      cache: entityVersion.cache,
      idAttribute: entityVersion.idAttribute,
      externalDataSource: entityVersion.externalDataSource,
      mlSchema: entityVersion.mlSchema,
    };

    const parsed = entityZod.safeParse(enriched);
    expect(parsed.success, JSON.stringify(parsed)).toBe(true);
    if (parsed.success) {
      for (const field of ENTITY_PRESENT_MODEL_DEFINITION_FIELDS) {
        expect(parsed.data).toHaveProperty(field);
      }
    }
  });
});

describe("217 Phase 1 — SelfApplication.versioningEnabled", () => {
  it("parses legacy SelfApplication assets without versioningEnabled", () => {
    const parsed = selfApplicationZod.safeParse(selfApplicationMiroir);
    expect(parsed.success, JSON.stringify(parsed)).toBe(true);
    for (const application of defaultMiroirMetaModel.applications) {
      expect(selfApplicationZod.safeParse(application).success).toBe(true);
    }
  });

  it("parses SelfApplication with versioningEnabled true or false", () => {
    const base = selfApplicationMiroir as SelfApplication;
    for (const versioningEnabled of [true, false]) {
      const parsed = selfApplicationZod.safeParse({ ...base, versioningEnabled });
      expect(parsed.success, JSON.stringify(parsed)).toBe(true);
      if (parsed.success) {
        expect(parsed.data.versioningEnabled).toBe(versioningEnabled);
      }
    }
  });
});
