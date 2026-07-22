import { describe, expect, it } from "vitest";

import { shouldTraceEvolutionEvent } from "../../src/2_domain/evolutionTracePolicy.js";
import type { ApplicationSection } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

// UUID of the Miroir selfApplication — matches the deployed asset.
const MIROIR_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_UUID = "dd986507-6b28-4aac-a27a-f2dfba2aa0e4"; // any non-Miroir app

describe("shouldTraceEvolutionEvent", () => {
  describe("non-Miroir application", () => {
    it("traces model-section events", () => {
      expect(shouldTraceEvolutionEvent(LIBRARY_UUID, "model" as ApplicationSection)).toBe(true);
    });

    it("does NOT trace data-section events", () => {
      expect(shouldTraceEvolutionEvent(LIBRARY_UUID, "data" as ApplicationSection)).toBe(false);
    });
  });

  describe("Miroir application (special case)", () => {
    it("traces model-section events", () => {
      expect(shouldTraceEvolutionEvent(MIROIR_UUID, "model" as ApplicationSection)).toBe(true);
    });

    it("also traces data-section events (Miroir data = application model layer)", () => {
      expect(shouldTraceEvolutionEvent(MIROIR_UUID, "data" as ApplicationSection)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns false for unknown section string on non-Miroir app", () => {
      // metaModel or any unrecognised section should be treated conservatively.
      expect(shouldTraceEvolutionEvent(LIBRARY_UUID, "metaModel" as ApplicationSection)).toBe(false);
    });

    it("returns false for unknown section string on Miroir app", () => {
      expect(shouldTraceEvolutionEvent(MIROIR_UUID, "metaModel" as ApplicationSection)).toBe(false);
    });
  });
});
