# 243 — TypeScript 7 toolchain compatibility (synthetic note)

> Synthetic reference for agents and humans: which Miroir build/test tools depend on the **TypeScript 6 JavaScript Compiler API**, what works with real `typescript@7` today, and migration paths to drop the `@typescript/typescript6` alias.

Related issue: https://github.com/miroir-framework/miroir/issues/243  
Prerequisite (done): [#202 migrate to TypeScript 7](../202-FEATURE-migrate-to-TypeScript-7/plan.md) — dual-install landed  
Microsoft reference: [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) · [TS 7.1 iteration plan](https://github.com/microsoft/TypeScript/issues/63703)

**Status:** analysis / inventory — no implementation yet  
**Last reviewed:** 2026-08-19

---

## 1. Core distinction

| Layer | TS7 support | Mechanism |
|-------|-------------|-----------|
| **Native CLI** (`npx tsc`, `@typescript/native`) | ✅ TS 7.0+ | Go-based compiler binary |
| **JS Compiler API** (`import/require('typescript')`) | ❌ TS 7.0 | Removed; **7.1** targets new Emit / Language Service API |
| **Syntax stripping** (esbuild, Vite, Vitest) | ✅ TS7 source | No `typescript` package needed |

Miroir application code has **zero** direct `import 'typescript'` usage. All API dependency is **transitive through tooling**.

---

## 2. Current workspace layout (#202)

Root `package.json`:

```json
"@typescript/native": "npm:typescript@^7.0.2",
"typescript": "npm:@typescript/typescript6@^6.0.2"
```

| `require('typescript')` resolves to | Used by |
|---------------------------------------|---------|
| `@typescript/typescript6` (6.x API) | tsup DTS, ncc/ts-loader, ts-jest, ts-node |
| Native `tsc` via `@typescript/native` | Root `typecheck`, Electron `build-main` / `build-preload` |

**Caveat (2026-08-19 checkout):** `@typescript/native` was declared but not always present under `node_modules/`; `npx tsc` then fell through to TS6 via `@typescript/old`. After `npm install`, verify:

```bash
npx tsc --version          # expect 7.x
node -e "console.log(require('typescript').version)"  # expect 6.x (alias)
```

---

## 3. Tool compatibility matrix

| Tool | Lock / declared | Transpile with TS7? | Needs TS6 API? | Upstream TS7 status |
|------|-----------------|---------------------|----------------|---------------------|
| **Vite** | 7.3.1 | ✅ | No | esbuild only |
| **Vitest** | 3.2.4 | ✅ | No | Vite peer; no `typescript` dep |
| **tsx** | 4.x | ✅ | No | esbuild (`generate-ts-types`, `testMiroir`) |
| **tsup** | 8.5.1 | ✅ JS; ❌ `dts: true` | **Yes** — rollup-plugin-dts | [egoist/tsup#1405](https://github.com/egoist/tsup/issues/1405); **unmaintained** → tsdown |
| **@vercel/ncc** | 0.38.4 (0.44+ latest) | ❌ | **Yes** — bundled ts-loader | [vercel/ncc#1336](https://github.com/vercel/ncc/issues/1336); 0.44 adds **TS6** only |
| **ts-jest** | 29.x | ❌ | **Yes** | [ts-jest TS7 guide](https://kulshekhar.github.io/ts-jest/docs/next/guides/typescript-7) recommends dual-install |
| **ts-node** | 10.x | ❌ if used | Yes | DevDep only; scripts prefer `tsx` |
| **ts-loader** | 9.5.x | ❌ | Yes | Legacy webpack paths |

**No version bump** of tsup or ncc alone removes the TS6 API requirement until TS **7.1** API exists or the tool migrates off `require('typescript')`.

---

## 4. What rollup-plugin-dts (inside tsup) uses from the TS6 API

Bundled in `tsup@8.5.1` → `rollup-plugin-dts@6.1.1`. Representative surface:

- **Config:** `findConfigFile`, `readConfigFile`, `parseJsonConfigFileContent`, `formatDiagnostic(s)`
- **Host / sys:** `ts.sys.*` (`fileExists`, `readFile`, `getCurrentDirectory`, `useCaseSensitiveFileNames`, …)
- **Program:** `createCompilerHost`, `createProgram`, `getSourceFile`, `getSourceFiles`
- **Emit:** `program.emit(…, emitOnlyDts=true)` with `emitDeclarationOnly: true`
- **Resolution:** `resolveModuleName`
- **AST:** `createSourceFile`, `ts.is*`, `SyntaxKind`, node position helpers

Failure mode under `typescript@7`: `ts.sys` is `undefined` → `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`.

---

## 5. Miroir packages affected

### tsup + `dts: true`

`miroir-core`, `miroir-react`, `miroir-ai`, `miroir-cli`, `miroir-mcp`, `miroir-diagram-class`, all `miroir-store-*`, `miroir-localcache*`, deployment packages (`miroir-test-app_deployment-*`), etc.

`miroir-core` build chain:

```text
devBuild → generate-ts-types (tsx) → tsup (esbuild JS + rollup-plugin-dts .d.ts)
```

### ncc

`packages/miroir-server` → `build:server` → `@vercel/ncc` + local `typescript` for ts-loader transpile.

### ts-jest

Active in `packages/miroir-localcache/jest.config.js`, `miroir-localcache-redux`, store filesystem/postgres jest configs.

---

## 6. What already works with TS7 (no alias needed for that path)

| Workflow | Why |
|----------|-----|
| `npm run dev -w miroir-standalone-app` | Vite + esbuild |
| Vitest / `testByFile` | vite-node + esbuild |
| `npm run typecheck` (native tsc) | `@typescript/native` CLI |
| Electron `npx tsc` emit | native CLI (when native pkg installed) |

---

## 7. Migration options (when dropping TS6 alias)

### A. Wait for TypeScript 7.1 (lowest churn)

Microsoft targets stable **Emit API** and **Language Service API** in 7.1 (~Nov 2026 per iteration plan). Re-test tsup successors, ncc, ts-jest against 7.1 preview before committing.

### B. tsup workaround (per package)

```text
tsup (dts: false)  →  native tsc -p tsconfig.build.json (emitDeclarationOnly)
```

Requires `tsconfig.build.json` scoped to publish surface; used successfully elsewhere (see tsup#1405 thread).

### C. tsup → tsdown (monorepo library builds)

[tsdown](https://tsdown.dev) is tsup’s recommended successor (Rolldown + rolldown-plugin-dts). Some monorepos report `.d.ts` against real `typescript@7` without the TS6 shim. **Spike candidate:** `miroir-diagram-class` or `miroir-store-bundled`.

Notes:

- With `isolatedDeclarations: true`, tsdown can use **oxc-transform** (fast path, no classic API).
- Without it, may still fall back to TS compiler — verify against TS7 before assuming alias-free.

### D. ncc replacement (`miroir-server`)

Options: keep dual-install for ncc only; migrate release binary to esbuild/tsdown/Rollup; or wait for ncc + TS 7.1 API.

### E. ts-jest → Vitest

Align legacy Jest packages with repo default (Vitest + esbuild). Reduces TS6 API surface.

---

## 8. Work still tied to #202 / postinstall

- `scripts/patch-tsup-baseurl.cjs` — patches tsup DTS to avoid injecting deprecated `baseUrl` ([tsup#1388](https://github.com/egoist/tsup/issues/1388)). Can be removed when DTS pipeline no longer uses tsup’s rollup-plugin-dts path.
- Do **not** delete `node_modules/@typescript/old` while the TS6 alias is active (npm alias layout).

---

## 9. Suggested spike order

1. Confirm dual-install health (`tsc` 7.x + `typescript` API 6.x).
2. **tsdown spike** on smallest tsup package with `dts: true`.
3. **Server bundling spike** — ncc alternative or pinned TS6 scope isolated to `miroir-server` only.
4. **ts-jest inventory** — count remaining Jest suites vs Vitest migration cost.
5. Revisit when **TS 7.1 beta** publishes programmatic API.

---

## 10. Acceptance criteria (issue #243)

- Single hoisted `typescript@7` (no `@typescript/typescript6` alias).
- All `npm run build` / `devBuild` and `miroir-server` release build green.
- Root `npm run typecheck` on native TS7.
- `npm run nonreg` / artefact pipeline green.
- Remove `patch-tsup-baseurl.cjs` postinstall if tsup DTS path retired.

---

## 11. External links (quick ref)

| Topic | URL |
|-------|-----|
| tsup TS7 DTS break | https://github.com/egoist/tsup/issues/1405 |
| ncc TS7 | https://github.com/vercel/ncc/issues/1336 |
| ncc TS6 support | https://github.com/vercel/ncc/pull/1316 |
| ts-jest dual-install | https://kulshekhar.github.io/ts-jest/docs/next/guides/typescript-7 |
| tsdown migration | https://tsdown.dev/guide/migrate-from-tsup |
| TS 7.1 plan | https://github.com/microsoft/TypeScript/issues/63703 |
