/**
 * #273 Slice 4 — Create Application storage picker follows creatableStoreTypes; bundled never appears.
 */
import { describe, expect, it } from "vitest";

import { buildCreateApplicationStorageSchema } from "../../../../src/miroir-fwk/4_view/components/Runners/Runner_CreateApplication.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesPicker.273.phase4";

const VARIANT_KEYS = {
  indexedDb: "indexedDbStoreSectionConfiguration",
  filesystem: "filesystemDbStoreSectionConfiguration",
  sql: "sqlDbStoreSectionConfiguration",
  mongodb: "mongoDbStoreSectionConfiguration",
} as const;

function emulatedServerTypeDefinition(schema: Record<string, any>, variantKey: string): unknown {
  return schema[variantKey]?.definition?.emulatedServerType?.definition;
}

if (runThis) {
  describe("processCapabilitiesPicker.273.phase4 create-application storage schema", () => {
    it("indexedDb-only creatable types yield only the IndexedDB variant", () => {
      const schema = buildCreateApplicationStorageSchema(["indexedDb"]);
      expect(Object.keys(schema)).toEqual([VARIANT_KEYS.indexedDb]);
      expect(Object.keys(schema)).not.toContain(VARIANT_KEYS.filesystem);
      expect(Object.keys(schema)).not.toContain(VARIANT_KEYS.sql);
      expect(Object.keys(schema)).not.toContain(VARIANT_KEYS.mongodb);
      expect(Object.keys(schema).join(" ")).not.toContain("bundled");
      expect(emulatedServerTypeDefinition(schema, VARIANT_KEYS.indexedDb)).toBe("indexedDb");
    });

    it("indexedDb + sql yield only those two variants", () => {
      const schema = buildCreateApplicationStorageSchema(["indexedDb", "sql"]);
      expect(Object.keys(schema).sort()).toEqual(
        [VARIANT_KEYS.indexedDb, VARIANT_KEYS.sql].sort(),
      );
      expect(emulatedServerTypeDefinition(schema, VARIANT_KEYS.indexedDb)).toBe("indexedDb");
      expect(emulatedServerTypeDefinition(schema, VARIANT_KEYS.sql)).toBe("sql");
    });

    it("drops bundled even when it is passed in", () => {
      const schema = buildCreateApplicationStorageSchema(["bundled", "indexedDb"]);
      expect(Object.keys(schema)).toEqual([VARIANT_KEYS.indexedDb]);
      expect(Object.keys(schema).join(" ")).not.toContain("bundled");
    });
  });
}
