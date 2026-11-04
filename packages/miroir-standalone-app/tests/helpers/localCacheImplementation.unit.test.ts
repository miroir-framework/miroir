import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCAL_CACHE_ENV } from "@miroir-framework/core";

import { loadLocalCacheImplementation } from "miroir-react-testing/src/4-tests/localCacheImplementation.js";

// #446, #656: the tests' LocalCache implementation follows MIROIR_TEST_LOCAL_CACHE, redux when unset
// (the value itself is parsed by core's localCacheKindFromEnvironment, tested there).

describe("test LocalCache implementation (#446)", () => {
  it.each(["redux", "zustand"] as const)("loads the %s local cache", async (implementation) => {
    const module = await loadLocalCacheImplementation(implementation);

    expect(module.kind).toBe(implementation);
  });

  describe("without an argument, from MIROIR_TEST_LOCAL_CACHE", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it.each([
      [undefined, "redux"],
      ["redux", "redux"],
      ["zustand", "zustand"],
    ] as const)("%s loads %s", async (value, expected) => {
      vi.stubEnv(LOCAL_CACHE_ENV, value);

      expect((await loadLocalCacheImplementation()).kind).toBe(expected);
    });

    it("throws on an unknown value", async () => {
      vi.stubEnv(LOCAL_CACHE_ENV, "mobx");

      await expect(loadLocalCacheImplementation()).rejects.toThrow(`${LOCAL_CACHE_ENV}=mobx`);
    });
  });
});
