# 223 / D5 — Lerna version spike plan

> Throwaway experiment to lock **D5** (Lerna + thin wrapper vs custom bump+tag).  
> Parent analysis: [`analysis.md`](./analysis.md) §4 D5.  
> Issue: https://github.com/miroir-framework/miroir/issues/223

**Goal:** gather evidence for limitations **L1, L2, L3, L5, L10** (and spot-check L7/L8/L9) before accepting or rejecting Lerna for product (pre-)release tagging.

**Time box:** ~half day (setup + one successful bump attempt + write-back of results into `analysis.md`).  
**Outcome:** D5 marked **Accepted** as either **D5-b** (Lerna + thin wrapper) or **D5-a** (custom), with failure evidence if Lerna is ruled out.

**Do not:** push tags/commits to `origin`; run `lerna publish`; merge the spike branch.

---

## 0. Preconditions

| Check | Notes |
|---|---|
| Clean or stashable worktree | Spike must not mix with unrelated edits |
| Existing tag `0.5.0-rc.1` present locally | Baseline; we will **not** delete it |
| Lerna available | Root dep `lerna@^9` — use `npx lerna` |
| Shell | git-bash on Windows |
| Network | Prefer **offline** for the bump (`--no-push`); no GitHub token needed |

**Spike version string:** `0.0.0-spike.223` (impossible to confuse with a real product tag; SemVer pre-release with `-`).  
If Lerna rejects that form, fall back to `0.5.0-rc.99` and document why.

**B+ force-publish list (accepted D2):**

```text
miroir-standalone-app-electron,miroir-server,miroir-standalone-app,miroir-cli,miroir-mcp
```

**Internal probes (must stay unbumped):** e.g. `miroir-core`, `miroir-store-filesystem`, `miroir-test-app_deployment-miroir`, `miroir-ai`.

---

## 1. Branch & safety setup

```bash
git fetch --tags
git switch -c spike/223-d5-lerna-version
# optional: note HEAD
git rev-parse --short HEAD
git status
```

**Abort / cleanup later:**

```bash
# after recording results — discard spike commit(s) and local tag
git tag -d 0.0.0-spike.223 2>/dev/null || true
git switch -   # or main
git branch -D spike/223-d5-lerna-version
```

If the spike amended `lerna.json` only for the experiment, that dies with the branch — do **not** leave `tagVersionPrefix` changes on main until D5 is locked.

---

## 2. Baseline inventory (record before any bump)

Capture into `spike-results.md` (create beside this plan) or paste into analysis §D5:

```bash
python - <<'PY'
import json, glob
paths = ["package.json", "lerna.json"] + sorted(glob.glob("packages/*/package.json"))
for p in paths:
    d = json.load(open(p, encoding="utf-8"))
    print(f"{p}\t{d.get('name','(root/lerna)')}\t{d.get('version')}\tprivate={d.get('private')}")
PY
git tag -l "0.5.0*" "0.0.0-spike*"
git status --short
```

Note current root / Electron / B+ / sample internal versions and whether `package-lock.json` is dirty before starting.

---

## 3. Minimal Lerna config for the spike

Edit `lerna.json` **on the spike branch only**:

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "0.0.0",
  "command": {
    "version": {
      "tagVersionPrefix": "",
      "push": false,
      "message": "chore: spike release %s (#223 D5)"
    }
  }
}
```

Leave `packages` default (`packages/*`) — **do not** shrink the glob (L6).

Optional: if interactive prompts appear even with `--yes`, document them (feeds L9).

---

## 4. Dry attempt / help sanity

```bash
npx lerna version --help
# Confirm flags: force-publish, no-push, yes, tag-version-prefix / config
```

No true dry-run in Lerna (L9) — proceed to a real local bump that we will delete.

---

## 5. Execute the bump (core experiment)

```bash
npx lerna version 0.0.0-spike.223 \
  --force-publish=miroir-standalone-app-electron,miroir-server,miroir-standalone-app,miroir-cli,miroir-mcp \
  --no-push \
  --yes
```

If the command fails, paste full stderr into results and try **one** fallback at a time (document which):

| Fallback | When |
|---|---|
| `--force-publish` without package list / `*` | Only to see “bump all” damage — **reset after**; proves L2 risk |
| Omit explicit version; use `prerelease --preid spike` | If positional version parsing fails |
| `--no-git-tag-version` then manual `git tag` | If tag name wrong but file bumps OK — hybrid signal |

---

## 6. Inspection checklist (pass / fail)

Run after the command; fill **Pass / Fail / N/A** and paste diffs or short excerpts.

### 6.1 Versions written (L2, L3)

```bash
python - <<'PY'
import json, glob
BPLUS = {
  "miroir-standalone-app-electron",
  "miroir-server",
  "miroir-standalone-app",
  "miroir-cli",
  "miroir-mcp",
}
TARGET = "0.0.0-spike.223"
for p in sorted(glob.glob("packages/*/package.json")):
    d = json.load(open(p, encoding="utf-8"))
    name, ver = d.get("name"), d.get("version")
    if name in BPLUS:
        ok = ver == TARGET
        print(("OK " if ok else "BAD"), "B+", name, ver)
    elif ver == TARGET:
        print("BAD internal bumped", name, ver, p)
print("lerna.json", json.load(open("lerna.json"))["version"])
print("root", json.load(open("package.json"))["version"])
PY
```

| Criterion | Pass if |
|---|---|
| B+ packages | All five `version == 0.0.0-spike.223` |
| Internals | None accidentally set to spike version (spot-check + script above) |
| `lerna.json` | Equals spike version (expected in fixed mode) |
| Root `package.json` (L1) | **Expect Fail** under pure Lerna — still `0.5.0-rc.1` (or prior). Record actual. |

**L2 Fail (blocks D5-b as-is):** any non-B+ package rewritten to spike version when using the scoped `--force-publish` list.

### 6.2 Git tag (L5, D3/D4)

```bash
git tag -l "0.0.0-spike.223" "v0.0.0-spike.223"
git show 0.0.0-spike.223 --quiet --format="%D%n%s" 2>/dev/null || true
git show v0.0.0-spike.223 --quiet --format="%D%n%s" 2>/dev/null || true
```

| Criterion | Pass if |
|---|---|
| Tag name | Exactly `0.0.0-spike.223` (**no** `v` prefix) |
| Push | `git status` / `git log` show no automatic remote update; reflog local only |
| Annotated? | Record whether tag is annotated or lightweight (informs open question §8) |

### 6.3 Lockfile / dependency ranges (L10)

```bash
git status --short
git diff --stat
git diff -- package-lock.json | head -n 200
# also sample a B+ package's dependency lines if any versions flipped from "*" 
git diff -- packages/miroir-server/package.json packages/miroir-cli/package.json
```

| Criterion | Pass if |
|---|---|
| Lockfile churn | Absent, trivial, or clearly acceptable (document size / nature) |
| Workspace `"*"` deps | Not rewritten to pinned spike versions in a way that breaks local workspaces |

**L10 Fail:** large lockfile rewrite or `"*"` → exact spike versions across the graph that would poison day-to-day development.

### 6.4 Side effects (L7, L8, L9)

| Check | How | Pass if |
|---|---|---|
| No publish | Confirm command was `version` only; no npm registry traffic intended | No publish artefacts / OTP prompts |
| No GitHub release | No `gh release` / `createRelease` activity | Nothing created on GitHub |
| UX friction | Note prompts, errors, need for `--yes` | Usable under HITL with wrapper preflight |

---

## 7. Decision matrix (fill at end of spike)

| Limitation | Result (Pass / Fail / Partial) | Evidence (one line) |
|---|---|---|
| L1 root not updated | | |
| L2 internals unbumped with scoped force-publish | | |
| L3 force-publish required for B+ | | |
| L5 no `v` prefix | | |
| L10 lockfile / `*` deps acceptable | | |
| L8 no push / no createRelease | | |
| L9 dry-run gap acceptable with wrapper | | |

**Accept D5-b** if: L2 Pass, L5 Pass, L10 Pass (or Partial with documented flags), L1 Fail-or-Partial OK (wrapper syncs root).

**Reject D5-b → D5-a** if: L2 Fail **or** L10 Fail **or** wrapper would have to reimplement most of `lerna version` to get a safe result.

**Optional D1 tweak:** if spike shows root sync + `lerna.json` as twin stamps is awkward, reopen D1 (D1-b = `lerna.json` SoT) in analysis — do not silently change D1 during the spike; note recommendation only.

---

## 8. Write-back (required before deleting the branch)

1. Append a short **“D5 spike results (YYYY-MM-DD)”** subsection under analysis §4 D5 (or keep `spike-results.md` and link it).
2. Set D5 status to **Accepted — D5-b** or **Accepted — D5-a** with the matrix above.
3. Update analysis §8 open questions (D5, `lerna.json` role) accordingly.
4. Delete local spike tag + branch (§1 cleanup). **Do not push.**

---

## 9. Explicit non-goals for this spike

- Implementing `scripts/release_tag.py`
- Updating `docs/contributing/release-process.md` beyond a one-line “spike pending/done”
- Changing package `"private"` flags (L7 hygiene)
- Producing #224 artefacts
- Creating a GitHub Release or pushing tags

---

## 10. Suggested agent / human checklist (copy-paste)

- [ ] Create `spike/223-d5-lerna-version`
- [ ] Record baseline versions (§2)
- [ ] Add spike-only `lerna.json` `command.version` (§3)
- [ ] Run scoped `lerna version 0.0.0-spike.223 …` (§5)
- [ ] Fill §6 inspection (B+, internals, root, tag, lockfile)
- [ ] Fill §7 decision matrix
- [ ] Write back into `analysis.md`
- [ ] Delete local tag + spike branch
