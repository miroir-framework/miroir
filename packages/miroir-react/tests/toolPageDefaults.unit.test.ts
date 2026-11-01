/**
 * #633 D4: the search and transformer builder pages open on the current application, not on the
 * Library example. Uses the Library's real Entity assets.
 * Not reachable through MiroirTest: the initial selection of a React page, before any query runs.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { entityEntity, entityTransformerDefinition, selfApplicationMiroir } from "@miroir-framework/core/meta-model";
import { entityAuthor, selfApplicationLibrary } from "miroir-example-library";

import { defaultToolApplication, defaultToolEntity } from "../src/routes/applicationDefaults.js";

const LIBRARY_ENTITIES = join(
  __dirname,
  "../../miroir-example-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const libraryEntities = readdirSync(LIBRARY_ENTITIES)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(LIBRARY_ENTITIES, file), "utf8")) as { uuid: string; name: string });

describe("tool page defaults (#633 D4)", () => {
  it("opens on Miroir when nothing is selected and no application is current", () => {
    expect(defaultToolApplication(undefined, undefined)).toBe(selfApplicationMiroir.uuid);
  });

  it("prefers the page's selection, then the current application", () => {
    expect(defaultToolApplication("page-selection", selfApplicationLibrary.uuid)).toBe("page-selection");
    expect(defaultToolApplication(undefined, selfApplicationLibrary.uuid)).toBe(selfApplicationLibrary.uuid);
  });

  it("shows the given entity for Miroir", () => {
    expect(defaultToolEntity(selfApplicationMiroir.uuid, [], entityEntity.uuid)).toBe(entityEntity.uuid);
    expect(defaultToolEntity(selfApplicationMiroir.uuid, libraryEntities, entityTransformerDefinition.uuid)).toBe(
      entityTransformerDefinition.uuid,
    );
  });

  it("shows the application's first entity by name for another application", () => {
    expect(defaultToolEntity(selfApplicationLibrary.uuid, libraryEntities, entityEntity.uuid)).toBe(entityAuthor.uuid);
  });

  it("falls back to the given entity for an application without entities", () => {
    expect(defaultToolEntity(selfApplicationLibrary.uuid, [], entityEntity.uuid)).toBe(entityEntity.uuid);
  });
});
