/**
 * Meta-Entity scope / logicalDataModel classification (#227 follow-up).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  entityDefinitionsByEntityName,
} from "../../src/index.js";
import { jzodObjectFlatten } from "../../src/1_core/jzod/jzodObjectFlatten.js";
import { defaultMiroirMetaModel } from "../../../miroir-test-app_deployment-miroir/src/Model.js";

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const MODEL_ENTITIES = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const ENTITY_EV = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
);

function readEntity(filename: string): Entity {
  return JSON.parse(readFileSync(join(MODEL_ENTITIES, filename), "utf8")) as Entity;
}

function readEntityVersion(filename: string): Entity {
  return JSON.parse(readFileSync(join(ENTITY_EV, filename), "utf8")) as Entity;
}

describe("Entity meta scope and logicalDataModel", () => {
  it("Entity metaclass schema declares optional scope and logicalDataModel", () => {
    const entityMetaclass = readEntity("16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json");
    const definition = entityMetaclass.mlSchema?.definition as Record<string, unknown>;
    expect(definition.scope).toMatchObject({
      type: "enum",
      optional: true,
      definition: ["versioning", "modeling"],
    });
    expect(definition.logicalDataModel).toMatchObject({
      type: "enum",
      optional: true,
      definition: ["manyToMany", "entity"],
    });
  });

  it("versioning entities carry scope versioning; cross tables are manyToMany", () => {
    const versioningOnly = [
      "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json", // EntityVersion
      "7f3a8b2c-4d1e-4f9a-b6c3-8e5d2a1f0b9c.json", // QueryVersion
      "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7.json", // ReportVersion
      "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7.json", // MenuVersion
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json", // SelfApplicationVersion
    ];
    for (const file of versioningOnly) {
      const entity = readEntity(file);
      expect(entity.scope, file).toBe("versioning");
      expect(entity.logicalDataModel, file).toBeUndefined();
    }

    for (const file of [
      "8bec933d-6287-4de7-8a88-5c24216de9f4.json",
      "9e4c6d8a-2b5f-4a1c-9d7e-3f6b8a2c4e1d.json",
      "f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8.json",
      "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8.json",
    ]) {
      const entity = readEntity(file);
      expect(entity.scope, file).toBe("versioning");
      expect(entity.logicalDataModel, file).toBe("manyToMany");
    }
  });

  it("Entity EntityVersion bootstrap mlSchema includes scope and logicalDataModel", () => {
    const entityEv = readEntityVersion("381ab1be-337f-4198-b1d3-f686867fc1dd.json");
    const definition = entityEv.mlSchema?.definition as Record<string, unknown>;
    expect(definition.scope).toBeDefined();
    expect(definition.logicalDataModel).toBeDefined();
  });

  it("model validation accepts versioning entity rows against Entity schema", () => {
    const entitySchema = entityDefinitionsByEntityName(defaultMiroirMetaModel).Entity?.mlSchema;
    const flattened = jzodObjectFlatten(entitySchema as any, defaultMiroirModelEnvironment);
    expect(flattened.definition.scope).toBeDefined();

    const entityVersionRow = defaultMiroirMetaModel.entities.find((e) => e.name === "EntityVersion");
    expect(entityVersionRow).toBeDefined();
    const check = checkModelValidationInstance(
      entitySchema as any,
      entityVersionRow,
      "EntityVersion",
      defaultMiroirModelEnvironment,
    );
    expect(check.status, JSON.stringify(check.innermostError, null, 2)).toBe("ok");
  });

  it("model validation accepts ReportVersion entity row against Entity schema", () => {
    const entitySchema = entityDefinitionsByEntityName(defaultMiroirMetaModel).Entity?.mlSchema;
    const reportVersionEntity = defaultMiroirMetaModel.entities.find(
      (e) => e.uuid === "f1a2b3c4-d5e6-4789-a0a1-b2c3d4e5f6a7",
    );
    expect(reportVersionEntity).toBeDefined();
    const check = checkModelValidationInstance(
      entitySchema as any,
      reportVersionEntity,
      "ReportVersion",
      defaultMiroirModelEnvironment,
    );
    expect(check.status, JSON.stringify(check.innermostError, null, 2)).toBe("ok");
  });

  it("model validation accepts MenuVersion entity row against Entity schema", () => {
    const entitySchema = entityDefinitionsByEntityName(defaultMiroirMetaModel).Entity?.mlSchema;
    const menuVersionEntity = defaultMiroirMetaModel.entities.find(
      (e) => e.uuid === "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7",
    );
    expect(menuVersionEntity).toBeDefined();
    const check = checkModelValidationInstance(
      entitySchema as any,
      menuVersionEntity,
      "MenuVersion",
      defaultMiroirModelEnvironment,
    );
    expect(check.status, JSON.stringify(check.innermostError, null, 2)).toBe("ok");
  });

  it("modeling entities omit scope and logicalDataModel (defaults)", () => {
    const entity = readEntity("e4320b9e-ab45-4abe-85d8-359604b3c62f.json"); // Query
    expect(entity.scope).toBeUndefined();
    expect(entity.logicalDataModel).toBeUndefined();
  });
});
