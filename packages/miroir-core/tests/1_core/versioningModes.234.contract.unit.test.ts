/**
 * #234 Slice 1.1 — versioningMode contract on SelfApplication.
 */
import { describe, expect, it } from "vitest";

import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import { selfApplication } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { SelfApplication } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  assertApplicationVersioningEnabled,
  resolveVersioningMode,
  type VersioningMode,
} from "../../src/1_core/versioning/versioningMode.js";

const MODES: VersioningMode[] = ["unversioned", "versioned-internal", "versioned-external"];

describe("234 Slice 1.1 — versioningMode contract", () => {
  it("SelfApplication schema accepts all three versioningMode values", () => {
    for (const versioningMode of MODES) {
      const row: SelfApplication = {
        uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
        name: "TestApp",
        defaultLabel: "Test",
        versioningMode,
      };
      expect(selfApplication.parse(row).versioningMode).toBe(versioningMode);
    }
  });

  it("SelfApplication schema rejects invalid versioningMode strings", () => {
    const row = {
      uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
      name: "TestApp",
      defaultLabel: "Test",
      versioningMode: "versioned-git",
    };
    expect(() => selfApplication.parse(row)).toThrow();
  });

  it("legacy row with only versioningEnabled: true still parses", () => {
    const row = {
      uuid: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
      name: "TestApp",
      defaultLabel: "Test",
      versioningEnabled: true,
    };
    expect(selfApplication.parse(row).versioningEnabled).toBe(true);
    expect(selfApplication.parse(row).versioningMode).toBeUndefined();
  });

  it("resolveVersioningMode maps explicit modes", () => {
    expect(resolveVersioningMode({ versioningMode: "unversioned" })).toBe("unversioned");
    expect(resolveVersioningMode({ versioningMode: "versioned-internal" })).toBe(
      "versioned-internal",
    );
    expect(resolveVersioningMode({ versioningMode: "versioned-external" })).toBe(
      "versioned-external",
    );
  });

  it("resolveVersioningMode defaults legacy versioningEnabled: true to versioned-internal", () => {
    expect(resolveVersioningMode({ versioningEnabled: true })).toBe("versioned-internal");
    expect(resolveVersioningMode({ versioningEnabled: "true" as unknown as boolean })).toBe(
      "versioned-internal",
    );
  });

  it("resolveVersioningMode treats absent/false flags as unversioned", () => {
    expect(resolveVersioningMode({})).toBe("unversioned");
    expect(resolveVersioningMode({ versioningEnabled: false })).toBe("unversioned");
  });

  it("explicit versioningMode wins over versioningEnabled", () => {
    expect(
      resolveVersioningMode({ versioningEnabled: true, versioningMode: "versioned-external" }),
    ).toBe("versioned-external");
    expect(
      resolveVersioningMode({ versioningEnabled: false, versioningMode: "versioned-internal" }),
    ).toBe("versioned-internal");
  });

  it("assertApplicationVersioningEnabled allows versioned-internal and legacy true", () => {
    expect(() =>
      assertApplicationVersioningEnabled({ versioningMode: "versioned-internal" }),
    ).not.toThrow();
    expect(() => assertApplicationVersioningEnabled({ versioningEnabled: true })).not.toThrow();
  });

  it("assertApplicationVersioningEnabled rejects versioned-external and unversioned", () => {
    expect(() =>
      assertApplicationVersioningEnabled({ versioningMode: "versioned-external" }),
    ).toThrow(/versioned-external/);
    expect(() => assertApplicationVersioningEnabled({ versioningMode: "unversioned" })).toThrow();
    expect(() => assertApplicationVersioningEnabled({ versioningEnabled: false })).toThrow();
  });

  it("deployed selfApplicationMiroir export parses and resolves to versioned-internal", () => {
    expect(selfApplication.parse(selfApplicationMiroir).versioningMode).toBe("versioned-internal");
    expect(resolveVersioningMode(selfApplicationMiroir as SelfApplication)).toBe(
      "versioned-internal",
    );
  });
});
