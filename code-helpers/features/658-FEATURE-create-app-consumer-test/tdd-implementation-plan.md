# Issue #658 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The tests exercise the real packages as a consumer gets them: `npm pack` tarballs installed in a
> folder outside the repository, the generated project's real server on the filesystem store, real
> HTTP requests. No mocks. No MiroirTest: nothing here is reachable through the ML (packaging,
> a generator, a release script), so the vehicles are pytest (`ci/release/tests`, `scripts/tests`)
> and vitest for the generator. The tracer bullet proves that a project generated from tarballs
> answers one REST request from its own server.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each slice ends with its
> Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/658
Parent: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (I7)
Working branch: `claude/658-create-app-consumer-test` (from `origin/aba`)

**Resume note:** slices 0 to 6 done (2026-11-02). Slices 3 and 4 landed together: the consumer test builds the whole project in one pass.

---

## Scope

- G1 Start a project from one command: `npm create @miroir-framework/app`, install, build, start.
- G2 Know the packed set works outside the workspace: the consumer test, in the release run, as a command, and in the `full` nonreg tier.
- G3 Keep the template on the supported API: the #649 guard scans the template.

This plan does **not** flip `private`, select the whole set in the release plan, or document `npm publish` (#621 I8), and adds no generator prompts and no browser check (analysis §2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: core's pack has no seed, the release consumer imports nothing | ✅ | findings in its Realization |
| 1 | Core's tarball carries the seed; an environment outside the repo layout seeds and boots from it | ✅ | `test_package_manifests.py` pack case; `miroir-env/tests/seedFromCorePackage.integ.test.ts` |
| 2 | The generator writes a project | ✅ | `packages/miroir-create-app/tests/createApp.unit.test.ts` |
| 3 | Tracer: the generated project, installed from tarballs, type-checks and its server answers the Entity list | ✅ | `ci/release/tests/test_consumer_project.py::test_generated_project_serves_the_entity_list` |
| 4 | The generated server serves the built client | ✅ | same file, `test_generated_project_serves_its_client` |
| 5 | The release run and the command run the consumer test | ✅ | `ci/release/tests/test_release_version.py`, `test_consumer_project.py` unit cases |
| 6 | Template guard, nonreg step, docs, AC | ✅ | `test_core_public_api.py`, nonreg `full-658-consumer-project`, full nonreg |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 Name | `@miroir-framework/create-app`, folder `packages/miroir-create-app`, bin `create-app` | G1 |
| D2 Project | Vite client (`startMiroirClient`, real server) + Node server (`startMiroirNode` + `createMiroirServerApp`, serves `dist/`) | G1, G2 |
| D3 Store | filesystem, state in `<project>/.miroir/` | G1 |
| D4 Content | startup only; no demo data, admin migration, diagram, example app | G1, G3 |
| D5 Location | new package; sandbox unchanged | G1 |
| D6 Generator | no prompts; name, version pins, refuses a non-empty target | G1 |
| D7 When | `--apply`, `ci/release/consumer_project.py --tarballs/--pack`, nonreg `full`; not PR CI | G2 |
| D8 Checks | install, typecheck, vite build, start, `GET /`, Entity list | G2 |
| D9 `private` | ignored by the consumer test; flip in I8 | G2 |
| D10 Seed | core ships `dist/seed/<package>/assets/{key_model,key_data}` for `miroir-app-miroir` and `miroir-app-admin`; `packagesDirectory` points at it | G1, G2 |
| D11 Config | `environments/local.json` + `@miroir-framework/env`, `MIROIR_ROOT` = project | G1 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| New model elements | none |
| Nonreg step | `full-658-consumer-project` (tier `full`, scopes `tooling`) |
| Published set entry | `{ "folder": "packages/miroir-create-app", "publishedName": "@miroir-framework/create-app" }` |
| Seed folder in core's tarball | `dist/seed/miroir-app-miroir/assets/{miroir_model,miroir_data}`, `dist/seed/miroir-app-admin/assets/{admin_model,admin_data}` |
| Smoke URL | `/CRUD/10ff36f2-50a3-48d8-b80f-e48e5d13af8e/model/entity/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/all` |
| Opt-in variable of the slow tests | `MIROIR_CONSUMER_TEST=1` (the nonreg step sets it; without it the slow cases skip) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Release pytest | `python -m pytest ci/release/tests -q` |
| Consumer test, slow cases | `MIROIR_CONSUMER_TEST=1 python -m pytest ci/release/tests/test_consumer_project.py -q` |
| Consumer test as a command | `python ci/release/consumer_project.py --pack` (built workspace) or `--tarballs release-tarballs` |
| Manifest and API guards | `python -m pytest scripts/tests/test_package_manifests.py scripts/tests/test_core_public_api.py -q` |
| Generator unit test | `npm run test -w @miroir-framework/create-app` |
| Env integ test | `npm run testByFile -w @miroir-framework/env -- seedFromCorePackage` |
| Core build (seed copy) | `npm run build -w @miroir-framework/core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Pre-push gate | as in `AGENTS.md` |

---

## Slice 0 — Characterize

**Status:** ✅ DONE

**Goal:** record what the consumer of today's tarballs gets, so later slices change it knowingly.

- Run `npm pack --dry-run --json` on core and list the `assets` / `seed` paths: none expected.
- Pack core, react, server, mcp, store-filesystem, env from the built workspace; install them in a temp folder outside the repo; run `node -e "await import('@miroir-framework/server/startup')"` and the same for core's `meta-model` subpath. Record the result (expected: imports succeed; anything else is a finding for slice 3).
- Record which of the six are `private` (analysis §4.5) and the tarball sizes.

No test file: findings go into this slice's Realization and, when they block a later slice, into the analysis's §7.

**Validation:** the commands above, output summarized in the Realization.

### Realization

The six tarballs (core 2.9 MB, react 1.2 MB, server 101 KB, env 61 KB, mcp 29 KB, store-filesystem 8 KB), packed from the built workspace and installed in a folder outside the repository with `file:` dependencies and `overrides`, install (440 packages) and import: core (1091 exports), `core/meta-model` (346), `core/admin` (48), `server/startup`, `server`, `store-filesystem`, `env`. Core's pack holds no `assets` or `seed` path. Core, react, server and store-filesystem are `private`; `file:` installs them anyway (D9 holds).

---

## Slice 1 — Core's tarball carries the seed

**Status:** ✅ DONE

**Goal:** a Miroir process whose environment lives outside the repository seeds and opens Miroir and Admin from an installed core package.

**RED:**
- `scripts/tests/test_package_manifests.py`, new pack case `test_core_packs_the_seed_of_miroir_and_admin`: core's `npm pack --dry-run` lists `dist/seed/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json` and one `admin_data` file, and no `miroir_modelVersion`, `miroir_devData` or `test-resources` path.
- `packages/miroir-env/tests/seedFromCorePackage.integ.test.ts` (vitest: env's seeding is TypeScript machinery, not reachable through MiroirTest): in a temp folder with `environments/local.json` (`packagesDirectory` = the absolute path of `packages/miroir-core/dist/seed`, miroir + admin, filesystem, `copy`), `MIROIR_ROOT` = that folder: `resolveEnvironmentFromFiles` + `seedEnvironmentStateAtStart` report `miroir/model`, `miroir/data`, `admin/model`, `admin/data` seeded, and `startMiroirNode` + `bootEnvironment` open both deployments; a query of Entity instances of the Miroir deployment returns `Entity`.

**GREEN:** core's `tsup.config.js` `onSuccess` copies the four folders with `cpSync` into `dist/seed/…`; core's `files` gains `dist/seed`. If `packagesDirectory` must be relative to the root (env resolves it with `path.join`), the test uses a relative path and the finding goes into the Realization.

**Refactor checkpoint:** one list of the shipped sections, shared by the copy and the pack case (the pack case reads it from `tsup.config.js` or a small JSON next to it).

**Validation:**
```bash
npm run build -w @miroir-framework/core
python -m pytest scripts/tests/test_package_manifests.py -q
npm run testByFile -w @miroir-framework/env -- seedFromCorePackage
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

As planned. The shipped sections are listed once, in `packages/miroir-core/seed-sections.json`, read by `tsup.config.js` (`copySeed()`, after the meta-model build) and by the pack case. `dist/seed` is 6.0 MB unpacked. `packagesDirectory` is resolved under `MIROIR_ROOT`, so the test lays the project out as the generator does (the template's own `environments/local.json`, `node_modules/@miroir-framework/core` linked to the built package) instead of using an absolute path. Both env cases passed on the first run after the copy was added.

---

## Slice 2 — The generator writes a project

**Status:** ✅ DONE

**Goal:** `create-app <dir>` writes the project of analysis §6.1.

**RED:** `packages/miroir-create-app/tests/createApp.unit.test.ts` (vitest: a Node script's file output), each case on a temp folder, running the bin with `node`:
- writes `package.json` named after `<dir>`'s base name, every `@miroir-framework/*` dependency equal to the generator's `version`;
- writes `.gitignore` (from `_gitignore`), `environments/local.json`, `src/server/server.ts`, `src/client/index.tsx`;
- exits 1 with a message, writing nothing, when `<dir>` is not empty, and when no `<dir>` is given.

**GREEN:** `packages/miroir-create-app/{package.json,bin/create-app.js,template/**,README.md,LICENSE.md}`. Manifest per #643 rules (`files: ["bin", "template", …]`, `bin`, `engines`, `repository`, `license`, `publishConfig.access`); entry in `scripts/published-packages.json`. The template's sources are written in this slice, from the sandbox and `serverTestPlatform.ts`; they are only proven to work in slices 3 and 4.

**Refactor checkpoint:** the template's `package.json` lists dependency names with a placeholder version (`"0.0.0-template"`), so a forgotten pin fails the test instead of shipping `*`.

**Validation:**
```bash
npm install
npm run test -w @miroir-framework/create-app
python -m pytest scripts/tests/test_package_manifests.py scripts/tests/test_check_dependency_policy.py -q
python scripts/check_dependency_policy.py
python scripts/rename_packages.py --check
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

The bin is plain ESM JavaScript (`bin/create-app.js`, type-checked with `checkJs` by the package's `tsconfig.json`); it runs as a program only when `argv[1]` resolves to it (an npm `.bin` link is followed). Two manifest guards assumed a built package: `imported_packages` now also scans `bin/*.js`, and the published-name list gained `@miroir-framework/create-app`. The template's third-party versions are the workspace's (sandbox, standalone app, root `typescript` 7.0.2).

---

## Slice 3 — Tracer: installed from tarballs, the generated server answers

**Status:** ✅ DONE

**Goal:** a project generated outside the repository, installed from tarballs only, type-checks and its server returns Miroir's Entity list.

**RED:** `ci/release/tests/test_consumer_project.py::test_generated_project_serves_the_entity_list` (skips without `MIROIR_CONSUMER_TEST=1`): `--pack` the workspace, generate into `tmp_path`, install, `npm run typecheck`, `tsc -p tsconfig.server.json`, start the server on a free port, `GET` the smoke URL: status 200 and a row with uuid `16dbfe28-…`. Fast unit cases in the same file (always run): the dependency rewrite puts direct packages in `dependencies` and transitive ones in `overrides`, from a `manifest.json` of `pack_layer`'s shape.

**GREEN:** `ci/release/release_lib/consumer_project.py` (pack, generate, rewrite, install, start, wait, request, stop with output on failure) and `ci/release/consumer_project.py` (argparse: `--pack` | `--tarballs <dir>`, `--keep`). Fix what the template or the packages need for this to pass; each fix is listed in the Realization (expected candidates: client store registration, §4.4 of the analysis; seed path).

**Refactor checkpoint:** `validate_layer_consumer` and the consumer test share the tarball → `file:` mapping.

**Validation:**
```bash
python -m pytest ci/release/tests -q
MIROIR_CONSUMER_TEST=1 python -m pytest ci/release/tests/test_consumer_project.py -q
python ci/release/consumer_project.py --pack
```

### Realization

Slices 3 and 4 landed together: `prepare_project` runs `npm run build` (server and client) once, so the module-scoped fixture serves both slow cases (about 40 s with a warm npm cache). Template fixes needed: none beyond the draft. The real-server client registers no store (`stores: []`), which answers the open question of analysis §4.4. The generator runs from its tarball (`npm exec --package=file:<tgz> -- create-app`), which also proves the bin and `files` of its tarball. Not planned but done once by hand: a Playwright screenshot of the generated project's home page (shell, menus, "Configurations loaded successfully"), kept out of the test per D8.

---

## Slice 4 — The generated server serves the built client

**Status:** ✅ DONE

**Goal:** `npm run build` also builds the client with Vite, and the server serves it.

**RED:** `test_generated_project_serves_its_client`: after `npm run build`, `GET /` returns 200 with `<div id="root">` and a `<script type="module"` pointing at `/assets/…`; `GET /some/client/route` returns the same `index.html`; the built JavaScript contains the injected `rootApiUrl`.

**GREEN:** the template's `vite.config.ts` (from the sandbox's: polyfills, emotion, dedupe; plus `__MIROIR_CLIENT_CONFIG__` from `environmentRealServerClientConfig`), `src/client/index.tsx`, and `clientDirectory` in `server.ts`.

**Refactor checkpoint:** the slow cases share one generated, installed and built project per session (a module-scoped fixture), so the two cases cost one install.

**Validation:**
```bash
MIROIR_CONSUMER_TEST=1 python -m pytest ci/release/tests/test_consumer_project.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

As planned (`--skip-consumer-test`, `consumer_test_inputs` in `tarballs.py`). The cases are in `test_tarballs.py` next to `validate_layer_consumer`'s, not in `test_release_version.py`.

---

## Slice 5 — The release run runs the consumer test

**Status:** ✅ DONE

**Goal:** `release_version.py --apply` runs the consumer test on its tarballs when they hold the generator and the five packages, and says why it skips otherwise.

**RED:** `ci/release/tests/test_release_version.py`, cases on `consumer_test_inputs(infos)` (pure function on `TarballInfo` lists): returns the six tarballs when present; returns the missing names otherwise, which `build_pack_and_validate` logs as a skip.

**GREEN:** `build_pack_and_validate` calls `run_consumer_project(tarballs)` after the last layer check; `--skip-consumer-test` flag for local runs; README and `docs/reference/release-process.md` §6 updated.

**Refactor checkpoint:** none expected beyond the shared mapping of slice 3.

**Validation:**
```bash
python -m pytest ci/release/tests -q
python ci/release/release_version.py --bump patch --since 0.5.0-rc.1 --force @miroir-framework/create-app   # plan only: lists the skip reason
```

### Realization

Merged into slices 3 and 4.

---

## Slice 6 — Template guard, nonreg step, docs, AC

**Status:** ✅ DONE

**Goal:** the #649 guard covers the template; the consumer test runs in the `full` nonreg tier; the docs say how to start a project.

**RED:** `scripts/tests/test_core_public_api.py`: `test_the_template_only_imports_public_exports_of_core` scans `packages/miroir-create-app/template/src` as well as the sandbox (fails if the template imports an unmarked name; `test_the_template_import_scan_sees_every_form` gets a `.ts` server file case).

**GREEN:** the scan's roots become a list; if the template imports a core name the sandbox does not, mark it `@public` (and update `docs/reference/core-public-api.md` through its sync test).

**Docs:** `docs/guides/build-it-yourself.md` (or a new `docs/guides/start-a-project.md`, linked from the README): `npm create @miroir-framework/app`, the project layout, switching the store; `docs/reference/release-process.md`: the consumer test; #621 plan rows I7 1–2 ✅.

**Nonreg:** step `full-658-consumer-project` (`tier: full`, `scopes: ["tooling"]`, `argv: python ci/release/consumer_project.py --pack`).

**AC checklist (issue #658):**

| Criterion | Proof |
|---|---|
| D1 name, `npm create @miroir-framework/app` | slice 2 test, manifest guard |
| D2 client + server | slices 3, 4 |
| D3 filesystem under `.miroir/` | slice 3 (seeded state in the temp project) |
| D4 startup-only content | slice 6 guard, review |
| D5 sandbox unchanged | diff |
| D6 generator behaviour | slice 2 test |
| D7 release run, command, `full` nonreg | slice 5 test, nonreg step |
| D8 checks | slices 3, 4 |
| D9 private ignored | slice 3 (installs private tarballs) |

**Validation:**
```bash
python -m pytest scripts/tests -q
python -m pytest ci/release/tests -q
npm run lint
npm run nonreg:filesystem -- --runner shared
npm run nonreg -- --runner shared --only full-658-consumer-project
```

### Realization

The guard is parametrized over the two templates (`sandbox`, `create-app`). The create-app template imports 10 core names; 4 were not `@public` and are now marked (`defaultExternalServiceClient`, `getClientEnvironment`, `getProcessCapabilities`, `getProcessTokenSecret`), with `docs/reference/core-public-api.md` regenerated. Nonreg: `unit-658-create-app` (unit tier: generator test and the release pytest) in addition to `full-658-consumer-project`. Docs: `docs/guides/start-a-project.md` (linked from `docs/index.md`), the template's `README.md`, `docs/reference/release-process.md` §6a and §10d. `AGENTS.md` unchanged (its size limit; the template has no build step).
