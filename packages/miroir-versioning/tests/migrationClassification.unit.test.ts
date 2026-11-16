/**
 * #9 B2, #745 D3: the classification table of a Migration's structure changes (`entityStructureChanges`), on
 * the real Entity rows of appForTest (its `appForTest_model` files); #745 D2: the steps of one model Action.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { entityStructureChanges } from "../src/migrationGeneration.js";
import { modelActionSteps } from "../src/migrationSteps.js";

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

  it("supports an optional attribute added; refuses a required one added to an existing Entity (#749)", () => {
    const next = publisherWith((d) => ({ ...d, motto: { type: "string", optional: true }, founded: { type: "number" } }));
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "addAttribute", ...about, attribute: "motto", backwardCompatible: true, supported: true },
      { kind: "addAttribute", ...about, attribute: "founded", backwardCompatible: false, supported: false, note: expect.stringContaining("#749") },
    ]);
  });

  it("supports a required attribute on an Entity the Migration creates: the Entity is one addEntity change", () => {
    expect(entityStructureChanges(undefined, publisherWith((d) => ({ ...d, founded: { type: "number" } })))).toEqual([
      { kind: "addEntity", ...about, backwardCompatible: true, supported: true },
    ]);
  });

  it("classifies a removed attribute as not backward-compatible", () => {
    const next = publisherWith(({ icon: _icon, ...rest }) => rest);
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "removeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: true },
    ]);
  });

  it("refuses every attribute change (#749); keeps compatibility for an attribute made optional, not for a type change or one made required", () => {
    const next = publisherWith((d) => ({
      ...d,
      name: { ...d.name, optional: true, tag: { value: { id: 4, defaultLabel: "Label" } } },
      country: { ...d.country, type: "string" },
      icon: { type: "string" },
    }));
    expect(entityStructureChanges(publisher, next)).toEqual([
      { kind: "changeAttribute", ...about, attribute: "name", backwardCompatible: true, supported: false, note: expect.stringContaining("#749") },
      { kind: "changeAttribute", ...about, attribute: "country", backwardCompatible: false, supported: false, note: expect.stringContaining("#749") },
      { kind: "changeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: false, note: expect.stringContaining("#749") },
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
      { kind: "changeAttribute", ...about, attribute: "country", backwardCompatible: false, supported: false, note: expect.stringContaining("#749") },
      { kind: "changeAttribute", ...about, attribute: "icon", backwardCompatible: false, supported: false, note: expect.stringContaining("#749") },
    ]);
    const nested = { ...next, mlSchema: { ...next.mlSchema, definition: { ...next.mlSchema.definition, icon: { type: "array", definition: { type: "number" }, optional: true } } } };
    expect(entityStructureChanges(next, nested).map(({ backwardCompatible }) => backwardCompatible)).toEqual([false]);
  });

  it("supports a renamed Entity (renameEntity), refuses a changed idAttribute (#749)", () => {
    const changes = entityStructureChanges(publisher, { ...publisher, name: "Editor", idAttribute: "name" });
    expect(changes.map(({ kind, entityName, backwardCompatible, supported }) => ({ kind, entityName, backwardCompatible, supported }))).toEqual([
      { kind: "renameEntity", entityName: "Editor", backwardCompatible: false, supported: true },
      { kind: "changeIdAttribute", entityName: "Editor", backwardCompatible: false, supported: false },
    ]);
    expect(changes[1].note).toContain("#749");
    expect(entityStructureChanges(publisher, { ...publisher, idAttribute: "uuid" }), "uuid is the default idAttribute").toEqual([]);
  });

  it("steps (#745 D2): an alterEntityAttribute that adds and removes gives the add, a fill step per added attribute, then the remove", () => {
    const state = { entities: [publisher] } as any;
    const steps = modelActionSteps(
      {
        actionType: "alterEntityAttribute",
        payload: {
          application: "app",
          transactional: false,
          entityName: "Publisher",
          entityUuid: publisher.uuid,
          addColumns: [
            { name: "motto", definition: { type: "string", optional: true } },
            { name: "since", definition: { type: "number", optional: true } },
          ],
          removeColumns: ["icon"],
        },
      },
      state,
      "a-record",
    );
    expect(steps.map(({ name, kind, backwardCompatible, trace }) => ({ name, kind, backwardCompatible, trace }))).toEqual([
      { name: "add Publisher.motto, Publisher.since", kind: "model", backwardCompatible: true, trace: "a-record" },
      { name: "fill Publisher.motto", kind: "data", backwardCompatible: true, trace: undefined },
      { name: "fill Publisher.since", kind: "data", backwardCompatible: true, trace: undefined },
      { name: "remove Publisher.icon", kind: "model", backwardCompatible: false, trace: "a-record" },
    ]);
    expect((steps[0].action as any).payload).toEqual({
      application: "app",
      entityName: "Publisher",
      entityUuid: publisher.uuid,
      addColumns: [
        { name: "motto", definition: { type: "string", optional: true } },
        { name: "since", definition: { type: "number", optional: true } },
      ],
    });
    expect((steps[3].action as any).payload).toEqual({ application: "app", entityName: "Publisher", entityUuid: publisher.uuid, removeColumns: ["icon"] });
    expect((steps[1].action as any).payload.actionSequence).toEqual([]);
  });

  it("steps (#745 D2): a createEntity of two Entities gives one step per Entity; renameEntity and dropEntity give themselves", () => {
    const imprint = { ...publisher, uuid: "u2", name: "Imprint" };
    const state = { entities: [publisher] } as any;
    expect(
      modelActionSteps({ actionType: "createEntity", payload: { application: "app", entities: [imprint, { ...imprint, uuid: "u3", name: "Label" }] } }, state).map(
        ({ name, kind, action }) => ({ name, kind, entities: (action as any).payload.entities.map((entity: Row) => entity.uuid) }),
      ),
    ).toEqual([
      { name: "create Entity Imprint", kind: "model", entities: ["u2"] },
      { name: "create Entity Label", kind: "model", entities: ["u3"] },
    ]);
    expect(
      modelActionSteps({ actionType: "renameEntity", payload: { application: "app", entityName: "Publisher", entityUuid: publisher.uuid, targetValue: "Editor" } }, state).map(
        ({ name, backwardCompatible }) => ({ name, backwardCompatible }),
      ),
    ).toEqual([{ name: "rename Entity Publisher to Editor", backwardCompatible: false }]);
    expect(
      modelActionSteps({ actionType: "dropEntity", payload: { application: "app", entityUuid: publisher.uuid } }, state).map(({ name }) => name),
    ).toEqual(["drop Entity Publisher"]);
  });
});
