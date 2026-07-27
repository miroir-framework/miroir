/**
 * #216 Phase 1.1 — assertApplicationVersioningEnabled gate.
 */
import { describe, expect, it } from "vitest";

import { assertApplicationVersioningEnabled } from "../../src/1_core/applicationVersionFreeze.js";

describe("216 Phase 1 — assertApplicationVersioningEnabled", () => {
  it("does not throw for versioningEnabled: true", () => {
    expect(() => assertApplicationVersioningEnabled({ versioningEnabled: true })).not.toThrow();
  });

  it("throws for versioningEnabled: false", () => {
    expect(() => assertApplicationVersioningEnabled({ versioningEnabled: false })).toThrow();
  });

  it("throws when versioningEnabled is undefined", () => {
    expect(() => assertApplicationVersioningEnabled({} as any)).toThrow();
  });

  it("throws when versioningEnabled is absent (no property)", () => {
    expect(() => assertApplicationVersioningEnabled({ name: "x" } as any)).toThrow();
  });
});
