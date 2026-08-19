/**
 * Canonical Miroir log-config presets (consolidated).
 *
 * Single source of truth for tests AND dev/runtime. Presets are keyed by a
 * short name; both the test harness (Node, reads from disk via
 * VITE_MIROIR_LOG_CONFIG_FILENAME) and the web app (browser, resolves a static
 * import map) go through here so the same named config behaves identically.
 */

import type { LoggerOptions } from "miroir-core";

import catchAll from "../../config/logging/catch-all.json";
import catchAllDetailed from "../../config/logging/catch-all-detailed.json";
import fullDebug from "../../config/logging/full-debug.json";
import scopeQuery from "../../config/logging/scope-query.json";
import scopeQueryLocal from "../../config/logging/scope-query-local.json";
import scopePersistence from "../../config/logging/scope-persistence.json";
import scopeTransformers from "../../config/logging/scope-transformers.json";
import scopeUi from "../../config/logging/scope-ui.json";

/** Named presets available everywhere. */
export const LOG_CONFIG_PRESETS: Record<string, LoggerOptions> = {
  "catch-all": catchAll as unknown as LoggerOptions,
  "catch-all-detailed": catchAllDetailed as unknown as LoggerOptions,
  "full-debug": fullDebug as unknown as LoggerOptions,
  "scope-query": scopeQuery as unknown as LoggerOptions,
  "scope-query-local": scopeQueryLocal as unknown as LoggerOptions,
  "scope-persistence": scopePersistence as unknown as LoggerOptions,
  "scope-transformers": scopeTransformers as unknown as LoggerOptions,
  "scope-ui": scopeUi as unknown as LoggerOptions,
};

/** Valid values for `VITE_MIROIR_LOG_CONFIG` and `VITE_MIROIR_LOG_CONFIG_FILENAME`. */
export const VITE_MIROIR_LOG_CONFIG_VALUES = Object.keys(LOG_CONFIG_PRESETS);

/** Default preset used when nothing is specified. Low-noise catch-all. */
export const DEFAULT_LOG_CONFIG_NAME = "catch-all";

export interface WebLogConfigResolution {
  presetName: string;
  loggerOptions: LoggerOptions;
  rawSelection: string | undefined;
  usedFallback: boolean;
}

function normalizePresetKey(raw: string): string {
  return String(raw).split(/[\\/]/).pop()!.replace(/\.json$/i, "");
}

/** Raw env selection for the web app (Vite `import.meta.env` or Node `process.env`). */
export function getWebLogConfigSelection(): string | undefined {
  const fromImportMeta =
    typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_MIROIR_LOG_CONFIG ??
        (import.meta as any).env?.VITE_MIROIR_LOG_CONFIG_FILENAME
      : undefined;
  if (fromImportMeta) {
    return String(fromImportMeta);
  }
  if (typeof process !== "undefined") {
    const fromProcess =
      process.env?.VITE_MIROIR_LOG_CONFIG ?? process.env?.VITE_MIROIR_LOG_CONFIG_FILENAME;
    if (fromProcess) {
      return fromProcess;
    }
  }
  return undefined;
}

/**
 * Resolve a log config for the web app, including which preset was chosen.
 *
 * Accepts either a preset name (e.g. "catch-all", "scope-query") or a
 * config file basename (e.g. "scope-query.json"). Falls back to the default
 * preset when the selection is unknown. Selection source:
 * `VITE_MIROIR_LOG_CONFIG` / `VITE_MIROIR_LOG_CONFIG_FILENAME`.
 */
export function resolveWebLogConfigWithMeta(
  selection?: string | undefined,
): WebLogConfigResolution {
  const rawSelection = selection ?? getWebLogConfigSelection();
  if (!rawSelection) {
    return {
      presetName: DEFAULT_LOG_CONFIG_NAME,
      loggerOptions: LOG_CONFIG_PRESETS[DEFAULT_LOG_CONFIG_NAME],
      rawSelection: undefined,
      usedFallback: false,
    };
  }
  const presetName = normalizePresetKey(rawSelection);
  const loggerOptions = LOG_CONFIG_PRESETS[presetName];
  if (loggerOptions) {
    return {
      presetName,
      loggerOptions,
      rawSelection,
      usedFallback: false,
    };
  }
  return {
    presetName: DEFAULT_LOG_CONFIG_NAME,
    loggerOptions: LOG_CONFIG_PRESETS[DEFAULT_LOG_CONFIG_NAME],
    rawSelection,
    usedFallback: true,
  };
}

/**
 * Resolve a log config for the web app.
 *
 * Accepts either a preset name (e.g. "catch-all", "scope-query") or a
 * config file basename (e.g. "scope-query.json"). Falls back to the default
 * preset. Selection source: `VITE_MIROIR_LOG_CONFIG` / `VITE_MIROIR_LOG_CONFIG_FILENAME`.
 */
export function resolveWebLogConfig(selection?: string | undefined): LoggerOptions {
  return resolveWebLogConfigWithMeta(selection).loggerOptions;
}
