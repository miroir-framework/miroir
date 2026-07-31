# 227 — Lerna version selection spike

Date: 2026-07-31

## Encoded invocation

```bash
npx lerna version <product_version> \
  --force-publish=<selected package list> \
  --yes \
  --no-git-tag-version \
  --no-push \
  --no-changelog \
  --ignore-scripts
```

Implemented in `ci/release/release_lib/lerna_ops.py` as `apply_lerna_version`.

## Selection enforcement

Lerna fixed-mode / force-publish may consider more packages than the reviewed
closure. The producer therefore:

1. Backs up every workspace `package.json` plus root/lock/lerna files.
2. Runs the Lerna command above.
3. Restores any package **not** in the reviewed selected set.
4. Synchronizes root + `lerna.json` to the product version.
5. Regenerates the lockfile with `npm install --package-lock-only`.
6. Verifies selected packages are at the product version and unselected packages
   retain their pre-version versions.
7. Verifies runtime/peer internal dependencies are no longer `"*"` / `file:`.
8. Runs `npm ci --ignore-scripts`.

`--disable` is therefore enforced after Lerna returns, not by Lerna's
`--ignore-changes` globs.

## Layering

Runtime/peer edges define P0…Pn. Dev-only cycles are reported on the plan and
do not abort layering. A runtime cycle aborts the plan before mutation.
