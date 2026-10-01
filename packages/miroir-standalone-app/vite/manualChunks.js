/**
 * Shared manual chunk names and resolver for Rollup output splitting.
 * Keep in sync with docs/internals/code-splitting.md.
 */
import { npmPackagesOfId } from "./bundleReportCore.js";

/** @typedef {(id: string) => string | undefined} ManualChunksFn */

/** @type {readonly string[]} */
export const MIROIR_MANUAL_CHUNK_NAMES = [
  "vendor-react",
  "vendor-d3",
  "vendor-mui",
];

/**
 * First matching rule wins. A module goes to a chunk when any npm package on its path matches, so
 * a package nested in `node_modules/d3-sankey/node_modules/` goes with d3.
 *
 * No rule for a library behind a lazy boundary (CopilotKit, ag-grid, #337): Rollup moves into a manual
 * chunk the dependencies its modules share with eager code, so the entry imports that chunk and the
 * whole library loads with the page. Left to Rollup, such a library stays in the lazy chunks.
 * @type {readonly [string, (packageName: string) => boolean][]}
 */
const MANUAL_CHUNK_RULES = [
  // React must live in its own chunk so lazy-loaded modules (e.g. ReportHooks)
  // never pick up a second copy re-exported from vendor-mui / vendor-copilotkit.
  ["vendor-react", (name) => name === "react" || name.startsWith("react-dom")],
  ["vendor-d3", (name) => name.startsWith("d3")],
  ["vendor-mui", (name) => name.startsWith("@mui/material") || name.startsWith("@mui/icons-material")],
];

/** @type {ManualChunksFn} */
export function resolveManualChunk(id) {
  const packages = npmPackagesOfId(id);
  return MANUAL_CHUNK_RULES.find(([, matches]) => packages.some(matches))?.[0];
}
