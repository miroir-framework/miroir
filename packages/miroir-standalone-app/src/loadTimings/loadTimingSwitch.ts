import type { MiroirConfigClient } from "miroir-core";

import { DEFAULT_LOAD_TIMING_SWITCH, type LoadTimingSwitch } from "./loadTimingRecorder.js";

// ################################################################################################
// #580 D1: whether the page measures its load times. The environment's `client.loadTimings`
// decides, and the URL parameter `loadTimings=on|off` overrides it for the browser tab (kept in
// sessionStorage, so that the tab's later page loads keep it). A self-test page never measures: it
// does not render the application.
// Type imports only: this module is loaded with the page.
// ################################################################################################

export const LOAD_TIMINGS_URL_PARAMETER = "loadTimings";
export const LOAD_TIMINGS_STORAGE_KEY = "miroirLoadTimings";

/** The part of Storage the switch uses; sessionStorage in the browser. */
export type LoadTimingSwitchStorage = Pick<Storage, "getItem" | "setItem">;

function tabOverride(search: string, storage: LoadTimingSwitchStorage | undefined): boolean | undefined {
  const fromUrl = new URLSearchParams(search).get(LOAD_TIMINGS_URL_PARAMETER);
  if (fromUrl === "on" || fromUrl === "off") {
    try {
      storage?.setItem(LOAD_TIMINGS_STORAGE_KEY, fromUrl);
    } catch {
      // storage refused (private mode): the override holds for this page load only
    }
    return fromUrl === "on";
  }
  try {
    const stored = storage?.getItem(LOAD_TIMINGS_STORAGE_KEY);
    return stored === "on" ? true : stored === "off" ? false : undefined;
  } catch {
    return undefined;
  }
}

export function resolveLoadTimingsSwitch(
  config: Pick<MiroirConfigClient, "loadTimings" | "selfTest"> | undefined,
  search: string,
  storage: LoadTimingSwitchStorage | undefined,
): LoadTimingSwitch {
  const configured = config?.loadTimings;
  const override = tabOverride(search, storage);
  const enabled = config?.selfTest?.enabled ? false : (override ?? configured?.enabled ?? false);
  return {
    enabled,
    record: configured?.record ?? DEFAULT_LOAD_TIMING_SWITCH.record,
    quietWindowMs: configured?.quietWindowMs ?? DEFAULT_LOAD_TIMING_SWITCH.quietWindowMs,
    maxStepMs: configured?.maxStepMs ?? DEFAULT_LOAD_TIMING_SWITCH.maxStepMs,
  };
}

/**
 * Whether the client configuration gives the deployment the store section, where the steps are
 * recorded (#580 D8; #647: the devData section of the Miroir deployment).
 */
export function configurationHasSection(
  config: MiroirConfigClient | undefined,
  deploymentUuid: string,
  section: string,
): boolean {
  if (!config) {
    return false;
  }
  const deployments = config.client.emulateServer
    ? config.client.deploymentStorageConfig
    : config.client.serverConfig.storeSectionConfiguration;
  return !!(deployments?.[deploymentUuid] as Record<string, unknown> | undefined)?.[section];
}
