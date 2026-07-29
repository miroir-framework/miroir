/**
 * #222 Phase 3.2 — ModelInitializer Miroir EV instance upserts use data.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modelInitializerTs = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../src/3_controllers/ModelInitializer.ts",
);

describe("222 Phase 3 — ModelInitializer EV instance section", () => {
  it("Miroir path createEntity(entityEntityVersion) then upserts EV instances to data", () => {
    const src = readFileSync(modelInitializerTs, "utf8");
    const miroirBlock = src.slice(
      src.indexOf('if (dataStoreType == "miroir")'),
      src.indexOf('if (dataStoreType == "app")'),
    );
    expect(miroirBlock).toMatch(/createEntity\(\s*entityEntityVersion/);
    expect(miroirBlock).toMatch(
      /upsertInstance\(\s*"data"\s*,\s*entityDefinitionEntity/,
    );
    expect(miroirBlock).toMatch(
      /upsertInstance\(\s*"data"\s*,\s*entityDefinitionEntityDefinition/,
    );
    expect(miroirBlock).not.toMatch(
      /upsertInstance\(\s*"model"\s*,\s*entityDefinitionEntity/,
    );
  });

  it("app path still creates EntityVersion model storage", () => {
    const src = readFileSync(modelInitializerTs, "utf8");
    const appBlock = src.slice(src.indexOf('if (dataStoreType == "app")'));
    expect(appBlock).toMatch(
      /createModelStorageSpaceForInstancesOfEntity\(\s*entityEntityVersion/,
    );
  });
});
