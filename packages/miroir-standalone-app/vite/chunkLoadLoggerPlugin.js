/**
 * Prepends a console.info to each manual vendor chunk so DevTools shows when
 * Rollup split output is evaluated (network fetch + module execution).
 *
 * Applies to production builds only (`apply: "build"`). Dev server does not
 * emit manual chunks.
 *
 * Disable at build time: VITE_MIROIR_LOG_CHUNK_LOADS=false
 */

import { MIROIR_MANUAL_CHUNK_NAMES } from "./manualChunks.js";

const MANUAL_CHUNK_NAMES = new Set(MIROIR_MANUAL_CHUNK_NAMES);

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
    renderChunk(code, chunk) {
      if (!enabled) {
        return null;
      }
      const chunkName = chunk.name;
      if (!chunkName || !MANUAL_CHUNK_NAMES.has(chunkName)) {
        return null;
      }

      const preamble =
        `console.info("[miroir-chunk-load]", { chunk: ${JSON.stringify(chunkName)}, ` +
        `file: ${JSON.stringify(chunk.fileName)}, ` +
        `at: new Date().toISOString() });\n`;

      return { code: preamble + code };
    },
  };
}
