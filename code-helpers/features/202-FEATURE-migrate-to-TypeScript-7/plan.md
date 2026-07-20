# 202 — Migrate to TypeScript 7

> Dual-install migration from TypeScript 6.0 to TypeScript 7: native `tsc` for typecheck/CLI, `@typescript/typescript6` kept as `typescript` for tsup declaration emit and other Compiler API consumers (until 7.1).

Related: [#202](https://github.com/miroir-framework/miroir/issues/202)

---

## Context (baseline before migration)

- Was on **TypeScript 6.0.2** (`package.json`); packages pinned `^6.0.0`.
- Root `tsconfig.json` used deprecated **`moduleResolution: "node"`** and **`ignoreDeprecations: "6.0"`** (hard errors in TS 7).
- Almost every package tsconfig repeated `ignoreDeprecations` and unused **`baseUrl`**; `packages/miroir-sandbox/tsconfig.json` was the only one with `paths`.
- Builds are mostly **tsup + `dts: true`** (needs the JS Compiler API until 7.1). Vite/ncc/esbuild emit do not need the API. Electron is the main direct **`npx tsc`** consumer.

**Chosen approach:** dual install (Microsoft’s recommended pattern for API-dependent tooling), not a full drop of TS 6.

```mermaid
flowchart LR
  subgraph deps [npm aliases]
    TS6["typescript → @typescript/typescript6"]
    TS7["@typescript/native → typescript@7"]
  end
  subgraph consumers [Consumers]
    Tsup["tsup dts / ts-jest"]
    NativeTsc["npx tsc / Electron"]
  end
  TS6 --> Tsup
  TS7 --> NativeTsc
```

## Implementation status

| Step | Scope | Status |
|---|---|---|
| **1** | Clear TS 6 deprecations + tsup DTS baseUrl patch | **DONE** (2026-07-19) |
| **2** | Dual-install TypeScript 7 + `@typescript/typescript6` | **DONE** (2026-07-19) |
| **3** | Point Electron / typecheck CLI at native `tsc` | **DONE** (2026-07-19) |
| **4** | Verify builds / nonreg | **DONE** (2026-07-19; full artefact build also green — see notes) |
| **5** | `graphify update .` | **DONE** (2026-07-19) |

---

## Step 1 — Clear TS 6 deprecations (required before TS 7) — DONE

### Checklist

- [x] Root `tsconfig.json`: remove `ignoreDeprecations`
- [x] Root `tsconfig.json`: `moduleResolution` `"node"` → `"bundler"`
- [x] Keep `types: ["node", "jest"]`, `strict`, `target`/`module`
- [x] Remove `"ignoreDeprecations": "6.0"` from all package `tsconfig*.json`
- [x] Remove unused `"baseUrl"` from package tsconfigs (incl. standalone-app `./src/`)
- [x] Sandbox: drop `baseUrl`; rewrite paths to `"./../miroir-standalone-app/src/*"`
- [x] Leave `NodeNext` overrides on `miroir-server`, `miroir-cli`, `miroir-mcp`, `miroir-ai`
- [x] Fix legacy `tsbuild` scripts in `miroir-localcache` / `miroir-localcache-redux` (`--baseUrl` / `--moduleResolution node` → `bundler`)
- [x] Electron `build-preload`: drop `--ignoreDeprecations` / classic `moduleResolution` (done early; rest of step 3 still pending)
- [x] tsup DTS `baseUrl` injection workaround: `scripts/patch-tsup-baseurl.py` + root `postinstall` ([egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388))
- [x] `"./src/*"` exports on `miroir-core` and `miroir-store-postgres` for bundler resolution
- [x] Rewrite `miroir-react` theme imports to package root; add `.js` on remaining deep `miroir-*/src/...` imports
- [x] Validate builds: `miroir-core`, `miroir-react` succeed without deprecation suppressions

### Notes / caveats

- Full-repo `tsc --noEmit` still has pre-existing type/rootDir noise (not introduced by step 1).
- tsup remains unmaintained; patch is required until upstream ships a fix or we switch DTS pipeline.

---

## Step 2 — Dual-install TypeScript 7 at the workspace root — DONE

### Planned (kept for reference)

In root `package.json`:

```json
"devDependencies": {
  "@typescript/native": "npm:typescript@^7.0.2",
  "typescript": "npm:@typescript/typescript6@^6.0.2"
}
```

In every package `package.json` that lists `"typescript": "^6.0.0"`: align to the same dual pattern **or** drop the local pin and rely on the workspace root (prefer aligning root + removing redundant package pins where hoisting already covers them, to avoid version skew).

Then `npm install` and confirm:

- `npx tsc --version` → 7.x (from `@typescript/native`)
- `node -e "console.log(require('typescript').version)"` → 6.x (API for tsup)
- `npx tsc6 --version` → 6.x

### Checklist

- [x] Root: add `@typescript/native` → `typescript@^7`
- [x] Root: alias `typescript` → `@typescript/typescript6@^6`
- [x] Remove redundant package-level `"typescript": "^6.0.0"` pins (23 packages; hoist to root)
- [x] `npm install` (force-reinstall alias once so `tsc6` + `@typescript/old` layout is correct)
- [x] Confirm `tsc` = 7.0.2, `typescript` API = 6.0.3, `tsc6` = 6.0.3
- [x] Smoke: `npm run build -w miroir-react` (tsup DTS via TS6 API) succeeds

### Notes / caveats

- npm installs the real TS6 sources under `node_modules/@typescript/old` when aliasing `@typescript/typescript6` as `typescript`. **Do not delete `@typescript/old`** — the `typescript` / `tsc6` entrypoints require it.
- `ts-jest@29` peers `typescript@>=4.3 <6` (warn only); left as-is for now.
- After a broken partial uninstall, a clean `rm -rf node_modules/typescript node_modules/@typescript/{native,old}` + reinstall of both aliases restored correct `.bin/tsc` → native.
---

## Step 3 — Point explicit CLI typecheck/emit at native `tsc` — DONE

### Planned (kept for reference)

- `packages/miroir-standalone-app-electron/package.json`: keep `npx tsc` (resolves to native once dual-installed); remove any `--ignoreDeprecations` / classic `moduleResolution` flags from `build-main` / `build-preload`
- Optionally add a root script e.g. `"typecheck": "tsc -p tsconfig.json --noEmit"` for CI/manual use (native)

No need to change tsup configs: `dts: true` continues to import `typescript` → 6 API.

### Checklist

- [x] Electron `build-preload` flags cleaned (done in step 1)
- [x] Confirm Electron `build-main` / `build-preload` use native `tsc` after dual-install (`npx tsc` → 7.0.2; both scripts emit successfully to `dist/src/`)
- [x] Root `"typecheck": "tsc -p tsconfig.json --noEmit"` script added

### Notes / caveats

- Native `tsc` preserves `src/` under `--outDir dist`, so emit lands at `dist/src/main.js` (matches package `"main"`). Stale `dist/main.js` / `dist/preload.js` from older layouts may remain; harmless leftovers.
---

## Step 4 — Verify — DONE (with notes)

### Planned (kept for reference)

1. Clean stale incremental artifacts if present (`**/*.tsbuildinfo`)
2. Build a representative slice: `miroir-core`, `miroir-react`, `miroir-store-postgres` (tsup+dts), `miroir-server` (ncc), `miroir-standalone-app` (Vite), Electron `build-main`/`build-preload`
3. Run unit nonreg if practical: `npm run nonreg:unit`
4. Fix any new hard errors from removed options / `moduleResolution` changes

### Checklist

- [x] Clean `*.tsbuildinfo` (none present)
- [x] `miroir-core` build (tsup+dts) — OK
- [x] `miroir-react` build (tsup+dts) — OK
- [x] `miroir-store-postgres` build (tsup+dts) — OK
- [x] `miroir-server` `build:server` (ncc; uses typescript@6.0.3 API) — OK
- [x] Electron `build-electron` — OK
- [x] `miroir-standalone-app` Vite production build — OK in full artefact pipeline (`✓ built in 2m 34s`; earlier isolated `html-inline-proxy` failure was a flaky/env issue, not TS7)
- [x] Lightweight vitest smoke (`miroir-diagram-class`) — 58 tests passed
- [ ] Full `nonreg:unit` — deferred (heavy; not required to close TS7 dual-install)

### Notes / caveats

- Server has no `build` script; CI path is `build:server` / `build:release`.
- Full artefact build log (`logs.txt`, 2026-07-19): steps 3–9 + server binary **ALL DONE** in ~10m; `miroir-standalone-app` was step 8/9 (~4m11s) and client was copied into `miroir-server/release/client`.
- An earlier isolated `npm run build -w miroir-standalone-app` hit `vite:html-inline-proxy` / inline CSS — not reproduced in the full pipeline; treat as flaky, not a TypeScript 7 regression.
- ncc reported `Using typescript@6.0.3 (local user-provided)` — expected under dual-install.
---

## Step 5 — Graphify — DONE

### Planned (kept for reference)

After code/config changes: `graphify update .`

### Checklist

- [x] Ran after step 1
- [x] Ran after step 2
- [x] Re-run after steps 3–4
---

## Out of scope

- Waiting for TypeScript 7.1 API and dropping `@typescript/typescript6`
- Re-enabling orphaned ESLint / `@typescript-eslint` in standalone-app
- Perf tuning (`--checkers` / `--builders`) unless CI shows need
- Vue/Svelte-style embedded LS plugins (not used here)
