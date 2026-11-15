/**
 * #708 part B (analysis D7-a): `MetaModel` has a collection for every Entity of the meta-application
 * whose rows belong to an application's `model` or `modelVersion` section, and one list,
 * `metaModelEntityList`, says which, and where their rows go. Without a collection: the `devData`
 * Entities (application data, not model), `Commit` (Miroir's own transaction log, never created for
 * other applications) and the `Test` Entity with its history, retired in #726.
 */
import { describe, expect, it } from "vitest";

import { defaultMiroirMetaModel } from "miroir-app-miroir";
import { selfApplicationLibrary } from "miroir-example-library";

import { emptyMetaModel } from "../../src/1_core/Deployment.js";
import { getApplicationSection, metaModelCollections, metaModelEntityList } from "../../src/1_core/Model.js";
import { miroirFundamentalMlSchema } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalMlSchema.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const withoutCollection = ["ApplicationVersionCrossTestVersion", "BundleSizeMeasurement", "Commit", "PageLoadMeasurement", "Test", "TestVersion"];

const metaModelSchemaCollections = Object.keys(
  (miroirFundamentalMlSchema.definition.context as any).metaModel.definition,
).filter((key) => key !== "applicationUuid" && key !== "applicationName");

describe("MetaModel collections (#708 D7-a)", () => {
  it("lists every Entity of the meta-application once", () => {
    const listed = metaModelEntityList.map(({ entity }) => entity.uuid).sort();
    expect(listed).toEqual((defaultMiroirMetaModel.entities as Entity[]).map((entity) => entity.uuid).sort());
  });

  it("puts each Entity in the section where its rows go", () => {
    const misplaced = metaModelEntityList
      .filter(({ entity, section }) => getApplicationSection(selfApplicationLibrary.uuid, entity.uuid) !== section)
      .map(({ entity }) => entity.name);
    expect(misplaced).toEqual([]);
  });

  it("gives a collection to every Entity of an application's model and history, but the excluded ones", () => {
    const without = metaModelEntityList
      .filter(({ collection }) => collection === undefined)
      .map(({ entity }) => entity.name)
      .sort();
    expect(without).toEqual(withoutCollection);
  });

  it("has exactly the collections of the MetaModel schema", () => {
    expect(metaModelCollections.map(({ collection }) => collection).sort()).toEqual(metaModelSchemaCollections.sort());
  });

  it("builds the empty MetaModel from the list", () => {
    expect(Object.keys(emptyMetaModel).sort()).toEqual(
      ["applicationName", "applicationUuid", ...metaModelSchemaCollections].sort(),
    );
  });
});
