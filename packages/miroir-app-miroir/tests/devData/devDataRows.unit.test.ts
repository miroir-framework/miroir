/**
 * #647: every row of the Miroir devData section (bundle sizes, agent runs, and any page load a
 * developer recorded) is an instance of its Entity, with the Entity's uuid as folder name (#473).
 *
 * Not reachable through MiroirTest: it reads the section's folder on disk.
 * ```bash
 * npm run testByFile -w miroir-app-miroir -- devData/devDataRows.unit
 * ```
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  type Entity,
  type MlElement,
} from "@miroir-framework/core";

import { defaultMiroirMetaModel } from "../../src/Model";

const devDataDir = join(dirname(fileURLToPath(import.meta.url)), "../../assets/miroir_devData");

const devDataEntities: Entity[] = ["BundleSizeMeasurement", "PageLoadMeasurement", "AgentRunMeasurement"].map(
  (name) => {
    const entity = (defaultMiroirMetaModel.entities as Entity[]).find((e) => e.name === name);
    if (!entity) {
      throw new Error(`the Miroir model has no ${name} Entity`);
    }
    return entity;
  },
);

function rows(entityUuid: string): { file: string; row: Record<string, unknown> }[] {
  const folder = join(devDataDir, entityUuid);
  if (!existsSync(folder)) {
    return [];
  }
  return readdirSync(folder)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({ file, row: JSON.parse(readFileSync(join(folder, file), "utf-8")) }));
}

describe("Miroir devData rows (#647)", () => {
  it("has a folder per devData Entity, and no other", () => {
    expect(readdirSync(devDataDir).sort()).toEqual(devDataEntities.map((entity) => entity.uuid).sort());
  });

  for (const entity of devDataEntities) {
    it(`every ${entity.name} row is valid and named after its uuid`, () => {
      for (const { file, row } of rows(entity.uuid)) {
        expect(file, file).toBe(`${row.uuid}.json`);
        expect(row.parentUuid, file).toBe(entity.uuid);
        const result = checkModelValidationInstance(
          entity.mlSchema as MlElement,
          row,
          file,
          defaultMiroirModelEnvironment,
        );
        expect(result.status, `${file}: ${JSON.stringify(result)}`).toBe("ok");
      }
    });
  }
});
