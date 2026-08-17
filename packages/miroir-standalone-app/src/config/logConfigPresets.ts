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

/** Default preset used when nothing is specified. Low-noise catch-all. */
export const DEFAULT_LOG_CONFIG_NAME = "catch-all";

/**
 * Resolve a log config for the web app.
 *
 * Accepts either a preset name (e.g. "catch-all", "scope-query") or a
 * config file basename (e.g. "scope-query.json"). Falls back to the default
 * preset. Selection source: `VITE_MIROIR_LOG_CONFIG` / `VITE_MIROIR_LOG_CONFIG_FILENAME`.
 */
export function resolveWebLogConfig(selection?: string | undefined): LoggerOptions {
  const raw =
    selection ??
    (typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_MIROIR_LOG_CONFIG ??
        (import.meta as any).env?.VITE_MIROIR_LOG_CONFIG_FILENAME
      : undefined);
  if (!raw) {
    return LOG_CONFIG_PRESETS[DEFAULT_LOG_CONFIG_NAME];
  }
  const base = String(raw).split(/[\\/]/).pop()!.replace(/\.json$/i, "");
  return LOG_CONFIG_PRESETS[base] ?? LOG_CONFIG_PRESETS[DEFAULT_LOG_CONFIG_NAME];
}
