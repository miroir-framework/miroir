import { describe, expect, it } from "vitest";

import {
  isMiroirTestStorageType,
  parseStorageArg,
} from "miroir-core";

import {
  realServerProfileNameForStorage,
  resolveRealServerUiIntegrationProfile,
  storageFromRealServerProfileName,
} from "./resolveRealServerUiIntegrationProfile.js";

describe("parseStorageArg", () => {
  it("parses --storage and -S", () => {
    expect(parseStorageArg(["--storage", "sql"])).toBe("sql");
    expect(parseStorageArg(["-S", "filesystem"])).toBe("filesystem");
    expect(parseStorageArg(["--storage", "indexedDb", "other"])).toBe("indexedDb");
    expect(parseStorageArg(["--storage", "mongodb"])).toBe("mongodb");
  });

  it("returns undefined when absent", () => {
    expect(parseStorageArg([])).toBeUndefined();
    expect(parseStorageArg(["--profile", "realServer-sql"])).toBeUndefined();
  });

  it("rejects invalid values", () => {
    expect(() => parseStorageArg(["--storage", "redis"])).toThrow(/Invalid --storage/);
    expect(() => parseStorageArg(["--storage"])).toThrow(/Missing value/);
  });
});

describe("resolveRealServerUiIntegrationProfile", () => {
  it("prefers --storage over env and default", () => {
    expect(
      resolveRealServerUiIntegrationProfile({
        argv: ["--storage", "mongodb"],
        env: {
          MIROIR_TEST_STORAGE: "sql",
          VITE_MIROIR_TEST_CONFIG_FILENAME:
            "./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-filesystem.json",
        },
      }),
    ).toEqual({ storage: "mongodb", profileName: "realServer-mongodb" });
  });

  it("uses MIROIR_TEST_STORAGE when argv has no --storage", () => {
    expect(
      resolveRealServerUiIntegrationProfile({
        argv: [],
        env: { MIROIR_TEST_STORAGE: "indexedDb" },
      }),
    ).toEqual({ storage: "indexedDb", profileName: "realServer-indexedDb" });
  });

  it("uses --profile realServer-* when present", () => {
    expect(
      resolveRealServerUiIntegrationProfile({
        argv: ["--profile", "realServer-filesystem"],
        env: {},
      }),
    ).toEqual({ storage: "filesystem", profileName: "realServer-filesystem" });
  });

  it("derives storage from VITE_MIROIR_TEST_CONFIG_FILENAME", () => {
    expect(
      resolveRealServerUiIntegrationProfile({
        argv: [],
        env: {
          VITE_MIROIR_TEST_CONFIG_FILENAME:
            "./packages/miroir-standalone-app/tests/miroirConfig.test-realServer-sql.json",
        },
      }),
    ).toEqual({ storage: "sql", profileName: "realServer-sql" });
  });

  it("defaults to sql / realServer-sql", () => {
    expect(resolveRealServerUiIntegrationProfile({ argv: [], env: {} })).toEqual({
      storage: "sql",
      profileName: "realServer-sql",
    });
  });

  it("rejects non-realServer --profile", () => {
    expect(() =>
      resolveRealServerUiIntegrationProfile({
        argv: ["--profile", "emulatedServer-sql"],
        env: {},
      }),
    ).toThrow(/not a realServer-\* profile/);
  });
});

describe("realServer profile name helpers", () => {
  it("round-trips storage ↔ profile name", () => {
    for (const storage of ["sql", "filesystem", "indexedDb", "mongodb"] as const) {
      expect(isMiroirTestStorageType(storage)).toBe(true);
      const profileName = realServerProfileNameForStorage(storage);
      expect(profileName).toBe(`realServer-${storage}`);
      expect(storageFromRealServerProfileName(profileName)).toBe(storage);
    }
  });
});
