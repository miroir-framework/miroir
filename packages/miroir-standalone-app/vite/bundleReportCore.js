/**
 * Bundle attribution (#326): which package each module of a build belongs to, which import chain
 * brings it in from the app's own source, and whether its chunk loads with the page.
 *
 * Pure functions over a plain module graph, so that the Vite plugin (bundleReportPlugin.js) and
 * the manual chunk resolver (manualChunks.js) share one package-from-id rule. See
 * docs/internals/code-splitting.md.
 */

const NODE_MODULES = "node_modules/";

/** Id Vite gives every Node built-in module it replaces with an empty module in a browser build. */
export const BROWSER_EXTERNAL_ID = "__vite-browser-external";

/**
 * A module id as a plain path: no `\0` prefix (Rollup virtual modules), no query
 * (`?commonjs-exports`, …), forward slashes.
 * @param {string} id
 */
export function modulePath(id) {
  return id.replace(/^\0/, "").replace(/\?.*$/, "").replace(/\\/g, "/");
}

/**
 * Every npm package on a module id's path, outermost first: the segment after each
 * `node_modules/`, or two for a scoped package.
 * `…/node_modules/@copilotkit/react-core/node_modules/react-markdown/index.js` gives
 * `["@copilotkit/react-core", "react-markdown"]`.
 * @param {string} id
 * @returns {string[]}
 */
export function npmPackagesOfId(id) {
  return modulePath(id)
    .split(NODE_MODULES)
    .slice(1)
    .map((segment) => {
      const [first, second] = segment.split("/");
      return first.startsWith("@") && second ? `${first}/${second}` : first;
    });
}

/**
 * The npm package a module belongs to: the innermost one on its path; undefined outside
 * `node_modules`.
 * @param {string} id
 * @returns {string | undefined}
 */
export function npmPackageOfId(id) {
  return npmPackagesOfId(id).at(-1);
}

/**
 * @typedef {{ dir: string, name: string }} Workspace  `dir` relative to the repository root
 * @typedef {{ root: string, workspaces: Workspace[], app: string }} AttributionContext
 *   `root`: repository root (absolute); `app`: name of the workspace package being built
 * @typedef {{ name: string, kind: "app" | "workspace" | "npm" | "virtual" }} Attribution
 */

/**
 * Who a module belongs to: the app being built, another workspace package, an npm package, or
 * code the bundler generates (`virtual`: Rollup and Vite helpers, Node built-ins emptied for the
 * browser).
 * @param {string} id
 * @param {AttributionContext} context
 * @returns {Attribution}
 */
export function attributeModule(id, context) {
  if (id.startsWith(BROWSER_EXTERNAL_ID)) {
    return { name: "(node built-ins emptied for the browser)", kind: "virtual" };
  }
  const npmPackage = npmPackageOfId(id);
  if (npmPackage) {
    const workspace = context.workspaces.find((candidate) => candidate.name === npmPackage);
    return workspace ? workspaceAttribution(workspace, context) : { name: npmPackage, kind: "npm" };
  }
  const path = relativePath(id, context.root);
  const workspace = context.workspaces.find((candidate) => path.startsWith(`${candidate.dir}/`));
  if (workspace) {
    return workspaceAttribution(workspace, context);
  }
  return { name: "(bundler runtime)", kind: "virtual" };
}

/** @param {Workspace} workspace @param {AttributionContext} context @returns {Attribution} */
function workspaceAttribution(workspace, context) {
  return { name: workspace.name, kind: workspace.name === context.app ? "app" : "workspace" };
}

/**
 * A module id relative to the repository root, for reports that read the same on every machine.
 * @param {string} id
 * @param {string} root
 */
export function relativePath(id, root) {
  const path = modulePath(id);
  const prefix = `${root.replace(/\\/g, "/").replace(/\/$/, "")}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

/**
 * @typedef {{ importedIds: readonly string[], dynamicallyImportedIds: readonly string[] }} GraphModule
 * @typedef {Map<string, GraphModule>} ModuleGraph
 * @typedef {{ from: string, dynamic: boolean }} ParentLink
 */

/**
 * For every module reachable from the app's own modules, the link to the module that brings it
 * in, along the chain with the fewest dynamic `import()` hops, then the fewest hops. A chain has
 * a dynamic hop only when no static chain from the app's source exists.
 * @param {ModuleGraph} graph
 * @param {readonly string[]} sources  the app's own modules, where every chain starts
 * @param {{ dynamic?: boolean }} [options]  `dynamic: false` follows static imports only
 * @returns {Map<string, ParentLink | null>}  `null` for a source
 */
export function importerLinks(graph, sources, { dynamic = true } = {}) {
  /** @type {Map<string, ParentLink | null>} */
  const links = new Map();
  let frontier = [];
  for (const source of sources) {
    if (!links.has(source)) {
      links.set(source, null);
      frontier.push(source);
    }
  }
  while (frontier.length > 0) {
    const reached = [];
    for (let index = 0; index < frontier.length; index++) {
      const id = frontier[index];
      reached.push(id);
      for (const imported of graph.get(id)?.importedIds ?? []) {
        if (!links.has(imported)) {
          links.set(imported, { from: id, dynamic: false });
          frontier.push(imported);
        }
      }
    }
    const next = [];
    for (const id of dynamic ? reached : []) {
      for (const imported of graph.get(id)?.dynamicallyImportedIds ?? []) {
        if (!links.has(imported)) {
          links.set(imported, { from: id, dynamic: true });
          next.push(imported);
        }
      }
    }
    frontier = next;
  }
  return links;
}

/**
 * The import chain from an app source module to `id`, as repository-relative paths; a module
 * reached through a dynamic import is written `import(<path>)`. A module no app source reaches
 * (bundler runtime) is its own chain. A CommonJS wrapper (`\0<path>?commonjs-es-import`) and the
 * module it wraps make one step.
 * @param {string} id
 * @param {Map<string, ParentLink | null>} links
 * @param {string} root
 * @returns {string[]}
 */
export function importChain(id, links, root) {
  /** @type {{ path: string, dynamic: boolean }[]} */
  const steps = [];
  let current = id;
  for (;;) {
    const link = links.get(current);
    const path = relativePath(current, root);
    const dynamic = Boolean(link?.dynamic);
    const previous = steps.at(-1);
    if (previous?.path === path) {
      previous.dynamic ||= dynamic;
    } else {
      steps.push({ path, dynamic });
    }
    if (!link) {
      break;
    }
    current = link.from;
  }
  return steps.reverse().map((step) => (step.dynamic ? `import(${step.path})` : step.path));
}

/**
 * The same chain with one step per package: `src/…/Foo.tsx → miroir-core → import(miroir-store-mongodb) → mongodb`.
 * @param {string[]} chain
 * @param {(path: string) => string} packageOfPath
 */
export function condensedChain(chain, packageOfPath) {
  const steps = [];
  let previous;
  chain.forEach((step, index) => {
    const dynamic = step.startsWith("import(");
    const path = dynamic ? step.slice("import(".length, -1) : step;
    const name = index === 0 ? path : packageOfPath(path);
    if (name !== previous || dynamic) {
      steps.push(dynamic ? `import(${name})` : name);
    }
    previous = name;
  });
  return steps.join(" → ");
}

/**
 * @typedef {{
 *   file: string, name: string, isEntry: boolean, imports: readonly string[],
 *   modules: Record<string, number>, rawBytes: number, gzipBytes: number,
 * }} ChunkInput  `modules`: module id → rendered length in this chunk
 * @typedef {{ module: string, importer: string }} ExternalizedImport  a Node built-in (`fs`) and the module importing it
 */

/**
 * Files of the entry chunks and of every chunk they import statically, transitively: what the
 * browser loads with the page.
 * @param {readonly ChunkInput[]} chunks
 */
export function eagerFiles(chunks) {
  const byFile = new Map(chunks.map((chunk) => [chunk.file, chunk]));
  const eager = new Set();
  const pending = chunks.filter((chunk) => chunk.isEntry).map((chunk) => chunk.file);
  while (pending.length > 0) {
    const file = pending.pop();
    if (eager.has(file) || !byFile.has(file)) {
      continue;
    }
    eager.add(file);
    pending.push(...byFile.get(file).imports);
  }
  return eager;
}

/**
 * The attribution report of a build.
 * @param {{
 *   chunks: readonly ChunkInput[], graph: ModuleGraph, context: AttributionContext,
 *   externalized?: readonly ExternalizedImport[],
 * }} input
 */
export function buildBundleReport({ chunks, graph, context, externalized = [] }) {
  /** @type {Map<string, Attribution>} */
  const attributions = new Map();
  const attribution = (id) => {
    if (!attributions.has(id)) {
      attributions.set(id, attributeModule(id, context));
    }
    return attributions.get(id);
  };
  const eager = eagerFiles(chunks);
  const chunkOfModule = new Map(chunks.flatMap((chunk) => Object.keys(chunk.modules).map((id) => [id, chunk.file])));
  const sources = [...graph.keys()].filter((id) => attribution(id).kind === "app").sort();
  // Chains of a package loaded with the page start, when they can, at an app file also loaded
  // with the page and follow static imports only: that chain is why the package loads eagerly.
  const allLinks = importerLinks(graph, sources);
  const eagerLinks = importerLinks(
    graph,
    sources.filter((id) => eager.has(chunkOfModule.get(id))),
    { dynamic: false },
  );
  const linksFor = (id, eagerChunk) => (eagerChunk && eagerLinks.has(id) ? eagerLinks : allLinks);
  const chainOf = (id, eagerChunk = eager.has(chunkOfModule.get(id))) =>
    importChain(id, linksFor(id, eagerChunk), context.root);
  const viaOf = (chain) => condensedChain(chain, (path) => attributeModule(path, context).name);
  const depthOf = (id, eagerChunk) => {
    const links = linksFor(id, eagerChunk);
    let depth = 0;
    for (let link = links.get(id); link; link = links.get(link.from)) {
      depth += link.dynamic ? 1_000_000 : 1;
    }
    return links.has(id) ? depth : Number.MAX_SAFE_INTEGER;
  };

  const reportChunks = chunks.map((chunk) => {
    const loadKind = chunk.isEntry ? "entry" : eager.has(chunk.file) ? "eager" : "lazy";
    const eagerChunk = loadKind !== "lazy";
    /** @type {Map<string, { name: string, kind: string, renderedBytes: number, modules: number, first: string }>} */
    const packages = new Map();
    let renderedBytes = 0;
    for (const [id, length] of Object.entries(chunk.modules)) {
      if (length === 0) {
        continue;
      }
      renderedBytes += length;
      const { name, kind } = attribution(id);
      const entry = packages.get(name) ?? { name, kind, renderedBytes: 0, modules: 0, first: id };
      entry.renderedBytes += length;
      entry.modules += 1;
      if (depthOf(id, eagerChunk) < depthOf(entry.first, eagerChunk)) {
        entry.first = id;
      }
      packages.set(name, entry);
    }
    return {
      file: chunk.file,
      name: chunk.name,
      loadKind,
      rawBytes: chunk.rawBytes,
      gzipBytes: chunk.gzipBytes,
      renderedBytes,
      packages: [...packages.values()]
        .sort((a, b) => b.renderedBytes - a.renderedBytes || a.name.localeCompare(b.name))
        .map(({ first, ...entry }) => {
          const chain = chainOf(first, eagerChunk);
          return { ...entry, chain, via: viaOf(chain) };
        }),
    };
  });
  reportChunks.sort(
    (a, b) => loadRank(a.loadKind) - loadRank(b.loadKind) || b.rawBytes - a.rawBytes || a.file.localeCompare(b.file),
  );

  return {
    app: context.app,
    totals: {
      ...sizeTotals(reportChunks),
      eager: sizeTotals(reportChunks.filter((chunk) => chunk.loadKind !== "lazy")),
    },
    packages: packageTotals(reportChunks),
    chunks: reportChunks,
    findings: [
      ...externalizedFindings(externalized, { attribution, chainOf, viaOf, chunkOfModule, root: context.root }),
      ...defeatedDynamicImports(chunks, graph, { chainOf, viaOf, root: context.root }),
    ],
  };
}

/** @param {string} loadKind */
function loadRank(loadKind) {
  return ["entry", "eager", "lazy"].indexOf(loadKind);
}

/** @param {readonly { rawBytes: number, gzipBytes: number }[]} chunks */
function sizeTotals(chunks) {
  return {
    chunks: chunks.length,
    rawBytes: chunks.reduce((sum, chunk) => sum + chunk.rawBytes, 0),
    gzipBytes: chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0),
  };
}

/**
 * One line per package over the whole build: `eager` when any of its code loads with the page,
 * with the shortest chain from a chunk of that load kind.
 * @param {ReturnType<typeof buildBundleReport>["chunks"]} chunks
 */
function packageTotals(chunks) {
  const totals = new Map();
  for (const chunk of chunks) {
    const eagerChunk = chunk.loadKind !== "lazy";
    for (const { name, kind, renderedBytes, chain, via } of chunk.packages) {
      const total = totals.get(name);
      if (!total) {
        totals.set(name, {
          name,
          kind,
          loadKind: eagerChunk ? "eager" : "lazy",
          renderedBytes,
          eagerRenderedBytes: eagerChunk ? renderedBytes : 0,
          chunks: 1,
          chain,
          via,
        });
        continue;
      }
      const totalEager = total.loadKind === "eager";
      if ((eagerChunk && !totalEager) || (eagerChunk === totalEager && chain.length < total.chain.length)) {
        total.chain = chain;
        total.via = via;
      }
      total.renderedBytes += renderedBytes;
      total.chunks += 1;
      if (eagerChunk) {
        total.loadKind = "eager";
        total.eagerRenderedBytes += renderedBytes;
      }
    }
  }
  return [...totals.values()].sort((a, b) => b.renderedBytes - a.renderedBytes || a.name.localeCompare(b.name));
}

/**
 * One finding per Node built-in and importing module: Vite replaced the built-in with an empty
 * module, so the importing code cannot work in the browser and usually should not be there.
 */
function externalizedFindings(externalized, { attribution, chainOf, viaOf, chunkOfModule, root }) {
  const seen = new Set();
  const findings = [];
  for (const { module, importer } of externalized) {
    const key = `${module}\n${importer}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const chain = chainOf(importer);
    findings.push({
      kind: "externalized-node-module",
      module,
      importer: relativePath(importer, root),
      importerPackage: attribution(importer).name,
      chunk: chunkOfModule.get(importer) ?? null,
      chain,
      via: viaOf(chain),
    });
  }
  return findings.sort((a, b) => a.module.localeCompare(b.module) || a.importer.localeCompare(b.importer));
}

/**
 * Modules imported both statically and with `import()`, where an `import()` outside
 * `node_modules` sits in the same chunk as the module, so it splits nothing off: the condition of
 * Vite's "dynamic import will not move module into another chunk" warning.
 */
function defeatedDynamicImports(chunks, graph, { chainOf, viaOf, root }) {
  const importers = new Map();
  const dynamicImporters = new Map();
  const add = (map, key, value) => (map.get(key) ?? map.set(key, new Set()).get(key)).add(value);
  for (const [id, module] of graph) {
    for (const imported of module.importedIds) {
      add(importers, imported, id);
    }
    for (const imported of module.dynamicallyImportedIds) {
      add(dynamicImporters, imported, id);
    }
  }
  const findings = [];
  for (const chunk of chunks) {
    for (const id of Object.keys(chunk.modules)) {
      const staticOnes = [...(importers.get(id) ?? [])];
      const dynamicOnes = [...(dynamicImporters.get(id) ?? [])];
      const defeated = dynamicOnes.some((importer) => !importer.includes(NODE_MODULES) && importer in chunk.modules);
      if (staticOnes.length === 0 || !defeated) {
        continue;
      }
      const chain = chainOf(id);
      findings.push({
        kind: "defeated-dynamic-import",
        module: relativePath(id, root),
        chunk: chunk.file,
        dynamicImporters: dynamicOnes.map((importer) => relativePath(importer, root)).sort(),
        staticImporters: staticOnes.map((importer) => relativePath(importer, root)).sort(),
        chain,
        via: viaOf(chain),
      });
    }
  }
  return findings.sort((a, b) => a.module.localeCompare(b.module));
}
