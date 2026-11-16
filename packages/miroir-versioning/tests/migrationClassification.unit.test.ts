/**
 * #9 B2: the classification table of a Migration's structure changes (`entityStructureChanges`), on the real
 * Entity rows of appForTest (its `appForTest_model` files).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { entityStructureChanges, migrationSteps } from "../src/migrationGeneration.js";

type Row = Record<string, any>;

const entityFolder = fileURLToPath(
  new URL("../../miroir-fixture-appForTest/assets/appForTest_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/", import.meta.url),
);
const publisher: Row = JSON.parse(readFileSync(`${entityFolder}a027c379-8468-43a5-ba4d-bf618be25cab.json`, "utf8"));

/** Publisher with its attribute definitions changed by `change`. */
function publisherWith(change: (definition: Row) => Row): Row {
  const next = structuredClone(publisher);
  next.mlSchema.definition = change(next.mlSchema.definition);
  return next;
}

const about = { entity: publisher.uuid, entityName: "Publisher" };

describe("Migration change classification (#9 B2)", () => {
  it("finds no change between a row and itself", () => {
    expect(entityStructureChanges(publisher, structuredClone(publisher))).toEqual([]);
  });

  it("classifies an added and a removed Entity", () => {
    expect(entityStructureChanges(undefined, publisher)).toEqual([{ kind: "addEntity", ...about, backwardCompatible: true, supported: true }]);
    expect(entityStructureChanges(publisher, undefined)).toEqual([{ kind: "removeEntity", ...about, backwardCompatible: false, supported: true }]);
  });

  it("classifies added attributes by whether they are optional", () => {
    const next = publisherWith((d) => ({ ...d, motto: { type: "string", optional: true }, founded: { type: "number" } }));
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "addAttribute", ...about, attribute: "motto", backwardCompatible: true, supported: true },
      { kind: "addAttribute", ...about, attribute: "founded", backwardCompatible: false, supported: true },
    ]);
  });

  it("classifies a removed attribute as not backward-compatible", () => {
    const next = publisherWith(({ icon: _icon, ...rest }) => rest);
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "removeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: true },
    ]);
  });

  it("keeps compatibility for a label change or an attribute made optional, not for a type change or one made required", () => {
    const next = publisherWith((d) => ({
      ...d,
      name: { ...d.name, optional: true, tag: { value: { id: 4, defaultLabel: "Label" } } },
      country: { ...d.country, type: "string" },
      icon: { type: "string" },
    }));
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "changeAttribute", ...about, attribute: "name", backwardCompatible: true, supported: true },
      { kind: "changeAttribute", ...about, attribute: "country", backwardCompatible: false, supported: true },
      { kind: "changeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: true },
    ]);
  });

  it("ignores a change of tag only, and keeps no compatibility for a foreign key or nested definition changed", () => {
    expect(entityStructureChanges(publisher, publisherWith((d) => ({ ...d, icon: { ...d.icon, tag: { value: { defaultLabel: "Logo" } } } })))).toEqual([]);
    const next = publisherWith((d) => ({
      ...d,
      country: { ...d.country, tag: { value: { ...d.country.tag.value, foreignKeyParams: { targetEntity: "another" } } } },
      icon: { type: "array", definition: { type: "string" }, optional: true },
    }));
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "changeAttribute", ...about, attribute: "country", backwardCompatible: false, supported: true },
      { kind: "changeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: true },
    ]);
    const nested = { ...next, mlSchema: { ...next.mlSchema, definition: { ...next.mlSchema.definition, icon: { type: "array", definition: { type: "number" }, optional: true } } } };
    expect(entityStructureChanges(next, nested).map(({ backwardCompatible }) => backwardCompatible)).toEqual([false]);
  });

  it("flags a renamed Entity and a changed idAttribute as unsupported", () => {
    const changes = entityStructureChanges(publisher, { ...publisher, name: "Editor", idAttribute: "name" });
    expect(changes.map(({ kind, entityName, backwardCompatible, supported }) => ({ kind, entityName, backwardCompatible, supported }))).toEqual([
      { kind: "renameEntity", entityName: "Editor", backwardCompatible: false, supported: false },
      { kind: "changeIdAttribute", entityName: "Editor", backwardCompatible: false, supported: false },
    ]);
    expect(entityStructureChanges(publisher, { ...publisher, idAttribute: "uuid" }), "uuid is the default idAttribute").toEqual([]);
  });

  it("steps: a fill step per added attribute, a contract step per removal, no expand step", () => {
    const changes = [
      ...entityStructureChanges(publisher, publisherWith(({ icon: _icon, ...rest }) => ({ ...rest, motto: { type: "string", optional: true } }))),
      ...entityStructureChanges({ ...publisher, uuid: "u2", name: "Imprint" }, undefined),
    ];
    const steps = migrationSteps(changes);
    expect(steps.expand).toEqual([]);
    expect(steps.fill.map(({ name, backwardCompatible, repeatable }) => ({ name, backwardCompatible, repeatable }))).toEqual([
      { name: "fill Publisher.motto", backwardCompatible: true, repeatable: true },
    ]);
    expect(steps.contract.map(({ name, backwardCompatible }) => ({ name, backwardCompatible }))).toEqual([
      { name: "drop Publisher.icon", backwardCompatible: false },
      { name: "drop Imprint", backwardCompatible: false },
    ]);
  });
});
