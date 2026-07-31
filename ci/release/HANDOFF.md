# Release handoff: #227 → #224

After a successful `ci/release/release_version.py --apply`, the release worktree
contains:

| Artefact | Purpose |
|---|---|
| `release-plan.json` | Full selection, layers, versions, tarball metadata |
| `release-handoff.json` | Stable contract for artefact builders (#224) |
| `release-tarballs/Pn/*.tgz` | Packed packages for each runtime layer |
| `release-tarballs/manifest.json` | Tarball paths + SHA-256 digests |
| Versioned `package.json` / `lerna.json` / `package-lock.json` | Release tree |

## Contract rules for #224

1. Consume only a worktree that has a valid `release-handoff.json`.
2. Do **not** choose package versions or rewrite dependency ranges.
3. Read the product version from `release-handoff.json` / root `package.json`.
4. Build platform artefacts (server, Electron, Docker, library JSON, …) from this
   tree after layered package build/pack validation has succeeded.
5. GitHub Release upload remains manual / HITL.

## Example consumer check

```bash
python ci/release/release_version.py --verify /path/to/release-worktree/release-handoff.json
```

## Schema (`release-handoff.json`)

```json
{
  "schemaVersion": 1,
  "issue": 227,
  "consumerIssue": 224,
  "productVersion": "0.5.0",
  "baseRef": "0.5.0-rc.1",
  "releaseWorktree": "...",
  "releasePlan": ".../release-plan.json",
  "tarballDir": ".../release-tarballs",
  "layers": [{"index": 0, "packages": ["..."]}],
  "selected": ["..."],
  "distributeable": ["..."],
  "bundleOnly": ["..."],
  "tarballs": [{"package": "...", "layer": 0, "path": "...", "sha256": "..."}]
}
```
