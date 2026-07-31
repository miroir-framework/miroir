# Lerna release producer

`release_version.py` is the CI/local release producer for issue #227. It is
independent of other release scripts.

It asks Lerna for packages changed since a release ref, applies human
force/disable overrides, expands the selected runtime/peer dependency closure,
and uses Lerna to produce concrete internal dependency ranges for the release.

Run `--apply` only from a disposable, clean release worktree. It intentionally
rewrites manifests and the lockfile. The current GitHub Actions build workflows
do not yet invoke this producer and some regenerate their lockfile, so they are
not release validation until wired to this same entrypoint.

## Plan a release

```bash
python ci/release/release_version.py \
  --bump minor \
  --since 0.5.0-rc.1
```

The default is a no-mutation JSON plan. Add `--force <workspace>` and
`--disable <workspace>` to refine Lerna's candidates.

## Apply a release

```bash
python ci/release/release_version.py \
  --bump patch \
  --since 0.5.0-rc.1 \
  --force miroir-cli \
  --apply \
  --commit --tag
```

`--push` additionally requires `--commit --tag`. Apply runs Lerna with
non-publishing options, restores unselected package manifests, regenerates the
root lockfile, and verifies the selected release closure with `npm ci`.

Run tests with:

```bash
python -m pytest ci/release/tests -v
```
