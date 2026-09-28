/**
 * Shared manual chunk names and resolver for Rollup output splitting.
 * Keep in sync with docs/internals/code-splitting.md.
 */
import { npmPackagesOfId } from "./bundleReportCore.js";

/** @typedef {(id: string) => string | undefined} ManualChunksFn */

/** @type {readonly string[]} */
export const MIROIR_MANUAL_CHUNK_NAMES = [
  "vendor-react",
  "vendor-copilotkit",
  "vendor-d3",
  "vendor-ag-grid",
  "vendor-mui",
];

/**
 * First matching rule wins. A module goes to a chunk when any npm package on its path matches, so
 * a package nested in `node_modules/@copilotkit/react-core/node_modules/` goes with CopilotKit.
 * @type {readonly [string, (packageName: string) => boolean][]}
 */
const MANUAL_CHUNK_RULES = [
  // React must live in its own chunk so lazy-loaded modules (e.g. ReportHooks)
  // never pick up a second copy re-exported from vendor-mui / vendor-copilotkit.
  ["vendor-react", (name) => name === "react" || name.startsWith("react-dom")],
  ["vendor-copilotkit", (name) => name.startsWith("@copilotkit")],
  ["vendor-d3", (name) => name.startsWith("d3") || name.startsWith("miroir-diagram-class")],
  ["vendor-ag-grid", (name) => name.startsWith("ag-grid")],
  ["vendor-mui", (name) => name.startsWith("@mui/material") || name.startsWith("@mui/icons-material")],
];

/** @type {ManualChunksFn} */
export function resolveManualChunk(id) {
  const packages = npmPackagesOfId(id);
  return MANUAL_CHUNK_RULES.find(([, matches]) => packages.some(matches))?.[0];
}
