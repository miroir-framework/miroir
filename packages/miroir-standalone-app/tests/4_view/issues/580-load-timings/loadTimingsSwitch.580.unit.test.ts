/**
 * #580 D1, D8: the environment's `client.loadTimings`, the per-tab URL override, the self-test veto,
 * and whether the client configuration lists the Meta deployment.
 *
 * Not reachable through MiroirTest: it reads the page URL and sessionStorage.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- loadTimingsSwitch.580
 * ```
 */
import { describe, expect, it } from "vitest";

import type { MiroirConfigClient } from "miroir-core";

import { META_DEPLOYMENT_UUID } from "../../../../src/loadTimings/loadTimingConstants.js";
import {
  configurationListsDeployment,
  resolveLoadTimingsSwitch,
  type LoadTimingSwitchStorage,
} from "../../../../src/loadTimings/loadTimingSwitch.js";

function memoryStorage(): LoadTimingSwitchStorage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => void values.set(key, value) };
}

describe("load timings switch (#580)", () => {
  it("is off by default", () => {
    expect(resolveLoadTimingsSwitch({}, "", memoryStorage())).toEqual({
      enabled: false,
      record: true,
      quietWindowMs: 1500,
      maxStepMs: 30000,
    });
  });

  it("follows the environment, with its settings", () => {
    const value = resolveLoadTimingsSwitch({ loadTimings: { enabled: true, record: false, quietWindowMs: 900 } }, "", memoryStorage());
    expect([value.enabled, value.record, value.quietWindowMs, value.maxStepMs]).toEqual([true, false, 900, 30000]);
  });

  it("turns on for the tab with ?loadTimings=on, and stays on for the tab's next page loads", () => {
    const storage = memoryStorage();
    expect(resolveLoadTimingsSwitch({}, "?page=home&loadTimings=on", storage).enabled).toBe(true);
    expect(resolveLoadTimingsSwitch({}, "?page=report", storage).enabled).toBe(true);
  });

  it("turns off for the tab with ?loadTimings=off, whatever the environment says", () => {
    const storage = memoryStorage();
    expect(resolveLoadTimingsSwitch({ loadTimings: { enabled: true } }, "?loadTimings=off", storage).enabled).toBe(false);
    expect(resolveLoadTimingsSwitch({ loadTimings: { enabled: true } }, "", storage).enabled).toBe(false);
  });

  it("is off on a self-test page", () => {
    expect(
      resolveLoadTimingsSwitch({ loadTimings: { enabled: true }, selfTest: { enabled: true } }, "?loadTimings=on", memoryStorage()).enabled,
    ).toBe(false);
  });

  it("knows whether the client configuration lists the Meta deployment", () => {
    const listing = (deployments: string[]) =>
      ({
        miroirConfigType: "client",
        client: {
          emulateServer: false,
          serverConfig: { rootApiUrl: "https://localhost:3080", storeSectionConfiguration: Object.fromEntries(deployments.map((d) => [d, {}])) },
        },
      }) as unknown as MiroirConfigClient;
    expect(configurationListsDeployment(listing([META_DEPLOYMENT_UUID]), META_DEPLOYMENT_UUID)).toBe(true);
    expect(configurationListsDeployment(listing(["10ff36f2-50a3-48d8-b80f-e48e5d13af8e"]), META_DEPLOYMENT_UUID)).toBe(false);
  });
});
