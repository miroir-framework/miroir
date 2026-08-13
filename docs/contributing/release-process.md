# Release Process

> **Superseded.** This page describes the original legacy tagging approach
> (`scripts/release_tag.py`), which is obsolete / on the wrong track. The current
> release producer is `ci/release/` — see [Release Process Internals](../reference/release-process.md)
> for the authoritative reference, including why it *does* use `lerna version`
> (contradicting the "never use Lerna" guidance below).

Local-first product (pre-)release tagging for the Miroir monorepo (legacy `scripts/release_tag.py` flow).  
Artefact builds are handled by the separate multi-platform artefact pipeline. GitHub Release upload stays **manual**.

## Overview

1. Tag (pre-)release packages ← `python scripts/release_tag.py` (this doc)
2. Produce artefacts (artefact pipeline)
3. Validate / test (`npm run nonreg`)
4. Publish via GitHub Release (manual, as with `0.5.0-rc.1`)

## Version numbering

- **SemVer** product version: `X.Y.Z` or pre-release `X.Y.Z-rc.N` (dot form, e.g. `0.5.0-rc.1`)
- Git tag name = that string **with no `v` prefix** (matches existing `0.5.0-rc.1`)
- Any version containing `-` is a **pre-release**; plain `X.Y.Z` is a release
- GitHub “Pre-release” checkbox is set manually when creating the GitHub Release

## Which packages get the product version

| Track product SemVer? | Packages |
|---|---|
| **Yes — root + B+** | Root `package.json`, `miroir-standalone-app-electron`, `miroir-server`, `miroir-standalone-app`, `miroir-cli`, `miroir-mcp` |
| **No** | Internals (`miroir-core`, stores, deployments, `miroir-ai`, …) stay at placeholders |

Do **not** use `lerna version` for product tags (rewrites all packages and `"*"` workspace ranges). See `code-helpers/features/223-BUILD-consistent-git-tagging/`.

## Dependency / cycle rules at tag time

- **Never** rewrite dependency range strings (keep workspace `"*"`)
- **Runtime** cycles (`dependencies` / `peerDependencies`) → tagging **aborts**
- **Dev** cycles (back-edge only in `devDependencies`) → **allowed** (may target a previous delivered version outside the workspace)
- Present graph is OK (no runtime cycles; B+ edges are acyclic)

## Tagging command

```bash
# Preflight only (no writes)
python scripts/release_tag.py --version 0.5.0-rc.2 --dry-run
# or: npm run release:tag -- --version 0.5.0-rc.2 --dry-run

# Write versions only (no git)
python scripts/release_tag.py --version 0.5.0-rc.2

# Commit + annotated tag (no push)
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag

# Optional push (explicit)
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag --push
```

Useful flags: `--allow-dirty`, `--force` (overwrite local tag only).

Commit message: `chore: release <version>`. Tag message: `release <version>`.

## Release checklist

- [ ] Working tree clean (or intentional `--allow-dirty`)
- [ ] `python scripts/release_tag.py --version <ver> --dry-run` looks correct
- [ ] Apply with `--commit --tag` (push only when ready)
- [ ] Build artefacts (artefact pipeline)
- [ ] Run `npm run nonreg` (or agreed subset)
- [ ] Create GitHub Release **manually**; mark Pre-release if version has `-`
- [ ] Attach artefacts; do not rely on automated `gh release create` yet

## Publishing steps (GitHub)

Manual for now (same spirit as `0.5.0-rc.1`):

1. Ensure the git tag exists on the remote (`git push` / `git push --tags` if you used `--push`, or push separately)
2. Open GitHub → Releases → Draft a new release from the tag
3. Title ≈ tag name; mark Pre-release when applicable
4. Upload artefacts produced by the artefact pipeline

## Post-release

- Confirm tag and assets on the GitHub Release page
- Bump mainline back to normal development (no automatic post-tag chore in v1)

## Non-goals (this round)

- Automated GitHub Release creation
- Lerna-driven product versioning
- Per-artefact independent SemVer channels
