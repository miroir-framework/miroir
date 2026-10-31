import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Action2Error, Entity } from "miroir-core";
import { entityEntity } from "miroir-app-miroir";

import { FileSystemDataStoreSection } from "../src/4_services/FileSystemDataStoreSection.js";
import { FileSystemModelStoreSection } from "../src/4_services/FileSystemModelStoreSection.js";

// #37: creating an application Entity must not create a storage space for its
// instances in the model section; only the data section gets one.
const bookEntity: Entity = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  parentName: "Entity",
  parentUuid: entityEntity.uuid,
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  name: "Book",
  conceptLevel: "Model",
  description: "test entity",
  mlSchema: {
    type: "object",
    definition: {
      uuid: { type: "uuid" },
      parentUuid: { type: "uuid" },
      name: { type: "string" },
    },
  },
} as Entity;

describe("FileSystemModelStoreSection.createEntity (#37)", () => {
  let rootDirectory: string;
  let dataSection: FileSystemDataStoreSection;
  let modelSection: FileSystemModelStoreSection;

  beforeEach(async () => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "miroir-fs-37-"));
    dataSection = new FileSystemDataStoreSection("data", "test", rootDirectory, "data");
    modelSection = new FileSystemModelStoreSection("model", "test", rootDirectory, "model", dataSection);
    await dataSection.open();
    await modelSection.open();
  });

  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  it("creates the instance storage space in the data section only", async () => {
    const result = await modelSection.createEntity(bookEntity);
    expect(result).not.toBeInstanceOf(Action2Error);

    expect(fs.readdirSync(path.join(rootDirectory, "data"))).toEqual([bookEntity.uuid]);
    // the model section only holds the Entity instance, under the Entity meta-entity
    expect(fs.readdirSync(path.join(rootDirectory, "model"))).toEqual([entityEntity.uuid]);
    expect(
      fs.readdirSync(path.join(rootDirectory, "model", entityEntity.uuid)),
    ).toEqual([bookEntity.uuid + ".json"]);
  });

  it("reports the entity as existing once created, and not after drop", async () => {
    expect(modelSection.existsEntity(bookEntity.uuid)).toBe(false);
    await modelSection.createEntity(bookEntity);
    expect(modelSection.existsEntity(bookEntity.uuid)).toBe(true);
    await modelSection.dropEntity(bookEntity.uuid);
    expect(modelSection.existsEntity(bookEntity.uuid)).toBe(false);
    expect(fs.readdirSync(path.join(rootDirectory, "model"))).toEqual([entityEntity.uuid]);
  });
});
