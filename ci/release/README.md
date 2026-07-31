# Layered Lerna release producer (#227)

`ci/release/release_version.py` produces a **validated release tree** and
tarball layers. It is independent of `scripts/release_tag.py`.

Platform artefacts (server zip, Electron, Docker, …) are assembled by #224
from the handoff contract described in [HANDOFF.md](./HANDOFF.md).

## Release model

1. Discover packages changed since a previous tag (`lerna ls --since`).
2. Refine with `--force` / `--disable`.
3. Expand the runtime/peer dependency closure.
4. Layer the closure as P0…Pn (runtime DAG only; runtime cycles abort).
5. Version with Lerna (rewrites internal `"*"` ranges); restore unselected packages.
6. Build, `npm pack`, hash, and clean-consumer-validate each layer.
7. Emit `release-plan.json` + `release-handoff.json` for #224.

Dev-only dependency cycles are reported for build context and do **not** define
publish/build layers.

## Plan (no mutation)

```bash
python ci/release/release_version.py \
  --bump minor \
  --since 0.5.0-rc.1
```

## Apply in a disposable worktree (recommended)

```bash
python ci/release/release_version.py \
  --bump patch \
  --since 0.5.0-rc.1 \
  --apply \
  --worktree \
  --keep-worktree
```

`--skip-build` versions and rewrites ranges without packing tarballs.
`--commit --tag` (and optional `--push`) create the single product tag from the
release worktree.

## Verify a handoff for #224

```bash
python ci/release/release_version.py --verify path/to/release-handoff.json
```

## Tests

```bash
python -m pytest ci/release/tests -v
```

## Lerna version invocation (encoded)

```text
npx lerna version <product_version> \
  --force-publish=<selected,...> \
  --yes --no-git-tag-version --no-push --no-changelog --ignore-scripts
```

Unselected package manifests are restored from pre-version backups so the
reviewed closure is enforced even if Lerna considers additional packages.
