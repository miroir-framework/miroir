/**
 * #273 Slice 1 — getProcessCapabilities snapshot + assertProcessCapability FeatureUnavailable.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import {
  Action2Error,
  assertProcessCapability,
  getProcessCapabilities,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilities.273.phase1";

const emptyMap = new Map<string, unknown>();

const disabledSnapshot = {
  ai: false,
  mcp: false,
  cursor: false,
  designerTools: true,
  availableStoreTypes: [] as string[],
  creatableStoreTypes: [] as string[],
  storeAdministration: false,
};

if (runThis) {
  describe("processCapabilities.273.phase1 — getProcessCapabilities D8/D9/D11 snapshot", () => {
    it("empty config and empty factory maps yield fail-closed flags and empty store lists", () => {
      expect(
        getProcessCapabilities({
          config: {},
          environment: "node",
          storeSectionFactoryRegister: emptyMap,
          adminStoreFactoryRegister: emptyMap,
        }),
      ).toEqual({
        ai: false,
        mcp: false,
        cursor: false,
        designerTools: true,
        availableStoreTypes: [],
        creatableStoreTypes: [],
        storeAdministration: false,
      });
    });

    it("missing features.ai / features.mcp are false and missing features.designerTools is true", () => {
      expect(
        getProcessCapabilities({
          config: { features: {} },
          environment: "node",
          storeSectionFactoryRegister: emptyMap,
          adminStoreFactoryRegister: emptyMap,
        }),
      ).toEqual({
        ai: false,
        mcp: false,
        cursor: false,
        designerTools: true,
        availableStoreTypes: [],
        creatableStoreTypes: [],
        storeAdministration: false,
      });
    });

    it("sandbox environment forces ai false even when features.ai is true", () => {
      const snapshot = getProcessCapabilities({
        config: { features: { ai: true } },
        environment: "sandbox",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.ai).toBe(false);
    });

    it("node environment with features.ai true yields ai true", () => {
      const snapshot = getProcessCapabilities({
        config: { features: { ai: true } },
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.ai).toBe(true);
    });

    it("availableStoreTypes are unique first-seen storageTypes; creatableStoreTypes omit bundled", () => {
      const storeSectionFactoryRegister = new Map<string, unknown>([
        [JSON.stringify({ storageType: "indexedDb", section: "model" }), {}],
        [JSON.stringify({ storageType: "indexedDb", section: "data" }), {}],
        [JSON.stringify({ storageType: "bundled", section: "model" }), {}],
      ]);
      const snapshot = getProcessCapabilities({
        config: {},
        environment: "node",
        storeSectionFactoryRegister,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.availableStoreTypes).toEqual(["indexedDb", "bundled"]);
      expect(snapshot.creatableStoreTypes).toEqual(["indexedDb"]);
    });

    it("storeAdministration is false when the admin map is only bundled", () => {
      const adminStoreFactoryRegister = new Map<string, unknown>([
        [JSON.stringify({ storageType: "bundled" }), {}],
      ]);
      const snapshot = getProcessCapabilities({
        config: {},
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister,
      });
      expect(snapshot.storeAdministration).toBe(false);
    });

    it("storeAdministration is true when the admin map includes a non-bundled storageType", () => {
      const adminStoreFactoryRegister = new Map<string, unknown>([
        [JSON.stringify({ storageType: "indexedDb" }), {}],
      ]);
      const snapshot = getProcessCapabilities({
        config: {},
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister,
      });
      expect(snapshot.storeAdministration).toBe(true);
    });
  });

  describe("processCapabilities.273.phase1 — assertProcessCapability FeatureUnavailable", () => {
    it("returns Action2Error FeatureUnavailable when mcp is false", () => {
      const result = assertProcessCapability("mcp", disabledSnapshot);
      expect(result).toBeInstanceOf(Action2Error);
      expect(result).toMatchObject({
        status: "error",
        errorType: "FeatureUnavailable",
        errorContext: { capability: "mcp" },
      });
    });

    it("returns undefined when mcp is true", () => {
      const result = assertProcessCapability("mcp", {
        ...disabledSnapshot,
        mcp: true,
      });
      expect(result).toBeUndefined();
    });
  });
}
