# Layered Lerna release producer (#227)

`ci/release/release_version.py` produces a **validated release tree** and
tarball layers. It is independent of `scripts/release_tag.py`.

Platform artefacts (server zip, Electron, Docker, …) are assembled by #224
from the handoff contract described in [HANDOFF.md](./HANDOFF.md).

## Release model

1. Discover packages changed since a previous tag (`lerna ls --since`), and add the whole published set
   (`scripts/published-packages.json`, #664).
2. Refine with `--force` / `--disable` (a package of the published set cannot be disabled).
3. Expand the runtime/peer dependency closure.
4. Layer the closure as P0…Pn (runtime DAG only; runtime cycles abort).
5. Version with Lerna (rewrites internal `"*"` ranges); restore unselected packages.
6. Build, `npm pack`, hash, check each published tarball (`npm publish --dry-run`, version free on the registry),
   clean-consumer-validate each layer, run the generated-project consumer test (#658).
7. Emit `release-plan.json` + `release-handoff.json` (for #224 and for publishing) + `publish-commands.sh`.
8. Publish with `publish.py` (#664), then `--record` pushes the tag and `release/<version>`.

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

`--version 0.5.0-rc.2` names the product version exactly (instead of `--bump`).
`--skip-build` versions and rewrites ranges without packing tarballs.
`--commit --tag` create the release commit (never the tarballs) and the single product tag in the release worktree.

## Publish (#664)

Normally from GitHub: **Actions → Publish to npm → Run workflow**, with the version (`0.5.0-rc.2`), the previous
tag, and `publish` ticked. Unticked (the default), the run does everything with `npm publish --dry-run`. It
publishes with provenance, the 12 `@miroir-framework/*` packages in layer order, a prerelease under the `next`
dist-tag, then pushes the tag and a `release/<version>` branch to merge into `_integration` with a PR.

Credentials, once: an `NPM_TOKEN` repository secret (npm granular token, publish rights on `@miroir-framework`)
for the first publish; then, on npmjs.org, add a trusted publisher to each package (repository
`miroir-framework/miroir`, workflow `publish-npm.yml`, environment `npm-publish`) and delete the secret. Add
required reviewers to the `npm-publish` environment to get an approval step before each publish.

Without CI (no provenance):

```bash
python ci/release/release_version.py --version 0.5.0-rc.2 --since 0.5.0-rc.1 \
  --apply --worktree --keep-worktree --commit --tag
npm login
python ci/release/publish.py --handoff <worktree>/release-handoff.json          # dry run
python ci/release/publish.py --handoff <worktree>/release-handoff.json --yes    # or: <worktree>/publish-commands.sh
python ci/release/release_version.py --record <worktree>/release-handoff.json
```

`publish.py` skips a version already published with the same tarball (a rerun after a failure resumes) and stops
when that version holds other content. After a partial publish in CI, release the next version.

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
