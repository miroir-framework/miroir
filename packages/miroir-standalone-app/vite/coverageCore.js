/**
 * Runtime coverage per package (#326 D12, D26): which part of the code a build ships actually
 * runs during a tour of the app. Pure functions, no Node or browser API:
 * `scripts/coverage-tour.mjs` feeds them the chunks of `dist/assets`, their source maps and the
 * V8 block coverage Chromium reports for the chunks the tour loaded.
 *
 * Sizes count characters of the minified code (UTF-16 code units, the unit of both V8 coverage
 * offsets and source map columns), which is the byte count for the ASCII of minified code.
 */
import { attributeModule, BROWSER_EXTERNAL_ID, resolveFrom } from "./bundleReportCore.js";

/**
 * @typedef {{ startOffset: number, endOffset: number, count: number }} CoverageRange
 * @typedef {{ ranges: CoverageRange[] }} FunctionCoverage  one function of a V8 block coverage
 * @typedef {{ sources: string[], mappings: string }} SourceMap
 * @typedef {{ name: string, kind: string, shippedChars: number, loadedChars: number,
 *   executedChars: number, chunksShipped: number, chunksLoaded: number }} PackageCoverage
 */

/**
 * 1 for each offset of a script that ran, 0 otherwise. V8 reports, per function, the function's
 * range then the blocks inside it with their own counts; an inner range overrides an outer one.
 * @param {number} length  length of the script source
 * @param {readonly FunctionCoverage[]} functions
 * @returns {Uint8Array}
 */
export function executedMask(length, functions) {
  const ranges = functions.flatMap((fn) => fn.ranges);
  ranges.sort((a, b) => a.startOffset - b.startOffset || b.endOffset - a.endOffset);
  const mask = new Uint8Array(length);
  for (const range of ranges) {
    mask.fill(range.count > 0 ? 1 : 0, range.startOffset, Math.min(range.endOffset, length));
  }
  return mask;
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_VALUE = new Map([...BASE64].map((char, index) => [char, index]));

/** @param {string} segment  one VLQ segment of a source map's `mappings` */
function decodeSegment(segment) {
  const values = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64_VALUE.get(char) ?? 0;
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }
    values.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0;
    shift = 0;
  }
  return values;
}

/**
 * For each offset of the generated `code`, the index in the source map's `sources` of the source
 * it was generated from, or -1 where the map says nothing (a segment without a source).
 * @param {string} code
 * @param {string} mappings
 * @returns {Int32Array}
 */
export function sourceIndexByOffset(code, mappings) {
  const result = new Int32Array(code.length).fill(-1);
  let lineStart = 0;
  let sourceIndex = 0;
  for (const line of mappings.split(";")) {
    const lineEnd = code.indexOf("\n", lineStart);
    const end = lineEnd === -1 ? code.length : lineEnd + 1;
    let column = 0;
    let current = -1;
    let from = lineStart;
    for (const segment of line.split(",")) {
      if (!segment) {
        continue;
      }
      const values = decodeSegment(segment);
      column += values[0];
      const to = Math.min(lineStart + column, end);
      result.fill(current, from, to);
      from = to;
      if (values.length >= 4) {
        sourceIndex += values[1];
        current = sourceIndex;
      } else {
        current = -1;
      }
    }
    result.fill(current, from, end);
    if (lineEnd === -1) {
      break;
    }
    lineStart = end;
  }
  return result;
}

/**
 * Adds one chunk to the per-package totals: every character counts as shipped, as loaded when
 * the tour loaded the chunk (`executed` given), and as executed when the mask says it ran.
 * @param {Map<string, PackageCoverage>} totals
 * @param {{ code: string, map: SourceMap, mapDir: string, executed?: Uint8Array,
 *   context: import("./bundleReportCore.js").AttributionContext }} chunk
 *   `mapDir`: absolute directory the map's `sources` are relative to
 */
export function addChunkCoverage(totals, { code, map, mapDir, executed, context }) {
  const attributions = map.sources.map((source) => attributeSource(mapDir, source, context));
  const unmapped = { name: "(no source map entry)", kind: "virtual" };
  const bySource = sourceIndexByOffset(code, map.mappings);
  const entries = []; // by source index + 1, created on first use
  for (let offset = 0; offset < code.length; offset++) {
    const index = bySource[offset];
    const entry = (entries[index + 1] ??= entryFor(totals, attributions[index] ?? unmapped));
    entry.shippedChars++;
    if (executed) {
      entry.loadedChars++;
      entry.executedChars += executed[offset];
    }
  }
  for (const entry of new Set(entries.filter(Boolean))) {
    entry.chunksShipped++;
    entry.chunksLoaded += executed ? 1 : 0;
  }
}

/**
 * The package a source map entry belongs to, named as in the bundle report. Vite writes its
 * virtual modules (`__vite-browser-external`, `__vite-optional-peer-dep:…`) as files of the app's
 * directory, so they are recognized by name.
 * @param {string} mapDir
 * @param {string} source
 * @param {import("./bundleReportCore.js").AttributionContext} context
 */
function attributeSource(mapDir, source, context) {
  const name = source.slice(source.lastIndexOf("/") + 1);
  if (name.startsWith(BROWSER_EXTERNAL_ID)) {
    return attributeModule(BROWSER_EXTERNAL_ID, context);
  }
  if (name.startsWith("__vite-")) {
    return { name: "(bundler runtime)", kind: "virtual" };
  }
  return attributeModule(resolveFrom(mapDir, source), context);
}

/** @param {Map<string, PackageCoverage>} totals @param {{ name: string, kind: string }} attribution */
function entryFor(totals, { name, kind }) {
  let entry = totals.get(name);
  if (!entry) {
    entry = { name, kind, shippedChars: 0, loadedChars: 0, executedChars: 0, chunksShipped: 0, chunksLoaded: 0 };
    totals.set(name, entry);
  }
  return entry;
}

/**
 * The report `coverage-report.json` holds: the tour's pages, totals, and every package, the ones
 * with the most loaded code that never ran first (candidates for removal or lazy loading).
 * @param {{ app: string, tour: { page: string, visited: boolean, detail?: string }[],
 *   totals: Map<string, PackageCoverage> }} input
 */
export function buildCoverageReport({ app, tour, totals }) {
  const packages = [...totals.values()]
    .map((entry) => ({ ...entry, executedShare: entry.loadedChars ? round(entry.executedChars / entry.loadedChars) : 0 }))
    .sort(
      (a, b) =>
        b.loadedChars - b.executedChars - (a.loadedChars - a.executedChars) ||
        b.shippedChars - a.shippedChars ||
        a.name.localeCompare(b.name),
    );
  const sum = (key) => packages.reduce((total, entry) => total + entry[key], 0);
  return {
    app,
    tour,
    totals: { shippedChars: sum("shippedChars"), loadedChars: sum("loadedChars"), executedChars: sum("executedChars") },
    packages,
  };
}

/** @param {number} value */
function round(value) {
  return Math.round(value * 1000) / 1000;
}
