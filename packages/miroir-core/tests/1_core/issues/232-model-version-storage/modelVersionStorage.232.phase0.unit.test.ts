import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  entityEntity,
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { getApplicationSection } from "../../../../src/1_core/Model.js";
import {
  buildFreezeApplicationVersionPlan,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function readJson(relativePath: string): Record<string, unknown> {
  const absolutePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return JSON.parse(readFileSync(absolutePath, "utf8")) as Record<string, unknown>;
}

describe("232 Phase 0 — current section matrix", () => {
  it("keeps the current deployment section vocabulary to admin/model/data", () => {
    const filesystemConfig = readJson("../../../../../miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json");
    const sqlConfig = readJson("../../../../../miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json");

    const filesystemSections = Object.keys(
      (filesystemConfig.client as { deploymentStorageConfig: Record<string, Record<string, unknown>> }).deploymentStorageConfig["18db21bf-f8d3-4f6a-8296-84b69f6dc48b"],
    ).sort();
    const sqlSections = Object.keys(
      (sqlConfig.client as { deploymentStorageConfig: Record<string, Record<string, unknown>> }).deploymentStorageConfig["18db21bf-f8d3-4f6a-8296-84b69f6dc48b"],
    ).sort();

    expect(filesystemSections).toEqual(["admin", "data", "model"]);
    expect(sqlSections).toEqual(["admin", "data", "model"]);
  });

  it("keeps live model/data section resolution unchanged for live entities", () => {
    expect(getApplicationSection(selfApplicationMiroir.uuid, entityEntity.uuid)).toBe("model");
    expect(getApplicationSection(selfApplicationMiroir.uuid, "00000000-0000-0000-0000-000000000000")).toBe("data");
    expect(getApplicationSection(selfApplicationLibrary.uuid, entityEntity.uuid)).toBe("model");
  });

  it("freeze history now routes to modelVersion via getApplicationSection (Slice 1 transition)", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: selfApplicationMiroir.uuid,
      branchUuid: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      newUuid: () => "aaaaaaaa-aaaa-4aaa-8aaa-000000000001",
    });

    expect(getApplicationSection(selfApplicationMiroir.uuid, entityEntityVersion.uuid!)).toBe("modelVersion");
    expect(plan.entityVersionApplicationSection).toBe("modelVersion");
    expect(plan.queryVersionApplicationSection).toBe("modelVersion");
    expect(getApplicationSection(selfApplicationLibrary.uuid, entityEntityVersion.uuid!)).toBe("modelVersion");
  });
});
