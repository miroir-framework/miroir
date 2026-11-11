/**
 * #703: the Entities Miroir defines late (Blob, Test, TransformerDefinition) are left out of an
 * application's freeze and kept in Miroir's. Moved from core's `metaModelEntityList.unit.test.ts` (#696).
 */
import { describe, expect, it } from "vitest";

import { metaModelEntityUuids, type Entity } from "@miroir-framework/core";
import {
  entityBlob,
  entityTest,
  entityTransformerDefinition,
  selfApplicationMiroir,
} from "@miroir-framework/core/meta-model";
import { selfApplicationLibrary } from "miroir-example-library";

import { selectEntitiesToFreeze } from "../src/applicationVersionFreeze.js";

const lateEntities = [entityBlob, entityTest, entityTransformerDefinition] as Entity[];

describe("meta-model Entity list in the freeze (#703)", () => {
  it("leaves them out of an application's freeze, and keeps them in Miroir's", () => {
    const metaUuids = new Set(metaModelEntityUuids);
    expect(selectEntitiesToFreeze(selfApplicationLibrary.uuid, lateEntities, metaUuids)).toEqual([]);
    expect(
      selectEntitiesToFreeze(selfApplicationMiroir.uuid, lateEntities, metaUuids).map((entity) => entity.name),
    ).toEqual(lateEntities.map((entity) => entity.name));
  });
});
