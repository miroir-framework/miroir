/**
 * Issue #326 Slice 11: the attribution rules of the bundle report (vite/bundleReportCore.js), on
 * module ids and import edges copied from the module graph of a real standalone build.
 *
 * Not reachable through MiroirTest: it tests the build tooling. Needs no build:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- bundleReportCore.326.phase11
 * ```
 */
import { describe, expect, it } from "vitest";

import {
  attributeModule,
  buildBundleReport,
  condensedChain,
  importChain,
  importerLinks,
  npmPackageOfId,
  npmPackagesOfId,
} from "../../../../vite/bundleReportCore.js";
import { resolveManualChunk } from "../../../../vite/manualChunks.js";

const root = "/home/user/miroir";
const context = {
  root,
  app: "miroir-standalone-app",
  workspaces: [
    { dir: "packages/miroir-core", name: "miroir-core" },
    { dir: "packages/miroir-standalone-app", name: "miroir-standalone-app" },
    { dir: "packages/miroir-store-indexedDb", name: "miroir-store-indexedDb" },
    { dir: "packages/miroir-store-mongodb", name: "miroir-store-mongodb" },
    { dir: "packages/miroir-test-app_deployment-miroir", name: "miroir-test-app_deployment-miroir" },
  ],
};

const indexTsx = `${root}/packages/miroir-standalone-app/src/index.tsx`;
const integrationTestSession = `${root}/packages/miroir-standalone-app/src/miroir-fwk/4-tests/IntegrationTestSession.ts`;
const miroirCore = `${root}/packages/miroir-core/dist/index.js`;
const storeIndexedDb = `${root}/packages/miroir-store-indexedDb/dist/index.js`;
const storeMongodb = `${root}/packages/miroir-store-mongodb/dist/index.js`;
const mongodbWrapper = `\0${root}/node_modules/mongodb/lib/index.js?commonjs-es-import`;
const mongodb = `${root}/node_modules/mongodb/lib/index.js`;
const commonjsHelpers = "\0commonjsHelpers.js";
const nestedMarkdown = `${root}/node_modules/@copilotkit/react-core/node_modules/react-markdown/lib/react-markdown.js`;

/** Edges of these modules in the real graph, trimmed to the modules above. */
const graph = new Map([
  [indexTsx, { importedIds: [miroirCore, storeIndexedDb], dynamicallyImportedIds: [] }],
  [integrationTestSession, { importedIds: [miroirCore, storeIndexedDb], dynamicallyImportedIds: [storeMongodb] }],
  [storeIndexedDb, { importedIds: [miroirCore, "__vite-browser-external"], dynamicallyImportedIds: [] }],
  [storeMongodb, { importedIds: [miroirCore, mongodbWrapper], dynamicallyImportedIds: [] }],
  [mongodbWrapper, { importedIds: [commonjsHelpers, mongodb], dynamicallyImportedIds: [] }],
  [miroirCore, { importedIds: [], dynamicallyImportedIds: [] }],
  [mongodb, { importedIds: [], dynamicallyImportedIds: [] }],
  [commonjsHelpers, { importedIds: [], dynamicallyImportedIds: [] }],
  ["__vite-browser-external", { importedIds: [], dynamicallyImportedIds: [] }],
]);

describe("bundleReportCore.326.phase11: packages of a module id", () => {
  it("reads every npm package on the path, innermost last, through \\0 prefixes and queries", () => {
    expect(npmPackagesOfId(nestedMarkdown)).toEqual(["@copilotkit/react-core", "react-markdown"]);
    expect(npmPackageOfId(nestedMarkdown)).toBe("react-markdown");
    expect(npmPackageOfId(mongodbWrapper)).toBe("mongodb");
    expect(npmPackageOfId(miroirCore)).toBeUndefined();
  });

  it("attributes app, workspace, npm and bundler modules", () => {
    expect(attributeModule(indexTsx, context)).toEqual({ name: "miroir-standalone-app", kind: "app" });
    expect(attributeModule(storeMongodb, context)).toEqual({ name: "miroir-store-mongodb", kind: "workspace" });
    expect(attributeModule(mongodbWrapper, context)).toEqual({ name: "mongodb", kind: "npm" });
    expect(attributeModule(commonjsHelpers, context).kind).toBe("virtual");
    expect(attributeModule("\0vite/preload-helper.js", context).kind).toBe("virtual");
    expect(attributeModule("__vite-browser-external", context).kind).toBe("virtual");
  });

  it("attributes Windows paths the same way", () => {
    const windows = { ...context, root: "C:\\dev\\miroir" };
    expect(attributeModule("C:\\dev\\miroir\\packages\\miroir-core\\dist\\index.js", windows).name).toBe("miroir-core");
    expect(attributeModule("C:/dev/miroir/node_modules/zod/index.js", windows).name).toBe("zod");
  });

  it("keeps a package nested under @copilotkit in vendor-copilotkit, as the manual chunks always did", () => {
    expect(resolveManualChunk(nestedMarkdown)).toBe("vendor-copilotkit");
    expect(resolveManualChunk(`${root}/node_modules/d3-sankey/node_modules/internmap/src/index.js`)).toBe("vendor-d3");
    expect(resolveManualChunk(`\0${root}/node_modules/react/index.js?commonjs-es-import`)).toBe("vendor-react");
    expect(resolveManualChunk(`${root}/node_modules/zod/index.js`)).toBeUndefined();
  });
});

describe("bundleReportCore.326.phase11: import chains", () => {
  const sources = [indexTsx, integrationTestSession];

  it("starts at the app file nearest to the module, marks dynamic import hops, merges CommonJS wrappers", () => {
    const links = importerLinks(graph, sources);
    expect(importChain(mongodb, links, root)).toEqual([
      "packages/miroir-standalone-app/src/miroir-fwk/4-tests/IntegrationTestSession.ts",
      "import(packages/miroir-store-mongodb/dist/index.js)",
      "node_modules/mongodb/lib/index.js",
    ]);
  });

  it("prefers a static chain to a shorter one with a dynamic import", () => {
    const withShortcut = new Map(graph);
    withShortcut.set(integrationTestSession, { importedIds: [storeMongodb], dynamicallyImportedIds: [mongodb] });
    const links = importerLinks(withShortcut, sources);
    expect(importChain(mongodb, links, root).some((step) => step.startsWith("import("))).toBe(false);
  });

  it("follows static imports only when asked", () => {
    expect(importerLinks(graph, sources, { dynamic: false }).has(mongodb)).toBe(false);
  });

  it("condenses a chain to one step per package", () => {
    const chain = importChain(mongodb, importerLinks(graph, sources), root);
    expect(condensedChain(chain, (path) => attributeModule(path, context).name)).toBe(
      "packages/miroir-standalone-app/src/miroir-fwk/4-tests/IntegrationTestSession.ts → import(miroir-store-mongodb) → mongodb",
    );
  });
});

describe("bundleReportCore.326.phase11: report", () => {
  const chunk = (file: string, isEntry: boolean, imports: string[], modules: Record<string, number>) => ({
    file,
    name: file.replace(/\.js$/, ""),
    isEntry,
    imports,
    modules,
    rawBytes: 100,
    gzipBytes: 50,
  });
  // index.tsx reaches miroir-core only through miroir-store-indexedDb here, so the lazy
  // IntegrationTestSession.ts is nearer to it.
  const eagerFarther = new Map(graph);
  eagerFarther.set(indexTsx, { importedIds: [storeIndexedDb], dynamicallyImportedIds: [] });
  const report = buildBundleReport({
    chunks: [
      chunk("index.js", true, ["core.js"], { [indexTsx]: 10, [storeIndexedDb]: 5, "__vite-browser-external": 1 }),
      chunk("core.js", false, [], { [miroirCore]: 40 }),
      chunk("session.js", false, ["core.js"], { [integrationTestSession]: 20 }),
      chunk("mongodb.js", false, ["core.js"], { [storeMongodb]: 7, [mongodbWrapper]: 0, [mongodb]: 30, [commonjsHelpers]: 2 }),
    ],
    graph: eagerFarther,
    context,
    externalized: [{ module: "fs", importer: storeIndexedDb }],
  });
  const byFile = Object.fromEntries(report.chunks.map((entry) => [entry.file, entry]));

  it("gives the load kind from the entry's static imports", () => {
    expect([byFile["index.js"].loadKind, byFile["core.js"].loadKind, byFile["mongodb.js"].loadKind]).toEqual([
      "entry",
      "eager",
      "lazy",
    ]);
    expect(report.totals.eager).toEqual({ chunks: 2, rawBytes: 200, gzipBytes: 100 });
  });

  it("lists packages by size, leaving out modules tree-shaken to nothing", () => {
    expect(byFile["mongodb.js"].packages.map((entry) => [entry.name, entry.renderedBytes])).toEqual([
      ["mongodb", 30],
      ["miroir-store-mongodb", 7],
      ["(bundler runtime)", 2],
    ]);
  });

  it("starts the chain of a package in an eager chunk at an app file of an eager chunk", () => {
    const core = byFile["core.js"].packages.find((entry) => entry.name === "miroir-core")!;
    expect(core.chain).toEqual([
      "packages/miroir-standalone-app/src/index.tsx",
      "packages/miroir-store-indexedDb/dist/index.js",
      "packages/miroir-core/dist/index.js",
    ]);
    const lazyCore = report.chunks.find((entry) => entry.file === "session.js")!;
    expect(lazyCore.packages[0].chain).toEqual([
      "packages/miroir-standalone-app/src/miroir-fwk/4-tests/IntegrationTestSession.ts",
    ]);
  });

  it("reports the Node built-in with its importer's package and chunk", () => {
    expect(report.findings).toEqual([
      {
        kind: "externalized-node-module",
        module: "fs",
        importer: "packages/miroir-store-indexedDb/dist/index.js",
        importerPackage: "miroir-store-indexedDb",
        chunk: "index.js",
        chain: ["packages/miroir-standalone-app/src/index.tsx", "packages/miroir-store-indexedDb/dist/index.js"],
        via: "packages/miroir-standalone-app/src/index.tsx → miroir-store-indexedDb",
      },
    ]);
  });
});
