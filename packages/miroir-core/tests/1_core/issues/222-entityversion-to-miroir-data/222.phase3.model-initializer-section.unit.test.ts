/**
 * #222 Phase 3.2 — ModelInitializer Miroir EV instance upserts use data.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  miroirModelInitializeEntityVersionsAfterEntityEntityVersion,
} from "miroir-test-app_deployment-miroir";

const modelInitializerTs = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../src/3_controllers/ModelInitializer.ts",
);

describe("222 Phase 3 — ModelInitializer EV instance section", () => {
  it("Miroir path createEntity(entityEntityVersion) then upserts EV instances to data", () => {
    const src = readFileSync(modelInitializerTs, "utf8");
    expect(src).toMatch(/createEntityAndBootstrapVersions/);
    expect(src).toMatch(/miroirModelInitializeEntityVersionsAfterEntityEntityVersion/);
    expect(src).toMatch(/upsertInstances\(\s*[\s\S]*"data"/);
    expect(miroirModelInitializeEntityVersionsAfterEntityEntityVersion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uuid: entityDefinitionEntity.uuid }),
        expect.objectContaining({ uuid: entityDefinitionEntityDefinition.uuid }),
      ]),
    );
  });

  it("app path still creates EntityVersion model storage", () => {
    const src = readFileSync(modelInitializerTs, "utf8");
    expect(src).toMatch(/appModelInitializeCreateEntityOrder/);
    expect(src).toMatch(
      /createModelStorageSpaceForInstancesOfEntity\(/,
    );
  });
});
