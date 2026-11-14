/**
 * versioningMode contract on SelfApplication.
 */
import { describe, expect, it } from "vitest";

import { selfApplicationMiroir } from "miroir-app-miroir";

import { selfApplication } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { SelfApplication } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  assertApplicationVersioningEnabled,
  getFreezeAvailability,
  resolveVersioningMode,
  type VersioningMode,
} from "../../src/1_core/versioning/versioningMode.js";

const MODES: VersioningMode[] = ["unversioned", "versioned-internal", "versioned-git"];

describe("versioningMode contract on SelfApplication", () => {
  it("SelfApplication schema accepts the three versioningMode values, and the older versioned-external", () => {
    for (const versioningMode of [...MODES, "versioned-external" as const]) {
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
      versioningMode: "versioned-svn",
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
    expect(resolveVersioningMode({ versioningMode: "versioned-git" })).toBe("versioned-git");
  });

  // #708 (D6): versioned-external is the older name of versioned-git
  it("resolveVersioningMode reads versioned-external as versioned-git", () => {
    expect(resolveVersioningMode({ versioningMode: "versioned-external" })).toBe("versioned-git");
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
      resolveVersioningMode({ versioningEnabled: true, versioningMode: "versioned-git" }),
    ).toBe("versioned-git");
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

  it("assertApplicationVersioningEnabled rejects versioned-git, versioned-external and unversioned", () => {
    expect(() => assertApplicationVersioningEnabled({ versioningMode: "versioned-git" })).toThrow(/versioned-git/);
    expect(() => assertApplicationVersioningEnabled({ versioningMode: "versioned-external" })).toThrow(
      /versioned-git/,
    );
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

describe("getFreezeAvailability (#225)", () => {
  it("allows only versioned-internal applications", () => {
    expect(getFreezeAvailability({ versioningMode: "versioned-internal" })).toEqual({ available: true });
    expect(getFreezeAvailability({ versioningEnabled: true })).toEqual({ available: true });
  });

  it("refuses unversioned applications with a reason", () => {
    expect(getFreezeAvailability({ versioningMode: "unversioned" })).toEqual({
      available: false,
      reason: "Application is not versioned",
    });
    expect(getFreezeAvailability({})).toEqual({
      available: false,
      reason: "Application is not versioned",
    });
  });

  it("refuses versioned-git applications, and versioned-external ones, with a reason", () => {
    for (const versioningMode of ["versioned-git", "versioned-external"]) {
      expect(getFreezeAvailability({ versioningMode })).toEqual({
        available: false,
        reason: "The model history is kept in Git (versioned-git)",
      });
    }
  });

  it("refuses an application whose SelfApplication row is not loaded", () => {
    expect(getFreezeAvailability(undefined)).toEqual({
      available: false,
      reason: "Application not loaded in this session",
    });
  });
});
