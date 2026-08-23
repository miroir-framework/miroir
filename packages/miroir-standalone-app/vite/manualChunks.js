/**
 * Shared manual chunk names and resolver for Rollup output splitting.
 * Keep in sync with docs/internals/code-splitting.md.
 */

/** @typedef {(id: string) => string | undefined} ManualChunksFn */

/** @type {readonly string[]} */
export const MIROIR_MANUAL_CHUNK_NAMES = [
  "vendor-react",
  "vendor-copilotkit",
  "vendor-d3",
  "vendor-ag-grid",
  "vendor-mui",
];

/** @type {ManualChunksFn} */
export function resolveManualChunk(id) {
  // React must live in its own chunk so lazy-loaded modules (e.g. ReportHooks)
  // never pick up a second copy re-exported from vendor-mui / vendor-copilotkit.
  if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
    return "vendor-react";
  }
  if (id.includes("node_modules/@copilotkit")) {
    return "vendor-copilotkit";
  }
  if (id.includes("node_modules/d3") || id.includes("node_modules/miroir-diagram-class")) {
    return "vendor-d3";
  }
  if (id.includes("node_modules/ag-grid")) {
    return "vendor-ag-grid";
  }
  if (id.includes("node_modules/@mui/material") || id.includes("node_modules/@mui/icons-material")) {
    return "vendor-mui";
  }
  return undefined;
}
