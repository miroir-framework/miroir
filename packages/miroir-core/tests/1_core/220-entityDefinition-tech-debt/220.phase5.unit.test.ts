/**
 * #220 Phase 5 — entityVersions accessors + freeze handoff vocabulary.
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { snapshotEntitiesAsHistoricalEntityVersions } from "../../../src/1_core/applicationVersionFreeze.js";
import {
  getMetaModelEntityVersions,
  withMetaModelEntityVersions,
} from "../../../src/1_core/metaModelEntityVersions.js";
import { presentEntityAsRedundantEntityDefinition } from "../../../src/1_core/entityDefinitionCompatibility.js";

describe("220 Phase 5 — getMetaModelEntityVersions / withMetaModelEntityVersions", () => {
  it("reads MetaModel.entityVersions", () => {
    const versions = getMetaModelEntityVersions(defaultLibraryAppModel as MetaModel);
    expect(versions.length).toBeGreaterThan(0);
    expect(versions).toBe(defaultLibraryAppModel.entityVersions);
  });

  it("returns the entityVersions array from the model", () => {
    const preferred: EntityVersion[] = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
        parentName: "EntityVersion",
        name: "Preferred",
        entityUuid: "22222222-2222-4222-8222-222222222222",
        mlSchema: { type: "object", definition: {} },
      },
    ];
    const model = {
      ...(defaultLibraryAppModel as MetaModel),
      entityVersions: preferred,
    };
    expect(getMetaModelEntityVersions(model)).toBe(preferred);
  });

  it("withMetaModelEntityVersions writes entityVersions collection", () => {
    const empty = withMetaModelEntityVersions(defaultLibraryAppModel as MetaModel, []);
    expect(empty.entityVersions).toEqual([]);
    expect(getMetaModelEntityVersions(empty)).toEqual([]);
  });
});

describe("220 Phase 5 — #216 handoff: snapshot ≠ UUID-reuse", () => {
  it("historical snapshot mints new UUIDs; compat helper reuses live uuid", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Handoff",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };
    const [historical]: EntityVersion[] = snapshotEntitiesAsHistoricalEntityVersions([entity], {
      newUuid: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    const reused = presentEntityAsRedundantEntityDefinition(entity, []);

    expect(historical.uuid).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(historical.uuid).not.toBe(entity.uuid);
    expect(reused.uuid).toBe(entity.uuid);
    expect(historical.parentName).toBe("EntityVersion");
  });
});
