# 223 / D5 — Spike results (2026-07-30)

Branch: `spike/223-d5-lerna-version` (deleted locally after run)  
Tag: `0.0.0-spike.223` (deleted locally; never pushed)  
Plan: [`d5-lerna-spike-plan.md`](./d5-lerna-spike-plan.md)

## Verdict

**Reject D5-b (Lerna `version` as primary tool) → Accept D5-a (custom bump+tag script).**

Lerna fixed-mode `version` cannot express **D2 B+** without rewriting every workspace package, and it replaces workspace `"*"` deps with pinned `^<product-version>` ranges. Those two failures alone justify owning a small custom script rather than fighting Lerna’s fixed-mode model. Lerna remains fine for `run` / `watch`.

## Blocker discovered before bump (L0)

| Finding | Detail |
|---|---|
| Root `package.json` `"name": "Miroir Framework"` | Invalid npm package name (spaces). `npm-package-arg` throws inside Lerna’s `Package` constructor. |
| Symptom | Misleading `ENOPKG: package.json does not exist, have you run lerna init?` |
| Spike workaround | Renamed to `miroir-framework` on the spike branch only |
| Follow-up (separate from D5 choice) | Consider renaming root package to a URL-safe name on main so `lerna list` / `lerna run` keep working reliably |

Without the rename, **no** `lerna version` experiment was possible.

## Command run

```bash
npx lerna version 0.0.0-spike.223 \
  --force-publish=miroir-standalone-app-electron,miroir-server,miroir-standalone-app,miroir-cli,miroir-mcp \
  --no-push \
  --yes
```

With `lerna.json` `command.version.tagVersionPrefix: ""`, `push: false`.

Lerna log (excerpt): `Assuming all packages changed` — then listed **all 24** packages moving to `0.0.0-spike.223`, not only the five force-publish targets. Also: `Skipping git push`, `Skipping releases`, dependency cycle warnings.

## Decision matrix

| Limitation | Result | Evidence |
|---|---|---|
| L0 root package name | **Fail** (blocker) | Invalid `"Miroir Framework"` → ENOPKG until renamed |
| L1 root version not updated | **Fail** (expected) | Root stayed `0.5.0-rc.1`; `lerna.json` → `0.0.0-spike.223` |
| L2 internals unbumped with scoped force-publish | **Fail** | **19** non-B+ packages bumped to spike version (incl. `miroir-core`, stores, deployments, `miroir-ai`) |
| L3 force-publish required | Partial | Force-publish accepted but did **not** limit the set under fixed mode |
| L5 no `v` prefix | **Pass** | Annotated tag `0.0.0-spike.223` (no `v0.0.0-spike.223`) |
| L10 lockfile / `*` deps | **Fail** | Workspace `"*"` → `^0.0.0-spike.223` in B+ (and others); `package-lock.json` ~229-line churn |
| L8 no push / no createRelease | **Pass** | `Skipping git push` / `Skipping releases` |
| L9 dry-run gap | N/A | Not blocking; `--yes` non-interactive worked |

## L10 sample (miroir-server)

```diff
-    "miroir-core": "*",
+    "miroir-core": "^0.0.0-spike.223",
```

(same pattern for other workspace deps)

## Why not “configure harder”

Mitigations considered and rejected for product tagging:

| Idea | Why not enough |
|---|---|
| Shrink `lerna.json` `packages` to B+ only | Breaks existing `lerna run` / `lerna watch` on stores/core (L6) |
| Independent mode + force-publish B+ | Wrong tag model (per-package tags) vs single product tag (L4); still may rewrite deps |
| Wrapper that resets non-B+ after Lerna | Would re-implement most of the policy and fight lockfile churn — wrapper becomes the product |

## Accepted path (D5-a)

Custom Python script (workspace preference for ad-hoc tooling):

1. Write product SemVer to **root + B+ allow-list** only  
2. Leave internals untouched (keep `"*"` deps)  
3. Optional commit + annotated git tag **without** `v` prefix  
4. Default no push; no GitHub Release  

Optional later hygiene (not required to close #223): rename root package to `miroir-framework` so Lerna CLI stops lying with ENOPKG for everyday `list`/`run`.
