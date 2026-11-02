import { describe, expect, it } from "vitest";

import {
  LOCAL_CACHE_ENV,
  localCacheKindFromEnvironment,
  localCacheKindFromValue,
} from "../../src/1_core/localCache/localCacheKind.js";

// #446, #656: the test platforms' local cache follows MIROIR_TEST_LOCAL_CACHE, redux when unset.

describe("localCacheKindFromEnvironment (#656)", () => {
  it.each([
    [undefined, "redux"],
    ["", "redux"],
    ["redux", "redux"],
    ["zustand", "zustand"],
  ])("%s selects %s", (value, expected) => {
    expect(localCacheKindFromValue(value)).toBe(expected);
    expect(localCacheKindFromEnvironment({ [LOCAL_CACHE_ENV]: value })).toBe(expected);
  });

  it("rejects an unknown implementation, naming the allowed ones", () => {
    expect(() => localCacheKindFromEnvironment({ [LOCAL_CACHE_ENV]: "mobx" })).toThrow(
      `${LOCAL_CACHE_ENV}=mobx is not a LocalCache implementation, use one of: redux, zustand`,
    );
  });

  it("selects redux without an environment", () => {
    expect(localCacheKindFromEnvironment(undefined)).toBe("redux");
  });
});
