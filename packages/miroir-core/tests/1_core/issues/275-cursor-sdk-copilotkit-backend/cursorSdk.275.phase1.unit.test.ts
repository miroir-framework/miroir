/**
 * #275 Slice 1 — features.cursor snapshot.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import {
  Action2Error,
  assertProcessCapability,
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  getProcessCapabilities,
  RestClientStub,
  type ProcessCapabilities,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase1";

const emptyMap = new Map<string, unknown>();

const snapshotWithCursorFalse: ProcessCapabilities = {
  ai: false,
  mcp: false,
  cursor: false,
  designerTools: true,
  availableStoreTypes: [],
  creatableStoreTypes: [],
  storeAdministration: false,
};

const snapshotWithCursorTrue: ProcessCapabilities = {
  ...snapshotWithCursorFalse,
  cursor: true,
};

if (runThis) {
  describe("cursorSdk.275.phase1 — missing features.cursor is false", () => {
    it("empty config yields cursor false", () => {
      const snapshot = getProcessCapabilities({
        config: {},
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(false);
    });

    it("{ features: {} } yields cursor false", () => {
      const snapshot = getProcessCapabilities({
        config: { features: {} },
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(false);
    });
  });

  describe("cursorSdk.275.phase1 — features.cursor true on node is independent of ai", () => {
    it("cursor true when features.ai is missing", () => {
      const snapshot = getProcessCapabilities({
        config: { features: { cursor: true } },
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(true);
    });

    it("cursor true when features.ai is false", () => {
      const snapshot = getProcessCapabilities({
        config: { features: { cursor: true, ai: false } },
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(true);
      expect(snapshot.ai).toBe(false);
    });
  });

  describe("cursorSdk.275.phase1 — sandbox does not force cursor false", () => {
    it("features.cursor true in sandbox keeps cursor true and still forces ai false", () => {
      const snapshot = getProcessCapabilities({
        config: { features: { cursor: true, ai: true } },
        environment: "sandbox",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(true);
      expect(snapshot.ai).toBe(false);
    });
  });

  describe("cursorSdk.275.phase1 — FAIL_CLOSED_PROCESS_CAPABILITIES.cursor", () => {
    it("is false", () => {
      expect(FAIL_CLOSED_PROCESS_CAPABILITIES.cursor).toBe(false);
    });
  });

  describe("cursorSdk.275.phase1 — assertProcessCapability FeatureUnavailable", () => {
    it("returns Action2Error FeatureUnavailable when cursor is false", () => {
      const result = assertProcessCapability("cursor", snapshotWithCursorFalse);
      expect(result).toBeInstanceOf(Action2Error);
      expect(result).toMatchObject({
        status: "error",
        errorType: "FeatureUnavailable",
        errorContext: { capability: "cursor" },
      });
    });
  });

  describe("cursorSdk.275.phase1 — GET /capabilities includes cursor", () => {
    it("returns HTTP 200 and the stored snapshot after setProcessCapabilities", async () => {
      const stub = new RestClientStub("http://test");
      stub.setProcessCapabilities(snapshotWithCursorTrue);
      const result = await stub.get("/capabilities", "/capabilities");
      expect(result).toMatchObject({
        status: 200,
        data: { status: "ok", capabilities: snapshotWithCursorTrue },
      });
    });
  });
}
