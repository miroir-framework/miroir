import { afterEach, describe, expect, it, vi } from "vitest";

import * as localCacheRedux from "miroir-localcache-redux";
import * as localCacheZustand from "miroir-localcache-zustand";

import {
  LOCAL_CACHE_ENV,
  loadLocalCacheImplementation,
  testLocalCacheImplementation,
} from "../../src/miroir-fwk/4-tests/localCacheImplementation";

// #446: the tests' LocalCache implementation follows MIROIR_TEST_LOCAL_CACHE, redux when unset.

describe("test LocalCache implementation (#446)", () => {
  it.each([
    [undefined, "redux"],
    ["", "redux"],
    ["redux", "redux"],
    ["zustand", "zustand"],
  ])("%s selects %s", (value, expected) => {
    expect(testLocalCacheImplementation(value)).toBe(expected);
  });

  it("rejects an unknown implementation, naming the allowed ones", () => {
    expect(() => testLocalCacheImplementation("mobx")).toThrow(
      `${LOCAL_CACHE_ENV}=mobx is not a LocalCache implementation, use one of: redux, zustand`,
    );
  });

  it.each([
    ["redux", localCacheRedux],
    ["zustand", localCacheZustand],
  ] as const)("loads the %s package", async (implementation, expected) => {
    const module = await loadLocalCacheImplementation(implementation);

    expect(module.setupMiroirDomainController).toBe(expected.setupMiroirDomainController);
    expect(module.RestPersistenceClientAndRestClient).toBe(expected.RestPersistenceClientAndRestClient);
  });

  describe("without an argument, from MIROIR_TEST_LOCAL_CACHE", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it.each([
      [undefined, localCacheRedux],
      ["redux", localCacheRedux],
      ["zustand", localCacheZustand],
    ] as const)("%s loads the matching package", async (value, expected) => {
      vi.stubEnv(LOCAL_CACHE_ENV, value);

      const module = await loadLocalCacheImplementation();

      expect(module.setupMiroirDomainController).toBe(expected.setupMiroirDomainController);
    });

    it("throws on an unknown value", async () => {
      vi.stubEnv(LOCAL_CACHE_ENV, "mobx");

      await expect(loadLocalCacheImplementation()).rejects.toThrow(`${LOCAL_CACHE_ENV}=mobx`);
    });
  });
});
