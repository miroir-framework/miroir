/**
 * Runtime tracing for manual vendor chunks and Vite prebundled deps.
 *
 * Production build: logs when Rollup `vendor-*.js` files execute (injected
 * preamble) and when matching scripts appear in PerformanceResourceTiming.
 *
 * Vite dev (`npm run dev`): Rollup manual chunks are not emitted; this module
 * watches script loads and maps URLs to the same vendor chunk names where
 * possible (including `.vite/deps/@copilotkit_*.js` style prebundle files).
 *
 * Disable: VITE_MIROIR_LOG_CHUNK_LOADS=false
 */

import { MIROIR_MANUAL_CHUNK_NAMES } from "../vite/manualChunks.js";

const LOG_PREFIX = "[miroir-chunk-load]";

function isEnabled(): boolean {
  return import.meta.env.VITE_MIROIR_LOG_CHUNK_LOADS !== "false";
}

/** @type {Set<string>} */
const loggedKeys =
  (globalThis as typeof globalThis & { __miroirLoggedManualChunks?: Set<string> })
    .__miroirLoggedManualChunks ??
  ((globalThis as typeof globalThis & { __miroirLoggedManualChunks: Set<string> })
    .__miroirLoggedManualChunks = new Set());

/**
 * @param {string} url
 * @returns {string | undefined}
 */
export function resolveChunkLabelFromScriptUrl(url: string): string | undefined {
  const normalized = url.replace(/\\/g, "/").toLowerCase();

  for (const chunkName of MIROIR_MANUAL_CHUNK_NAMES) {
    if (normalized.includes(`/${chunkName}`) || normalized.includes(`${chunkName}.`)) {
      return chunkName;
    }
  }

  if (
    normalized.includes("/node_modules/react-dom/") ||
    normalized.includes("/react-dom.") ||
    normalized.includes("/node_modules/react/") ||
    normalized.includes("/deps/react.") ||
    normalized.includes("/deps/react-dom.")
  ) {
    return "vendor-react";
  }
  if (normalized.includes("@copilotkit") || normalized.includes("/copilotkit")) {
    return "vendor-copilotkit";
  }
  if (
    normalized.includes("/node_modules/d3/") ||
    normalized.includes("/deps/d3.") ||
    normalized.includes("miroir-diagram-class")
  ) {
    return "vendor-d3";
  }
  if (normalized.includes("ag-grid")) {
    return "vendor-ag-grid";
  }
  if (normalized.includes("@mui/material") || normalized.includes("@mui_icons-material")) {
    return "vendor-mui";
  }

  return undefined;
}

/**
 * @param {{ chunk: string, file: string, mode: "dev" | "prod" | "build-inject" }} payload
 */
export function logManualChunkLoad(payload: {
  chunk: string;
  file: string;
  mode: "dev" | "prod" | "build-inject";
}): void {
  if (!isEnabled()) {
    return;
  }
  const key = payload.chunk;
  if (loggedKeys.has(key)) {
    return;
  }
  loggedKeys.add(key);
  console.info(LOG_PREFIX, {
    chunk: payload.chunk,
    file: payload.file,
    at: new Date().toISOString(),
    mode: payload.mode,
  });
}

function inspectResourceEntry(entry: PerformanceResourceTiming): void {
  if (entry.initiatorType !== "script" && entry.initiatorType !== "link" && entry.initiatorType !== "other") {
    return;
  }
  const url = entry.name;
  if (!url.includes(".js") && !url.includes(".mjs")) {
    return;
  }

  const chunk = resolveChunkLabelFromScriptUrl(url);
  if (chunk) {
    logManualChunkLoad({
      chunk,
      file: url,
      mode: import.meta.env.DEV ? "dev" : "prod",
    });
    return;
  }

  // Dev-only: surface opaque Vite prebundle files (chunk-HASH.js) once each.
  if (import.meta.env.DEV && url.includes("/node_modules/.vite/deps/")) {
    const basename = url.split("/").pop()?.split("?")[0] ?? url;
    logManualChunkLoad({
      chunk: `vite-prebundle:${basename}`,
      file: url,
      mode: "dev",
    });
  }
}

function startPerformanceObserver(): void {
  if (typeof PerformanceObserver === "undefined") {
    return;
  }
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        inspectResourceEntry(entry as PerformanceResourceTiming);
      }
    });
    observer.observe({ type: "resource", buffered: true });
  } catch {
    // Some environments lack resource timing support.
  }

  for (const entry of performance.getEntriesByType("resource")) {
    inspectResourceEntry(entry as PerformanceResourceTiming);
  }
}

if (typeof window !== "undefined" && isEnabled()) {
  startPerformanceObserver();
}
