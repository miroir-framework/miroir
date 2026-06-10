import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  isUuidV4,
  migrateLegacyTestInstance,
  migrateTransformerTestNode,
  migrateUnitTestNode,
  targetUuidForLegacySource,
} from "../../scripts/miroirTestMigrateDefinition";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const mapPath = join(scriptsDir, "../../scripts/miroir-test-migration-map.json");

describe("miroirTest migration (Phase 5)", () => {
  it("flattens unitTest transformerTest payload wrapper", () => {
    const migrated = migrateUnitTestNode({
      unitTestType: "transformerTest",
      unitTestLabel: "menu can be built from parts",
      payload: {
        transformerTestType: "transformerTest",
        transformerTestLabel: "menu can be built from parts",
        transformerName: "menuBuild",
        expectedValue: 1,
      },
    });
    expect(migrated).toMatchObject({
      miroirTestType: "transformerTest",
      miroirTestLabel: "menu can be built from parts",
      transformerName: "menuBuild",
      expectedValue: 1,
    });
    expect(migrated).not.toHaveProperty("payload");
  });

  it("migrates nested transformerTestSuite", () => {
    const migrated = migrateTransformerTestNode({
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "adminTransformers",
      transformerTests: [
        {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "nested",
          transformerTests: [],
        },
      ],
    });
    expect(migrated.miroirTestType).toBe("miroirTestSuite");
    expect(migrated.miroirTests).toHaveLength(1);
    expect(migrated.miroirTests[0]).toMatchObject({
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "nested",
    });
  });

  it("migration map covers all legacy deployment exports", () => {
    const map = JSON.parse(readFileSync(mapPath, "utf8")) as {
      entries: { sourceExport: string; targetExport: string; registryKey: string }[];
    };
    expect(map.entries.length).toBeGreaterThanOrEqual(30);
    const alterObject = map.entries.find((e) => e.registryKey === "alterObject");
    expect(alterObject?.targetExport).toBe("miroirTest_alterObject");
    expect(alterObject?.sourceExport).toBe("unitTest_suite_alterObject");
  });

  it("target UUIDs in migration map are RFC 4122 v4", () => {
    const map = JSON.parse(readFileSync(mapPath, "utf8")) as {
      schemaPilot: { targetUuid: string };
      entries: { targetUuid: string; sourceUuid: string }[];
    };
    const uuids = [
      map.schemaPilot.targetUuid,
      ...map.entries.map((entry) => entry.targetUuid),
    ];
    for (const uuid of uuids) {
      expect(isUuidV4(uuid), uuid).toBe(true);
    }
  });

  it("targetUuidForLegacySource is stable and v4", () => {
    const uuid = targetUuidForLegacySource("a1d2e3f4-b5c6-4d7e-8f9a-0b1c2d3e4f5a");
    expect(isUuidV4(uuid)).toBe(true);
    expect(targetUuidForLegacySource("a1d2e3f4-b5c6-4d7e-8f9a-0b1c2d3e4f5a")).toBe(uuid);
    expect(targetUuidForLegacySource("x", "4b18adc6-5cec-4abf-bb60-7a7fa26e4dc4")).toBe(
      "4b18adc6-5cec-4abf-bb60-7a7fa26e4dc4",
    );
  });

  it("migrateLegacyTestInstance re-parents to MiroirTest entity", () => {
    const migrated = migrateLegacyTestInstance(
      {
        uuid: "a1d2e3f4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
        name: "alterObject_atPath",
        selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
        definition: {
          unitTestType: "unitTestSuite",
          unitTestLabel: "alterObject.atPath",
          unitTests: [],
        },
      },
      "UnitTest",
    );
    expect(migrated.parentName).toBe("MiroirTest");
    expect(migrated.parentUuid).toBe("a311f363-e238-4203-bdfc-29e8c160c26b");
    expect((migrated.definition as { miroirTestType: string }).miroirTestType).toBe(
      "miroirTestSuite",
    );
  });
});
