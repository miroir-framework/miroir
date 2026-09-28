/**
 * Prepends a console.info to each manual vendor chunk so DevTools shows when
 * Rollup split output is evaluated (network fetch + module execution).
 *
 * Applies to production builds only (`apply: "build"`). Vite dev uses
 * `src/chunkLoadTrace.ts` (PerformanceObserver on script URLs).
 *
 * Disable at build time: VITE_MIROIR_LOG_CHUNK_LOADS=false
 */

import { MIROIR_MANUAL_CHUNK_NAMES } from "./manualChunks.js";

const MANUAL_CHUNK_NAMES = new Set(MIROIR_MANUAL_CHUNK_NAMES);

/** Shared with src/chunkLoadTrace.ts so build-injected logs dedupe with runtime observer. */
function BUILD_INJECT_PREAMBLE(chunkName, fileName) {
  return `(function(){var k=${JSON.stringify(chunkName)};var s=globalThis.__miroirLoggedManualChunks||(globalThis.__miroirLoggedManualChunks=new Set());if(s.has(k))return;s.add(k);console.info("[miroir-chunk-load]",{chunk:k,file:${JSON.stringify(fileName)},mode:"build-inject",at:new Date().toISOString()});})();\n`;
}

/**
 * @param {{ enabled?: boolean }} [options]
 * @returns {import('vite').Plugin}
 */
export function miroirManualChunkLoadLogger(options = {}) {
  const enabled =
    options.enabled ??
    process.env.VITE_MIROIR_LOG_CHUNK_LOADS !== "false";

  return {
    name: "miroir-manual-chunk-load-logger",
    apply: "build",
    // A banner, not renderChunk: Rollup shifts the chunk's sourcemap past it, whereas a
    // renderChunk that returns no map leaves the chunk with an empty sourcemap (#326).
    banner(chunk) {
      if (!enabled || !chunk.name || !MANUAL_CHUNK_NAMES.has(chunk.name)) {
        return "";
      }
      return BUILD_INJECT_PREAMBLE(chunk.name, chunk.fileName);
    },
  };
}
